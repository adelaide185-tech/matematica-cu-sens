import { Rng } from "@/motor/rng";
import { PERECHI_VARSTA, RUNDE_VARSTA, VARIANTE_VARSTA, type Cuvant, type Unitate, type Varsta } from "./continut";

export interface Runda { tinta: Cuvant; variante: Cuvant[] }

/**
 * Rundele de la „Ascultă și atinge”: fiecare cuvânt al unității apare pe rând (amestecat),
 * fără același cuvânt de două ori la rând; variantele sunt alte cuvinte din aceeași unitate.
 */
export function rundeAsculta(u: Unitate, varsta: Varsta, seed: number): Runda[] {
  const rng = new Rng(seed);
  const n = RUNDE_VARSTA[varsta], k = Math.min(VARIANTE_VARSTA[varsta], u.cuvinte.length);
  // la 4 ani folosim doar primele cuvinte ale unității (cele mai cunoscute)
  const cuvinte = varsta === 4 ? u.cuvinte.slice(0, 6) : u.cuvinte;
  const ordine: Cuvant[] = [];
  while (ordine.length < n) {
    for (const c of rng.shuffle(cuvinte)) if (ordine.length < n && ordine.at(-1)?.en !== c.en) ordine.push(c);
  }
  return ordine.map((tinta) => ({ tinta, variante: rng.shuffle([tinta, ...rng.shuffle(cuvinte.filter((c) => c.en !== tinta.en)).slice(0, k - 1)]) }));
}

/** Cartonașele de la Perechi: câte două din fiecare cuvânt ales, amestecate. */
export function cartiPerechi(u: Unitate, varsta: Varsta, seed: number): { cheie: string; c: Cuvant }[] {
  const rng = new Rng(seed);
  const alese = rng.shuffle(u.cuvinte).slice(0, Math.min(PERECHI_VARSTA[varsta], u.cuvinte.length));
  return rng.shuffle(alese.flatMap((c) => [{ cheie: `${c.en}-a`, c }, { cheie: `${c.en}-b`, c }]));
}

/** Stele (mereu cel puțin una: la 4–6 ani contează efortul): 3 = aproape fără greșeli. */
export function steleAsculta(greseli: number, runde: number): number {
  return greseli <= 1 ? 3 : greseli <= Math.ceil(runde / 3) ? 2 : 1;
}
export function stelePerechi(mutari: number, perechi: number): number {
  return mutari <= perechi * 2 ? 3 : mutari <= perechi * 3 ? 2 : 1;
}
