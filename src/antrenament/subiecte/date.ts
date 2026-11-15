import type { Clasa } from "@/motor/tipuri";
import type { Rng } from "@/motor/rng";
import type { Mecanica, NivelJoc, Subiect } from "../tipuri";
import { dif } from "./comun";

/** Teme de date apropiate copiilor; categoriile au acordul potrivit („Câți copii preferă…”). */
const TEME = [
  { titlu: "Fructul preferat", categorii: ["mere", "pere", "banane", "căpșuni", "struguri"], cine: "copii", verb: "preferă", simbol: "🍎" },
  { titlu: "Animale din curte", categorii: ["găini", "rațe", "iepuri", "capre", "oi"], cine: "animale", verb: "sunt", simbol: "🐾" },
  { titlu: "Cărți citite", categorii: ["luni", "marți", "miercuri", "joi", "vineri"], cine: "cărți", verb: "citite", simbol: "📕" },
  { titlu: "Sportul preferat", categorii: ["fotbal", "înot", "baschet", "tenis", "dans"], cine: "copii", verb: "aleg", simbol: "⚽" },
  { titlu: "Culoarea preferată", categorii: ["roșu", "albastru", "verde", "galben", "mov"], cine: "copii", verb: "aleg", simbol: "🎨" },
];

interface SetDate { titlu: string; cat: string[]; val: number[]; tema: (typeof TEME)[number] }

function genereaza(rng: Rng, clasa: Clasa, nivel: NivelJoc, multiplu: number): SetDate {
  const tema = rng.pick(TEME);
  const k = nivel === "usor" ? 3 : nivel === "mediu" ? 4 : 5;
  const cat = rng.shuffle(tema.categorii).slice(0, k);
  const maxV = clasa === 1 ? 10 : clasa === 2 ? 20 : clasa === 3 ? 50 : 100;
  let val = rng.distinct(k, () => rng.int(1, Math.floor(maxV / multiplu)) * multiplu, String);
  // dacă intervalul e prea mic pentru k valori diferite, folosim multiplii consecutivi, amestecați
  if (val.length < k) val = rng.shuffle(Array.from({ length: k }, (_, i) => (i + 1) * multiplu));
  return { titlu: tema.titlu, cat, val, tema };
}

/** Întrebările despre un set de date: valoare, diferență, total, maxim, minim. */
function intrebare(rng: Rng, d: SetDate, nivel: NivelJoc, mecanica: Mecanica, prefix: string, citire: string) {
  const { cat, val, tema } = d;
  const i = rng.int(0, cat.length - 1);
  let j = rng.int(0, cat.length - 1);
  if (j === i) j = (i + 1) % cat.length;
  const tip = nivel === "usor" ? rng.pick([0, 0, 3, 4]) : nivel === "mediu" ? rng.int(0, 4) : rng.pick([1, 2, 2, 3]);
  const desc = (c: string) => (tema.titlu === "Cărți citite" ? `${c}` : c);
  const cheie = `${prefix}:${tip}:${i}:${j}:${cat.join(",")}:${val.join(",")}`;
  if (tip === 0) {
    return {
      cheie, fapt: `${cat[i]}=${val[i]}`,
      enunt: tema.titlu === "Cărți citite" ? `Câte cărți s-au citit ${cat[i]}?` : tema.titlu === "Animale din curte" ? `Câte ${cat[i]} sunt în curte?` : `Câți ${tema.cine} ${tema.verb} ${desc(cat[i])}?`,
      mecanica, raspuns: { tip: "numar" as const, valoare: val[i] },
      indicii: [citire, `Caută „${cat[i]}”.`, `${cat[i]}: ${val[i]}`],
    };
  }
  if (tip === 1) {
    const [a, b] = val[i] >= val[j] ? [i, j] : [j, i];
    return {
      cheie, fapt: `${cat[a]}-${cat[b]}`,
      enunt: `Cu cât sunt mai multe la „${cat[a]}” decât la „${cat[b]}”?`,
      mecanica, raspuns: { tip: "numar" as const, valoare: val[a] - val[b] },
      indicii: [citire, `${cat[a]}: ${val[a]}; ${cat[b]}: ${val[b]}.`, `${val[a]} − ${val[b]} = ${val[a] - val[b]}`],
    };
  }
  if (tip === 2) {
    const total = val.reduce((x, y) => x + y, 0);
    return {
      cheie, fapt: `total`,
      enunt: "Cât fac toate la un loc (total)?",
      mecanica, raspuns: { tip: "numar" as const, valoare: total },
      indicii: [citire, `Adună toate valorile: ${val.join(" + ")}.`, `Total: ${total}`],
    };
  }
  const max = tip === 3;
  const idx = val.indexOf(max ? Math.max(...val) : Math.min(...val));
  return {
    cheie, fapt: max ? "max" : "min",
    enunt: max ? "Care categorie are cele mai multe?" : "Care categorie are cele mai puține?",
    mecanica, raspuns: { tip: "optiune" as const, valoare: cat[idx], optiuni: rng.shuffle(cat) },
    indicii: [citire, max ? "Caută bara cea mai înaltă (sau numărul cel mai mare)." : "Caută bara cea mai joasă (sau numărul cel mai mic).", `${cat[idx]}: ${val[idx]}`],
  };
}

