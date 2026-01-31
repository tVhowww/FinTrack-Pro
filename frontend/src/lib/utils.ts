import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null) {
  if (amount === undefined || amount === null) return "0 ₫";

  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(value)) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0, // Tiền Việt không dùng số lẻ thập phân
  }).format(value);
}

export function generatePagination(currentPage: number, totalPages: number) {
  // Nếu tổng số trang ít (<= 7), hiện tất cả
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Nếu đang ở mấy trang đầu (1, 2, 3)
  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  // Nếu đang ở mấy trang cuối
  if (currentPage >= totalPages - 2) {
    return [
      1,
      "...",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Nếu đang ở giữa
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}
