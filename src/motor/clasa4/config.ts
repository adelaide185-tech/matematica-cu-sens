import { antetImplicit, b64, deb64 } from "@/motor/calcul/config";
import { hash } from "@/motor/calcul/generator";
import type { CapitolC4, ConfigC4, JocC4, NivelC4 } from "./tipuri";

export const CAPITOLE_C4: CapitolC4[] = ["geometrie", "corpuri", "figurativa", "incercari", "estimare", "logica", "tabele", "etaloane", "capacitate", "lungime", "masa", "timp"];
export const JOCURI_C4: JocC4[] = ["sprint", "memory", "balanta", "detectiv", "constructor"];
const NIVELURI: NivelC4[] = ["1", "2", "amestecat"];

export function configC4Implicita(seed = 1): ConfigC4 {
  return {
    seed, capitole: ["lungime", "masa"], nivel: "1", joc: "sprint", nr: 10, vieti: 0, viteza: 1,
    inlocuiri: {}, coloane: "auto", antet: { ...antetImplicit(), titlu: "Matematică – clasa a IV-a" },
  };
}

export const codificaC4 = (c: ConfigC4) => b64(JSON.stringify(c));

const lista = <T,>(v: unknown, voie: readonly T[], impl: T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x) => voie.includes(x)))] : impl);
const unul = <T,>(v: unknown, voie: readonly T[], impl: T): T => (voie.includes(v as T) ? (v as T) : impl);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");

/** Citește configurația din URL sau din baza de date; valorile greșite devin valori sigure. */
export function curataC4(x: Record<string, unknown>): ConfigC4 {
  const d = configC4Implicita();
  const a = (x.antet ?? {}) as Record<string, unknown>;
  const inl: Record<string, number> = {};
  if (x.inlocuiri && typeof x.inlocuiri === "object")
    for (const [k, v] of Object.entries(x.inlocuiri as Record<string, unknown>)) if (/^i\d+$/.test(k) && Number.isFinite(Number(v))) inl[k] = Math.max(0, Math.floor(Number(v)));
  const nr = Math.floor(Number(x.nr));
  const capitole = lista(x.capitole, CAPITOLE_C4, d.capitole);
  return {
    seed: Number.isFinite(Number(x.seed)) ? Math.abs(Math.floor(Number(x.seed))) % 2 ** 31 : 1,
    capitole: capitole.length ? CAPITOLE_C4.filter((c) => capitole.includes(c)) : d.capitole,
    nivel: unul(x.nivel, NIVELURI, "1"),
    joc: unul(x.joc, JOCURI_C4, "sprint"),
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

export function decodificaC4(s: string | null | undefined): ConfigC4 | null {
  if (!s) return null;
  try {
    return curataC4(JSON.parse(deb64(s)));
  } catch {
    return null;
  }
}

/** „Mai încerc o dată” aduce alte exerciții (aceeași regulă și pe server). */
export function cfgIncercareC4(cfg: ConfigC4, n: number): ConfigC4 {
  return n ? { ...cfg, seed: hash(cfg.seed, n) % 2 ** 31, inlocuiri: {} } : cfg;
}
