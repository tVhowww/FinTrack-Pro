import http from "@/lib/http";
import { ApiResponse } from "@/types/api";
import {
  BudgetCreationRequest,
  BudgetResponse,
  BudgetUpdateRequest,
} from "@/types/budget.dto";

const BASE_URL = "/transaction/budgets";

export const budgetService = {
  // Lấy danh sách (Có filter theo tháng/năm/ví)
  getAll: async (params: {
    walletId?: string;
    month: number;
    year: number;
    keyword?: string;
  }) => {
    const queryParams: any = {
      month: params.month,
      year: params.year,
    };

    // Gửi thẳng param walletId lên (all, global, hoặc id ví)
    if (params.walletId) {
      queryParams.walletId = params.walletId;
    }
    if (params.keyword) queryParams.keyword = params.keyword;

    const response = await http.get<ApiResponse<BudgetResponse[]>>(
      `${BASE_URL}`,
      {
        params: queryParams,
      },
    );

    return response.data?.result || [];
  },

  create: async (data: BudgetCreationRequest) => {
    const response = await http.post<ApiResponse<BudgetResponse>>(
      BASE_URL,
      data,
    );
    return response.data.result;
  },

  update: async (id: string, data: BudgetUpdateRequest) => {
    const response = await http.put<ApiResponse<BudgetResponse>>(
      `${BASE_URL}/${id}`,
      data,
    );
    return response.data.result;
  },

  delete: async (id: string) => {
    const response = await http.delete<ApiResponse<string>>(
      `${BASE_URL}/${id}`,
    );
    return response.data;
  },
};
