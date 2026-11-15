import "server-only";
import type { Prisma, Tema } from "@prisma/client";
import { db } from "./db";
import type { Sesiune } from "./sesiune-token";
import { curata } from "@/motor/calcul/config";
import { cfgIncercare, curataC3 } from "@/motor/clasa3/config";
import { genereazaC3 } from "@/motor/clasa3/generator";
import { genereazaCalcul, hash } from "@/motor/calcul/generator";
import type { ConfigCalcul, ExCalcul } from "@/motor/calcul/tipuri";

/** hash simplu al unui text (id de elev) → întreg */
function hashText(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Exercițiile temei pentru un elev: aceleași pentru toți sau (seed null) diferite pentru fiecare elev. */
export function exercitiiTema(tema: Pick<Tema, "config" | "seed">, elevId: string): { cfg: ConfigCalcul; exercitii: ExCalcul[] } {
  const cfg = curata((tema.config ?? {}) as Record<string, unknown>);
  const c = tema.seed === null ? { ...cfg, seed: hash(cfg.seed, hashText(elevId)) % 2 ** 31, inlocuiri: {} } : cfg;
  return { cfg: c, exercitii: genereazaCalcul(c).exercitii };
}

/** Temele pe care le vede un elev: ale claselor în care e înscris și cele primite personal. */
export function filtruTemeElev(elevId: string): Prisma.TemaWhereInput {
  return { OR: [{ mecanica: "calcul" }, { mecanica: { startsWith: "c3:" } }], AND: { OR: [{ elevId }, { elevId: null, clasa: { elevi: { some: { elevId } } } }] } };
}

/**
 * Exercițiile unui joc de clasa a III-a dat ca temă: aceleași pentru toți (sau, cu seed null, diferite pentru fiecare elev).
 * La „Mai încerc o dată”, încercarea n folosește alt seed, ca elevul să nu învețe răspunsurile pe de rost.
 */
export function itemiTemaC3(tema: Pick<Tema, "config" | "seed">, elevId: string, incercare = 0) {
  const c = cfgIncercare(cfgTemaC3(tema, elevId), incercare);
  return { cfg: c, itemi: genereazaC3(c).itemi };
}

/** Configurația de bază a temei pentru un elev (încercarea 0). */
export function cfgTemaC3(tema: Pick<Tema, "config" | "seed">, elevId: string) {
  const cfg = curataC3((tema.config ?? {}) as Record<string, unknown>);
  return tema.seed === null ? { ...cfg, seed: hash(cfg.seed, hashText(elevId)) % 2 ** 31, inlocuiri: {} } : cfg;
}

export async function temaPentruElev(cod: string, elevId: string) {
  return db.tema.findFirst({ where: { cod: cod.toUpperCase(), ...filtruTemeElev(elevId) } });
}

/** Grupele (clasele) unui profesor; administratorul vede toate clasele școlii. */
export function filtruClaseProfesor(s: Sesiune): Prisma.ClasaWhereInput {
  return s.rol === "ADMIN_SCOALA" ? { scoalaId: s.scoalaId } : { profesori: { some: { id: s.id } } };
}

/** Temele unui profesor; administratorul vede toate temele din școală. */
export function filtruTemeProfesor(s: Sesiune): Prisma.TemaWhereInput {
  return s.rol === "ADMIN_SCOALA" ? { profesor: { scoalaId: s.scoalaId } } : { profesorId: s.id };
}

export const steleDinProcent = (p: number) => (p >= 90 ? 3 : p >= 70 ? 2 : p >= 50 ? 1 : 0);
