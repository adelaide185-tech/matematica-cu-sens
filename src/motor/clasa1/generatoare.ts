/**
 * Generatoarele clasei I. Funcții pure: (rng, context) → exercițiu.
 * Reguli verificate prin teste (src/motor/clasa1/clasa1.test.ts):
 *  - toate numerele (date, intermediare, rezultate) sunt în concentrul cerut, fără negative;
 *  - „fără trecere”: suma unităților ≤ 9 la adunare; unitățile descăzutului ≥ unitățile scăzătorului la scădere;
 *  - „cu trecere”: invers (unitățile trec de 9 / e nevoie de împrumut).
 */
import type { Rng } from "@/motor/rng";
import type { Mecanica, Raspuns, RelatieSpatiala, FormaPlana, Corp } from "@/antrenament/tipuri";
import { cuSubstantiv } from "@/motor/limba";
import { textRelatie } from "@/antrenament/mecanici/MecaniciC1";
import type { CalculC1, CapitolC1, EcranC1, ExercitiuC1, FisaC1, FormaTermen, JocC1, OpC1, OptiuniC1, SubtemaBani, SubtemaGeometrie, SubtemaNumere, SubtemaTimp } from "./tipuri";

export interface CtxC1 {
  o: OptiuniC1;
  suportVizual: boolean;
  /** jocurile permise de profesor */
  jocuri: JocC1[];
}

const MINUS = "−";
const semn = (op: OpC1) => (op === "+" ? "+" : MINUS);

/** Alege ecranul: primul joc compatibil și permis (aleator între ele), altfel ecranul general. */
function ecran(rng: Rng, ctx: CtxC1, compatibile: JocC1[]): EcranC1 {
  const ok = compatibile.filter((j) => ctx.jocuri.includes(j));
  return ok.length ? rng.pick(ok) : "intrebare";
}

/** Variante de răspuns: corectul + distractori distincți, amestecate. */
function variante(rng: Rng, corect: string, distractori: string[], k = 4): string[] {
  const d = [...new Set(distractori.filter((x) => x !== corect))];
  return rng.shuffle([corect, ...rng.shuffle(d).slice(0, k - 1)]);
}

interface Baza {
  capitol: CapitolC1;
  cheie: string;
  fapt?: string;
  enunt: string;
  mecanica: Mecanica;
  raspuns: Raspuns;
  indicii: [string, string, string];
  dificultate: number;
  ecran: EcranC1;
  fisa: FisaC1;
  numere: number[];
  pereche?: ExercitiuC1["pereche"];
  calcule?: CalculC1[];
}
const ex = (b: Baza): ExercitiuC1 => ({
  subiectId: `c1.${b.capitol}`,
  cheie: `c1.${b.cheie}`,
  fapt: b.fapt ?? b.cheie,
  enunt: b.enunt,
  mecanica: b.mecanica,
  raspuns: b.raspuns,
  indicii: b.indicii,
  dificultate: b.dificultate,
  capitol: b.capitol,
  ecran: b.ecran,
  fisa: b.fisa,
  numere: b.numere,
  pereche: b.pereche,
  calcule: b.calcule,
});

// ═════════════ adunare și scădere (folosite și de balanță și de probleme) ═════════════

const unit = (n: number) => n % 10;
export const areTrecere = (a: number, b: number, op: OpC1) => (op === "+" ? unit(a) + unit(b) >= 10 : unit(a) < unit(b));

/**
 * Un calcul a ± b în concentrul [0, max], cu sau fără trecere peste ordin.
 * La 0–100, primul termen are două cifre (altfel calculul ar fi de 0–20).
 */
export function calcul(rng: Rng, max: 20 | 100, op: OpC1, cuTrecere: boolean): CalculC1 {
  for (let g = 0; g < 2000; g++) {
    let a: number, b: number;
    if (op === "+") {
      a = max === 20 ? rng.int(1, 19) : rng.int(10, 98);
      b = rng.int(1, max - a);
    } else {
      a = max === 20 ? rng.int(cuTrecere ? 11 : 2, 20) : rng.int(cuTrecere ? 20 : 11, 100);
      b = rng.int(1, a - (max === 100 && !cuTrecere ? 0 : 1));
      // la 0–100, „zeci − zeci” rămâne posibil (60 − 20), dar scăzătorul nu poate fi egal cu descăzutul
      if (b >= a) continue;
    }
    // la 0–100, variem forma: ZU ± U, ZU ± Z0, ZU ± ZU, Z0 ± Z0
    if (max === 100 && rng.bool(0.2) && !cuTrecere) {
      a = Math.max(10, Math.floor(a / 10) * 10);
      b = Math.max(10, Math.floor(b / 10) * 10);
      if (op === "+" && a + b > 100) continue;
      if (op === "-" && b >= a) continue;
    }
    const r = op === "+" ? a + b : a - b;
    if (r < 0 || r > max || a > max || b > max) continue;
    if (areTrecere(a, b, op) !== cuTrecere) continue;
    return { a, b, op, trecere: cuTrecere, max, cerut: cuTrecere ? "cu" : "fara" };
  }
  throw new Error(`Nu pot genera ${op} în 0–${max} ${cuTrecere ? "cu" : "fără"} trecere`);
}

export const rezultat = (c: Pick<CalculC1, "a" | "b" | "op">) => (c.op === "+" ? c.a + c.b : c.a - c.b);
const textCalcul = (c: Pick<CalculC1, "a" | "b" | "op">) => `${c.a} ${semn(c.op)} ${c.b}`;

function indiciiCalcul(c: CalculC1): [string, string, string] {
  const r = rezultat(c);
  if (c.op === "+") {
    const pana10 = 10 - unit(c.a);
    return [
      c.trecere ? `Completează întâi până la zece: ${c.a} + ${pana10} = ${c.a + pana10}.` : `Adună întâi unitățile: ${unit(c.a)} + ${unit(c.b)} = ${unit(c.a) + unit(c.b)}.`,
      c.trecere ? `Din ${c.b} ai folosit ${pana10}; mai adaugi ${c.b - pana10}.` : `Apoi zecile: ${c.a - unit(c.a)} + ${c.b - unit(c.b)} = ${c.a - unit(c.a) + c.b - unit(c.b)}.`,
      `${textCalcul(c)} = ${r}.`,
    ];
  }
  return [
    c.trecere ? `Scade întâi până la zece: ${c.a} ${MINUS} ${unit(c.a)} = ${c.a - unit(c.a)}.` : `Scade întâi unitățile: ${unit(c.a)} ${MINUS} ${unit(c.b)} = ${unit(c.a) - unit(c.b)}.`,
    c.trecere ? `Din ${c.b} ai scăzut ${unit(c.a)}; mai scazi ${c.b - unit(c.a)}.` : `Apoi zecile: ${c.a - unit(c.a)} ${MINUS} ${c.b - unit(c.b)} = ${c.a - unit(c.a) - (c.b - unit(c.b))}.`,
    `${textCalcul(c)} = ${r}.`,
  ];
}

