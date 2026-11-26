"use client";

import { useEffect, useState } from "react";

/**
 * Puzzle-recompensă (fără presiune): fiecare joc terminat cu ⭐⭐⭐ deblochează o piesă.
 * 12 piese dintr-o ilustrație proprie; copilul le așază atingând piesa, apoi locul ei.
 * Puzzle-ul complet = insignă. Progresul stă în browser (per copil și dispozitiv).
 */
const CHEIE = "mcs-puzzle-c2";
export const PIESE = 12;
const COL = 4, L = 75; // 4 × 3 piese

interface Stare { piese: number; asezate: boolean[] }

export function citestePuzzle(): Stare {
  try {
    const s = JSON.parse(localStorage.getItem(CHEIE) ?? "null");
    if (s && Array.isArray(s.asezate)) return { piese: Math.min(PIESE, Number(s.piese) || 0), asezate: Array.from({ length: PIESE }, (_, i) => Boolean(s.asezate[i])) };
  } catch {}
  return { piese: 0, asezate: Array(PIESE).fill(false) };
}
function salveaza(s: Stare) {
  try { localStorage.setItem(CHEIE, JSON.stringify(s)); } catch {}
}
/** Deblochează o piesă nouă; întoarce true dacă a mai rămas ceva de deblocat. */
export function deblocheazaPiesa(): boolean {
  const s = citestePuzzle();
  if (s.piese >= PIESE) return false;
  salveaza({ ...s, piese: s.piese + 1 });
  return true;
}

/** Ilustrația (originală): un oraș cu rachetă, soare și curcubeu. */
function Scena() {
  return (
    <g>
      <defs>
        <linearGradient id="cer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7ec8ff" /><stop offset="1" stopColor="#d9f0ff" /></linearGradient>
      </defs>
      <rect width="300" height="225" fill="url(#cer)" />
      {["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#5e35b1"].map((c, i) => <path key={c} d={`M ${20 + i * 6} 170 A ${110 - i * 6} ${110 - i * 6} 0 0 1 ${240 - i * 6} 170`} fill="none" stroke={c} strokeWidth="6" />)}
      <circle cx="255" cy="40" r="24" fill="#ffd54f" stroke="#f9a825" strokeWidth="3" />
      <path d="M0 175 Q 60 130 120 170 T 300 160 V 225 H 0 Z" fill="#66bb6a" />
      <path d="M0 195 Q 80 170 160 195 T 300 190 V 225 H 0 Z" fill="#43a047" />
      <rect x="30" y="140" width="50" height="45" fill="#ffcc80" stroke="#8d6e63" strokeWidth="2" /><path d="M25 142 L55 115 L85 142 Z" fill="#e53935" /><rect x="48" y="160" width="14" height="25" fill="#6d4c41" />
      <rect x="205" y="135" width="10" height="45" fill="#6d4c41" /><circle cx="210" cy="125" r="22" fill="#2e7d32" />
      <g transform="translate(140 60) rotate(20)"><path d="M0 -40 Q 14 -20 12 20 H -12 Q -14 -20 0 -40 Z" fill="#eceff1" stroke="#546e7a" strokeWidth="2" /><circle cx="0" cy="-10" r="6" fill="#4fc3f7" stroke="#546e7a" strokeWidth="2" /><path d="M-12 10 L-22 26 L-10 22 Z M12 10 L22 26 L10 22 Z" fill="#e53935" /><path d="M-7 22 Q 0 42 7 22 Z" fill="#ffa000" /></g>
      {[[30, 30], [95, 22], [190, 75], [280, 95]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize="14">⭐</text>)}
      <text x="150" y="215" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" stroke="#2e7d32" strokeWidth="0.6">Matematică cu Sens</text>
    </g>
  );
}

function Piesa({ i, marime = 1 }: { i: number; marime?: number }) {
  const x = (i % COL) * L, y = Math.floor(i / COL) * L;
  return (
    <svg viewBox={`${x} ${y} ${L} ${L}`} width={L * marime} height={L * marime} aria-label={`Piesa ${i + 1}`}>
      <Scena />
      <rect x={x + 0.5} y={y + 0.5} width={L - 1} height={L - 1} fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export function PuzzleC2() {
  const [s, setS] = useState<Stare | null>(null);
  const [aleasa, setAleasa] = useState<number | null>(null);
  const [gresit, setGresit] = useState<number | null>(null);
  useEffect(() => setS(citestePuzzle()), []);
  if (!s) return null;
  // ordinea în care se deblochează piesele: amestecată, dar mereu aceeași
  const ordine = [5, 0, 10, 3, 8, 1, 11, 6, 2, 9, 4, 7];
  const deblocate = ordine.slice(0, s.piese);
  const inTava = deblocate.filter((p) => !s.asezate[p]);
  const gata = s.asezate.every(Boolean);
  const aseaza = (slot: number) => {
    if (aleasa === null || s.asezate[slot]) return;
    if (slot !== aleasa) { setGresit(slot); setTimeout(() => setGresit(null), 400); return; }
    const n = { ...s, asezate: s.asezate.map((x, i) => (i === slot ? true : x)) };
    setS(n); salveaza(n); setAleasa(null);
  };
  return (
    <section className="mt-6 rounded-3xl bg-hartie p-4 shadow">
      <h2 className="text-2xl font-bold text-mov">🧩 Puzzle-ul meu {gata && <span className="ml-2 rounded-full bg-galben px-3 py-1 text-base text-mov-inchis">🏅 Insigna „Puzzle-ul matematicii”</span>}</h2>
      <p className="text-gray-600">Fiecare joc terminat cu ⭐⭐⭐ îți dă o piesă. Ai {s.piese} din {PIESE}. Atinge o piesă, apoi locul ei.</p>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        <div className="grid gap-0.5 rounded-xl bg-white p-1 shadow-inner" style={{ gridTemplateColumns: `repeat(${COL}, ${L}px)` }}>
          {Array.from({ length: PIESE }, (_, i) => (
            <button key={i} type="button" onClick={() => aseaza(i)} aria-label={`Locul ${i + 1}`}
              className={`flex h-[75px] w-[75px] items-center justify-center ${s.asezate[i] ? "" : gresit === i ? "animate-[scutura_0.3s] bg-red-100" : "bg-mov-deschis"}`}>
              {s.asezate[i] ? <Piesa i={i} /> : <span className="text-mov/30">?</span>}
            </button>
          ))}
        </div>
        <div className="flex max-w-xs flex-wrap gap-2">
          {inTava.map((p) => (
            <button key={p} type="button" onClick={() => setAleasa(p)} className={`rounded-lg ${aleasa === p ? "ring-4 ring-galben" : "ring-2 ring-mov/20"}`}><Piesa i={p} marime={0.8} /></button>
          ))}
          {!inTava.length && !gata && <p className="text-sm text-gray-500">Joacă și câștigă piese noi! ⭐⭐⭐</p>}
        </div>
      </div>
    </section>
  );
}
