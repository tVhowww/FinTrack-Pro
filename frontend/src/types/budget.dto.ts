export type BudgetStatus = "ACTIVE" | "EXCEEDED" | "EXPIRED" | "UPCOMING";

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spentAmount: number; // Backend trả về
  percentage: number; // Backend trả về
  walletId?: string | null; // Có thể null nếu là Global Budget
  walletName?: string;
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  status: BudgetStatus;
}

export interface BudgetCreationRequest {
  name: string;
  amount: number;
  walletId?: string | null; // Nullable
  categoryId: string;
  month: number;
  year: number;
}

export interface BudgetUpdateRequest {
  name: string;
  amount: number;
}

export interface BudgetResponse {
  id: string;
  name: string;
  amount: number;
  spentAmount: number; // Backend trả về
  percentage: number; // Backend trả về
  walletId?: string | null; // Có thể null nếu là Global Budget
  walletName?: string;
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
  status: BudgetStatus;
}
