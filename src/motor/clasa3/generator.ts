import { Rng } from "@/motor/rng";
import { evalueaza, exercitiuBloc, fmt, hash, type Partial as PartialCalcul } from "@/motor/calcul/generator";
import type { Bloc } from "@/motor/calcul/tipuri";
import { cuSubstantiv, numarInLitere } from "@/motor/limba";
import { roman } from "@/motor/generatoare/fractii-masuri";
import { cateBune, type CateBune } from "@/motor/cateBune";
import type { CapitolC3, ConfigC3, Fata, FelItem, ItemC3, JocC3, RaspunsC3, Verificare } from "./tipuri";

type Nou = Omit<ItemC3, "id">;
const CTX = { x: "×", nec: "□" };

// ───────────────────────── utilitare ─────────────────────────

/** Expresie ASCII („2 * (3 + 4)”) → text de afișat („2 × (3 + 4)”) */
export const afisExpr = (e: string) =>
  e.replace(/\d+/g, (n) => fmt(Number(n))).replace(/\*/g, "×").replace(/ \/ /g, " : ").replace(/ - /g, " − ");

function variante(rng: Rng, corect: string, gresite: string[], n = 4): string[] {
  const v = [corect];
  for (const g of rng.shuffle(gresite)) if (!v.includes(g) && v.length < n) v.push(g);
  return rng.shuffle(v);
}

const SEMNE = ["<", "=", ">"];
const semn = (a: number, b: number): "<" | ">" | "=" => (a < b ? "<" : a > b ? ">" : "=");

const NUMITOR: Record<number, [string, string]> = {
  2: ["o doime", "doimi"], 3: ["o treime", "treimi"], 4: ["o pătrime", "pătrimi"], 5: ["o cincime", "cincimi"], 6: ["o șesime", "șesimi"],
  7: ["o șeptime", "șeptimi"], 8: ["o optime", "optimi"], 9: ["o noime", "noimi"], 10: ["o zecime", "zecimi"],
};
export function fractieInLitere(a: number, b: number): string {
  if (a === 1) return NUMITOR[b][0];
  return `${a === 2 ? "două" : numarInLitere(a)} ${NUMITOR[b][1]}`;
}

/** Itemul din motorul de calcul (deja verificat) → item de clasa a III-a */
function dinCalcul(p: PartialCalcul | null, capitol: CapitolC3): Nou | null {
  if (!p) return null;
  const r = p.raspuns;
  let verificare: Verificare;
  if (p.expresie.includes("=")) verificare = { tip: "ecuatie", expr: p.expresie, valoare: (r as { valoare: number }).valoare };
  else if (r.tip === "rest") {
    const [d, i] = p.expresie.split("/").map((x) => Number(x.trim()));
    verificare = { tip: "rest", d, i, c: r.cat, r: r.rest };
  } else verificare = { tip: "egal", expr: p.expresie, valoare: r.valoare };
  const raspuns: RaspunsC3 = r.tip === "rest" ? { tip: "rest", cat: r.cat, rest: r.rest } : { tip: "numar", valoare: r.valoare };
  const afis = r.tip === "rest" ? `${fmt(r.cat)} rest ${fmt(r.rest)}` : `${p.inainte ? `${p.inainte} ` : ""}${fmt(r.valoare)}`;
  const indiciu = r.tip === "rest"
    ? `Caută cel mai mare număr care înmulțit cu împărțitorul nu depășește deîmpărțitul. Restul trebuie să fie mai mic decât împărțitorul.`
    : verificare.tip === "ecuatie"
      ? "Folosește operația inversă: la adunare scazi, la scădere aduni, la înmulțire împarți, la împărțire înmulțești."
      : p.text.includes("(") || /[+−] .*[×:]|[×:] .*[+−]/.test(p.text)
        ? "Întâi parantezele, apoi înmulțirile și împărțirile (de la stânga la dreapta), apoi adunările și scăderile."
        : "Calculează pe rând, începând cu unitățile. Nu uita trecerea peste ordin!";
  return { cheie: `${capitol}:${p.cheie}`, capitol, fel: "exercitiu", text: p.text, raspuns, afis, indiciu, verificare };
}

const bloc = (b: Partial<Bloc> & Pick<Bloc, "tip">): Bloc => ({ nr: 1, min: 0, max: 100, rezultatInInterval: true, ...b }) as Bloc;

/** Item numeric simplu */
function numeric(capitol: CapitolC3, cheie: string, text: string, expr: string, valoare: number, indiciu: string, extra: Partial<Nou> = {}): Nou {
  return { cheie: `${capitol}:${cheie}`, capitol, fel: "exercitiu", text, raspuns: { tip: "numar", valoare }, afis: fmt(valoare), indiciu, verificare: { tip: "egal", expr, valoare }, ...extra };
}

function cuVariante(capitol: CapitolC3, cheie: string, text: string, corect: string, gresite: string[], rng: Rng, verificare: Verificare, indiciu: string, extra: Partial<Nou> = {}): Nou {
  return { cheie: `${capitol}:${cheie}`, capitol, fel: "exercitiu", text, raspuns: { tip: "varianta", valoare: corect, variante: variante(rng, corect, gresite) }, afis: corect, indiciu, verificare, ...extra };
}

/** număr de 4 cifre fără zerouri peste tot (pentru exerciții de numerație) */
const nr4 = (rng: Rng) => rng.int(1000, 9999);

// ───────────────────────── 1. numerele naturale ─────────────────────────

