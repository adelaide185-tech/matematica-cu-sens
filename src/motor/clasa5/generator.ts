import { Rng } from "@/motor/rng";
import { fmt, hash } from "@/motor/calcul/generator";
import type { FelItem, RaspunsC3 } from "@/motor/clasa3/tipuri";
import { verificaC3 } from "@/motor/clasa3/generator";
import type { JocC4 } from "@/motor/clasa4/tipuri";
import { NUME_CAPITOL_C5, type CapitolC5, type ConfigC5, type ItemC5, type VerificareC5 } from "./tipuri";

type Nou = Omit<ItemC5, "id"> & { fata?: string };
type N = 1 | 2;

// ───────────────────────── utilitare ─────────────────────────

function variante(rng: Rng, corect: string, gresite: string[], n = 4): string[] {
  const v = [corect];
  for (const g of rng.shuffle(gresite)) if (!v.includes(g) && v.length < n) v.push(g);
  return rng.shuffle(v);
}
function numeric(capitol: CapitolC5, nivel: N, cheie: string, text: string, expr: string, valoare: number, indiciu: string, rezolvare: string[], extra: Partial<Nou> = {}): Nou {
  return { cheie: `${capitol}:${cheie}`, capitol, nivel, fel: "exercitiu", text, raspuns: { tip: "numar", valoare }, afis: fmt(valoare), indiciu, rezolvare, verificare: { tip: "egal", expr, valoare }, ...extra };
}
function cuVariante(capitol: CapitolC5, nivel: N, cheie: string, text: string, corect: string, gresite: string[], rng: Rng, verificare: VerificareC5, indiciu: string, rezolvare: string[], extra: Partial<Nou> = {}): Nou | null {
  const v = variante(rng, corect, gresite);
  if (v.length < 3) return null;
  return { cheie: `${capitol}:${cheie}`, capitol, nivel, fel: "exercitiu", text, raspuns: { tip: "varianta", valoare: corect, variante: v }, afis: corect, indiciu, rezolvare, verificare, ...extra };
}
const SEMNE = ["<", "=", ">"];
const semn = (a: number, b: number): "<" | ">" | "=" => (a < b ? "<" : a > b ? ">" : "=");
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** 2 la puterea 10 → „2¹⁰” */
export const put = (a: number | string, n: number) => `${a}${String(n).split("").map((c) => SUP[Number(c)]).join("")}`;
const cmmdc = (a: number, b: number): number => (b ? cmmdc(b, a % b) : a);
/** fracția ireductibilă ca text „a/b” (numitor 1 → „a”) */
const frac = (a: number, b: number) => { const d = cmmdc(a, b); return b / d === 1 ? String(a / d) : `${a / d}/${b / d}`; };
/** număr zecimal dat în sutimi → „6,25” */
export const zec = (sutimi: number) => {
  const s = (sutimi / 100).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return s.replace(".", ",");
};
const rat = (sutimi: number) => `${sutimi}/100`;
const comparatieItem = (capitol: CapitolC5, nivel: N, cheie: string, st: string, dr: string, exprSt: string, exprDr: string, vSt: number, vDr: number, indiciu: string, rezolvare: string[]): Nou => {
  const s = semn(vSt, vDr);
  return {
    cheie: `${capitol}:${cheie}`, capitol, nivel, fel: "comparatie", text: `${st} ○ ${dr}`, st: { text: st }, dr: { text: dr },
    raspuns: { tip: "varianta", valoare: s, variante: SEMNE }, afis: s, indiciu, rezolvare: [...rezolvare, `Deci ${st} ${s} ${dr}.`],
    verificare: { tip: "comparatie", st: exprSt, dr: exprDr, semn: s },
  };
};

// ───────────────────────── 1. puteri ─────────────────────────

function exPuteri(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 2) : rng.int(2, 5);
  if (t === 0) {
    const [a, e] = rng.pick([[rng.int(2, 15), 2], [rng.int(2, 10), 3], [2, rng.int(4, 10)], [10, rng.int(2, 6)], [3, 4], [5, 4]]);
    const v = a ** e;
    return numeric("puteri", 1, `p${a}^${e}`, `${put(a, e)} =`, `${a}**${e}`, v, "Puterea înseamnă înmulțirea repetată a bazei de atâtea ori cât arată exponentul.",
      [`${put(a, e)} = ${Array(e).fill(a).join(" · ")}`, `= ${fmt(v)}`], { fata: put(a, e) });
  }
  if (t === 1) {
    const a = rng.int(0, 1) ? 0 : 1, e = rng.int(2, 2026);
    const ce = rng.pick(["1", "0", "b"]);
    if (ce === "b") {
      const b = rng.int(2, 99);
      return numeric("puteri", 1, `p1:${b}`, `${put(b, 1)} + ${put(b, 0)} =`, `${b}**1 + ${b}**0`, b + 1, "Orice număr la puterea 1 este numărul însuși; orice număr nenul la puterea 0 este 1.",
        [`${put(b, 1)} = ${b}`, `${put(b, 0)} = 1`, `${b} + 1 = ${b + 1}`], { fata: `${put(b, 1)} + ${put(b, 0)}` });
    }
    return numeric("puteri", 1, `p01:${a}^${e}`, `${put(a, e)} =`, `${a}**${e}`, a, "1 la orice putere este 1; 0 la orice putere nenulă este 0.", [`${put(a, e)} = ${a}`]);
  }
  if (t === 2) {
    // reguli: produs, cât, putere de putere
    const a = rng.pick([2, 3, 5, 7, 10]), m = rng.int(2, 12), k = rng.int(2, 9);
    const r = rng.int(0, 2);
    if (r === 0) return numeric("puteri", n, `pr${a}:${m}:${k}`, `${put(a, m)} · ${put(a, k)} = ${a} la puterea □`, `${m} + ${k}`, m + k, "La înmulțirea puterilor cu aceeași bază, exponenții se adună.",
      [`aⁿ · aᵐ = aⁿ⁺ᵐ`, `${put(a, m)} · ${put(a, k)} = ${put(a, m + k)}`], { afis: `□ = ${m + k}`, fel: n === 2 ? "lipsa" : "exercitiu" });
    if (r === 1) { const M = m + k; return numeric("puteri", n, `pc${a}:${M}:${k}`, `${put(a, M)} : ${put(a, k)} = ${a} la puterea □`, `${M} - ${k}`, m, "La împărțirea puterilor cu aceeași bază, exponenții se scad.",
      [`aⁿ : aᵐ = aⁿ⁻ᵐ`, `${put(a, M)} : ${put(a, k)} = ${put(a, m)}`], { afis: `□ = ${m}`, fel: "lipsa" }); }
    const p = rng.int(2, 5), q = rng.int(2, 5);
    return numeric("puteri", n, `pp${a}:${p}:${q}`, `(${put(a, p)})${put("", q)} = ${a} la puterea □`, `${p} * ${q}`, p * q, "La puterea unei puteri, exponenții se înmulțesc.",
      [`(aⁿ)ᵐ = aⁿ·ᵐ`, `(${put(a, p)})${put("", q)} = ${put(a, p * q)}`], { afis: `□ = ${p * q}`, fel: "lipsa" });
  }
  if (t === 3) {
    const a = rng.int(2, 9), b = rng.int(2, 6), c = rng.int(2, 9), d = rng.int(2, 4);
    const v = a ** 2 + b ** 3 - c ** 0 * d;
    if (v < 0) return null;
    return numeric("puteri", 2, `pc${a}:${b}:${c}:${d}`, `${put(a, 2)} + ${put(b, 3)} − ${put(c, 0)} · ${d} =`, `${a}**2 + ${b}**3 - ${c}**0 * ${d}`, v,
      "Calculează întâi puterile, apoi înmulțirea, apoi adunarea și scăderea.",
      [`${put(a, 2)} = ${a * a}; ${put(b, 3)} = ${b ** 3}; ${put(c, 0)} = 1`, `1 · ${d} = ${d}`, `${a * a} + ${b ** 3} − ${d} = ${v}`]);
  }
  if (t === 4) {
    // ultima cifră
    const a = rng.pick([2, 3, 7]), e = rng.int(5, 40);
    const ciclu = [1, 2, 3, 4].map((i) => a ** i % 10);
    const u = ciclu[(e - 1) % 4];
    return numeric("puteri", 2, `uc${a}^${e}`, `Care este ultima cifră a numărului ${put(a, e)}?`, `${a}**${e} % 10`, u,
      `Ultimele cifre ale puterilor lui ${a} se repetă din 4 în 4: ${ciclu.join(", ")}.`,
      [`Ultimele cifre: ${ciclu.map((c, i) => `${put(a, i + 1)} → ${c}`).join(", ")}, apoi se repetă.`, `${e} = 4 · ${Math.floor((e - 1) / 4)} + ${((e - 1) % 4) + 1}`, `Ultima cifră este ${u}.`]);
  }
  // comparare de puteri, ca exercițiu
  return comparaPuteri(rng, 2);
}

