package com.fintrack.wallet_service.mapper;

import com.fintrack.wallet_service.dto.request.WalletCreationRequest;
import com.fintrack.wallet_service.dto.response.WalletResponse;
import com.fintrack.wallet_service.entity.Wallet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface WalletMapper {
    Wallet toWallet(WalletCreationRequest request);

    WalletResponse toWalletResponse(Wallet wallet);
}
