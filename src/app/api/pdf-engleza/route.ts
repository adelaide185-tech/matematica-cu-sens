import { NextRequest } from "next/server";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";
import { decodificaFisaEn } from "@/engleza/fise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ul fișei de engleză: ?c=<configurație>&mod=fisa|educatoare|ambele */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const cfg = decodificaFisaEn(c);
  if (!cfg) return new Response("Configurație greșită.", { status: 400 });
  const m = req.nextUrl.searchParams.get("mod");
  const mod = m === "fisa" || m === "educatoare" ? m : "ambele";
  const q = (extra: string) => `/fisa/engleza?c=${encodeURIComponent(c)}&mod=${mod}&${extra}`;
  return pdfDinPagina(req, q("pdf=1"), q("tipareste=1"), `english-${cfg.varsta}ani-${cfg.seed}${mod === "fisa" ? "" : mod === "educatoare" ? "-educatoare" : "-cu-script"}.pdf`);
}
