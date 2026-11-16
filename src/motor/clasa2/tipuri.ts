/**
 * Clasa a II-a: conținut pe noțiuni (aceleași ca în antrenament), pe 3 niveluri,
 * cu greșeli tipice etichetate — folosit la fel pe fișa PDF și în mini-jocuri.
 */
import type { Antet } from "@/motor/calcul/tipuri";

export type NivelC2 = "usor" | "mediu" | "provocare";
export type CapitolC2 = "numeratie" | "operatii" | "probleme" | "fractii" | "masurari" | "timp" | "bani";

export type NotiuneC2 =
  | "num.formare" | "num.litere" | "num.descompunere" | "num.vecini" | "num.comparare" | "num.ordonare" | "num.paritate" | "num.rotunjire" | "num.sir" | "num.extreme"
  | "op.adunare" | "op.scadere" | "op.termen" | "op.tabla" | "op.comutativ" | "op.impartire" | "op.dublu" | "op.ordine"
  | "pb.una" | "pb.doua"
  | "fr.parte" | "fr.din"
  | "mas.transformari" | "mas.masa-lichid"
  | "timp.ceas" | "timp.durata" | "timp.calendar"
  | "bani.numara" | "bani.rest";

/** Greșelile tipice, deduse din răspunsul elevului (fiecare distractor poartă eticheta lui). */
export type TipEroare =
  | "trecere_omisa" | "imprumut_omis" | "ordin_gresit" | "tabel_vecin" | "operatie_inversa" | "necunoscuta_inversata"
  | "ceas_ace_inversate" | "ceas_fara_un_sfert" | "bani_lei_bani" | "unitate_m_cm" | "fractie_parti_inegale" | "timp_expirat" | "altele";

export type JocC2 = "perechi" | "bule" | "scara" | "casute" | "balanta" | "ordonare" | "memorie" | "ceas" | "magazin";
export type FormaNecunoscuta = "a+x=b" | "x+a=b" | "x-a=b" | "a-x=b" | "xb=c" | "ax=c";

export interface OptiuniC2 {
  trecere: "fara" | "cu" | "oricum";
  trecereLa: "zeci" | "sute" | "ambele";
  forme: FormaNecunoscuta[];
  table: number[];
  dublu: ("dublul" | "triplul" | "jumatatea" | "sfertul")[];
  rotunjireLa: 10 | 100 | 0; // 0 = ambele
  fractii: ("1/2" | "1/4" | "1/3")[];
  timpPas: 60 | 30 | 15;
  baniMax: number;
  /** Ordonează: sensul cerut */
  sens: "crescator" | "descrescator" | "ambele";
}

export interface ConfigC2 {
  seed: number;
  notiuni: NotiuneC2[];
  optiuni: OptiuniC2;
  joc: JocC2;
  nr: number;
  /** nivelul fixat de profesor sau „alege” (copilul alege înainte de joc) */
  nivel: NivelC2 | "alege";
  vieti: 0 | 3 | 5;
  /** Scara: variante (butoane) sau tastatură */
  modScara: "variante" | "tastatura";
  inlocuiri: Record<string, number>;
  coloane: "auto" | 2 | 3;
  antet: Antet;
}

export type VizualC2 =
  | { tip: "numaratoare"; sute: number; zeci: number; unitati: number }
  | { tip: "grupe"; grupe: number; cate: number }
  | { tip: "ceas"; ore: number; minute: number }
  | { tip: "fractie"; parti: number; colorate: number; forma: "cerc" | "dreptunghi" };

export interface Distractor { v: string; eroare: TipEroare }

export type RaspunsC2 =
  | { tip: "valoare"; valoare: string }
  /** Ordonează: ordinea corectă a cartonașelor */
  | { tip: "ordine"; corect: string[] }
  /** Ceasul, „mută acele”: ora de arătat (răspuns „h:m”) */
  | { tip: "ora"; ore: number; minute: number }
  /** căsuțe: toate soluțiile acceptate (ex. □ × □ = 12 → 2·6, 3·4, 4·3, 6·2) */
  | { tip: "casute"; solutii: number[][] }
  | { tip: "pereche" };

export type VerificareC2 =
  | { tip: "egal"; expr: string; valoare: number }
  | { tip: "ecuatie"; expr: string; solutii: number[][] }
  | { tip: "litere"; n: number; text: string }
  | { tip: "ora"; ore: number; minute: number; text: string }
  | { tip: "text"; corect: string; din: string[] }
  | { tip: "fractie"; num: number; den: number }
  | { tip: "compara"; numere: number[]; valoare: number; mare: boolean }
  /** Balanța: cele două părți, în aceeași unitate (expresii ASCII) */
  | { tip: "semn"; st: string; dr: string; semn: "<" | ">" | "=" }
  | { tip: "ordine"; valori: number[]; sens: "crescator" | "descrescator" }
  /** Magazinul: suma banilor (expresie în bani) și cum se spune */
  | { tip: "bani"; expr: string; valoare: number; text: string };

