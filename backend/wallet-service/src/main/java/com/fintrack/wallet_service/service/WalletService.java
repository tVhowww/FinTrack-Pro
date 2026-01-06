package com.fintrack.wallet_service.service;

import com.fintrack.wallet_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.request.WalletUpdateRequest;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    private final WalletMapper walletMapper;

    @Transactional // đảm bảo tính nhất quán
    public WalletResponse updateBalance(String walletId,  WalletBalanceUpdateRequest request) {
        // 1. Tìm ví
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // 2. Tính toán số dư
        BigDecimal newBalance = wallet.getBalance().add(request.getAmount());

        // 3. Kiểm tra nếu số dư âm
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }

        // 4. Cập nhật số dư và lưu
        wallet.setBalance(newBalance);
        return walletMapper.toWalletResponse(walletRepository.save(wallet));

    }

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

    public List<WalletResponse> getMyWallets() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getClaimAsString("userId");

        var wallets = walletRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);

        return wallets.stream()
                .map(walletMapper::toWalletResponse)
                .toList();
    }

    public WalletResponse update(String id, WalletUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getClaimAsString("userId");

        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        wallet.setName(request.getName());
        if (request.getCurrency() != null) {
            wallet.setCurrency(request.getCurrency());
        }

        return walletMapper.toWalletResponse(walletRepository.save(wallet));
    }

    public void delete(String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getClaimAsString("userId");

        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // Soft Delete
        wallet.setActive(false);
        walletRepository.save(wallet);
    }
}
