import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Roboto_Slab } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner"

const robotoSlabHeading = Roboto_Slab({subsets:['latin'],variable:'--font-heading'});

const lora = Lora({subsets:['latin'],variable:'--font-serif'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Task Management",
  description: "Hỗ trợ quản lý theo dõi công việc nội bộ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-serif", lora.variable, robotoSlabHeading.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
