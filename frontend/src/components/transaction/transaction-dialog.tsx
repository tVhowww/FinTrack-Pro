"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-categories";
import { walletService } from "@/services/wallet.service";
import {
  TransactionCreationRequest,
  TransactionResponse,
  TransactionType,
  TransactionUpdateRequest,
} from "@/types/transaction.dto";
import { Wallet } from "@/types/wallet.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// Xóa import toast và transactionService vì Hook cha sẽ lo việc này
import { z } from "zod";
import { getCurrencySymbol } from "@/lib/constants";

// Schema Validate
const TransactionSchema = z.object({
  amount: z.coerce.number().min(0.01, "Số tiền phải lớn hơn 0"),
  type: z.nativeEnum(TransactionType),
  walletId: z.string().min(1, "Vui lòng chọn ví"),
  categoryId: z.string().optional(),
  date: z.date({ required_error: "Vui lòng chọn ngày" }),
  note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof TransactionSchema>;

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionToEdit?: TransactionResponse | null;
  onCreate: (data: TransactionCreationRequest) => Promise<any>;
  onUpdate: ({
    id,
    data,
  }: {
    id: string;
    data: TransactionUpdateRequest;
  }) => Promise<any>;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transactionToEdit,
  onCreate,
  onUpdate,
}: TransactionDialogProps) {
  const isEditMode = !!transactionToEdit;
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const { categories } = useCategories();

  useEffect(() => {
    if (open) {
      walletService
        .getAll()
        .then((res) => {
          if (res && res.result) setWallets(res.result);
          else if (Array.isArray(res)) setWallets(res);
        })
        .catch(console.error);
    }
  }, [open]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(TransactionSchema),
    defaultValues: {
      amount: 0,
      type: TransactionType.EXPENSE,
      walletId: "",
      categoryId: "",
      date: new Date(),
      note: "",
    },
  });

  const selectedWalletId = form.watch("walletId");

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const currencySymbol = getCurrencySymbol(selectedWallet?.currency || "VND");

  useEffect(() => {
    if (open) {
      if (transactionToEdit) {
        form.reset({
          amount: Math.abs(transactionToEdit.amount),
          type: transactionToEdit.type,
          walletId: transactionToEdit.walletId,
          categoryId: transactionToEdit.categoryId,
          date: new Date(transactionToEdit.date),
          note: transactionToEdit.note || "",
        });
      } else {
        form.reset({
          amount: 0,
          type: TransactionType.EXPENSE,
          walletId: wallets.length > 0 ? wallets[0].id : "",
          categoryId: "",
          date: new Date(),
          note: "",
        });
      }
    }
  }, [open, transactionToEdit, form, wallets]);

  const onSubmit = async (values: TransactionFormValues) => {
    setIsLoading(true);
    try {
      // Chuẩn bị payload chung
      const payloadCommon = {
        ...values,
        categoryId: values.categoryId || undefined, // Convert string rỗng
      };

      if (isEditMode && transactionToEdit) {
        // Gọi hàm onUpdate từ Props (Hook cha sẽ chạy API + Refresh Data)
        await onUpdate({
          id: transactionToEdit.id,
          data: payloadCommon,
        });
      } else {
        // Gọi hàm onCreate từ Props
        await onCreate(payloadCommon);
      }

      // Nếu thành công (không bị throw error) thì đóng dialog
      // Toast success đã được xử lý ở Hook cha
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      // Nếu có lỗi, Hook cha sẽ hiện Toast Error.
      // Ở đây ta chỉ cần catch để không crash app và tắt loading.
    } finally {
      setIsLoading(false);
    }
  };

  const flattenCategories = categories.flatMap((c) => [
    c,
    ...(c.subCategories || []),
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Cập nhật giao dịch" : "Thêm giao dịch mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại giao dịch</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isEditMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TransactionType.EXPENSE}>
                          Chi tiêu
                        </SelectItem>
                        <SelectItem value={TransactionType.INCOME}>
                          Thu nhập
                        </SelectItem>
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
                  <FormItem>
                    <FormLabel>Số tiền</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="any"
                          placeholder="VD: 50000 hoặc 10.5"
                          className="pr-8" // Cấp khoảng trống bên phải để chữ ko đè lên Ký hiệu
                          {...field}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">
                          {currencySymbol}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ví thanh toán</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={isEditMode} // Disable khi edit
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ví" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flattenCategories
                          .filter((c) => c.type === form.watch("type"))
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày giao dịch</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="VD: Ăn sáng cùng đồng nghiệp..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Đang lưu..."
                  : isEditMode
                    ? "Cập nhật"
                    : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
