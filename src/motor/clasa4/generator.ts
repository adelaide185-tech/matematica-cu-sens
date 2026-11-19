import { Rng } from "@/motor/rng";
import { fmt, hash } from "@/motor/calcul/generator";
import { cereDe, cuSubstantiv } from "@/motor/limba";
import { roman } from "@/motor/generatoare/fractii-masuri";
import type { FelItem, RaspunsC3 } from "@/motor/clasa3/tipuri";
import { verificaC3 } from "@/motor/clasa3/generator";
import { NUME_CAPITOL_C4, type CapitolC4, type ConfigC4, type Corp, type Desen, type FormaPlana, type ItemC4, type JocC4, type Verificare } from "./tipuri";

/** Item în lucru: `fata` = forma scurtă pentru cartonașele de la Memory. */
type Nou = Omit<ItemC4, "id"> & { fata?: string };
type N = 1 | 2;

// ───────────────────────── utilitare ─────────────────────────

function variante(rng: Rng, corect: string, gresite: string[], n = 4): string[] {
  const v = [corect];
  for (const g of rng.shuffle(gresite)) if (!v.includes(g) && v.length < n) v.push(g);
  return rng.shuffle(v);
}

function numeric(capitol: CapitolC4, nivel: N, cheie: string, text: string, expr: string, valoare: number, indiciu: string, rezolvare: string[], extra: Partial<Nou> = {}): Nou {
  return {
    cheie: `${capitol}:${cheie}`, capitol, nivel, fel: "exercitiu", text, raspuns: { tip: "numar", valoare }, afis: fmt(valoare),
    indiciu, rezolvare, verificare: { tip: "egal", expr, valoare }, ...extra,
  };
}

function cuVariante(capitol: CapitolC4, nivel: N, cheie: string, text: string, corect: string, gresite: string[], rng: Rng, verificare: Verificare, indiciu: string, rezolvare: string[], extra: Partial<Nou> = {}): Nou {
  return {
    cheie: `${capitol}:${cheie}`, capitol, nivel, fel: "exercitiu", text, raspuns: { tip: "varianta", valoare: corect, variante: variante(rng, corect, gresite) },
    afis: corect, indiciu, rezolvare, verificare, ...extra,
  };
}

/** „15 nuci”, „93 de nuci” */
const de = (n: number, ce: string) => `${fmt(n)} ${cereDe(n) ? "de " : ""}${ce}`;
const semn = (a: number, b: number): "<" | ">" | "=" => (a < b ? "<" : a > b ? ">" : "=");
const SEMNE = ["<", "=", ">"];
const ora = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
/** rotunjire la `la` (5 se rotunjește în sus) */
export const rotunjeste = (n: number, la: number) => Math.floor((n + la / 2) / la) * la;
const NUME_LA: Record<number, string> = { 10: "zeci", 100: "sute", 1000: "mii" };

const NUME = ["Ana", "Mihai", "Ioana", "Radu", "Maria", "Andrei", "Elena", "Tudor", "Sofia", "Luca", "Daria", "Matei", "Irina", "Vlad"];
const doiCopii = (rng: Rng) => { const [a, b] = rng.shuffle(NUME); return [a, b] as const; };

// ───────────────────────── unități de măsură ─────────────────────────

type CapUnitati = "lungime" | "capacitate" | "masa";
/** unitatea și valoarea ei în cea mai mică unitate */
const UNITATI: Record<CapUnitati, [string, number][]> = {
  lungime: [["km", 1e6], ["hm", 1e5], ["dam", 1e4], ["m", 1e3], ["dm", 100], ["cm", 10], ["mm", 1]],
  capacitate: [["kl", 1e6], ["hl", 1e5], ["dal", 1e4], ["l", 1e3], ["dl", 100], ["cl", 10], ["ml", 1]],
  masa: [["t", 1e9], ["q", 1e8], ["kg", 1e6], ["hg", 1e5], ["dag", 1e4], ["g", 1e3], ["dg", 100], ["cg", 10], ["mg", 1]],
};
const PRINCIPALE: Record<CapUnitati, [string, string][]> = {
  lungime: [["km", "m"], ["m", "dm"], ["m", "cm"], ["m", "mm"], ["dm", "cm"], ["cm", "mm"], ["hm", "m"], ["dam", "m"]],
  capacitate: [["l", "ml"], ["l", "dl"], ["l", "cl"], ["dl", "ml"], ["hl", "l"], ["dal", "l"], ["kl", "l"]],
  masa: [["kg", "g"], ["t", "kg"], ["q", "kg"], ["g", "mg"], ["kg", "dag"], ["hg", "g"], ["dag", "g"]],
};
const SCARA: Record<CapUnitati, string> = {
  lungime: "km → hm → dam → m → dm → cm → mm: fiecare unitate este de 10 ori mai mare decât următoarea.",
  capacitate: "kl → hl → dal → l → dl → cl → ml: fiecare unitate este de 10 ori mai mare decât următoarea.",
  masa: "t → q → kg → hg → dag → g → dg → cg → mg: 1 t = 10 q, 1 q = 100 kg, apoi fiecare unitate este de 10 ori mai mare decât următoarea.",
};
const fu = (cap: CapUnitati, u: string) => UNITATI[cap].find(([x]) => x === u)![1];
const raport = (cap: CapUnitati, mare: string, mic: string) => fu(cap, mare) / fu(cap, mic);

/** perechi (mare, mic) cu raport ≤ max */
function perecheUnitati(rng: Rng, cap: CapUnitati, nivel: N, max = 1000): [string, string, number] {
  if (nivel === 1) {
    const [a, b] = rng.pick(PRINCIPALE[cap]);
    return [a, b, raport(cap, a, b)];
  }
  const u = UNITATI[cap];
  for (;;) {
    const i = rng.int(0, u.length - 2), j = rng.int(i + 1, u.length - 1);
    const r = u[i][1] / u[j][1];
    if (r <= max) return [u[i][0], u[j][0], r];
  }
}

function exUnitati(rng: Rng, cap: CapUnitati, nivel: N): Nou | null {
  const [mare, mic, r] = perecheUnitati(rng, cap, nivel);
  const ind = SCARA[cap];
  const tip = nivel === 1 ? rng.int(0, 2) : rng.int(0, 4);
  if (tip === 0 || tip === 1) {
    // mare → mic
    const A = nivel === 1 ? rng.int(2, r >= 1000 ? 9 : 25) : rng.int(2, r >= 1000 ? 99 : 400);
    const v = A * r;
    if (v > 1_000_000) return null;
    return numeric(cap, nivel, `${A}${mare}>${mic}`, `${A} ${mare} = □ ${mic}`, `${A} * ${r}`, v, ind,
      [`1 ${mare} = ${fmt(r)} ${mic}`, `${A} ${mare} = ${A} × ${fmt(r)} ${mic} = ${fmt(v)} ${mic}`], { afis: `□ = ${fmt(v)}`, fata: `${A} ${mare}` });
  }
  if (tip === 2) {
    // mic → mare (exact)
    const A = rng.int(2, nivel === 1 ? 9 : 60);
    const v = A * r;
    if (v > 1_000_000) return null;
    return numeric(cap, nivel, `${v}${mic}>${mare}`, `${fmt(v)} ${mic} = □ ${mare}`, `${v} / ${r}`, A, ind,
      [`1 ${mare} = ${fmt(r)} ${mic}`, `${fmt(v)} ${mic} = ${fmt(v)} : ${fmt(r)} ${mare} = ${A} ${mare}`], { afis: `□ = ${A}`, fata: `${fmt(v)} ${mic}` });
  }
  if (tip === 3) {
    // compus: A mare B mic = □ mic
    const A = rng.int(1, 9), B = rng.int(1, r - 1);
    const v = A * r + B;
    return numeric(cap, nivel, `${A}${mare}${B}${mic}`, `${A} ${mare} ${B} ${mic} = □ ${mic}`, `${A} * ${r} + ${B}`, v, ind,
      [`1 ${mare} = ${fmt(r)} ${mic}`, `${A} ${mare} = ${fmt(A * r)} ${mic}`, `${fmt(A * r)} ${mic} + ${B} ${mic} = ${fmt(v)} ${mic}`], { afis: `□ = ${fmt(v)}`, fata: `${A} ${mare} ${B} ${mic}` });
  }
  // problemă cu transformare
  const ctx = {
    lungime: () => {
      const L = rng.int(2, 9), b = rng.pick([20, 25, 50]);
      return numeric(cap, 2, `sfoara${L}:${b}`, `O sfoară de ${L} m se taie în bucăți de câte ${b} cm. Câte bucăți se obțin?`, `${L} * 100 / ${b}`, (L * 100) / b, ind,
        [`${L} m = ${L * 100} cm`, `${L * 100} cm : ${b} cm = ${(L * 100) / b} bucăți`]);
    },
    capacitate: () => {
      const L = rng.int(1, 6), p = rng.pick([200, 250, 500]);
      return numeric(cap, 2, `pahare${L}:${p}`, `Câte pahare de câte ${p} ml se pot umple cu ${L} l de suc?`, `${L} * 1000 / ${p}`, (L * 1000) / p, ind,
        [`${L} l = ${fmt(L * 1000)} ml`, `${fmt(L * 1000)} ml : ${p} ml = ${(L * 1000) / p} pahare`]);
    },
    masa: () => {
      const n = rng.int(3, 12), g = rng.pick([250, 500, 200]);
      const v = n * g;
      if (v % 1000 === 0) return numeric(cap, 2, `pachete${n}:${g}`, `Un pachet de unt are ${g} g. Câte kilograme au ${n} pachete?`, `${n} * ${g} / 1000`, v / 1000, ind,
        [`${n} × ${g} g = ${fmt(v)} g`, `${fmt(v)} g = ${v / 1000} kg (1 kg = 1 000 g)`]);
      return numeric(cap, 2, `pachete${n}:${g}g`, `Un pachet de unt are ${g} g. Câte grame au ${n} pachete?`, `${n} * ${g}`, v, ind, [`${n} × ${g} g = ${fmt(v)} g`]);
    },
  };
  return ctx[cap]();
}

