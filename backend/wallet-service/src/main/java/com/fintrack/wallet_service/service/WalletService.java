package com.fintrack.wallet_service.service;

import com.fintrack.wallet_service.dto.request.WalletBalanceAdjustmentRequest;
import com.fintrack.wallet_service.dto.request.WalletBalanceUpdateRequest;
import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.request.WalletUpdateRequest;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.entity.Wallet;
import com.fintrack.wallet_service.enums.TransactionType;
import com.fintrack.wallet_service.exception.AppException;
import com.fintrack.wallet_service.exception.ErrorCode;
import com.fintrack.wallet_service.mapper.WalletMapper;
import com.fintrack.wallet_service.repository.WalletRepository;
import com.fintrack.wallet_service.repository.httpclient.TransactionClient;
import com.fintrack.wallet_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {
    private final WalletRepository walletRepository;
    private final WalletMapper walletMapper;
    private final TransactionClient transactionClient;
    private final StringRedisTemplate redisTemplate;

    /**
     * Điều chỉnh số dư ví thủ công
     * Flow:
     * 1. Cập nhật số dư ví
     * 2. Tạo transaction lịch sử ở transaction-service
     *
     * Lưu ý: Nếu step 2 lỗi, step 1 sẽ được rollback
     */
    @Transactional
    public WalletResponse adjustBalance(String walletId, WalletBalanceAdjustmentRequest request) {
        // 1. Lấy ví hiện tại
        String userId = SecurityUtils.getCurrentUserId();

        Wallet wallet = walletRepository.findByIdAndUserId(walletId, userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        BigDecimal currentBalance = wallet.getBalance();
        BigDecimal newBalance = request.getNewBalance();

        // 2. Nếu số dư không đổi thì return luôn
        if (currentBalance.compareTo(newBalance) == 0) {
            return walletMapper.toWalletResponse(wallet);
        }

        // 3. Tính chênh lệch (Diff)
        BigDecimal diff = newBalance.subtract(currentBalance);

        // Xác định loại giao dịch và số tiền dương
        TransactionType type;
        BigDecimal absAmount = diff.abs();

        if (diff.compareTo(BigDecimal.ZERO) > 0) {
            type = TransactionType.INCOME; // Tăng tiền
        } else {
            type = TransactionType.EXPENSE; // Giảm tiền
        }

        // 4. Cập nhật số dư ví TRƯỚC
        wallet.setBalance(newBalance);
        wallet = walletRepository.save(wallet);

        // 5. Gọi Transaction Service để lưu lịch sử
        // Nếu bước này lỗi -> @Transactional sẽ rollback việc cập nhật ví
        var transactionRequest = com.fintrack.wallet_service.dto.request.TransactionCreationRequest.builder()
                .walletId(walletId)
                .amount(absAmount)
                .type(type)
                .note(request.getNote() != null ? request.getNote() : "Điều chỉnh số dư thủ công")
                .date(java.time.Instant.now())
                .build();

        try {
            transactionClient.createAdjustment(transactionRequest);
        } catch (Exception e) {
            log.error("Lỗi khi tạo adjustment transaction: {}", e.getMessage(), e);
            // Throw lại exception để trigger rollback
            throw new AppException(ErrorCode.TRANSACTION_SERVICE_ERROR);
        }

        return walletMapper.toWalletResponse(wallet);
    }

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
        String userId = SecurityUtils.getCurrentUserId();

        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String lockKey = "lock:create_wallet:" + userId;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", 3, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(acquired)) {
            log.warn("Double-Click chặn đứng! User {} đang tạo Wallet.", userId);
            throw new AppException(ErrorCode.REQUEST_PROCESSING);
        }

        // 2. Check trùng tên ví (Optional)
        if (walletRepository.existsByNameIgnoreCaseAndUserIdAndIsActive(request.getName(), userId, true)) {
            throw new AppException(ErrorCode.WALLET_EXISTED);
        }

        // 3. Map & Save
        Wallet wallet = walletMapper.toWallet(request);
        wallet.setUserId(userId);

        return walletMapper.toWalletResponse(walletRepository.save(wallet));
    }

    public List<WalletResponse> getMyWallets() {
        String userId = SecurityUtils.getCurrentUserId();

        var wallets = walletRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);

        return wallets.stream()
                .map(walletMapper::toWalletResponse)
                .toList();
    }

    public WalletResponse update(String id, WalletUpdateRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // 1. Chỉ kiểm tra khi tên thay đổi
        String newName = request.getName().trim();
        if (!wallet.getName().equalsIgnoreCase(newName)) {
            boolean isDuplicate = walletRepository.existsByNameIgnoreCaseAndUserIdAndIdNotAndIsActive(
                    newName,
                    userId,
                    id,
                    true
            );

            if (isDuplicate) {
                throw new AppException(ErrorCode.WALLET_EXISTED);
            }

            wallet.setName(newName); // Lưu tên mới đã trim
        }

        // 2. Logic kiểm tra Currency (Nâng cao)
        if (request.getCurrency() != null && !request.getCurrency().equals(wallet.getCurrency())) {
            // Nếu người dùng cố tình đổi đơn vị tiền tệ khác với đơn vị hiện tại

            // Gọi sang Transaction Service để kiểm tra
            long transactionCount = transactionClient.countByWallet(id);

            if (transactionCount > 0) {
                throw new AppException(ErrorCode.WALLET_HAS_TRANSACTIONS);
            }

            // Nếu chưa có giao dịch (ví mới tạo) -> CHO PHÉP ĐỔI
            wallet.setCurrency(request.getCurrency());
        }

        return walletMapper.toWalletResponse(walletRepository.save(wallet));
    }

    public void delete(String id) {
        String userId = SecurityUtils.getCurrentUserId();

        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // Soft Delete
        wallet.setActive(false);
        walletRepository.save(wallet);
    }

    public WalletResponse getWallet(String id) {
        String userId = SecurityUtils.getCurrentUserId();

        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new AppException(ErrorCode.WALLET_NOT_FOUND));

        // Quan trọng: Mapper phải map được cả userId để Transaction Service check quyền
        return walletMapper.toWalletResponse(wallet);
    }
}
