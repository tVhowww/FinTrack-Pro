"use client";

import { CategoryDialog } from "@/components/category/category-dialog";
import { CategoryItem } from "@/components/category/category-item";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";
import { Category, TransactionType } from "@/types/category.dto";
import { Plus, Inbox, AlertTriangle, Loader2, FileText } from "lucide-react";
import { useState } from "react";

export default function CategoriesPage() {
  const {
    categories = [],
    isLoading,
    deleteCategory,
    isDeleting,
  } = useCategories();

  const { checkRelatedTransactions, isChecking: isCheckingDependency } =
    useTransactions();

  const [activeTab, setActiveTab] = useState<TransactionType>(
    TransactionType.EXPENSE,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // State Dialog
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  // Filter Safe
  const safeCategories = Array.isArray(categories) ? categories : [];
  const filteredCategories = safeCategories.filter((c) => c.type === activeTab);

  const [relatedTransactions, setRelatedTransactions] = useState<any[]>([]);

  // Handlers
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

    // Gọi qua Hook, không gọi Service trực tiếp
    const transactions = await checkRelatedTransactions(id);
    setRelatedTransactions(transactions);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const categoryToDelete = deleteId
    ? findCategoryRecursive(categories, deleteId)
    : null;

  return (
    <div className="h-full flex flex-col space-y-4">
      {" "}
      {/* Bỏ h-screen, dùng h-full của container cha */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Danh mục</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý các khoản thu chi của bạn.
          </p>
        </div>
        <Button onClick={handleCreateRoot} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Tạo mới
        </Button>
      </div>
      {/* Container chính: Flex-1 để chiếm hết chiều cao còn lại */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TransactionType)}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value={TransactionType.EXPENSE}>
              Khoản Chi (Expense)
            </TabsTrigger>
            <TabsTrigger value={TransactionType.INCOME}>
              Khoản Thu (Income)
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 mt-4 min-h-0">
            <Card className="h-full flex flex-col shadow-sm border-border/60">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-base font-medium">
                  Danh sách{" "}
                  {activeTab === TransactionType.EXPENSE
                    ? "Chi tiêu"
                    : "Thu nhập"}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    Đang tải dữ liệu...
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <div className="bg-muted/50 p-4 rounded-full">
                      <Inbox className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="text-sm">Chưa có danh mục nào.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateRoot}
                    >
                      Tạo ngay
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {filteredCategories.map((category) => (
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
          </TabsContent>
        </Tabs>
      </div>
      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categoryToEdit={selectedCategory}
        parentCategory={parentCategory}
        defaultType={activeTab}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Xóa danh mục "${categoryToDelete?.name}"?`}
        isLoading={isDeleting}
        confirmText="Xóa tất cả"
        variant="destructive"
        description={
          isCheckingDependency ? (
            <div className="flex items-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang kiểm tra dữ liệu liên quan...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                Bạn có chắc chắn muốn xóa danh mục{" "}
                <strong>{categoryToDelete?.name}</strong>
                {categoryToDelete?.subCategories?.length
                  ? " và tất cả danh mục con"
                  : ""}{" "}
                không?
              </div>

              {relatedTransactions.length > 0 ? (
                <div className="rounded-md border bg-amber-50/50 p-3 border-amber-200">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold mb-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Cảnh báo: Có giao dịch liên quan</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Các giao dịch sau đây sẽ bị xóa vĩnh viễn:
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                    {relatedTransactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="flex justify-between items-center bg-background p-2 rounded border text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[120px] text-muted-foreground">
                            {tx.note || "Không có ghi chú"}
                          </span>
                        </div>
                        <span
                          className={
                            tx.type === "EXPENSE"
                              ? "text-red-500 font-medium"
                              : "text-green-500 font-medium"
                          }
                        >
                          {tx.type === "EXPENSE" ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="text-center text-xs text-muted-foreground pt-1 italic">
                      (Hiển thị {relatedTransactions.length} giao dịch gần nhất)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 p-3 rounded-md border text-sm text-muted-foreground">
                  Danh mục này chưa có giao dịch nào. Bạn có thể xóa an toàn.
                </div>
              )}
              <p className="text-xs text-red-500 font-medium">
                * Hành động này không thể hoàn tác.
              </p>
            </div>
          )
        }
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