/** o mărime compusă (text, expresie în cea mai mică unitate dintre cele două) */
function compUnitati(rng: Rng, cap: CapUnitati, nivel: N) {
  const [mare, mic, r] = perecheUnitati(rng, cap, nivel, nivel === 1 ? 1000 : 1000);
  const A = rng.int(1, 9), B = rng.int(0, Math.min(r - 1, 999));
  const val = A * r + B;
  return { mare, mic, r, A, B, val, text: B ? `${A} ${mare} ${B} ${mic}` : `${A} ${mare}`, expr: B ? `${A} * ${r} + ${B}` : `${A} * ${r}` };
}

function comparaUnitati(rng: Rng, cap: CapUnitati, nivel: N): Nou {
  const m = compUnitati(rng, cap, nivel);
  const delta = rng.pick([0, 0, 1, -1, m.r / 10, -m.r / 10, 9, -9].filter(Number.isInteger));
  const v2 = Math.max(1, m.val + delta);
  const s = semn(m.val, v2);
  const textSt = m.text, textDr = `${fmt(v2)} ${m.mic}`;
  return {
    cheie: `${cap}:cmp${m.text}|${v2}`, capitol: cap, nivel, fel: "comparatie", text: `${textSt} ○ ${textDr}`,
    st: { text: textSt }, dr: { text: textDr },
    raspuns: { tip: "varianta", valoare: s, variante: SEMNE }, afis: s,
    indiciu: "Transformă ambele mărimi în aceeași unitate (cea mai mică), apoi compară numerele.",
    rezolvare: [`${m.text} = ${fmt(m.val)} ${m.mic}`, `${fmt(m.val)} ${m.mic} ${s} ${fmt(v2)} ${m.mic}`],
    verificare: { tip: "comparatie", st: m.expr, dr: String(v2), semn: s },
  };
}

function lipsaUnitati(rng: Rng, cap: CapUnitati, nivel: N): Nou {
  const [mare, mic, r] = perecheUnitati(rng, cap, nivel);
  const A = rng.int(1, 9), B = rng.int(1, r - 1);
  const total = A * r + B;
  return numeric(cap, nivel, `lip${A}${mare}${B}${mic}`, `${A} ${mare} □ ${mic} = ${fmt(total)} ${mic}`, `${total} - ${A} * ${r}`, B, SCARA[cap],
    [`${A} ${mare} = ${fmt(A * r)} ${mic}`, `□ = ${fmt(total)} − ${fmt(A * r)} = ${fmt(B)} ${mic}`], { afis: `□ = ${fmt(B)}`, fel: "lipsa" });
}

// ───────────────────────── timpul ─────────────────────────

type Ut = [string, string, string, string, number]; // mare (sg, pl), mic (sg, pl), raport
const TIMP_1: Ut[] = [
  ["oră", "ore", "minut", "minute", 60], ["minut", "minute", "secundă", "secunde", 60], ["zi", "zile", "oră", "ore", 24],
  ["săptămână", "săptămâni", "zi", "zile", 7], ["an", "ani", "lună", "luni", 12], ["secol", "secole", "an", "ani", 100],
  ["deceniu", "decenii", "an", "ani", 10], ["mileniu", "milenii", "an", "ani", 1000], ["mileniu", "milenii", "secol", "secole", 10], ["secol", "secole", "deceniu", "decenii", 10],
];
const TIMP_2: Ut[] = [...TIMP_1, ["oră", "ore", "secundă", "secunde", 3600], ["zi", "zile", "minut", "minute", 1440]];
const IND_TIMP = "1 oră = 60 de minute, 1 minut = 60 de secunde, 1 zi = 24 de ore, 1 săptămână = 7 zile, 1 an = 12 luni, 1 deceniu = 10 ani, 1 secol = 100 de ani, 1 mileniu = 1 000 de ani.";
const cs = (n: number, sg: string, pl: string) => cuSubstantiv(n, sg, pl).replace(/^\d+/, (x) => fmt(Number(x)));

function exTimp(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 2) : rng.int(0, 4);
  if (tip === 2) return secol(rng, nivel);
  const u = rng.pick(nivel === 1 ? TIMP_1 : TIMP_2);
  const [ms, mp, ns, np, r] = u;
  if (tip === 0) {
    const A = rng.int(2, nivel === 1 ? (r >= 100 ? 5 : 9) : r >= 1000 ? 9 : 20);
    const v = A * r;
    return numeric("timp", nivel, `t${A}${ms}>${ns}`, `${cs(A, ms, mp)} = □ ${np}`, `${A} * ${r}`, v, IND_TIMP,
      [`1 ${ms} = ${cs(r, ns, np)}`, `${cs(A, ms, mp)} = ${A} × ${fmt(r)} = ${cs(v, ns, np)}`], { afis: `□ = ${fmt(v)}`, fata: cs(A, ms, mp) });
  }
  if (tip === 1) {
    const A = rng.int(2, 9);
    const v = A * r;
    return numeric("timp", nivel, `t${v}${ns}>${ms}`, `${cs(v, ns, np)} = □ ${mp}`, `${v} / ${r}`, A, IND_TIMP,
      [`1 ${ms} = ${cs(r, ns, np)}`, `${fmt(v)} : ${fmt(r)} = ${A}, deci ${cs(A, ms, mp)}`], { afis: `□ = ${A}`, fata: cs(v, ns, np) });
  }
  if (tip === 3) {
    // compus
    const [ms2, mp2, ns2, np2, r2] = rng.pick(TIMP_1.filter((x) => x[4] <= 60));
    const A = rng.int(1, 5), B = rng.int(1, r2 - 1);
    const v = A * r2 + B;
    return numeric("timp", 2, `tc${A}${ms2}${B}`, `${cs(A, ms2, mp2)} și ${cs(B, ns2, np2)} = □ ${np2}`, `${A} * ${r2} + ${B}`, v, IND_TIMP,
      [`${cs(A, ms2, mp2)} = ${A} × ${r2} = ${cs(A * r2, ns2, np2)}`, `${fmt(A * r2)} + ${B} = ${cs(v, ns2, np2)}`], { afis: `□ = ${fmt(v)}`, fata: `${cs(A, ms2, mp2)} ${cs(B, ns2, np2)}` });
  }
  // durată între două ore
  const start = rng.int(7 * 12, 19 * 12) * 5, d = rng.int(5, 30) * 5;
  const end = start + d;
  if (Math.floor(end / 60) === Math.floor(start / 60) || end >= 24 * 60) return null;
  const pana = 60 - (start % 60);
  const oreIntregi = Math.floor(end / 60) - Math.floor(start / 60) - 1;
  const rest = end % 60;
  const pasi = [`De la ${ora(start)} la ${ora(start + pana)}: ${cs(pana, "minut", "minute")}`];
  if (oreIntregi) pasi.push(`De la ${ora(start + pana)} la ${ora(start + pana + oreIntregi * 60)}: ${cs(oreIntregi * 60, "minut", "minute")}`);
  if (rest) pasi.push(`De la ${ora(end - rest)} la ${ora(end)}: ${cs(rest, "minut", "minute")}`);
  pasi.push(`Total: ${[pana, oreIntregi * 60, rest].filter(Boolean).join(" + ")} = ${cs(d, "minut", "minute")}`);
  const ce = rng.pick(["Un film", "Un spectacol", "O excursie", "Un meci", "Un concurs"]);
  return numeric("timp", 2, `dur${start}:${d}`, `${ce} începe la ora ${ora(start)} și se termină la ora ${ora(end)}. Câte minute durează?`,
    `(${Math.floor(end / 60)} * 60 + ${end % 60}) - (${Math.floor(start / 60)} * 60 + ${start % 60})`, d,
    "Numără întâi minutele până la ora fixă următoare, apoi orele întregi, apoi minutele rămase.", pasi, { fata: `${ora(start)} → ${ora(end)} (minute)` });
}

const numeSecol = (s: number) => (s === 1 ? "I" : `al ${roman(s)}-lea`);
function secol(rng: Rng, nivel: N): Nou {
  const an = nivel === 1 ? rng.int(1500, 2026) : rng.int(101, 2026);
  const s = Math.floor((an - 1) / 100) + 1;
  const gresite = [s - 1, s + 1, s - 2].filter((x) => x >= 1).map(numeSecol);
  return cuVariante("timp", nivel, `sec${an}`, `Anul ${an} face parte din secolul:`, numeSecol(s), gresite, rng, { tip: "secol", an, valoare: s },
    "Secolul I: anii 1 – 100, secolul al II-lea: anii 101 – 200 … Anul 1900 este ultimul an din secolul al XIX-lea.",
    [`Secolul n cuprinde anii de la (n − 1) × 100 + 1 până la n × 100.`, `Anii ${(s - 1) * 100 + 1} – ${s * 100} formează secolul ${numeSecol(s)}.`, `Deci anul ${an} este în secolul ${numeSecol(s)} (${s}).`],
    { fata: `Anul ${an} – secolul` });
}

function comparaTimp(rng: Rng, nivel: N): Nou {
  const [ms, mp, ns, np, r] = rng.pick(TIMP_1.filter((x) => x[4] <= 100));
  const A = rng.int(1, 4), B = rng.int(0, r - 1);
  const v = A * r + B;
  const v2 = Math.max(1, v + rng.pick([0, 0, 5, -5, 10, -10, r, -r]));
  const s = semn(v, v2);
  const st = B ? `${cs(A, ms, mp)} ${cs(B, ns, np)}` : cs(A, ms, mp);
  const dr = cs(v2, ns, np);
  return {
    cheie: `timp:cmp${st}|${v2}`, capitol: "timp", nivel, fel: "comparatie", text: `${st} ○ ${dr}`, st: { text: st }, dr: { text: dr },
    raspuns: { tip: "varianta", valoare: s, variante: SEMNE }, afis: s, indiciu: IND_TIMP,
    rezolvare: [`${st} = ${cs(v, ns, np)}`, `${fmt(v)} ${s} ${fmt(v2)}`], verificare: { tip: "comparatie", st: `${A} * ${r} + ${B}`, dr: String(v2), semn: s },
  };
}

