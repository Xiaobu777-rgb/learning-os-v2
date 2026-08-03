import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Learning OS",
  description: "个人英语成长工作台",
  applicationName: "Learning OS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Learning OS",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#f7f8fa",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