export const tabel: Subiect = {
  id: "date.tabel",
  titlu: "Citim tabele",
  descriere: "Află informații dintr-un tabel",
  domeniu: "date",
  clase: [1, 2, 3, 4],
  icon: "📋",
  exercitiu(rng, nivel, clasa) {
    const d = genereaza(rng, clasa, nivel, 1);
    const q = intrebare(rng, d, nivel, { tip: "tabel", titlu: d.titlu, coloane: [d.titlu.split(" ")[0], "Număr"], randuri: d.cat.map((c, i) => [c, d.val[i]]) }, "tab", "Caută rândul potrivit în tabel și citește numărul din dreapta.");
    return { ...q, dificultate: dif(nivel, clasa) };
  },
};

export const grafic: Subiect = {
  id: "date.grafic",
  titlu: "Grafice cu bare",
  descriere: "Citește graficul: cel mai mult, cel mai puțin, diferențe",
  domeniu: "date",
  clase: [2, 3, 4],
  icon: "📊",
  exercitiu(rng, nivel, clasa) {
    const pas = clasa === 2 ? 2 : clasa === 3 ? 5 : 10;
    // valorile cad pe liniile graficului (cl. II: și între linii, din 1 în 1; cl. IV: cel mult la jumătatea distanței)
    const d = genereaza(rng, clasa, nivel, nivel === "usor" ? pas : clasa === 2 ? 1 : clasa === 3 ? 5 : 5);
    const q = intrebare(rng, d, nivel, { tip: "grafic", titlu: d.titlu, bare: d.cat.map((c, i) => ({ eticheta: c, valoare: d.val[i] })), pas }, "gr", `Liniile orizontale sunt din ${pas} în ${pas}. Urmărește vârful barei până la axa din stânga.`);
    return { ...q, dificultate: dif(nivel, clasa) };
  },
};

export const pictograma: Subiect = {
  id: "date.pictograma",
  titlu: "Pictograme",
  descriere: "Un simbol poate însemna mai multe obiecte",
  domeniu: "date",
  clase: [1, 2, 3],
  icon: "🖼️",
  exercitiu(rng, nivel, clasa) {
    const unSimbol = clasa === 1 || nivel === "usor" ? 1 : rng.pick([2, 5]);
    const d = genereaza(rng, Math.min(clasa, 2) as Clasa, nivel, unSimbol);
    // valorile rămân mici: cel mult 8 simboluri pe rând
    d.val = d.val.map((v) => Math.min(v, 8 * unSimbol));
    if (new Set(d.val).size < d.val.length) d.val = rng.shuffle(d.val.map((_, i) => (i + 1) * unSimbol));
    const q = intrebare(rng, d, nivel, { tip: "grafic", titlu: d.titlu, bare: d.cat.map((c, i) => ({ eticheta: c, valoare: d.val[i] })), pas: unSimbol, pictograma: { simbol: d.tema.simbol, valoare: unSimbol } }, "pict",
      unSimbol === 1 ? "Numără simbolurile de pe rând." : `Atenție: un simbol ${d.tema.simbol} înseamnă ${unSimbol}! Numără simbolurile și înmulțește cu ${unSimbol}.`);
    return { ...q, dificultate: dif(nivel, clasa, unSimbol > 1 ? 1 : 0) };
  },
};

export const SUBIECTE_DATE = [tabel, grafic, pictograma];