function comparaPuteri(rng: Rng, n: N): Nou {
  const opt = n === 1
    ? [[2, rng.int(3, 6), rng.int(3, 6), 2], [rng.int(2, 9), 2, rng.int(2, 5), 3], [10, 2, rng.int(5, 12), 2]]
    : [[2, rng.int(8, 30), 2, rng.int(8, 30)], [3, rng.int(2, 6), 9, rng.int(1, 3)], [2, 3 * rng.int(2, 8), 3, 2 * rng.int(2, 8)], [5, rng.int(2, 4), 2, rng.int(5, 9)]];
  const [a, m, b, k] = rng.pick(opt);
  const va = a ** m, vb = b ** k;
  const rez = va < 1e7 && vb < 1e7 ? [`${put(a, m)} = ${fmt(va)}`, `${put(b, k)} = ${fmt(vb)}`]
    : a === 2 && b === 3 ? [`${put(a, m)} = (2³)${put("", m / 3)} = ${put(8, m / 3)}`, `${put(b, k)} = (3²)${put("", k / 2)} = ${put(9, k / 2)}`] : [`Aceeași bază: compari exponenții ${m} și ${k}.`];
  return comparatieItem("puteri", n, `cmp${a}^${m}|${b}^${k}`, put(a, m), put(b, k), `${a}**${m}`, `${b}**${k}`, va, vb,
    "Calculează puterile sau adu-le la aceeași bază (sau același exponent), apoi compară.", rez);
}

// ───────────────────────── 2. ordinea operațiilor ─────────────────────────

function exOrdine(rng: Rng, n: N): Nou | null {
  const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(2, 6);
  const forme: { t: string; e: string; v: number; p: string[] }[] = n === 1 ? [
    { t: `${a * 10} − ${b} · ${c} =`, e: `${a * 10} - ${b} * ${c}`, v: a * 10 - b * c, p: [`${b} · ${c} = ${b * c}`, `${a * 10} − ${b * c} = ${a * 10 - b * c}`] },
    { t: `(${a} + ${b}) · ${c} − ${d} =`, e: `(${a} + ${b}) * ${c} - ${d}`, v: (a + b) * c - d, p: [`${a} + ${b} = ${a + b}`, `${a + b} · ${c} = ${(a + b) * c}`, `${(a + b) * c} − ${d} = ${(a + b) * c - d}`] },
    { t: `${put(a, 2)} − ${b} · ${c} =`, e: `${a}**2 - ${b} * ${c}`, v: a * a - b * c, p: [`${put(a, 2)} = ${a * a}`, `${b} · ${c} = ${b * c}`, `${a * a} − ${b * c} = ${a * a - b * c}`] },
    { t: `${a * c} : ${c} + ${put(b, 2)} =`, e: `${a * c} / ${c} + ${b}**2`, v: a + b * b, p: [`${a * c} : ${c} = ${a}`, `${put(b, 2)} = ${b * b}`, `${a} + ${b * b} = ${a + b * b}`] },
  ] : [
    { t: `[${a} · (${b} + ${c}) − ${d}] : ${1} + ${put(2, d)} =`, e: `(${a} * (${b} + ${c}) - ${d}) / 1 + 2**${d}`, v: a * (b + c) - d + 2 ** d, p: [`${b} + ${c} = ${b + c}`, `${a} · ${b + c} = ${a * (b + c)}`, `${a * (b + c)} − ${d} = ${a * (b + c) - d}`, `${put(2, d)} = ${2 ** d}`, `${a * (b + c) - d} + ${2 ** d} = ${a * (b + c) - d + 2 ** d}`] },
    { t: `${put(a, 2)} + [${b * c * d} : (${b} · ${c}) + ${put(2, 3)}] · ${2} =`, e: `${a}**2 + (${b * c * d} / (${b} * ${c}) + 2**3) * 2`, v: a * a + (d + 8) * 2, p: [`${b} · ${c} = ${b * c}`, `${b * c * d} : ${b * c} = ${d}`, `${put(2, 3)} = 8; ${d} + 8 = ${d + 8}`, `${d + 8} · 2 = ${(d + 8) * 2}`, `${put(a, 2)} = ${a * a}; ${a * a} + ${(d + 8) * 2} = ${a * a + (d + 8) * 2}`] },
    { t: `${put(10, 2)} − [${put(a, 2)} − (${b} + ${c})] =`, e: `10**2 - (${a}**2 - (${b} + ${c}))`, v: 100 - (a * a - (b + c)), p: [`${b} + ${c} = ${b + c}`, `${put(a, 2)} = ${a * a}`, `${a * a} − ${b + c} = ${a * a - b - c}`, `100 − ${a * a - b - c} = ${100 - (a * a - b - c)}`] },
  ];
  const f = rng.pick(forme);
  if (f.v < 0 || /(− -|= -)/.test(f.p.join()) || f.p.some((x) => /= -/.test(x))) return null;
  if (n === 2 && f.e.includes(`${a}**2 - (`) && a * a < b + c) return null;
  return numeric("ordine", n, `o${f.t}`, f.t.replace(" : 1 ", " "), f.e, f.v, "Întâi puterile, apoi parantezele rotunde, apoi cele pătrate; în fiecare: × și :, apoi + și −.", f.p);
}

function comparaOrdine(rng: Rng, n: N): Nou | null {
  const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9);
  const st = `${a} + ${b} · ${c}`, dr = `(${a} + ${b}) · ${c}`;
  return comparatieItem("ordine", n, `cmp${a}:${b}:${c}`, st, dr, `${a} + ${b} * ${c}`, `(${a} + ${b}) * ${c}`, a + b * c, (a + b) * c,
    "Fără paranteze, înmulțirea se face înaintea adunării.", [`${st} = ${a} + ${b * c} = ${a + b * c}`, `${dr} = ${a + b} · ${c} = ${(a + b) * c}`]);
}

// ───────────────────────── 3. factor comun ─────────────────────────

