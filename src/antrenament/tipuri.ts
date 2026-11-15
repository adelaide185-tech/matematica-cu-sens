import type { Rng } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

export type NivelJoc = "usor" | "mediu" | "provocare";

export const NIVELURI_JOC: { id: NivelJoc; nume: string; descriere: string; culoare: string }[] = [
  { id: "usor", nume: "Ușor", descriere: "Cu obiecte și desene", culoare: "#2e9e5b" },
  { id: "mediu", nume: "Mediu", descriere: "Desen + calcul", culoare: "#2f6fd1" },
  { id: "provocare", nume: "Provocare", descriere: "Cifre și simboluri, mai mulți pași", culoare: "#6a59a7" },
];

export type Domeniu = "numeratie" | "operatii" | "probleme" | "fractii" | "masurari" | "timp" | "bani" | "geometrie" | "date";
export const DOMENII: Record<Domeniu, { nume: string; icon: string }> = {
  numeratie: { nume: "Numerație", icon: "🔢" },
  operatii: { nume: "Operații", icon: "➕" },
  probleme: { nume: "Probleme", icon: "🧩" },
  fractii: { nume: "Fracții", icon: "🍕" },
  masurari: { nume: "Măsurări", icon: "📏" },
  timp: { nume: "Timpul", icon: "🕒" },
  bani: { nume: "Banii", icon: "🪙" },
  geometrie: { nume: "Geometrie", icon: "📐" },
  date: { nume: "Organizarea datelor", icon: "📊" },
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
  | { tip: "expresie"; text: string }
  // ── faza C: fracții, măsurări, timp, bani ──
  /** pizza / ciocolată; interactiv = copilul colorează părțile (răspuns „construit” = câte părți) */
  | { tip: "fractie"; forma: "cerc" | "dreptunghi"; parti: number; colorate: number; interactiv?: boolean; intregi?: number }
  /** benzi de fracții puse una sub alta, pentru comparare */
  | { tip: "benzi"; fractii: [number, number][] }
  /** grila 10 × 10 (procente) */
  | { tip: "grila100"; colorate: number }
  /** ceas analogic; interactiv = copilul mută acele (răspuns „construit” = minute de la ora 12) */
  | { tip: "ceas"; ore: number; minute: number; interactiv?: boolean; pasMinute?: number; digital?: boolean }
  /** riglă cu un obiect așezat de la `start` */
  | { tip: "rigla"; start: number; lungime: number; unitate: string; obiect: string }
  /** cântar cu cadran */
  | { tip: "cantar"; valoare: number; max: number; pas: number; unitate: string; obiect: string }
  /** recipient gradat */
  | { tip: "recipient"; valoare: number; max: number; pas: number; unitate: string }
  /** monede și bancnote (în bani: 100 bani = 1 leu) */
  | { tip: "bani"; piese: number[] }
  /** magazinul: copilul plătește exact (răspuns „construit” = suma în bani) */
  | { tip: "magazin"; pret: number; disponibile: number[]; produs: string }
  /** fâșie de calendar / zilele săptămânii */
  | { tip: "calendar"; elemente: string[]; evidentiat?: number }
  /** linia timpului: de la start, durata (minute de la miezul nopții) */
  | { tip: "linieTimp"; start: number; durata: number }
  // ── faza D: geometrie și date ──
  /** figură plană; `axa` = o linie punctată (unghi în grade, 90 = verticală) pentru întrebări de simetrie */
  | { tip: "figura"; forma: FormaPlana; rotatie: number; culoare: string; axa?: number }
  | { tip: "corp"; corp: Corp; culoare: string }
  | { tip: "obiecte"; elemente: string[] }
  | { tip: "linie"; fel: "punct" | "dreapta" | "semidreapta" | "segment" | "paralele" | "perpendiculare" | "concurente"; rotatie: number }
  | { tip: "unghi"; grade: number; rotatie: number }
  /** mai multe figuri împrăștiate (pentru numărare) */
  | { tip: "scena"; forme: { forma: FormaPlana; x: number; y: number; s: number; rot: number; culoare: string }[] }
  /** figură pe rețea de pătrățele (indice = y * latime + x); `laturi` = etichete în cm în loc de rețea */
  | { tip: "grila"; latime: number; inaltime: number; celule: number[]; laturi?: { L: number; l: number } }
  /** simetrie pe rețea: jumătatea dată + axa; interactiv = copilul colorează jumătatea cealaltă */
  | { tip: "simetrie"; latime: number; inaltime: number; celule: number[]; axa: "verticala" | "orizontala"; interactiv: boolean }
  /** sistem de coordonate (0…max); interactiv = copilul pune punctul (răspuns „construit” = x * 100 + y) */
  | { tip: "coordonate"; max: number; punct?: [number, number]; interactiv?: boolean }
  | { tip: "tabel"; titlu: string; coloane: [string, string]; randuri: [string, number][] }
  /** grafic cu bare sau pictogramă (un simbol = `pictograma.valoare`) */
  | { tip: "grafic"; titlu: string; bare: { eticheta: string; valoare: number }[]; pas: number; pictograma?: { simbol: string; valoare: number } };

export type FormaPlana = "triunghi" | "patrat" | "dreptunghi" | "cerc" | "pentagon" | "hexagon" | "romb" | "trapez" | "oval";
export type Corp = "cub" | "sfera" | "cilindru" | "con" | "paralelipiped" | "piramida";

/** Răspunsul așteptat și felul în care îl dă copilul. */
export type Raspuns =
  | { tip: "numar"; valoare: number }
  | { tip: "optiune"; valoare: string; optiuni: string[] }
  | { tip: "campuri"; valori: number[]; etichete: string[] }
  | { tip: "ordine"; valori: number[] }
  /** valoarea e construită direct pe obiect (blocuri, numărătoare) */
  | { tip: "construit"; valoare: number }
  /** o mulțime de elemente, fără ordine (ex. pătrățelele colorate pe rețea) */
  | { tip: "multime"; valori: number[] }
  /** număr zecimal scris cu virgulă, ca la școală („0,35”); se acceptă și punctul */
  | { tip: "zecimal"; valoare: number; text: string };

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
    case "zecimal": {
      const t = String(dat ?? "").trim().replace(",", ".");
      if (!/^\d+(\.\d+)?$/.test(t)) return false;
      return Math.abs(Number(t) - r.valoare) < 1e-9;
    }
    case "multime": {
      if (!Array.isArray(dat)) return false;
      const a = new Set(dat.map(Number));
      return a.size === r.valori.length && r.valori.every((v) => a.has(v));
    }
  }
}

