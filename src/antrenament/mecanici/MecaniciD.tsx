"use client";

import { useEffect, useState } from "react";
import type { Corp, FormaPlana } from "../tipuri";

// ───────── figuri plane ─────────

/** Punctele unei figuri regulate / speciale, centrate în (cx, cy), cu „raza” r și rotirea rot (grade). */
export function puncteForma(forma: FormaPlana, cx: number, cy: number, r: number, rot: number): [number, number][] {
  const regulat = (n: number, start = -90) => Array.from({ length: n }, (_, i) => {
    const a = ((start + (i * 360) / n) * Math.PI) / 180;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  });
  let p: [number, number][];
  switch (forma) {
    case "triunghi": p = regulat(3); break;
    case "patrat": p = [[-r * 0.75, -r * 0.75], [r * 0.75, -r * 0.75], [r * 0.75, r * 0.75], [-r * 0.75, r * 0.75]]; break;
    case "dreptunghi": p = [[-r, -r * 0.55], [r, -r * 0.55], [r, r * 0.55], [-r, r * 0.55]]; break;
    case "pentagon": p = regulat(5); break;
    case "hexagon": p = regulat(6, 0); break;
    case "romb": p = [[0, -r], [r * 0.7, 0], [0, r], [-r * 0.7, 0]]; break;
    case "trapez": p = [[-r * 0.5, -r * 0.55], [r * 0.5, -r * 0.55], [r, r * 0.55], [-r, r * 0.55]]; break;
    default: p = [];
  }
  const a = (rot * Math.PI) / 180;
  return p.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
}

export function FormaSVG({ forma, cx, cy, r, rot, culoare }: { forma: FormaPlana; cx: number; cy: number; r: number; rot: number; culoare: string }) {
  if (forma === "cerc") return <circle cx={cx} cy={cy} r={r * 0.85} fill={culoare} fillOpacity=".85" stroke="#2c2350" strokeWidth="2" />;
  if (forma === "oval") return <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.6} transform={`rotate(${rot} ${cx} ${cy})`} fill={culoare} fillOpacity=".85" stroke="#2c2350" strokeWidth="2" />;
  return <polygon points={puncteForma(forma, cx, cy, r, rot).map((p) => p.join(",")).join(" ")} fill={culoare} fillOpacity=".85" stroke="#2c2350" strokeWidth="2" strokeLinejoin="round" />;
}

export function Figura({ forma, rotatie, culoare, axa }: { forma: FormaPlana; rotatie: number; culoare: string; axa?: number }) {
  const a = axa !== undefined ? ((axa - 90) * Math.PI) / 180 : 0;
  return (
    <svg viewBox="0 0 240 200" className="mx-auto w-full max-w-[260px]" role="img" aria-label="Figură geometrică">
      <FormaSVG forma={forma} cx={120} cy={100} r={80} rot={rotatie} culoare={culoare} />
      {axa !== undefined && (
        <line x1={120 - 105 * Math.sin(-a)} y1={100 - 105 * Math.cos(-a)} x2={120 + 105 * Math.sin(-a)} y2={100 + 105 * Math.cos(-a)}
          stroke="#e0483e" strokeWidth="3" strokeDasharray="8 6" />
      )}
    </svg>
  );
}

// ───────── corpuri ─────────

