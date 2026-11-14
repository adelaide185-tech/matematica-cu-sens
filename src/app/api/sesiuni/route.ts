import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db, dbConfigurata } from "@/lib/db";
import { sesiuneCurenta } from "@/lib/auth";
import { verdicte, type RezultatExercitiu } from "@/antrenament/sesiune";
import { subiect } from "@/antrenament/registru";

export const dynamic = "force-dynamic";

/** Ultima sesiune neterminată a utilizatorului (pentru „Continuă de unde ai rămas”). */
export async function GET() {
  const s = dbConfigurata ? await sesiuneCurenta() : null;
  if (!s) return NextResponse.json({ conectat: false });
  const ses = await db.sesiuneJoc.findFirst({ where: { elevId: s.id, stare: { in: ["in_curs", "pauza"] } }, orderBy: { actualizat: "desc" } });
  return NextResponse.json({ conectat: true, sesiune: ses });
}

function configValida(c: unknown): c is { clasa: number; nivel: string; subiecte: string[]; n: number; seed: number } {
  const x = c as Record<string, unknown>;
  return Boolean(
    x && [1, 2, 3, 4, 5].includes(Number(x.clasa)) && ["usor", "mediu", "provocare"].includes(String(x.nivel)) &&
      Array.isArray(x.subiecte) && x.subiecte.length > 0 && x.subiecte.length <= 40 && x.subiecte.every((id) => typeof id === "string" && subiect(id)) &&
      Number.isInteger(x.n) && Number(x.n) >= 1 && Number(x.n) <= 100 && Number.isInteger(x.seed),
  );
}

function rezultateValide(r: unknown): r is RezultatExercitiu[] {
  return Array.isArray(r) && r.length <= 100 && r.every((x) => x && typeof x.subiectId === "string" && Number.isInteger(x.incercari) && x.incercari >= 1 && x.incercari <= 20);
}

/** Creează sau actualizează sesiunea (pauză, progres, final). */
export async function PUT(req: NextRequest) {
  const s = dbConfigurata ? await sesiuneCurenta() : null;
  if (!s) return NextResponse.json({ salvat: false });
  const b = await req.json().catch(() => null);
  if (!b || !configValida(b.config) || !rezultateValide(b.rezultate)) return NextResponse.json({ eroare: "date invalide" }, { status: 400 });
  const stare = ["in_curs", "pauza", "terminata"].includes(b.stare) ? b.stare : "in_curs";
  const pozitie = Math.max(0, Math.min(Number(b.config.n), Number(b.pozitie) || 0));
  const date = { config: b.config as Prisma.InputJsonValue, rezultate: b.rezultate as unknown as Prisma.InputJsonValue, pozitie, stare };

  let id: string;
  if (typeof b.id === "string") {
    const existenta = await db.sesiuneJoc.findFirst({ where: { id: b.id, elevId: s.id } });
    if (!existenta) return NextResponse.json({ eroare: "sesiune negăsită" }, { status: 404 });
    if (existenta.stare === "terminata") return NextResponse.json({ salvat: true, id: existenta.id });
    await db.sesiuneJoc.update({ where: { id: b.id }, data: date });
    id = b.id;
  } else {
    // o singură sesiune deschisă: celelalte neterminate se închid
    await db.sesiuneJoc.updateMany({ where: { elevId: s.id, stare: { in: ["in_curs", "pauza"] } }, data: { stare: "terminata" } });
    id = (await db.sesiuneJoc.create({ data: { ...date, elevId: s.id } })).id;
  }

  if (stare === "terminata") {
    // stăpânirea pe subiect (medie mobilă) + Puncte de Logică pentru răspunsurile din prima
    const v = verdicte(b.rezultate);
    await db.$transaction([
      ...v.map((x) =>
        db.stapanire.upsert({
          where: { elevId_competenta: { elevId: s.id, competenta: x.subiectId } },
          create: { elevId: s.id, competenta: x.subiectId, scor: x.procent, incercari: x.total },
          update: { scor: { set: x.procent }, incercari: { increment: x.total } },
        }),
      ),
      db.utilizator.update({ where: { id: s.id }, data: { puncteLogica: { increment: v.reduce((t, x) => t + x.dinPrima, 0) } } }),
    ]);
  }
  return NextResponse.json({ salvat: true, id });
}
