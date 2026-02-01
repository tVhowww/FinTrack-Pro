export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  categoryName: string;
  month: number;
  year: number;
}

// Dữ liệu giả để Demo UI
export const MOCK_BUDGETS: Budget[] = [
  {
    id: "1",
    name: "Ăn uống & Cafe",
    amount: 5000000,
    spent: 3200000, // ~64% (An toàn)
    categoryName: "Ăn uống",
    month: 2,
    year: 2026,
  },
  {
    id: "2",
    name: "Xăng xe đi lại",
    amount: 1000000,
    spent: 850000, // 85% (Cảnh báo - Vàng)
    categoryName: "Di chuyển",
    month: 2,
    year: 2026,
  },
  {
    id: "3",
    name: "Shopping Tết",
    amount: 3000000,
    spent: 4500000, // 150% (Vượt mức - Đỏ)
    categoryName: "Mua sắm",
    month: 1, // Tháng cũ
    year: 2026,
  },
];