function exNumere(rng: Rng, cfg: ConfigC3): Nou | null {
  const tip = rng.pick(cfg.optiuni.numere.length ? cfg.optiuni.numere : (["descompunere"] as const));
  const n = nr4(rng);
  switch (tip) {
    case "citire":
      return numeric("numere", `cit${n}`, `Scrie cu cifre: ${numarInLitere(n)}`, String(n), n, "Scrie întâi miile, apoi sutele, zecile și unitățile. Unde lipsește un ordin, pui 0.");
    case "descompunere": {
      if (rng.bool()) {
        const parti = [1000, 100, 10, 1].map((p) => Math.floor(n / p) % 10 * p).filter(Boolean);
        return numeric("numere", `comp${n}`, `${parti.map(fmt).join(" + ")} =`, parti.join(" + "), n, "Adună miile, sutele, zecile și unitățile: fiecare cifră stă la locul ordinului ei.");
      }
      const [ord, p] = rng.pick([["mii", 1000], ["sute", 100], ["zeci", 10], ["unități", 1]] as const);
      const c = Math.floor(n / p) % 10;
      return numeric("numere", `cif${n}${ord}`, `Cifra ${ord === "mii" ? "miilor" : ord === "sute" ? "sutelor" : ord === "zeci" ? "zecilor" : "unităților"} din ${fmt(n)} este`, String(c), c,
        "Numără de la dreapta: unități, zeci, sute, mii.");
    }
    case "comparare": {
      const m = rng.bool(0.25) ? n : rng.bool() ? Number(String(n).split("").reverse().join("")) || n + 1 : n + rng.pick([-100, -10, -1, 1, 10, 100, 1000 - 1]);
      if (m < 0 || m > 10000) return null;
      const s = semn(n, m);
      return cuVariante("numere", `cmp${n}:${m}`, `${fmt(n)} ○ ${fmt(m)}`, s, SEMNE, rng, { tip: "comparatie", st: String(n), dr: String(m), semn: s },
        "Compară întâi miile; dacă sunt egale, sutele, apoi zecile și unitățile.");
    }
    case "ordonare": {
      const cifre = String(n).split("");
      const set = new Set([n]);
      for (let i = 0; i < 12 && set.size < 4; i++) {
        const v = Number(rng.shuffle(cifre).join(""));
        if (v >= 1000) set.add(v);
      }
      if (set.size < 3) return null;
      const nums = [...set];
      const mare = rng.bool();
      const v = mare ? Math.max(...nums) : Math.min(...nums);
      return cuVariante("numere", `ord${mare}${nums.join(",")}`, `Cel mai ${mare ? "mare" : "mic"} număr dintre ${nums.map(fmt).join(", ")} este`, fmt(v), nums.map(fmt), rng,
        { tip: "max", numere: mare ? nums : nums.map((x) => -x), valoare: mare ? v : -v }, "Compară cifrele de la stânga la dreapta: miile, apoi sutele…");
    }
    case "rotunjire": {
      const [la, nume] = rng.pick([[10, "zeci"], [100, "sute"], [1000, "mii"]] as const);
      if (n % la === 0) return null;
      const r = Math.round(n / la) * la; // .5 → în sus (numere pozitive)
      return numeric("numere", `rot${n}:${la}`, `Rotunjește ${fmt(n)} la ${nume}:`, `${r}`, r,
        `Uită-te la cifra din dreapta ordinului ${nume === "zeci" ? "zecilor" : nume === "sute" ? "sutelor" : "miilor"}: dacă e 5 sau mai mare, rotunjești în sus.`,
        { verificare: { tip: "egal", expr: `${r}`, valoare: Math.floor((n + la / 2) / la) * la } });
    }
    case "romane": {
      const v = rng.bool(0.6) ? rng.int(1, 100) : rng.int(100, 2000);
      const R = roman(v);
      if (rng.bool()) return numeric("numere", `rom${v}`, `${R} =`, String(v), v, "I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1 000. O cifră mai mică în fața uneia mai mari se scade.",
        { verificare: { tip: "roman", roman: R, valoare: v } });
      const gresite = [roman(v + 1), roman(Math.max(1, v - 1)), roman(v + 10), R.split("").reverse().join(""), roman(v + 5)].filter((g) => g !== R);
      return cuVariante("numere", `romS${v}`, `Scrie cu cifre romane: ${fmt(v)}`, R, gresite, rng, { tip: "roman", roman: R, valoare: v },
        "Descompune numărul: mii, sute, zeci, unități și scrie fiecare parte cu cifre romane.");
    }
  }
}

// ───────────────────────── 2. adunare și scădere ─────────────────────────

function exAdunare(rng: Rng, cfg: ConfigC3): Nou | null {
  const o = cfg.optiuni.adunare;
  if (o.necunoscut && rng.bool(0.4))
    return dinCalcul(exercitiuBloc(rng, bloc({ tip: "ecuatii", min: 100, max: 10000, operatii: ["+", "-"] }), CTX), "adunare");
  const tip = rng.bool() ? "adunare" : "scadere";
  const [min, max] = rng.pick([[100, 1000], [100, 10000], [1000, 10000]] as const);
  return dinCalcul(exercitiuBloc(rng, bloc({ tip, min, max, trecere: o.trecere }), CTX), "adunare");
}

// ───────────────────────── 3. înmulțire ─────────────────────────

function exInmultire(rng: Rng, cfg: ConfigC3): Nou | null {
  const o = cfg.optiuni.inmultire;
  const tip = rng.pick(o.tipuri.length ? o.tipuri : (["tabla"] as const));
  switch (tip) {
    case "tabla":
      return dinCalcul(exercitiuBloc(rng, bloc({ tip: "inmultire", min: 1, tabele: [2, 3, 4, 5, 6, 7, 8, 9, 10] }), CTX), "inmultire");
    case "x10": {
      const p = rng.pick([10, 100, 1000]);
      const a = rng.int(2, Math.floor(10000 / p));
      return numeric("inmultire", `x${a}:${p}`, `${fmt(a)} × ${fmt(p)} =`, `${a} * ${p}`, a * p, `Când înmulțești cu ${fmt(p)}, adaugi ${String(p).length - 1} ${p === 10 ? "zero" : "zerouri"} la sfârșitul numărului.`);
    }
    case "1cifra": {
      const a = rng.int(10, 999), b = rng.int(2, 9);
      if (a * b > 10000) return null;
      const trecere = String(a).split("").some((d) => Number(d) * b >= 10);
      if (o.trecere === "fara" && trecere) return null;
      if (o.trecere === "cu" && !trecere) return null;
      return numeric("inmultire", `m${a}x${b}`, `${fmt(a)} × ${b} =`, `${a} * ${b}`, a * b, `Înmulțește pe rând unitățile, zecile și sutele cu ${b}; ce trece de 9 se adaugă la ordinul următor.`);
    }
    case "2cifre":
      return dinCalcul(exercitiuBloc(rng, bloc({ tip: "inmultire", min: 11, max: 99, min2: 11, max2: 99, rezultatInInterval: false }), CTX), "inmultire");
    case "proprietati": {
      const a = rng.int(2, 9), b = rng.int(2, 12), c = rng.int(2, 9);
      const forma = rng.int(0, 2);
      if (forma === 0) return { ...numeric("inmultire", `com${a}:${b}`, `${b} × ${a} = ${a} × □`, "", b, "Comutativitatea: dacă schimbăm ordinea factorilor, produsul nu se schimbă."), verificare: { tip: "ecuatie", expr: `${b} * ${a} = ${a} * x`, valoare: b }, afis: `□ = ${b}` };
      if (forma === 1) return { ...numeric("inmultire", `asoc${a}:${b}:${c}`, `(${a} × ${b}) × ${c} = ${a} × (□ × ${c})`, "", b, "Asociativitatea: putem grupa factorii cum vrem; produsul rămâne același."), verificare: { tip: "ecuatie", expr: `(${a} * ${b}) * ${c} = ${a} * (x * ${c})`, valoare: b }, afis: `□ = ${b}` };
      const d = rng.int(2, 9);
      if (b === d) return null;
      return { ...numeric("inmultire", `fc${a}:${b}:${d}`, `${a} × ${b} + ${a} × ${d} = ${a} × (${b} + □)`, "", d, "Factorul comun: a × b + a × c = a × (b + c)."), verificare: { tip: "ecuatie", expr: `${a} * ${b} + ${a} * ${d} = ${a} * (${b} + x)`, valoare: d }, afis: `□ = ${d}` };
    }
  }
}

// ───────────────────────── 4. împărțire ─────────────────────────

