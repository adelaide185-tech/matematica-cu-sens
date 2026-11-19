/**
 * Punctajul jocurilor arcade (inspirat din „punctaj fix pe exercițiu”, cu regulile noastre):
 * - fiecare întrebare valorează 30 de puncte și pornește cu 3 inimioare;
 * - o greșeală (sau o întrebare scăpată) costă o inimioară = 10 puncte, iar runda se reia cu variantele amestecate;
 * - după a 2-a greșeală arătăm răspunsul și rezolvarea, iar întrebarea primește 0 puncte;
 * - jocul nu se oprește niciodată din cauza inimioarelor.
 * Stelele: ≥ 50% → 1, ≥ 70% → 2, ≥ 90% → 3. Medalia: Bronz / Argint / Aur; Diamant = toate din prima.
 */
export const PUNCTE_INTREBARE = 30;
export const GRESELI_MAX = 2;

export type Medalie = "diamant" | "aur" | "argint" | "bronz" | null;

/** punctele unei întrebări după numărul de greșeli (0, 1 sau 2+) */
export const puncteIntrebare = (greseli: number) => (greseli >= GRESELI_MAX ? 0 : PUNCTE_INTREBARE - 10 * greseli);

export function rezultatArcade(greseliPeIntrebare: number[]) {
  const n = greseliPeIntrebare.length;
  const scor = greseliPeIntrebare.reduce((s, g) => s + puncteIntrebare(g), 0);
  const max = Math.max(1, n) * PUNCTE_INTREBARE;
  const procent = Math.round((100 * scor) / max);
  const dinPrima = greseliPeIntrebare.filter((g) => g === 0).length;
  const rezolvate = greseliPeIntrebare.filter((g) => g < GRESELI_MAX).length;
  const stele = procent >= 90 ? 3 : procent >= 70 ? 2 : procent >= 50 ? 1 : 0;
  const medalie: Medalie = n && dinPrima === n ? "diamant" : procent >= 90 ? "aur" : procent >= 70 ? "argint" : procent >= 50 ? "bronz" : null;
  let serie = 0, serieMax = 0;
  for (const g of greseliPeIntrebare) { serie = g === 0 ? serie + 1 : 0; serieMax = Math.max(serieMax, serie); }
  return { scor, max, procent, dinPrima, rezolvate, stele, medalie, serieMax };
}

export type VitezaArcade = 1 | 2 | 3;
export const NUME_VITEZA: Record<VitezaArcade, string> = { 1: "Începător", 2: "Intermediar", 3: "Expert" };
/** cât durează (ms) până când obiectele ies din ecran / ajung la mașină / ajung la rachetă */
export const DURATA_RUNDA: Record<"baloane" | "cursa" | "racheta", Record<VitezaArcade, number>> = {
  baloane: { 1: 13000, 2: 9000, 3: 6000 },
  cursa: { 1: 10000, 2: 7000, 3: 4500 },
  racheta: { 1: 13000, 2: 9000, 3: 6500 },
};
