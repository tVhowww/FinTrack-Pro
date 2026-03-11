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
import { TransactionType } from "@/types/category.dto";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function CategoryFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Mặc định là EXPENSE giống như trước
  const currentType = searchParams.get("type") || TransactionType.EXPENSE;
  const currentKeyword = searchParams.get("keyword") || "";

  const [localKeyword, setLocalKeyword] = useState(currentKeyword);

  useEffect(() => {
    setLocalKeyword(currentKeyword);
  }, [currentKeyword]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
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
    const params = new URLSearchParams();
    // Khi clear, ta có thể giữ lại type mặc định là EXPENSE hoặc xóa trắng.
    // Ở đây em giữ lại EXPENSE cho khỏi lỗi UI
    params.set("type", TransactionType.EXPENSE);
    replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters =
    currentKeyword !== "" || currentType !== TransactionType.EXPENSE;

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 mb-6">
      {/* Tìm kiếm */}
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm danh mục..."
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

      {/* Dropdown Lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentType}
          onValueChange={(val) => updateFilter("type", val)}
        >
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Loại danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TransactionType.EXPENSE}>
              Khoản Chi (Expense)
            </SelectItem>
            <SelectItem value={TransactionType.INCOME}>
              Khoản Thu (Income)
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Nút Bỏ lọc */}
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
