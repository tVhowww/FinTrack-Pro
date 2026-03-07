"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  PiggyBank,
  Settings,
  User,
  Command,
  ChartBarStacked,
  Target,
} from "lucide-react";

const sidebarItems = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Nhóm", href: "/categories", icon: ChartBarStacked },
  { name: "Ví của tôi", href: "/wallets", icon: Wallet },
  { name: "Giao dịch", href: "/transactions", icon: ArrowRightLeft },
  { name: "Ngân sách", href: "/budgets", icon: PiggyBank },
  { name: "Mục tiêu", href: "/saving-goals", icon: Target },
  { name: "Hồ sơ", href: "/profile", icon: User },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Command className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">FinTrack Pro</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Sidebar (Optional) */}
      <div className="border-t p-4 text-xs text-muted-foreground text-center">
        v1.0.0
      </div>
    </div>
  );
}
