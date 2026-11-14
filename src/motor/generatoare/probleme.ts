import type { Clasa, Generator, Item, Nivel } from "../tipuri";
import type { Rng } from "../rng";
import { cuSubstantiv } from "../limba";
import { dificultate } from "./comun";

/** Obiecte cu forme de singular/plural și interogativul potrivit (câte/câți). */
const OBIECTE = [
  { sg: "măr", pl: "mere", cate: "Câte" },
  { sg: "creion", pl: "creioane", cate: "Câte" },
  { sg: "timbru", pl: "timbre", cate: "Câte" },
  { sg: "carte", pl: "cărți", cate: "Câte" },
  { sg: "bilă", pl: "bile", cate: "Câte" },
  { sg: "nucă", pl: "nuci", cate: "Câte" },
  { sg: "abțibild", pl: "abțibilduri", cate: "Câte" },
  { sg: "bomboană", pl: "bomboane", cate: "Câte" },
  { sg: "fluturaș", pl: "fluturași", cate: "Câți" },
  { sg: "pește", pl: "pești", cate: "Câți" },
] as const;

const NUME = ["Ana", "Mihai", "Ioana", "Radu", "Maria", "Andrei", "Elena", "Tudor", "Sofia", "Luca", "Daria", "Matei"];

function limite(clasa: Clasa): readonly [number, number] {
  return ({ 1: [3, 50], 2: [12, 500], 3: [100, 5000], 4: [500, 50000], 5: [500, 50000] } as const)[clasa];
}

interface Problema {
  enunt: string;
  raspuns: number;
  stiu: string[];
  caut: string;
  pasi: string[]; // „Întrebare? Operație = rezultat”
  proba: string;
  raspunsText: string;
}

function problemaUnaOperatie(rng: Rng, clasa: Clasa): Problema {
  const [lo, hi] = limite(clasa);
  const o = rng.pick(OBIECTE);
  const [A, B] = rng.shuffle(NUME);
  const tip = rng.pick(clasa === 1 ? ["+", "-", "cmp+"] : ["+", "-", "cmp+", "cmp-", "x", ":"]);
  const s = (n: number) => cuSubstantiv(n, o.sg, o.pl);
  switch (tip) {
    case "+": {
      const a = rng.int(lo, hi);
      const b = rng.int(lo, hi);
      return {
        enunt: `${A} are ${s(a)}. Mai primește ${s(b)}. ${o.cate} ${o.pl} are acum ${A}?`,
        raspuns: a + b,
        stiu: [`${A} avea: ${a}`, `A primit: ${b}`],
        caut: `${o.cate} ${o.pl} are acum?`,
        pasi: [`${o.cate} ${o.pl} are acum ${A}? ${a} + ${b} = ${a + b}`],
        proba: `${a + b} − ${b} = ${a}`,
        raspunsText: `${A} are acum ${s(a + b)}.`,
      };
    }
    case "-": {
      const b = rng.int(lo, hi);
      const a = b + rng.int(lo, hi);
      return {
        enunt: `${A} avea ${s(a)}. I-a dat lui ${B} ${s(b)}. ${o.cate} ${o.pl} i-au rămas lui ${A}?`,
        raspuns: a - b,
        stiu: [`${A} avea: ${a}`, `A dat: ${b}`],
        caut: `${o.cate} ${o.pl} i-au rămas?`,
        pasi: [`${o.cate} ${o.pl} i-au rămas lui ${A}? ${a} − ${b} = ${a - b}`],
        proba: `${a - b} + ${b} = ${a}`,
        raspunsText: `Lui ${A} i-au rămas ${s(a - b)}.`,
      };
    }
    case "cmp+":
    case "cmp-": {
      const plus = tip === "cmp+";
      const d = rng.int(Math.max(2, Math.floor(lo / 2)), Math.floor(hi / 2));
      const a = plus ? rng.int(lo, hi) : rng.int(d + lo, d + hi);
      const r = plus ? a + d : a - d;
      return {
        enunt: `${A} are ${s(a)}. ${B} are cu ${d} ${plus ? "mai multe" : "mai puține"}. ${o.cate} ${o.pl} are ${B}?`,
        raspuns: r,
        stiu: [`${A}: ${a}`, `${B}: cu ${d} ${plus ? "mai multe" : "mai puține"}`],
        caut: `${o.cate} ${o.pl} are ${B}?`,
        pasi: [`„Cu ${d} mai ${plus ? "multe" : "puține"}” înseamnă ${plus ? "adunare" : "scădere"}: ${a} ${plus ? "+" : "−"} ${d} = ${r}`],
        proba: plus ? `${r} − ${d} = ${a}` : `${r} + ${d} = ${a}`,
        raspunsText: `${B} are ${s(r)}.`,
      };
    }
    case "x": {
      const k = rng.int(2, clasa === 2 ? 5 : 9);
      const g = rng.int(2, clasa === 2 ? 10 : 12);
      return {
        enunt: `${A} are ${g} pungi. În fiecare pungă sunt ${s(k)}. ${o.cate} ${o.pl} are în total?`,
        raspuns: g * k,
        stiu: [`${g} pungi`, `câte ${k} în fiecare pungă`],
        caut: `${o.cate} ${o.pl} în total?`,
        pasi: [`Grupe egale → înmulțire: ${g} × ${k} = ${g * k}`],
        proba: `${g * k} : ${g} = ${k}`,
        raspunsText: `${A} are în total ${s(g * k)}.`,
      };
    }
    default: {
      const k = rng.int(2, clasa === 2 ? 5 : 9);
      const g = rng.int(2, 10);
      return {
        enunt: `${A} împarte în mod egal ${s(g * k)} la ${g} prieteni. ${o.cate} ${o.pl} primește fiecare prieten?`,
        raspuns: k,
        stiu: [`total: ${g * k}`, `${g} prieteni, părți egale`],
        caut: `${o.cate} ${o.pl} primește fiecare?`,
        pasi: [`Împărțire în părți egale: ${g * k} : ${g} = ${k}`],
        proba: `${k} × ${g} = ${g * k}`,
        raspunsText: `Fiecare prieten primește ${s(k)}.`,
      };
    }
  }
}

