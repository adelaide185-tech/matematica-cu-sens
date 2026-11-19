"use client";

/** Elemente mici comune manipulativelor: butoane mari (min. 44 px), comutatoare, paleta de culori. */

export function BtnUnealta({ children, activ, className = "", ...p }: { activ?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...p}
      className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold shadow-sm ring-1 transition active:scale-95 disabled:opacity-40 sm:text-base ${
        activ ? "bg-mov text-white ring-mov" : "bg-white text-mov ring-mov/20 hover:bg-mov-deschis"
      } ${className}`}>
      {children}
    </button>
  );
}

export function Comutator({ eticheta, valoare, onChange }: { eticheta: string; valoare: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-mov/20 sm:text-base">
      <input type="checkbox" checked={valoare} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-mov" />
      {eticheta}
    </label>
  );
}

/** Culorile folosite pe tabla sutelor și în modelul în bară (calde, cu contrast bun pentru text închis). */
export const PALETA = ["#f9c50f", "#7cc6f2", "#9be09b", "#f5a3b5", "#c9b8f5"];

export function Paleta({ alesa, onAlege, radiera = true }: { alesa: number; onAlege: (i: number) => void; radiera?: boolean }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Culoare">
      {PALETA.map((c, i) => (
        <button key={c} type="button" role="radio" aria-checked={alesa === i} aria-label={`Culoarea ${i + 1}`} onClick={() => onAlege(i)}
          className={`h-10 w-10 rounded-full ring-2 transition ${alesa === i ? "scale-110 ring-mov-inchis" : "ring-white"}`} style={{ background: c }} />
      ))}
      {radiera && (
        <button type="button" role="radio" aria-checked={alesa === -1} aria-label="Radieră" onClick={() => onAlege(-1)}
          className={`h-10 w-10 rounded-full bg-white text-xl ring-2 ${alesa === -1 ? "ring-mov-inchis" : "ring-mov/20"}`}>🧽</button>
      )}
    </div>
  );
}
