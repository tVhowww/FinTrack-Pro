"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  onConfirm: () => void;
  isLoading?: boolean; // Để hiện trạng thái đang xóa
  confirmText?: string;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Bạn có chắc chắn không?",
  description = "Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.",
  onConfirm,
  isLoading,
  confirmText = "Xóa ngay",
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Hủy bỏ</AlertDialogCancel>
          {/* Nút Xóa thường để màu đỏ (destructive) để cảnh báo */}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Chặn đóng dialog ngay lập tức để chờ API chạy xong
              onConfirm();
            }}
            disabled={isLoading}
            className={
              `bg-${variant === "destructive" ? "red-600" : "blue-600"} 
            hover:bg-${variant === "destructive" ? "red-700" : "blue-700"} 
            text-white focus:ring-${variant === "destructive" ? "red-600" : "blue-600"}`
            }
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
