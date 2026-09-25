import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["800"], variable: "--font-display", display: "swap" });
import { Nav } from "@/components/Nav";
import { currentSeller } from "@/lib/session";

export const metadata: Metadata = {
  title: "Shigo",
  description: "The seller's screen turns green only when the bank says so.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Shigo", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#14783c", width: "device-width", initialScale: 1, maximumScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const seller = await currentSeller();
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-dvh">
        <div className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</div>
        {seller && <Nav />}
      </body>
    </html>
  );
}
