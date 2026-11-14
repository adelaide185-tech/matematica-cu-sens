import type { Vizual as V } from "@/motor/tipuri";

/** Desenele sunt SVG pur: aceleași pe ecran, pe tablă interactivă și în PDF. */
export function Vizual({ v, marime = 1 }: { v: V; marime?: number }) {
  switch (v.tip) {
    case "numaratoare":
      return <Numaratoare {...v} marime={marime} />;
    case "fractie":
      return <Fractie forma={v.forma} parti={v.parti} colorate={v.colorate} marime={marime} />;
    case "ceas":
      return <Ceas ore={v.ore} minute={v.minute} marime={marime} />;
    case "axa":
      return <AxaNumerelor {...v} />;
    case "grupe":
      return <Grupe {...v} />;
  }
}

const CULORI_TIJE = { mii: "#2e9e5b", sute: "#e0483e", zeci: "#2f6fd1", unitati: "#f2a20c" };

export function Numaratoare({
  mii, sute, zeci, unitati, marime = 1, onTija,
}: {
  mii?: number; sute: number; zeci: number; unitati: number; marime?: number;
  /** interactiv: click pe tijă (+1) sau pe bilă (−1) */
  onTija?: (ordin: "mii" | "sute" | "zeci" | "unitati", delta: 1 | -1) => void;
}) {
  const tije = [
    ...(mii !== undefined ? [["mii", "M", mii] as const] : []),
    ["sute", "S", sute] as const,
    ["zeci", "Z", zeci] as const,
    ["unitati", "U", unitati] as const,
  ];
  const w = 46 * tije.length + 20;
  const h = 190;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * 0.75 * marime} height={h * 0.75 * marime} role="img" aria-label={`Numărătoare: ${tije.map(([, l, n]) => `${n} ${l}`).join(", ")}`}>
      <rect x="4" y={h - 30} width={w - 8} height="14" rx="4" fill="#8a6a4a" />
      {tije.map(([ordin, lit, n], i) => {
        const x = 30 + i * 46;
        return (
          <g key={ordin} style={onTija ? { cursor: "pointer" } : undefined} onClick={onTija ? () => onTija(ordin, 1) : undefined}>
            <rect x={x - 3} y="14" width="6" height={h - 44} fill="#9a9a9a" rx="2" />
            {onTija && <rect x={x - 20} y="10" width="40" height={h - 40} fill="transparent" />}
            {Array.from({ length: n }, (_, b) => (
              <circle
                key={b}
                cx={x}
                cy={h - 42 - b * 14.5}
                r="9"
                fill={CULORI_TIJE[ordin]}
                stroke="#0003"
                onClick={onTija ? (e) => { e.stopPropagation(); onTija(ordin, -1); } : undefined}
              />
            ))}
            <text x={x} y={h - 2} textAnchor="middle" fontSize="15" fontWeight="700" fill="#333">{lit}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Fractie({
  forma, parti, colorate, marime = 1, culoare = "#6a59a7", onParte, selectate,
}: {
  forma: "cerc" | "dreptunghi"; parti: number; colorate: number; marime?: number; culoare?: string;
  onParte?: (i: number) => void; selectate?: boolean[];
}) {
  const plin = (i: number) => (selectate ? selectate[i] : i < colorate);
  const s = 120 * marime;
  if (forma === "cerc") {
    const r = 54;
    return (
      <svg viewBox="0 0 120 120" width={s} height={s} role="img" aria-label={`Cerc împărțit în ${parti} părți, ${colorate} colorate`}>
        {parti === 1 ? (
          <circle cx="60" cy="60" r={r} fill={plin(0) ? culoare : "#fff"} stroke="#333" strokeWidth="2" onClick={onParte ? () => onParte(0) : undefined} />
        ) : (
          Array.from({ length: parti }, (_, i) => {
            const a0 = (i / parti) * 2 * Math.PI - Math.PI / 2;
            const a1 = ((i + 1) / parti) * 2 * Math.PI - Math.PI / 2;
            const large = a1 - a0 > Math.PI ? 1 : 0;
            const d = `M60,60 L${60 + r * Math.cos(a0)},${60 + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${60 + r * Math.cos(a1)},${60 + r * Math.sin(a1)} Z`;
            return (
              <path key={i} d={d} fill={plin(i) ? culoare : "#fff"} stroke="#333" strokeWidth="2"
                style={onParte ? { cursor: "pointer" } : undefined} onClick={onParte ? () => onParte(i) : undefined} />
            );
          })
        )}
      </svg>
    );
  }
  const W = 150;
  const H = 70;
  return (
    <svg viewBox={`0 0 ${W + 4} ${H + 4}`} width={s * 1.25} height={s * 0.6} role="img" aria-label={`Dreptunghi împărțit în ${parti} părți, ${colorate} colorate`}>
      {Array.from({ length: parti }, (_, i) => (
        <rect key={i} x={2 + (i * W) / parti} y="2" width={W / parti} height={H} fill={plin(i) ? culoare : "#fff"} stroke="#333" strokeWidth="2"
          style={onParte ? { cursor: "pointer" } : undefined} onClick={onParte ? () => onParte(i) : undefined} />
      ))}
    </svg>
  );
}

export function Ceas({ ore, minute, marime = 1 }: { ore: number; minute: number; marime?: number }) {
  const unghiM = (minute / 60) * 360;
  const unghiO = ((ore % 12) / 12) * 360 + (minute / 60) * 30;
  const s = 120 * marime;
  return (
    <svg viewBox="0 0 120 120" width={s} height={s} role="img" aria-label="Ceas analogic">
      <circle cx="60" cy="60" r="56" fill="#fff" stroke="#333" strokeWidth="3" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * 2 * Math.PI;
        const r1 = i % 5 === 0 ? 46 : 50;
        return <line key={i} x1={60 + r1 * Math.sin(a)} y1={60 - r1 * Math.cos(a)} x2={60 + 53 * Math.sin(a)} y2={60 - 53 * Math.cos(a)} stroke="#333" strokeWidth={i % 5 === 0 ? 2 : 0.8} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) / 12) * 2 * Math.PI;
        return <text key={i} x={60 + 37 * Math.sin(a)} y={60 - 37 * Math.cos(a) + 4.5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#222">{i + 1}</text>;
      })}
      <line x1="60" y1="60" x2={60 + 26 * Math.sin((unghiO * Math.PI) / 180)} y2={60 - 26 * Math.cos((unghiO * Math.PI) / 180)} stroke="#222" strokeWidth="5" strokeLinecap="round" />
      <line x1="60" y1="60" x2={60 + 42 * Math.sin((unghiM * Math.PI) / 180)} y2={60 - 42 * Math.cos((unghiM * Math.PI) / 180)} stroke="#6a59a7" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="60" r="4" fill="#222" />
    </svg>
  );
}

