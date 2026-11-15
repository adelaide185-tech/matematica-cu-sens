import { NextRequest } from "next/server";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";
import { decodifica } from "@/motor/calcul/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ul fișei de calcul: ?c=<configurație>&mod=fisa|fisa+barem|barem */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const cfg = decodifica(c);
  if (!cfg) return new Response("Configurație greșită.", { status: 400 });
  const mod = ["fisa", "fisa+barem", "barem"].includes(req.nextUrl.searchParams.get("mod") ?? "") ? req.nextUrl.searchParams.get("mod")! : "fisa";
  const q = (extra: string) => `/fisa/calcul?c=${encodeURIComponent(c)}&mod=${encodeURIComponent(mod)}&${extra}`;
  return pdfDinPagina(req, q("pdf=1"), q("tipareste=1"), `fisa-calcul-${cfg.seed}${mod === "fisa" ? "" : mod === "barem" ? "-barem" : "-cu-barem"}.pdf`);
}
