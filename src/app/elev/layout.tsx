import { Nunito } from "next/font/google";

// Nunito: diacritice românești corecte (ș, ț cu virgulă), cifre lizibile pentru copii.
const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["500", "600", "700", "800"], display: "swap" });

/** Tema zonei elev: font pentru copii, cifre aliniate (tabular-nums), fundal cald anti-oboseală. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${nunito.className} zona-elev min-h-screen bg-crem tabular-nums text-cerneala`}>{children}</div>;
}
