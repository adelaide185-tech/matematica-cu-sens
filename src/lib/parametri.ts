import { CURRICULUM, cautaLectie } from "@/curriculum";
import { genereazaFisa, ITEMI_IMPLICITI } from "@/motor/fisa";
import type { Clasa, Nivel } from "@/motor/tipuri";
import { NIVELURI } from "@/motor/tipuri";

export interface ParametriFisa {
  clasa: Clasa;
  lectie: string;
  nivel: Nivel;
  nr: number;
  seed: number;
  scoala: string;
  profesor: string;
  data: string;
  bw: boolean;
}

type Sursa = URLSearchParams | Record<string, string | string[] | undefined>;

function get(s: Sursa, k: string): string | undefined {
  if (s instanceof URLSearchParams) return s.get(k) ?? undefined;
  const v = s[k];
  return Array.isArray(v) ? v[0] : v;
}

export function citesteParametri(s: Sursa): ParametriFisa {
  const clasaN = Number(get(s, "clasa"));
  const clasa = ([1, 2, 3, 4, 5].includes(clasaN) ? clasaN : 2) as Clasa;
  const nivelS = get(s, "nivel");
  const nivel = (NIVELURI.some((n) => n.id === nivelS) ? nivelS : "consolidare") as Nivel;
  const primaLectie = CURRICULUM[clasa].flatMap((c) => c.lectii).find((l) => l.generatoare.length)?.id ?? "";
  const lectie = get(s, "lectie") && cautaLectie(clasa, get(s, "lectie")!) ? get(s, "lectie")! : primaLectie;
  const nr = Math.min(20, Math.max(1, Number(get(s, "nr")) || ITEMI_IMPLICITI[nivel]));
  return {
    clasa,
    lectie,
    nivel,
    nr,
    seed: Number(get(s, "seed")) || 1,
    scoala: (get(s, "scoala") ?? "").slice(0, 120),
    profesor: (get(s, "profesor") ?? "").slice(0, 80),
    data: (get(s, "data") ?? "").slice(0, 30),
    bw: get(s, "bw") === "1",
  };
}

export function construiesteFisa(p: ParametriFisa) {
  const gasit = cautaLectie(p.clasa, p.lectie);
  const generatoare = gasit?.lectie.generatoare ?? [];
  const fisa = genereazaFisa({ clasa: p.clasa, nivel: p.nivel, generatoare, nrItemi: p.nr, seed: p.seed });
  return { fisa, titlu: gasit?.lectie.titlu ?? "Fișă de lucru" };
}

export function query(p: ParametriFisa, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams({
    clasa: String(p.clasa), lectie: p.lectie, nivel: p.nivel, nr: String(p.nr), seed: String(p.seed),
    ...(p.scoala && { scoala: p.scoala }), ...(p.profesor && { profesor: p.profesor }), ...(p.data && { data: p.data }),
    ...(p.bw && { bw: "1" }), ...extra,
  });
  return q.toString();
}
