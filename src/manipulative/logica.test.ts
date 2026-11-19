import { describe, expect, it } from "vitest";
import {
  atingeBila, blocuriDin, cadruDin, capatSalturi, desface, drumContinuu, esteCanonic, eticheteEditabile, eticheteSalt,
  gradatii, grupeaza, lipesteDeAxa, modificaBlocuri, numaraCadru, numarDinEticheta, numereTabla, rotunjeste,
  valoareBlocuri, veciniTabla, MAX_BLOCURI,
} from "./logica";
import { codifica, decodifica, MANIPULATIVE, stareInitiala } from "./stare";

describe("blocuri baza 10", () => {
  it("gruparea și desfacerea păstrează valoarea", () => {
    for (let n = 0; n <= 1000; n++) {
      const b = blocuriDin(n);
      expect(valoareBlocuri(b)).toBe(n);
      expect(esteCanonic(b)).toBe(true);
      const d = desface(b, "zeci");
      if (d) expect(valoareBlocuri(d)).toBe(n);
      const s = desface(b, "sute");
      if (s) expect(valoareBlocuri(s)).toBe(n);
    }
  });
  it("10 unități devin o zece, 10 zeci o sută", () => {
    expect(grupeaza({ sute: 0, zeci: 7, unitati: 15 }, "unitati")).toEqual({ sute: 0, zeci: 8, unitati: 5 });
    expect(grupeaza({ sute: 1, zeci: 12, unitati: 0 }, "zeci")).toEqual({ sute: 2, zeci: 2, unitati: 0 });
    expect(grupeaza({ sute: 0, zeci: 1, unitati: 9 }, "unitati")).toBeNull();
  });
  it("nu depășește limitele coloanelor", () => {
    expect(desface({ sute: 0, zeci: 1, unitati: 10 }, "zeci")).toBeNull();
    expect(modificaBlocuri({ sute: 10, zeci: 0, unitati: 0 }, "sute", 1).sute).toBe(MAX_BLOCURI.sute);
    expect(modificaBlocuri({ sute: 0, zeci: 0, unitati: 0 }, "unitati", -1).unitati).toBe(0);
  });
});

describe("rekenrek și cadrul de 10", () => {
  it("atingerea bilelor", () => {
    expect(atingeBila(0, 4)).toBe(5); // a cincea bilă aduce 5 bile
    expect(atingeBila(5, 2)).toBe(2); // a treia bilă trimite înapoi bilele 3–5
    expect(atingeBila(10, 0)).toBe(0);
  });
  it("cadrul se umple în ordine", () => {
    const c = cadruDin(8, 5);
    expect(numaraCadru(c)).toBe(13);
    expect(numaraCadru(c, 1)).toBe(8);
    expect(numaraCadru(c.slice(0, 10))).toBe(10);
  });
});

describe("axa numerelor", () => {
  it("gradații și lipire", () => {
    expect(gradatii({ start: 0, sfarsit: 100, pas: 10 })).toHaveLength(11);
    expect(lipesteDeAxa({ start: 300, sfarsit: 400, fin: 1 }, 347.6)).toBe(348);
    expect(lipesteDeAxa({ start: 0, sfarsit: 20, fin: 1 }, 25)).toBe(20);
  });
  it("rotunjirea cu 5 în sus", () => {
    expect(rotunjeste(45, 10)).toBe(50);
    expect(rotunjeste(44, 10)).toBe(40);
    expect(rotunjeste(350, 100)).toBe(400);
    expect(rotunjeste(349, 100)).toBe(300);
  });
  it("salturi", () => {
    const s = [{ de: 63, la: 43 }, { de: 43, la: 36 }];
    expect(drumContinuu(s)).toBe(true);
    expect(capatSalturi(s)).toBe(36);
    expect(eticheteSalt(s[0])).toBe("−20");
    expect(eticheteSalt({ de: 8, la: 10 })).toBe("+2");
  });
});

describe("tabla sutelor", () => {
  it("vecini", () => {
    expect(numereTabla(101)[9][9]).toBe(200);
    expect(veciniTabla(47, 1)).toEqual({ sus: 37, jos: 57, stanga: 46, dreapta: 48 });
    expect(veciniTabla(10, 1)).toEqual({ sus: undefined, jos: 20, stanga: 9, dreapta: undefined });
  });
});

describe("modelul în bară", () => {
  it("etichete", () => {
    expect(numarDinEticheta(" 42 ")).toBe(42);
    expect(numarDinEticheta("?")).toBeNull();
    expect(
      eticheteEditabile({
        bare: [{ nume: "A", segmente: [{ lungime: 3, eticheta: "25", editabil: true }, { lungime: 2, eticheta: "17" }], total: "?", totalEditabil: true }],
      }),
    ).toEqual(["25", "?"]);
  });
});

describe("linkurile de partajare", () => {
  it("codificarea e reversibilă pentru fiecare manipulativ", () => {
    for (const m of MANIPULATIVE) {
      const s = stareInitiala(m.tip);
      expect(decodifica(codifica(s))).toEqual(s);
    }
    const bara = { tip: "bara" as const, v: { bare: [{ nume: "Ștefan și Țuțu", segmente: [{ lungime: 3, eticheta: "?" }] }] } };
    expect(decodifica(codifica(bara))).toEqual(bara);
  });
  it("un cod stricat nu strică pagina", () => {
    expect(decodifica("nu-e-bun")).toBeNull();
    expect(decodifica(codifica({ tip: "xyz" } as never))).toBeNull();
  });
});
