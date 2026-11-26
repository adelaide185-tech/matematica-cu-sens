import { describe, expect, test } from "vitest";
import { Rng } from "@/motor/rng";
import type { Raspuns } from "@/antrenament/tipuri";
import { CAPITOLE_C1 } from "./capitole";
import { codificaC1, configImplicitaC1, curataC1, decodificaC1, JOCURI_TOATE } from "./config";
import { areTrecere, calcul, rezultat } from "./generatoare";
import { dreaptaTable, fisaClasa1, genereazaClasa1, MARIME_TABLA, pentruElev, rezultatC1, verificaC1 } from "./sesiune";
import { medalie, NR_EXERCITII_C1, type CapitolC1, type ConfigClasa1, type ExercitiuC1, type Trecere } from "./tipuri";

const SEEDURI = Array.from({ length: 60 }, (_, i) => 1000 + i * 7919);
const TOATE = CAPITOLE_C1.map((c) => c.id);

function cfg(p: Partial<ConfigClasa1> & { trecere20?: Trecere; trecere100?: Trecere; max?: 20 | 100; douaOp?: boolean }, seed: number): ConfigClasa1 {
  const c = configImplicitaC1(seed);
  const { trecere20, trecere100, max, douaOp, ...rest } = p;
  Object.assign(c, rest);
  if (trecere20) c.optiuni.adsc20.trecere = trecere20;
  if (trecere100) c.optiuni.adsc100.trecere = trecere100;
  if (max) {
    c.optiuni.termen.max = max;
    c.optiuni.probleme.max = max;
  }
  if (douaOp) c.optiuni.probleme.douaOperatii = true;
  return c;
}

/** Concentrul în care trebuie să fie toate numerele exercițiului. */
function maxCapitol(e: ExercitiuC1, c: ConfigClasa1): number {
  if (e.capitol === "adsc20") return 20;
  if (e.capitol === "termen") return c.optiuni.termen.max;
  if (e.capitol === "probleme") return c.optiuni.probleme.max;
  return 100;
}

function raspunsCorect(r: Raspuns): unknown {
  switch (r.tip) {
    case "numar":
    case "construit":
      return r.valoare;
    case "optiune":
      return r.valoare;
    case "campuri":
    case "ordine":
    case "multime":
      return r.valori;
    case "zecimal":
      return r.text;
  }
}
const corect = (e: ExercitiuC1) => (e.pereche && e.tabla ? e.pereche.dreapta : raspunsCorect(e.raspuns));

function raspunsGresit(e: ExercitiuC1): unknown {
  if (e.pereche && e.tabla) return `${e.pereche.dreapta}x`;
  const r = e.raspuns;
  if (r.tip === "numar" || r.tip === "construit") return r.valoare + 1;
  if (r.tip === "optiune") return r.optiuni.find((o) => o !== r.valoare) ?? "nimic";
  if (r.tip === "campuri" || r.tip === "ordine") return r.valori.map((v) => v + 1);
  return null;
}

/** „12 + ___ = 20” cu răspunsul pus în căsuță → egalitate adevărată */
function egalitateAdevarata(text: string, raspuns: string): boolean {
  const t = text.replace("___", raspuns).replace(/−/g, "-");
  const m = t.match(/^(\d+) ([+-]) (\d+) = (\d+)$/);
  if (!m) return false;
  const [a, op, b, c] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
  return (op === "+" ? a + b : a - b) === c;
}

