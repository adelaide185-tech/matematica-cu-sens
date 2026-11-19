/**
 * Configurația unui joc arcade (în URL și în tema din baza de date) și regulile comune client/server.
 */
import { b64, deb64 } from "@/motor/calcul/config";
import { hash } from "@/motor/calcul/generator";
import type { Clasa } from "@/motor/tipuri";
import { GRESELI_MAX, type VitezaArcade } from "./scor";
import type { DificultateArcade, IntrebareArcade } from "./intrebari";

export type JocArcadeId = "baloane" | "cursa" | "racheta";
export const JOCURI_ARCADE: Record<JocArcadeId, { nume: string; icon: string; descriere: string; culoare: string; cum: string }> = {
  baloane: { nume: "Baloanele", icon: "🎈", culoare: "#e0483e", descriere: "Baloanele urcă spre cer. Sparge balonul cu răspunsul corect înainte să zboare!", cum: "Atinge balonul corect (sau tastele 1–4)." },
  cursa: { nume: "Cursa cu porți", icon: "🏎️", culoare: "#2f6fd1", descriere: "Condu mașina pe banda cu răspunsul corect și treci prin poartă.", cum: "Atinge banda sau folosește săgețile ← →. „Accelerează” trece imediat prin poartă." },
  racheta: { nume: "Racheta", icon: "🚀", culoare: "#6a59a7", descriere: "Meteoriții coboară spre rachetă. Lovește-l pe cel cu răspunsul corect!", cum: "Atinge meteoritul corect (sau tastele 1–4)." },
};
export const JOCURI_ARCADE_IDS = Object.keys(JOCURI_ARCADE) as JocArcadeId[];
export const NUME_CLASA_SCURT = ["I", "a II-a", "a III-a", "a IV-a", "a V-a"];

export interface ConfigArcade { seed: number; joc: JocArcadeId; clasa: Clasa; viteza: VitezaArcade; n: number; dif: DificultateArcade }

export const configArcadeImplicita = (seed = 1): ConfigArcade => ({ seed, joc: "baloane", clasa: 2, viteza: 1, n: 10, dif: "mediu" });
export const codificaArcade = (c: ConfigArcade) => b64(JSON.stringify(c));

const unul = <T,>(v: unknown, voie: readonly T[], impl: T): T => (voie.includes(v as T) ? (v as T) : impl);

/** Citește configurația (URL sau baza de date); orice valoare greșită devine una sigură. */
export function curataArcade(x: Record<string, unknown>): ConfigArcade {
  return {
    seed: Number.isFinite(Number(x.seed)) ? Math.abs(Math.floor(Number(x.seed))) % 2 ** 31 : 1,
    joc: unul(x.joc, JOCURI_ARCADE_IDS, "baloane"),
    clasa: unul(Number(x.clasa), [1, 2, 3, 4, 5] as const, 2),
    viteza: unul(Number(x.viteza), [1, 2, 3] as const, 1),
    n: unul(Number(x.n), [5, 10, 15, 20] as const, 10),
    dif: unul(x.dif, ["usor", "mediu", "greu"] as const, "mediu"),
  };
}
export function decodificaArcade(s: string | null | undefined): ConfigArcade | null {
  if (!s) return null;
  try { return curataArcade(JSON.parse(deb64(s))); } catch { return null; }
}

/** „Mai joc o dată” la o temă: alte întrebări, aceeași regulă pe client și pe server. */
export const cfgIncercareArcade = (c: ConfigArcade, n: number): ConfigArcade => (n ? { ...c, seed: hash(c.seed, n, 61) % 2 ** 31 } : c);

/**
 * Din alegerile elevului la o întrebare (în ordine; null = obiectele au scăpat) aflăm greșelile:
 * câte alegeri greșite au fost înainte de cea corectă (maximum 2: atunci întrebarea e pierdută).
 * Serverul folosește aceeași funcție ca să verifice din nou rezultatul trimis.
 */
export function greseliDinAlegeri(q: Pick<IntrebareArcade, "corect">, alegeri: (string | null)[]): number {
  let g = 0;
  for (const a of alegeri) {
    if (a === q.corect) return g;
    g++;
    if (g >= GRESELI_MAX) return GRESELI_MAX;
  }
  return GRESELI_MAX; // nerăspunsă
}
