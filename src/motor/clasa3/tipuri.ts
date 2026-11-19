/**
 * Pachetul „Clasa a III-a”: exerciții pe capitolele programei, folosite la fel
 * pe fișa PDF (cu barem) și în cele 5 mini-jocuri online.
 */
import type { Antet, Rest, Trecere } from "@/motor/calcul/tipuri";

export type CapitolC3 = "numere" | "adunare" | "inmultire" | "impartire" | "ordine" | "fractii" | "masuri" | "probleme";

export type TipNumere = "citire" | "descompunere" | "comparare" | "ordonare" | "rotunjire" | "romane";
export type TipInmultire = "tabla" | "x10" | "1cifra" | "2cifre" | "proprietati";
export type TipImpartire = "tabla" | "1cifra";
export type TipFractii = "citire" | "reprezentare" | "comparare" | "tip" | "din-intreg";
export type TipMasuri = "perimetru" | "lungime" | "capacitate" | "masa" | "timp" | "bani";
export type MetodaProbleme = "figurativa" | "mers-invers";

export interface OptiuniC3 {
  numere: TipNumere[];
  adunare: { trecere: Trecere; necunoscut: boolean };
  inmultire: { tipuri: TipInmultire[]; trecere: Trecere };
  impartire: { tipuri: TipImpartire[]; rest: Rest };
  ordine: { paranteze: "fara" | "cu" | "amestecat" };
  fractii: TipFractii[];
  masuri: TipMasuri[];
  probleme: MetodaProbleme[];
}

export type JocC3 = "sprint" | "memory" | "balanta" | "detectiv" | "constructor";

export interface ConfigC3 {
  seed: number;
  capitole: CapitolC3[];
  optiuni: OptiuniC3;
  joc: JocC3;
  /** numărul de exerciții (la Memory: perechi) */
  nr: number;
  /** 0 = fără vieți (mod relaxat) */
  vieti: 0 | 3 | 5;
  /** Sprint: 1 = lent (20 s), 2 = mediu (12 s), 3 = rapid (7 s) */
  viteza: 1 | 2 | 3;
  /** exerciții înlocuite individual de profesor: index → variantă */
  inlocuiri: Record<string, number>;
  coloane: "auto" | 2 | 3 | 4;
  antet: Antet;
}

/** O față de cartonaș / o parte a unei comparații: text („125 × 4”, „3/5”) sau desen de fracție */
export interface Fata {
  text: string;
  fractie?: { parti: number; colorate: number; forma: "cerc" | "dreptunghi" };
}

export type Figura =
  | { tip: "dreptunghi"; L: number; l: number; unitate: string; grila: boolean }
  | { tip: "patrat"; l: number; unitate: string; grila: boolean }
  | { tip: "triunghi"; a: number; b: number; c: number; unitate: string };

export type RaspunsC3 =
  | { tip: "numar"; valoare: number }
  | { tip: "rest"; cat: number; rest: number }
  | { tip: "varianta"; valoare: string; variante: string[] }
  /** constructor: dreptunghi pe grilă cu perimetrul dat (și, opțional, laturile date) */
  | { tip: "construit"; perimetru: number; laturi?: [number, number] }
  /** constructor: colorează `cerut` părți din `parti` */
  | { tip: "colorare"; parti: number; cerut: number }
  /** memory: perechea găsită */
  | { tip: "pereche" };

/** Verificarea independentă (teste TypeScript + SymPy). */
export type Verificare =
  | { tip: "egal"; expr: string; valoare: number }
  | { tip: "ecuatie"; expr: string; valoare: number }
  | { tip: "rest"; d: number; i: number; c: number; r: number }
  | { tip: "comparatie"; st: string; dr: string; semn: "<" | ">" | "=" }
  | { tip: "roman"; roman: string; valoare: number }
  | { tip: "fractie"; num: number; den: number; text: string }
  | { tip: "clasa-fractie"; num: number; den: number; clasa: string }
  | { tip: "max"; numere: number[]; valoare: number }
  | { tip: "paranteze"; expr: string; tinta: number; altele: string[] }
  | { tip: "perimetru"; laturi: number[]; valoare: number }
  | { tip: "construit"; perimetru: number }
  | { tip: "colorare"; parti: number; cerut: number };

export type FelItem = "exercitiu" | "pereche" | "comparatie" | "lipsa" | "vizual";

