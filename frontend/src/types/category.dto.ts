export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  description?: string;
  userId?: string; // Nếu null là System category
  parentId?: string;
  subCategories?: Category[]; // Đệ quy
}

export interface CategoryCreationRequest {
  name: string;
  type: TransactionType;
  description?: string;
  parentId?: string | null;
}

// Schema validate form
import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống"),
  type: z.nativeEnum(TransactionType),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof CategorySchema>;