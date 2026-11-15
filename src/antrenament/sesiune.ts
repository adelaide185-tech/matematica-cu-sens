import { Rng } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";
import type { Exercitiu, NivelJoc, Subiect } from "./tipuri";

export const LUNGIMI = [10, 20, 50, 100] as const;
/** distanța minimă (în exerciții) între două apariții ale aceluiași fapt matematic */
export const SPATIERE_FAPT = 10;

export interface ConfigSesiune {
  clasa: Clasa;
  nivel: NivelJoc;
  subiecte: string[];
  /** ponderi opționale (1 sau 2) pe subiect */
  ponderi?: Record<string, number>;
  n: number;
  seed: number;
}

const cacheCapacitate = new Map<string, number>();

/**
 * Câte exerciții distincte poate produce un subiect la un nivel și o clasă.
 * Se măsoară generând până nu mai apar chei noi (determinist, cu seed fix); rezultatul e „cel puțin”.
 * Plafonat la 1000 (oricum peste limita de 100 dintr-o sesiune).
 */
export function capacitate(s: Subiect, nivel: NivelJoc, clasa: Clasa): number {
  const k = `${s.id}|${nivel}|${clasa}`;
  const c = cacheCapacitate.get(k);
  if (c !== undefined) return c;
  const rng = new Rng(987654321);
  const chei = new Set<string>();
  let faraNou = 0;
  for (let i = 0; i < 6000 && faraNou < 800 && chei.size < 1000; i++) {
    const n = chei.size;
    chei.add(s.exercitiu(rng, nivel, clasa).cheie);
    faraNou = chei.size === n ? faraNou + 1 : 0;
  }
  cacheCapacitate.set(k, chei.size);
  return chei.size;
}

/** Cele mai multe exerciții posibile pentru o selecție (suma capacităților). */
export function capacitateSelectie(subiecte: Subiect[], nivel: NivelJoc, clasa: Clasa): number {
  return subiecte.reduce((t, s) => t + capacitate(s, nivel, clasa), 0);
}

/** Împarte n exerciții pe subiecte, după ponderi, fără a depăși capacitatea fiecăruia. */
export function cote(subiecte: Subiect[], cfg: ConfigSesiune): Map<string, number> {
  const cap = new Map(subiecte.map((s) => [s.id, capacitate(s, cfg.nivel, cfg.clasa)]));
  const pond = (id: string) => Math.max(1, Math.min(3, cfg.ponderi?.[id] ?? 1));
  const rez = new Map(subiecte.map((s) => [s.id, 0]));
  let ramase = cfg.n;
  // distribuim pe rând, câte un exercițiu, subiectului cu cel mai mic raport alocat/pondere care mai are loc
  while (ramase > 0) {
    const candidati = subiecte.filter((s) => rez.get(s.id)! < cap.get(s.id)!);
    if (!candidati.length) break;
    candidati.sort((a, b) => rez.get(a.id)! / pond(a.id) - rez.get(b.id)! / pond(b.id));
    rez.set(candidati[0].id, rez.get(candidati[0].id)! + 1);
    ramase--;
  }
  return rez;
}

/**
 * Construiește sesiunea:
 *  1. pentru fiecare subiect, cota lui de exerciții cu chei unice;
 *  2. încălzire: primul sfert, de la ușor la greu;
 *  3. amestec: același subiect de cel mult 2 ori la rând, același fapt nu mai devreme de 10 exerciții.
 * Totul e determinist din seed (sesiunea se reia identic după pauză).
 */
