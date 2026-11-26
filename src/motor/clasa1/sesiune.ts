/**
 * Sesiunea (fișa / jocul) clasei I: același {config, seed} → aceleași exerciții,
 * pe fișa elevului, pe fișa cu barem și în joc.
 */
import { Rng } from "@/motor/rng";
import type { Fisa } from "@/motor/fisa";
import type { Cerinta, Item } from "@/motor/tipuri";
import { raspunsPentruCopil, verificaRaspuns, type Mecanica } from "@/antrenament/tipuri";
import { genereazaExercitiu, type CtxC1 } from "./generatoare";
import { CAPITOLE_C1 } from "./capitole";
import { medalie, type CapitolC1, type ConfigClasa1, type ExercitiuC1, type ExercitiuElevC1, type Medalie, type RaspunsElevC1 } from "./tipuri";

export const MARIME_TABLA = { min: 3, ideal: 4, max: 5 };

export interface SesiuneC1 {
  exercitii: ExercitiuC1[];
  /** câte exerciții nu s-au putut genera (capitole cu prea puține variante distincte) */
  lipsa: number;
}

/** identitatea unui exercițiu pe fișă (două exerciții nu pot arăta la fel pe hârtie) */
const cheieFisa = (e: ExercitiuC1) => `${e.fisa.cerinta}|${e.fisa.text}|${e.fisa.raspuns}|${e.fisa.mecanica ? JSON.stringify(e.fisa.mecanica) : ""}`;

export function genereazaClasa1(cfg: ConfigClasa1): SesiuneC1 {
  const rng = new Rng(cfg.seed);
  const capitole = CAPITOLE_C1.map((c) => c.id).filter((id) => cfg.capitole.includes(id));
  if (!capitole.length || cfg.n < 1) return { exercitii: [], lipsa: cfg.n };
  const ctx: CtxC1 = { o: cfg.optiuni, suportVizual: cfg.suportVizual, jocuri: cfg.jocuri };

  // 1. cote egale; restul merge la capitole alese aleator (reproductibil)
  const cota = new Map<CapitolC1, number>(capitole.map((c) => [c, Math.floor(cfg.n / capitole.length)]));
  for (const c of rng.shuffle(capitole).slice(0, cfg.n % capitole.length)) cota.set(c, cota.get(c)! + 1);

  const chei = new Set<string>();
  const cheiFisa = new Set<string>();
  const liste = new Map<CapitolC1, ExercitiuC1[]>(capitole.map((c) => [c, []]));
  const surse = new Map(capitole.map((c, i) => [c, rng.fork(i + 1)]));
  const epuizat = new Set<CapitolC1>();

  const adauga = (c: CapitolC1, cate: number): number => {
    const r = surse.get(c)!;
    let puse = 0;
    for (let incercari = 0, faraNou = 0; puse < cate && faraNou < 400 && incercari < cate * 120 + 400; incercari++) {
      const e = genereazaExercitiu(c, r, ctx);
      const kf = cheieFisa(e);
      if (chei.has(e.cheie) || cheiFisa.has(kf)) {
        faraNou++;
        continue;
      }
      faraNou = 0;
      chei.add(e.cheie);
      cheiFisa.add(kf);
      liste.get(c)!.push(e);
      puse++;
    }
    if (puse < cate) epuizat.add(c);
    return puse;
  };

  let lipsa = 0;
  for (const c of capitole) lipsa += cota.get(c)! - adauga(c, cota.get(c)!);
  // 2. ce n-au putut da capitolele mici trece la celelalte
  while (lipsa > 0) {
    const deschise = capitole.filter((c) => !epuizat.has(c));
    if (!deschise.length) break;
    for (const c of deschise) {
      if (lipsa <= 0) break;
      lipsa -= adauga(c, 1);
    }
  }

  // 3. tablele de perechi (pe capitol, cu răspunsuri distincte pe aceeași tablă)
  let nrTabla = 0;
  const unitati = new Map<CapitolC1, ExercitiuC1[][]>();
  for (const c of capitole) {
    const lista = liste.get(c)!.sort((a, b) => a.dificultate - b.dificultate);
    const perechi = lista.filter((e) => e.ecran === "perechi");
    const restul = lista.filter((e) => e.ecran !== "perechi");
    const table: ExercitiuC1[][] = [];
    for (const e of perechi) {
      const t = table.find((t) => t.length < MARIME_TABLA.ideal && !t.some((x) => x.pereche!.dreapta === e.pereche!.dreapta));
      if (t) t.push(e);
      else table.push([e]);
    }
    // tablele prea mici se completează din celelalte sau devin exerciții obișnuite
    const bune: ExercitiuC1[][] = [];
    const ramase: ExercitiuC1[] = [];
    for (const t of table) {
      if (t.length >= MARIME_TABLA.min) bune.push(t);
      else ramase.push(...t);
    }
    for (const e of ramase) {
      const t = bune.find((t) => t.length < MARIME_TABLA.max && !t.some((x) => x.pereche!.dreapta === e.pereche!.dreapta));
      if (t) t.push(e);
      else {
        e.ecran = e.raspuns.tip === "optiune" ? "intrebare" : "casuta";
        e.pereche = undefined;
        restul.push(e);
      }
    }
    for (const t of bune) {
      nrTabla++;
      for (const e of t) e.tabla = nrTabla;
    }
    unitati.set(c, [...rng.shuffle(restul).map((e) => [e]), ...bune]);
  }

  // 4. ordinea: capitolele pe rând (ca în lecție), de la ușor la greu în primul sfert
  for (const [c, u] of unitati) unitati.set(c, rng.shuffle(u).sort((a, b) => a[0].dificultate - b[0].dificultate));
  const exercitii: ExercitiuC1[] = [];
  const total = [...unitati.values()].reduce((s, u) => s + u.reduce((t, x) => t + x.length, 0), 0);
  const incalzire = Math.floor(total / 4);
  while ([...unitati.values()].some((u) => u.length)) {
    for (const c of capitole) {
      const u = unitati.get(c)!;
      if (!u.length) continue;
      // după încălzire, alegem aleator dintre primele unități ale capitolului
      const idx = exercitii.length < incalzire ? 0 : rng.int(0, Math.min(2, u.length - 1));
      exercitii.push(...u.splice(idx, 1)[0]);
    }
  }
  return { exercitii, lipsa: Math.max(0, cfg.n - exercitii.length) };
}

