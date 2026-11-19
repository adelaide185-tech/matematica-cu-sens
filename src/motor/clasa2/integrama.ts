import { Rng } from "@/motor/rng";
import { numarInLitere } from "@/motor/limba";
import type { NivelC2, NotiuneC2 } from "./tipuri";

/** Numerele care se scriu într-un singur cuvânt (încap în integramă): 0–20 și zecile 30–90. */
export const NUMERE_INTEGRAMA = [...Array.from({ length: 21 }, (_, i) => i), 30, 40, 50, 60, 70, 80, 90];

export const fara = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

export interface CuvantIntegrama { indiciu: string; expr: string; valoare: number; cuvant: string; dir: "o" | "v"; r: number; c: number; nr: number }
export interface Integrama { cuvinte: CuvantIntegrama[]; rows: number; cols: number }

/** Indiciul: un calcul al cărui rezultat e numărul (după noțiunile alese). */
function indiciu(rng: Rng, v: number, notiuni: NotiuneC2[]): { text: string; expr: string } {
  const opt: (() => { text: string; expr: string } | null)[] = [];
  if (notiuni.includes("op.adunare")) opt.push(() => { const a = rng.int(0, v); return { text: `${a} + ${v - a}`, expr: `${a} + ${v - a}` }; });
  if (notiuni.includes("op.scadere")) opt.push(() => { const b = rng.int(1, Math.max(1, Math.min(20, 100 - v))); return { text: `${v + b} − ${b}`, expr: `${v + b} - ${b}` }; });
  if (notiuni.includes("op.tabla")) opt.push(() => { const d = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((x) => v % x === 0 && v / x <= 10 && v / x >= 1); if (!d.length) return null; const b = rng.pick(d); return { text: `${v / b} × ${b}`, expr: `${v / b} * ${b}` }; });
  if (notiuni.includes("op.impartire")) opt.push(() => { const b = rng.int(2, 10); if (v * b > 100) return null; return { text: `${v * b} : ${b}`, expr: `${v * b} / ${b}` }; });
  if (notiuni.includes("op.dublu")) opt.push(() => (v % 2 === 0 && v > 0 ? { text: `dublul lui ${v / 2}`, expr: `2 * ${v / 2}` } : null));
  if (notiuni.includes("num.litere") || !opt.length) opt.push(() => ({ text: String(v), expr: String(v) }));
  for (const f of rng.shuffle(opt)) { const r = f(); if (r) return r; }
  return { text: String(v), expr: String(v) };
}

/**
 * O integramă mică: cuvintele (numere scrise cu litere) se încrucișează pe litere comune.
 * Reguli: o celulă are o singură literă; cuvintele vecine paralele nu se ating; înainte și după cuvânt e liber.
 */
export function construiesteIntegrama(rng: Rng, valori: number[], notiuni: NotiuneC2[], maxLatura = 15): Integrama | null {
  const grila = new Map<string, string>();
  const k = (r: number, c: number) => `${r},${c}`;
  const puse: CuvantIntegrama[] = [];
  const poate = (w: string, r: number, c: number, dir: "o" | "v") => {
    const dr = dir === "v" ? 1 : 0, dc = dir === "o" ? 1 : 0;
    if (grila.has(k(r - dr, c - dc)) || grila.has(k(r + dr * w.length, c + dc * w.length))) return false;
    let incrucisari = 0;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i, cc = c + dc * i;
      const x = grila.get(k(rr, cc));
      if (x !== undefined) { if (x !== w[i]) return false; incrucisari++; continue; }
      // vecinii laterali trebuie să fie liberi (altfel s-ar forma cuvinte false)
      if (grila.has(k(rr + dc, cc + dr)) || grila.has(k(rr - dc, cc - dr))) return false;
    }
    return puse.length === 0 || incrucisari > 0;
  };
  const latura = () => {
    const rs = [...grila.keys()].map((x) => Number(x.split(",")[0])), cs = [...grila.keys()].map((x) => Number(x.split(",")[1]));
    return { r0: Math.min(...rs), c0: Math.min(...cs), rows: Math.max(...rs) - Math.min(...rs) + 1, cols: Math.max(...cs) - Math.min(...cs) + 1 };
  };
  for (const v of valori) {
    const w = numarInLitere(v).toUpperCase();
    if (puse.some((p) => p.cuvant === w)) continue;
    const cand: [number, number, "o" | "v"][] = [];
    if (!puse.length) cand.push([0, 0, "o"]);
    else for (const p of puse) for (let j = 0; j < p.cuvant.length; j++) for (let i = 0; i < w.length; i++) {
      if (p.cuvant[j] !== w[i]) continue;
      const dir = p.dir === "o" ? "v" : "o";
      const pr = p.dir === "o" ? p.r : p.r + j, pc = p.dir === "o" ? p.c + j : p.c;
      cand.push(dir === "v" ? [pr - i, pc, dir] : [pr, pc - i, dir]);
    }
    for (const [r, c, dir] of rng.shuffle(cand)) {
      if (!poate(w, r, c, dir)) continue;
      for (let i = 0; i < w.length; i++) grila.set(k(r + (dir === "v" ? i : 0), c + (dir === "o" ? i : 0)), w[i]);
      const l = latura();
      if (l.rows > maxLatura || l.cols > maxLatura) {
        for (let i = 0; i < w.length; i++) { const kk = k(r + (dir === "v" ? i : 0), c + (dir === "o" ? i : 0)); if (!puse.some((p) => celule(p).includes(kk))) grila.delete(kk); }
        continue;
      }
      const ind = indiciu(rng, v, notiuni);
      puse.push({ indiciu: ind.text, expr: ind.expr, valoare: v, cuvant: w, dir, r, c, nr: 0 });
      break;
    }
  }
  if (puse.length < 2) return null;
  const { r0, c0, rows, cols } = latura();
  const norm = puse.map((p) => ({ ...p, r: p.r - r0, c: p.c - c0 }));
  // numerotare ca în integrame: de sus în jos, de la stânga la dreapta
  norm.sort((a, b) => a.r - b.r || a.c - b.c).forEach((p, i) => (p.nr = i + 1));
  return { cuvinte: norm, rows, cols };
}

export function celule(p: Pick<CuvantIntegrama, "cuvant" | "dir" | "r" | "c">): string[] {
  return Array.from({ length: p.cuvant.length }, (_, i) => `${p.r + (p.dir === "v" ? i : 0)},${p.c + (p.dir === "o" ? i : 0)}`);
}

export const diacriticeObligatorii = (n: NivelC2) => n === "provocare";
