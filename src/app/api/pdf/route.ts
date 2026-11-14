import { NextRequest } from "next/server";
import { citesteParametri, query } from "@/lib/parametri";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generează PDF-ul A4 al fișei cu Chromium (Playwright), din aceeași pagină /fisa.
 * Pe Vercel se va folosi @sparticuz/chromium; local / pe server propriu, Playwright.
 */
export async function GET(req: NextRequest) {
  const p = citesteParametri(req.nextUrl.searchParams);
  const rezolvari = req.nextUrl.searchParams.get("rezolvari") === "1";
  const url = `${req.nextUrl.origin}/fisa?${query(p, { pdf: "1", ...(rezolvari && { rezolvari: "1" }) })}`;

  // Playwright se încarcă la rulare (nu intră în bundle); lipsește → instrucțiuni de printare manuală.
  type Browser = { newPage(): Promise<{ goto(u: string, o: object): Promise<unknown>; evaluate(f: () => unknown): Promise<unknown>; pdf(o: object): Promise<Uint8Array> }>; close(): Promise<void> };
  let chromium: { launch(): Promise<Browser> };
  try {
    // getBuiltinModule ocolește bundler-ul: Playwright e rezolvat de Node la rulare
    const { createRequire } = process.getBuiltinModule("node:module");
    chromium = createRequire(`${process.cwd()}/`)("playwright").chromium;
  } catch (e) {
    console.error("PDF: Playwright indisponibil:", e);
    return new Response("Generatorul PDF nu este disponibil pe acest server. Folosiți butonul „Printează” → „Salvează ca PDF”.", { status: 501 });
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    const nume = `fisa-clasa${p.clasa}-${p.nivel}${rezolvari ? "-rezolvari" : ""}-${p.seed}.pdf`;
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nume}"` },
    });
  } finally {
    await browser.close();
  }
}
