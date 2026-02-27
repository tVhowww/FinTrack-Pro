"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { TransactionType } from "@/types/transaction.dto";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWallets } from "@/hooks/use-wallets";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";

export function TransactionFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const { wallets } = useWallets();
  const { categories } = useCategories();

  // Lấy giá trị hiện tại từ URL
  const currentKeyword = searchParams.get("keyword") || "";
  const currentType = searchParams.get("type") || "all";
  const currentWallet = searchParams.get("walletId") || "all";
  const currentCategory = searchParams.get("categoryId") || "all";

  const [localKeyword, setLocalKeyword] = useState(currentKeyword);

  useEffect(() => {
    setLocalKeyword(currentKeyword);
  }, [currentKeyword]);

  // Hàm update URL
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Nếu người dùng đổi Loại giao dịch (Thu/Chi)
    // thì phải Reset (xóa) luôn cái Danh mục đang chọn để tránh xung đột
    if (key === "type") {
      params.delete("categoryId");
    }

    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSearchKeyword = () => {
    updateFilter("keyword", localKeyword);
  };

  const clearFilters = () => {
    replace(pathname); // Xóa sạch param, về lại đường dẫn gốc
  };

  const flattenCategories = categories.flatMap((c) => [
    c,
    ...(c.subCategories || []),
  ]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-4 rounded-lg border shadow-sm">
      {/* Search Ô chữ */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo ghi chú..."
            className="pl-9"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchKeyword();
            }}
          />
        </div>
        <Button
          variant="default"
          className="cursor-pointer"
          onClick={handleSearchKeyword}
        >
          Tìm
        </Button>
      </div>

      {/* Lọc theo Loại */}
      <div className="w-full md:w-[150px]">
        <Select
          value={currentType}
          onValueChange={(val) => updateFilter("type", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value={TransactionType.INCOME}>Thu nhập</SelectItem>
            <SelectItem value={TransactionType.EXPENSE}>Chi tiêu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lọc theo Ví */}
      <div className="w-full md:w-[180px]">
        <Select
          value={currentWallet}
          onValueChange={(val) => updateFilter("walletId", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn ví" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ví</SelectItem>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lọc theo Danh mục */}
      <div className="w-full md:w-[180px]">
        <Select
          value={currentCategory}
          onValueChange={(val) => updateFilter("categoryId", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {flattenCategories
              .filter((c) => currentType === "all" || c.type === currentType)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nút Xóa bộ lọc */}
      {(currentKeyword ||
        currentType !== "all" ||
        currentWallet !== "all" ||
        currentCategory !== "all") && (
        <Button
          variant="ghost"
          className="px-3 text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-4 w-4 mr-1" /> Bỏ lọc
        </Button>
      )}
    </div>
  );
}