// ───────────────────────── 1. geometrie ─────────────────────────

const NUME_PLANA: Record<FormaPlana, string> = {
  patrat: "pătrat", dreptunghi: "dreptunghi", triunghi: "triunghi", romb: "romb", paralelogram: "paralelogram", trapez: "trapez", cerc: "cerc", pentagon: "pentagon", hexagon: "hexagon",
};
const LATURI_PLANA: Partial<Record<FormaPlana, number>> = { patrat: 4, dreptunghi: 4, triunghi: 3, romb: 4, paralelogram: 4, trapez: 4, pentagon: 5, hexagon: 6 };

function exGeometrie(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 3) : rng.int(0, 4);
  if (nivel === 1 && tip === 0) {
    const rel = rng.pick(["paralele", "perpendiculare", "concurente"] as const);
    const unghi = rel === "paralele" ? 0 : rel === "perpendiculare" ? 90 : rng.pick([35, 50, 60, 120, 140]);
    const rot = rng.int(0, 5) * 15;
    return cuVariante("geometrie", 1, `dr${rel}${unghi}${rot}`, "Cum sunt cele două drepte din desen?", rel, ["paralele", "perpendiculare", "concurente"], rng,
      { tip: "fapt", categorie: "drepte", cheie: String(unghi), proprietate: "relatie", valoare: rel },
      "Paralele: nu se întâlnesc niciodată. Perpendiculare: se taie și formează unghiuri drepte. Concurente: se taie, dar nu în unghi drept.",
      [rel === "paralele" ? "Dreptele nu se intersectează, oricât le-am prelungi." : rel === "perpendiculare" ? "Dreptele se intersectează și formează 4 unghiuri drepte (verifici cu echerul)." : "Dreptele se intersectează, dar unghiul nu este drept.", `Deci dreptele sunt ${rel}.`],
      { desen: { tip: "drepte", rel, unghi, rot } });
  }
  if (nivel === 1 && tip === 1) {
    const f = rng.pick(Object.keys(NUME_PLANA) as FormaPlana[]);
    return cuVariante("geometrie", 1, `nume${f}`, "Cum se numește figura geometrică din desen?", NUME_PLANA[f], Object.values(NUME_PLANA).filter((x) => x !== NUME_PLANA[f]), rng,
      { tip: "fapt", categorie: "plana", cheie: f, proprietate: "nume", valoare: NUME_PLANA[f] },
      "Numără laturile și uită-te dacă sunt egale, paralele sau dacă formează unghiuri drepte.",
      [descriePlana(f), `Figura este ${NUME_PLANA[f]}.`], { desen: { tip: "plana", forma: f } });
  }
  if (nivel === 1 && tip === 2) {
    const f = rng.pick((Object.keys(LATURI_PLANA) as FormaPlana[]));
    const n = LATURI_PLANA[f]!;
    const ce = rng.pick(["laturi", "vârfuri", "unghiuri"]);
    return numeric("geometrie", 1, `lat${f}${ce}`, `Câte ${ce} are un ${NUME_PLANA[f]}?`, String(n), n, "Un poligon are tot atâtea laturi, vârfuri și unghiuri.",
      [descriePlana(f), `Un ${NUME_PLANA[f]} are ${n} ${ce}.`], { verificare: { tip: "fapt", categorie: "plana", cheie: f, proprietate: "laturi", valoare: n }, fata: `${ce} – ${NUME_PLANA[f]}` });
  }
  if (tip === 3 || (nivel === 2 && tip === 0)) return perimetru(rng, nivel);
  // nivel 2: latură necunoscută din perimetru
  const t = rng.int(0, 3);
  if (t === 0) {
    const L = rng.int(6, 40), l = rng.int(2, L - 1), P = 2 * (L + l);
    return {
      ...numeric("geometrie", 2, `latL${P}:${L}`, `Un dreptunghi are perimetrul de ${P} cm și lungimea de ${L} cm. Câți centimetri are lățimea?`, `(${P} - 2 * ${L}) / 2`, l,
        "P = L + l + L + l. Scade cele două lungimi, apoi împarte la 2.",
        [`P = 2 × L + 2 × l`, `2 × l = ${P} − 2 × ${L} = ${P - 2 * L} cm`, `l = ${P - 2 * L} : 2 = ${l} cm`]),
      verificare: { tip: "sistem", ecuatii: [`2*${L} + 2*l = ${P}`], necunoscute: ["l"], cere: "l", valoare: l },
      fata: `Dreptunghi: P = ${P} cm, L = ${L} cm, l = ?`,
    };
  }
  if (t === 1) {
    const f = rng.pick(["patrat", "romb"] as const), l = rng.int(3, 60), P = 4 * l;
    return {
      ...numeric("geometrie", 2, `lat${f}${P}`, `Un ${NUME_PLANA[f]} are perimetrul de ${P} cm. Cât măsoară latura lui?`, `${P} / 4`, l,
        `${f === "patrat" ? "Pătratul" : "Rombul"} are 4 laturi egale.`, [`P = 4 × latura`, `latura = ${P} : 4 = ${l} cm`]),
      verificare: { tip: "sistem", ecuatii: [`4*l = ${P}`], necunoscute: ["l"], cere: "l", valoare: l },
      fata: `${NUME_PLANA[f]}: P = ${P} cm, latura = ?`,
    };
  }
  if (t === 2) {
    // perimetrul în unități diferite
    const L = rng.int(1, 4), cm = rng.int(1, 9) * 10, l = rng.int(20, 90);
    const Lcm = L * 100 + cm;
    if (l >= Lcm) return null;
    const P = 2 * (Lcm + l);
    return numeric("geometrie", 2, `gard${L}:${cm}:${l}`, `O grădină dreptunghiulară are lungimea de ${L} m ${cm} cm și lățimea de ${l} cm. Ce perimetru are grădina, în centimetri?`,
      `2 * (${L} * 100 + ${cm} + ${l})`, P, "Transformă întâi lungimea în centimetri, apoi aplică P = 2 × (L + l).",
      [`${L} m ${cm} cm = ${Lcm} cm`, `P = 2 × (${Lcm} + ${l}) = 2 × ${Lcm + l} = ${fmt(P)} cm`]);
  }
  // paralelogram / triunghi echilateral
  if (rng.bool()) {
    const a = rng.int(5, 40), b = rng.int(3, a), P = 2 * (a + b);
    return numeric("geometrie", 2, `para${a}:${b}`, `Un paralelogram are laturile de ${a} cm și ${b} cm. Ce perimetru are?`, `2 * (${a} + ${b})`, P,
      "La paralelogram, laturile opuse sunt egale.", [`Laturile opuse sunt egale: ${a}, ${b}, ${a}, ${b} cm.`, `P = 2 × (${a} + ${b}) = ${P} cm`],
      { desen: { tip: "plana", forma: "paralelogram", etichete: [`${a} cm`, `${b} cm`] }, verificare: { tip: "perimetru", laturi: [a, b, a, b], valoare: P }, fata: `P paralelogram ${a} cm, ${b} cm` });
  }
  const a = rng.int(4, 50), P = 3 * a;
  return numeric("geometrie", 2, `echi${a}`, `Un triunghi are toate laturile egale, de câte ${a} cm. Ce perimetru are?`, `3 * ${a}`, P,
    "Triunghiul echilateral are 3 laturi egale.", [`P = ${a} + ${a} + ${a} = 3 × ${a} = ${P} cm`], { verificare: { tip: "perimetru", laturi: [a, a, a], valoare: P }, fata: `P triunghi echilateral, l = ${a} cm` });
}

function descriePlana(f: FormaPlana): string {
  return {
    patrat: "4 laturi egale și 4 unghiuri drepte.", dreptunghi: "4 laturi, cele opuse egale, și 4 unghiuri drepte.", triunghi: "3 laturi și 3 vârfuri.",
    romb: "4 laturi egale, dar unghiurile nu sunt drepte.", paralelogram: "4 laturi, cele opuse paralele și egale.", trapez: "4 laturi, două dintre ele paralele (bazele).",
    cerc: "o linie curbă închisă, toate punctele la aceeași distanță de centru.", pentagon: "5 laturi și 5 vârfuri.", hexagon: "6 laturi și 6 vârfuri.",
  }[f];
}

function perimetru(rng: Rng, nivel: N): Nou {
  const t = rng.int(0, 2);
  const max = nivel === 1 ? 12 : 60;
  if (t === 0) {
    const L = rng.int(3, max), l = rng.int(1, L - 1);
    return numeric("geometrie", nivel, `pd${L}x${l}`, `Ce perimetru are dreptunghiul cu lungimea de ${L} cm și lățimea de ${l} cm?`, `2 * (${L} + ${l})`, 2 * (L + l),
      "Perimetrul este suma lungimilor tuturor laturilor: L + l + L + l.", [`P = L + l + L + l`, `P = ${L} + ${l} + ${L} + ${l} = ${2 * (L + l)} cm`],
      { figura: L <= 12 && l <= 8 ? { tip: "dreptunghi", L, l, unitate: "cm", grila: true } : undefined, verificare: { tip: "perimetru", laturi: [L, l, L, l], valoare: 2 * (L + l) }, fata: `P dreptunghi ${L} cm × ${l} cm` });
  }
  if (t === 1) {
    const l = rng.int(2, max);
    return numeric("geometrie", nivel, `pp${l}`, `Ce perimetru are pătratul cu latura de ${l} cm?`, `4 * ${l}`, 4 * l, "Pătratul are 4 laturi egale: P = 4 × latura.",
      [`P = 4 × l = 4 × ${l} = ${4 * l} cm`], { figura: l <= 8 ? { tip: "patrat", l, unitate: "cm", grila: true } : undefined, verificare: { tip: "perimetru", laturi: [l, l, l, l], valoare: 4 * l }, fata: `P pătrat, l = ${l} cm` });
  }
  const a = rng.int(3, max + 3), b = rng.int(3, max + 3);
  const c = rng.int(Math.max(3, Math.abs(a - b) + 1), a + b - 1);
  return numeric("geometrie", nivel, `pt${a}:${b}:${c}`, `Ce perimetru are triunghiul cu laturile de ${a} cm, ${b} cm și ${c} cm?`, `${a} + ${b} + ${c}`, a + b + c,
    "Adună lungimile celor trei laturi.", [`P = ${a} + ${b} + ${c} = ${a + b + c} cm`],
    { figura: { tip: "triunghi", a, b, c, unitate: "cm" }, verificare: { tip: "perimetru", laturi: [a, b, c], valoare: a + b + c }, fata: `P triunghi ${a}, ${b}, ${c} cm` });
}

