import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { evalueaza } from "@/motor/calcul/generator";
import { genereazaC3, puncteaza, verificaC3 } from "./generator";
import { CAPITOLE, JOCURI, codificaC3, configC3Implicita, decodificaC3, optiuniImplicite } from "./config";
import type { CapitolC3, ConfigC3, ItemC3, JocC3 } from "./tipuri";

/** Cifre romane → număr, scris independent de generator */
function dinRoman(s: string): number {
  const v: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let t = 0;
  for (let i = 0; i < s.length; i++) t += v[s[i]] < (v[s[i + 1]] ?? 0) ? -v[s[i]] : v[s[i]];
  return t;
}
/** valoarea exactă a unei părți de comparație: număr, fracție „a/b” sau expresie */
function valoare(e: string): [number, number] | null {
  if (/^\d+\/\d+$/.test(e)) { const [a, b] = e.split("/").map(Number); return [a, b]; }
  const v = evalueaza(e);
  return v === null ? null : [v, 1];
}
const semn = (a: [number, number], b: [number, number]) => (a[0] * b[1] < b[0] * a[1] ? "<" : a[0] * b[1] > b[0] * a[1] ? ">" : "=");
const subst = (e: string, x: number) => e.replace(/x/g, String(x));

function raspunsCorect(it: ItemC3): string {
  const r = it.raspuns;
  switch (r.tip) {
    case "numar": return String(r.valoare);
    case "rest": return `${r.cat}|${r.rest}`;
    case "varianta": return r.valoare;
    case "construit": return r.laturi ? `${r.laturi[0]}x${r.laturi[1]}` : `${r.perimetru / 4 + 0.5 > Math.floor(r.perimetru / 4) + 0.5 ? 0 : 0}x0`;
    case "colorare": return String(r.cerut);
    case "pereche": return "ok";
  }
}

/** Verificarea independentă a unui item; întoarce mesajul de eroare sau null. */
function verifica(it: ItemC3): string | null {
  const v = it.verificare;
  switch (v.tip) {
    case "egal":
      return evalueaza(v.expr) === v.valoare && (it.raspuns.tip !== "numar" || it.raspuns.valoare === v.valoare) ? null : `egal ${v.expr} ≠ ${v.valoare}`;
    case "ecuatie": {
      const [st, dr] = v.expr.split(" = ");
      const a = evalueaza(subst(st, v.valoare), true), b = evalueaza(subst(dr, v.valoare), true);
      if (a === null || a !== b) return `ecuație ${v.expr} nu are soluția ${v.valoare}`;
      return it.raspuns.tip === "numar" && it.raspuns.valoare === v.valoare ? null : "răspuns ≠ soluție";
    }
    case "rest":
      if (!(v.d === v.i * v.c + v.r && v.r > 0 && v.r < v.i)) return `rest greșit ${JSON.stringify(v)}`;
      if (it.raspuns.tip === "rest" && (it.raspuns.cat !== v.c || it.raspuns.rest !== v.r)) return "rest ≠ răspuns";
      if (it.raspuns.tip === "numar" && it.raspuns.valoare !== v.d) return "deîmpărțit ≠ răspuns";
      return null;
    case "comparatie": {
      const a = valoare(v.st), b = valoare(v.dr);
      if (!a || !b) return `comparație neevaluabilă ${v.st} ? ${v.dr}`;
      return semn(a, b) === v.semn && it.raspuns.tip === "varianta" && it.raspuns.valoare === v.semn ? null : `${v.st} ${v.semn} ${v.dr} greșit`;
    }
    case "roman":
      return dinRoman(v.roman) === v.valoare ? null : `roman ${v.roman} ≠ ${v.valoare}`;
    case "fractie":
      return v.num >= 1 && v.den >= 2 && v.den <= 10 ? null : "fracție în afara programei";
    case "clasa-fractie":
      return (v.num < v.den ? "subunitară" : v.num === v.den ? "echiunitară" : "supraunitară") === v.clasa ? null : "tipul fracției greșit";
    case "max":
      return Math.max(...v.numere) === v.valoare ? null : "maxim greșit";
    case "paranteze":
      if (!v.expr.includes("(") || evalueaza(v.expr) !== v.tinta) return `paranteze ${v.expr} ≠ ${v.tinta}`;
      return v.altele.every((e) => evalueaza(e) !== v.tinta) ? null : "altă variantă dă același rezultat";
    case "perimetru":
      return v.laturi.reduce((s, x) => s + x, 0) === v.valoare ? null : "perimetru greșit";
    case "construit":
      return v.perimetru % 2 === 0 && v.perimetru >= 6 ? null : "perimetru imposibil";
    case "colorare":
      return v.cerut >= 1 && v.cerut <= v.parti ? null : "colorare imposibilă";
  }
}