export interface ItemC3 {
  /** poziția în sesiune („i7”), stabilă la regenerare */
  id: string;
  /** cheia canonică: nu se repetă în aceeași sesiune / fișă */
  cheie: string;
  capitol: CapitolC3;
  fel: FelItem;
  /** cerința (pe fișă și în joc); „□” marchează locul de completat */
  text: string;
  /** desen însoțitor (fracție, figură geometrică) */
  fractie?: Fata["fractie"];
  figura?: Figura;
  /** Memory: cele două fețe; Balanța: stânga și dreapta */
  st?: Fata;
  dr?: Fata;
  raspuns: RaspunsC3;
  /** răspunsul scris pe barem */
  afis: string;
  /** indiciu pas cu pas (după o greșeală) */
  indiciu: string;
  verificare: Verificare;
}

export const NUME_CAPITOL: Record<CapitolC3, string> = {
  numere: "Numerele naturale 0 – 10 000",
  adunare: "Adunarea și scăderea 0 – 10 000",
  inmultire: "Înmulțirea 0 – 10 000",
  impartire: "Împărțirea 0 – 1 000",
  ordine: "Ordinea efectuării operațiilor",
  fractii: "Fracții",
  masuri: "Geometrie și unități de măsură",
  probleme: "Probleme cu 2–3 operații",
};

export const ICON_CAPITOL: Record<CapitolC3, string> = {
  numere: "🔢", adunare: "➕", inmultire: "✖️", impartire: "➗", ordine: "🧮", fractii: "🍕", masuri: "📏", probleme: "🧩",
};

export const NUME_NUMERE: Record<TipNumere, string> = {
  citire: "scriere și citire", descompunere: "descompunere (mii, sute, zeci, unități)", comparare: "comparare",
  ordonare: "ordonare", rotunjire: "rotunjire la zeci/sute/mii", romane: "cifre romane",
};
export const NUME_INMULTIRE: Record<TipInmultire, string> = {
  tabla: "tabla înmulțirii", x10: "× 10, 100, 1 000", "1cifra": "2–3 cifre × o cifră", "2cifre": "2 cifre × 2 cifre", proprietati: "proprietăți (comutativitate, asociativitate, factor comun)",
};
export const NUME_IMPARTIRE: Record<TipImpartire, string> = { tabla: "tabla împărțirii", "1cifra": "2–3 cifre : o cifră" };
export const NUME_FRACTII: Record<TipFractii, string> = {
  citire: "scriere și citire", reprezentare: "reprezentare vizuală", comparare: "comparare (același numitor / numărător)",
  tip: "subunitare, echiunitare, supraunitare", "din-intreg": "fracție dintr-un întreg",
};
export const NUME_MASURI: Record<TipMasuri, string> = {
  perimetru: "perimetrul (pătrat, dreptunghi, triunghi)", lungime: "lungime (km, m, dm, cm, mm)", capacitate: "capacitate (l, ml)",
  masa: "masă (kg, g)", timp: "timp (oră, minut, secundă, zi, săptămână, lună, an)", bani: "lei și bani",
};
export const NUME_PROBLEME: Record<MetodaProbleme, string> = { figurativa: "metoda figurativă (segmente)", "mers-invers": "metoda mersului invers" };

export const JOCURI_C3: Record<JocC3, { nume: string; icon: string; descriere: string; culoare: string }> = {
  sprint: { nume: "Cursa contra cronometrului", icon: "⏱️", descriere: "Răspunde înainte să se golească bara de timp. Răspunsurile corecte la rând dau combo!", culoare: "#e0483e" },
  memory: { nume: "Perechi matematice", icon: "🃏", descriere: "Întoarce cartonașele și găsește perechile: calcul ↔ rezultat.", culoare: "#2f6fd1" },
  balanta: { nume: "Balanța expresiilor", icon: "⚖️", descriere: "Care parte e mai grea? Alege <, = sau >.", culoare: "#2e9e5b" },
  detectiv: { nume: "Detectivul numerelor", icon: "🔍", descriere: "Găsește numărul care lipsește sau pune parantezele la locul lor.", culoare: "#e07a1f" },
  constructor: { nume: "Constructorul", icon: "🏗️", descriere: "Construiește perimetre pe grilă și colorează fracții.", culoare: "#6a59a7" },
};

export const NR_RAPIDE_C3 = [10, 15, 20, 25, 50, 100] as const;
export const SECUNDE_VITEZA: Record<1 | 2 | 3, number> = { 1: 20, 2: 12, 3: 7 };
