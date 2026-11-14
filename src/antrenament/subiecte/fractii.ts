import type { Clasa } from "@/motor/tipuri";
import type { Rng } from "@/motor/rng";
import type { NivelJoc, Subiect } from "../tipuri";
import { dif, fmt } from "./comun";

/** Numitorii din programă: cl. II doar jumătatea și sfertul; cl. III–IV numitori ≤ 10 (12 la provocare). */
function numitori(clasa: Clasa, nivel: NivelJoc): number[] {
  if (clasa <= 2) return [2, 4];
  if (nivel === "usor") return [2, 3, 4, 5, 6];
  return clasa === 3 ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 6, 8, 10, 12];
}

const NUME_NUMITOR: Record<number, string> = { 2: "doimi (jumătăți)", 3: "treimi", 4: "pătrimi (sferturi)", 5: "cincimi", 6: "șesimi", 8: "optimi", 10: "zecimi", 12: "doisprezecimi" };
const fr = (c: number, p: number) => `${c}/${p}`;

function variante(rng: Rng, c: number, p: number): string[] {
  const corect = fr(c, p);
  const d = new Set<string>([fr(p, c), fr(p - c, p), fr(c, p + 1), fr(Math.max(1, c - 1), p), fr(c + 1, p)].filter((x) => x !== corect && !x.startsWith("0/") && !x.endsWith("/0")));
  return rng.shuffle([corect, ...rng.shuffle([...d]).slice(0, 3)]);
}

