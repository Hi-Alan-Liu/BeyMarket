import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeyMarket — 戰鬥陀螺零件交易賣場",
  description:
    "玩家對玩家的戰鬥陀螺零件交易與行情平台：上架、搜尋、成交紀錄與市場行情。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <Navbar />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          BeyMarket — 平台僅提供媒合與行情，不介入交易與付款，交易糾紛請自行留意。
        </footer>
      </body>
    </html>
  );
}
