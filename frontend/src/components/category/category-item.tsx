"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Category } from "@/types/category.dto";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  FolderPlus,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import { useState } from "react";

interface CategoryItemProps {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onAddChild: (parent: Category) => void;
  onDelete: (id: string) => void;
  parentId?: string | null;
}

export function CategoryItem({
  category,
  level = 0,
  onEdit,
  onAddChild,
  onDelete,
  parentId = null,
}: CategoryItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren =
    category.subCategories && category.subCategories.length > 0;

  const isSystem = !category.userId;

  const showActionMenu = level === 0 || !isSystem;

  const handleEdit = () => {
    onEdit({ ...category, parentId: parentId });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "flex items-center justify-between p-2 rounded-md group transition-all duration-200 border border-transparent",
          "hover:bg-accent hover:border-border/50", // Hiệu ứng hover đẹp hơn
          level > 0 &&
            "ml-6 mt-1 border-l-2 border-l-muted pl-3 border-y-0 border-r-0 rounded-none hover:rounded-md", // Thụt lề bằng margin thay vì padding để đỡ vỡ
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {" "}
          {/* min-w-0 để truncate hoạt động */}
          {/* Nút đóng mở */}
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6 shrink-0" />
          )}
          {/* Nội dung text */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  isSystem && "text-primary",
                )}
              >
                {category.name}
              </span>
              {isSystem && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1 shrink-0"
                >
                  Mặc định
                </Badge>
              )}
            </div>

            {/* Mô tả tự động cắt nếu dài */}
            {category.description && (
              <span className="text-xs text-muted-foreground truncate block w-full">
                {category.description}
              </span>
            )}
          </div>
        </div>

        {/* Nút Action: Hiện luôn trên mobile, ẩn trên desktop và hiện khi hover */}
        {showActionMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {level === 0 && (
                <DropdownMenuItem onClick={() => onAddChild(category)}>
                  <FolderPlus className="mr-2 h-4 w-4" /> Thêm danh mục con
                </DropdownMenuItem>
              )}

              {!isSystem && (
                <>
                  {level === 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" /> Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(category.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" /> Xóa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      <CollapsibleContent>
        {hasChildren &&
          category.subCategories!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
              parentId={category.id}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
