"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WalletDialog } from "@/components/wallet/wallet-dialog";
import { WalletCard } from "@/components/wallet/wallet-card";
import { WalletFilter } from "@/components/wallet/wallet-filter";
import { useWallets } from "@/hooks/use-wallets";
import { Wallet, WalletType } from "@/types/wallet.dto";
import { ArrowRightLeft, Plus, Search, Target, WalletIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useSearchParams } from "next/navigation";
import { WalletAddFundDialog } from "@/components/wallet/wallet-add-fund-dialog";
import { WalletWithdrawDialog } from "@/components/wallet/wallet-withdraw-dialog";
import { WalletTransferDialog } from "@/components/wallet/wallet-transfer-dialog";

export default function WalletsPage() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || undefined;
  const currency = searchParams.get("currency") || undefined;
  const currentType = searchParams.get("type") || "all";

  const { wallets, isLoading, deleteWallet, isDeleting } = useWallets({
    keyword,
    currency,
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createType, setCreateType] = useState<WalletType>(WalletType.BASIC);

  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [fundWallet, setFundWallet] = useState<Wallet | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawWallet, setWithdrawWallet] = useState<Wallet | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const handleAddFund = (wallet: Wallet) => {
    setFundWallet(wallet);
    setIsAddFundOpen(true);
  };

  const handleWithdraw = (wallet: Wallet) => {
    setWithdrawWallet(wallet);
    setIsWithdrawOpen(true);
  };

  const handleCreate = (type: WalletType = WalletType.BASIC) => {
    setSelectedWallet(null);
    setCreateType(type);
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

  const basicWallets = wallets.filter((w) => w.type !== WalletType.SAVING);
  const savingWallets = wallets.filter((w) => w.type === WalletType.SAVING);

  // CSS VŨ KHÍ: Dùng để làm vuốt ngang trên Mobile, ẩn thanh cuộn, và thành Grid trên PC
  const swipeableContainerClass =
    "flex overflow-x-auto pb-6 pt-2 gap-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  // Wrapper để mỗi Card chiếm 85% chiều rộng màn hình Mobile
  const swipeableItemClass =
    "min-w-[85vw] sm:min-w-[320px] snap-center md:min-w-0 h-full";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ví & Quỹ</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý dòng tiền chi tiêu và mục tiêu tích lũy
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsTransferOpen(true)}
            className="w-full sm:w-auto bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 h-11 sm:h-10"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Chuyển tiền
          </Button>
          <Button
            onClick={() => handleCreate(WalletType.BASIC)}
            className="w-full sm:w-auto h-11 sm:h-10"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm ví mới
          </Button>
        </div>
      </div>

      <WalletFilter />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <div className="bg-background p-4 rounded-full shadow-sm mb-4">
            <Search className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-muted-foreground font-medium">
            {keyword || (currency && currency !== "all")
              ? "Không tìm thấy kết quả phù hợp."
              : "Bạn chưa có ví hay quỹ nào. Hãy tạo mới để bắt đầu!"}
          </p>
          {!keyword && (!currency || currency === "all") && (
            <Button
              variant="outline"
              className="mt-4 h-11"
              onClick={handleCreate}
            >
              Tạo mới ngay
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* KHU VỰC 1: VÍ CHI TIÊU */}
          {(currentType === "all" || currentType === WalletType.BASIC) && (
            <div>
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <WalletIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  Ví chi tiêu hàng ngày
                </h3>
              </div>

              {/* Áp dụng Swipeable Carousel cho Mobile */}
              <div className={swipeableContainerClass}>
                {basicWallets.map((wallet) => (
                  <div key={wallet.id} className={swipeableItemClass}>
                    <WalletCard
                      wallet={wallet}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeleteId(id)}
                    />
                  </div>
                ))}

                <div className={swipeableItemClass}>
                  <button
                    onClick={() => handleCreate(WalletType.BASIC)}
                    className="group w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 p-8 text-center hover:bg-accent/50 hover:text-accent-foreground transition-all h-full min-h-[140px]"
                  >
                    <div className="rounded-full bg-background p-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm">Thêm ví mới</h3>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KHU VỰC 2: QUỸ TIẾT KIỆM */}
          {(currentType === "all" || currentType === WalletType.SAVING) && (
            <div>
              <div className="flex items-center gap-2 mb-4 border-b pb-2 mt-4">
                <div className="bg-emerald-500/10 p-1.5 rounded-md">
                  <Target className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-emerald-700">
                  Mục tiêu tiết kiệm
                </h3>
              </div>

              {savingWallets.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-xl bg-muted/10 text-muted-foreground text-sm">
                  Bạn chưa có quỹ tiết kiệm nào. Hãy đặt ra một mục tiêu mới!
                </div>
              ) : (
                <div className={swipeableContainerClass}>
                  {savingWallets.map((wallet) => (
                    <div key={wallet.id} className={swipeableItemClass}>
                      <WalletCard
                        wallet={wallet}
                        onEdit={handleEdit}
                        onDelete={(id) => setDeleteId(id)}
                        onAddFund={handleAddFund}
                        onWithdraw={handleWithdraw}
                      />
                    </div>
                  ))}
                  <div className={swipeableItemClass}>
                    <button
                      onClick={() => handleCreate(WalletType.SAVING)}
                      className="group w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 p-8 text-center hover:bg-accent/50 hover:text-accent-foreground transition-all h-full min-h-[140px]"
                    >
                      <div className="rounded-full bg-background p-3 shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-sm">Thêm quỹ mới</h3>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Các Dialog giữ nguyên gọi từ component con */}
      <WalletDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        walletToEdit={selectedWallet}
        defaultType={createType}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xóa ví/quỹ này?"
        description="Dữ liệu này sẽ bị ẩn. Bạn sẽ không thể giao dịch trên ví này nữa."
        onConfirm={handleDeleteExecute}
        isLoading={isDeleting}
      />
      <WalletAddFundDialog
        open={isAddFundOpen}
        onOpenChange={setIsAddFundOpen}
        wallet={fundWallet}
      />
      <WalletWithdrawDialog
        open={isWithdrawOpen}
        onOpenChange={setIsWithdrawOpen}
        wallet={withdrawWallet}
      />
      <WalletTransferDialog
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
      />
    </div>
  );
}
