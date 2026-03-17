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

  const currentKeyword = searchParams.get("keyword") || "";
  const currentType = searchParams.get("type") || "all";
  const currentWallet = searchParams.get("walletId") || "all";
  const currentCategory = searchParams.get("categoryId") || "all";

  const [localKeyword, setLocalKeyword] = useState(currentKeyword);

  useEffect(() => {
    setLocalKeyword(currentKeyword);
  }, [currentKeyword]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

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
    replace(pathname);
  };

  const flattenCategories = categories.flatMap((c) => [
    c,
    ...(c.subCategories || []),
  ]);

  const hasActiveFilters =
    currentKeyword ||
    currentType !== "all" ||
    currentWallet !== "all" ||
    currentCategory !== "all";

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col gap-4 mb-6">
      {/* KHU VỰC TÌM KIẾM (Luôn nằm 1 hàng riêng trên Mobile) */}
      <div className="flex flex-1 items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo ghi chú..."
            className="pl-9 w-full bg-background"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchKeyword();
            }}
            onBlur={handleSearchKeyword}
          />
        </div>
        <Button
          variant="default"
          onClick={handleSearchKeyword}
          className="shrink-0"
        >
          Tìm
        </Button>
      </div>

      {/* KHU VỰC BỘ LỌC (Grid 2 cột trên Mobile, nằm ngang trên PC) */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full">
        <Select
          value={currentType}
          onValueChange={(val) => updateFilter("type", val)}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Loại giao dịch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value={TransactionType.INCOME}>Thu nhập</SelectItem>
            <SelectItem value={TransactionType.EXPENSE}>Chi tiêu</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentWallet}
          onValueChange={(val) => updateFilter("walletId", val)}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
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

        <Select
          value={currentCategory}
          onValueChange={(val) => updateFilter("categoryId", val)}
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-background col-span-2 sm:col-span-1">
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto px-3 text-muted-foreground shrink-0 col-span-2 sm:col-span-1"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" /> Bỏ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
