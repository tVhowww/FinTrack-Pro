import http from "@/lib/http";
import { ApiResponse } from "@/types/auth.dto";
import { Wallet, WalletFormValues } from "@/types/wallet.dto";

export const walletService = {
  // GET /wallet/wallets
  getAll: async () => {
    const response = await http.get<ApiResponse<Wallet[]>>("/wallet/wallets");
    return response.data;
  },

  // POST /wallet/wallets
  create: async (data: WalletFormValues) => {
    const response = await http.post<ApiResponse<Wallet>>(
      "/wallet/wallets",
      data,
    );
    return response.data;
  },

  // PUT /wallet/wallets/{id}
  update: async (id: string, data: WalletFormValues) => {
    const response = await http.put<ApiResponse<Wallet>>(
      `/wallet/wallets/${id}`,
      data,
    );
    return response.data;
  },

  adjustBalance: async ({
    id,
    newBalance,
  }: {
    id: string;
    newBalance: number;
  }) => {
    const response = await http.put<ApiResponse<Wallet>>(
      `/wallet/wallets/${id}/adjust-balance`,
      {
        newBalance,
      },
    );
    return response.data;
  },

  // DELETE /wallet/wallets/{id}
  delete: async (id: string) => {
    const response = await http.delete<ApiResponse<string>>(
      `/wallet/wallets/${id}`,
    );
    return response.data;
  },
};
