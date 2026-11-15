import type { Rng } from "./rng";
import type { Mecanica } from "@/antrenament/tipuri";

export type Clasa = 1 | 2 | 3 | 4 | 5;
export type Nivel = "consolidare" | "aprofundare" | "evaluare" | "competitie";

export const NIVELURI: { id: Nivel; nume: string; culoare: string; descriere: string }[] = [
  { id: "consolidare", nume: "Consolidare", culoare: "#2e9e5b", descriere: "Exersare de bază, fixarea noțiunilor" },
  { id: "aprofundare", nume: "Aprofundare", culoare: "#2f6fd1", descriere: "Mai mulți pași, conexiuni logice" },
  { id: "evaluare", nume: "Evaluare", culoare: "#e07a1f", descriere: "Test cu punctaj, barem și descriptori" },
  { id: "competitie", nume: "Competiție", culoare: "#6a59a7", descriere: "Perspicacitate, tip concurs" },
];

/** Reprezentări vizuale randate prin SVG (aceeași componentă pe ecran și în PDF). */
export type Vizual =
  | { tip: "numaratoare"; sute: number; zeci: number; unitati: number; mii?: number }
  | { tip: "fractie"; forma: "cerc" | "dreptunghi"; parti: number; colorate: number }
  | { tip: "ceas"; ore: number; minute: number }
  | { tip: "axa"; de: number; pana: number; pas: number; marcate?: number[]; necunoscute?: number[] }
  | { tip: "grupe"; grupe: number; cate: number; simbol: string };

export type Comparatie = "<" | ">" | "=";

/** O cerință = un loc de răspuns. Un item poate avea mai multe cerințe (a, b, c…). */
export interface Cerinta {
  /** text afișat înaintea spațiului de răspuns, ex. „437 =” */
  text: string;
  /** text după spațiu (opțional), ex. „ sute” */
  dupa?: string;
  vizual?: Vizual;
  raspuns: string;
  /** variante (pentru alegere / adevărat-fals / comparare) */
  optiuni?: string[];
  /** lățimea spațiului pe fișă: s = scurt, m = mediu, l = rând întreg */
  latime?: "s" | "m" | "l";
  /** desen din antrenament (geometrie, grafice, măsurări…) afișat deasupra cerinței */
  mecanica?: Mecanica;
  /** variantele se încercuiesc (chiar dacă itemul nu e de tip „alegere”) */
  alegere?: boolean;
  /** răspuns pe mai multe câmpuri (ex. „ora … minute …”) */
  campuri?: string[];
}

export interface Item {
  generatorId: string;
  enunt: string;
  /** vizual comun al întregului item */
  vizual?: Vizual;
  interactiune: "input" | "alegere" | "comparare" | "adevarat-fals";
  cerinte: Cerinta[];
  /** pașii de rezolvare (fișa cu rezolvări). Pentru probleme: Ce știu / Ce caut / Rezolvare / Răspuns. */
  rezolvare: string[];
  /** punctaj total al itemului la Evaluare */
  punctaj: number;
  /** 1–10, pentru dificultatea adaptivă */
  dificultate: number;
  /** spațiu de lucru suplimentar pe fișă (rânduri) */
  spatiuLucru?: number;
  /** pe câte coloane se așază cerințele pe fișă */
  coloane?: 1 | 2 | 3 | 4;
}

export interface Generator {
  id: string;
  titlu: string;
  clase: Clasa[];
  competente: string[];
  /** nivelurile la care generatorul are sens */
  niveluri: Nivel[];
  generate(rng: Rng, nivel: Nivel, clasa: Clasa): Item;
}

/** Normalizare răspuns: spații, diacritice vechi (ş/ţ cu sedilă), majuscule. */
export function normalizeaza(s: string): string {
  return s
    .toLowerCase()
    .replace(/ş/g, "ș")
    .replace(/ţ/g, "ț")
    .replace(/\s+/g, " ")
    .replace(/\s*([,;+\-=<>])\s*/g, "$1")
    .trim();
}

export function verifica(c: Cerinta, raspunsElev: string): boolean {
  return normalizeaza(c.raspuns) === normalizeaza(raspunsElev);
}
