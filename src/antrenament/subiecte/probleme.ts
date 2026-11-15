import type { Clasa } from "@/motor/tipuri";
import type { Rng } from "@/motor/rng";
import type { Mecanica, NivelJoc, Subiect } from "../tipuri";
import { cuSubstantiv } from "@/motor/limba";
import { adevaratFals as genAF, competitie as genComp } from "@/motor/generatoare/probleme";
import { dif } from "./comun";

const OBIECTE = [
  { sg: "măr", pl: "mere", cate: "Câte" },
  { sg: "creion", pl: "creioane", cate: "Câte" },
  { sg: "timbru", pl: "timbre", cate: "Câte" },
  { sg: "carte", pl: "cărți", cate: "Câte" },
  { sg: "bilă", pl: "bile", cate: "Câte" },
  { sg: "nucă", pl: "nuci", cate: "Câte" },
  { sg: "abțibild", pl: "abțibilduri", cate: "Câte" },
  { sg: "pește", pl: "pești", cate: "Câți" },
  { sg: "fluturaș", pl: "fluturași", cate: "Câți" },
  { sg: "ghiozdan", pl: "ghiozdane", cate: "Câte" },
] as const;
const NUME = ["Ana", "Mihai", "Ioana", "Radu", "Maria", "Andrei", "Elena", "Tudor", "Sofia", "Luca", "Daria", "Matei", "Irina", "Vlad"];

function limite(clasa: Clasa, nivel: NivelJoc): [number, number] {
  const t: Record<Clasa, [number, number]> = { 1: [2, 20], 2: [10, 100], 3: [50, 1000], 4: [100, 10000], 5: [100, 10000] };
  const [a, b] = t[clasa];
  return nivel === "usor" ? [a, Math.max(a + 5, Math.floor(b / 2))] : [a, b];
}

interface PB { enunt: string; r: number; bara: Mecanica; pasi: string[]; raspuns: string; cheie: string }

