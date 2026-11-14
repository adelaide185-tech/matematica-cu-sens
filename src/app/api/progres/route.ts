import { NextRequest, NextResponse } from "next/server";
import { db, dbConfigurata } from "@/lib/db";
import { sesiuneCurenta } from "@/lib/auth";

export const dynamic = "force-dynamic";

const JOCURI = ["scara", "numaratoare", "fractii"];

/** Progresul elevului din baza de date: cele mai bune stele pe joc×clasă și punctele. */
export async function GET() {
  const s = dbConfigurata ? await sesiuneCurenta() : null;
  if (!s) return NextResponse.json({ conectat: false });
  const [u, incercari] = await Promise.all([
    db.utilizator.findUnique({ where: { id: s.id }, select: { puncteLogica: true, puncteViteza: true, recompense: { select: { recompensaId: true } } } }),
    db.incercare.groupBy({ by: ["mecanica", "lectieId"], where: { elevId: s.id }, _max: { stele: true } }),
  ]);
  const stele: Record<string, number> = {};
  for (const i of incercari) stele[`${i.mecanica}-${i.lectieId}`] = i._max.stele ?? 0;
  return NextResponse.json({
    conectat: true,
    nume: s.nume,
    puncteLogica: u?.puncteLogica ?? 0,
    puncteViteza: u?.puncteViteza ?? 0,
    trofee: u?.recompense.map((r) => r.recompensaId) ?? [],
    stele,
  });
}

/** Salvează rezultatul unui joc terminat. */
export async function POST(req: NextRequest) {
  const s = dbConfigurata ? await sesiuneCurenta() : null;
  if (!s) return NextResponse.json({ salvat: false });
  const b = await req.json().catch(() => null);
  const joc = String(b?.joc ?? "");
  const clasa = Number(b?.clasa);
  const nr = (x: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(x) || 0)));
  if (!JOCURI.includes(joc) || ![1, 2, 3, 4, 5].includes(clasa)) return NextResponse.json({ eroare: "date invalide" }, { status: 400 });

  const logica = nr(b.logica, 50);
  const viteza = nr(b.viteza, 50);
  const trofee: string[] = Array.isArray(b.trofee) ? b.trofee.filter((t: unknown) => typeof t === "string").slice(0, 10) : [];
  await db.$transaction([
    db.incercare.create({
      data: { elevId: s.id, mecanica: joc, lectieId: String(clasa), terminat: new Date(), corecte: nr(b.corecte, 100), total: nr(b.total, 100), stele: nr(b.stele, 3) },
    }),
    db.utilizator.update({ where: { id: s.id }, data: { puncteLogica: { increment: logica }, puncteViteza: { increment: viteza } } }),
    ...trofee.map((t) =>
      db.recompensaObtinuta.upsert({
        where: { elevId_recompensaId: { elevId: s.id, recompensaId: t } },
        create: { elev: { connect: { id: s.id } }, recompensa: { connectOrCreate: { where: { id: t }, create: { id: t, nume: t, descriere: "", icon: "🏆" } } } },
        update: {},
      }),
    ),
  ]);
  return NextResponse.json({ salvat: true });
}
