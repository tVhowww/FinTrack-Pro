import { Command } from "lucide-react";
import Image from "next/image";

interface AuthLayoutShellProps {
  children: React.ReactNode;
  quote?: string;
  author?: string;
  backgroundImage?: string;
}

export function AuthLayoutShell({
  children,
  quote = "Quản lý tài chính không chỉ là tiết kiệm, mà là kiểm soát tương lai của bạn.",
  author = "FinTrack Pro",
  backgroundImage = "https://res.cloudinary.com/dzxzssfad/image/upload/v1773677525/fintech-auth-bg_osy4tt.jpg",
}: AuthLayoutShellProps) {
  return (
    <div className="min-h-screen grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background">
      {/* CỘT TRÁI */}
      <div className="hidden lg:flex flex-col h-screen sticky top-0 p-10 text-white dark:border-r overflow-hidden bg-zinc-900 relative">
        <Image
          src={backgroundImage}
          alt="FinTrack Background"
          fill
          className="object-cover object-center z-0"
          priority
          unoptimized
        />

        {/* Lớp phủ đen mờ */}
        <div className="absolute inset-0 bg-black/50 z-10"></div>

        {/* Lưới Grid */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Logo & Text */}
        <div className="relative z-20 flex items-center text-xl font-bold tracking-tight">
          <Command className="mr-2 h-8 w-8 text-primary" />
          FinTrack Pro
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2 backdrop-blur-md bg-black/40 p-6 rounded-2xl border border-white/10 shadow-2xl">
            <p className="text-lg leading-relaxed">&ldquo;{quote}&rdquo;</p>
            <footer className="text-sm font-medium text-gray-300">
              — {author}
            </footer>
          </blockquote>
        </div>
      </div>

      {/* CỘT PHẢI: Form Container */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-background to-muted/30 dark:from-background dark:to-muted/10 relative">
        <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center space-y-6 z-20 py-10 mt-16 lg:mt-0">
          <div className="flex justify-center lg:hidden mb-2">
            <div className="flex items-center text-3xl font-bold text-primary">
              <Command className="mr-2 h-8 w-8" /> FinTrack Pro
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