function problemaDouaOperatii(rng: Rng, clasa: Clasa): Problema {
  const [lo, hi] = limite(clasa);
  const o = rng.pick(OBIECTE);
  const [A, B] = rng.shuffle(NUME);
  const s = (n: number) => cuSubstantiv(n, o.sg, o.pl);
  if (rng.bool()) {
    // A are a; B are cu d mai multe; câte au împreună?
    const a = rng.int(lo, hi);
    const d = rng.int(Math.max(2, Math.floor(lo / 2)), Math.floor(hi / 2));
    const b = a + d;
    return {
      enunt: `${A} are ${s(a)}, iar ${B} are cu ${d} mai multe. ${o.cate} ${o.pl} au împreună cei doi copii?`,
      raspuns: a + b,
      stiu: [`${A}: ${a}`, `${B}: cu ${d} mai multe decât ${A}`],
      caut: `${o.cate} ${o.pl} au împreună?`,
      pasi: [`${o.cate} ${o.pl} are ${B}? ${a} + ${d} = ${b}`, `${o.cate} ${o.pl} au împreună? ${a} + ${b} = ${a + b}`],
      proba: `${a + b} − ${b} = ${a}`,
      raspunsText: `Împreună au ${s(a + b)}.`,
    };
  }
  // are a, primește b, dă c
  const a = rng.int(lo, hi);
  const b = rng.int(lo, hi);
  const c = rng.int(Math.floor(lo / 2) + 1, a + b - 1);
  return {
    enunt: `${A} avea ${s(a)}. A mai primit ${s(b)}, apoi i-a dat lui ${B} ${s(c)}. ${o.cate} ${o.pl} are acum ${A}?`,
    raspuns: a + b - c,
    stiu: [`avea: ${a}`, `a primit: ${b}`, `a dat: ${c}`],
    caut: `${o.cate} ${o.pl} are acum?`,
    pasi: [`${o.cate} ${o.pl} avea după ce a primit? ${a} + ${b} = ${a + b}`, `${o.cate} ${o.pl} i-au rămas? ${a + b} − ${c} = ${a + b - c}`],
    proba: `${a + b - c} + ${c} − ${b} = ${a}`,
    raspunsText: `${A} are acum ${s(a + b - c)}.`,
  };
}

