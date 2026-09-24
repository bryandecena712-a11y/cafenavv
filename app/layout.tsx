import type { Metadata } from "next";
import { Outfit } from "next/font/google";
// @ts-ignore
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import AIAssistant from "./components/AIAssistant";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CafeNav | Find your perfect shop",
  description: "Navigate straight to the brews everyone is talking about.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
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
          <ServiceWorkerRegistration />
          <Navbar />
          {children}
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}