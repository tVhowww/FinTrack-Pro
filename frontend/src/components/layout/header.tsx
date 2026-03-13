import { UserNav } from "@/components/ui/user-nav";
import { Input } from "@/components/ui/input"; // Nếu chưa có thì cài shadcn input
import { Search } from "lucide-react";
import { ThemeToggle } from "../shared/theme-toggle";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Search Bar (Optional) */}
      <div className="flex items-center w-full max-w-sm space-x-2">
        {/* Bạn có thể thêm search input ở đây sau này */}
      </div>

      {/* Right Side: User Nav + Theme Toggle */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