export function CorpSVG({ corp, culoare }: { corp: Corp; culoare: string }) {
  const umbra = "#0003";
  const linie = { stroke: "#2c2350", strokeWidth: 2, strokeLinejoin: "round" as const };
  const ascuns = { stroke: "#2c2350", strokeWidth: 1.5, strokeDasharray: "5 4", fill: "none" };
  let desen: React.ReactNode;
  switch (corp) {
    case "cub":
    case "paralelipiped": {
      const w = corp === "cub" ? 100 : 150, h = 100, d = 40;
      const x = 120 - (w + d) / 2, y = 40;
      desen = (
        <>
          <polygon points={`${x},${y + d} ${x + d},${y} ${x + d + w},${y} ${x + w},${y + d}`} fill={culoare} opacity=".7" {...linie} />
          <polygon points={`${x + w},${y + d} ${x + d + w},${y} ${x + d + w},${y + h} ${x + w},${y + d + h}`} fill={culoare} opacity=".85" {...linie} />
          <rect x={x} y={y + d} width={w} height={h} fill={culoare} {...linie} />
          <path d={`M${x},${y + d + h} L${x + d},${y + h} L${x + d + w},${y + h} M${x + d},${y + h} L${x + d},${y}`} {...ascuns} />
        </>
      );
      break;
    }
    case "sfera":
      desen = (
        <>
          <defs><radialGradient id="sf" cx="35%" cy="35%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor={culoare} /></radialGradient></defs>
          <circle cx="120" cy="100" r="75" fill="url(#sf)" {...linie} />
          <ellipse cx="120" cy="100" rx="75" ry="20" fill="none" stroke="#2c2350" strokeWidth="1.5" strokeDasharray="5 4" />
        </>
      );
      break;
    case "cilindru":
      desen = (
        <>
          <rect x="65" y="40" width="110" height="120" fill={culoare} />
          <ellipse cx="120" cy="160" rx="55" ry="16" fill={culoare} {...linie} />
          <rect x="65" y="40" width="110" height="120" fill={culoare} />
          <line x1="65" y1="40" x2="65" y2="160" {...linie} /><line x1="175" y1="40" x2="175" y2="160" {...linie} />
          <path d="M65,160 A55,16 0 0 1 175,160" {...ascuns} />
          <ellipse cx="120" cy="40" rx="55" ry="16" fill={culoare} opacity=".75" {...linie} />
        </>
      );
      break;
    case "con":
      desen = (
        <>
          <polygon points="120,25 60,160 180,160" fill={culoare} {...linie} />
          <ellipse cx="120" cy="160" rx="60" ry="17" fill={culoare} {...linie} />
          <path d="M60,160 A60,17 0 0 1 180,160" {...ascuns} />
          <polygon points="120,25 61,158 179,158" fill={culoare} stroke="none" />
          <path d="M120,25 L60,160 M120,25 L180,160" {...linie} fill="none" />
        </>
      );
      break;
    case "piramida":
      desen = (
        <>
          <polygon points="55,160 150,160 120,25" fill={culoare} {...linie} />
          <polygon points="150,160 195,130 120,25" fill={culoare} opacity=".75" {...linie} />
          <path d="M55,160 L100,130 L195,130 M100,130 L120,25" {...ascuns} />
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 240 190" className="mx-auto w-full max-w-[260px]" role="img" aria-label="Corp geometric">
      <ellipse cx="120" cy="178" rx="80" ry="8" fill={umbra} />
      {desen}
    </svg>
  );
}

export function Obiecte({ elemente }: { elemente: string[] }) {
  return <div className="flex justify-center gap-4 text-6xl">{elemente.map((e, i) => <span key={i}>{e}</span>)}</div>;
}

// ───────── linii și unghiuri ─────────

const Sageata = ({ id }: { id: string }) => (
  <defs><marker id={id} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2c2350" /></marker></defs>
);

export function Linie({ fel, rotatie }: { fel: string; rotatie: number }) {
  const L = 120;
  const t = `rotate(${rotatie} 160 90)`;
  const punct = (x: number, y: number, n: string) => <g><circle cx={x} cy={y} r="6" fill="#e0483e" /><text x={x + 4} y={y - 12} fontSize="16" fontWeight="700" transform={`rotate(${-rotatie} ${x} ${y})`}>{n}</text></g>;
  let d: React.ReactNode;
  switch (fel) {
    case "punct": d = punct(160, 90, "A"); break;
    case "dreapta": d = <line x1={160 - L} y1="90" x2={160 + L} y2="90" stroke="#2c2350" strokeWidth="4" markerStart="url(#s)" markerEnd="url(#s)" />; break;
    case "semidreapta": d = <><line x1={160 - L} y1="90" x2={160 + L} y2="90" stroke="#2c2350" strokeWidth="4" markerEnd="url(#s)" />{punct(160 - L, 90, "O")}</>; break;
    case "segment": d = <><line x1={160 - L} y1="90" x2={160 + L} y2="90" stroke="#2c2350" strokeWidth="4" />{punct(160 - L, 90, "A")}{punct(160 + L, 90, "B")}</>; break;
    case "paralele": d = <><line x1={160 - L} y1="60" x2={160 + L} y2="60" stroke="#2c2350" strokeWidth="4" markerStart="url(#s)" markerEnd="url(#s)" /><line x1={160 - L} y1="120" x2={160 + L} y2="120" stroke="#2f6fd1" strokeWidth="4" markerStart="url(#s)" markerEnd="url(#s)" /></>; break;
    case "perpendiculare": d = <><line x1={160 - L} y1="90" x2={160 + L} y2="90" stroke="#2c2350" strokeWidth="4" /><line x1="160" y1="10" x2="160" y2="170" stroke="#2f6fd1" strokeWidth="4" /><rect x="160" y="72" width="18" height="18" fill="none" stroke="#e0483e" strokeWidth="2" /></>; break;
    default: d = <><line x1={160 - L} y1="90" x2={160 + L} y2="90" stroke="#2c2350" strokeWidth="4" /><line x1={160 - 80} y1="170" x2={160 + 80} y2="10" stroke="#2f6fd1" strokeWidth="4" /></>;
  }
  return <svg viewBox="0 0 320 180" className="mx-auto w-full max-w-md" role="img" aria-label="Desen cu linii"><Sageata id="s" /><g transform={t}>{d}</g></svg>;
}

export function Unghi({ grade, rotatie, indiciu }: { grade: number; rotatie: number; indiciu: number }) {
  const cx = 150, cy = 120, R = 110;
  const a = (g: number) => ((rotatie - g) * Math.PI) / 180;
  const p = (g: number, r: number) => [cx + r * Math.cos(a(g)), cy + r * Math.sin(a(g))];
  const [x1, y1] = p(0, R), [x2, y2] = p(grade, R);
  const [ax, ay] = p(0, 34), [bx, by] = p(grade, 34);
  return (
    <svg viewBox="0 0 300 240" className="mx-auto w-full max-w-sm" role="img" aria-label="Unghi">
      {indiciu >= 1 && (() => { const [c1x, c1y] = p(0, 60), [c2x, c2y] = p(90, 60), [c3x, c3y] = [c1x + c2x - cx, c1y + c2y - cy]; return <polygon points={`${cx},${cy} ${c1x},${c1y} ${c3x},${c3y} ${c2x},${c2y}`} fill="#f9c50f55" stroke="#c9a400" strokeWidth="2" />; })()}
      <path d={`M${ax},${ay} A34,34 0 ${grade > 180 ? 1 : 0} 0 ${bx},${by}`} fill="none" stroke="#e0483e" strokeWidth="3" />
      <line x1={cx} y1={cy} x2={x1} y2={y1} stroke="#2c2350" strokeWidth="5" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#2c2350" strokeWidth="5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#2c2350" />
    </svg>
  );
}

export function Scena({ forme }: { forme: { forma: FormaPlana; x: number; y: number; s: number; rot: number; culoare: string }[] }) {
  return (
    <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-md rounded-2xl bg-white" role="img" aria-label={`${forme.length} figuri`}>
      {forme.map((f, i) => <FormaSVG key={i} forma={f.forma} cx={f.x} cy={f.y} r={f.s} rot={f.rot} culoare={f.culoare} />)}
    </svg>
  );
}

// ───────── rețea: perimetru, arie, simetrie ─────────

export function Grila({ latime, inaltime, celule, laturi, indiciu }: { latime: number; inaltime: number; celule: number[]; laturi?: { L: number; l: number }; indiciu: number }) {
  const c = 34;
  const s = new Set(celule);
  if (laturi) {
    const W = 260, H = laturi.L === laturi.l ? 200 : 130;
    return (
      <svg viewBox="0 0 360 260" className="mx-auto w-full max-w-sm" role="img" aria-label="Figură cu laturile date">
        <rect x={(360 - W) / 2} y={(260 - H) / 2} width={W} height={H} fill="#6a59a744" stroke="#2c2350" strokeWidth="3" />
        <text x="180" y={(260 - H) / 2 - 10} textAnchor="middle" fontSize="20" fontWeight="700">{laturi.L} cm</text>
        <text x={(360 + W) / 2 + 8} y="136" fontSize="20" fontWeight="700">{laturi.l || "?"}{laturi.l ? " cm" : ""}</text>
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${latime * c + 4} ${inaltime * c + 4}`} className="mx-auto w-full max-w-md" role="img" aria-label={`Figură pe rețea, ${celule.length} pătrățele`}>
      {Array.from({ length: latime * inaltime }, (_, i) => (
        <rect key={i} x={2 + (i % latime) * c} y={2 + Math.floor(i / latime) * c} width={c} height={c} fill={s.has(i) ? "#6a59a7" : "#fff"} fillOpacity={s.has(i) ? 0.75 : 1} stroke="#c9cbe0" strokeWidth="1" />
      ))}
      {indiciu >= 1 && celule.map((i) => <text key={i} x={2 + (i % latime) * c + c / 2} y={2 + Math.floor(i / latime) * c + c / 2 + 5} textAnchor="middle" fontSize="13" fill="#fff" fontWeight="700">{celule.indexOf(i) + 1}</text>)}
    </svg>
  );
}

export function SimetrieGrila({ latime, inaltime, celule, axa, interactiv, onValoare }: { latime: number; inaltime: number; celule: number[]; axa: "verticala" | "orizontala"; interactiv: boolean; onValoare?: (v: number[]) => void }) {
  const c = 40;
  const date = new Set(celule);
  const [alese, setAlese] = useState<number[]>([]);
  useEffect(() => onValoare?.(alese), [alese, onValoare]);
  const deCealaltaParte = (i: number) => (axa === "verticala" ? i % latime >= latime / 2 : Math.floor(i / latime) >= inaltime / 2);
  return (
    <div className="text-center">
      <svg viewBox={`0 0 ${latime * c + 4} ${inaltime * c + 4}`} className="mx-auto w-full max-w-md touch-manipulation" role="img" aria-label="Rețea pentru simetrie">
        {Array.from({ length: latime * inaltime }, (_, i) => {
          const ales = alese.includes(i);
          const poate = interactiv && deCealaltaParte(i);
          return (
            <rect key={i} x={2 + (i % latime) * c} y={2 + Math.floor(i / latime) * c} width={c} height={c}
              fill={date.has(i) ? "#6a59a7" : ales ? "#f9c50f" : poate ? "#fffdf2" : "#fff"} stroke="#c9cbe0" strokeWidth="1"
              style={poate ? { cursor: "pointer" } : undefined}
              onClick={poate ? () => setAlese((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i])) : undefined} />
          );
        })}
        {axa === "verticala"
          ? <line x1={2 + (latime / 2) * c} y1="0" x2={2 + (latime / 2) * c} y2={inaltime * c + 4} stroke="#e0483e" strokeWidth="4" strokeDasharray="10 6" />
          : <line x1="0" y1={2 + (inaltime / 2) * c} x2={latime * c + 4} y2={2 + (inaltime / 2) * c} stroke="#e0483e" strokeWidth="4" strokeDasharray="10 6" />}
      </svg>
      {interactiv && <p className="mt-2 text-gray-600">Atinge pătrățelele de partea cealaltă a liniei. Ai colorat: <b>{alese.length}</b></p>}
    </div>
  );
}

export function Coordonate({ max, punct, interactiv, onValoare }: { max: number; punct?: [number, number]; interactiv?: boolean; onValoare?: (v: number) => void }) {
  const [p, setP] = useState<[number, number] | null>(null);
  useEffect(() => { if (p) onValoare?.(p[0] * 100 + p[1]); }, [p, onValoare]);
  const u = 300 / max;
  const X = (x: number) => 40 + x * u;
  const Y = (y: number) => 330 - y * u;
  const afisat = interactiv ? p : punct;
  return (
    <svg viewBox="0 0 370 370" className="mx-auto w-full max-w-sm touch-manipulation" role="img" aria-label={`Rețea de coordonate de la 0 la ${max}`}>
      {Array.from({ length: max + 1 }, (_, i) => (
        <g key={i}>
          <line x1={X(i)} y1={Y(0)} x2={X(i)} y2={Y(max)} stroke="#d5d7ea" />
          <line x1={X(0)} y1={Y(i)} x2={X(max)} y2={Y(i)} stroke="#d5d7ea" />
          <text x={X(i)} y={Y(0) + 22} textAnchor="middle" fontSize="15" fontWeight="700">{i}</text>
          {i > 0 && <text x={X(0) - 14} y={Y(i) + 5} textAnchor="middle" fontSize="15" fontWeight="700">{i}</text>}
        </g>
      ))}
      <line x1={X(0)} y1={Y(0)} x2={X(max) + 15} y2={Y(0)} stroke="#2c2350" strokeWidth="3" />
      <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(max) - 15} stroke="#2c2350" strokeWidth="3" />
      <text x={X(max) + 18} y={Y(0) + 5} fontSize="15" fontWeight="700">x</text>
      <text x={X(0) - 5} y={Y(max) - 20} fontSize="15" fontWeight="700">y</text>
      {interactiv && Array.from({ length: (max + 1) ** 2 }, (_, i) => {
        const x = i % (max + 1), y = Math.floor(i / (max + 1));
        return <circle key={i} cx={X(x)} cy={Y(y)} r={u / 2.4} fill="transparent" style={{ cursor: "pointer" }} onClick={() => setP([x, y])} aria-label={`punctul (${x}, ${y})`} />;
      })}
      {afisat && <text x={X(afisat[0])} y={Y(afisat[1]) + 9} textAnchor="middle" fontSize="26" style={{ pointerEvents: "none" }}>💎</text>}
    </svg>
  );
}

// ───────── tabele și grafice ─────────

export function Tabel({ titlu, coloane, randuri }: { titlu: string; coloane: [string, string]; randuri: [string, number][] }) {
  return (
    <table className="mx-auto min-w-64 overflow-hidden rounded-2xl text-left text-xl shadow">
      <caption className="mb-2 text-lg font-bold text-mov">{titlu}</caption>
      <thead className="bg-mov text-white"><tr><th className="px-5 py-2">{coloane[0]}</th><th className="px-5 py-2 text-right">{coloane[1]}</th></tr></thead>
      <tbody>{randuri.map(([e, v], i) => <tr key={e} className={i % 2 ? "bg-mov-deschis" : "bg-white"}><td className="px-5 py-2">{e}</td><td className="px-5 py-2 text-right font-bold">{v}</td></tr>)}</tbody>
    </table>
  );
}

export function Grafic({ titlu, bare, pas, pictograma }: { titlu: string; bare: { eticheta: string; valoare: number }[]; pas: number; pictograma?: { simbol: string; valoare: number } }) {
  if (pictograma) {
    return (
      <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-center text-lg font-bold text-mov">{titlu}</div>
        {bare.map((b) => (
          <div key={b.eticheta} className="flex items-center gap-3 border-b border-mov/10 py-1 last:border-0">
            <span className="w-24 text-right font-semibold">{b.eticheta}</span>
            <span className="text-2xl tracking-wider">{pictograma.simbol.repeat(b.valoare / pictograma.valoare)}</span>
          </div>
        ))}
        <div className="mt-2 text-center text-sm font-bold text-portocaliu">{pictograma.simbol} = {pictograma.valoare}</div>
      </div>
    );
  }
  const max = Math.ceil(Math.max(...bare.map((b) => b.valoare)) / pas) * pas || pas;
  const H = 220, W = 60 + bare.length * 80;
  const y = (v: number) => 20 + H - (v / max) * H;
  const culori = ["#6a59a7", "#2f6fd1", "#e07a1f", "#2e9e5b", "#e0483e"];
  return (
    <svg viewBox={`0 0 ${W} ${H + 70}`} className="mx-auto w-full max-w-xl" role="img" aria-label={`Grafic cu bare: ${titlu}`}>
      <text x={W / 2} y="14" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4f4183">{titlu}</text>
      {Array.from({ length: max / pas + 1 }, (_, i) => (
        <g key={i}><line x1="50" y1={y(i * pas)} x2={W - 10} y2={y(i * pas)} stroke="#e2e3ef" /><text x="44" y={y(i * pas) + 4} textAnchor="end" fontSize="12">{i * pas}</text></g>
      ))}
      {bare.map((b, i) => (
        <g key={b.eticheta}>
          <rect x={64 + i * 80} y={y(b.valoare)} width="52" height={y(0) - y(b.valoare)} rx="4" fill={culori[i % culori.length]} />
          <text x={90 + i * 80} y={y(0) + 18} textAnchor="middle" fontSize="13" fontWeight="600">{b.eticheta}</text>
        </g>
      ))}
      <line x1="50" y1={y(0)} x2={W - 10} y2={y(0)} stroke="#2c2350" strokeWidth="2" />
      <line x1="50" y1="20" x2="50" y2={y(0)} stroke="#2c2350" strokeWidth="2" />
    </svg>
  );
}
