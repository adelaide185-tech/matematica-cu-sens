/**
 * Generatorul de fișe de engleză pentru 4–6 ani (conținut original).
 * Copiii nu citesc: fiecare exercițiu are imagini și o pictogramă a cerinței; educatoarea
 * citește cerințele cu voce tare din „fișa educatoarei” (scriptul + răspunsurile).
 */
import { Rng } from "@/motor/rng";
import { b64, deb64 } from "@/motor/calcul/config";
import { hash } from "@/motor/calcul/generator";
import { UNITATI, cuCuvant, unitate, type Cuvant, type Varsta } from "./continut";

export type TipFisaEn = "asculta" | "umbre" | "coloreaza" | "numara" | "intrus" | "traseaza";

export const TIPURI_FISA_EN: Record<TipFisaEn, { en: string; ro: string; icon: string; descriere: string; varsteRecomandate: Varsta[] }> = {
  asculta: { en: "Listen and circle.", ro: "Ascultă și încercuiește.", icon: "👂⭕", descriere: "Educatoarea spune cuvântul, copilul încercuiește imaginea.", varsteRecomandate: [4, 5, 6] },
  umbre: { en: "Match the picture and its shadow.", ro: "Unește imaginea cu umbra ei.", icon: "🌑〰️", descriere: "Linii de la imagine la umbra ei; educatoarea spune cuvintele.", varsteRecomandate: [4, 5, 6] },
  coloreaza: { en: "Listen and colour.", ro: "Ascultă și colorează.", icon: "🖍️", descriere: "„Colour the cat brown.” Copilul colorează cu culoarea spusă.", varsteRecomandate: [4, 5, 6] },
  numara: { en: "Count and circle.", ro: "Numără și încercuiește numărul.", icon: "🔢⭕", descriere: "Grupuri de obiecte (1–5, 1–7 sau 1–10, după vârstă).", varsteRecomandate: [4, 5, 6] },
  intrus: { en: "Cross out the odd one.", ro: "Taie imaginea care nu se potrivește.", icon: "❌", descriere: "Trei imagini din aceeași temă și una din altă temă.", varsteRecomandate: [5, 6] },
  traseaza: { en: "Trace the word.", ro: "Scrie peste litere.", icon: "✏️", descriere: "Cuvântul cu litere punctate, de urmărit cu creionul.", varsteRecomandate: [6] },
};
export const TIPURI_EN = Object.keys(TIPURI_FISA_EN) as TipFisaEn[];

export interface AntetEn { titlu: string; gradinita: string; educatoare: string; data: string }
export interface ConfigFisaEn {
  seed: number;
  unitati: string[];
  tipuri: TipFisaEn[];
  varsta: Varsta;
  /** fișa se printează color (la „Colours” culorile sunt necesare) */
  color: boolean;
  /** secțiuni regenerate de educatoare: id → variantă */
  inlocuiri: Record<string, number>;
  antet: AntetEn;
}

export type SectiuneEn =
  | { tip: "asculta"; id: string; randuri: { tinta: Cuvant; variante: Cuvant[]; cerinta: string }[] }
  | { tip: "umbre"; id: string; stanga: Cuvant[]; dreapta: Cuvant[] }
  | { tip: "coloreaza"; id: string; itemi: { c: Cuvant; culoare: Cuvant }[] }
  | { tip: "numara"; id: string; itemi: { c: Cuvant; n: number; variante: number[] }[] }
  | { tip: "intrus"; id: string; randuri: { imagini: Cuvant[]; intrus: Cuvant; tema: string }[] }
  | { tip: "traseaza"; id: string; itemi: Cuvant[] };

const CATE: Record<TipFisaEn, Record<Varsta, number>> = {
  asculta: { 4: 4, 5: 5, 6: 6 },
  umbre: { 4: 3, 5: 4, 6: 5 },
  coloreaza: { 4: 2, 5: 4, 6: 6 },
  numara: { 4: 3, 5: 4, 6: 6 },
  intrus: { 4: 3, 5: 4, 6: 5 },
  traseaza: { 4: 2, 5: 3, 6: 5 },
};
const VARIANTE_FISA: Record<Varsta, number> = { 4: 2, 5: 3, 6: 4 };
const NUMAR_MAX: Record<Varsta, number> = { 4: 5, 5: 7, 6: 10 };