function comparaGeometrie(rng: Rng, nivel: N): Nou {
  const l = rng.int(2, nivel === 1 ? 10 : 30);
  const L = rng.int(2, nivel === 1 ? 12 : 40), w = rng.int(1, L);
  const s = semn(4 * l, 2 * (L + w));
  const st = `P pătrat (l = ${l} cm)`, dr = `P dreptunghi (${L} cm, ${w} cm)`;
  return {
    cheie: `geometrie:cmp${l}|${L}|${w}`, capitol: "geometrie", nivel, fel: "comparatie", text: `${st} ○ ${dr}`, st: { text: st }, dr: { text: dr },
    raspuns: { tip: "varianta", valoare: s, variante: SEMNE }, afis: s, indiciu: "Calculează ambele perimetre, apoi compară.",
    rezolvare: [`Pătrat: P = 4 × ${l} = ${4 * l} cm`, `Dreptunghi: P = 2 × (${L} + ${w}) = ${2 * (L + w)} cm`, `${4 * l} ${s} ${2 * (L + w)}`],
    verificare: { tip: "comparatie", st: `4 * ${l}`, dr: `2 * (${L} + ${w})`, semn: s },
  };
}

function constructor(rng: Rng, nivel: N): Nou {
  if (rng.bool(0.3)) {
    const l = rng.int(2, 8), P = 4 * l;
    return {
      cheie: `geometrie:cp${l}`, capitol: "geometrie", nivel, fel: "vizual", text: `Construiește un pătrat cu perimetrul de ${P} cm.`,
      raspuns: { tip: "construit", perimetru: P, laturi: [l, l] }, afis: `pătrat cu latura de ${l} cm`, indiciu: "Pătratul are 4 laturi egale: latura = P : 4.",
      rezolvare: [`latura = ${P} : 4 = ${l} cm`], verificare: { tip: "construit", perimetru: P },
    };
  }
  const L = rng.int(3, 12), l = rng.int(1, Math.min(8, L - 1)), P = 2 * (L + l);
  if (nivel === 1)
    return {
      cheie: `geometrie:cd${P}:${L}`, capitol: "geometrie", nivel, fel: "vizual", text: `Construiește un dreptunghi cu perimetrul de ${P} cm și lungimea de ${L} cm.`,
      raspuns: { tip: "construit", perimetru: P, laturi: [L, l] }, afis: `${L} cm × ${l} cm`, indiciu: "P = 2 × (L + l). Află lățimea: (P − 2 × L) : 2.",
      rezolvare: [`l = (${P} − 2 × ${L}) : 2 = ${l} cm`, `Dreptunghiul are ${L} cm și ${l} cm.`], verificare: { tip: "construit", perimetru: P },
    };
  return {
    cheie: `geometrie:cd${P}`, capitol: "geometrie", nivel, fel: "vizual", text: `Construiește un dreptunghi (nu pătrat) cu perimetrul de ${P} cm.`,
    raspuns: { tip: "construit", perimetru: P }, afis: `de exemplu ${L} cm × ${l} cm`, indiciu: "Semiperimetrul L + l = P : 2. Caută două numere diferite cu această sumă.",
    rezolvare: [`L + l = ${P} : 2 = ${P / 2} cm`, `De exemplu: ${L} cm și ${l} cm.`], verificare: { tip: "construit", perimetru: P },
  };
}

// ───────────────────────── 2. corpuri ─────────────────────────

export const NUME_CORP: Record<Corp, string> = {
  cub: "cub", cuboid: "cuboid", piramida: "piramidă", "piramida-tri": "piramidă triunghiulară", "prisma-tri": "prismă triunghiulară", cilindru: "cilindru", con: "con", sfera: "sferă",
};
/** fețe, muchii, vârfuri */
const ELEMENTE: Partial<Record<Corp, [number, number, number]>> = {
  cub: [6, 12, 8], cuboid: [6, 12, 8], piramida: [5, 8, 5], "piramida-tri": [4, 6, 4], "prisma-tri": [5, 9, 6],
};
const ROSTOGOL: Corp[] = ["cilindru", "con", "sfera"];
const descriereCorp: Record<Corp, string> = {
  cub: "6 fețe pătrate egale, 12 muchii egale, 8 vârfuri.", cuboid: "6 fețe dreptunghiulare (opuse egale), 12 muchii, 8 vârfuri.",
  piramida: "baza pătrat, 4 fețe laterale triunghiuri care se unesc într-un vârf.", "piramida-tri": "baza triunghi și 3 fețe laterale triunghiuri.",
  "prisma-tri": "două baze triunghiuri și 3 fețe laterale dreptunghiuri.", cilindru: "două baze cercuri și o suprafață curbă.",
  con: "o bază cerc și un vârf.", sfera: "doar o suprafață curbă, toate punctele la aceeași distanță de centru.",
};

function exCorpuri(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 1) : rng.int(1, 3);
  if (tip === 0) {
    const c = rng.pick(Object.keys(NUME_CORP) as Corp[]);
    return cuVariante("corpuri", 1, `nume${c}`, "Cum se numește corpul geometric din desen?", NUME_CORP[c], Object.values(NUME_CORP).filter((x) => x !== NUME_CORP[c]), rng,
      { tip: "fapt", categorie: "corp", cheie: c, proprietate: "nume", valoare: NUME_CORP[c] }, "Uită-te la fețe: sunt plane sau curbe? Ce formă are baza?",
      [`Corpul are ${descriereCorp[c]}`, `Este ${NUME_CORP[c]}.`], { desen: { tip: "corp", corp: c } });
  }
  if (tip === 1) {
    const c = rng.pick(Object.keys(ELEMENTE) as Corp[]);
    const k = rng.int(0, 2);
    const ce = ["fețe", "muchii", "vârfuri"][k];
    const v = ELEMENTE[c]![k];
    return numeric("corpuri", nivel, `el${c}${k}`, `Câte ${ce} are ${c === "cuboid" || c === "cub" ? "un" : "o"} ${NUME_CORP[c]}?`, String(v), v,
      "Fața = o suprafață plană; muchia = locul unde se întâlnesc două fețe; vârful = punctul unde se întâlnesc muchiile.",
      [`${NUME_CORP[c][0].toUpperCase()}${NUME_CORP[c].slice(1)}: ${descriereCorp[c]}`, `Răspuns: ${v} ${ce}.`],
      { desen: { tip: "corp", corp: c }, verificare: { tip: "fapt", categorie: "corp", cheie: c, proprietate: ["fete", "muchii", "varfuri"][k], valoare: v }, fata: `${ce} – ${NUME_CORP[c]}` });
  }
  if (tip === 2) {
    const corect = rng.pick(ROSTOGOL);
    const alte = (Object.keys(ELEMENTE) as Corp[]).map((c) => NUME_CORP[c]);
    return cuVariante("corpuri", 2, `rost${corect}`, "Care dintre aceste corpuri se poate rostogoli?", NUME_CORP[corect], alte, rng,
      { tip: "fapt", categorie: "corp", cheie: corect, proprietate: "rostogoleste", valoare: "da" }, "Se rostogolesc doar corpurile care au o suprafață curbă.",
      [`Cubul, cuboidul, piramida și prisma au numai fețe plane: alunecă, nu se rostogolesc.`, `${NUME_CORP[corect][0].toUpperCase()}${NUME_CORP[corect].slice(1)} are o suprafață curbă, deci se rostogolește.`]);
  }
  // suma muchiilor
  if (rng.bool()) {
    const a = rng.int(2, 25);
    return numeric("corpuri", 2, `sm${a}`, `Un cub are muchia de ${a} cm. Cât este suma lungimilor tuturor muchiilor?`, `12 * ${a}`, 12 * a,
      "Cubul are 12 muchii egale.", [`Cubul are 12 muchii, toate de ${a} cm.`, `12 × ${a} = ${12 * a} cm`], { desen: { tip: "corp", corp: "cub" }, fata: `Σ muchii cub, a = ${a} cm` });
  }
  const L = rng.int(5, 20), l = rng.int(2, L - 1), h = rng.int(2, 15);
  return numeric("corpuri", 2, `smc${L}:${l}:${h}`, `Un cuboid are lungimea ${L} cm, lățimea ${l} cm și înălțimea ${h} cm. Cât este suma lungimilor tuturor muchiilor?`,
    `4 * (${L} + ${l} + ${h})`, 4 * (L + l + h), "Cuboidul are 4 lungimi, 4 lățimi și 4 înălțimi.",
    [`4 muchii de ${L} cm, 4 de ${l} cm, 4 de ${h} cm`, `4 × (${L} + ${l} + ${h}) = 4 × ${L + l + h} = ${4 * (L + l + h)} cm`], { desen: { tip: "corp", corp: "cuboid" } });
}

// ───────────────────────── 3. metoda figurativă ─────────────────────────

const OBIECTE = [["timbre", "timbre"], ["cărți", "cărți"], ["bile", "bile"], ["nuci", "nuci"], ["abțibilduri", "abțibilduri"], ["mere", "mere"], ["creioane", "creioane"]] as const;

