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
          // categoryId đã bị xóa bỏ, phó mặc cho Backend lo!
          note: values.note || `Rút tiền chuyển về ví ${destWallet?.name}`,
        });

        toast.success(
          `Đã chuyển ${values.amount} về ví ${destWallet?.name} thành công!`,
        );
      } else {
        // CHI TIÊU TRỰC TIẾP
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-rose-500" /> Rút tiền quỹ
          </DialogTitle>
          <DialogDescription>
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
          className="w-full mt-2"
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
              className="space-y-4 mt-4"
            >
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số tiền rút</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="any"
                          placeholder="VD: 500000"
                          className="text-lg font-bold pr-12 h-12"
                          {...field}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          {getCurrencySymbol(wallet.currency || "VND")}
                        </div>
                      </div>
                    </FormControl>
                    <div className="flex justify-end mt-1">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs text-rose-500"
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
                      <FormItem>
                        <FormLabel>Nhận tiền vào ví</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn ví nhận tiền" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {compatibleWallets.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name} (
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

              <TabsContent value="spend" className="mt-0 space-y-4">
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú chi tiêu</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Mua điện thoại..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full h-11 text-md"
                  disabled={isCreating || isTransferring}
                >
                  {isCreating || isTransferring
                    ? "Đang xử lý..."
                    : "Xác nhận Rút tiền"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
