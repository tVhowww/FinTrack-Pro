import { Category } from "./category.dto";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export interface TransactionResponse {
  id: string;
  amount: number;
  type: TransactionType;
  walletId: string;
  categoryId: string;
  categoryName?: string;
  category: Category | null;
  note?: string;
  date: string;
  createdAt: string;
}

// Form cập nhật
export interface TransactionUpdateRequest {
  amount: number;
  categoryId?: string;
  note?: string;
  date: Date;
}

// Form tạo mới
export interface TransactionCreationRequest {
  amount: number;
  type: TransactionType;
  walletId: string;
  categoryId?: string;
  note?: string;
  date: Date;
}

export interface TransactionQueryParams {
  page?: number;
  size?: number;
  walletId?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  keyword?: string;
}

export interface AiReceiptResponse {
  amount: number;
  date: string;
  note: string;
  categoryId: string | null;
  currency?: string;
  type?: string;
}
