import type { Clasa, Nivel } from "../tipuri";
import type { Rng } from "../rng";

/** Concentrul numeric al fiecărei clase. */
export function maxClasa(clasa: Clasa): number {
  return { 1: 100, 2: 1000, 3: 10000, 4: 1_000_000, 5: 1_000_000 }[clasa];
}

/** Numărul de cifre „tipic” pentru exerciții de numerație. */
export function cifreClasa(clasa: Clasa): number {
  return { 1: 2, 2: 3, 3: 4, 4: 6, 5: 6 }[clasa];
}

/** Câte cerințe are un item, în funcție de nivel. */
export function nrCerinte(nivel: Nivel, baza = 4): number {
  return { consolidare: baza + 2, aprofundare: baza, evaluare: baza, competitie: Math.max(1, baza - 2) }[nivel];
}

/** Număr aleator cu exact `cifre` cifre. */
export function numarCifre(rng: Rng, cifre: number): number {
  return rng.int(10 ** (cifre - 1), 10 ** cifre - 1);
}

export function cifre(n: number): number[] {
  return String(n).split("").map(Number);
}

/** Litere pentru cerințe: a), b), c)… */
export const LITERE = "abcdefghijklmnop".split("");

export function dificultate(nivel: Nivel, clasa: Clasa): number {
  const b = { consolidare: 2, aprofundare: 5, evaluare: 5, competitie: 8 }[nivel];
  return Math.min(10, b + Math.floor((clasa - 1) / 2));
}

export const ORDINE: Record<number, string> = {
  0: "unităților", 1: "zecilor", 2: "sutelor", 3: "miilor", 4: "zecilor de mii", 5: "sutelor de mii",
};
