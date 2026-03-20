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
    params.set("type", TransactionType.EXPENSE);
    replace(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters =
    currentKeyword !== "" || currentType !== TransactionType.EXPENSE;

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex flex-1 items-center gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm danh mục..."
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

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <Select
          value={currentType}
          onValueChange={(val) => updateFilter("type", val)}
        >
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto px-3 text-muted-foreground mt-2 sm:mt-0"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" /> Bỏ lọc
          </Button>
        )}
      </div>
    </div>
  );
}