export function AxaNumerelor({ de, pana, pas, marcate = [], necunoscute = [] }: { de: number; pana: number; pas: number; marcate?: number[]; necunoscute?: number[] }) {
  const n = Math.round((pana - de) / pas);
  const W = 520;
  const x = (v: number) => 20 + ((v - de) / (pana - de)) * (W - 40);
  return (
    <svg viewBox={`0 0 ${W} 70`} width="100%" style={{ maxWidth: W }} role="img" aria-label={`Axa numerelor de la ${de} la ${pana}`}>
      <line x1="10" y1="30" x2={W - 6} y2="30" stroke="#333" strokeWidth="2" markerEnd="url(#sageata)" />
      <defs>
        <marker id="sageata" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#333" /></marker>
      </defs>
      {Array.from({ length: n + 1 }, (_, i) => {
        const v = de + i * pas;
        const ascuns = necunoscute.includes(v);
        return (
          <g key={i}>
            <line x1={x(v)} y1="22" x2={x(v)} y2="38" stroke="#333" strokeWidth="2" />
            {ascuns ? <rect x={x(v) - 14} y="44" width="28" height="18" fill="#fff" stroke="#6a59a7" rx="3" /> : <text x={x(v)} y="58" textAnchor="middle" fontSize="13">{v}</text>}
            {marcate.includes(v) && <circle cx={x(v)} cy="30" r="6" fill="#f9c50f" stroke="#333" />}
          </g>
        );
      })}
    </svg>
  );
}

export function Grupe({ grupe, cate, simbol }: { grupe: number; cate: number; simbol: string }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {Array.from({ length: grupe }, (_, g) => (
        <div key={g} style={{ border: "2px dashed #6a59a7", borderRadius: 12, padding: 6, fontSize: 20 }}>{simbol.repeat(cate)}</div>
      ))}
    </div>
  );
}
