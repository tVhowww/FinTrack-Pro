package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.AuthenticationRequest;
import com.fintrack.identity_service.dto.request.IntrospectRequest;
import com.fintrack.identity_service.dto.request.LogoutRequest;
import com.fintrack.identity_service.dto.request.RefreshTokenRequest;
import com.fintrack.identity_service.dto.response.AuthenticationResponse;
import com.fintrack.identity_service.dto.response.IntrospectResponse;
import com.fintrack.identity_service.entity.InvalidatedToken;
import com.fintrack.identity_service.entity.User;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
import com.fintrack.identity_service.repository.InvalidatedTokenRepository;
import com.fintrack.identity_service.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

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
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (user.getCurrentJwtId() != null && !user.getCurrentJwtId().equals(jit)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // Hủy token cũ (Token Rotation)
        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jit)
                .expiryTime(expiryTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

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

            // Hủy token hiện tại
            InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                    .id(jit)
                    .expiryTime(expiryTime)
                    .build();
            invalidatedTokenRepository.save(invalidatedToken);

            // [LOGIC MỚI] Xóa dấu vết trong bảng User
            var username = signToken.getJWTClaimsSet().getSubject();
            var user = userRepository.findByUsername(username).orElse(null);
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
        var user = userRepository.findByUsername(request.getUsername())
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
        // Vì ta không biết thời gian hết hạn của token cũ (do không lưu),
        // Ta set đại thời gian hết hạn là: Thời điểm hiện tại + 1 giờ (bằng thời gian sống mặc định của token)
        // Mục đích: Để Job dọn dẹp DB sau này biết đường mà xóa.
        Date estimatedExpiryTime = new Date(Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli());

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(tokenId)
                .expiryTime(estimatedExpiryTime)
                .build();

        invalidatedTokenRepository.save(invalidatedToken);
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
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        var verified = signedJWT.verify(verifier);

        // 1. Nếu token đã hết hạn hoặc chữ ký sai -> Lỗi
        // Lưu ý: Nếu là Refresh Token, ta có thể muốn cho phép refresh kể cả khi hết hạn 1 chút (Grace period).
        // Nhưng logic hiện tại cứ chặt chẽ: Hết hạn là vứt.
        if (!(verified && expiryTime.after(new Date()))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 2. Check Blacklist (Token đã logout hoặc đã refresh trước đó)
        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
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
}
