import { Rng } from "@/motor/rng";
import { PERECHI_VARSTA, RUNDE_VARSTA, VARIANTE_VARSTA, cuCuvant, type Cuvant, type Unitate, type Varsta } from "./continut";

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

// ───────── jocurile noi ─────────

/** Cârtița: aceleași runde ca „Ascultă și atinge”, cu imaginile așezate în găuri (poziții amestecate). */
export const GAURI_VARSTA: Record<Varsta, number> = { 4: 4, 5: 6, 6: 6 };
export function rundeCartita(u: Unitate, varsta: Varsta, seed: number): (Runda & { gauri: (Cuvant | null)[] })[] {
  const rng = new Rng(seed + 7);
  return rundeAsculta(u, varsta, seed).map((r) => {
    const g: (Cuvant | null)[] = Array(GAURI_VARSTA[varsta]).fill(null);
    rng.shuffle(g.map((_, i) => i)).slice(0, r.variante.length).forEach((poz, i) => { g[poz] = r.variante[i]; });
    return { ...r, gauri: g };
  });
}

/** Baloanele: o variantă în plus față de „Ascultă și atinge” (baloanele sunt mai multe). */
export function rundeBaloane(u: Unitate, varsta: Varsta, seed: number): Runda[] {
  const rng = new Rng(seed + 11);
  return rundeAsculta(u, varsta, seed).map((r) => {
    const extra = rng.shuffle(u.cuvinte.filter((c) => !r.variante.includes(c)))[0];
    return { ...r, variante: extra && r.variante.length < 5 ? rng.shuffle([...r.variante, extra]) : r.variante };
  });
}

/** Cutiile: toate cuvintele unității (la 4 ani, primele 6), amestecate. */
export function cutii(u: Unitate, varsta: Varsta, seed: number): Cuvant[] {
  const n = { 4: 6, 5: 8, 6: 10 }[varsta];
  return new Rng(seed + 13).shuffle(u.cuvinte).slice(0, Math.min(n, u.cuvinte.length));
}

/** Roata: segmentele (6–8 cuvinte) și ordinea în care se oprește roata (fiecare segment o dată). */
export function roata(u: Unitate, varsta: Varsta, seed: number): { segmente: Cuvant[]; opriri: number[] } {
  const rng = new Rng(seed + 17);
  const segmente = rng.shuffle(u.cuvinte).slice(0, Math.min(varsta === 4 ? 6 : 8, u.cuvinte.length));
  return { segmente, opriri: rng.shuffle(segmente.map((_, i) => i)) };
}

/** Sortează: imagini din unitatea curentă și dintr-o altă unitate; două coșuri. */
export function sortare(u: Unitate, toate: Unitate[], varsta: Varsta, seed: number): { cosuri: [Unitate, Unitate]; itemi: { c: Cuvant; cos: 0 | 1 }[] } {
  const rng = new Rng(seed + 19);
  const n = { 4: 2, 5: 3, 6: 4 }[varsta];
  const alta = rng.pick(toate.filter((x) => x.id !== u.id));
  const itemi = [
    ...rng.shuffle(u.cuvinte).slice(0, n).map((c) => ({ c, cos: 0 as const })),
    ...rng.shuffle(alta.cuvinte).slice(0, n).map((c) => ({ c, cos: 1 as const })),
  ];
  return { cosuri: [u, alta], itemi: rng.shuffle(itemi) };
}

/** O piesă a propoziției: text (cu pictogramă) sau imaginea cuvântului. */
export interface Piesa { id: string; text: string; poza?: Cuvant }
export interface RundaPropozitie { propozitie: string; piese: Piesa[]; capcana?: Piesa }

/**
 * Construiește propoziția: propoziția model a unității („I can see a {w}.”) împărțită în piese.
 * 6 ani: fiecare cuvânt e o piesă; 5 ani: cel mult 3 piese; 4 ani: 2 piese (începutul + imaginea).
 * O piesă-capcană (altă imagine) se adaugă printre piese.
 */
export function rundePropozitie(u: Unitate, varsta: Varsta, seed: number): RundaPropozitie[] {
  const rng = new Rng(seed + 23);
  const n = { 4: 4, 5: 5, 6: 6 }[varsta];
  const tinte = rng.shuffle(u.cuvinte).slice(0, Math.min(n, u.cuvinte.length));
  return tinte.map((c, k) => {
    const cuvinte = u.fraza.replace(/[.,!?]/g, "").split(" ");
    const iw = cuvinte.indexOf("{w}");
    const inainte = cuvinte.slice(0, iw), dupa = cuvinte.slice(iw + 1);
    let grupe: string[][];
    if (varsta === 6) grupe = inainte.map((w) => [w]);
    else if (varsta === 5 && inainte.length > 2) grupe = [inainte.slice(0, Math.ceil(inainte.length / 2)), inainte.slice(Math.ceil(inainte.length / 2))];
    else if (varsta === 5) grupe = inainte.map((w) => [w]);
    else grupe = inainte.length ? [inainte] : [];
    const piese: Piesa[] = grupe.map((g, i) => ({ id: `t${k}-${i}`, text: g.join(" ") }));
    const poza: Piesa = { id: `p${k}`, text: varsta === 4 && dupa.length ? `${c.en} ${dupa.join(" ")}` : c.en, poza: c };
    piese.push(poza);
    if (varsta !== 4) dupa.forEach((w, i) => piese.push({ id: `d${k}-${i}`, text: w }));
    const alt = rng.pick(u.cuvinte.filter((x) => x.en !== c.en));
    return { propozitie: cuCuvant(u.fraza, c.en), piese, capcana: alt ? { id: `x${k}`, text: alt.en, poza: alt } : undefined };
  });
}
