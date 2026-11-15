"use client";

import { motion, useReducedMotion } from "framer-motion";
import { tranzitie } from "@/jocuri/miscare";
import { MEDALII, type Medalie } from "@/motor/clasa1/tipuri";

/** Cursa prietenoasă: racheta înaintează spre planetă la fiecare exercițiu terminat. */
export function PistaRacheta({ facute, total }: { facute: number; total: number }) {
  const redus = useReducedMotion();
  const p = total ? Math.min(1, facute / total) : 0;
  return (
    <div className="relative mx-auto h-16 w-full max-w-3xl" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={facute} aria-label={`${facute} din ${total} exerciții`}>
      <div className="absolute inset-x-8 top-1/2 h-4 -translate-y-1/2 rounded-full bg-mov-deschis" />
      <motion.div className="absolute left-8 top-1/2 h-4 -translate-y-1/2 rounded-full bg-galben" initial={false}
        animate={{ width: `calc((100% - 4rem) * ${p})` }} transition={redus ? { duration: 0 } : tranzitie("lung")} />
      {Array.from({ length: Math.min(total, 20) - 1 }, (_, i) => (
        <span key={i} aria-hidden className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-mov/40"
          style={{ left: `calc(2rem + (100% - 4rem) * ${(i + 1) / Math.min(total, 20)})` }}>✦</span>
      ))}
      <motion.span aria-hidden className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl" initial={false}
        animate={{ left: `calc(2rem + (100% - 4rem) * ${p})` }} transition={redus ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 14 }}>
        🚀
      </motion.span>
      <span aria-hidden className="absolute right-0 top-1/2 -translate-y-1/2 text-4xl">🪐</span>
    </div>
  );
}

/** Cronometru blând (doar dacă profesorul l-a pornit): o bară care se golește, fără roșu și fără sunete. */
export function BaraTimp({ ramas, total }: { ramas: number; total: number }) {
  const p = Math.max(0, Math.min(1, ramas / total));
  return (
    <div className="mx-auto mt-2 flex w-full max-w-md items-center gap-2" aria-label={`Mai ai ${Math.ceil(ramas)} secunde`}>
      <span aria-hidden className="text-2xl">⏳</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-mov-deschis">
        <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${p * 100}%`, background: p > 0.3 ? "#2e9e5b" : "#f2a20c" }} />
      </div>
      <span className="w-8 text-right font-bold text-mov">{Math.ceil(ramas)}</span>
    </div>
  );
}

export function InsignaMedalie({ m, mare = false }: { m: Medalie | null; mare?: boolean }) {
  if (!m) return <span className={mare ? "text-7xl" : "text-2xl"} aria-label="fără medalie încă">🌱</span>;
  const d = MEDALII[m];
  return (
    <span className={`inline-flex items-center gap-2 font-bold ${mare ? "text-3xl" : "text-base"}`} style={{ color: d.culoare }}>
      <span className={mare ? "text-8xl" : "text-2xl"} aria-hidden>{d.icon}</span>
      {d.nume}
    </span>
  );
}

/** Balanța numerelor: se înclină spre partea mai grea după răspunsul corect. */
export function BalantaC1({ stanga, dreapta, inclinare }: { stanga: string; dreapta: string; inclinare: -1 | 0 | 1 | null }) {
  const redus = useReducedMotion();
  // -1 = stânga mai grea (coboară), 1 = dreapta mai grea
  const unghi = inclinare === null ? 0 : inclinare * 9;
  return (
    <svg viewBox="0 0 460 230" className="mx-auto w-full max-w-xl" role="img" aria-label={`Balanță: ${stanga} și ${dreapta}`}>
      <polygon points="230,98 196,212 264,212" fill="#8a6a4a" />
      <rect x="160" y="208" width="140" height="14" rx="7" fill="#6b4f35" />
      <motion.g animate={{ rotate: unghi }} transition={redus ? { duration: 0 } : { type: "spring", stiffness: 55, damping: 9 }} style={{ originX: "230px", originY: "98px" }}>
        <rect x="35" y="92" width="390" height="12" rx="6" fill="#6a59a7" />
        <circle cx="230" cy="98" r="11" fill="#f9c50f" />
        {[{ x: 80, t: stanga }, { x: 380, t: dreapta }].map(({ x, t }) => (
          <g key={x}>
            <line x1={x} y1="104" x2={x - 55} y2="154" stroke="#555" strokeWidth="2.5" />
            <line x1={x} y1="104" x2={x + 55} y2="154" stroke="#555" strokeWidth="2.5" />
            <path d={`M${x - 72},154 Q${x},196 ${x + 72},154 Z`} fill="#fff6d6" stroke="#c9a400" strokeWidth="2.5" />
            <rect x={x - 62} y={112} width={124} height={38} rx={12} fill="#ffffff" stroke="#6a59a7" strokeWidth="2.5" />
            <text x={x} y="141" textAnchor="middle" fontSize={t.length > 8 ? 20 : 28} fontWeight="800" fill="#2c2350">{t}</text>
          </g>
        ))}
      </motion.g>
    </svg>
  );
}