export function configFisaEnImplicita(seed = 1): ConfigFisaEn {
  return { seed, unitati: ["animals", "food"], tipuri: ["asculta", "umbre", "coloreaza", "numara"], varsta: 5, color: true, inlocuiri: {}, antet: { titlu: "English · fișă de lucru", gradinita: "", educatoare: "", data: "" } };
}

export const codificaFisaEn = (c: ConfigFisaEn) => b64(JSON.stringify(c));
export function curataFisaEn(x: Record<string, unknown>): ConfigFisaEn {
  const d = configFisaEnImplicita();
  const a = (x.antet ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 80) => (typeof v === "string" ? v.slice(0, max) : "");
  const unitati = Array.isArray(x.unitati) ? UNITATI.map((u) => u.id).filter((id) => (x.unitati as unknown[]).includes(id)) : d.unitati;
  const tipuri = Array.isArray(x.tipuri) ? TIPURI_EN.filter((t) => (x.tipuri as unknown[]).includes(t)) : d.tipuri;
  const inl: Record<string, number> = {};
  if (x.inlocuiri && typeof x.inlocuiri === "object")
    for (const [k, v] of Object.entries(x.inlocuiri as Record<string, unknown>)) if (/^s[a-z]+$/.test(k) && Number.isFinite(Number(v))) inl[k] = Math.max(0, Math.floor(Number(v)));
  return {
    seed: Number.isFinite(Number(x.seed)) ? Math.abs(Math.floor(Number(x.seed))) % 2 ** 31 : 1,
    unitati: unitati.length ? unitati : d.unitati,
    tipuri: tipuri.length ? tipuri : d.tipuri,
    varsta: ([4, 5, 6] as const).includes(Number(x.varsta) as Varsta) ? (Number(x.varsta) as Varsta) : 5,
    color: x.color === undefined ? true : Boolean(x.color),
    inlocuiri: inl,
    antet: { titlu: str(a.titlu) || d.antet.titlu, gradinita: str(a.gradinita), educatoare: str(a.educatoare), data: str(a.data, 40) },
  };
}
export function decodificaFisaEn(s: string | null | undefined): ConfigFisaEn | null {
  if (!s) return null;
  try { return curataFisaEn(JSON.parse(deb64(s))); } catch { return null; }
}

const culori = () => unitate("colours")!.cuvinte;
/** cuvintele temelor alese (fără „Colours” și „Numbers”, care au exerciții ale lor, dacă există altele) */
function obiecte(cfg: ConfigFisaEn): Cuvant[] {
  const toate = cfg.unitati.flatMap((id) => unitate(id)?.cuvinte ?? []);
  const imagini = cfg.unitati.filter((id) => id !== "colours" && id !== "numbers").flatMap((id) => unitate(id)?.cuvinte ?? []);
  const lista = imagini.length ? imagini : toate;
  return cfg.varsta === 4 ? lista.filter((c, i, a) => a.indexOf(c) === i) : lista;
}
const cheieImagine = (c: Cuvant) => `${c.emoji}|${c.numar ?? ""}|${c.culoare ?? ""}`;
/** alege k cuvinte cu imagini diferite */
function alege(rng: Rng, din: Cuvant[], k: number, fara: Cuvant[] = []): Cuvant[] {
  const out: Cuvant[] = [];
  const vazute = new Set(fara.map(cheieImagine));
  for (const c of rng.shuffle(din)) if (out.length < k && !vazute.has(cheieImagine(c))) { out.push(c); vazute.add(cheieImagine(c)); }
  return out;
}
const cerintaPentru = (c: Cuvant) => {
  const u = UNITATI.find((x) => x.cuvinte.includes(c));
  return u ? cuCuvant(u.cerinta, c.en) : `Where's the ${c.en}?`;
};

