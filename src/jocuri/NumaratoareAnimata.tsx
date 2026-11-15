"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DURATA, tranzitie } from "./miscare";

export type Ordin = "mii" | "sute" | "zeci" | "unitati";

export const ORDINE: { k: Ordin; litera: string; nume: string; unu: string; culoare: string }[] = [
  { k: "mii", litera: "M", nume: "mii", unu: "o mie", culoare: "#2e9e5b" },
  { k: "sute", litera: "S", nume: "sute", unu: "o sută", culoare: "#e0483e" },
  { k: "zeci", litera: "Z", nume: "zeci", unu: "o zece", culoare: "#2f6fd1" },
  { k: "unitati", litera: "U", nume: "unități", unu: "o unitate", culoare: "#f2a20c" },
];

const LATIME = 96; // fiecare tijă are o zonă de atingere de 96 px lățime (> 64 px)
const H = 400;
const BAZA = H - 56;
const R = 14;
const PAS = 29;
const cy = (b: number) => BAZA - R - 2 - b * PAS;

/**
 * Numărătoare interactivă pentru jocuri. Când pe o tijă se strâng 10 bile, cele 10 bile
 * alunecă împreună spre tija din stânga și devin o singură bilă: „10 unități = 1 zece”.
 * Animația (~450 ms) arată exact gestul de schimb pe care îl face copilul cu numărătoarea reală.
 */
export function NumaratoareAnimata({
  tije, bile, regrupare, onAtinge, onScoate, onRegrupat,
}: {
  tije: Ordin[];
  bile: Record<Ordin, number>;
  /** tija pe care s-au strâns 10 bile și se schimbă acum într-o bilă pe tija din stânga */
  regrupare: Ordin | null;
  onAtinge: (o: Ordin) => void;
  onScoate: (o: Ordin) => void;
  onRegrupat: () => void;
}) {
  const redus = useReducedMotion();
  const W = tije.length * LATIME + 24;
  const x = (i: number) => 12 + i * LATIME + LATIME / 2;
  const desc = tije.map((t) => `${bile[t]} ${ORDINE.find((o) => o.k === t)!.nume}`).join(", ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[min(44vh,520px)] w-auto max-w-full touch-manipulation select-none" role="img" aria-label={`Numărătoare: ${desc}`}>
      <rect x="6" y={BAZA} width={W - 12} height="20" rx="6" fill="#8a6a4a" />
      {tije.map((t, i) => {
        const o = ORDINE.find((q) => q.k === t)!;
        const n = regrupare === t ? 10 : bile[t];
        const tinta = i > 0 ? tije[i - 1] : null;
        return (
          <g key={t}>
            {/* zona mare de atingere: toată coloana tijei */}
            <rect x={x(i) - LATIME / 2 + 4} y="8" width={LATIME - 8} height={BAZA - 8} rx="18" fill="transparent"
              className="cursor-pointer" onClick={() => !regrupare && onAtinge(t)} />
            <rect x={x(i) - 4} y="16" width="8" height={BAZA - 16} rx="3" fill="#a3a3a3" pointerEvents="none" />
            {Array.from({ length: n }, (_, b) => {
              const seMuta = regrupare === t && tinta;
              const culoareTinta = tinta ? ORDINE.find((q) => q.k === tinta)!.culoare : o.culoare;
              // regrupare în două faze: 300 ms se văd cele 10 bile adunate, apoi 450 ms alunecă și devin una
              const tot = DURATA.scurt + 0.45;
              return (
                <motion.circle key={`${t}-${b}`} r={R} stroke="#0003" strokeWidth="1.5"
                  initial={redus ? false : { cx: x(i), cy: 10, opacity: 0 }}
                  animate={seMuta
                    ? { cx: [x(i), x(i), x(i - 1)], cy: [cy(b), cy(b), cy(bile[tinta])], fill: [o.culoare, o.culoare, culoareTinta], opacity: [1, 1, b === 0 ? 1 : 0] }
                    : { cx: x(i), cy: cy(b), fill: o.culoare, opacity: 1 }}
                  transition={seMuta ? { duration: redus ? 0 : tot, times: [0, DURATA.scurt / tot, 1], ease: [0.65, 0, 0.35, 1] } : tranzitie("scurt")}
                  onAnimationComplete={seMuta && b === 0 ? onRegrupat : undefined}
                  style={{ cursor: regrupare ? "default" : "pointer" }}
                  onClick={(e) => { e.stopPropagation(); if (!regrupare) onScoate(t); }} />
              );
            })}
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="26" fontWeight="800" fill="#2b2540">{o.litera}</text>
          </g>
        );
      })}
    </svg>
  );
}
