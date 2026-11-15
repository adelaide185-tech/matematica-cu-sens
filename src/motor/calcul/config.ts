import type { Antet, Bloc, ConfigCalcul, OpSimbol, Rest, TipOperatie, Trecere, VariantaMentala } from "./tipuri";
import { NR_MAX } from "./tipuri";

export function blocImplicit(tip: TipOperatie): Bloc {
  switch (tip) {
    case "adunare": return { tip, nr: 10, min: 0, max: 100, rezultatInInterval: true, termeni: 2, trecere: "oricare", coloana: false };
    case "scadere": return { tip, nr: 10, min: 0, max: 100, rezultatInInterval: true, trecere: "oricare", negative: false, coloana: false };
    case "inmultire": return { tip, nr: 10, min: 0, max: 10, rezultatInInterval: false, min2: 2, max2: 10, tabele: [2, 3, 4, 5, 6, 7, 8, 9, 10], coloana: false };
    case "impartire": return { tip, nr: 10, min: 0, max: 100, rezultatInInterval: true, min2: 2, max2: 10, tabele: [2, 3, 4, 5, 6, 7, 8, 9, 10], rest: "exacta" };
    case "combinate": return { tip, nr: 10, min: 0, max: 100, rezultatInInterval: true, min2: 2, max2: 10, operatii: ["+", "-", "×", ":"], nrOperatii: 2, paranteze: false };
    case "ecuatii": return { tip, nr: 10, min: 0, max: 100, rezultatInInterval: true, min2: 2, max2: 10, operatii: ["+", "-"] };
    case "mental": return { tip, nr: 10, min: 1, max: 100, rezultatInInterval: false, variante: ["x10", "impartire10", "rotunde", "dublu", "complement"] };
  }
}

export const antetImplicit = (): Antet => ({ titlu: "Fișă de calcul", centru: "Fabrica de Inteligență", profesor: "", data: "", timp: "", logo: true });

export function configImplicita(seed = 1): ConfigCalcul {
  return {
    seed,
    blocuri: [blocImplicit("adunare"), blocImplicit("scadere")],
    amesteca: false,
    inlocuiri: {},
    coloane: "auto",
    simbolInmultire: "×",
    necunoscuta: "□",
    antet: antetImplicit(),
  };
}

// ───── serializare în URL (base64url) și validare ─────

function b64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deb64(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export const codifica = (cfg: ConfigCalcul) => b64(JSON.stringify(cfg));

/** Citește o configurație venită din URL sau din baza de date; orice valoare greșită e înlocuită cu una sigură. */
export function decodifica(s: string | null | undefined): ConfigCalcul | null {
  if (!s) return null;
  try {
    return curata(JSON.parse(deb64(s)));
  } catch {
    return null;
  }
}

const TIPURI: TipOperatie[] = ["adunare", "scadere", "inmultire", "impartire", "combinate", "ecuatii", "mental"];
const OPS: OpSimbol[] = ["+", "-", "×", ":"];
const VARIANTE: VariantaMentala[] = ["x10", "impartire10", "rotunde", "dublu", "complement"];
const int = (v: unknown, lo: number, hi: number, impl: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : impl;
};
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");
const unul = <T,>(v: unknown, voie: readonly T[], impl: T): T => (voie.includes(v as T) ? (v as T) : impl);
const lista = <T,>(v: unknown, voie: readonly T[]): T[] | undefined => (Array.isArray(v) ? [...new Set(v.filter((x) => voie.includes(x)))] : undefined);

export function curataBloc(x: Record<string, unknown>): Bloc {
  const tip = unul(x.tip, TIPURI, "adunare");
  const d = blocImplicit(tip);
  const min = int(x.min, 0, 1_000_000, d.min);
  const max = Math.max(min, int(x.max, 0, 1_000_000, d.max));
  const min2 = int(x.min2, 1, 1000, d.min2 ?? 2);
  const max2 = Math.max(min2, int(x.max2, 1, 1000, d.max2 ?? 10));
  return {
    tip,
    nr: int(x.nr, 0, NR_MAX, d.nr),
    min, max,
    rezultatInInterval: Boolean(x.rezultatInInterval ?? d.rezultatInInterval),
    min2, max2,
    tabele: lista(x.tabele, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    termeni: int(x.termeni, 2, 4, 2),
    trecere: unul<Trecere>(x.trecere, ["oricare", "fara", "cu"], "oricare"),
    negative: Boolean(x.negative),
    rest: unul<Rest>(x.rest, ["exacta", "cu-rest", "amestecat"], "exacta"),
    coloana: Boolean(x.coloana),
    operatii: lista(x.operatii, OPS) ?? d.operatii,
    nrOperatii: int(x.nrOperatii, 2, 3, 2),
    paranteze: Boolean(x.paranteze),
    variante: lista(x.variante, VARIANTE) ?? d.variante,
  };
}

export function curata(x: Record<string, unknown>): ConfigCalcul {
  const a = (x.antet ?? {}) as Record<string, unknown>;
  const inl: Record<string, number> = {};
  if (x.inlocuiri && typeof x.inlocuiri === "object")
    for (const [k, v] of Object.entries(x.inlocuiri as Record<string, unknown>)) if (/^b\d+-\d+$/.test(k)) inl[k] = int(v, 0, 1e9, 0);
  const blocuri = Array.isArray(x.blocuri) ? x.blocuri.slice(0, 12).map((b) => curataBloc(b as Record<string, unknown>)) : [];
  return {
    seed: int(x.seed, 0, 2 ** 31, 1),
    blocuri: blocuri.length ? blocuri : [blocImplicit("adunare")],
    amesteca: Boolean(x.amesteca),
    inlocuiri: inl,
    coloane: x.coloane === 2 || x.coloane === 3 || x.coloane === 4 ? x.coloane : "auto",
    simbolInmultire: x.simbolInmultire === "·" ? "·" : "×",
    necunoscuta: unul(x.necunoscuta, ["□", "x", "a", "?"] as const, "□"),
    antet: {
      titlu: str(a.titlu) || "Fișă de calcul",
      centru: str(a.centru),
      profesor: str(a.profesor),
      data: str(a.data, 40),
      timp: str(a.timp, 40),
      logo: a.logo === undefined ? true : Boolean(a.logo),
    },
  };
}