function exImpartire(rng: Rng, cfg: ConfigC3): Nou | null {
  const o = cfg.optiuni.impartire;
  const tip = rng.pick(o.tipuri.length ? o.tipuri : (["tabla"] as const));
  if (tip === "tabla") return dinCalcul(exercitiuBloc(rng, bloc({ tip: "impartire", min: 1, tabele: [2, 3, 4, 5, 6, 7, 8, 9, 10], rest: "exacta" }), CTX), "impartire");
  return dinCalcul(exercitiuBloc(rng, bloc({ tip: "impartire", min: 10, max: 999, min2: 2, max2: 9, rest: o.rest }), CTX), "impartire");
}

// ───────────────────────── 5. ordinea operațiilor ─────────────────────────

function exOrdine(rng: Rng, cfg: ConfigC3): Nou | null {
  const p = cfg.optiuni.ordine.paranteze;
  const paranteze = p === "cu" || (p === "amestecat" && rng.bool());
  return dinCalcul(exercitiuBloc(rng, bloc({ tip: "combinate", min: 1, max: 100, min2: 2, max2: 10, operatii: ["+", "-", "×", ":"], nrOperatii: rng.int(2, 3), paranteze, rezultatInInterval: false }), CTX), "ordine");
}

// ───────────────────────── 6. fracții ─────────────────────────

const fr = (a: number, b: number) => `${a}/${b}`;

function exFractii(rng: Rng, cfg: ConfigC3): Nou | null {
  const tip = rng.pick(cfg.optiuni.fractii.length ? cfg.optiuni.fractii : (["reprezentare"] as const));
  const b = rng.int(2, 10);
  const a = rng.int(1, b - 1);
  switch (tip) {
    case "citire": {
      if (rng.bool())
        return cuVariante("fractii", `cit${a}/${b}`, `Scrie cu cifre fracția „${fractieInLitere(a, b)}”:`, fr(a, b), [fr(b, a), fr(a, b === 10 ? 9 : b + 1), fr(Math.min(a + 1, 10), b), fr(a, Math.max(2, b - 1))], rng,
          { tip: "fractie", num: a, den: b, text: fractieInLitere(a, b) }, "Primul cuvânt spune câte părți luăm (numărătorul), al doilea în câte părți egale împărțim (numitorul).");
      return cuVariante("fractii", `cit2${a}/${b}`, `Fracția ${fr(a, b)} se citește:`, fractieInLitere(a, b),
        [fractieInLitere(b > a + 1 ? a + 1 : Math.max(1, a - 1), b), a < 11 && a > 1 ? fractieInLitere(b, Math.min(a, 10)) : fractieInLitere(a, b === 10 ? 9 : b + 1), fractieInLitere(a, b === 2 ? 3 : b - 1)], rng,
        { tip: "fractie", num: a, den: b, text: fractieInLitere(a, b) }, "Numărătorul (sus) spune câte părți luăm; numitorul (jos) în câte părți egale împărțim.");
    }
    case "reprezentare": {
      const forma = rng.pick(["cerc", "dreptunghi"] as const);
      return cuVariante("fractii", `rep${a}/${b}${forma}`, "Ce fracție este colorată?", fr(a, b), [fr(b - a, b), fr(b, a), fr(a, b + 1), fr(a + 1, b)].filter((x) => x !== fr(a, b)), rng,
        { tip: "fractie", num: a, den: b, text: fractieInLitere(a, b) }, "Numără toate părțile egale (numitorul), apoi părțile colorate (numărătorul).",
        { fractie: { parti: b, colorate: a, forma } });
    }
    case "comparare": {
      let st: [number, number], dr: [number, number];
      if (rng.bool()) {
        const c = rng.int(1, 9);
        st = [a, b]; dr = [rng.bool(0.2) ? a : Math.min(c, 10), b];
      } else {
        const d = rng.int(2, 10);
        st = [a, b]; dr = [a, rng.bool(0.2) ? b : d];
      }
      const s = semn(st[0] * dr[1], dr[0] * st[1]);
      return cuVariante("fractii", `cmp${st}:${dr}`, `${fr(...st)} ○ ${fr(...dr)}`, s, SEMNE, rng, { tip: "comparatie", st: fr(...st), dr: fr(...dr), semn: s },
        st[1] === dr[1] ? "Același numitor: mai mare e fracția cu numărătorul mai mare." : "Același numărător: mai mare e fracția cu numitorul mai mic (părțile sunt mai mari).");
    }
    case "tip": {
      const num = rng.int(1, 2 * b);
      const clasa = num < b ? "subunitară" : num === b ? "echiunitară" : "supraunitară";
      return cuVariante("fractii", `tip${num}/${b}`, `Fracția ${fr(num, b)} este:`, clasa, ["subunitară", "echiunitară", "supraunitară"], rng,
        { tip: "clasa-fractie", num, den: b, clasa }, "Compară numărătorul cu numitorul: mai mic → subunitară, egal → echiunitară, mai mare → supraunitară.");
    }
    case "din-intreg": {
      const k = rng.int(2, 12);
      const n = b * k;
      return numeric("fractii", `din${a}/${b}:${n}`, `${fr(a, b)} din ${fmt(n)} =`, `${n} / ${b} * ${a}`, k * a, `Împarte întregul în ${b} părți egale (${n} : ${b} = ${k}), apoi ia ${a} ${a === 1 ? "parte" : "părți"}.`);
    }
  }
}

// ───────────────────────── 7. geometrie și unități de măsură ─────────────────────────

interface Conv { mare: string; mic: string; f: number; cuvinte?: [string, string, string, string] }
const CONVERSII: Record<"lungime" | "capacitate" | "masa" | "timp" | "bani", Conv[]> = {
  lungime: [{ mare: "km", mic: "m", f: 1000 }, { mare: "m", mic: "cm", f: 100 }, { mare: "m", mic: "dm", f: 10 }, { mare: "dm", mic: "cm", f: 10 }, { mare: "cm", mic: "mm", f: 10 }, { mare: "m", mic: "mm", f: 1000 }],
  capacitate: [{ mare: "l", mic: "ml", f: 1000 }],
  masa: [{ mare: "kg", mic: "g", f: 1000 }],
  timp: [
    { mare: "oră", mic: "minut", f: 60, cuvinte: ["oră", "ore", "minut", "minute"] },
    { mare: "minut", mic: "secundă", f: 60, cuvinte: ["minut", "minute", "secundă", "secunde"] },
    { mare: "zi", mic: "oră", f: 24, cuvinte: ["zi", "zile", "oră", "ore"] },
    { mare: "săptămână", mic: "zi", f: 7, cuvinte: ["săptămână", "săptămâni", "zi", "zile"] },
    { mare: "an", mic: "lună", f: 12, cuvinte: ["an", "ani", "lună", "luni"] },
  ],
  bani: [{ mare: "leu", mic: "ban", f: 100, cuvinte: ["leu", "lei", "ban", "bani"] }],
};
const cuUnitate = (n: number, c: Conv, mare: boolean) => (c.cuvinte ? cuSubstantiv(n, c.cuvinte[mare ? 0 : 2], c.cuvinte[mare ? 1 : 3]) : `${fmt(n)} ${mare ? c.mare : c.mic}`);
const unitate = (c: Conv, mare: boolean) => (c.cuvinte ? c.cuvinte[mare ? 1 : 3] : mare ? c.mare : c.mic);

