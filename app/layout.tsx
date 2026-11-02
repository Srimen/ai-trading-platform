import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

export const metadata: Metadata = {
  title: "AI Trading Platform (Paper)",
  description:
    "Paper-trading prototype with timestamped market data, reproducible risk numbers, and AI explanations that cite their sources.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}