function exFactor(rng: Rng, n: N): Nou | null {
  const a = rng.int(n === 1 ? 2 : 11, n === 1 ? 25 : 99);
  const tinta = rng.pick([10, 100, 100, 1000]);
  const b = rng.int(1, tinta - 1), c = tinta - b;
  if (n === 1 || rng.bool()) {
    if (rng.bool(0.35)) {
      return numeric("factor", n, `fl${a}:${b}:${c}`, `${a} · □ + ${a} · ${c} = ${a} · ${tinta}`, `${tinta} - ${c}`, b, "a · b + a · c = a · (b + c). Ce număr adunat cu " + c + " dă " + tinta + "?",
        [`${a} · □ + ${a} · ${c} = ${a} · (□ + ${c})`, `□ + ${c} = ${tinta}, deci □ = ${tinta} − ${c} = ${b}`], { afis: `□ = ${b}`, fel: "lipsa" });
    }
    return numeric("factor", n, `f${a}:${b}:${c}`, `${a} · ${b} + ${a} · ${c} =`, `${a} * ${b} + ${a} * ${c}`, a * tinta, "Scoate factorul comun: a · b + a · c = a · (b + c).",
      [`Factorul comun este ${a}.`, `${a} · ${b} + ${a} · ${c} = ${a} · (${b} + ${c})`, `= ${a} · ${tinta} = ${fmt(a * tinta)}`], { fata: `${a}·${b} + ${a}·${c}` });
  }
  if (rng.bool()) {
    const d = rng.int(1, 50), b2 = tinta + d;
    return numeric("factor", 2, `fd${a}:${b2}:${d}`, `${a} · ${b2} − ${a} · ${d} =`, `${a} * ${b2} - ${a} * ${d}`, a * tinta, "Scoate factorul comun: a · b − a · c = a · (b − c).",
      [`${a} · ${b2} − ${a} · ${d} = ${a} · (${b2} − ${d})`, `= ${a} · ${tinta} = ${fmt(a * tinta)}`]);
  }
  const k = rng.int(3, 12), m = rng.int(1, 3);
  return numeric("factor", 2, `f2^${k}:${m}`, `${put(2, k + m)} + ${put(2, k)} = ${put(2, k)} · □`, `(2**${k + m} + 2**${k}) / 2**${k}`, 2 ** m + 1, `Scrie ${put(2, k + m)} = ${put(2, k)} · ${put(2, m)} și scoate ${put(2, k)} factor comun.`,
    [`${put(2, k + m)} = ${put(2, k)} · ${put(2, m)}`, `${put(2, k)} · ${put(2, m)} + ${put(2, k)} · 1 = ${put(2, k)} · (${2 ** m} + 1)`, `□ = ${2 ** m + 1}`], { afis: `□ = ${2 ** m + 1}`, fel: "lipsa" });
}

// ───────────────────────── 4. divizibilitate ─────────────────────────

const divizori = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const CRITERIU: Record<number, string> = {
  2: "ultima cifră este pară (0, 2, 4, 6, 8)", 5: "ultima cifră este 0 sau 5", 10: "ultima cifră este 0",
  3: "suma cifrelor se împarte la 3", 9: "suma cifrelor se împarte la 9", 4: "numărul format din ultimele două cifre se împarte la 4",
};
const sumaCifre = (x: number) => String(x).split("").reduce((s, c) => s + Number(c), 0);

function exDivizibilitate(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 2) : rng.int(1, 4);
  if (t === 0) {
    const x = rng.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 60, 64, 72, 80, 84, 90, 96, 100]);
    const D = divizori(x);
    return { ...numeric("divizibilitate", 1, `nd${x}`, `Câți divizori naturali are numărul ${x}?`, String(D.length), D.length, "Caută divizorii în perechi: 1 și numărul, 2 și jumătatea lui…",
      [`D${x} = {${D.join(", ")}}`, `Are ${D.length} divizori.`], { fata: `Câți divizori are ${x}?` }), verificare: { tip: "divizori", n: x, valoare: D.length } };
  }
  if (t === 1) {
    const d = rng.pick([2, 5, 10, 3, 9]);
    const nums: number[] = [];
    const bun = (() => { for (;;) { const v = rng.int(100, 9999); if (v % d === 0) return v; } })();
    nums.push(bun);
    while (nums.length < 4) { const v = rng.int(100, 9999); if (v % d !== 0 && !nums.includes(v)) nums.push(v); }
    return cuVariante("divizibilitate", n, `div${d}:${nums.join(",")}`, `Care dintre numere se divide cu ${d}?`, fmt(bun), nums.slice(1).map(fmt), rng,
      { tip: "unic", numere: nums, proprietate: `div${d}`, valoare: bun }, `Criteriul de divizibilitate cu ${d}: ${CRITERIU[d]}.`,
      [`Un număr se divide cu ${d} dacă ${CRITERIU[d]}.`, d === 3 || d === 9 ? `${fmt(bun)}: suma cifrelor = ${sumaCifre(bun)}, care se divide cu ${d}.` : `${fmt(bun)} respectă criteriul.`, `Celelalte numere nu respectă criteriul.`]);
  }
  if (t === 2) {
    const d = rng.int(3, 19), lim = rng.int(20, 200);
    const m = (Math.floor(lim / d) + 1) * d;
    return numeric("divizibilitate", n, `mul${d}:${lim}`, `Care este cel mai mic multiplu al lui ${d} mai mare decât ${lim}?`, `(${lim} // ${d} + 1) * ${d}`, m,
      `Multiplii lui ${d}: ${d}, ${2 * d}, ${3 * d}, … Împarte ${lim} la ${d} și ia următorul multiplu.`,
      [`${lim} : ${d} = ${Math.floor(lim / d)} rest ${lim % d}`, `${Math.floor(lim / d) + 1} · ${d} = ${m}`], { fata: `primul multiplu de ${d} după ${lim}` });
  }
  if (t === 3) {
    // cifra lipsă: a x b divizibil cu 9 (unică) sau cu 3 (cea mai mare)
    for (let k = 0; k < 20; k++) {
      const a = rng.int(1, 9), b = rng.int(0, 9), c = rng.int(0, 9);
      const sol = Array.from({ length: 10 }, (_, x) => x).filter((x) => (a + x + b + c) % 9 === 0);
      if (sol.length !== 1) continue;
      const x = sol[0];
      return { ...numeric("divizibilitate", 2, `cif${a}x${b}${c}`, `Ce cifră pui în locul lui x ca numărul ${a}x${b}${c} să se dividă cu 9?`, `${x}`, x,
        "Suma cifrelor trebuie să se dividă cu 9.", [`Suma cifrelor: ${a} + x + ${b} + ${c} = ${a + b + c} + x`, `${a + b + c} + x trebuie să fie multiplu de 9 (x ≤ 9): x = ${x}`, `Numărul: ${a}${x}${b}${c}`], { fata: `${a}x${b}${c} se divide cu 9: x = ?` }),
        verificare: { tip: "cifra", sablon: `${a}x${b}${c}`, d: 9, valoare: x } };
    }
    return null;
  }
  // c.m.m.d.c. simplu
  const g = rng.int(2, 15), p = rng.int(2, 9), q = rng.int(2, 9);
  if (cmmdc(p, q) !== 1) return null;
  return numeric("divizibilitate", 2, `cmmdc${g * p}:${g * q}`, `Care este cel mai mare divizor comun al numerelor ${g * p} și ${g * q}?`, `gcd(${g * p}, ${g * q})`, g,
    "Caută cel mai mare număr care le împarte pe amândouă.", [`${g * p} = ${g} · ${p}`, `${g * q} = ${g} · ${q}`, `${p} și ${q} nu mai au divizori comuni (în afară de 1), deci c.m.m.d.c. = ${g}`], { fata: `c.m.m.d.c.(${g * p}, ${g * q})` });
}

// ───────────────────────── 5. prime ─────────────────────────

export const estePrim = (x: number) => x > 1 && Array.from({ length: Math.floor(Math.sqrt(x)) - 1 }, (_, i) => i + 2).every((d) => x % d !== 0);

