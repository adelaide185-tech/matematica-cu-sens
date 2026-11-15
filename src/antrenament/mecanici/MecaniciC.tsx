"use client";

import { useEffect, useState } from "react";
import { Ceas, Fractie } from "@/componente/svg/Vizual";

// ───────── fracții ─────────

export function FractieInteractiva({ forma, parti, onValoare, indiciu }: { forma: "cerc" | "dreptunghi"; parti: number; onValoare?: (v: number) => void; indiciu: number }) {
  const [sel, setSel] = useState<boolean[]>(() => Array(parti).fill(false));
  const n = sel.filter(Boolean).length;
  useEffect(() => onValoare?.(n), [n, onValoare]);
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <Fractie forma={forma} parti={parti} colorate={0} selectate={sel} marime={2.3} culoare={forma === "cerc" ? "#e07a1f" : "#7b4a2a"}
          onParte={(i) => setSel((s) => s.map((v, j) => (j === i ? !v : v)))} />
      </div>
      <p className="mt-2 text-lg">Ai colorat <b>{n}</b> din <b>{parti}</b> părți{indiciu >= 1 ? ` · fiecare parte este 1/${parti}` : ""}</p>
    </div>
  );
}

export function FractieAfisata({ forma, parti, colorate, intregi }: { forma: "cerc" | "dreptunghi"; parti: number; colorate: number; intregi?: number }) {
  const k = intregi ?? 1;
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {Array.from({ length: k }, (_, i) => (
        <Fractie key={i} forma={forma} parti={parti} colorate={Math.max(0, Math.min(parti, colorate - i * parti))} marime={k > 1 ? 1.4 : 2} />
      ))}
    </div>
  );
}

