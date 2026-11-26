import { NextRequest } from "next/server";
import { COOKIE_SESIUNE, verifica } from "@/lib/sesiune-token";
import { dbConfigurata } from "@/lib/db";
import { NUME_EROARE, SEMAFOR, incarcaTema, rezumatElev } from "@/lib/raport-tema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rezultatele unei teme în CSV (Excel în română: „;” și BOM), cu aceleași cifre ca pe ecran. */
export async function GET(req: NextRequest) {
  if (!dbConfigurata) return new Response("Fără bază de date.", { status: 404 });
  const s = await verifica(req.cookies.get(COOKIE_SESIUNE)?.value);
  if (!s || s.rol === "ELEV") return new Response("Doar profesorii.", { status: 403 });
  const t = await incarcaTema(s, req.nextUrl.searchParams.get("id") ?? "");
  if (!t) return new Response("Tema nu există.", { status: 404 });
  const elevi = (t.elev ? [t.elev] : t.clasa?.elevi.map((i) => i.elev) ?? []).sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
  const q = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const linii = [["Elev", "Stare", "Medalie", "Corecte", "Total", "Acuratețe %", "Scor", "Încercări", "Ce știe bine", "De exersat", "Greșeli tipice"].map(q).join(";")];
  for (const e of elevi) {
    const r = rezumatElev(t, e.id);
    linii.push([`${e.nume} ${e.prenume}`, SEMAFOR[r.semafor].nume, r.cea?.medalie ?? "", r.cea?.corecte ?? "", r.cea?.total ?? "", r.acuratete ?? "", r.cea?.scor ?? "", r.incercari, r.stiu.join(", "), r.exersam.join(", "), r.erori.map(([x, n]) => `${NUME_EROARE[x]} (${n})`).join(", ")].map(q).join(";"));
  }
  return new Response("﻿" + linii.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="rezultate-${t.cod}.csv"` } });
}
