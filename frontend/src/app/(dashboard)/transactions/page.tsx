"use client";

import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { TransactionFilter } from "@/components/transaction/transaction-filter";
import { TransactionCard } from "@/components/transaction/transaction-card";
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
import {
  TransactionCreationRequest,
  TransactionQueryParams,
  TransactionResponse,
  TransactionType,
  TransactionUpdateRequest,
} from "@/types/transaction.dto";
import { Download, Loader2, Plus } from "lucide-react";
import { useState, useMemo, useCallback, Suspense } from "react";
import { getColumns } from "./columns";
import { useSearchParams } from "next/navigation";
import { useWallets } from "@/hooks/use-wallets";

function TransactionsPageContent() {
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const queryParams: TransactionQueryParams = useMemo(() => ({
    page: currentPage,
    size: pageSize,
    keyword: searchParams.get("keyword") || undefined,
    type: (searchParams.get("type") as TransactionType) || undefined,
    walletId: searchParams.get("walletId") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
  }), [currentPage, pageSize, searchParams]);

  const {
    data,
    isLoading,
    totalPages,
    deleteTransaction,
    isDeleting,
    createTransaction,
    updateTransaction,
    exportTransactions,
    isExporting,
    scanReceipt,
    isScanning,
  } = useTransactions(queryParams);

  const handleExport = () => {
    exportTransactions(queryParams);
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] =
    useState<TransactionResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setTransactionToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEdit = useCallback((transaction: TransactionResponse) => {
    setTransactionToEdit(transaction);
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteTransaction(deleteId);
      setDeleteId(null);
    }
  }, [deleteId, deleteTransaction]);

  const handleCreateSubmit = useCallback(async (data: TransactionCreationRequest) => {
    return await createTransaction(data);
  }, [createTransaction]);

  const handleUpdateSubmit = useCallback(async ({
    id,
    data,
  }: {
    id: string;
    data: TransactionUpdateRequest;
  }) => {
    return await updateTransaction({ id, data });
  }, [updateTransaction]);

  const { wallets } = useWallets();

  const handleSetDeleteId = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const columns = useMemo(() => getColumns(handleEdit, handleSetDeleteId, wallets), [handleEdit, handleSetDeleteId, wallets]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    window.history.pushState(null, "", `?${params.toString()}`);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Giao dịch</h2>
          <p className="text-sm text-muted-foreground">
            Lịch sử thu chi của bạn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Xuất
          </Button>

          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm giao dịch
          </Button>
        </div>
      </div>

      <TransactionFilter />

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">
            Đang tải dữ liệu...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
            Không tìm thấy giao dịch nào.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden md:block">
              <DataTable columns={columns} data={data} />
            </div>

            <div className="md:hidden space-y-3">
              {data.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  wallet={wallets.find((w) => w.id === tx.walletId)}
                  onEdit={handleEdit}
                  onDelete={setDeleteId}
                />
              ))}
            </div>

            {/* Pagination Logic */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(currentPage - 1, 1))
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
                            onClick={() => handlePageChange(page as number)}
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
                        handlePageChange(Math.min(currentPage + 1, totalPages))
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
        onScan={scanReceipt}
        isScanning={isScanning}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xóa giao dịch này?"
        description="Số tiền sẽ được hoàn lại vào ví của bạn."
        onConfirm={handleDelete}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex flex-col space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Giao dịch</h2>
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        </div>
        <div className="text-center py-10 text-muted-foreground">
          Đang tải dữ liệu...
        </div>
      </div>
    }>
      <TransactionsPageContent />
    </Suspense>
  );
}
