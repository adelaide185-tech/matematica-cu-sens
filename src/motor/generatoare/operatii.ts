import type { Cerinta, Clasa, Generator, Nivel } from "../tipuri";
import type { Rng } from "../rng";
import { formatNumar } from "../limba";
import { cifre, dificultate, nrCerinte } from "./comun";

const BAZA: Nivel[] = ["consolidare", "aprofundare", "evaluare"];

/** Câte cifre au termenii la adunare/scădere, pe clase. */
function cifreCalcul(clasa: Clasa): number {
  return { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }[clasa];
}

/**
 * Adunare a + b cu/fără trecere peste ordin, construită coloană cu coloană.
 * Suma rămâne sub 10^k (nu apare o cifră în plus).
 */
export function genAdunare(rng: Rng, k: number, trecere: boolean): [number, number] {
  for (let guard = 0; guard < 500; guard++) {
    const a: number[] = [];
    const b: number[] = [];
    let carry = 0;
    let areTrecere = false;
    for (let i = 0; i < k; i++) {
      const prima = i === k - 1;
      const da = rng.int(prima ? 1 : 0, prima ? 4 : 9);
      let db: number;
      if (trecere && !prima && rng.bool(0.6)) db = rng.int(Math.max(0, 10 - da - carry), 9);
      else db = rng.int(prima ? 1 : 0, Math.max(prima ? 1 : 0, 9 - da - carry));
      if (prima && da + db + carry > 9) db = Math.max(0, 9 - da - carry);
      if (da + db + carry > 9) areTrecere = true;
      carry = da + db + carry > 9 ? 1 : 0;
      a.unshift(da);
      b.unshift(db);
    }
    const x = Number(a.join(""));
    const y = Number(b.join(""));
    if (areTrecere === trecere && x > 0 && y > 0 && x + y < 10 ** k) return [x, y];
  }
  return [10 ** (k - 1), 10 ** (k - 2) || 1];
}

/** Scădere a − b: construim din adunare (a = s, b = termen). */
export function genScadere(rng: Rng, k: number, trecere: boolean): [number, number] {
  const [x, y] = genAdunare(rng, k, trecere);
  return [x + y, rng.bool() ? x : y];
}

