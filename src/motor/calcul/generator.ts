import { Rng } from "@/motor/rng";
import type { Bloc, ConfigCalcul, ExCalcul, OpSimbol, VariantaMentala } from "./tipuri";
import { NR_MAX } from "./tipuri";

/** Format românesc: grupe de câte trei cifre separate prin spațiu, de la 10 000 în sus. */
export function fmt(n: number): string {
  const s = String(Math.abs(n));
  const g = Math.abs(n) >= 10000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : s;
  return n < 0 ? `−${g}` : g;
}

/** amestec de întregi → seed (determinist) */
export function hash(...xs: number[]): number {
  let h = 0x811c9dc5;
  for (const x of xs) {
    h = Math.imul(h ^ (x >>> 0), 0x01000193);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

const cifre = (n: number) => String(n).split("").reverse().map(Number);

/** există o coloană în care suma cifrelor (fără transport) depășește 9 → adunarea are trecere peste ordin */
export function areTrecereAdunare(termeni: number[]): boolean {
  const c = termeni.map(cifre);
  const L = Math.max(...c.map((x) => x.length));
  for (let i = 0; i < L; i++) if (c.reduce((s, x) => s + (x[i] ?? 0), 0) >= 10) return true;
  return false;
}

/** există o coloană în care cifra descăzutului e mai mică decât a scăzătorului → scăderea are împrumut */
export function areTrecereScadere(a: number, b: number): boolean {
  const ca = cifre(a), cb = cifre(b);
  return cb.some((d, i) => (ca[i] ?? 0) < d);
}

/**
 * Evaluează exact o expresie ASCII cu numere naturale, + - * / și paranteze.
 * Întoarce null dacă o împărțire nu e exactă, se împarte la 0 sau un rezultat parțial e negativ (cu `nenegativ`).
 */
export function evalueaza(expr: string, nenegativ = true): number | null {
  const t = expr.match(/\d+|[-+*/()]/g) ?? [];
  let i = 0;
  let ok = true;
  const verif = (v: number) => {
    if (nenegativ && v < 0) ok = false;
    return v;
  };
  const factor = (): number => {
    const x = t[i++];
    if (x === "(") {
      const v = suma();
      i++; // ")"
      return v;
    }
    return Number(x);
  };
  const produs = (): number => {
    let v = factor();
    while (t[i] === "*" || t[i] === "/") {
      const op = t[i++];
      const w = factor();
      if (op === "*") v = v * w;
      else {
        if (w === 0 || v % w !== 0) ok = false;
        v = w === 0 ? 0 : Math.trunc(v / w);
      }
    }
    return v;
  };
  const suma = (): number => {
    let v = produs();
    while (t[i] === "+" || t[i] === "-") {
      const op = t[i++];
      const w = produs();
      v = verif(op === "+" ? v + w : v - w);
    }
    return v;
  };
  const v = suma();
  return ok && i === t.length ? v : null;
}

type Partial = Omit<ExCalcul, "id" | "bloc" | "tip" | "duplicat">;
interface Ctx { x: string; nec: string }

function adunare(rng: Rng, b: Bloc): Partial | null {
  const k = Math.min(4, Math.max(2, b.termeni ?? 2));
  const t: number[] = [];
  let buget = b.rezultatInInterval ? b.max : Infinity;
  for (let i = 0; i < k; i++) {
    const hi = Math.min(b.max, buget - (k - 1 - i) * b.min);
    if (hi < b.min) return null;
    const v = rng.int(b.min, hi);
    t.push(v);
    buget -= v;
  }
  const s = t.reduce((x, y) => x + y, 0);
  if (b.trecere === "fara" && areTrecereAdunare(t)) return null;
  if (b.trecere === "cu" && !areTrecereAdunare(t)) return null;
  if (t.every((v) => v === 0)) return null;
  const text = `${t.map(fmt).join(" + ")} =`;
  return {
    cheie: `+:${t.join("+")}`, text, raspuns: { tip: "numar", valoare: s }, expresie: t.join(" + "),
    ...(b.coloana && { coloana: { numere: t, op: "+" as OpSimbol } }),
  };
}

function scadere(rng: Rng, b: Bloc): Partial | null {
  const a = rng.int(b.min, b.max);
  const sc = b.negative ? rng.int(b.min, b.max) : rng.int(b.min, a);
  if (b.negative && a >= sc && rng.bool(0.6)) return null; // la negative, majoritatea rezultatelor sub 0
  if (!b.negative && b.trecere === "fara" && areTrecereScadere(a, sc)) return null;
  if (!b.negative && b.trecere === "cu" && !areTrecereScadere(a, sc)) return null;
  if (a === 0 && sc === 0) return null;
  return {
    cheie: `-:${a}-${sc}`, text: `${fmt(a)} − ${fmt(sc)} =`, raspuns: { tip: "numar", valoare: a - sc }, expresie: `${a} - ${sc}`,
    ...(b.coloana && !b.negative && { coloana: { numere: [a, sc], op: "-" as OpSimbol } }),
  };
}

function inmultire(rng: Rng, b: Bloc, c: Ctx): Partial | null {
  let a: number, f: number;
  if (b.tabele?.length) {
    f = rng.pick(b.tabele);
    a = rng.int(Math.max(0, Math.min(b.min, 10)), 10);
    if (rng.bool()) [a, f] = [f, a];
  } else {
    a = rng.int(b.min, b.max);
    f = rng.int(b.min2 ?? 2, b.max2 ?? 10);
  }
  const p = a * f;
  if (b.rezultatInInterval && !b.tabele?.length && p > b.max) return null;
  return {
    cheie: `x:${a}x${f}`, text: `${fmt(a)} ${c.x} ${fmt(f)} =`, raspuns: { tip: "numar", valoare: p }, expresie: `${a} * ${f}`,
    ...(b.coloana && { coloana: { numere: a >= f ? [a, f] : [f, a], op: "×" as OpSimbol } }),
  };
}

function impartire(rng: Rng, b: Bloc): Partial | null {
  const d = b.tabele?.length ? rng.pick(b.tabele.filter((x) => x > 0)) : rng.int(Math.max(1, b.min2 ?? 2), Math.max(1, b.max2 ?? 10));
  if (!d) return null;
  const cuRest = b.rest === "cu-rest" || (b.rest === "amestecat" && rng.bool());
  let n: number;
  if (b.tabele?.length) {
    n = cuRest ? rng.int(d + 1, d * 10 + d - 1) : d * rng.int(Math.min(b.min, 10) || 0, 10);
  } else if (!cuRest) {
    const qmin = Math.ceil(b.min / d), qmax = Math.floor(b.max / d);
    if (qmax < qmin) return null;
    n = d * rng.int(qmin, qmax);
  } else {
    n = rng.int(Math.max(b.min, d + 1), b.max);
  }
  const q = Math.floor(n / d), r = n % d;
  if (cuRest && r === 0) return null;
  if (!cuRest && r !== 0) return null;
  return {
    cheie: `:${n}:${d}`, text: `${fmt(n)} : ${fmt(d)} =`,
    raspuns: cuRest ? { tip: "rest", cat: q, rest: r } : { tip: "numar", valoare: q },
    expresie: `${n} / ${d}`,
  };
}

function combinate(rng: Rng, b: Bloc, c: Ctx): Partial | null {
  const ops = (b.operatii?.length ? b.operatii : (["+", "-", "×", ":"] as OpSimbol[]));
  const k = Math.min(3, Math.max(2, b.nrOperatii ?? 2));
  const o: OpSimbol[] = Array.from({ length: k }, () => rng.pick(ops));
  if (ops.length > 1 && o.every((x) => x === o[0])) return null; // variație: nu doar aceeași operație
  const mic = () => rng.int(Math.max(2, b.min2 ?? 2), Math.max(2, b.max2 ?? 10));
  const n: number[] = Array.from({ length: k + 1 }, (_, i) => {
    const vecini = [o[i - 1], o[i]];
    return vecini.some((x) => x === "×" || x === ":") ? mic() : rng.int(Math.max(1, b.min), Math.max(1, b.max));
  });
  // deîmpărțit „curat”: dacă în stânga lui „:” e un număr simplu, îl facem multiplu al împărțitorului
  for (let i = 0; i < k; i++) if (o[i] === ":" && o[i - 1] !== "×" && o[i - 1] !== ":") n[i] = n[i + 1] * rng.int(2, 10);
  // paranteze: grupăm 2 numere vecine (sau 3, la 3 operații) acolo unde schimbă ordinea efectuării
  let p: [number, number] | null = null;
  if (b.paranteze) {
    const lung = k === 3 && rng.bool(0.3) ? 2 : 1;
    const st = rng.int(0, k - lung);
    p = [st, st + lung];
  }
  const scrie = (afis: boolean, cuParanteze = true) => {
    let s = "";
    for (let i = 0; i <= k; i++) {
      if (cuParanteze && p && p[0] === i) s += "(";
      s += afis ? fmt(n[i]) : String(n[i]);
      if (cuParanteze && p && p[1] === i) s += ")";
      if (i < k) s += afis ? ` ${o[i] === "×" ? c.x : o[i] === "-" ? "−" : o[i]} ` : ` ${o[i] === "×" ? "*" : o[i] === ":" ? "/" : o[i]} `;
    }
    return s;
  };
  const expresie = scrie(false);
  const v = evalueaza(expresie);
  if (v === null) return null;
  // parantezele trebuie să schimbe ordinea efectuării (altfel sunt de prisos)
  if (p && evalueaza(scrie(false, false), false) === v) return null;
  if (b.rezultatInInterval && v > b.max) return null;
  return { cheie: `c:${expresie}`, text: `${scrie(true)} =`, raspuns: { tip: "numar", valoare: v }, expresie };
}

function ecuatie(rng: Rng, b: Bloc, c: Ctx): Partial | null {
  const ops = (b.operatii?.length ? b.operatii : (["+", "-"] as OpSimbol[]));
  const op = rng.pick(ops);
  const N = c.nec;
  const mic = () => (b.tabele?.length ? rng.pick(b.tabele) : rng.int(Math.max(1, b.min2 ?? 2), Math.max(1, b.max2 ?? 10)));
  let text: string, expresie: string, x: number;
  switch (op) {
    case "+": {
      x = rng.int(b.min, b.max);
      const a = rng.int(b.min, b.max);
      if (b.rezultatInInterval && x + a > b.max) return null;
      const stanga = rng.bool();
      text = stanga ? `${N} + ${fmt(a)} = ${fmt(x + a)}` : `${fmt(a)} + ${N} = ${fmt(x + a)}`;
      expresie = stanga ? `x + ${a} = ${x + a}` : `${a} + x = ${x + a}`;
      break;
    }
    case "-": {
      if (rng.bool()) {
        // x − a = r
        const a = rng.int(b.min, b.max), r = rng.int(b.min, b.max);
        x = a + r;
        if (b.rezultatInInterval && x > b.max) return null;
        text = `${N} − ${fmt(a)} = ${fmt(r)}`;
        expresie = `x - ${a} = ${r}`;
      } else {
        // a − x = r
        const a = rng.int(b.min, b.max);
        x = rng.int(b.min, a);
        text = `${fmt(a)} − ${N} = ${fmt(a - x)}`;
        expresie = `${a} - x = ${a - x}`;
      }
      break;
    }
    case "×": {
      const a = mic();
      x = b.tabele?.length ? rng.int(0, 10) : rng.int(b.min, b.max);
      if (a === 0 || (b.rezultatInInterval && !b.tabele?.length && a * x > b.max)) return null;
      const stanga = rng.bool();
      text = stanga ? `${N} ${c.x} ${fmt(a)} = ${fmt(a * x)}` : `${fmt(a)} ${c.x} ${N} = ${fmt(a * x)}`;
      expresie = stanga ? `x * ${a} = ${a * x}` : `${a} * x = ${a * x}`;
      if (x === 0) return null; // evităm cazul banal x = 0
      break;
    }
    default: {
      const a = mic();
      if (a === 0) return null;
      const q = b.tabele?.length ? rng.int(1, 10) : rng.int(Math.max(1, Math.ceil(b.min / a)), Math.max(1, Math.floor(b.max / a)));
      if (rng.bool()) {
        // x : a = q
        x = a * q;
        text = `${N} : ${fmt(a)} = ${fmt(q)}`;
        expresie = `x / ${a} = ${q}`;
      } else {
        // n : x = q  (x = a)
        x = a;
        text = `${fmt(a * q)} : ${N} = ${fmt(q)}`;
        expresie = `${a * q} / x = ${q}`;
      }
    }
  }
  return { cheie: `e:${expresie}`, text, inainte: `${N} =`, raspuns: { tip: "numar", valoare: x }, expresie };
}

function mental(rng: Rng, b: Bloc, c: Ctx): Partial | null {
  const v: VariantaMentala = rng.pick(b.variante?.length ? b.variante : (["x10", "impartire10", "rotunde", "dublu", "complement"] as VariantaMentala[]));
  const lo = Math.max(1, b.min), hi = Math.max(lo, b.max);
  switch (v) {
    case "x10": {
      const a = rng.int(lo, Math.min(hi, 999)), p = rng.pick([10, 100, 1000]);
      return { cheie: `m:${a}x${p}`, text: `${fmt(a)} ${c.x} ${fmt(p)} =`, raspuns: { tip: "numar", valoare: a * p }, expresie: `${a} * ${p}` };
    }
    case "impartire10": {
      const a = rng.int(lo, Math.min(hi, 999)), p = rng.pick([10, 100, 1000]);
      return { cheie: `m:${a * p}:${p}`, text: `${fmt(a * p)} : ${fmt(p)} =`, raspuns: { tip: "numar", valoare: a }, expresie: `${a * p} / ${p}` };
    }
    case "rotunde": {
      const pas = hi >= 1000 ? rng.pick([10, 100]) : 10;
      const a = rng.int(lo, hi), r = pas * rng.int(1, 9);
      const plus = rng.bool();
      const rez = plus ? a + r : a - r;
      if (rez < 0 || (b.rezultatInInterval && rez > b.max)) return null;
      return { cheie: `m:${a}${plus ? "+" : "-"}${r}`, text: `${fmt(a)} ${plus ? "+" : "−"} ${fmt(r)} =`, raspuns: { tip: "numar", valoare: rez }, expresie: `${a} ${plus ? "+" : "-"} ${r}` };
    }
    case "dublu": {
      const a = rng.int(lo, Math.min(hi, 5000));
      return rng.bool()
        ? { cheie: `m:d${a}`, text: `Dublul lui ${fmt(a)} este`, raspuns: { tip: "numar", valoare: 2 * a }, expresie: `2 * ${a}` }
        : { cheie: `m:j${2 * a}`, text: `Jumătatea lui ${fmt(2 * a)} este`, raspuns: { tip: "numar", valoare: a }, expresie: `${2 * a} / 2` };
    }
    default: {
      const p = rng.pick([10, 100, 1000].filter((x) => x <= Math.max(10, hi)));
      const a = rng.int(1, p - 1);
      return { cheie: `m:c${a}-${p}`, text: `${fmt(a)} + … = ${fmt(p)}`, inainte: "… =", raspuns: { tip: "numar", valoare: p - a }, expresie: `${a} + x = ${p}` };
    }
  }
}

function exercitiuBloc(rng: Rng, b: Bloc, c: Ctx): Partial | null {
  switch (b.tip) {
    case "adunare": return adunare(rng, b);
    case "scadere": return scadere(rng, b);
    case "inmultire": return inmultire(rng, b, c);
    case "impartire": return impartire(rng, b);
    case "combinate": return combinate(rng, b, c);
    case "ecuatii": return ecuatie(rng, b, c);
    case "mental": return mental(rng, b, c);
  }
}

/** 0 printre numere, înmulțire/împărțire cu 1, a − a sau a : a */
export function banal(e: Pick<ExCalcul, "expresie">): boolean {
  const n = (e.expresie.match(/\d+/g) ?? []).map(Number);
  if (n.includes(0)) return true;
  if (/(^|[*/] )1( |$)|^1 \*/.test(e.expresie)) return true;
  const m = e.expresie.match(/^(\d+) [-/] (\d+)$/);
  return Boolean(m && m[1] === m[2]);
}

/** Încercări pentru un exercițiu nou (diferit de cele de dinainte) înainte să acceptăm o repetare. */
const INCERCARI = 400;

export interface RezultatCalcul {
  exercitii: ExCalcul[];
  avertismente: string[];
}

/** Numărul total de exerciții, limitat la NR_MAX. */
export const totalExercitii = (cfg: Pick<ConfigCalcul, "blocuri">) => cfg.blocuri.reduce((s, b) => s + Math.max(0, b.nr), 0);

/**
 * Generează fișa. Fiecare exercițiu depinde doar de (seed, bloc, poziție, variantă),
 * deci regenerarea unui exercițiu nu le schimbă pe celelalte.
 */
export function genereazaCalcul(cfg: ConfigCalcul): RezultatCalcul {
  const ctx: Ctx = { x: cfg.simbolInmultire ?? "×", nec: cfg.necunoscuta ?? "□" };
  const out: ExCalcul[] = [];
  const avertismente: string[] = [];
  const vazute = new Set<string>();
  let ramase = NR_MAX;
  cfg.blocuri.forEach((b, bi) => {
    const nr = Math.min(Math.max(0, Math.floor(b.nr)), ramase);
    ramase -= nr;
    let duplicate = 0, imposibile = 0;
    for (let j = 0; j < nr; j++) {
      const id = `b${bi}-${j}`;
      const baza = hash(cfg.seed, bi, j, cfg.inlocuiri?.[id] ?? 0);
      let ales: Partial | null = null;
      let rezerva: Partial | null = null;
      for (let k = 0; k < INCERCARI && !ales; k++) {
        const r = new Rng(hash(baza, k));
        const e = exercitiuBloc(r, b, ctx);
        if (!e) continue;
        // exercițiile banale (cu 0, × 1, a − a) apar rar; acceptate doar dacă intervalul nu permite altceva
        if (k < INCERCARI / 2 && banal(e) && r.bool(0.9)) continue;
        if (!vazute.has(e.cheie)) ales = e;
        else rezerva ??= e;
      }
      const e = ales ?? rezerva;
      if (!e) {
        imposibile++;
        continue;
      }
      if (!ales) duplicate++;
      vazute.add(e.cheie);
      out.push({ ...e, id, bloc: bi, tip: b.tip, ...(!ales && { duplicat: true }) });
    }
    if (imposibile) avertismente.push(`Blocul ${bi + 1}: nu există exerciții care să respecte toate condițiile alese (${imposibile} lipsesc). Lărgește intervalul sau schimbă condițiile.`);
    else if (duplicate) avertismente.push(`Blocul ${bi + 1}: intervalul permite puține exerciții diferite, așa că ${duplicate} se repetă.`);
  });
  if (totalExercitii(cfg) > NR_MAX) avertismente.push(`O fișă are cel mult ${NR_MAX} de exerciții; am păstrat primele ${NR_MAX}.`);
  if (cfg.amesteca && out.length > 1) {
    const ordine = new Rng(hash(cfg.seed, 0xa11e5)).shuffle(out.map((_, i) => i));
    return { exercitii: ordine.map((i) => out[i]), avertismente };
  }
  return { exercitii: out, avertismente };
}

/** Răspunsul ca text (pentru barem, CSV, DOCX). */
export function textRaspuns(e: ExCalcul): string {
  return e.raspuns.tip === "rest" ? `${fmt(e.raspuns.cat)} rest ${fmt(e.raspuns.rest)}` : fmt(e.raspuns.valoare);
}

/** Verifică răspunsul unui elev (online). */
export function corect(e: ExCalcul, dat: { valoare?: string; cat?: string; rest?: string }): boolean {
  const n = (s?: string) => {
    const t = String(s ?? "").replace(/[\s.]/g, "").replace("−", "-");
    return /^-?\d+$/.test(t) ? Number(t) : NaN;
  };
  if (e.raspuns.tip === "rest") return n(dat.cat) === e.raspuns.cat && n(dat.rest) === e.raspuns.rest;
  return n(dat.valoare) === e.raspuns.valoare;
}

/** Coloanele fișei: alese de profesor sau automat după numărul de exerciții și lățimea lor. */
export function coloaneFisa(cfg: Pick<ConfigCalcul, "coloane">, ex: ExCalcul[]): 2 | 3 | 4 {
  if (cfg.coloane !== "auto") return cfg.coloane;
  // lățimea unui exercițiu pe fișă, în caractere (cu linia de răspuns)
  const lung = Math.max(0, ...ex.map((e) => (e.coloana ? 8 : e.text.length + (e.inainte ? e.inainte.length + 1 : 0) + (e.raspuns.tip === "rest" ? 12 : 0))));
  const n = ex.length;
  let c: 2 | 3 | 4 = n <= 12 ? 2 : n <= 30 ? 3 : 4;
  if (lung > 26) c = 2;
  else if (lung > 17 && c === 4) c = 3;
  return c;
}
