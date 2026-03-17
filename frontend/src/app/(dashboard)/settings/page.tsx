"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Camera, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CURRENCIES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const {
    user,
    updateProfile,
    isUpdatingProfile,
    changePassword,
    isChangingPassword,
    uploadAvatar,
    isUploadingAvatar,
    deleteAccount,
    isDeletingAccount,
  } = useUser();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    city: user?.city || "",
    dob: user?.dob || "",
    baseCurrency: user?.baseCurrency || "VND",
  });

  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        city: user.city || "",
        dob: user.dob || "",
        baseCurrency: user.baseCurrency || "VND",
      });
    }
  }, [user]);

  const handleSaveProfile = () => {
    updateProfile(profileForm);
  };

  const handleChangePassword = () => {
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    changePassword({
      oldPassword: passForm.oldPassword,
      newPassword: passForm.newPassword,
    });
    setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dung lượng ảnh phải nhỏ hơn 2MB");
        return;
      }
      uploadAvatar(file);
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và bảo mật.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full justify-start h-12 p-1 bg-muted/50 rounded-xl overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="general" className="gap-2 h-full px-6 rounded-lg">
            <User className="h-4 w-4" /> Chung
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-2 h-full px-6 rounded-lg"
          >
            <Lock className="h-4 w-4" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: CHUNG --- */}
        <TabsContent value="general" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin hiển thị của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-muted/10 p-4 rounded-xl border">
                <Avatar className="h-24 w-24 ring-2 ring-primary/10">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-2xl bg-primary/5 text-primary">
                    {user?.fullName?.[0] || user?.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 text-center sm:text-left w-full sm:w-auto">
                  <div className="space-y-1">
                    <p className="font-medium leading-none">Ảnh đại diện</p>
                    <p className="text-xs text-muted-foreground">
                      Khuyên dùng ảnh vuông, JPG hoặc PNG, tối đa 2MB.
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 w-full sm:w-auto h-10"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4" />
                    {isUploadingAvatar ? "Đang tải lên..." : "Tải ảnh lên"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    className="h-12"
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Ngày sinh</Label>
                  <Input
                    id="dob"
                    type="date"
                    className="h-12"
                    value={profileForm.dob}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, dob: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    className="h-12"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Thành phố / Tỉnh</Label>
                  <Input
                    id="city"
                    className="h-12"
                    value={profileForm.city}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, city: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2 bg-muted/20 p-4 rounded-xl border border-dashed">
                  <Label htmlFor="email" className="text-muted-foreground">
                    Email đăng nhập
                  </Label>
                  <Input
                    id="email"
                    className="h-12 bg-transparent opacity-70"
                    value={user?.email || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground ml-1">
                    Email là định danh duy nhất và không thể thay đổi.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2 pt-2">
                  <Label>Đồng tiền cơ sở (Base Currency)</Label>
                  <Select
                    value={profileForm.baseCurrency}
                    onValueChange={(val) =>
                      setProfileForm({ ...profileForm, baseCurrency: val })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Chọn đồng tiền cơ sở" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((cur) => (
                        <SelectItem
                          key={cur.code}
                          value={cur.code}
                          className="py-2.5"
                        >
                          <span className="font-bold w-12 inline-block">
                            {cur.code}
                          </span>
                          <span className="text-muted-foreground">
                            - {cur.name} ({cur.symbol})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[0.8rem] text-muted-foreground ml-1">
                    Đây là đồng tiền mặc định dùng để tính Tổng số dư và vẽ Biểu
                    đồ.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t px-6 py-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isUpdatingProfile}
                className="w-full sm:w-auto h-11 px-8"
              >
                {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- TAB: BẢO MẬT --- */}
        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Nhập mật khẩu hiện tại để xác thực trước khi đổi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="current">Mật khẩu hiện tại</Label>
                <Input
                  id="current"
                  type="password"
                  className="h-12"
                  value={passForm.oldPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, oldPassword: e.target.value })
                  }
                />
              </div>
              <Separator className="max-w-md" />
              <div className="space-y-2 max-w-md">
                <Label htmlFor="new">Mật khẩu mới</Label>
                <Input
                  id="new"
                  type="password"
                  className="h-12"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="confirm">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirm"
                  type="password"
                  className="h-12"
                  value={passForm.confirmPassword}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t px-6 py-4">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full sm:w-auto h-11 px-8"
              >
                {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </Button>
            </CardFooter>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Vùng nguy hiểm
              </CardTitle>
              <CardDescription>
                Hành động này sẽ xóa vĩnh viễn dữ liệu tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Xếp dọc trên Mobile, Ngang trên PC */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-4 rounded-xl border">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Xóa tài khoản</p>
                  <p className="text-sm text-muted-foreground">
                    Toàn bộ ví, quỹ, và lịch sử giao dịch sẽ bị xóa và không thể
                    khôi phục.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isDeletingAccount}
                      className="gap-2 h-11 w-full sm:w-auto shrink-0"
                    >
                      <Trash2 className="h-4 w-4" /> Xóa tài khoản
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">
                        Bạn có chắc chắn muốn xóa tài khoản?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        Hành động này{" "}
                        <strong className="text-foreground">KHÔNG THỂ</strong>{" "}
                        hoàn tác. Toàn bộ dữ liệu tài chính của bạn sẽ bốc hơi
                        khỏi server.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
                      <AlertDialogCancel className="h-11">
                        Hủy bỏ
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccount()}
                        className="h-11 bg-red-600 hover:bg-red-700 text-white"
                      >
                        Tôi hiểu, xóa tài khoản
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
