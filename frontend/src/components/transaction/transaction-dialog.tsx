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
import { Camera, Loader2, Sparkles, X, Mic } from "lucide-react"; 
import { toast } from "sonner";

// Schema Validate
const TransactionSchema = z.object({
  amount: z.coerce.number().min(0, "Số tiền không hợp lệ"),
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
  onScan?: (payload: { file?: File; text?: string }) => Promise<any>;
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
  const [quickText, setQuickText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } else {
      setPreviewUrl(null);
      setQuickText("");
      setIsListening(false); // Tắt mic khi đóng
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

  const handleListen = () => {
    // Ép kiểu any để bypass TypeScript (vì trình duyệt có sẵn nhưng TS có thể ko nhận)
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        "Trình duyệt của bạn không hỗ trợ tính năng nhận diện giọng nói!",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN"; // Setup Tiếng Việt
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Đang nghe... Bạn nói đi!", {
        duration: 2000,
        position: "top-center",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuickText(transcript); // Ném chữ vào ô input
      // Có thể tự động gọi gửi AI luôn ở đây nếu muốn: handleProcessAI(undefined, transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Lỗi Mic:", event.error);
      setIsListening(false);
      toast.error("Không nghe rõ, bạn thử lại nhé!");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // HÀM XỬ LÝ GỬI AI (Text & File)
  const handleProcessAI = async (file?: File, text?: string) => {
    if ((!file && !text) || !onScan) return;

    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setQuickText("");
    }

    try {
      const result = await onScan({ file, text });

      if (result?.type)
        form.setValue("type", result.type as TransactionType, {
          shouldValidate: true,
        });
      if (result?.date)
        form.setValue("date", new Date(result.date), { shouldValidate: true });
      if (result?.note)
        form.setValue("note", result.note, { shouldValidate: true });
      if (result?.categoryId)
        form.setValue("categoryId", result.categoryId, {
          shouldValidate: true,
        });

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
              `Đã tự động đổi sang ví ${matchedWallet.name} (${billCurrency})`,
            );
          } else {
            form.setValue("amount", 0, { shouldValidate: true });
            toast.warning(
              `CẢNH BÁO: Giao dịch dùng ${billCurrency}, ví đang chọn là ${currentWallet.currency}. Hãy tự nhập số tiền!`,
            );
          }
        } else {
          form.setValue("amount", result.amount, { shouldValidate: true });
          toast.success("AI đã điền dữ liệu thành công!");
        }
      }
    } catch (error) {
      console.error("Lỗi AI:", error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Không xoá text ngay để user có thể nhìn thấy AI vừa nhận diện được câu gì
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
      <DialogContent
        className={`transition-all duration-300 ${previewUrl ? "sm:max-w-[800px]" : "sm:max-w-[500px]"}`}
      >
        <DialogHeader className="pr-6">
          <DialogTitle>
            {isEditMode ? "Cập nhật giao dịch" : "Thêm giao dịch mới"}
          </DialogTitle>
        </DialogHeader>

        {/* KHU VỰC TRỢ LÝ AI */}
        {!isEditMode && (
          <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 mb-2 space-y-2">
            <div className="flex items-center text-sm font-semibold text-purple-700">
              <Sparkles className="h-4 w-4 mr-1.5" /> Trợ lý AI (Text & Giọng
              nói)
            </div>

            <div className="flex gap-2 relative">
              <div className="relative flex-1">
                <Input
                  placeholder="VD: Nhận lương tháng này 20 triệu..."
                  className="bg-white border-purple-100 focus-visible:ring-purple-300 pr-10" // Cấp chỗ cho nút Mic
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (quickText.trim())
                        handleProcessAI(undefined, quickText);
                    }
                  }}
                  disabled={isScanning || isListening}
                />

                <button
                  type="button"
                  onClick={handleListen}
                  disabled={isScanning}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors
                    ${isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"}`}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                onClick={() => handleProcessAI(undefined, quickText)}
                disabled={isScanning || !quickText.trim()}
              >
                {isScanning && quickText ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Gửi"
                )}
              </Button>

              <div className="flex items-center px-1 text-muted-foreground text-xs uppercase font-medium">
                Hoặc
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleProcessAI(e.target.files?.[0])}
              />

              <Button
                type="button"
                variant="outline"
                className="shrink-0 border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
              >
                {isScanning && !quickText ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Tải ảnh
              </Button>
            </div>
          </div>
        )}

        <div
          className={previewUrl ? "grid grid-cols-1 md:grid-cols-2 gap-6" : ""}
        >
          {/* CỘT TRÁI: HIỂN THỊ ẢNH BILL */}
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
                {/* TOÀN BỘ CÁC INPUT DƯỚI NÀY GIỮ NGUYÊN (Type, Amount, Wallet, Date, Note...) */}
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
                  <Button
                    type="submit"
                    disabled={isLoading || isScanning || isListening}
                  >
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
