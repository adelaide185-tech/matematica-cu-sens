/**
 * Logica pură a manipulativelor (fără React): se testează ușor și e folosită
 * atât în Atelier (lucru liber), cât și în lecțiile ghidate (verificarea răspunsurilor).
 */

// ───────── Blocuri baza 10 ─────────

export interface Blocuri {
  sute: number;
  zeci: number;
  unitati: number;
}

/** Câte piese încap pe o coloană: 19 unități / 19 zeci, ca să existe nevoia de grupare. Sute: până la 10 (= 1000). */
export const MAX_BLOCURI: Blocuri = { sute: 10, zeci: 19, unitati: 19 };

export const BLOCURI_GOALE: Blocuri = { sute: 0, zeci: 0, unitati: 0 };

export function valoareBlocuri(b: Blocuri): number {
  return b.sute * 100 + b.zeci * 10 + b.unitati;
}

/** Forma „cu cele mai puține piese” a unui număr (0–1000). */
export function blocuriDin(n: number): Blocuri {
  return { sute: Math.floor(n / 100), zeci: Math.floor((n % 100) / 10), unitati: n % 10 };
}

/** Este numărul reprezentat cu cele mai puține piese (fără 10 bucăți pe o coloană)? */
export function esteCanonic(b: Blocuri): boolean {
  return b.unitati < 10 && b.zeci < 10;
}

/** Schimbă 10 unități pe 1 zece sau 10 zeci pe 1 sută. Întoarce null dacă nu se poate. */
export function grupeaza(b: Blocuri, ordin: "unitati" | "zeci"): Blocuri | null {
  if (ordin === "unitati") {
    if (b.unitati < 10 || b.zeci >= MAX_BLOCURI.zeci) return null;
    return { ...b, unitati: b.unitati - 10, zeci: b.zeci + 1 };
  }
  if (b.zeci < 10 || b.sute >= MAX_BLOCURI.sute) return null;
  return { ...b, zeci: b.zeci - 10, sute: b.sute + 1 };
}

/** Schimbă 1 zece pe 10 unități sau 1 sută pe 10 zeci. Întoarce null dacă nu se poate. */
export function desface(b: Blocuri, ordin: "zeci" | "sute"): Blocuri | null {
  if (ordin === "zeci") {
    if (b.zeci < 1 || b.unitati + 10 > MAX_BLOCURI.unitati) return null;
    return { ...b, zeci: b.zeci - 1, unitati: b.unitati + 10 };
  }
  if (b.sute < 1 || b.zeci + 10 > MAX_BLOCURI.zeci) return null;
  return { ...b, sute: b.sute - 1, zeci: b.zeci + 10 };
}

/** Adaugă sau scoate o piesă, respectând limitele coloanei. */
export function modificaBlocuri(b: Blocuri, ordin: keyof Blocuri, delta: number): Blocuri {
  const v = Math.min(MAX_BLOCURI[ordin], Math.max(0, b[ordin] + delta));
  return { ...b, [ordin]: v };
}

// ───────── Rekenrek și cadrul de 10 ─────────

/** Rekenrek cu 2 rânduri a câte 10 bile; fiecare valoare = câte bile sunt împinse la stânga. */
export interface Rekenrek {
  sus: number;
  jos: number;
}

/**
 * Atingerea unei bile (index de la stânga, 0–9) pe un rând cu `stanga` bile împinse:
 * - bila e deja la stânga → ea și cele din dreapta ei se întorc (rămân `index` bile);
 * - bila e la dreapta → ea și toate dinaintea ei vin la stânga (devin `index + 1`).
 */
export function atingeBila(stanga: number, index: number): number {
  return index < stanga ? index : index + 1;
}

export function valoareRekenrek(r: Rekenrek): number {
  return r.sus + r.jos;
}

/** Cadrul dublu de 10: 20 de căsuțe; 0 = goală, 1 = jeton roșu, 2 = jeton galben. */
export type Cadru = (0 | 1 | 2)[];

export const CADRU_GOL: Cadru = Array(20).fill(0);

export function numaraCadru(c: Cadru, culoare?: 1 | 2): number {
  return c.filter((x) => (culoare ? x === culoare : x !== 0)).length;
}

/** Umple cadrul în ordine: întâi `rosii` jetoane roșii, apoi `galbene` galbene (cum se face la „completează până la 10”). */
export function cadruDin(rosii: number, galbene = 0): Cadru {
  return Array.from({ length: 20 }, (_, i) => (i < rosii ? 1 : i < rosii + galbene ? 2 : 0)) as Cadru;
}

// ───────── Axa numerelor ─────────

export interface Salt {
  de: number;
  la: number;
}

