package com.fintrack.transaction_service.service;

import com.fintrack.transaction_service.dto.request.FundAddRequest;
import com.fintrack.transaction_service.dto.request.SavingGoalRequest;
import com.fintrack.transaction_service.dto.response.SavingGoalResponse;
import com.fintrack.transaction_service.entity.SavingGoal;
import com.fintrack.transaction_service.enums.SavingGoalStatus;
import com.fintrack.transaction_service.exception.AppException;
import com.fintrack.transaction_service.exception.ErrorCode;
import com.fintrack.transaction_service.repository.SavingGoalRepository;
import com.fintrack.transaction_service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingGoalService {

    private final SavingGoalRepository savingGoalRepository;

    public List<SavingGoalResponse> getMyGoals() {
        String userId = SecurityUtils.getCurrentUserId();
        return savingGoalRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public SavingGoalResponse createGoal(SavingGoalRequest request) {
        String userId = SecurityUtils.getCurrentUserId();

        SavingGoal goal = SavingGoal.builder()
                .userId(userId)
                .name(request.name())
                .targetAmount(request.targetAmount())
                .currency(request.currency() != null ? request.currency() : "VND")
                .deadline(request.deadline())
                .build();

        return mapToResponse(savingGoalRepository.save(goal));
    }

    @Transactional
    public SavingGoalResponse updateGoal(String id, SavingGoalRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục tiêu tiết kiệm"));

        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setDeadline(request.deadline());

        // Tính toán lại status lỡ user giảm targetAmount xuống thấp hơn currentAmount
        checkAndCompleteGoal(goal);

        return mapToResponse(savingGoalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(String id) {
        String userId = SecurityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục tiêu tiết kiệm"));
        savingGoalRepository.delete(goal);
    }

    @Transactional
    public SavingGoalResponse addFund(String id, FundAddRequest request) {
        String userId = SecurityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mục tiêu tiết kiệm"));

        if (goal.getStatus() == SavingGoalStatus.COMPLETED) {
            throw new RuntimeException("Mục tiêu này đã hoàn thành rồi, sếp không cần nạp thêm đâu!");
        }

        // Cộng dồn tiền
        goal.setCurrentAmount(goal.getCurrentAmount().add(request.amount()));

        // Kiểm tra xem đã đủ tiền mua iPhone chưa
        checkAndCompleteGoal(goal);

        return mapToResponse(savingGoalRepository.save(goal));
    }

    // --- Helper Methods ---
    private void checkAndCompleteGoal(SavingGoal goal) {
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(SavingGoalStatus.COMPLETED);
        } else {
            goal.setStatus(SavingGoalStatus.IN_PROGRESS);
        }
    }

    private SavingGoalResponse mapToResponse(SavingGoal goal) {
        double percentage = 0.0;
        if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            percentage = goal.getCurrentAmount()
                    .divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100;
        }
        // Đảm bảo % không vượt quá 100% trên giao diện
        percentage = Math.min(percentage, 100.0);

        return SavingGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .currency(goal.getCurrency())
                .deadline(goal.getDeadline())
                .status(goal.getStatus())
                .percentage(percentage)
                .build();
    }
}