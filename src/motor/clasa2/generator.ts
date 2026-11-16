import { Rng } from "@/motor/rng";
import { hash } from "@/motor/calcul/generator";
import { cuSubstantiv, numarInLitere } from "@/motor/limba";

const lei = (n: number) => cuSubstantiv(n, "leu", "lei");
const cu = cuSubstantiv;
import type { ConfigC2, Distractor, ItemC2, JocC2, NivelC2, NotiuneC2, OptiuniC2, TipEroare, VerificareC2, VizualC2 } from "./tipuri";
import { COMPATIBIL } from "./tipuri";

// ───────────────────────── limbă: ora și numerele ─────────────────────────

/** Ora spusă românește: „ora 8”, „8 și un sfert”, „8 și jumătate”, „9 fără un sfert”. */
export function oraInLitere(ore: number, minute: number): string {
  const h = ((ore - 1) % 12) + 1;
  if (minute === 0) return `ora ${h}`;
  if (minute === 15) return `${h} și un sfert`;
  if (minute === 30) return `${h} și jumătate`;
  if (minute === 45) return `${(h % 12) + 1} fără un sfert`;
  return `${h} și ${minute} de minute`;
}

export const ZILE = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];
export const LUNI = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const ANOTIMP: Record<string, string> = { decembrie: "iarna", ianuarie: "iarna", februarie: "iarna", martie: "primăvara", aprilie: "primăvara", mai: "primăvara", iunie: "vara", iulie: "vara", august: "vara", septembrie: "toamna", octombrie: "toamna", noiembrie: "toamna" };

const s = (n: number) => String(n);
const cifre = (n: number) => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10];

/** Trecerea peste ordin la adunare: la zeci (unitățile ≥ 10) și la sute (zecile, cu transport, ≥ 10). */
export function trecereAdunare(a: number, b: number) {
  const [ua, za] = cifre(a), [ub, zb] = cifre(b);
  const zeci = ua + ub >= 10;
  return { zeci, sute: za + zb + (zeci ? 1 : 0) >= 10 };
}
/** Împrumutul la scădere: la zeci (unitățile descăzutului < ale scăzătorului) și la sute. */
export function trecereScadere(a: number, b: number) {
  const [ua, za] = cifre(a), [ub, zb] = cifre(b);
  const zeci = ua < ub;
  return { zeci, sute: za - (zeci ? 1 : 0) < zb };
}

/** Rezultatul greșit tipic: cifrele adunate fără transport / scăzute fără împrumut. */
const faraTransport = (a: number, b: number) => cifre(a).reduce((t, d, i) => t + ((d + cifre(b)[i]) % 10) * 10 ** i, 0);
const faraImprumut = (a: number, b: number) => cifre(a).reduce((t, d, i) => t + Math.abs(d - cifre(b)[i]) * 10 ** i, 0);
const inversat = (n: number) => Number(String(n).split("").reverse().join(""));

type Mod = "fara" | "zeci" | "sute" | "ambele" | "unul" | "orice";
function modTrecere(o: OptiuniC2, niv: NivelC2): Mod {
  if (o.trecere === "fara") return "fara";
  if (o.trecere === "cu") return niv === "usor" ? "zeci" : o.trecereLa;
  return niv === "usor" ? "fara" : niv === "mediu" ? "unul" : "orice";
}
function respecta(t: { zeci: boolean; sute: boolean }, m: Mod): boolean {
  switch (m) {
    case "fara": return !t.zeci && !t.sute;
    case "zeci": return t.zeci && !t.sute;
    case "sute": return t.sute && !t.zeci;
    case "ambele": return t.zeci && t.sute;
    case "unul": return !(t.zeci && t.sute);
    case "orice": return true;
  }
}

/** Variante greșite: fără răspunsul corect, fără repetări, completate cu vecini apropiați. */
function distractori(rng: Rng, corect: string, cand: [string | number, TipEroare][], numeric = true, min = 3): Distractor[] {
  const out: Distractor[] = [];
  for (const [v, e] of cand) {
    const t = String(v);
    if (t !== corect && !out.some((d) => d.v === t) && (!numeric || Number(t) >= 0)) out.push({ v: t, eroare: e });
  }
  if (numeric) for (const d of rng.shuffle([1, -1, 2, -2, 10, -10, 3, 5])) {
    if (out.length >= min + 1) break;
    const v = String(Number(corect) + d);
    if (Number(v) >= 0 && v !== corect && !out.some((x) => x.v === v)) out.push({ v, eroare: "altele" });
  }
  return out;
}

interface Baza {
  cheie: string;
  text: string;
  st?: string;
  valoare: string;
  distractori: Distractor[];
  vizual?: VizualC2;
  indiciu: string;
  verificare: VerificareC2;
}
interface BazaCasute { cheie: string; text: string; solutii: number[][]; indiciu: string; expr: string; vizual?: VizualC2 }

const egal = (expr: string, valoare: number): VerificareC2 => ({ tip: "egal", expr, valoare });

// ───────────────────────── exercițiile (cu variante greșite) ─────────────────────────

