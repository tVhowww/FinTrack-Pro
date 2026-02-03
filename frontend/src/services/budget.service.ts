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
    // Nếu walletId là "all" hoặc rỗng, ta bỏ qua param đó để BE hiểu là lấy Global + All
    const queryParams: any = {
      month: params.month,
      year: params.year,
    };

    if (params.walletId && params.walletId !== "all") {
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