function exPrime(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 1) : rng.int(1, 3);
  if (t === 0 || t === 1) {
    const max = n === 1 ? 60 : 200;
    let prim = 0;
    while (!estePrim(prim)) prim = rng.int(2, max);
    const compuse: number[] = [];
    while (compuse.length < 3) { const v = rng.int(4, max); if (!estePrim(v) && !compuse.includes(v) && (n === 2 ? v % 2 && v % 5 : true)) compuse.push(v); }
    const nums = [prim, ...compuse];
    return cuVariante("prime", n, `prim${nums.join(",")}`, "Care dintre numere este prim?", String(prim), compuse.map(String), rng,
      { tip: "unic", numere: nums, proprietate: "prim", valoare: prim }, "Un număr prim are exact doi divizori: 1 și el însuși.",
      [...compuse.map((c) => `${c} = ${divizori(c)[1]} · ${c / divizori(c)[1]} (compus)`), `${prim} are doar divizorii 1 și ${prim}: este prim.`]);
  }
  if (t === 2) {
    const factori = [2, 3, 5, 7, 11, 13];
    let x = 1; const f: number[] = [];
    while (x < 30) { const p = rng.pick(factori); x *= p; f.push(p); }
    if (x > 999) return null;
    const mare = Math.max(...f);
    return { ...numeric("prime", 2, `fp${x}`, `Care este cel mai mare factor prim al numărului ${x}?`, String(mare), mare, "Descompune numărul în factori primi, împărțind pe rând la 2, 3, 5, 7…",
      [`${x} = ${f.sort((a, b) => a - b).join(" · ")}`, `Cel mai mare factor prim: ${mare}`]), verificare: { tip: "factor-prim", n: x, valoare: mare } };
  }
  const lim = rng.pick([10, 20, 30]);
  const p = Array.from({ length: lim }, (_, i) => i).filter(estePrim);
  const s = p.reduce((a, b) => a + b, 0);
  return numeric("prime", 2, `sp${lim}`, `Cât este suma numerelor prime mai mici decât ${lim}?`, p.join(" + "), s, "Numerele prime încep cu 2, 3, 5, 7… (1 nu este prim).",
    [`Numerele prime mai mici decât ${lim}: ${p.join(", ")}`, `Suma: ${p.join(" + ")} = ${s}`]);
}

// ───────────────────────── 6. metode de rezolvare ─────────────────────────

function exMetode(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 1) : rng.int(0, 3);
  if (t === 0) {
    const [ob, unit] = rng.pick([["caiete", "lei"], ["kg de mere", "lei"], ["bilete", "lei"], ["pixuri", "lei"]]);
    const pret = rng.int(2, 15), a = rng.int(2, 9), b = rng.int(2, 12);
    if (a === b) return null;
    if (n === 1) return numeric("metode", 1, `ru${ob}${pret}:${a}:${b}`, `${a} ${ob} costă ${a * pret} ${unit}. Cât costă ${b} ${ob}?`, `${a * pret} / ${a} * ${b}`, b * pret,
      "Reducerea la unitate: află întâi cât costă unul.", [`1 ${ob.split(" ").at(-1)}: ${a * pret} : ${a} = ${pret} ${unit}`, `${b} ${ob}: ${b} · ${pret} = ${b * pret} ${unit}`],
      { fata: `${a} ${ob} = ${a * pret} lei; ${b} ${ob} = ?` });
    const m = rng.int(2, 6), z = rng.int(2, 6), zile = m * z, mN = rng.int(2, 6) * m;
    if (mN === m) return null;
    const zN = zile * m / mN;
    if (!Number.isInteger(zN)) return null;
    return numeric("metode", 2, `rui${m}:${zile}:${mN}`, `${m} muncitori termină o lucrare în ${zile} zile. În câte zile ar termina-o ${mN} muncitori, lucrând la fel?`, `${m} * ${zile} / ${mN}`, zN,
      "Mai mulți muncitori termină mai repede: află câte zile i-ar trebui unui singur muncitor.", [`1 muncitor: ${m} · ${zile} = ${m * zile} zile`, `${mN} muncitori: ${m * zile} : ${mN} = ${zN} zile`]);
  }
  if (t === 1) {
    const x = rng.int(2, n === 1 ? 20 : 60), k = rng.int(2, 6), a = rng.int(3, 40), d = rng.int(2, 5);
    const pasi = n === 1 ? [["înmulțesc cu", k], ["adun", a]] as const : [["înmulțesc cu", k], ["adun", a], ["împart la", d]] as const;
    let v = x;
    for (const [op, y] of pasi) v = op === "adun" ? v + y : op === "înmulțesc cu" ? v * y : v / y;
    if (!Number.isInteger(v)) return null;
    const descr = pasi.map(([op, y]) => `${op} ${y}`).join(", apoi ");
    const inv: string[] = []; let w = v;
    for (const [op, y] of [...pasi].reverse()) { const u = op === "adun" ? w - y : op === "înmulțesc cu" ? w / y : w * y; inv.push(`${op === "adun" ? `${w} − ${y}` : op === "înmulțesc cu" ? `${w} : ${y}` : `${w} · ${y}`} = ${u}`); w = u; }
    return { ...numeric("metode", n, `mi${x}:${k}:${a}:${n}`, `Mă gândesc la un număr. Îl ${descr} și obțin ${v}. La ce număr m-am gândit?`, String(x), x,
      "Mersul invers: pornește de la rezultat și fă operațiile inverse, în ordine inversă.", [...inv, `Numărul este ${x}.`],
      { fata: n === 1 ? `x · ${k} + ${a} = ${v}, x = ?` : `(x · ${k} + ${a}) : ${d} = ${v}, x = ?` }),
      verificare: { tip: "sistem", ecuatii: [n === 1 ? `x*${k} + ${a} = ${v}` : `(x*${k} + ${a})/${d} = ${v}`], necunoscute: ["x"], cere: "x", valoare: x } };
  }
  if (t === 2) {
    // falsa ipoteză: biciclete și triciclete
    const T = rng.int(8, 30), tri = rng.int(1, T - 1), bic = T - tri, R = 2 * bic + 3 * tri;
    return { ...numeric("metode", 2, `fi${T}:${R}`, `Într-un parc sunt ${T} biciclete și triciclete, cu ${R} de roți în total. Câte triciclete sunt?`, `${R} - 2 * ${T}`, tri,
      "Falsa ipoteză: presupune că toate sunt biciclete. Câte roți lipsesc?",
      [`Dacă toate ar fi biciclete: ${T} · 2 = ${2 * T} roți`, `Diferența: ${R} − ${2 * T} = ${R - 2 * T} roți`, `Fiecare tricicletă are o roată în plus: ${R - 2 * T} triciclete`, `Verificare: ${bic} · 2 + ${tri} · 3 = ${R}`]),
      verificare: { tip: "sistem", ecuatii: [`b + t = ${T}`, `2*b + 3*t = ${R}`], necunoscute: ["b", "t"], cere: "t", valoare: tri } };
  }
  // mers invers cu „jumătate și încă”
  const rest = rng.int(2, 20), k = rng.int(1, 9);
  const total = 2 * (rest + k);
  return { ...numeric("metode", 2, `jm${total}:${k}`, `Ana a cheltuit jumătate din bani și încă ${k} lei. I-au rămas ${rest} lei. Câți lei a avut?`, `2 * (${rest} + ${k})`, total,
    "Mersul invers: dacă nu ar fi cheltuit și cei " + k + " lei, ar fi rămas cu jumătate.", [`Fără cei ${k} lei: ${rest} + ${k} = ${rest + k} lei (jumătate din bani)`, `Toți banii: 2 · ${rest + k} = ${total} lei`]),
    verificare: { tip: "sistem", ecuatii: [`x - (x/2 + ${k}) = ${rest}`], necunoscute: ["x"], cere: "x", valoare: total } };
}

// ───────────────────────── 7. fracții ordinare ─────────────────────────

