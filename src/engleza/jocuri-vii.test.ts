import { describe, expect, it } from "vitest";
import { ACTIVITATI_CU_STELE, ACTIVITATI_EN, ICON_CUVANT, UNITATI, type Varsta } from "./continut";
import { GAURI_VARSTA, cutii, roata, rundeBaloane, rundeCartita, rundePropozitie, sortare } from "./runde";

const V: Varsta[] = [4, 5, 6];
describe("engleza: jocurile noi", () => {
  it("cârtița: fiecare variantă stă într-o gaură, ținta o singură dată", () => {
    for (const u of UNITATI) for (const v of V) for (const r of rundeCartita(u, v, 5)) {
      expect(r.gauri.length).toBe(GAURI_VARSTA[v]);
      const pline = r.gauri.filter(Boolean);
      expect(pline.length).toBe(r.variante.length);
      expect(pline.filter((c) => c!.en === r.tinta.en).length).toBe(1);
    }
  });
  it("baloanele: o imagine în plus, fără dubluri, ținta o dată", () => {
    for (const u of UNITATI) for (const v of V) for (const r of rundeBaloane(u, v, 9)) {
      expect(new Set(r.variante.map((c) => c.en)).size).toBe(r.variante.length);
      expect(r.variante.filter((c) => c.en === r.tinta.en).length).toBe(1);
      expect(r.variante.length).toBeLessThanOrEqual(5);
    }
  });
  it("cutiile și roata: cuvinte distincte; roata se oprește o dată pe fiecare segment", () => {
    for (const u of UNITATI) for (const v of V) {
      const c = cutii(u, v, 3); expect(new Set(c.map((x) => x.en)).size).toBe(c.length); expect(c.length).toBeGreaterThanOrEqual(6);
      const r = roata(u, v, 3); expect([...r.opriri].sort((a, b) => a - b)).toEqual(r.segmente.map((_, i) => i));
    }
  });
  it("sortarea: două unități diferite, la fel de multe imagini în fiecare coș", () => {
    for (const u of UNITATI) for (const v of V) for (const seed of [1, 2, 3]) {
      const s = sortare(u, UNITATI, v, seed);
      expect(s.cosuri[0].id).toBe(u.id); expect(s.cosuri[1].id).not.toBe(u.id);
      expect(s.itemi.filter((x) => x.cos === 0).length).toBe(s.itemi.filter((x) => x.cos === 1).length);
      for (const it of s.itemi) expect(s.cosuri[it.cos].cuvinte).toContain(it.c);
    }
  });
  it("propoziția: piesele, puse în ordine, refac propoziția; capcana e altă imagine; fiecare piesă-text are pictogramă", () => {
    for (const u of UNITATI) for (const v of V) for (const r of rundePropozitie(u, v, 4)) {
      const text = r.piese.map((p) => p.text).join(" ");
      expect(r.propozitie.replace(/[.,!?]/g, "").replace(/\s+/g, " ")).toBe(text);
      expect(r.piese.filter((p) => p.poza).length).toBe(1);
      expect(r.piese.length).toBeLessThanOrEqual(v === 4 ? 2 : v === 5 ? 4 : 6);
      if (r.capcana) expect(r.capcana.poza!.en).not.toBe(r.piese.find((p) => p.poza)!.poza!.en);
      for (const p of r.piese.filter((x) => !x.poza)) expect(p.text.split(" ").some((w) => ICON_CUVANT[w.toLowerCase()]), `${u.id}: „${p.text}”`).toBe(true);
    }
  });
  it("9 activități: 3 de învățat, 6 cu stele", () => {
    expect(Object.keys(ACTIVITATI_EN).length).toBe(9);
    expect(ACTIVITATI_CU_STELE.length).toBe(6);
  });
});
