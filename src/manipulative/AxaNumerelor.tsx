"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { eticheteSalt, gradatii, lipesteDeAxa, type Axa } from "./logica";
import { BtnUnealta } from "./comune";

const W = 1000;
const X0 = 50;
const X1 = 950;
const Y = 120;

/**
 * Axa numerelor interactivă: atingi axa ca să pui (sau să scoți) un punct,
 * sau faci salturi: atingi de unde pleci, apoi unde ajungi.
 */
export function AxaNumerelor({ valoare, onChange, moduri = ["punct", "salt"], blocat = false }: {
  valoare: Axa;
  onChange: (a: Axa) => void;
  moduri?: ("punct" | "salt")[];
  blocat?: boolean;
}) {
  const [mod, setMod] = useState<"punct" | "salt">(moduri[0]);
  const [plecare, setPlecare] = useState<number | null>(null);
  const [scris, setScris] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const a = valoare;
  const x = (v: number) => X0 + ((v - a.start) / (a.sfarsit - a.start)) * (X1 - X0);
  const marcaje = gradatii(a);
  const fine = (a.sfarsit - a.start) / a.fin <= 200 && a.fin < a.pas ? gradatii({ start: a.start, sfarsit: a.sfarsit, pas: a.fin }) : [];
  const etichetePrea = marcaje.length > 21;

  const actioneaza = (v: number) => {
    if (blocat) return;
    if (mod === "punct") {
      const are = a.puncte.includes(v);
      onChange({ ...a, puncte: are ? a.puncte.filter((p) => p !== v) : [...a.puncte, v] });
      return;
    }
    if (plecare === null) {
      setPlecare(v);
    } else {
      if (v !== plecare) onChange({ ...a, salturi: [...a.salturi, { de: plecare, la: v }] });
      // următorul salt pleacă de unde s-a oprit acesta
      setPlecare(v !== plecare ? v : null);
    }
  };

  const click = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const v = a.start + ((px - X0) / (X1 - X0)) * (a.sfarsit - a.start);
    actioneaza(lipesteDeAxa(a, v));
  };

  const trimiteScris = () => {
    const n = Number(scris);
    if (scris.trim() !== "" && Number.isFinite(n) && n >= a.start && n <= a.sfarsit) actioneaza(lipesteDeAxa(a, n));
    setScris("");
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
      <svg ref={svg} viewBox={`0 0 ${W} 170`} className={`w-full min-w-[600px] touch-manipulation select-none ${blocat ? "" : "cursor-crosshair"}`}
        onPointerDown={click} role="img" aria-label={`Axa numerelor de la ${a.start} la ${a.sfarsit}. Puncte: ${a.puncte.join(", ") || "niciunul"}.`}>
        <rect x="0" y="0" width={W} height="170" fill="transparent" />
        <line x1={X0 - 25} y1={Y} x2={X1 + 30} y2={Y} stroke="#4f4183" strokeWidth="4" />
        <path d={`M ${X1 + 30} ${Y} l -14 -8 v 16 z`} fill="#4f4183" />
        {fine.map((v) => (
          <line key={`f${v}`} x1={x(v)} y1={Y - 6} x2={x(v)} y2={Y + 6} stroke="#4f4183" strokeOpacity={0.45} strokeWidth="1.5" />
        ))}
        {marcaje.map((v, i) => {
          const capat = i === 0 || i === marcaje.length - 1;
          const arata = capat || (!a.faraEtichete && (!etichetePrea || i % 2 === 0));
          return (
            <g key={v}>
              <line x1={x(v)} y1={Y - 13} x2={x(v)} y2={Y + 13} stroke="#4f4183" strokeWidth="3" />
              {arata && <text x={x(v)} y={Y + 38} textAnchor="middle" fontSize={etichetePrea ? 17 : 21} fontWeight="700" fill="#1f1b2e">{v}</text>}
            </g>
          );
        })}
        {a.salturi.map((s, i) => {
          const x1 = x(s.de);
          const x2 = x(s.la);
          const h = Math.min(85, 25 + Math.abs(x2 - x1) * 0.35);
          const mij = (x1 + x2) / 2;
          const inainte = s.la > s.de;
          return (
            <g key={i}>
              <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }}
                d={`M ${x1} ${Y - 4} Q ${mij} ${Y - 4 - h * 2} ${x2} ${Y - 4}`} fill="none" stroke={inainte ? "#2e9e5b" : "#e07a1f"} strokeWidth="3.5" />
              <path d={`M ${x2} ${Y - 4} l ${inainte ? -11 : 11} -9 l ${inainte ? 1 : -1} 11 z`} fill={inainte ? "#2e9e5b" : "#e07a1f"} />
              <rect x={mij - 26} y={Y - 4 - h - 24} width="52" height="26" rx="8" fill="#fff" stroke={inainte ? "#2e9e5b" : "#e07a1f"} strokeWidth="2" />
              <text x={mij} y={Y - 4 - h - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill={inainte ? "#1f6b3e" : "#9a4f0c"}>{eticheteSalt(s)}</text>
            </g>
          );
        })}
        {a.puncte.map((p) => (
          <g key={`p${p}`}>
            <motion.circle initial={{ r: 0 }} animate={{ r: 11 }} cx={x(p)} cy={Y} fill="#f9c50f" stroke="#4f4183" strokeWidth="3" />
            <text x={x(p)} y={Y - 22} textAnchor="middle" fontSize="20" fontWeight="700" fill="#4f4183">{p}</text>
          </g>
        ))}
        {plecare !== null && <circle cx={x(plecare)} cy={Y} r="15" fill="none" stroke="#2e9e5b" strokeWidth="3" strokeDasharray="5 4" />}
      </svg>
      </div>

      {!blocat && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {moduri.length > 1 && (
            <>
              <BtnUnealta activ={mod === "punct"} onClick={() => { setMod("punct"); setPlecare(null); }}>● Pune puncte</BtnUnealta>
              <BtnUnealta activ={mod === "salt"} onClick={() => setMod("salt")}>↷ Fă salturi</BtnUnealta>
            </>
          )}
          <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); trimiteScris(); }}>
            <label className="text-sm font-semibold text-gray-700" htmlFor="axa-scris">{mod === "punct" ? "Pune la:" : plecare === null ? "Pleacă din:" : "Sari la:"}</label>
            <input id="axa-scris" inputMode="numeric" value={scris} onChange={(e) => setScris(e.target.value.replace(/[^\d]/g, ""))}
              className="h-11 w-20 rounded-xl border-2 border-mov/20 px-2 text-center text-lg font-bold outline-none focus:border-mov" />
            <BtnUnealta type="submit">OK</BtnUnealta>
          </form>
          {a.salturi.length > 0 && <BtnUnealta onClick={() => { onChange({ ...a, salturi: a.salturi.slice(0, -1) }); setPlecare(a.salturi.length > 1 ? a.salturi[a.salturi.length - 2].la : null); }}>↶ Anulează saltul</BtnUnealta>}
        </div>
      )}
      {mod === "salt" && !blocat && (
        <p className="mt-1 text-center text-sm text-gray-600">{plecare === null ? "Atinge numărul de unde pleci." : `Pleci din ${plecare}. Atinge unde ajungi.`}</p>
      )}
    </div>
  );
}