export function construiesteSesiune(toate: Subiect[], cfg: ConfigSesiune): Exercitiu[] {
  const subiecte = cfg.subiecte.map((id) => toate.find((s) => s.id === id)).filter((s): s is Subiect => Boolean(s?.clase.includes(cfg.clasa)));
  if (!subiecte.length) return [];
  const rng = new Rng(cfg.seed);
  const cota = cote(subiecte, cfg);
  const cheiFolosite = new Set<string>();

  const liste = new Map<string, Exercitiu[]>();
  for (const s of subiecte) {
    const r = rng.fork(s.id.length * 7919 + s.id.charCodeAt(0));
    const lista: Exercitiu[] = [];
    const vrem = cota.get(s.id)!;
    for (let incercari = 0; lista.length < vrem && incercari < vrem * 80; incercari++) {
      const e = s.exercitiu(r, cfg.nivel, cfg.clasa);
      if (cheiFolosite.has(e.cheie)) continue;
      cheiFolosite.add(e.cheie);
      lista.push({ ...e, subiectId: s.id });
    }
    liste.set(s.id, lista);
  }

  const total = [...liste.values()].reduce((t, l) => t + l.length, 0);
  const incalzire = Math.floor(total / 4);
  const rezultat: Exercitiu[] = [];

  // încălzire: cele mai ușoare exerciții, câte unul din fiecare subiect pe rând
  if (incalzire > 0) {
    for (const l of liste.values()) l.sort((a, b) => a.dificultate - b.dificultate);
    const ids = [...liste.keys()];
    for (let i = 0; rezultat.length < incalzire; i++) {
      const l = liste.get(ids[i % ids.length])!;
      if (l.length) rezultat.push(l.shift()!);
      if (ids.every((id) => !liste.get(id)!.length)) break;
    }
  }
  for (const l of liste.values()) {
    const amestecat = rng.shuffle(l);
    l.splice(0, l.length, ...amestecat);
  }

  while (rezultat.length < total) {
    const ultimele2 = rezultat.slice(-2).map((e) => e.subiectId);
    const faptRecente = new Set(rezultat.slice(-SPATIERE_FAPT).map((e) => e.fapt));
    const disponibile = [...liste.entries()].filter(([, l]) => l.length);
    // preferăm subiectul cu cele mai multe exerciții rămase, care n-a apărut de 2 ori la rând
    const ordonate = rng.shuffle(disponibile).sort((a, b) => b[1].length - a[1].length);
    const sub = ordonate.find(([id]) => !(ultimele2.length === 2 && ultimele2.every((x) => x === id))) ?? ordonate[0];
    const lista = sub[1];
    const idx = lista.findIndex((e) => !faptRecente.has(e.fapt));
    rezultat.push(lista.splice(idx >= 0 ? idx : 0, 1)[0]);
  }
  return rezultat;
}

// ───────── rezultate și verdicte ─────────

export interface RezultatExercitiu {
  subiectId: string;
  /** numărul de încercări până la răspunsul corect (1 = din prima) */
  incercari: number;
  cuAjutor: boolean;
  timpMs: number;
}

export type Verdict = "stapanit" | "aproape" | "exersam";
export const VERDICTE: Record<Verdict, { nume: string; icon: string; culoare: string }> = {
  stapanit: { nume: "Stăpânit", icon: "🌟", culoare: "#2e9e5b" },
  aproape: { nume: "Aproape", icon: "🌱", culoare: "#e0a10c" },
  exersam: { nume: "Mai exersăm", icon: "🔁", culoare: "#e07a1f" },
};

export function verdicte(rez: RezultatExercitiu[]): { subiectId: string; total: number; dinPrima: number; cuAjutor: number; procent: number; verdict: Verdict }[] {
  const pe = new Map<string, RezultatExercitiu[]>();
  for (const r of rez) pe.set(r.subiectId, [...(pe.get(r.subiectId) ?? []), r]);
  return [...pe.entries()].map(([subiectId, l]) => {
    const dinPrima = l.filter((r) => r.incercari === 1).length;
    const cuAjutor = l.filter((r) => r.cuAjutor).length;
    const procent = Math.round((dinPrima / l.length) * 100);
    const verdict: Verdict = procent >= 85 && cuAjutor / l.length <= 0.1 ? "stapanit" : procent >= 60 ? "aproape" : "exersam";
    return { subiectId, total: l.length, dinPrima, cuAjutor, procent, verdict };
  });
}

export function stele(rez: RezultatExercitiu[]): number {
  if (!rez.length) return 0;
  const p = rez.filter((r) => r.incercari === 1).length / rez.length;
  return p >= 0.9 ? 3 : p >= 0.7 ? 2 : 1;
}
