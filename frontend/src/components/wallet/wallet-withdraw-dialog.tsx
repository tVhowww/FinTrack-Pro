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
import { Hammer, ArrowRightLeft, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface WalletWithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
}

export function WalletWithdrawDialog({
  open,
  onOpenChange,
  wallet,
}: WalletWithdrawDialogProps) {
  const { createTransaction, isCreating, transferTransaction, isTransferring } =
    useTransactions();
  const { wallets, deleteWallet } = useWallets();
  const [activeTab, setActiveTab] = useState("transfer");

  const compatibleWallets = wallets.filter(
    (w) => w.type !== WalletType.SAVING && w.currency === wallet?.currency,
  );

  const WithdrawSchema = z
    .object({
      amount: z.coerce
        .number()
        .min(1, "Số tiền phải lớn hơn 0")
        .max(wallet?.balance || 0, "Không được rút vượt quá số dư trong quỹ"),
      destinationWalletId: z.string().optional(),
      note: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (activeTab === "transfer") {
        if (!data.destinationWalletId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Vui lòng chọn ví nhận tiền",
            path: ["destinationWalletId"],
          });
        }
      }
    });

  type WithdrawFormValues = z.infer<typeof WithdrawSchema>;

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(WithdrawSchema),
    defaultValues: {
      amount: 0,
      destinationWalletId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (open && wallet) {
      form.reset({
        amount: 0,
        destinationWalletId: "",
        note: "",
      });
      setActiveTab("transfer");
    }
  }, [open, wallet, form]);

  const onSubmit = async (values: WithdrawFormValues) => {
    if (!wallet) return;

    try {
      if (activeTab === "transfer") {
        const destWallet = wallets.find(
          (w) => w.id === values.destinationWalletId,
        );

        await transferTransaction({
          fromWalletId: wallet.id,
          toWalletId: values.destinationWalletId!,
          amount: values.amount,
          note: values.note || `Rút tiền chuyển về ví ${destWallet?.name}`,
        });

        toast.success(
          `Đã chuyển ${values.amount} về ví ${destWallet?.name} thành công!`,
        );
      } else {
        await createTransaction({
          amount: values.amount,
          type: TransactionType.EXPENSE,
          walletId: wallet.id,
          date: new Date(),
          note: values.note || `Tiêu tiền từ quỹ ${wallet.name}`,
          categoryId: "auto-saving-category",
        });
        toast.success("Đã ghi nhận khoản chi từ quỹ!");
      }

      const remainingBalance = wallet.balance - values.amount;
      if (remainingBalance === 0) {
        toast("Quỹ đã cạn!", {
          description:
            "Bạn đã rút toàn bộ tiền. Bạn có muốn xóa quỹ này luôn không?",
          action: {
            label: "Xóa quỹ",
            onClick: () => {
              deleteWallet(wallet.id, {
                onSuccess: () => toast.success("Đã xóa quỹ!"),
              });
            },
          },
          duration: 10000,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (!wallet) return null;
  const isLoading = isCreating || isTransferring;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Hammer className="h-5 w-5 text-rose-500" /> Rút tiền quỹ
          </DialogTitle>
          <DialogDescription className="text-base truncate" title={wallet.name}>
            Bạn đang có{" "}
            <strong className="text-emerald-600">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: wallet.currency || "VND",
              }).format(wallet.balance)}
            </strong>{" "}
            trong quỹ <strong>{wallet.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-2 min-w-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfer" className="flex items-center gap-1">
              <ArrowRightLeft className="h-4 w-4" /> Chuyển về ví
            </TabsTrigger>
            <TabsTrigger value="spend" className="flex items-center gap-1">
              <ShoppingCart className="h-4 w-4" /> Tiêu trực tiếp
            </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 mt-5 w-full min-w-0"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full min-w-0">
                    <FormLabel className="text-base">Số tiền rút</FormLabel>
                    <FormControl>
                      <div className="relative w-full min-w-0">
                        <Input
                          type="number"
                          step="any"
                          placeholder="VD: 500000"
                          className="h-12 text-lg font-bold pr-14 w-full min-w-0"
                          {...field}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground pointer-events-none">
                          {getCurrencySymbol(wallet.currency || "VND")}
                        </div>
                      </div>
                    </FormControl>
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 text-xs font-semibold px-3 text-rose-600 bg-rose-50 hover:bg-rose-100"
                        onClick={() =>
                          form.setValue("amount", wallet.balance, {
                            shouldValidate: true,
                          })
                        }
                      >
                        Rút toàn bộ (Tất toán)
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TabsContent value="transfer" className="mt-0 space-y-4">
                {compatibleWallets.length === 0 ? (
                  <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-md border border-rose-200">
                    Bạn chưa có Ví chi tiêu nào sử dụng đồng{" "}
                    <strong>{wallet?.currency}</strong>. Vui lòng tạo thêm ví
                    hoặc sử dụng chức năng <strong>Tiêu trực tiếp</strong>.
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="destinationWalletId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-full min-w-0">
                        <FormLabel className="text-base">Nhận tiền vào ví</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block text-base">
                              <SelectValue placeholder="Chọn ví nhận tiền" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-w-[85vw] sm:max-w-[400px]">
                            {compatibleWallets.map((w) => (
                              <SelectItem key={w.id} value={w.id} className="py-3 max-w-full overflow-hidden">
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
                )}
              </TabsContent>

              <TabsContent value="spend" className="mt-0 space-y-4">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full min-w-0">
                      <FormLabel className="text-base">Ghi chú chi tiêu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Mua điện thoại..."
                          className="h-12 text-base w-full min-w-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <DialogFooter className="pt-4 pb-2 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10">
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full h-12 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang xử lý..." : "Xác nhận Rút tiền"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}