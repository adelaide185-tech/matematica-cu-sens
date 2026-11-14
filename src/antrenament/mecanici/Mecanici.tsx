"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Mecanica } from "../tipuri";
import { AxaNumerelor, Numaratoare } from "@/componente/svg/Vizual";
import { Bani, Benzi, CeasAfisat, CeasInteractiv, Cantar, Fasie, FractieAfisata, FractieInteractiva, Grila100, LinieTimp, Magazin, Recipient, Rigla } from "./MecaniciC";

/**
 * Vizualul fiecărui exercițiu. `indiciu` (0–3) aprinde treptat ajutoarele vizuale.
 * Mecanicile „construite” (blocuri, numărătoare, farfurii, ordonare) raportează valoarea prin `onValoare`.
 */
export function VizualExercitiu({ m, indiciu, onValoare, rezolvat }: { m: Mecanica; indiciu: number; onValoare?: (v: unknown) => void; rezolvat: boolean }) {
  switch (m.tip) {
    case "blocuri":
      return <Blocuri tinta={m.tinta} text={m.text} indiciu={indiciu} onValoare={onValoare} />;
    case "numaratoare":
      return m.construieste ? <NumaratoareInteractiva tinta={m.tinta} text={m.text} onValoare={onValoare} /> : <NumaratoareFixa n={m.tinta} />;
    case "axa":
      return <div className="mx-auto w-full max-w-xl"><AxaNumerelor de={m.de} pana={m.pana} pas={m.pas} marcate={m.marcaj !== undefined ? [m.marcaj] : []} /></div>;
    case "balanta":
      return <Balanta stanga={m.stanga} dreapta={m.dreapta} a={m.valStanga} b={m.valDreapta} rezolvat={rezolvat} />;
    case "cadru10":
      return <Cadru10 a={m.a} b={m.b} op={m.operatie} lipsa={m.lipsa} indiciu={indiciu} />;
    case "matrice":
      return <Matrice r={m.randuri} c={m.coloane} indiciu={indiciu} total={m.arataTotal} />;
    case "grupe":
      return <Grupe grupe={m.grupe} cate={m.cate} simbol={m.simbol} indiciu={indiciu} />;
    case "farfurii":
      return <Farfurii total={m.total} n={m.farfurii} simbol={m.simbol} />;
    case "sir":
      return <Sir elemente={m.elemente} />;
    case "coloana":
      return <Coloana a={m.a} b={m.b} op={m.operatie} indiciu={indiciu} />;
    case "bara":
      return <Bara parti={m.parti} total={m.total} comparatie={m.comparatie} />;
    case "perechi":
      return <Perechi n={m.n} simbol={m.simbol} indiciu={indiciu} />;
    case "ordonare":
      return <Ordonare numere={m.numere} onValoare={onValoare} />;
    case "expresie":
      return m.text ? <div className="text-center text-4xl font-bold text-mov-inchis sm:text-5xl">{m.text}</div> : null;
    case "fractie":
      return m.interactiv ? <FractieInteractiva forma={m.forma} parti={m.parti} onValoare={onValoare} indiciu={indiciu} /> : <FractieAfisata forma={m.forma} parti={m.parti} colorate={m.colorate} intregi={m.intregi} />;
    case "benzi":
      return <Benzi fractii={m.fractii} />;
    case "grila100":
      return <Grila100 colorate={m.colorate} />;
    case "ceas":
      return m.interactiv ? <CeasInteractiv pas={m.pasMinute ?? 5} onValoare={onValoare} indiciu={indiciu} /> : <CeasAfisat ore={m.ore} minute={m.minute} />;
    case "rigla":
      return <Rigla start={m.start} lungime={m.lungime} unitate={m.unitate} obiect={m.obiect} indiciu={indiciu} />;
    case "cantar":
      return <Cantar valoare={m.valoare} max={m.max} pas={m.pas} unitate={m.unitate} obiect={m.obiect} />;
    case "recipient":
      return <Recipient valoare={m.valoare} max={m.max} pas={m.pas} unitate={m.unitate} />;
    case "bani":
      return <Bani piese={m.piese} />;
    case "magazin":
      return <Magazin disponibile={m.disponibile} onValoare={onValoare} />;
    case "calendar":
      return <Fasie elemente={m.elemente} evidentiat={m.evidentiat} />;
    case "linieTimp":
      return <LinieTimp start={m.start} durata={m.durata} indiciu={indiciu} />;
  }
}

