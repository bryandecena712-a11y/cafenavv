import type { Metadata } from "next";
import { Outfit } from "next/font/google";
// @ts-ignore
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import AIAssistant from "./components/AIAssistant";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

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
      <head />
      <body className="bg-zinc-950 text-white antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}