/** Rezolvarea pe șablonul în 4 pași (Ce știu / Ce caut / Rezolvare / Răspuns + probă). */
function rezolvare4Pasi(p: Problema): string[] {
  return [
    `1. Ce știu: ${p.stiu.join("; ")}.`,
    `2. Ce caut: ${p.caut}`,
    ...p.pasi.map((x, i) => `3.${i + 1} ${x}`),
    `4. Proba: ${p.proba}. Răspuns: ${p.raspunsText}`,
  ];
}

function itemProblema(id: string, p: Problema, nivel: Nivel, clasa: Clasa, puncte: number, extraDif = 0): Item {
  return {
    generatorId: id,
    enunt: p.enunt,
    interactiune: "input",
    cerinte: [{ text: "Răspuns:", raspuns: String(p.raspuns), latime: "s" }],
    rezolvare: rezolvare4Pasi(p),
    punctaj: puncte,
    dificultate: dificultate(nivel, clasa) + extraDif,
    spatiuLucru: 5,
  };
}

export const problemaOOperatie: Generator = {
  id: "probleme.o-operatie",
  titlu: "Problemă cu o operație",
  clase: [1, 2, 3, 4],
  competente: ["MEM-5.1", "M34-5.1"],
  niveluri: ["consolidare", "aprofundare", "evaluare"],
  generate(rng, nivel, clasa) {
    return itemProblema(this.id, problemaUnaOperatie(rng, clasa), nivel, clasa, 2);
  },
};

export const problemaDouaOp: Generator = {
  id: "probleme.doua-operatii",
  titlu: "Problemă cu două operații",
  clase: [2, 3, 4],
  competente: ["MEM-5.1", "M34-5.1"],
  niveluri: ["aprofundare", "evaluare"],
  generate(rng, nivel, clasa) {
    return itemProblema(this.id, problemaDouaOperatii(rng, clasa), nivel, clasa, 3, 1);
  },
};