/** o mărime: „2 m 5 cm” → valoarea în unitatea mică */
function marime(rng: Rng, c: Conv): { text: string; expr: string; val: number } {
  const A = rng.int(1, c.f >= 100 ? 9 : 5);
  const B = rng.bool(0.6) ? rng.int(1, c.f - 1) : 0;
  return { text: B ? `${cuUnitate(A, c, true)} ${cuUnitate(B, c, false)}` : cuUnitate(A, c, true), expr: B ? `${A} * ${c.f} + ${B}` : `${A} * ${c.f}`, val: A * c.f + B };
}

function exConversie(rng: Rng, fel: keyof typeof CONVERSII): Nou | null {
  const c = rng.pick(CONVERSII[fel]);
  if (rng.bool(0.3)) {
    // mic → mare (multiplu exact)
    const A = rng.int(2, 9);
    return numeric("masuri", `cv${c.mic}>${A * c.f}`, `${cuUnitate(A * c.f, c, false)} = □ ${unitate(c, true)}`, `${A * c.f} / ${c.f}`, A,
      `1 ${c.cuvinte ? c.cuvinte[0] : c.mare} = ${cuUnitate(c.f, c, false)}. Împarte la ${c.f}.`, { afis: `□ = ${A}` });
  }
  const m = marime(rng, c);
  return numeric("masuri", `cv${m.text}`, `${m.text} = □ ${unitate(c, false)}`, m.expr, m.val,
    `1 ${c.cuvinte ? c.cuvinte[0] : c.mare} = ${cuUnitate(c.f, c, false)}. Înmulțește, apoi adună ce mai este.`, { afis: `□ = ${fmt(m.val)}` });
}

function figuraPerimetru(rng: Rng): Nou {
  const unitate = "cm";
  const t = rng.int(0, 2);
  if (t === 0) {
    const L = rng.int(3, 9), l = rng.int(1, L - 1);
    return numeric("masuri", `pd${L}x${l}`, `Perimetrul dreptunghiului cu lungimea ${L} cm și lățimea ${l} cm este (în cm)`, `2 * (${L} + ${l})`, 2 * (L + l),
      "Perimetrul = suma lungimilor tuturor laturilor: L + l + L + l.", { figura: { tip: "dreptunghi", L, l, unitate, grila: true }, verificare: { tip: "perimetru", laturi: [L, l, L, l], valoare: 2 * (L + l) } });
  }
  if (t === 1) {
    const l = rng.int(2, 9);
    return numeric("masuri", `pp${l}`, `Perimetrul pătratului cu latura de ${l} cm este (în cm)`, `4 * ${l}`, 4 * l,
      "Pătratul are 4 laturi egale: P = 4 × latura.", { figura: { tip: "patrat", l, unitate, grila: true }, verificare: { tip: "perimetru", laturi: [l, l, l, l], valoare: 4 * l } });
  }
  // inegalitatea triunghiului: c între |a − b| + 1 și a + b − 1
  const a = rng.int(3, 15), b = rng.int(3, 15);
  const c = rng.int(Math.max(3, Math.abs(a - b) + 1), Math.min(15, a + b - 1));
  return numeric("masuri", `pt${a}:${b}:${c}`, `Perimetrul triunghiului cu laturile de ${a} cm, ${b} cm și ${c} cm este (în cm)`, `${a} + ${b} + ${c}`, a + b + c,
    "Adună lungimile celor trei laturi.", { figura: { tip: "triunghi", a, b, c, unitate }, verificare: { tip: "perimetru", laturi: [a, b, c], valoare: a + b + c } });
}

function exMasuri(rng: Rng, cfg: ConfigC3): Nou | null {
  const tip = rng.pick(cfg.optiuni.masuri.length ? cfg.optiuni.masuri : (["lungime"] as const));
  return tip === "perimetru" ? figuraPerimetru(rng) : exConversie(rng, tip);
}

// ───────────────────────── 8. probleme ─────────────────────────

const NUME = ["Ana", "Mihai", "Ioana", "Radu", "Maria", "Andrei", "Elena", "Tudor", "Sofia", "Luca", "Daria", "Matei"];
const LUCRURI = [["timbre", "timbre"], ["cărți", "cărți"], ["bile", "bile"], ["nuci", "nuci"], ["abțibilduri", "abțibilduri"], ["creioane", "creioane"]] as const;

function exProbleme(rng: Rng, cfg: ConfigC3): Nou | null {
  const metoda = rng.pick(cfg.optiuni.probleme.length ? cfg.optiuni.probleme : (["figurativa"] as const));
  const [A, B] = rng.shuffle(NUME);
  const [obiecte] = rng.pick(LUCRURI);
  if (metoda === "figurativa") {
    const x = rng.int(5, 300);
    if (rng.bool()) {
      const d = rng.int(2, 150), S = 2 * x + d;
      const mare = rng.bool();
      const v = mare ? x + d : x;
      return {
        ...numeric("probleme", `fs${x}:${d}:${mare}`, `${A} și ${B} au împreună ${fmt(S)} ${obiecte}. ${B} are cu ${d} mai multe decât ${A}. Câte ${obiecte} are ${mare ? B : A}?`, "", v,
          `Desenează două segmente: al lui ${B} e mai lung cu ${d}. Scazi ${d} din total: ${fmt(S)} − ${d} = ${fmt(2 * x)}, apoi împarți la 2.`),
        verificare: { tip: "ecuatie", expr: mare ? `x + (x - ${d}) = ${S}` : `x + (x + ${d}) = ${S}`, valoare: v },
      };
    }
    const k = rng.int(2, 5), x2 = rng.int(4, Math.floor(2000 / (k + 1)));
    const S = x2 * (k + 1);
    const mare = rng.bool();
    const v = mare ? k * x2 : x2;
    return {
      ...numeric("probleme", `fk${x2}:${k}:${mare}`, `${A} și ${B} au împreună ${fmt(S)} ${obiecte}. ${B} are de ${k} ori mai multe decât ${A}. Câte ${obiecte} are ${mare ? B : A}?`, "", v,
        `Desenează: ${A} — un segment, ${B} — ${k} segmente la fel. În total sunt ${k + 1} segmente egale: ${fmt(S)} : ${k + 1} = ${fmt(x2)}.`),
      verificare: { tip: "ecuatie", expr: mare ? `x + x / ${k} = ${S}` : `x + ${k} * x = ${S}`, valoare: v },
    };
  }
  // mersul invers: 2–3 operații pornind de la numărul gândit
  const x = rng.int(2, 60);
  let v = x, e = "x";
  const pasi: string[] = [], invers: string[] = [];
  const nrOp = rng.int(2, 3);
  for (let i = 0; i < nrOp; i++) {
    const op = rng.pick(["+", "-", "*", "/"] as const);
    let a: number;
    if (op === "+") { a = rng.int(2, 50); v += a; pasi.push(`adun ${a}`); invers.push(`scazi ${a}`); }
    else if (op === "-") { a = rng.int(1, Math.max(1, v - 1)); if (v - a < 1) return null; v -= a; pasi.push(`scad ${a}`); invers.push(`aduni ${a}`); }
    else if (op === "*") { a = rng.int(2, 5); v *= a; pasi.push(`înmulțesc cu ${a}`); invers.push(`împarți la ${a}`); }
    else { const div = [2, 3, 4, 5].filter((d) => v % d === 0); if (!div.length) return null; a = rng.pick(div); v /= a; pasi.push(`împart la ${a}`); invers.push(`înmulțești cu ${a}`); }
    // parantezele doar unde schimbă ordinea: (x + 3) × 2, dar x × 3 + 12
    e = (op === "*" || op === "/") && /[+-]/.test(e) ? `(${e}) ${op} ${a}` : `${e} ${op} ${a}`;
  }
  if (v > 10000) return null;
  const text = `Mă gândesc la un număr. Îl ${pasi.join(", apoi ")} și obțin ${fmt(v)}. La ce număr m-am gândit?`.replace("Îl adun", "Adun la el").replace("Îl scad", "Scad din el");
  return {
    ...numeric("probleme", `mi${e}=${v}`, text, "", x, `Pornește de la sfârșit (${fmt(v)}) și fă operațiile inverse în ordine inversă: ${[...invers].reverse().join(", apoi ")}.`),
    verificare: { tip: "ecuatie", expr: `${e} = ${v}`, valoare: x },
  };
}

