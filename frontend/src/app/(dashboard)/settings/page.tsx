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

  // State cho Form Profile
  const [profileForm, setProfileForm] = useState<{
    fullName: string;
    phoneNumber: string;
    city: string;
    dob: string;
    baseCurrency: string;
  }>(() => ({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    city: user?.city || "",
    dob: user?.dob || "",
    baseCurrency: user?.baseCurrency || "VND",
  }));

  // State cho Form Password
  const [passForm, setPassForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Ref cho input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load dữ liệu user vào form khi user thay đổi
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

  // Handle Submit Profile
  const handleSaveProfile = () => {
    updateProfile(profileForm);
  };

  // Handle Submit Password
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
    // Reset form sau khi gửi (hoặc xử lý trong onSuccess của hook cũng được)
    setPassForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  // Handle Upload Avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file ảnh (ví dụ < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Dung lượng ảnh phải nhỏ hơn 2MB");
        return;
      }
      uploadAvatar(file);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cài đặt</h2>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin cá nhân và bảo mật.
        </p>
      </div>
      <Separator />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <User className="h-4 w-4" /> Chung
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: CHUNG --- */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin hiển thị của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-xl">
                    {user?.fullName?.[0] || user?.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4" />
                    {isUploadingAvatar ? "Đang tải..." : "Đổi ảnh đại diện"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG tối đa 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        fullName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dob">Ngày sinh</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={profileForm.dob}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, dob: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Thành phố / Tỉnh</Label>
                  <Input
                    id="city"
                    value={profileForm.city}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, city: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Email không thể thay đổi.
                  </p>
                </div>
                <div className="grid gap-2 md:col-span-2 pt-2">
                  <Label>Đồng tiền cơ sở (Base Currency)</Label>
                  <Select
                    value={profileForm.baseCurrency}
                    onValueChange={(val) =>
                      setProfileForm({ ...profileForm, baseCurrency: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đồng tiền cơ sở" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((cur) => (
                        <SelectItem key={cur.code} value={cur.code}>
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
                  <p className="text-[0.8rem] text-muted-foreground">
                    Đây là đồng tiền mặc định dùng để tính Tổng số dư và Thống
                    kê biểu đồ.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- TAB: BẢO MẬT --- */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Nhập mật khẩu cũ để xác thực.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Mật khẩu hiện tại</Label>
                <Input
                  id="current"
                  type="password"
                  value={passForm.oldPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, oldPassword: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new">Mật khẩu mới</Label>
                <Input
                  id="new"
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) =>
                    setPassForm({ ...passForm, newPassword: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirm"
                  type="password"
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
            <CardFooter>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </CardFooter>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900 bg-red-50/10">
            <CardHeader>
              <CardTitle className="text-red-600">Vùng nguy hiểm</CardTitle>
              <CardDescription>
                Hành động này sẽ xóa vĩnh viễn tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Xóa tài khoản</p>
                  <p className="text-sm text-muted-foreground">
                    Không thể khôi phục sau khi xóa.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isDeletingAccount}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Xóa tài khoản
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Bạn có chắc chắn không?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Tài khoản của bạn sẽ
                        bị xóa vĩnh viễn và bạn sẽ không thể đăng nhập lại.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccount()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Xác nhận xóa
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
