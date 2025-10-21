import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinanceTrack - Take Control of Your Finances",
  description:
    "Track expenses, set budgets, and achieve your financial goals with our intuitive finance tracker.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
