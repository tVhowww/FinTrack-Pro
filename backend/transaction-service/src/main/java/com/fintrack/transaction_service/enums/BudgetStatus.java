package com.fintrack.transaction_service.enums;

public enum BudgetStatus {
    ACTIVE,     // Đang hoạt động, còn trong hạn mức
    EXCEEDED,   // Vượt hạn mức (Xài lố)
    EXPIRED,    // Đã qua tháng đó (Hết hạn)
    UPCOMING    // Ngân sách được lập cho tương lai
}