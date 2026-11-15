import type { Clasa } from "@/motor/tipuri";
import type { Rng } from "@/motor/rng";
import type { NivelJoc, Subiect } from "../tipuri";
import { genAdunare } from "@/motor/generatoare/operatii";
import { dif, fmt } from "./comun";

/** Cifrele termenilor la adunare/scădere în coloană, pe clase și niveluri. */
function cifreCalcul(clasa: Clasa, nivel: NivelJoc): number {
  const t: Record<Clasa, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
  return nivel === "usor" ? Math.max(2, t[clasa] - 1) : t[clasa];
}

/** Factorii tablei înmulțirii din programă (cl. II: 2, 3, 4, 5, 10). */
function factori(clasa: Clasa, nivel: NivelJoc): number[] {
  if (clasa <= 2) return nivel === "usor" ? [2, 5, 10] : [2, 3, 4, 5, 10];
  return nivel === "usor" ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10];
}

const SIMBOLURI = ["🍎", "⭐", "🌼", "🐞", "🍓", "🎈", "🐟", "🍪"];

export const cadru10: Subiect = {
  id: "op.cadru10",
  titlu: "Adunări și scăderi până la 20",
  descriere: "Cu cadrul de 10: completăm până la 10",
  domeniu: "operatii",
  clase: [1],
  icon: "🔟",
  exercitiu(rng, nivel) {
    const plus = rng.bool(nivel === "usor" ? 0.65 : 0.5);
    let a: number, b: number;
    if (nivel === "usor") {
      // în concentrul 0–10
      a = rng.int(1, 9);
      b = plus ? rng.int(1, 10 - a) : rng.int(1, a);
    } else {
      // cu trecere peste 10
      if (plus) { a = rng.int(5, 9); b = rng.int(11 - a, 9); }
      else { a = rng.int(11, nivel === "mediu" ? 18 : 20); b = rng.int(a - 9, 9); }
    }
    const r = plus ? a + b : a - b;
    const pana10 = 10 - a;
    if (plus && rng.bool(0.35)) {
      const tinta = nivel === "usor" ? 10 : a + b;
      const lipsa = tinta - a;
      return {
        cheie: `c10-lipsa:${a}:${tinta}`,
        fapt: `${a}+${lipsa}`,
        enunt: `${a} + ? = ${tinta}`,
        mecanica: { tip: "cadru10", a, b: lipsa, operatie: "+", lipsa: true },
        raspuns: { tip: "numar", valoare: lipsa },
        indicii: [`Câte buline mai trebuie puse ca să ajungi de la ${a} la ${tinta}?`, tinta > 10 ? `Întâi până la 10: ${10 - a}; apoi de la 10 la ${tinta}: ${tinta - 10}.` : `Numără căsuțele goale din cadru.`, `${a} + ${lipsa} = ${tinta}`],
        dificultate: dif(nivel, 1),
      };
    }
    return {
      cheie: `c10:${a}${plus ? "+" : "-"}${b}`,
      fapt: `${a}${plus ? "+" : "-"}${b}`,
      enunt: `${a} ${plus ? "+" : "−"} ${b} = ?`,
      mecanica: { tip: "cadru10", a, b, operatie: plus ? "+" : "−" },
      raspuns: { tip: "numar", valoare: r },
      indicii: plus
        ? [
            a + b > 10 ? `Completează întâi cadrul până la 10: ${a} + ${pana10} = 10.` : `Pune ${b} buline lângă cele ${a}. Numără-le pe toate.`,
            a + b > 10 ? `Din ${b} ai folosit ${pana10}; mai rămân ${b - pana10}. 10 + ${b - pana10} = ?` : `Numără mai departe de la ${a}: ${Array.from({ length: b }, (_, i) => a + i + 1).join(", ")}.`,
            `${a} + ${b} = ${r}`,
          ]
        : [
            a > 10 && b > a - 10 ? `Scoate întâi ${a - 10} ca să ajungi la 10.` : `Taie ${b} buline și numără ce rămâne.`,
            a > 10 && b > a - 10 ? `Mai ai de scos ${b - (a - 10)}: 10 − ${b - (a - 10)} = ?` : `Numără înapoi de la ${a}, de ${b} ori.`,
            `${a} − ${b} = ${r}`,
          ],
      dificultate: dif(nivel, 1),
    };
  },
};

