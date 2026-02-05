import { statisticsService } from "@/services/statistics.service";
import { transactionService } from "@/services/transaction.service";
import { useQuery } from "@tanstack/react-query";

export function useStatistics(
  walletId?: string,
  month?: number,
  year?: number,
) {
  // Mặc định lấy tháng/năm hiện tại nếu không truyền vào
  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  // 1. Query lấy xu hướng dòng tiền (Trend)
  const trendQuery = useQuery({
    queryKey: ["statistics", "trend", walletId],
    queryFn: () => statisticsService.getTrend(walletId),
    // Giữ data cũ khi đang fetch mới để UI không bị nháy (Optional)
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 2. Query lấy cơ cấu chi tiêu (Structure)
  const structureQuery = useQuery({
    queryKey: ["statistics", "structure", walletId, currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getStructure(currentMonth, currentYear, walletId),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 3. Query Monthly Stats
  const monthlyQuery = useQuery({
    queryKey: ["statistics", "monthly", walletId, currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getMonthlyStats(currentMonth, currentYear, walletId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 4. Query lấy 5 giao dịch gần nhất
  const recentTransactionsQuery = useQuery({
    queryKey: ["transactions", "recent", walletId],
    queryFn: () => transactionService.getRecent(walletId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // 5. Query lấy 5 khoản chi tiêu cao nhất trong tháng
  const highestExpenseQuery = useQuery({
    queryKey: ["statistics", "highest", walletId, currentMonth, currentYear],
    queryFn: () =>
      statisticsService.getHighestExpenses(currentMonth, currentYear, walletId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    trendData: trendQuery.data || [],
    isLoadingTrend: trendQuery.isLoading,
    isErrorTrend: trendQuery.isError,

    structureData: structureQuery.data || [],
    isLoadingStructure: structureQuery.isLoading,
    isErrorStructure: structureQuery.isError,
    monthlyStats: monthlyQuery.data || {
      totalIncome: 0,
      totalExpense: 0,
      netSavings: 0,
    },
    isLoadingMonthly: monthlyQuery.isLoading,

    recentTransactions: recentTransactionsQuery.data || [],
    isLoadingRecent: recentTransactionsQuery.isLoading,

    highestExpenses: highestExpenseQuery.data || [],
    isLoadingHighest: highestExpenseQuery.isLoading,

    refetch: () => {
      trendQuery.refetch();
      structureQuery.refetch();
    },
  };
}
