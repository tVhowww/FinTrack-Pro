package com.fintrack.api_gateway.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Nếu field nào null thì bỏ qua, không trả về json
public class ApiResponse<T> {
    @Builder.Default
    private int code = 1000; // Mặc định là thành công

    private String message;

    private T result;
}