function adunareScadere(id: string, plus: boolean): Subiect {
  return {
    id,
    titlu: plus ? "Adunarea în coloană" : "Scăderea în coloană",
    descriere: plus ? "Unități sub unități, zeci sub zeci, cu trecere peste ordin" : "Cu împrumut de la ordinul următor",
    domeniu: "operatii",
    clase: [1, 2, 3, 4],
    icon: plus ? "➕" : "➖",
    exercitiu(rng, nivel, clasa) {
      const k = cifreCalcul(clasa, nivel);
      const trecere = nivel !== "usor" && !(clasa === 1 && nivel === "mediu" && rng.bool(0.5));
      const [x, y] = genAdunare(rng, k, trecere);
      const [a, b] = plus ? [x, y] : [x + y, rng.bool() ? x : y];
      const r = plus ? a + b : a - b;
      const ua = a % 10;
      const ub = b % 10;
      const sem = plus ? "+" : "−";
      return {
        cheie: `${plus ? "add" : "sub"}:${a}${sem}${b}`,
        fapt: `${a}${sem}${b}`,
        enunt: `Calculează în coloană: ${fmt(a)} ${sem} ${fmt(b)}`,
        mecanica: { tip: "coloana", a, b, operatie: plus ? "+" : "−" },
        raspuns: { tip: "numar", valoare: r },
        indicii: plus
          ? [
              `Începe cu unitățile (coloana din dreapta): ${ua} + ${ub} = ${ua + ub}.`,
              ua + ub >= 10 ? `${ua + ub} unități = 1 zece și ${(ua + ub) % 10} unități: scrie ${(ua + ub) % 10} și „ține minte” 1 la zeci.` : "Continuă cu zecile, apoi cu sutele, de la dreapta la stânga.",
              `${fmt(a)} + ${fmt(b)} = ${fmt(r)}`,
            ]
          : [
              `Începe cu unitățile: ${ua} − ${ub}.`,
              ua < ub ? `${ua} e mai mic decât ${ub}: „împrumutăm” o zece → ${ua + 10} − ${ub} = ${ua + 10 - ub}, iar la zeci rămâne cu 1 mai puțin.` : "Continuă cu zecile, apoi cu sutele.",
              `${fmt(a)} − ${fmt(b)} = ${fmt(r)}`,
            ],
        dificultate: dif(nivel, clasa, trecere ? 1 : 0),
      };
    },
  };
}
export const adunare = adunareScadere("op.adunare", true);
export const scadere = adunareScadere("op.scadere", false);

