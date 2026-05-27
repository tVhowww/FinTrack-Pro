package com.fintrack.wallet_service.job;

import com.fintrack.wallet_service.entity.Wallet;
import com.fintrack.wallet_service.repository.WalletRepository;
import com.fintrack.wallet_service.repository.httpclient.TransactionClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletReconciliationJob {

    private final WalletRepository walletRepository;
    private final TransactionClient transactionClient;

    // Chạy lúc 2h sáng mỗi ngày
    @Scheduled(cron = "0 0 2 * * ?")
    public void runReconciliation() {
        log.info("[RECONCILIATION] Starting Wallet Balance Reconciliation Job...");
        int page = 0;
        int size = 100;
        int mismatchedCount = 0;
        int totalChecked = 0;

        while (true) {
            Page<Wallet> walletPage = walletRepository.findByIsActiveTrue(PageRequest.of(page, size));
            List<Wallet> wallets = walletPage.getContent();

            if (wallets.isEmpty()) {
                break;
            }

            List<String> walletIds = wallets.stream().map(Wallet::getId).collect(Collectors.toList());

            try {
                Map<String, BigDecimal> computedBalances = transactionClient.getNetBalancesForWallets(walletIds);

                for (Wallet wallet : wallets) {
                    BigDecimal dbBalance = wallet.getBalance() != null ? wallet.getBalance() : BigDecimal.ZERO;
                    BigDecimal computedBalance = computedBalances.getOrDefault(wallet.getId(), BigDecimal.ZERO);

                    if (dbBalance.compareTo(computedBalance) != 0) {
                        log.error("[RECONCILIATION ALERT] Wallet mismatch! ID: {}, Name: {}, UserID: {}. DB Balance: {}, Computed: {}",
                                wallet.getId(), wallet.getName(), wallet.getUserId(), dbBalance, computedBalance);
                        mismatchedCount++;
                    }
                }
            } catch (Exception e) {
                log.error("[RECONCILIATION] Error fetching computed balances from transaction-service", e);
            }

            totalChecked += wallets.size();
            page++;
        }

        log.info("[RECONCILIATION] Job finished. Checked {} wallets. Found {} mismatches.", totalChecked, mismatchedCount);
    }
}
