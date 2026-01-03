package com.fintrack.wallet_service.service;

import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.entity.Wallet;
import com.fintrack.wallet_service.exception.AppException;
import com.fintrack.wallet_service.exception.ErrorCode;
import com.fintrack.wallet_service.mapper.WalletMapper;
import com.fintrack.wallet_service.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    private final WalletMapper walletMapper;

    public WalletResponse create(WalletCreationRequest request) {
        // 1. Lấy userId từ Token (Claim "userId" mà Identity Service đã bỏ vào)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getClaimAsString("userId"); // <--- Magic is here

        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 2. Check trùng tên ví (Optional)
        if (walletRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new AppException(ErrorCode.WALLET_EXISTED);
        }

        // 3. Map & Save
        Wallet wallet = walletMapper.toWallet(request);
        wallet.setUserId(userId);

        return walletMapper.toWalletResponse(walletRepository.save(wallet));
    }
}