export interface ItemC2 {
  id: string;
  cheie: string;
  notiune: NotiuneC2;
  nivel: NivelC2;
  /** cerința scurtă; „□” = căsuță de completat */
  text: string;
  /** Perechi: fața din stânga (expresie / desen) și din dreapta (rezultat) */
  st?: string;
  vizual?: VizualC2;
  /** Balanța: talerul din dreapta (stânga e `st`); „echilibrează”: stânga are o căsuță de umplut cu greutăți */
  dr?: string;
  echilibru?: boolean;
  /** Ordonează: cartonașele (amestecate) și sensul */
  cartonase?: string[];
  sens?: "crescator" | "descrescator";
  /** Ceasul: „potrivește” (citește ora) sau „muta” (potrivește acele) */
  modCeas?: "potriveste" | "muta";
  /** Magazinul: produsul, prețul și banii (în bani; 100 bani = 1 leu) */
  magazin?: { mod: "plateste" | "numara" | "rest"; produs?: string; emoji?: string; pret?: number; platit?: number; bani?: number[]; inBani?: boolean };
  raspuns: RaspunsC2;
  /** răspunsul corect afișat (barem, Perechi, variante) */
  afis: string;
  /** variante greșite, cu greșeala pe care o reprezintă */
  distractori: Distractor[];
  indiciu: string;
  verificare: VerificareC2;
}

export const CAPITOLE_C2: { id: CapitolC2; nume: string; icon: string; notiuni: [NotiuneC2, string][] }[] = [
  { id: "numeratie", nume: "Numerație", icon: "🔢", notiuni: [["num.formare", "Formăm numere"], ["num.litere", "Numere scrise cu litere"], ["num.descompunere", "Descompunem numere"], ["num.vecini", "Vecinii numerelor"], ["num.comparare", "Comparăm numere"], ["num.ordonare", "Ordonăm numere"], ["num.paritate", "Par sau impar"], ["num.rotunjire", "Rotunjim numere"], ["num.sir", "Șiruri cu regulă"], ["num.extreme", "Cel mai mare, cel mai mic"]] },
  { id: "operatii", nume: "Operații", icon: "➕", notiuni: [["op.adunare", "Adunarea (în coloană)"], ["op.scadere", "Scăderea (în coloană)"], ["op.termen", "Numărul care lipsește"], ["op.tabla", "Tabla înmulțirii"], ["op.comutativ", "Ordinea factorilor"], ["op.impartire", "Tabla împărțirii"], ["op.dublu", "Dublul, triplul, jumătatea, sfertul"], ["op.ordine", "Ordinea operațiilor"]] },
  { id: "probleme", nume: "Probleme", icon: "🧩", notiuni: [["pb.una", "Probleme cu o operație"], ["pb.doua", "Probleme cu două operații"]] },
  { id: "fractii", nume: "Fracții", icon: "🍕", notiuni: [["fr.parte", "Fracția: o parte din întreg"], ["fr.din", "Jumătate, sfert, treime din…"]] },
  { id: "masurari", nume: "Măsurări", icon: "📏", notiuni: [["mas.transformari", "Transformăm unități (m, cm)"], ["mas.masa-lichid", "Cântărim / cât lichid este"]] },
  { id: "timp", nume: "Timpul", icon: "🕒", notiuni: [["timp.ceas", "Ceasul"], ["timp.durata", "Cât timp a trecut"], ["timp.calendar", "Zile, luni, anotimpuri"]] },
  { id: "bani", nume: "Banii", icon: "🪙", notiuni: [["bani.numara", "Câți bani sunt"], ["bani.rest", "Cât rest primești"]] },
];

export const NUME_NOTIUNE = Object.fromEntries(CAPITOLE_C2.flatMap((c) => c.notiuni)) as Record<NotiuneC2, string>;

export const JOCURI_C2: Record<JocC2, { nume: string; icon: string; instructiune: string; culoare: string; descriere: string }> = {
  perechi: { nume: "Perechi rapide", icon: "🔗", instructiune: "Găsește perechile!", culoare: "#2f6fd1", descriere: "Atinge un cartonaș, apoi perechea lui. Atenție: unele n-au pereche!" },
  bule: { nume: "Bule care cad", icon: "🫧", instructiune: "Atinge bula corectă!", culoare: "#2e9e5b", descriere: "Bulele coboară încet: sparge-o pe cea cu răspunsul bun." },
  scara: { nume: "Scara", icon: "🪜", instructiune: "Urcă scara!", culoare: "#e07a1f", descriere: "Fiecare răspuns bun te urcă o treaptă, până la trofeu." },
  casute: { nume: "Completează căsuțele", icon: "🔲", instructiune: "Completează căsuța!", culoare: "#6a59a7", descriere: "Află numărul care lipsește din căsuță." },
  balanta: { nume: "Balanța", icon: "⚖️", instructiune: "Care parte e mai grea?", culoare: "#8b5e3c", descriere: "Alege <, = sau >. La Provocare, echilibrezi balanța cu greutăți." },
  ordonare: { nume: "Ordonează", icon: "📶", instructiune: "Pune în ordine!", culoare: "#e0483e", descriere: "Atinge cartonașele în ordine, crescător sau descrescător." },
  ceas: { nume: "Ceasul", icon: "🕒", instructiune: "Cât arată ceasul?", culoare: "#2f6fd1", descriere: "Citește ora sau mută acele ceasului până arată ora cerută." },
  magazin: { nume: "Magazinul", icon: "🛒", instructiune: "Hai la cumpărături!", culoare: "#2e9e5b", descriere: "Plătește exact, numără banii și află restul." },
  memorie: { nume: "Memorie", icon: "🃏", instructiune: "Găsește perechile!", culoare: "#0f8a8a", descriere: "Întoarce câte două cărți și găsește calculul și rezultatul lui. Fără inimi!" },
};

