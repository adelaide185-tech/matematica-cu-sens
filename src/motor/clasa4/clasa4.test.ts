import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evalueaza } from "@/motor/calcul/generator";
import { CAPITOLE_C4, JOCURI_C4, cfgIncercareC4, codificaC4, configC4Implicita, decodificaC4 } from "./config";
import { genereazaC4, rotunjeste, verificaC4 } from "./generator";
import type { ConfigC4, ItemC4 } from "./tipuri";

const cfg = (p: Partial<ConfigC4>): ConfigC4 => ({ ...configC4Implicita(7), ...p });

/** răspunsul corect, în formatul trimis de joc */
function corect(it: ItemC4): string {
  const r = it.raspuns;
  switch (r.tip) {
    case "numar": return String(r.valoare);
    case "rest": return `${r.cat}|${r.rest}`;
    case "varianta": return r.valoare;
    case "construit": return r.laturi ? `${r.laturi[0]}x${r.laturi[1]}` : (() => { const s = r.perimetru / 2; return `${s - 1}x1`; })();
    case "colorare": return String(r.cerut);
    case "pereche": return "ok";
  }
}

const toate: ItemC4[] = [];
for (const cap of CAPITOLE_C4)
  for (const nivel of ["1", "2"] as const)
    for (const joc of JOCURI_C4)
      for (const seed of [1, 2, 3, 4, 5]) toate.push(...genereazaC4(cfg({ capitole: [cap], nivel, joc, nr: 20, seed })).itemi);

