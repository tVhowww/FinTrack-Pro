"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useHideAmount } from "@/hooks/use-hide-amount";
import { formatCurrency } from "@/lib/utils";
import { ExpenseStructure } from "@/types/statistics.dto";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ExpensePieChartProps {
  data: ExpenseStructure[];
  isLoading: boolean;
  baseCurrency?: string;
}

const COLORS = [
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
];

export function ExpensePieChart({
  data,
  isLoading,
  baseCurrency,
}: ExpensePieChartProps) {
  const { maskAmount } = useHideAmount();
  if (isLoading) {
    return <Skeleton className="h-full w-full rounded-xl" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">
            Cơ cấu chi tiêu
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
          Chưa có dữ liệu chi tiêu tháng này
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-base sm:text-lg">Cơ cấu chi tiêu</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-full w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="75%"
                paddingAngle={3}
                dataKey="amount"
                nameKey="categoryName"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  maskAmount(formatCurrency(value, baseCurrency))
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  fontSize: "12px",
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