export const parteDinIntreg: Subiect = {
  id: "fr.parte",
  titlu: "Fracția: o parte din întreg",
  descriere: "Colorează pizza sau recunoaște fracția",
  domeniu: "fractii",
  clase: [2, 3, 4],
  icon: "🍕",
  exercitiu(rng, nivel, clasa) {
    const p = rng.pick(numitori(clasa, nivel));
    const c = rng.int(1, nivel === "usor" ? p - 1 : p);
    const forma = rng.bool(0.6) ? "cerc" : "dreptunghi";
    const v = nivel === "usor" ? rng.int(0, 1) : nivel === "mediu" ? rng.int(0, 2) : rng.int(1, 3);
    const obiect = forma === "cerc" ? "pizza" : "ciocolata";
    const ind = [
      `Întregul este împărțit în ${p} părți egale: numitorul este ${p} (${NUME_NUMITOR[p] ?? p}).`,
      `Numărătorul arată câte părți luăm: ${c}.`,
      `${fr(c, p)}${c === p ? " = un întreg (fracție echiunitară)" : ""}`,
    ];
    if (v === 0) {
      return {
        cheie: `frc:${forma}:${c}/${p}`, fapt: fr(c, p),
        enunt: `Colorează ${fr(c, p)} din ${obiect}.`,
        mecanica: { tip: "fractie", forma, parti: p, colorate: c, interactiv: true },
        raspuns: { tip: "construit", valoare: c },
        indicii: [`Numitorul ${p} spune în câte părți e împărțit întregul. Numărătorul ${c} spune câte colorezi.`, `Colorează exact ${c} ${c === 1 ? "parte" : "părți"}.`, ind[2]],
        dificultate: dif(nivel, clasa),
      };
    }
    if (v === 1) {
      return {
        cheie: `frr:${forma}:${c}/${p}`, fapt: fr(c, p),
        enunt: "Ce fracție este colorată?",
        mecanica: { tip: "fractie", forma, parti: p, colorate: c },
        raspuns: { tip: "optiune", valoare: fr(c, p), optiuni: variante(rng, c, p) },
        indicii: ind,
        dificultate: dif(nivel, clasa),
      };
    }
    if (v === 2) {
      return {
        cheie: `frs:${forma}:${c}/${p}`, fapt: fr(c, p),
        enunt: "Scrie fracția colorată:",
        mecanica: { tip: "fractie", forma, parti: p, colorate: c },
        raspuns: { tip: "campuri", valori: [c, p], etichete: ["numărătorul", "numitorul"] },
        indicii: ind,
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `frn:${forma}:${c}/${p}`, fapt: fr(c, p),
      enunt: "Ce fracție NU este colorată?",
      mecanica: { tip: "fractie", forma, parti: p, colorate: c },
      raspuns: { tip: "campuri", valori: [p - c, p], etichete: ["numărătorul", "numitorul"] },
      indicii: [`Sunt ${p} părți în total; ${c} sunt colorate.`, `Necolorate: ${p} − ${c} = ${p - c}.`, `${fr(p - c, p)}`],
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

export const fractieDinObiecte: Subiect = {
  id: "fr.din-obiecte",
  titlu: "Jumătate, sfert, treime din…",
  descriere: "Împarte obiectele în grupe egale",
  domeniu: "fractii",
  clase: [2, 3],
  icon: "🍎",
  exercitiu(rng, nivel, clasa) {
    const p = clasa === 2 ? rng.pick([2, 4]) : rng.pick(nivel === "usor" ? [2, 4] : [2, 3, 4, 5]);
    const k = rng.int(1, nivel === "usor" ? 5 : 10);
    const N = p * k;
    const s = rng.pick(["🍎", "🍓", "⭐", "🎈", "🍪", "🐟"]);
    const nume = p === 2 ? "jumătate" : p === 4 ? "un sfert" : p === 3 ? "o treime" : "o cincime";
    const cuGrupe = nivel !== "provocare" && N <= 30;
    return {
      cheie: `frob:${cuGrupe ? "g" : "e"}:${p}:${N}`, fapt: `${N}/${p}`,
      enunt: `Cât este ${nume} din ${N}?`,
      mecanica: cuGrupe ? { tip: "grupe", grupe: p, cate: k, simbol: s } : { tip: "expresie", text: `1/${p} din ${N}` },
      raspuns: { tip: "numar", valoare: k },
      indicii: [`${nume[0].toUpperCase()}${nume.slice(1)} înseamnă că împărțim în ${p} părți egale.`, `${N} : ${p} = ?`, `${N} : ${p} = ${k}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const compararefractii: Subiect = {
  id: "fr.comparare",
  titlu: "Comparăm fracții",
  descriere: "Benzi de fracții puse una sub alta",
  domeniu: "fractii",
  clase: [3, 4],
  icon: "📏",
  exercitiu(rng, nivel, clasa) {
    const tip = nivel === "usor" ? 0 : nivel === "mediu" ? rng.int(0, 1) : rng.int(0, clasa === 4 ? 2 : 1);
    let a: [number, number], b: [number, number], regula: string;
    if (tip === 0) {
      const p = rng.pick(numitori(clasa, nivel).filter((x) => x > 2));
      a = [rng.int(1, p), p];
      b = [rng.int(1, p), p];
      regula = "Același numitor (părți de aceeași mărime): e mai mare fracția cu mai multe părți.";
    } else if (tip === 1) {
      const c = rng.int(1, 3);
      const ns = numitori(clasa, nivel).filter((x) => x > c);
      a = [c, rng.pick(ns)];
      b = [c, rng.pick(ns)];
      regula = "Același numărător: e mai mare fracția cu numitorul mai mic (părțile sunt mai mari).";
    } else {
      const p = rng.pick([2, 3, 4, 5]);
      const c = rng.int(1, p - 1);
      const k = rng.int(2, 3);
      a = [c, p];
      b = [c * k + rng.pick([-1, 0, 0, 1]), p * k];
      if (b[0] < 1) b[0] = 1;
      regula = `Amplifică: ${c}/${p} = ${c * k}/${p * k}, apoi compară.`;
    }
    const va = a[0] / a[1];
    const vb = b[0] / b[1];
    const semn = Math.abs(va - vb) < 1e-9 ? "=" : va < vb ? "<" : ">";
    return {
      cheie: `frcmp:${fr(...a)}?${fr(...b)}`, fapt: `${fr(...a)}?${fr(...b)}`,
      enunt: `Compară: ${fr(...a)} ? ${fr(...b)}`,
      mecanica: { tip: "benzi", fractii: [a, b] },
      raspuns: { tip: "optiune", valoare: semn, optiuni: ["<", "=", ">"] },
      indicii: ["Uită-te la benzi: care parte colorată e mai lungă?", regula, `${fr(...a)} ${semn} ${fr(...b)}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const fractieDinNumar: Subiect = {
  id: "fr.din-numar",
  titlu: "Fracția dintr-un număr",
  descriere: "Împarte în părți egale, apoi ia câteva",
  domeniu: "fractii",
  clase: [3, 4],
  icon: "🧮",
  exercitiu(rng, nivel, clasa) {
    const p = rng.pick(numitori(clasa, nivel).filter((x) => x <= 10));
    const c = nivel === "usor" ? 1 : rng.int(1, p - 1);
    const parte = rng.int(2, clasa === 3 ? 12 : nivel === "provocare" ? 99 : 25);
    const N = p * parte;
    return {
      cheie: `frdn:${c}/${p}:${N}`, fapt: `${c}/${p}:${N}`,
      enunt: `Cât este ${fr(c, p)} din ${fmt(N)}?`,
      mecanica: { tip: "bara", parti: Array.from({ length: p }, (_, i) => ({ eticheta: i < c ? "iau" : "", valoare: null, culoare: i < c ? "#f9c50f" : undefined })), total: N },
      raspuns: { tip: "numar", valoare: c * parte },
      indicii: [`Împarte ${fmt(N)} în ${p} părți egale: ${fmt(N)} : ${p} = ${parte} (o parte).`, `Ia ${c} ${c === 1 ? "parte" : "părți"}: ${parte} × ${c}.`, `${fr(c, p)} din ${fmt(N)} = ${fmt(c * parte)}`],
      dificultate: dif(nivel, clasa, c > 1 ? 1 : 0),
    };
  },
};

export const operatiiFractii: Subiect = {
  id: "fr.operatii",
  titlu: "Adunăm și scădem fracții",
  descriere: "Același numitor; numere mixte",
  domeniu: "fractii",
  clase: [4],
  icon: "➕",
  exercitiu(rng, nivel) {
    const p = rng.pick([3, 4, 5, 6, 8, 10]);
    if (nivel === "provocare" && rng.bool()) {
      // număr mixt: 7/4 = 1 întreg și 3/4
      const intregi = rng.int(1, 3);
      const r = rng.int(1, p - 1);
      const c = intregi * p + r;
      return {
        cheie: `frmix:${c}/${p}`, fapt: `${c}/${p}`,
        enunt: `${fr(c, p)} = ? întregi și ?/${p}`,
        mecanica: { tip: "fractie", forma: "cerc", parti: p, colorate: c, intregi: intregi + 1 },
        raspuns: { tip: "campuri", valori: [intregi, r], etichete: ["întregi", `numărătorul (din ${p})`] },
        indicii: [`Un întreg are ${p}/${p}. Câte grupe de ${p} părți încap în ${c}?`, `${c} : ${p} = ${intregi} rest ${r}.`, `${fr(c, p)} = ${intregi} întregi și ${fr(r, p)}`],
        dificultate: dif(nivel, 4, 1),
      };
    }
    const plus = rng.bool();
    const a = rng.int(1, p - 1);
    const b = plus ? rng.int(1, nivel === "usor" ? p - a : p - 1) : rng.int(1, a);
    const r = plus ? a + b : a - b;
    return {
      cheie: `frop:${a}${plus ? "+" : "-"}${b}/${p}`, fapt: `${a}${plus ? "+" : "-"}${b}/${p}`,
      enunt: `${fr(a, p)} ${plus ? "+" : "−"} ${fr(b, p)} = ?/${p}`,
      mecanica: { tip: "benzi", fractii: [[a, p], [b, p]] },
      raspuns: { tip: "numar", valoare: r },
      indicii: ["Când numitorii sunt egali, părțile au aceeași mărime.", `Numitorul rămâne ${p}; ${plus ? "adunăm" : "scădem"} doar numărătorii: ${a} ${plus ? "+" : "−"} ${b}.`, `${fr(a, p)} ${plus ? "+" : "−"} ${fr(b, p)} = ${fr(r, p)}`],
      dificultate: dif(nivel, 4),
    };
  },
};

export const procente: Subiect = {
  id: "fr.procente",
  titlu: "Procente",
  descriere: "Grila de 100 de pătrățele",
  domeniu: "fractii",
  clase: [4],
  icon: "💯",
  exercitiu(rng, nivel) {
    if (nivel === "usor" || rng.bool(0.4)) {
      const k = nivel === "usor" ? rng.int(1, 9) * 10 + (rng.bool(0.5) ? 0 : 5) : rng.int(1, 99);
      return {
        cheie: `proc-g:${k}`, fapt: `${k}%`,
        enunt: "Ce procent din grilă este colorat?",
        mecanica: { tip: "grila100", colorate: k },
        raspuns: { tip: "numar", valoare: k },
        indicii: ["Grila are 100 de pătrățele; „la sută” înseamnă „din 100”.", "Numără rândurile pline (câte 10) și pătrățelele în plus.", `${k} din 100 = ${k}%`],
        dificultate: dif(nivel, 4),
      };
    }
    const p = rng.pick(nivel === "mediu" ? [50, 25, 10] : [10, 20, 25, 50, 75]);
    const N = rng.int(1, nivel === "mediu" ? 20 : 40) * (100 / gcd(p, 100));
    return {
      cheie: `proc-n:${p}:${N}`, fapt: `${p}%:${N}`,
      enunt: `Cât este ${p}% din ${fmt(N)}?`,
      mecanica: { tip: "grila100", colorate: p },
      raspuns: { tip: "numar", valoare: (p * N) / 100 },
      indicii: [`${p}% = ${p}/100${p === 50 ? " = jumătate" : p === 25 ? " = un sfert" : p === 10 ? " = o zecime" : ""}.`, `${fmt(N)} : 100 × ${p}`, `${p}% din ${fmt(N)} = ${fmt((p * N) / 100)}`],
      dificultate: dif(nivel, 4, 1),
    };
  },
};

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export const SUBIECTE_FRACTII = [parteDinIntreg, fractieDinObiecte, compararefractii, fractieDinNumar, operatiiFractii, procente];
