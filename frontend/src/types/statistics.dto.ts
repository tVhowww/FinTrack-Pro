export interface BalanceTrend {
  month: number;
  year: number;
  income: number;
  expense: number;
  netSavings: number;
}

export interface ExpenseStructure {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyStatistics {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}