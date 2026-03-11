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
import { getCurrencySymbol } from "@/lib/constants";
import { TransactionType } from "@/types/transaction.dto";
import { WalletType } from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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

  // Chỉ lấy các ví cơ bản (Không lấy Quỹ tiết kiệm)
  const basicWallets = wallets.filter((w) => w.type !== WalletType.SAVING);

  // Lấy sẵn 1 danh mục thu nhập để chữa cháy cho Backend (ẩn dưới UI)
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
          message: "Số tiền chuyển vượt quá số dư ví nguồn",
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

  // Lọc ví nhận: Cùng loại tiền tệ và phải khác ví nguồn
  const compatibleDestWallets = basicWallets.filter(
    (w) => w.currency === fromWallet?.currency && w.id !== fromWallet?.id,
  );

  useEffect(() => {
    if (open) {
      form.reset({ fromWalletId: "", toWalletId: "", amount: 0, note: "" });
    }
  }, [open, form]);

  // Reset ví nhận nếu user đổi ví nguồn sang loại tiền khác
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
      // Tự động mượn 1 danh mục Thu nhập bất kỳ đẩy xuống Backend
      const fallbackCategoryId =
        incomeCategories.length > 0 ? incomeCategories[0].id : undefined;

      await transferTransaction({
        fromWalletId: values.fromWalletId,
        toWalletId: values.toWalletId,
        amount: values.amount,
        note: values.note || "Chuyển tiền nội bộ",
        categoryId: fallbackCategoryId,
      });

      toast.success("Chuyển tiền nội bộ thành công!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-500" /> Chuyển tiền nội
            bộ
          </DialogTitle>
          <DialogDescription>
            Luân chuyển tiền giữa các ví chi tiêu của bạn.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* VÍ NGUỒN */}
            <FormField
              control={form.control}
              name="fromWalletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ ví nguồn (Bị trừ tiền)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ví nguồn" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {basicWallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} (Số dư:{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: w.currency || "VND",
                          }).format(w.balance)}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VÍ NHẬN */}
            <FormField
              control={form.control}
              name="toWalletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sang ví nhận (Được cộng tiền)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={
                      !selectedFromWalletId ||
                      compatibleDestWallets.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ví nhận" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {compatibleDestWallets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFromWalletId &&
                    compatibleDestWallets.length === 0 && (
                      <p className="text-[0.8rem] text-muted-foreground mt-1">
                        Không có ví nào cùng loại tiền tệ để chuyển.
                      </p>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SỐ TIỀN */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền chuyển</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="VD: 500000"
                        className="pr-12"
                        {...field}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        {getCurrencySymbol(fromWallet?.currency || "VND")}
                      </div>
                    </div>
                  </FormControl>
                  {fromWallet && (
                    <div className="flex justify-end mt-1">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs text-blue-500"
                        onClick={() =>
                          form.setValue("amount", fromWallet.balance, {
                            shouldValidate: true,
                          })
                        }
                      >
                        Chuyển toàn bộ
                      </Button>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GHI CHÚ */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Rút tiền mặt từ thẻ VCB..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full"
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