function exFractii(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 3) : rng.int(2, 6);
  const b = rng.int(3, 12), a = rng.int(1, b - 1);
  if (t === 0) {
    const k = rng.int(2, 6);
    return numeric("fractii", n, `amp${a}/${b}:${k}`, `${a}/${b} = □/${b * k}`, `${a} * ${k}`, a * k, `Amplifică: înmulțește și numărătorul, și numitorul cu același număr (${k}).`,
      [`${b * k} : ${b} = ${k}`, `${a} · ${k} = ${a * k}`, `${a}/${b} = ${a * k}/${b * k}`], { afis: `□ = ${a * k}`, fel: "lipsa" });
  }
  if (t === 1) {
    const k = rng.int(2, 9), d = cmmdc(a, b);
    const A = (a / d) * k, B = (b / d) * k;
    const corect = frac(A, B);
    if (corect === `${A}/${B}`) return null;
    return cuVariante("fractii", n, `simp${A}/${B}`, `Simplifică fracția ${A}/${B} până devine ireductibilă:`, corect, [`${A / cmmdc(A, B)}/${B / cmmdc(A, B) + 1}`, frac(A + 1, B), frac(A, B + 1), `${B / cmmdc(A, B)}/${A / cmmdc(A, B)}`], rng,
      { tip: "rational", expr: `${A}/${B}`, valoare: corect }, "Împarte numărătorul și numitorul la cel mai mare divizor comun.",
      [`c.m.m.d.c.(${A}, ${B}) = ${cmmdc(A, B)}`, `${A}/${B} = ${A / cmmdc(A, B)}/${B / cmmdc(A, B)}`]);
  }
  if (t === 2) {
    const x = rng.int(2, 9) * b, v = (x / b) * a;
    return numeric("fractii", n, `din${a}/${b}:${x}`, `Cât reprezintă ${a}/${b} din ${x}?`, `${x} / ${b} * ${a}`, v, "Împarte numărul la numitor, apoi înmulțește cu numărătorul.",
      [`${x} : ${b} = ${x / b}`, `${x / b} · ${a} = ${v}`], { fata: `${a}/${b} din ${x}` });
  }
  if (t === 3) {
    // adunare/scădere cu același numitor
    const c = rng.int(1, b - 1), plus = rng.bool() || a <= c;
    const r = plus ? a + c : a - c;
    const corect = frac(r, b);
    return cuVariante("fractii", n, `as${a}${plus}${c}/${b}`, `${a}/${b} ${plus ? "+" : "−"} ${c}/${b} =`, corect, [`${r}/${2 * b}`, frac(r + 1, b), `${plus ? a + c : Math.abs(a - c)}/${plus ? 2 * b : b + 1}`, frac(Math.max(1, r - 1), b)], rng,
      { tip: "rational", expr: `${a}/${b} ${plus ? "+" : "-"} ${c}/${b}`, valoare: corect }, "Când numitorii sunt egali, aduni (sau scazi) numărătorii și păstrezi numitorul.",
      [`${a} ${plus ? "+" : "−"} ${c} = ${r}`, `Rezultat: ${r}/${b}${corect !== `${r}/${b}` ? ` = ${corect}` : ""}`]);
  }
  if (t === 4) {
    // numitori diferiți
    const b2 = rng.int(2, 9), a2 = rng.int(1, b2 - 1);
    if (b2 === b) return null;
    const L = (b * b2) / cmmdc(b, b2);
    const r = a * (L / b) + a2 * (L / b2);
    const corect = frac(r, L);
    return cuVariante("fractii", 2, `ad${a}/${b}+${a2}/${b2}`, `${a}/${b} + ${a2}/${b2} =`, corect, [`${a + a2}/${b + b2}`, frac(r + 1, L), frac(a + a2, L), frac(r, L + b)], rng,
      { tip: "rational", expr: `${a}/${b} + ${a2}/${b2}`, valoare: corect }, "Adu fracțiile la același numitor (cel mai mic multiplu comun al numitorilor), apoi adună numărătorii.",
      [`Numitorul comun: ${L}`, `${a}/${b} = ${a * (L / b)}/${L}; ${a2}/${b2} = ${a2 * (L / b2)}/${L}`, `${a * (L / b)} + ${a2 * (L / b2)} = ${r}, deci ${r}/${L}${corect !== `${r}/${L}` ? ` = ${corect}` : ""}`]);
  }
  if (t === 5) {
    // înmulțire
    const b2 = rng.int(2, 9), a2 = rng.int(1, 9);
    const corect = frac(a * a2, b * b2);
    return cuVariante("fractii", 2, `inm${a}/${b}x${a2}/${b2}`, `${a}/${b} · ${a2}/${b2} =`, corect, [`${a * a2}/${b + b2}`, frac(a + a2, b * b2), frac(a * b2, b * a2), frac(a * a2 + 1, b * b2)], rng,
      { tip: "rational", expr: `${a}/${b} * ${a2}/${b2}`, valoare: corect }, "La înmulțire: numărător × numărător, numitor × numitor; apoi simplifică.",
      [`${a} · ${a2} = ${a * a2}; ${b} · ${b2} = ${b * b2}`, `${a * a2}/${b * b2}${corect !== `${a * a2}/${b * b2}` ? ` = ${corect}` : ""}`]);
  }
  // problemă: fracție dintr-un număr, ce rămâne
  const total = rng.int(2, 12) * b;
  const ch = (total / b) * a;
  return numeric("fractii", 2, `pr${a}/${b}:${total}`, `O carte are ${total} de pagini. Maria a citit ${a}/${b} din ea. Câte pagini mai are de citit?`, `${total} - ${total} / ${b} * ${a}`, total - ch,
    "Află întâi câte pagini a citit (fracția din număr), apoi scade din total.", [`${a}/${b} din ${total} = ${total} : ${b} · ${a} = ${ch} pagini`, `${total} − ${ch} = ${total - ch} pagini`]);
}

function comparaFractii(rng: Rng, n: N): Nou | null {
  const b = rng.int(3, 12), a = rng.int(1, b + 3);
  let c: number, d: number;
  if (n === 1) { if (rng.bool()) { d = b; c = rng.int(1, b + 3); } else { c = a; d = rng.int(2, 12); } }
  else { d = rng.int(2, 12); c = rng.int(1, d + 3); }
  if (a * d === c * b && rng.bool(0.7)) return null;
  return comparatieItem("fractii", n, `cmp${a}/${b}|${c}/${d}`, `${a}/${b}`, `${c}/${d}`, `${a}/${b}`, `${c}/${d}`, a * d, c * b,
    b === d ? "Același numitor: e mai mare fracția cu numărătorul mai mare." : a === c ? "Același numărător: e mai mare fracția cu numitorul mai mic." : "Adu fracțiile la același numitor, apoi compară numărătorii.",
    b === d || a === c ? [b === d ? `Numitorii sunt egali: compar ${a} cu ${c}.` : `Numărătorii sunt egali: compar numitorii ${b} și ${d}.`]
      : [`${a}/${b} = ${a * d}/${b * d}`, `${c}/${d} = ${c * b}/${b * d}`]);
}

// ───────────────────────── 8. fracții zecimale ─────────────────────────

