import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CAPITOLE_C5, JOCURI_C5, cfgIncercareC5, codificaC5, configC5Implicita, decodificaC5 } from "./config";
import { estePrim, genereazaC5, verificaC5, zec } from "./generator";
import type { ConfigC5, ItemC5 } from "./tipuri";

const cfg = (p: Partial<ConfigC5>): ConfigC5 => ({ ...configC5Implicita(7), ...p });

function corect(it: ItemC5): string {
  const r = it.raspuns;
  switch (r.tip) {
    case "numar": return String(r.valoare);
    case "rest": return `${r.cat}|${r.rest}`;
    case "varianta": return r.valoare;
    case "construit": return r.laturi ? `${r.laturi[0]}x${r.laturi[1]}` : `${r.perimetru / 2 - 1}x1`;
    case "colorare": return String(r.cerut);
    case "pereche": return "ok";
  }
}
/** „3/4”, „6,25”, „2” → număr */
const valoareText = (s: string) => { const t = s.replace(",", "."); if (t.includes("/")) { const [a, b] = t.split("/").map(Number); return a / b; } return Number(t); };

const toate: ItemC5[] = [];
for (const cap of CAPITOLE_C5)
  for (const nivel of ["1", "2"] as const)
    for (const joc of JOCURI_C5)
      for (const seed of [1, 2, 3, 4, 5]) toate.push(...genereazaC5(cfg({ capitole: [cap], nivel, joc, nr: 20, seed })).itemi);

describe("clasa a V-a: motorul", () => {
  it("fiecare capitol × nivel × joc dă 20 de exerciții, cu puține repetări", () => {
    for (const cap of CAPITOLE_C5)
      for (const nivel of ["1", "2"] as const)
        for (const joc of JOCURI_C5) {
          const { itemi } = genereazaC5(cfg({ capitole: [cap], nivel, joc, nr: 20 }));
          expect(itemi.length, `${cap} ${nivel} ${joc}`).toBe(20);
          expect(new Set(itemi.map((i) => i.cheie)).size, `${cap} ${nivel} ${joc} repetă`).toBeGreaterThanOrEqual(10);
        }
  });

  it("răspunsul corect e acceptat, unul greșit nu", () => {
    for (const it of toate) {
      expect(verificaC5(it, corect(it)), `${it.text} → ${corect(it)}`).toBe(true);
      if (it.raspuns.tip === "numar") expect(verificaC5(it, String(it.raspuns.valoare + 1))).toBe(false);
      if (it.raspuns.tip === "varianta") {
        expect(it.raspuns.variante).toContain(it.raspuns.valoare);
        expect(new Set(it.raspuns.variante).size).toBe(it.raspuns.variante.length);
        expect(it.raspuns.variante.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("variantele numerice au o singură valoare corectă; răspunsul coincide cu verificarea", () => {
    for (const it of toate) {
      const v = it.verificare, r = it.raspuns;
      if (v.tip === "rational" && r.tip === "varianta") {
        const asteptat = valoareText(v.valoare);
        expect(Math.abs(valoareText(r.valoare) - asteptat), it.text).toBeLessThan(1e-9);
        for (const g of r.variante.filter((x) => x !== r.valoare)) expect(Math.abs(valoareText(g) - asteptat), `${it.text}: ${g}`).toBeGreaterThan(1e-9);
      }
      if (v.tip === "comparatie" && r.tip === "varianta") expect(r.valoare).toBe(v.semn);
      if ("valoare" in v && typeof v.valoare === "number" && r.tip === "numar") expect(r.valoare, it.text).toBe(v.valoare);
      if (v.tip === "unic") {
        const are = (x: number) => (v.proprietate === "prim" ? estePrim(x) : x % Number(v.proprietate.slice(3)) === 0);
        expect(v.numere.filter(are), it.text).toEqual([v.valoare]);
      }
    }
  });

  it("numere naturale, rezolvare și indiciu la fiecare exercițiu, fără „undefined”", () => {
    for (const it of toate) {
      if (it.raspuns.tip === "numar") {
        expect(Number.isInteger(it.raspuns.valoare), it.text).toBe(true);
        expect(it.raspuns.valoare).toBeGreaterThanOrEqual(0);
      }
      expect(it.rezolvare.length, it.text).toBeGreaterThan(0);
      expect(`${it.text} ${it.rezolvare.join(" ")} ${it.afis}`).not.toMatch(/undefined|NaN|Infinity|−-|\+ -/);
    }
  });

  it("Balanța are talere, Memory fețe distincte, Constructorul un singur dreptunghi", () => {
    const b = genereazaC5(cfg({ capitole: ["puteri", "fractii", "zecimale", "arie", "ordine"], joc: "balanta", nr: 40 })).itemi;
    expect(b.every((i) => i.st && i.dr && i.fel === "comparatie")).toBe(true);
    const m = genereazaC5(cfg({ capitole: CAPITOLE_C5, joc: "memory", nr: 24, nivel: "amestecat" })).itemi;
    expect(m.length).toBe(24);
    const fete = m.flatMap((i) => [i.st!.text, i.dr!.text]);
    expect(new Set(fete).size).toBe(fete.length);
    const c = genereazaC5(cfg({ capitole: ["arie"], joc: "constructor", nr: 20, nivel: "amestecat" })).itemi;
    for (const i of c) expect(i.raspuns.tip).toBe("construit");
  });

  it("formatul zecimal românesc", () => {
    expect(zec(625)).toBe("6,25");
    expect(zec(250)).toBe("2,5");
    expect(zec(300)).toBe("3");
  });

  it("determinist, înlocuire punctuală, încercare nouă, URL", () => {
    const c = cfg({ capitole: CAPITOLE_C5, nr: 30, nivel: "amestecat" });
    expect(genereazaC5(c)).toEqual(genereazaC5(c));
    const a = genereazaC5(c).itemi, b = genereazaC5({ ...c, inlocuiri: { i3: 1 } }).itemi;
    expect(a.filter((x, i) => x.cheie !== b[i].cheie).map((x) => x.id)).toEqual(["i3"]);
    expect(genereazaC5(cfgIncercareC5(c, 1)).itemi.filter((x, i) => x.cheie === a[i].cheie).length).toBeLessThan(10);
    expect(decodificaC5(codificaC5(c))).toEqual(c);
  });

  it("exportă verificările pentru SymPy", () => {
    if (process.env.C5_EXPORT) writeFileSync(process.env.C5_EXPORT, JSON.stringify(toate.map((t) => ({ v: t.verificare, r: t.raspuns, text: t.text }))));
    expect(toate.length).toBe(10 * 2 * 5 * 5 * 20);
  });
});