describe("clasa a IV-a: motorul", () => {
  it("fiecare capitol × nivel × joc dă 20 de exerciții, fără repetări", () => {
    for (const cap of CAPITOLE_C4)
      for (const nivel of ["1", "2"] as const)
        for (const joc of JOCURI_C4) {
          const { itemi } = genereazaC4(cfg({ capitole: [cap], nivel, joc, nr: 20 }));
          if (joc === "memory" && (cap === "tabele" || (cap === "logica" && nivel === "1"))) { expect(itemi.length).toBe(0); continue; }
          expect(itemi.length, `${cap} ${nivel} ${joc}`).toBe(20);
          expect(new Set(itemi.map((i) => i.cheie)).size, `${cap} ${nivel} ${joc} repetă`).toBeGreaterThanOrEqual(joc === "memory" ? 12 : 15);
          for (const i of itemi) {
            expect(i.capitol).toBe(cap);
            expect(i.nivel).toBe(nivel === "1" ? 1 : 2);
          }
        }
  });

  it("răspunsul corect este acceptat, unul greșit nu", () => {
    for (const it of toate) {
      expect(verificaC4(it, corect(it)), `${it.text} → ${corect(it)}`).toBe(true);
      if (it.raspuns.tip === "numar") expect(verificaC4(it, String(it.raspuns.valoare + 1))).toBe(false);
    }
  });

  it("verificarea independentă coincide cu răspunsul", () => {
    for (const it of toate) {
      const v = it.verificare, r = it.raspuns;
      if (v.tip === "egal") {
        expect(evalueaza(v.expr), v.expr).toBe(v.valoare);
        if (r.tip === "numar") expect(r.valoare).toBe(v.valoare);
      }
      if (v.tip === "comparatie" && r.tip === "varianta") expect(r.valoare).toBe(v.semn);
      if ((v.tip === "sistem" || v.tip === "perimetru" || v.tip === "numarare" || v.tip === "estimare") && r.tip === "numar") expect(r.valoare).toBe(v.valoare);
      if (v.tip === "perimetru") expect(v.laturi.reduce((a, b) => a + b, 0)).toBe(v.valoare);
      if ((v.tip === "eveniment" || v.tip === "probabil") && r.tip === "varianta") expect(r.valoare).toBe(v.valoare);
      if (v.tip === "estimare") {
        const [a, b] = v.numere;
        const ra = rotunjeste(a, v.la), rb = v.op === "*" ? b : rotunjeste(b, v.la);
        expect(v.op === "+" ? ra + rb : v.op === "-" ? ra - rb : ra * rb).toBe(v.valoare);
      }
      if (r.tip === "varianta") {
        expect(r.variante).toContain(r.valoare);
        expect(new Set(r.variante).size).toBe(r.variante.length);
      }
    }
  });

  it("numere naturale, până la 1 000 000; fiecare exercițiu are rezolvare și indiciu", () => {
    for (const it of toate) {
      if (it.raspuns.tip === "numar") {
        expect(Number.isInteger(it.raspuns.valoare), it.text).toBe(true);
        expect(it.raspuns.valoare).toBeGreaterThanOrEqual(0);
        expect(it.raspuns.valoare).toBeLessThanOrEqual(1_000_000);
      }
      expect(it.rezolvare.length, it.text).toBeGreaterThan(0);
      expect(it.indiciu.length).toBeGreaterThan(5);
      expect(it.text).not.toMatch(/undefined|NaN/);
      expect(it.rezolvare.join(" ")).not.toMatch(/undefined|NaN/);
    }
  });

  it("Balanța are două talere, Memory două fețe distincte, Constructorul dreptunghiuri pe grilă", () => {
    const b = genereazaC4(cfg({ capitole: ["lungime", "masa", "timp", "geometrie"], joc: "balanta", nr: 40 })).itemi;
    expect(b.every((i) => i.st && i.dr && i.fel === "comparatie")).toBe(true);
    const sm = genereazaC4(cfg({ capitole: CAPITOLE_C4, joc: "memory", nr: 24 }));
    const m = sm.itemi;
    expect(m.length).toBe(24);
    expect(sm.avertismente.join(" ")).toMatch(/tabele/);
    expect(m.every((i) => i.raspuns.tip === "pereche" && verificaC4(i, "ok"))).toBe(true);
    const fete = m.flatMap((i) => [i.st!.text, i.dr!.text]);
    expect(new Set(fete).size).toBe(fete.length);
    const c = genereazaC4(cfg({ capitole: ["geometrie"], joc: "constructor", nr: 30, nivel: "amestecat" })).itemi;
    for (const i of c) {
      expect(i.raspuns.tip).toBe("construit");
      if (i.raspuns.tip === "construit" && i.raspuns.laturi) { expect(i.raspuns.laturi[0]).toBeLessThanOrEqual(12); expect(i.raspuns.laturi[1]).toBeLessThanOrEqual(8); }
    }
  });

  it("Perechi: numărul cerut de perechi și cu nivelul amestecat, pentru orice capitole", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { itemi } = genereazaC4(cfg({ capitole: CAPITOLE_C4, joc: "memory", nr: 10, nivel: "amestecat", seed }));
      expect(itemi.length, `seed ${seed}`).toBe(10);
      const { itemi: l } = genereazaC4(cfg({ capitole: ["logica", "tabele", "timp"], joc: "memory", nr: 10, nivel: "amestecat", seed }));
      expect(l.length, `logica seed ${seed}`).toBe(10);
    }
  });

  it("e determinist; înlocuirea schimbă doar exercițiul ales; încercarea nouă aduce alte exerciții", () => {
    const c = cfg({ capitole: CAPITOLE_C4, nr: 30, nivel: "amestecat" });
    expect(genereazaC4(c)).toEqual(genereazaC4(c));
    const a = genereazaC4(c).itemi, b = genereazaC4({ ...c, inlocuiri: { i3: 1 } }).itemi;
    expect(a.filter((x, i) => x.cheie !== b[i].cheie).map((x) => x.id)).toEqual(["i3"]);
    const n = genereazaC4(cfgIncercareC4(c, 1)).itemi;
    expect(n.filter((x, i) => x.cheie === a[i].cheie).length).toBeLessThan(10);
  });

  it("configurația trece prin URL și e curățată", () => {
    const c = cfg({ capitole: ["logica", "timp"], nivel: "2", joc: "detectiv", nr: 25 });
    expect(decodificaC4(codificaC4(c))).toEqual(c);
    expect(decodificaC4("gunoi")).toBeNull();
  });

  it("exportă verificările pentru SymPy", () => {
    if (process.env.C4_EXPORT) writeFileSync(process.env.C4_EXPORT, JSON.stringify(toate.map((t) => ({ v: t.verificare, r: t.raspuns, text: t.text }))));
    expect(toate.length).toBeGreaterThan(11000);
  });
});
