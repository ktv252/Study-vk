"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  LogOut,
  Menu,
  User,
  GraduationCap,
  ChevronLeft,
  Moon,
  Computer,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { jwtDecode } from "jwt-decode";
interface JwtPayload {
  UserName?: string;
  name?: string;
  PhotoUrl?: string;
  [key: string]: any;
}

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}
type Theme = "LIGHT" | "DARK" | "SYSTEM";

export function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("DARK"); // Default to DARK for premium look

  const [user, setUser] = useState<{
    name?: string;
    phoneNumber?: string;
    telegramId?: string;
    photoUrl?: string;
  } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("USER_THEME") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = (t: Theme) => {
      if (t === "DARK") root.classList.add("dark");
      else if (t === "LIGHT") root.classList.remove("dark");
      else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      }
    };
    apply(theme);
    localStorage.setItem("USER_THEME", theme);
  }, [theme]);

  useEffect(() => {
    const storedUser = localStorage.getItem("USER_DATA");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name: parsedUser.name?.trim() || "Student",
          phoneNumber: parsedUser.phoneNumber || parsedUser.id,
          telegramId: parsedUser.telegramId,
          photoUrl: parsedUser.photoUrl,
        });
      } catch (e) {
        setUser({ name: "Student", photoUrl: "" });
      }
    } else {
      setUser({ name: "Student", photoUrl: "" });
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      localStorage.clear();
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/5 px-4 h-16 flex items-center justify-between shadow-2xl shadow-black/50">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden hover:bg-white/5 active:scale-95 transition-all"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all px-3"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-400">Live Services Active</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-white/5 rounded-full">
              {theme === "LIGHT" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 glass border-white/10">
            <DropdownMenuItem onClick={() => setTheme("LIGHT")} className="cursor-pointer focus:bg-white/5 transition-colors">
              <Sun className="mr-2 h-4 w-4" /> <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("DARK")} className="cursor-pointer focus:bg-white/5 transition-colors">
              <Moon className="mr-2 h-4 w-4" /> <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("SYSTEM")} className="cursor-pointer focus:bg-white/5 transition-colors">
              <Computer className="mr-2 h-4 w-4" /> <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-white leading-none mb-1">{user?.name}</span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider leading-none">Pro Student</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none group">
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 group-hover:scale-105 transition-transform duration-300">
                <Avatar className="border-2 border-black h-9 w-9">
                  <AvatarImage src={user?.photoUrl} />
                  <AvatarFallback className="bg-zinc-900 text-xs font-bold">
                    {user?.name?.slice(0, 2).toUpperCase() || "PS"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass border-white/10 p-2">
              <div className="px-2 py-3 mb-2">
                <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                <p className="text-xs text-gray-500 mt-2 truncate">{user?.phoneNumber || user?.telegramId || "No ID linked"}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer rounded-lg m-1 focus:bg-white/5 transition-colors">
                <User className="mr-2 h-4 w-4" /> <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/study")} className="cursor-pointer rounded-lg m-1 focus:bg-white/5 transition-colors">
                <GraduationCap className="mr-2 h-4 w-4" /> <span>My Courses</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg m-1 text-red-400 focus:bg-red-500/10 focus:text-red-400 transition-colors">
                <LogOut className="mr-2 h-4 w-4" /> <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
