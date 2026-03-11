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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { getCurrencySymbol } from "@/lib/constants";
import { TransactionType } from "@/types/transaction.dto";
import { Wallet, WalletType } from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import { ArrowRightLeft, PlusCircle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  const { createTransaction, isCreating, transferTransaction, isTransferring } =
    useTransactions();
  const { wallets } = useWallets();
  const [activeTab, setActiveTab] = useState("transfer");

  // Lọc các ví cơ bản cùng loại tiền tệ để làm nguồn nạp
  const compatibleWallets = wallets.filter(
    (w) => w.type !== WalletType.SAVING && w.currency === wallet?.currency,
  );

  const AddFundSchema = z
    .object({
      amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
      sourceWalletId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (activeTab === "transfer" && !data.sourceWalletId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng chọn ví nguồn để trích tiền",
          path: ["sourceWalletId"],
        });
      }

      // Check số dư ví nguồn có đủ để trích không
      if (activeTab === "transfer" && data.sourceWalletId) {
        const sourceWallet = compatibleWallets.find(
          (w) => w.id === data.sourceWalletId,
        );
        if (sourceWallet && data.amount > sourceWallet.balance) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Ví nguồn không đủ số dư",
            path: ["amount"],
          });
        }
      }
    });

  type AddFundFormValues = z.infer<typeof AddFundSchema>;

  const form = useForm<AddFundFormValues>({
    resolver: zodResolver(AddFundSchema),
    defaultValues: { amount: 0, sourceWalletId: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ amount: 0, sourceWalletId: "" });
      setActiveTab(compatibleWallets.length > 0 ? "transfer" : "direct");
    }
  }, [open, form, compatibleWallets.length]);

  const onSubmit = async (values: AddFundFormValues) => {
    if (!wallet) return;

    try {
      if (activeTab === "transfer") {
        // KỊCH BẢN 1: TRÍCH TỪ VÍ CƠ BẢN VÀO QUỸ
        const sourceWallet = wallets.find(
          (w) => w.id === values.sourceWalletId,
        );

        await transferTransaction({
          fromWalletId: values.sourceWalletId!,
          toWalletId: wallet.id,
          amount: values.amount,
          note: `Trích tiền từ ví ${sourceWallet?.name} vào quỹ`,
        });
      } else {
        // KỊCH BẢN 2: NẠP TỪ NGUỒN BÊN NGOÀI
        await createTransaction({
          amount: values.amount,
          type: TransactionType.INCOME,
          walletId: wallet.id,
          date: new Date(),
          note: `Nạp tiền từ bên ngoài vào quỹ ${wallet.name}`,
          categoryId: "auto-saving-category",
        });
      }

      // KIỂM TRA MỤC TIÊU ĐỂ BẮN PHÁO HOA (Chung cho cả 2 kịch bản)
      const newBalance = wallet.balance + values.amount;
      if (wallet.targetAmount && newBalance >= wallet.targetAmount) {
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
      toast.error("Có lỗi xảy ra khi nạp tiền!");
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

  const isLoading = isCreating || isTransferring;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-emerald-600" fill="currentColor" /> Nạp
            tiền nhanh
          </DialogTitle>
          <DialogDescription>
            Bỏ ống heo vào quỹ{" "}
            <strong className="text-foreground">{wallet.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfer" className="flex items-center gap-1">
              <ArrowRightLeft className="h-4 w-4" /> Từ ví của tôi
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" /> Bên ngoài vào
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 mt-4"
            >
              {/* SỐ TIỀN (Dùng chung cho cả 2 Tab) */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền nạp</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="any"
                          placeholder="VD: 500000"
                          className="text-lg font-bold pr-12 h-12"
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

              {/* TAB 1: TRÍCH TỪ VÍ CƠ BẢN */}
              <TabsContent value="transfer" className="mt-0 space-y-4">
                {compatibleWallets.length === 0 ? (
                  <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-md border border-rose-200">
                    Bạn chưa có Ví chi tiêu nào sử dụng đồng{" "}
                    <strong>{wallet.currency}</strong> để trích tiền. Vui lòng
                    chọn nạp từ <strong>Nguồn bên ngoài</strong>.
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="sourceWalletId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trích tiền từ ví</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn ví nguồn" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {compatibleWallets.map((w) => (
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
                )}
              </TabsContent>

              {/* TAB 2: NGUỒN BÊN NGOÀI (Không cần chọn gì thêm) */}
              <TabsContent value="direct" className="mt-0">
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-dashed">
                  Khoản tiền này sẽ được tính là Thu nhập mới của bạn và cộng
                  thẳng vào quỹ <strong>{wallet.name}</strong>.
                </div>
              </TabsContent>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 text-md "
                  disabled={isLoading}
                >
                  {isLoading ? "Đang xử lý..." : "Nạp tiền"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