// ───────────────────────── formatele de joc ─────────────────────────

const EX: Record<CapitolC3, (rng: Rng, cfg: ConfigC3) => Nou | null> = {
  numere: exNumere, adunare: exAdunare, inmultire: exInmultire, impartire: exImpartire, ordine: exOrdine, fractii: exFractii, masuri: exMasuri, probleme: exProbleme,
};

/** Memory: calcul ↔ rezultat (sau desen ↔ fracție, cifre romane ↔ număr) */
function pereche(rng: Rng, cap: CapitolC3, cfg: ConfigC3): Nou | null {
  if (cap === "fractii" && rng.bool(0.6)) {
    const b = rng.int(2, 10), a = rng.int(1, b - 1);
    const st: Fata = rng.bool() ? { text: fractieInLitere(a, b), fractie: { parti: b, colorate: a, forma: rng.pick(["cerc", "dreptunghi"] as const) } } : { text: fractieInLitere(a, b) };
    return { cheie: `p:fr${a}/${b}`, capitol: cap, fel: "pereche", text: `${st.fractie ? "desen" : st.text} ↔ ${fr(a, b)}`, st, dr: { text: fr(a, b) }, raspuns: { tip: "pereche" }, afis: fr(a, b), indiciu: "Numărătorul: câte părți luăm; numitorul: în câte părți împărțim.", verificare: { tip: "fractie", num: a, den: b, text: fractieInLitere(a, b) } };
  }
  if (cap === "numere" && rng.bool(0.5)) {
    const v = rng.int(4, 400), R = roman(v);
    return { cheie: `p:rom${v}`, capitol: cap, fel: "pereche", text: `${R} ↔ ${v}`, st: { text: R }, dr: { text: fmt(v) }, raspuns: { tip: "pereche" }, afis: fmt(v), indiciu: "I = 1, V = 5, X = 10, L = 50, C = 100.", verificare: { tip: "roman", roman: R, valoare: v } };
  }
  if (cap === "masuri") {
    const fel = rng.pick(["lungime", "masa", "capacitate", "timp", "bani"] as const);
    const cv = rng.pick(CONVERSII[fel]);
    const m = marime(rng, cv);
    const dr = cuUnitate(m.val, cv, false);
    return { cheie: `p:m${m.text}`, capitol: cap, fel: "pereche", text: `${m.text} ↔ ${dr}`, st: { text: m.text }, dr: { text: dr }, raspuns: { tip: "pereche" }, afis: dr,
      indiciu: `1 ${cv.cuvinte ? cv.cuvinte[0] : cv.mare} = ${cuUnitate(cv.f, cv, false)}.`, verificare: { tip: "egal", expr: m.expr, valoare: m.val } };
  }
  const e = EX[cap === "probleme" ? "ordine" : cap](rng, cfg);
  if (!e || e.raspuns.tip !== "numar" || e.verificare.tip !== "egal" || e.figura || e.text.length > 26 || !e.text.endsWith("=")) return null;
  const st = e.text.replace(/ =$/, "").replace(/ = □ .*/, "");
  return { ...e, cheie: `p:${e.cheie}`, fel: "pereche", text: `${st} ↔ ${e.afis}`, st: { text: st }, dr: { text: fmt(e.raspuns.valoare) }, raspuns: { tip: "pereche" }, afis: fmt(e.raspuns.valoare) };
}

