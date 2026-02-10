import http from "@/lib/http";
import { ApiResponse } from "@/types/api";
import { PageResponse } from "@/types/common";
import {
  TransactionCreationRequest,
  TransactionQueryParams,
  TransactionResponse,
  TransactionUpdateRequest,
} from "@/types/transaction.dto";

const BASE_URL = "/transaction/transactions";

export const transactionService = {
  getRecent: async (walletId?: string) => {
    const params: any = { page: 1, size: 5 }; // Lấy 5 cái mới nhất
    if (walletId && walletId !== "all") params.walletId = walletId;

    // Gọi API getTransactions đã có sẵn
    const response = await http.get<
      ApiResponse<PageResponse<TransactionResponse>>
    >(BASE_URL, { params });
    return response.data?.result?.data || [];
  },

  // Lấy danh sách (Có phân trang & Filter)
  getTransactions: async (params?: TransactionQueryParams) => {
    const response = await http.get<
      ApiResponse<PageResponse<TransactionResponse>>
    >(BASE_URL, { params });
    return response.data.result;
  },

  // Lấy chi tiết 1 giao dịch
  getTransaction: async (id: string) => {
    const response = await http.get<ApiResponse<TransactionResponse>>(
      `${BASE_URL}/${id}`,
    );
    return response.data.result;
  },

  // Tạo mới
  create: async (data: TransactionCreationRequest) => {
    const response = await http.post<ApiResponse<TransactionResponse>>(
      BASE_URL,
      data,
    );
    return response.data.result;
  },

  // Cập nhật
  update: async (id: string, data: TransactionUpdateRequest) => {
    const response = await http.put<ApiResponse<TransactionResponse>>(
      `${BASE_URL}/${id}`,
      data,
    );
    return response.data.result;
  },

  // Xóa
  delete: async (id: string) => {
    const response = await http.delete<ApiResponse<string>>(
      `${BASE_URL}/${id}`,
    );
    return response.data;
  },
};
