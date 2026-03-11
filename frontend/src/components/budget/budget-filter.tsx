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

  // Giá trị mặc định
  const defaultMonth = (new Date().getMonth() + 1).toString();
  const defaultYear = new Date().getFullYear().toString();

  // Lấy giá trị từ URL
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
    setLocalKeyword(""); // Xóa chữ trên ô search
    replace(pathname); // Quét sạch URL về trạng thái gốc
  };

  const hasActiveFilters =
    currentKeyword !== "" ||
    currentStatus !== "ALL" ||
    currentWallet !== "all" ||
    currentMonth !== defaultMonth ||
    currentYear !== defaultYear;

  const currentYearNum = new Date().getFullYear();

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col lg:flex-row gap-4">
      {/* Tìm kiếm */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên ngân sách..."
            className="pl-9 bg-background"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onBlur={handleSearch}
          />
        </div>
        <Button variant="secondary" onClick={handleSearch}>
          Tìm
        </Button>
      </div>

      {/* Các Dropdown Lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentStatus}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-background">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="SAFE">🟢 An toàn (&lt; 80%)</SelectItem>
            <SelectItem value="WARNING">🟡 Sắp vượt (80-100%)</SelectItem>
            <SelectItem value="DANGER">🔴 Đã vượt (&gt; 100%)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentWallet}
          onValueChange={(val) => updateFilter("walletId", val)}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-background">
            <SelectValue placeholder="Chọn ví" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả các ví</SelectItem>
            <SelectItem value="global">Ngân sách chung</SelectItem>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
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
            className="px-3 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" /> Bỏ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
