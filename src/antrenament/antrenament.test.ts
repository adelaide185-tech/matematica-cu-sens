import { describe, expect, it } from "vitest";
import { Rng } from "@/motor/rng";
import { SUBIECTE, subiect } from "./registru";
import { capacitate, construiesteSesiune, cote, SPATIERE_FAPT, verdicte } from "./sesiune";
import { NIVELURI_JOC, verificaRaspuns, type Exercitiu, type NivelJoc } from "./tipuri";
import type { Clasa } from "@/motor/tipuri";

const NIV: NivelJoc[] = NIVELURI_JOC.map((n) => n.id);
const MAX: Record<number, number> = { 1: 100, 2: 1000, 3: 10000, 4: 1000000 };

/** Verifică faptele matematice care se pot citi din mecanică și limitele clasei. */
function verificaMatematic(e: Omit<Exercitiu, "subiectId"> & { subiectId?: string }, clasa: Clasa) {
  const m = e.mecanica;
  const r = e.raspuns;
  const val = r.tip === "numar" || r.tip === "construit" ? r.valoare : null;
  if (val !== null) {
    expect(Number.isInteger(val), e.enunt).toBe(true);
    expect(val, e.enunt).toBeGreaterThanOrEqual(0);
  }
  if (m.tip === "coloana") {
    const v = m.operatie === "+" ? m.a + m.b : m.operatie === "−" ? m.a - m.b : m.a * m.b;
    expect(val, e.enunt).toBe(v);
    if (m.operatie !== "×") expect(Math.max(m.a, m.b, v), `${e.enunt} depășește concentrul clasei ${clasa}`).toBeLessThan(MAX[clasa]);
  }
  if (m.tip === "cadru10") {
    expect(val).toBe(m.lipsa ? m.b : m.operatie === "+" ? m.a + m.b : m.a - m.b);
    expect(Math.max(m.a, m.b, val!)).toBeLessThanOrEqual(20);
  }
  if (m.tip === "blocuri") expect(val).toBe(m.tinta);
  if (m.tip === "grupe" && e.enunt.includes("în total")) expect(val).toBe(m.grupe * m.cate);
  if (m.tip === "farfurii" && r.tip === "numar") expect(val! * m.farfurii).toBe(m.total);
  if (m.tip === "farfurii" && r.tip === "campuri") {
    expect(r.valori[0] * m.farfurii + r.valori[1]).toBe(m.total);
    expect(r.valori[1]).toBeLessThan(m.farfurii);
  }
  if (m.tip === "balanta" && r.tip === "optiune" && r.optiuni.includes("<")) {
    expect(r.valoare).toBe(m.valStanga < m.valDreapta ? "<" : m.valStanga > m.valDreapta ? ">" : "=");
  }
  if (m.tip === "ordonare" && r.tip === "ordine") expect([...m.numere].sort((a, b) => a - b)).toEqual([...r.valori].sort((a, b) => a - b));
  // ── faza C ──
  if (m.tip === "fractie" && m.interactiv) {
    expect(val).toBe(m.colorate);
    expect(m.colorate).toBeLessThanOrEqual(m.parti);
  }
  if (m.tip === "fractie" && r.tip === "optiune") expect(r.valoare).toBe(`${m.colorate}/${m.parti}`);
  if (m.tip === "benzi" && r.tip === "optiune") {
    const [[a, p], [b, q]] = m.fractii;
    expect(r.valoare).toBe(Math.abs(a / p - b / q) < 1e-9 ? "=" : a / p < b / q ? "<" : ">");
  }
  if (m.tip === "grila100") {
    expect(m.colorate).toBeGreaterThan(0);
    expect(m.colorate).toBeLessThan(100);
  }
  if (m.tip === "ceas" && m.interactiv) {
    const t = e.enunt.match(/(\d{1,2}):(\d{2})/);
    if (t) expect(val).toBe((Number(t[1]) % 12) * 60 + Number(t[2]));
    expect(val!).toBeLessThan(720);
  }
  if (m.tip === "ceas" && !m.interactiv) {
    expect(m.ore).toBeGreaterThanOrEqual(1);
    expect(m.ore).toBeLessThanOrEqual(12);
    if (clasa === 1) expect(m.minute).toBe(0);
    if (r.tip === "optiune") expect(r.valoare).toBe(`${m.ore}:${String(m.minute).padStart(2, "0")}`);
    if (r.tip === "campuri") expect(r.valori).toEqual([m.ore, m.minute]);
  }
  if (m.tip === "rigla") {
    expect(val).toBe(m.unitate === "mm" ? Math.round(m.lungime * 10) : m.lungime);
    expect(m.start + m.lungime).toBeLessThanOrEqual(clasa === 1 ? 10 : 14);
  }
  if ((m.tip === "cantar" || m.tip === "recipient") && r.tip === "numar" && !e.enunt.includes("mai trebuie")) {
    expect(val).toBe(m.valoare);
    expect(m.valoare).toBeLessThan(m.max);
    expect(m.valoare % m.pas).toBe(0);
  }
  if (m.tip === "bani" && e.subiectId !== "bani.rest" && !e.enunt.includes("rest")) {
    const s = m.piese.reduce((a, b) => a + b, 0);
    if (r.tip === "numar") expect(val! * 100).toBe(s);
    if (r.tip === "campuri") expect(r.valori[0] * 100 + r.valori[1]).toBe(s);
  }
  if (m.tip === "magazin") {
    expect(val).toBe(m.pret);
    // prețul se poate plăti exact cu piesele disponibile (greedy funcționează pentru sistemul leu/ban)
    let rest = m.pret;
    for (const p of [...m.disponibile].sort((a, b) => b - a)) rest -= Math.floor(rest / p) * p;
    expect(rest).toBe(0);
  }
  if (m.tip === "linieTimp" && r.tip === "campuri") {
    const fin = m.start + m.durata;
    expect(r.valori).toEqual([Math.floor(fin / 60), fin % 60]);
    expect(fin).toBeLessThan(24 * 60);
  }
  if (m.tip === "linieTimp" && r.tip === "numar") expect(val).toBe(m.durata);
  // comparări cu răspuns „obiect”: obiectul ales are valoarea mai mare
  if (m.tip === "balanta" && r.tip === "optiune" && !r.optiuni.includes("<")) {
    expect(r.valoare).toBe(m.valStanga > m.valDreapta ? r.optiuni[0] : r.optiuni[1]);
  }
  if (r.tip === "campuri") r.valori.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
  if (r.tip === "optiune") expect(r.optiuni).toContain(r.valoare);
  expect(e.indicii.length).toBeGreaterThanOrEqual(3);
  // răspunsul propriu trece verificarea
  const dat = r.tip === "campuri" || r.tip === "ordine" ? r.valori : r.tip === "optiune" ? r.valoare : r.valoare;
  expect(verificaRaspuns(r, dat)).toBe(true);
}

