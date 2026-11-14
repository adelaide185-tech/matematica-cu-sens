import type { Generator } from "./tipuri";
import { GENERATOARE_NUMERATIE } from "./generatoare/numeratie";
import { GENERATOARE_OPERATII } from "./generatoare/operatii";
import { GENERATOARE_FRACTII_MASURI } from "./generatoare/fractii-masuri";
import { GENERATOARE_PROBLEME } from "./generatoare/probleme";

export const GENERATOARE: Generator[] = [
  ...GENERATOARE_NUMERATIE,
  ...GENERATOARE_OPERATII,
  ...GENERATOARE_FRACTII_MASURI,
  ...GENERATOARE_PROBLEME,
];

const INDEX = new Map(GENERATOARE.map((g) => [g.id, g]));

export function generator(id: string): Generator {
  const g = INDEX.get(id);
  if (!g) throw new Error(`Generator necunoscut: ${id}`);
  return g;
}

export function exista(id: string): boolean {
  return INDEX.has(id);
}
