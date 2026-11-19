import "server-only";
import type { Prisma, Tema } from "@prisma/client";
import { db } from "./db";
import type { Sesiune } from "./sesiune-token";
import { curata } from "@/motor/calcul/config";
import { cfgIncercare, curataC3 } from "@/motor/clasa3/config";
import { genereazaC3 } from "@/motor/clasa3/generator";
import { cfgIncercareC4, curataC4 } from "@/motor/clasa4/config";
import { genereazaC4 } from "@/motor/clasa4/generator";
import { genereazaCalcul, hash } from "@/motor/calcul/generator";
import type { ConfigCalcul, ExCalcul } from "@/motor/calcul/tipuri";
import { curataC1 } from "@/motor/clasa1/config";
import { cfgIncercareC2, curataC2 } from "@/motor/clasa2/config";
import { genereazaC2 } from "@/motor/clasa2/generator";
import type { NivelC2 } from "@/motor/clasa2/tipuri";
import { genereazaClasa1 } from "@/motor/clasa1/sesiune";
import type { ConfigClasa1, ExercitiuC1 } from "@/motor/clasa1/tipuri";

/** Mecanicile temelor online: fișa de calcul și jocurile clasei I. */
export const MECANICI_TEME = ["calcul", "clasa1"] as const;

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

/** Exercițiile unei teme cu jocurile clasei I (aceleași pentru toți sau, cu seed null, diferite pentru fiecare elev). */
export function exercitiiTemaClasa1(tema: Pick<Tema, "config" | "seed">, elevId: string): { cfg: ConfigClasa1; exercitii: ExercitiuC1[] } {
  const cfg = curataC1((tema.config ?? {}) as Record<string, unknown>);
  const c = tema.seed === null ? { ...cfg, seed: hash(cfg.seed, hashText(elevId)) % 2 ** 31 || 1 } : cfg;
  return { cfg: c, exercitii: genereazaClasa1(c).exercitii };
}

/** Temele pe care le vede un elev: ale claselor în care e înscris și cele primite personal. */
export function filtruTemeElev(elevId: string): Prisma.TemaWhereInput {
  return { OR: [{ mecanica: { in: [...MECANICI_TEME] } }, { mecanica: { startsWith: "c3:" } }, { mecanica: { startsWith: "c2:" } }, { mecanica: { startsWith: "c4:" } }], AND: { OR: [{ elevId }, { elevId: null, clasa: { elevi: { some: { elevId } } } }] } };
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

/** Configurația de bază a unui joc de clasa a IV-a pentru un elev (încercarea 0). */
export function cfgTemaC4(tema: Pick<Tema, "config" | "seed">, elevId: string) {
  const cfg = curataC4((tema.config ?? {}) as Record<string, unknown>);
  return tema.seed === null ? { ...cfg, seed: hash(cfg.seed, hashText(elevId)) % 2 ** 31, inlocuiri: {} } : cfg;
}

/** Exercițiile jocului de clasa a IV-a pentru încercarea n. */
export function itemiTemaC4(tema: Pick<Tema, "config" | "seed">, elevId: string, incercare = 0) {
  const c = cfgIncercareC4(cfgTemaC4(tema, elevId), incercare);
  return { cfg: c, itemi: genereazaC4(c).itemi };
}

/** Configurația de bază a unui joc de clasa a II-a pentru un elev (încercarea 0). */
export function cfgTemaC2(tema: Pick<Tema, "config" | "seed">, elevId: string) {
  const cfg = curataC2((tema.config ?? {}) as Record<string, unknown>);
  return tema.seed === null ? { ...cfg, seed: hash(cfg.seed, hashText(elevId)) % 2 ** 31, inlocuiri: {} } : cfg;
}

/** Exercițiile jocului de clasa a II-a, pentru încercarea și nivelul jucat (nivelul fixat de profesor are prioritate). */
export function itemiTemaC2(tema: Pick<Tema, "config" | "seed">, elevId: string, incercare: number, nivel: NivelC2) {
  const baza = cfgTemaC2(tema, elevId);
  const c = cfgIncercareC2(baza, incercare);
  const niv = baza.nivel === "alege" ? nivel : baza.nivel;
  return { cfg: c, nivel: niv, itemi: genereazaC2(c, niv).itemi };
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
