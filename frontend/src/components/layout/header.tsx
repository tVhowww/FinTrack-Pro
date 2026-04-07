"use client";

import { UserNav } from "@/components/ui/user-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Menu, Command, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { sidebarItems } from "./sidebar";
import { useState } from "react";
import { useHideAmount } from "@/hooks/use-hide-amount";
import { useStatistics } from "@/hooks/use-statistics";
import { useUser } from "@/hooks/use-user";

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isHidden, toggleHide, maskAmount } = useHideAmount();

  const { user } = useUser();
  const { totalBalance } = useStatistics();
  const baseCurrency = user?.baseCurrency || "VND";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* TRÁI: Hamburger Menu (Chỉ hiện trên Mobile/Tablet) + Nút Search (Tương lai) */}
      <div className="flex items-center gap-2 md:gap-4 w-full max-w-sm">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-6 border-b text-left">
              <SheetTitle className="flex items-center">
                <Command className="mr-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold">FinTrack Pro</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-1 p-4">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden sm:block text-sm font-medium text-muted-foreground">
          {/* Tương lai chèn Input Search vào đây */}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary/60 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-full border shadow-sm transition-all">
          <span className="hidden sm:inline-block text-sm font-bold text-primary">
            {maskAmount(formatCurrency(totalBalance || 0, baseCurrency))}
          </span>

          <button
            onClick={toggleHide}
            className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-colors"
            title={isHidden ? "Hiển thị số tiền" : "Ẩn số tiền"}
          >
            {isHidden ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
