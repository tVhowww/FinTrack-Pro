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
import {
  Wallet,
  WalletFormValues,
  WalletSchema,
  WalletType,
} from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CURRENCIES } from "@/lib/constants";
import { DatePicker } from "../ui/date-picker";
import { format } from "date-fns";

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
      type: WalletType.BASIC,
      targetAmount: 0,
      deadline: format(new Date(), "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    if (open) {
      if (walletToEdit) {
        form.reset({
          name: walletToEdit.name,
          balance: walletToEdit.balance,
          currency: walletToEdit.currency,
          type: walletToEdit.type || WalletType.BASIC,
          targetAmount: walletToEdit.targetAmount || 0,
          // Convert ngày từ Backend (ISO String) sang định dạng của input type="date"
          deadline: walletToEdit.deadline
            ? walletToEdit.deadline.split("T")[0]
            : format(new Date(), "yyyy-MM-dd"),
        });
      } else {
        form.reset({
          name: "",
          balance: 0,
          currency: "VND",
          type: WalletType.BASIC,
          targetAmount: 0,
          deadline: format(new Date(), "yyyy-MM-dd"),
        });
      }
    }
  }, [open, walletToEdit, form]);

  const onSubmit = (values: WalletFormValues) => {
    // Ép kiểu Data gửi đi (Xóa mục tiêu nếu là ví thường)
    const payload = {
      ...values,
      targetAmount:
        values.type === WalletType.SAVING ? values.targetAmount : undefined,
      deadline: values.type === WalletType.SAVING ? values.deadline : undefined,
    };

    if (isEditMode && walletToEdit) {
      // --- LOGIC SỬA (EDIT MODE) ---
      const isNameChanged = values.name !== walletToEdit.name;
      const isCurrencyChanged = values.currency !== walletToEdit.currency;
      const isTargetChanged = values.targetAmount !== walletToEdit.targetAmount;
      const isDeadlineChanged =
        values.deadline !== walletToEdit.deadline?.split("T")[0];
      const isBalanceChanged = values.balance !== walletToEdit.balance;

      const hasInfoChanges =
        isNameChanged ||
        isCurrencyChanged ||
        isTargetChanged ||
        isDeadlineChanged;

      // TRƯỜNG HỢP 1: Có sửa thông tin cơ bản
      if (hasInfoChanges) {
        updateWallet(
          {
            id: walletToEdit.id,
            data: payload, // Gửi payload đã xử lý
          },
          {
            onSuccess: () => {
              if (isBalanceChanged) {
                // Gọi tiếp API thứ 2
                adjustBalance(
                  { id: walletToEdit.id, newBalance: values.balance },
                  {
                    onSuccess: () => {
                      toast.success("Cập nhật thông tin và số dư thành công!");
                      onOpenChange(false);
                    },
                    onError: () => toast.error("Lỗi khi cập nhật số dư"),
                  },
                );
              } else {
                toast.success("Cập nhật thông tin thành công");
                onOpenChange(false);
              }
            },
            onError: () => {
              // Lỗi update info thì thôi không update số dư nữa
            },
          },
        );
      }
      // TRƯỜNG HỢP 2: Chỉ sửa số dư
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
      createWallet(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = isCreating || isUpdating || isAdjusting;
  const currentType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Cập nhật ví" : "Thêm ví mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Thay đổi thông tin hoặc điều chỉnh số dư ví."
              : "Tạo ví thường hoặc quỹ tiết kiệm để quản lý tài chính."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại ví</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isEditMode || isLoading} // Không cho đổi loại ví khi đang Edit
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại ví" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={WalletType.BASIC}>
                        Ví thường (Tiền mặt, Thẻ ATM...)
                      </SelectItem>
                      <SelectItem value={WalletType.SAVING}>
                        Mục tiêu tiết kiệm (Heo đất, Quỹ...)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tên ví */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ví / Tên mục tiêu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        currentType === WalletType.SAVING
                          ? "VD: Quỹ mua xe..."
                          : "VD: Tiền mặt..."
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentType === WalletType.SAVING && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền mục tiêu</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Hạn chót</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? format(date, "yyyy-MM-dd") : "",
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Số dư */}
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {currentType === WalletType.SAVING
                        ? isEditMode
                          ? "Đã tích lũy"
                          : "Tích lũy ban đầu"
                        : `Số dư ${isEditMode ? "thực tế" : "ban đầu"}`}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="any" {...field} />
                    </FormControl>
                    {isEditMode && (
                      <p className="text-[0.75rem] text-muted-foreground">
                        Sẽ tự động tạo giao dịch điều chỉnh.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị</FormLabel>
                    <Select
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
                      <p className="text-[0.75rem] text-muted-foreground">
                        Chỉ đổi được nếu chưa có giao dịch.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
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
