"use client";

import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h2>
        <Link href="/settings">
          <Button variant="outline" className="gap-2 h-11 px-4">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Chỉnh sửa</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Cột trái: Avatar & Info ngắn gọn */}
        <Card className="md:col-span-1 shadow-sm">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-32 w-32 ring-4 ring-background shadow-md">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {user?.fullName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-bold">{user?.fullName}</h3>
              <p className="text-muted-foreground mt-1">@{user?.username}</p>
            </div>
            <div className="w-full pt-6 border-t text-left space-y-3 text-sm">
              <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg">
                <span className="text-muted-foreground">Thành viên từ:</span>
                <span className="font-medium">2026</span>
              </div>
              <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded-lg">
                <span className="text-muted-foreground">Thành phố:</span>
                <span className="font-medium">{user?.city || "---"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cột phải: Chi tiết */}
        <Card className="md:col-span-2 shadow-sm h-fit">
          <CardHeader className="pb-4">
            <CardTitle>Thông tin chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Họ và tên
                </label>
                <p className="text-base sm:text-lg font-semibold bg-muted/20 p-3 rounded-lg border border-transparent">
                  {user?.fullName || "Chưa cập nhật"}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Đồng tiền cơ sở
                </label>
                <p className="text-base sm:text-lg font-semibold bg-muted/20 p-3 rounded-lg border border-transparent">
                  {user?.baseCurrency || "VND"}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-base sm:text-lg font-semibold bg-muted/20 p-3 rounded-lg border border-transparent truncate">
                  {user?.email}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày sinh
                </label>
                <p className="text-base sm:text-lg font-semibold bg-muted/20 p-3 rounded-lg border border-transparent">
                  {user?.dob || "Chưa cập nhật"}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Số điện thoại
                </label>
                <p className="text-base sm:text-lg font-semibold bg-muted/20 p-3 rounded-lg border border-transparent">
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
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-muted rounded w-48"></div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-[400px] bg-muted rounded-xl md:col-span-1"></div>
        <div className="h-[400px] bg-muted rounded-xl md:col-span-2"></div>
      </div>
    </div>
  );
}
