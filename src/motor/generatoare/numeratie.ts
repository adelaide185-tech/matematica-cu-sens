import type { Cerinta, Clasa, Generator, Nivel } from "../tipuri";
import { numarInLitere, formatNumar } from "../limba";
import { cifre, cifreClasa, dificultate, maxClasa, nrCerinte, numarCifre, ORDINE } from "./comun";

const TOATE: Nivel[] = ["consolidare", "aprofundare", "evaluare", "competitie"];
const BAZA: Nivel[] = ["consolidare", "aprofundare", "evaluare"];

/** Numărul, ca sumă de ordine fără termenii nuli: 802 → „800+2” */
export function caSuma(n: number): string {
  const c = cifre(n);
  return c
    .map((d, i) => d * 10 ** (c.length - 1 - i))
    .filter((x) => x > 0)
    .join("+");
}

export const formareNumaratoare: Generator = {
  id: "numeratie.numaratoare",
  titlu: "Scrie numărul format pe numărătoare",
  clase: [1, 2, 3],
  competente: ["MEM-1.1", "M34-1.1"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 3);
    const k = Math.min(cifreClasa(clasa), 4);
    const nums = rng.distinct(n, () => numarCifre(rng, k));
    return {
      generatorId: this.id,
      enunt: "Scrie numerele formate pe numărătoarea cu bile:",
      interactiune: "input",
      coloane: 3,
      cerinte: nums.map((x) => {
        const c = cifre(x).reverse();
        return {
          text: "",
          vizual: { tip: "numaratoare", unitati: c[0] ?? 0, zeci: c[1] ?? 0, sute: c[2] ?? 0, mii: c[3] },
          raspuns: String(x),
          latime: "s",
        } satisfies Cerinta;
      }),
      rezolvare: nums.map((x) => `${formatNumar(x)} = ${caSuma(x)}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const descompunere: Generator = {
  id: "numeratie.descompunere",
  titlu: "Descompune numerele în sute, zeci și unități",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.1", "M34-1.1"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const k = cifreClasa(clasa);
    // la aprofundare apar zerouri în interior (802, 4050)
    const nums = rng.distinct(n, () => {
      const x = numarCifre(rng, k);
      if (nivel === "consolidare") return x;
      const c = cifre(x);
      c[rng.int(1, c.length - 1)] = 0;
      return Number(c.join(""));
    });
    return {
      generatorId: this.id,
      enunt: "Scrie numerele ca sumă de sute, zeci și unități (fără termenii egali cu 0):",
      interactiune: "input",
      coloane: 2,
      cerinte: nums.map((x) => ({ text: `${formatNumar(x)} =`, raspuns: caSuma(x), latime: "m" })),
      rezolvare: nums.map((x) => `${formatNumar(x)} = ${caSuma(x).replace(/\+/g, " + ")}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const compunere: Generator = {
  id: "numeratie.compunere",
  titlu: "Află numărul din sute, zeci și unități",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.1", "M34-1.1"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const k = cifreClasa(clasa);
    // cel puțin doi termeni nenuli (300 = … nu e un calcul)
    const nums = rng.distinct(n, () => {
      let x = numarCifre(rng, k);
      for (let i = 0; i < 20 && caSuma(x).split("+").length < 2; i++) x = numarCifre(rng, k);
      return x;
    });
    const cerinte: Cerinta[] = nums.map((x) => {
      const termeni = caSuma(x).split("+");
      // aprofundare: termenii amestecați (30 + 400 + 7)
      const t = nivel === "consolidare" ? termeni : rng.shuffle(termeni);
      return { text: `${t.join(" + ")} =`, raspuns: String(x), latime: "s" };
    });
    return {
      generatorId: this.id,
      enunt: "Calculează:",
      interactiune: "input",
      coloane: 2,
      cerinte,
      rezolvare: cerinte.map((c) => `${c.text} ${c.raspuns}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const vecini: Generator = {
  id: "numeratie.vecini",
  titlu: "Vecinii unui număr (predecesor, succesor)",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.2", "M34-1.2"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const max = maxClasa(clasa);
    const nums = rng.distinct(n, () => {
      // aprofundare: numere „capcană” de tipul 400, 699, 1000
      if (nivel !== "consolidare" && rng.bool(0.6)) {
        const r = rng.pick([10, 100, 1000].filter((p) => p < max));
        const m = rng.int(1, Math.floor(max / r) - 1) * r;
        return rng.bool() ? m : m - 1;
      }
      return rng.int(11, max - 2);
    });
    return {
      generatorId: this.id,
      enunt: "Scrie vecinii numerelor (predecesorul și succesorul), separați prin virgulă:",
      interactiune: "input",
      coloane: 2,
      cerinte: nums.map((x) => ({ text: `vecinii lui ${formatNumar(x)}:`, raspuns: `${x - 1}, ${x + 1}`, latime: "m" })),
      rezolvare: nums.map((x) => `${formatNumar(x - 1)} < ${formatNumar(x)} < ${formatNumar(x + 1)}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const comparare: Generator = {
  id: "numeratie.comparare",
  titlu: "Compară numerele (<, >, =)",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.2", "M34-1.2"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 6);
    const k = cifreClasa(clasa);
    const perechi = Array.from({ length: n }, () => {
      const a = numarCifre(rng, k);
      if (rng.bool(0.12)) return [a, a];
      if (nivel !== "consolidare" && rng.bool(0.6)) {
        // capcane: cifre inversate (558 / 585) sau diferă o singură cifră
        const c = cifre(a);
        const i = rng.int(0, c.length - 2);
        [c[i], c[i + 1]] = [c[i + 1], c[i]];
        const b = Number(c.join(""));
        if (b !== a && String(b).length === k) return [a, b];
      }
      return [a, numarCifre(rng, k)];
    });
    return {
      generatorId: this.id,
      enunt: "Compară numerele, folosind semnele <, > sau =:",
      interactiune: "comparare",
      coloane: 3,
      cerinte: perechi.map(([a, b]) => ({
        text: `${formatNumar(a)} ___ ${formatNumar(b)}`,
        raspuns: a < b ? "<" : a > b ? ">" : "=",
        optiuni: ["<", "=", ">"],
        latime: "s",
      })),
      rezolvare: perechi.map(([a, b]) => `${formatNumar(a)} ${a < b ? "<" : a > b ? ">" : "="} ${formatNumar(b)}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const ordonare: Generator = {
  id: "numeratie.ordonare",
  titlu: "Ordonează numerele crescător / descrescător",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.3", "M34-1.3"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const k = cifreClasa(clasa);
    const cate = nivel === "consolidare" ? 5 : 7;
    const mk = () => rng.distinct(cate, () => numarCifre(rng, k));
    const cres = mk();
    const desc = mk();
    const sc = [...cres].sort((a, b) => a - b).join(", ");
    const sd = [...desc].sort((a, b) => b - a).join(", ");
    return {
      generatorId: this.id,
      enunt: "Ordonează numerele:",
      interactiune: "input",
      cerinte: [
        { text: `crescător: ${cres.map(formatNumar).join(", ")} →`, raspuns: sc, latime: "l" },
        { text: `descrescător: ${desc.map(formatNumar).join(", ")} →`, raspuns: sd, latime: "l" },
      ],
      rezolvare: [`crescător: ${sc}`, `descrescător: ${sd}`],
      punctaj: 2,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const scriereLitere: Generator = {
  id: "numeratie.litere",
  titlu: "Scrie numerele cu litere",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.1", "M34-1.1"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nivel === "consolidare" ? 3 : 4;
    const k = cifreClasa(clasa);
    const nums = rng.distinct(n, () => {
      const x = numarCifre(rng, k);
      if (nivel === "consolidare") return x;
      // capcane: 0 în interior, 11–19, 12 → „douăsprezece” la mii
      const c = cifre(x);
      if (rng.bool()) c[c.length - 2] = 1;
      else c[rng.int(1, c.length - 1)] = 0;
      return Number(c.join(""));
    });
    return {
      generatorId: this.id,
      enunt: nivel === "consolidare" ? "Încercuiește scrierea corectă cu litere:" : "Scrie numerele cu litere:",
      // la consolidare: alegere (recunoaștere); la celelalte niveluri: scriere liberă pe linie
      interactiune: nivel === "consolidare" ? "alegere" : "input",
      cerinte: nums.map((x) => {
        const corect = numarInLitere(x);
        const c = cifre(x);
        const distr = new Set<string>();
        for (let i = 0; i < c.length && distr.size < 3; i++) {
          for (let j = i + 1; j < c.length && distr.size < 3; j++) {
            const d = [...c];
            [d[i], d[j]] = [d[j], d[i]];
            const y = Number(d.join(""));
            if (y !== x && String(y).length === c.length) distr.add(numarInLitere(y));
          }
        }
        while (distr.size < 3) distr.add(numarInLitere(x + distr.size + 1));
        return {
          text: `${formatNumar(x)} =`,
          raspuns: corect,
          optiuni: rng.shuffle([corect, ...distr]),
          latime: "l",
        } satisfies Cerinta;
      }),
      rezolvare: nums.map((x) => `${formatNumar(x)} = ${numarInLitere(x)}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const rotunjire: Generator = {
  id: "numeratie.rotunjire",
  titlu: "Rotunjește numerele",
  clase: [2, 3, 4],
  competente: ["MEM-1.3", "M34-1.3"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 3);
    const k = cifreClasa(clasa);
    const ordine = clasa === 2 ? [1, 2] : clasa === 3 ? [1, 2, 3] : [2, 3, 4];
    const cer = Array.from({ length: n }, () => {
      const x = numarCifre(rng, k);
      const o = rng.pick(ordine.filter((p) => p < k));
      const p = 10 ** o;
      // la aprofundare forțăm cazul „cifra 5” (rotunjire în sus)
      let y = x;
      if (nivel !== "consolidare" && rng.bool(0.5)) {
        const c = cifre(x);
        c[c.length - o] = 5;
        y = Number(c.join(""));
      }
      return { x: y, o, r: Math.round(y / p) * p };
    });
    return {
      generatorId: this.id,
      enunt: "Rotunjește numerele la ordinul cerut:",
      interactiune: "input",
      coloane: 2,
      cerinte: cer.map(({ x, o, r }) => ({ text: `${formatNumar(x)} la ordinul ${ORDINE[o]} →`, raspuns: String(r), latime: "s" })),
      rezolvare: cer.map(({ x, o, r }) => `${formatNumar(x)} ≈ ${formatNumar(r)} (ne uităm la cifra ${ORDINE[o - 1]}: dacă e 5 sau mai mare, rotunjim în sus)`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

/** Șir cu regulă: +k, −k; la aprofundare reguli alternante; la competiție diferențe crescătoare. */
export const sirRegula: Generator = {
  id: "numeratie.sir",
  titlu: "Descoperă regula și continuă șirul",
  clase: [1, 2, 3, 4],
  competente: ["MEM-3.1", "M34-3.1"],
  niveluri: TOATE,
  generate(rng, nivel, clasa) {
    const n = nivel === "competitie" ? 2 : 3;
    const max = maxClasa(clasa);
    const pasi = clasa === 1 ? [1, 2, 5, 10] : clasa === 2 ? [2, 3, 5, 10, 50, 100] : [5, 25, 50, 100, 250, 1000];
    const siruri = Array.from({ length: n }, () => {
      const s: number[] = [];
      let regula: string;
      if (nivel === "competitie") {
        const start = rng.int(1, 20);
        const d0 = rng.int(1, 4);
        s.push(start);
        for (let i = 0; i < 6; i++) s.push(s[i] + d0 + i);
        regula = `diferențele cresc cu 1 (+${d0}, +${d0 + 1}, +${d0 + 2}, …)`;
      } else if (nivel === "aprofundare" || nivel === "evaluare") {
        const a = rng.pick(pasi);
        const b = rng.pick(pasi.filter((p) => p < a)) ?? 1;
        let x = rng.int(b + 1, Math.max(b + 2, Math.floor(max / 2)));
        for (let i = 0; i < 7; i++) {
          s.push(x);
          x += i % 2 === 0 ? a : -b;
        }
        regula = `+${a}, −${b}, alternativ`;
      } else {
        const p = rng.pick(pasi);
        const crescator = rng.bool(0.6);
        let x = crescator ? rng.int(0, max - 1 - 7 * p) : rng.int(7 * p, max - 1);
        for (let i = 0; i < 7; i++) {
          s.push(x);
          x += crescator ? p : -p;
        }
        regula = crescator ? `se adună ${p}` : `se scade ${p}`;
      }
      return { arata: s.slice(0, 4), urm: s.slice(4, 7), regula };
    });
    return {
      generatorId: this.id,
      enunt: "Descoperă regula și scrie următoarele trei numere:",
      interactiune: "input",
      cerinte: siruri.map(({ arata, urm }) => ({ text: `${arata.map(formatNumar).join(", ")}, …`, raspuns: urm.join(", "), latime: "m" })),
      rezolvare: siruri.map(({ arata, urm, regula }) => `${[...arata, ...urm].map(formatNumar).join(", ")} — regula: ${regula}`),
      punctaj: n * (nivel === "competitie" ? 2 : 1),
      dificultate: dificultate(nivel, clasa),
    };
  },
};

/** „Cel mai mare număr par de trei cifre diferite” — rezolvat prin căutare exhaustivă (corect garantat). */
export const extreme: Generator = {
  id: "numeratie.extreme",
  titlu: "Cel mai mare / cel mai mic număr cu proprietăți date",
  clase: [2, 3, 4],
  competente: ["MEM-1.1", "M34-1.1"],
  niveluri: ["aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const k = Math.min(cifreClasa(clasa), 4);
    const cuv = k === 3 ? "trei" : k === 4 ? "patru" : "două";
    const dif = (x: number) => new Set(String(x)).size === String(x).length;
    const suma = (x: number) => cifre(x).reduce((a, b) => a + b, 0);
    const S = rng.int(5, 9 * k - 6);
    const z = rng.int(0, 9);
    const sabloane: { text: string; f: (x: number) => boolean; max: boolean }[] = [
      { text: `cel mai mic număr de ${cuv} cifre diferite`, f: dif, max: false },
      { text: `cel mai mare număr de ${cuv} cifre diferite`, f: dif, max: true },
      { text: `cel mai mare număr par de ${cuv} cifre diferite`, f: (x) => dif(x) && x % 2 === 0, max: true },
      { text: `cel mai mic număr impar de ${cuv} cifre diferite`, f: (x) => dif(x) && x % 2 === 1, max: false },
      { text: `cel mai mare număr de ${cuv} cifre format doar din cifre impare diferite`, f: (x) => dif(x) && cifre(x).every((d) => d % 2 === 1), max: true },
      { text: `cel mai mic număr de ${cuv} cifre cu suma cifrelor ${S}`, f: (x) => suma(x) === S, max: false },
      { text: `cel mai mare număr de ${cuv} cifre cu suma cifrelor ${S}`, f: (x) => suma(x) === S, max: true },
      { text: `cel mai mic număr de ${cuv} cifre identice`, f: (x) => new Set(String(x)).size === 1, max: false },
      { text: `cel mai mare număr de ${cuv} cifre diferite care are cifra zecilor ${z}`, f: (x) => dif(x) && cifre(x)[k - 2] === z, max: true },
    ];
    const alese = rng.shuffle(sabloane).slice(0, nivel === "competitie" ? 3 : 4);
    const cer = alese.map((s) => {
      let r = -1;
      if (s.max) {
        for (let x = 10 ** k - 1; x >= 10 ** (k - 1); x--) if (s.f(x)) { r = x; break; }
      } else {
        for (let x = 10 ** (k - 1); x < 10 ** k; x++) if (s.f(x)) { r = x; break; }
      }
      return { text: `${s.text[0].toUpperCase()}${s.text.slice(1)}:`, raspuns: String(r), latime: "s" as const };
    });
    return {
      generatorId: this.id,
      enunt: "Scrie:",
      interactiune: "input",
      cerinte: cer,
      rezolvare: cer.map((c) => `${c.text} ${c.raspuns}`),
      punctaj: cer.length * (nivel === "competitie" ? 2 : 1),
      dificultate: dificultate(nivel, clasa) + 1,
    };
  },
};

export const cifreDate: Generator = {
  id: "numeratie.cifre-date",
  titlu: "Numere formate cu cifre date",
  clase: [2, 3, 4],
  competente: ["MEM-1.1", "M34-1.1"],
  niveluri: ["aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const cuZero = nivel !== "aprofundare";
    const c = rng.distinct(3, () => rng.int(cuZero ? 0 : 1, 9));
    if (cuZero && !c.includes(0)) c[0] = 0;
    const perm = [
      [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
    ].map((p) => p.map((i) => c[i]));
    const nums = [...new Set(perm.filter((p) => p[0] !== 0).map((p) => Number(p.join(""))))].sort((a, b) => a - b);
    return {
      generatorId: this.id,
      enunt: `Scrie, în ordine crescătoare, toate numerele de trei cifre care se pot forma cu cifrele ${c.join(", ")} (fiecare cifră folosită o singură dată).`,
      interactiune: "input",
      cerinte: [{ text: "", raspuns: nums.join(", "), latime: "l" }],
      rezolvare: [
        `Prima cifră nu poate fi 0${c.includes(0) ? "" : " (aici nu avem 0)"}.`,
        `Numerele: ${nums.join(", ")} (${nums.length} numere).`,
      ],
      punctaj: nivel === "competitie" ? 3 : 2,
      dificultate: dificultate(nivel, clasa) + 1,
      spatiuLucru: 1,
    };
  },
};

export const GENERATOARE_NUMERATIE = [
  formareNumaratoare, descompunere, compunere, vecini, comparare, ordonare,
  scriereLitere, rotunjire, sirRegula, extreme, cifreDate,
];

export type { Clasa };
