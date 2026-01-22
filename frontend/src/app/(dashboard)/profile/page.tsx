"use client";

import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Hồ sơ cá nhân</h2>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
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
                Tên đăng nhập
              </label>
              <p className="text-lg font-semibold">{user?.username}</p>
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
                ID
              </label>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {user?.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component loading giả
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
