import type { Cerinta, Generator, Nivel } from "../tipuri";
import { dificultate, nrCerinte } from "./comun";

const BAZA: Nivel[] = ["consolidare", "aprofundare", "evaluare"];

const NUMITORI_NUME: Record<number, string> = {
  2: "doimi", 3: "treimi", 4: "pătrimi (sferturi)", 5: "cincimi", 6: "șesimi", 8: "optimi", 10: "zecimi",
};

export const fractieColorata: Generator = {
  id: "fractii.colorata",
  titlu: "Ce fracție este colorată?",
  clase: [2, 3, 4],
  competente: ["M34-1.1"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 3);
    const numitori = clasa <= 2 ? [2, 4] : nivel === "consolidare" ? [2, 3, 4, 5, 6, 8] : [3, 4, 5, 6, 8, 10];
    const fr = rng.distinct(n, () => {
      const p = rng.pick(numitori);
      return [rng.int(1, nivel === "consolidare" ? p - 1 : p), p] as [number, number];
    }, (x) => x.join("/"));
    const cer: Cerinta[] = fr.map(([c, p]) => ({
      text: "",
      vizual: { tip: "fractie", forma: rng.bool() ? "cerc" : "dreptunghi", parti: p, colorate: c },
      raspuns: `${c}/${p}`,
      latime: "s",
    }));
    return {
      generatorId: this.id,
      enunt: "Scrie fracția care arată partea colorată din fiecare întreg (de forma 3/4):",
      interactiune: "input",
      coloane: 3,
      cerinte: cer,
      rezolvare: fr.map(([c, p]) => `${c}/${p} — întregul are ${p} părți egale (${NUMITORI_NUME[p] ?? p + "-imi"}), sunt colorate ${c}${c === p ? " (fracție echiunitară, egală cu întregul)" : ""}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const compararefractii: Generator = {
  id: "fractii.comparare",
  titlu: "Compară fracțiile",
  clase: [3, 4],
  competente: ["M34-1.2"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const cer = Array.from({ length: n }, () => {
      const p = rng.int(3, 10);
      // același numitor; la aprofundare și același numărător (1/3 vs 1/5)
      if (nivel !== "consolidare" && rng.bool()) {
        const c = rng.int(1, 3);
        const q = rng.int(c + 1, 10);
        const r = rng.int(c + 1, 10);
        return { a: [c, q], b: [c, r] };
      }
      const a = rng.int(1, p);
      const b = rng.int(1, p);
      return { a: [a, p], b: [b, p] };
    });
    const v = (f: number[]) => f[0] / f[1];
    return {
      generatorId: this.id,
      enunt: "Compară fracțiile, folosind <, > sau =:",
      interactiune: "comparare",
      coloane: 2,
      cerinte: cer.map(({ a, b }) => ({
        text: `${a[0]}/${a[1]} ___ ${b[0]}/${b[1]}`,
        raspuns: v(a) < v(b) ? "<" : v(a) > v(b) ? ">" : "=",
        optiuni: ["<", "=", ">"],
        latime: "s",
      })),
      rezolvare: [
        "Același numitor: este mai mare fracția cu numărătorul mai mare.",
        "Același numărător: este mai mare fracția cu numitorul mai mic (părțile sunt mai mari).",
      ],
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const fractieDinNumar: Generator = {
  id: "fractii.din-numar",
  titlu: "Fracția dintr-un număr",
  clase: [3, 4],
  competente: ["M34-1.4"],
  niveluri: ["aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const cer = Array.from({ length: n }, () => {
      const p = rng.pick([2, 3, 4, 5, 10]);
      const c = nivel === "aprofundare" ? 1 : rng.int(1, p - 1);
      const unitate = rng.int(2, clasa === 3 ? 10 : 50);
      return { c, p, N: p * unitate, r: c * unitate };
    });
    return {
      generatorId: this.id,
      enunt: "Calculează:",
      interactiune: "input",
      coloane: 2,
      cerinte: cer.map(({ c, p, N, r }) => ({ text: `${c}/${p} din ${N} =`, raspuns: String(r), latime: "s" })),
      rezolvare: cer.map(({ c, p, N, r }) => `${N} : ${p} = ${N / p} (o parte); ${N / p} × ${c} = ${r}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa) + 1,
    };
  },
};

