export const CURRENCIES = [
  { code: "VND", name: "Việt Nam Đồng", symbol: "₫", locale: "vi-VN" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "KRW", name: "Korean Won", symbol: "₩", locale: "ko-KR" },
  { code: "GBP", name: "Bảng Anh", symbol: "£", locale: "en-GB" },
  { code: "AUD", name: "Đô la Úc", symbol: "A$", locale: "en-AU" },
  { code: "CAD", name: "Đô la Canada", symbol: "C$", locale: "en-CA" },
  { code: "SGD", name: "Đô la Singapore", symbol: "S$", locale: "en-SG" },
  // Thêm các loại tiền khác nếu cần
] as const;

// Helper function để lấy symbol nhanh (dùng cho hiển thị)
export const getCurrencySymbol = (code: string) => {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code;
};

export const getCurrencyFormatConfig = (currencyCode: string = "VND") => {
  switch (currencyCode.toUpperCase()) {
    case "VND": // Việt Nam Đồng (Không có số lẻ)
      return { thousandSeparator: ".", decimalSeparator: ",", decimalScale: 0 };
    case "JPY": // Yên Nhật (Không có số lẻ)
    case "KRW": // Won Hàn Quốc (Không có số lẻ)
      return { thousandSeparator: ",", decimalSeparator: ".", decimalScale: 0 };
    case "EUR": // Euro (Định dạng Châu Âu: 1.000.000,00)
      return { thousandSeparator: ".", decimalSeparator: ",", decimalScale: 2 };
    case "USD": // Đô la Mỹ (1,000,000.00)
    case "GBP": // Bảng Anh
    case "AUD": // Đô la Úc
    default:
      // Mặc định chuẩn quốc tế chung
      return { thousandSeparator: ",", decimalSeparator: ".", decimalScale: 2 };
  }
};