function verificaSesiune(c: ConfigClasa1, exercitii: ExercitiuC1[]) {
  const chei = new Set<string>();
  const fise = new Set<string>();
  for (const e of exercitii) {
    expect(c.capitole).toContain(e.capitol);
    expect(e.enunt.length).toBeGreaterThan(3);
    expect(e.indicii).toHaveLength(3);

    // unicitate: în joc (cheia) și pe hârtie (cum arată)
    expect(chei.has(e.cheie), `duplicat ${e.cheie}`).toBe(false);
    chei.add(e.cheie);
    const kf = `${e.fisa.cerinta}|${e.fisa.text}|${e.fisa.raspuns}|${JSON.stringify(e.fisa.mecanica ?? "")}`;
    expect(fise.has(kf), `duplicat pe fișă ${kf}`).toBe(false);
    fise.add(kf);

    // intervale: numere naturale, în concentru
    const max = maxCapitol(e, c);
    for (const n of e.numere) {
      expect(Number.isInteger(n), `${e.cheie}: ${n} nu e întreg`).toBe(true);
      expect(n, `${e.cheie}: ${n} < 0`).toBeGreaterThanOrEqual(0);
      expect(n, `${e.cheie}: ${n} > ${max}`).toBeLessThanOrEqual(max);
    }
    if (e.raspuns.tip === "numar") {
      expect(e.raspuns.valoare).toBeGreaterThanOrEqual(0);
      expect(e.raspuns.valoare).toBeLessThanOrEqual(max);
    }

    // adunări și scăderi: rezultat în concentru, regula de trecere respectată
    for (const k of e.calcule ?? []) {
      const r = rezultat(k);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(k.max);
      expect(k.a).toBeLessThanOrEqual(k.max);
      expect(k.b).toBeLessThanOrEqual(k.max);
      expect(areTrecere(k.a, k.b, k.op)).toBe(k.trecere);
      expect(k.trecere).toBe(k.cerut === "cu");
      if (k.cerut === "fara") {
        if (k.op === "+") expect((k.a % 10) + (k.b % 10)).toBeLessThanOrEqual(9);
        else expect(k.a % 10).toBeGreaterThanOrEqual(k.b % 10);
      }
      const regula = e.capitol === "adsc20" ? c.optiuni.adsc20.trecere : c.optiuni.adsc100.trecere;
      if (regula !== "ambele") expect(k.cerut).toBe(regula);
      if (!c.optiuni[e.capitol === "adsc20" ? "adsc20" : "adsc100"].operatii.includes(k.op)) throw new Error(`operație nepermisă ${k.op}`);
    }

    // calculele scrise pe fișă sunt adevărate cu răspunsul din barem
    if ((e.capitol === "adsc20" || e.capitol === "adsc100" || e.capitol === "termen") && e.fisa.text.includes("= ") && !e.fisa.text.includes("___ ")) {
      expect(egalitateAdevarata(e.fisa.text, e.fisa.raspuns), `${e.fisa.text} cu ${e.fisa.raspuns}`).toBe(true);
    }

    // răspunsul corect trece verificarea, unul greșit nu
    expect(verificaC1(e, corect(e)), `${e.cheie} nu acceptă răspunsul corect`).toBe(true);
    expect(verificaC1(e, raspunsGresit(e)), `${e.cheie} acceptă un răspuns greșit`).toBe(false);
    if (e.raspuns.tip === "optiune") {
      expect(e.raspuns.optiuni).toContain(e.raspuns.valoare);
      expect(new Set(e.raspuns.optiuni).size).toBe(e.raspuns.optiuni.length);
    }

    // jocurile nepermise nu apar
    if (e.ecran !== "intrebare") expect(c.jocuri).toContain(e.ecran);
  }

  // tablele de perechi: 3–5 cartonașe consecutive, cu răspunsuri distincte
  const table = new Map<number, number[]>();
  exercitii.forEach((e, i) => e.tabla && table.set(e.tabla, [...(table.get(e.tabla) ?? []), i]));
  for (const [, idx] of table) {
    expect(idx.length).toBeGreaterThanOrEqual(MARIME_TABLA.min);
    expect(idx.length).toBeLessThanOrEqual(MARIME_TABLA.max);
    expect(idx[idx.length - 1] - idx[0]).toBe(idx.length - 1);
    const dr = idx.map((i) => exercitii[i].pereche!.dreapta);
    expect(new Set(dr).size).toBe(dr.length);
    for (const i of idx) expect(exercitii[i].ecran).toBe("perechi");
  }
  for (const e of exercitii) if (e.ecran === "perechi") expect(e.tabla).toBeTruthy();
}

