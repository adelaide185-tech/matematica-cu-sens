"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { cereRol } from "./auth";
import { exercitiiTemaClasa1, filtruClaseProfesor, temaPentruElev } from "./teme";
import { decodificaC1 } from "@/motor/clasa1/config";
import { pasC1, rezultatC1, textCorectC1 } from "@/motor/clasa1/sesiune";
import type { RaspunsElevC1 } from "@/motor/clasa1/tipuri";
import type { RaspunsPas, RezultatFinalC1 } from "@/jocuri/clasa1/JocClasa1";

export interface DateTemaClasa1 {
  /** configurația codificată (aceeași ca în URL-ul fișei) */
  c: string;
  titlu: string;
  /** „clasa:<id>” sau „elev:<id>” */
  tinta: string;
  /** AAAA-LL-ZZ */
  termen: string | null;
  test: boolean;
  /** exerciții diferite pentru fiecare elev (aceleași capitole și opțiuni) */
  diferite: boolean;
}
export interface StareTemaClasa1 { eroare?: string; cod?: string; id?: string }

const LITERE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // fără O/0, I/1
function codNou(): string {
  const r = new Uint32Array(6);
  crypto.getRandomValues(r);
  return Array.from(r, (x) => LITERE[x % LITERE.length]).join("");
}

/** Profesorul atribuie jocurile clasei I unei grupe sau unui elev. */
export async function creeazaTemaClasa1(d: DateTemaClasa1): Promise<StareTemaClasa1> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodificaC1(d.c);
  if (!cfg || !cfg.capitole.length) return { eroare: "Alege cel puțin un capitol." };
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
  } else return { eroare: "Alege grupa sau elevul care primește jocul." };

  const termen = d.termen && /^\d{4}-\d{2}-\d{2}$/.test(d.termen) ? new Date(`${d.termen}T23:59:59`) : null;
  for (let i = 0; i < 5; i++) {
    try {
      const t = await db.tema.create({
        data: {
          cod: codNou(), titlu, profesorId: s.id, clasaId, elevId,
          mecanica: "clasa1", generatoare: cfg.capitole.map((c) => `clasa1.${c}`), nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
          nrItemi: cfg.n, seed: d.diferite ? null : cfg.seed,
          config: cfg as unknown as Prisma.InputJsonValue, limitaMinute: null, termen, test: d.test,
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

/** Un pas de joc, verificat pe server (răspunsurile corecte nu ajung în browser înainte). */
export async function verificaPasClasa1(cod: string, index: number, dat: unknown, incercare: number): Promise<RaspunsPas> {
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema || tema.mecanica !== "clasa1") return { ok: false };
  const { exercitii } = exercitiiTemaClasa1(tema, s.id);
  const e = exercitii[Math.floor(Number(index))];
  if (!e) return { ok: false };
  return pasC1(e, normalizeaza(dat), Math.max(1, Math.floor(Number(incercare)) || 1));
}

/** Valorile venite din browser: doar numere, texte scurte sau liste scurte de numere. */
function normalizeaza(dat: unknown): unknown {
  if (dat === null || dat === undefined) return null;
  if (typeof dat === "number") return Number.isFinite(dat) ? dat : null;
  if (typeof dat === "string") return dat.slice(0, 40);
  if (Array.isArray(dat)) return dat.slice(0, 10).map((x) => (typeof x === "number" && Number.isFinite(x) ? x : Number(x)));
  return null;
}

const scurt = (v: unknown) => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : String(v)).slice(0, 40);

/** Elevul termină jocul: rezultatul (corect din prima) se calculează și se salvează pe server. */
export async function trimiteTemaClasa1(cod: string, raspunsuri: RaspunsElevC1[], timpMs: number): Promise<RezultatFinalC1> {
  const gol = { corecte: 0, total: 0, procent: 0, medalie: null, stele: 0 };
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema || tema.mecanica !== "clasa1") return { ...gol, eroare: "Jocul nu există sau nu este pentru tine." };
  if (tema.test) {
    const deja = await db.incercare.count({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } } });
    if (deja) return { ...gol, eroare: "Ai trimis deja acest test." };
  }
  const { exercitii } = exercitiiTemaClasa1(tema, s.id);
  const curate: RaspunsElevC1[] = exercitii.map((_, i) => {
    const r = Array.isArray(raspunsuri) ? raspunsuri[i] : undefined;
    return {
      primul: normalizeaza(r?.primul),
      incercari: Math.max(0, Math.min(99, Math.floor(Number(r?.incercari) || 0))),
      ajutor: Boolean(r?.ajutor),
      timpMs: Math.max(0, Math.min(3_600_000, Math.floor(Number(r?.timpMs) || 0))),
    };
  });
  const rez = rezultatC1(exercitii, curate);
  const timp = Math.max(0, Math.min(Math.floor(Number(timpMs) || 0), 24 * 3600 * 1000));
  const acum = new Date();
  await db.incercare.create({
    data: {
      elevId: s.id, temaId: tema.id, mecanica: "clasa1",
      inceput: new Date(acum.getTime() - timp), terminat: acum,
      corecte: rez.corecte, total: rez.total, stele: rez.stele, medalie: rez.medalie,
      raspunsuri: {
        create: exercitii.map((e, i) => ({
          generatorId: `clasa1.${e.capitol}`, competenta: e.capitol, dificultate: e.dificultate,
          item: { enunt: e.enunt, raspuns: textCorectC1(e), capitol: e.capitol, ecran: e.ecran, fisa: e.fisa.text },
          raspunsElev: { primul: scurt(curate[i].primul), incercari: curate[i].incercari, ajutor: curate[i].ajutor },
          corect: rez.corect[i], timpMs: curate[i].timpMs,
        })),
      },
    },
  });
  // fără revalidatePath: paginile elevului sunt dinamice, iar reîmprospătarea ar înlocui ecranul cu rezultatul (la test: „Ai trimis deja”)
  return { corecte: rez.corecte, total: rez.total, procent: rez.procent, medalie: rez.medalie, stele: rez.stele };
}
