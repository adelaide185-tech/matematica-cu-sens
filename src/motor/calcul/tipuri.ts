/**
 * Generatorul de calcul (fișe de exerciții de calcul, 5–200 de exerciții).
 * Configurația e mică și serializabilă: exercițiile se regenerează identic din ea (seed + blocuri).
 */

export type TipOperatie = "adunare" | "scadere" | "inmultire" | "impartire" | "combinate" | "ecuatii" | "mental";
export type Trecere = "oricare" | "fara" | "cu";
export type Rest = "exacta" | "cu-rest" | "amestecat";
export type OpSimbol = "+" | "-" | "×" | ":";
export type VariantaMentala = "x10" | "impartire10" | "rotunde" | "dublu" | "complement";

export interface Bloc {
  tip: TipOperatie;
  /** câte exerciții are blocul */
  nr: number;
  /** intervalul numerelor (termeni, descăzut, primul factor, deîmpărțit) */
  min: number;
  max: number;
  /** rezultatul (suma, produsul) trebuie să rămână în interval */
  rezultatInInterval: boolean;
  /** al doilea factor / împărțitorul */
  min2?: number;
  max2?: number;
  /** tabla înmulțirii/împărțirii: alege al doilea factor sau împărțitorul din aceste table */
  tabele?: number[];
  /** adunare: câți termeni (2–4) */
  termeni?: number;
  /** adunare / scădere */
  trecere?: Trecere;
  /** scădere: permite rezultate negative (implicit: nu) */
  negative?: boolean;
  /** împărțire */
  rest?: Rest;
  /** adunare / scădere / înmulțire: așezare în coloană */
  coloana?: boolean;
  /** operații combinate: ce operații intră și câte (2 sau 3) */
  operatii?: OpSimbol[];
  nrOperatii?: number;
  paranteze?: boolean;
  /** aritmetică mentală: ce variante */
  variante?: VariantaMentala[];
}

export interface Antet {
  titlu: string;
  centru: string;
  profesor: string;
  data: string;
  timp: string;
  logo: boolean;
}

export interface ConfigCalcul {
  seed: number;
  blocuri: Bloc[];
  /** amestecă exercițiile din blocuri diferite */
  amesteca: boolean;
  /** exerciții regenerate individual: id stabil („b0-3”) → varianta */
  inlocuiri: Record<string, number>;
  coloane: "auto" | 2 | 3 | 4;
  simbolInmultire: "×" | "·";
  necunoscuta: "□" | "x" | "a" | "?";
  antet: Antet;
}

export type RaspunsCalcul = { tip: "numar"; valoare: number } | { tip: "rest"; cat: number; rest: number };

export interface ExCalcul {
  /** id stabil al poziției în bloc: „b0-3” (nu se schimbă la amestecare sau regenerare) */
  id: string;
  /** cheia canonică (pentru unicitate) */
  cheie: string;
  bloc: number;
  tip: TipOperatie;
  /** textul de pe fișă, fără răspuns: „347 + 128 =” sau „□ + 25 = 73” */
  text: string;
  /** pentru așezarea în coloană */
  coloana?: { numere: number[]; op: OpSimbol };
  /** la ecuații: ce se scrie înaintea liniei de răspuns („□ =”) */
  inainte?: string;
  raspuns: RaspunsCalcul;
  /** expresia ASCII pentru verificarea independentă (SymPy): „347 + 128”, ecuațiile ca „x + 25 = 73” */
  expresie: string;
  /** nu s-a putut găsi un exercițiu diferit de cele dinainte (interval prea mic) */
  duplicat?: boolean;
}

export const NR_RAPIDE = [10, 15, 20, 25, 50, 100] as const;
export const NR_MIN = 5;
export const NR_MAX = 200;

export const NUME_TIP: Record<TipOperatie, string> = {
  adunare: "Adunare",
  scadere: "Scădere",
  inmultire: "Înmulțire",
  impartire: "Împărțire",
  combinate: "Operații combinate",
  ecuatii: "Ecuații simple (aflarea necunoscutei)",
  mental: "Calcul mintal",
};

export const NUME_MENTAL: Record<VariantaMentala, string> = {
  x10: "Înmulțire cu 10, 100, 1000",
  impartire10: "Împărțire la 10, 100, 1000",
  rotunde: "Adunări și scăderi cu zeci/sute întregi",
  dublu: "Dublul și jumătatea",
  complement: "Cât îi lipsește până la 10, 100, 1000",
};

export interface PresetInterval {
  id: string;
  eticheta: string;
  min: number;
  max: number;
  rezultatInInterval: boolean;
}

export const INTERVALE: PresetInterval[] = [
  { id: "0-10", eticheta: "0–10", min: 0, max: 10, rezultatInInterval: true },
  { id: "0-20", eticheta: "0–20", min: 0, max: 20, rezultatInInterval: true },
  { id: "0-100", eticheta: "0–100", min: 0, max: 100, rezultatInInterval: true },
  { id: "0-1000", eticheta: "0–1 000", min: 0, max: 1000, rezultatInInterval: true },
  { id: "0-10000", eticheta: "0–10 000", min: 0, max: 10000, rezultatInInterval: true },
  { id: "0-1000000", eticheta: "0–1 000 000", min: 0, max: 1000000, rezultatInInterval: true },
  { id: "1c", eticheta: "numere de o cifră", min: 1, max: 9, rezultatInInterval: false },
  { id: "2c", eticheta: "numere de 2 cifre", min: 10, max: 99, rezultatInInterval: false },
  { id: "3c", eticheta: "numere de 3 cifre", min: 100, max: 999, rezultatInInterval: false },
  { id: "4c", eticheta: "numere de 4 cifre", min: 1000, max: 9999, rezultatInInterval: false },
];

export const TABELE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
