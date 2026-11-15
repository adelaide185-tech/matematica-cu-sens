import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { areTrecereAdunare, areTrecereScadere, banal, corect, evalueaza, genereazaCalcul, coloaneFisa } from "./generator";
import { blocImplicit, codifica, configImplicita, decodifica } from "./config";
import type { Bloc, ConfigCalcul, ExCalcul, TipOperatie } from "./tipuri";

const TIPURI: TipOperatie[] = ["adunare", "scadere", "inmultire", "impartire", "combinate", "ecuatii", "mental"];

/** Verificare independentă de generator: recalculează din expresia ASCII. */
function verifica(e: ExCalcul): boolean {
  if (e.expresie.includes("=")) {
    const [st, dr] = e.expresie.split("=").map((s) => s.trim());
    if (e.raspuns.tip !== "numar") return false;
    const v = e.raspuns.valoare;
    const s = evalueaza(st.replace("x", String(v)), false);
    const d = evalueaza(dr.replace("x", String(v)), false);
    return s !== null && s === d;
  }
  if (e.raspuns.tip === "rest") {
    const [n, d] = e.expresie.split("/").map(Number);
    return n === e.raspuns.cat * d + e.raspuns.rest && e.raspuns.rest > 0 && e.raspuns.rest < d;
  }
  return evalueaza(e.expresie, false) === e.raspuns.valoare;
}

function cfg(blocuri: Bloc[], seed = 7): ConfigCalcul {
  return { ...configImplicita(seed), blocuri };
}

/** combinații reprezentative de condiții, pentru fiecare tip de operație */
function variante(): Bloc[] {
  const v: Bloc[] = [];
  const intervale: [number, number, boolean][] = [[0, 10, true], [0, 20, true], [0, 100, true], [0, 1000, true], [10, 99, false], [100, 999, false], [1000, 9999, false]];
  for (const [min, max, r] of intervale) {
    for (const trecere of ["oricare", "fara", "cu"] as const) {
      v.push({ ...blocImplicit("adunare"), min, max, rezultatInInterval: r, trecere, nr: 25 });
      v.push({ ...blocImplicit("adunare"), min, max, rezultatInInterval: r, trecere, termeni: 3, nr: 25 });
      v.push({ ...blocImplicit("scadere"), min, max, rezultatInInterval: r, trecere, nr: 25 });
    }
    v.push({ ...blocImplicit("scadere"), min, max, negative: true, nr: 20 });
    v.push({ ...blocImplicit("inmultire"), min, max, rezultatInInterval: r, tabele: undefined, nr: 25 });
    for (const rest of ["exacta", "cu-rest", "amestecat"] as const) v.push({ ...blocImplicit("impartire"), min, max, rezultatInInterval: r, tabele: undefined, rest, nr: 25 });
    for (const paranteze of [false, true]) for (const nrOperatii of [2, 3]) v.push({ ...blocImplicit("combinate"), min, max, rezultatInInterval: r, paranteze, nrOperatii, nr: 25 });
    v.push({ ...blocImplicit("ecuatii"), min, max, rezultatInInterval: r, operatii: ["+", "-", "×", ":"], nr: 25 });
    v.push({ ...blocImplicit("mental"), min: Math.max(1, min), max, nr: 25 });
  }
  for (const t of [[2], [7], [2, 5, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]]) {
    v.push({ ...blocImplicit("inmultire"), tabele: t, nr: 20 });
    for (const rest of ["exacta", "cu-rest"] as const) v.push({ ...blocImplicit("impartire"), tabele: t, rest, nr: 20 });
  }
  return v;
}

