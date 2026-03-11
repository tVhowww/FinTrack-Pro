import { statisticsService } from "@/services/statistics.service";
import { transactionService } from "@/services/transaction.service";
import { useQuery } from "@tanstack/react-query";

export function useStatistics(
  walletId?: string,
  month?: number,
  year?: number,
) {
  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  // Chỉ chặn khi nó là chuỗi "undefined" (lỗi router/params chưa load xong).
  // Nếu walletId là null/undefined/rỗng -> VẪN CHO CHẠY (Backend sẽ tự hiểu là lấy All Wallets)
  const isEnabled = walletId !== "undefined";

  // 1. Xu hướng dòng tiền (Trend)
  const trendQuery = useQuery({
    queryKey: ["statistics", "trend", walletId],
    queryFn: () => statisticsService.getTrend(walletId),
    enabled: isEnabled, // Đã sửa logic
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

  // 2. Cơ cấu chi tiêu (Structure)
  const structureQuery = useQuery({
    queryKey: ["statistics", "structure", walletId, currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getStructure(currentMonth, currentYear, walletId),
    enabled: isEnabled,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Monthly Stats
  const monthlyQuery = useQuery({
    queryKey: ["statistics", "monthly", walletId, currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getMonthlyStats(currentMonth, currentYear, walletId),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
  });

  // 4. Giao dịch gần nhất
  const recentTransactionsQuery = useQuery({
    queryKey: ["transactions", "recent", walletId],
    queryFn: () => transactionService.getRecent(walletId),
    enabled: isEnabled,
    staleTime: 1000 * 60,
  });

  // 5. Chi tiêu cao nhất
  const highestExpenseQuery = useQuery({
    queryKey: ["statistics", "highest", walletId, currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getHighestExpenses(currentMonth, currentYear, walletId),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
  });

  // 6. Lấy tổng tiền ví
  const totalBalance = useQuery({
    queryKey: ["statistics", "totalBalance"],
    queryFn: () => statisticsService.getTotalBalance(),
    enabled: isEnabled,
    staleTime: 1000 * 60,
  });

  return {
    trendData: trendQuery.data || [],
    isLoadingTrend: trendQuery.isLoading && isEnabled,
    isErrorTrend: trendQuery.isError,

    structureData: structureQuery.data || [],
    isLoadingStructure: structureQuery.isLoading && isEnabled,
    isErrorStructure: structureQuery.isError,

    monthlyStats: monthlyQuery.data || {
      totalIncome: 0,
      totalExpense: 0,
      netSavings: 0,
    },
    isLoadingMonthly: monthlyQuery.isLoading && isEnabled,

    recentTransactions: recentTransactionsQuery.data || [],
    isLoadingRecent: recentTransactionsQuery.isLoading && isEnabled,

    highestExpenses: highestExpenseQuery.data || [],
    isLoadingHighest: highestExpenseQuery.isLoading && isEnabled,
    totalBalance: totalBalance.data || 0,

    refetch: () => {
      trendQuery.refetch();
      structureQuery.refetch();
      monthlyQuery.refetch();
      recentTransactionsQuery.refetch();
      highestExpenseQuery.refetch();
      totalBalance.refetch();
    },
  };
}