/** Balanța: două expresii de comparat */
function comparatie(rng: Rng, cap: CapitolC3): Nou | null {
  const egal = rng.bool(0.3);
  const delta = () => (egal ? 0 : rng.pick([-1, 1]) * rng.pick([1, 2, 5, 10, 20, 50, 100]));
  let st: string, dr: string;
  let stText: string | undefined, drText: string | undefined;
  switch (cap === "probleme" ? "ordine" : cap) {
    case "numere": {
      const n = rng.int(10, 3000);
      if (rng.bool()) { st = String(n); stText = roman(n); dr = String(n + delta()); }
      else { st = String(nr4(rng)); dr = String(Number(st) + delta()); }
      break;
    }
    case "adunare": {
      const a = rng.int(100, 5000), b = rng.int(10, 4000);
      const v = a + b + delta();
      const d = rng.int(10, 3000), c = v + d;
      if (v < 0 || c > 10000) return null;
      st = `${a} + ${b}`; dr = `${c} - ${d}`;
      break;
    }
    case "inmultire": {
      const a = rng.int(2, 12), b = rng.int(2, 12);
      const v = a * b + (egal ? 0 : rng.pick([-1, 1]) * rng.int(1, 6));
      const div = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter((d) => v % d === 0 && v / d <= 30 && d !== a && d !== b);
      if (div.length && rng.bool(0.7)) { const d = rng.pick(div); st = `${a} * ${b}`; dr = `${d} * ${v / d}`; }
      else { st = `${a} * ${b}`; dr = String(v); }
      break;
    }
    case "impartire": {
      const b = rng.int(2, 9), q = rng.int(2, 12);
      const q2 = q + (egal ? 0 : rng.pick([-1, 1]) * rng.int(1, 3));
      const d = rng.int(2, 9);
      if (q2 < 1) return null;
      st = `${b * q} / ${b}`; dr = `${d * q2} / ${d}`;
      break;
    }
    case "ordine": {
      const a = rng.int(2, 20), b = rng.int(2, 10), c = rng.int(2, 10);
      const [o1, o2] = rng.pick([["+", "*"], ["-", "*"], ["*", "+"], ["+", "/"]] as const);
      if (o2 === "/" ) { const b2 = c * rng.int(2, 6); st = `(${a} + ${b2}) / ${c}`; dr = `${a} + ${b2} / ${c}`; if ((a + b2) % c) return null; break; }
      if (o1 === "*") { st = `${a} * (${b} + ${c})`; dr = `${a} * ${b} + ${c}`; break; }
      st = `(${a} ${o1} ${b}) ${o2} ${c}`; dr = `${a} ${o1} ${b} ${o2} ${c}`;
      if (o1 === "-" && a < b * c) return null;
      break;
    }
    case "fractii": {
      const b = rng.int(2, 10);
      const t = rng.int(0, 2);
      if (t === 0) { const a = rng.int(1, b), c = egal ? a : rng.int(1, b); st = fr(a, b); dr = fr(c, b); }
      else if (t === 1) { const a = rng.int(1, 9), d = egal ? b : rng.int(2, 10); st = fr(a, b); dr = fr(a, d); }
      else { const a = rng.int(1, 2 * b); st = fr(a, b); dr = "1"; }
      break;
    }
    case "masuri": {
      const fel = rng.pick(["lungime", "masa", "capacitate", "timp", "bani"] as const);
      const c = rng.pick(CONVERSII[fel]);
      const m = marime(rng, c);
      const v2 = m.val + delta();
      if (v2 <= 0) return null;
      st = m.expr; stText = m.text;
      dr = String(v2); drText = cuUnitate(v2, c, false);
      break;
    }
  }
  const val = (e: string) => (/^\d+\/\d+$/.test(e) ? Number(e.split("/")[0]) / Number(e.split("/")[1]) : evalueaza(e));
  const sv = val(st!), dv = val(dr!);
  if (sv === null || dv === null || Number.isNaN(sv) || Number.isNaN(dv)) return null;
  const s = cap === "fractii" ? fracSemn(st!, dr!) : semn(sv, dv);
  const ts = stText ?? afisExpr(st!), td = drText ?? afisExpr(dr!);
  return {
    cheie: `b:${st!}|${dr!}`, capitol: cap, fel: "comparatie", text: `${ts} ○ ${td}`, st: { text: ts }, dr: { text: td },
    raspuns: { tip: "varianta", valoare: s, variante: SEMNE }, afis: s,
    indiciu: cap === "masuri" ? "Transformă ambele mărimi în aceeași unitate, apoi compară." : cap === "fractii" ? "Același numitor: compari numărătorii. Același numărător: fracția cu numitorul mai mic e mai mare." : "Calculează fiecare parte a balanței, apoi compară rezultatele.",
    verificare: { tip: "comparatie", st: st!, dr: dr!, semn: s },
  };
}

function fracSemn(a: string, b: string): "<" | ">" | "=" {
  const p = (x: string) => (x.includes("/") ? x.split("/").map(Number) : [Number(x), 1]);
  const [x, y] = p(a), [z, w] = p(b);
  return semn(x * w, z * y);
}

/** Toate așezările unei perechi de paranteze → expresie ASCII */
function asezariParanteze(n: number[], o: string[]): string[] {
  const k = o.length;
  const scrie = (p: [number, number] | null) => n.map((x, i) => `${p && p[0] === i ? "(" : ""}${x}${p && p[1] === i ? ")" : ""}${i < k ? ` ${o[i]} ` : ""}`).join("");
  const out = [scrie(null)];
  for (let st = 0; st < k; st++) for (let dr = st + 1; dr <= k; dr++) if (!(st === 0 && dr === k)) out.push(scrie([st, dr]));
  return out;
}

/** Detectivul: numărul lipsă sau parantezele */
function lipsa(rng: Rng, cap: CapitolC3, cfg: ConfigC3): Nou | null {
  const c = cap === "probleme" ? (rng.bool() ? "ordine" : "probleme") : cap;
  const ecuatie = (cheie: string, text: string, expr: string, x: number, indiciu: string): Nou => ({
    cheie: `d:${cheie}`, capitol: cap, fel: "lipsa", text, raspuns: { tip: "numar", valoare: x }, afis: `□ = ${fmt(x)}`, indiciu, verificare: { tip: "ecuatie", expr, valoare: x },
  });
  switch (c) {
    case "numere": {
      const n = nr4(rng);
      const parti = [1000, 100, 10, 1].map((p) => Math.floor(n / p) % 10 * p);
      const nenule = parti.filter(Boolean);
      const h = rng.int(0, nenule.length - 1);
      const text = `${fmt(n)} = ${nenule.map((p, i) => (i === h ? "□" : fmt(p))).join(" + ")}`;
      const expr = `${n} = ${nenule.map((p, i) => (i === h ? "x" : String(p))).join(" + ")}`;
      return ecuatie(`n${n}:${h}`, text, expr, nenule[h], "Descompune numărul în mii, sute, zeci și unități.");
    }
    case "adunare":
      return (() => { const p = dinCalcul(exercitiuBloc(rng, bloc({ tip: "ecuatii", min: 100, max: 10000, operatii: ["+", "-"] }), CTX), cap); return p && { ...p, cheie: `d:${p.cheie}`, fel: "lipsa" as FelItem }; })();
    case "inmultire":
      return (() => { const p = dinCalcul(exercitiuBloc(rng, bloc({ tip: "ecuatii", min: 2, max: 10, tabele: [2, 3, 4, 5, 6, 7, 8, 9, 10], operatii: ["×"] }), CTX), cap); return p && { ...p, cheie: `d:${p.cheie}`, fel: "lipsa" as FelItem }; })();
    case "impartire": {
      if (rng.bool(0.4)) {
        const i = rng.int(2, 9), q = rng.int(5, 60), r = rng.int(1, i - 1);
        const d = i * q + r;
        return { ...ecuatie(`pr${d}:${i}`, `□ : ${i} = ${q} rest ${r}`, `x = ${i} * ${q} + ${r}`, d, `Proba: deîmpărțitul = împărțitorul × câtul + restul (${i} × ${q} + ${r}).`), verificare: { tip: "rest", d, i, c: q, r } };
      }
      return (() => { const p = dinCalcul(exercitiuBloc(rng, bloc({ tip: "ecuatii", min: 2, max: 10, tabele: [2, 3, 4, 5, 6, 7, 8, 9], operatii: [":"] }), CTX), cap); return p && { ...p, cheie: `d:${p.cheie}`, fel: "lipsa" as FelItem }; })();
    }
    case "ordine": {
      if (rng.bool()) return paranteze(rng, cap);
      // „48 : □ + 15 = 23”: două operații, ascundem un număr (nenul, cu rezultate parțiale nenule)
      const p = exercitiuBloc(rng, bloc({ tip: "combinate", min: 1, max: 60, min2: 2, max2: 9, operatii: ["+", "-", "×", ":"], nrOperatii: 2 }), CTX);
      if (!p || p.raspuns.tip !== "numar" || p.raspuns.valoare === 0) return null;
      const nums = p.expresie.match(/\d+/g)!.map(Number);
      if (nums.includes(0) || nums.includes(1)) return null;
      const h = rng.int(0, nums.length - 1);
      let k = -1;
      const expr = `${p.expresie.replace(/\d+/g, (m) => (++k === h ? "x" : m))} = ${p.raspuns.valoare}`;
      k = -1;
      const text = `${p.text.replace(/ =$/, "").replace(/\d[\d ]*\d|\d/g, (m) => (++k === h ? "□" : m))} = ${fmt(p.raspuns.valoare)}`;
      return ecuatie(`o${expr}`, text, expr, nums[h], "Lucrează invers: ce rezultat parțial trebuie să obții înainte de ultima operație?");
    }
    case "fractii": {
      const b = rng.int(2, 10), a = rng.int(1, b - 1), k = rng.int(2, 10), n = b * k;
      return rng.bool()
        ? ecuatie(`f${a}/${b}din${n}`, `${fr(a, b)} din □ = ${fmt(a * k)}`, `x / ${b} * ${a} = ${a * k}`, n, `O parte este ${fmt(a * k)} : ${a} = ${k}; întregul are ${b} părți: ${k} × ${b}.`)
        : ecuatie(`f□/${b}din${n}=${a * k}`, `□/${b} din ${fmt(n)} = ${fmt(a * k)}`, `${n} / ${b} * x = ${a * k}`, a, `O parte din ${fmt(n)} este ${fmt(n)} : ${b} = ${k}. Câte părți dau ${fmt(a * k)}?`);
    }
    case "masuri": {
      const fel = rng.pick(["lungime", "masa", "capacitate", "timp", "bani"] as const);
      const cv = rng.pick(CONVERSII[fel]);
      const m = marime(rng, cv);
      return ecuatie(`m${m.text}`, `□ ${unitate(cv, false)} = ${m.text}`, `x = ${m.expr}`, m.val, `1 ${cv.cuvinte ? cv.cuvinte[0] : cv.mare} = ${cuUnitate(cv.f, cv, false)}.`);
    }
    default: {
      const e = exProbleme(rng, { ...cfg, optiuni: { ...cfg.optiuni, probleme: ["mers-invers"] } });
      if (!e || e.verificare.tip !== "ecuatie") return null;
      const [stanga, v] = e.verificare.expr.split(" = ");
      const text = `${afisExpr(stanga).replace("x", "□")} = ${fmt(Number(v))}`;
      return ecuatie(`mi${e.verificare.expr}`, text, e.verificare.expr, e.verificare.valoare, e.indiciu);
    }
  }
}

