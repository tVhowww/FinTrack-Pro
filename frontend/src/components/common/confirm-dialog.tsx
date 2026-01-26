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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  isLoading?: boolean; // Để hiện trạng thái đang xóa
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Bạn có chắc chắn không?",
  description = "Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.",
  onConfirm,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
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
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
          >
            {isLoading ? "Đang xóa..." : "Xóa ngay"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}