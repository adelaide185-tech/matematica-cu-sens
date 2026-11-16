import { NextRequest } from "next/server";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";
import { decodificaC2 } from "@/motor/clasa2/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ul fișei de clasa a II-a: ?c=<configurație>&mod=fisa|fisa+barem|barem */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const cfg = decodificaC2(c);
  if (!cfg) return new Response("Configurație greșită.", { status: 400 });
  const m = req.nextUrl.searchParams.get("mod");
  const mod = m === "barem" || m === "fisa+barem" ? m : "fisa";
  const q = (extra: string) => `/fisa/clasa2?c=${encodeURIComponent(c)}&mod=${encodeURIComponent(mod)}&${extra}`;
  return pdfDinPagina(req, q("pdf=1"), q("tipareste=1"), `fisa-clasa2-${cfg.joc}-${cfg.seed}${mod === "fisa" ? "" : mod === "barem" ? "-barem" : "-cu-barem"}.pdf`);
}
