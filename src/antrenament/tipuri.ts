import type { Rng } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

export type NivelJoc = "usor" | "mediu" | "provocare";

export const NIVELURI_JOC: { id: NivelJoc; nume: string; descriere: string; culoare: string }[] = [
  { id: "usor", nume: "Ușor", descriere: "Cu obiecte și desene", culoare: "#2e9e5b" },
  { id: "mediu", nume: "Mediu", descriere: "Desen + calcul", culoare: "#2f6fd1" },
  { id: "provocare", nume: "Provocare", descriere: "Cifre și simboluri, mai mulți pași", culoare: "#6a59a7" },
];

export type Domeniu = "numeratie" | "operatii" | "probleme" | "fractii" | "masurari" | "geometrie";
export const DOMENII: Record<Domeniu, { nume: string; icon: string }> = {
  numeratie: { nume: "Numerație", icon: "🔢" },
  operatii: { nume: "Operații", icon: "➕" },
  probleme: { nume: "Probleme", icon: "🧩" },
  fractii: { nume: "Fracții", icon: "🍕" },
  masurari: { nume: "Măsurări, timp, bani", icon: "📏" },
  geometrie: { nume: "Geometrie și date", icon: "📐" },
};

/** Reprezentarea vizuală / mecanica de joc a unui exercițiu (componentele din src/antrenament/mecanici). */
export type Mecanica =
  | { tip: "blocuri"; tinta: number; arata: "cifre" | "litere" | "suma"; text: string }
  | { tip: "numaratoare"; tinta: number; text: string; construieste?: boolean; ascuns?: boolean }
  | { tip: "axa"; de: number; pana: number; pas: number; marcaj?: number; alege?: boolean }
  | { tip: "balanta"; stanga: string; dreapta: string; valStanga: number; valDreapta: number; necunoscut?: "stanga" | "dreapta" }
  | { tip: "cadru10"; a: number; b: number; operatie: "+" | "−"; /** b este necunoscut (se completează până la a + b) */ lipsa?: boolean }
  | { tip: "matrice"; randuri: number; coloane: number; arataTotal?: boolean }
  | { tip: "grupe"; grupe: number; cate: number; simbol: string }
  | { tip: "farfurii"; total: number; farfurii: number; simbol: string }
  | { tip: "sir"; elemente: (number | null)[] }
  | { tip: "coloana"; a: number; b: number; operatie: "+" | "−" | "×" }
  | { tip: "bara"; parti: { eticheta: string; valoare: number | null; culoare?: string }[]; total: number | null; comparatie?: boolean }
  | { tip: "perechi"; n: number; simbol: string }
  | { tip: "ordonare"; numere: number[]; crescator: boolean }
  | { tip: "expresie"; text: string };

/** Răspunsul așteptat și felul în care îl dă copilul. */
export type Raspuns =
  | { tip: "numar"; valoare: number }
  | { tip: "optiune"; valoare: string; optiuni: string[] }
  | { tip: "campuri"; valori: number[]; etichete: string[] }
  | { tip: "ordine"; valori: number[] }
  /** valoarea e construită direct pe obiect (blocuri, numărătoare) */
  | { tip: "construit"; valoare: number };

export interface Exercitiu {
  subiectId: string;
  /** identitate canonică: două exerciții cu aceeași cheie sunt „același exercițiu” */
  cheie: string;
  /** faptul matematic (ex. „7×8”): nu se repetă la mai puțin de 10 exerciții distanță */
  fapt: string;
  enunt: string;
  mecanica: Mecanica;
  raspuns: Raspuns;
  /** indicii de la ușor la explicit; ultimul este rezolvarea */
  indicii: string[];
  dificultate: number;
}

export interface Subiect {
  id: string;
  titlu: string;
  descriere: string;
  domeniu: Domeniu;
  clase: Clasa[];
  /** id-urile lecțiilor din curriculum (titlu) la care se potrivește, pentru afișare */
  icon: string;
  exercitiu(rng: Rng, nivel: NivelJoc, clasa: Clasa): Omit<Exercitiu, "subiectId">;
}

export function verificaRaspuns(r: Raspuns, dat: unknown): boolean {
  switch (r.tip) {
    case "numar":
    case "construit":
      return Number(dat) === r.valoare;
    case "optiune":
      return String(dat) === r.valoare;
    case "campuri":
      return Array.isArray(dat) && r.valori.every((v, i) => Number(dat[i]) === v);
    case "ordine":
      return Array.isArray(dat) && dat.length === r.valori.length && r.valori.every((v, i) => Number(dat[i]) === v);
  }
}

export function raspunsText(r: Raspuns): string {
  switch (r.tip) {
    case "numar":
    case "construit":
      return String(r.valoare);
    case "optiune":
      return r.valoare;
    case "campuri":
      return r.etichete.map((e, i) => `${e} ${r.valori[i]}`).join(", ");
    case "ordine":
      return r.valori.join(", ");
  }
}
