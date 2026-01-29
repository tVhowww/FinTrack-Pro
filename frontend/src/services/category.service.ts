import http from "@/lib/http";
import { ApiResponse } from "@/types/api";
import {
  Category,
  CategoryCreationRequest,
  TransactionType,
} from "@/types/category.dto";

// Base path đã sửa ở bước trước
const BASE_URL = "/transaction/categories";

export const categoryService = {
  getAll: async (type?: TransactionType) => {
    const params = type ? { type } : undefined;
    const response = await http.get<ApiResponse<Category[]>>(BASE_URL, {
      params,
    });
    return response.data.result;
  },

  create: async (data: CategoryCreationRequest) => {
    const response = await http.post<ApiResponse<Category>>(BASE_URL, data);
    return response.data.result; // Trả về result
  },

  update: async (id: string, data: CategoryCreationRequest) => {
    const response = await http.put<ApiResponse<Category>>(
      `${BASE_URL}/${id}`,
      data,
    );
    return response.data.result; // Trả về result
  },

  delete: async (id: string) => {
    await http.delete(`${BASE_URL}/${id}`);
  },
};
