import type { Subiect } from "../tipuri";
import { numarInLitere } from "@/motor/limba";
import { roman } from "@/motor/generatoare/fractii-masuri";
import { cifre, dif, fmt, interval, nr, ORDINE, ORDINE_SG } from "./comun";

const caSuma = (n: number) =>
  cifre(n).map((d, i, a) => d * 10 ** (a.length - 1 - i)).filter((x) => x > 0);

export const formare: Subiect = {
  id: "num.formare",
  titlu: "Formăm numere",
  descriere: "Construiește numărul din sute, zeci și unități",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "🧱",
  exercitiu(rng, nivel, clasa) {
    if (clasa === 4) {
      // numere mari: valoarea cifrei după poziție
      const n = nr(rng, interval(4, nivel));
      const c = cifre(n);
      const i = rng.int(0, c.length - 1);
      const ordin = c.length - 1 - i;
      const val = c[i] * 10 ** ordin;
      return {
        cheie: `valpoz:${n}:${i}`,
        fapt: `${n}`,
        enunt: `Ce valoare are cifra ${c[i]} (a ${ORDINE[ordin]}) în numărul ${fmt(n)}?`,
        mecanica: { tip: "expresie", text: fmt(n) },
        raspuns: { tip: "numar", valoare: val },
        indicii: [
          `Numără pozițiile de la dreapta: unități, zeci, sute, mii…`,
          `Cifra ${c[i]} stă la ordinul ${ORDINE[ordin]}.`,
          `${c[i]} ${ORDINE[ordin]} = ${fmt(val)}`,
        ],
        dificultate: dif(nivel, clasa),
      };
    }
    const [lo, hi] = clasa === 3 ? [1000, 10000] : interval(clasa, nivel);
    const n = Math.max(lo, nr(rng, [lo, hi]));
    // nivelul decide reprezentarea preferată; celelalte apar mai rar (variație fără să schimbăm matematica)
    const pref = nivel === "usor" ? "cifre" : nivel === "mediu" ? "litere" : "suma";
    const arata = rng.bool(0.6) ? pref : rng.pick(["cifre", "litere", "suma"] as const);
    const peNumaratoare = n < 1000 && rng.bool(0.4);
    const text = arata === "cifre" ? String(n) : arata === "litere" ? numarInLitere(n) : rng.shuffle(caSuma(n).map(String)).join(" + ");
    const c = cifre(n).reverse();
    const parti = c.map((d, i) => (d ? `${d} ${d === 1 ? ORDINE_SG[i] : ORDINE[i]}` : "")).filter(Boolean).reverse();
    return {
      cheie: `formare:${arata}:${peNumaratoare ? "n" : "b"}:${n}`,
      fapt: String(n),
      enunt: arata === "suma" ? "Construiește numărul din bucăți:" : peNumaratoare ? "Formează numărul pe numărătoare:" : "Construiește numărul:",
      mecanica: peNumaratoare ? { tip: "numaratoare", tinta: n, text, construieste: true } : { tip: "blocuri", tinta: n, arata, text },
      raspuns: { tip: "construit", valoare: n },
      indicii: [
        "Începe cu ordinul cel mai mare: câte sute (sau mii) are numărul?",
        `Numărul ${n} are: ${parti.join(", ")}.`,
        `Pune ${parti.join(", ")} și apasă „Verifică”.`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const litere: Subiect = {
  id: "num.litere",
  titlu: "Numere scrise cu litere",
  descriere: "Potrivește numărul cu scrierea lui în cuvinte",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "🔤",
  exercitiu(rng, nivel, clasa) {
    const n = nr(rng, interval(clasa, nivel));
    const corect = numarInLitere(n);
    const directie = nivel === "provocare" ? (rng.bool(0.7) ? 1 : rng.pick([0, 2])) : rng.pick([0, 0, 1, 2]);
    if (directie === 2) {
      // alege numărul (cu cifre) potrivit scrierii cu litere
      const variante = rng.distinct(4, () => (rng.bool(0.5) ? Number(String(n).split("").reverse().join("")) || n + 1 : n + rng.pick([-10, -1, 1, 10, 100])), String)
        .filter((x) => x !== n && x >= 0).slice(0, 3);
      for (let k = 2; variante.length < 3; k++) if (!variante.includes(n + k)) variante.push(n + k);
      return {
        cheie: `litere-alege:${n}`,
        fapt: String(n),
        enunt: `Care număr se citește „${corect}”?`,
        mecanica: { tip: "expresie", text: corect },
        raspuns: { tip: "optiune", valoare: fmt(n), optiuni: rng.shuffle([n, ...variante]).map(fmt) },
        indicii: ["Desparte cuvintele: sute, zeci, unități.", `Desparte: ${caSuma(n).map((x) => numarInLitere(x)).join(" + ")}`, `Numărul este ${fmt(n)}.`],
        dificultate: dif(nivel, clasa),
      };
    }
    if (directie === 1) {
      return {
        cheie: `litere-inv:${n}`,
        fapt: String(n),
        enunt: `Scrie cu cifre: „${corect}”`,
        mecanica: { tip: "expresie", text: corect },
        raspuns: { tip: "numar", valoare: n },
        indicii: ["Caută întâi cuvântul „mii” sau „sute”.", `Desparte: ${caSuma(n).map((x) => numarInLitere(x)).join(" + ")}`, `Numărul este ${n}.`],
        dificultate: dif(nivel, clasa),
      };
    }
    const c = cifre(n);
    const distr = new Set<string>();
    for (let i = 0; i < c.length && distr.size < 3; i++)
      for (let j = i + 1; j < c.length && distr.size < 3; j++) {
        const d = [...c];
        [d[i], d[j]] = [d[j], d[i]];
        const y = Number(d.join(""));
        if (y !== n) distr.add(numarInLitere(y));
      }
    for (let k = 1; distr.size < 3; k++) distr.add(numarInLitere(n + k * 10 < 999999 ? n + k * 10 : n - k));
    return {
      cheie: `litere:${n}`,
      fapt: String(n),
      enunt: `Cum se scrie cu litere numărul ${fmt(n)}?`,
      mecanica: { tip: "expresie", text: fmt(n) },
      raspuns: { tip: "optiune", valoare: corect, optiuni: rng.shuffle([corect, ...distr]) },
      indicii: ["Citește numărul cu voce tare, de la stânga la dreapta.", "Atenție la ordinea cifrelor: sutele, apoi zecile, apoi unitățile.", `Se scrie: ${corect}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const descompunere: Subiect = {
  id: "num.descompunere",
  titlu: "Descompunem numere",
  descriere: "Câte sute, zeci și unități are numărul?",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "🧩",
  exercitiu(rng, nivel, clasa) {
    let n = nr(rng, interval(clasa, nivel));
    if (n < 10) n += 10;
    if (nivel === "provocare") {
      // zerouri în interior: 4 056
      const c = cifre(n);
      if (c.length > 2) c[rng.int(1, c.length - 2)] = 0;
      n = Number(c.join(""));
    }
    const forma = rng.int(0, 2);
    if (forma > 0 && n < 100000) {
      const parti = caSuma(n);
      if (forma === 1) {
        const desc = cifre(n).map((d, i, a) => (d ? `${d} ${d === 1 ? ORDINE_SG[a.length - 1 - i] : ORDINE[a.length - 1 - i]}` : "")).filter(Boolean);
        return {
          cheie: `compun:${n}`, fapt: String(n),
          enunt: `Ce număr are ${desc.join(", ")}?`,
          mecanica: n < 1000 ? { tip: "numaratoare", tinta: n, text: "?" , ascuns: true } : { tip: "expresie", text: desc.join(" + ") },
          raspuns: { tip: "numar", valoare: n },
          indicii: ["Scrie cifrele în ordine: întâi ordinul cel mai mare.", "Dacă un ordin lipsește, scrie 0 în locul lui.", `${desc.join(", ")} = ${fmt(n)}`],
          dificultate: dif(nivel, clasa),
        };
      }
      const i = rng.int(0, parti.length - 1);
      const arata = parti.map((x, j) => (j === i ? "?" : fmt(x))).join(" + ");
      return {
        cheie: `lipsa:${n}:${i}`, fapt: String(n),
        enunt: `${fmt(n)} = ${arata}`,
        mecanica: n < 1000 ? { tip: "numaratoare", tinta: n, text: fmt(n) } : { tip: "expresie", text: `${fmt(n)} = ${arata}` },
        raspuns: { tip: "numar", valoare: parti[i] },
        indicii: ["Fiecare termen arată valoarea unei cifre.", `Ce valoare are cifra care lipsește din sumă?`, `${fmt(n)} = ${parti.map(fmt).join(" + ")}`],
        dificultate: dif(nivel, clasa),
      };
    }
    const c = cifre(n);
    const k = Math.min(c.length, 4);
    const etichete = ORDINE.slice(0, k).reverse();
    // pentru numerele foarte mari cerem doar ultimele 4 ordine, restul e dat
    const valori = c.slice(-k);
    return {
      cheie: `descomp:${n}`,
      fapt: String(n),
      enunt: c.length > 4 ? `Numărul ${fmt(n)}: câte mii, sute, zeci și unități are (după cifre)?` : `Numărul ${fmt(n)} are:`,
      mecanica: c.length <= 3 ? { tip: "numaratoare", tinta: n, text: fmt(n) } : { tip: "expresie", text: fmt(n) },
      raspuns: { tip: "campuri", valori, etichete },
      indicii: [
        "Cifra din dreapta arată unitățile; mergi spre stânga: zeci, sute, mii.",
        `Cifrele, de la stânga: ${valori.join(", ")}.`,
        etichete.map((e, i) => `${valori[i]} ${e}`).join(", "),
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const vecini: Subiect = {
  id: "num.vecini",
  titlu: "Vecinii numerelor",
  descriere: "Predecesorul și succesorul, pe axa numerelor",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "🏘️",
  exercitiu(rng, nivel, clasa) {
    let n = nr(rng, interval(clasa, nivel));
    if (nivel === "provocare") {
      const p = rng.pick([10, 100, 1000].filter((x) => x < interval(clasa, nivel)[1]));
      n = Math.max(p, Math.round(n / p) * p) - (rng.bool() ? 0 : 1);
    }
    n = Math.max(1, n);
    const forma = rng.int(0, 3);
    if (forma > 0) {
      const [enunt, r, k] =
        forma === 1 ? [`Care este predecesorul lui ${fmt(n)}?`, n - 1, "pred"] :
        forma === 2 ? [`Care este succesorul lui ${fmt(n)}?`, n + 1, "succ"] :
                      [`Ce număr se află între ${fmt(n - 1)} și ${fmt(n + 1)}?`, n, "intre"];
      return {
        cheie: `vecini-${k}:${n}`, fapt: String(n), enunt,
        mecanica: nivel !== "provocare" ? { tip: "axa", de: n - 3, pana: n + 3, pas: 1, marcaj: forma === 3 ? undefined : n } : { tip: "expresie", text: enunt },
        raspuns: { tip: "numar", valoare: r },
        indicii: ["Predecesorul vine imediat înainte (−1); succesorul imediat după (+1).", forma === 3 ? `Numără: ${fmt(n - 1)}, …, ${fmt(n + 1)}.` : `Mergi un pas pe axă ${forma === 1 ? "la stânga" : "la dreapta"}.`, `${fmt(n - 1)} < ${fmt(n)} < ${fmt(n + 1)}`],
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `vecini:${n}`,
      fapt: String(n),
      enunt: `Care sunt vecinii numărului ${fmt(n)}?`,
      mecanica: nivel === "usor" ? { tip: "axa", de: n - 3, pana: n + 3, pas: 1, marcaj: n } : { tip: "expresie", text: `… ${fmt(n)} …` },
      raspuns: { tip: "campuri", valori: [n - 1, n + 1], etichete: ["predecesorul", "succesorul"] },
      indicii: ["Predecesorul este numărul dinainte (cu 1 mai mic).", `Succesorul este numărul de după (cu 1 mai mare).`, `${fmt(n - 1)} < ${fmt(n)} < ${fmt(n + 1)}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const comparare: Subiect = {
  id: "num.comparare",
  titlu: "Comparăm numere",
  descriere: "Balanța: <, > sau =",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "⚖️",
  exercitiu(rng, nivel, clasa) {
    const I = interval(clasa, nivel);
    const a = nr(rng, I);
    let b = rng.bool(0.15) ? a : nr(rng, I);
    let sa = fmt(a);
    let sb = fmt(b);
    if (nivel === "mediu" && a !== b && a >= 10) {
      // capcană: cifre inversate (558 / 585)
      const c = cifre(a);
      const i = rng.int(0, c.length - 2);
      [c[i], c[i + 1]] = [c[i + 1], c[i]];
      if (c[0] !== 0) b = Number(c.join(""));
      sb = fmt(b);
    }
    if (nivel === "provocare") {
      // expresii de comparat: 34 + 5 ? 40
      const x = rng.int(1, Math.max(2, Math.floor(a / 3)));
      sa = `${fmt(a - x)} + ${fmt(x)}`;
      b = a + rng.pick([-1, 0, 1]) * rng.int(0, 2);
      sb = fmt(b);
    }
    const semn = a < b ? "<" : a > b ? ">" : "=";
    return {
      cheie: `comp:${sa}?${sb}`,
      fapt: `${a}?${b}`,
      enunt: "Ce semn pui între cele două talere?",
      mecanica: { tip: "balanta", stanga: sa, dreapta: sb, valStanga: a, valDreapta: b },
      raspuns: { tip: "optiune", valoare: semn, optiuni: ["<", "=", ">"] },
      indicii: [
        "Numărul cu mai multe cifre e mai mare. Dacă au la fel, compară cifrele de la stânga.",
        nivel === "provocare" ? `Calculează întâi: ${sa} = ${fmt(a)}.` : `Compară cifra cea mai din stânga: ${String(a)[0]} și ${String(b)[0]}.`,
        `${fmt(a)} ${semn} ${fmt(b)}: talerul mai greu coboară.`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const ordonare: Subiect = {
  id: "num.ordonare",
  titlu: "Ordonăm numere",
  descriere: "Atinge numerele în ordine",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "📶",
  exercitiu(rng, nivel, clasa) {
    const k = nivel === "usor" ? 4 : nivel === "mediu" ? 5 : 6;
    const I = interval(clasa, nivel);
    const baza = nr(rng, I);
    const numere = rng.distinct(k, () =>
      nivel === "provocare" ? Math.min(I[1] - 1, Math.max(I[0], baza + rng.int(-30, 30))) : nr(rng, I),
    );
    const crescator = nivel === "usor" ? true : rng.bool();
    const sortat = [...numere].sort((a, b) => (crescator ? a - b : b - a));
    return {
      cheie: `ord:${crescator ? "c" : "d"}:${[...numere].sort((a, b) => a - b).join(",")}`,
      fapt: sortat.join(","),
      enunt: `Atinge numerele în ordine ${crescator ? "crescătoare (de la cel mai mic)" : "descrescătoare (de la cel mai mare)"}:`,
      mecanica: { tip: "ordonare", numere, crescator },
      raspuns: { tip: "ordine", valori: sortat },
      indicii: [
        crescator ? "Caută întâi cel mai mic număr." : "Caută întâi cel mai mare număr.",
        `Primul este ${fmt(sortat[0])}.`,
        `Ordinea: ${sortat.map(fmt).join(", ")}`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const parImpar: Subiect = {
  id: "num.par-impar",
  titlu: "Par sau impar?",
  descriere: "Fac perechi: rămâne cineva singur?",
  domeniu: "numeratie",
  clase: [1, 2],
  icon: "👫",
  exercitiu(rng, nivel, clasa) {
    const n = nivel === "usor" ? rng.int(1, 30) : nr(rng, interval(clasa, nivel));
    const par = n % 2 === 0;
    if (nivel !== "usor" && rng.bool(0.4)) {
      const vrem = rng.bool() ? "par" : "impar";
      const bun = n % 2 === (vrem === "par" ? 0 : 1) ? n : n + 1;
      const rai = rng.distinct(3, () => bun + 2 * rng.int(-20, 20) + 1, String).filter((x) => x > 0);
      return {
        cheie: `paritate-alege:${vrem}:${bun}`, fapt: String(bun),
        enunt: `Care dintre numere este ${vrem}?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "optiune", valoare: fmt(bun), optiuni: rng.shuffle([bun, ...rai]).map(fmt) },
        indicii: ["Uită-te doar la ultima cifră a fiecărui număr.", "Pare: se termină în 0, 2, 4, 6, 8. Impare: în 1, 3, 5, 7, 9.", `${fmt(bun)} este ${vrem}.`],
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `paritate:${nivel === "usor" ? "v" : "n"}:${n}`,
      fapt: String(n),
      enunt: nivel === "usor" ? "Câte obiecte sunt? Numărul lor este par sau impar?" : `Numărul ${fmt(n)} este par sau impar?`,
      mecanica: nivel === "usor" ? { tip: "perechi", n, simbol: rng.pick(["🍎", "⭐", "🐟", "🎈", "🌼"]) } : { tip: "expresie", text: fmt(n) },
      raspuns: { tip: "optiune", valoare: par ? "par" : "impar", optiuni: ["par", "impar"] },
      indicii: [
        "Grupează obiectele câte două (în perechi).",
        "Uită-te doar la ultima cifră: 0, 2, 4, 6, 8 → par; 1, 3, 5, 7, 9 → impar.",
        `${n} ${par ? "este par: toate au pereche" : "este impar: rămâne unul fără pereche"}.`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const rotunjire: Subiect = {
  id: "num.rotunjire",
  titlu: "Rotunjim numere",
  descriere: "La ce zece (sută, mie) e mai aproape?",
  domeniu: "numeratie",
  clase: [2, 3, 4],
  icon: "🎯",
  exercitiu(rng, nivel, clasa) {
    const p = nivel === "usor" ? 10 : nivel === "mediu" ? (clasa === 2 ? 10 : 100) : clasa === 2 ? 100 : clasa === 3 ? 1000 : rng.pick([1000, 10000]);
    const I = interval(clasa, nivel === "usor" ? "mediu" : nivel);
    let n = nr(rng, I);
    if (n % p === 0) n += rng.int(1, p - 1);
    const jos = Math.floor(n / p) * p;
    const sus = jos + p;
    const r = n - jos >= p / 2 ? sus : jos;
    const nume = p === 10 ? "zeci" : p === 100 ? "sute" : p === 1000 ? "mii" : "zeci de mii";
    return {
      cheie: `rot:${p}:${n}`,
      fapt: `${n}~${p}`,
      enunt: `Rotunjește ${fmt(n)} la ordinul ${nume}:`,
      mecanica: { tip: "axa", de: jos, pana: sus, pas: p / 10, marcaj: n },
      raspuns: { tip: "optiune", valoare: fmt(r), optiuni: [fmt(jos), fmt(sus)] },
      indicii: [
        `${fmt(n)} este între ${fmt(jos)} și ${fmt(sus)}. De care e mai aproape pe axă?`,
        `Uită-te la cifra din dreapta ordinului: dacă e 5 sau mai mare, rotunjim în sus.`,
        `${fmt(n)} ≈ ${fmt(r)}`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const sir: Subiect = {
  id: "num.sir",
  titlu: "Șiruri cu regulă",
  descriere: "Descoperă regula și completează",
  domeniu: "numeratie",
  clase: [1, 2, 3, 4],
  icon: "🔗",
  exercitiu(rng, nivel, clasa) {
    const pasi = clasa === 1 ? [1, 2, 5, 10] : clasa === 2 ? [2, 3, 5, 10, 25, 50, 100] : [5, 25, 50, 100, 250, 500, 1000];
    const max = interval(clasa, "mediu")[1];
    const s: number[] = [];
    let regula: string;
    if (nivel === "provocare") {
      const d = rng.int(1, 4);
      s.push(rng.int(1, 30));
      for (let i = 0; i < 6; i++) s.push(s[i] + d + i);
      regula = `diferența crește cu 1 de fiecare dată (+${d}, +${d + 1}, +${d + 2}…)`;
    } else {
      const p = rng.pick(pasi);
      const cresc = nivel === "usor" || rng.bool();
      let x = cresc ? rng.int(0, Math.max(0, max - 1 - 7 * p)) : rng.int(7 * p, Math.max(7 * p, max - 1));
      for (let i = 0; i < 7; i++) {
        s.push(x);
        x += cresc ? p : -p;
      }
      regula = cresc ? `se adună ${p}` : `se scade ${p}`;
    }
    const goluri = nivel === "usor" ? [rng.int(3, 6)] : rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2).sort((a, b) => a - b);
    return {
      cheie: `sir:${s.join(",")}:${goluri.join(",")}`,
      fapt: s.slice(0, 3).join(","),
      enunt: "Ce numere lipsesc din șir?",
      mecanica: { tip: "sir", elemente: s.map((x, i) => (goluri.includes(i) ? null : x)) },
      raspuns: { tip: "campuri", valori: goluri.map((i) => s[i]), etichete: goluri.map((_, i) => `${i + 1}.`) },
      indicii: [`Cât s-a adunat sau s-a scăzut de la ${fmt(s[0])} la ${fmt(s[1])}?`, `Regula: ${regula}.`, `Șirul complet: ${s.map(fmt).join(", ")}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const extreme: Subiect = {
  id: "num.extreme",
  titlu: "Cel mai mare, cel mai mic",
  descriere: "Numere cu proprietăți date (cifre diferite, sumă…)",
  domeniu: "numeratie",
  clase: [2, 3, 4],
  icon: "🏆",
  exercitiu(rng, nivel, clasa) {
    const k = clasa === 2 ? 3 : nivel === "usor" ? 3 : 4;
    const cuv = k === 3 ? "trei" : "patru";
    const dif_ = (x: number) => new Set(String(x)).size === String(x).length;
    const suma = (x: number) => cifre(x).reduce((a, b) => a + b, 0);
    // cifre date: cel mai mare / mic număr cu cifrele…
    if (rng.bool(0.5)) {
      const c = rng.distinct(k, () => rng.int(0, 9));
      if (!c.some((d) => d > 0)) c[0] = rng.int(1, 9);
      const mare = rng.bool();
      const sort = [...c].sort((a, b) => (mare ? b - a : a - b));
      if (!mare && sort[0] === 0) {
        const i = sort.findIndex((d) => d > 0);
        [sort[0], sort[i]] = [sort[i], sort[0]];
      }
      const r = Number(sort.join(""));
      return {
        cheie: `extr-cifre:${mare ? "M" : "m"}:${[...c].sort().join("")}`,
        fapt: [...c].sort().join(""),
        enunt: `Formează cel mai ${mare ? "mare" : "mic"} număr folosind o singură dată cifrele ${c.join(", ")}:`,
        mecanica: { tip: "expresie", text: c.join("  ") },
        raspuns: { tip: "numar", valoare: r },
        indicii: [
          mare ? "Pune cea mai mare cifră pe primul loc (cel mai mare ordin)." : "Pune cea mai mică cifră pe primul loc — dar nu 0!",
          mare ? "Apoi cifrele în ordine descrescătoare." : "Apoi cifrele rămase în ordine crescătoare (0 poate sta pe locul 2).",
          `Numărul: ${r}`,
        ],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    const S = rng.int(4, 9 * k - 5);
    const z = rng.int(0, 9);
    const sabl: { t: string; f: (x: number) => boolean; max: boolean }[] = [
      { t: `cel mai mic număr de ${cuv} cifre diferite`, f: dif_, max: false },
      { t: `cel mai mare număr de ${cuv} cifre diferite`, f: dif_, max: true },
      { t: `cel mai mare număr par de ${cuv} cifre diferite`, f: (x) => dif_(x) && x % 2 === 0, max: true },
      { t: `cel mai mic număr impar de ${cuv} cifre diferite`, f: (x) => dif_(x) && x % 2 === 1, max: false },
      { t: `cel mai mic număr de ${cuv} cifre cu suma cifrelor ${S}`, f: (x) => suma(x) === S, max: false },
      { t: `cel mai mare număr de ${cuv} cifre cu suma cifrelor ${S}`, f: (x) => suma(x) === S, max: true },
      { t: `cel mai mare număr de ${cuv} cifre diferite cu cifra zecilor ${z}`, f: (x) => dif_(x) && cifre(x)[k - 2] === z, max: true },
      { t: `cel mai mic număr de ${cuv} cifre diferite cu cifra unităților ${z}`, f: (x) => dif_(x) && x % 10 === z, max: false },
    ];
    const s = rng.pick(sabl);
    let r = -1;
    if (s.max) for (let x = 10 ** k - 1; x >= 10 ** (k - 1); x--) { if (s.f(x)) { r = x; break; } }
    else for (let x = 10 ** (k - 1); x < 10 ** k; x++) { if (s.f(x)) { r = x; break; } }
    return {
      cheie: `extr:${s.t}`,
      fapt: s.t,
      enunt: `Scrie ${s.t}:`,
      mecanica: { tip: "expresie", text: "?" },
      raspuns: { tip: "numar", valoare: r },
      indicii: [
        s.max ? "Vrem numărul cel mai mare: cifre cât mai mari la stânga." : "Vrem numărul cel mai mic: prima cifră cât mai mică (dar nu 0).",
        "Verifică fiecare condiție, cifră cu cifră, de la stânga la dreapta.",
        `Răspuns: ${r}`,
      ],
      dificultate: dif(nivel, clasa, 2),
    };
  },
};

export const romane: Subiect = {
  id: "num.romane",
  titlu: "Cifre romane",
  descriere: "I, V, X, L, C, D, M",
  domeniu: "numeratie",
  clase: [3, 4],
  icon: "🏛️",
  exercitiu(rng, nivel, clasa) {
    const max = nivel === "usor" ? 50 : clasa === 3 ? 100 : nivel === "mediu" ? 500 : 2030;
    const n = rng.int(1, max);
    const r = roman(n);
    const descompunere = (() => {
      const parti: string[] = [];
      let x = n;
      for (const [v, s] of [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as const)
        while (x >= v) { parti.push(`${s}=${v}`); x -= v; }
      return parti.join(" + ");
    })();
    if (rng.bool()) {
      const distr = new Set<string>([roman(n + 1), roman(Math.max(1, n - 1)), r.split("").reverse().join("")].filter((x) => x !== r));
      for (let k = 2; distr.size < 3; k++) distr.add(roman(n + k));
      return {
        cheie: `rom:a2r:${n}`,
        fapt: String(n),
        enunt: `Cum se scrie ${n} cu cifre romane?`,
        mecanica: { tip: "expresie", text: String(n) },
        raspuns: { tip: "optiune", valoare: r, optiuni: rng.shuffle([r, ...[...distr].slice(0, 3)]) },
        indicii: ["I=1, V=5, X=10, L=50, C=100, D=500, M=1000.", "O cifră mică pusă înaintea uneia mari se scade (IV = 4, IX = 9).", descompunere],
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `rom:r2a:${n}`,
      fapt: String(n),
      enunt: `Ce număr este ${r}?`,
      mecanica: { tip: "expresie", text: r },
      raspuns: { tip: "numar", valoare: n },
      indicii: ["Citește de la stânga la dreapta și adună valorile.", "Când o cifră mai mică stă înaintea uneia mai mari, se scade.", `${descompunere} → ${n}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const SUBIECTE_NUMERATIE = [formare, litere, descompunere, vecini, comparare, ordonare, parImpar, rotunjire, sir, extreme, romane];