function exFigurativa(rng: Rng, nivel: N): Nou | null {
  const [A, B] = doiCopii(rng);
  const [ob] = rng.pick(OBIECTE);
  const tip = nivel === 1 ? rng.int(0, 1) : rng.int(0, 3);
  const mareIntreb = rng.bool();
  if (tip === 0) {
    // sumă și diferență
    const b = rng.int(nivel === 1 ? 5 : 40, nivel === 1 ? 60 : 900), d = rng.int(2, nivel === 1 ? 30 : 400), a = b + d, S = a + b;
    const cere = mareIntreb ? A : B, val = mareIntreb ? a : b;
    return {
      ...numeric("figurativa", nivel, `sd${S}:${d}:${mareIntreb}`, `${A} și ${B} au împreună ${de(S, ob)}. ${A} are cu ${d} mai multe decât ${B}. Câte ${ob} are ${cere}?`,
        mareIntreb ? `(${S} - ${d}) / 2 + ${d}` : `(${S} - ${d}) / 2`, val,
        "Desenează două segmente: al lui " + A + " este mai lung cu " + d + ". Scade diferența din sumă: rămân două segmente egale.",
        [`Scădem diferența: ${S} − ${d} = ${S - d} (două părți egale)`, `${B}: ${S - d} : 2 = ${de(b, ob)}`, `${A}: ${b} + ${d} = ${de(a, ob)}`, `Verificare: ${a} + ${b} = ${S}, ${a} − ${b} = ${d}`]),
      desen: { tip: "segmente", linii: [{ nume: A, parti: 1, plus: `+${d}` }, { nume: B, parti: 1 }], acolada: String(S) },
      verificare: { tip: "sistem", ecuatii: [`a + b = ${S}`, `a - b = ${d}`], necunoscute: ["a", "b"], cere: mareIntreb ? "a" : "b", valoare: val },
      fata: `a + b = ${S}, a − b = ${d}, ${mareIntreb ? "a" : "b"} = ?`,
    };
  }
  if (tip === 1) {
    // sumă și raport
    const k = rng.int(2, nivel === 1 ? 5 : 9), b = rng.int(nivel === 1 ? 3 : 20, nivel === 1 ? 30 : 150), a = k * b, S = a + b;
    const val = mareIntreb ? a : b;
    return {
      ...numeric("figurativa", nivel, `sr${S}:${k}:${mareIntreb}`, `${A} și ${B} au împreună ${de(S, ob)}. ${A} are de ${k} ori mai multe decât ${B}. Câte ${ob} are ${mareIntreb ? A : B}?`,
        mareIntreb ? `${S} / (${k} + 1) * ${k}` : `${S} / (${k} + 1)`, val,
        `${B} = o parte, ${A} = ${k} părți. În total sunt ${k + 1} părți egale.`,
        [`Total părți: ${k} + 1 = ${k + 1}`, `O parte (${B}): ${S} : ${k + 1} = ${de(b, ob)}`, `${A}: ${k} × ${b} = ${de(a, ob)}`, `Verificare: ${a} + ${b} = ${S}`]),
      desen: { tip: "segmente", linii: [{ nume: A, parti: k }, { nume: B, parti: 1 }], acolada: String(S) },
      verificare: { tip: "sistem", ecuatii: [`a + b = ${S}`, `a - ${k}*b = 0`], necunoscute: ["a", "b"], cere: mareIntreb ? "a" : "b", valoare: val },
      fata: `a + b = ${S}, a = ${k} × b, ${mareIntreb ? "a" : "b"} = ?`,
    };
  }
  if (tip === 2) {
    // diferență și raport
    const k = rng.int(2, 8), b = rng.int(5, 120), a = k * b, d = a - b;
    const val = mareIntreb ? a : b;
    return {
      ...numeric("figurativa", 2, `dr${d}:${k}:${mareIntreb}`, `${A} are de ${k} ori mai multe ${ob} decât ${B} și cu ${d} mai multe. Câte ${ob} are ${mareIntreb ? A : B}?`,
        mareIntreb ? `${d} / (${k} - 1) * ${k}` : `${d} / (${k} - 1)`, val,
        `${B} = o parte, ${A} = ${k} părți. Diferența de ${d} reprezintă ${k - 1} părți.`,
        [`Diferența în părți: ${k} − 1 = ${k - 1}`, `O parte (${B}): ${d} : ${k - 1} = ${de(b, ob)}`, `${A}: ${k} × ${b} = ${de(a, ob)}`, `Verificare: ${a} − ${b} = ${d}`]),
      desen: { tip: "segmente", linii: [{ nume: A, parti: k }, { nume: B, parti: 1 }] },
      verificare: { tip: "sistem", ecuatii: [`a - b = ${d}`, `a - ${k}*b = 0`], necunoscute: ["a", "b"], cere: mareIntreb ? "a" : "b", valoare: val },
      fata: `a − b = ${d}, a = ${k} × b, ${mareIntreb ? "a" : "b"} = ?`,
    };
  }
  // trei mărimi: b = a + d1, c = b + d2, suma S
  const C = rng.pick(NUME.filter((x) => x !== A && x !== B));
  const a = rng.int(10, 200), d1 = rng.int(3, 60), d2 = rng.int(3, 60), b = a + d1, c = b + d2, S = a + b + c;
  return {
    ...numeric("figurativa", 2, `t3${S}:${d1}:${d2}`, `${A}, ${B} și ${C} au împreună ${de(S, ob)}. ${B} are cu ${d1} mai multe decât ${A}, iar ${C} cu ${d2} mai multe decât ${B}. Câte ${ob} are ${A}?`,
      `(${S} - ${d1} - (${d1} + ${d2})) / 3`, a, `Desenează trei segmente pornind de la cel mai mic (${A}). Scade din sumă tot ce este în plus.`,
      [`${B} = ${A} + ${d1}; ${C} = ${A} + ${d1} + ${d2} = ${A} + ${d1 + d2}`, `Plusurile: ${d1} + ${d1 + d2} = ${2 * d1 + d2}`, `Trei părți egale: ${S} − ${2 * d1 + d2} = ${3 * a}`, `${A}: ${3 * a} : 3 = ${de(a, ob)}`]),
    desen: { tip: "segmente", linii: [{ nume: A, parti: 1 }, { nume: B, parti: 1, plus: `+${d1}` }, { nume: C, parti: 1, plus: `+${d1 + d2}` }], acolada: String(S) },
    verificare: { tip: "sistem", ecuatii: [`a + b + c = ${S}`, `b - a = ${d1}`, `c - b = ${d2}`], necunoscute: ["a", "b", "c"], cere: "a", valoare: a },
  };
}

// ───────────────────────── 4. încercări ─────────────────────────

function exIncercari(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 1) : rng.int(1, 4);
  if (tip === 0) {
    const n = rng.int(10, 400), S = 2 * n + 1;
    return {
      ...numeric("incercari", 1, `cons${S}`, `Suma a două numere naturale consecutive este ${S}. Care este numărul mai mare?`, `(${S} + 1) / 2`, n + 1,
        "Numerele consecutive diferă prin 1. Încearcă numere în jurul jumătății sumei.",
        [`Jumătatea sumei: ${S} : 2 ≈ ${Math.floor(S / 2)}`, `Încercăm ${n} și ${n + 1}: ${n} + ${n + 1} = ${S} ✓`, `Numărul mai mare este ${n + 1}.`]),
      verificare: { tip: "sistem", ecuatii: [`a + b = ${S}`, `b - a = 1`], necunoscute: ["a", "b"], cere: "b", valoare: n + 1 }, fata: `a + (a + 1) = ${S}, a + 1 = ?`,
    };
  }
  if (tip === 1) {
    // găini și iepuri
    const H = rng.int(nivel === 1 ? 6 : 15, nivel === 1 ? 20 : 60), i = rng.int(1, H - 1), g = H - i, P = 2 * g + 4 * i;
    return {
      ...numeric("incercari", nivel, `gi${H}:${P}`, `Într-o curte sunt găini și iepuri: ${de(H, "capete")} și ${de(P, "picioare")}. Câți iepuri sunt?`, `(${P} - 2 * ${H}) / 2`, i,
        "Presupune că toate animalele sunt găini. Câte picioare lipsesc? Fiecare iepure aduce 2 picioare în plus.",
        [`Dacă toate ar fi găini: ${H} × 2 = ${2 * H} picioare`, `Lipsesc: ${P} − ${2 * H} = ${P - 2 * H} picioare`, `Fiecare iepure are 2 picioare în plus: ${P - 2 * H} : 2 = ${i} iepuri`, `Găini: ${H} − ${i} = ${g}. Verificare: ${g} × 2 + ${i} × 4 = ${P} ✓`]),
      verificare: { tip: "sistem", ecuatii: [`g + i = ${H}`, `2*g + 4*i = ${P}`], necunoscute: ["g", "i"], cere: "i", valoare: i }, fata: `${H} capete, ${P} picioare: iepuri?`,
    };
  }
  if (tip === 2) {
    // trei numere consecutive
    const n = rng.int(10, 300), S = 3 * n + 3;
    return {
      ...numeric("incercari", 2, `cons3${S}`, `Suma a trei numere naturale consecutive este ${S}. Care este cel mai mic dintre ele?`, `(${S} - 3) / 3`, n,
        "Numărul din mijloc este o treime din sumă.", [`Numărul din mijloc: ${S} : 3 = ${n + 1}`, `Numerele: ${n}, ${n + 1}, ${n + 2}`, `Verificare: ${n} + ${n + 1} + ${n + 2} = ${S} ✓`]),
      verificare: { tip: "sistem", ecuatii: [`a + b + c = ${S}`, `b - a = 1`, `c - b = 1`], necunoscute: ["a", "b", "c"], cere: "a", valoare: n },
    };
  }
  if (tip === 3) {
    // număr de două cifre: suma cifrelor și diferența lor
    const z = rng.int(2, 9), u = rng.int(0, z - 1), s = z + u, d = z - u, n = 10 * z + u;
    return {
      ...numeric("incercari", 2, `cif${n}`, `Un număr de două cifre are suma cifrelor ${s}, iar cifra zecilor este cu ${d} mai mare decât cifra unităților. Care este numărul?`,
        `10 * ((${s} + ${d}) / 2) + (${s} - ${d}) / 2`, n, "Încearcă perechi de cifre cu suma dată și verifică diferența.",
        [`Perechi de cifre cu suma ${s}: ${perechiCifre(s)}`, `Doar ${z} și ${u} au diferența ${d}.`, `Numărul este ${n}.`]),
      verificare: { tip: "sistem", ecuatii: [`z + u = ${s}`, `z - u = ${d}`], necunoscute: ["z", "u"], cere: "10*z + u", valoare: n },
    };
  }
  // bancnote
  const v1 = 5, v2 = rng.pick([10, 50]), N = rng.int(5, 20), y = rng.int(1, N - 1), x = N - y, T = v1 * x + v2 * y;
  return {
    ...numeric("incercari", 2, `ban${N}:${T}:${v2}`, `Ana are ${N} bancnote de ${v1} lei și de ${v2} lei, în total ${de(T, "lei")}. Câte bancnote de ${v2} lei are?`, `(${T} - ${v1} * ${N}) / (${v2} - ${v1})`, y,
      `Presupune că toate sunt de ${v1} lei. Fiecare bancnotă de ${v2} lei aduce ${v2 - v1} lei în plus.`,
      [`Dacă toate ar fi de ${v1} lei: ${N} × ${v1} = ${N * v1} lei`, `Diferența: ${T} − ${N * v1} = ${T - N * v1} lei`, `${T - N * v1} : ${v2 - v1} = ${y} bancnote de ${v2} lei`, `Verificare: ${x} × ${v1} + ${y} × ${v2} = ${T} ✓`]),
    verificare: { tip: "sistem", ecuatii: [`x + y = ${N}`, `${v1}*x + ${v2}*y = ${T}`], necunoscute: ["x", "y"], cere: "y", valoare: y },
  };
}
const perechiCifre = (s: number) => {
  const p: string[] = [];
  for (let z = 1; z <= 9; z++) { const u = s - z; if (u >= 0 && u <= 9) p.push(`${z} și ${u}`); }
  return p.join("; ");
};

