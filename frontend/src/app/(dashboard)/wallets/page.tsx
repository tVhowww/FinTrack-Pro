"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletDialog } from "@/components/wallet/wallet-dialog";
import { WalletCard } from "@/components/wallet/wallet-card";
import { WalletFilter } from "@/components/wallet/wallet-filter";
import { useWallets } from "@/hooks/use-wallets";
import { Wallet } from "@/types/wallet.dto";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useSearchParams } from "next/navigation";

export default function WalletsPage() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || undefined;
  const currency = searchParams.get("currency") || undefined;

  const { wallets, isLoading, deleteWallet, isDeleting } = useWallets({
    keyword,
    currency,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedWallet(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsDialogOpen(true);
  };

  const handleDeleteExecute = () => {
    if (deleteId) {
      deleteWallet(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ví của tôi</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý các nguồn tiền của bạn
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Thêm ví mới
        </Button>
      </div>

      <WalletFilter />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wallets.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4">
                <Search className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground font-medium">
                {keyword || (currency && currency !== "all")
                  ? "Không tìm thấy ví nào phù hợp với bộ lọc."
                  : "Bạn chưa có ví nào. Hãy tạo một ví mới để bắt đầu!"}
              </p>
              {!keyword && (!currency || currency === "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleCreate}
                >
                  Tạo ví ngay
                </Button>
              )}
            </div>
          ) : (
            <>
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}

              <button
                onClick={handleCreate}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 p-8 text-center hover:bg-accent/50 hover:text-accent-foreground transition-all h-full min-h-[150px]"
              >
                <div className="rounded-full bg-background p-3 shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">Thêm ví mới</h3>
                  <p className="text-xs text-muted-foreground">
                    Tạo ví để quản lý nguồn tiền
                  </p>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      <WalletDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        walletToEdit={selectedWallet}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xóa ví này?"
        description="Ví này sẽ bị vô hiệu hóa và ẩn khỏi danh sách của bạn. Bạn sẽ không thể thực hiện giao dịch mới trên ví này nữa."
        onConfirm={handleDeleteExecute}
        isLoading={isDeleting}
      />
    </div>
  );
}
