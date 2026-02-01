"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditMode?: boolean;
}

export function BudgetDialog({
  open,
  onOpenChange,
  isEditMode,
}: BudgetDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Fake Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Giả vờ gọi API mất 1 giây
    setTimeout(() => {
      setIsLoading(false);
      onOpenChange(false);
      toast.success(
        isEditMode
          ? "Đã cập nhật ngân sách (Demo)"
          : "Đã tạo ngân sách mới (Demo)",
      );
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa ngân sách" : "Tạo ngân sách mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tên ngân sách</Label>
            <Input id="name" placeholder="VD: Ăn uống tháng này" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Hạn mức (VND)</Label>
            <Input id="amount" type="number" placeholder="5000000" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tháng</Label>
              <Input type="number" defaultValue={new Date().getMonth() + 1} />
            </div>
            <div className="grid gap-2">
              <Label>Năm</Label>
              <Input type="number" defaultValue={new Date().getFullYear()} />
            </div>
          </div>

          {/* Chọn danh mục (Mock UI - Select box đơn giản) */}
          <div className="grid gap-2">
            <Label>Danh mục áp dụng</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option>Ăn uống</option>
              <option>Di chuyển</option>
              <option>Mua sắm</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu ngân sách"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
