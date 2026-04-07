"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface HideAmountContextType {
  isHidden: boolean; // Master Eye (Che tất cả)
  toggleHide: () => void;
  // Các hàm mới cho từng phần tử nhỏ
  revealedItems: string[]; // Danh sách các ID đang được xem trộm
  toggleRevealItem: (id: string) => void;
  // Hàm mask bây giờ nhận thêm ID để check xem có đang được "xem trộm" không
  maskAmount: (formattedAmount: string, id?: string) => string;
}

const HideAmountContext = createContext<HideAmountContextType | undefined>(undefined);

export function HideAmountProvider({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [revealedItems, setRevealedItems] = useState<string[]>([]);

  // Đọc trí nhớ từ LocalStorage khi mở app
  useEffect(() => {
    const savedState = localStorage.getItem("hide-amount");
    if (savedState === "true") setIsHidden(true);
  }, []);

  // Bật/tắt Master Eye
  const toggleHide = () => {
    setIsHidden((prev) => {
      const next = !prev;
      localStorage.setItem("hide-amount", String(next));
      // Khi bấm Master Eye, reset luôn các phần tử đang xem trộm cho gọn
      if (next === false) setRevealedItems([]); 
      return next;
    });
  };

  // Bật/tắt con mắt nhỏ của từng Ví/Giao dịch
  const toggleRevealItem = (id: string) => {
    setRevealedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Logic che tiền siêu việt:
  // Nếu Master = ẨN -> Check xem ID này có được cấp phép xem trộm không?
  // - Nếu có: Hiện.
  // - Nếu không: Che.
  const maskAmount = (formattedAmount: string, id?: string) => {
    if (!isHidden) return formattedAmount; // Master mở -> Hiện tất
    if (id && revealedItems.includes(id)) return formattedAmount; // Được cấp phép -> Hiện
    return "******"; // Còn lại -> Che
  };

  return (
    <HideAmountContext.Provider
      value={{ isHidden, toggleHide, revealedItems, toggleRevealItem, maskAmount }}
    >
      {children}
    </HideAmountContext.Provider>
  );
}

export const useHideAmount = () => {
  const context = useContext(HideAmountContext);
  if (!context) {
    throw new Error("useHideAmount phải được bọc trong HideAmountProvider");
  }
  return context;
};