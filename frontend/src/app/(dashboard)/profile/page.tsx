"use client";

import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";
import { format } from "date-fns"; // Nhớ cài date-fns nếu chưa có

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h2>
        <Link href="/settings">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" /> Chỉnh sửa
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Cột trái: Avatar & Info ngắn gọn */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-4xl">
                {user?.fullName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-bold">{user?.fullName}</h3>
              <p className="text-muted-foreground">@{user?.username}</p>
            </div>
            <div className="w-full pt-4 border-t text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thành viên từ:</span>
                <span className="font-medium">2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thành phố:</span>
                <span className="font-medium">{user?.city || "---"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cột phải: Chi tiết */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Họ và tên
                </label>
                <p className="text-lg font-semibold">
                  {user?.fullName || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Đồng tiền cơ sở (Mặc định)
                </label>
                <p className="text-lg font-semibold">
                  {user?.baseCurrency || "VND"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-lg font-semibold">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày sinh
                </label>
                <p className="text-lg font-semibold">
                  {user?.dob || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Số điện thoại
                </label>
                <p className="text-lg font-semibold">
                  {user?.phoneNumber || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return <div className="p-4">Loading profile...</div>;
}
