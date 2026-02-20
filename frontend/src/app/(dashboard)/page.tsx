"use client";

import { BalanceChart } from "@/components/dashboard/balance-chart";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { HighestSpend } from "@/components/dashboard/highest-spend";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatistics } from "@/hooks/use-statistics";
import { useUser } from "@/hooks/use-user";
import { useWallets } from "@/hooks/use-wallets";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Activity, ArrowDown, ArrowUp, DollarSign, Wallet } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();

  const baseCurrency = user?.baseCurrency || "VND";

  // 1. Lấy dữ liệu thống kê (Trend & Structure)
  const {
    trendData,
    structureData,
    isLoadingTrend,
    isLoadingStructure,
    isLoadingRecent,
    recentTransactions,
    monthlyStats,
    highestExpenses,
    isLoadingHighest,
    totalBalance,
  } = useStatistics();

  // 2. Lấy dữ liệu Ví (để tính tổng số dư hiện tại)
  const { wallets } = useWallets();

  // Tính toán số liệu cho Cards Summary
  // Dữ liệu trendData trả về từ cũ đến mới (Backend loop 5->0 và add vào list),
  // nên phần tử cuối cùng là tháng hiện tại.
  const currentMonthData =
    trendData.length > 0
      ? trendData[trendData.length - 1]
      : { income: 0, expense: 0, netSavings: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Xin chào, {user?.fullName || "bạn"}!
        </h2>
      </div>

      {/* Grid thống kê (Cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng số dư */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số dư</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalBalance, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trên {wallets.length} ví đang hoạt động
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Thu nhập tháng này */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Thu nhập (Tháng này)
            </CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(monthlyStats.totalIncome, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dòng tiền vào</p>
          </CardContent>
        </Card>

        {/* Card 3: Chi tiêu tháng này */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chi tiêu (Tháng này)
            </CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyStats.totalExpense, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dòng tiền ra</p>
          </CardContent>
        </Card>

        {/* Card 4: Số dư trong tháng (Net Savings) */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tiết kiệm (Tháng này)
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyStats.netSavings, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Thu nhập - Chi tiêu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Khu vực Biểu đồ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Biểu đồ cột chiếm 4 phần */}
        <BalanceChart data={trendData} isLoading={isLoadingTrend} />

        {/* Biểu đồ tròn chiếm 3 phần */}
        <ExpensePieChart data={structureData} isLoading={isLoadingStructure} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Cột trái: Giao dịch gần đây (Chiếm 4 phần) */}
        <div className="lg:col-span-4 h-full">
          <RecentTransactions
            data={recentTransactions}
            isLoading={isLoadingRecent}
          />
        </div>

        {/* Cột phải: Top chi tiêu (Chiếm 3 phần) */}
        <div className="lg:col-span-3 h-full">
          <HighestSpend data={highestExpenses} isLoading={isLoadingHighest} />
        </div>
      </div>
    </div>
  );
}