export function Benzi({ fractii }: { fractii: [number, number][] }) {
  const W = 480;
  return (
    <svg viewBox={`0 0 ${W + 90} ${fractii.length * 62 + 6}`} className="mx-auto w-full max-w-xl" role="img" aria-label={`Benzi de fracții: ${fractii.map(([c, p]) => `${c}/${p}`).join(" și ")}`}>
      {fractii.map(([c, p], k) => (
        <g key={k} transform={`translate(0, ${6 + k * 62})`}>
          <text x="0" y="32" fontSize="22" fontWeight="700" fill="#2c2350">{c}/{p}</text>
          {Array.from({ length: p }, (_, i) => (
            <rect key={i} x={80 + (i * W) / p} y="6" width={W / p} height="40" fill={i < c ? (k === 0 ? "#6a59a7" : "#2f6fd1") : "#fff"} stroke="#2c2350" strokeWidth="2" />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function Grila100({ colorate }: { colorate: number }) {
  return (
    <svg viewBox="0 0 204 204" className="mx-auto w-full max-w-[260px]" role="img" aria-label={`Grilă de 100 de pătrățele, ${colorate} colorate`}>
      {Array.from({ length: 100 }, (_, i) => (
        <rect key={i} x={2 + (i % 10) * 20} y={2 + Math.floor(i / 10) * 20} width="20" height="20" fill={i < colorate ? "#2e9e5b" : "#fff"} stroke="#555" strokeWidth="1" />
      ))}
    </svg>
  );
}

// ───────── ceasul interactiv ─────────

export function CeasInteractiv({ pas, onValoare, indiciu }: { pas: number; onValoare?: (v: number) => void; indiciu: number }) {
  // o singură stare: minutele de la ora 12 (0–719); acele se mișcă împreună, ca pe un ceas adevărat
  const [t, setT] = useState(0);
  useEffect(() => onValoare?.(t), [t, onValoare]);
  const h = Math.floor(t / 60) || 12;
  const m = t % 60;
  const ora = (d: number) => setT((x) => (x + d * 60 + 720) % 720);
  const minut = (d: number) => setT((x) => (x + d + 720) % 720);
  const Btn = ({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) => (
    <button type="button" onClick={onClick} aria-label={label} className="h-tinta min-w-tinta rounded-2xl bg-mov px-3 text-xl font-bold text-white shadow active:scale-95">{children}</button>
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <Ceas ore={h} minute={m} marime={2.2} />
      <div className="space-y-3">
        <div className="rounded-2xl bg-mov-deschis p-3 text-center">
          <div className="text-sm font-bold text-gray-700">Acul mic — ora</div>
          <div className="mt-1 flex items-center justify-center gap-2"><Btn onClick={() => ora(-1)} label="ora înapoi">−1</Btn><span className="w-10 text-3xl font-bold">{h}</span><Btn onClick={() => ora(1)} label="ora înainte">+1</Btn></div>
        </div>
        {pas < 60 && <div className="rounded-2xl bg-mov-deschis p-3 text-center">
          <div className="text-sm font-bold text-gray-700">Acul mare — minute</div>
          <div className="mt-1 flex items-center justify-center gap-2"><Btn onClick={() => minut(-pas)} label="minute înapoi">−{pas}</Btn><span className="w-12 text-3xl font-bold">{String(m).padStart(2, "0")}</span><Btn onClick={() => minut(pas)} label="minute înainte">+{pas}</Btn></div>
        </div>}
        {indiciu >= 1 && <p className="max-w-56 text-sm text-gray-600">Când acul mare face un ocol complet (60 de minute), acul mic avansează o oră.</p>}
      </div>
    </div>
  );
}

export function CeasAfisat({ ore, minute }: { ore: number; minute: number }) {
  return <div className="flex justify-center"><Ceas ore={ore} minute={minute} marime={2} /></div>;
}

// ───────── riglă, cântar, recipient ─────────

export function Rigla({ start, lungime, unitate, obiect, indiciu }: { start: number; lungime: number; unitate: string; obiect: string; indiciu: number }) {
  const max = Math.max(10, Math.ceil(start + lungime) + 1);
  const W = 560;
  const cm = (W - 30) / max;
  const x = (v: number) => 15 + v * cm;
  return (
    <svg viewBox={`0 0 ${W} 150`} className="mx-auto w-full max-w-2xl" role="img" aria-label={`Riglă: obiectul începe la ${start} cm`}>
      <rect x={x(start)} y="22" width={lungime * cm} height="34" rx="10" fill="#f9c50f" stroke="#a07a00" strokeWidth="2" />
      <text x={x(start) + 6} y="47" fontSize="22">{obiect}</text>
      {indiciu >= 1 && <><line x1={x(start)} y1="14" x2={x(start)} y2="80" stroke="#e07a1f" strokeWidth="2" strokeDasharray="4 3" /><line x1={x(start + lungime)} y1="14" x2={x(start + lungime)} y2="80" stroke="#e07a1f" strokeWidth="2" strokeDasharray="4 3" /></>}
      <rect x="5" y="64" width={W - 10} height="70" rx="6" fill="#fff6d6" stroke="#8a6a4a" strokeWidth="2" />
      {Array.from({ length: max * 10 + 1 }, (_, i) => {
        const cmFix = i % 10 === 0;
        if (!cmFix && unitate !== "mm" && i % 5 !== 0) return null;
        return <line key={i} x1={x(i / 10)} y1="64" x2={x(i / 10)} y2={64 + (cmFix ? 26 : i % 5 === 0 ? 16 : 9)} stroke="#2c2350" strokeWidth={cmFix ? 2 : 1} />;
      })}
      {Array.from({ length: max + 1 }, (_, i) => <text key={i} x={x(i)} y="118" textAnchor="middle" fontSize="15" fontWeight="700" fill="#2c2350">{i}</text>)}
      <text x={W - 14} y="130" textAnchor="end" fontSize="11" fill="#555">cm</text>
    </svg>
  );
}

export function Cantar({ valoare, max, pas, unitate, obiect }: { valoare: number; max: number; pas: number; unitate: string; obiect: string }) {
  const nr = Math.round(max / pas);
  const etichetaLa = nr <= 10 ? 1 : nr <= 20 ? 2 : nr <= 40 ? 5 : 10;
  const ang = (v: number) => Math.PI + (v / max) * Math.PI;
  const R = 120;
  return (
    <svg viewBox="0 0 300 200" className="mx-auto w-full max-w-sm" role="img" aria-label={`Cântar cu cadran de la 0 la ${max} ${unitate}`}>
      <text x="150" y="28" textAnchor="middle" fontSize="34">{obiect}</text>
      <path d={`M${150 - R - 14},170 A${R + 14},${R + 14} 0 0 1 ${150 + R + 14},170 Z`} fill="#fff" stroke="#6a59a7" strokeWidth="4" />
      {Array.from({ length: nr + 1 }, (_, i) => {
        const a = ang(i * pas);
        const lung = i % etichetaLa === 0 ? 14 : 7;
        return (
          <g key={i}>
            <line x1={150 + R * Math.cos(a)} y1={170 + R * Math.sin(a)} x2={150 + (R - lung) * Math.cos(a)} y2={170 + (R - lung) * Math.sin(a)} stroke="#2c2350" strokeWidth={i % etichetaLa === 0 ? 2 : 1} />
            {i % etichetaLa === 0 && <text x={150 + (R - 30) * Math.cos(a)} y={170 + (R - 30) * Math.sin(a) + 4} textAnchor="middle" fontSize="11" fontWeight="700">{i * pas}</text>}
          </g>
        );
      })}
      <line x1="150" y1="170" x2={150 + (R - 8) * Math.cos(ang(valoare))} y2={170 + (R - 8) * Math.sin(ang(valoare))} stroke="#e0483e" strokeWidth="4" strokeLinecap="round" />
      <circle cx="150" cy="170" r="7" fill="#2c2350" />
      <text x="150" y="194" textAnchor="middle" fontSize="13" fill="#555">{unitate}</text>
    </svg>
  );
}

export function Recipient({ valoare, max, pas, unitate }: { valoare: number; max: number; pas: number; unitate: string }) {
  const nr = Math.round(max / pas);
  const H = 240;
  const y = (v: number) => 260 - (v / max) * H;
  const eticheta = nr <= 12 ? 1 : nr <= 24 ? 2 : nr <= 40 ? 4 : 10;
  return (
    <svg viewBox="0 0 220 280" className="mx-auto w-full max-w-[220px]" role="img" aria-label={`Recipient gradat până la ${max} ${unitate}`}>
      <rect x="60" y={y(valoare)} width="90" height={260 - y(valoare)} fill="#7cc4f2" opacity=".85" />
      <path d="M60,14 L60,260 Q60,272 72,272 L138,272 Q150,272 150,260 L150,14" fill="none" stroke="#2c2350" strokeWidth="4" />
      {Array.from({ length: nr + 1 }, (_, i) => (
        <g key={i}>
          <line x1="150" y1={y(i * pas)} x2={i % eticheta === 0 ? 168 : 160} y2={y(i * pas)} stroke="#2c2350" strokeWidth={i % eticheta === 0 ? 2 : 1} />
          {i % eticheta === 0 && i > 0 && <text x="172" y={y(i * pas) + 4} fontSize="12" fontWeight="700">{i * pas}</text>}
        </g>
      ))}
      <text x="105" y="12" textAnchor="middle" fontSize="12" fill="#555">{unitate === "pahare" ? "pahare" : unitate}</text>
    </svg>
  );
}

// ───────── bani ─────────

const CULORI_BANCNOTE: Record<number, string> = { 100: "#7fb069", 500: "#b388c9", 1000: "#e07a5f", 5000: "#e9c46a", 10000: "#5fa8d3", 20000: "#9c8f6a" };

/** Monedă (bani) sau bancnotă (lei), desen generic cu valoarea scrisă. */
export function Piesa({ b, onClick }: { b: number; onClick?: () => void }) {
  const corp = b < 100 ? (
    <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden><circle cx="29" cy="29" r="26" fill={b === 50 ? "#e8c66a" : "#d6b76b"} stroke="#8a6a20" strokeWidth="3" /><text x="29" y="30" textAnchor="middle" fontSize="16" fontWeight="800" fill="#4a3a10">{b}</text><text x="29" y="44" textAnchor="middle" fontSize="9" fill="#4a3a10">bani</text></svg>
  ) : (
    <svg width="104" height="54" viewBox="0 0 104 54" aria-hidden><rect x="2" y="2" width="100" height="50" rx="6" fill={CULORI_BANCNOTE[b] ?? "#8ab"} stroke="#0005" strokeWidth="2" /><circle cx="26" cy="27" r="14" fill="#fff6" /><text x="70" y="32" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1f1b2e">{b / 100}</text><text x="70" y="45" textAnchor="middle" fontSize="10" fill="#1f1b2e">{b === 100 ? "leu" : "lei"}</text></svg>
  );
  const eticheta = b < 100 ? `${b} bani` : `${b / 100} ${b === 100 ? "leu" : "lei"}`;
  return onClick ? <button type="button" onClick={onClick} aria-label={`adaugă ${eticheta}`} className="flex min-h-tinta min-w-tinta items-center justify-center rounded-xl p-1 transition hover:bg-mov-deschis active:scale-95">{corp}</button> : <span role="img" aria-label={eticheta}>{corp}</span>;
}

export function Bani({ piese }: { piese: number[] }) {
  return <div className="flex flex-wrap items-center justify-center gap-2">{piese.map((b, i) => <Piesa key={i} b={b} />)}</div>;
}

export function Magazin({ disponibile, onValoare }: { disponibile: number[]; onValoare?: (v: number) => void }) {
  const [plata, setPlata] = useState<number[]>([]);
  const total = plata.reduce((a, b) => a + b, 0);
  useEffect(() => onValoare?.(total), [total, onValoare]);
  const text = (b: number) => (b % 100 === 0 ? `${b / 100} ${b === 100 ? "leu" : "lei"}` : b < 100 ? `${b} bani` : `${Math.floor(b / 100)} lei și ${b % 100} bani`);
  return (
    <div className="text-center">
      <div className="min-h-20 rounded-2xl border-4 border-dashed border-mov/40 bg-hartie p-2">
        <div className="mb-1 text-sm font-semibold text-gray-600">Pe tejghea (atinge ca să iei înapoi):</div>
        <div className="flex flex-wrap justify-center gap-1">
          {plata.map((b, i) => <button key={i} type="button" onClick={() => setPlata((p) => p.filter((_, j) => j !== i))} aria-label="ia înapoi" className="flex min-h-tinta min-w-tinta items-center justify-center"><Piesa b={b} /></button>)}
        </div>
      </div>
      <p className="my-2 text-xl">Ai pus: <b>{text(total)}</b></p>
      <div className="flex flex-wrap justify-center gap-1 rounded-2xl bg-galben-deschis p-2">
        {[...disponibile].sort((a, b) => b - a).map((b) => <Piesa key={b} b={b} onClick={() => setPlata((p) => [...p, b])} />)}
      </div>
    </div>
  );
}

// ───────── calendar și linia timpului ─────────

export function Fasie({ elemente, evidentiat }: { elemente: string[]; evidentiat?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {elemente.map((e, i) => (
        <span key={i} className={`rounded-xl px-3 py-2 text-lg font-bold ${i === evidentiat ? "bg-mov text-white" : "bg-mov-deschis text-mov-inchis"}`}>{e}</span>
      ))}
    </div>
  );
}

export function LinieTimp({ start, durata, indiciu }: { start: number; durata: number; indiciu: number }) {
  const h0 = Math.floor(start / 60);
  const h1 = Math.ceil((start + durata) / 60);
  const W = 540;
  const x = (min: number) => 20 + ((min - h0 * 60) / ((h1 - h0) * 60)) * (W - 40);
  const f = (v: number) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
  return (
    <svg viewBox={`0 0 ${W} 100`} className="mx-auto w-full max-w-2xl" role="img" aria-label={`Linia timpului de la ${f(start)}`}>
      <line x1="20" y1="60" x2={W - 20} y2="60" stroke="#2c2350" strokeWidth="3" />
      {Array.from({ length: h1 - h0 + 1 }, (_, i) => (
        <g key={i}><line x1={x((h0 + i) * 60)} y1="50" x2={x((h0 + i) * 60)} y2="70" stroke="#2c2350" strokeWidth="2" /><text x={x((h0 + i) * 60)} y="90" textAnchor="middle" fontSize="14" fontWeight="700">{h0 + i}:00</text></g>
      ))}
      <rect x={x(start)} y="52" width={Math.max(4, x(start + durata) - x(start))} height="16" rx="6" fill="#f9c50f" opacity=".85" />
      <circle cx={x(start)} cy="60" r="7" fill="#2e9e5b" />
      <text x={x(start)} y="38" textAnchor={x(start) < 70 ? "start" : "middle"} fontSize="13" fill="#2e9e5b" fontWeight="700">început {f(start)}</text>
      {indiciu >= 2 && <><circle cx={x(start + durata)} cy="60" r="7" fill="#e07a1f" /><text x={x(start + durata)} y="22" textAnchor="middle" fontSize="13" fill="#e07a1f" fontWeight="700">sfârșit</text></>}
    </svg>
  );
}
