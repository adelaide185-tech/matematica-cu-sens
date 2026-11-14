import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({ subsets: ["latin", "latin-ext"], variable: "--font-quicksand", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Matematică cu Sens · Fabrica de Inteligență",
  description: "Fișe de lucru și jocuri de matematică pentru clasele I–V, aliniate cu programa școlară.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" className={quicksand.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
