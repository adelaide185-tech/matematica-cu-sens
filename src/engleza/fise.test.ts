import { describe, expect, it } from "vitest";
import { UNITATI, type Varsta } from "./continut";
import { TIPURI_EN, codificaFisaEn, configFisaEnImplicita, curataFisaEn, decodificaFisaEn, genereazaFisaEn, scriptEducatoare, type ConfigFisaEn } from "./fise";

const cfg = (p: Partial<ConfigFisaEn>): ConfigFisaEn => ({ ...configFisaEnImplicita(3), tipuri: [...TIPURI_EN], ...p });
const img = (c: { emoji: string; numar?: number; culoare?: string }) => `${c.emoji}|${c.numar ?? ""}|${c.culoare ?? ""}`;

describe("fișe English 4–6: generatorul", () => {
  const combinatii = [...UNITATI.map((u) => [u.id]), ["animals", "food"], ["colours", "numbers"], UNITATI.map((u) => u.id)];
  for (const v of [4, 5, 6] as Varsta[])
    it(`${v} ani: toate tipurile, pe orice teme, sunt corecte`, () => {
      for (const unitati of combinatii) for (const seed of [1, 2, 7]) {
        const s = genereazaFisaEn(cfg({ varsta: v, unitati, seed }));
        expect(s.map((x) => x.tip)).toEqual(TIPURI_EN);
        for (const x of s) {
          expect(scriptEducatoare(x).length, `${x.tip} ${unitati}`).toBeGreaterThan(0);
          if (x.tip === "asculta") for (const r of x.randuri) {
            expect(r.variante.filter((c) => c.en === r.tinta.en).length).toBe(1);
            expect(new Set(r.variante.map(img)).size).toBe(r.variante.length); // imagini diferite pe rând
          }
          if (x.tip === "umbre") { expect([...x.dreapta].sort((a, b) => a.en.localeCompare(b.en))).toEqual([...x.stanga].sort((a, b) => a.en.localeCompare(b.en))); expect(new Set(x.stanga.map(img)).size).toBe(x.stanga.length); }
          if (x.tip === "numara") for (const i of x.itemi) { expect(i.variante).toContain(i.n); expect(i.n).toBeLessThanOrEqual({ 4: 5, 5: 7, 6: 10 }[v]); expect(new Set(i.variante).size).toBe(3); }
          if (x.tip === "intrus") for (const r of x.randuri) {
            expect(r.imagini).toContain(r.intrus);
            expect(new Set(r.imagini.map(img)).size).toBe(4);
            const tema = UNITATI.find((u) => u.titlu === r.tema)!;
            expect(tema.cuvinte.some((c) => c.en === r.intrus.en)).toBe(false);
            expect(r.imagini.filter((c) => tema.cuvinte.includes(c)).length).toBe(3);
          }
          if (x.tip === "coloreaza") for (const i of x.itemi) { expect(i.culoare.culoare).toBeTruthy(); expect(i.c.culoare).toBeFalsy(); }
          if (x.tip === "traseaza") for (const c of x.itemi) expect(c.en).not.toContain(" ");
        }
      }
    });

  it("determinist; ↻ schimbă doar exercițiul ales; configurația trece prin URL și e curățată", () => {
    const c = cfg({ unitati: ["animals", "toys"] });
    expect(genereazaFisaEn(c)).toEqual(genereazaFisaEn(c));
    const a = genereazaFisaEn(c), b = genereazaFisaEn({ ...c, inlocuiri: { sumbre: 1 } });
    expect(a.map((x, i) => JSON.stringify(x) === JSON.stringify(b[i]))).toEqual(TIPURI_EN.map((t) => t !== "umbre"));
    expect(decodificaFisaEn(codificaFisaEn(c))).toEqual(c);
    expect(curataFisaEn({ unitati: ["hack"], tipuri: ["x"], varsta: 9, inlocuiri: { "<script>": 1 } })).toMatchObject({ unitati: ["animals", "food"], varsta: 5, inlocuiri: {} });
  });
});
