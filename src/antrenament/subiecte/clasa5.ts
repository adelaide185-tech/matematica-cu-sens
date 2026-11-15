/**
 * Clasa a V-a (programa OM 3393/2017): numere naturale și puteri, metode aritmetice, divizibilitate,
 * fracții ordinare și zecimale, elemente de geometrie și unități de măsură.
 */
import type { Rng } from "@/motor/rng";
import type { Subiect } from "../tipuri";
import { cereDe, cuSubstantiv } from "@/motor/limba";
import { dif, fmt } from "./comun";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** Exponent scris ca la tablă: 2⁵ */
export const sup = (n: number) => String(n).split("").map((d) => SUP[Number(d)]).join("");
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
/** Număr zecimal cu virgulă, din „sutimi” întregi (evită erorile de rotunjire). */
export function zec(intreg: number, zecimale: number): string {
  const neg = intreg < 0;
  const t = String(Math.abs(intreg)).padStart(zecimale + 1, "0");
  const parteIntreaga = zecimale ? t.slice(0, -zecimale) : t;
  const parteZecimala = zecimale ? t.slice(-zecimale).replace(/0+$/, "") : "";
  return (neg ? "−" : "") + parteIntreaga + (parteZecimala ? `,${parteZecimala}` : "");
}
const Z = (intreg: number, zecimale: number) => ({ tip: "zecimal" as const, valoare: intreg / 10 ** zecimale, text: zec(intreg, zecimale) });
const fr = (a: number, b: number) => `${a}/${b}`;
const ireductibil = (a: number, b: number): [number, number] => [a / gcd(a, b), b / gcd(a, b)];

// ───────── numere naturale ─────────

