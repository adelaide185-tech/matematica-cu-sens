/**
 * Clasa I (7–8 ani) — modulul de exerciții și mini-jocuri pe capitolele programei.
 * Exercițiile folosesc aceleași tipuri ca antrenamentul (`Exercitiu`, `Mecanica`, `Raspuns`),
 * deci se desenează cu aceleași componente pe ecran și pe fișa PDF.
 */
import type { Exercitiu, Mecanica } from "@/antrenament/tipuri";

export type CapitolC1 = "numere" | "adsc20" | "adsc100" | "termen" | "geometrie" | "timp" | "bani" | "lungime" | "probleme";

/** Mini-jocurile clasei I. „intrebare” = ecranul general (variante mari sau tastatură), folosit când niciun joc nu se potrivește. */
export type JocC1 = "grupeaza" | "cursa" | "perechi" | "balanta" | "casuta";
export type EcranC1 = JocC1 | "intrebare";

export type Trecere = "fara" | "cu" | "ambele";
export type OpC1 = "+" | "-";
export type FormaTermen = "a+x=b" | "x+a=b" | "a-x=b" | "x-a=b";

export type SubtemaNumere = "recunoastere" | "numarare" | "zeci-unitati" | "vecini" | "comparare" | "ordonare" | "par-impar";
export type SubtemaGeometrie = "figuri" | "corpuri" | "laturi" | "pozitii";
export type SubtemaTimp = "ceas" | "zile" | "luni" | "anotimpuri";
export type SubtemaBani = "recunoastere" | "numara" | "cumparaturi";

export interface OptiuniC1 {
  numere: { subteme: SubtemaNumere[]; pasi: (1 | 2 | 5 | 10)[] };
  adsc20: { trecere: Trecere; operatii: OpC1[] };
  adsc100: { trecere: Trecere; operatii: OpC1[] };
  termen: { forme: FormaTermen[]; max: 20 | 100 };
  geometrie: { subteme: SubtemaGeometrie[] };
  timp: { subteme: SubtemaTimp[]; jumatati: boolean };
  bani: { subteme: SubtemaBani[] };
  probleme: { douaOperatii: boolean; max: 20 | 100 };
}

export const NR_EXERCITII_C1 = [10, 15, 20, 25, 50, 100] as const;
export const SECUNDE_C1 = [20, 30, 45, 60] as const;

export interface AntetC1 {
  titlu: string;
  scoala: string;
  profesor: string;
  data: string;
}

export interface ConfigClasa1 {
  seed: number;
  capitole: CapitolC1[];
  /** 10, 15, 20, 25, 50 sau 100 */
  n: number;
  optiuni: OptiuniC1;
  /** desene ajutătoare (cadrul de 10, bețișoare, bara problemei) */
  suportVizual: boolean;
  /** jocurile pe care profesorul le permite */
  jocuri: JocC1[];
  /** cronometru în „Cursa prietenoasă” (implicit oprit, pentru copiii care se emoționează) */
  cronometru: boolean;
  secunde: number;
  /** coloanele fișei PDF */
  coloane: 2 | 3;
  albNegru: boolean;
  antet: AntetC1;
}

/** Cum apare exercițiul pe fișa A4. */
export interface FisaC1 {
  /** cerința comună a grupului (ex. „Calculează:”) — exercițiile cu aceeași cerință se grupează pe a, b, c… */
  cerinta: string;
  /** textul subpunctului; „___” = căsuța de completat */
  text: string;
  raspuns: string;
  /** rezolvarea completă din barem (la probleme: operațiile și răspunsul cu substantiv) */
  rezolvare?: string;
  mecanica?: Mecanica;
  optiuni?: string[];
  campuri?: string[];
}

export interface ExercitiuC1 extends Exercitiu {
  capitol: CapitolC1;
  ecran: EcranC1;
  fisa: FisaC1;
  /** la „perechi”: cartonașul din stânga (text sau desen) și cel din dreapta (= răspunsul) */
  pereche?: { stanga: string; stangaMecanica?: Mecanica; dreapta: string };
  /** toate numerele care apar în exercițiu (date, rezultate intermediare și finale) — pentru verificarea intervalelor */
  numere: number[];
  /** adunările și scăderile din exercițiu (cu regula de trecere cerută), pentru verificarea automată */
  calcule?: CalculC1[];
  /** la „perechi”: numărul tablei de joc din care face parte (exercițiile unei table sunt consecutive) */
  tabla?: number;
}

/** Ce ajunge în browserul elevului la o temă: fără răspunsuri (verificarea se face pe server). */
export interface ExercitiuElevC1 {
  index: number;
  capitol: CapitolC1;
  ecran: EcranC1;
  enunt: string;
  mecanica: Mecanica;
  /** felul răspunsului; la „optiune” vin și variantele, la „campuri” etichetele */
  tip: "numar" | "optiune" | "campuri" | "ordine" | "construit";
  optiuni?: string[];
  etichete?: string[];
  /** primele două indicii (al treilea conține rezolvarea și vine de la server după 3 încercări) */
  indicii: string[];
  pereche?: { stanga: string; stangaMecanica?: Mecanica };
  tabla?: number;
}

/** Ce trimite elevul la final, pentru fiecare exercițiu. */
export interface RaspunsElevC1 {
  /** primul răspuns dat (null = timpul a expirat fără răspuns) */
  primul: unknown;
  incercari: number;
  /** a primit rezolvarea (după 3 încercări sau la expirarea timpului) */
  ajutor: boolean;
  timpMs: number;
}

export interface CalculC1 {
  a: number;
  b: number;
  op: OpC1;
  /** are trecere peste ordin (unitățile trec de 9 la adunare / împrumut la scădere) */
  trecere: boolean;
  /** concentrul cerut */
  max: 20 | 100;
  /** regula cerută de profesor pentru acest calcul */
  cerut: "fara" | "cu";
}

// ───────── medalii ─────────

export type Medalie = "diamant" | "aur" | "argint" | "bronz";
export const MEDALII: Record<Medalie, { nume: string; icon: string; culoare: string; prag: number }> = {
  diamant: { nume: "Diamant", icon: "💎", culoare: "#3fa7d6", prag: 100 },
  aur: { nume: "Aur", icon: "🥇", culoare: "#d4a017", prag: 90 },
  argint: { nume: "Argint", icon: "🥈", culoare: "#8d99ae", prag: 75 },
  bronz: { nume: "Bronz", icon: "🥉", culoare: "#b87333", prag: 50 },
};

/** Medalia după procentul de exerciții rezolvate corect din prima. Sub 50%: nicio medalie (încurajare). */
export function medalie(procent: number): Medalie | null {
  if (procent >= 100) return "diamant";
  if (procent >= 90) return "aur";
  if (procent >= 75) return "argint";
  if (procent >= 50) return "bronz";
  return null;
}
