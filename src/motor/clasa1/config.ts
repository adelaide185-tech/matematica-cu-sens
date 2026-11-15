import { b64, deb64 } from "@/motor/calcul/config";
import { CAPITOLE_C1, FORME_TERMEN, SUBTEME_BANI, SUBTEME_GEOMETRIE, SUBTEME_NUMERE, SUBTEME_TIMP } from "./capitole";
import { NR_EXERCITII_C1, SECUNDE_C1, type CapitolC1, type ConfigClasa1, type JocC1, type OptiuniC1, type Trecere } from "./tipuri";

export const JOCURI_TOATE: JocC1[] = ["grupeaza", "cursa", "perechi", "balanta", "casuta"];

export function optiuniImplicite(): OptiuniC1 {
  return {
    numere: { subteme: SUBTEME_NUMERE.map((s) => s.id), pasi: [1, 2, 5, 10] },
    adsc20: { trecere: "ambele", operatii: ["+", "-"] },
    adsc100: { trecere: "fara", operatii: ["+", "-"] },
    termen: { forme: ["a+x=b", "x+a=b", "a-x=b", "x-a=b"], max: 20 },
    geometrie: { subteme: SUBTEME_GEOMETRIE.map((s) => s.id) },
    timp: { subteme: SUBTEME_TIMP.map((s) => s.id), jumatati: true },
    bani: { subteme: SUBTEME_BANI.map((s) => s.id) },
    probleme: { douaOperatii: false, max: 20 },
  };
}

export function configImplicitaC1(seed = 1): ConfigClasa1 {
  return {
    seed,
    capitole: ["adsc20"],
    n: 10,
    optiuni: optiuniImplicite(),
    suportVizual: true,
    jocuri: [...JOCURI_TOATE],
    cronometru: false,
    secunde: 30,
    coloane: 2,
    albNegru: false,
    antet: { titlu: "Matematică · Clasa I", scoala: "", profesor: "", data: "" },
  };
}

// ───── validare (orice valoare venită din URL sau din baza de date) ─────

const lista = <T extends string | number>(v: unknown, permise: readonly T[], impl: T[]): T[] => {
  if (!Array.isArray(v)) return impl;
  const r = permise.filter((p) => v.includes(p));
  return r.length ? r : impl;
};
const unul = <T extends string | number>(v: unknown, permise: readonly T[], impl: T): T => (permise.includes(v as T) ? (v as T) : impl);
const text = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");
const TRECERI: Trecere[] = ["fara", "cu", "ambele"];

export function curataC1(x: Record<string, unknown>): ConfigClasa1 {
  const impl = configImplicitaC1();
  const o = (x.optiuni ?? {}) as Record<string, Record<string, unknown>>;
  const oi = impl.optiuni;
  const seed = Math.floor(Number(x.seed));
  const n = Math.floor(Number(x.n));
  const sec = Math.floor(Number(x.secunde));
  const antet = (x.antet ?? {}) as Record<string, unknown>;
  return {
    seed: Number.isFinite(seed) && seed > 0 ? seed % 2 ** 31 : 1,
    capitole: lista<CapitolC1>(x.capitole, CAPITOLE_C1.map((c) => c.id), impl.capitole),
    n: (NR_EXERCITII_C1 as readonly number[]).includes(n) ? n : impl.n,
    optiuni: {
      numere: {
        subteme: lista(o.numere?.subteme, SUBTEME_NUMERE.map((s) => s.id), oi.numere.subteme),
        pasi: lista(o.numere?.pasi, [1, 2, 5, 10] as const, oi.numere.pasi),
      },
      adsc20: { trecere: unul(o.adsc20?.trecere, TRECERI, oi.adsc20.trecere), operatii: lista(o.adsc20?.operatii, ["+", "-"] as const, oi.adsc20.operatii) },
      adsc100: { trecere: unul(o.adsc100?.trecere, TRECERI, oi.adsc100.trecere), operatii: lista(o.adsc100?.operatii, ["+", "-"] as const, oi.adsc100.operatii) },
      termen: { forme: lista(o.termen?.forme, FORME_TERMEN.map((f) => f.id), oi.termen.forme), max: unul(o.termen?.max, [20, 100] as const, oi.termen.max) },
      geometrie: { subteme: lista(o.geometrie?.subteme, SUBTEME_GEOMETRIE.map((s) => s.id), oi.geometrie.subteme) },
      timp: { subteme: lista(o.timp?.subteme, SUBTEME_TIMP.map((s) => s.id), oi.timp.subteme), jumatati: o.timp?.jumatati === undefined ? oi.timp.jumatati : Boolean(o.timp.jumatati) },
      bani: { subteme: lista(o.bani?.subteme, SUBTEME_BANI.map((s) => s.id), oi.bani.subteme) },
      probleme: { douaOperatii: Boolean(o.probleme?.douaOperatii), max: unul(o.probleme?.max, [20, 100] as const, oi.probleme.max) },
    },
    suportVizual: x.suportVizual === undefined ? impl.suportVizual : Boolean(x.suportVizual),
    jocuri: Array.isArray(x.jocuri) ? JOCURI_TOATE.filter((j) => (x.jocuri as unknown[]).includes(j)) : impl.jocuri,
    cronometru: Boolean(x.cronometru),
    secunde: (SECUNDE_C1 as readonly number[]).includes(sec) ? sec : impl.secunde,
    coloane: x.coloane === 3 ? 3 : 2,
    albNegru: Boolean(x.albNegru),
    antet: { titlu: text(antet.titlu) || impl.antet.titlu, scoala: text(antet.scoala), profesor: text(antet.profesor), data: text(antet.data, 40) },
  };
}

export const codificaC1 = (cfg: ConfigClasa1) => b64(JSON.stringify(cfg));

export function decodificaC1(s: string | null | undefined): ConfigClasa1 | null {
  if (!s) return null;
  try {
    return curataC1(JSON.parse(deb64(s)));
  } catch {
    return null;
  }
}
