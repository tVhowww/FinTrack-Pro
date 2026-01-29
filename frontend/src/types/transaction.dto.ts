export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

// Chỉ cần những thông tin cơ bản để hiện lên list preview
export interface TransactionResponse {
  id: string;
  amount: number;
  type: TransactionType;
  note?: string; // Để hiện tên giao dịch (Ví dụ: "Ăn sáng")
  date: string;
}

// Params để lọc (chủ yếu dùng categoryId)
export interface TransactionQueryParams {
  page?: number;
  size?: number;
  categoryId?: string; 
}