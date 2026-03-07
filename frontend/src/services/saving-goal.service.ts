import http from "@/lib/http";
import { ApiResponse } from "@/types/api";
import {
  FundAddRequest,
  SavingGoal,
  SavingGoalRequest,
} from "@/types/saving-goal.dto";

const BASE_URL = "/transaction/saving-goals";

export const savingGoalService = {
  // Lấy danh sách
  getAll: async () => {
    const response = await http.get<ApiResponse<SavingGoal[]>>(BASE_URL);
    return response.data?.result || [];
  },

  // Tạo mới
  create: async (data: SavingGoalRequest) => {
    const response = await http.post<ApiResponse<SavingGoal>>(BASE_URL, data);
    return response.data.result;
  },

  // Cập nhật
  update: async (id: string, data: SavingGoalRequest) => {
    const response = await http.put<ApiResponse<SavingGoal>>(
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

  // Nạp tiền vào quỹ
  addFund: async (id: string, data: FundAddRequest) => {
    const response = await http.post<ApiResponse<SavingGoal>>(
      `${BASE_URL}/${id}/add-fund`,
      data,
    );
    return response.data.result;
  },
};
