/**
 * Întrebările jocurilor arcade (Baloanele, Cursa cu porți, Racheta): o cerință scurtă și 3–4 variante.
 * Sursele sunt motoarele deja verificate (SymPy) ale fiecărei clase:
 *   clasele I–II: generatoarele generale (numerație, operații, probleme);
 *   clasa a III-a, a IV-a, a V-a: motoarele pe capitole (modul „Cursa”).
 * Variantele greșite sunt apropiate de răspuns (±1, ±10, cifre inversate), ca să conteze calculul, nu ghicitul.
 */
import { Rng } from "@/motor/rng";
import { fmt, hash } from "@/motor/calcul/generator";
import type { Clasa, Nivel } from "@/motor/tipuri";
import { generator } from "@/motor/registru";
import { CAPITOLE, configC3Implicita } from "@/motor/clasa3/config";
import { genereazaC3 } from "@/motor/clasa3/generator";
import { CAPITOLE_C4, configC4Implicita } from "@/motor/clasa4/config";
import { genereazaC4 } from "@/motor/clasa4/generator";
import { CAPITOLE_C5, configC5Implicita } from "@/motor/clasa5/config";
import { genereazaC5 } from "@/motor/clasa5/generator";
import type { RaspunsC3 } from "@/motor/clasa3/tipuri";

export interface IntrebareArcade {
  id: string;
  /** cerința (scurtă; „□” = locul răspunsului, „○” = semnul de pus) */
  text: string;
  corect: string;
  /** 3 sau 4 variante, amestecate; conțin răspunsul corect o singură dată */
  variante: string[];
  /** explicația arătată după a doua greșeală */
  rezolvare: string[];
  /** capitolul sau generatorul de origine (pentru rapoarte) */
  sursa: string;
}

export type DificultateArcade = "usor" | "mediu" | "greu";
export const NUME_DIFICULTATE: Record<DificultateArcade, string> = { usor: "Ușor", mediu: "Mediu", greu: "Greu" };

const LUNG_MAX = 110;

/** variante numerice apropiate de răspuns */
export function variantNumerice(rng: Rng, v: number): string[] {
  const cand = new Set<number>();
  const inv = Number(String(v).split("").reverse().join(""));
  for (const d of [1, -1, 10, -10, 2, -2, v >= 100 ? 100 : 5, v >= 100 ? -100 : -5, 9, -9]) cand.add(v + d);
  if (inv !== v) cand.add(inv);
  const bune = rng.shuffle([...cand].filter((x) => x >= 0 && x !== v && Number.isInteger(x)));
  // primele două cele mai apropiate (±1, ±10) au prioritate, apoi restul
  const aproape = bune.filter((x) => Math.abs(x - v) <= 10).slice(0, 2);
  const rest = bune.filter((x) => !aproape.includes(x));
  return rng.shuffle([v, ...aproape, ...rest].slice(0, 4)).map(fmt);
}

function dinRaspunsC3(rng: Rng, r: RaspunsC3, afis: string): { corect: string; variante: string[] } | null {
  if (r.tip === "numar") { const variante = variantNumerice(rng, r.valoare); return { corect: fmt(r.valoare), variante }; }
  if (r.tip === "varianta") return r.variante.length >= 3 ? { corect: r.valoare, variante: rng.shuffle(r.variante.slice(0, 4).includes(r.valoare) ? r.variante.slice(0, 4) : [r.valoare, ...r.variante.filter((x) => x !== r.valoare).slice(0, 3)]) } : null;
  if (r.tip === "rest") {
    const t = (c: number, x: number) => `${fmt(c)} rest ${x}`;
    const alt = [t(r.cat + 1, r.rest), t(r.cat, r.rest + 1), t(Math.max(0, r.cat - 1), r.rest), t(r.cat, Math.max(0, r.rest - 1))].filter((x) => x !== t(r.cat, r.rest));
    return { corect: t(r.cat, r.rest), variante: rng.shuffle([t(r.cat, r.rest), ...[...new Set(alt)].slice(0, 3)]) };
  }
  void afis;
  return null;
}

/** textul fără „□ = …” la final: arcade arată doar cerința */
const curata = (t: string) => t.replace(/\s+/g, " ").trim();

/** explicația scurtă a unei cerințe: completăm locul gol cu răspunsul */
function explica(text: string, corect: string): string {
  if (text.includes("○")) return `${text.replace("○", corect)}: compară cifrele de la stânga la dreapta (ordinul cel mai mare întâi).`;
  if (text.includes("□")) return `${text.replace("□", corect)} (verifică: pune ${corect} în locul căsuței).`;
  if (/=$/.test(text)) return `${text} ${corect}`;
  return `Răspunsul: ${corect}`;
}

