"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Contact, GraduationCap, Presentation, Send, BookOpenCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  sidebarTitle?: string;
  sidebarLogoUrl?: string;
  BookLibrary?: string;
  tgChannel?: string;
}

export function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  sidebarTitle,
  sidebarLogoUrl,
  BookLibrary,
  tgChannel,
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarItems = [
    { icon: BookOpen, text: "Explore", href: "/study/" },
    { icon: Presentation, text: "All Batches", href: "/study/batches" },
    { icon: GraduationCap, text: "My Learning", href: "/study/mybatches" },
    { icon: Send, text: "Community", href: tgChannel || "" },
    { icon: BookOpenCheck, text: "Library", href: BookLibrary || "" },
    { icon: Contact, text: "Support", href: "/contact" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 xl:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container */}
      <aside
        className={`
          z-50 w-64 glass border-r border-white/5
          transform transition-all duration-300 ease-in-out
          ${isMobileMenuOpen
            ? "fixed top-0 left-0 translate-x-0 h-full"
            : "fixed top-0 left-0 -translate-x-full h-full"
          }
          xl:sticky xl:top-0 xl:translate-x-0 xl:h-screen xl:z-auto
          shadow-2xl shadow-black/50
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative w-10 h-10 rounded-full bg-black overflow-hidden border border-white/10">
              <Image
                src={sidebarLogoUrl || "/assets/img/logo.png"}
                alt={sidebarTitle || "Logo"}
                width={40}
                height={40}
                priority={true}
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-tight truncate max-w-[120px]">
              {sidebarTitle || "VDK Study"}
            </span>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Premium</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-5rem)] custom-scrollbar">
          {sidebarItems.map((item) => {
            let isActive = false;
            if (item.href === "/study/") {
              isActive = pathname === "/study" || pathname === "/study/";
            } else if (item.href === "/study/batches") {
              isActive = pathname === "/study/batches" || (pathname?.startsWith("/study/batches/") ?? false);
            } else if (item.href === "/study/mybatches") {
              isActive = pathname === "/study/mybatches" || (pathname?.startsWith("/study/mybatches/") ?? false);
            } else {
              isActive = pathname === item.href;
            }

            return (
              <Link key={item.text} href={item.href as string}>
                <div
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-white/10 text-white shadow-lg shadow-black/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg transition-colors
                    ${isActive ? "bg-purple-600/20 text-purple-400" : "bg-white/5 group-hover:bg-white/10"}
                  `}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <span>{item.text}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
