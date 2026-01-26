import { z } from "zod";

// 1. DTO khớp với Backend (WalletResponse)
export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

// 2. Schema Validate Form (Dùng cho cả Create và Update)
export const WalletSchema = z.object({
  name: z.string().min(1, "Tên ví không được để trống"),
  balance: z.coerce.number().min(0, "Số dư không được âm"), // coerce để ép kiểu string input sang number
  currency: z.string().default("VND"),
});

export type WalletFormValues = z.infer<typeof WalletSchema>;
