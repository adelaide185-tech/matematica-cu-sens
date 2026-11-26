"use client";

import { motion } from "framer-motion";
import { atingeBila, numaraCadru, valoareRekenrek, type Cadru, type Rekenrek as R } from "./logica";

const ROSU = "#e0483e";
const ALB = "#fdfbf5";

/**
 * Rekenrek (numărătoarea cu 2 rânduri de câte 10 bile: 5 roșii + 5 albe).
 * Atingi o bilă din dreapta → vine la stânga împreună cu cele dinaintea ei.
 * Atingi o bilă din stânga → ea și cele de după ea se întorc.
 */
export function Rekenrek({ valoare, onChange, randuri = 2, arataNumar = true, blocat = false }: {
  valoare: R;
  onChange: (r: R) => void;
  randuri?: 1 | 2;
  arataNumar?: boolean;
  blocat?: boolean;
}) {
  const L = 760;
  const bila = 30; // diametru
  const xStanga = (i: number) => 40 + i * (bila + 2) + bila / 2;
  const xDreapta = (i: number) => L - 40 - (9 - i) * (bila + 2) - bila / 2;
  const randurile = (randuri === 2 ? ["sus", "jos"] : ["sus"]) as (keyof R)[];
  const H = 40 + randurile.length * 70;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${L} ${H}`} className="w-full touch-manipulation select-none" role="group" aria-label={`Rekenrek: ${valoareRekenrek(valoare)}`}>
        <rect x="8" y="8" width={L - 16} height={H - 16} rx="18" fill="#c99a62" />
        <rect x="22" y="20" width={L - 44} height={H - 40} rx="10" fill="#fff8ec" />
        {randurile.map((rand, r) => {
          const y = 55 + r * 70;
          const n = valoare[rand];
          return (
            <g key={rand}>
              <line x1="24" y1={y} x2={L - 24} y2={y} stroke="#8a6a44" strokeWidth="4" />
              {Array.from({ length: 10 }, (_, i) => {
                const x = i < n ? xStanga(i) : xDreapta(i);
                return (
                  <motion.g key={i} initial={false} animate={{ x }} transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    role="button" tabIndex={blocat ? -1 : 0} aria-label={`Rândul ${r + 1}, bila ${i + 1}`}
                    onClick={() => !blocat && onChange({ ...valoare, [rand]: atingeBila(n, i) })}
                    onKeyDown={(e) => {
                      if (!blocat && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        onChange({ ...valoare, [rand]: atingeBila(n, i) });
                      }
                    }}
                    className="outline-none focus-visible:outline-2 focus-visible:outline-mov"
                    style={{ cursor: blocat ? "default" : "pointer" }}>
                    <circle cx={0} cy={y} r={bila / 2} fill={i < 5 ? ROSU : ALB} stroke={i < 5 ? "#a8302a" : "#9b8f7a"} strokeWidth="2" />
                    <ellipse cx={-5} cy={y - 6} rx="5" ry="3" fill="#fff" opacity={0.55} />
                  </motion.g>
                );
              })}
            </g>
          );
        })}
      </svg>
      {arataNumar && (
        <p className="mt-2 text-center text-2xl font-bold text-mov-inchis" aria-live="polite">
          {randuri === 2 ? <>{valoare.sus} + {valoare.jos} = <span className="text-3xl">{valoareRekenrek(valoare)}</span></> : <span className="text-3xl">{valoare.sus}</span>}
        </p>
      )}
    </div>
  );
}

/**
 * Cadrul dublu de 10 cu jetoane în două culori. Atingi o căsuță: pune jetonul de culoarea aleasă
 * sau îl scoate, dacă are deja acea culoare.
 */
export function CadruZece({ valoare, onChange, culoare, arataNumar = true, blocat = false, unSingurCadru = false }: {
  valoare: Cadru;
  onChange: (c: Cadru) => void;
  culoare: 1 | 2;
  arataNumar?: boolean;
  blocat?: boolean;
  unSingurCadru?: boolean;
}) {
  const atinge = (i: number) => {
    if (blocat) return;
    const c = [...valoare] as Cadru;
    c[i] = c[i] === culoare ? 0 : culoare;
    onChange(c);
  };
  const cadre = unSingurCadru ? [0] : [0, 1];
  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-4">
        {cadre.map((k) => (
          <div key={k} className="grid grid-cols-5 gap-1 rounded-2xl bg-mov-inchis p-1.5 shadow" role="group" aria-label={`Cadrul ${k + 1}: ${numaraCadru(valoare.slice(k * 10, k * 10 + 10))}`}>
            {Array.from({ length: 10 }, (_, j) => {
              const i = k * 10 + j;
              const v = valoare[i];
              return (
                <button key={i} type="button" onClick={() => atinge(i)} disabled={blocat}
                  aria-label={`Căsuța ${j + 1}${v ? (v === 1 ? ", jeton roșu" : ", jeton galben") : ", goală"}`}
                  className="flex h-14 w-14 items-center justify-center rounded-lg bg-white sm:h-16 sm:w-16">
                  {v !== 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="block h-10 w-10 rounded-full shadow-inner sm:h-12 sm:w-12"
                      style={{ background: v === 1 ? ROSU : "#f9c50f" }} />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {arataNumar && (
        <p className="mt-3 text-center text-2xl font-bold text-mov-inchis" aria-live="polite">
          <span style={{ color: ROSU }}>{numaraCadru(valoare, 1)}</span> + <span className="text-[#b98a00]">{numaraCadru(valoare, 2)}</span> = <span className="text-3xl">{numaraCadru(valoare)}</span>
        </p>
      )}
    </div>
  );
}
