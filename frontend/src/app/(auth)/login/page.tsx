import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | FinTrack Pro",
  description: "Đăng nhập vào hệ thống quản lý tài chính",
};

export default function LoginPage() {
  return (
    <AuthLayoutShell>
      <LoginForm />
    </AuthLayoutShell>
  );
}