// ───────── fișa A4 (aceleași exerciții) ─────────

/** Fișa de printat: exercițiile cu aceeași cerință devin subpuncte a, b, c… (câte cel mult 10). */
export function fisaClasa1(cfg: ConfigClasa1, exercitii: ExercitiuC1[]): Fisa {
  const itemi: Item[] = [];
  for (const cap of CAPITOLE_C1.filter((c) => cfg.capitole.includes(c.id))) {
    const ale = exercitii.filter((e) => e.capitol === cap.id);
    const grupuri = new Map<string, ExercitiuC1[]>();
    for (const e of ale) grupuri.set(e.fisa.cerinta, [...(grupuri.get(e.fisa.cerinta) ?? []), e]);
    for (const [cerinta, lista] of grupuri) {
      const cuDesen = lista.some((e) => e.fisa.mecanica);
      const problema = cap.id === "probleme";
      const pe = problema ? 1 : cuDesen ? 6 : 10;
      for (let i = 0; i < lista.length; i += pe) {
        const bucata = lista.slice(i, i + pe);
        const cerinte: Cerinta[] = bucata.map((e) => ({
          text: e.fisa.text,
          raspuns: e.fisa.raspuns,
          mecanica: e.fisa.mecanica,
          optiuni: e.fisa.optiuni,
          alegere: Boolean(e.fisa.optiuni),
          campuri: e.fisa.campuri,
          latime: e.fisa.text.length > 40 || e.fisa.raspuns.length > 8 ? "l" : "m",
        }));
        itemi.push({
          generatorId: `clasa1.${cap.id}`,
          enunt: cerinta,
          interactiune: bucata.some((e) => e.fisa.optiuni) ? "alegere" : "input",
          cerinte,
          rezolvare: bucata.filter((e) => e.fisa.rezolvare).map((e) => `Rezolvare: ${e.fisa.rezolvare}`),
          punctaj: bucata.length,
          dificultate: Math.max(...bucata.map((e) => e.dificultate)),
          spatiuLucru: problema ? 2 : undefined,
          coloane: problema ? 1 : cuDesen ? 2 : cfg.coloane,
        });
      }
    }
  }
  return {
    config: { clasa: 1, nivel: "consolidare", generatoare: cfg.capitole.map((c) => `clasa1.${c}`), nrItemi: exercitii.length, seed: cfg.seed },
    itemi,
    puncteMaxime: exercitii.length,
    descriptori: [],
  };
}