// ───────────────────────── 5. estimare ─────────────────────────

function exEstimare(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 1) : rng.int(0, 3);
  if (tip <= 1) {
    const la = nivel === 1 ? rng.pick([10, 100]) : rng.pick([100, 1000]);
    const max = la * (nivel === 1 ? 9 : 90);
    const a = rng.int(la + 1, max), b = rng.int(la + 1, max);
    const op = tip === 0 ? "+" : "-";
    const [x, y] = op === "-" && b > a ? [b, a] : [a, b];
    if (x % la === 0 || y % la === 0) return null;
    const rx = rotunjeste(x, la), ry = rotunjeste(y, la);
    const v = op === "+" ? rx + ry : rx - ry;
    if (v <= 0) return null;
    const semnOp = op === "+" ? "+" : "−";
    const text = `Estimează ${op === "+" ? "suma" : "diferența"} ${fmt(x)} ${semnOp} ${fmt(y)}, rotunjind fiecare număr la ${NUME_LA[la]}.`;
    const rez = [`${fmt(x)} ≈ ${fmt(rx)}`, `${fmt(y)} ≈ ${fmt(ry)}`, `${fmt(rx)} ${semnOp} ${fmt(ry)} = ${fmt(v)}`, `Rezultatul exact, ${fmt(op === "+" ? x + y : x - y)}, este aproape de estimare.`];
    const ind = `Rotunjește la ${NUME_LA[la]}: dacă cifra din dreapta este 5 sau mai mare, rotunjești în sus.`;
    if (nivel === 2 && rng.bool(0.4)) {
      const gresite = [v + la, v - la, v + 2 * la, Math.abs(v - 2 * la)].filter((g) => g !== v).map(fmt);
      return cuVariante("estimare", nivel, `ev${x}${op}${y}:${la}`, `Care este cea mai bună estimare pentru ${fmt(x)} ${semnOp} ${fmt(y)} (rotunjind la ${NUME_LA[la]})?`, fmt(v), gresite, rng,
        { tip: "estimare", numere: [x, y], op, la, valoare: v }, ind, rez);
    }
    return { ...numeric("estimare", nivel, `e${x}${op}${y}:${la}`, text, `${rx} ${op} ${ry}`, v, ind, rez), verificare: { tip: "estimare", numere: [x, y], op, la, valoare: v }, fata: `≈ ${fmt(x)} ${semnOp} ${fmt(y)} (la ${NUME_LA[la]})` };
  }
  if (tip === 2) {
    const a = rng.int(11, 99), b = rng.int(3, 9);
    if (a % 10 === 0) return null;
    const ra = rotunjeste(a, 10), v = ra * b;
    return { ...numeric("estimare", 2, `ep${a}x${b}`, `Estimează produsul ${a} × ${b}, rotunjind primul factor la zeci.`, `${ra} * ${b}`, v,
      "Rotunjește numărul de două cifre la zeci, apoi înmulțește.", [`${a} ≈ ${ra}`, `${ra} × ${b} = ${v}`, `Exact: ${a} × ${b} = ${a * b}`]),
      verificare: { tip: "estimare", numere: [a, b], op: "*", la: 10, valoare: v }, fata: `≈ ${a} × ${b}` };
  }
  // problemă de estimare
  const pret = rng.int(11, 99), n = rng.int(3, 9);
  if (pret % 10 === 0) return null;
  const rp = rotunjeste(pret, 10), v = rp * n;
  return { ...numeric("estimare", 2, `epb${pret}x${n}`, `O carte costă ${de(pret, "lei")}. Aproximativ cât costă ${n} cărți? (Rotunjește prețul la zeci.)`, `${rp} * ${n}`, v,
    "Rotunjește prețul la zeci, apoi înmulțește cu numărul de cărți.", [`${pret} lei ≈ ${rp} lei`, `${n} × ${rp} = ${v} lei (aproximativ)`, `Exact: ${n} × ${pret} = ${n * pret} lei`]),
    verificare: { tip: "estimare", numere: [pret, n], op: "*", la: 10, valoare: v } };
}

function comparaEstimare(rng: Rng, nivel: N): Nou | null {
  const la = nivel === 1 ? 10 : 100;
  const a = rng.int(la + 1, la * 9), b = rng.int(la + 1, la * 9), c = rotunjeste(a + b, la) + rng.pick([0, la, -la]);
  if (c <= 0) return null;
  const s = semn(a + b, c);
  return {
    cheie: `estimare:cmp${a}+${b}|${c}`, capitol: "estimare", nivel, fel: "comparatie", text: `${fmt(a)} + ${fmt(b)} ○ ${fmt(c)}`, st: { text: `${fmt(a)} + ${fmt(b)}` }, dr: { text: fmt(c) },
    raspuns: { tip: "varianta", valoare: s, variante: SEMNE }, afis: s, indiciu: "Estimează întâi, apoi verifică prin calcul exact.",
    rezolvare: [`Estimare: ${fmt(rotunjeste(a, la))} + ${fmt(rotunjeste(b, la))} = ${fmt(rotunjeste(a, la) + rotunjeste(b, la))}`, `Exact: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`, `${fmt(a + b)} ${s} ${fmt(c)}`],
    verificare: { tip: "comparatie", st: `${a} + ${b}`, dr: String(c), semn: s },
  };
}

// ───────────────────────── 6. logică și probabilități ─────────────────────────

const CULORI = ["roșii", "albastre", "verzi", "galbene"];
const SG_CULOARE: Record<string, string> = { "roșii": "roșie", albastre: "albastră", verzi: "verde", galbene: "galbenă" };

