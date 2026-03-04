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
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getCurrencySymbol } from "@/lib/constants";
import { Loader2, Wand2, X } from "lucide-react";
import { toast } from "sonner";

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
  onScan?: (file: File) => Promise<any>;
  isScanning?: boolean;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transactionToEdit,
  onCreate,
  onUpdate,
  onScan,
  isScanning = false,
}: TransactionDialogProps) {
  const isEditMode = !!transactionToEdit;
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { categories } = useCategories();

  // Fetch Wallets
  useEffect(() => {
    if (open) {
      walletService
        .getAll()
        .then((res) => {
          if (res && res.result) setWallets(res.result);
          else if (Array.isArray(res)) setWallets(res);
        })
        .catch(console.error);
    } else {
      // Reset ảnh preview khi đóng Dialog
      setPreviewUrl(null);
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

  // Reset Form
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

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onScan) return;

    // 1. Tạo URL ảnh để hiển thị ngay lập tức lên UI
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const result = await onScan(file);

      // 2. Điền thông tin cơ bản
      if (result?.date)
        form.setValue("date", new Date(result.date), { shouldValidate: true });
      if (result?.note)
        form.setValue("note", result.note, { shouldValidate: true });
      if (result?.categoryId)
        form.setValue("categoryId", result.categoryId, {
          shouldValidate: true,
        });

      // 3. Logic Currency & Bắn đúng 1 cái Toast
      if (result?.amount !== undefined) {
        const currentWalletId = form.getValues("walletId");
        const currentWallet = wallets.find((w) => w.id === currentWalletId);
        const billCurrency =
          result.currency || currentWallet?.currency || "VND";

        if (currentWallet && currentWallet.currency !== billCurrency) {
          const matchedWallet = wallets.find(
            (w) => w.currency === billCurrency,
          );

          if (matchedWallet) {
            form.setValue("walletId", matchedWallet.id, {
              shouldValidate: true,
            });
            form.setValue("amount", result.amount, { shouldValidate: true });
            toast.success(
              `Đã quét xong & Tự động đổi sang ví ${matchedWallet.name} (${billCurrency})`,
            );
          } else {
            form.setValue("amount", 0, { shouldValidate: true });
            toast.warning(
              `Quét thành công! CẢNH BÁO: Hóa đơn dùng ${billCurrency}, ví đang chọn là ${currentWallet.currency}. Hãy tự nhập số tiền!`,
            );
          }
        } else {
          form.setValue("amount", result.amount, { shouldValidate: true });
          toast.success("Quét hóa đơn và điền dữ liệu thành công!");
        }
      }
    } catch (error) {
      console.error("Lỗi khi quét hóa đơn:", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    setIsLoading(true);
    try {
      const payloadCommon = {
        ...values,
        categoryId: values.categoryId || undefined,
      };
      if (isEditMode && transactionToEdit) {
        await onUpdate({ id: transactionToEdit.id, data: payloadCommon });
      } else {
        await onCreate(payloadCommon);
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
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
      {/* Đổi max-width linh hoạt: Có ảnh thì phình ra 800px, ko ảnh thì 500px */}
      <DialogContent
        className={`transition-all duration-300 ${previewUrl ? "sm:max-w-[800px]" : "sm:max-w-[500px]"}`}
      >
        <DialogHeader className="flex flex-row justify-between items-center pr-6">
          <DialogTitle>
            {isEditMode ? "Cập nhật giao dịch" : "Thêm giao dịch mới"}
          </DialogTitle>

          {!isEditMode && (
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleScanReceipt}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                {isScanning ? "Đang phân tích..." : "Quét bằng AI"}
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* Bố cục Grid: 2 cột nếu có ảnh, 1 cột nếu ko có ảnh */}
        <div
          className={previewUrl ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}
        >
          {/* CỘT TRÁI: HIỂN THỊ ẢNH BILL (Chỉ hiện khi có previewUrl) */}
          {previewUrl && (
            <div className="flex flex-col items-center justify-start bg-muted/30 rounded-lg p-2 border">
              <div className="relative w-full flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-background border shadow-sm absolute top-0 right-0"
                  onClick={() => setPreviewUrl(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <img
                src={previewUrl}
                alt="Bill Preview"
                className="max-h-[400px] object-contain rounded-md"
              />
            </div>
          )}

          {/* CỘT PHẢI: FORM NHẬP LIỆU */}
          <div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Các Input Fields bên dưới giữ nguyên */}
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
                              placeholder="VD: 50000"
                              className="pr-8"
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
                        disabled={isEditMode}
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
                          placeholder="VD: Ăn sáng..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isLoading || isScanning}>
                    {isLoading
                      ? "Đang lưu..."
                      : isEditMode
                        ? "Cập nhật"
                        : "Tạo mới"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
