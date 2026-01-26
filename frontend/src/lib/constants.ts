export const CURRENCIES = [
  { code: "VND", name: "Việt Nam Đồng", symbol: "₫", locale: "vi-VN" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "KRW", name: "Korean Won", symbol: "₩", locale: "ko-KR" },
  // Thêm các loại tiền khác nếu cần
] as const;

// Helper function để lấy symbol nhanh (dùng cho hiển thị)
export const getCurrencySymbol = (code: string) => {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code;
};
