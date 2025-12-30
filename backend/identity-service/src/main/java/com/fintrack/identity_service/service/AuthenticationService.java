package com.fintrack.identity_service.service;

import com.fintrack.identity_service.dto.request.AuthenticationRequest;
import com.fintrack.identity_service.dto.request.IntrospectRequest;
import com.fintrack.identity_service.dto.response.AuthenticationResponse;
import com.fintrack.identity_service.dto.response.IntrospectResponse;
import com.fintrack.identity_service.exception.AppException;
import com.fintrack.identity_service.exception.ErrorCode;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    public IntrospectResponse introspect(IntrospectRequest request) {
        var token = request.getToken();
        boolean isValid = true;

        try {
            // Check null Key ngay lập tức
            if (SIGNER_KEY == null || SIGNER_KEY.isEmpty()) {
                throw new RuntimeException("CRITICAL: SIGNER_KEY is null! Check application.yml");
            }

            log.info("Checking token: {}", token); // In token ra xem có nhận được không

            // 1. Parse token xem có đúng định dạng JWT không
            JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 2. Kiểm tra chữ ký (có bị sửa đổi không)
            // và kiểm tra thời gian hết hạn (exp claim)
            Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

            var verified = signedJWT.verify(verifier);

            // Log kết quả verify
            log.info("Verified: {}, Expiry: {}", verified, expiryTime);

            // Token chỉ hợp lệ khi: Chữ ký đúng VÀ Chưa hết hạn
            if (!(verified && expiryTime.after(new Date()))) {
                isValid = false;
            }

        } catch (Exception e) {
            log.error("Introspect Failed: ", e);
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // 1. Tìm user theo username
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Khớp mật khẩu (Pass chưa hash của người dùng vs Pass đã hash trong DB)
        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 3. Nếu đúng, tạo Token
        var token = generateToken(request.getUsername());

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }

    private String generateToken(String username) {
        // Tạo Header (Thuật toán mã hóa là HS512)
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        // Tạo Body (Claims - Nội dung bên trong token)
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(username)
                .issuer("fintrack.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli() // hết hạn sau 1 giờ
                ))
                .claim("userId", "CustomClainExample") // Bạn có thể nhét thêm field tùy ý
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
}