function exZecimale(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 3) : rng.int(2, 6);
  const x = rng.int(101, 9999); // sutimi
  if (t === 0) {
    const p = rng.pick([10, 100, 1000]), ori = rng.bool();
    const v = ori ? x * p : x / p;
    if (!ori && x % p !== 0) {
      // împărțirea poate produce miimi: le scriem cu toFixed
      const s = (x / 100 / p).toFixed(5).replace(/0+$/, "").replace(".", ",");
      return cuVariante("zecimale", n, `d${x}:${p}`, `${zec(x)} : ${fmt(p)} =`, s, [zec(x * p), (x / 100 / (p / 10)).toFixed(5).replace(/0+$/, "").replace(/\.$/, "").replace(".", ","), (x / 100 / (p * 10)).toFixed(6).replace(/0+$/, "").replace(".", ",")], rng,
        { tip: "rational", expr: `${x}/100 / ${p}`, valoare: s.replace(",", ".") }, `La împărțirea cu ${fmt(p)}, virgula se mută spre stânga cu ${String(p).length - 1} poziții.`,
        [`Mutăm virgula spre stânga cu ${String(p).length - 1} ${p === 10 ? "poziție" : "poziții"}: ${s}`]);
    }
    const s = zec(v);
    return cuVariante("zecimale", n, `${ori ? "m" : "d"}${x}:${p}`, `${zec(x)} ${ori ? "·" : ":"} ${fmt(p)} =`, s, [zec(ori ? x * p / 10 : x / p * 10), zec(ori ? x * p * 10 : Math.max(1, x / p / 10)), zec(x + p)], rng,
      { tip: "rational", expr: `${x}/100 ${ori ? "*" : "/"} ${p}`, valoare: rat(v) }, `La ${ori ? "înmulțirea" : "împărțirea"} cu ${fmt(p)}, virgula se mută spre ${ori ? "dreapta" : "stânga"} cu ${String(p).length - 1} poziții.`,
      [`Mutăm virgula spre ${ori ? "dreapta" : "stânga"} cu ${String(p).length - 1} ${p === 10 ? "poziție" : "poziții"}: ${s}`]);
  }
  if (t === 1) {
    const la = rng.pick([10, 1]); // rotunjire la zecimi (10 sutimi) sau la unități (100 sutimi)
    const pas = la === 10 ? 10 : 100;
    if (x % pas === 0) return null;
    const r = Math.floor((x + pas / 2) / pas) * pas;
    const nume = pas === 10 ? "zecimi" : "unități";
    return cuVariante("zecimale", n, `rot${x}:${pas}`, `Rotunjește ${zec(x)} la ${nume}:`, zec(r), [zec(r + pas), zec(Math.max(pas, r - pas)), zec(Math.floor(x / pas) * pas === r ? r + pas : Math.floor(x / pas) * pas), zec(x - (x % 10))], rng,
      { tip: "rational", expr: rat(r), valoare: rat(r) }, `Uită-te la cifra din dreapta ${pas === 10 ? "zecimilor" : "unităților"}: 5 sau mai mare → rotunjești în sus.`,
      [`Cifra următoare: ${pas === 10 ? x % 10 : Math.floor(x / 10) % 10}`, `${zec(x)} ≈ ${zec(r)}`]);
  }
  if (t === 2) {
    // fracție ordinară → zecimală
    const [a, b] = rng.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [7, 10], [3, 10], [9, 20], [7, 20], [13, 25], [1, 8], [3, 8]]);
    const v = (a / b) * 100;
    const s = Number.isInteger(v) ? zec(v) : String(a / b).replace(".", ",");
    return cuVariante("zecimale", n, `fz${a}/${b}`, `Scrie ca fracție zecimală: ${a}/${b} =`, s, [`${a},${b}`, String(b / a).slice(0, 5).replace(".", ","), zec(Math.round(v) + 10), `0,${a}${b}`], rng,
      { tip: "rational", expr: `${a}/${b}`, valoare: String(a / b) }, "Amplifică fracția ca numitorul să devină 10, 100 sau 1 000 (sau împarte numărătorul la numitor).",
      [`${a}/${b} = ${a} : ${b}`, `= ${s}`], { fata: `${a}/${b}` });
  }
  if (t === 3) {
    const y = rng.int(101, 9999), plus = rng.bool() || x > y;
    const [p, q] = plus ? [x, y] : [y, x];
    const v = plus ? p + q : p - q;
    if (v <= 0) return null;
    return cuVariante("zecimale", n, `as${p}${plus}${q}`, `${zec(p)} ${plus ? "+" : "−"} ${zec(q)} =`, zec(v), [zec(v + 10), zec(v - 1 > 0 ? v - 1 : v + 1), zec(v + 100), zec(Math.abs(v - 10) || v + 20)], rng,
      { tip: "rational", expr: `${p}/100 ${plus ? "+" : "-"} ${q}/100`, valoare: rat(v) }, "Așază numerele cu virgula sub virgulă, apoi calculează ca la numere naturale.",
      [`${zec(p)} ${plus ? "+" : "−"} ${zec(q)}: virgulă sub virgulă`, `= ${zec(v)}`]);
  }
  if (t === 4) {
    const k = rng.int(2, 9), y = rng.int(11, 999);
    const v = y * k;
    return cuVariante("zecimale", 2, `inm${y}x${k}`, `${zec(y)} · ${k} =`, zec(v), [zec(v * 10), zec(Math.max(1, Math.round(v / 10))), zec(v + k), zec(v + 100)], rng,
      { tip: "rational", expr: `${y}/100 * ${k}`, valoare: rat(v) }, "Înmulțește ca la numere naturale, apoi pune virgula: rezultatul are tot atâtea zecimale câte are factorul zecimal.",
      [`${y} · ${k} = ${v}`, `${zec(y)} are ${y % 10 === 0 ? 1 : 2} zecimale → ${zec(v)}`]);
  }
  // media aritmetică (rezultat întreg)
  const k = rng.int(3, 5), m = rng.int(5, 9);
  const note = Array.from({ length: k - 1 }, () => rng.int(Math.max(4, m - 3), Math.min(10, m + 3)));
  const ultima = m * k - note.reduce((s, z) => s + z, 0);
  if (ultima < 4 || ultima > 10) return null;
  const toate = [...note, ultima];
  return numeric("zecimale", 2, `med${toate.join(",")}`, `Media aritmetică a notelor ${toate.join(", ")} este:`, `(${toate.join(" + ")}) / ${k}`, m,
    "Adună notele și împarte suma la numărul lor.", [`Suma: ${toate.join(" + ")} = ${m * k}`, `${m * k} : ${k} = ${m}`]);
}

function comparaZecimale(rng: Rng, n: N): Nou | null {
  const a = rng.int(101, 9999);
  const b = rng.pick([a + 1, a - 1, a + 9, a + 90, Math.floor(a / 10) * 10 + (a % 10 ? 0 : 5), a]);
  if (b <= 0) return null;
  // scriem al doilea număr cu altă formă (zecimi vs sutimi) pentru capcana „mai multe cifre = mai mare”
  return comparatieItem("zecimale", n, `cmp${a}|${b}`, zec(a), zec(b), rat(a), rat(b), a, b, "Compară întâi partea întreagă, apoi zecimile, apoi sutimile.",
    [`${zec(a)} = ${(a / 100).toFixed(2).replace(".", ",")}; ${zec(b)} = ${(b / 100).toFixed(2).replace(".", ",")}`]);
}

// ───────────────────────── 9. segmente și unghiuri ─────────────────────────

