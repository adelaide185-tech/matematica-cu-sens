import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { evalueaza } from "@/motor/calcul/generator";
import { numarInLitere } from "@/motor/limba";
import { LUNI, ZILE, clasificaEroare, genereazaC2, inBani, oraInLitere, textBani, trecereAdunare, trecereScadere, verificaC2 } from "./generator";
import { JOCURI_LISTA_C2, NOTIUNI_C2, codificaC2, configC2Implicita, decodificaC2, optiuniC2Implicite } from "./config";
import { BANCNOTE, COMPATIBIL, MONEDE, type ConfigC2, type ItemC2, type NivelC2, type NotiuneC2 } from "./tipuri";

const NIVELURI: NivelC2[] = ["usor", "mediu", "provocare"];
const cfg = (p: Partial<ConfigC2>): ConfigC2 => ({ ...configC2Implicita(9), ...p });

/** Valoarea unei părți de ecuație cu x (și y) înlocuite */
const sub = (e: string, v: number[]) => e.replace(/x/g, String(v[0])).replace(/y/g, String(v[1] ?? 0));

function verifica(it: ItemC2): string | null {
  const v = it.verificare;
  switch (v.tip) {
    case "egal":
      if (evalueaza(v.expr, false) !== v.valoare) return `${v.expr} ≠ ${v.valoare}`;
      return it.raspuns.tip === "valoare" && it.raspuns.valoare !== String(v.valoare) ? "răspuns ≠ valoare" : null;
    case "ecuatie": {
      for (const sol of v.solutii) {
        for (const parte of v.expr.split(";")) {
          const [st, dr] = parte.split("=").map((x) => x.trim());
          if (evalueaza(sub(st, sol), false) !== evalueaza(sub(dr, sol), false)) return `${parte} nu are soluția ${sol}`;
        }
      }
      return null;
    }
    case "integrama": return evalueaza(v.expr, false) === v.valoare && numarInLitere(v.valoare) === v.text && !v.text.includes(" ") && it.raspuns.tip === "valoare" && it.raspuns.valoare === v.text.toUpperCase() ? null : `integrama ${v.expr} → ${v.text}`;
    case "bani": return evalueaza(v.expr, false) === v.valoare && textBani(v.valoare) === v.text && (it.raspuns as { valoare: string }).valoare === v.text ? null : "bani";
    case "litere": return numarInLitere(v.n) === v.text ? null : "litere";
    case "ora": return oraInLitere(v.ore, v.minute) === v.text ? null : "ora";
    case "text": return v.din.includes(v.corect) || ["iarna", "primăvara", "vara", "toamna"].includes(v.corect) ? null : "text";
    case "fractie": return v.num === 1 && [2, 3, 4].includes(v.den) ? null : "fracție în afara programei";
    case "semn": {
      const a = evalueaza(v.st, false), b = evalueaza(v.dr, false);
      if (a === null || b === null) return "balanță neevaluabilă";
      return (a < b ? "<" : a > b ? ">" : "=") === v.semn && (it.raspuns as { valoare: string }).valoare === v.semn ? null : `${v.st} ${v.semn} ${v.dr}`;
    }
    case "ordine": {
      const corect = (it.raspuns as { corect: string[] }).corect;
      if (corect.length !== it.cartonase!.length || [...corect].sort().join() !== [...it.cartonase!].sort().join()) return "cartonașe diferite";
      if (corect.every((x) => /^\d+$/.test(x))) {
        const n = corect.map(Number);
        return n.every((x, i) => i === 0 || (v.sens === "crescator" ? n[i - 1] < x : n[i - 1] > x)) ? null : `ordine greșită ${corect}`;
      }
      const L = ZILE.includes(corect[0]) ? ZILE : LUNI;
      const idx = corect.map((x) => L.indexOf(x));
      return idx.every((x, i) => i === 0 || x === idx[i - 1] + (v.sens === "crescator" ? 1 : -1)) ? null : `ordine greșită ${corect}`;
    }
    case "compara": {
      const r = v.numere.every((x) => (v.mare ? x <= v.valoare : x >= v.valoare)) || v.numere.some((x) => x % 2 !== v.valoare % 2);
      return r ? null : "comparare";
    }
  }
}

