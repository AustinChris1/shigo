import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "Shigo",
  description: "The seller's screen turns green only when the bank says so.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Shigo", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#14783c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable} suppressHydrationWarning>
      <head>
        {/* Applies a saved theme before first paint so dark mode never flashes white. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("shigo-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t;}catch(e){}` }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
