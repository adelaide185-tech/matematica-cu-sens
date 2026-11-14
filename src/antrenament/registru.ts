import type { Clasa } from "@/motor/tipuri";
import type { Subiect } from "./tipuri";
import { SUBIECTE_NUMERATIE } from "./subiecte/numeratie";
import { SUBIECTE_OPERATII } from "./subiecte/operatii";
import { SUBIECTE_PROBLEME } from "./subiecte/probleme";

export const SUBIECTE: Subiect[] = [...SUBIECTE_NUMERATIE, ...SUBIECTE_OPERATII, ...SUBIECTE_PROBLEME];

export function subiect(id: string): Subiect | undefined {
  return SUBIECTE.find((s) => s.id === id);
}

export function subiecteClasa(clasa: Clasa): Subiect[] {
  return SUBIECTE.filter((s) => s.clase.includes(clasa));
}