export const NIVELURI_C2: Record<NivelC2, { nume: string; icon: string; descriere: string; multiplicator: number }> = {
  usor: { nume: "Ușor", icon: "🐢", descriere: "0–100, cu desene", multiplicator: 1 },
  mediu: { nume: "Mediu", icon: "🐇", descriere: "0–1 000, desen + calcul", multiplicator: 1.5 },
  provocare: { nume: "Provocare", icon: "🚀", descriere: "0–1 000, cifre și pași", multiplicator: 2 },
};

export const NUME_EROARE: Record<TipEroare, string> = {
  trecere_omisa: "a uitat trecerea peste ordin (transportul)", imprumut_omis: "a uitat împrumutul la scădere", ordin_gresit: "a încurcat ordinele (zeci ↔ unități)",
  tabel_vecin: "a confundat cu un rezultat vecin din tablă", operatie_inversa: "a făcut operația inversă", necunoscuta_inversata: "a calculat greșit necunoscuta",
  ceas_ace_inversate: "a inversat acele ceasului", ceas_fara_un_sfert: "a citit greșit „fără un sfert”", bani_lei_bani: "a confundat leii cu banii",
  unitate_m_cm: "a crezut că 1 m = 10 cm", fractie_parti_inegale: "a confundat fracțiile", timp_expirat: "nu a răspuns la timp", altele: "altă greșeală",
};

/** Ce noțiuni merg în fiecare joc (după matricea din specificație). */
export const COMPATIBIL: Record<JocC2, NotiuneC2[]> = {
  perechi: ["num.formare", "num.litere", "num.descompunere", "op.adunare", "op.scadere", "op.tabla", "op.comutativ", "op.impartire", "op.dublu", "fr.parte", "fr.din", "mas.transformari", "timp.ceas", "timp.calendar", "bani.numara"],
  bule: ["num.vecini", "num.comparare", "num.paritate", "num.rotunjire", "num.extreme", "num.sir", "op.adunare", "op.scadere", "op.tabla", "op.impartire", "op.dublu", "timp.calendar", "fr.din", "bani.numara"],
  scara: ["num.formare", "num.vecini", "num.rotunjire", "num.litere", "op.adunare", "op.scadere", "op.tabla", "op.impartire", "op.dublu", "op.ordine", "pb.una", "pb.doua", "mas.transformari", "mas.masa-lichid", "timp.ceas", "timp.durata", "bani.numara", "bani.rest", "fr.din"],
  casute: ["num.descompunere", "num.vecini", "num.sir", "op.adunare", "op.scadere", "op.termen", "op.tabla", "op.comutativ", "op.impartire", "op.dublu", "op.ordine", "fr.din", "mas.transformari", "timp.durata", "bani.numara", "bani.rest", "pb.una"],
  balanta: ["num.comparare", "op.adunare", "op.scadere", "op.termen", "op.tabla", "op.impartire", "op.dublu", "mas.transformari", "mas.masa-lichid", "bani.numara"],
  ordonare: ["num.ordonare", "num.extreme", "num.comparare", "timp.calendar"],
  ceas: ["timp.ceas"],
  magazin: ["bani.numara", "bani.rest"],
  memorie: ["num.formare", "num.litere", "num.descompunere", "op.adunare", "op.scadere", "op.tabla", "op.comutativ", "op.impartire", "op.dublu", "fr.parte", "fr.din", "mas.transformari", "timp.ceas", "timp.calendar", "bani.numara"],
};

/** Banii (în bani): monede de 1, 5, 10, 50 de bani; bancnote de 1, 5, 10, 50, 100 de lei */
export const MONEDE = [1, 5, 10, 50];
export const BANCNOTE = [100, 500, 1000, 5000, 10000];

export const NR_RAPIDE_C2 = [10, 15, 20, 25, 50, 100] as const;
/** Bule: secunde de sus până jos, pe nivel */
export const VITEZA_BULE: Record<NivelC2, number> = { usor: 8, mediu: 6, provocare: 4 };
