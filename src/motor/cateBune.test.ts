import { describe, expect, it } from "vitest";
import { cateBune, mesajCateBune } from "./cateBune";
import { cateBuneC2 } from "./clasa2/generator";
import { cateBuneC3 } from "./clasa3/generator";
import type { ItemC2 } from "./clasa2/tipuri";
import type { ItemC3 } from "./clasa3/tipuri";

describe("cateBune", () => {
  it("numără pozițiile egale", () => {
    expect(cateBune([1, 2, 9], [1, 2, 3])).toEqual({ bune: 2, total: 3 });
    expect(cateBune([], [1, 2])).toEqual({ bune: 0, total: 2 });
    expect(cateBune([1, 2, 3, 4], [1, 2])).toEqual({ bune: 2, total: 2 });
  });
  it("mesajul apare doar de la 2 elemente în sus", () => {
    expect(mesajCateBune({ bune: 4, total: 6 }, "litere")).toBe("Ai 4 din 6 litere bune.");
    expect(mesajCateBune({ bune: 0, total: 1 }, "căsuțe")).toBeNull();
    expect(mesajCateBune(null, "căsuțe")).toBeNull();
  });
});

describe("cateBuneC2", () => {
  const integrama = (diacritice: boolean) => ({ raspuns: { tip: "valoare", valoare: "ȘAPTE" }, integrama: { diacritice } }) as unknown as ItemC2;
  it("integrama: litere pe poziție, cu sau fără diacritice", () => {
    expect(cateBuneC2(integrama(false), "sapti")).toEqual({ bune: 4, total: 5 });
    expect(cateBuneC2(integrama(true), "SAPTI")).toEqual({ bune: 3, total: 5 });
  });
  it("căsuțe: doar când există o singură soluție", () => {
    const una = { raspuns: { tip: "casute", solutii: [[3, 4]] } } as unknown as ItemC2;
    const doua = { raspuns: { tip: "casute", solutii: [[3, 4], [2, 6]] } } as unknown as ItemC2;
    expect(cateBuneC2(una, "3|5")).toEqual({ bune: 1, total: 2 });
    expect(cateBuneC2(doua, "3|5")).toBeNull();
  });
});

describe("cateBuneC3", () => {
  it("împărțirea cu rest: câtul și restul", () => {
    const it3 = { raspuns: { tip: "rest", cat: 12, rest: 3 } } as unknown as ItemC3;
    expect(cateBuneC3(it3, "12|4")).toEqual({ bune: 1, total: 2 });
    expect(cateBuneC3({ raspuns: { tip: "numar", valoare: 5 } } as unknown as ItemC3, "4")).toBeNull();
  });
});