/** Mecanicile la care copilul construiește răspunsul direct pe obiect (fără tastatură). */
export function areIntrareProprie(m: Mecanica): boolean {
  return (
    m.tip === "blocuri" || m.tip === "ordonare" || m.tip === "magazin" ||
    (m.tip === "numaratoare" && Boolean(m.construieste)) ||
    (m.tip === "fractie" && Boolean(m.interactiv)) ||
    (m.tip === "ceas" && Boolean(m.interactiv))
  );
}

// ───────── blocuri baza 10 ─────────

const ORD = [
  { k: "mii", v: 1000, nume: "mii", culoare: "#2e9e5b" },
  { k: "sute", v: 100, nume: "sute", culoare: "#e0483e" },
  { k: "zeci", v: 10, nume: "zeci", culoare: "#2f6fd1" },
  { k: "unitati", v: 1, nume: "unități", culoare: "#f2a20c" },
] as const;

function Blocuri({ tinta, text, indiciu, onValoare }: { tinta: number; text: string; indiciu: number; onValoare?: (v: number) => void }) {
  const ordine = ORD.filter((o) => o.v <= Math.max(10, tinta));
  const [c, setC] = useState<Record<string, number>>({ mii: 0, sute: 0, zeci: 0, unitati: 0 });
  const total = ordine.reduce((t, o) => t + c[o.k] * o.v, 0);
  useEffect(() => onValoare?.(total), [total, onValoare]);
  const schimba = (k: string, d: number) => setC((x) => ({ ...x, [k]: Math.max(0, Math.min(9, x[k] + d)) }));
  return (
    <div className="w-full">
      <div className="mx-auto mb-3 w-fit max-w-full rounded-2xl bg-galben-deschis px-5 py-2 text-center text-3xl font-bold text-mov-inchis">{text}</div>
      <div className="flex min-h-[150px] flex-wrap items-end justify-center gap-4 rounded-2xl bg-white/70 p-3">
        {ordine.map((o) => (
          <div key={o.k} className="flex flex-wrap items-end gap-1" aria-label={`${c[o.k]} ${o.nume}`}>
            {Array.from({ length: c[o.k] }, (_, i) => <Bloc key={i} tip={o.k} culoare={o.culoare} />)}
          </div>
        ))}
        {total === 0 && <span className="self-center text-gray-400">Adaugă blocuri cu butoanele de mai jos</span>}
      </div>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${ordine.length}, minmax(0, 1fr))` }}>
        {ordine.map((o) => (
          <div key={o.k} className={`rounded-2xl bg-white p-2 text-center shadow ${indiciu >= 2 ? "ring-2 ring-galben" : ""}`}>
            <div className="text-sm font-bold" style={{ color: o.culoare }}>{o.nume}</div>
            <div className="text-2xl font-bold">{c[o.k]}</div>
            <div className="mt-1 flex justify-center gap-1">
              <button type="button" aria-label={`scoate o ${o.nume}`} onClick={() => schimba(o.k, -1)} className="h-14 w-14 rounded-xl bg-mov-deschis text-2xl font-bold text-mov">−</button>
              <button type="button" aria-label={`adaugă o ${o.nume}`} onClick={() => schimba(o.k, 1)} className="h-14 w-14 rounded-xl text-2xl font-bold text-white" style={{ background: o.culoare }}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-lg">Ai construit: <b>{total}</b></p>
    </div>
  );
}

function Bloc({ tip, culoare }: { tip: string; culoare: string }) {
  if (tip === "unitati") return <svg width="16" height="16" aria-hidden><rect x="1" y="1" width="14" height="14" fill={culoare} stroke="#0004" rx="2" /></svg>;
  if (tip === "zeci") return <svg width="16" height="80" aria-hidden>{Array.from({ length: 10 }, (_, i) => <rect key={i} x="1" y={1 + i * 7.8} width="14" height="7.8" fill={culoare} stroke="#0004" />)}</svg>;
  if (tip === "sute") return <svg width="80" height="80" aria-hidden><rect x="1" y="1" width="78" height="78" fill={culoare} stroke="#0004" />{Array.from({ length: 9 }, (_, i) => <g key={i}><line x1={1 + (i + 1) * 7.8} y1="1" x2={1 + (i + 1) * 7.8} y2="79" stroke="#0003" /><line y1={1 + (i + 1) * 7.8} x1="1" y2={1 + (i + 1) * 7.8} x2="79" stroke="#0003" /></g>)}</svg>;
  return <svg width="92" height="92" aria-hidden><rect x="12" y="1" width="78" height="78" fill={culoare} opacity=".55" stroke="#0004" /><rect x="6" y="7" width="78" height="78" fill={culoare} opacity=".75" stroke="#0004" /><rect x="1" y="13" width="78" height="78" fill={culoare} stroke="#0004" /><text x="40" y="58" textAnchor="middle" fill="#fff" fontWeight="700" fontSize="16">1000</text></svg>;
}

function NumaratoareInteractiva({ tinta, text, onValoare }: { tinta: number; text: string; onValoare?: (v: number) => void }) {
  const [b, setB] = useState({ sute: 0, zeci: 0, unitati: 0 });
  const v = b.sute * 100 + b.zeci * 10 + b.unitati;
  useEffect(() => onValoare?.(v), [v, onValoare]);
  return (
    <div className="text-center">
      <div className="mx-auto mb-2 w-fit rounded-2xl bg-galben-deschis px-5 py-2 text-3xl font-bold text-mov-inchis">{text}</div>
      <p className="text-sm text-gray-600">Atinge o tijă ca să adaugi o bilă; atinge o bilă ca s-o scoți.</p>
      <div className="flex justify-center">
        <Numaratoare sute={b.sute} zeci={b.zeci} unitati={b.unitati} marime={1.8}
          onTija={(o, d) => o !== "mii" && setB((x) => ({ ...x, [o]: Math.max(0, Math.min(9, x[o] + d)) }))} />
      </div>
      <p className="text-lg">Pe numărătoare: <b>{v}</b>{tinta >= 100 ? "" : ""}</p>
    </div>
  );
}

function NumaratoareFixa({ n }: { n: number }) {
  const c = String(n).padStart(3, "0").split("").map(Number);
  return <div className="flex justify-center"><Numaratoare sute={c[0]} zeci={c[1]} unitati={c[2]} marime={1.5} /></div>;
}

// ───────── balanța ─────────

function Balanta({ stanga, dreapta, a, b, rezolvat }: { stanga: string; dreapta: string; a: number; b: number; rezolvat: boolean }) {
  const redus = useReducedMotion();
  const unghi = rezolvat ? (a > b ? -8 : a < b ? 8 : 0) : 0;
  return (
    <svg viewBox="0 0 420 210" className="mx-auto w-full max-w-lg" role="img" aria-label={`Balanță: ${stanga} și ${dreapta}`}>
      <polygon points="210,90 180,195 240,195" fill="#8a6a4a" />
      <rect x="150" y="192" width="120" height="12" rx="6" fill="#6b4f35" />
      <motion.g animate={{ rotate: unghi }} transition={redus ? { duration: 0 } : { type: "spring", stiffness: 60 }} style={{ originX: "210px", originY: "90px" }}>
        <rect x="40" y="84" width="340" height="10" rx="5" fill="#6a59a7" />
        <circle cx="210" cy="90" r="9" fill="#f9c50f" />
        {[{ x: 75, t: stanga }, { x: 345, t: dreapta }].map(({ x, t }) => (
          <g key={x}>
            <line x1={x} y1="94" x2={x - 45} y2="140" stroke="#555" strokeWidth="2" />
            <line x1={x} y1="94" x2={x + 45} y2="140" stroke="#555" strokeWidth="2" />
            <path d={`M${x - 60},140 Q${x},175 ${x + 60},140 Z`} fill="#fff6d6" stroke="#c9a400" strokeWidth="2" />
            <text x={x} y="132" textAnchor="middle" fontSize={t.length > 9 ? 17 : 24} fontWeight="700" fill="#2c2350">{t}</text>
          </g>
        ))}
      </motion.g>
    </svg>
  );
}

// ───────── cadrul de 10 ─────────

function Cadru10({ a, b, op, lipsa, indiciu }: { a: number; b: number; op: "+" | "−"; lipsa?: boolean; indiciu: number }) {
  const total = op === "+" ? a + b : a;
  const cadre = total > 10 || (op === "+" && a + b > 10) ? 2 : 1;
  const culoare = (i: number) => {
    if (op === "+") {
      if (i < a) return "#e0483e";
      if (i < a + b) return lipsa ? (indiciu >= 1 ? "#f9c50f55" : "transparent") : i < 10 && indiciu >= 1 ? "#f9c50f" : "#2f6fd1";
      return "transparent";
    }
    if (i < a - b) return "#e0483e";
    if (i < a) return indiciu >= 1 ? "#ccc" : "#e0483e";
    return "transparent";
  };
  return (
    <div className="flex flex-wrap justify-center gap-4" role="img" aria-label={`Cadrul de 10: ${a} ${op} ${lipsa ? "?" : b}`}>
      {Array.from({ length: cadre }, (_, k) => (
        <svg key={k} viewBox="0 0 250 104" className="w-[250px] max-w-full">
          {Array.from({ length: 10 }, (_, j) => {
            const i = k * 10 + j;
            const x = 2 + (j % 5) * 49;
            const y = 2 + Math.floor(j / 5) * 50;
            const taiat = op === "−" && i >= a - b && i < a && indiciu >= 1;
            return (
              <g key={j}>
                <rect x={x} y={y} width="48" height="48" fill="#fff" stroke="#6a59a7" strokeWidth="2" />
                <circle cx={x + 24} cy={y + 24} r="17" fill={culoare(i)} stroke={culoare(i) === "transparent" ? "none" : "#0003"} />
                {taiat && <line x1={x + 8} y1={y + 40} x2={x + 40} y2={y + 8} stroke="#555" strokeWidth="4" />}
              </g>
            );
          })}
        </svg>
      ))}
    </div>
  );
}

// ───────── matrice, grupe, farfurii, perechi ─────────

function Matrice({ r, c, indiciu, total }: { r: number; c: number; indiciu: number; total?: boolean }) {
  const d = Math.min(30, 300 / Math.max(r, c));
  return (
    <div className="flex items-center justify-center gap-3">
      <svg viewBox={`0 0 ${c * d + 4} ${r * d + 4}`} width={c * d + 4} height={r * d + 4} className="max-w-full" role="img" aria-label={`${r} rânduri a câte ${c}`}>
        {Array.from({ length: r * c }, (_, i) => (
          <circle key={i} cx={2 + (i % c) * d + d / 2} cy={2 + Math.floor(i / c) * d + d / 2} r={d * 0.36} fill={Math.floor(i / c) % 2 ? "#2f6fd1" : "#6a59a7"} />
        ))}
      </svg>
      {indiciu >= 1 && (
        <div className="flex flex-col text-sm font-bold text-mov" style={{ gap: `${d - 20}px` }}>
          {Array.from({ length: r }, (_, i) => <span key={i} className="h-5 leading-5">{c * (i + 1)}</span>)}
        </div>
      )}
      {total && <span className="text-sm text-gray-600">{r} × {c}</span>}
    </div>
  );
}

function Grupe({ grupe, cate, simbol, indiciu }: { grupe: number; cate: number; simbol: string; indiciu: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {Array.from({ length: grupe }, (_, g) => (
        <div key={g} className="relative rounded-full border-4 border-dashed border-mov/50 bg-white px-3 py-2 text-2xl leading-tight" style={{ maxWidth: 170 }}>
          {simbol.repeat(cate)}
          {indiciu >= 1 && <span className="absolute -right-2 -top-3 rounded-full bg-galben px-2 text-sm font-bold">{cate * (g + 1)}</span>}
        </div>
      ))}
    </div>
  );
}

function Farfurii({ total, n, simbol }: { total: number; n: number; simbol: string }) {
  const [impartite, setImpartite] = useState(0);
  const runde = Math.floor(total / n);
  const ramase = total - impartite * n;
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 min-h-10 max-w-md text-2xl leading-tight" aria-label={`${ramase} rămase`}>{simbol.repeat(ramase)}</div>
      <div className="flex flex-wrap justify-center gap-3">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="flex h-24 w-24 flex-wrap content-center items-center justify-center rounded-full border-4 border-gray-300 bg-white p-2 text-xl leading-none shadow-inner">
            {simbol.repeat(impartite)}
          </div>
        ))}
      </div>
      <button type="button" disabled={impartite >= runde} onClick={() => setImpartite((x) => x + 1)}
        className="mt-3 rounded-2xl bg-galben px-5 py-3 text-lg font-bold text-mov-inchis disabled:opacity-40">
        {impartite >= runde ? (ramase > 0 ? `Nu mai ajunge pentru toți: rămân ${ramase}` : "Gata, s-au împărțit toate!") : "Împarte câte unul în fiecare farfurie"}
      </button>
    </div>
  );
}

function Perechi({ n, simbol, indiciu }: { n: number; simbol: string; indiciu: number }) {
  const perechi = Math.ceil(n / 2);
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-label={`${n} obiecte`}>
      {Array.from({ length: perechi }, (_, i) => {
        const singur = i === perechi - 1 && n % 2 === 1;
        return (
          <div key={i} className={`flex flex-col items-center rounded-xl px-1 py-1 text-3xl ${indiciu >= 1 ? (singur ? "bg-portocaliu/20 ring-2 ring-portocaliu" : "bg-verde/15 ring-2 ring-verde/40") : ""}`}>
            <span>{simbol}</span>
            {!singur && <span>{simbol}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ───────── șir, coloană, bare, ordonare ─────────

function Sir({ elemente }: { elemente: (number | null)[] }) {
  let k = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {elemente.map((e, i) => (
        <div key={i} className={`flex h-16 min-w-16 items-center justify-center rounded-2xl px-3 text-2xl font-bold ${e === null ? "border-4 border-dashed border-mov bg-white text-mov" : "bg-mov-deschis text-mov-inchis"}`}>
          {e === null ? `${++k}.` : e}
        </div>
      ))}
    </div>
  );
}

function Coloana({ a, b, op, indiciu }: { a: number; b: number; op: "+" | "−" | "×"; indiciu: number }) {
  const w = Math.max(String(a).length, String(b).length) + 1;
  const cif = (n: number) => String(n).padStart(w, " ").split("");
  const linie = (n: number, semn?: string) => (
    <div className="flex">
      <span className="w-10 text-center text-mov">{semn ?? ""}</span>
      {cif(n).map((d, i) => (
        <span key={i} className={`w-11 text-center ${indiciu >= 1 && i === w - 1 ? "rounded-lg bg-galben/60" : ""}`}>{d.trim()}</span>
      ))}
    </div>
  );
  return (
    <div className="mx-auto w-fit font-mono text-4xl font-bold text-mov-inchis" aria-label={`${a} ${op} ${b}`}>
      {indiciu >= 2 && op !== "×" && (
        <div className="flex text-base text-gray-500"><span className="w-10" />{cif(0).map((_, i) => <span key={i} className="w-11 text-center">{i === w - 2 ? "↖ ține minte" : ""}</span>)}</div>
      )}
      {linie(a)}
      {linie(b, op)}
      <div className="ml-10 border-t-4 border-mov-inchis" />
    </div>
  );
}

function Bara({ parti, total, comparatie }: { parti: { eticheta: string; valoare: number | null; culoare?: string }[]; total: number | null; comparatie?: boolean }) {
  const W = 520;
  const cunoscute = parti.map((p) => p.valoare ?? 0);
  const ref = Math.max(total ?? 0, cunoscute.reduce((a, b) => a + b, 0), 1);
  if (comparatie) {
    const [a, b, d] = parti;
    const baza = a.valoare ?? 1;
    const dif = d.valoare ?? 0;
    const maiMult = d.culoare === "#2e9e5b";
    const L = (v: number) => Math.max(40, (v / (baza + dif)) * (W - 140));
    return (
      <svg viewBox={`0 0 ${W} 120`} className="mx-auto w-full max-w-xl" role="img" aria-label="Desen cu bare pentru comparație">
        <text x="0" y="32" fontSize="16" fontWeight="700">{a.eticheta}</text>
        <rect x="110" y="12" width={L(baza)} height="30" rx="6" fill="#6a59a7" /><text x={110 + L(baza) / 2} y="33" textAnchor="middle" fill="#fff" fontWeight="700">{baza}</text>
        <text x="0" y="88" fontSize="16" fontWeight="700">{b.eticheta}</text>
        <rect x="110" y="68" width={maiMult ? L(baza) : L(baza) - L(dif) + 40} height="30" rx="6" fill="#2f6fd1" /><text x={110 + 30} y="89" fill="#fff" fontWeight="700">?</text>
        <rect x={maiMult ? 110 + L(baza) : 110 + L(baza) - L(dif) + 40} y="68" width={L(dif) - 40 > 10 ? L(dif) - 40 : 30} height="30" rx="6" fill={d.culoare} opacity={maiMult ? 1 : 0.35} strokeDasharray={maiMult ? "" : "6 4"} stroke="#555" />
        <text x={W - 4} y="118" textAnchor="end" fontSize="13" fill="#555">{d.eticheta}</text>
      </svg>
    );
  }
  const latimi = parti.map((p) => (p.valoare === null ? (total !== null ? Math.max(0, total - cunoscute.reduce((s, v) => s + v, 0)) / Math.max(1, parti.filter((x) => x.valoare === null).length) : ref / parti.length) : p.valoare));
  const sum = latimi.reduce((a, b) => a + b, 0) || 1;
  let x = 10;
  return (
    <svg viewBox={`0 0 ${W + 20} 120`} className="mx-auto w-full max-w-xl" role="img" aria-label="Desen cu bare: părți și întreg">
      <line x1="10" y1="18" x2={W + 10} y2="18" stroke="#555" strokeWidth="2" />
      <line x1="10" y1="10" x2="10" y2="26" stroke="#555" strokeWidth="2" /><line x1={W + 10} y1="10" x2={W + 10} y2="26" stroke="#555" strokeWidth="2" />
      <text x={W / 2 + 10} y="12" textAnchor="middle" fontSize="16" fontWeight="700">{total ?? "?"}</text>
      {parti.map((p, i) => {
        const w = (latimi[i] / sum) * W;
        const g = (
          <g key={i}>
            <rect x={x} y="34" width={w} height="44" fill={p.culoare ?? (p.valoare === null ? "#fff" : "#6a59a7")} stroke="#2c2350" strokeWidth="2" strokeDasharray={p.valoare === null ? "6 4" : ""} />
            <text x={x + w / 2} y="62" textAnchor="middle" fontSize="18" fontWeight="700" fill={p.valoare === null || p.culoare ? "#2c2350" : "#fff"}>{p.valoare ?? "?"}</text>
            {p.eticheta && <text x={x + w / 2} y="98" textAnchor="middle" fontSize="13" fill="#555">{p.eticheta}</text>}
          </g>
        );
        x += w;
        return g;
      })}
    </svg>
  );
}

function Ordonare({ numere, onValoare }: { numere: number[]; onValoare?: (v: number[]) => void }) {
  const [alese, setAlese] = useState<number[]>([]);
  useEffect(() => onValoare?.(alese), [alese, onValoare]);
  return (
    <div className="text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {numere.map((n) => {
          const poz = alese.indexOf(n);
          return (
            <button key={n} type="button" onClick={() => setAlese((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]))}
              className={`relative h-20 min-w-24 rounded-2xl px-4 text-3xl font-bold shadow transition ${poz >= 0 ? "bg-mov text-white" : "bg-white text-mov-inchis ring-2 ring-mov/20"}`}>
              {n}
              {poz >= 0 && <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-galben text-base leading-7 text-mov-inchis">{poz + 1}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-gray-600">Atinge din nou un număr ca să-l scoți din șir.</p>
    </div>
  );
}
