import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const outfit = Outfit({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "CafeNav | Find your perfect shop",
  description: "Navigate straight to the brews everyone is talking about.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.className}>
      <body className="min-h-[100dvh] flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
