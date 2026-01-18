import { LoginForm } from "@/components/auth/login-form";
import { Command } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* CỘT BÊN TRÁI: Ảnh/Marketing */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-blue-900" /> {/* Nền tối */}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Command className="mr-2 h-6 w-6" /> FinTrack Pro
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Quản lý tài chính không chỉ là tiết kiệm, mà là kiểm soát
              tương lai của bạn. FinTrack Pro giúp tôi làm điều đó mỗi
              ngày.&rdquo;
            </p>
            <footer className="text-sm">Trump How - Financial Expert</footer>
          </blockquote>
        </div>
      </div>

      {/* CỘT BÊN PHẢI: Form */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {/* Component Form của bạn */}
          <LoginForm />

          <p className="px-8 text-center text-sm text-muted-foreground">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Điều khoản
            </a>{" "}
            và{" "}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Chính sách
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
