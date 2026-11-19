import { antetImplicit, b64, deb64 } from "@/motor/calcul/config";
import { hash } from "@/motor/calcul/generator";
import type { JocC4, NivelC4 } from "@/motor/clasa4/tipuri";
import type { CapitolC5, ConfigC5 } from "./tipuri";

export const CAPITOLE_C5: CapitolC5[] = ["puteri", "ordine", "factor", "divizibilitate", "prime", "metode", "fractii", "zecimale", "unghiuri", "arie"];
export const JOCURI_C5: JocC4[] = ["sprint", "memory", "balanta", "detectiv", "constructor"];
const NIVELURI: NivelC4[] = ["1", "2", "amestecat"];

export function configC5Implicita(seed = 1): ConfigC5 {
  return {
    seed, capitole: ["puteri", "fractii"], nivel: "1", joc: "sprint", nr: 10, vieti: 0, viteza: 1,
    inlocuiri: {}, coloane: "auto", antet: { ...antetImplicit(), titlu: "Matematică – clasa a V-a" },
  };
}

export const codificaC5 = (c: ConfigC5) => b64(JSON.stringify(c));

const lista = <T,>(v: unknown, voie: readonly T[], impl: T[]): T[] => (Array.isArray(v) ? [...new Set(v.filter((x) => voie.includes(x)))] : impl);
const unul = <T,>(v: unknown, voie: readonly T[], impl: T): T => (voie.includes(v as T) ? (v as T) : impl);
const str = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");

/** Citește configurația din URL sau din baza de date; valorile greșite devin valori sigure. */
export function curataC5(x: Record<string, unknown>): ConfigC5 {
  const d = configC5Implicita();
  const a = (x.antet ?? {}) as Record<string, unknown>;
  const inl: Record<string, number> = {};
  if (x.inlocuiri && typeof x.inlocuiri === "object")
    for (const [k, v] of Object.entries(x.inlocuiri as Record<string, unknown>)) if (/^i\d+$/.test(k) && Number.isFinite(Number(v))) inl[k] = Math.max(0, Math.floor(Number(v)));
  const nr = Math.floor(Number(x.nr));
  const capitole = lista(x.capitole, CAPITOLE_C5, d.capitole);
  return {
    seed: Number.isFinite(Number(x.seed)) ? Math.abs(Math.floor(Number(x.seed))) % 2 ** 31 : 1,
    capitole: capitole.length ? CAPITOLE_C5.filter((c) => capitole.includes(c)) : d.capitole,
    nivel: unul(x.nivel, NIVELURI, "1"),
    joc: unul(x.joc, JOCURI_C5, "sprint"),
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

export function decodificaC5(s: string | null | undefined): ConfigC5 | null {
  if (!s) return null;
  try {
    return curataC5(JSON.parse(deb64(s)));
  } catch {
    return null;
  }
}

/** „Mai încerc o dată” aduce alte exerciții (aceeași regulă și pe server). */
export function cfgIncercareC5(cfg: ConfigC5, n: number): ConfigC5 {
  return n ? { ...cfg, seed: hash(cfg.seed, n, 5) % 2 ** 31, inlocuiri: {} } : cfg;
}
