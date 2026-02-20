"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { generatePagination } from "@/lib/utils";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionResponse } from "@/types/transaction.dto";
import { Plus } from "lucide-react";
import { useState } from "react";
import { getColumns } from "./columns";
import {
  TransactionCreationRequest,
  TransactionUpdateRequest,
} from "@/types/transaction.dto";
import { useWallets } from "@/hooks/use-wallets";

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Gọi Hook
  const {
    data,
    isLoading,
    totalPages,
    deleteTransaction,
    isDeleting,
    createTransaction,
    updateTransaction,
  } = useTransactions({
    page: currentPage,
    size: pageSize,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<TransactionResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Handlers UI
  const handleCreate = () => {
    setTransactionToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (transaction: TransactionResponse) => {
    setTransactionToEdit(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  const handleCreateSubmit = async (data: TransactionCreationRequest) => {
    return await createTransaction(data);
  };

  const handleUpdateSubmit = async ({
    id,
    data,
  }: {
    id: string;
    data: TransactionUpdateRequest;
  }) => {
    return await updateTransaction({ id, data });
  };

  const { wallets } = useWallets();

  const columns = getColumns(handleEdit, (t) => setDeleteId(t.id), wallets);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Giao dịch</h2>
          <p className="text-sm text-muted-foreground">
            Lịch sử thu chi của bạn.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm giao dịch
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable columns={columns} data={data} />

            {/* Pagination Logic */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {generatePagination(currentPage, totalPages).map(
                    (page, index) => (
                      <PaginationItem key={index}>
                        {page === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => setCurrentPage(page as number)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>

      <TransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transactionToEdit={transactionToEdit}
        onCreate={handleCreateSubmit}
        onUpdate={handleUpdateSubmit}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xóa giao dịch này?"
        description="Số tiền sẽ được hoàn lại vào ví của bạn."
        onConfirm={handleDelete}
        isLoading={isDeleting} // State từ Hook
        variant="destructive"
      />
    </div>
  );
}
