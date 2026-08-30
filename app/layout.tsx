import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import AIAssistant from "./components/AIAssistant";

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
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-[100dvh] flex flex-col">
        <AuthProvider>
          <Navbar />
          {children}
          <AIAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}