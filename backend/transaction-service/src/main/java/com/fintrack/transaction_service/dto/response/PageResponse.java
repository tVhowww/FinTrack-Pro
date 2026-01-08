package com.fintrack.transaction_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.Collections;
import java.util.List;

@Data
@Builder
public class PageResponse<T> {
    private int currentPage;
    private int totalPages;
    private int pageSize;
    private long totalElements;
    @Builder.Default
    private List<T> data = Collections.emptyList();
}