describe("generatorul de calcul", () => {
  it("evaluatorul respectă ordinea operațiilor și parantezele", () => {
    expect(evalueaza("2 + 3 * 4")).toBe(14);
    expect(evalueaza("(2 + 3) * 4")).toBe(20);
    expect(evalueaza("20 - 8 / 4 * 2")).toBe(16);
    expect(evalueaza("7 / 2")).toBeNull();
    expect(evalueaza("3 - 5")).toBeNull();
    expect(areTrecereAdunare([27, 15])).toBe(true);
    expect(areTrecereAdunare([21, 15])).toBe(false);
    expect(areTrecereScadere(52, 17)).toBe(true);
    expect(areTrecereScadere(57, 12)).toBe(false);
  });

  it("toate rezultatele sunt corecte și toate condițiile sunt respectate", () => {
    const toate: ExCalcul[] = [];
    let n = 0;
    for (const [i, b] of variante().entries()) {
      for (const seed of [1, 2, 3]) {
        const { exercitii } = genereazaCalcul(cfg([b], seed * 1000 + i));
        for (const e of exercitii) {
          n++;
          toate.push(e);
          expect(verifica(e), `${e.text} → ${JSON.stringify(e.raspuns)} (${e.expresie})`).toBe(true);
          const nums = (e.expresie.match(/\d+/g) ?? []).map(Number);
          const rez = e.raspuns.tip === "numar" ? e.raspuns.valoare : e.raspuns.cat;
          if (b.tip === "adunare" || b.tip === "scadere") {
            nums.forEach((x) => expect(x).toBeGreaterThanOrEqual(b.min));
            nums.forEach((x) => expect(x).toBeLessThanOrEqual(b.max));
          }
          if (b.tip === "adunare" && b.rezultatInInterval) expect(rez).toBeLessThanOrEqual(b.max);
          if (b.tip === "scadere" && !b.negative) expect(rez).toBeGreaterThanOrEqual(0);
          if (b.tip === "adunare" && b.trecere === "fara") expect(areTrecereAdunare(nums)).toBe(false);
          if (b.tip === "adunare" && b.trecere === "cu") expect(areTrecereAdunare(nums)).toBe(true);
          if (b.tip === "scadere" && b.trecere === "fara" && !b.negative) expect(areTrecereScadere(nums[0], nums[1])).toBe(false);
          if (b.tip === "scadere" && b.trecere === "cu" && !b.negative) expect(areTrecereScadere(nums[0], nums[1])).toBe(true);
          if (b.tip === "impartire" && b.rest === "exacta") expect(e.raspuns.tip).toBe("numar");
          if (b.tip === "impartire" && b.rest === "cu-rest") expect(e.raspuns.tip).toBe("rest");
          if (b.tip === "impartire" && !b.tabele && b.rest === "exacta") expect(nums[0]).toBeLessThanOrEqual(b.max);
          if (b.tip === "combinate" && b.rezultatInInterval) expect(rez).toBeLessThanOrEqual(b.max);
          if (b.tip !== "scadere" || !b.negative) expect(rez).toBeGreaterThanOrEqual(0);
          expect(e.text).not.toMatch(/undefined|NaN/);
        }
      }
    }
    expect(n).toBeGreaterThan(3000);
    if (process.env.CALCUL_EXPORT) writeFileSync(process.env.CALCUL_EXPORT, JSON.stringify(toate));
  });

  it("fără exerciții repetate când intervalul permite; avertizează când nu", () => {
    for (const t of TIPURI) {
      const b = { ...blocImplicit(t), nr: 100, max: t === "mental" ? 1000 : 1000, tabele: undefined };
      const { exercitii, avertismente } = genereazaCalcul(cfg([b], 99));
      expect(exercitii).toHaveLength(100);
      expect(new Set(exercitii.map((e) => e.cheie)).size, t).toBe(100);
      expect(avertismente).toEqual([]);
    }
    // 0–10, fără trecere, 2 termeni: doar 66 de adunări posibile
    const mic = genereazaCalcul(cfg([{ ...blocImplicit("adunare"), min: 0, max: 10, nr: 100 }], 3));
    expect(mic.exercitii).toHaveLength(100);
    expect(mic.avertismente[0]).toMatch(/se repetă/);
    expect(new Set(mic.exercitii.map((e) => e.cheie)).size).toBeGreaterThanOrEqual(60);
  });

  it("exercițiile banale (cu 0, × 1, a − a) sunt rare", () => {
    for (const b of [{ ...blocImplicit("scadere"), min: 0, max: 20, nr: 40 }, { ...blocImplicit("inmultire"), nr: 40 }, { ...blocImplicit("adunare"), min: 0, max: 100, nr: 40 }]) {
      const ex = genereazaCalcul(cfg([b], 17)).exercitii;
      expect(ex.filter(banal).length, b.tip).toBeLessThanOrEqual(5);
    }
    // dar rămân posibile când intervalul nu permite altceva
    expect(genereazaCalcul(cfg([{ ...blocImplicit("adunare"), min: 0, max: 1, nr: 3 }])).exercitii.length).toBe(3);
  });

  it("condiții imposibile → avertisment, nu exerciții greșite", () => {
    const r = genereazaCalcul(cfg([{ ...blocImplicit("adunare"), min: 1, max: 9, rezultatInInterval: true, trecere: "cu", nr: 10 }]));
    expect(r.exercitii).toHaveLength(0);
    expect(r.avertismente[0]).toMatch(/nu există exerciții/);
  });

  it("e determinist; regenerarea unui exercițiu nu le schimbă pe celelalte", () => {
    const c = cfg([blocImplicit("adunare"), blocImplicit("inmultire"), blocImplicit("combinate")], 42);
    const a = genereazaCalcul(c).exercitii;
    expect(genereazaCalcul(c).exercitii).toEqual(a);
    const b = genereazaCalcul({ ...c, inlocuiri: { "b1-4": 1 } }).exercitii;
    const dif = a.filter((e, i) => e.cheie !== b[i].cheie);
    expect(dif.map((e) => e.id)).toEqual(["b1-4"]);
    // amestecarea păstrează aceleași exerciții
    const m = genereazaCalcul({ ...c, amesteca: true }).exercitii;
    expect(new Set(m.map((e) => e.cheie))).toEqual(new Set(a.map((e) => e.cheie)));
    expect(m.map((e) => e.id)).not.toEqual(a.map((e) => e.id));
  });

  it("se pot combina tipuri: 10 adunări + 10 scăderi + 5 înmulțiri; până la 200 de exerciții", () => {
    const c = cfg([{ ...blocImplicit("adunare"), nr: 10 }, { ...blocImplicit("scadere"), nr: 10 }, { ...blocImplicit("inmultire"), nr: 5 }]);
    const r = genereazaCalcul(c).exercitii;
    expect(r.map((e) => e.tip)).toEqual([...Array(10).fill("adunare"), ...Array(10).fill("scadere"), ...Array(5).fill("inmultire")]);
    const mare = genereazaCalcul(cfg([{ ...blocImplicit("adunare"), max: 10000, nr: 150 }, { ...blocImplicit("scadere"), max: 10000, nr: 150 }]));
    expect(mare.exercitii).toHaveLength(200);
    expect(mare.avertismente.join(" ")).toMatch(/cel mult 200/);
  });

  it("configurația trece prin URL fără pierderi și valorile greșite sunt corectate", () => {
    const c = cfg([{ ...blocImplicit("combinate"), paranteze: true }], 5);
    c.antet.titlu = "Fișă – înmulțiri și împărțiri ăîșț";
    c.inlocuiri = { "b0-2": 3 };
    expect(decodifica(codifica(c))).toEqual(decodifica(codifica(decodifica(codifica(c))!)));
    expect(decodifica(codifica(c))!.antet.titlu).toBe(c.antet.titlu);
    const rau = decodifica(btoa(JSON.stringify({ blocuri: [{ tip: "hack", nr: 9999, min: -5, max: "x" }], coloane: 9 })))!;
    expect(rau.blocuri[0].tip).toBe("adunare");
    expect(rau.blocuri[0].nr).toBe(200);
    expect(rau.blocuri[0].min).toBe(0);
    expect(rau.coloane).toBe("auto");
    expect(decodifica("%%%")).toBeNull();
  });

  it("verificarea online acceptă formatări uzuale", () => {
    const [e] = genereazaCalcul(cfg([{ ...blocImplicit("adunare"), min: 5000, max: 9000, rezultatInInterval: false, nr: 1 }])).exercitii;
    const v = (e.raspuns as { valoare: number }).valoare;
    expect(corect(e, { valoare: String(v) })).toBe(true);
    expect(corect(e, { valoare: ` ${String(v).replace(/(\d)(\d{3})$/, "$1 $2")} ` })).toBe(true);
    expect(corect(e, { valoare: String(v + 1) })).toBe(false);
    expect(corect(e, { valoare: "" })).toBe(false);
    const [r] = genereazaCalcul(cfg([{ ...blocImplicit("impartire"), rest: "cu-rest", nr: 1 }])).exercitii;
    const rr = r.raspuns as { cat: number; rest: number };
    expect(corect(r, { cat: String(rr.cat), rest: String(rr.rest) })).toBe(true);
    expect(corect(r, { cat: String(rr.cat), rest: "0" })).toBe(false);
  });

  it("coloanele se aleg după numărul de exerciții", () => {
    const ex = (n: number) => genereazaCalcul(cfg([{ ...blocImplicit("adunare"), max: 1000, nr: n }])).exercitii;
    expect(coloaneFisa({ coloane: "auto" }, ex(10))).toBe(2);
    expect(coloaneFisa({ coloane: "auto" }, ex(25))).toBe(3);
    expect(coloaneFisa({ coloane: "auto" }, ex(100))).toBe(4);
    expect(coloaneFisa({ coloane: 2 }, ex(100))).toBe(2);
  });
});
