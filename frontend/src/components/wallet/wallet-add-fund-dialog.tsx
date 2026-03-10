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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionType } from "@/types/transaction.dto";
import { Wallet } from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import confetti from "canvas-confetti";
import { getCurrencySymbol } from "@/lib/constants";
import { toast } from "sonner";

const AddFundSchema = z.object({
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
});

type AddFundFormValues = z.infer<typeof AddFundSchema>;

interface WalletAddFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
}

export function WalletAddFundDialog({
  open,
  onOpenChange,
  wallet,
}: WalletAddFundDialogProps) {
  const { createTransaction, isCreating } = useTransactions();

  const form = useForm<AddFundFormValues>({
    resolver: zodResolver(AddFundSchema),
    defaultValues: { amount: 0 },
  });

  useEffect(() => {
    if (open) form.reset({ amount: 0 });
  }, [open, form]);

  const onSubmit = async (values: AddFundFormValues) => {
    if (!wallet) return;

    try {
      // Gọi API tạo giao dịch NGẦM (Gắn cứng là Thu Nhập, Tự lấy ngày hôm nay, Ghi chú mặc định)
      await createTransaction({
        amount: values.amount,
        type: TransactionType.INCOME,
        walletId: wallet.id,
        date: new Date(),
        note: `Nạp tiền vào quỹ ${wallet.name}`,
        categoryId: undefined, // Backend tự xử lý theo loại ví
      });

      // KIỂM TRA MỤC TIÊU ĐỂ BẮN PHÁO HOA
      const newBalance = wallet.balance + values.amount;
      if (wallet.targetAmount && newBalance >= wallet.targetAmount) {
        // Nếu trước đó chưa full mà giờ nạp full -> Bắn pháo hoa rực rỡ
        if (wallet.balance < wallet.targetAmount) {
          triggerConfetti();
          toast.success("Tuyệt vời! Bạn đã hoàn thành mục tiêu tiết kiệm! 🎉", {
            duration: 5000,
          });
        }
      } else {
        toast.success(`Đã nạp thành công vào quỹ ${wallet.name}`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = new Date().getTime() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [
          "#26ccff",
          "#a25afd",
          "#ff5e7e",
          "#88ff5a",
          "#fcff42",
          "#ffa62d",
          "#ff36ff",
        ],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [
          "#26ccff",
          "#a25afd",
          "#ff5e7e",
          "#88ff5a",
          "#fcff42",
          "#ffa62d",
          "#ff36ff",
        ],
      });

      if (new Date().getTime() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  if (!wallet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nạp tiền nhanh</DialogTitle>
          <DialogDescription>
            Bỏ ống heo vào quỹ{" "}
            <strong className="text-foreground">{wallet.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="VD: 500000"
                        className="text-lg font-bold pr-12 h-14"
                        autoFocus
                        {...field}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground pointer-events-none">
                        {getCurrencySymbol(wallet.currency || "VND")}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                className="w-full h-12 text-md"
                disabled={isCreating}
              >
                {isCreating ? "Đang xử lý..." : "Nạp tiền"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