function exGeometrie(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 3) : rng.int(2, 6);
  if (t === 0) {
    const L = 2 * rng.int(3, 40);
    return numeric("unghiuri", n, `mij${L}`, `M este mijlocul segmentului AB, iar AB = ${L} cm. Cât este AM, în cm?`, `${L} / 2`, L / 2, "Mijlocul împarte segmentul în două segmente egale.",
      [`AM = MB = AB : 2`, `AM = ${L} : 2 = ${L / 2} cm`], { desen: { tip: "segmente", linii: [{ nume: "AM", parti: 1 }, { nume: "MB", parti: 1 }], acolada: `${L} cm` } });
  }
  if (t === 1) {
    const k = rng.int(3, 8), v = (k * (k - 1)) / 2;
    return numeric("unghiuri", n, `seg${k}`, `Câte segmente determină ${k} puncte coliniare?`, `${k} * (${k} - 1) / 2`, v, "Fiecare pereche de puncte determină un segment.",
      [`Primul punct formează segmente cu celelalte ${k - 1}, al doilea cu încă ${k - 2}, …`, `${Array.from({ length: k - 1 }, (_, i) => k - 1 - i).join(" + ")} = ${v}`]);
  }
  if (t === 2) {
    const sup = rng.bool(), u = rng.int(5, sup ? 175 : 85);
    const v = (sup ? 180 : 90) - u;
    return numeric("unghiuri", n, `${sup ? "s" : "c"}${u}`, `Ce măsură are ${sup ? "suplementul" : "complementul"} unui unghi de ${u}°?`, `${sup ? 180 : 90} - ${u}`, v,
      `Unghiurile ${sup ? "suplementare au suma 180°" : "complementare au suma 90°"}.`, [`${sup ? 180 : 90}° − ${u}° = ${v}°`], { afis: `${v}°`, fata: `${sup ? "suplementul" : "complementul"} lui ${u}°` });
  }
  if (t === 3) {
    const u = 2 * rng.int(10, 85);
    return numeric("unghiuri", n, `bis${u}`, `Bisectoarea unui unghi de ${u}° îl împarte în două unghiuri. Ce măsură are fiecare?`, `${u} / 2`, u / 2, "Bisectoarea împarte unghiul în două unghiuri egale.",
      [`${u}° : 2 = ${u / 2}°`], { afis: `${u / 2}°` });
  }
  if (t === 4) {
    // punct pe segment, raport
    const k = rng.int(2, 5), cb = rng.int(2, 15), ab = (k + 1) * cb;
    return { ...numeric("unghiuri", 2, `rap${ab}:${k}`, `Punctul C se află pe segmentul AB, AB = ${ab} cm și AC este de ${k} ori mai lung decât CB. Cât este CB, în cm?`, `${ab} / (${k} + 1)`, cb,
      "AB = AC + CB, iar AC are " + k + " părți cât CB.", [`CB = o parte, AC = ${k} părți, AB = ${k + 1} părți`, `CB = ${ab} : ${k + 1} = ${cb} cm`]),
      desen: { tip: "segmente", linii: [{ nume: "AC", parti: k }, { nume: "CB", parti: 1 }], acolada: `${ab} cm` },
      verificare: { tip: "sistem", ecuatii: [`a + c = ${ab}`, `a - ${k}*c = 0`], necunoscute: ["a", "c"], cere: "c", valoare: cb } };
  }
  if (t === 5) {
    // unghiuri în jurul unui punct
    const a = rng.int(40, 150), b = rng.int(40, 150), c = 360 - a - b;
    if (c < 20) return null;
    return numeric("unghiuri", 2, `jur${a}:${b}`, `Trei unghiuri în jurul unui punct au măsurile ${a}°, ${b}° și x. Cât este x?`, `360 - ${a} - ${b}`, c, "Unghiurile în jurul unui punct au suma 360°.",
      [`x = 360° − ${a}° − ${b}° = ${c}°`], { afis: `${c}°` });
  }
  // unghiuri adiacente suplementare cu raport
  const k = rng.pick([2, 3, 4, 5, 8]), x = 180 / (k + 1);
  if (!Number.isInteger(x)) return null;
  return { ...numeric("unghiuri", 2, `adj${k}`, `Două unghiuri adiacente suplementare au măsurile în raportul 1 : ${k}. Cât măsoară unghiul mai mic?`, `180 / (${k} + 1)`, x,
    "Unghiurile adiacente suplementare au suma 180°. Împarte 180° în părți.", [`Unghiul mic = 1 parte, cel mare = ${k} părți: ${k + 1} părți`, `180° : ${k + 1} = ${x}°`]),
    afis: `${x}°`, verificare: { tip: "sistem", ecuatii: [`a + b = 180`, `b - ${k}*a = 0`], necunoscute: ["a", "b"], cere: "a", valoare: x } };
}

// ───────────────────────── 10. arii și volume ─────────────────────────

function exArie(rng: Rng, n: N): Nou | null {
  const t = n === 1 ? rng.int(0, 3) : rng.int(2, 6);
  if (t === 0) {
    const L = rng.int(3, 25), l = rng.int(2, L);
    const patrat = L === l;
    return numeric("arie", n, `ad${L}x${l}`, patrat ? `Ce arie are pătratul cu latura de ${L} cm? (în cm²)` : `Ce arie are dreptunghiul cu L = ${L} cm și l = ${l} cm? (în cm²)`, `${L} * ${l}`, L * l,
      patrat ? "Aria pătratului = latura · latura." : "Aria dreptunghiului = lungimea · lățimea.", [`A = ${L} · ${l} = ${L * l} cm²`],
      { afis: `${L * l} cm²`, fata: patrat ? `A pătrat, l = ${L} cm` : `A dreptunghi ${L} × ${l} cm`, figura: L <= 12 && l <= 8 ? (patrat ? { tip: "patrat", l, unitate: "cm", grila: true } : { tip: "dreptunghi", L, l, unitate: "cm", grila: true }) : undefined });
  }
  if (t === 1) {
    const a = rng.int(2, 12);
    return numeric("arie", n, `vc${a}`, `Ce volum are cubul cu muchia de ${a} cm? (în cm³)`, `${a}**3`, a ** 3, "Volumul cubului = muchia · muchia · muchia.",
      [`V = ${a} · ${a} · ${a} = ${a ** 3} cm³`], { afis: `${a ** 3} cm³`, desen: { tip: "corp", corp: "cub" }, fata: `V cub, a = ${a} cm` });
  }
  if (t === 2) {
    const lista: [string, string, number][] = n === 1 ? [["m²", "dm²", 100], ["dm²", "cm²", 100], ["dm³", "l", 1], ["m³", "dm³", 1000]]
      : [["m²", "cm²", 10000], ["ha", "m²", 10000], ["m³", "l", 1000], ["dm³", "cm³", 1000], ["km²", "ha", 100]];
    const [mare, mic, f] = rng.pick(lista);
    const A = rng.int(2, n === 1 ? 9 : 40);
    return numeric("arie", n, `u${A}${mare}>${mic}`, `${A} ${mare} = □ ${mic}`, `${A} * ${f}`, A * f, "Unitățile de arie cresc din 100 în 100, cele de volum din 1 000 în 1 000; 1 dm³ = 1 l, 1 ha = 10 000 m².",
      [`1 ${mare} = ${fmt(f)} ${mic}`, `${A} ${mare} = ${A} · ${fmt(f)} = ${fmt(A * f)} ${mic}`], { afis: `□ = ${fmt(A * f)}`, fata: `${A} ${mare}` });
  }
  if (t === 3) {
    const L = rng.int(3, 20), l = rng.int(2, 15), h = rng.int(2, 12);
    return numeric("arie", n, `vcb${L}:${l}:${h}`, `Ce volum are cuboidul cu dimensiunile ${L} cm, ${l} cm și ${h} cm? (în cm³)`, `${L} * ${l} * ${h}`, L * l * h, "Volumul cuboidului = lungimea · lățimea · înălțimea.",
      [`V = ${L} · ${l} · ${h} = ${fmt(L * l * h)} cm³`], { afis: `${fmt(L * l * h)} cm³`, desen: { tip: "corp", corp: "cuboid" } });
  }
  if (t === 4) {
    const L = rng.int(4, 30), A = L * rng.int(2, L);
    const l = A / L;
    return { ...numeric("arie", 2, `ll${A}:${L}`, `Un dreptunghi are aria de ${A} cm² și lungimea de ${L} cm. Ce perimetru are, în cm?`, `2 * (${L} + ${A} / ${L})`, 2 * (L + l),
      "Află întâi lățimea din arie (A = L · l), apoi perimetrul.", [`l = ${A} : ${L} = ${l} cm`, `P = 2 · (${L} + ${l}) = ${2 * (L + l)} cm`]),
      verificare: { tip: "sistem", ecuatii: [`${L}*l = ${A}`, `p - 2*${L} - 2*l = 0`], necunoscute: ["l", "p"], cere: "p", valoare: 2 * (L + l) } };
  }
  if (t === 5) {
    const a = rng.int(2, 10), V = a ** 3;
    return { ...numeric("arie", 2, `mc${V}`, `Un cub are volumul de ${V} cm³. Cât măsoară muchia lui, în cm?`, `${V}**(1/3)`, a, "Caută numărul care înmulțit de trei ori cu el însuși dă volumul.",
      [`${a} · ${a} · ${a} = ${V}`, `Muchia = ${a} cm`]), verificare: { tip: "egal", expr: `${a}**3 / ${a}**2`, valoare: a } };
  }
  // arie compusă: dreptunghi din care se taie un pătrat
  const L = rng.int(8, 20), l = rng.int(5, 12), p = rng.int(2, Math.min(l, L) - 2);
  return numeric("arie", 2, `comp${L}:${l}:${p}`, `Dintr-un carton dreptunghiular de ${L} cm pe ${l} cm se taie un pătrat cu latura de ${p} cm. Ce arie are cartonul rămas, în cm²?`, `${L} * ${l} - ${p}**2`, L * l - p * p,
    "Aria rămasă = aria dreptunghiului − aria pătratului tăiat.", [`A dreptunghi = ${L} · ${l} = ${L * l} cm²`, `A pătrat = ${p} · ${p} = ${p * p} cm²`, `${L * l} − ${p * p} = ${L * l - p * p} cm²`], { afis: `${L * l - p * p} cm²` });
}