function oOperatie(rng: Rng, clasa: Clasa, nivel: NivelJoc): PB {
  const [lo, hi] = limite(clasa, nivel);
  const o = rng.pick(OBIECTE);
  const [A, B] = rng.shuffle(NUME);
  const s = (n: number) => cuSubstantiv(n, o.sg, o.pl);
  const tipuri = clasa === 1 ? ["+", "-", "cmp+", "cmp-"] : ["+", "-", "cmp+", "cmp-", "x", ":"];
  const tip = rng.pick(tipuri);
  const a = rng.int(lo, hi);
  const b = rng.int(lo, Math.max(lo, Math.min(hi, tip === "-" ? a - 1 : hi)));
  switch (tip) {
    case "+":
      return {
        cheie: `pb+:${A}:${o.pl}:${a}:${b}`, r: a + b,
        enunt: `${A} are ${s(a)}. Mai primește ${s(b)}. ${o.cate} ${o.pl} are acum?`,
        bara: { tip: "bara", parti: [{ eticheta: "avea", valoare: a }, { eticheta: "primește", valoare: b, culoare: "#f9c50f" }], total: null },
        pasi: [`Cele două părți se pun la un loc: întregul se află prin adunare.`, `${a} + ${b} = ${a + b}`], raspuns: `${A} are acum ${s(a + b)}.`,
      };
    case "-": {
      const x = Math.max(a, b + 1);
      return {
        cheie: `pb-:${A}:${o.pl}:${x}:${b}`, r: x - b,
        enunt: `${A} avea ${s(x)}. I-a dat lui ${B} ${s(b)}. ${o.cate} ${o.pl} i-au rămas?`,
        bara: { tip: "bara", parti: [{ eticheta: "a dat", valoare: b, culoare: "#e07a1f" }, { eticheta: "rămân", valoare: null }], total: x },
        pasi: [`Știm întregul (${x}) și o parte (${b}); partea care lipsește se află prin scădere.`, `${x} − ${b} = ${x - b}`], raspuns: `I-au rămas ${s(x - b)}.`,
      };
    }
    case "cmp+":
    case "cmp-": {
      const plus = tip === "cmp+";
      const d = rng.int(1, Math.max(2, Math.floor(hi / 3)));
      const baza = plus ? a : a + d;
      const r = plus ? baza + d : baza - d;
      return {
        cheie: `pbc:${plus}:${A}:${B}:${o.pl}:${baza}:${d}`, r,
        enunt: `${A} are ${s(baza)}. ${B} are cu ${d} ${plus ? "mai multe" : "mai puține"}. ${o.cate} ${o.pl} are ${B}?`,
        bara: { tip: "bara", comparatie: true, parti: [{ eticheta: A, valoare: baza }, { eticheta: B, valoare: null }, { eticheta: `cu ${d} ${plus ? "mai mult" : "mai puțin"}`, valoare: d, culoare: plus ? "#2e9e5b" : "#e07a1f" }], total: null },
        pasi: [`„Cu ${d} mai ${plus ? "mult" : "puțin"}” → ${plus ? "adunăm" : "scădem"} ${d}.`, `${baza} ${plus ? "+" : "−"} ${d} = ${r}`], raspuns: `${B} are ${s(r)}.`,
      };
    }
    case "x": {
      const g = rng.int(2, clasa === 2 ? 5 : 9);
      const k = rng.int(2, clasa === 2 ? 10 : 12);
      return {
        cheie: `pbx:${o.pl}:${g}:${k}`, r: g * k,
        enunt: `Sunt ${g} cutii. În fiecare cutie sunt ${s(k)}. ${o.cate} ${o.pl} sunt în total?`,
        bara: { tip: "bara", parti: Array.from({ length: g }, () => ({ eticheta: "", valoare: k })), total: null },
        pasi: [`${g} părți egale a câte ${k} → înmulțire.`, `${g} × ${k} = ${g * k}`], raspuns: `Sunt ${s(g * k)} în total.`,
      };
    }
    default: {
      const g = rng.int(2, clasa === 2 ? 5 : 9);
      const k = rng.int(2, 10);
      return {
        cheie: `pb:${o.pl}:${g}:${k}`, r: k,
        enunt: `${A} împarte în mod egal ${s(g * k)} la ${g} prieteni. ${o.cate} ${o.pl} primește fiecare?`,
        bara: { tip: "bara", parti: Array.from({ length: g }, () => ({ eticheta: "", valoare: null })), total: g * k },
        pasi: [`Întregul ${g * k} se împarte în ${g} părți egale → împărțire.`, `${g * k} : ${g} = ${k}`], raspuns: `Fiecare primește ${s(k)}.`,
      };
    }
  }
}

function douaOperatii(rng: Rng, clasa: Clasa, nivel: NivelJoc): PB {
  const [lo, hi] = limite(clasa, nivel);
  const o = rng.pick(OBIECTE);
  const [A, B] = rng.shuffle(NUME);
  const s = (n: number) => cuSubstantiv(n, o.sg, o.pl);
  if (rng.bool()) {
    const a = rng.int(lo, hi);
    const d = rng.int(1, Math.max(2, Math.floor(hi / 3)));
    return {
      cheie: `pb2a:${A}:${B}:${o.pl}:${a}:${d}`, r: 2 * a + d,
      enunt: `${A} are ${s(a)}, iar ${B} are cu ${d} mai multe. ${o.cate} ${o.pl} au împreună?`,
      bara: { tip: "bara", comparatie: true, parti: [{ eticheta: A, valoare: a }, { eticheta: B, valoare: null }, { eticheta: `cu ${d} mai mult`, valoare: d, culoare: "#2e9e5b" }], total: null },
      pasi: [`Pasul 1 – ${o.cate} ${o.pl} are ${B}? ${a} + ${d} = ${a + d}`, `Pasul 2 – Împreună: ${a} + ${a + d} = ${2 * a + d}`], raspuns: `Împreună au ${s(2 * a + d)}.`,
    };
  }
  const a = rng.int(lo, hi);
  const b = rng.int(lo, hi);
  const c = rng.int(1, a + b - 1);
  return {
    cheie: `pb2b:${A}:${B}:${o.pl}:${a}:${b}:${c}`, r: a + b - c,
    enunt: `${A} avea ${s(a)}. A mai primit ${s(b)}, apoi i-a dat lui ${B} ${s(c)}. ${o.cate} ${o.pl} are acum?`,
    bara: { tip: "bara", parti: [{ eticheta: "avea", valoare: a }, { eticheta: "a primit", valoare: b, culoare: "#f9c50f" }], total: null },
    pasi: [`Pasul 1 – După ce a primit: ${a} + ${b} = ${a + b}`, `Pasul 2 – După ce a dat: ${a + b} − ${c} = ${a + b - c}`], raspuns: `${A} are acum ${s(a + b - c)}.`,
  };
}

