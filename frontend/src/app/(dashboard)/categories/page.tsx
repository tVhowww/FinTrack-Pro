"use client";

import { CategoryDialog } from "@/components/category/category-dialog";
import { CategoryItem } from "@/components/category/category-item";
import { CategoryFilter } from "@/components/category/category-filter"; // 👇 Import filter
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";
import { Category, TransactionType } from "@/types/category.dto";
import { Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function CategoriesPage() {
  const searchParams = useSearchParams();

  // Lấy params từ URL
  const activeType =
    (searchParams.get("type") as TransactionType) || TransactionType.EXPENSE;
  const searchKeyword = searchParams.get("keyword") || "";

  const {
    categories = [],
    isLoading,
    deleteCategory,
    isDeleting,
  } = useCategories();

  const { checkRelatedTransactions, isCheckingRelated: isCheckingDependency } =
    useTransactions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  const displayCategories = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const filteredByType = safeCategories.filter((c) => c.type === activeType);

    if (!searchKeyword.trim()) return filteredByType;

    const lowerKeyword = searchKeyword.toLowerCase();

    const filterTree = (cats: Category[]): Category[] => {
      return cats
        .map((cat) => {
          const isParentMatch = cat.name.toLowerCase().includes(lowerKeyword);
          const filteredChildren = cat.subCategories
            ? filterTree(cat.subCategories)
            : [];

          if (isParentMatch) return cat;
          if (filteredChildren.length > 0)
            return { ...cat, subCategories: filteredChildren };
          return null;
        })
        .filter(Boolean) as Category[];
    };

    return filterTree(filteredByType);
  }, [categories, activeType, searchKeyword]);

  const [relatedTransactions, setRelatedTransactions] = useState<any[]>([]);

  const handleCreateRoot = () => {
    setSelectedCategory(null);
    setParentCategory(null);
    setIsDialogOpen(true);
  };

  const handleAddChild = (parent: Category) => {
    setSelectedCategory(null);
    setParentCategory(parent);
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setParentCategory(null);
    setIsDialogOpen(true);
  };

  const handlePreDelete = async (id: string) => {
    setDeleteId(id);
    setRelatedTransactions([]);
    const transactions = await checkRelatedTransactions(id);
    setRelatedTransactions(transactions);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const categoryToDelete = deleteId
    ? findCategoryRecursive(categories, deleteId)
    : null;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* HEADER TỔNG */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Danh mục</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý các khoản thu chi của bạn.
          </p>
        </div>

        <Button onClick={handleCreateRoot} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Tạo danh mục mới
        </Button>
      </div>

      <CategoryFilter />

      {/* Container chính hiển thị dữ liệu */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Card className="h-full flex flex-col shadow-sm border-border/60">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-medium">
              Danh sách{" "}
              {activeType === TransactionType.EXPENSE ? "Chi tiêu" : "Thu nhập"}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Đang tải dữ liệu...
              </div>
            ) : displayCategories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center bg-muted/20">
                <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                  <Search className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {searchKeyword
                    ? "Không tìm thấy danh mục nào phù hợp."
                    : "Chưa có danh mục nào ở phân loại này."}
                </p>
                {!searchKeyword && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleCreateRoot}
                  >
                    Tạo danh mục ngay
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {displayCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onAddChild={handleAddChild}
                      onDelete={handlePreDelete}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categoryToEdit={selectedCategory}
        parentCategory={parentCategory}
        defaultType={activeType}
      />

      {/* ConfirmDialog giữ nguyên y hệt cũ, em cắt bớt cho gọn tin nhắn nhé */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Xóa danh mục "${categoryToDelete?.name}"?`}
        isLoading={isDeleting}
        confirmText="Xóa tất cả"
        variant="destructive"
      // ... (phần description giữ nguyên)
      />
    </div>
  );
}

function findCategoryRecursive(
  categories: Category[],
  id: string,
): Category | null {
  for (const cat of categories) {
    if (cat.id === id) return cat;
    if (cat.subCategories && cat.subCategories.length > 0) {
      const found = findCategoryRecursive(cat.subCategories, id);
      if (found) return found;
    }
  }
  return null;
}
