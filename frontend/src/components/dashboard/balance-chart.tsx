"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BalanceTrend } from "@/types/statistics.dto";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface BalanceChartProps {
  data: BalanceTrend[];
  isLoading: boolean;
  baseCurrency?: string;
}

export function BalanceChart({
  data,
  isLoading,
  baseCurrency,
}: BalanceChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-xl" />;
  }

  // Backend trả về từ Quá khứ -> Hiện tại (Ascending), phù hợp để vẽ trục X từ trái qua phải
  const chartData = data.map((item) => ({
    ...item,
    name: `T${item.month}`,
  }));

  return (
    <Card className="col-span-4 shadow-sm">
      <CardHeader>
        <CardTitle>Xu hướng dòng tiền (6 tháng)</CardTitle>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} // Rút gọn: 1M, 2M
              />
              <Tooltip
                formatter={(value: number) =>
                  formatCurrency(value, baseCurrency)
                }
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Thu nhập"
                fill="#10b981" // Màu xanh lá (Emerald)
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Bar
                dataKey="expense"
                name="Chi tiêu"
                fill="#ef4444" // Màu đỏ (Red)
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