function paranteze(rng: Rng, cap: CapitolC3): Nou | null {
  const k = rng.int(2, 3);
  const o = Array.from({ length: k }, () => rng.pick(["+", "-", "*", "*", "+"]));
  if (!o.includes("*") || !o.some((x) => x === "+" || x === "-")) return null;
  const n = Array.from({ length: k + 1 }, () => rng.int(2, 12));
  const toate = asezariParanteze(n, o).map((e) => ({ e, v: evalueaza(e) })).filter((x) => x.v !== null) as { e: string; v: number }[];
  const cuP = toate.filter((x) => x.e.includes("("));
  const unice = cuP.filter((x) => toate.filter((y) => y.v === x.v).length === 1);
  if (!unice.length) return null;
  const tinta = rng.pick(unice);
  const altele = rng.shuffle(toate.filter((x) => x.v !== tinta.v)).slice(0, 3);
  const dedup = altele.filter((x, i) => altele.findIndex((y) => y.v === x.v) === i);
  if (!dedup.length) return null;
  const baza = afisExpr(n.map((x, i) => `${x}${i < k ? ` ${o[i]} ` : ""}`).join(""));
  return {
    cheie: `pz:${tinta.e}`, capitol: cap, fel: "lipsa", text: `Pune parantezele ca să obții ${fmt(tinta.v)}: ${baza}`,
    raspuns: { tip: "varianta", valoare: afisExpr(tinta.e), variante: rng.shuffle([tinta, ...dedup].map((x) => afisExpr(x.e))) }, afis: afisExpr(tinta.e),
    indiciu: "Parantezele se calculează primele. Încearcă fiecare variantă și vezi care dă rezultatul cerut.",
    verificare: { tip: "paranteze", expr: tinta.e, tinta: tinta.v, altele: dedup.map((x) => x.e) },
  };
}

/** Constructorul: perimetre și fracții, vizual */
function vizual(rng: Rng, cfg: ConfigC3): Nou | null {
  const pot = [
    ...(cfg.capitole.includes("masuri") || !cfg.capitole.includes("fractii") ? ["perimetru", "construieste"] : []),
    ...(cfg.capitole.includes("fractii") || !cfg.capitole.includes("masuri") ? ["coloreaza", "recunoaste"] : []),
  ];
  const t = rng.pick(pot);
  if (t === "perimetru") return { ...figuraPerimetru(rng), fel: "vizual", capitol: "masuri" };
  if (t === "construieste") {
    if (rng.bool()) {
      const L = rng.int(3, 9), l = rng.int(1, Math.min(L - 1, 6));
      const P = 2 * (L + l);
      return { cheie: `cl${L}x${l}`, capitol: "masuri", fel: "vizual", text: `Construiește pe grilă un dreptunghi cu lungimea de ${L} cm și lățimea de ${l} cm.`,
        raspuns: { tip: "construit", perimetru: P, laturi: [L, l] }, afis: `${L} cm × ${l} cm (P = ${P} cm)`, indiciu: "Fiecare pătrățel are latura de 1 cm. Trage de colț până ai lungimea și lățimea cerute.", verificare: { tip: "construit", perimetru: P } };
    }
    const P = 2 * rng.int(4, 14);
    const ex = [Math.floor(P / 4) + 1, P / 2 - Math.floor(P / 4) - 1];
    return { cheie: `cp${P}`, capitol: "masuri", fel: "vizual", text: `Construiește pe grilă un dreptunghi cu perimetrul de ${P} cm.`,
      raspuns: { tip: "construit", perimetru: P }, afis: `de ex. ${ex[0]} cm × ${ex[1]} cm`, indiciu: `Lungimea + lățimea = jumătate din perimetru: ${P} : 2 = ${P / 2} cm.`, verificare: { tip: "construit", perimetru: P } };
  }
  const b = rng.int(2, 10), a = rng.int(1, b);
  if (t === "coloreaza")
    return { cheie: `col${a}/${b}`, capitol: "fractii", fel: "vizual", text: `Colorează ${fr(a, b)} din figură.`, fractie: { parti: b, colorate: 0, forma: rng.pick(["cerc", "dreptunghi"] as const) },
      raspuns: { tip: "colorare", parti: b, cerut: a }, afis: `${a} ${a === 1 ? "parte" : "părți"} din ${b}`, indiciu: `Figura are ${b} părți egale. Colorează exact ${a}.`, verificare: { tip: "colorare", parti: b, cerut: a } };
  const e = exFractii(rng, { ...cfg, optiuni: { ...cfg.optiuni, fractii: ["reprezentare"] } });
  return e && { ...e, cheie: `v${e.cheie}`, fel: "vizual" };
}

