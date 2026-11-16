import { antetImplicit, b64, deb64 } from "@/motor/calcul/config";
import { hash } from "@/motor/calcul/generator";
import { CAPITOLE_C2, type ConfigC2, type JocC2, type NotiuneC2, type OptiuniC2 } from "./tipuri";

export const NOTIUNI_C2: NotiuneC2[] = CAPITOLE_C2.flatMap((c) => c.notiuni.map(([n]) => n));
export const JOCURI_LISTA_C2: JocC2[] = ["perechi", "bule", "scara", "casute", "balanta", "ordonare", "memorie", "ceas", "magazin"];

export const optiuniC2Implicite = (): OptiuniC2 => ({
  trecere: "oricum", trecereLa: "zeci", forme: ["a+x=b", "x+a=b", "x-a=b", "a-x=b"], table: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  dublu: ["dublul", "triplul", "jumatatea", "sfertul"], rotunjireLa: 0, fractii: ["1/2", "1/4"], timpPas: 30, baniMax: 100, sens: "ambele",
});

export function configC2Implicita(seed = 1): ConfigC2 {
  return {
    seed, notiuni: ["op.tabla"], optiuni: optiuniC2Implicite(), joc: "perechi", nr: 10, nivel: "alege", vieti: 3, modScara: "variante",
    inlocuiri: {}, coloane: "auto", antet: { ...antetImplicit(), titlu: "Matematică – clasa a II-a" },
  };
}

export const codificaC2 = (c: ConfigC2) => b64(JSON.stringify(c));

const lista = <T,>(v: unknown, voie: readonly T[], impl: T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x) => voie.includes(x)))] : impl);
const unul = <T,>(v: unknown, voie: readonly T[], impl: T): T => (voie.includes(v as T) ? (v as T) : impl);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");

/** Configurația din URL / baza de date, cu valorile din afara programei înlocuite (produse ≤ 100, ½ ¼ ⅓, sume ≤ 100 lei). */
export function curataC2(x: Record<string, unknown>): ConfigC2 {
  const d = configC2Implicita();
  const o = (x.optiuni ?? {}) as Record<string, unknown>;
  const oi = d.optiuni;
  const a = (x.antet ?? {}) as Record<string, unknown>;
  const inl: Record<string, number> = {};
  if (x.inlocuiri && typeof x.inlocuiri === "object")
    for (const [k, v] of Object.entries(x.inlocuiri as Record<string, unknown>)) if (/^i\d+$/.test(k) && Number.isFinite(Number(v))) inl[k] = Math.max(0, Math.floor(Number(v)));
  const notiuni = lista(x.notiuni, NOTIUNI_C2, d.notiuni);
  const table = lista(o.table, [2, 3, 4, 5, 6, 7, 8, 9, 10], oi.table);
  const nr = Math.floor(Number(x.nr));
  return {
    seed: Number.isFinite(Number(x.seed)) ? Math.abs(Math.floor(Number(x.seed))) % 2 ** 31 : 1,
    notiuni: notiuni.length ? notiuni : d.notiuni,
    optiuni: {
      trecere: unul(o.trecere, ["fara", "cu", "oricum"] as const, "oricum"),
      trecereLa: unul(o.trecereLa, ["zeci", "sute", "ambele"] as const, "zeci"),
      forme: lista(o.forme, ["a+x=b", "x+a=b", "x-a=b", "a-x=b", "xb=c", "ax=c"] as const, oi.forme),
      table: table.length ? table : oi.table,
      dublu: lista(o.dublu, ["dublul", "triplul", "jumatatea", "sfertul"] as const, oi.dublu),
      rotunjireLa: unul(Number(o.rotunjireLa), [10, 100, 0] as const, 0),
      fractii: lista(o.fractii, ["1/2", "1/4", "1/3"] as const, oi.fractii),
      timpPas: unul(Number(o.timpPas), [60, 30, 15] as const, 30),
      baniMax: Math.min(100, Math.max(5, Math.floor(Number(o.baniMax)) || 100)),
      sens: unul(o.sens, ["crescator", "descrescator", "ambele"] as const, "ambele"),
    },
    joc: unul(x.joc, JOCURI_LISTA_C2, "perechi"),
    nr: Number.isFinite(nr) ? Math.min(100, Math.max(5, nr)) : 10,
    nivel: unul(x.nivel, ["usor", "mediu", "provocare", "alege"] as const, "alege"),
    vieti: unul(Number(x.vieti), [0, 3, 5] as const, 3),
    modScara: unul(x.modScara, ["variante", "tastatura"] as const, "variante"),
    inlocuiri: inl,
    coloane: x.coloane === 2 || x.coloane === 3 ? x.coloane : "auto",
    antet: { titlu: str(a.titlu) || d.antet.titlu, centru: str(a.centru), profesor: str(a.profesor), data: str(a.data, 40), timp: str(a.timp, 40), logo: a.logo === undefined ? true : Boolean(a.logo) },
  };
}

export function decodificaC2(s: string | null | undefined): ConfigC2 | null {
  if (!s) return null;
  try { return curataC2(JSON.parse(deb64(s))); } catch { return null; }
}

/** Încercarea n: alte exerciții de același tip (seed derivat). Aceeași regulă pe server. */
export const cfgIncercareC2 = (cfg: ConfigC2, n: number): ConfigC2 => (n ? { ...cfg, seed: hash(cfg.seed, n, 2) % 2 ** 31, inlocuiri: {} } : cfg);
