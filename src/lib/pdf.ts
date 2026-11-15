import "server-only";
import type { NextRequest } from "next/server";
import { COOKIE_SESIUNE, verifica } from "./sesiune-token";
import { dbConfigurata } from "./db";

/** Doar profesorii (și administratorii) pot descărca fișe; în modul demonstrativ, oricine. */
export async function verificaProfesor(req: NextRequest): Promise<Response | null> {
  if (!dbConfigurata) return null;
  const s = await verifica(req.cookies.get(COOKIE_SESIUNE)?.value);
  if (!s) return new Response("Autentificare necesară.", { status: 401 });
  if (s.rol === "ELEV") return new Response("Doar profesorii pot genera fișe.", { status: 403 });
  return null;
}

/**
 * Randează în PDF A4 o pagină a aplicației, cu Chromium (Playwright), în numele profesorului care a cerut-o.
 * Fără Chromium pe server (ex. Vercel): redirecționează la `fallback`, care deschide dialogul de printare („Salvează ca PDF”).
 */
export async function pdfDinPagina(req: NextRequest, cale: string, fallback: string, numeFisier: string): Promise<Response> {
  type Browser = { newPage(): Promise<{ context(): { addCookies(c: object[]): Promise<void> }; goto(u: string, o: object): Promise<unknown>; evaluate(f: () => unknown): Promise<unknown>; pdf(o: object): Promise<Uint8Array> }>; close(): Promise<void> };
  let chromium: { launch(): Promise<Browser> };
  try {
    // getBuiltinModule ocolește bundler-ul: Playwright e rezolvat de Node la rulare
    const { createRequire } = process.getBuiltinModule("node:module");
    chromium = createRequire(`${process.cwd()}/`)("playwright").chromium;
  } catch {
    return Response.redirect(`${req.nextUrl.origin}${fallback}`, 303);
  }
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // paginile de printare sunt protejate: trimitem mai departe sesiunea profesorului
    const sesiune = req.cookies.get(COOKIE_SESIUNE)?.value;
    if (sesiune) await page.context().addCookies([{ name: COOKIE_SESIUNE, value: sesiune, url: req.nextUrl.origin }]);
    await page.goto(`${req.nextUrl.origin}${cale}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${numeFisier}"` },
    });
  } finally {
    await browser.close();
  }
}
