import { Command } from "lucide-react";
import Link from "next/link";

interface AuthLayoutShellProps {
  children: React.ReactNode;
  quote?: string;
  author?: string;
}

export function AuthLayoutShell({
  children,
  quote = "Quản lý tài chính không chỉ là tiết kiệm, mà là kiểm soát tương lai của bạn.",
  author = "FinTrack Pro",
}: AuthLayoutShellProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* CỘT TRÁI: Thêm sticky và top-0 để nó luôn bám dính khi scroll */}
      <div className="relative hidden h-screen sticky top-0 flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Command className="mr-2 h-6 w-6" /> FinTrack Pro
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">&ldquo;{quote}&rdquo;</p>
            <footer className="text-sm">{author}</footer>
          </blockquote>
        </div>
      </div>

      {/* CỘT PHẢI: Padding điều chỉnh để form luôn nằm giữa view nếu có thể */}
      <div className="lg:p-8 flex items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[480px]">
          {children}
        </div>
      </div>
    </div>
  );
}