// ───────── pentru elev: fără răspunsuri ─────────

/** La balanța de comparare, valorile ar trăda răspunsul: elevul le află din animație, după ce răspunde. */
function mecanicaSigura(m: Mecanica): Mecanica {
  if (m.tip === "balanta" && !m.necunoscut) return { ...m, valStanga: 0, valDreapta: 0 };
  return m;
}

export function pentruElev(exercitii: ExercitiuC1[]): ExercitiuElevC1[] {
  return exercitii.map((e, index) => {
    const r = e.raspuns;
    return {
      index,
      capitol: e.capitol,
      ecran: e.ecran,
      enunt: e.enunt,
      mecanica: mecanicaSigura(e.mecanica),
      tip: r.tip === "optiune" || r.tip === "campuri" || r.tip === "ordine" || r.tip === "construit" ? r.tip : "numar",
      optiuni: r.tip === "optiune" ? r.optiuni : undefined,
      etichete: r.tip === "campuri" ? r.etichete : undefined,
      indicii: e.indicii.slice(0, 2),
      pereche: e.pereche ? { stanga: e.pereche.stanga, stangaMecanica: e.pereche.stangaMecanica } : undefined,
      tabla: e.tabla,
    };
  });
}

/** Variantele din dreapta ale fiecărei table de perechi (amestecate, fără legătura cu stânga). */
export function dreaptaTable(exercitii: ExercitiuC1[], seed: number): Record<number, string[]> {
  const rng = new Rng(seed ^ 0x5bd1e995);
  const r: Record<number, string[]> = {};
  for (const e of exercitii) if (e.tabla && e.pereche) (r[e.tabla] ??= []).push(e.pereche.dreapta);
  for (const k of Object.keys(r)) r[Number(k)] = rng.shuffle(r[Number(k)]);
  return r;
}

// ───────── verificare și rezultat ─────────

export function verificaC1(e: ExercitiuC1, dat: unknown): boolean {
  if (e.pereche && e.tabla) return String(dat) === e.pereche.dreapta;
  return verificaRaspuns(e.raspuns, dat);
}

export interface RezultatC1 {
  corecte: number;
  total: number;
  procent: number;
  medalie: Medalie | null;
  stele: number;
  /** pe capitole: corecte din prima / total */
  peCapitole: Record<string, { corecte: number; total: number }>;
}

/** Acuratețea = exerciții rezolvate corect din prima încercare, fără rezolvarea arătată. */
export function rezultatC1(exercitii: ExercitiuC1[], raspunsuri: RaspunsElevC1[]): RezultatC1 & { corect: boolean[] } {
  const corect = exercitii.map((e, i) => {
    const r = raspunsuri[i];
    return Boolean(r && r.primul !== null && r.primul !== undefined && verificaC1(e, r.primul));
  });
  const corecte = corect.filter(Boolean).length;
  const total = exercitii.length;
  const procent = total ? Math.round((100 * corecte) / total) : 0;
  const peCapitole: RezultatC1["peCapitole"] = {};
  exercitii.forEach((e, i) => {
    const p = (peCapitole[e.capitol] ??= { corecte: 0, total: 0 });
    p.total++;
    if (corect[i]) p.corecte++;
  });
  return { corecte, total, procent, medalie: total ? medalie(procent) : null, stele: procent >= 90 ? 3 : procent >= 70 ? 2 : procent >= 50 ? 1 : 0, peCapitole, corect };
}

/** Răspunsul corect formulat pentru copil (la perechi: cartonașul din dreapta). */
export function textCorectC1(e: ExercitiuC1): string {
  return e.pereche && e.tabla ? e.pereche.dreapta : raspunsPentruCopil(e);
}

/**
 * Un pas de joc: răspuns corect / greșit; după a 3-a încercare greșită (sau la timp expirat, `dat` = null)
 * vine și rezolvarea, ca elevul să meargă mai departe. Folosit și în browser (joc liber) și pe server (teme).
 */
export function pasC1(e: ExercitiuC1, dat: unknown, incercare: number): { ok: boolean; rezolvare?: string; corect?: string } {
  if (dat !== null && dat !== undefined && verificaC1(e, dat)) return { ok: true };
  if (dat === null || dat === undefined || incercare >= 3) return { ok: false, rezolvare: e.indicii[2], corect: textCorectC1(e) };
  return { ok: false };
}
