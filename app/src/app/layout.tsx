import { Geist, Geist_Mono } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { AuthProvider } from "@/context/AuthContext";

import type { Metadata } from "next";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Compass - AIライフプラン診断",
  description:
    "AIがあなたの人生設計をサポート。プロのFPの知見とAIの分析力で、あなただけのライフプランを作成します。",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Life Compass - AIライフプラン診断",
    description:
      "AIがあなたの人生設計をサポート。プロのFPの知見とAIの分析力で、あなただけのライフプランを作成します。",
    images: [{ url: "/logo.png", width: 1024, height: 1024 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex min-h-dvh flex-col">
            <HeaderWrapper />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
