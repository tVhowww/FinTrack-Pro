import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng ký | FinTrack Pro",
  description: "Tạo tài khoản mới",
};

export default function RegisterPage() {
  return (
    <AuthLayoutShell
      quote="Việc theo dõi chi tiêu chưa bao giờ dễ dàng đến thế. Tôi đã tiết kiệm được 30% thu nhập chỉ sau 2 tháng sử dụng."
      author="Sofia Davis - Early Adopter"
      backgroundImage="https://res.cloudinary.com/dzxzssfad/image/upload/v1773677576/fintech-auth-bg-1_e0ec8n.avif"
    >
      <RegisterForm />
    </AuthLayoutShell>
  );
}