function alegeCalcul(rng: Rng, max: 20 | 100, o: { trecere: "fara" | "cu" | "ambele"; operatii: OpC1[] }): CalculC1 {
  const op = rng.pick(o.operatii.length ? o.operatii : (["+", "-"] as OpC1[]));
  const cu = o.trecere === "cu" ? true : o.trecere === "fara" ? false : rng.bool();
  return calcul(rng, max, op, cu);
}

function exAdSc(rng: Rng, ctx: CtxC1, max: 20 | 100): ExercitiuC1 {
  const capitol: CapitolC1 = max === 20 ? "adsc20" : "adsc100";
  const o = max === 20 ? ctx.o.adsc20 : ctx.o.adsc100;
  const e = ecran(rng, ctx, ["cursa", "perechi", "casuta", "balanta"]);
  const c = alegeCalcul(rng, max, o);
  const r = rezultat(c);
  const txt = textCalcul(c);
  const vizual: Mecanica = ctx.suportVizual
    ? max === 20 ? { tip: "cadru10", a: c.a, b: c.b, operatie: c.op === "+" ? "+" : "−" } : { tip: "coloana", a: c.a, b: c.b, operatie: c.op === "+" ? "+" : "−" }
    : { tip: "expresie", text: `${txt} = ?` };
  const dif = (max === 20 ? 2 : 4) + (c.trecere ? 2 : 0);

  if (e === "balanta") {
    // comparăm calculul cu un număr sau cu alt calcul de același fel
    const alt = rng.bool(0.5) ? alegeCalcul(rng, max, o) : null;
    const rd = alt ? rezultat(alt) : rng.bool(0.3) ? r : Math.max(0, Math.min(max, r + rng.pick([-3, -2, -1, 1, 2, 3])));
    const dreapta = alt ? textCalcul(alt) : String(rd);
    const s = r < rd ? "<" : r > rd ? ">" : "=";
    return ex({
      capitol, cheie: `as${max}.cmp:${txt}|${dreapta}`, fapt: `as${max}:${txt}`, ecran: e, dificultate: dif + 1,
      enunt: "Ce semn pui între cele două părți ale balanței?",
      mecanica: { tip: "balanta", stanga: txt, dreapta, valStanga: r, valDreapta: rd },
      raspuns: { tip: "optiune", valoare: s, optiuni: ["<", "=", ">"] },
      indicii: [`Calculează întâi: ${txt} = ?`, alt ? `Calculează și partea dreaptă: ${dreapta} = ?` : `Compară rezultatul cu ${rd}.`, `${txt} = ${r} și ${dreapta}${alt ? ` = ${rd}` : ""}, deci ${txt} ${s} ${dreapta}.`],
      fisa: { cerinta: "Pune semnul <, > sau =:", text: `${txt} ___ ${dreapta}`, raspuns: s },
      numere: [c.a, c.b, r, rd, ...(alt ? [alt.a, alt.b] : [])],
      calcule: alt ? [c, alt] : [c],
    });
  }
  return ex({
    capitol, cheie: `as${max}:${txt}`, ecran: e, dificultate: dif,
    enunt: `${txt} = ?`,
    mecanica: e === "perechi" ? { tip: "expresie", text: txt } : vizual,
    raspuns: { tip: "numar", valoare: r },
    indicii: indiciiCalcul(c),
    fisa: { cerinta: "Calculează:", text: `${txt} = ___`, raspuns: String(r) },
    numere: [c.a, c.b, r],
    calcule: [c],
    pereche: e === "perechi" ? { stanga: txt, dreapta: String(r) } : undefined,
  });
}

// ═════════════ termenul necunoscut ═════════════

function exTermen(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const max = ctx.o.termen.max;
  const forma: FormaTermen = rng.pick(ctx.o.termen.forme.length ? ctx.o.termen.forme : (["a+x=b"] as FormaTermen[]));
  let a: number, x: number, b: number, stanga: string, cauta: string;
  switch (forma) {
    case "a+x=b":
      a = rng.int(1, max - 1); x = rng.int(1, max - a); b = a + x;
      stanga = `${a} + □`; cauta = `Câte îi trebuie lui ${a} ca să ajungă la ${b}?`; break;
    case "x+a=b":
      a = rng.int(1, max - 1); x = rng.int(1, max - a); b = x + a;
      stanga = `□ + ${a}`; cauta = `Ce număr adunat cu ${a} dă ${b}?`; break;
    case "a-x=b":
      a = rng.int(2, max); x = rng.int(1, a - 1); b = a - x;
      stanga = `${a} ${MINUS} □`; cauta = `Cât scazi din ${a} ca să rămână ${b}?`; break;
    case "x-a=b":
      a = rng.int(1, max - 1); x = rng.int(a + 1, max); b = x - a;
      stanga = `□ ${MINUS} ${a}`; cauta = `Din ce număr scazi ${a} ca să rămână ${b}?`; break;
  }
  const proba = forma === "a+x=b" || forma === "x+a=b" ? `${b} ${MINUS} ${a} = ${x}` : forma === "a-x=b" ? `${a} ${MINUS} ${b} = ${x}` : `${b} + ${a} = ${x}`;
  const e = ecran(rng, ctx, ["casuta", "balanta"]);
  const text = `${stanga} = ${b}`;
  return ex({
    capitol: "termen", cheie: `tn:${forma}:${a}:${b}`, ecran: e, dificultate: max === 20 ? 4 : 6,
    enunt: e === "balanta" ? "Ce număr pui în locul semnului întrebării ca balanța să stea dreaptă?" : "Ce număr lipsește din căsuță?",
    mecanica: e === "balanta"
      ? { tip: "balanta", stanga: stanga.replace("□", "?"), dreapta: String(b), valStanga: b, valDreapta: b, necunoscut: "stanga" }
      : { tip: "expresie", text },
    raspuns: { tip: "numar", valoare: x },
    indicii: [cauta, `Poți afla numărul așa: ${proba.split("=")[0].trim()} = ?`, `${proba}. Verificare: ${text.replace("□", String(x))}.`],
    fisa: { cerinta: "Află numărul care lipsește:", text: text.replace("□", "___"), raspuns: String(x) },
    numere: [a, x, b],
  });
}

// ═════════════ numerele 0–100 ═════════════

