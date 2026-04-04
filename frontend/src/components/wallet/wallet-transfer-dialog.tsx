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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { getCurrencyFormatConfig, getCurrencySymbol } from "@/lib/constants";
import { TransactionType } from "@/types/transaction.dto";
import { WalletType } from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

interface WalletTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletTransferDialog({
  open,
  onOpenChange,
}: WalletTransferDialogProps) {
  const { transferTransaction, isTransferring } = useTransactions();
  const { wallets } = useWallets();
  const { categories } = useCategories();

  const basicWallets = wallets.filter((w) => w.type !== WalletType.SAVING);

  const incomeCategories = useMemo(() => {
    const flatCategories = categories.flatMap((c) => [
      c,
      ...(c.subCategories || []),
    ]);
    return flatCategories.filter((c) => c.type === TransactionType.INCOME);
  }, [categories]);

  const TransferSchema = z
    .object({
      fromWalletId: z.string().min(1, "Vui lòng chọn ví nguồn"),
      toWalletId: z.string().min(1, "Vui lòng chọn ví nhận"),
      amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
      note: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.fromWalletId &&
        data.toWalletId &&
        data.fromWalletId === data.toWalletId
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ví nhận phải khác ví nguồn",
          path: ["toWalletId"],
        });
      }
      const fromWallet = basicWallets.find((w) => w.id === data.fromWalletId);
      if (fromWallet && data.amount > fromWallet.balance) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vượt quá số dư ví nguồn",
          path: ["amount"],
        });
      }
    });

  type TransferFormValues = z.infer<typeof TransferSchema>;

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(TransferSchema),
    defaultValues: { fromWalletId: "", toWalletId: "", amount: 0, note: "" },
  });

  const selectedFromWalletId = form.watch("fromWalletId");
  const fromWallet = basicWallets.find((w) => w.id === selectedFromWalletId);

  const compatibleDestWallets = basicWallets.filter(
    (w) => w.currency === fromWallet?.currency && w.id !== fromWallet?.id,
  );

  useEffect(() => {
    if (open)
      form.reset({ fromWalletId: "", toWalletId: "", amount: 0, note: "" });
  }, [open, form]);

  useEffect(() => {
    const toWalletId = form.getValues("toWalletId");
    if (toWalletId && fromWallet) {
      const isCompatible = compatibleDestWallets.some(
        (w) => w.id === toWalletId,
      );
      if (!isCompatible) form.setValue("toWalletId", "");
    }
  }, [selectedFromWalletId, compatibleDestWallets, form]);

  const onSubmit = async (values: TransferFormValues) => {
    try {
      const fallbackCategoryId =
        incomeCategories.length > 0 ? incomeCategories[0].id : undefined;
      await transferTransaction({
        fromWalletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        amount: values.amount,
        note: values.note || "Chuyển tiền nội bộ",
        categoryId: fallbackCategoryId,
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ArrowRightLeft className="h-5 w-5 text-blue-500" /> Chuyển tiền nội
            bộ
          </DialogTitle>
          <DialogDescription className="text-base">
            Luân chuyển tiền giữa các ví chi tiêu của bạn.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-2 w-full min-w-0"
          >
            <FormField
              control={form.control}
              name="fromWalletId"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel className="text-base">
                    Từ ví nguồn (Bị trừ tiền)
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block text-base">
                        <SelectValue placeholder="Chọn ví nguồn" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-w-[85vw] sm:max-w-[400px]">
                      {basicWallets.map((w) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          className="py-3 max-w-full overflow-hidden"
                        >
                          <div className="w-full text-left truncate pr-2">
                            <span className="font-medium">{w.name}</span>
                            <span className="text-muted-foreground ml-1">
                              (Dư:{" "}
                              {new Intl.NumberFormat("vi-VN", {
                                style: "currency",
                                currency: w.currency || "VND",
                              }).format(w.balance)}
                              )
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="toWalletId"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel className="text-base">
                    Sang ví nhận (Cộng tiền)
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={
                      !selectedFromWalletId ||
                      compatibleDestWallets.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block text-base">
                        <SelectValue placeholder="Chọn ví nhận" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-w-[85vw] sm:max-w-[400px]">
                      {compatibleDestWallets.map((w) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          className="py-3 max-w-full overflow-hidden"
                        >
                          <div className="w-full text-left truncate pr-2">
                            {w.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel className="text-base">Số tiền chuyển</FormLabel>
                  <FormControl>
                    <div className="relative w-full min-w-0">
                      <NumericFormat
                        customInput={Input}
                        {...getCurrencyFormatConfig(
                          fromWallet?.currency || "VND",
                        )}
                        allowNegative={false}
                        value={field.value === 0 ? "" : field.value}
                        onValueChange={(values) => {
                          field.onChange(values.floatValue || 0);
                        }}
                        placeholder="VD: 500,000"
                        className="h-12 text-lg font-bold pr-14 w-full min-w-0"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground pointer-events-none">
                        {getCurrencySymbol(fromWallet?.currency || "VND")}
                      </div>
                    </div>
                  </FormControl>
                  {fromWallet && (
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 text-xs font-semibold px-3 text-blue-600 bg-blue-50 hover:bg-blue-100"
                        onClick={() =>
                          form.setValue("amount", fromWallet.balance, {
                            shouldValidate: true,
                          })
                        }
                      >
                        Chuyển tất cả
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel className="text-base">Ghi chú</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Sang tiền ăn uống..."
                      className="h-12 text-base w-full min-w-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4 pb-2 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={isTransferring}
              >
                {isTransferring ? "Đang xử lý..." : "Xác nhận Chuyển tiền"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
