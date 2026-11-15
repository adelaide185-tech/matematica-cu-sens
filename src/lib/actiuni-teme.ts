"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { cereRol } from "./auth";
import { decodifica } from "@/motor/calcul/config";
import { corect, textRaspuns, totalExercitii } from "@/motor/calcul/generator";
import { exercitiiTema, filtruClaseProfesor, filtruTemeProfesor, steleDinProcent, temaPentruElev } from "./teme";

export interface DateTemaNoua {
  /** configurația codificată (aceeași ca în URL-ul fișei) */
  c: string;
  titlu: string;
  /** „clasa:<id>” sau „elev:<id>” */
  tinta: string;
  limitaMinute: number | null;
  /** AAAA-LL-ZZ */
  termen: string | null;
  test: boolean;
  /** exerciții diferite pentru fiecare elev (aceleași condiții) */
  diferite: boolean;
}
export interface StareTema { eroare?: string; cod?: string; id?: string }

const LITERE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // fără O/0, I/1

function codNou(): string {
  const r = new Uint32Array(6);
  crypto.getRandomValues(r);
  return Array.from(r, (x) => LITERE[x % LITERE.length]).join("");
}

export async function creeazaTemaCalcul(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodifica(d.c);
  if (!cfg || totalExercitii(cfg) < 1) return { eroare: "Fișa nu are exerciții." };
  const titlu = d.titlu.trim().slice(0, 120) || cfg.antet.titlu;
  const [fel, id] = d.tinta.split(":");
  let clasaId: string | null = null, elevId: string | null = null;
  if (fel === "clasa") {
    const c = await db.clasa.findFirst({ where: { id, ...filtruClaseProfesor(s) } });
    if (!c) return { eroare: "Alege una dintre grupele tale." };
    clasaId = c.id;
  } else if (fel === "elev") {
    const e = await db.utilizator.findFirst({ where: { id, rol: "ELEV", inscrieri: { some: { clasa: filtruClaseProfesor(s) } } } });
    if (!e) return { eroare: "Alege un elev dintr-o grupă a ta." };
    elevId = e.id;
  } else return { eroare: "Alege grupa sau elevul care primește tema." };

  const limita = d.limitaMinute && d.limitaMinute > 0 ? Math.min(240, Math.floor(d.limitaMinute)) : null;
  const termen = d.termen && /^\d{4}-\d{2}-\d{2}$/.test(d.termen) ? new Date(`${d.termen}T23:59:59`) : null;
  for (let i = 0; i < 5; i++) {
    try {
      const t = await db.tema.create({
        data: {
          cod: codNou(), titlu, profesorId: s.id, clasaId, elevId,
          mecanica: "calcul", generatoare: [], nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
          nrItemi: Math.min(totalExercitii(cfg), 200), seed: d.diferite ? null : cfg.seed,
          config: cfg as unknown as Prisma.InputJsonValue, limitaMinute: limita, termen, test: d.test,
        },
      });
      revalidatePath("/profesor/teme");
      return { cod: t.cod, id: t.id };
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }
  return { eroare: "Nu am putut genera un cod unic. Încearcă din nou." };
}

export async function stergeTema(id: string): Promise<void> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const t = await db.tema.findFirst({ where: { id, ...filtruTemeProfesor(s) } });
  if (!t) return;
  await db.$transaction([db.incercare.deleteMany({ where: { temaId: t.id } }), db.tema.delete({ where: { id: t.id } })]);
  revalidatePath("/profesor/teme");
}

export interface RaspunsDat { valoare?: string; cat?: string; rest?: string }
export interface RezultatTema {
  eroare?: string;
  corecte?: number;
  total?: number;
  stele?: number;
  detalii?: { corect: boolean; raspuns: string }[];
}

/** Elevul trimite tema: verificarea se face pe server (răspunsurile corecte nu ajung la elev înainte). */
export async function trimiteTema(cod: string, raspunsuri: RaspunsDat[], timpMs: number): Promise<RezultatTema> {
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema) return { eroare: "Tema nu există sau nu este pentru tine." };
  if (tema.test) {
    const deja = await db.incercare.count({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } } });
    if (deja) return { eroare: "Ai trimis deja acest test." };
  }
  const { exercitii } = exercitiiTema(tema, s.id);
  const timp = Math.max(0, Math.min(Math.floor(Number(timpMs) || 0), 24 * 3600 * 1000));
  const rez = exercitii.map((e, i) => ({ e, dat: raspunsuri[i] ?? {}, ok: corect(e, raspunsuri[i] ?? {}) }));
  const corecte = rez.filter((r) => r.ok).length;
  const stele = steleDinProcent((100 * corecte) / Math.max(1, exercitii.length));
  const acum = new Date();
  await db.incercare.create({
    data: {
      elevId: s.id, temaId: tema.id, mecanica: "calcul",
      inceput: new Date(acum.getTime() - timp), terminat: acum,
      corecte, total: exercitii.length, stele,
      raspunsuri: {
        create: rez.map(({ e, dat, ok }) => ({
          generatorId: `calcul.${e.tip}`, competenta: "calcul", dificultate: 1,
          item: { id: e.id, text: e.text, inainte: e.inainte ?? null, raspuns: textRaspuns(e) },
          raspunsElev: { valoare: String(dat.valoare ?? "").slice(0, 20), cat: String(dat.cat ?? "").slice(0, 20), rest: String(dat.rest ?? "").slice(0, 20) },
          corect: ok, timpMs: Math.round(timp / Math.max(1, exercitii.length)),
        })),
      },
    },
  });
  revalidatePath("/elev/teme");
  return { corecte, total: exercitii.length, stele, detalii: rez.map((r) => ({ corect: r.ok, raspuns: textRaspuns(r.e) })) };
}