describe("subiecte: corectitudine pe toate clasele și nivelurile", () => {
  for (const s of SUBIECTE) {
    it(`${s.id}`, () => {
      for (const clasa of s.clase)
        for (const nivel of NIV)
          for (let seed = 1; seed <= 200; seed++) verificaMatematic(s.exercitiu(new Rng(seed * 104729 + clasa), nivel, clasa), clasa);
    });
  }
});

describe("sesiuni de până la 100 de exerciții", () => {
  it("fiecare subiect dă min(100, capacitate) exerciții unice, cu faptele spațiate", () => {
    const sub100: string[] = [];
    for (const s of SUBIECTE)
      for (const clasa of s.clase)
        for (const nivel of NIV) {
          const cap = capacitate(s, nivel, clasa);
          const n = Math.min(100, cap);
          const ses = construiesteSesiune(SUBIECTE, { clasa, nivel, subiecte: [s.id], n, seed: 7 });
          expect(ses.length, `${s.id} cl.${clasa} ${nivel}`).toBe(n);
          expect(new Set(ses.map((e) => e.cheie)).size).toBe(n);
          if (cap < 100) sub100.push(`${s.id} cl.${clasa} ${nivel}: ${cap}`);
        }
    console.log(`Combinații sub 100 de exerciții distincte (${sub100.length}):\n  ${sub100.join("\n  ")}`);
  });

  it("spațierea faptelor: același fapt nu revine la mai puțin de 10 exerciții (când e posibil)", () => {
    const ses = construiesteSesiune(SUBIECTE, { clasa: 3, nivel: "mediu", subiecte: ["op.tabla", "op.impartire", "num.comparare"], n: 100, seed: 3 });
    let incalcari = 0;
    ses.forEach((e, i) => {
      if (ses.slice(Math.max(0, i - SPATIERE_FAPT), i).some((x) => x.fapt === e.fapt)) incalcari++;
    });
    expect(incalcari).toBeLessThanOrEqual(2);
  });

  it("modul mixt: cote egale, amestecat, max. 2 la rând din același subiect, reproductibil", () => {
    const cfg = { clasa: 2 as Clasa, nivel: "mediu" as NivelJoc, subiecte: ["num.comparare", "op.adunare", "op.tabla", "pb.una"], n: 50, seed: 11 };
    const a = construiesteSesiune(SUBIECTE, cfg);
    const b = construiesteSesiune(SUBIECTE, cfg);
    expect(a.map((e) => e.cheie)).toEqual(b.map((e) => e.cheie));
    expect(a.length).toBe(50);
    const nr = new Map<string, number>();
    a.forEach((e) => nr.set(e.subiectId, (nr.get(e.subiectId) ?? 0) + 1));
    expect(Math.max(...nr.values()) - Math.min(...nr.values())).toBeLessThanOrEqual(1);
    for (let i = 2; i < a.length; i++) expect(a[i].subiectId === a[i - 1].subiectId && a[i].subiectId === a[i - 2].subiectId).toBe(false);
  });

  it("cota unui subiect mic trece la celelalte", () => {
    const mic = subiect("op.comutativ")!;
    const cfg = { clasa: 2 as Clasa, nivel: "usor" as NivelJoc, subiecte: ["op.comutativ", "op.adunare"], n: 100, seed: 1 };
    const c = cote([mic, subiect("op.adunare")!], cfg);
    expect(c.get("op.comutativ")).toBe(Math.min(50, capacitate(mic, "usor", 2)));
    expect([...c.values()].reduce((x, y) => x + y)).toBe(100);
  });

  it("verdicte pe subiect", () => {
    const v = verdicte([
      ...Array(10).fill({ subiectId: "a", incercari: 1, cuAjutor: false, timpMs: 1 }),
      ...Array(5).fill({ subiectId: "b", incercari: 2, cuAjutor: false, timpMs: 1 }),
      ...Array(5).fill({ subiectId: "b", incercari: 1, cuAjutor: false, timpMs: 1 }),
    ]);
    expect(v.find((x) => x.subiectId === "a")!.verdict).toBe("stapanit");
    expect(v.find((x) => x.subiectId === "b")!.verdict).toBe("exersam");
  });
});
