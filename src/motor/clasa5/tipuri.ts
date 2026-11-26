/**
 * Pachetul „Clasa a V-a”: capitolele programei, pe Nivel 1 / Nivel 2, cu rezolvare pas cu pas.
 * Itemii au aceeași formă ca la clasa a IV-a (aceleași 5 jocuri, aceeași fișă).
 * Răspunsurile întregi se scriu pe tastatură; fracțiile și numerele zecimale se aleg dintre variante.
 */
import type { ConfigC4, ItemC4, Verificare as VerificareC4 } from "@/motor/clasa4/tipuri";

export type CapitolC5 =
  | "puteri" | "ordine" | "factor" | "divizibilitate" | "prime"
  | "metode" | "fractii" | "zecimale" | "unghiuri" | "arie";

export type ConfigC5 = Omit<ConfigC4, "capitole"> & { capitole: CapitolC5[] };

export type VerificareC5 =
  | VerificareC4
  /** valoare raționala („3/4”, „6.25”): SymPy compară expresia cu valoarea */
  | { tip: "rational"; expr: string; valoare: string }
  | { tip: "divizori"; n: number; valoare: number }
  /** cifra x pentru care numărul (șablon cu „x”) se divide cu d: unică */
  | { tip: "cifra"; sablon: string; d: number; valoare: number }
  /** dintre numere, exact unul are proprietatea */
  | { tip: "unic"; numere: number[]; proprietate: "prim" | `div${number}`; valoare: number }
  | { tip: "factor-prim"; n: number; valoare: number };

export type ItemC5 = Omit<ItemC4, "capitol" | "verificare"> & { capitol: CapitolC5; verificare: VerificareC5 };

export const NUME_CAPITOL_C5: Record<CapitolC5, string> = {
  puteri: "Puterea cu exponent natural",
  ordine: "Ordinea efectuării operațiilor",
  factor: "Factorul comun",
  divizibilitate: "Divizibilitate",
  prime: "Numere prime și compuse",
  metode: "Metode de rezolvare a problemelor",
  fractii: "Fracții ordinare",
  zecimale: "Fracții zecimale",
  unghiuri: "Segmente și unghiuri",
  arie: "Arii și volume",
};

export const DESCRIERE_CAPITOL_C5: Record<CapitolC5, string> = {
  puteri: "pătrat, cub, reguli de calcul cu puteri, comparare",
  ordine: "paranteze rotunde și pătrate, puteri, × și :, + și −",
  factor: "a · b + a · c = a · (b + c), calcul rapid",
  divizibilitate: "divizori, multipli, criteriile cu 2, 5, 10, 3, 9",
  prime: "prime și compuse, factori primi",
  metode: "reducerea la unitate, mersul invers, falsa ipoteză",
  fractii: "amplificare, simplificare, comparare, operații, fracție dintr-un număr",
  zecimale: "comparare, rotunjire, operații, × și : cu 10, 100",
  unghiuri: "mijlocul segmentului, puncte coliniare, unghiuri complementare și suplementare",
  arie: "aria pătratului și a dreptunghiului, volumul cubului și cuboidului, unități",
};

export const ICON_CAPITOL_C5: Record<CapitolC5, string> = {
  puteri: "🚀", ordine: "🧮", factor: "🧲", divizibilitate: "➗", prime: "🔑",
  metode: "🧩", fractii: "🍕", zecimale: "🔟", unghiuri: "📐", arie: "🧊",
};