export interface Axa {
  start: number;
  sfarsit: number;
  /** distanța dintre gradațiile numerotate */
  pas: number;
  /** cât de fin se poate plasa un punct (de obicei 1) */
  fin: number;
  puncte: number[];
  salturi: Salt[];
  /** ascunde numerele de pe gradații (rămân capetele): pentru estimare */
  faraEtichete?: boolean;
}

export function gradatii(a: Pick<Axa, "start" | "sfarsit" | "pas">): number[] {
  const r: number[] = [];
  if (a.pas <= 0 || a.sfarsit <= a.start) return r;
  for (let x = a.start; x <= a.sfarsit + 1e-9; x += a.pas) r.push(Math.round(x * 1000) / 1000);
  return r;
}

/** Aduce o valoare pe cea mai apropiată poziție permisă de pe axă. */
export function lipesteDeAxa(a: Pick<Axa, "start" | "sfarsit" | "fin">, x: number): number {
  const v = a.start + Math.round((x - a.start) / a.fin) * a.fin;
  return Math.min(a.sfarsit, Math.max(a.start, Math.round(v * 1000) / 1000));
}

/** Rotunjirea din manualele românești: 5 se rotunjește în sus. */
export function rotunjeste(n: number, la: number): number {
  return Math.floor(n / la + 0.5) * la;
}

/** Unde ajungi după salturi, pornind din primul punct de plecare. */
export function capatSalturi(s: Salt[]): number | null {
  return s.length ? s[s.length - 1].la : null;
}

/** Salturile formează un drum continuu (fiecare pleacă de unde s-a oprit cel dinainte)? */
export function drumContinuu(s: Salt[]): boolean {
  return s.every((x, i) => i === 0 || x.de === s[i - 1].la);
}

export function eticheteSalt(s: Salt): string {
  const d = s.la - s.de;
  return d >= 0 ? `+${d}` : `−${-d}`;
}

// ───────── Tabla sutelor ─────────

export interface Tabla {
  /** primul număr din tablă (1, 101, 201 …) */
  start: number;
  /** număr → culoare (index în paleta tablei) */
  colorate: Record<number, number>;
  /** numere acoperite (apar ca „?”) */
  ascunse: number[];
}

export function numereTabla(start: number): number[][] {
  return Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => start + r * 10 + c));
}

/** Vecinii din tabla sutelor: cu 10 mai puțin/mai mult (sus/jos), cu 1 mai puțin/mai mult (stânga/dreapta). */
export function veciniTabla(n: number, start: number): { sus?: number; jos?: number; stanga?: number; dreapta?: number } {
  const i = n - start;
  if (i < 0 || i > 99) return {};
  const r = Math.floor(i / 10);
  const c = i % 10;
  return {
    sus: r > 0 ? n - 10 : undefined,
    jos: r < 9 ? n + 10 : undefined,
    stanga: c > 0 ? n - 1 : undefined,
    dreapta: c < 9 ? n + 1 : undefined,
  };
}

/** Mulțimea numerelor colorate (orice culoare), sortată. */
export function colorateTabla(t: Tabla): number[] {
  return Object.keys(t.colorate).map(Number).sort((a, b) => a - b);
}

export function aceleasiNumere(a: number[], b: number[]): boolean {
  const x = [...new Set(a)].sort((p, q) => p - q);
  const y = [...new Set(b)].sort((p, q) => p - q);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

// ───────── Modelul în bară (metoda figurativă, Singapore) ─────────

export interface Segment {
  /** lungimea desenată (unități de desen; nu trebuie să fie egală cu valoarea) */
  lungime: number;
  /** ce scrie pe segment: un număr, „?” sau gol */
  eticheta: string;
  /** elevul poate scrie pe segment */
  editabil?: boolean;
  /** segment punctat (diferența, la problemele de comparație) */
  punctat?: boolean;
  culoare?: number;
}

export interface Bara {
  nume: string;
  segmente: Segment[];
  /** eticheta acoladei de sub bară (întregul) */
  total?: string;
  totalEditabil?: boolean;
}

export interface ModelBara {
  bare: Bara[];
}

/** Numărul scris pe o etichetă (spațiile ignorate), sau null dacă nu e un număr. */
export function numarDinEticheta(e: string | undefined): number | null {
  const t = (e ?? "").replace(/\s/g, "");
  return /^\d+$/.test(t) ? Number(t) : null;
}

export const lungimeBara = (b: Bara) => b.segmente.reduce((s, x) => s + x.lungime, 0);

export function lungimeMaxima(m: ModelBara): number {
  return Math.max(1, ...m.bare.map(lungimeBara));
}

/** Etichetele editabile din model, în ordine (pentru verificare): segmente, apoi acolada fiecărei bare. */
export function eticheteEditabile(m: ModelBara): string[] {
  return m.bare.flatMap((b) => [...b.segmente.filter((s) => s.editabil).map((s) => s.eticheta), ...(b.totalEditabil ? [b.total ?? ""] : [])]);
}