/** Răspunsul formulat pentru copil (ținând cont de mecanică: oră, bani, părți colorate). */
export function raspunsPentruCopil(e: Pick<Exercitiu, "raspuns" | "mecanica">): string {
  const r = e.raspuns;
  const m = e.mecanica;
  if (r.tip === "construit") {
    if (m.tip === "ceas") return `${Math.floor(r.valoare / 60) || 12}:${String(r.valoare % 60).padStart(2, "0")}`;
    if (m.tip === "magazin") {
      const b = r.valoare;
      return b % 100 === 0 ? `${b / 100} ${b === 100 ? "leu" : "lei"}` : b < 100 ? `${b} bani` : `${Math.floor(b / 100)} lei și ${b % 100} bani`;
    }
    if (m.tip === "fractie") return `colorează ${r.valoare} ${r.valoare === 1 ? "parte" : "părți"}`;
    if (m.tip === "coordonate") return `punctul (${Math.floor(r.valoare / 100)}, ${r.valoare % 100})`;
  }
  if (r.tip === "multime" && m.tip === "simetrie") return `colorează ${r.valori.length} pătrățele, în oglindă față de linia punctată`;
  return raspunsText(r);
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
    case "multime":
      return r.valori.join(", ");
    case "zecimal":
      return r.text;
  }
}
