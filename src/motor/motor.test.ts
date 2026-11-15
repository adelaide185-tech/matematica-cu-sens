import { describe, expect, it } from "vitest";
import { Rng } from "./rng";
import { GENERATOARE } from "./registru";
import { numarInLitere, cuSubstantiv } from "./limba";
import { roman } from "./generatoare/fractii-masuri";
import { genAdunare } from "./generatoare/operatii";
import { genereazaFisa } from "./fisa";
import { CURRICULUM } from "@/curriculum";
import { exista } from "./registru";
import type { Clasa } from "./tipuri";

/** Evaluează expresii simple din enunț: „3 × 4 + 5 =”, „(12 + 3) − 2 × 4 =”. */
function evalueaza(expr: string): number {
  const js = expr.replace(/=\s*$/, "").replace(/×/g, "*").replace(/−/g, "-").replace(/:/g, "/").replace(/\s/g, "");
  if (!/^[\d+\-*/()]+$/.test(js)) throw new Error(`expresie nesigură: ${expr}`);
  return Function(`"use strict"; return (${js});`)();
}

describe("limba română", () => {
  it("scrie numerele cu litere corect", () => {
    expect(numarInLitere(258)).toBe("două sute cincizeci și opt");
    expect(numarInLitere(109)).toBe("o sută nouă");
    expect(numarInLitere(615)).toBe("șase sute cincisprezece");
    expect(numarInLitere(1000)).toBe("o mie");
    expect(numarInLitere(2012)).toBe("două mii doisprezece");
    expect(numarInLitere(12000)).toBe("douăsprezece mii");
    expect(numarInLitere(21000)).toBe("douăzeci și una de mii");
    expect(numarInLitere(100000)).toBe("o sută de mii");
    expect(numarInLitere(105000)).toBe("o sută cinci mii");
    expect(numarInLitere(940)).toBe("nouă sute patruzeci");
  });
  it("pune „de” unde trebuie", () => {
    expect(cuSubstantiv(15, "măr", "mere")).toBe("15 mere");
    expect(cuSubstantiv(24, "măr", "mere")).toBe("24 de mere");
    expect(cuSubstantiv(105, "măr", "mere")).toBe("105 mere");
    expect(cuSubstantiv(120, "măr", "mere")).toBe("120 de mere");
    expect(cuSubstantiv(1, "măr", "mere")).toBe("1 măr");
  });
  it("cifre romane", () => {
    expect(roman(14)).toBe("XIV");
    expect(roman(49)).toBe("XLIX");
    expect(roman(1999)).toBe("MCMXCIX");
  });
});

describe("adunarea cu/fără trecere peste ordin", () => {
  it("respectă cerința de trecere", () => {
    const rng = new Rng(7);
    for (let i = 0; i < 500; i++) {
      const [a, b] = genAdunare(rng, 3, false);
      const fara = String(a).padStart(3, "0").split("").every((d, j) => Number(d) + Number(String(b).padStart(3, "0")[j]) < 10);
      expect(fara).toBe(true);
      expect(a + b).toBeLessThan(1000);
    }
  });
});

describe("toate generatoarele, toate clasele, toate nivelurile", () => {
  for (const g of GENERATOARE) {
    it(`${g.id} produce itemi valizi și răspunsuri corecte`, () => {
      for (const clasa of g.clase) {
        for (const nivel of g.niveluri) {
          for (let seed = 1; seed <= 150; seed++) {
            const item = g.generate(new Rng(seed * 7919 + clasa), nivel, clasa);
            expect(item.cerinte.length).toBeGreaterThan(0);
            expect(item.enunt.length).toBeGreaterThan(0);
            for (const c of item.cerinte) {
              expect(c.raspuns, `${g.id} cl.${clasa} ${nivel}`).not.toMatch(/NaN|undefined|-1$/);
              if (c.optiuni) expect(c.optiuni).toContain(c.raspuns);
              // calcule directe: „a op b =” → verificăm rezultatul
              if (/^[\d\s+−×:()]+=$/.test(c.text) && /[+−×:]/.test(c.text) && /^\d+$/.test(c.raspuns)) {
                const v = evalueaza(c.text.replace(/(\d) (\d)/g, "$1$2"));
                expect(Number(c.raspuns), `${c.text} ${c.raspuns}`).toBe(v);
                expect(v).toBeGreaterThanOrEqual(0);
              }
              // împărțirea cu rest: restul < împărțitor și proba corectă
              const m = c.text.match(/^(\d+) : (\d+) =$/);
              if (m && c.raspuns.includes("rest")) {
                const [cat, rest] = c.raspuns.split(" rest ").map(Number);
                expect(cat * Number(m[2]) + rest).toBe(Number(m[1]));
                expect(rest).toBeLessThan(Number(m[2]));
              }
            }
          }
        }
      }
    });
  }
});

describe("fișe și curriculum", () => {
  it("fișa e reproductibilă din seed", () => {
    const cfg = { clasa: 2 as Clasa, nivel: "evaluare" as const, generatoare: ["numeratie.vecini", "numeratie.comparare", "probleme.o-operatie"], nrItemi: 6, seed: 42 };
    expect(JSON.stringify(genereazaFisa(cfg))).toBe(JSON.stringify(genereazaFisa(cfg)));
    expect(genereazaFisa(cfg).puncteMaxime).toBeGreaterThan(0);
  });
  it("toate generatoarele din curriculum există", () => {
    for (const capitole of Object.values(CURRICULUM))
      for (const cap of capitole) for (const l of cap.lectii) for (const g of l.generatoare) expect(exista(g), g).toBe(true);
  });
});

describe("fișe pe lecții cu multe exerciții", () => {
  it("peste 14 exerciții: cerințele cresc, cel mult 10 subpuncte pe exercițiu", async () => {
    const { CURRICULUM } = await import("@/curriculum");
    const { genereazaFisa } = await import("./fisa");
    const total = (n: number, gen: string[]) =>
      genereazaFisa({ clasa: 2, nivel: "consolidare", generatoare: gen, nrItemi: n, seed: 4 }).itemi;
    for (const l of CURRICULUM[2].flatMap((c) => c.lectii).filter((l) => l.generatoare.length).slice(0, 12)) {
      const mic = total(14, l.generatoare), mare = total(100, l.generatoare);
      const cer = (it: typeof mic) => it.reduce((s, x) => s + x.cerinte.length, 0);
      expect(cer(mare), l.titlu).toBeGreaterThan(cer(mic));
      mare.forEach((it) => expect(it.cerinte.length).toBeLessThanOrEqual(10));
    }
  });
});