// ───────────────────────── sesiunea ─────────────────────────

const FEL: Record<JocC3, FelItem> = { sprint: "exercitiu", memory: "pereche", balanta: "comparatie", detectiv: "lipsa", constructor: "vizual" };

/** Fișa folosește același format ca jocul ales (la Sprint/Memory: exercițiile de calcul). */
function itemNou(rng: Rng, cap: CapitolC3, cfg: ConfigC3, fel: FelItem): Nou | null {
  switch (fel) {
    case "exercitiu": return EX[cap](rng, cfg);
    case "pereche": return pereche(rng, cap, cfg);
    case "comparatie": return comparatie(rng, cap);
    case "lipsa": return lipsa(rng, cap, cfg);
    case "vizual": return vizual(rng, cfg);
  }
}

export interface SesiuneC3 { itemi: ItemC3[]; avertismente: string[] }

const INCERCARI = 300;

/** Exercițiile unei sesiuni (joc sau fișă), deterministe: același cod → aceleași exerciții. */
export function genereazaC3(cfg: ConfigC3): SesiuneC3 {
  const capitole = cfg.capitole.length ? cfg.capitole : (["adunare"] as CapitolC3[]);
  const fel = FEL[cfg.joc];
  const ordine = new Rng(hash(cfg.seed, 31)).shuffle(capitole);
  const itemi: ItemC3[] = [];
  const vazute = new Set<string>();
  let duplicate = 0;
  const n = Math.max(1, Math.min(100, Math.floor(cfg.nr)));
  for (let i = 0; i < n; i++) {
    const cap = ordine[i % ordine.length];
    const baza = hash(cfg.seed, i, cfg.inlocuiri?.[`i${i}`] ?? 0);
    let ales: Nou | null = null, rezerva: Nou | null = null;
    for (let k = 0; k < INCERCARI && !ales; k++) {
      const e = itemNou(new Rng(hash(baza, k)), cap, cfg, fel);
      if (!e) continue;
      // la Memory, nici fețele nu se repetă (altfel o carte s-ar potrivi cu două)
      const chei = [e.cheie, ...(fel === "pereche" ? [`f:${e.st?.text}|${e.st?.fractie?.parti ?? ""}`, `f:${e.dr?.text}`] : [])];
      if (chei.every((c) => !vazute.has(c))) { ales = e; chei.forEach((c) => vazute.add(c)); }
      else rezerva ??= e;
    }
    const e = ales ?? rezerva;
    if (!e) continue;
    if (!ales) duplicate++;
    vazute.add(e.cheie);
    itemi.push({ ...e, id: `i${i}` });
  }
  const avertismente: string[] = [];
  if (duplicate) avertismente.push(`${duplicate} exerciții se repetă: alege mai multe capitole sau opțiuni.`);
  if (itemi.length < n) avertismente.push(`Am putut genera doar ${itemi.length} din ${n} exerciții cu opțiunile alese.`);
  return { itemi, avertismente };
}

// ───────────────────────── verificare și punctaj ─────────────────────────

const intreg = (s: string) => {
  const t = String(s ?? "").replace(/[\s.]/g, "");
  return /^\d+$/.test(t) ? Number(t) : NaN;
};

/** Câte căsuțe bune: doar la împărțirea cu rest (cât și rest). La celelalte tipuri răspunsul e un singur element. */
export function cateBuneC3(item: Pick<ItemC3, "raspuns">, dat: string): CateBune | null {
  const r = item.raspuns;
  if (r.tip !== "rest") return null;
  return cateBune(String(dat).split("|").map(intreg), [r.cat, r.rest]);
}

/** Verifică un răspuns (în joc și pe server). Formate: număr „245”, rest „12|3”, variantă (textul), construit „5x3”, colorare „3”. */
export function verificaC3(item: Pick<ItemC3, "raspuns">, dat: string): boolean {
  const r = item.raspuns;
  switch (r.tip) {
    case "numar": return intreg(dat) === r.valoare;
    case "rest": { const [c, x] = String(dat).split("|"); return intreg(c) === r.cat && intreg(x) === r.rest; }
    case "varianta": return dat === r.valoare;
    case "construit": {
      const [a, b] = String(dat).split("x").map(Number);
      if (!(a > 0 && b > 0) || 2 * (a + b) !== r.perimetru) return false;
      return !r.laturi || (a === r.laturi[0] && b === r.laturi[1]) || (a === r.laturi[1] && b === r.laturi[0]);
    }
    case "colorare": return intreg(dat) === r.cerut;
    case "pereche": return dat === "ok";
  }
}

export type Medalie = "diamant" | "aur" | "argint" | "bronz" | null;
export const MEDALII: Record<Exclude<Medalie, null>, { nume: string; icon: string }> = {
  diamant: { nume: "Diamant", icon: "💎" }, aur: { nume: "Aur", icon: "🥇" }, argint: { nume: "Argint", icon: "🥈" }, bronz: { nume: "Bronz", icon: "🥉" },
};

export interface RezultatItem { corect: boolean; incercari: number; timpMs: number }

/**
 * Punctaj: 10 la prima încercare, 5 după o greșeală; +2 la răspuns rapid (sub jumătate din timp, la Sprint);
 * combo: +1 de la 3 corecte la rând, +2 de la 5, +3 de la 10.
 * Medalia: Bronz ≥ 50%, Argint ≥ 75%, Aur ≥ 90% din punctajul de bază; Diamant = toate corecte din prima.
 */
export function puncteaza(rez: RezultatItem[], total: number, timpPermisMs?: number) {
  let scor = 0, baza = 0, combo = 0, comboMax = 0;
  for (const r of rez) {
    if (!r.corect) { combo = 0; continue; }
    const p = r.incercari <= 1 ? 10 : 5;
    baza += p;
    combo = r.incercari <= 1 ? combo + 1 : 0;
    comboMax = Math.max(comboMax, combo);
    const bonusCombo = combo >= 10 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1 : 0;
    const bonusViteza = timpPermisMs && r.timpMs < timpPermisMs / 2 ? 2 : 0;
    scor += p + bonusCombo + bonusViteza;
  }
  const max = Math.max(1, total) * 10;
  const procent = Math.round((100 * baza) / max);
  const corecte = rez.filter((r) => r.corect).length;
  const toatePrimaData = rez.length === total && rez.every((r) => r.corect && r.incercari <= 1);
  const medalie: Medalie = toatePrimaData ? "diamant" : procent >= 90 ? "aur" : procent >= 75 ? "argint" : procent >= 50 ? "bronz" : null;
  const stele = procent >= 90 ? 3 : procent >= 75 ? 2 : procent >= 50 ? 1 : 0;
  return { scor, scorMax: max, procent, corecte, comboMax, medalie, stele, acuratete: Math.round((100 * corecte) / Math.max(1, total)) };
}
