"use client";

import { BalanceChart } from "@/components/dashboard/balance-chart";
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart";
import { HighestSpend } from "@/components/dashboard/highest-spend";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStatistics } from "@/hooks/use-statistics";
import { useUser } from "@/hooks/use-user";
import { useWallets } from "@/hooks/use-wallets";
import { formatCurrency } from "@/lib/utils";
import { Activity, ArrowDown, ArrowUp, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const baseCurrency = user?.baseCurrency || "VND";

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

  const { wallets } = useWallets();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Xin chào, {user?.fullName || "bạn"}!
        </h2>
      </div>

      {/* Grid 4 Cards Summary: Tự động 1 cột (Mobile), 2 cột (Tablet), 4 cột (Desktop) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng số dư */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số dư</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-primary truncate">
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
            <CardTitle className="text-sm font-medium">Thu nhập (Tháng này)</CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 truncate">
              {formatCurrency(monthlyStats.totalIncome, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dòng tiền vào</p>
          </CardContent>
        </Card>

        {/* Card 3: Chi tiêu tháng này */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi tiêu (Tháng này)</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600 truncate">
              {formatCurrency(monthlyStats.totalExpense, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dòng tiền ra</p>
          </CardContent>
        </Card>

        {/* Card 4: Số dư trong tháng */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiết kiệm (Tháng này)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold truncate">
              {formatCurrency(monthlyStats.netSavings, baseCurrency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Thu nhập - Chi tiêu</p>
          </CardContent>
        </Card>
      </div>

      {/* Khu vực Biểu đồ: 1 cột (Mobile), chia 7 cột tỷ lệ 4:3 (Desktop) */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Wrapper ngoài quản lý độ rộng, bên trong Component chỉ cần w-full */}
        <div className="lg:col-span-4 w-full h-[350px] sm:h-[400px]">
          <BalanceChart
            data={trendData}
            isLoading={isLoadingTrend}
            baseCurrency={baseCurrency}
          />
        </div>

        <div className="lg:col-span-3 w-full h-[350px] sm:h-[400px]">
          <ExpensePieChart
            data={structureData}
            isLoading={isLoadingStructure}
            baseCurrency={baseCurrency}
          />
        </div>
      </div>

      {/* Khu vực Danh sách Giao dịch */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4 h-full">
          <RecentTransactions
            data={recentTransactions}
            isLoading={isLoadingRecent}
          />
        </div>
        <div className="lg:col-span-3 h-full">
          <HighestSpend 
            data={highestExpenses} 
            isLoading={isLoadingHighest} 
          />
        </div>
      </div>
    </div>
  );
}