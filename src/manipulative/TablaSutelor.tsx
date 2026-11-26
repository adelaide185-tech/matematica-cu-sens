"use client";

import { numereTabla, type Tabla } from "./logica";
import { PALETA } from "./comune";

/**
 * Tabla sutelor: atingi un număr ca să-l colorezi cu culoarea aleasă (sau să-l ștergi cu radiera).
 * Numerele „ascunse” apar ca „?”: copilul le descoperă din vecini.
 */
export function TablaSutelor({ valoare, onChange, culoare, blocat = false, dezvaluie = false, modAscunde = false }: {
  valoare: Tabla;
  onChange: (t: Tabla) => void;
  /** index în PALETA; -1 = radieră */
  culoare: number;
  blocat?: boolean;
  /** arată și numerele ascunse (de ex. după verificare) */
  dezvaluie?: boolean;
  /** profesorul acoperă / descoperă numere în loc să coloreze */
  modAscunde?: boolean;
}) {
  const atinge = (n: number) => {
    if (blocat) return;
    if (modAscunde) {
      const are = valoare.ascunse.includes(n);
      onChange({ ...valoare, ascunse: are ? valoare.ascunse.filter((x) => x !== n) : [...valoare.ascunse, n] });
      return;
    }
    const colorate = { ...valoare.colorate };
    if (culoare < 0 || colorate[n] === culoare) delete colorate[n];
    else colorate[n] = culoare;
    onChange({ ...valoare, colorate });
  };
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="grid grid-cols-10 gap-[3px] rounded-2xl bg-mov-inchis p-[3px] shadow" role="grid" aria-label={`Tabla numerelor de la ${valoare.start} la ${valoare.start + 99}`}>
        {numereTabla(valoare.start).flat().map((n) => {
          const c = valoare.colorate[n];
          const ascuns = valoare.ascunse.includes(n) && !dezvaluie;
          return (
            <button key={n} type="button" role="gridcell" onClick={() => atinge(n)} disabled={blocat}
              aria-label={ascuns ? "număr ascuns" : String(n)} aria-selected={c !== undefined}
              className={`aspect-square rounded-md text-[0.7rem] font-bold tabular-nums transition sm:text-base ${
                ascuns ? "bg-mov-deschis text-mov" : "bg-white text-gray-800"
              } ${blocat ? "cursor-default" : "hover:brightness-95 active:scale-95"}`}
              style={c !== undefined ? { background: PALETA[c] } : undefined}>
              {ascuns ? "?" : n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
