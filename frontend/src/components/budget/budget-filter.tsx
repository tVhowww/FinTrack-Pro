"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallets } from "@/hooks/use-wallets";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function BudgetFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const { wallets } = useWallets();

  const defaultMonth = (new Date().getMonth() + 1).toString();
  const defaultYear = new Date().getFullYear().toString();

  const currentMonth = searchParams.get("month") || defaultMonth;
  const currentYear = searchParams.get("year") || defaultYear;
  const currentWallet = searchParams.get("walletId") || "all";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentKeyword = searchParams.get("keyword") || "";

  const [localKeyword, setLocalKeyword] = useState(currentKeyword);

  useEffect(() => {
    setLocalKeyword(currentKeyword);
  }, [currentKeyword]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value && value !== "all" && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (!params.has("month")) params.set("month", currentMonth);
    if (!params.has("year")) params.set("year", currentYear);

    replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("keyword", localKeyword);
  };

  const clearFilters = () => {
    setLocalKeyword("");
    replace(pathname);
  };

  const hasActiveFilters =
    currentKeyword !== "" ||
    currentStatus !== "ALL" ||
    currentWallet !== "all" ||
    currentMonth !== defaultMonth ||
    currentYear !== defaultYear;

  const currentYearNum = new Date().getFullYear();

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col gap-4">
      {/* Tìm kiếm: Luôn trải dài 100% trên Mobile */}
      <div className="flex flex-1 items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên ngân sách..."
            className="pl-9 bg-background w-full"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onBlur={handleSearch}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} className="shrink-0">
          Tìm
        </Button>
      </div>

      {/* Các Dropdown Lọc: Grid 2 cột trên Mobile */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full">
        <Select
          value={currentStatus}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-background [&>span]:truncate">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">🟢 Đang hoạt động</SelectItem>
            <SelectItem value="EXCEEDED">🔴 Đã vượt mức</SelectItem>
            <SelectItem value="EXPIRED">⚪ Đã kết thúc</SelectItem>
            <SelectItem value="UPCOMING">🔵 Sắp tới</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentWallet}
          onValueChange={(val) => updateFilter("walletId", val)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-background [&>span]:truncate">
            <SelectValue placeholder="Chọn ví" />
          </SelectTrigger>
          <SelectContent className="max-w-[85vw] sm:max-w-[300px]">
            <SelectItem value="all">Tất cả các ví</SelectItem>
            <SelectItem value="global">Ngân sách chung</SelectItem>
            {wallets.map((w) => (
              <SelectItem
                key={w.id}
                value={w.id}
                className="max-w-full overflow-hidden"
              >
                <div className="truncate w-full pr-2 text-left">{w.name}</div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentMonth}
          onValueChange={(val) => updateFilter("month", val)}
        >
          <SelectTrigger className="w-full sm:w-[100px] bg-background">
            <SelectValue placeholder="Tháng" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={m.toString()}>
                Tháng {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentYear}
          onValueChange={(val) => updateFilter("year", val)}
        >
          <SelectTrigger className="w-full sm:w-[100px] bg-background">
            <SelectValue placeholder="Năm" />
          </SelectTrigger>
          <SelectContent>
            {[currentYearNum - 1, currentYearNum, currentYearNum + 1].map(
              (y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto px-3 text-muted-foreground shrink-0 col-span-2 sm:col-span-1 mt-2 sm:mt-0"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" /> Bỏ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