describe("Clasa I · generatoare și sesiuni", () => {
  for (const capitol of TOATE) {
    test(`${capitol}: 50 de exerciții valide și unice, pe ${SEEDURI.length} seed-uri`, () => {
      for (const seed of SEEDURI) {
        const c = cfg({ capitole: [capitol], n: 50 }, seed);
        const { exercitii, lipsa } = genereazaClasa1(c);
        expect(exercitii.length + lipsa).toBe(50);
        verificaSesiune(c, exercitii);
      }
    });
  }

  test("capacitatea fiecărui capitol pentru 100 de exerciții (raportată, nu doar presupusă)", () => {
    const capacitate: Record<string, number> = {};
    for (const capitol of TOATE) {
      const { exercitii, lipsa } = genereazaClasa1(cfg({ capitole: [capitol], n: 100 }, 42));
      capacitate[capitol] = exercitii.length;
      expect(exercitii.length + lipsa).toBe(100);
    }
    console.log("Exerciții distincte la n = 100, pe capitol:", capacitate);
    // capitolele de calcul și numerație ajung singure la 100
    for (const c of ["numere", "adsc20", "adsc100", "termen", "bani", "lungime", "probleme"] as CapitolC1[]) expect(capacitate[c]).toBe(100);
  });

  for (const n of NR_EXERCITII_C1) {
    test(`toate capitolele împreună, n = ${n}: exact ${n} exerciții`, () => {
      for (const seed of SEEDURI.slice(0, 20)) {
        const c = cfg({ capitole: TOATE, n }, seed);
        const { exercitii, lipsa } = genereazaClasa1(c);
        expect(lipsa).toBe(0);
        expect(exercitii).toHaveLength(n);
        verificaSesiune(c, exercitii);
      }
    });
  }

  for (const trecere of ["fara", "cu", "ambele"] as Trecere[]) {
    test(`adunare și scădere cu regula „${trecere}” (0–20 și 0–100)`, () => {
      for (const seed of SEEDURI) {
        const c = cfg({ capitole: ["adsc20", "adsc100"], n: 100, trecere20: trecere, trecere100: trecere }, seed);
        const { exercitii } = genereazaClasa1(c);
        expect(exercitii).toHaveLength(100);
        verificaSesiune(c, exercitii);
        if (trecere === "ambele") {
          const k = exercitii.flatMap((e) => e.calcule ?? []);
          expect(k.some((x) => x.trecere)).toBe(true);
          expect(k.some((x) => !x.trecere)).toBe(true);
        }
      }
    });
  }

  test("doar adunare / doar scădere", () => {
    for (const op of ["+", "-"] as const) {
      const c = cfg({ capitole: ["adsc20", "adsc100"], n: 50 }, 7);
      c.optiuni.adsc20.operatii = [op];
      c.optiuni.adsc100.operatii = [op];
      const { exercitii } = genereazaClasa1(c);
      verificaSesiune(c, exercitii);
      for (const e of exercitii) for (const k of e.calcule ?? []) expect(k.op).toBe(op);
    }
  });

  test("termenul necunoscut și problemele în 0–20 și 0–100, cu două operații", () => {
    for (const max of [20, 100] as const)
      for (const seed of SEEDURI) {
        const c = cfg({ capitole: ["termen", "probleme"], n: 50, max, douaOp: true }, seed);
        const { exercitii } = genereazaClasa1(c);
        expect(exercitii).toHaveLength(50);
        verificaSesiune(c, exercitii);
      }
  });

  test("calcul(): toate combinațiile, 2000 de încercări fiecare", () => {
    const rng = new Rng(3);
    for (const max of [20, 100] as const)
      for (const op of ["+", "-"] as const)
        for (const cu of [false, true])
          for (let i = 0; i < 2000; i++) {
            const k = calcul(rng, max, op, cu);
            const r = rezultat(k);
            expect(r >= 0 && r <= max && k.a <= max && k.b <= max && k.b >= 1).toBe(true);
            expect(areTrecere(k.a, k.b, op)).toBe(cu);
            if (max === 100) expect(k.a).toBeGreaterThanOrEqual(10);
          }
  });

  test("jocuri: dacă profesorul permite un singur joc, nu apar altele", () => {
    for (const j of JOCURI_TOATE) {
      const c = cfg({ capitole: TOATE, n: 100, jocuri: [j] }, 11);
      const { exercitii } = genereazaClasa1(c);
      verificaSesiune(c, exercitii);
      for (const e of exercitii) expect(["intrebare", j]).toContain(e.ecran);
    }
    const c = cfg({ capitole: TOATE, n: 50, jocuri: [] }, 12);
    for (const e of genereazaClasa1(c).exercitii) expect(e.ecran).toBe("intrebare");
  });

  test("același seed → aceleași exerciții (fișă, barem, joc)", () => {
    const c = cfg({ capitole: TOATE, n: 25 }, 123);
    expect(JSON.stringify(genereazaClasa1(c))).toBe(JSON.stringify(genereazaClasa1({ ...c })));
    expect(JSON.stringify(genereazaClasa1(c).exercitii)).not.toBe(JSON.stringify(genereazaClasa1({ ...c, seed: 124 }).exercitii));
  });
});

describe("Clasa I · fișa PDF", () => {
  test("fiecare exercițiu apare o singură dată pe fișă, cu răspunsul în barem", () => {
    for (const seed of SEEDURI.slice(0, 15))
      for (const n of [10, 25, 100]) {
        const c = cfg({ capitole: TOATE, n }, seed);
        const { exercitii } = genereazaClasa1(c);
        const f = fisaClasa1(c, exercitii);
        const cerinte = f.itemi.flatMap((it) => it.cerinte);
        expect(cerinte).toHaveLength(exercitii.length);
        expect(f.puncteMaxime).toBe(exercitii.length);
        const vazute = new Set(cerinte.map((x) => `${x.text}|${x.raspuns}|${JSON.stringify(x.mecanica ?? "")}`));
        expect(vazute.size).toBe(cerinte.length);
        for (const it of f.itemi) {
          expect(it.cerinte.length).toBeLessThanOrEqual(10);
          expect(it.enunt.length).toBeGreaterThan(3);
          for (const x of it.cerinte) expect(x.raspuns.length).toBeGreaterThan(0);
        }
      }
  });
});

