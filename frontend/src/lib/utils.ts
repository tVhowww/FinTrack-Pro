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
