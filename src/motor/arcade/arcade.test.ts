import { describe, expect, it } from "vitest";
import { intrebariArcade, variantNumerice, type DificultateArcade } from "./intrebari";
import { puncteIntrebare, rezultatArcade } from "./scor";
import { Rng } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

describe("arcade: întrebări pentru toate clasele", () => {
  for (const clasa of [1, 2, 3, 4, 5] as Clasa[])
    for (const dif of ["usor", "mediu", "greu"] as DificultateArcade[])
      it(`clasa ${clasa}, ${dif}: 20 de întrebări valide, deterministe`, () => {
        for (const seed of [1, 7, 42, 99]) {
          const q = intrebariArcade(clasa, seed, 20, dif);
          expect(q.length, `seed ${seed}`).toBe(20);
          expect(new Set(q.map((x) => x.text)).size).toBe(20);
          for (const x of q) {
            expect(x.variante.length, x.text).toBeGreaterThanOrEqual(3);
            expect(x.variante.length).toBeLessThanOrEqual(4);
            expect(new Set(x.variante).size, x.text).toBe(x.variante.length);
            expect(x.variante.filter((v) => v === x.corect).length, x.text).toBe(1);
            expect(x.text.length).toBeGreaterThan(2);
            expect(x.text.length).toBeLessThanOrEqual(110);
            expect(x.rezolvare.length).toBeGreaterThan(0);
            // la calculele simple, explicația conține chiar răspunsul la această întrebare
            if (/^[\d ]+ [+−×:] [\d ]+ =$/.test(x.text)) expect(x.rezolvare.join(" "), x.text).toContain(x.corect);
            expect(`${x.text} ${x.variante.join(" ")}`).not.toMatch(/undefined|NaN/);
          }
          expect(intrebariArcade(clasa, seed, 20, dif)).toEqual(q);
        }
      });

  it("variantele numerice: corectul o dată, fără negative, apropiate", () => {
    for (let v = 0; v < 2000; v += 7) {
      const x = variantNumerice(new Rng(v + 1), v);
      expect(x).toContain(String(v));
      expect(new Set(x).size).toBe(x.length);
      expect(x.length).toBe(4);
      expect(x.every((s) => !s.startsWith("−"))).toBe(true);
    }
  });
});

describe("arcade: punctaj", () => {
  it("30 / 20 / 0 puncte după 0, 1, 2 greșeli", () => {
    expect([0, 1, 2, 3].map(puncteIntrebare)).toEqual([30, 20, 0, 0]);
  });
  it("stele, medalii și serie", () => {
    expect(rezultatArcade(Array(10).fill(0))).toMatchObject({ scor: 300, procent: 100, stele: 3, medalie: "diamant", serieMax: 10 });
    expect(rezultatArcade([...Array(9).fill(0), 1])).toMatchObject({ procent: 97, stele: 3, medalie: "aur" });
    expect(rezultatArcade([0, 0, 0, 0, 0, 0, 0, 2, 2, 2])).toMatchObject({ procent: 70, stele: 2, medalie: "argint", rezolvate: 7 });
    expect(rezultatArcade(Array(10).fill(2))).toMatchObject({ scor: 0, stele: 0, medalie: null });
  });
});

import { cfgIncercareArcade, codificaArcade, configArcadeImplicita, curataArcade, decodificaArcade, greseliDinAlegeri } from "./config";

describe("arcade: temă (configurație și verificarea pe server)", () => {
  const q = { corect: "42" };
  it("greșelile se recalculează din alegeri", () => {
    expect(greseliDinAlegeri(q, ["42"])).toBe(0);
    expect(greseliDinAlegeri(q, ["41", "42"])).toBe(1);
    expect(greseliDinAlegeri(q, [null, "42"])).toBe(1);
    expect(greseliDinAlegeri(q, ["41", null])).toBe(2);
    expect(greseliDinAlegeri(q, ["41", "40", "42"])).toBe(2); // după 2 greșeli, întrebarea e pierdută
    expect(greseliDinAlegeri(q, [])).toBe(2); // nerăspunsă
  });
  it("configurația trece prin URL și e curățată", () => {
    const c = { ...configArcadeImplicita(77), joc: "racheta" as const, clasa: 4 as const, viteza: 3 as const, n: 15, dif: "greu" as const };
    expect(decodificaArcade(codificaArcade(c))).toEqual(c);
    expect(curataArcade({ joc: "hack", clasa: 9, viteza: 7, n: 1000, dif: "x", seed: -5 })).toEqual({ seed: 5, joc: "baloane", clasa: 2, viteza: 1, n: 10, dif: "mediu" });
    expect(decodificaArcade("gunoi")).toBeNull();
  });
  it("„Mai joc o dată” schimbă întrebările, la fel pe client și pe server", () => {
    const c = configArcadeImplicita(5);
    expect(cfgIncercareArcade(c, 0)).toEqual(c);
    expect(cfgIncercareArcade(c, 1).seed).not.toBe(c.seed);
    expect(cfgIncercareArcade(c, 1)).toEqual(cfgIncercareArcade(c, 1));
  });
});
