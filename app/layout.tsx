// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import NetworkStatus from '@/components/NetworkStatus';

import RootInitializer from "@/app/components/RootInitializer";
import TriggerCleanup from "@/app/TriggerCleanup";
import { getDirectServerInfo } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

// Server-side function to fetch server info
async function getServerInfo() {
  return await getDirectServerInfo();
}

export async function generateMetadata(): Promise<Metadata> {
  const serverInfo = await getServerInfo();

  return {
    title:
      serverInfo?.webName || process.env.NEXT_PUBLIC_APP_NAME || "SATISH ~ DEV",
    description: "PowerStudy ~ MANZIL MILEGI YHI SE",
    authors: [
      { name: "DEVIL ~ BOY", url: "https://github.com/sahilraz" },
      { name: "SATISH", url: "https://t.me/O0O00000000000000000000000000000" },
    ],
    creator: "DHOLAKPUR ~ DEV",

    icons: {
      icon: serverInfo?.sidebarLogoUrl || "/favicon.ico", // fallback to public/favicon.ico
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch server info on the server side (will be cached from metadata generation)
  const serverInfo = await getServerInfo();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#020202] text-white selection:bg-purple-500/30 antialiased`}>
        {/* Global UI background pattern */}
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-50">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-blue-500/5" />
        </div>

        <RootInitializer serverInfo={serverInfo}>{children}</RootInitializer>
        <NetworkStatus />
        <Toaster position="top-right" richColors closeButton theme="dark" />
        <TriggerCleanup />
      </body>
    </html>
  );
}
