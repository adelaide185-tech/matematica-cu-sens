import { describe, expect, it } from "vitest";
import { puncteaza, trofeeClasa, urmatoareaMedalie } from "./clasa3/generator";

const r = (corect: boolean, incercari = 1) => ({ corect, incercari, timpMs: 5000 });

describe("urmatoareaMedalie", () => {
  it("fără medalie: bronzul și câte răspunsuri din prima mai lipsesc", () => {
    const p = puncteaza([r(true), r(true), r(true), r(false), r(false), r(false), r(false), r(false), r(false), r(false)], 10);
    expect(p.medalie).toBeNull();
    expect(urmatoareaMedalie(p)).toEqual({ medalie: "bronz", lipsa: 2 });
  });
  it("argint la 80%: pentru aur mai trebuie 1", () => {
    const p = puncteaza([...Array(8)].map(() => r(true)).concat([r(false), r(false)]), 10);
    expect(p.medalie).toBe("argint");
    expect(urmatoareaMedalie(p)).toEqual({ medalie: "aur", lipsa: 1 });
  });
  it("aur: următorul e diamantul (toate din prima), fără număr", () => {
    const p = puncteaza([...Array(9)].map(() => r(true)).concat([r(true, 2)]), 10);
    expect(p.medalie).toBe("aur");
    expect(urmatoareaMedalie(p)).toEqual({ medalie: "diamant", lipsa: null });
  });
  it("diamant: nu mai e nimic de urmat", () => {
    expect(urmatoareaMedalie(puncteaza([r(true), r(true)], 2))).toBeNull();
  });
});

describe("trofeeClasa", () => {
  it("numără cea mai bună medalie a fiecărui elev la fiecare temă", () => {
    const t = trofeeClasa([
      { elevId: "a", temaId: "t1", medalie: "bronz" },
      { elevId: "a", temaId: "t1", medalie: "aur" },
      { elevId: "a", temaId: "t2", medalie: "argint" },
      { elevId: "b", temaId: "t1", medalie: null },
      { elevId: "b", temaId: "t1", medalie: "diamant" },
      { elevId: "c", temaId: "t1", medalie: null },
    ]);
    expect(t).toEqual({ bronz: 0, argint: 1, aur: 1, diamant: 1 });
  });
});