/** Tip Soft‑Pak „TF”: elevul judecă dacă rezultatul afirmat este corect. */
export const adevaratFals: Generator = {
  id: "probleme.adevarat-fals",
  titlu: "Adevărat sau fals? (probleme)",
  clase: [1, 2, 3, 4],
  competente: ["MEM-4.1", "M34-5.1"],
  niveluri: ["consolidare", "aprofundare", "evaluare"],
  generate(rng, nivel, clasa) {
    const n = nivel === "consolidare" ? 3 : 4;
    const pr = Array.from({ length: n }, () => {
      const p = nivel === "consolidare" ? problemaUnaOperatie(rng, clasa) : rng.bool() ? problemaDouaOperatii(rng, clasa) : problemaUnaOperatie(rng, clasa);
      const corect = rng.bool();
      const afirmat = corect ? p.raspuns : p.raspuns + rng.pick([-10, -2, -1, 1, 2, 10].filter((d) => p.raspuns + d > 0));
      return { p, corect, afirmat };
    });
    return {
      generatorId: this.id,
      enunt: "Citește fiecare problemă și răspunsul propus. Scrie A (adevărat) sau F (fals):",
      interactiune: "adevarat-fals",
      cerinte: pr.map(({ p, afirmat, corect }) => ({
        text: `${p.enunt} Răspuns propus: ${afirmat}.`,
        raspuns: corect ? "A" : "F",
        optiuni: ["A", "F"],
        latime: "s",
      })),
      rezolvare: pr.map(({ p, corect }) => `${corect ? "A" : "F"} — ${p.pasi.join("; ")}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

/** Probleme originale de tip concurs. */
export const competitie: Generator = {
  id: "probleme.competitie",
  titlu: "Probleme de perspicacitate (tip concurs)",
  clase: [2, 3, 4],
  competente: ["MEM-4.1", "M34-5.2"],
  niveluri: ["competitie"],
  generate(rng, nivel, clasa) {
    const tip = rng.int(0, 3);
    let p: { enunt: string; raspuns: number; rez: string[] };
    if (tip === 0) {
      const g = rng.int(2, clasa === 2 ? 8 : 20);
      const i = rng.int(2, clasa === 2 ? 6 : 15);
      const cap = g + i;
      const pic = 2 * g + 4 * i;
      p = {
        enunt: `Într-o curte sunt găini și iepuri. Animalele au împreună ${cuSubstantiv(cap, "cap", "capete")} și ${cuSubstantiv(pic, "picior", "picioare")}. Câți iepuri sunt în curte?`,
        raspuns: i,
        rez: [
          `Presupunem că toate cele ${cap} animale sunt găini: ar avea ${cap} × 2 = ${2 * cap} picioare.`,
          `Lipsesc ${pic} − ${2 * cap} = ${pic - 2 * cap} picioare.`,
          `Fiecare iepure are cu 2 picioare mai mult decât o găină: ${pic - 2 * cap} : 2 = ${i} iepuri.`,
          `Verificare: ${g} găini × 2 + ${i} iepuri × 4 = ${cuSubstantiv(pic, "picior", "picioare")}. Răspuns: ${cuSubstantiv(i, "iepure", "iepuri")}.`,
        ],
      };
    } else if (tip === 1) {
      const mic = rng.int(5, clasa === 2 ? 30 : 200);
      const d = rng.int(2, clasa === 2 ? 20 : 100);
      const S = 2 * mic + d;
      p = {
        enunt: `Suma a două numere este ${S}. Un număr este cu ${d} mai mare decât celălalt. Care este numărul mai mare?`,
        raspuns: mic + d,
        rez: [
          `Desenăm două segmente: unul mic și unul cu ${d} mai lung.`,
          `Scoatem diferența: ${S} − ${d} = ${2 * mic} (două segmente egale).`,
          `Numărul mic: ${2 * mic} : 2 = ${mic}. Numărul mare: ${mic} + ${d} = ${mic + d}.`,
        ],
      };
    } else if (tip === 2) {
      const x = rng.int(2, clasa === 2 ? 20 : 60);
      const a = rng.int(2, 15);
      const b = rng.int(2, clasa === 2 ? 4 : 6);
      const c = rng.int(1, 10);
      const r = (x + a) * b - c;
      p = {
        enunt: `Mă gândesc la un număr. Îl adun cu ${a}, rezultatul îl înmulțesc cu ${b}, apoi scad ${c} și obțin ${r}. La ce număr m-am gândit?`,
        raspuns: x,
        rez: [
          `Mergem invers, de la sfârșit spre început, cu operațiile inverse:`,
          `${r} + ${c} = ${r + c}; ${r + c} : ${b} = ${x + a}; ${x + a} − ${a} = ${x}.`,
          `Verificare: (${x} + ${a}) × ${b} − ${c} = ${r}.`,
        ],
      };
    } else {
      const start = rng.int(1, 9);
      const pas = rng.int(2, 9);
      const k = rng.int(10, clasa === 2 ? 20 : 50);
      p = {
        enunt: `Se dă șirul: ${start}, ${start + pas}, ${start + 2 * pas}, ${start + 3 * pas}, … Care este al ${k}-lea număr din șir?`,
        raspuns: start + (k - 1) * pas,
        rez: [
          `Fiecare număr crește cu ${pas}. Până la al ${k}-lea număr facem ${k - 1} pași.`,
          `${start} + ${k - 1} × ${pas} = ${start + (k - 1) * pas}.`,
        ],
      };
    }
    return {
      generatorId: this.id,
      enunt: p.enunt,
      interactiune: "input",
      cerinte: [{ text: "Răspuns:", raspuns: String(p.raspuns), latime: "s" }],
      rezolvare: p.rez,
      punctaj: 5,
      dificultate: Math.min(10, dificultate(nivel, clasa) + 1),
      spatiuLucru: 6,
    };
  },
};

export const GENERATOARE_PROBLEME = [problemaOOperatie, problemaDouaOp, adevaratFals, competitie];