/** generatoarele generale folosite la clasele I–II (doar cerințe text, fără desen) */
const SURSE_MICI: Record<1 | 2, string[]> = {
  1: ["operatii.adunare-scadere", "operatii.adunare-scadere", "operatii.termen-necunoscut", "numeratie.compunere", "numeratie.comparare", "numeratie.litere", "probleme.o-operatie"],
  2: ["operatii.adunare-scadere", "operatii.tabla-inmultirii", "operatii.impartire-tabla", "operatii.termen-necunoscut", "operatii.ordinea-operatiilor", "numeratie.comparare", "numeratie.rotunjire", "numeratie.litere", "probleme.o-operatie", "probleme.doua-operatii"],
};
const NIVEL_GEN: Record<DificultateArcade, Nivel> = { usor: "consolidare", mediu: "aprofundare", greu: "aprofundare" };

function dinGeneratoare(clasa: 1 | 2, seed: number, n: number, dif: DificultateArcade): IntrebareArcade[] {
  const out: IntrebareArcade[] = [];
  const vazute = new Set<string>();
  const surse = SURSE_MICI[clasa];
  for (let i = 0; out.length < n && i < n * 40; i++) {
    const rng = new Rng(hash(seed, i, 17));
    const id = surse[i % surse.length];
    const item = generator(id).generate(rng.fork(i), NIVEL_GEN[dif], clasa as Clasa);
    const c = rng.pick(item.cerinte);
    if (!c || c.vizual || item.vizual || c.mecanica) continue;
    let text = c.text && c.text !== "Răspuns:" ? c.text : item.enunt;
    text = curata(text.replace(/_{2,}/g, c.optiuni ? "○" : "□").replace(/ =$/, " ="));
    if (!text || text.length > LUNG_MAX || vazute.has(text)) continue;
    let corect: string, variante: string[];
    if (c.optiuni && c.optiuni.length >= 3) {
      corect = c.raspuns; variante = rng.shuffle(c.optiuni.slice(0, 4));
      if (!variante.includes(corect)) continue;
    } else if (/^\d+$/.test(c.raspuns)) {
      const v = Number(c.raspuns); corect = fmt(v); variante = variantNumerice(rng, v);
    } else continue;
    if (new Set(variante).size !== variante.length) continue;
    vazute.add(text);
    // un item general poate avea mai multe cerințe (a, b, c…): rezolvarea lui completă e doar pentru itemii cu o singură cerință
    const rezolvare = item.cerinte.length === 1 && item.rezolvare.length ? item.rezolvare.slice(0, 4) : [explica(text, corect)];
    out.push({ id: `a${out.length}`, text, corect, variante, rezolvare, sursa: id });
  }
  return out;
}

/** Cele mai potrivite capitole pentru joc rapid (fără desene) */
function dinMotor(clasa: 3 | 4 | 5, seed: number, n: number, dif: DificultateArcade): IntrebareArcade[] {
  const out: IntrebareArcade[] = [];
  const vazute = new Set<string>();
  // câteva loturi, până avem destule întrebări scurte și fără desen
  for (let lot = 0; lot < 5 && out.length < n; lot++) dinLot(clasa, lot ? hash(seed, lot, 31) % 2 ** 31 : seed, n, dif, out, vazute);
  return out.map((q, i) => ({ ...q, id: `a${i}` }));
}

function dinLot(clasa: 3 | 4 | 5, seed: number, n: number, dif: DificultateArcade, out: IntrebareArcade[], vazute: Set<string>) {
  const nivel = dif === "usor" ? "1" : dif === "greu" ? "2" : "amestecat";
  const itemi = clasa === 3
    ? genereazaC3({ ...configC3Implicita(seed), capitole: CAPITOLE.filter((c) => c !== "fractii"), joc: "sprint", nr: Math.min(100, n * 3) }).itemi
    : clasa === 4
      ? genereazaC4({ ...configC4Implicita(seed), capitole: CAPITOLE_C4.filter((c) => c !== "tabele"), nivel, joc: "sprint", nr: Math.min(100, n * 3) }).itemi
      : genereazaC5({ ...configC5Implicita(seed), capitole: CAPITOLE_C5, nivel, joc: "sprint", nr: Math.min(100, n * 3) }).itemi;
  for (const it of itemi) {
    if (out.length >= n) break;
    const x = it as typeof it & { desen?: unknown; rezolvare?: string[] };
    if (x.desen || it.figura || it.fractie || it.text.length > LUNG_MAX || vazute.has(curata(it.text))) continue;
    const rng = new Rng(hash(seed, out.length, 23, it.text.length));
    const v = dinRaspunsC3(rng, it.raspuns, it.afis);
    if (!v || new Set(v.variante).size !== v.variante.length || !v.variante.includes(v.corect)) continue;
    vazute.add(curata(it.text));
    out.push({ id: `a${out.length}`, text: curata(it.text), corect: v.corect, variante: v.variante, rezolvare: x.rezolvare?.length ? x.rezolvare : [it.indiciu, explica(curata(it.text), v.corect)], sursa: it.capitol });
  }
}

/** n întrebări (deterministe pentru același seed) pentru clasa aleasă. */
export function intrebariArcade(clasa: Clasa, seed: number, n: number, dif: DificultateArcade = "mediu"): IntrebareArcade[] {
  const k = Math.max(5, Math.min(30, Math.floor(n)));
  return clasa <= 2 ? dinGeneratoare(clasa as 1 | 2, seed, k, dif) : dinMotor(clasa as 3 | 4 | 5, seed, k, dif);
}