describe("Clasa I · elev, rezultat, medalii", () => {
  test("elevul nu primește răspunsurile", () => {
    const c = cfg({ capitole: TOATE, n: 100 }, 5);
    const { exercitii } = genereazaClasa1(c);
    const el = pentruElev(exercitii);
    expect(el).toHaveLength(100);
    for (const [i, e] of el.entries()) {
      expect("raspuns" in e).toBe(false);
      expect("fisa" in e).toBe(false);
      expect(e.indicii.length).toBeLessThanOrEqual(2);
      const m = e.mecanica;
      if (m.tip === "balanta" && !m.necunoscut) expect([m.valStanga, m.valDreapta]).toEqual([0, 0]);
      if (e.pereche) expect("dreapta" in e.pereche).toBe(false);
      expect(e.index).toBe(i);
    }
    // tablele: în dreapta sunt exact răspunsurile cartonașelor din stânga
    const dr = dreaptaTable(exercitii, c.seed);
    for (const [t, lista] of Object.entries(dr)) {
      const ale = exercitii.filter((e) => e.tabla === Number(t)).map((e) => e.pereche!.dreapta);
      expect([...lista].sort()).toEqual([...ale].sort());
    }
  });

  test("medaliile: Bronz ≥ 50%, Argint ≥ 75%, Aur ≥ 90%, Diamant 100%", () => {
    expect(medalie(49)).toBeNull();
    expect(medalie(50)).toBe("bronz");
    expect(medalie(74)).toBe("bronz");
    expect(medalie(75)).toBe("argint");
    expect(medalie(89)).toBe("argint");
    expect(medalie(90)).toBe("aur");
    expect(medalie(99)).toBe("aur");
    expect(medalie(100)).toBe("diamant");
  });

  test("rezultatul pe server: corect din prima, timp expirat = greșit", () => {
    const c = cfg({ capitole: ["adsc20", "numere"], n: 20 }, 77);
    const { exercitii } = genereazaClasa1(c);
    const toate = rezultatC1(exercitii, exercitii.map((e) => ({ primul: corect(e), incercari: 1, ajutor: false, timpMs: 1000 })));
    expect(toate.procent).toBe(100);
    expect(toate.medalie).toBe("diamant");
    const jumatate = rezultatC1(exercitii, exercitii.map((e, i) => ({ primul: i % 2 ? raspunsGresit(e) : corect(e), incercari: 1, ajutor: false, timpMs: 1 })));
    expect(jumatate.corecte).toBe(10);
    expect(jumatate.medalie).toBe("bronz");
    const expirat = rezultatC1(exercitii, exercitii.map(() => ({ primul: null, incercari: 0, ajutor: true, timpMs: 30000 })));
    expect(expirat.corecte).toBe(0);
    expect(expirat.medalie).toBeNull();
    expect(Object.values(jumatate.peCapitole).reduce((s, p) => s + p.total, 0)).toBe(20);
  });
});

describe("Clasa I · configurația din URL", () => {
  test("codificare ↔ decodificare", () => {
    const c = cfg({ capitole: ["numere", "bani"], n: 25, cronometru: true, secunde: 45, coloane: 3, trecere100: "cu" }, 999);
    expect(decodificaC1(codificaC1(c))).toEqual(c);
  });
  test("valorile greșite sunt înlocuite cu unele sigure", () => {
    const c = curataC1({ seed: -5, n: 7, capitole: ["nimic"], jocuri: ["hack"], secunde: 1, optiuni: { adsc20: { trecere: "x", operatii: [] }, termen: { max: 1000 } } });
    expect(c.seed).toBe(1);
    expect(NR_EXERCITII_C1).toContain(c.n);
    expect(c.capitole.length).toBeGreaterThan(0);
    expect(c.jocuri).toEqual([]);
    expect(c.secunde).toBe(30);
    expect(c.optiuni.adsc20.trecere).toBe("ambele");
    expect(c.optiuni.adsc20.operatii).toEqual(["+", "-"]);
    expect(c.optiuni.termen.max).toBe(20);
    expect(decodificaC1("!!!")).toBeNull();
  });
});
