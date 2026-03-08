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
import { SavingGoal } from "@/types/saving-goal.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, PiggyBank } from "lucide-react";
import { useEffect } from "react";

const FundSchema = z.object({
  amount: z.coerce.number().min(1000, "Số tiền nạp tối thiểu là 1000"),
});

interface AddFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (amount: number) => Promise<any>;
  goal: SavingGoal | null;
}

export function AddFundDialog({
  open,
  onOpenChange,
  onSubmit,
  goal,
}: AddFundDialogProps) {
  const form = useForm<z.infer<typeof FundSchema>>({
    resolver: zodResolver(FundSchema),
    defaultValues: { amount: 0 },
  });

  useEffect(() => {
    if (open) form.reset({ amount: 0 });
  }, [open, form]);

  const handleSubmit = async (values: z.infer<typeof FundSchema>) => {
    await onSubmit(values.amount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-emerald-500" />
            Nạp tiền vào quỹ: {goal?.name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền muốn nạp thêm</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="VD: 500000"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Xác nhận nạp tiền
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