function exLogica(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 1) : rng.int(2, 6);
  if (tip === 0) {
    const nc = rng.int(1, 3);
    const culori = rng.shuffle(CULORI).slice(0, nc);
    const bile: [string, number][] = culori.map((c) => [c, rng.int(1, 6)]);
    const intreb = rng.bool(0.3) ? rng.pick(CULORI.filter((c) => !culori.includes(c))) : rng.pick(culori);
    const n = bile.find(([c]) => c === intreb)?.[1] ?? 0;
    const total = bile.reduce((s, [, x]) => s + x, 0);
    const v = n === 0 ? "imposibil" : n === total ? "sigur" : "posibil";
    const desc = bile.map(([c, x]) => `${x} ${x === 1 ? `bilă ${SG_CULOARE[c]}` : `bile ${c}`}`).join(", ");
    return cuVariante("logica", 1, `ev${desc}|${intreb}`, `Într-o cutie sunt ${desc}. Extragi o bilă fără să te uiți. Evenimentul „bila este ${SG_CULOARE[intreb]}” este:`, v, ["sigur", "posibil", "imposibil"], rng,
      { tip: "eveniment", bile, culoare: intreb, valoare: v }, "Sigur: se întâmplă orice ai face. Imposibil: nu se poate întâmpla. Posibil: se poate întâmpla, dar nu e sigur.",
      [n === 0 ? `În cutie nu există bile ${intreb}.` : n === total ? `Toate bilele sunt ${intreb}.` : `În cutie sunt ${n} bile ${intreb} din ${total}, dar și bile de alte culori.`, `Evenimentul este ${v}.`],
      { desen: { tip: "bile", bile } });
  }
  if (tip === 1) {
    const culori = rng.shuffle(CULORI).slice(0, rng.int(2, 3));
    const nr = rng.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, culori.length);
    const bile: [string, number][] = culori.map((c, i) => [c, nr[i]]);
    const max = bile.reduce((m, b) => (b[1] > m[1] ? b : m));
    const desc = bile.map(([c, x]) => `${x} ${x === 1 ? `bilă ${SG_CULOARE[c]}` : `bile ${c}`}`).join(", ");
    return cuVariante("logica", 1, `pr${desc}`, `Într-o cutie sunt ${desc}. Ce culoare este cel mai probabil să aibă bila extrasă?`, SG_CULOARE[max[0]], culori.map((c) => SG_CULOARE[c]), rng,
      { tip: "probabil", bile, valoare: SG_CULOARE[max[0]] }, "Este mai probabil să extragi culoarea care are cele mai multe bile.",
      [`Cele mai multe bile sunt ${max[0]} (${max[1]}).`, `Deci este cel mai probabil să extragi o bilă ${SG_CULOARE[max[0]]}.`], { desen: { tip: "bile", bile } });
  }
  if (tip === 2) {
    const n = rng.int(3, 4), f = n === 3 ? 6 : 24;
    return {
      ...numeric("logica", 2, `as${n}`, `În câte feluri se pot așeza ${n} copii pe o bancă cu ${n} locuri?`, n === 3 ? "3 * 2 * 1" : "4 * 3 * 2 * 1", f,
        "Pe primul loc poate sta oricare copil, pe al doilea oricare dintre cei rămași…",
        [`Primul loc: ${n} variante`, `Al doilea loc: ${n - 1} variante`, ...(n === 4 ? ["Al treilea loc: 2 variante"] : []), `Ultimul loc: 1 variantă`, `Total: ${n === 3 ? "3 × 2 × 1" : "4 × 3 × 2 × 1"} = ${f}`]),
      verificare: { tip: "numarare", fel: "asezari", n, valoare: f }, fata: `${n} copii pe o bancă: așezări?`,
    };
  }
  if (tip === 3) {
    const n = rng.int(4, 8), v = (n * (n - 1)) / 2;
    return {
      ...numeric("logica", 2, `sm${n}`, `${n} prieteni își strâng mâna, fiecare cu fiecare, o singură dată. Câte strângeri de mână sunt?`, `${n} * (${n} - 1) / 2`, v,
        "Fiecare dă mâna cu toți ceilalți, dar fiecare strângere se numără o singură dată.",
        [`Primul dă mâna cu ${n - 1}, al doilea cu încă ${n - 2}, …`, `${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" + ")} = ${v}`]),
      verificare: { tip: "numarare", fel: "perechi", n, valoare: v }, fata: `${n} prieteni: strângeri de mână?`,
    };
  }
  if (tip === 4) {
    const m = rng.int(2, 6), n = rng.int(2, 5), v = m * n;
    return {
      ...numeric("logica", 2, `tin${m}x${n}`, `Maria are ${m} bluze și ${n} fuste. Câte ținute diferite (o bluză + o fustă) poate face?`, `${m} * ${n}`, v,
        "Fiecare bluză se poate purta cu fiecare fustă.", [`Pentru fiecare bluză sunt ${n} fuste.`, `${m} × ${n} = ${v} ținute`]),
      verificare: { tip: "numarare", fel: "combinatii", n: m, m: n, valoare: v }, fata: `${m} bluze, ${n} fuste: ținute?`,
    };
  }
  if (tip === 5) {
    const cifre = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3).sort((a, b) => a - b);
    const nenule = cifre.filter((c) => c !== 0).length;
    const v = nenule * 2;
    return {
      ...numeric("logica", 2, `nr${cifre.join("")}`, `Câte numere de două cifre diferite se pot scrie cu cifrele ${cifre.join(", ")}?`, String(v), v,
        "Prima cifră nu poate fi 0. Cifrele nu se repetă.",
        [`Cifra zecilor: ${nenule} variante${cifre.includes(0) ? " (nu poate fi 0)" : ""}`, `Cifra unităților: 2 variante (oricare dintre celelalte)`, `Total: ${nenule} × 2 = ${v}`]),
      verificare: { tip: "numarare", fel: "numere", n: 2, cifre, valoare: v },
    };
  }
  // cel mai nefavorabil caz
  const r = rng.int(2, 9), a = rng.int(2, 9);
  return numeric("logica", 2, `nef${r}:${a}`, `Într-o cutie sunt ${r} bile roșii și ${a} bile albastre. Câte bile trebuie să extragi, fără să te uiți, ca să fii sigur că ai cel puțin o bilă roșie?`, `${a} + 1`, a + 1,
    "Gândește-te la cazul cel mai nefavorabil: scoți întâi toate bilele albastre.",
    [`În cel mai rău caz scoți întâi toate cele ${a} bile albastre.`, `Următoarea bilă este sigur roșie: ${a} + 1 = ${a + 1} bile.`]);
}

// ───────────────────────── 7. tabele ─────────────────────────

const TEME_TABEL = [
  { titlu: "Cărți citite într-o lună", col: "Elev", val: "Cărți", rand: () => NUME, max: 15 },
  { titlu: "Fructe vândute (kg)", col: "Fructul", val: "Kilograme", rand: () => ["mere", "pere", "prune", "caise", "cireșe", "struguri"], max: 90 },
  { titlu: "Elevi pe clase", col: "Clasa", val: "Elevi", rand: () => ["a IV-a A", "a IV-a B", "a IV-a C", "a IV-a D", "a IV-a E"], max: 32 },
  { titlu: "Puncte la concurs", col: "Echipa", val: "Puncte", rand: () => ["Albinele", "Delfinii", "Vulturii", "Leii", "Bufnițele"], max: 99 },
];

function exTabele(rng: Rng, nivel: N): Nou | null {
  const t = rng.pick(TEME_TABEL);
  const n = nivel === 1 ? 4 : 5;
  const randuri = rng.shuffle(t.rand()).slice(0, n);
  const val = rng.shuffle(Array.from({ length: t.max - 1 }, (_, i) => i + 2)).slice(0, n); // valori distincte
  const date = randuri.map((r, i) => [r, String(val[i])]);
  const desen = (lipsa?: number, total?: number): Desen => ({
    tip: "tabel", titlu: t.titlu, cap: [t.col, t.val],
    randuri: [...date.map(([r, v], i) => [r, i === lipsa ? "?" : v]), ...(total !== undefined ? [["Total", String(total)]] : [])],
  });
  const sum = val.reduce((s, x) => s + x, 0);
  const tip = nivel === 1 ? rng.int(0, 2) : rng.int(2, 4);
  if (tip === 0)
    return numeric("tabele", 1, `tot${t.titlu}${val.join(",")}`, `Citește tabelul. Cât este totalul (${t.val.toLowerCase()})?`, val.join(" + "), sum,
      "Adună toate valorile din coloana a doua.", [`${val.join(" + ")} = ${sum}`], { desen: desen() });
  if (tip === 1) {
    const iMax = val.indexOf(Math.max(...val));
    return cuVariante("tabele", 1, `max${t.titlu}${val.join(",")}`, `Citește tabelul. Care are cea mai mare valoare (${t.val.toLowerCase()})?`, randuri[iMax], randuri, rng,
      { tip: "max", numere: val, valoare: val[iMax] }, "Compară numerele din coloana a doua.",
      [`Cel mai mare număr din tabel este ${val[iMax]}.`, `Îi corespunde: ${randuri[iMax]}.`], { desen: desen() });
  }
  if (tip === 2) {
    const [i, j] = rng.shuffle(Array.from({ length: n }, (_, k) => k)).slice(0, 2);
    const [a, b] = val[i] > val[j] ? [i, j] : [j, i];
    return numeric("tabele", nivel, `dif${t.titlu}${val.join(",")}:${a}:${b}`, `Citește tabelul. Cu cât este mai mare valoarea pentru ${randuri[a]} decât pentru ${randuri[b]}?`, `${val[a]} - ${val[b]}`, val[a] - val[b],
      "Află cele două valori din tabel, apoi scade.", [`${randuri[a]}: ${val[a]}; ${randuri[b]}: ${val[b]}`, `${val[a]} − ${val[b]} = ${val[a] - val[b]}`], { desen: desen() });
  }
  if (tip === 3) {
    const k = rng.int(0, n - 1);
    return numeric("tabele", 2, `lip${t.titlu}${val.join(",")}:${k}`, `În tabel lipsește o valoare. Știind totalul, află numărul care lipsește.`, `${sum} - (${val.filter((_, i) => i !== k).join(" + ")})`, val[k],
      "Adună valorile cunoscute și scade suma lor din total.",
      [`Valorile cunoscute: ${val.filter((_, i) => i !== k).join(" + ")} = ${sum - val[k]}`, `Lipsește: ${sum} − ${sum - val[k]} = ${val[k]}`], { desen: desen(k, sum) });
  }
  const [i, j] = [0, 1];
  return numeric("tabele", 2, `doua${t.titlu}${val.join(",")}`, `Citește tabelul. Calculează totalul, apoi scade valorile pentru ${randuri[i]} și ${randuri[j]}. Cât rămâne?`, `${sum} - (${val[i]} + ${val[j]})`, sum - val[i] - val[j],
    "Calculează totalul, apoi suma celor două valori, și scade.",
    [`Total: ${val.join(" + ")} = ${sum}`, `${randuri[i]} + ${randuri[j]}: ${val[i]} + ${val[j]} = ${val[i] + val[j]}`, `${sum} − ${val[i] + val[j]} = ${sum - val[i] - val[j]}`], { desen: desen() });
}

// ───────────────────────── 8. etaloane ─────────────────────────

