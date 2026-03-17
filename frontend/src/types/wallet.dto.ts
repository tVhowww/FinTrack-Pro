import { z } from "zod";

export enum WalletType {
  BASIC = "BASIC",
  SAVING = "SAVING",
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: WalletType;
  targetAmount?: number;
  deadline?: string;
  percentage?: number;
}

// Dùng superRefine để Validate chéo: Nếu chọn SAVING thì bắt buộc nhập 2 cái kia
export const WalletSchema = z
  .object({
    name: z
      .string()
      .min(1, "Vui lòng nhập tên ví")
      .max(50, "Tên ví tối đa 50 ký tự"),
    balance: z.coerce.number().min(0, "Số dư không được âm"),
    currency: z.string().default("VND"),
    type: z.nativeEnum(WalletType).default(WalletType.BASIC),
    targetAmount: z.coerce.number().optional(),
    deadline: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === WalletType.SAVING) {
      if (!data.targetAmount || data.targetAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng nhập số tiền mục tiêu",
          path: ["targetAmount"],
        });
      }
      if (!data.deadline) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng chọn hạn chót",
          path: ["deadline"],
        });
      }
    }
  });

export type WalletFormValues = z.infer<typeof WalletSchema>;
