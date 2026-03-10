package com.fintrack.wallet_service.mapper;

import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.entity.Wallet;
import com.fintrack.wallet_service.enums.WalletType;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Mapper(componentModel = "spring")
public interface WalletMapper {
    Wallet toWallet(WalletCreationRequest request);

    WalletResponse toWalletResponse(Wallet wallet);

    @AfterMapping
    default void calculatePercentage(Wallet wallet, @MappingTarget WalletResponse.WalletResponseBuilder builder) {
        if (wallet.getType() == WalletType.SAVING) {
            if (wallet.getTargetAmount() != null && wallet.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
                double percentage = wallet.getBalance()
                        .divide(wallet.getTargetAmount(), 4, RoundingMode.HALF_UP)
                        .doubleValue() * 100;
                builder.percentage(Math.min(percentage, 100.0));
            } else {
                builder.percentage(0.0);
            }
        } else {
            builder.percentage(null);
        }
    }
}