export const termenNecunoscut: Subiect = {
  id: "op.termen",
  titlu: "Numărul care lipsește",
  descriere: "Balanța în echilibru: ce punem pe taler?",
  domeniu: "operatii",
  clase: [1, 2, 3, 4],
  icon: "❓",
  exercitiu(rng, nivel, clasa) {
    const k = cifreCalcul(clasa, nivel);
    const [a, b] = genAdunare(rng, k, nivel === "provocare");
    const s = a + b;
    const tip = nivel === "usor" ? 0 : rng.int(0, 2);
    const [stanga, dreapta, r, rez] =
      tip === 0 ? [`${fmt(a)} + ?`, fmt(s), b, `${s} − ${a} = ${b}`] :
      tip === 1 ? [`? − ${fmt(b)}`, fmt(a), s, `${a} + ${b} = ${s}`] :
                  [`${fmt(s)} − ?`, fmt(a), b, `${s} − ${a} = ${b}`];
    return {
      cheie: `termen:${tip}:${a}:${b}`,
      fapt: `${a}+${b}`,
      enunt: "Ce număr pui în locul semnului întrebării ca balanța să stea dreaptă?",
      mecanica: { tip: "balanta", stanga, dreapta, valStanga: tip === 1 ? a : tip === 0 ? s : a, valDreapta: tip === 1 ? a : tip === 0 ? s : a, necunoscut: "stanga" },
      raspuns: { tip: "numar", valoare: r },
      indicii: [
        "Balanța e dreaptă când cele două talere „cântăresc” la fel.",
        tip === 1 ? "Ce număr, dacă scazi din el, dă rezultatul? Adună înapoi." : "Folosește operația inversă: scăderea.",
        `${rez}. Proba: ${stanga.replace("?", String(r))} = ${dreapta}`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const grupeEgale: Subiect = {
  id: "op.grupe",
  titlu: "Grupe egale",
  descriere: "Adunarea repetată devine înmulțire",
  domeniu: "operatii",
  clase: [2, 3],
  icon: "🧺",
  exercitiu(rng, nivel) {
    const g = rng.int(2, nivel === "usor" ? 5 : 6);
    const c = rng.int(2, 10);
    const s = rng.pick(SIMBOLURI);
    const total = g * c;
    const forma = nivel === "usor" ? rng.int(0, 1) : rng.int(0, 2);
    if (forma === 1) {
      return {
        cheie: `grupe:scrie:${g}x${c}`,
        fapt: `${g}x${c}`,
        enunt: `Scrie ca înmulțire: ${g} grupe a câte ${c} = ${g} × ?`,
        mecanica: { tip: "grupe", grupe: g, cate: c, simbol: s },
        raspuns: { tip: "numar", valoare: c },
        indicii: ["Primul factor arată câte grupe sunt.", `Al doilea factor arată câte sunt într-o grupă.`, `${g} × ${c} = ${total}`],
        dificultate: dif(nivel, 2),
      };
    }
    if (forma === 2) {
      return {
        cheie: `grupe:inv:${g}x${c}`,
        fapt: `${g}x${c}`,
        enunt: `${Array(g).fill(c).join(" + ")} = ? × ${c}`,
        mecanica: { tip: "grupe", grupe: g, cate: c, simbol: s },
        raspuns: { tip: "numar", valoare: g },
        indicii: [`Numără de câte ori se adună ${c}.`, `Fiecare grupă are ${c}; câte grupe sunt?`, `${g} × ${c} = ${total}`],
        dificultate: dif(nivel, 2),
      };
    }
    return {
      cheie: `grupe:${g}x${c}`,
      fapt: `${g}x${c}`,
      enunt: `${g} grupe a câte ${c}. Câte sunt în total?`,
      mecanica: { tip: "grupe", grupe: g, cate: c, simbol: s },
      raspuns: { tip: "numar", valoare: total },
      indicii: [`Adună câte ${c}: ${Array(g).fill(c).join(" + ")}.`, `Numără din ${c} în ${c}: ${Array.from({ length: g }, (_, i) => c * (i + 1)).join(", ")}.`, `${g} × ${c} = ${total}`],
      dificultate: dif(nivel, 2),
    };
  },
};

export const tablaInmultirii: Subiect = {
  id: "op.tabla",
  titlu: "Tabla înmulțirii",
  descriere: "Cu rânduri de buline (matrice)",
  domeniu: "operatii",
  clase: [2, 3, 4],
  icon: "✖️",
  exercitiu(rng, nivel, clasa) {
    const f = rng.pick(factori(clasa, nivel));
    const x = rng.int(nivel === "usor" ? 1 : 0, 10);
    const [a, b] = rng.bool() ? [f, x] : [x, f];
    const p = a * b;
    const forma = nivel === "usor" ? rng.pick([0, 0, 1, 2]) : nivel === "mediu" ? rng.pick([0, 1, 1, 2]) : rng.pick([1, 2, 2]);
    if (forma === 2 && a > 0 && b > 0) {
      return {
        cheie: `mul:lipsa:${a}x?=${p}`,
        fapt: `${Math.min(a, b)}x${Math.max(a, b)}`,
        enunt: `${a} × ? = ${p}`,
        mecanica: { tip: "expresie", text: `${a} × ? = ${p}` },
        raspuns: { tip: "numar", valoare: b },
        indicii: [`Ce număr, înmulțit cu ${a}, dă ${p}?`, `Numără din ${a} în ${a} până la ${p}.`, `${a} × ${b} = ${p}`],
        dificultate: dif(nivel, clasa),
      };
    }
    const cuMatrice = forma === 0 && a > 0 && b > 0;
    return {
      cheie: `mul:${cuMatrice ? "m" : "e"}:${a}x${b}`,
      fapt: `${Math.min(a, b)}x${Math.max(a, b)}`,
      enunt: `${a} × ${b} = ?`,
      mecanica: cuMatrice ? { tip: "matrice", randuri: a, coloane: b } : { tip: "expresie", text: `${a} × ${b}` },
      raspuns: { tip: "numar", valoare: p },
      indicii: [
        a === 0 || b === 0 ? "Orice număr înmulțit cu 0 dă 0." : `Sunt ${a} rânduri a câte ${b}.`,
        a === 0 || b === 0 ? "0 grupe (sau grupe goale) nu au nimic." : `Numără din ${b} în ${b}: ${Array.from({ length: Math.min(a, 10) }, (_, i) => b * (i + 1)).join(", ")}.`,
        `${a} × ${b} = ${p}`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const comutativitate: Subiect = {
  id: "op.comutativ",
  titlu: "Ordinea factorilor",
  descriere: "Rotește matricea: 3 × 5 = 5 × 3",
  domeniu: "operatii",
  clase: [2, 3, 4],
  icon: "🔄",
  exercitiu(rng, nivel, clasa) {
    const f = factori(clasa, nivel);
    const a = rng.pick(f);
    let b = rng.int(2, 10);
    if (b === a) b = a === 10 ? 9 : a + 1;
    const asoc = nivel === "provocare" && clasa >= 3;
    if (asoc) {
      const c = rng.int(2, 5);
      return {
        cheie: `asoc:${a}x${b}x${c}`,
        fapt: `${a}x${b}x${c}`,
        enunt: `(${a} × ${b}) × ${c} = ${a} × (${b} × ?)`,
        mecanica: { tip: "expresie", text: `(${a} × ${b}) × ${c} = ${a} × (${b} × ?)` },
        raspuns: { tip: "numar", valoare: c },
        indicii: ["Putem grupa factorii cum vrem: rezultatul nu se schimbă.", "Factorii rămân aceiași, doar parantezele se mută.", `Lipsește ${c}.`],
        dificultate: dif(nivel, clasa),
      };
    }
    const sens = rng.int(0, 1);
    const cuMatrice = nivel !== "provocare" && rng.bool(0.7);
    const enunt = sens === 0 ? `${a} × ${b} = ${b} × ?` : `? × ${a} = ${a} × ${b}`;
    return {
      cheie: `comut:${sens}:${cuMatrice ? "m" : "e"}:${a}x${b}`,
      fapt: `${Math.min(a, b)}x${Math.max(a, b)}`,
      enunt,
      mecanica: cuMatrice ? { tip: "matrice", randuri: a, coloane: b, arataTotal: true } : { tip: "expresie", text: enunt },
      raspuns: { tip: "numar", valoare: sens === 0 ? a : b },
      indicii: [`Rotește matricea: ${a} rânduri a câte ${b} devin ${b} rânduri a câte ${a}.`, "Numărul de buline nu se schimbă când rotim.", `${a} × ${b} = ${b} × ${a} = ${a * b}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const ori10: Subiect = {
  id: "op.ori10",
  titlu: "Înmulțirea cu 10, 100, 1000",
  descriere: "Fiecare cifră urcă un ordin",
  domeniu: "operatii",
  clase: [3, 4],
  icon: "🔟",
  exercitiu(rng, nivel, clasa) {
    const p = nivel === "usor" ? rng.pick([10, 10, 100]) : nivel === "mediu" ? rng.pick([10, 100]) : rng.pick(clasa === 3 ? [10, 100] : [10, 100, 1000]);
    const n = rng.int(nivel === "usor" ? 2 : 11, clasa === 3 ? 99 : 999);
    const imp = nivel === "provocare" && rng.bool();
    const zero = String(p).length - 1;
    if (imp) {
      return {
        cheie: `div10:${n * p}:${p}`,
        fapt: `${n}x${p}`,
        enunt: `${fmt(n * p)} : ${p} = ?`,
        mecanica: { tip: "expresie", text: `${fmt(n * p)} : ${p}` },
        raspuns: { tip: "numar", valoare: n },
        indicii: [`Împărțirea la ${p} „taie” ${zero} ${zero === 1 ? "zero" : "zerouri"} de la sfârșit.`, `Fiecare cifră coboară ${zero} ${zero === 1 ? "ordin" : "ordine"}.`, `${fmt(n * p)} : ${p} = ${n}`],
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `x10:${n}:${p}`,
      fapt: `${n}x${p}`,
      enunt: `${n} × ${p} = ?`,
      mecanica: { tip: "expresie", text: `${n} × ${p}` },
      raspuns: { tip: "numar", valoare: n * p },
      indicii: [`Înmulțirea cu ${p} adaugă ${zero} ${zero === 1 ? "zero" : "zerouri"} la sfârșit.`, `Unitățile devin ${p === 10 ? "zeci" : p === 100 ? "sute" : "mii"}.`, `${n} × ${p} = ${fmt(n * p)}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const inmultireScrisa: Subiect = {
  id: "op.inmultire",
  titlu: "Înmulțirea în coloană",
  descriere: "Număr de mai multe cifre × o cifră",
  domeniu: "operatii",
  clase: [3, 4],
  icon: "🧮",
  exercitiu(rng, nivel, clasa) {
    const a = nivel === "usor" ? rng.int(11, 49) : nivel === "mediu" ? rng.int(12, clasa === 3 ? 99 : 999) : rng.int(100, clasa === 3 ? 999 : 9999);
    const b = rng.int(2, nivel === "usor" ? 4 : 9);
    const z = Math.floor(a / 10) * 10;
    const u = a % 10;
    return {
      cheie: `mulc:${a}x${b}`,
      fapt: `${a}x${b}`,
      enunt: `Calculează: ${fmt(a)} × ${b}`,
      mecanica: { tip: "coloana", a, b, operatie: "×" },
      raspuns: { tip: "numar", valoare: a * b },
      indicii: [
        `Începe cu unitățile: ${u} × ${b} = ${u * b}.`,
        `Desparte: ${fmt(a)} = ${fmt(z)} + ${u} → ${fmt(z)} × ${b} = ${fmt(z * b)}, ${u} × ${b} = ${u * b}.`,
        `${fmt(z * b)} + ${u * b} = ${fmt(a * b)}`,
      ],
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

export const farfurii: Subiect = {
  id: "op.farfurii",
  titlu: "Împărțim în mod egal",
  descriere: "Pune pe rând câte una în fiecare farfurie",
  domeniu: "operatii",
  clase: [2, 3],
  icon: "🍽️",
  exercitiu(rng, nivel) {
    const f = rng.int(2, nivel === "usor" ? 5 : 8);
    const c = rng.int(2, nivel === "usor" ? 8 : 10);
    const s = rng.pick(SIMBOLURI);
    if (nivel !== "usor" && rng.bool(0.4)) {
      return {
        cheie: `farf-cota:${f * c}:${c}`,
        fapt: `${f}x${c}`,
        enunt: `Avem ${f * c} ${s}. Punem câte ${c} pe fiecare farfurie. De câte farfurii avem nevoie?`,
        mecanica: { tip: "grupe", grupe: f, cate: c, simbol: s },
        raspuns: { tip: "numar", valoare: f },
        indicii: [`Fă grupe de câte ${c}.`, `Câte grupe de ${c} încap în ${f * c}? Numără din ${c} în ${c}.`, `${f * c} : ${c} = ${f}`],
        dificultate: dif(nivel, 2),
      };
    }
    return {
      cheie: `farf:${f * c}:${f}`,
      fapt: `${f}x${c}`,
      enunt: `Împarte ${f * c} ${s} în mod egal în ${f} farfurii. Câte sunt în fiecare?`,
      mecanica: { tip: "farfurii", total: f * c, farfurii: f, simbol: s },
      raspuns: { tip: "numar", valoare: c },
      indicii: [`Apasă „Împarte” ca să pui câte una în fiecare farfurie, pe rând.`, `Continuă până nu mai rămâne nimic. Apoi numără într-o singură farfurie.`, `${f * c} : ${f} = ${c}`],
      dificultate: dif(nivel, 2),
    };
  },
};

export const impartire: Subiect = {
  id: "op.impartire",
  titlu: "Tabla împărțirii",
  descriere: "Gândim cu înmulțirea: familia de fapte",
  domeniu: "operatii",
  clase: [2, 3, 4],
  icon: "➗",
  exercitiu(rng, nivel, clasa) {
    const i = rng.pick(factori(clasa, nivel));
    const c = rng.int(1, 10);
    const d = i * c;
    const forma = nivel === "usor" ? rng.pick([0, 1, 4]) : nivel === "mediu" ? rng.pick([0, 1, 2, 4]) : rng.int(1, 4);
    if (forma === 4) {
      return {
        cheie: `div:fam:${d}:${i}`,
        fapt: `${Math.min(i, c)}x${Math.max(i, c)}`,
        enunt: `Știm că ${i} × ${c} = ${d}. Atunci ${d} : ${i} = ?`,
        mecanica: { tip: "expresie", text: `${i} × ${c} = ${d}` },
        raspuns: { tip: "numar", valoare: c },
        indicii: ["Împărțirea „desface” înmulțirea.", `Din ${i} × ${c} = ${d} rezultă ${d} : ${i} = ${c} și ${d} : ${c} = ${i}.`, `${d} : ${i} = ${c}`],
        dificultate: dif(nivel, clasa),
      };
    }
    // 0: matrice; 1: simplu; 2: împărțitor lipsă; 3: deîmpărțit lipsă
    const [enunt, r, cheieForma] =
      forma === 2 ? [`${d} : ? = ${c}`, i, "imp"] :
      forma === 3 ? [`? : ${i} = ${c}`, d, "dei"] :
      [`${d} : ${i} = ?`, c, forma === 0 ? "mat" : "s"];
    return {
      cheie: `div:${cheieForma}:${d}:${i}`,
      fapt: `${Math.min(i, c)}x${Math.max(i, c)}`,
      enunt,
      mecanica: forma === 0 ? { tip: "matrice", randuri: i, coloane: c } : { tip: "expresie", text: enunt },
      raspuns: { tip: "numar", valoare: r },
      indicii: [
        forma === 0 ? `${d} buline în ${i} rânduri egale: câte sunt pe un rând?` : `Gândește-te la înmulțire: ${i} × ? = ${d}.`,
        `Familia de fapte: ${i} × ${c} = ${d}, ${c} × ${i} = ${d}, ${d} : ${i} = ${c}, ${d} : ${c} = ${i}.`,
        enunt.replace("?", String(r)),
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const impartireRest: Subiect = {
  id: "op.rest",
  titlu: "Împărțirea cu rest",
  descriere: "Ce rămâne când nu mai ajunge pentru toți",
  domeniu: "operatii",
  clase: [3, 4],
  icon: "🍪",
  exercitiu(rng, nivel, clasa) {
    const f = rng.int(2, nivel === "usor" ? 5 : 9);
    const c = rng.int(1, nivel === "provocare" ? (clasa === 3 ? 12 : 99) : 12);
    const r = rng.int(1, f - 1);
    const total = f * c + r;
    return {
      cheie: `rest:${total}:${f}`,
      fapt: `${total}:${f}`,
      enunt: `${total} : ${f} = ? rest ?`,
      mecanica: nivel === "usor" ? { tip: "farfurii", total, farfurii: f, simbol: rng.pick(SIMBOLURI) } : { tip: "expresie", text: `${total} : ${f}` },
      raspuns: { tip: "campuri", valori: [c, r], etichete: ["câtul", "restul"] },
      indicii: [
        `Cel mai mare număr din tabla lui ${f} care încape în ${total} este ${f * c}.`,
        `${f * c} : ${f} = ${c}; rămân ${total} − ${f * c} = ${r}. Restul trebuie să fie mai mic decât ${f}.`,
        `${total} : ${f} = ${c} rest ${r} (proba: ${c} × ${f} + ${r} = ${total})`,
      ],
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

export const ordineaOperatiilor: Subiect = {
  id: "op.ordine",
  titlu: "Ordinea operațiilor",
  descriere: "Întâi parantezele, apoi × și :, apoi + și −",
  domeniu: "operatii",
  clase: [2, 3, 4],
  icon: "🪜",
  exercitiu(rng: Rng, nivel, clasa) {
    const t = () => rng.int(2, clasa === 2 ? 5 : 9);
    const a = rng.int(10, nivel === "usor" ? 40 : 90);
    const [b, c, d] = [t(), t(), t()];
    const forme = [
      { e: `${a} + ${b} × ${c}`, v: a + b * c, p: [`${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`] },
      { e: `${a} − ${b} × ${c}`, v: a - b * c, p: [`${b} × ${c} = ${b * c}`, `${a} − ${b * c} = ${a - b * c}`] },
      { e: `(${b} + ${c}) × ${d}`, v: (b + c) * d, p: [`${b} + ${c} = ${b + c}`, `${b + c} × ${d} = ${(b + c) * d}`] },
      { e: `${b} × ${c} + ${c * d} : ${c}`, v: b * c + d, p: [`${b} × ${c} = ${b * c}`, `${c * d} : ${c} = ${d}`, `${b * c} + ${d} = ${b * c + d}`] },
      { e: `${a} − (${b} + ${c}) × ${d}`, v: a - (b + c) * d, p: [`${b} + ${c} = ${b + c}`, `${b + c} × ${d} = ${(b + c) * d}`, `${a} − ${(b + c) * d} = ${a - (b + c) * d}`] },
    ].filter((f) => f.v >= 0);
    const disponibile = nivel === "usor" ? forme.slice(0, 2) : nivel === "mediu" ? forme.slice(0, 4) : forme;
    const f = rng.pick(disponibile.length ? disponibile : forme.slice(2, 3));
    return {
      cheie: `ordop:${f.e}`,
      fapt: f.e,
      enunt: `${f.e} = ?`,
      mecanica: { tip: "expresie", text: f.e },
      raspuns: { tip: "numar", valoare: f.v },
      indicii: ["Întâi parantezele, apoi înmulțirile și împărțirile, la final adunările și scăderile.", `Primul pas: ${f.p[0]}.`, f.p.join(" → ")],
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

export const SUBIECTE_OPERATII = [cadru10, adunare, scadere, termenNecunoscut, grupeEgale, tablaInmultirii, comutativitate, ori10, inmultireScrisa, farfurii, impartire, impartireRest, ordineaOperatiilor];
