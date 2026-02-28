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
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { CURRENCIES } from "@/lib/constants";

export function WalletFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentKeyword = searchParams.get("keyword") || "";
  const currentCurrency = searchParams.get("currency") || "all";

  // State tạm để gõ không bị gọi API liên tục
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
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("keyword", localKeyword);
  };

  const clearFilters = () => {
    setLocalKeyword("");
    replace(pathname); // Xóa URL sạch sẽ
  };

  const hasActiveFilters = currentKeyword !== "" || currentCurrency !== "all";

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 mb-6">
      {/* Tìm kiếm tên ví */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm tên ví..."
            className="pl-9 bg-background"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onBlur={handleSearch}
          />
        </div>
        <Button variant="default" onClick={handleSearch}>
          Tìm
        </Button>
      </div>

      {/* Lọc Tiền tệ & Nút Xóa */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentCurrency}
          onValueChange={(val) => updateFilter("currency", val)}
        >
          <SelectTrigger className="w-[150px] bg-background">
            <SelectValue placeholder="Loại tiền" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại tiền</SelectItem>
            {CURRENCIES.map((cur) => (
              <SelectItem key={cur.code} value={cur.code}>
                <span className="font-bold w-12 inline-block">{cur.code}</span>
                <span className="text-muted-foreground">
                  - {cur.name} ({cur.symbol})
                </span>
              </SelectItem>
            ))}
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
