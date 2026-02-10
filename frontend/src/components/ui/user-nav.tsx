"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/auth.service";
import { LogOut } from "lucide-react";
import { useUser } from "@/hooks/use-user"; // Import Hook

export function UserNav() {
  // 1. Lấy dữ liệu user từ Hook
  const { user, isLoading } = useUser();

  const handleLogout = async () => {
    await authService.logout();
  };

  // Lấy chữ cái đầu của tên để làm Avatar Fallback (VD: "Hau" -> "H")
  const firstLetter = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={user?.username || "@user"} />
            <AvatarFallback>{isLoading ? "..." : firstLetter}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          {/* Hiển thị tên thật */}
          <p className="text-sm font-medium leading-none">
            {user?.fullName || user?.username || "Loading..."}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {user?.email || "..."}
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
