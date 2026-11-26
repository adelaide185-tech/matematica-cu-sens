import { describe, expect, it } from "vitest";
import { PERECHI_VARSTA, RUNDE_VARSTA, UNITATI, VARIANTE_VARSTA, cuCuvant, type Varsta } from "./continut";
import { cartiPerechi, rundeAsculta, steleAsculta, stelePerechi } from "./runde";

describe("engleza 4–6: conținutul", () => {
  it("fiecare unitate are cel puțin 6 cuvinte, distincte, cu imagine și traducere", () => {
    expect(UNITATI.length).toBeGreaterThanOrEqual(9);
    expect(new Set(UNITATI.map((u) => u.id)).size).toBe(UNITATI.length);
    for (const u of UNITATI) {
      expect(u.cuvinte.length, u.id).toBeGreaterThanOrEqual(6);
      expect(new Set(u.cuvinte.map((c) => c.en)).size, u.id).toBe(u.cuvinte.length);
      // imaginile trebuie să se deosebească între ele (altfel copilul nu are cum să aleagă)
      const fete = u.cuvinte.map((c) => `${c.emoji}|${c.numar ?? ""}|${c.culoare ?? ""}`);
      expect(new Set(fete).size, u.id).toBe(fete.length);
      for (const c of u.cuvinte) { expect(c.emoji.length).toBeGreaterThan(0); expect(c.ro.length).toBeGreaterThan(1); }
      expect(cuCuvant(u.cerinta, "cat")).toContain("cat");
    }
  });
});

describe("engleza 4–6: rundele", () => {
  for (const v of [4, 5, 6] as Varsta[])
    it(`${v} ani: numărul de runde și de imagini, ținta printre variante, fără repetare la rând`, () => {
      for (const u of UNITATI) for (const seed of [1, 2, 3, 99]) {
        const r = rundeAsculta(u, v, seed);
        expect(r.length).toBe(RUNDE_VARSTA[v]);
        for (const [i, x] of r.entries()) {
          expect(x.variante.length).toBe(Math.min(VARIANTE_VARSTA[v], u.cuvinte.length));
          expect(x.variante.filter((c) => c.en === x.tinta.en).length).toBe(1);
          expect(new Set(x.variante.map((c) => c.en)).size).toBe(x.variante.length);
          if (i) expect(x.tinta.en).not.toBe(r[i - 1].tinta.en);
        }
        expect(rundeAsculta(u, v, seed)).toEqual(r);
        const k = cartiPerechi(u, v, seed);
        expect(k.length).toBe(2 * Math.min(PERECHI_VARSTA[v], u.cuvinte.length));
        expect(new Set(k.map((x) => x.cheie)).size).toBe(k.length);
      }
    });
  it("stelele: mereu cel puțin una", () => {
    expect([0, 1, 2, 3, 4, 10].map((g) => steleAsculta(g, 8))).toEqual([3, 3, 2, 2, 1, 1]);
    expect([4, 8, 9, 12, 13, 30].map((m) => stelePerechi(m, 4))).toEqual([3, 3, 2, 2, 1, 1]);
  });
});