export const adunareScadere: Generator = {
  id: "operatii.adunare-scadere",
  titlu: "Adunări și scăderi",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.4", "M34-1.4"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 6);
    const k = cifreCalcul(clasa);
    const trecere = clasa > 1 && nivel !== "consolidare";
    const cer: Cerinta[] = Array.from({ length: n }, (_, i) => {
      const kk = rng.int(Math.max(2, k - 1), k);
      if (i % 2 === 0) {
        const [a, b] = genAdunare(rng, kk, trecere && rng.bool(0.8));
        return { text: `${formatNumar(a)} + ${formatNumar(b)} =`, raspuns: String(a + b), latime: "s" };
      }
      const [a, b] = genScadere(rng, kk, trecere && rng.bool(0.8));
      return { text: `${formatNumar(a)} − ${formatNumar(b)} =`, raspuns: String(a - b), latime: "s" };
    });
    return {
      generatorId: this.id,
      enunt: nivel === "consolidare" ? "Calculează:" : "Calculează în scris (în coloană) și fă proba:",
      interactiune: "input",
      coloane: 3,
      cerinte: cer,
      rezolvare: cer.map((c) => `${c.text} ${formatNumar(Number(c.raspuns))}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
      spatiuLucru: nivel === "consolidare" ? 0 : 3,
    };
  },
};

export const termenNecunoscut: Generator = {
  id: "operatii.termen-necunoscut",
  titlu: "Află termenul necunoscut",
  clase: [1, 2, 3, 4],
  competente: ["MEM-1.4", "M34-1.4"],
  niveluri: ["aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const k = cifreCalcul(clasa);
    const cer = Array.from({ length: n }, () => {
      const [a, b] = genAdunare(rng, rng.int(Math.max(2, k - 1), k), rng.bool());
      const s = a + b;
      const tip = rng.int(0, 2);
      if (tip === 0) return { text: `${formatNumar(a)} + ___ = ${formatNumar(s)}`, raspuns: String(b), rez: `${s} − ${a} = ${b}` };
      if (tip === 1) return { text: `___ − ${formatNumar(b)} = ${formatNumar(a)}`, raspuns: String(s), rez: `${a} + ${b} = ${s}` };
      return { text: `${formatNumar(s)} − ___ = ${formatNumar(a)}`, raspuns: String(b), rez: `${s} − ${a} = ${b}` };
    });
    return {
      generatorId: this.id,
      enunt: "Află numărul necunoscut:",
      interactiune: "input",
      coloane: 2,
      cerinte: cer.map(({ text, raspuns }) => ({ text, raspuns, latime: "s" })),
      rezolvare: cer.map((c) => `${c.text.replace("___", c.raspuns)}  (calcul: ${c.rez})`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

/** Factorii tablei pe clase și niveluri (programa: cl. II tabla cu 2, 3, 4, 5, 10). */
function factoriTabla(clasa: Clasa, nivel: Nivel): number[] {
  if (clasa <= 2) return nivel === "consolidare" ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 10];
  return [2, 3, 4, 5, 6, 7, 8, 9, 10];
}

export const tablaInmultirii: Generator = {
  id: "operatii.tabla-inmultirii",
  titlu: "Tabla înmulțirii",
  clase: [2, 3, 4],
  competente: ["MEM-1.5", "M34-1.5"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 8);
    const f = factoriTabla(clasa, nivel);
    const cer: Cerinta[] = rng
      .distinct(n, () => [rng.pick(f), rng.int(0, 10)] as [number, number], (p) => p.join("x"))
      .map(([a, b]) => {
        const [x, y] = rng.bool() ? [a, b] : [b, a];
        if (nivel !== "consolidare" && rng.bool(0.4)) {
          return { text: `${x} × ___ = ${x * y}`, raspuns: String(y), latime: "s" as const };
        }
        return { text: `${x} × ${y} =`, raspuns: String(x * y), latime: "s" as const };
      })
      // „0 × ___ = 0” nu are răspuns unic
      .map((c): Cerinta => (c.text.startsWith("0 × ___") ? { ...c, text: "0 × 7 =", raspuns: "0" } : c));
    return {
      generatorId: this.id,
      enunt: nivel === "consolidare" ? "Calculează:" : "Calculează sau află factorul necunoscut:",
      interactiune: "input",
      coloane: 4,
      cerinte: cer,
      rezolvare: cer.map((c) => (c.text.includes("___") ? c.text.replace("___", c.raspuns) : `${c.text} ${c.raspuns}`)),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const impartireTabla: Generator = {
  id: "operatii.impartire-tabla",
  titlu: "Împărțirea (tabla împărțirii)",
  clase: [2, 3, 4],
  competente: ["MEM-1.5", "M34-1.5"],
  niveluri: BAZA,
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 8);
    const f = factoriTabla(clasa, nivel);
    const cer: Cerinta[] = rng
      .distinct(n, () => [rng.pick(f), rng.int(1, 10)] as [number, number], (p) => p.join(":"))
      .map(([imp, cat]) => ({ text: `${imp * cat} : ${imp} =`, raspuns: String(cat), latime: "s" as const }));
    return {
      generatorId: this.id,
      enunt: "Calculează (gândește-te la înmulțire):",
      interactiune: "input",
      coloane: 4,
      cerinte: cer,
      rezolvare: cer.map((c) => {
        const [d, i] = c.text.replace(" =", "").split(" : ").map(Number);
        return `${d} : ${i} = ${c.raspuns}, pentru că ${c.raspuns} × ${i} = ${d}`;
      }),
      punctaj: n,
      dificultate: dificultate(nivel, clasa),
    };
  },
};

export const inmultireExtinsa: Generator = {
  id: "operatii.inmultire-extinsa",
  titlu: "Înmulțirea: zeci × zeci, număr de 2 cifre × o cifră",
  clase: [3, 4],
  competente: ["M34-1.5"],
  niveluri: ["consolidare", "aprofundare", "evaluare"],
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const cer: Cerinta[] = Array.from({ length: n }, (_, i) => {
      if (i % 2 === 0) {
        const a = rng.int(1, 9) * 10;
        const b = rng.int(1, 9) * (nivel === "consolidare" ? 1 : 10);
        return { text: `${a} × ${b} =`, raspuns: String(a * b), latime: "s" };
      }
      const a = rng.int(11, clasa === 3 ? 99 : 999);
      const b = rng.int(2, 9);
      return { text: `${a} × ${b} =`, raspuns: String(a * b), latime: "s" };
    });
    return {
      generatorId: this.id,
      enunt: "Calculează:",
      interactiune: "input",
      coloane: 2,
      cerinte: cer,
      rezolvare: cer.map((c) => `${c.text} ${formatNumar(Number(c.raspuns))}`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa) + 1,
      spatiuLucru: 2,
    };
  },
};

export const impartireRest: Generator = {
  id: "operatii.impartire-rest",
  titlu: "Împărțirea cu rest",
  clase: [3, 4],
  competente: ["M34-1.5"],
  niveluri: ["aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 4);
    const cer = Array.from({ length: n }, () => {
      const imp = rng.int(2, 9);
      const cat = rng.int(2, clasa === 3 ? 10 : 99);
      const rest = rng.int(1, imp - 1);
      return { d: imp * cat + rest, imp, cat, rest };
    });
    return {
      generatorId: this.id,
      enunt: "Efectuează împărțirile cu rest. Scrie câtul și restul (ex.: „7 rest 2”):",
      interactiune: "input",
      coloane: 2,
      cerinte: cer.map(({ d, imp, cat, rest }) => ({ text: `${d} : ${imp} =`, raspuns: `${cat} rest ${rest}`, latime: "m" })),
      rezolvare: cer.map(({ d, imp, cat, rest }) => `${d} : ${imp} = ${cat} rest ${rest}; proba: ${cat} × ${imp} + ${rest} = ${d} (restul < împărțitorul)`),
      punctaj: n,
      dificultate: dificultate(nivel, clasa) + 1,
    };
  },
};

export const ordineaOperatiilor: Generator = {
  id: "operatii.ordinea-operatiilor",
  titlu: "Ordinea efectuării operațiilor",
  clase: [2, 3, 4],
  competente: ["MEM-1.6", "M34-1.6"],
  niveluri: ["aprofundare", "evaluare", "competitie"],
  generate(rng, nivel, clasa) {
    const n = nrCerinte(nivel, 3);
    const t = () => rng.int(2, clasa === 2 ? 5 : 9);
    const cer = Array.from({ length: n }, () => {
      const a = rng.int(10, 60);
      const b = t();
      const c = t();
      const d = t();
      const forme = [
        { e: `${a} + ${b} × ${c}`, v: a + b * c },
        { e: `${a} − ${b} × ${c}`, v: a - b * c },
        { e: `(${a} + ${b}) − ${c} × ${d}`, v: a + b - c * d },
        { e: `${b} × ${c} + ${c * d} : ${c}`, v: b * c + d },
        { e: `(${b} + ${c}) × ${d}`, v: (b + c) * d },
      ];
      const f = rng.pick(forme.filter((x) => x.v >= 0));
      return { text: `${f.e} =`, raspuns: String(f.v), latime: "s" as const };
    });
    return {
      generatorId: this.id,
      enunt: "Calculează, respectând ordinea efectuării operațiilor (întâi parantezele, apoi înmulțirea și împărțirea, apoi adunarea și scăderea):",
      interactiune: "input",
      cerinte: cer,
      rezolvare: cer.map((c) => `${c.text} ${c.raspuns}`),
      punctaj: n * 2,
      dificultate: dificultate(nivel, clasa) + 1,
      spatiuLucru: 2,
    };
  },
};

export const GENERATOARE_OPERATII = [
  adunareScadere, termenNecunoscut, tablaInmultirii, impartireTabla,
  inmultireExtinsa, impartireRest, ordineaOperatiilor,
];

export { cifre };
