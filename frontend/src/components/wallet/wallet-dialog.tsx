"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useWallets } from "@/hooks/use-wallets";
import { Wallet, WalletFormValues, WalletSchema } from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner"; // Import toast để báo kết quả lẻ
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CURRENCIES } from "@/lib/constants";

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletToEdit?: Wallet | null;
}

export function WalletDialog({
  open,
  onOpenChange,
  walletToEdit,
}: WalletDialogProps) {
  const {
    createWallet,
    updateWallet,
    adjustBalance,
    isCreating,
    isUpdating,
    isAdjusting,
  } = useWallets();
  const isEditMode = !!walletToEdit;

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(WalletSchema),
    defaultValues: {
      name: "",
      balance: 0,
      currency: "VND",
    },
  });

  useEffect(() => {
    if (open) {
      if (walletToEdit) {
        form.reset({
          name: walletToEdit.name,
          balance: walletToEdit.balance,
          currency: walletToEdit.currency,
        });
      } else {
        form.reset({ name: "", balance: 0, currency: "VND" });
      }
    }
  }, [open, walletToEdit, form]);

  const onSubmit = (values: WalletFormValues) => {
    if (isEditMode && walletToEdit) {
      // --- LOGIC SỬA (EDIT MODE) ---

      const isNameChanged = values.name !== walletToEdit.name;
      const isCurrencyChanged = values.currency !== walletToEdit.currency;
      const isBalanceChanged = values.balance !== walletToEdit.balance;

      // TRƯỜNG HỢP 1: Có sửa thông tin cơ bản (Tên/Currency)
      if (isNameChanged || isCurrencyChanged) {
        updateWallet(
          {
            id: walletToEdit.id,
            data: { name: values.name, currency: values.currency },
          },
          {
            onSuccess: () => {
              if (isBalanceChanged) {
                // Gọi tiếp API thứ 2
                adjustBalance(
                  { id: walletToEdit.id, newBalance: values.balance },
                  {
                    onSuccess: () => {
                      toast.success("Cập nhật tên và số dư thành công!");
                      onOpenChange(false);
                    },
                    onError: () => toast.error("Lỗi khi cập nhật số dư"),
                  },
                );
              } else {
                // Nếu không sửa số dư thì xong rồi, đóng modal
                toast.success("Cập nhật thông tin thành công");
                onOpenChange(false);
              }
            },
            onError: () => {
              // Nếu lỗi update tên thì dừng luôn, không update số dư nữa
            },
          },
        );
      }
      // TRƯỜNG HỢP 2: Chỉ sửa số dư (Không sửa tên/currency)
      else if (isBalanceChanged) {
        adjustBalance(
          { id: walletToEdit.id, newBalance: values.balance },
          {
            onSuccess: () => {
              toast.success("Đã điều chỉnh số dư");
              onOpenChange(false);
            },
            onError: () => toast.error("Lỗi khi cập nhật số dư"),
          },
        );
      }
      // TRƯỜNG HỢP 3: Không sửa gì cả
      else {
        onOpenChange(false);
      }
    } else {
      // --- LOGIC TẠO MỚI ---
      createWallet(values, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = isCreating || isUpdating || isAdjusting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Cập nhật ví" : "Thêm ví mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Thay đổi tên hoặc điều chỉnh số dư ví."
              : "Tạo ví để bắt đầu theo dõi chi tiêu."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên ví */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ví</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Tiền mặt..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Số dư - ĐÃ MỞ KHÓA (Enabled) */}
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Số dư {isEditMode ? "thực tế" : "ban đầu"}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    {/* Thêm chú thích cho user hiểu chuyện gì sẽ xảy ra */}
                    {isEditMode && (
                      <p className="text-[0.8rem] text-muted-foreground">
                        Thay đổi số dư sẽ tự động tạo ra một giao dịch điều
                        chỉnh.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency - VẪN KHÓA (Disabled) */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị</FormLabel>
                    <Select
                      // Liên kết với React Hook Form
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((cur) => (
                          <SelectItem key={cur.code} value={cur.code}>
                            <span className="font-bold w-8 inline-block">
                              {cur.code}
                            </span>
                            <span className="text-muted-foreground">
                              - {cur.name} ({cur.symbol})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isEditMode && (
                      <p className="text-[0.8rem] text-muted-foreground">
                        Chỉ có thể thay đổi đơn vị nếu ví chưa phát sinh giao
                        dịch.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Đang xử lý..."
                  : isEditMode
                    ? "Lưu thay đổi"
                    : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
