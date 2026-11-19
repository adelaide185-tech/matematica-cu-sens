/**
 * Pachetul „Clasa a IV-a – semestrul al II-lea”: cele 12 capitole din cuprins, fiecare cu
 * Nivel 1 / Nivel 2 și cu rezolvarea pas cu pas („exerciții rezolvate”).
 * Itemii au aceeași formă ca la clasa a III-a, ca să folosească aceleași 5 jocuri și aceeași fișă.
 */
import type { Antet } from "@/motor/calcul/tipuri";
import type { JocC3, RaspunsC3, Verificare as VerificareC3, Fata, FelItem, Figura } from "@/motor/clasa3/tipuri";

export type CapitolC4 =
  | "geometrie" | "corpuri" | "figurativa" | "incercari" | "estimare" | "logica"
  | "tabele" | "etaloane" | "capacitate" | "lungime" | "masa" | "timp";

export type NivelC4 = "1" | "2" | "amestecat";
export type JocC4 = JocC3;

export interface ConfigC4 {
  seed: number;
  capitole: CapitolC4[];
  nivel: NivelC4;
  joc: JocC4;
  nr: number;
  vieti: 0 | 3 | 5;
  viteza: 1 | 2 | 3;
  inlocuiri: Record<string, number>;
  coloane: "auto" | 2 | 3 | 4;
  antet: Antet;
}

export type FormaPlana = "patrat" | "dreptunghi" | "triunghi" | "romb" | "paralelogram" | "trapez" | "cerc" | "pentagon" | "hexagon";
export type Corp = "cub" | "cuboid" | "piramida" | "piramida-tri" | "prisma-tri" | "cilindru" | "con" | "sfera";

/** Desenele de clasa a IV-a (SVG, aceleași pe fișă și în joc). */
export type Desen =
  | { tip: "drepte"; rel: "paralele" | "perpendiculare" | "concurente"; unghi: number; rot?: number }
  | { tip: "plana"; forma: FormaPlana; etichete?: string[] }
  | { tip: "corp"; corp: Corp }
  | { tip: "tabel"; titlu: string; cap: string[]; randuri: string[][] }
  | { tip: "bile"; bile: [string, number][] }
  /** metoda figurativă: fiecare mărime = n segmente egale (+ un rest notat) */
  | { tip: "segmente"; linii: { nume: string; parti: number; plus?: string }[]; acolada?: string };

export type Verificare =
  | VerificareC3
  /** sistem liniar cu soluție naturală unică (metoda figurativă, încercări) */
  | { tip: "sistem"; ecuatii: string[]; necunoscute: string[]; cere: string; valoare: number }
  /** fapt verificat în tabelul independent din scriptul SymPy */
  | { tip: "fapt"; categorie: "corp" | "plana" | "drepte" | "etalon"; cheie: string; proprietate: string; valoare: string | number }
  | { tip: "eveniment"; bile: [string, number][]; culoare: string; valoare: "sigur" | "posibil" | "imposibil" }
  | { tip: "probabil"; bile: [string, number][]; valoare: string }
  | { tip: "numarare"; fel: "asezari" | "perechi" | "combinatii" | "numere"; n: number; m?: number; cifre?: number[]; valoare: number }
  | { tip: "secol"; an: number; valoare: number }
  | { tip: "estimare"; numere: number[]; op: "+" | "-" | "*"; la: number; valoare: number };

export interface ItemC4 {
  id: string;
  cheie: string;
  capitol: CapitolC4;
  nivel: 1 | 2;
  fel: FelItem;
  text: string;
  desen?: Desen;
  figura?: Figura;
  fractie?: Fata["fractie"];
  st?: Fata;
  dr?: Fata;
  raspuns: RaspunsC3;
  afis: string;
  indiciu: string;
  /** rezolvarea pas cu pas (fișa „Exerciții rezolvate”) */
  rezolvare: string[];
  verificare: Verificare;
}

export const NUME_CAPITOL_C4: Record<CapitolC4, string> = {
  geometrie: "Elemente de geometrie",
  corpuri: "Corpurile geometrice",
  figurativa: "Probleme prin metoda figurativă",
  incercari: "Probleme prin încercări",
  estimare: "Probleme de estimare",
  logica: "Probleme de logică și probabilități",
  tabele: "Organizarea datelor în tabele",
  etaloane: "Măsurări cu etaloane convenționale",
  capacitate: "Unități de măsură pentru capacitate",
  lungime: "Unități de măsură pentru lungime",
  masa: "Unități de măsură pentru masă",
  timp: "Unități de măsură pentru timp",
};

export const DESCRIERE_CAPITOL_C4: Record<CapitolC4, string> = {
  geometrie: "drepte paralele și perpendiculare, figuri plane, perimetrul",
  corpuri: "cub, cuboid, piramidă, cilindru, con, sferă: fețe, muchii, vârfuri",
  figurativa: "sumă și diferență, sumă și raport, diferență și raport",
  incercari: "numere consecutive, găini și iepuri, numere ascunse",
  estimare: "rotunjim, apoi calculăm aproximativ",
  logica: "sigur / posibil / imposibil, mai probabil, numărarea cazurilor",
  tabele: "citim și completăm tabele",
  etaloane: "alegem unitatea și instrumentul potrivit",
  capacitate: "kl, hl, dal, l, dl, cl, ml",
  lungime: "km, hm, dam, m, dm, cm, mm",
  masa: "t, q, kg, hg, dag, g, dg, cg, mg",
  timp: "mileniu, secol, deceniu, an, lună, săptămână, zi, oră, minut, secundă",
};

export const ICON_CAPITOL_C4: Record<CapitolC4, string> = {
  geometrie: "📐", corpuri: "🧊", figurativa: "📊", incercari: "🔎", estimare: "🎯", logica: "🎲",
  tabele: "🗂️", etaloane: "🧰", capacitate: "🧴", lungime: "📏", masa: "⚖️", timp: "⏳",
};

export const NUME_NIVEL_C4: Record<NivelC4, string> = { "1": "Nivel 1", "2": "Nivel 2", amestecat: "Amestecat" };
