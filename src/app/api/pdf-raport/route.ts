import { NextRequest } from "next/server";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF: raportul pentru părinți sau diploma unui elev (?t=<temă>&e=<elev>&tip=raport|diploma). */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const t = (req.nextUrl.searchParams.get("t") ?? "").replace(/[^\w-]/g, "");
  const e = (req.nextUrl.searchParams.get("e") ?? "").replace(/[^\w-]/g, "");
  const tip = req.nextUrl.searchParams.get("tip") === "diploma" ? "diploma" : "raport";
  if (!t || !e) return new Response("Lipsesc tema sau elevul.", { status: 400 });
  const cale = `/profesor/teme/${t}/${tip}/${e}`;
  return pdfDinPagina(req, `${cale}?pdf=1`, `${cale}?tipareste=1`, `${tip === "diploma" ? "diploma" : "raport-parinti"}-${e.slice(-6)}.pdf`);
}
