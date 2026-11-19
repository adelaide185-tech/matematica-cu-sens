import { NextRequest } from "next/server";
import { pdfDinPagina, verificaProfesor } from "@/lib/pdf";
import { decodificaC5 } from "@/motor/clasa5/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PDF-ul fișei de clasa a V-a: ?c=<configurație>&mod=fisa|fisa+barem|barem|rezolvate */
export async function GET(req: NextRequest) {
  const interzis = await verificaProfesor(req);
  if (interzis) return interzis;
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const cfg = decodificaC5(c);
  if (!cfg) return new Response("Configurație greșită.", { status: 400 });
  const m = req.nextUrl.searchParams.get("mod");
  const mod = m === "barem" || m === "fisa+barem" || m === "rezolvate" ? m : "fisa";
  const q = (extra: string) => `/fisa/clasa5?c=${encodeURIComponent(c)}&mod=${encodeURIComponent(mod)}&${extra}`;
  const sufix = mod === "fisa" ? "" : mod === "barem" ? "-barem" : mod === "rezolvate" ? "-rezolvate" : "-cu-barem";
  return pdfDinPagina(req, q("pdf=1"), q("tipareste=1"), `fisa-clasa5-${cfg.joc}-${cfg.seed}${sufix}.pdf`);
}
