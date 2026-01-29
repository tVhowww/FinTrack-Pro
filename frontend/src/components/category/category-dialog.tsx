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
      <DialogContent className="sm:max-w-[600px]">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên danh mục</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Ăn sáng, Cafe..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              {" "}
              {/* Tăng gap lên 6 */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
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
                          className={
                            isEditMode || isChildMode ? "bg-muted" : ""
                          }
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
                  <FormItem>
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
                        <SelectTrigger className="w-full">
                          {" "}
                          {/* Đảm bảo full width */}
                          {/* Thêm class truncate để cắt chữ nếu quá dài */}
                          <div className="truncate">
                            <SelectValue placeholder="Chọn danh mục cha" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem
                          value="root"
                          className="font-semibold text-primary"
                        >
                          -- Danh mục gốc (Không có cha) --
                        </SelectItem>
                        {eligibleParents.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Thông báo lỗi nếu không được di chuyển */}
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
                <FormItem>
                  <FormLabel>Mô tả (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú thêm về danh mục này..."
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
