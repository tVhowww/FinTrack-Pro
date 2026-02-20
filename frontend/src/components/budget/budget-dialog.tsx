"use client";

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
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useWallets } from "@/hooks/use-wallets";
import { Budget } from "@/types/budget.dto"; // Import Type Budget
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const BudgetSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên"),
  amount: z.coerce.number().min(0.1, "Hạn mức phải lớn hơn 0"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  walletId: z.string().optional(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
});

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
  budgetToEdit?: Budget | null;
}

export function BudgetDialog({
  open,
  onOpenChange,
  onSubmit,
  budgetToEdit,
}: BudgetDialogProps) {
  const { categories } = useCategories();
  const { wallets } = useWallets();
  const flattenCategories = categories.flatMap((c) => [
    c,
    ...(c.subCategories || []),
  ]);
  const expenseCategories = flattenCategories.filter(
    (c) => c.type === "EXPENSE",
  );

  const isEditing = !!budgetToEdit; // Đánh dấu trạng thái Edit

  const form = useForm<z.infer<typeof BudgetSchema>>({
    resolver: zodResolver(BudgetSchema),
    defaultValues: {
      name: "",
      amount: 0,
      categoryId: "",
      walletId: "all",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    if (open) {
      if (budgetToEdit) {
        form.reset({
          name: budgetToEdit.name,
          amount: budgetToEdit.amount,
          categoryId: budgetToEdit.categoryId,
          walletId: budgetToEdit.walletId || "all",
          month: budgetToEdit.month,
          year: budgetToEdit.year,
        });
      } else {
        form.reset({
          name: "",
          amount: 0,
          categoryId: "",
          walletId: "all",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
      }
    }
  }, [open, budgetToEdit, form]);

  const handleSubmit = async (values: z.infer<typeof BudgetSchema>) => {
    const payload = {
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
          <DialogTitle>
            {isEditing ? "Sửa hạn mức ngân sách" : "Tạo ngân sách mới"}
          </DialogTitle>
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
                  <FormLabel>Hạn mức</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CÁC TRƯỜNG BÊN DƯỚI BỊ KHÓA NẾU ĐANG EDIT */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Áp dụng cho ví</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
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
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
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
                      <Input
                        type="number"
                        min={2020}
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">
                {isEditing ? "Lưu thay đổi" : "Lưu ngân sách"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
