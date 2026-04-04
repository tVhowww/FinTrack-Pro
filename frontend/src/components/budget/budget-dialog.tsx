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
import { Budget } from "@/types/budget.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { getCurrencyFormatConfig } from "@/lib/constants";

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

  const isEditing = !!budgetToEdit;

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa hạn mức ngân sách" : "Tạo ngân sách mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 px-1"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel>Tên ngân sách</FormLabel>
                  <FormControl>
                    <Input
                      className="h-12 text-base"
                      placeholder="VD: Ăn uống tháng này"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel>Hạn mức</FormLabel>
                  <FormControl>
                    <NumericFormat
                      customInput={Input}
                      {...getCurrencyFormatConfig("VND")}
                      allowNegative={false}
                      value={field.value === 0 ? "" : field.value}
                      onValueChange={(values) =>
                        field.onChange(values.floatValue || 0)
                      }
                      className="h-12 text-lg font-bold"
                      placeholder="5,000,000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full min-w-0 overflow-hidden">
                    <FormLabel>Áp dụng cho ví</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block">
                          <SelectValue placeholder="Chọn ví" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-[85vw] sm:max-w-[300px]">
                        <SelectItem value="all">Ngân sách chung</SelectItem>
                        {wallets.map((w) => (
                          <SelectItem
                            key={w.id}
                            value={w.id}
                            className="py-2 max-w-full overflow-hidden"
                          >
                            <div className="w-full text-left truncate pr-2">
                              {w.name}
                            </div>
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
                  <FormItem className="flex flex-col w-full min-w-0 overflow-hidden">
                    <FormLabel>Danh mục</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block">
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-[85vw] sm:max-w-[300px]">
                        {expenseCategories.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.id}
                            className="py-2 max-w-full overflow-hidden"
                          >
                            <div className="w-full text-left truncate pr-2">
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 w-full min-w-0">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem className="flex flex-col min-w-0">
                    <FormLabel>Tháng</FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 text-center text-lg"
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
                  <FormItem className="flex flex-col min-w-0">
                    <FormLabel>Năm</FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 text-center text-lg"
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

            <DialogFooter className="pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 pb-4 mt-4">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                {form.formState.isSubmitting
                  ? "Đang xử lý..."
                  : isEditing
                    ? "Lưu thay đổi"
                    : "Lưu ngân sách"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
