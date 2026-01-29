import http from "@/lib/http";
import { ApiResponse } from "@/types/api";
import { PageResponse } from "@/types/common";
import {
  TransactionQueryParams,
  TransactionResponse,
} from "@/types/transaction.dto";

const BASE_URL = "/transaction/transactions";

export const transactionService = {
  // Chỉ cần hàm này để check giao dịch liên quan
  getTransactions: async (params?: TransactionQueryParams) => {
    const response = await http.get<
      ApiResponse<PageResponse<TransactionResponse>>
    >(BASE_URL, { params });
    return response.data.result;
  },
};
