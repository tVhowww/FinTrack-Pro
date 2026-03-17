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
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-categories";
import {
  Category,
  CategoryFormValues,
  CategorySchema,
  TransactionType,
} from "@/types/category.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react"; // Bổ sung icon Load

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: Category | null;
  parentCategory?: Category | null;
  defaultType?: TransactionType;
}

export function CategoryDialog({
  open,
  onOpenChange,
  categoryToEdit,
  parentCategory,
  defaultType = TransactionType.EXPENSE,
}: CategoryDialogProps) {
  const { categories, createCategory, updateCategory, isCreating, isUpdating } =
    useCategories();

  const isEditMode = !!categoryToEdit;
  const isChildMode = !!parentCategory;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategorySchema),
    defaultValues: {
      name: "",
      type: defaultType,
      description: "",
      parentId: null,
    },
  });

  const currentType = form.watch("type");

  const eligibleParents = useMemo(() => {
    let roots = categories.filter((c) => c.type === currentType);
    if (isEditMode && categoryToEdit) {
      roots = roots.filter((c) => c.id !== categoryToEdit.id);
      if (
        categoryToEdit.subCategories &&
        categoryToEdit.subCategories.length > 0
      ) {
        return [];
      }
    }
    return roots;
  }, [categories, currentType, isEditMode, categoryToEdit]);

  useEffect(() => {
    if (open) {
      if (categoryToEdit) {
        form.reset({
          name: categoryToEdit.name,
          type: categoryToEdit.type,
          description: categoryToEdit.description || "",
          parentId: categoryToEdit.parentId || null,
        });
      } else if (parentCategory) {
        form.reset({
          name: "",
          type: parentCategory.type,
          description: "",
          parentId: parentCategory.id,
        });
      } else {
        form.reset({
          name: "",
          type: defaultType,
          description: "",
          parentId: null,
        });
      }
    }
  }, [open, categoryToEdit, parentCategory, defaultType, form]);

  const onSubmit = (values: CategoryFormValues) => {
    const submitData = {
      ...values,
      parentId: values.parentId === "root" ? null : values.parentId,
    };

    if (isEditMode && categoryToEdit) {
      updateCategory(
        { id: categoryToEdit.id, data: submitData },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createCategory(submitData, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? "Cập nhật danh mục"
              : isChildMode
                ? `Thêm danh mục con`
                : "Tạo danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Thay đổi thông tin danh mục."
              : "Tạo danh mục để phân loại các giao dịch của bạn."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-1"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel>Tên danh mục</FormLabel>
                  <FormControl>
                    <Input
                      className="h-12 text-base"
                      placeholder="Ví dụ: Ăn sáng, Cafe..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full min-w-0 overflow-hidden">
                    <FormLabel>Loại giao dịch</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("parentId", null);
                      }}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={isEditMode || isChildMode}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={`h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block ${
                            isEditMode || isChildMode ? "bg-muted" : ""
                          }`}
                        >
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TransactionType.EXPENSE}>
                          Chi tiêu (Expense)
                        </SelectItem>
                        <SelectItem value={TransactionType.INCOME}>
                          Thu nhập (Income)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full min-w-0 overflow-hidden">
                    <FormLabel>Danh mục cha</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "root"}
                      disabled={
                        (isEditMode && !categoryToEdit?.userId) ||
                        eligibleParents.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full max-w-full [&>span]:flex-1 [&>span]:text-left [&>span]:truncate [&>span]:overflow-hidden block">
                          <SelectValue placeholder="Chọn danh mục cha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-w-[85vw] sm:max-w-[300px]">
                        <SelectItem
                          value="root"
                          className="font-semibold text-primary"
                        >
                          -- Danh mục gốc --
                        </SelectItem>
                        {eligibleParents.map((parent) => (
                          <SelectItem
                            key={parent.id}
                            value={parent.id}
                            className="py-2 max-w-full overflow-hidden"
                          >
                            <div className="w-full text-left truncate pr-2">
                              {parent.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {eligibleParents.length === 0 && isEditMode && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Không thể di chuyển vì đã có danh mục con.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-col w-full min-w-0">
                  <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú thêm về danh mục này..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 pb-4 mt-4">
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
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