function comparaArie(rng: Rng, n: N): Nou {
  const A = rng.int(2, 9), f = 100;
  const v2 = A * f + rng.pick([0, 1, -1, 10, -10, 100, -100]);
  return comparatieItem("arie", n, `cmp${A}|${v2}`, `${A} m²`, `${fmt(v2)} dm²`, `${A} * 100`, String(v2), A * f, v2, "1 m² = 100 dm². Transformă în aceeași unitate.", [`${A} m² = ${A * 100} dm²`]);
}

/** Constructor: dreptunghi cu aria și perimetrul date (soluție unică pe grilă). */
function constructorArie(rng: Rng, n: N): Nou | null {
  const L = rng.int(2, 12), l = rng.int(1, Math.min(8, L));
  const A = L * l, P = 2 * (L + l);
  // unicitate pe grilă 12 × 8
  const sol: [number, number][] = [];
  for (let x = 1; x <= 12; x++) for (let y = 1; y <= 8; y++) if (x * y === A && 2 * (x + y) === P && x >= y) sol.push([x, y]);
  if (sol.length !== 1) return null;
  return {
    cheie: `arie:con${A}:${P}`, capitol: "arie", nivel: n, fel: "vizual",
    text: n === 1 ? `Construiește un dreptunghi cu lungimea de ${L} cm și aria de ${A} cm².` : `Construiește un dreptunghi cu aria de ${A} cm² și perimetrul de ${P} cm.`,
    raspuns: { tip: "construit", perimetru: P, laturi: [L, l] }, afis: `${L} cm × ${l} cm`,
    indiciu: n === 1 ? "Lățimea = aria : lungimea." : "Caută două numere cu produsul egal cu aria și suma egală cu jumătate din perimetru.",
    rezolvare: n === 1 ? [`l = ${A} : ${L} = ${l} cm`] : [`L · l = ${A} și L + l = ${P / 2}`, `L = ${L} cm, l = ${l} cm`],
    verificare: { tip: "construit", perimetru: P },
  };
}

// ───────────────────────── selecție după joc ─────────────────────────

const EX: Record<CapitolC5, (rng: Rng, n: N) => Nou | null> = {
  puteri: exPuteri, ordine: exOrdine, factor: exFactor, divizibilitate: exDivizibilitate, prime: exPrime,
  metode: exMetode, fractii: exFractii, zecimale: exZecimale, unghiuri: exGeometrie, arie: exArie,
};

const ARE_COMPARATIE: CapitolC5[] = ["puteri", "ordine", "fractii", "zecimale", "arie"];
function comparatie(rng: Rng, cap: CapitolC5, n: N): Nou | null {
  switch (cap) {
    case "puteri": return comparaPuteri(rng, n);
    case "ordine": return comparaOrdine(rng, n);
    case "fractii": return comparaFractii(rng, n);
    case "zecimale": return comparaZecimale(rng, n);
    case "arie": return comparaArie(rng, n);
    default: return null;
  }
}

function lipsa(rng: Rng, cap: CapitolC5, n: N): Nou | null {
  for (let k = 0; k < 30; k++) {
    const e = EX[cap](rng, n);
    if (e && (e.fel === "lipsa" || e.text.includes("□") || cap === "metode" || cap === "divizibilitate")) return { ...e, fel: e.fel === "exercitiu" && e.text.includes("□") ? "lipsa" : e.fel };
  }
  return null;
}

function pereche(rng: Rng, cap: CapitolC5, n: N): Nou | null {
  const e = EX[cap](rng, n);
  if (!e || e.desen?.tip === "tabel") return null;
  const st = e.fata ?? (e.text.length <= 32 ? e.text.replace(/ =$/, "").replace(/ = □.*$/, "") : null);
  if (!st) return null;
  const unit = e.text.match(/= □ (.+)$/)?.[1];
  const dr = e.raspuns.tip === "numar" ? `${fmt(e.raspuns.valoare)}${unit ? ` ${unit}` : e.afis.endsWith("°") ? "°" : e.afis.includes("cm") ? e.afis.replace(/^[\d ]+/, " ") : ""}` : e.raspuns.tip === "varianta" ? e.afis : null;
  if (!dr) return null;
  return { ...e, fel: "pereche", st: { text: st }, dr: { text: dr }, afis: dr, raspuns: { tip: "pereche" }, desen: undefined, figura: undefined };
}

const FEL: Record<JocC4, FelItem> = { sprint: "exercitiu", memory: "pereche", balanta: "comparatie", detectiv: "lipsa", constructor: "vizual" };

function itemNou(rng: Rng, cap: CapitolC5, n: N, fel: FelItem): Nou | null {
  switch (fel) {
    case "pereche": return pereche(rng, cap, n);
    case "comparatie": return ARE_COMPARATIE.includes(cap) ? comparatie(rng, cap, n) : EX[cap](rng, n);
    case "lipsa": return lipsa(rng, cap, n) ?? EX[cap](rng, n);
    case "vizual": return cap === "arie" ? constructorArie(rng, n) : EX[cap](rng, n);
    default: return EX[cap](rng, n);
  }
}

export interface SesiuneC5 { itemi: ItemC5[]; avertismente: string[] }
const INCERCARI = 300;

/** Exercițiile unei sesiuni (joc sau fișă), deterministe: același cod → aceleași exerciții. */
export function genereazaC5(cfg: ConfigC5): SesiuneC5 {
  const capitole = cfg.capitole.length ? cfg.capitole : (["puteri"] as CapitolC5[]);
  const fel = FEL[cfg.joc];
  const ordine = new Rng(hash(cfg.seed, 51)).shuffle(capitole);
  const itemi: ItemC5[] = [];
  const vazute = new Set<string>();
  let duplicate = 0;
  const total = Math.max(1, Math.min(100, Math.floor(cfg.nr)));
  for (let i = 0; i < total; i++) {
    const baza = hash(cfg.seed, i, cfg.inlocuiri?.[`i${i}`] ?? 0);
    const nivel: N = cfg.nivel === "amestecat" ? (new Rng(hash(baza, 99)).bool() ? 1 : 2) : cfg.nivel === "2" ? 2 : 1;
    // dacă un capitol nu are itemi pentru jocul ales, încercăm celelalte capitole alese
    const candidati = [ordine[i % ordine.length], ...ordine.filter((c) => c !== ordine[i % ordine.length])];
    let ales: Nou | null = null, rezerva: Nou | null = null;
    for (const cap of candidati) {
      for (let k = 0; k < INCERCARI && !ales; k++) {
        const e = itemNou(new Rng(hash(baza, k, cap.length)), cap, nivel, fel);
        if (!e) continue;
        const chei = [e.cheie, ...(fel === "pereche" ? [`f:${e.st?.text}`, `f:${e.dr?.text}`] : [])];
        if (chei.every((c) => !vazute.has(c))) { ales = e; chei.forEach((c) => vazute.add(c)); }
        else rezerva ??= e;
      }
      if (ales) break;
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
  if (fel === "vizual" && !capitole.includes("arie")) avertismente.push(`Constructorul lucrează cu „${NUME_CAPITOL_C5.arie}”: bifează acest capitol.`);
  if (duplicate) avertismente.push(`${duplicate} exerciții se repetă: alege mai multe capitole sau celălalt nivel.`);
  if (itemi.length < total) avertismente.push(`Am putut genera doar ${itemi.length} din ${total} exerciții cu opțiunile alese.`);
  return { itemi, avertismente };
}

export const verificaC5 = (item: Pick<ItemC5, "raspuns">, dat: string) => verificaC3(item as { raspuns: RaspunsC3 }, dat);
