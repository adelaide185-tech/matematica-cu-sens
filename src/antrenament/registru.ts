import type { Clasa } from "@/motor/tipuri";
import type { Subiect } from "./tipuri";
import { SUBIECTE_NUMERATIE } from "./subiecte/numeratie";
import { SUBIECTE_OPERATII } from "./subiecte/operatii";
import { SUBIECTE_PROBLEME } from "./subiecte/probleme";
import { SUBIECTE_FRACTII } from "./subiecte/fractii";
import { SUBIECTE_MASURARI } from "./subiecte/masurari";
import { SUBIECTE_GEOMETRIE } from "./subiecte/geometrie";
import { SUBIECTE_DATE } from "./subiecte/date";
import { SUBIECTE_CLASA5 } from "./subiecte/clasa5";

export const SUBIECTE: Subiect[] = [...SUBIECTE_NUMERATIE, ...SUBIECTE_OPERATII, ...SUBIECTE_PROBLEME, ...SUBIECTE_FRACTII, ...SUBIECTE_MASURARI, ...SUBIECTE_GEOMETRIE, ...SUBIECTE_DATE, ...SUBIECTE_CLASA5];

export function subiect(id: string): Subiect | undefined {
  return SUBIECTE.find((s) => s.id === id);
}

export function subiecteClasa(clasa: Clasa): Subiect[] {
  return SUBIECTE.filter((s) => s.clase.includes(clasa));
}