function exNumere(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const sub: SubtemaNumere = rng.pick(ctx.o.numere.subteme.length ? ctx.o.numere.subteme : (["recunoastere"] as SubtemaNumere[]));
  const vizual = ctx.suportVizual;
  switch (sub) {
    case "recunoastere": {
      const n = rng.int(11, 99);
      const z = Math.floor(n / 10), u = n % 10;
      const e = ecran(rng, ctx, ["grupeaza", "perechi"]);
      if (e === "perechi") {
        return ex({
          capitol: "numere", cheie: `nr.rec.p:${n}`, fapt: `nr:${n}`, ecran: e, dificultate: 2,
          enunt: "Ce număr arată bețișoarele?", mecanica: { tip: "betisoare", zeci: z, unitati: u },
          raspuns: { tip: "numar", valoare: n },
          indicii: [`Numără mănunchiurile: fiecare are 10 bețișoare.`, `${z} mănunchiuri înseamnă ${z * 10}.`, `${z * 10} + ${u} = ${n}.`],
          fisa: { cerinta: "Ce număr arată bețișoarele?", text: "___", raspuns: String(n), mecanica: { tip: "betisoare", zeci: z, unitati: u } },
          numere: [n], pereche: { stanga: `${z} zeci și ${u} ${u === 1 ? "unitate" : "unități"}`, stangaMecanica: { tip: "betisoare", zeci: z, unitati: u }, dreapta: String(n) },
        });
      }
      const construieste = e === "grupeaza" ? rng.bool() : false;
      if (construieste) {
        return ex({
          capitol: "numere", cheie: `nr.rec.c:${n}`, fapt: `nr:${n}`, ecran: e, dificultate: 2,
          enunt: `Formează numărul ${n} din zeci și unități.`, mecanica: { tip: "blocuri", tinta: n, arata: "cifre", text: String(n) },
          raspuns: { tip: "construit", valoare: n },
          indicii: [`Cifra zecilor este ${z}: pune ${z} ${z === 1 ? "bară de zece" : "bare de câte zece"}.`, `Cifra unităților este ${u}: pune ${u} ${u === 1 ? "cub mic" : "cuburi mici"}.`, `${n} = ${z} zeci și ${u} unități.`],
          fisa: { cerinta: "Scrie câte zeci și câte unități are numărul:", text: `${n} =`, raspuns: `${z} zeci, ${u} unități`, campuri: ["zeci", "unități"] },
          numere: [n],
        });
      }
      return ex({
        capitol: "numere", cheie: `nr.rec.i:${n}`, fapt: `nr:${n}`, ecran: e, dificultate: 2,
        enunt: "Ce număr arată bețișoarele?", mecanica: { tip: "betisoare", zeci: z, unitati: u },
        raspuns: { tip: "numar", valoare: n },
        indicii: [`Numără mănunchiurile: fiecare are 10 bețișoare.`, `${z} mănunchiuri înseamnă ${z * 10}.`, `${z * 10} + ${u} = ${n}.`],
        fisa: { cerinta: "Ce număr arată bețișoarele?", text: "___", raspuns: String(n), mecanica: { tip: "betisoare", zeci: z, unitati: u } },
        numere: [n],
      });
    }
    case "numarare": {
      const p = rng.pick(ctx.o.numere.pasi.length ? ctx.o.numere.pasi : [1]);
      const lung = 6;
      const crescator = rng.bool(0.7);
      const maxStart = 100 - p * (lung - 1);
      let start = rng.int(0, maxStart);
      if (p === 5 || p === 10) start = Math.floor(start / p) * p;
      const sir = Array.from({ length: lung }, (_, i) => start + i * p);
      if (!crescator) sir.reverse();
      const poz = rng.int(1, lung - 1);
      const elemente = sir.map((v, i) => (i === poz ? null : v));
      return ex({
        capitol: "numere", cheie: `nr.sir:${p}:${start}:${crescator ? "c" : "d"}:${poz}`, fapt: `sir:${p}:${start}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: p === 1 ? 2 : 3,
        enunt: `Numără din ${p} în ${p}${crescator ? "" : " înapoi"}. Ce număr lipsește?`,
        mecanica: { tip: "sir", elemente },
        raspuns: { tip: "numar", valoare: sir[poz] },
        indicii: [`Fiecare număr este cu ${p} ${crescator ? "mai mare" : "mai mic"} decât cel dinainte.`, `Uită-te la numărul dinaintea locului gol: ${sir[poz - 1]}.`, `${sir[poz - 1]} ${crescator ? "+" : MINUS} ${p} = ${sir[poz]}.`],
        fisa: { cerinta: "Completează numărătoarea:", text: elemente.map((v) => (v === null ? "___" : String(v))).join(", "), raspuns: String(sir[poz]) },
        numere: sir,
      });
    }
    case "zeci-unitati": {
      const n = rng.int(10, 99);
      const z = Math.floor(n / 10), u = n % 10;
      const compune = rng.bool();
      const e = ecran(rng, ctx, compune ? ["grupeaza", "perechi", "casuta"] : ["grupeaza", "casuta"]);
      const textZU = `${z} ${z === 1 ? "zece" : "zeci"} și ${u} ${u === 1 ? "unitate" : "unități"}`;
      if (compune) {
        return ex({
          capitol: "numere", cheie: `nr.zu.c:${n}`, fapt: `nr:${n}`, ecran: e, dificultate: 2,
          enunt: `Ce număr are ${textZU}?`,
          mecanica: vizual && e !== "perechi" ? { tip: "betisoare", zeci: z, unitati: u } : { tip: "expresie", text: textZU },
          raspuns: { tip: "numar", valoare: n },
          indicii: [`${z} ${z === 1 ? "zece înseamnă" : "zeci înseamnă"} ${z * 10}.`, `Adaugă ${u} ${u === 1 ? "unitate" : "unități"}.`, `${z * 10} + ${u} = ${n}.`],
          fisa: { cerinta: "Scrie numărul:", text: `${textZU} = ___`, raspuns: String(n) },
          numere: [n], pereche: e === "perechi" ? { stanga: textZU, dreapta: String(n) } : undefined,
        });
      }
      return ex({
        capitol: "numere", cheie: `nr.zu.d:${n}`, fapt: `nr:${n}`, ecran: e, dificultate: 2,
        enunt: `Câte zeci și câte unități are numărul ${n}?`,
        mecanica: vizual ? { tip: "betisoare", zeci: z, unitati: u } : { tip: "expresie", text: String(n) },
        raspuns: { tip: "campuri", valori: [z, u], etichete: ["zeci", "unități"] },
        indicii: [`Prima cifră a lui ${n} arată zecile.`, `A doua cifră arată unitățile.`, `${n} = ${z} zeci și ${u} unități.`],
        fisa: { cerinta: "Scrie câte zeci și câte unități are numărul:", text: `${n} =`, raspuns: `${z} zeci, ${u} unități`, campuri: ["zeci", "unități"] },
        numere: [n],
      });
    }
    case "vecini": {
      const n = rng.int(1, 99);
      const fel = rng.pick(["inainte", "dupa", "ambii"] as const);
      const axa: Mecanica = vizual ? { tip: "axa", de: Math.max(0, n - 4), pana: Math.min(100, Math.max(0, n - 4) + 8), pas: 1, marcaj: n } : { tip: "expresie", text: String(n) };
      const base = { capitol: "numere" as const, fapt: `nr:${n}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: 2, mecanica: axa, numere: [n - 1, n, n + 1] };
      if (fel === "ambii") {
        return ex({
          ...base, cheie: `nr.vec.a:${n}`, enunt: `Care sunt vecinii numărului ${n}?`,
          raspuns: { tip: "campuri", valori: [n - 1, n + 1], etichete: ["înainte", "după"] },
          indicii: [`Vecinul dinainte este cu 1 mai mic.`, `Vecinul de după este cu 1 mai mare.`, `Vecinii lui ${n} sunt ${n - 1} și ${n + 1}.`],
          fisa: { cerinta: "Scrie vecinii numărului:", text: `vecinii lui ${n}:`, raspuns: `${n - 1} și ${n + 1}`, campuri: ["înainte", "după"] },
        });
      }
      const v = fel === "inainte" ? n - 1 : n + 1;
      return ex({
        ...base, cheie: `nr.vec.${fel}:${n}`,
        enunt: fel === "inainte" ? `Ce număr vine înainte de ${n}?` : `Ce număr vine după ${n}?`,
        raspuns: { tip: "numar", valoare: v },
        indicii: [fel === "inainte" ? "Numărul dinainte este cu 1 mai mic." : "Numărul de după este cu 1 mai mare.", `${n} ${fel === "inainte" ? MINUS : "+"} 1 = ?`, `${n} ${fel === "inainte" ? MINUS : "+"} 1 = ${v}.`],
        fisa: { cerinta: "Completează vecinul:", text: fel === "inainte" ? `___, ${n}` : `${n}, ___`, raspuns: String(v) },
      });
    }
    case "comparare": {
      const a = rng.int(0, 100);
      const b = rng.bool(0.2) ? a : rng.bool(0.5) ? Math.min(100, Math.max(0, a + rng.pick([-10, -9, -1, 1, 9, 10]))) : rng.int(0, 100);
      const s = a < b ? "<" : a > b ? ">" : "=";
      return ex({
        capitol: "numere", cheie: `nr.cmp:${a}:${b}`, fapt: `cmp:${Math.min(a, b)}:${Math.max(a, b)}`, ecran: ecran(rng, ctx, ["balanta"]), dificultate: 2,
        enunt: "Ce semn pui între cele două numere?",
        mecanica: { tip: "balanta", stanga: String(a), dreapta: String(b), valStanga: a, valDreapta: b },
        raspuns: { tip: "optiune", valoare: s, optiuni: ["<", "=", ">"] },
        indicii: ["Compară întâi zecile.", "Dacă zecile sunt egale, compară unitățile.", `${a} ${s} ${b}.`],
        fisa: { cerinta: "Pune semnul <, > sau =:", text: `${a} ___ ${b}`, raspuns: s },
        numere: [a, b],
      });
    }
    case "ordonare": {
      const numere = rng.distinct(4, () => rng.int(0, 100));
      const crescator = rng.bool();
      const sortat = [...numere].sort((x, y) => (crescator ? x - y : y - x));
      return ex({
        capitol: "numere", cheie: `nr.ord:${crescator ? "c" : "d"}:${[...numere].sort((x, y) => x - y).join(",")}`, ecran: "intrebare", dificultate: 3,
        enunt: crescator ? "Atinge numerele de la cel mai mic la cel mai mare." : "Atinge numerele de la cel mai mare la cel mai mic.",
        mecanica: { tip: "ordonare", numere, crescator },
        raspuns: { tip: "ordine", valori: sortat },
        indicii: [crescator ? "Caută întâi numărul cel mai mic." : "Caută întâi numărul cel mai mare.", "Compară zecile, apoi unitățile.", `Ordinea: ${sortat.join(", ")}.`],
        fisa: { cerinta: crescator ? "Ordonează crescător:" : "Ordonează descrescător:", text: `${numere.join(", ")} →`, raspuns: sortat.join(", ") },
        numere,
      });
    }
    case "par-impar": {
      const n = vizual && rng.bool(0.5) ? rng.int(2, 20) : rng.int(0, 100);
      const par = n % 2 === 0;
      return ex({
        capitol: "numere", cheie: `nr.par:${n}`, ecran: "intrebare", dificultate: 2,
        enunt: `Numărul ${n} este par sau impar?`,
        mecanica: vizual && n <= 20 ? { tip: "perechi", n, simbol: rng.pick(["🍎", "🎈", "🐟", "⭐"]) } : { tip: "expresie", text: String(n) },
        raspuns: { tip: "optiune", valoare: par ? "par" : "impar", optiuni: ["par", "impar"] },
        indicii: ["Un număr par se poate împărți în perechi, fără să rămână nimic.", `Uită-te la ultima cifră: ${n % 10}.`, `${n} este ${par ? "par" : "impar"}: ultima cifră ${n % 10} este ${par ? "pară" : "impară"}.`],
        fisa: { cerinta: "Încercuiește: par sau impar?", text: `${n}`, raspuns: par ? "par" : "impar", optiuni: ["par", "impar"] },
        numere: [n],
      });
    }
  }
}

// ═════════════ geometrie și orientare spațială ═════════════

const FIGURI: { forma: FormaPlana; nume: string; laturi: number }[] = [
  { forma: "cerc", nume: "cerc", laturi: 0 },
  { forma: "patrat", nume: "pătrat", laturi: 4 },
  { forma: "triunghi", nume: "triunghi", laturi: 3 },
  { forma: "dreptunghi", nume: "dreptunghi", laturi: 4 },
];
const CORPURI: { corp: Corp; nume: string; obiecte: string[] }[] = [
  { corp: "cub", nume: "cub", obiecte: ["🎲", "🧊", "📦"] },
  { corp: "sfera", nume: "sferă", obiecte: ["⚽", "🏀", "🍊", "🌍"] },
  { corp: "cilindru", nume: "cilindru", obiecte: ["🥫", "🕯️", "🥁"] },
];
const CULORI = ["#e0483e", "#2f6fd1", "#2e9e5b", "#f2a20c", "#6a59a7"];
const NUME_CULORI: Record<string, string> = { "#e0483e": "roșu", "#2f6fd1": "albastru", "#2e9e5b": "verde", "#f2a20c": "galben", "#6a59a7": "mov" };

const REPERE = ["🏠", "🌳", "🚗", "🪑", "🛏️", "⛺"];
const OBIECTE = ["🐱", "🐶", "⚽", "🎈", "🐦", "🐞", "🧸", "🍎"];
const NUME_OBIECTE: Record<string, string> = { "🐱": "pisica", "🐶": "cățelul", "⚽": "mingea", "🎈": "balonul", "🐦": "păsărica", "🐞": "buburuza", "🧸": "ursulețul", "🍎": "mărul" };
const NUME_REPERE: Record<string, string> = { "🏠": "casă", "🌳": "copac", "🚗": "mașină", "🪑": "scaun", "🛏️": "pat", "⛺": "cort" };

function exGeometrie(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const sub: SubtemaGeometrie = rng.pick(ctx.o.geometrie.subteme.length ? ctx.o.geometrie.subteme : (["figuri"] as SubtemaGeometrie[]));
  switch (sub) {
    case "figuri": {
      const f = rng.pick(FIGURI);
      const culoare = rng.pick(CULORI);
      const rotatie = f.forma === "triunghi" ? rng.pick([0, 180]) : 0;
      const m: Mecanica = { tip: "figura", forma: f.forma, rotatie, culoare };
      const e = ecran(rng, ctx, ["perechi"]);
      return ex({
        capitol: "geometrie", cheie: `geo.fig:${f.forma}:${culoare}:${rotatie}`, fapt: `fig:${f.forma}`, ecran: e, dificultate: 1,
        enunt: "Ce figură geometrică este aceasta?", mecanica: m,
        raspuns: { tip: "optiune", valoare: f.nume, optiuni: variante(rng, f.nume, FIGURI.map((x) => x.nume)) },
        indicii: [f.laturi ? `Numără laturile: are ${f.laturi}.` : "Nu are laturi drepte și nici colțuri.", f.forma === "dreptunghi" ? "Laturile nu sunt toate la fel de lungi." : f.forma === "patrat" ? "Toate laturile sunt la fel de lungi." : "Gândește-te la forma unei roți sau a unui acoperiș.", `Este un ${f.nume}.`],
        fisa: { cerinta: "Încercuiește numele figurii:", text: "", raspuns: f.nume, mecanica: m, optiuni: FIGURI.map((x) => x.nume) },
        numere: [], pereche: e === "perechi" ? { stanga: `${f.nume} ${NUME_CULORI[culoare]}`, stangaMecanica: m, dreapta: f.nume } : undefined,
      });
    }
    case "corpuri": {
      const c = rng.pick(CORPURI);
      const culoare = rng.pick(CULORI);
      if (rng.bool(0.4)) {
        const obiect = rng.pick(c.obiecte);
        const alte = CORPURI.filter((x) => x !== c).map((x) => rng.pick(x.obiecte));
        return ex({
          capitol: "geometrie", cheie: `geo.obj:${c.corp}:${obiect}`, fapt: `corp:${c.corp}`, ecran: "intrebare", dificultate: 2,
          enunt: `Care obiect are forma de ${c.nume}?`, mecanica: { tip: "corp", corp: c.corp, culoare },
          raspuns: { tip: "optiune", valoare: obiect, optiuni: rng.shuffle([obiect, ...alte]) },
          indicii: [`Uită-te la desen: așa arată un ${c.nume}.`, "Caută obiectul cu aceeași formă.", `${obiect} are forma de ${c.nume}.`],
          fisa: { cerinta: "Încercuiește obiectul cu forma corpului din desen:", text: "", raspuns: obiect, mecanica: { tip: "corp", corp: c.corp, culoare }, optiuni: rng.shuffle([obiect, ...alte]) },
          numere: [],
        });
      }
      const m: Mecanica = { tip: "corp", corp: c.corp, culoare };
      const e = ecran(rng, ctx, ["perechi"]);
      return ex({
        capitol: "geometrie", cheie: `geo.corp:${c.corp}:${culoare}`, fapt: `corp:${c.corp}`, ecran: e, dificultate: 2,
        enunt: "Ce corp geometric este acesta?", mecanica: m,
        raspuns: { tip: "optiune", valoare: c.nume, optiuni: rng.shuffle(CORPURI.map((x) => x.nume)) },
        indicii: [c.corp === "sfera" ? "Se rostogolește în orice parte, ca o minge." : c.corp === "cub" ? "Are fețe pătrate, ca un zar." : "Are două fețe rotunde, ca o conservă.", "Gândește-te la un obiect din casă cu aceeași formă.", `Este un ${c.nume}.`],
        fisa: { cerinta: "Încercuiește numele corpului:", text: "", raspuns: c.nume, mecanica: m, optiuni: CORPURI.map((x) => x.nume) },
        numere: [], pereche: e === "perechi" ? { stanga: c.nume, stangaMecanica: m, dreapta: c.nume } : undefined,
      });
    }
    case "laturi": {
      const f = rng.pick(FIGURI);
      const culoare = rng.pick(CULORI);
      const ce = f.forma === "cerc" ? "colțuri" : rng.pick(["laturi", "colțuri"]);
      const m: Mecanica = { tip: "figura", forma: f.forma, rotatie: 0, culoare };
      return ex({
        capitol: "geometrie", cheie: `geo.lat:${f.forma}:${ce}:${culoare}`, fapt: `lat:${f.forma}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: 2,
        enunt: `Câte ${ce} are ${f.nume === "cerc" ? "cercul" : `${f.nume}ul`}?`, mecanica: m,
        raspuns: { tip: "numar", valoare: f.laturi },
        indicii: [`Pune degetul pe ${ce === "laturi" ? "o latură" : "un colț"} și numără, pe rând.`, f.forma === "cerc" ? "Cercul este rotund de jur împrejur." : `Ai ajuns înapoi de unde ai pornit?`, `${f.nume === "cerc" ? "Cercul" : `${f.nume[0].toUpperCase()}${f.nume.slice(1)}ul`} are ${f.laturi} ${ce}.`],
        fisa: { cerinta: "Numără laturile sau colțurile:", text: `${ce}: ___`, raspuns: String(f.laturi), mecanica: m },
        numere: [f.laturi],
      });
    }
    case "pozitii": {
      const chenar = rng.bool(0.35);
      const relatie: RelatieSpatiala = chenar ? rng.pick(["interior", "exterior"] as const) : rng.pick(["stanga", "dreapta", "sus", "jos"] as const);
      const obiect = rng.pick(OBIECTE);
      const reper = rng.pick(REPERE);
      const optiuni = chenar ? ["în interior", "în exterior"] : ["în stânga", "în dreapta", "deasupra", "dedesubt"];
      const corect = textRelatie(relatie);
      const fata = chenar ? "chenarului" : `${NUME_REPERE[reper]}`;
      const m: Mecanica = { tip: "pozitie", reper, obiect, relatie };
      return ex({
        capitol: "geometrie", cheie: `geo.poz:${obiect}:${chenar ? "chenar" : reper}:${relatie}`, fapt: `poz:${relatie}`, ecran: "intrebare", dificultate: 1,
        enunt: chenar ? `Unde este ${NUME_OBIECTE[obiect]} față de chenar?` : `Unde este ${NUME_OBIECTE[obiect]} față de ${NUME_REPERE[reper]}?`,
        mecanica: m,
        raspuns: { tip: "optiune", valoare: corect, optiuni: optiuni },
        indicii: [chenar ? "Este înăuntrul liniei punctate sau în afara ei?" : "Uită-te unde stă obiectul: lângă reper sau deasupra / dedesubt?", chenar ? "Urmărește linia punctată cu degetul." : "Mâna stângă e cea cu care nu scrii de obicei; stânga desenului e în partea ei.", `${NUME_OBIECTE[obiect][0].toUpperCase()}${NUME_OBIECTE[obiect].slice(1)} este ${corect}${chenar ? "" : ` față de ${fata}`}.`],
        fisa: { cerinta: "Încercuiește unde este obiectul:", text: "", raspuns: corect, mecanica: m, optiuni },
        numere: [],
      });
    }
  }
}

// ═════════════ timpul ═════════════

const ZILE = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];
const LUNI = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
const ANOTIMPURI = ["primăvara", "vara", "toamna", "iarna"];
/** martie–mai primăvara, iunie–august vara, septembrie–noiembrie toamna, decembrie–februarie iarna */
const anotimpLuna = (l: number) => (l === 11 || l <= 1 ? "iarna" : l <= 4 ? "primăvara" : l <= 7 ? "vara" : "toamna");
const SEMNE_ANOTIMP: Record<string, string[]> = {
  primăvara: ["🌷", "🐣", "🌱"], vara: ["🏖️", "🍉", "🌞"], toamna: ["🍂", "🍇", "☔"], iarna: ["⛄", "❄️", "🎄"],
};
export const oraDigitala = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;

function exTimp(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const sub: SubtemaTimp = rng.pick(ctx.o.timp.subteme.length ? ctx.o.timp.subteme : (["ceas"] as SubtemaTimp[]));
  switch (sub) {
    case "ceas": {
      const h = rng.int(1, 12);
      const m = ctx.o.timp.jumatati && rng.bool() ? 30 : 0;
      const ora = oraDigitala(h, m);
      const text = m ? `ora ${h} și jumătate` : `ora ${h} fix`;
      const indicii: [string, string, string] = [
        "Acul mic arată ora, acul mare arată minutele.",
        m ? "Acul mare e jos, la 6: a trecut o jumătate de oră." : "Acul mare e sus, la 12: e oră fixă.",
        `Ceasul arată ${text} (${ora}).`,
      ];
      const e = ecran(rng, ctx, ["perechi"]);
      const muta = e === "intrebare" && rng.bool(0.4);
      if (muta) {
        return ex({
          capitol: "timp", cheie: `timp.muta:${ora}`, fapt: `ora:${ora}`, ecran: e, dificultate: 3,
          enunt: `Mută acele ca ceasul să arate ${text}.`, mecanica: { tip: "ceas", ore: 12, minute: 0, interactiv: true, pasMinute: ctx.o.timp.jumatati ? 30 : 60 },
          raspuns: { tip: "construit", valoare: (h % 12) * 60 + m }, indicii,
          fisa: { cerinta: "Ce oră arată ceasul?", text: "Ora: ___", raspuns: ora, mecanica: { tip: "ceas", ore: h, minute: m } },
          numere: [h, m],
        });
      }
      const distractori = [oraDigitala(h === 12 ? 1 : h + 1, m), oraDigitala(h === 1 ? 12 : h - 1, m), oraDigitala(h, m ? 0 : 30), oraDigitala(m ? (h === 12 ? 6 : (h + 6) % 12 || 12) : h, m ? 0 : 30)];
      return ex({
        capitol: "timp", cheie: `timp.ceas:${ora}`, fapt: `ora:${ora}`, ecran: e, dificultate: m ? 3 : 2,
        enunt: "Ce oră arată ceasul?", mecanica: { tip: "ceas", ore: h, minute: m },
        raspuns: { tip: "optiune", valoare: ora, optiuni: variante(rng, ora, ctx.o.timp.jumatati ? distractori : distractori.filter((d) => d.endsWith(":00"))) },
        indicii,
        fisa: { cerinta: "Ce oră arată ceasul?", text: "Ora: ___", raspuns: ora, mecanica: { tip: "ceas", ore: h, minute: m } },
        numere: [h, m], pereche: e === "perechi" ? { stanga: text, stangaMecanica: { tip: "ceas", ore: h, minute: m }, dreapta: ora } : undefined,
      });
    }
    case "zile":
    case "luni": {
      const lista = sub === "zile" ? ZILE : LUNI;
      const i = rng.int(0, lista.length - 1);
      const dupa = rng.bool();
      const j = (i + (dupa ? 1 : -1) + lista.length) % lista.length;
      const ce = sub === "zile" ? "zi" : "lună";
      return ex({
        capitol: "timp", cheie: `timp.${sub}:${i}:${dupa ? "d" : "i"}`, ecran: "intrebare", dificultate: 2,
        enunt: `Ce ${ce} vine ${dupa ? "după" : "înainte de"} ${lista[i]}?`,
        mecanica: { tip: "calendar", elemente: sub === "zile" ? ZILE : LUNI.map((l) => l.slice(0, 3)), evidentiat: i },
        raspuns: { tip: "optiune", valoare: lista[j], optiuni: variante(rng, lista[j], [lista[i], lista[(i + 2) % lista.length], lista[(i - 2 + lista.length) % lista.length], ...lista]) },
        indicii: [`Spune ${sub === "zile" ? "zilele săptămânii" : "lunile anului"} pe rând, începând cu ${lista[0]}.`, `Oprește-te la ${lista[i]}.`, `${dupa ? "După" : "Înainte de"} ${lista[i]} vine ${lista[j]}.`],
        fisa: { cerinta: `Completează ${sub === "zile" ? "ziua" : "luna"}:`, text: dupa ? `${lista[i]}, ___` : `___, ${lista[i]}`, raspuns: lista[j] },
        numere: [],
      });
    }
    case "anotimpuri": {
      const fel = rng.pick(["luna", "urmator", "semn"] as const);
      if (fel === "luna") {
        const l = rng.int(0, 11);
        const a = anotimpLuna(l);
        return ex({
          capitol: "timp", cheie: `timp.an.l:${l}`, ecran: "intrebare", dificultate: 2,
          enunt: `În ce anotimp este luna ${LUNI[l]}?`, mecanica: { tip: "calendar", elemente: LUNI.map((x) => x.slice(0, 3)), evidentiat: l },
          raspuns: { tip: "optiune", valoare: a, optiuni: [...ANOTIMPURI] },
          indicii: ["Fiecare anotimp are trei luni.", "Primăvara: martie, aprilie, mai. Vara: iunie, iulie, august.", `Luna ${LUNI[l]} este ${a}.`],
          fisa: { cerinta: "Încercuiește anotimpul:", text: `luna ${LUNI[l]}`, raspuns: a, optiuni: [...ANOTIMPURI] },
          numere: [],
        });
      }
      if (fel === "urmator") {
        const i = rng.int(0, 3);
        const urm = ANOTIMPURI[(i + 1) % 4];
        return ex({
          capitol: "timp", cheie: `timp.an.u:${i}`, ecran: "intrebare", dificultate: 2,
          enunt: `Ce anotimp vine după ${ANOTIMPURI[i]}?`, mecanica: { tip: "calendar", elemente: [...ANOTIMPURI], evidentiat: i },
          raspuns: { tip: "optiune", valoare: urm, optiuni: [...ANOTIMPURI] },
          indicii: ["Anotimpurile vin pe rând: primăvara, vara, toamna, iarna.", "După iarnă vine din nou primăvara.", `După ${ANOTIMPURI[i]} vine ${urm}.`],
          fisa: { cerinta: "Completează anotimpul care urmează:", text: `${ANOTIMPURI[i]} → ___`, raspuns: urm },
          numere: [],
        });
      }
      const a = rng.pick(ANOTIMPURI);
      const s = rng.pick(SEMNE_ANOTIMP[a]);
      return ex({
        capitol: "timp", cheie: `timp.an.s:${s}`, ecran: "intrebare", dificultate: 1,
        enunt: "În ce anotimp vedem acest lucru?", mecanica: { tip: "obiecte", elemente: [s] },
        raspuns: { tip: "optiune", valoare: a, optiuni: [...ANOTIMPURI] },
        indicii: ["Gândește-te cum e vremea atunci.", "E cald sau frig? Înfloresc pomii sau cad frunzele?", `${s} — ${a}.`],
        fisa: { cerinta: "Încercuiește anotimpul:", text: s, raspuns: a, optiuni: [...ANOTIMPURI] },
        numere: [],
      });
    }
  }
}

// ═════════════ banii ═════════════

const BANCNOTE = [1, 5, 10, 50, 100];
export const lei = (n: number) => (n === 1 ? "1 leu" : `${n} ${n >= 20 ? "de " : ""}lei`);
/** plata cu cele mai puține bancnote (50, 10, 5, 1 lei) */
export function descompuneLei(n: number): number[] {
  const r: number[] = [];
  for (const v of [50, 10, 5, 1]) while (n >= v) { r.push(v); n -= v; }
  return r;
}
const PRODUSE: [string, string][] = [["🧸", "ursulețul"], ["⚽", "mingea"], ["📕", "cartea"], ["🖍️", "creioanele"], ["🧃", "sucul"], ["🍦", "înghețata"], ["🎒", "ghiozdanul"], ["🪁", "zmeul"]];

function exBani(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const sub: SubtemaBani = rng.pick(ctx.o.bani.subteme.length ? ctx.o.bani.subteme : (["recunoastere"] as SubtemaBani[]));
  switch (sub) {
    case "recunoastere": {
      const v = rng.pick(BANCNOTE);
      const m: Mecanica = { tip: "bani", piese: [v * 100] };
      const e = ecran(rng, ctx, ["perechi"]);
      return ex({
        capitol: "bani", cheie: `bani.rec:${v}:${e === "perechi" ? "p" : "i"}`, fapt: `bancnota:${v}`, ecran: e, dificultate: 1,
        enunt: "Ce bancnotă este aceasta?", mecanica: m,
        raspuns: { tip: "optiune", valoare: lei(v), optiuni: variante(rng, lei(v), BANCNOTE.map(lei)) },
        indicii: ["Uită-te la numărul scris pe bancnotă.", "Fiecare bancnotă are altă culoare.", `Este bancnota de ${lei(v)}.`],
        fisa: { cerinta: "Scrie valoarea bancnotei:", text: "___", raspuns: lei(v), mecanica: m },
        numere: [v], pereche: e === "perechi" ? { stanga: `bancnota de ${lei(v)}`, stangaMecanica: m, dreapta: lei(v) } : undefined,
      });
    }
    case "numara": {
      const piese = rng.shuffle(rng.distinct(rng.int(2, 3), () => rng.pick(BANCNOTE)).concat(rng.bool(0.4) ? [rng.pick([1, 5, 10])] : []));
      let total = piese.reduce((s, x) => s + x, 0);
      while (total > 100) {
        piese.sort((a, b) => b - a).shift();
        total = piese.reduce((s, x) => s + x, 0);
      }
      const ordonate = [...piese].sort((a, b) => b - a);
      return ex({
        capitol: "bani", cheie: `bani.nr:${ordonate.join("+")}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: 3,
        enunt: "Câți lei sunt în total?", mecanica: { tip: "bani", piese: ordonate.map((x) => x * 100) },
        raspuns: { tip: "numar", valoare: total },
        indicii: ["Începe cu bancnota cea mai mare.", `Adună pe rând: ${ordonate.join(" + ")}.`, `${ordonate.join(" + ")} = ${total} lei.`],
        fisa: { cerinta: "Câți lei sunt?", text: "___ lei", raspuns: String(total), mecanica: { tip: "bani", piese: ordonate.map((x) => x * 100) } },
        numere: [...ordonate, total],
      });
    }
    case "cumparaturi": {
      const [emoji, nume] = rng.pick(PRODUSE);
      const fel = rng.pick(["rest", "impreuna", "plateste"] as const);
      if (fel === "plateste") {
        const pret = rng.int(2, 60);
        return ex({
          capitol: "bani", cheie: `bani.plata:${emoji}:${pret}`, ecran: "intrebare", dificultate: 3,
          enunt: `${emoji} ${nume[0].toUpperCase()}${nume.slice(1)} costă ${lei(pret)}. Plătește exact!`,
          mecanica: { tip: "magazin", pret: pret * 100, disponibile: [100, 500, 1000, 5000], produs: `${emoji} ${nume}` },
          raspuns: { tip: "construit", valoare: pret * 100 },
          indicii: ["Pune întâi bancnotele mari, apoi pe cele mici.", "Numără ce ai pus pe tejghea și compară cu prețul.", `${lei(pret)} = ${descompuneLei(pret).map(lei).join(" + ")}.`],
          fisa: { cerinta: "Scrie ce bancnote dai ca să plătești exact:", text: `${emoji} ${lei(pret)}: ___`, raspuns: lei(pret) },
          numere: [pret],
        });
      }
      if (fel === "rest") {
        const ai = rng.pick([10, 20, 50, 100]);
        const pret = rng.int(1, ai - 1);
        const rest = ai - pret;
        return ex({
          capitol: "bani", cheie: `bani.rest:${ai}:${pret}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: ai > 20 ? 5 : 3,
          enunt: `Ai ${lei(ai)}. Cumperi ${nume} ${emoji} cu ${lei(pret)}. Câți lei îți rămân?`,
          mecanica: { tip: "bani", piese: [ai * 100] },
          raspuns: { tip: "numar", valoare: rest },
          indicii: ["Din banii pe care îi ai scazi prețul.", `${ai} ${MINUS} ${pret} = ?`, `${ai} ${MINUS} ${pret} = ${rest}. Îți rămân ${lei(rest)}.`],
          fisa: { cerinta: "Rezolvă:", text: `Ai ${lei(ai)}, cumperi ${emoji} cu ${lei(pret)}. Îți rămân ___ lei.`, raspuns: String(rest) },
          numere: [ai, pret, rest],
        });
      }
      const [emoji2, nume2] = rng.pick(PRODUSE.filter((p) => p[0] !== emoji));
      const a = rng.int(1, 40), b = rng.int(1, Math.min(40, 100 - a));
      return ex({
        capitol: "bani", cheie: `bani.imp:${emoji}${a}:${emoji2}${b}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: 3,
        enunt: `${emoji} ${nume[0].toUpperCase()}${nume.slice(1)} costă ${lei(a)}, iar ${emoji2} ${nume2} costă ${lei(b)}. Cât costă împreună?`,
        mecanica: { tip: "expresie", text: `${emoji} ${a} lei   ${emoji2} ${b} lei` },
        raspuns: { tip: "numar", valoare: a + b },
        indicii: ["„Împreună” înseamnă că aduni prețurile.", `${a} + ${b} = ?`, `${a} + ${b} = ${a + b}. Costă ${lei(a + b)}.`],
        fisa: { cerinta: "Rezolvă:", text: `${emoji} ${lei(a)} și ${emoji2} ${lei(b)} costă împreună ___ lei.`, raspuns: String(a + b) },
        numere: [a, b, a + b],
      });
    }
  }
}

// ═════════════ lungimea ═════════════

const OBIECTE_RIGLA = ["🖍️", "🖊️", "🐛", "🔑", "🥕", "🌿", "📎", "🦎"];

function exLungime(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const lungime = rng.int(2, 14);
  const start = rng.bool(0.25) ? rng.int(1, 3) : 0;
  const obiect = rng.pick(OBIECTE_RIGLA);
  const m: Mecanica = { tip: "rigla", start, lungime, unitate: "cm", obiect };
  return ex({
    capitol: "lungime", cheie: `lg:${obiect}:${start}:${lungime}`, fapt: `lg:${lungime}`, ecran: ecran(rng, ctx, ["casuta"]), dificultate: start ? 3 : 2,
    enunt: "Cât de lung este obiectul? (în centimetri)", mecanica: m,
    raspuns: { tip: "numar", valoare: lungime },
    indicii: [start ? `Obiectul nu începe de la 0, ci de la ${start}.` : "Obiectul începe de la 0.", `Uită-te unde se termină: la ${start + lungime}.`, start ? `${start + lungime} ${MINUS} ${start} = ${lungime} cm.` : `Obiectul are ${lungime} cm.`],
    fisa: { cerinta: "Măsoară cu rigla:", text: "___ cm", raspuns: String(lungime), mecanica: m },
    numere: [start, lungime, start + lungime],
  });
}

// ═════════════ probleme ═════════════

const COPII = ["Ana", "Ioana", "Maria", "Sofia", "Elena", "Andrei", "Matei", "Luca", "David", "Vlad"];
const LUCRURI: [string, string][] = [["măr", "mere"], ["creion", "creioane"], ["bomboană", "bomboane"], ["carte", "cărți"], ["balon", "baloane"], ["timbru", "timbre"], ["nucă", "nuci"], ["mașinuță", "mașinuțe"]];

function exProbleme(rng: Rng, ctx: CtxC1): ExercitiuC1 {
  const max = ctx.o.probleme.max;
  const [x, y] = rng.shuffle(COPII);
  const [sg, pl] = rng.pick(LUCRURI);
  const cu = (n: number) => cuSubstantiv(n, sg, pl);
  const vizual = ctx.suportVizual;
  const e = ecran(rng, ctx, ["casuta", "cursa"]);
  if (ctx.o.probleme.douaOperatii && rng.bool(0.5)) {
    // a + b − c sau a − b + c, cu rezultatul intermediar în concentru
    const plus = rng.bool();
    let a: number, b: number, c: number, mij: number, r: number;
    for (;;) {
      a = rng.int(2, max - 1);
      b = rng.int(1, max - 1);
      c = rng.int(1, max - 1);
      mij = plus ? a + b : a - b;
      r = plus ? mij - c : mij + c;
      if (mij >= 0 && mij <= max && r >= 0 && r <= max) break;
    }
    const enunt = plus
      ? `${x} are ${cu(a)}. Primește încă ${cu(b)}, apoi îi dă lui ${y} ${cu(c)}. Câte ${pl} are acum ${x}?`
      : `${x} are ${cu(a)}. Îi dă lui ${y} ${cu(b)}, apoi primește încă ${cu(c)}. Câte ${pl} are acum ${x}?`;
    return ex({
      capitol: "probleme", cheie: `pb2:${plus ? "p" : "m"}:${a}:${b}:${c}`, ecran: e, dificultate: 6,
      enunt, mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: r },
      indicii: [plus ? `Întâi: câte are după ce primește? ${a} + ${b} = ?` : `Întâi: câte îi rămân după ce dă? ${a} ${MINUS} ${b} = ?`, `După primul pas are ${mij}. Acum: ${mij} ${plus ? MINUS : "+"} ${c} = ?`, `${a} ${plus ? "+" : MINUS} ${b} = ${mij}; ${mij} ${plus ? MINUS : "+"} ${c} = ${r}. Răspuns: ${cu(r)}.`],
      fisa: { cerinta: "Rezolvă problema:", text: `${enunt} Răspuns: ___`, raspuns: String(r), rezolvare: `${a} ${plus ? "+" : MINUS} ${b} = ${mij}; ${mij} ${plus ? MINUS : "+"} ${c} = ${r}. Răspuns: ${cu(r)}.` },
      numere: [a, b, c, mij, r],
    });
  }
  const fel = rng.pick(["primeste", "da", "mai-multe", "mai-putine", "total"] as const);
  let a: number, b: number, r: number, enunt: string, op: OpC1;
  switch (fel) {
    case "primeste":
      a = rng.int(1, max - 1); b = rng.int(1, max - a); r = a + b; op = "+";
      enunt = `${x} are ${cu(a)}. Primește încă ${cu(b)}. Câte ${pl} are acum?`; break;
    case "da":
      a = rng.int(2, max); b = rng.int(1, a - 1); r = a - b; op = "-";
      enunt = `${x} are ${cu(a)}. Îi dă lui ${y} ${cu(b)}. Câte ${pl} i-au rămas lui ${x}?`; break;
    case "mai-multe":
      a = rng.int(1, max - 1); b = rng.int(1, max - a); r = a + b; op = "+";
      enunt = `${x} are ${cu(a)}. ${y} are cu ${b} mai multe. Câte ${pl} are ${y}?`; break;
    case "mai-putine":
      a = rng.int(2, max); b = rng.int(1, a - 1); r = a - b; op = "-";
      enunt = `${x} are ${cu(a)}. ${y} are cu ${b} mai puține. Câte ${pl} are ${y}?`; break;
    case "total":
      a = rng.int(1, max - 1); b = rng.int(1, max - a); r = a + b; op = "+";
      enunt = `${x} are ${cu(a)}, iar ${y} are ${cu(b)}. Câte ${pl} au împreună?`; break;
  }
  const bara: Mecanica = fel === "mai-multe" || fel === "mai-putine"
    ? { tip: "bara", comparatie: true, parti: [{ eticheta: x, valoare: a }, { eticheta: y, valoare: null }], total: null }
    : fel === "da"
      ? { tip: "bara", parti: [{ eticheta: "dă", valoare: b, culoare: "#e07a1f" }, { eticheta: "rămân", valoare: null }], total: a }
      : { tip: "bara", parti: [{ eticheta: fel === "total" ? x : "avea", valoare: a }, { eticheta: fel === "total" ? y : "primește", valoare: b, culoare: "#2f6fd1" }], total: null };
  return ex({
    capitol: "probleme", cheie: `pb1:${fel}:${a}:${b}:${sg}`, fapt: `pb:${a}${op}${b}`, ecran: e, dificultate: max === 20 ? 3 : 5,
    enunt, mecanica: vizual ? bara : { tip: "expresie", text: "" },
    raspuns: { tip: "numar", valoare: r },
    indicii: [op === "+" ? "Se adaugă ceva: facem adunare." : "Se ia ceva (sau sunt mai puține): facem scădere.", `${a} ${semn(op)} ${b} = ?`, `${a} ${semn(op)} ${b} = ${r}. Răspuns: ${cu(r)}.`],
    fisa: { cerinta: "Rezolvă problema:", text: `${enunt} Răspuns: ___`, raspuns: String(r), rezolvare: `${a} ${semn(op)} ${b} = ${r}. Răspuns: ${cu(r)}.` },
    numere: [a, b, r],
  });
}

// ═════════════ dispecer ═════════════

export function genereazaExercitiu(capitol: CapitolC1, rng: Rng, ctx: CtxC1): ExercitiuC1 {
  switch (capitol) {
    case "numere": return exNumere(rng, ctx);
    case "adsc20": return exAdSc(rng, ctx, 20);
    case "adsc100": return exAdSc(rng, ctx, 100);
    case "termen": return exTermen(rng, ctx);
    case "geometrie": return exGeometrie(rng, ctx);
    case "timp": return exTimp(rng, ctx);
    case "bani": return exBani(rng, ctx);
    case "lungime": return exLungime(rng, ctx);
    case "probleme": return exProbleme(rng, ctx);
  }
}