export const puteri: Subiect = {
  id: "v.puteri",
  titlu: "Puteri",
  descriere: "Pătrat, cub, puteri ale lui 10, reguli de calcul",
  domeniu: "numeratie",
  clase: [5],
  icon: "⚡",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? rng.int(0, 2) : nivel === "mediu" ? rng.int(0, 3) : rng.int(2, 5);
    if (nivel === "usor" && tip === 2) {
      // scrierea ca putere: 3 · 3 · 3 · 3 = 3^?
      const b = rng.int(2, 10), e = rng.int(2, 6);
      return {
        cheie: `pow-scrie:${b}:${e}`, fapt: `${b}^${e}`,
        enunt: `Scrie ca putere: ${Array(e).fill(b).join(" · ")} = ${b}^?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "numar", valoare: e },
        indicii: ["Exponentul arată de câte ori se înmulțește baza cu ea însăși.", `Numără factorii egali cu ${b}.`, `${Array(e).fill(b).join(" · ")} = ${b}${sup(e)}`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip <= 1) {
      const b = tip === 0 ? rng.int(2, nivel === "usor" ? 10 : 20) : 10;
      const e = tip === 0 ? rng.pick(nivel === "usor" ? [2, 3] : [2, 3, 4]) : rng.int(1, 6);
      const v = b ** e;
      return {
        cheie: `pow:${b}^${e}`, fapt: `${b}^${e}`,
        enunt: `${b}${sup(e)} = ?`,
        mecanica: { tip: "expresie", text: `${b}${sup(e)}` },
        raspuns: { tip: "numar", valoare: v },
        indicii: [`${b}${sup(e)} înseamnă ${b} înmulțit cu el însuși de ${e} ori.`, `${Array(e).fill(b).join(" · ")}`, `${b}${sup(e)} = ${fmt(v)}`],
        dificultate: dif(nivel, 5),
      };
    }
    // reguli: a^m · a^n = a^(m+n); a^m : a^n = a^(m−n); (a^m)^n = a^(m·n)
    const a = rng.pick([2, 3, 5, 7, 10]);
    const m = rng.int(2, 9), n = rng.int(2, 6);
    const reg = tip - 2;
    const [expr, r, regula] =
      reg === 0 ? [`${a}${sup(m)} · ${a}${sup(n)} = ${a}^?`, m + n, "La înmulțirea puterilor cu aceeași bază, adunăm exponenții."] :
      reg === 1 ? [`${a}${sup(m + n)} : ${a}${sup(n)} = ${a}^?`, m, "La împărțirea puterilor cu aceeași bază, scădem exponenții."] :
      reg === 2 ? [`(${a}${sup(m)})${sup(n)} = ${a}^?`, m * n, "La ridicarea unei puteri la o putere, înmulțim exponenții."] :
                  [`${a}${sup(m)} · ${a}${sup(n)} : ${a}${sup(Math.min(m, n))} = ${a}^?`, m + n - Math.min(m, n), "Adunăm exponenții la înmulțire, apoi scădem la împărțire."];
    return {
      cheie: `powreg:${reg}:${a}:${m}:${n}`, fapt: `${reg}:${m}:${n}`,
      enunt: `Scrie exponentul: ${expr}`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: r },
      indicii: [regula, "Baza rămâne aceeași; lucrăm doar cu exponenții.", `${expr.replace("^?", sup(r))}`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

export const ordineaOperatiilor5: Subiect = {
  id: "v.ordine",
  titlu: "Ordinea operațiilor și parantezele",
  descriere: "Puteri, paranteze rotunde, drepte, acolade",
  domeniu: "operatii",
  clase: [5],
  icon: "🧮",
  exercitiu(rng, nivel) {
    const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 6), d = rng.int(2, 4);
    const forme = [
      { e: `${a * 10} − ${b} · ${c}`, v: a * 10 - b * c, p: [`${b} · ${c} = ${b * c}`] },
      { e: `${a}${sup(2)} + ${b} · ${c}`, v: a * a + b * c, p: [`${a}${sup(2)} = ${a * a}`, `${b} · ${c} = ${b * c}`] },
      { e: `(${a} + ${b})${sup(2)} − ${c}${sup(2)}`, v: (a + b) ** 2 - c * c, p: [`${a} + ${b} = ${a + b}`, `${a + b}${sup(2)} = ${(a + b) ** 2}`, `${c}${sup(2)} = ${c * c}`] },
      { e: `[${a} · (${b} + ${c}) − ${d}] : ${d}`, v: (a * (b + c) - d) / d, p: [`${b} + ${c} = ${b + c}`, `${a} · ${b + c} = ${a * (b + c)}`, `${a * (b + c)} − ${d} = ${a * (b + c) - d}`] },
      { e: `2${sup(d)} · ${c} − {${a} + [${b} · 2 − ${b}]}`, v: 2 ** d * c - (a + (b * 2 - b)), p: [`2${sup(d)} = ${2 ** d}`, `${b} · 2 − ${b} = ${b}`, `${a} + ${b} = ${a + b}`] },
    ].filter((f) => Number.isInteger(f.v) && f.v >= 0);
    const disp = nivel === "usor" ? forme.slice(0, 2) : nivel === "mediu" ? forme.slice(0, 4) : forme.slice(2);
    const f = rng.pick(disp.length ? disp : forme.slice(0, 1));
    return {
      cheie: `ord5:${f.e}`, fapt: f.e,
      enunt: `${f.e} = ?`,
      mecanica: { tip: "expresie", text: f.e },
      raspuns: { tip: "numar", valoare: f.v },
      indicii: ["Ordinea: puterile, apoi înmulțirile și împărțirile, apoi adunările și scăderile. Parantezele: întâi ( ), apoi [ ], apoi { }.", `Primul pas: ${f.p[0]}.`, `${f.p.join(" → ")} → rezultat ${f.v}`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

export const factorComun: Subiect = {
  id: "v.factor-comun",
  titlu: "Factorul comun",
  descriere: "Calcul rapid: a · b + a · c = a · (b + c)",
  domeniu: "operatii",
  clase: [5],
  icon: "🔗",
  exercitiu(rng, nivel) {
    const a = rng.int(nivel === "usor" ? 2 : 11, nivel === "usor" ? 9 : 99);
    const b = rng.int(1, 99);
    const c = (nivel === "provocare" ? 1000 : 100) - b;
    const plus = nivel !== "provocare" || rng.bool();
    const [x, y] = plus ? [b, c] : [c + 2 * b, 2 * b];
    const v = plus ? a * (x + y) : a * (x - y);
    return {
      cheie: `fc:${a}:${x}:${y}:${plus}`, fapt: `${a}`,
      enunt: `Calculează cât mai simplu: ${a} · ${x} ${plus ? "+" : "−"} ${a} · ${y}`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: v },
      indicii: [`${a} apare în ambii termeni: este factor comun.`, `${a} · ${x} ${plus ? "+" : "−"} ${a} · ${y} = ${a} · (${x} ${plus ? "+" : "−"} ${y}) = ${a} · ${plus ? x + y : x - y}`, `Rezultat: ${fmt(v)}`],
      dificultate: dif(nivel, 5),
    };
  },
};

// ───────── metode aritmetice ─────────

const PRODUSE = [
  { sg: "caiet", pl: "caiete" }, { sg: "creion", pl: "creioane" }, { sg: "carte", pl: "cărți" }, { sg: "minge", pl: "mingi" }, { sg: "bilet", pl: "bilete" },
];

export const reducereUnitate: Subiect = {
  id: "v.unitate",
  titlu: "Metoda reducerii la unitate",
  descriere: "Cât costă unul? Apoi cât costă mai multe",
  domeniu: "probleme",
  clase: [5],
  icon: "🧾",
  exercitiu(rng, nivel) {
    const o = rng.pick(PRODUSE);
    const pret = rng.int(2, nivel === "usor" ? 9 : 25);
    const n1 = rng.int(2, 9);
    let n2 = rng.int(2, 15);
    if (n2 === n1) n2 = n1 + 1;
    if (nivel === "provocare") {
      // proporționalitate inversă: muncitori și zile
      const m1 = rng.int(2, 6), zile1 = rng.int(4, 12);
      const total = m1 * zile1;
      const divs = [2, 3, 4, 6, 8, 12].filter((d) => total % d === 0 && d !== m1);
      const m2 = rng.pick(divs.length ? divs : [1]);
      return {
        cheie: `ru-inv:${m1}:${zile1}:${m2}`, fapt: `${total}`,
        enunt: `${m1} muncitori termină o lucrare în ${zile1} zile. În câte zile ar termina-o ${cuSubstantiv(m2, "muncitor", "muncitori")}, lucrând la fel?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "numar", valoare: total / m2 },
        indicii: ["Cu mai mulți muncitori, lucrarea se termină mai repede (mărimi invers proporționale).", `Un singur muncitor ar avea nevoie de ${m1} · ${zile1} = ${total} zile.`, `${total} : ${m2} = ${total / m2} zile`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    return {
      cheie: `ru:${o.pl}:${pret}:${n1}:${n2}`, fapt: `${pret}`,
      enunt: `${cuSubstantiv(n1, o.sg, o.pl)} costă ${n1 * pret} lei. Cât costă ${cuSubstantiv(n2, o.sg, o.pl)}?`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: n2 * pret },
      indicii: [`Află întâi cât costă un ${o.sg}.`, `${n1 * pret} : ${n1} = ${pret} lei (un ${o.sg})`, `${n2} · ${pret} = ${n2 * pret} lei`],
      dificultate: dif(nivel, 5),
    };
  },
};