/** obiect → [unitatea potrivită, instrumentul potrivit] (aceeași listă, independent, în scriptul SymPy) */
export const ETALOANE: Record<string, { text: string; unitate: string; instrument: string }> = {
  furnica: { text: "lungimea unei furnici", unitate: "mm", instrument: "rigla" },
  creion: { text: "lungimea unui creion", unitate: "cm", instrument: "rigla" },
  clasa: { text: "lungimea sălii de clasă", unitate: "m", instrument: "ruleta" },
  drum: { text: "distanța dintre două orașe", unitate: "km", instrument: "kilometrajul mașinii" },
  elefant: { text: "masa unui elefant", unitate: "t", instrument: "cântarul pentru camioane" },
  mar: { text: "masa unui măr", unitate: "g", instrument: "cântarul de bucătărie" },
  copil: { text: "masa unui copil", unitate: "kg", instrument: "cântarul de persoane" },
  sirop: { text: "o doză de sirop", unitate: "ml", instrument: "lingurița gradată" },
  galeata: { text: "apa dintr-o găleată", unitate: "l", instrument: "vasul gradat" },
  piscina: { text: "apa dintr-o piscină", unitate: "hl", instrument: "apometrul" },
  pauza: { text: "durata unei pauze", unitate: "minute", instrument: "ceasul" },
  sprint: { text: "timpul unei curse de 50 m", unitate: "secunde", instrument: "cronometrul" },
};

function exEtaloane(rng: Rng, nivel: N): Nou | null {
  const tip = nivel === 1 ? rng.int(0, 1) : rng.int(0, 3);
  const k = rng.pick(Object.keys(ETALOANE));
  const e = ETALOANE[k];
  if (tip === 0) {
    const alte = [...new Set(Object.values(ETALOANE).map((x) => x.unitate))].filter((u) => u !== e.unitate);
    return cuVariante("etaloane", nivel, `u${k}`, `Ce unitate de măsură este potrivită pentru ${e.text}?`, e.unitate, alte, rng,
      { tip: "fapt", categorie: "etalon", cheie: k, proprietate: "unitate", valoare: e.unitate }, "Alege unitatea cu care numărul obținut nu este nici prea mare, nici prea mic.",
      [`Pentru ${e.text} folosim ${e.unitate}.`, "Cu o unitate prea mică am obține un număr foarte mare; cu una prea mare, un număr foarte mic."], { fata: e.text });
  }
  if (tip === 1) {
    const alte = [...new Set(Object.values(ETALOANE).map((x) => x.instrument))].filter((u) => u !== e.instrument);
    return cuVariante("etaloane", nivel, `i${k}`, `Cu ce instrument măsori ${e.text}?`, e.instrument, alte, rng,
      { tip: "fapt", categorie: "etalon", cheie: k, proprietate: "instrument", valoare: e.instrument }, "Lungimea se măsoară cu rigla sau ruleta, masa cu cântarul, capacitatea cu vasul gradat, timpul cu ceasul.",
      [`Pentru ${e.text} folosim ${e.instrument}.`]);
  }
  if (tip === 2) {
    const v = rng.pick([200, 250, 500]), L = rng.int(1, 5), n = (L * 1000) / v;
    return numeric("etaloane", 2, `cana${v}:${L}`, `O cană gradată are ${v} ml. De câte ori trebuie umplută ca să adunăm ${L} l de apă?`, `${L} * 1000 / ${v}`, n,
      "Transformă litrii în mililitri, apoi împarte la capacitatea cănii.", [`${L} l = ${fmt(L * 1000)} ml`, `${fmt(L * 1000)} : ${v} = ${n} (căni)`]);
  }
  const pas = rng.pick([50, 60, 70]), n = rng.int(5, 30);
  return numeric("etaloane", 2, `pas${pas}:${n}`, `Pasul lui Andrei are ${pas} cm. A măsurat lungimea curții și a numărat ${de(n, "pași")}. Ce lungime are curtea, în centimetri?`, `${pas} * ${n}`, pas * n,
    "Înmulțește lungimea pasului cu numărul de pași.", [`${n} × ${pas} cm = ${fmt(pas * n)} cm`, `${fmt(pas * n)} cm = ${Math.floor((pas * n) / 100)} m ${(pas * n) % 100} cm`]);
}

// ───────────────────────── selecție după joc ─────────────────────────

const EX: Record<CapitolC4, (rng: Rng, n: N) => Nou | null> = {
  geometrie: exGeometrie, corpuri: exCorpuri, figurativa: exFigurativa, incercari: exIncercari, estimare: (r, n) => exEstimare(r, n), logica: exLogica,
  tabele: exTabele, etaloane: exEtaloane, capacitate: (r, n) => exUnitati(r, "capacitate", n), lungime: (r, n) => exUnitati(r, "lungime", n),
  masa: (r, n) => exUnitati(r, "masa", n), timp: exTimp,
};
const ESTE_UNITATE = (c: CapitolC4): c is CapUnitati => c === "lungime" || c === "capacitate" || c === "masa";

function comparatie(rng: Rng, cap: CapitolC4, n: N): Nou | null {
  if (ESTE_UNITATE(cap)) return comparaUnitati(rng, cap, n);
  if (cap === "timp") return comparaTimp(rng, n);
  if (cap === "geometrie") return comparaGeometrie(rng, n);
  if (cap === "estimare") return comparaEstimare(rng, n);
  return null;
}

function lipsa(rng: Rng, cap: CapitolC4, n: N): Nou | null {
  if (ESTE_UNITATE(cap)) return lipsaUnitati(rng, cap, n);
  return null;
}

function pereche(rng: Rng, cap: CapitolC4, n: N): Nou | null {
  const e = EX[cap](rng, n);
  if (!e || e.desen?.tip === "tabel") return null;
  if (e.raspuns.tip === "varianta") return e.fata ? { ...e, fel: "pereche", st: { text: e.fata }, dr: { text: e.afis }, raspuns: { tip: "pereche" }, desen: undefined } : null;
  if (e.raspuns.tip !== "numar") return null;
  const st = e.fata ?? (e.text.length <= 45 ? e.text.replace(/ = □.*$/, "") : null);
  if (!st) return null;
  const unit = e.text.match(/= □ (.+)$/)?.[1];
  const dr = `${fmt(e.raspuns.valoare)}${unit ? ` ${unit}` : ""}`;
  // perechea se verifică în joc (cartonașele potrivite); pe fișă se scrie rezultatul (afis)
  return { ...e, fel: "pereche", st: { text: st }, dr: { text: dr }, afis: dr, raspuns: { tip: "pereche" }, desen: undefined, figura: undefined };
}

/** capitolele care nu pot da cartonașe scurte la Memory */
const FARA_PERECHI = (c: CapitolC4, nivel: N) => c === "tabele" || (c === "logica" && nivel === 1);

const FEL: Record<JocC4, FelItem> = { sprint: "exercitiu", memory: "pereche", balanta: "comparatie", detectiv: "lipsa", constructor: "vizual" };

function itemNou(rng: Rng, cap: CapitolC4, n: N, fel: FelItem): Nou | null {
  switch (fel) {
    case "pereche": return pereche(rng, cap, n);
    case "comparatie": return comparatie(rng, cap, n) ?? EX[cap](rng, n);
    case "lipsa": return lipsa(rng, cap, n) ?? EX[cap](rng, n);
    case "vizual": return cap === "geometrie" ? constructor(rng, n) : EX[cap](rng, n);
    default: return EX[cap](rng, n);
  }
}

export interface SesiuneC4 { itemi: ItemC4[]; avertismente: string[] }
const INCERCARI = 300;

/** Exercițiile unei sesiuni (joc sau fișă), deterministe: același cod → aceleași exerciții. */
export function genereazaC4(cfg: ConfigC4): SesiuneC4 {
  const capitole = cfg.capitole.length ? cfg.capitole : (["lungime"] as CapitolC4[]);
  const fel = FEL[cfg.joc];
  const ordine = new Rng(hash(cfg.seed, 41)).shuffle(capitole);
  const itemi: ItemC4[] = [];
  const vazute = new Set<string>();
  let duplicate = 0;
  const total = Math.max(1, Math.min(100, Math.floor(cfg.nr)));
  const faraPerechi = new Set<CapitolC4>();
  for (let i = 0; i < total; i++) {
    const baza = hash(cfg.seed, i, cfg.inlocuiri?.[`i${i}`] ?? 0);
    const nivel: N = cfg.nivel === "amestecat" ? (new Rng(hash(baza, 99)).bool() ? 1 : 2) : cfg.nivel === "2" ? 2 : 1;
    let cap = ordine[i % ordine.length];
    // la Memory, unele capitole (tabele, logica de nivel 1) nu au cartonașe: se folosește alt capitol ales
    if (fel === "pereche" && FARA_PERECHI(cap, nivel)) {
      faraPerechi.add(cap);
      const alt = ordine.filter((c) => !FARA_PERECHI(c, nivel));
      if (!alt.length) continue;
      cap = alt[i % alt.length];
    }
    let ales: Nou | null = null, rezerva: Nou | null = null;
    for (let k = 0; k < INCERCARI && !ales; k++) {
      const e = itemNou(new Rng(hash(baza, k)), cap, nivel, fel);
      if (!e) continue;
      const chei = [e.cheie, ...(fel === "pereche" ? [`f:${e.st?.text}`, `f:${e.dr?.text}`] : [])];
      if (chei.every((c) => !vazute.has(c))) { ales = e; chei.forEach((c) => vazute.add(c)); }
      else rezerva ??= e;
    }
    const e = ales ?? rezerva;
    if (!e) continue;
    if (!ales) duplicate++;
    vazute.add(e.cheie);
    const { fata, ...item } = e;
    void fata;
    itemi.push({ ...item, id: `i${i}` });
  }
  const avertismente: string[] = [];
  if (faraPerechi.size) avertismente.push(`Perechile matematice nu au cartonașe pentru: ${[...faraPerechi].map((c) => NUME_CAPITOL_C4[c]).join(", ")}. Alege alt joc pentru aceste capitole.`);
  if (duplicate) avertismente.push(`${duplicate} exerciții se repetă: alege mai multe capitole sau celălalt nivel.`);
  if (itemi.length < total) avertismente.push(`Am putut genera doar ${itemi.length} din ${total} exerciții cu opțiunile alese.`);
  return { itemi, avertismente };
}

/** Verificarea răspunsului: aceleași formate ca la clasa a III-a. */
export const verificaC4 = (item: Pick<ItemC4, "raspuns">, dat: string) => verificaC3(item as { raspuns: RaspunsC3 }, dat);
