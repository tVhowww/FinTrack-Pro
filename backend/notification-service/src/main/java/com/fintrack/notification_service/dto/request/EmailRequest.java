package com.fintrack.notification_service.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequest {
    private To to; // Người nhận
    private String subject; // Tiêu đề
    private String htmlContent; // Nội dung (HTML)

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class To {
        private String email; // Địa chỉ email người nhận
        private String name;  // Tên người nhận (Optional)
    }
}