export const problemaUna: Subiect = {
  id: "pb.una",
  titlu: "Probleme cu o operație",
  descriere: "Desenăm problema cu bare: parte și întreg",
  domeniu: "probleme",
  clase: [1, 2, 3, 4],
  icon: "📊",
  exercitiu(rng, nivel, clasa) {
    const p = oOperatie(rng, clasa, nivel);
    return {
      cheie: p.cheie, fapt: p.cheie, enunt: p.enunt,
      mecanica: nivel === "provocare" ? { tip: "expresie", text: "" } : p.bara,
      raspuns: { tip: "numar", valoare: p.r },
      indicii: [`Ce știu? Ce caut? Uită-te la desen: ce parte lipsește?`, p.pasi[0], `${p.pasi[1]}. ${p.raspuns}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const problemaDoua: Subiect = {
  id: "pb.doua",
  titlu: "Probleme cu două operații",
  descriere: "Pas cu pas: întrebarea ajutătoare",
  domeniu: "probleme",
  clase: [2, 3, 4, 5],
  icon: "🪜",
  exercitiu(rng, nivel, clasa) {
    const p = douaOperatii(rng, clasa, nivel);
    return {
      cheie: p.cheie, fapt: p.cheie, enunt: p.enunt,
      mecanica: nivel === "provocare" ? { tip: "expresie", text: "" } : p.bara,
      raspuns: { tip: "numar", valoare: p.r },
      indicii: ["Problema are doi pași. Care este întrebarea ajutătoare?", p.pasi[0], `${p.pasi[1]}. ${p.raspuns}`],
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

export const adevaratFals: Subiect = {
  id: "pb.af",
  titlu: "Adevărat sau fals?",
  descriere: "Verifică răspunsul propus",
  domeniu: "probleme",
  clase: [1, 2, 3, 4],
  icon: "✅",
  exercitiu(rng, nivel, clasa) {
    const nivelFisa = nivel === "usor" ? "consolidare" : "aprofundare";
    const item = genAF.generate(rng, nivelFisa, clasa);
    const c = item.cerinte[0];
    return {
      cheie: `af:${c.text}`, fapt: c.text, enunt: c.text,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "optiune", valoare: c.raspuns === "A" ? "Adevărat" : "Fals", optiuni: ["Adevărat", "Fals"] },
      indicii: ["Rezolvă tu problema, apoi compară cu răspunsul propus.", "Ce operație cere problema?", item.rezolvare[0].replace(/^[AF] — /, "")],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const logica: Subiect = {
  id: "pb.logica",
  titlu: "Probleme de logică",
  descriere: "Probleme de perspicacitate, tip concurs",
  domeniu: "probleme",
  clase: [2, 3, 4, 5],
  icon: "🧠",
  exercitiu(rng, nivel, clasa) {
    const item = genComp.generate(rng, "competitie", clasa);
    return {
      cheie: `logica:${item.enunt}`, fapt: item.enunt, enunt: item.enunt,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: Number(item.cerinte[0].raspuns) },
      indicii: [item.rezolvare[0], item.rezolvare.slice(0, 2).join(" "), item.rezolvare.join(" ")],
      dificultate: dif(nivel, clasa, 2),
    };
  },
};

export const SUBIECTE_PROBLEME = [problemaUna, problemaDoua, adevaratFals, logica];