export const metode: Subiect = {
  id: "v.metode",
  titlu: "Metode de rezolvare",
  descriere: "Figurativă, mersul invers, falsa ipoteză",
  domeniu: "probleme",
  clase: [5],
  icon: "🧩",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? rng.int(0, 1) : nivel === "mediu" ? rng.int(0, 3) : rng.int(1, 4);
    if (tip === 0 || tip === 1) {
      // suma și diferența / suma și raportul (metoda figurativă)
      const mic = rng.int(5, 200);
      if (tip === 0) {
        const d = rng.int(2, 150);
        const S = 2 * mic + d;
        return {
          cheie: `fig-sd:${S}:${d}`, fapt: `${S}-${d}`,
          enunt: `Suma a două numere este ${S}, iar diferența lor este ${d}. Care este numărul mai mare?`,
          mecanica: { tip: "bara", comparatie: true, parti: [{ eticheta: "mic", valoare: mic }, { eticheta: "mare", valoare: null }, { eticheta: `cu ${d} mai mult`, valoare: d, culoare: "#2e9e5b" }], total: null },
          raspuns: { tip: "numar", valoare: mic + d },
          indicii: ["Desenează numerele ca segmente; cel mare = cel mic + diferența.", `Scoate diferența: ${S} − ${d} = ${2 * mic} = două segmente egale.`, `Mic: ${2 * mic} : 2 = ${mic}; mare: ${mic} + ${d} = ${mic + d}`],
          dificultate: dif(nivel, 5),
        };
      }
      const k = rng.int(2, 6);
      const S = mic * (k + 1);
      return {
        cheie: `fig-sr:${S}:${k}`, fapt: `${S}:${k}`,
        enunt: `Suma a două numere este ${S}. Un număr este de ${k} ori mai mare decât celălalt. Care este numărul mai mic?`,
        mecanica: { tip: "bara", parti: Array.from({ length: k + 1 }, (_, i) => ({ eticheta: i === 0 ? "mic" : "", valoare: null, culoare: i === 0 ? "#f9c50f" : undefined })), total: S },
        raspuns: { tip: "numar", valoare: mic },
        indicii: [`Numărul mic = 1 parte; numărul mare = ${k} părți.`, `În total sunt ${k} + 1 = ${k + 1} părți egale.`, `${S} : ${k + 1} = ${mic}`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 2 || tip === 3) {
      const x = rng.int(3, 60);
      const a = rng.int(2, 9), b = rng.int(2, 5), c = rng.int(1, 20);
      const r = (x + a) * b - c;
      return {
        cheie: `mi:${x}:${a}:${b}:${c}`, fapt: `${x}`,
        enunt: `M-am gândit la un număr. L-am adunat cu ${a}, rezultatul l-am înmulțit cu ${b}, apoi am scăzut ${c} și am obținut ${r}. La ce număr m-am gândit?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "numar", valoare: x },
        indicii: ["Mergem invers: de la rezultat spre început, cu operațiile inverse.", `${r} + ${c} = ${r + c}; ${r + c} : ${b} = ${x + a}`, `${x + a} − ${a} = ${x}`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    // falsa ipoteză: biciclete și tricicluri (sau găini și iepuri)
    const b2 = rng.int(2, 30), t3 = rng.int(2, 30);
    const tot = b2 + t3, roti = 2 * b2 + 3 * t3;
    return {
      cheie: `fi:${b2}:${t3}`, fapt: `${tot}:${roti}`,
      enunt: `Într-o parcare sunt ${tot}${cereDe(tot) ? " de" : ""} biciclete și tricicluri, cu ${roti}${cereDe(roti) ? " de" : ""} roți în total. Câte tricicluri sunt?`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: t3 },
      indicii: [`Presupunem că toate cele ${tot} vehicule sunt biciclete: ar avea ${2 * tot} roți.`, `Lipsesc ${roti} − ${2 * tot} = ${roti - 2 * tot} roți; fiecare triciclu are cu o roată mai mult.`, `${roti - 2 * tot} : 1 = ${t3} tricicluri`],
      dificultate: dif(nivel, 5, 2),
    };
  },
};

// ───────── divizibilitate ─────────

const divizori = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const prim = (n: number) => n > 1 && divizori(n).length === 2;
const sumaCifre = (n: number) => String(n).split("").reduce((s, d) => s + Number(d), 0);

export const divizibilitate: Subiect = {
  id: "v.divizibilitate",
  titlu: "Divizibilitate",
  descriere: "Divizori, multipli, criteriile cu 2, 5, 10, 3, 9",
  domeniu: "numeratie",
  clase: [5],
  icon: "➗",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? rng.int(0, 1) : nivel === "mediu" ? rng.int(0, 3) : rng.int(2, 4);
    if (tip === 0) {
      const d = rng.pick([2, 5, 10, 3, 9]);
      const n = rng.int(100, nivel === "usor" ? 999 : 99999);
      const da = n % d === 0;
      const crit: Record<number, string> = { 2: "ultima cifră e pară", 5: "ultima cifră e 0 sau 5", 10: "ultima cifră e 0", 3: `suma cifrelor (${sumaCifre(n)}) se împarte la 3`, 9: `suma cifrelor (${sumaCifre(n)}) se împarte la 9` };
      return {
        cheie: `crit:${d}:${n}`, fapt: `${n}%${d}`,
        enunt: `Este ${fmt(n)} divizibil cu ${d}?`,
        mecanica: { tip: "expresie", text: fmt(n) },
        raspuns: { tip: "optiune", valoare: da ? "Da" : "Nu", optiuni: ["Da", "Nu"] },
        indicii: [`Criteriul cu ${d}: ${d === 3 || d === 9 ? "suma cifrelor" : "ultima cifră"}.`, `Verifică: ${crit[d]}?`, da ? `Da: ${fmt(n)} : ${d} = ${fmt(n / d)}.` : `Nu: ${fmt(n)} nu se împarte exact la ${d}.`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 1) {
      const n = rng.pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 64, 72, 80, 84, 90, 96, 100]);
      const D = divizori(n);
      return {
        cheie: `nrdiv:${n}`, fapt: `${n}`,
        enunt: `Câți divizori are numărul ${n}?`,
        mecanica: { tip: "expresie", text: String(n) },
        raspuns: { tip: "numar", valoare: D.length },
        indicii: ["Caută divizorii în perechi: 1 și n, 2 și n:2, …", `Încearcă pe rând 1, 2, 3, … până ajungi la perechi deja găsite.`, `D${n} = {${D.join(", ")}}: ${D.length} divizori`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 2) {
      // cifra lipsă ca numărul să fie divizibil cu 9 (răspuns unic)
      for (;;) {
        const a = rng.int(1, 9), b = rng.int(0, 9), c = rng.int(0, 9);
        const fara = a + b + c;
        const cifre = Array.from({ length: 10 }, (_, x) => x).filter((x) => (fara + x) % 9 === 0);
        if (cifre.length !== 1) continue;
        return {
          cheie: `lipsa9:${a}${b}${c}`, fapt: `${a}${b}${c}`,
          enunt: `Ce cifră pui în locul lui * ca numărul ${a}${b}*${c} să fie divizibil cu 9?`,
          mecanica: { tip: "expresie", text: `${a}${b}*${c}` },
          raspuns: { tip: "numar", valoare: cifre[0] },
          indicii: ["Un număr se împarte la 9 dacă suma cifrelor se împarte la 9.", `Suma cifrelor cunoscute: ${a} + ${b} + ${c} = ${fara}.`, `${fara} + ${cifre[0]} = ${fara + cifre[0]}, divizibil cu 9 → * = ${cifre[0]}`],
          dificultate: dif(nivel, 5, 1),
        };
      }
    }
    if (tip === 3) {
      const a = rng.int(2, 12), b = rng.int(2, 15);
      const v = lcm(a, b);
      return {
        cheie: `cmmmc:${Math.min(a, b)}:${Math.max(a, b)}`, fapt: `${a}:${b}`,
        enunt: `Care este cel mai mic număr nenul care este multiplu și al lui ${a}, și al lui ${b}?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "numar", valoare: v },
        indicii: [`Scrie primii multipli ai lui ${Math.max(a, b)}: ${Math.max(a, b)}, ${2 * Math.max(a, b)}, ${3 * Math.max(a, b)}, …`, `Oprește-te la primul care se împarte și la ${Math.min(a, b)}.`, `Răspuns: ${v}`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    const n = rng.int(20, 200);
    const d = rng.pick([3, 4, 6, 7, 8, 11, 12]);
    const k = Math.floor(n / d);
    return {
      cheie: `nrmult:${n}:${d}`, fapt: `${n}:${d}`,
      enunt: `Câți multipli ai lui ${d} sunt între 1 și ${n} (inclusiv)?`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: k },
      indicii: [`Multiplii lui ${d}: ${d}, ${2 * d}, ${3 * d}, …`, `Ultimul multiplu ≤ ${n} este ${k * d} = ${d} · ${k}.`, `Sunt ${k} multipli.`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

export const numerePrime: Subiect = {
  id: "v.prime",
  titlu: "Numere prime și compuse",
  descriere: "Are doar doi divizori?",
  domeniu: "numeratie",
  clase: [5],
  icon: "🔑",
  exercitiu(rng, nivel) {
    const max = nivel === "usor" ? 50 : nivel === "mediu" ? 100 : 200;
    if (nivel !== "usor" && rng.bool(0.35)) {
      const a = rng.int(2, max - 20);
      const b = a + rng.int(8, 20);
      const p = Array.from({ length: b - a + 1 }, (_, i) => a + i).filter(prim);
      return {
        cheie: `nrprime:${a}:${b}`, fapt: `${a}-${b}`,
        enunt: `Câte numere prime sunt între ${a} și ${b} (inclusiv)?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "numar", valoare: p.length },
        indicii: ["Un număr prim are exact doi divizori: 1 și el însuși.", "Elimină numerele pare (în afară de 2) și pe cele divizibile cu 3, 5, 7.", `Numerele prime: ${p.join(", ") || "niciunul"} (${p.length}).`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    const n = rng.int(2, max);
    const e = prim(n);
    const d = divizori(n).find((x) => x > 1 && x < n);
    return {
      cheie: `prim:${n}`, fapt: `${n}`,
      enunt: `Numărul ${n} este prim sau compus?`,
      mecanica: { tip: "expresie", text: String(n) },
      raspuns: { tip: "optiune", valoare: e ? "prim" : "compus", optiuni: ["prim", "compus"] },
      indicii: ["Prim = are doar divizorii 1 și el însuși. Compus = mai are și alți divizori.", "Încearcă împărțirea la 2, 3, 5, 7, 11…", e ? `${n} este prim.` : `${n} este compus: se împarte la ${d} (${n} = ${d} · ${n / d!}).`],
      dificultate: dif(nivel, 5),
    };
  },
};

// ───────── fracții ordinare ─────────

export const fractiiEchivalente: Subiect = {
  id: "v.fr-echivalente",
  titlu: "Amplificarea și simplificarea",
  descriere: "Fracții echivalente; fracția ireductibilă",
  domeniu: "fractii",
  clase: [5],
  icon: "🔍",
  exercitiu(rng, nivel) {
    const b = rng.int(2, 12);
    const a = rng.int(1, b - 1);
    const [x, y] = ireductibil(a, b);
    const k = rng.int(2, nivel === "usor" ? 5 : 9);
    if (nivel === "usor" || rng.bool()) {
      const lipsaJos = rng.bool();
      return {
        cheie: `ampl:${x}/${y}:${k}:${lipsaJos}`, fapt: `${x}/${y}`,
        enunt: lipsaJos ? `${fr(x, y)} = ${x * k}/?` : `${fr(x, y)} = ?/${y * k}`,
        mecanica: { tip: "benzi", fractii: [[x, y], [x * k, y * k]] },
        raspuns: { tip: "numar", valoare: lipsaJos ? y * k : x * k },
        indicii: ["Amplificarea: înmulțim și numărătorul, și numitorul cu același număr.", lipsaJos ? `${x} · ${k} = ${x * k}, deci am amplificat cu ${k}.` : `${y} · ${k} = ${y * k}, deci am amplificat cu ${k}.`, `${fr(x, y)} = ${fr(x * k, y * k)}`],
        dificultate: dif(nivel, 5),
      };
    }
    return {
      cheie: `simpl:${x * k}/${y * k}`, fapt: `${x}/${y}`,
      enunt: `Simplifică până la fracția ireductibilă: ${fr(x * k, y * k)}`,
      mecanica: { tip: "expresie", text: fr(x * k, y * k) },
      raspuns: { tip: "campuri", valori: [x, y], etichete: ["numărătorul", "numitorul"] },
      indicii: ["Simplificarea: împărțim numărătorul și numitorul la același divizor comun.", `Cel mai mare divizor comun al lui ${x * k} și ${y * k} este ${gcd(x * k, y * k)}.`, `${fr(x * k, y * k)} = ${fr(x, y)}`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

export const comparareFractii5: Subiect = {
  id: "v.fr-comparare",
  titlu: "Compararea fracțiilor",
  descriere: "Cu numitori diferiți: aducem la același numitor",
  domeniu: "fractii",
  clase: [5],
  icon: "⚖️",
  exercitiu(rng, nivel) {
    const p = rng.int(2, nivel === "usor" ? 6 : 10), q = rng.int(2, nivel === "usor" ? 6 : 12);
    const a = rng.int(1, nivel === "provocare" ? 2 * p : p - 1), b = rng.int(1, nivel === "provocare" ? 2 * q : q - 1);
    const m = lcm(p, q);
    const A = a * (m / p), B = b * (m / q);
    const semn = A < B ? "<" : A > B ? ">" : "=";
    return {
      cheie: `cmp5:${a}/${p}?${b}/${q}`, fapt: `${a}/${p}?${b}/${q}`,
      enunt: `Compară: ${fr(a, p)} ? ${fr(b, q)}`,
      mecanica: nivel === "provocare" ? { tip: "expresie", text: `${fr(a, p)} ? ${fr(b, q)}` } : { tip: "benzi", fractii: [[a, p], [b, q]] },
      raspuns: { tip: "optiune", valoare: semn, optiuni: ["<", "=", ">"] },
      indicii: ["Aducem fracțiile la același numitor (un multiplu comun al numitorilor).", `Numitor comun ${m}: ${fr(a, p)} = ${fr(A, m)}, ${fr(b, q)} = ${fr(B, m)}.`, `${fr(a, p)} ${semn} ${fr(b, q)}`],
      dificultate: dif(nivel, 5),
    };
  },
};

export const operatiiFractii5: Subiect = {
  id: "v.fr-operatii",
  titlu: "Operații cu fracții",
  descriere: "Adunare, scădere, înmulțire, împărțire",
  domeniu: "fractii",
  clase: [5],
  icon: "✖️",
  exercitiu(rng, nivel) {
    const op = nivel === "usor" ? rng.pick(["+", "−"] as const) : rng.pick(["+", "−", "·", ":"] as const);
    let p = 2, q = 2, a = 1, b = 1;
    // la scădere, descăzutul trebuie să fie strict mai mare (rezultat pozitiv); regenerăm până e așa
    for (let incercari = 0; incercari < 50; incercari++) {
      p = rng.int(2, 9);
      q = nivel === "usor" ? p : rng.int(2, 9);
      a = rng.int(1, p - 1);
      b = rng.int(1, q - 1);
      if (op === "−" && a * q < b * p) [a, p, b, q] = [b, q, a, p];
      if (op !== "−" || a * q > b * p) break;
    }
    if (op === "−" && a * q <= b * p) [a, p, b, q] = [3, 4, 1, 4];
    const m = lcm(p, q);
    const [num, den] =
      op === "+" ? [a * (m / p) + b * (m / q), m] :
      op === "−" ? [a * (m / p) - b * (m / q), m] :
      op === "·" ? [a * b, p * q] : [a * q, p * b];
    const [x, y] = num === 0 ? [0, 1] : ireductibil(num, den);
    const expr = `${fr(a, p)} ${op} ${fr(b, q)}`;
    return {
      cheie: `frop5:${expr}`, fapt: expr,
      enunt: `${expr} = ? (scrie rezultatul ca fracție ireductibilă)`,
      mecanica: { tip: "expresie", text: expr },
      raspuns: { tip: "campuri", valori: [x, y], etichete: ["numărătorul", "numitorul"] },
      indicii: [
        op === "·" ? "La înmulțire: numărător cu numărător, numitor cu numitor." : op === ":" ? "La împărțire: înmulțim cu inversa celei de-a doua fracții." : "La adunare și scădere: aducem întâi la același numitor.",
        op === "·" ? `${a}·${b} / ${p}·${q} = ${fr(a * b, p * q)}` : op === ":" ? `${fr(a, p)} · ${fr(q, b)} = ${fr(a * q, p * b)}` : `Numitor comun ${m}: ${fr(a * (m / p), m)} ${op} ${fr(b * (m / q), m)}.`,
        `Rezultat: ${fr(num, den)}${num !== x ? ` = ${fr(x, y)}` : ""}`,
      ],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

// ───────── fracții zecimale ─────────

export const zecimale: Subiect = {
  id: "v.zecimale",
  titlu: "Fracții zecimale",
  descriere: "Scriere, comparare, rotunjire",
  domeniu: "fractii",
  clase: [5],
  icon: "🔟",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? rng.int(0, 1) : rng.int(0, 3);
    if (tip === 0) {
      const z = rng.pick([10, 100, 1000]);
      const a = rng.int(1, z - 1);
      const d = Math.log10(z);
      return {
        cheie: `zfr:${a}/${z}`, fapt: `${a}/${z}`,
        enunt: `Scrie ca fracție zecimală: ${fr(a, z)}`,
        mecanica: z === 100 ? { tip: "grila100", colorate: a } : { tip: "expresie", text: fr(a, z) },
        raspuns: Z(a, d),
        indicii: [`Numitorul ${z} are ${d} ${d === 1 ? "zero" : "zerouri"}: după virgulă vor fi ${d} ${d === 1 ? "cifră" : "cifre"}.`, `Scrie ${a} și pune virgula astfel încât să fie ${d} ${d === 1 ? "cifră" : "cifre"} după ea.`, `${fr(a, z)} = ${zec(a, d)}`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 1) {
      // comparare cu capcană: 0,5 vs 0,45
      const a = rng.int(1, 9);
      const b = rng.int(10, 99);
      const [x, y] = rng.bool() ? [a * 10, b] : [b, a * 10];
      const semn = x < y ? "<" : x > y ? ">" : "=";
      return {
        cheie: `zcmp:${x}?${y}`, fapt: `${x}?${y}`,
        enunt: `Compară: ${zec(x, 2)} ? ${zec(y, 2)}`,
        mecanica: { tip: "expresie", text: `${zec(x, 2)} ? ${zec(y, 2)}` },
        raspuns: { tip: "optiune", valoare: semn, optiuni: ["<", "=", ">"] },
        indicii: ["Completează cu zerouri ca ambele numere să aibă la fel de multe zecimale.", `${zec(x, 2)} = ${(x / 100).toFixed(2).replace(".", ",")} și ${zec(y, 2)} = ${(y / 100).toFixed(2).replace(".", ",")}: compară zecimile, apoi sutimile.`, `${zec(x, 2)} ${semn} ${zec(y, 2)}`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    if (tip === 2) {
      const n = rng.int(1001, 99999);
      const zec2 = Math.round(n / 10);
      return {
        cheie: `zrot:${n}`, fapt: `${n}`,
        enunt: `Rotunjește la zecimi: ${zec(n, 3)}`,
        mecanica: { tip: "expresie", text: zec(n, 3) },
        raspuns: Z(zec2, 2),
        indicii: ["Zecimile sunt prima cifră după virgulă. Ne uităm la sutimi (a doua cifră).", "Dacă sutimile sunt 5 sau mai mult, mărim zecimile cu 1.", `${zec(n, 3)} ≈ ${zec(zec2, 2)}`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    // fracție ordinară → zecimală (numitori 2, 4, 5, 20, 25, 50)
    const den = rng.pick([2, 4, 5, 20, 25, 50]);
    const num = rng.int(1, den - 1);
    const sut = (num * 100) / den;
    return {
      cheie: `zord:${num}/${den}`, fapt: `${num}/${den}`,
      enunt: `Transformă în fracție zecimală: ${fr(num, den)}`,
      mecanica: { tip: "expresie", text: fr(num, den) },
      raspuns: Z(sut, 2),
      indicii: [`Amplifică fracția ca numitorul să devină 100.`, `${fr(num, den)} = ${fr(sut, 100)}`, `${fr(sut, 100)} = ${zec(sut, 2)}`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

export const operatiiZecimale: Subiect = {
  id: "v.zecimale-op",
  titlu: "Operații cu fracții zecimale",
  descriere: "Adunare, scădere, înmulțire, împărțire, media",
  domeniu: "fractii",
  clase: [5],
  icon: "➕",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? rng.int(0, 1) : nivel === "mediu" ? rng.int(0, 3) : rng.int(2, 5);
    if (tip <= 1) {
      // sutimi întregi: 3,45 + 12,7
      const a = rng.int(10, 9999) + (rng.bool() ? 0 : 1), b = rng.int(10, tip === 1 ? a - 1 : 9999);
      const plus = tip === 0;
      const r = plus ? a + b : a - b;
      return {
        cheie: `zop:${a}${plus ? "+" : "-"}${b}`, fapt: `${a}${plus ? "+" : "-"}${b}`,
        enunt: `${zec(a, 2)} ${plus ? "+" : "−"} ${zec(b, 2)} = ?`,
        mecanica: { tip: "expresie", text: `${zec(a, 2)} ${plus ? "+" : "−"} ${zec(b, 2)}` },
        raspuns: Z(r, 2),
        indicii: ["Așază numerele cu virgula sub virgulă (zecimi sub zecimi, sutimi sub sutimi).", "Completează cu zerouri unde lipsesc cifre, apoi calculează ca la numerele naturale.", `${zec(a, 2)} ${plus ? "+" : "−"} ${zec(b, 2)} = ${zec(r, 2)}`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 2) {
      let a = rng.int(1, 9999);
      if (a % 100 === 0) a += rng.int(1, 99);
      const p = rng.pick([10, 100, 1000]);
      const inm = rng.bool();
      const e = Math.log10(p);
      return {
        cheie: `zp10:${a}:${p}:${inm}`, fapt: `${a}:${p}`,
        enunt: `${zec(a, 2)} ${inm ? "·" : ":"} ${p} = ?`,
        mecanica: { tip: "expresie", text: `${zec(a, 2)} ${inm ? "·" : ":"} ${p}` },
        raspuns: inm ? Z(a * p, 2) : Z(a, 2 + e),
        indicii: [inm ? `La înmulțirea cu ${p}, virgula se mută ${e} ${e === 1 ? "poziție" : "poziții"} la dreapta.` : `La împărțirea la ${p}, virgula se mută ${e} ${e === 1 ? "poziție" : "poziții"} la stânga.`, "Completează cu zerouri dacă nu sunt destule cifre.", `${zec(a, 2)} ${inm ? "·" : ":"} ${p} = ${inm ? zec(a * p, 2) : zec(a, 2 + e)}`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 3) {
      let a = rng.int(11, 999);
      if (a % 10 === 0) a += rng.int(1, 9);
      const n = rng.int(2, 9);
      return {
        cheie: `znat:${a}x${n}`, fapt: `${a}x${n}`,
        enunt: `${zec(a, 1)} · ${n} = ?`,
        mecanica: { tip: "expresie", text: `${zec(a, 1)} · ${n}` },
        raspuns: Z(a * n, 1),
        indicii: ["Înmulțește ca și cum n-ar fi virgulă.", `${a} · ${n} = ${a * n}; rezultatul are tot atâtea zecimale cât factorul zecimal (una).`, `${zec(a, 1)} · ${n} = ${zec(a * n, 1)}`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    if (tip === 4) {
      let a = rng.int(11, 99), b = rng.int(11, 99);
      if (a % 10 === 0) a += 1;
      if (b % 10 === 0) b += 3;
      return {
        cheie: `zz:${a}x${b}`, fapt: `${a}x${b}`,
        enunt: `${zec(a, 1)} · ${zec(b, 1)} = ?`,
        mecanica: { tip: "expresie", text: `${zec(a, 1)} · ${zec(b, 1)}` },
        raspuns: Z(a * b, 2),
        indicii: ["Înmulțește numerele fără virgulă.", `${a} · ${b} = ${a * b}; numără zecimalele factorilor: 1 + 1 = 2.`, `${zec(a, 1)} · ${zec(b, 1)} = ${zec(a * b, 2)}`],
        dificultate: dif(nivel, 5, 2),
      };
    }
    // media aritmetică: media are cel mult două zecimale (pentru 3 note, suma trebuie să se împartă la 3)
    const n = rng.int(2, 4);
    const note = Array.from({ length: n }, () => rng.int(5, 10));
    while (((note.reduce((x, y) => x + y, 0) * 100) % n) !== 0) note[n - 1] = note[n - 1] === 10 ? 5 : note[n - 1] + 1;
    const suma = note.reduce((x, y) => x + y, 0);
    const m100 = (suma * 100) / n;
    return {
      cheie: `media:${note.join(",")}`, fapt: note.join(","),
      enunt: `Ana are notele ${note.join(", ")}. Care este media lor aritmetică?`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: Z(m100, 2),
      indicii: ["Media aritmetică = suma numerelor : câte numere sunt.", `Suma: ${note.join(" + ")} = ${suma}.`, `${suma} : ${n} = ${zec(m100, 2)}`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

// ───────── geometrie și măsurări ─────────

export const segmente: Subiect = {
  id: "v.segmente",
  titlu: "Segmente",
  descriere: "Lungimea, mijlocul, puncte coliniare",
  domeniu: "geometrie",
  clase: [5],
  icon: "📏",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? 0 : rng.int(0, 2);
    if (tip === 0 && rng.bool(0.5)) {
      const AM = rng.int(2, 45);
      return {
        cheie: `mij-inv:${AM}`, fapt: `${2 * AM}`,
        enunt: `M este mijlocul segmentului AB și AM = ${AM} cm. Cât măsoară AB (în cm)?`,
        mecanica: { tip: "bara", parti: [{ eticheta: "AM", valoare: AM, culoare: "#f9c50f" }, { eticheta: "MB", valoare: null }], total: null },
        raspuns: { tip: "numar", valoare: 2 * AM },
        indicii: ["Mijlocul împarte segmentul în două părți egale: AM = MB.", `AB = AM + MB = ${AM} + ${AM}`, `AB = ${2 * AM} cm`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 0) {
      const AB = 2 * rng.int(2, 40);
      return {
        cheie: `mij:${AB}`, fapt: `${AB}`,
        enunt: `Segmentul AB are ${AB} cm, iar M este mijlocul lui. Cât măsoară AM (în cm)?`,
        mecanica: { tip: "bara", parti: [{ eticheta: "AM", valoare: null, culoare: "#f9c50f" }, { eticheta: "MB", valoare: null }], total: AB },
        raspuns: { tip: "numar", valoare: AB / 2 },
        indicii: ["Mijlocul împarte segmentul în două segmente egale (congruente).", `AM = MB = AB : 2`, `AM = ${AB} : 2 = ${AB / 2} cm`],
        dificultate: dif(nivel, 5),
      };
    }
    const AB = rng.int(3, 30), BC = rng.int(2, 25);
    const intre = tip === 1;
    // tip 1: B între A și C → AC = AB + BC; tip 2: C între A și B → AC = AB − BC
    const bc = intre ? BC : Math.min(BC, AB - 1);
    const AC = intre ? AB + bc : AB - bc;
    return {
      cheie: `colin:${tip}:${AB}:${bc}`, fapt: `${AB}:${bc}`,
      enunt: intre ? `Punctele A, B, C sunt coliniare, în această ordine. AB = ${AB} cm și BC = ${bc} cm. Cât este AC?` : `Punctul C se află pe segmentul AB. AB = ${AB} cm și CB = ${bc} cm. Cât este AC?`,
      mecanica: intre
        ? { tip: "bara", parti: [{ eticheta: "AB", valoare: AB }, { eticheta: "BC", valoare: bc, culoare: "#2f6fd1" }], total: null }
        : { tip: "bara", parti: [{ eticheta: "AC", valoare: null, culoare: "#f9c50f" }, { eticheta: "CB", valoare: bc, culoare: "#2f6fd1" }], total: AB },
      raspuns: { tip: "numar", valoare: AC },
      indicii: ["Desenează punctele pe o dreaptă, în ordinea dată.", intre ? "AC este format din AB și BC, puse cap la cap." : "AC este ce rămâne din AB după ce scoți CB.", `AC = ${intre ? `${AB} + ${bc}` : `${AB} − ${bc}`} = ${AC} cm`],
      dificultate: dif(nivel, 5),
    };
  },
};

export const unghiuri5: Subiect = {
  id: "v.unghiuri",
  titlu: "Unghiuri: măsură și calcule",
  descriere: "Clasificare; grade și minute",
  domeniu: "geometrie",
  clase: [5],
  icon: "📐",
  exercitiu(rng: Rng, nivel) {
    if (nivel === "usor" || rng.bool(0.35)) {
      const grade = rng.pick([0, 180, 90, rng.int(5, 85), rng.int(95, 175)]);
      const tip = grade === 0 ? "nul" : grade === 180 ? "alungit" : grade === 90 ? "drept" : grade < 90 ? "ascuțit" : "obtuz";
      return {
        cheie: `u5cls:${grade}`, fapt: tip,
        enunt: `Un unghi are ${grade}°. Cum se numește?`,
        mecanica: { tip: "unghi", grade: Math.max(grade, 1), rotatie: 0 },
        raspuns: { tip: "optiune", valoare: tip, optiuni: ["nul", "ascuțit", "drept", "obtuz", "alungit"] },
        indicii: ["Nul = 0°; ascuțit < 90°; drept = 90°; obtuz între 90° și 180°; alungit = 180°.", `Compară ${grade}° cu 90° și cu 180°.`, `Unghiul este ${tip}.`],
        dificultate: dif(nivel, 5),
      };
    }
    // grade și minute: adunare / scădere
    const g1 = rng.int(10, 120), m1 = rng.int(0, 59), g2 = rng.int(5, 60), m2 = rng.int(0, 59);
    const plus = rng.bool();
    let t = plus ? (g1 * 60 + m1) + (g2 * 60 + m2) : (g1 * 60 + m1) - (g2 * 60 + m2);
    if (t < 0) t = (g1 * 60 + m1) + (g2 * 60 + m2);
    const realPlus = plus || (g1 * 60 + m1) < (g2 * 60 + m2);
    const e = `${g1}°${m1}′ ${realPlus ? "+" : "−"} ${g2}°${m2}′`;
    return {
      cheie: `u5calc:${e}`, fapt: e,
      enunt: `${e} = ?`,
      mecanica: { tip: "expresie", text: e },
      raspuns: { tip: "campuri", valori: [Math.floor(t / 60), t % 60], etichete: ["grade", "minute"] },
      indicii: ["1° = 60′. Calculează separat gradele și minutele.", realPlus ? "Dacă minutele trec de 60, transformă 60′ într-un grad." : "Dacă nu ajung minutele, împrumută un grad (= 60′).", `${e} = ${Math.floor(t / 60)}°${t % 60}′`],
      dificultate: dif(nivel, 5, 1),
    };
  },
};

export const arieVolum: Subiect = {
  id: "v.arie-volum",
  titlu: "Arii și volume",
  descriere: "Pătrat, dreptunghi, cub, paralelipiped; unități",
  domeniu: "geometrie",
  clase: [5],
  icon: "📦",
  exercitiu(rng, nivel) {
    const tip = nivel === "usor" ? rng.int(0, 1) : nivel === "mediu" ? rng.int(0, 3) : rng.int(2, 4);
    if (tip === 0) {
      const L = rng.int(2, 25), l = rng.int(1, L);
      return {
        cheie: `a5:${L}:${l}`, fapt: `${L}x${l}`,
        enunt: L === l ? `Care este aria pătratului cu latura ${L} cm (în cm²)?` : `Care este aria dreptunghiului cu L = ${L} cm și l = ${l} cm (în cm²)?`,
        mecanica: { tip: "grila", latime: 9, inaltime: 7, celule: [], laturi: { L, l } },
        raspuns: { tip: "numar", valoare: L * l },
        indicii: ["Aria dreptunghiului = lungimea · lățimea; aria pătratului = latura · latura.", `${L} · ${l}`, `${L * l} cm²`],
        dificultate: dif(nivel, 5),
      };
    }
    if (tip === 1 || tip === 2) {
      const cub = tip === 1;
      const a = rng.int(2, 12), b = cub ? a : rng.int(2, 15), c = cub ? a : rng.int(2, 10);
      return {
        cheie: `v5:${a}:${b}:${c}`, fapt: `${a}x${b}x${c}`,
        enunt: cub ? `Care este volumul cubului cu muchia ${a} cm (în cm³)?` : `Care este volumul paralelipipedului cu dimensiunile ${a} cm, ${b} cm și ${c} cm (în cm³)?`,
        mecanica: { tip: "corp", corp: cub ? "cub" : "paralelipiped", culoare: "#6a59a7" },
        raspuns: { tip: "numar", valoare: a * b * c },
        indicii: [cub ? "Volumul cubului = muchia · muchia · muchia." : "Volumul paralelipipedului = lungimea · lățimea · înălțimea.", `${a} · ${b} · ${c}`, `${a * b * c} cm³`],
        dificultate: dif(nivel, 5, 1),
      };
    }
    // transformări de arie și volum
    const reg: [string, string, number][] = [["m²", "dm²", 100], ["dm²", "cm²", 100], ["m²", "cm²", 10000], ["m³", "dm³", 1000], ["dm³", "cm³", 1000], ["dm³", "l", 1], ["l", "cm³", 1000], ["ha", "m²", 10000]];
    const [mare, mic, f] = rng.pick(reg);
    const x = rng.int(1, 30);
    const jos = rng.bool();
    return {
      cheie: `tr5:${x}:${mare}:${jos}`, fapt: `${mare}${mic}`,
      enunt: jos ? `${x} ${mare} = ? ${mic}` : `${fmt(x * f)} ${mic} = ? ${mare}`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: jos ? x * f : x },
      indicii: [`1 ${mare} = ${fmt(f)} ${mic}.`, mare.includes("²") ? "La arii, fiecare treaptă înseamnă ×100." : mare.includes("³") ? "La volume, fiecare treaptă înseamnă ×1000." : "1 dm³ = 1 litru.", jos ? `${x} · ${fmt(f)} = ${fmt(x * f)} ${mic}` : `${fmt(x * f)} : ${fmt(f)} = ${x} ${mare}`],
      dificultate: dif(nivel, 5),
    };
  },
};

export const SUBIECTE_CLASA5 = [puteri, ordineaOperatiilor5, factorComun, reducereUnitate, metode, divizibilitate, numerePrime, fractiiEchivalente, comparareFractii5, operatiiFractii5, zecimale, operatiiZecimale, segmente, unghiuri5, arieVolum];
