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
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  const chartData = data.map((item) => ({
    ...item,
    name: `T${item.month}`,
  }));

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">
          Xu hướng dòng tiền (6 tháng)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pl-0 pr-4 sm:pr-6 pb-4">
        <div className="h-full w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 0, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={45} // Ép chiều rộng trục Y nhỏ lại
                tickFormatter={(value) => {
                  if (value === 0) return "0";
                  if (value >= 1000000) {
                    return `${(value / 1000000).toFixed(0)}M`;
                  }
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(0)}k`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                formatter={(value: number) =>
                  formatCurrency(value, baseCurrency)
                }
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="income"
                name="Thu nhập"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={20}
                maxBarSize={40}
              />
              <Bar
                dataKey="expense"
                name="Chi tiêu"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={20}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
