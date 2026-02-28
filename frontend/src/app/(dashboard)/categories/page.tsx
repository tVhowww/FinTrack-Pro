"use client";

import { CategoryDialog } from "@/components/category/category-dialog";
import { CategoryItem } from "@/components/category/category-item";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency } from "@/lib/utils";
import { Category, TransactionType } from "@/types/category.dto";
import {
  Plus,
  Inbox,
  AlertTriangle,
  Loader2,
  FileText,
  Search,
} from "lucide-react";
import { useState, useMemo } from "react";

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

  const [searchKeyword, setSearchKeyword] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // State Dialog
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  // =====================================================================
  // THUẬT TOÁN LỌC FRONTEND (Type + Keyword Đệ Quy)
  // =====================================================================
  const displayCategories = useMemo(() => {
    const safeCategories = Array.isArray(categories) ? categories : [];

    // Bước 1: Lọc theo Tab (Thu/Chi)
    const filteredByType = safeCategories.filter((c) => c.type === activeTab);

    // Bước 2: Lọc theo Keyword
    if (!searchKeyword.trim()) return filteredByType;

    const lowerKeyword = searchKeyword.toLowerCase();

    // Hàm đệ quy lọc cha con
    const filterTree = (cats: Category[]): Category[] => {
      return cats
        .map((cat) => {
          // Kiểm tra xem tên Cha có chứa từ khóa không
          const isParentMatch = cat.name.toLowerCase().includes(lowerKeyword);

          // Lọc các danh mục con (nếu có)
          const filteredChildren = cat.subCategories
            ? filterTree(cat.subCategories)
            : [];

          // Nếu Cha khớp -> Giữ nguyên Cha và toàn bộ Con của nó
          if (isParentMatch) {
            return cat;
          }

          // Nếu Cha KHÔNG khớp, nhưng có Đứa Con khớp -> Giữ lại Cha làm cái vỏ, và chỉ hiện những đứa Con khớp
          if (filteredChildren.length > 0) {
            return { ...cat, subCategories: filteredChildren };
          }

          // Không khớp gì cả -> Bỏ qua
          return null;
        })
        .filter(Boolean) as Category[]; // Loại bỏ các null
    };

    return filterTree(filteredByType);
  }, [categories, activeTab, searchKeyword]);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-1 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Danh mục</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý các khoản thu chi của bạn.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                className="pl-9 bg-background"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Button variant="secondary">Tìm</Button>
          </div>

          <Button
            onClick={handleCreateRoot}
            size="sm"
            className="h-10 w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Tạo mới
          </Button>
        </div>
      </div>

      {/* Container chính */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TransactionType);
            setSearchKeyword(""); // Chuyển Tab thì clear luôn tìm kiếm cho gọn
          }}
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
                ) : displayCategories.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <div className="bg-muted/50 p-4 rounded-full">
                      <Inbox className="w-8 h-8 opacity-50" />
                    </div>
                    {searchKeyword ? (
                      <p className="text-sm">
                        Không tìm thấy danh mục nào phù hợp.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm">Chưa có danh mục nào.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCreateRoot}
                        >
                          Tạo ngay
                        </Button>
                      </>
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

      {/* ConfirmDialog giữ nguyên ... */}
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
