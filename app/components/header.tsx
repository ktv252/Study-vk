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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Star, Medal } from "lucide-react";

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
    xp: number;
  } | null>(null);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/xp/leaderboard");
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (isLeaderboardOpen) {
      fetchLeaderboard();
    }
  }, [isLeaderboardOpen]);

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
    const updateUserData = () => {
      const storedUser = localStorage.getItem("USER_DATA");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            name: parsedUser.name?.trim() || "Student",
            phoneNumber: parsedUser.phoneNumber || parsedUser.id,
            telegramId: parsedUser.telegramId,
            photoUrl: parsedUser.photoUrl,
            xp: parsedUser.xp || 0,
          });
        } catch (e) {
          setUser({ name: "Student", photoUrl: "", xp: 0 });
        }
      } else {
        setUser({ name: "Student", photoUrl: "", xp: 0 });
      }
    };

    updateUserData();
    // Listen for storage changes in the same window
    window.addEventListener("storage_update", updateUserData);
    return () => window.removeEventListener("storage_update", updateUserData);
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
    <>
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
          <div
            onClick={() => setIsLeaderboardOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20 transition-all group"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-yellow-500">
              {user?.xp || 0} <span className="text-[9px] opacity-70">XP</span>
            </span>
          </div>

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
                <div className="px-2 py-3 mb-2 text-center border-b border-white/5 pb-4">
                  <div className="flex justify-center mb-2">
                    <div className="bg-yellow-500/10 p-2 rounded-full border border-yellow-500/20">
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white capitalize">{user?.name}</p>
                  <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mt-1">{user?.xp || 0} XP Earned</p>
                </div>
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

      {/* Leaderboard Modal */}
      <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px] overflow-hidden p-0 gap-0">
          <div className="bg-gradient-to-b from-yellow-500/20 to-transparent p-6 pb-0">
            <DialogHeader className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-500 p-3 rounded-2xl shadow-lg shadow-yellow-500/20">
                  <Trophy className="w-8 h-8 text-black" />
                </div>
              </div>
              <DialogTitle className="text-2xl font-bold text-center text-white">Leaderboard</DialogTitle>
              <p className="text-center text-xs text-gray-500 mt-1 uppercase tracking-widest">Top 5 Students</p>
            </DialogHeader>
          </div>

          <div className="p-6 pt-0 space-y-3">
            {loadingLeaderboard ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 animate-pulse">
                  <div className="w-6 h-6 bg-white/10 rounded" />
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                    <div className="h-3 bg-white/10 rounded w-1/4" />
                  </div>
                </div>
              ))
            ) : leaderboard.length > 0 ? (
              leaderboard.map((u, i) => (
                <div
                  key={u._id}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    i === 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-white/5 border border-white/5"
                  }`}
                >
                  <div className="w-6 text-center">
                    {i === 0 ? (
                      <Medal className="w-5 h-5 text-yellow-500 inline" />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">{i + 1}</span>
                    )}
                  </div>
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={u.photoUrl} />
                    <AvatarFallback className="bg-zinc-900 text-xs font-bold">
                      {u.UserName?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.UserName}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">Student</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-yellow-500">{u.xp}</p>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">XP Points</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No leaderboard data available</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white/5 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
              Watch lectures to earn XP and <br /> climb the leaderboard!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
