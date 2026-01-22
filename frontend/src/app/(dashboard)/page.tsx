"use client";

import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Activity, Users } from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();

  // Đây là dữ liệu giả (Hardcode) để lên UI trước, sau này sẽ gọi API thật
  const stats = [
    {
      title: "Tổng số dư",
      value: "120.000.000 ₫",
      icon: DollarSign,
      desc: "+20.1% so với tháng trước",
    },
    {
      title: "Chi tiêu tháng này",
      value: "15.400.000 ₫",
      icon: CreditCard,
      desc: "+4% so với tháng trước",
    },
    {
      title: "Thu nhập tháng này",
      value: "45.000.000 ₫",
      icon: Activity,
      desc: "Lương + Thưởng",
    },
    {
      title: "Tiết kiệm",
      value: "29.600.000 ₫",
      icon: Users,
      desc: "Đạt 85% mục tiêu",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header của Dashboard */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Xin chào, {user?.fullName || "bạn"}!
        </h2>
        <div className="flex items-center space-x-2">
          {/* Chỗ này sau để nút "Thêm giao dịch nhanh" */}
        </div>
      </div>

      {/* Grid thống kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Khu vực Biểu đồ hoặc Giao dịch gần đây (Để trống chờ Task sau) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 h-[300px] flex items-center justify-center bg-muted/20 border-dashed">
          <p className="text-muted-foreground">
            Khu vực Biểu đồ chi tiêu (Coming soon)
          </p>
        </Card>
        <Card className="col-span-3 h-[300px] flex items-center justify-center bg-muted/20 border-dashed">
          <p className="text-muted-foreground">
            Khu vực Giao dịch gần đây (Coming soon)
          </p>
        </Card>
      </div>
    </div>
  );
}
