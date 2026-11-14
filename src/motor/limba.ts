/** Utilitare de limbă română: numere în litere, acord cu „de”, forme feminine. */

const UNITATI = ["zero", "unu", "doi", "trei", "patru", "cinci", "șase", "șapte", "opt", "nouă"];
const UNITATI_F = ["zero", "una", "două", "trei", "patru", "cinci", "șase", "șapte", "opt", "nouă"];
const ZECE_19 = [
  "zece", "unsprezece", "doisprezece", "treisprezece", "paisprezece",
  "cincisprezece", "șaisprezece", "șaptesprezece", "optsprezece", "nouăsprezece",
];
const ZECE_19_F = [...ZECE_19.slice(0, 2), "douăsprezece", ...ZECE_19.slice(3)];
const ZECI = ["", "", "douăzeci", "treizeci", "patruzeci", "cincizeci", "șaizeci", "șaptezeci", "optzeci", "nouăzeci"];

/** 0–99; fem = forma feminină (folosită înainte de „mii”) */
function subSuta(n: number, fem: boolean): string {
  if (n < 10) return (fem ? UNITATI_F : UNITATI)[n];
  if (n < 20) return (fem ? ZECE_19_F : ZECE_19)[n - 10];
  const z = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? ZECI[z] : `${ZECI[z]} și ${(fem ? UNITATI_F : UNITATI)[u]}`;
}

function subMie(n: number, fem: boolean): string {
  const s = Math.floor(n / 100);
  const r = n % 100;
  const parti: string[] = [];
  if (s === 1) parti.push("o sută");
  else if (s === 2) parti.push("două sute");
  else if (s > 2) parti.push(`${UNITATI[s]} sute`);
  if (r > 0) parti.push(subSuta(r, fem));
  return parti.join(" ");
}

/** „de” se pune după numerele ≥ 20 care se termină în 00 sau în 20–99: 20 de, 120 de, 105 (fără). */
export function cereDe(n: number): boolean {
  const r = n % 100;
  return n >= 20 && (r === 0 || r >= 20);
}

/** Numărul scris în litere, 0 – 999 999. */
export function numarInLitere(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999) throw new Error(`În afara intervalului: ${n}`);
  if (n === 0) return "zero";
  const mii = Math.floor(n / 1000);
  const rest = n % 1000;
  const parti: string[] = [];
  if (mii === 1) parti.push("o mie");
  else if (mii > 1) {
    const m = mii === 2 ? "două" : subMie(mii, true);
    parti.push(`${m}${cereDe(mii) ? " de" : ""} mii`);
  }
  if (rest > 0) parti.push(subMie(rest, false));
  return parti.join(" ");
}

/** „24 de mere”, „15 mere”, „1 măr” — cu forma de singular la 1. */
export function cuSubstantiv(n: number, singular: string, plural: string): string {
  if (n === 1) return `1 ${singular}`;
  return `${n} ${cereDe(n) ? "de " : ""}${plural}`;
}

/** Scriere cu separator de mii românesc: 12 345 */
export function formatNumar(n: number): string {
  return n >= 10000 ? n.toLocaleString("ro-RO").replace(/\./g, " ") : String(n);
}
