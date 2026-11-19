import { NextRequest } from "next/server";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";
import { decodificaC1 } from "@/motor/clasa1/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ul fișei clasei I: ?c=<configurație>&mod=fisa|fisa+barem|barem */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const cfg = decodificaC1(c);
  if (!cfg) return new Response("Configurație greșită.", { status: 400 });
  const m = req.nextUrl.searchParams.get("mod") ?? "";
  const mod = ["fisa", "fisa+barem", "barem"].includes(m) ? m : "fisa";
  const q = (extra: string) => `/fisa/clasa1?c=${encodeURIComponent(c)}&mod=${encodeURIComponent(mod)}&${extra}`;
  return pdfDinPagina(req, q("pdf=1"), q("tipareste=1"), `fisa-clasa1-${cfg.seed}${mod === "fisa" ? "" : mod === "barem" ? "-barem" : "-cu-barem"}.pdf`);
}
