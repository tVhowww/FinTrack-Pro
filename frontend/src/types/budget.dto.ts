export interface Budget {
  id: string;
  name: string;
  amount: number;
  spentAmount: number; // Backend trả về
  percentage: number; // Backend trả về
  walletId?: string | null; // Có thể null nếu là Global Budget
  categoryId: string;
  categoryName: string;
  month: number;
  year: number;
}

export interface BudgetCreationRequest {
  name: string;
  amount: number;
  walletId?: string | null; // Nullable
  categoryId: string;
  month: number;
  year: number;
}
