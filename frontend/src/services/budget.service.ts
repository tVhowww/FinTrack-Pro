import http from "@/lib/http";
import { Budget, BudgetCreationRequest } from "@/types/budget.dto";

const BASE_URL = "/transaction/budgets";

export const budgetService = {
  // Lấy danh sách (Có filter theo tháng/năm/ví)
  getAll: async (params: {
    walletId?: string;
    month: number;
    year: number;
  }) => {
    const queryParams: any = {
      month: params.month,
      year: params.year,
    };

    // Gửi thẳng param walletId lên (all, global, hoặc id ví)
    if (params.walletId) {
      queryParams.walletId = params.walletId;
    }

    const response = await http.get<any>(`${BASE_URL}`, {
      params: queryParams,
    });

    return response.data?.result || [];
  },

  create: async (data: BudgetCreationRequest) => {
    return await http.post(`${BASE_URL}`, data);
  },

  delete: async (id: string) => {
    return await http.delete(`${BASE_URL}/${id}`);
  },
};