function adunare(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza | null {
  const max = niv === "usor" ? 100 : 1000;
  const lo = niv === "usor" ? 10 : rng.bool(0.3) ? 10 : 100;
  const a = rng.int(lo, max - 10), b = rng.int(niv === "usor" ? 1 : 10, max - a);
  if (a + b > max || !respecta(trecereAdunare(a, b), modTrecere(o, niv))) return null;
  const r = a + b;
  return {
    cheie: `+${a}+${b}`, text: `${a} + ${b} =`, st: `${a} + ${b}`, valoare: s(r),
    distractori: distractori(rng, s(r), [[faraTransport(a, b), "trecere_omisa"], [Math.abs(a - b), "operatie_inversa"], [inversat(r), "ordin_gresit"], [r + 10, "altele"], [r - 10, "altele"]]),
    vizual: niv === "usor" && r <= 100 ? { tip: "numaratoare", sute: 0, zeci: Math.floor(a / 10), unitati: a % 10 } : undefined,
    indiciu: "Adună întâi unitățile, apoi zecile. Dacă unitățile trec de 9, duci o zece mai departe.", verificare: egal(`${a} + ${b}`, r),
  };
}

function scadere(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza | null {
  const max = niv === "usor" ? 100 : 1000;
  const a = rng.int(niv === "usor" ? 20 : 100, max), b = rng.int(niv === "usor" ? 2 : 10, a - 1);
  if (!respecta(trecereScadere(a, b), modTrecere(o, niv))) return null;
  const r = a - b;
  return {
    cheie: `-${a}-${b}`, text: `${a} − ${b} =`, st: `${a} − ${b}`, valoare: s(r),
    distractori: distractori(rng, s(r), [[faraImprumut(a, b), "imprumut_omis"], [a + b <= 2000 ? a + b : r + 100, "operatie_inversa"], [inversat(r), "ordin_gresit"], [r + 10, "altele"]]),
    indiciu: "Scade întâi unitățile. Dacă nu ajung, împrumuți o zece de la zeci.", verificare: egal(`${a} - ${b}`, r),
  };
}

const masaStr = (tabele: number[]) => (tabele.length ? tabele : [2, 3, 4, 5, 6, 7, 8, 9, 10]);

function tabla(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza {
  const b = rng.pick(masaStr(o.table));
  const a = rng.int(niv === "usor" ? 1 : 0, 10);
  const r = a * b;
  return {
    cheie: `x${a}x${b}`, text: `${a} × ${b} =`, st: `${a} × ${b}`, valoare: s(r),
    distractori: distractori(rng, s(r), [[a * (b + 1), "tabel_vecin"], [Math.abs(a * (b - 1)), "tabel_vecin"], [(a + 1) * b, "tabel_vecin"], [a + b, "operatie_inversa"]]),
    vizual: niv === "usor" && a > 0 ? { tip: "grupe", grupe: a, cate: b } : undefined,
    indiciu: `${a} × ${b} înseamnă ${a} grupe a câte ${b}. Numără din ${b} în ${b}.`, verificare: egal(`${a} * ${b}`, r),
  };
}

function impartire(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza {
  const b = rng.pick(masaStr(o.table));
  const q = rng.int(1, 10);
  const n = b * q;
  return {
    cheie: `:${n}:${b}`, text: `${n} : ${b} =`, st: `${n} : ${b}`, valoare: s(q),
    distractori: distractori(rng, s(q), [[q + 1, "tabel_vecin"], [q - 1, "tabel_vecin"], [n - b, "operatie_inversa"], [b, "altele"]]),
    vizual: niv === "usor" ? { tip: "grupe", grupe: b, cate: q } : undefined,
    indiciu: `Gândește-te la tablă: ce număr înmulțit cu ${b} dă ${n}?`, verificare: egal(`${n} / ${b}`, q),
  };
}

function dublu(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza {
  const t = rng.pick(o.dublu.length ? o.dublu : (["dublul", "jumatatea"] as const));
  const lim = niv === "usor" ? 1 : 2;
  if (t === "dublul") { const n = rng.int(2, lim === 1 ? 20 : 50); return { cheie: `d${n}`, text: `Dublul lui ${n} =`, st: `dublul lui ${n}`, valoare: s(2 * n), distractori: distractori(rng, s(2 * n), [[n + 2, "operatie_inversa"], [3 * n, "altele"], [n, "altele"]]), indiciu: `Dublul înseamnă de 2 ori: ${n} + ${n}.`, verificare: egal(`2 * ${n}`, 2 * n) }; }
  if (t === "triplul") { const n = rng.int(2, lim === 1 ? 15 : 33); return { cheie: `t${n}`, text: `Triplul lui ${n} =`, st: `triplul lui ${n}`, valoare: s(3 * n), distractori: distractori(rng, s(3 * n), [[2 * n, "altele"], [n + 3, "operatie_inversa"], [4 * n, "altele"]]), indiciu: `Triplul înseamnă de 3 ori: ${n} + ${n} + ${n}.`, verificare: egal(`3 * ${n}`, 3 * n) }; }
  if (t === "jumatatea") { const n = 2 * rng.int(1, 50); return { cheie: `j${n}`, text: `Jumătatea lui ${n} =`, st: `jumătatea lui ${n}`, valoare: s(n / 2), distractori: distractori(rng, s(n / 2), [[2 * n, "operatie_inversa"], [n / 2 + 1, "altele"], [n - 2, "altele"]]), indiciu: `Împarte ${n} în 2 grupe egale.`, verificare: egal(`${n} / 2`, n / 2) }; }
  const n = 4 * rng.int(1, 25);
  return { cheie: `f${n}`, text: `Sfertul lui ${n} =`, st: `sfertul lui ${n}`, valoare: s(n / 4), distractori: distractori(rng, s(n / 4), [[n / 2, "fractie_parti_inegale"], [4 * n, "operatie_inversa"], [n - 4, "altele"]]), indiciu: `Împarte ${n} în 4 grupe egale (jumătatea jumătății).`, verificare: egal(`${n} / 4`, n / 4) };
}

function ordine(rng: Rng): Baza | null {
  const a = rng.int(2, 10), b = rng.int(2, 10), c = rng.int(2, 50);
  const f = rng.int(0, 2);
  if (f === 0) { const r = c + a * b; if (r > 100) return null; return { cheie: `o${c}+${a}x${b}`, text: `${c} + ${a} × ${b} =`, valoare: s(r), distractori: distractori(rng, s(r), [[(c + a) * b, "altele"], [c + a + b, "altele"]]), indiciu: "Întâi înmulțirea, apoi adunarea.", verificare: egal(`${c} + ${a} * ${b}`, r) }; }
  if (f === 1) { const r = c - a * b; if (r < 0) return null; return { cheie: `o${c}-${a}x${b}`, text: `${c} − ${a} × ${b} =`, valoare: s(r), distractori: distractori(rng, s(r), [[Math.max(0, (c - a) * b), "altele"], [c - a - b, "altele"]]), indiciu: "Întâi înmulțirea, apoi scăderea.", verificare: egal(`${c} - ${a} * ${b}`, r) }; }
  const r = (a + b) * c; if (r > 100) return null;
  return { cheie: `o(${a}+${b})x${c}`, text: `(${a} + ${b}) × ${c} =`, valoare: s(r), distractori: distractori(rng, s(r), [[a + b * c, "altele"], [a + b + c, "altele"]]), indiciu: "Întâi ce e în paranteză.", verificare: egal(`(${a} + ${b}) * ${c}`, r) };
}

function formare(rng: Rng, niv: NivelC2): Baza {
  const S = niv === "usor" ? 0 : rng.int(1, 9), Z = rng.int(0, 9), U = rng.int(0, 9);
  const n = 100 * S + 10 * Z + U;
  const text = S ? `${S} sute, ${Z} zeci, ${U} unități =` : `${Z} zeci și ${U} unități =`;
  return {
    cheie: `fo${n}`, text, st: text.replace(" =", ""), valoare: s(n),
    distractori: distractori(rng, s(n), [[100 * Z + 10 * S + U, "ordin_gresit"], [100 * S + 10 * U + Z, "ordin_gresit"], [S + Z + U, "altele"]]),
    vizual: { tip: "numaratoare", sute: S, zeci: Z, unitati: U }, indiciu: "Fiecare sută valorează 100, fiecare zece 10. Scrie cifrele în ordine: sute, zeci, unități.",
    verificare: egal(`${S} * 100 + ${Z} * 10 + ${U}`, n),
  };
}

function litere(rng: Rng, niv: NivelC2): Baza {
  const n = rng.int(niv === "usor" ? 11 : 100, niv === "usor" ? 100 : 1000);
  const t = numarInLitere(n);
  return {
    cheie: `li${n}`, text: `${t} =`, st: t, valoare: s(n),
    distractori: distractori(rng, s(n), [[inversat(n), "ordin_gresit"], [n + 10, "altele"], [n - 1, "altele"]]),
    indiciu: "Ascultă pe rând: sutele, zecile, unitățile.", verificare: { tip: "litere", n, text: t },
  };
}

function vecini(rng: Rng, niv: NivelC2): Baza {
  const n = rng.int(niv === "usor" ? 1 : 100, niv === "usor" ? 99 : 999);
  const succ = rng.bool();
  const v = succ ? n + 1 : n - 1;
  return {
    cheie: `v${n}${succ}`, text: `Vecinul ${succ ? "de după" : "dinainte de"} ${n}:`, valoare: s(v),
    distractori: distractori(rng, s(v), [[succ ? n - 1 : n + 1, "altele"], [succ ? n + 10 : n - 10, "ordin_gresit"], [n, "altele"]]),
    indiciu: succ ? "Vecinul de după = numărul + 1." : "Vecinul dinainte = numărul − 1.", verificare: egal(`${n} ${succ ? "+" : "-"} 1`, v),
  };
}

function rotunjire(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza | null {
  const la = o.rotunjireLa || (niv === "usor" ? 10 : rng.pick([10, 100]));
  const n = rng.int(la === 10 ? 11 : 101, niv === "usor" && la === 10 ? 99 : 999);
  if (n % la === 0) return null;
  const r = Math.round(n / la) * la;
  return {
    cheie: `r${n}:${la}`, text: `${n} rotunjit la ${la === 10 ? "zeci" : "sute"} ≈`, valoare: s(r),
    distractori: distractori(rng, s(r), [[r === Math.floor(n / la) * la ? r + la : Math.floor(n / la) * la, "altele"], [r + la, "altele"], [r - la, "altele"]]),
    indiciu: `Între ce ${la === 10 ? "zeci" : "sute"} se află? Dacă cifra de după este 5 sau mai mare, rotunjești în sus.`, verificare: egal(String(Math.floor((n + la / 2) / la) * la), r),
  };
}

function paritate(rng: Rng, niv: NivelC2): Baza {
  const par = rng.bool();
  const max = niv === "usor" ? 100 : 1000;
  const pick = (p: boolean) => { let x = rng.int(1, max - 1); if ((x % 2 === 0) !== p) x++; return x; };
  const v = pick(par);
  const alte = [pick(!par), pick(!par), pick(!par)];
  return { cheie: `p${par}${v}:${alte}`, text: `Care număr este ${par ? "par" : "impar"}?`, valoare: s(v), distractori: alte.filter((x, i) => alte.indexOf(x) === i).map((x) => ({ v: s(x), eroare: "altele" as TipEroare })), indiciu: "Uită-te la ultima cifră: 0, 2, 4, 6, 8 → par.", verificare: { tip: "compara", numere: [v, ...alte], valoare: v, mare: par } };
}

function extreme(rng: Rng, niv: NivelC2): Baza | null {
  const max = niv === "usor" ? 100 : 1000;
  const nums = rng.distinct(4, () => rng.int(niv === "usor" ? 10 : 100, max - 1));
  if (nums.length < 4) return null;
  const mare = rng.bool();
  const v = mare ? Math.max(...nums) : Math.min(...nums);
  return { cheie: `e${mare}${[...nums].sort()}`, text: `Cel mai ${mare ? "mare" : "mic"} număr:`, valoare: s(v), distractori: nums.filter((x) => x !== v).map((x) => ({ v: s(x), eroare: "altele" as TipEroare })), indiciu: "Compară întâi sutele, apoi zecile, apoi unitățile.", verificare: { tip: "compara", numere: nums, valoare: v, mare } };
}

function comparare(rng: Rng, niv: NivelC2): Baza | null {
  const max = niv === "usor" ? 100 : 1000;
  const a = rng.int(10, max - 1);
  const b = rng.bool() ? inversat(a) : a + rng.pick([-10, -1, 1, 10]);
  if (b === a || b <= 0 || b >= max) return null;
  const mare = rng.bool();
  const v = mare ? Math.max(a, b) : Math.min(a, b);
  return { cheie: `c${mare}${Math.min(a, b)}:${Math.max(a, b)}`, text: `Mai ${mare ? "mare" : "mic"}: ${a} sau ${b}?`, valoare: s(v), distractori: [{ v: s(mare ? Math.min(a, b) : Math.max(a, b)), eroare: "ordin_gresit" }], indiciu: "Compară cifrele de la stânga la dreapta.", verificare: { tip: "compara", numere: [a, b], valoare: v, mare } };
}

function sir(rng: Rng, niv: NivelC2): Baza | null {
  const pas = rng.pick(niv === "usor" ? [2, 5, 10, -2, -10] : [2, 3, 5, 10, 100, -3, -5, -10]);
  const start = rng.int(pas < 0 ? 60 : 0, niv === "usor" ? 60 : 500);
  const t = [0, 1, 2, 3].map((i) => start + i * pas);
  const v = start + 4 * pas;
  if (Math.min(...t, v) < 0 || v > (niv === "usor" ? 100 : 1000)) return null;
  return { cheie: `s${start}:${pas}`, text: `${t.join(", ")}, … ?`, valoare: s(v), distractori: distractori(rng, s(v), [[v + pas, "altele"], [v - 2 * pas, "altele"], [v + 1, "altele"]]), indiciu: `Cât crește (sau scade) de la un număr la următorul? ${t[1]} − ${t[0]}.`, verificare: egal(pas > 0 ? `${start} + 4 * ${pas}` : `${start} - 4 * ${-pas}`, v) };
}

function descompunere(rng: Rng, niv: NivelC2): Baza {
  const n = rng.int(niv === "usor" ? 11 : 101, niv === "usor" ? 99 : 999);
  const [u, z, su] = cifre(n);
  const parti = [su * 100, z * 10, u].filter(Boolean);
  return { cheie: `dc${n}`, text: `${parti.join(" + ")} =`, st: parti.join(" + "), valoare: s(n), distractori: distractori(rng, s(n), [[inversat(n), "ordin_gresit"], [su + z + u, "altele"]]), indiciu: "Sutele, zecile și unitățile se pun la locul lor.", verificare: egal(parti.join(" + "), n) };
}

const SFERT = [0, 15, 30, 45];
function ceas(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza {
  const pas = niv === "usor" ? Math.max(30, o.timpPas) : o.timpPas;
  const m = rng.pick(SFERT.filter((x) => x % pas === 0));
  const h = rng.int(1, 12);
  const corect = oraInLitere(h, m);
  const cand: [string, TipEroare][] = [];
  if (m === 45) cand.push([`${h} fără un sfert`, "ceas_fara_un_sfert"], [`${h} și un sfert`, "ceas_fara_un_sfert"]);
  // acele inversate: acul lung citit ca oră, cel scurt ca minute
  if ((h % 12) * 5 !== m && SFERT.includes((h % 12) * 5)) cand.push([oraInLitere(m / 5 || 12, (h % 12) * 5), "ceas_ace_inversate"]);
  cand.push([oraInLitere(h % 12 + 1, m), "altele"], [oraInLitere(h, (m + 30) % 60), "altele"], [oraInLitere(h === 1 ? 12 : h - 1, m), "altele"]);
  return {
    cheie: `ce${h}:${m}`, text: "Cât arată ceasul?", st: "ceas", valoare: corect, distractori: distractori(rng, corect, cand, false), vizual: { tip: "ceas", ore: h, minute: m },
    indiciu: "Acul scurt arată ora. Acul lung: sus = fix, jos = jumătate, dreapta = un sfert, stânga = fără un sfert.", verificare: { tip: "ora", ore: h, minute: m, text: corect },
  };
}

function durata(rng: Rng, niv: NivelC2): Baza {
  const a = rng.int(7, 18), d = rng.int(1, niv === "usor" ? 3 : 6);
  return { cheie: `du${a}+${d}`, text: `De la ora ${a} la ora ${a + d} trec … ore`, valoare: s(d), distractori: distractori(rng, s(d), [[a + d, "operatie_inversa"], [d + 1, "altele"]]), indiciu: `Numără orele de la ${a} la ${a + d}.`, verificare: egal(`${a + d} - ${a}`, d) };
}

function calendar(rng: Rng): Baza {
  const t = rng.int(0, 3);
  if (t <= 1) {
    const L = t === 0 ? ZILE : LUNI;
    const i = rng.int(0, L.length - 1), dupa = rng.bool();
    const v = L[(i + (dupa ? 1 : -1) + L.length) % L.length];
    const text = `${t === 0 ? "Ziua" : "Luna"} de ${dupa ? "după" : "dinainte de"} ${L[i]}`;
    return { cheie: `cal${t}${i}${dupa}`, text: `${text}:`, st: text, valoare: v, distractori: distractori(rng, v, [[L[(i + (dupa ? -1 : 1) + L.length) % L.length], "altele"], [L[(i + 2) % L.length], "altele"], [L[i], "altele"]], false), indiciu: `Spune pe rând: ${L.slice(0, 4).join(", ")}…`, verificare: { tip: "text", corect: v, din: L } };
  }
  if (t === 2) {
    const l = rng.pick(LUNI);
    const v = ANOTIMP[l];
    return { cheie: `an${l}`, text: `Luna ${l} este …`, st: `${l} →`, valoare: v, distractori: ["iarna", "primăvara", "vara", "toamna"].filter((x) => x !== v).map((x) => ({ v: x, eroare: "altele" as TipEroare })), indiciu: "Iarna: decembrie–februarie; primăvara: martie–mai; vara: iunie–august; toamna: septembrie–noiembrie.", verificare: { tip: "text", corect: v, din: LUNI } };
  }
  const [txt, v] = rng.pick([["Zile într-o săptămână", 7], ["Luni într-un an", 12], ["Anotimpuri într-un an", 4]] as const);
  return { cheie: `nr${txt}`, text: `${txt}:`, valoare: s(v), distractori: distractori(rng, s(v), [[v === 7 ? 5 : v === 12 ? 10 : 3, "altele"]]), indiciu: "Gândește-te la calendar.", verificare: egal(s(v), v) };
}

function transformari(rng: Rng, niv: NivelC2): Baza {
  const m = rng.int(1, niv === "usor" ? 5 : 9);
  const cm = niv === "usor" ? 0 : rng.pick([0, 0, rng.int(1, 99)]);
  const v = 100 * m + cm;
  const text = cm ? `${m} m ${cm} cm = … cm` : `${m} m = … cm`;
  return { cheie: `mc${m}:${cm}`, text, st: cm ? `${m} m ${cm} cm` : `${m} m`, valoare: s(v), distractori: distractori(rng, s(v), [[10 * m + cm, "unitate_m_cm"], [m + cm, "unitate_m_cm"], [1000 * m + cm, "altele"]]), indiciu: "1 m = 100 cm.", verificare: egal(`${m} * 100 + ${cm}`, v) };
}

function masaLichid(rng: Rng, niv: NivelC2): Baza {
  const u = rng.pick(["kg", "l"]);
  const a = rng.int(2, niv === "usor" ? 20 : 60), b = rng.int(1, niv === "usor" ? 20 : 40);
  const plus = rng.bool() || a <= b;
  const v = plus ? a + b : a - b;
  return { cheie: `ml${u}${a}${plus}${b}`, text: `${a} ${u} ${plus ? "+" : "−"} ${b} ${u} = … ${u}`, valoare: s(v), distractori: distractori(rng, s(v), [[plus ? Math.abs(a - b) : a + b, "operatie_inversa"]]), indiciu: "Calculezi ca la numere; unitatea rămâne aceeași.", verificare: egal(`${a} ${plus ? "+" : "-"} ${b}`, v) };
}

function baniNumara(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza {
  const L = rng.int(1, Math.min(o.baniMax, niv === "usor" ? 10 : 99)), bani = rng.pick([0, 10, 20, 50, 5, 25]);
  const v = 100 * L + bani;
  return { cheie: `bn${L}:${bani}`, text: `${lei(L)}${bani ? ` și ${cu(bani, "ban", "bani")}` : ""} = … bani`, st: `${lei(L)}${bani ? ` și ${cu(bani, "ban", "bani")}` : ""}`, valoare: s(v), distractori: distractori(rng, s(v), [[L + bani, "bani_lei_bani"], [10 * L + bani, "bani_lei_bani"], [L * 1000 + bani, "altele"]]), indiciu: "1 leu = 100 de bani.", verificare: egal(`${L} * 100 + ${bani}`, v) };
}

function baniRest(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza | null {
  const plata = rng.pick([5, 10, 20, 50, 100].filter((x) => x <= Math.max(10, o.baniMax)));
  const pret = rng.int(1, plata - 1);
  const v = plata - pret;
  return { cheie: `br${plata}:${pret}`, text: `Costă ${lei(pret)}. Plătești cu ${lei(plata)}. Rest: … lei`, valoare: s(v), distractori: distractori(rng, s(v), [[plata + pret, "operatie_inversa"], [v + 1, "altele"]]), indiciu: `Restul = cât ai dat − cât costă.`, verificare: egal(`${plata} - ${pret}`, v) };
}

const NUME = ["Ana", "Mihai", "Ioana", "Radu", "Maria", "Andrei", "Elena", "Tudor", "Sofia", "Luca"];
function problema(rng: Rng, niv: NivelC2, doua: boolean): Baza | null {
  const [A, B] = rng.shuffle(NUME);
  const max = niv === "usor" ? 100 : 1000;
  if (!doua) {
    const t = rng.int(0, 3);
    if (t === 0) { const a = rng.int(10, max / 2), d = rng.int(2, max / 4); return { cheie: `pc${a}:${d}`, text: `${A} are ${cu(a, "timbru", "timbre")}. ${B} are cu ${d} mai multe. Câte are ${B}?`, valoare: s(a + d), distractori: distractori(rng, s(a + d), [[Math.abs(a - d), "operatie_inversa"]]), indiciu: "„Cu mai multe” → aduni.", verificare: egal(`${a} + ${d}`, a + d) }; }
    if (t === 1) { const g = rng.int(2, 10), k = rng.int(2, 10); return { cheie: `pg${g}:${k}`, text: `Sunt ${g} cutii cu câte ${cu(k, "creion", "creioane")}. Câte creioane sunt?`, valoare: s(g * k), distractori: distractori(rng, s(g * k), [[g + k, "operatie_inversa"], [g * (k + 1), "tabel_vecin"]]), indiciu: `${g} grupe a câte ${k} → înmulțire.`, verificare: egal(`${g} * ${k}`, g * k) }; }
    if (t === 2) { const c = rng.int(2, 10), k = rng.int(2, 10); return { cheie: `pi${c}:${k}`, text: `${cu(c * k, "măr", "mere")} se pun în ${c} coșuri, în mod egal. Câte mere sunt în fiecare coș?`, valoare: s(k), distractori: distractori(rng, s(k), [[c * k - c, "operatie_inversa"], [k + 1, "tabel_vecin"]]), indiciu: "Împărțim în mod egal → împărțire.", verificare: egal(`${c * k} / ${c}`, k) }; }
    const p = rng.int(1, 9), d = rng.pick([10, 20, 50].filter((x) => x > p));
    return { cheie: `pr${p}:${d}`, text: `Un caiet costă ${lei(p)}. Plătești cu ${lei(d)}. Cât rest primești?`, valoare: s(d - p), distractori: distractori(rng, s(d - p), [[d + p, "operatie_inversa"]]), indiciu: "Restul = cât ai dat − cât costă.", verificare: egal(`${d} - ${p}`, d - p) };
  }
  const a = rng.int(15, Math.min(90, max)), b = rng.int(2, a - 1), c = rng.int(2, 40);
  const v = a - b + c;
  if (v > max) return null;
  return { cheie: `p2${a}:${b}:${c}`, text: `În autobuz sunt ${cu(a, "copil", "copii")}. Coboară ${b}, apoi urcă ${c}. Câți copii sunt acum?`, valoare: s(v), distractori: distractori(rng, s(v), [[a - b, "altele"], [a + b + c, "operatie_inversa"], [a - b - c >= 0 ? a - b - c : v + 10, "operatie_inversa"]]), indiciu: `Întrebarea ajutătoare: câți au rămas după ce au coborât ${b}? (${a} − ${b})`, verificare: egal(`${a} - ${b} + ${c}`, v) };
}

function frParte(rng: Rng, o: OptiuniC2): Baza {
  const den = Number(rng.pick(o.fractii.length ? o.fractii : (["1/2", "1/4"] as const)).split("/")[1]);
  const nume: Record<number, string> = { 2: "o doime (jumătate)", 3: "o treime", 4: "o pătrime (un sfert)" };
  const forma = rng.pick(["cerc", "dreptunghi"] as const);
  const alte = [2, 3, 4].filter((d) => d !== den && (o.fractii.includes(`1/${d}` as "1/2") || d !== 3));
  return {
    cheie: `fp${den}${forma}`, text: "Ce parte este colorată?", st: "desen", valoare: `1/${den}`,
    distractori: [...alte.map((d) => ({ v: `1/${d}`, eroare: "fractie_parti_inegale" as TipEroare })), { v: `${den}/1`, eroare: "altele" as TipEroare }],
    vizual: { tip: "fractie", parti: den, colorate: 1, forma }, indiciu: `Numără părțile egale: sunt ${den}. Una e colorată → ${nume[den]}.`, verificare: { tip: "fractie", num: 1, den },
  };
}

function frDin(rng: Rng, niv: NivelC2, o: OptiuniC2): Baza {
  const den = Number(rng.pick(o.fractii.length ? o.fractii : (["1/2", "1/4"] as const)).split("/")[1]);
  const k = rng.int(1, niv === "usor" ? 5 : 10);
  const n = den * k;
  const cuv: Record<number, string> = { 2: "Jumătate", 3: "O treime", 4: "Un sfert" };
  return { cheie: `fd${den}:${n}`, text: `${cuv[den]} din ${n} =`, st: `${cuv[den].toLowerCase()} din ${n}`, valoare: s(k), distractori: distractori(rng, s(k), [[n * den, "operatie_inversa"], [den === 4 ? n / 2 : n / den + 1, "fractie_parti_inegale"]]), indiciu: `Împarte ${n} în ${den} părți egale.`, verificare: egal(`${n} / ${den}`, k) };
}

function exercitiu(n: NotiuneC2, rng: Rng, niv: NivelC2, o: OptiuniC2): Baza | null {
  switch (n) {
    case "num.formare": return formare(rng, niv);
    case "num.litere": return litere(rng, niv);
    case "num.descompunere": return descompunere(rng, niv);
    case "num.vecini": return vecini(rng, niv);
    case "num.comparare": return comparare(rng, niv);
    case "num.paritate": return paritate(rng, niv);
    case "num.rotunjire": return rotunjire(rng, niv, o);
    case "num.sir": return sir(rng, niv);
    case "num.extreme": return extreme(rng, niv);
    case "op.adunare": return adunare(rng, niv, o);
    case "op.scadere": return scadere(rng, niv, o);
    case "op.termen": return null; // doar ca „căsuțe”
    case "op.tabla": return tabla(rng, niv, o);
    case "op.comutativ": { const t = tabla(rng, niv, o); const [a, b] = t.st!.split(" × "); return { ...t, cheie: `co${t.cheie}`, text: `${b} × ${a} =`, st: `${b} × ${a}` }; }
    case "op.impartire": return impartire(rng, niv, o);
    case "op.dublu": return dublu(rng, niv, o);
    case "op.ordine": return ordine(rng);
    case "pb.una": return problema(rng, niv, false);
    case "pb.doua": return problema(rng, niv, true);
    case "fr.parte": return frParte(rng, o);
    case "fr.din": return frDin(rng, niv, o);
    case "mas.transformari": return transformari(rng, niv);
    case "mas.masa-lichid": return masaLichid(rng, niv);
    case "timp.ceas": return ceas(rng, niv, o);
    case "timp.durata": return durata(rng, niv);
    case "timp.calendar": return calendar(rng);
    case "bani.numara": return baniNumara(rng, niv, o);
    case "bani.rest": return baniRest(rng, niv, o);
  }
}

// ───────────────────────── căsuțele (numărul care lipsește) ─────────────────────────

function casute(n: NotiuneC2, rng: Rng, niv: NivelC2, o: OptiuniC2): BazaCasute | null {
  const max = niv === "usor" ? 100 : 1000;
  switch (n) {
    case "op.termen":
    case "op.adunare":
    case "op.scadere": {
      const toate = n === "op.adunare" ? ["a+x=b", "x+a=b"] : n === "op.scadere" ? ["x-a=b", "a-x=b"] : o.forme.length ? o.forme : ["a+x=b", "x+a=b", "x-a=b", "a-x=b"];
      const forme = toate.filter((f) => !f.includes("b=c"));
      const f = rng.pick(forme.length ? forme : ["a+x=b"]);
      const x = rng.int(1, max / 2), a = rng.int(1, max / 2);
      if (f === "a+x=b" || f === "x+a=b") {
        if (!respecta(trecereAdunare(a, x), modTrecere(o, niv))) return null;
        return f === "a+x=b"
          ? { cheie: `t${f}${a}:${x}`, text: `${a} + □ = ${a + x}`, solutii: [[x]], expr: `${a} + x = ${a + x}`, indiciu: `Ce adaugi la ${a} ca să ajungi la ${a + x}? Scade: ${a + x} − ${a}.` }
          : { cheie: `t${f}${a}:${x}`, text: `□ + ${a} = ${a + x}`, solutii: [[x]], expr: `x + ${a} = ${a + x}`, indiciu: `Termenul necunoscut = suma − termenul cunoscut.` };
      }
      if (f === "x-a=b") return { cheie: `t${f}${a}:${x}`, text: `□ − ${a} = ${x}`, solutii: [[a + x]], expr: `x - ${a} = ${x}`, indiciu: `Descăzutul = diferența + scăzătorul: ${x} + ${a}.` };
      if (x >= a + x) return null;
      return { cheie: `t${f}${a}:${x}`, text: `${a + x} − □ = ${a}`, solutii: [[x]], expr: `${a + x} - x = ${a}`, indiciu: `Scăzătorul = descăzutul − diferența: ${a + x} − ${a}.` };
    }
    case "op.tabla":
    case "op.impartire": {
      const b = rng.pick(masaStr(o.table)), a = rng.int(1, 10);
      if (n === "op.tabla" && niv === "provocare" && rng.bool(0.35)) {
        const c = a * b;
        const sol: number[][] = [];
        for (let i = 1; i <= 10; i++) if (c % i === 0 && c / i <= 10) sol.push([i, c / i]);
        if (sol.length < 2) return null;
        return { cheie: `xx${c}`, text: `□ × □ = ${c}`, solutii: sol, expr: `x * y = ${c}`, indiciu: `Caută două numere din tablă care înmulțite dau ${c}.` };
      }
      if (n === "op.impartire") return { cheie: `di${a * b}:${b}`, text: `${a * b} : □ = ${a}`, solutii: [[b]], expr: `${a * b} / x = ${a}`, indiciu: `Familia de fapte: ${a} × □ = ${a * b}.` };
      return rng.bool()
        ? { cheie: `fx${b}:${a}`, text: `□ × ${b} = ${a * b}`, solutii: [[a]], expr: `x * ${b} = ${a * b}`, indiciu: `Câte grupe de ${b} fac ${a * b}? Gândește-te la ${a * b} : ${b}.` }
        : { cheie: `xf${a}:${b}`, text: `${a} × □ = ${a * b}`, solutii: [[b]], expr: `${a} * x = ${a * b}`, indiciu: `${a * b} : ${a} = ?` };
    }
    case "op.comutativ": { const a = rng.int(2, 10), b = rng.pick(masaStr(o.table)); if (a === b) return null; return { cheie: `cm${a}:${b}`, text: `${a} × ${b} = ${b} × □`, solutii: [[a]], expr: `${a} * ${b} = ${b} * x`, indiciu: "Dacă schimbi ordinea factorilor, produsul rămâne același." }; }
    case "op.dublu": { const d = dublu(rng, niv, o); const v = Number(d.valoare); return { cheie: `cd${d.cheie}`, text: d.text.replace(" =", " = □"), solutii: [[v]], expr: `x = ${(d.verificare as { expr: string }).expr}`, indiciu: d.indiciu }; }
    case "op.ordine": { const d = ordine(rng); if (!d) return null; const nums = d.text.match(/\d+/g)!; const h = rng.int(0, nums.length - 1); let k = -1; const text = `${d.text.replace(/\d+/g, (m) => (++k === h ? "□" : m))} ${d.valoare}`; k = -1; const expr = `${(d.verificare as { expr: string }).expr.replace(/\d+/g, (m) => (++k === h ? "x" : m))} = ${d.valoare}`; if (Number(nums[h]) === 0) return null; return { cheie: `co${expr}`, text, solutii: [[Number(nums[h])]], expr, indiciu: d.indiciu }; }
    case "num.descompunere": { const v = rng.int(niv === "usor" ? 11 : 101, niv === "usor" ? 99 : 999); const p = [Math.floor(v / 100) * 100, Math.floor(v / 10) % 10 * 10, v % 10].filter(Boolean); if (p.length < 2) return null; const h = rng.int(0, p.length - 1); return { cheie: `dc${v}:${h}`, text: `${v} = ${p.map((x, i) => (i === h ? "□" : x)).join(" + ")}`, solutii: [[p[h]]], expr: `${v} = ${p.map((x, i) => (i === h ? "x" : x)).join(" + ")}`, indiciu: "Sute, zeci, unități: fiecare cifră la locul ei." }; }
    case "num.vecini": { const v = rng.int(niv === "usor" ? 2 : 101, niv === "usor" ? 98 : 998); return { cheie: `vc${v}`, text: `□ , ${v} , □`, solutii: [[v - 1, v + 1]], expr: `x = ${v} - 1; y = ${v} + 1`, indiciu: "Vecinii: cu 1 mai mic și cu 1 mai mare." }; }
    case "num.sir": { const d = sir(rng, niv); if (!d) return null; const t = d.text.replace(", … ?", ""); const nums = t.split(", ").map(Number); const pas = nums[1] - nums[0]; const h = rng.int(1, 3); return { cheie: `si${t}:${h}`, text: nums.map((x, i) => (i === h ? "□" : x)).join(", ") + `, ${nums[3] + pas}`, solutii: [[nums[h]]], expr: pas > 0 ? `x = ${nums[0]} + ${h} * ${pas}` : `x = ${nums[0]} - ${h} * ${-pas}`, indiciu: d.indiciu }; }
    case "fr.din": { const d = frDin(rng, niv, o); return { cheie: `cf${d.cheie}`, text: d.text.replace(" =", " = □"), solutii: [[Number(d.valoare)]], expr: `x = ${(d.verificare as { expr: string }).expr}`, indiciu: d.indiciu }; }
    case "mas.transformari": { const m = rng.int(1, niv === "usor" ? 5 : 9); return { cheie: `cm${m}`, text: `□ cm = ${m} m`, solutii: [[100 * m]], expr: `x = ${m} * 100`, indiciu: "1 m = 100 cm." }; }
    case "timp.durata": { const d = durata(rng, niv); return { cheie: `cd${d.cheie}`, text: d.text.replace("…", "□"), solutii: [[Number(d.valoare)]], expr: `x = ${(d.verificare as { expr: string }).expr}`, indiciu: d.indiciu }; }
    case "bani.numara": { const l = rng.int(1, Math.min(o.baniMax, 9)); return { cheie: `cb${l}`, text: `□ bani = ${lei(l)}`, solutii: [[100 * l]], expr: `x = ${l} * 100`, indiciu: "1 leu = 100 de bani." }; }
    case "bani.rest": { const d = baniRest(rng, niv, o); if (!d) return null; return { cheie: `cr${d.cheie}`, text: d.text.replace("…", "□"), solutii: [[Number(d.valoare)]], expr: `x = ${(d.verificare as { expr: string }).expr}`, indiciu: d.indiciu }; }
    case "pb.una": { const d = problema(rng, niv, false); if (!d) return null; return { cheie: `cp${d.cheie}`, text: `${d.text} □`, solutii: [[Number(d.valoare)]], expr: `x = ${(d.verificare as { expr: string }).expr}`, indiciu: d.indiciu }; }
    default: return null;
  }
}

// ───────────────────────── sesiunea ─────────────────────────

const afisSolutii = (sol: number[][]) => sol.map((x) => x.join(" și ")).join(" / ");

function itemNou(rng: Rng, n: NotiuneC2, joc: JocC2, niv: NivelC2, o: OptiuniC2): Omit<ItemC2, "id"> | null {
  if (joc === "casute") {
    const c = casute(n, rng, niv, o);
    if (!c) return null;
    return {
      cheie: `c:${c.cheie}`, notiune: n, nivel: niv, text: c.text, raspuns: { tip: "casute", solutii: c.solutii },
      afis: afisSolutii(c.solutii), distractori: [], indiciu: c.indiciu, verificare: { tip: "ecuatie", expr: c.expr, solutii: c.solutii }, vizual: c.vizual,
    };
  }
  const b = exercitiu(n, rng, niv, o);
  if (!b) return null;
  if (joc === "perechi" && !b.st) return null;
  if ((joc === "bule" || joc === "scara") && b.distractori.length < 1) return null;
  return {
    cheie: `${joc === "perechi" ? "p" : "e"}:${b.cheie}`, notiune: n, nivel: niv, text: b.text, st: b.st, vizual: b.vizual,
    raspuns: joc === "perechi" ? { tip: "pereche" } : { tip: "valoare", valoare: b.valoare },
    afis: b.valoare, distractori: b.distractori.slice(0, 4), indiciu: b.indiciu, verificare: b.verificare,
  };
}

export interface SesiuneC2 { itemi: ItemC2[]; avertismente: string[]; notiuni: NotiuneC2[] }

/** Exercițiile unei sesiuni (joc sau fișă), deterministe: același cod + nivel → aceleași exerciții. */
export function genereazaC2(cfg: ConfigC2, nivel?: NivelC2): SesiuneC2 {
  const niv: NivelC2 = nivel ?? (cfg.nivel === "alege" ? "mediu" : cfg.nivel);
  const notiuni = cfg.notiuni.filter((n) => COMPATIBIL[cfg.joc].includes(n));
  const avertismente: string[] = [];
  const excluse = cfg.notiuni.filter((n) => !notiuni.includes(n));
  if (excluse.length) avertismente.push(`${excluse.length} noțiuni nu se potrivesc cu acest joc și au fost lăsate deoparte.`);
  if (!notiuni.length) return { itemi: [], avertismente: ["Alege cel puțin o noțiune potrivită pentru acest joc."], notiuni };
  const ordine = new Rng(hash(cfg.seed, 41)).shuffle(notiuni);
  const itemi: ItemC2[] = [];
  const vazute = new Set<string>();
  let duplicate = 0;
  const N = Math.max(1, Math.min(100, Math.floor(cfg.nr)));
  const salt = { usor: 1, mediu: 2, provocare: 3 }[niv];
  for (let i = 0; i < N; i++) {
    const baza = hash(cfg.seed, i, salt, cfg.inlocuiri?.[`i${i}`] ?? 0);
    let ales: Omit<ItemC2, "id"> | null = null, rezerva: Omit<ItemC2, "id"> | null = null;
    for (let k = 0; k < 400 && !ales; k++) {
      const n = ordine[(i + Math.floor(k / 60)) % ordine.length];
      const e = itemNou(new Rng(hash(baza, k)), n, cfg.joc, niv, cfg.optiuni);
      if (!e) continue;
      // la Perechi, nici fețele nu se repetă (altfel un cartonaș s-ar potrivi cu două)
      const chei = [e.cheie, ...(cfg.joc === "perechi" ? [`st:${e.st}${e.vizual ? JSON.stringify(e.vizual) : ""}`, `dr:${e.afis}`] : [])];
      if (chei.every((c) => !vazute.has(c))) { ales = e; chei.forEach((c) => vazute.add(c)); }
      else rezerva ??= e;
    }
    const e = ales ?? rezerva;
    if (!e) continue;
    if (!ales) duplicate++;
    vazute.add(e.cheie);
    itemi.push({ ...e, id: `i${i}` });
  }
  if (duplicate) avertismente.push(`${duplicate} exerciții se repetă: alege mai multe noțiuni sau alt nivel.`);
  if (itemi.length < N) avertismente.push(`Am putut genera doar ${itemi.length} din ${N} exerciții.`);
  return { itemi, avertismente, notiuni };
}

// ───────────────────────── verificare ─────────────────────────

const intreg = (t: string) => { const x = String(t ?? "").replace(/\s/g, ""); return /^\d+$/.test(x) ? Number(x) : NaN; };

/** Răspunsul elevului: valoare („245”, „marți”, „1/2”), căsuțe „3|4”, pereche „ok”. */
export function verificaC2(it: Pick<ItemC2, "raspuns">, dat: string): boolean {
  const r = it.raspuns;
  if (r.tip === "pereche") return dat === "ok";
  if (r.tip === "valoare") return /^\d+$/.test(r.valoare) ? intreg(dat) === Number(r.valoare) : String(dat).trim() === r.valoare;
  const v = String(dat).split("|").map(intreg);
  return r.solutii.some((sol) => sol.length === v.length && sol.every((x, i) => x === v[i]));
}

/** Ce greșeală tipică a făcut elevul (după variantele etichetate ale itemului). */
export function clasificaEroare(it: Pick<ItemC2, "distractori">, dat: string | null): TipEroare {
  if (dat === null) return "timp_expirat";
  const d = it.distractori.find((x) => x.v === String(dat).trim() || (/^\d+$/.test(x.v) && intreg(dat) === Number(x.v)));
  return d?.eroare ?? "altele";
}
