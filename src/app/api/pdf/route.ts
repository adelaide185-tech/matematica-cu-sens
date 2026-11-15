import { NextRequest } from "next/server";
import { citesteParametri, query } from "@/lib/parametri";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ul A4 al fișei pe lecții, din aceeași pagină /fisa. */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const p = citesteParametri(req.nextUrl.searchParams);
  const rezolvari = req.nextUrl.searchParams.get("rezolvari") === "1";
  return pdfDinPagina(
    req,
    `/fisa?${query(p, { pdf: "1", ...(rezolvari && { rezolvari: "1" }) })}`,
    `/fisa?${query(p, { tipareste: "1", ...(rezolvari && { rezolvari: "1" }) })}`,
    `fisa-clasa${p.clasa}-${p.nivel}${rezolvari ? "-rezolvari" : ""}-${p.seed}.pdf`,
  );
}
