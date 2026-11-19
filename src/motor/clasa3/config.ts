import { antetImplicit, b64, deb64 } from "@/motor/calcul/config";
import { hash } from "@/motor/calcul/generator";
import type { CapitolC3, ConfigC3, JocC3, OptiuniC3 } from "./tipuri";

export const CAPITOLE: CapitolC3[] = ["numere", "adunare", "inmultire", "impartire", "ordine", "fractii", "masuri", "probleme"];
export const JOCURI: JocC3[] = ["sprint", "memory", "balanta", "detectiv", "constructor"];

export const optiuniImplicite = (): OptiuniC3 => ({
  numere: ["citire", "descompunere", "comparare", "ordonare", "rotunjire", "romane"],
  adunare: { trecere: "oricare", necunoscut: true },
  inmultire: { tipuri: ["tabla", "x10", "1cifra", "2cifre", "proprietati"], trecere: "oricare" },
  impartire: { tipuri: ["tabla", "1cifra"], rest: "amestecat" },
  ordine: { paranteze: "amestecat" },
  fractii: ["citire", "reprezentare", "comparare", "tip", "din-intreg"],
  masuri: ["perimetru", "lungime", "capacitate", "masa", "timp", "bani"],
  probleme: ["figurativa", "mers-invers"],
});

export function configC3Implicita(seed = 1): ConfigC3 {
  return {
    seed, capitole: ["adunare", "inmultire"], optiuni: optiuniImplicite(), joc: "sprint", nr: 10, vieti: 0, viteza: 1,
    inlocuiri: {}, coloane: "auto", antet: { ...antetImplicit(), titlu: "Matematică – clasa a III-a" },
  };
}

export const codificaC3 = (c: ConfigC3) => b64(JSON.stringify(c));

const lista = <T,>(v: unknown, voie: readonly T[], impl: T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x) => voie.includes(x)))] : impl);
const unul = <T,>(v: unknown, voie: readonly T[], impl: T): T => (voie.includes(v as T) ? (v as T) : impl);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");

/** Citește configurația din URL sau din baza de date; valorile greșite devin valori sigure. */
export function curataC3(x: Record<string, unknown>): ConfigC3 {
  const d = configC3Implicita();
  const o = (x.optiuni ?? {}) as Record<string, Record<string, unknown> | unknown[]>;
  const oi = d.optiuni;
  const obj = (k: string) => (o[k] && typeof o[k] === "object" && !Array.isArray(o[k]) ? (o[k] as Record<string, unknown>) : {});
  const a = (x.antet ?? {}) as Record<string, unknown>;
  const inl: Record<string, number> = {};
  if (x.inlocuiri && typeof x.inlocuiri === "object")
    for (const [k, v] of Object.entries(x.inlocuiri as Record<string, unknown>)) if (/^i\d+$/.test(k) && Number.isFinite(Number(v))) inl[k] = Math.max(0, Math.floor(Number(v)));
  const nr = Math.floor(Number(x.nr));
  const capitole = lista(x.capitole, CAPITOLE, d.capitole);
  return {
    seed: Number.isFinite(Number(x.seed)) ? Math.abs(Math.floor(Number(x.seed))) % 2 ** 31 : 1,
    capitole: capitole.length ? capitole : d.capitole,
    optiuni: {
      numere: lista(o.numere, oi.numere, oi.numere),
      adunare: { trecere: unul(obj("adunare").trecere, ["oricare", "fara", "cu"] as const, "oricare"), necunoscut: Boolean(obj("adunare").necunoscut ?? true) },
      inmultire: { tipuri: lista(obj("inmultire").tipuri, oi.inmultire.tipuri, oi.inmultire.tipuri), trecere: unul(obj("inmultire").trecere, ["oricare", "fara", "cu"] as const, "oricare") },
      impartire: { tipuri: lista(obj("impartire").tipuri, oi.impartire.tipuri, oi.impartire.tipuri), rest: unul(obj("impartire").rest, ["exacta", "cu-rest", "amestecat"] as const, "amestecat") },
      ordine: { paranteze: unul(obj("ordine").paranteze, ["fara", "cu", "amestecat"] as const, "amestecat") },
      fractii: lista(o.fractii, oi.fractii, oi.fractii),
      masuri: lista(o.masuri, oi.masuri, oi.masuri),
      probleme: lista(o.probleme, oi.probleme, oi.probleme),
    },
    joc: unul(x.joc, JOCURI, "sprint"),
    nr: Number.isFinite(nr) ? Math.min(100, Math.max(1, nr)) : 10,
    vieti: unul(Number(x.vieti), [0, 3, 5] as const, 0),
    viteza: unul(Number(x.viteza), [1, 2, 3] as const, 1),
    inlocuiri: inl,
    coloane: x.coloane === 2 || x.coloane === 3 || x.coloane === 4 ? x.coloane : "auto",
    antet: {
      titlu: str(a.titlu) || d.antet.titlu, centru: str(a.centru), profesor: str(a.profesor), data: str(a.data, 40), timp: str(a.timp, 40),
      logo: a.logo === undefined ? true : Boolean(a.logo),
    },
  };
}

export function decodificaC3(s: string | null | undefined): ConfigC3 | null {
  if (!s) return null;
  try {
    return curataC3(JSON.parse(deb64(s)));
  } catch {
    return null;
  }
}

/**
 * Configurația pentru încercarea n a aceluiași joc: „Mai încerc o dată” aduce alte exerciții
 * (același tip, alte numere), ca elevul să nu învețe răspunsurile pe de rost. Serverul folosește aceeași regulă.
 */
export function cfgIncercare(cfg: ConfigC3, n: number): ConfigC3 {
  return n ? { ...cfg, seed: hash(cfg.seed, n) % 2 ** 31, inlocuiri: {} } : cfg;
}