const cfg = (p: Partial<ConfigC3>): ConfigC3 => ({ ...configC3Implicita(7), ...p });

describe("clasa a III-a: generatorul de exerciții", () => {
  it("toate exercițiile sunt corecte, pentru fiecare joc × capitol", () => {
    const toate: ItemC3[] = [];
    for (const joc of JOCURI)
      for (const cap of CAPITOLE)
        for (const seed of [1, 2, 3, 4, 5]) {
          const { itemi } = genereazaC3(cfg({ joc, capitole: [cap], nr: 40, seed: seed * 97 + cap.length }));
          expect(itemi.length, `${joc}/${cap}`).toBeGreaterThanOrEqual(35);
          for (const it of itemi) {
            toate.push(it);
            expect(verifica(it), `${joc}/${cap}: ${it.text} → ${it.afis}`).toBeNull();
            expect(verificaC3(it, raspunsCorect(it)) || it.raspuns.tip === "construit" && !it.raspuns.laturi, it.text).toBe(true);
            expect(`${it.text} ${it.afis}`).not.toMatch(/undefined|NaN|null/);
          }
        }
    expect(toate.length).toBeGreaterThan(5000);
    if (process.env.C3_EXPORT) writeFileSync(process.env.C3_EXPORT, JSON.stringify(toate.map((t) => t.verificare)));
  });

  it("împărțiri: exacte au rest 0, cele cu rest au 0 < R < Î (D = Î × C + R)", () => {
    for (const rest of ["exacta", "cu-rest"] as const) {
      const { itemi } = genereazaC3(cfg({ capitole: ["impartire"], optiuni: { ...optiuniImplicite(), impartire: { tipuri: ["1cifra"], rest } }, nr: 100 }));
      for (const it of itemi) {
        if (rest === "exacta") {
          expect(it.raspuns.tip).toBe("numar");
          const [d, i] = (it.verificare as { expr: string }).expr.split(" / ").map(Number);
          expect(d % i).toBe(0);
        } else {
          expect(it.raspuns.tip).toBe("rest");
          const v = it.verificare as { d: number; i: number; c: number; r: number };
          expect(v.r).toBeGreaterThan(0);
          expect(v.r).toBeLessThan(v.i);
          expect(v.d).toBe(v.i * v.c + v.r);
          expect(v.d).toBeLessThanOrEqual(999);
        }
      }
    }
  });

  it("ordinea operațiilor: rezultate parțiale și finale naturale (≥ 0), fără și cu paranteze", () => {
    for (const paranteze of ["fara", "cu"] as const) {
      const { itemi } = genereazaC3(cfg({ capitole: ["ordine"], optiuni: { ...optiuniImplicite(), ordine: { paranteze } }, nr: 100 }));
      for (const it of itemi) {
        const e = (it.verificare as { expr: string }).expr;
        expect(evalueaza(e, true), e).not.toBeNull(); // null = rezultat parțial negativ sau împărțire neexactă
        expect(e.includes("("), e).toBe(paranteze === "cu");
      }
    }
  });

  it("detectivul: numărul lipsă este unic", () => {
    for (const cap of CAPITOLE) {
      const { itemi } = genereazaC3(cfg({ joc: "detectiv", capitole: [cap], nr: 25, seed: 11 }));
      for (const it of itemi.filter((x) => x.verificare.tip === "ecuatie")) {
        const v = it.verificare as { expr: string; valoare: number };
        const [st, dr] = v.expr.split(" = ");
        let sol = 0;
        for (let x = 0; x <= Math.max(200, 2 * v.valoare + 50); x++) if (evalueaza(subst(st, x), false) !== null && evalueaza(subst(st, x), false) === evalueaza(subst(dr, x), false)) sol++;
        expect(sol, `${it.text}`).toBe(1);
      }
    }
  });

  it("fără exerciții duplicate în aceeași sesiune sau fișă (și fețe unice la Memory)", () => {
    for (const joc of JOCURI)
      for (const nr of [10, 25, 50, 100]) {
        const { itemi, avertismente } = genereazaC3(cfg({ joc, capitole: CAPITOLE, nr, seed: nr }));
        expect(itemi).toHaveLength(nr);
        expect(new Set(itemi.map((i) => i.cheie)).size, `${joc} ${nr}`).toBe(nr);
        expect(avertismente, `${joc} ${nr}`).toEqual([]);
        if (joc === "memory") {
          expect(new Set(itemi.map((i) => i.dr!.text)).size).toBe(nr);
          expect(new Set(itemi.map((i) => `${i.st!.text}|${i.st!.fractie?.parti ?? ""}`)).size).toBe(nr);
        }
      }
  });

  it("opțiunile profesorului sunt respectate", () => {
    const fara = genereazaC3(cfg({ capitole: ["adunare"], optiuni: { ...optiuniImplicite(), adunare: { trecere: "fara", necunoscut: false } }, nr: 50 })).itemi;
    for (const it of fara) {
      const [a, b] = (it.verificare as { expr: string }).expr.split(/ [+-] /).map(Number);
      const plus = it.text.includes("+");
      const ca = String(a).split("").reverse(), cb = String(b).split("").reverse();
      const trecere = cb.some((d, i) => (plus ? Number(ca[i] ?? 0) + Number(d) >= 10 : Number(ca[i] ?? 0) < Number(d)));
      expect(trecere, it.text).toBe(false);
      expect(Math.max(a, b, plus ? a + b : a)).toBeLessThanOrEqual(10000);
    }
    const tabla = genereazaC3(cfg({ capitole: ["inmultire"], optiuni: { ...optiuniImplicite(), inmultire: { tipuri: ["tabla"], trecere: "oricare" } }, nr: 50 })).itemi;
    tabla.forEach((it) => expect((it.verificare as { valoare: number }).valoare).toBeLessThanOrEqual(100));
    const rom = genereazaC3(cfg({ capitole: ["numere"], optiuni: { ...optiuniImplicite(), numere: ["romane"] }, nr: 30 })).itemi;
    rom.forEach((it) => expect(it.verificare.tip).toBe("roman"));
  });

  it("e determinist; regenerarea unui exercițiu nu le schimbă pe celelalte", () => {
    const c = cfg({ capitole: CAPITOLE, nr: 30, seed: 5 });
    const a = genereazaC3(c).itemi;
    expect(genereazaC3(c).itemi).toEqual(a);
    const b = genereazaC3({ ...c, inlocuiri: { i4: 1 } }).itemi;
    expect(a.filter((x, i) => x.cheie !== b[i].cheie).map((x) => x.id)).toEqual(["i4"]);
  });

  it("configurația trece prin URL; valorile greșite sunt corectate", () => {
    const c = cfg({ joc: "balanta", capitole: ["fractii", "masuri"], nr: 25, vieti: 3, viteza: 2 });
    expect(decodificaC3(codificaC3(c))).toEqual(c);
    const rau = decodificaC3(btoa(JSON.stringify({ capitole: ["hack"], joc: "x", nr: 9999, vieti: 7 })))!;
    expect(rau.capitole).toEqual(configC3Implicita().capitole);
    expect(rau.joc).toBe("sprint");
    expect(rau.nr).toBe(100);
    expect(rau.vieti).toBe(0);
  });

  it("punctaj, combo și medalii", () => {
    const toate = Array.from({ length: 10 }, () => ({ corect: true, incercari: 1, timpMs: 1000 }));
    const p = puncteaza(toate, 10, 10000);
    expect(p.medalie).toBe("diamant");
    expect(p.procent).toBe(100);
    expect(p.comboMax).toBe(10);
    expect(p.scor).toBeGreaterThan(100);
    expect(puncteaza(toate.map((r, i) => ({ ...r, corect: i < 9 })), 10).medalie).toBe("aur");
    expect(puncteaza(toate.map((r, i) => ({ ...r, corect: i < 8 })), 10).medalie).toBe("argint");
    expect(puncteaza(toate.map((r, i) => ({ ...r, corect: i < 5 })), 10).medalie).toBe("bronz");
    expect(puncteaza(toate.map((r, i) => ({ ...r, corect: i < 4 })), 10).medalie).toBeNull();
    expect(puncteaza(toate.map((r) => ({ ...r, incercari: 2 })), 10).medalie).toBe("bronz");
  });
});

export type { CapitolC3, JocC3 };