function sectiune(tip: TipFisaEn, cfg: ConfigFisaEn, rng: Rng): SectiuneEn {
  const v = cfg.varsta, n = CATE[tip][v], id = `s${tip}`;
  // „Ascultă și încercuiește” poate folosi și culorile / numerele (imaginile lor se deosebesc)
  const toate = cfg.unitati.flatMap((u) => unitate(u)?.cuvinte ?? []);
  switch (tip) {
    case "asculta": {
      const k = Math.min(VARIANTE_FISA[v], toate.length);
      const tinte = alege(rng, toate, Math.min(n, toate.length));
      while (tinte.length < n) tinte.push(rng.pick(toate));
      return { tip, id, randuri: tinte.map((t) => ({ tinta: t, cerinta: cerintaPentru(t), variante: rng.shuffle([t, ...alege(rng, toate, k - 1, [t])]) })) };
    }
    case "umbre": {
      const st = alege(rng, obiecte(cfg), Math.min(n, obiecte(cfg).length));
      return { tip, id, stanga: st, dreapta: rng.shuffle(st) };
    }
    case "coloreaza": {
      const ob = alege(rng, obiecte(cfg).filter((c) => !c.culoare && !c.numar), n);
      const lista = ob.length ? ob : alege(rng, culori(), n).map((c) => ({ ...c, culoare: undefined }));
      return { tip, id, itemi: lista.map((c) => ({ c, culoare: rng.pick(culori().filter((x) => x.en !== "white")) })) };
    }
    case "numara": {
      const ob = alege(rng, obiecte(cfg).filter((c) => !c.numar && !c.culoare), n);
      const lista = ob.length ? ob : alege(rng, unitate("animals")!.cuvinte, n);
      const max = NUMAR_MAX[v];
      return {
        tip, id, itemi: lista.map((c) => {
          const nr = rng.int(1, max);
          const alt = rng.shuffle(Array.from({ length: max }, (_, i) => i + 1).filter((x) => x !== nr)).slice(0, 2);
          return { c, n: nr, variante: [nr, ...alt].sort((a, b) => a - b) };
        }),
      };
    }
    case "intrus": {
      const teme = cfg.unitati.filter((id) => (unitate(id)?.cuvinte.length ?? 0) >= 3);
      const randuri = Array.from({ length: n }, (_, i) => {
        const tema = unitate(teme.length ? teme[i % teme.length] : "animals")!;
        const alte = UNITATI.filter((u) => u.id !== tema.id && u.id !== "numbers" && u.id !== "colours");
        const intrus = rng.pick(rng.pick(alte).cuvinte);
        const trei = alege(rng, tema.cuvinte, 3, [intrus]);
        return { imagini: rng.shuffle([...trei, intrus]), intrus, tema: tema.titlu };
      });
      return { tip, id, randuri };
    }
    case "traseaza": {
      const scurte = obiecte(cfg).filter((c) => c.en.length <= (v === 6 ? 7 : 5) && !c.en.includes(" "));
      return { tip, id, itemi: alege(rng, scurte.length ? scurte : obiecte(cfg), n) };
    }
  }
}

/** Fișa (deterministă: același cod → aceleași exerciții); fiecare secțiune poate fi regenerată separat. */
export function genereazaFisaEn(cfg: ConfigFisaEn): SectiuneEn[] {
  return cfg.tipuri.map((tip, i) => sectiune(tip, cfg, new Rng(hash(cfg.seed, i + 1, cfg.inlocuiri[`s${tip}`] ?? 0, tip.length))));
}

/** Ce citește educatoarea și răspunsurile, pe secțiuni (pagina „Fișa educatoarei”). */
export function scriptEducatoare(s: SectiuneEn): { spune: string; raspuns: string }[] {
  switch (s.tip) {
    case "asculta": return s.randuri.map((r) => ({ spune: r.cerinta, raspuns: `${r.tinta.en} (${r.tinta.ro})` }));
    case "umbre": return s.stanga.map((c) => ({ spune: `It's a ${c.en}. Find the shadow!`, raspuns: `${c.en} → umbra nr. ${s.dreapta.indexOf(c) + 1}` }));
    case "coloreaza": return s.itemi.map((x) => ({ spune: `Colour the ${x.c.en} ${x.culoare.en}.`, raspuns: `${x.c.ro} → ${x.culoare.ro}` }));
    case "numara": return s.itemi.map((x) => ({ spune: `How many ${x.c.en}${x.c.en.endsWith("s") ? "" : "s"}? Count and circle.`, raspuns: `${x.n} (${["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][x.n - 1]})` }));
    case "intrus": return s.randuri.map((r) => ({ spune: `Look! ${r.imagini.map((c) => c.en).join(", ")}. Which one is different?`, raspuns: `${r.intrus.en} (${r.intrus.ro}), nu face parte din „${r.tema}”` }));
    case "traseaza": return s.itemi.map((c) => ({ spune: `Say it: ${c.en}. Trace the letters.`, raspuns: `${c.en} (${c.ro})` }));
  }
}