/** Citirea ceasului: ore fixe (cl. I), jumătăți (cl. II), sferturi și minute (cl. III–IV). */
export const ceas: Generator = {
  id: "masuri.ceas",
  titlu: "Cât arată ceasul?",
  clase: [1, 2, 3, 4],
  competente: ["MEM-6.1", "M34-4.2"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 2);
    const minute = clasa === 1 ? [0] : clasa === 2 ? (nivel === "consolidare" ? [0, 30] : [0, 15, 30, 45]) : nivel === "consolidare" ? [0, 15, 30, 45] : Array.from({ length: 12 }, (_, i) => i * 5);
    const ore = rng.distinct(n, () => [rng.int(1, 12), rng.pick(minute)] as [number, number], (x) => x.join(":"));
    const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;
    const vorbit = (h: number, m: number) =>
      m === 0 ? `ora ${h} fix` : m === 30 ? `${h} și jumătate` : m === 15 ? `${h} și un sfert` : m === 45 ? `${(h % 12) + 1} fără un sfert` : m < 30 ? `${h} și ${m} minute` : `${(h % 12) + 1} fără ${60 - m}`;
    return {
      generatorId: this.id,
      enunt: "Scrie ora pe care o arată fiecare ceas (de forma 8:15):",
      interactiune: "input",
      coloane: 3,
      cerinte: ore.map(([h, m]) => ({ text: "", vizual: { tip: "ceas", ore: h, minute: m }, raspuns: fmt(h, m), latime: "s" })),
      rezolvare: ore.map(([h, m]) => `${fmt(h, m)} — „${vorbit(h, m)}”`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

/** Transformări de unități (lungime, masă, capacitate). */
export const transformari: Generator = {
  id: "masuri.transformari",
  titlu: "Transformări de unități de măsură",
  clase: [2, 3, 4],
  competente: ["MEM-6.1", "M34-4.3"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const reguli: [string, string, number][] =
      clasa === 2
        ? [["m", "cm", 100], ["m", "dm", 10], ["dm", "cm", 10], ["kg", "g", 1000], ["l", "ml", 1000]]
        : [["m", "cm", 100], ["m", "dm", 10], ["dm", "cm", 10], ["cm", "mm", 10], ["m", "mm", 1000], ["km", "m", 1000], ["kg", "g", 1000], ["l", "ml", 1000], ["hl", "l", 100]];
    const cer = Array.from({ length: n }, () => {
      const [mare, mic, f] = rng.pick(reguli);
      const x = rng.int(1, 9);
      if (nivel !== "consolidare" && rng.bool()) {
        const y = rng.int(1, f - 1);
        return { text: `${x} ${mare} ${y} ${mic} =`, dupa: ` ${mic}`, raspuns: String(x * f + y), rez: `${x} × ${f} + ${y} = ${x * f + y} ${mic}` };
      }
      if (rng.bool()) return { text: `${x} ${mare} =`, dupa: ` ${mic}`, raspuns: String(x * f), rez: `${x} × ${f} = ${x * f} ${mic}` };
      return { text: `${x * f} ${mic} =`, dupa: ` ${mare}`, raspuns: String(x), rez: `${x * f} : ${f} = ${x} ${mare}` };
    });
    return {
      generatorId: this.id,
      enunt: "Transformă:",
      interactiune: "input",
      coloane: 2,
      cerinte: cer.map(({ text, dupa, raspuns }) => ({ text, dupa, raspuns, latime: "s" })),
      rezolvare: cer.map((c) => `${c.text} ${c.raspuns}${c.dupa}  (${c.rez})`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const cifreRomane: Generator = {
  id: "numeratie.cifre-romane",
  titlu: "Cifre romane",
  clase: [3, 4],
  competente: ["M34-1.1"],
  niveluri: ["consolidare", "aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const max = nivel === "consolidare" ? 30 : clasa === 3 ? 100 : 1000;
    const nums = rng.distinct(n, () => rng.int(1, max));
    const inversa = nivel !== "consolidare";
    return {
      generatorId: this.id,
      enunt: inversa ? "Scrie numerele cu cifre arabe (1, 2, 3…) sau cu cifre romane, după caz:" : "Scrie numerele cu cifre romane:",
      interactiune: "input",
      coloane: 4,
      cerinte: nums.map((x, i) =>
        inversa && i % 2 === 1
          ? { text: `${roman(x)} =`, raspuns: String(x), latime: "s" as const }
          : { text: `${x} =`, raspuns: roman(x), latime: "s" as const },
      ),
      rezolvare: nums.map((x) => `${x} = ${roman(x)}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export function roman(n: number): string {
  const t: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let r = "";
  for (const [v, s] of t) while (n >= v) { r += s; n -= v; }
  return r;
}

export const GENERATOARE_FRACTII_MASURI = [fractieColorata, compararefractii, fractieDinNumar, ceas, transformari, cifreRomane];
