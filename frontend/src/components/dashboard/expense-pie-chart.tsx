"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
}

// Bảng màu đẹp cho các miếng bánh
const COLORS = [
  "#0ea5e9", // Sky Blue
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

export function ExpensePieChart({ data, isLoading }: ExpensePieChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-xl" />;
  }

  // Nếu không có dữ liệu chi tiêu
  if (!data || data.length === 0) {
    return (
      <Card className="col-span-3 shadow-sm flex flex-col">
        <CardHeader>
          <CardTitle>Cơ cấu chi tiêu</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
          Chưa có dữ liệu chi tiêu tháng này
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-3 shadow-sm">
      <CardHeader>
        <CardTitle>Cơ cấu chi tiêu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60} // Tạo hiệu ứng Donut Chart
                outerRadius={80}
                paddingAngle={5}
                dataKey="amount"
                nameKey="categoryName"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
