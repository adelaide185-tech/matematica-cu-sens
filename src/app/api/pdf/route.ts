import { NextRequest } from "next/server";
import { citesteParametri, query } from "@/lib/parametri";
import { COOKIE_SESIUNE, verifica } from "@/lib/sesiune-token";
import { dbConfigurata } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generează PDF-ul A4 al fișei cu Chromium (Playwright), din aceeași pagină /fisa.
 * Pe Vercel se va folosi @sparticuz/chromium; local / pe server propriu, Playwright.
 */
export async function GET(req: NextRequest) {
  if (dbConfigurata) {
    const s = await verifica(req.cookies.get(COOKIE_SESIUNE)?.value);
    if (!s) return new Response("Autentificare necesară.", { status: 401 });
    if (s.rol === "ELEV") return new Response("Doar profesorii pot genera fișe.", { status: 403 });
  }
  const p = citesteParametri(req.nextUrl.searchParams);
  const rezolvari = req.nextUrl.searchParams.get("rezolvari") === "1";
  const url = `${req.nextUrl.origin}/fisa?${query(p, { pdf: "1", ...(rezolvari && { rezolvari: "1" }) })}`;

  // Playwright se încarcă la rulare (nu intră în bundle); lipsește → instrucțiuni de printare manuală.
  type Browser = { newPage(): Promise<{ context(): { addCookies(c: object[]): Promise<void> }; goto(u: string, o: object): Promise<unknown>; evaluate(f: () => unknown): Promise<unknown>; pdf(o: object): Promise<Uint8Array> }>; close(): Promise<void> };
  let chromium: { launch(): Promise<Browser> };
  try {
    // getBuiltinModule ocolește bundler-ul: Playwright e rezolvat de Node la rulare
    const { createRequire } = process.getBuiltinModule("node:module");
    chromium = createRequire(`${process.cwd()}/`)("playwright").chromium;
  } catch {
    // Fără Chromium pe server (ex. Vercel): deschidem fișa cu dialogul de printare → „Salvează ca PDF”.
    return Response.redirect(`${req.nextUrl.origin}/fisa?${query(p, { tipareste: "1", ...(rezolvari && { rezolvari: "1" }) })}`, 303);
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // pagina /fisa e protejată: trimitem mai departe sesiunea profesorului care a cerut PDF-ul
    const sesiune = req.cookies.get(COOKIE_SESIUNE)?.value;
    if (sesiune) await page.context().addCookies([{ name: COOKIE_SESIUNE, value: sesiune, url: req.nextUrl.origin }]);
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
