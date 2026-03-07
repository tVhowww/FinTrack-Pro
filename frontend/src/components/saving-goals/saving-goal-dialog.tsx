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
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SavingGoal } from "@/types/saving-goal.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const SavingGoalSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên mục tiêu"),
  targetAmount: z.coerce
    .number()
    .min(1000, "Số tiền mục tiêu phải lớn hơn 1000"),
  deadline: z.date({ required_error: "Vui lòng chọn hạn chót" }),
});

interface SavingGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
  goalToEdit?: SavingGoal | null;
}

export function SavingGoalDialog({
  open,
  onOpenChange,
  onSubmit,
  goalToEdit,
}: SavingGoalDialogProps) {
  const isEditing = !!goalToEdit;

  const form = useForm<z.infer<typeof SavingGoalSchema>>({
    resolver: zodResolver(SavingGoalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      deadline: new Date(), // Set Date Object
    },
  });

  useEffect(() => {
    if (open) {
      if (goalToEdit) {
        form.reset({
          name: goalToEdit.name,
          targetAmount: goalToEdit.targetAmount,
          // Convert string ISO từ BE thành Date object
          deadline: goalToEdit.deadline
            ? new Date(goalToEdit.deadline)
            : new Date(),
        });
      } else {
        form.reset({
          name: "",
          targetAmount: 0,
          deadline: new Date(),
        });
      }
    }
  }, [open, goalToEdit, form]);

  const handleSubmit = async (values: z.infer<typeof SavingGoalSchema>) => {
    const payload = {
      ...values,
      deadline: format(values.deadline, "yyyy-MM-dd"),
    };
    await onSubmit(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa mục tiêu tiết kiệm" : "Tạo quỹ tiết kiệm mới"}
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
                  <FormLabel>Tên mục tiêu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Mua xe máy, Du lịch Nhật..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền cần đạt</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="50000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hạn chót (Deadline)</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {form.formState.isSubmitting
                  ? "Đang xử lý..."
                  : isEditing
                    ? "Lưu thay đổi"
                    : "Bắt đầu tích lũy"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