function raspunsCorect(it: ItemC2): string {
  const r = it.raspuns;
  return r.tip === "valoare" ? r.valoare : r.tip === "casute" ? r.solutii[0].join("|") : r.tip === "ordine" ? r.corect.join("|") : r.tip === "ora" ? `${r.ore}:${r.minute}` : "ok";
}

describe("clasa a II-a: conținutul", () => {
  it("toate exercițiile sunt corecte: joc × noțiune × nivel", () => {
    const toate: ItemC2[] = [];
    for (const joc of JOCURI_LISTA_C2)
      for (const n of COMPATIBIL[joc])
        for (const nivel of NIVELURI)
          for (const seed of [1, 2]) {
            const { itemi } = genereazaC2(cfg({ joc, notiuni: [n], nr: 20, seed: seed * 31 + n.length }), nivel);
            expect(itemi.length, `${joc}/${n}/${nivel}`).toBeGreaterThanOrEqual(10);
            for (const it of itemi) {
              toate.push(it);
              expect(verifica(it), `${joc}/${n}/${nivel}: ${it.text} → ${it.afis}`).toBeNull();
              expect(verificaC2(it, raspunsCorect(it)), it.text).toBe(true);
              for (const d of it.distractori) {
                expect(d.v, `${it.text}: distractorul e chiar răspunsul`).not.toBe(it.afis);
                expect(verificaC2(it, d.v)).toBe(false);
              }
              expect(new Set(it.distractori.map((d) => d.v)).size).toBe(it.distractori.length);
              if (joc === "bule" || joc === "scara") expect(it.distractori.length, it.text).toBeGreaterThanOrEqual(1);
              expect(`${it.text} ${it.afis}`).not.toMatch(/undefined|NaN|null/);
              // concentrul 0–1 000 (0–100 la Ușor), fără numere negative
              const nums = (it.text.match(/\d+/g) ?? []).map(Number);
              nums.forEach((x) => expect(x, it.text).toBeLessThanOrEqual(nivel === "usor" ? (n.startsWith("bani") ? 10000 : n === "mas.transformari" ? 500 : 100) : n.startsWith("bani") || n === "mas.transformari" ? 10000 : 1000));
              expect(it.text).not.toMatch(/−\s*−|-\d/);
            }
          }
    expect(toate.length).toBeGreaterThan(3000);
    if (process.env.C2_EXPORT) writeFileSync(process.env.C2_EXPORT, JSON.stringify(toate.map((t) => t.verificare)));
  });

  it("tabla: produse ≤ 100; împărțiri exacte cu împărțitor din tablă și deîmpărțit ≤ 100", () => {
    for (const joc of ["scara", "casute"] as const)
      for (const nivel of NIVELURI) {
        const { itemi } = genereazaC2(cfg({ joc, notiuni: ["op.tabla", "op.impartire"], nr: 100, optiuni: { ...optiuniC2Implicite(), table: [6, 7] } }), nivel);
        for (const it of itemi) {
          const nums = (it.text.match(/\d+/g) ?? []).map(Number);
          expect(Math.max(...nums), it.text).toBeLessThanOrEqual(100);
          if (it.text.includes(":")) expect(it.text, it.text).toMatch(/: (6|7) =|: □ = /);
          if (it.verificare.tip === "egal" && it.verificare.expr.includes("/")) {
            const [d, i] = it.verificare.expr.split(" / ").map(Number);
            expect(d % i).toBe(0);
            expect([6, 7]).toContain(i);
          }
        }
      }
  });

  it("„fără trecere” / „cu trecere” se respectă 100%", () => {
    for (const trecere of ["fara", "cu"] as const)
      for (const trecereLa of ["zeci", "sute", "ambele"] as const)
        for (const nivel of ["mediu", "provocare"] as const) {
          const { itemi } = genereazaC2(cfg({ joc: "scara", notiuni: ["op.adunare", "op.scadere"], nr: 60, optiuni: { ...optiuniC2Implicite(), trecere, trecereLa } }), nivel);
          for (const it of itemi) {
            const [a, b] = (it.verificare as { expr: string }).expr.split(/ [+-] /).map(Number);
            const t = it.text.includes("+") ? trecereAdunare(a, b) : trecereScadere(a, b);
            if (trecere === "fara") {
              expect(t.zeci || t.sute, it.text).toBe(false);
              // spec: la adunare, suma cifrelor pe fiecare ordin ≤ 9; la scădere, cifrele descăzutului ≥ ale scăzătorului
              const ca = String(a).padStart(3, "0").split("").map(Number), cb = String(b).padStart(3, "0").split("").map(Number);
              ca.forEach((d, i) => expect(it.text.includes("+") ? d + cb[i] <= 9 : d >= cb[i], it.text).toBe(true));
            } else {
              if (trecereLa === "zeci") expect(t.zeci && !t.sute, it.text).toBe(true);
              if (trecereLa === "sute") expect(t.sute && !t.zeci, it.text).toBe(true);
              if (trecereLa === "ambele") expect(t.zeci && t.sute, it.text).toBe(true);
            }
            const r = it.text.includes("+") ? a + b : a - b;
            expect(r).toBeGreaterThanOrEqual(0);
            expect(r).toBeLessThanOrEqual(1000);
          }
        }
  });

  it("căsuțele: soluția e unică (sau toate soluțiile sunt listate)", () => {
    for (const n of COMPATIBIL.casute)
      for (const nivel of NIVELURI) {
        const { itemi } = genereazaC2(cfg({ joc: "casute", notiuni: [n], nr: 15, seed: 3 }), nivel);
        for (const it of itemi) {
          const v = it.verificare as { expr: string; solutii: number[][] };
          if (v.solutii[0].length !== 1 || v.expr.includes(";")) continue;
          const [st, dr] = v.expr.split("=").map((x) => x.trim());
          let sol = 0;
          for (let x = 0; x <= 1100; x++) { const a = evalueaza(sub(st, [x]), false); if (a !== null && a === evalueaza(sub(dr, [x]), false)) sol++; }
          expect(sol, it.text).toBe(1);
        }
      }
    const prod = genereazaC2(cfg({ joc: "casute", notiuni: ["op.tabla"], nr: 60, seed: 4 }), "provocare").itemi.filter((i) => i.text.startsWith("□ × □"));
    expect(prod.length).toBeGreaterThan(0);
    for (const it of prod) {
      const c = Number(it.text.split("= ")[1]);
      const toate: number[][] = [];
      for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) if (a * b === c) toate.push([a, b]);
      expect((it.raspuns as { solutii: number[][] }).solutii).toEqual(toate);
    }
  });

  it("fără duplicate în sesiune; la Perechi nici fețele nu se repetă", () => {
    for (const joc of JOCURI_LISTA_C2)
      for (const nr of [10, 25, 50, 100]) {
        if (joc === "ceas" && nr > 25) continue; // ceasul are doar 48 de ore diferite la Mediu (pas 30 min)
        if (joc === "integrama") { const g = genereazaC2(cfg({ joc, notiuni: COMPATIBIL[joc], nr, seed: nr }), "mediu").itemi; expect(g.length, `integrama ${nr}`).toBeGreaterThanOrEqual(Math.min(nr, 28) * 0.7); expect(new Set(g.map((i) => i.cheie)).size).toBe(g.length); continue; }
        const { itemi } = genereazaC2(cfg({ joc, notiuni: COMPATIBIL[joc], nr, seed: nr }), "mediu");
        expect(itemi).toHaveLength(nr);
        expect(new Set(itemi.map((i) => i.cheie)).size, `${joc} ${nr}`).toBe(nr);
        if (joc === "perechi" || joc === "memorie") {
          expect(new Set(itemi.map((i) => i.afis)).size).toBe(nr);
          expect(new Set(itemi.map((i) => `${i.st}${JSON.stringify(i.vizual ?? "")}`)).size).toBe(nr);
        }
      }
  });

  it("Balanța: semnul corect, ~o treime egale; „echilibrează” are soluție unică; Ordonează respectă sensul", () => {
    const { itemi } = genereazaC2(cfg({ joc: "balanta", notiuni: COMPATIBIL.balanta, nr: 100, seed: 8 }), "mediu");
    const egale = itemi.filter((i) => i.afis === "=").length;
    expect(egale).toBeGreaterThan(10);
    expect(egale).toBeLessThan(60);
    const ech = genereazaC2(cfg({ joc: "balanta", notiuni: ["op.termen"], nr: 20 }), "provocare").itemi;
    ech.forEach((i) => { expect(i.echilibru).toBe(true); expect(Number(i.dr)).toBe(Number(i.st!.split(" + ")[0]) + Number(i.afis)); });
    for (const sens of ["crescator", "descrescator"] as const) {
      const o = genereazaC2(cfg({ joc: "ordonare", notiuni: ["num.ordonare"], nr: 20, optiuni: { ...optiuniC2Implicite(), sens } }), "provocare").itemi;
      o.forEach((i) => { expect(i.sens).toBe(sens); expect(i.cartonase).toHaveLength(6); expect(new Set(i.cartonase!.map((x) => x[0])).size).toBe(1); });
    }
  });

  it("Ceasul și Magazinul: ora de arătat, banii, restul", () => {
    for (const nivel of NIVELURI) {
      const c = genereazaC2(cfg({ joc: "ceas", notiuni: ["timp.ceas"], nr: 20, optiuni: { ...optiuniC2Implicite(), timpPas: 15 } }), nivel).itemi;
      for (const it of c) {
        if (nivel === "usor") expect(it.modCeas).toBe("potriveste");
        if (it.raspuns.tip === "ora") {
          expect(it.text).toBe(`Arată ${oraInLitere(it.raspuns.ore, it.raspuns.minute)}`);
          expect(verificaC2(it, `${it.raspuns.ore + 12}:${it.raspuns.minute}`)).toBe(true); // ora 20 = ora 8
          it.distractori.forEach((d) => expect(verificaC2(it, d.v)).toBe(false));
        }
      }
      const m = genereazaC2(cfg({ joc: "magazin", notiuni: ["bani.numara", "bani.rest"], nr: 40 }), nivel).itemi;
      for (const it of m) {
        const g = it.magazin!;
        if (g.mod === "numara") {
          const total = g.bani!.reduce((a, b) => a + b, 0);
          expect(it.afis).toBe(textBani(total));
          g.bani!.forEach((b) => expect([...MONEDE, ...BANCNOTE]).toContain(b));
        }
        if (g.mod === "plateste") { expect(inBani(g.pret!, [...MONEDE, ...BANCNOTE]).reduce((a, b) => a + b, 0)).toBe(g.pret); expect(g.pret!).toBeLessThanOrEqual(10000); }
        if (g.mod === "rest") { expect(g.platit!).toBeGreaterThan(g.pret!); expect(Number(it.afis) * (g.inBani ? 1 : 100)).toBe(g.platit! - g.pret!); }
        if (nivel === "usor" && g.pret) expect(g.pret % 100).toBe(0);
      }
    }
    expect(textBani(1230)).toBe("12 lei și 30 de bani");
    expect(textBani(100)).toBe("1 leu");
    expect(textBani(50)).toBe("50 de bani");
    expect(textBani(205)).toBe("2 lei și 5 bani");
  });

  it("Integrama: cuvintele se încrucișează corect; Provocarea are pașii; Mix automat urmează ordinea", () => {
    for (const nivel of NIVELURI) {
      const { itemi } = genereazaC2(cfg({ joc: "integrama", notiuni: ["op.adunare", "op.tabla", "num.litere"], nr: 20, seed: 4 }), nivel);
      expect(itemi.length).toBeGreaterThanOrEqual(15);
      const grupe = new Map<number, ItemC2[]>();
      itemi.forEach((i) => grupe.set(i.integrama!.grup, [...(grupe.get(i.integrama!.grup) ?? []), i]));
      for (const g of grupe.values()) {
        const grila = new Map<string, string>();
        for (const it of g) {
          const w = (it.raspuns as { valoare: string }).valoare, q = it.integrama!;
          for (let k = 0; k < w.length; k++) {
            const key = `${q.r + (q.dir === "v" ? k : 0)},${q.c + (q.dir === "o" ? k : 0)}`;
            if (grila.has(key)) expect(grila.get(key), `${w} se încrucișează greșit`).toBe(w[k]);
            grila.set(key, w[k]);
            expect(q.r + (q.dir === "v" ? k : 0)).toBeLessThan(q.rows);
            expect(q.c + (q.dir === "o" ? k : 0)).toBeLessThan(q.cols);
          }
        }
        if (g.length > 1) expect(grila.size, "cuvintele trebuie să se încrucișeze").toBeLessThan(g.reduce((a, i) => a + (i.raspuns as { valoare: string }).valoare.length, 0));
      }
      const it = itemi.find((i) => /[ĂÂÎȘȚ]/.test((i.raspuns as { valoare: string }).valoare));
      if (it) expect(verificaC2(it, (it.raspuns as { valoare: string }).valoare.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))).toBe(nivel !== "provocare");
    }
    for (const nivel of NIVELURI) {
      const p = genereazaC2(cfg({ joc: "provocare", notiuni: ["pb.una", "pb.doua"], nr: 30 }), nivel).itemi;
      expect(p.length).toBe(30);
      for (const it of p) {
        expect(it.pasi!.length).toBeGreaterThanOrEqual(1);
        expect(String(it.pasi![it.pasi!.length - 1].valoare)).toBe(it.afis);
        if (it.notiune === "pb.doua") expect(it.pasi!.length).toBe(2);
      }
    }
    const m = genereazaC2(cfg({ mix: true, notiuni: ["op.tabla", "op.adunare"], nr: 20 }), "mediu").itemi;
    expect(m).toHaveLength(20);
    const ordine = [...new Set(m.map((i) => i.joc))];
    expect(ordine).toEqual(["perechi", "casute", "bule"]);
  });

  it("numerele cu litere și ora spusă românește", () => {
    expect(numarInLitere(12)).toBe("doisprezece");
    expect(numarInLitere(21)).toBe("douăzeci și unu");
    expect(numarInLitere(200)).toBe("două sute");
    expect(numarInLitere(1000)).toBe("o mie");
    expect(oraInLitere(8, 0)).toBe("ora 8");
    expect(oraInLitere(8, 15)).toBe("8 și un sfert");
    expect(oraInLitere(8, 30)).toBe("8 și jumătate");
    expect(oraInLitere(8, 45)).toBe("9 fără un sfert");
    expect(oraInLitere(12, 45)).toBe("1 fără un sfert");
  });

  it("greșelile tipice se recunosc din răspuns", () => {
    const { itemi } = genereazaC2(cfg({ joc: "scara", notiuni: ["op.adunare"], nr: 30, optiuni: { ...optiuniC2Implicite(), trecere: "cu", trecereLa: "zeci" } }), "mediu");
    for (const it of itemi) {
      const [a, b] = (it.verificare as { expr: string }).expr.split(" + ").map(Number);
      const fara = [a % 10, Math.floor(a / 10) % 10, Math.floor(a / 100)].reduce((t, d, i) => t + ((d + [b % 10, Math.floor(b / 10) % 10, Math.floor(b / 100)][i]) % 10) * 10 ** i, 0);
      expect(clasificaEroare(it, String(fara)), it.text).toBe("trecere_omisa");
    }
    expect(clasificaEroare(itemi[0], null)).toBe("timp_expirat");
    const m = genereazaC2(cfg({ joc: "scara", notiuni: ["mas.transformari"], nr: 10 }), "usor").itemi[0];
    const metri = Number(m.text.split(" m")[0]);
    expect(clasificaEroare(m, String(10 * metri))).toBe("unitate_m_cm");
  });

  it("e determinist; nivelul schimbă exercițiile; regenerarea schimbă doar unul", () => {
    const c = cfg({ joc: "scara", notiuni: ["op.adunare", "op.tabla", "timp.ceas"], nr: 20 });
    const a = genereazaC2(c, "mediu").itemi;
    expect(genereazaC2(c, "mediu").itemi).toEqual(a);
    expect(genereazaC2(c, "usor").itemi.map((x) => x.cheie)).not.toEqual(a.map((x) => x.cheie));
    const b = genereazaC2({ ...c, inlocuiri: { i3: 1 } }, "mediu").itemi;
    expect(a.filter((x, i) => x.cheie !== b[i].cheie).map((x) => x.id)).toEqual(["i3"]);
  });

  it("configurația: URL și valori din afara programei", () => {
    const c = cfg({ joc: "bule", notiuni: ["op.tabla", "timp.ceas"], nr: 25, nivel: "provocare" });
    expect(decodificaC2(codificaC2(c))).toEqual(c);
    const rau = decodificaC2(btoa(JSON.stringify({ notiuni: ["x"], optiuni: { table: [11, 12], fractii: ["1/5"], baniMax: 500 }, nr: 999, joc: "zbor" })))!;
    expect(rau.optiuni.table).toEqual(optiuniC2Implicite().table);
    expect(rau.optiuni.fractii).toEqual([]);
    expect(rau.optiuni.baniMax).toBe(100);
    expect(rau.nr).toBe(100);
    expect(rau.joc).toBe("perechi");
    expect(NOTIUNI_C2).toContain("op.tabla" as NotiuneC2);
  });
});
