package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.event.NotificationEvent;
import com.fintrack.identity_service.dto.request.*;
import com.fintrack.identity_service.dto.response.AuthenticationResponse;
import com.fintrack.identity_service.dto.response.IntrospectResponse;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${google.client-id:YOUR_GOOGLE_CLIENT_ID_HERE}")
    protected String GOOGLE_CLIENT_ID;

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String rateLimitKey = "rate_limit_otp:" + request.getEmail();

        // Dùng hàm setIfAbsent (Tương đương SETNX trong Redis)
        // Nếu Key chưa tồn tại -> Tạo Key, set giá trị "1", gán TTL 60s, trả về TRUE (Cho qua)
        // Nếu Key ĐÃ tồn tại (User vừa gửi xong chưa quá 60s) -> Trả về FALSE (Chặn lại)
        Boolean isAllowed = redisTemplate.opsForValue().setIfAbsent(rateLimitKey, "1", 60, TimeUnit.SECONDS);

        if (Boolean.FALSE.equals(isAllowed)) {
            // Lấy thời gian còn lại để báo cho người dùng biết phải đợi bao lâu nữa
            Long expire = redisTemplate.getExpire(rateLimitKey);
            log.warn("Spam OTP detected for email: {}. Please wait {} seconds.", request.getEmail(), expire);

            throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
        }

        // 1. Sinh mã OTP (6 số ngẫu nhiên)
        String otp = String.format("%06d", new Random().nextInt(999999));

        // 2. Lưu OTP vào Redis với Key là: reset_otp:{email}
        // Thời gian sống (TTL): Đúng 5 phút (Redis sẽ tự hủy nó sau 5 phút)
        String redisKey = "reset_otp:" + request.getEmail();
        redisTemplate.opsForValue().set(redisKey, passwordEncoder.encode(otp), 5, TimeUnit.MINUTES);

        // 3. Gửi email qua Kafka (Giữ nguyên như cũ)
        String emailBody = String.format(
                "Xin chào %s,\n\n" +
                        "Mã OTP xác nhận đặt lại mật khẩu của bạn là: %s\n" +
                        "Mã này sẽ tự động hết hạn sau 5 phút.\n",
                user.getUsername(), otp
        );

        NotificationEvent event =
                NotificationEvent.builder()
                        .channel("EMAIL")
                        .recipient(user.getEmail())
                        .subject("FinTrack - Mã xác nhận")
                        .body(emailBody)
                        .build();

        kafkaTemplate.send("notification-delivery", event);
        log.info("Đã lưu OTP vào Redis và gửi qua email: {}", user.getEmail());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // 1. Lấy OTP từ Redis lên
        String redisKey = "reset_otp:" + request.getEmail();
        String hashedOtpFromRedis = redisTemplate.opsForValue().get(redisKey);

        // Nếu get lên bằng null -> Nghĩa là Redis đã tự xóa nó (Quá 5 phút) hoặc user chưa từng request
        if (hashedOtpFromRedis == null) {
            throw new AppException(ErrorCode.OTP_EXPIRED); // Báo lỗi OTP hết hạn
        }

        // 2. So sánh mã OTP user nhập với mã hash trong Redis
        if (!passwordEncoder.matches(request.getOtp(), hashedOtpFromRedis)) {
            throw new AppException(ErrorCode.INVALID_OTP); // Báo lỗi OTP sai
        }

        // 3. OTP hợp lệ -> Cập nhật mật khẩu mới vào DB
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // Hủy session hiện tại
        if (user.getCurrentJwtId() != null) {
            invalidateToken(user.getCurrentJwtId());
            user.setCurrentJwtId(null);
        }
        userRepository.save(user);

        // 4. Xóa luôn Key trong Redis đi để mã này không xài lại được nữa
        redisTemplate.delete(redisKey);

        log.info("User {} đã đặt lại mật khẩu thành công qua Redis.", user.getEmail());
    }

    // refresh token
    @Transactional
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) throws ParseException, JOSEException {

        // 1. Kiểm tra token (Refresh token) gửi lên có hợp lệ không
        // Tham số thứ 2 là true: ý nói đây là refresh (có thể check logic khác nếu cần)
        var signedJWT = verifyToken(request.getToken(), true);

        // 2. Lấy thông tin User từ token đó (JIT)
        var jit = signedJWT.getJWTClaimsSet().getJWTID();
        var expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        // Check xem token này có phải là token hiện hành không?
        var username = signedJWT.getJWTClaimsSet().getSubject();
        var user = userRepository.findByUsernameAndDeletedFalse(username)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (user.getCurrentJwtId() != null && !user.getCurrentJwtId().equals(jit)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Hủy token cũ (Token Rotation) - Đẩy vào Redis
        long remainingTime = expiryTime.getTime() - System.currentTimeMillis();
        if (remainingTime > 0) {
            redisTemplate.opsForValue().set("jwt_blacklist:" + jit, "invalid", remainingTime, java.util.concurrent.TimeUnit.MILLISECONDS);
        }

        // Tạo phát token mới (Cả cặp Access + Refresh mới)
        var token = generateToken(user);

        // [LOGIC MỚI] Cập nhật lại ID mới nhất vào DB
        String newTokenId = getTokenIdFromToken(token);
        user.setCurrentJwtId(newTokenId);
        userRepository.save(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    // logout
    @Transactional
    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        try {
            var signToken = verifyToken(request.getToken(), true);

            // Lấy JTI (ID của token)
            String jit = signToken.getJWTClaimsSet().getJWTID();

            // Lấy thời gian hết hạn
            Date expiryTime = signToken.getJWTClaimsSet().getExpirationTime();

            // Hủy token hiện tại (Lưu vào Redis với TTL bằng thời gian sống còn lại)
            long remainingTime = expiryTime.getTime() - System.currentTimeMillis();
            if (remainingTime > 0) {
                redisTemplate.opsForValue().set("jwt_blacklist:" + jit, "invalid", remainingTime, java.util.concurrent.TimeUnit.MILLISECONDS);
            }

            // [LOGIC MỚI] Xóa dấu vết trong bảng User
            var username = signToken.getJWTClaimsSet().getSubject();
            var user = userRepository.findByUsernameAndDeletedFalse(username).orElse(null);
            if (user != null) {
                user.setCurrentJwtId(null); // Không còn phiên nào active
                userRepository.save(user);
            }
        } catch (AppException e) {
            log.info("Token already expired or invalid, no need to logout");
        }

    }

    // token introspection
    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token, false);
        } catch (Exception e) {
            log.error("Introspect Failed: ", e);
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    // login
    @Transactional
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // 1. Tìm user theo username
        var user = userRepository.findByUsernameAndDeletedFalse(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Khớp mật khẩu (Pass chưa hash của người dùng vs Pass đã hash trong DB)
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // [LOGIC MỚI] Kiểm tra xem user có đang đăng nhập ở chỗ khác không?
        if (user.getCurrentJwtId() != null) {
            // Nếu có, hủy ngay cái token cũ đó
            invalidateToken(user.getCurrentJwtId());
        }

        // Tạo token mới cho phiên đăng nhập này
        var token = generateToken(user);

        // [LOGIC MỚI] Lưu ID của token mới vào User để đánh dấu chủ quyền
        String tokenId = getTokenIdFromToken(token);
        user.setCurrentJwtId(tokenId);
        userRepository.save(user);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    // --- HELPERS ---
    private void invalidateToken(String tokenId) {
        // Nếu chỉ có ID mà không có thời gian hết hạn (trường hợp user đăng nhập chỗ khác bị đá ra)
        // Ta set TTL mặc định là 1 giờ (bằng thời gian sống tối đa của 1 token)
        String redisKey = "jwt_blacklist:" + tokenId;
        redisTemplate.opsForValue().set(redisKey, "invalid", 1, java.util.concurrent.TimeUnit.HOURS);
    }

    private String getTokenIdFromToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet().getJWTID();
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }

    private String generateToken(User user) {
        // Tạo Header (Thuật toán mã hóa là HS512)
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        // Tạo Body (Claims - Nội dung bên trong token)
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("fintrack.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli() // hết hạn sau 1 giờ
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("userId", user.getId())
                .claim("scope", buildScope(user))
                .build();

        // Tạo payload
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            // Ký tên vào token (Dùng SIGNER_KEY bí mật)
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }

    }

    // isRefresh: tham số này để dùng sau này nếu bạn làm refresh token (tạm thời chưa dùng)
    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        if (token == null || token.trim().isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        // 1. Kiểm tra chữ ký (Luôn luôn phải đúng)
        if (!verified) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 2. Kiểm tra hết hạn
        // Logic: Nếu KHÔNG phải là refresh (isRefresh == false) VÀ đã hết hạn -> Thì mới lỗi
        // Còn nếu là refresh (isRefresh == true) -> Cho phép hết hạn (miễn là chữ ký đúng)
        if (!isRefresh && expiryTime.before(new Date())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 3. Check Blacklist trên Redis
        String redisKey = "jwt_blacklist:" + signedJWT.getJWTClaimsSet().getJWTID();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");

        if (!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> {
                // 1. Thêm Role vào scope (VD: ROLE_ADMIN)
                stringJoiner.add("ROLE_" + role.getName());

                // 2. Thêm Permission vào scope (VD: USER_CREATE)
                if (!CollectionUtils.isEmpty(role.getPermissions())) {
                    role.getPermissions().forEach(permission -> {
                        stringJoiner.add(permission.getName());
                    });
                }
            });
        }
        return stringJoiner.toString();
    }

    @Transactional
    public AuthenticationResponse authenticateWithGoogle(GoogleLoginRequest request) {
        try {
            // 1. Cấu hình máy quét Token của Google
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(GOOGLE_CLIENT_ID))
                    .build();

            // 2. Kiểm tra token có chuẩn của Google không
            GoogleIdToken idToken = verifier.verify(request.getToken());
            if (idToken == null) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            // 3. Lấy thông tin User từ Google
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String googleId = payload.getSubject();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            // 4. Kiểm tra User có trong DB chưa
            User user = userRepository.findByEmailAndDeletedFalse(email).orElse(null);

            if (user == null) {
                // NẾU CHƯA CÓ: Tự động tạo tài khoản mới
                user = User.builder()
                        .username(email) // Dùng email làm username luôn
                        .email(email)
                        .fullName(name)
                        .avatar(pictureUrl)
                        .provider("GOOGLE")
                        .providerId(googleId)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Mật khẩu rác vì login qua Google
                        .build();
                user = userRepository.save(user);
                log.info("Tạo mới tài khoản qua Google: {}", email);
            } else {
                // NẾU ĐÃ CÓ: Cập nhật lại provider nếu trước đó họ đăng ký tay
                if (user.getProvider() == null || "LOCAL".equals(user.getProvider())) {
                    user.setProvider("GOOGLE");
                    user.setProviderId(googleId);
                    userRepository.save(user);
                }
            }

            // 5. Đá văng phiên đăng nhập cũ (nếu có)
            if (user.getCurrentJwtId() != null) {
                invalidateToken(user.getCurrentJwtId());
            }

            // 6. Nhả Token của hệ thống mình cho Frontend xài
            String token = generateToken(user);
            user.setCurrentJwtId(getTokenIdFromToken(token));
            userRepository.save(user);

            return AuthenticationResponse.builder()
                    .token(token)
                    .authenticated(true)
                    .build();

        } catch (Exception e) {
            log.error("Google Login failed: ", e);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
