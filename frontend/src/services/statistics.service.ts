import http from "@/lib/http";
import { ApiResponse } from "@/types/api"; // 👈 Import ApiResponse (file bạn đã có)
import {
  BalanceTrend,
  ExpenseStructure,
  MonthlyStatistics,
} from "@/types/statistics.dto";
import { TransactionResponse } from "@/types/transaction.dto";

const BASE_URL = "/transaction/transactions/statistics";

export const statisticsService = {
  // 1. Biểu đồ cột (Trend)
  getTrend: async (walletId?: string) => {
    const params: any = {};
    if (walletId && walletId !== "all") params.walletId = walletId;

    const response = await http.get<ApiResponse<BalanceTrend[]>>(
      `${BASE_URL}/trend`,
      {
        params,
      },
    );

    // Kết quả trả về sẽ tự động được hiểu là BalanceTrend[]
    return response.data?.result || [];
  },

  // 2. Biểu đồ tròn (Structure)
  getStructure: async (month: number, year: number, walletId?: string) => {
    const params: any = { month, year };
    if (walletId && walletId !== "all") params.walletId = walletId;

    const response = await http.get<ApiResponse<ExpenseStructure[]>>(
      `${BASE_URL}/structure`,
      {
        params,
      },
    );

    return response.data?.result || [];
  },

  // 3. Thống kê tháng (Cards)
  getMonthlyStats: async (month: number, year: number, walletId?: string) => {
    const params: any = { month, year };
    if (walletId && walletId !== "all") params.walletId = walletId;

    const response = await http.get<ApiResponse<MonthlyStatistics>>(
      `${BASE_URL}/monthly`,
      {
        params,
      },
    );

    // Lưu ý: MonthlyStatistics là object đơn, không phải mảng
    return response.data?.result || null;
  },

  // 4. Top chi tiêu (Highest Expenses)
  getHighestExpenses: async (
    month: number,
    year: number,
    walletId?: string,
  ) => {
    const params: any = { month, year };
    if (walletId && walletId !== "all") params.walletId = walletId;

    const response = await http.get<ApiResponse<TransactionResponse[]>>(
      `${BASE_URL}/highest-expenses`,
      {
        params,
      },
    );

    return response.data?.result || [];
  },

  getTotalBalance: async () => {
    const response = await http.get<ApiResponse<number>>(
      `${BASE_URL}/total-balance`,
    );
    return response.data?.result || 0;
  },
};
