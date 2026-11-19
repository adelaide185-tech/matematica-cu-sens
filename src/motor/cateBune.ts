/**
 * Indiciul „ai pus bine X din Y”: la exercițiile în care elevul trimite mai multe elemente deodată
 * (literele unui cuvânt, mai multe căsuțe), îi spunem câte sunt bune, nu care.
 */
export interface CateBune { bune: number; total: number }

/** Câte poziții coincid. Lungimile diferite se compară pe lungimea răspunsului corect. */
export function cateBune<T>(dat: readonly T[], corect: readonly T[], egal: (a: T, b: T) => boolean = (a, b) => a === b): CateBune {
  let bune = 0;
  corect.forEach((c, i) => { if (i < dat.length && egal(dat[i], c)) bune++; });
  return { bune, total: corect.length };
}

/** „Ai 4 din 6 litere bune.” — null dacă nu are sens (un singur element sau nimic bun de comparat). */
export function mesajCateBune(c: CateBune | null, unitate: "litere" | "căsuțe"): string | null {
  if (!c || c.total < 2) return null;
  return `Ai ${c.bune} din ${c.total} ${unitate} bune.`;
}
