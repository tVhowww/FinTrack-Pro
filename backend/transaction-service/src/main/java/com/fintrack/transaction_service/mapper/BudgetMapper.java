package com.fintrack.transaction_service.mapper;

import com.fintrack.transaction_service.dto.request.BudgetCreationRequest;
import com.fintrack.transaction_service.dto.response.BudgetResponse;
import com.fintrack.transaction_service.entity.Budget;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BudgetMapper {
    Budget toBudget(BudgetCreationRequest request);
}
