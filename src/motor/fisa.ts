import { Rng } from "./rng";
import type { Clasa, Item, Nivel } from "./tipuri";
import { generator } from "./registru";
import { descriptori, PRAGURI_IMPLICITE } from "./barem";

export interface ConfigFisa {
  clasa: Clasa;
  nivel: Nivel;
  generatoare: string[];
  nrItemi: number;
  seed: number;
}

export interface Fisa {
  config: ConfigFisa;
  itemi: Item[];
  puncteMaxime: number;
  descriptori: { eticheta: string; text: string }[];
}

/** Numărul implicit de itemi pe nivel (după fișele voastre: Nivel 1 ~ 8–10, evaluare 10–12). */
export const ITEMI_IMPLICITI: Record<Nivel, number> = { consolidare: 6, aprofundare: 6, evaluare: 8, competitie: 4 };

/**
 * Compune o fișă: generatoarele compatibile cu nivelul sunt folosite pe rând
 * (fără repetări până se epuizează lista), fiecare cu propriul seed derivat.
 */
export function genereazaFisa(config: ConfigFisa): Fisa {
  const rng = new Rng(config.seed);
  const potrivite = config.generatoare.map(generator).filter((g) => g.niveluri.includes(config.nivel) && g.clase.includes(config.clasa));
  // dacă niciun generator nu are nivelul cerut, folosim tot ce e compatibil cu clasa
  const sursa = potrivite.length ? potrivite : config.generatoare.map(generator).filter((g) => g.clase.includes(config.clasa));
  if (!sursa.length) return { config, itemi: [], puncteMaxime: 0, descriptori: [] };

  const ordine = rng.shuffle(sursa);
  // la competiție și evaluare, problemele merg la final (ca în fișele voastre: Partea II)
  ordine.sort((a, b) => Number(a.id.startsWith("probleme.")) - Number(b.id.startsWith("probleme.")));

  const itemi: Item[] = [];
  const dupaGenerator = new Map<string, Item>();
  for (let i = 0; i < config.nrItemi; i++) {
    const g = ordine[i % ordine.length];
    const nou = g.generate(rng.fork(i), config.nivel, config.clasa);
    const existent = dupaGenerator.get(g.id);
    // Problemele rămân itemi separați (fiecare are enunțul ei). Celelalte tipuri nu se repetă ca
    // exerciții numerotate: cerințele noi se adaugă la exercițiul existent (a, b, c… până la 10).
    if (existent && !g.id.startsWith("probleme.") && !existent.vizual) {
      const vazute = new Set(existent.cerinte.map((c) => c.text + c.raspuns));
      const noi = nou.cerinte.filter((c) => !vazute.has(c.text + c.raspuns)).slice(0, Math.max(0, 10 - existent.cerinte.length));
      if (noi.length) {
        const perCerinta = nou.punctaj / nou.cerinte.length;
        existent.cerinte.push(...noi);
        existent.punctaj += Math.round(perCerinta * noi.length);
        existent.rezolvare.push(...nou.rezolvare.filter((r) => noi.some((c) => r.includes(c.raspuns))));
      }
      continue;
    }
    dupaGenerator.set(g.id, nou);
    itemi.push(nou);
  }
  if (config.nivel === "competitie" || config.nivel === "evaluare") {
    itemi.sort((a, b) => Number(a.generatorId.startsWith("probleme.")) - Number(b.generatorId.startsWith("probleme.")));
  }
  const puncteMaxime = itemi.reduce((s, it) => s + it.punctaj, 0);
  return { config, itemi, puncteMaxime, descriptori: descriptori(config.clasa, puncteMaxime, PRAGURI_IMPLICITE) };
}
