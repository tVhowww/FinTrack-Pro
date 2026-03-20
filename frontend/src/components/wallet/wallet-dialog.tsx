"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallets } from "@/hooks/use-wallets";
import { CURRENCIES } from "@/lib/constants";
import {
  Wallet,
  WalletFormValues,
  WalletSchema,
  WalletType,
} from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletToEdit?: Wallet | null;
  defaultType?: WalletType;
}

export function WalletDialog({
  open,
  onOpenChange,
  walletToEdit,
  defaultType = WalletType.BASIC,
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
          deadline: walletToEdit.deadline
            ? walletToEdit.deadline.split("T")[0]
            : format(new Date(), "yyyy-MM-dd"),
        });
      } else {
        form.reset({
          name: "",
          balance: 0,
          currency: "VND",
          type: defaultType,
          targetAmount: 0,
          deadline: format(new Date(), "yyyy-MM-dd"),
        });
      }
    }
  }, [open, walletToEdit, form, defaultType]);

  const onSubmit = (values: WalletFormValues) => {
    const payload = {
      ...values,
      targetAmount:
        values.type === WalletType.SAVING ? values.targetAmount : undefined,
      deadline: values.type === WalletType.SAVING ? values.deadline : undefined,
    };

    if (isEditMode && walletToEdit) {
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

      if (hasInfoChanges) {
        updateWallet(
          {
            id: walletToEdit.id,
            data: payload,
          },
          {
            onSuccess: () => {
              if (isBalanceChanged) {
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
            onError: () => {},
          },
        );
      } else if (isBalanceChanged) {
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
      } else {
        onOpenChange(false);
      }
    } else {
      createWallet(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = isCreating || isUpdating || isAdjusting;
  const currentType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-1"
          >
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
                    disabled={isEditMode || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 text-base">
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ví / Tên mục tiêu</FormLabel>
                  <FormControl>
                    <Input
                      className="h-12 text-lg font-bold pr-4"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
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
                          className="h-12 text-lg font-bold pr-4"
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
                    <FormItem className="flex flex-col pt-2 sm:pt-0">
                      <FormLabel className="sm:mt-0 mt-2">Hạn chót</FormLabel>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Input
                        type="number"
                        step="any"
                        className="h-12 text-lg font-bold pr-4"
                        {...field}
                      />
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
                        <SelectTrigger className="h-12 text-base">
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

            <DialogFooter className="pt-4 pb-2 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={isLoading}
              >
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
