import type { Clasa } from "@/motor/tipuri";
import type { Rng } from "@/motor/rng";
import type { NivelJoc } from "../tipuri";

/** Concentrul numeric pe clase și niveluri (programa: I 0–100, II 0–1000, III 0–10 000, IV 0–1 000 000). */
export function interval(clasa: Clasa, nivel: NivelJoc): [number, number] {
  const t: Record<Clasa, Record<NivelJoc, [number, number]>> = {
    1: { usor: [0, 31], mediu: [0, 100], provocare: [10, 100] },
    2: { usor: [10, 100], mediu: [100, 1000], provocare: [100, 1000] },
    3: { usor: [100, 1000], mediu: [1000, 10000], provocare: [1000, 10000] },
    4: { usor: [1000, 10000], mediu: [10000, 1000000], provocare: [100000, 1000000] },
    5: { usor: [1000, 10000], mediu: [10000, 1000000], provocare: [100000, 1000000] },
  };
  return t[clasa][nivel];
}

export function nr(rng: Rng, [a, b]: [number, number]): number {
  return rng.int(a, b - 1);
}

export const NIV: Record<NivelJoc, number> = { usor: 0, mediu: 1, provocare: 2 };

/** Dificultate 1–10 (pentru încălzire și statistici). */
export function dif(nivel: NivelJoc, clasa: Clasa, extra = 0): number {
  return Math.min(10, 1 + NIV[nivel] * 3 + Math.floor(clasa / 2) + extra);
}

export function cifre(n: number): number[] {
  return String(n).split("").map(Number);
}

export const ORDINE = ["unități", "zeci", "sute", "mii", "zeci de mii", "sute de mii"];
export const ORDINE_SG = ["unitate", "zece", "sută", "mie", "zece mii", "sută de mii"];

export function fmt(n: number): string {
  return n >= 10000 ? n.toLocaleString("ro-RO").replace(/\./g, " ") : String(n);
}
