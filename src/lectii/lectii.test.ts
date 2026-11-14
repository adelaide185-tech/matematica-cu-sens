import { describe, expect, it } from "vitest";
import { LECTII, steleLectie } from "./lectii";

describe("lecțiile ghidate", () => {
  it("au id-uri unice", () => {
    expect(new Set(LECTII.map((l) => l.id)).size).toBe(LECTII.length);
  });

  for (const l of LECTII) {
    describe(l.titlu, () => {
      it("fiecare pas folosește manipulativul lecției", () => {
        for (const p of l.pasi) expect(p.start.tip).toBe(l.manipulativ);
      });
      l.pasi.forEach((p, i) => {
        if (!p.verifica) return;
        it(`pasul ${i + 1}: rezolvarea arătată copilului este acceptată`, () => {
          expect(p.solutie).toBeDefined();
          const stare = p.solutie?.stare ?? p.start;
          const r = p.intrebare ? (p.solutie?.raspuns ?? null) : null;
          expect(p.verifica!(stare, r)).toBe(true);
        });
        it(`pasul ${i + 1}: nu se rezolvă singur fără răspuns`, () => {
          const v = p.verifica!(p.start, null);
          expect(v).not.toBe(true);
          expect(typeof v === "string" && v.length > 0).toBe(true);
        });
        if (p.intrebare) {
          it(`pasul ${i + 1}: un răspuns greșit primește un mesaj`, () => {
            const stare = p.solutie?.stare ?? p.start;
            expect(p.verifica!(stare, (p.solutie?.raspuns ?? 0) + 1)).not.toBe(true);
          });
        }
        it(`pasul ${i + 1}: are indicii`, () => {
          expect(p.indicii?.length ?? 0).toBeGreaterThan(0);
        });
      });
    });
  }

  it("stelele", () => {
    expect(steleLectie(5, 5)).toBe(3);
    expect(steleLectie(3, 5)).toBe(2);
    expect(steleLectie(1, 5)).toBe(1);
  });
});
