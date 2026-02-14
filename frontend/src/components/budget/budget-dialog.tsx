"use client";

import { Button } from "@/components/ui/button";
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
import { useCategories } from "@/hooks/use-categories"; // Hook có sẵn
import { useWallets } from "@/hooks/use-wallets"; // Hook có sẵn
import { BudgetCreationRequest } from "@/types/budget.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Schema Validation
const BudgetSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  amount: z.coerce.number().min(1000, "Hạn mức tối thiểu 1.000đ"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  walletId: z.string().optional(), // Có thể rỗng (Global)
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
});

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetCreationRequest) => Promise<any>; // Hàm submit từ cha truyền xuống
}

export function BudgetDialog({
  open,
  onOpenChange,
  onSubmit,
}: BudgetDialogProps) {
  const { categories } = useCategories();
  const { wallets } = useWallets();

  // Làm phẳng danh mục (nếu có subCategories)
  const flattenCategories = categories.flatMap((c) => [
    c,
    ...(c.subCategories || []),
  ]);
  // Chỉ lấy danh mục CHI TIÊU (EXPENSE)
  const expenseCategories = flattenCategories.filter(
    (c) => c.type === "EXPENSE",
  );

  const form = useForm<z.infer<typeof BudgetSchema>>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: {
      name: "",
      amount: 0,
      categoryId: "",
      walletId: "all", // Mặc định chọn tất cả
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  // Reset form khi mở dialog
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        amount: 0,
        categoryId: "",
        walletId: "all",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    }
  }, [open, form]);

  const handleSubmit = async (values: z.infer<typeof BudgetSchema>) => {
    // Xử lý logic Global Budget: Nếu chọn "all" -> gửi null/undefined lên server
    const payload: BudgetCreationRequest = {
      ...values,
      walletId: values.walletId === "all" ? null : values.walletId,
    };

    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo ngân sách mới</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ngân sách</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Ăn uống tháng này" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hạn mức (VND)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Chọn Ví (Có option Tất cả) */}
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Áp dụng cho ví</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn ví" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Ngân sách chung</SelectItem>
                        {wallets.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tháng</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={12} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm</FormLabel>
                    <FormControl>
                      <Input type="number" min={2020} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Lưu ngân sách</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
