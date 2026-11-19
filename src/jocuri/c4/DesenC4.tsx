import type { Corp, Desen, FormaPlana } from "@/motor/clasa4/tipuri";

const MOV = "#4f4183", UMPLUT = "#ece9f6", ACCENT = "#e07a1f";
const CULOARE_BILA: Record<string, string> = { "roșii": "#e0483e", albastre: "#2f6fd1", verzi: "#2e9e5b", galbene: "#f2c200" };

/** Desenele de clasa a IV-a: aceleași în joc și pe fișă (`marime` scalează). */
export function DesenC4({ d, marime = 1 }: { d: Desen; marime?: number }) {
  switch (d.tip) {
    case "drepte": return <Drepte d={d} marime={marime} />;
    case "plana": return <Plana forma={d.forma} etichete={d.etichete} marime={marime} />;
    case "corp": return <CorpSvg corp={d.corp} marime={marime} />;
    case "tabel": return <Tabel d={d} marime={marime} />;
    case "bile": return <Bile bile={d.bile} marime={marime} />;
    case "segmente": return <Segmente d={d} marime={marime} />;
  }
}

function Drepte({ d, marime }: { d: Extract<Desen, { tip: "drepte" }>; marime: number }) {
  const W = 200, H = 140, cx = W / 2, cy = H / 2, L = 62;
  const rot = d.rot ?? 0;
  const r = (rot * Math.PI) / 180;
  // fiecare dreaptă: unghiul și deplasarea față de centru; eticheta stă la capătul ei
  const linii: [string, number, number, number][] = d.rel === "paralele"
    ? [["a", rot, -22 * Math.sin(r), 22 * Math.cos(r)], ["b", rot, 22 * Math.sin(r), -22 * Math.cos(r)]]
    : [["a", rot, 0, 0], ["b", rot + d.unghi, 0, 0]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W * marime} height={H * marime} role="img" aria-label="Două drepte">
      {linii.map(([n, u, dx, dy]) => {
        const q = (u * Math.PI) / 180, x2 = cx + dx + L * Math.cos(q), y2 = cy + dy + L * Math.sin(q);
        return (
          <g key={n}>
            <line x1={cx + dx - L * Math.cos(q)} y1={cy + dy - L * Math.sin(q)} x2={x2} y2={y2} stroke={MOV} strokeWidth="3" strokeLinecap="round" />
            <text x={x2 + 9 * Math.cos(q)} y={y2 + 9 * Math.sin(q) + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={MOV}>{n}</text>
          </g>
        );
      })}
      {d.rel === "perpendiculare" && (
        <path d={`M ${cx + 12 * Math.cos(r)} ${cy + 12 * Math.sin(r)} l ${12 * Math.cos(r + Math.PI / 2)} ${12 * Math.sin(r + Math.PI / 2)} l ${-12 * Math.cos(r)} ${-12 * Math.sin(r)}`} fill="none" stroke={ACCENT} strokeWidth="2" />
      )}
    </svg>
  );
}

const PUNCTE: Record<Exclude<FormaPlana, "cerc">, number[][]> = {
  patrat: [[40, 15], [120, 15], [120, 95], [40, 95]],
  dreptunghi: [[15, 25], [155, 25], [155, 95], [15, 95]],
  triunghi: [[20, 100], [150, 100], [70, 12]],
  romb: [[85, 8], [150, 55], [85, 102], [20, 55]],
  paralelogram: [[45, 20], [160, 20], [125, 95], [10, 95]],
  trapez: [[50, 20], [120, 20], [160, 95], [10, 95]],
  pentagon: Array.from({ length: 5 }, (_, i) => [85 + 50 * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / 5), 58 + 50 * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / 5)]),
  hexagon: Array.from({ length: 6 }, (_, i) => [85 + 50 * Math.cos((i * Math.PI) / 3), 58 + 50 * Math.sin((i * Math.PI) / 3)]),
};

function Plana({ forma, etichete, marime }: { forma: FormaPlana; etichete?: string[]; marime: number }) {
  const W = 170, H = 115;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W * marime} height={H * marime} role="img" aria-label="Figură geometrică">
      {forma === "cerc"
        ? <><circle cx={85} cy={57} r={48} fill={UMPLUT} stroke={MOV} strokeWidth="3" /><circle cx={85} cy={57} r={2.5} fill={MOV} /></>
        : <polygon points={PUNCTE[forma].map((p) => p.join(",")).join(" ")} fill={UMPLUT} stroke={MOV} strokeWidth="3" strokeLinejoin="round" />}
      {etichete && forma !== "cerc" && (
        <>
          <text x={(PUNCTE[forma][0][0] + PUNCTE[forma][1][0]) / 2} y={PUNCTE[forma][0][1] - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill={MOV}>{etichete[0]}</text>
          {etichete[1] && <text x={(PUNCTE[forma][1][0] + PUNCTE[forma][2][0]) / 2 + 6} y={(PUNCTE[forma][1][1] + PUNCTE[forma][2][1]) / 2 + 4} fontSize="13" fontWeight="700" fill={MOV}>{etichete[1]}</text>}
        </>
      )}
    </svg>
  );
}

/** corpuri în perspectivă (muchiile ascunse punctate) */
function CorpSvg({ corp, marime }: { corp: Corp; marime: number }) {
  const W = 150, H = 130;
  const p = { stroke: MOV, strokeWidth: 2.5, fill: "none", strokeLinejoin: "round" as const };
  const ascuns = { ...p, strokeDasharray: "5 4", strokeWidth: 1.6 };
  const fata = { ...p, fill: UMPLUT };
  let c: React.ReactNode;
  const prisma = (w: number, h: number, dx: number, dy: number) => (
    <>
      <polyline {...ascuns} points={`25,${25 + h} ${25 + dx},${25 + h - dy} ${25 + dx + w},${25 + h - dy}`} />
      <line {...ascuns} x1={25 + dx} y1={25 - dy} x2={25 + dx} y2={25 + h - dy} />
      <polygon {...fata} points={`25,25 ${25 + w},25 ${25 + w},${25 + h} 25,${25 + h}`} />
      <polygon {...fata} fill="#ddd8f0" points={`25,25 ${25 + dx},${25 - dy} ${25 + dx + w},${25 - dy} ${25 + w},25`} />
      <polygon {...fata} fill="#cfc8eb" points={`${25 + w},25 ${25 + dx + w},${25 - dy} ${25 + dx + w},${25 + h - dy} ${25 + w},${25 + h}`} />
    </>
  );
  switch (corp) {
    case "cub": c = <g transform="translate(0 20)">{prisma(70, 70, 32, 22)}</g>; break;
    case "cuboid": c = <g transform="translate(-10 30)">{prisma(95, 55, 32, 22)}</g>; break;
    case "piramida":
      c = (<>
        <polyline {...ascuns} points="30,105 62,88 125,88" /><line {...ascuns} x1={62} y1={88} x2={78} y2={12} />
        <polygon {...fata} points="30,105 93,105 78,12" /><polygon {...fata} fill="#cfc8eb" points="93,105 125,88 78,12" />
      </>); break;
    case "piramida-tri":
      c = (<>
        <line {...ascuns} x1={25} y1={105} x2={125} y2={95} />
        <polygon {...fata} points="25,105 85,115 75,15" /><polygon {...fata} fill="#cfc8eb" points="85,115 125,95 75,15" />
      </>); break;
    case "prisma-tri":
      // baze triunghiuri (față și spate), fețe laterale dreptunghiuri; muchiile din spate punctate
      c = (<>
        <polyline {...ascuns} points="20,108 75,80 135,80" /><line {...ascuns} x1={75} y1={80} x2={105} y2={24} />
        <polygon {...fata} fill="#cfc8eb" points="80,108 50,52 105,24 135,80" />
        <polygon {...fata} points="20,108 80,108 50,52" />
      </>); break;
    case "cilindru":
      c = (<>
        <path {...fata} d="M 35 25 L 35 100 A 40 12 0 0 0 115 100 L 115 25" /><ellipse {...fata} fill="#ddd8f0" cx={75} cy={25} rx={40} ry={12} />
        <path {...ascuns} d="M 35 100 A 40 12 0 0 1 115 100" />
      </>); break;
    case "con":
      c = (<><path {...fata} d="M 35 100 L 75 15 L 115 100 A 40 12 0 0 1 35 100 Z" /><path {...ascuns} d="M 35 100 A 40 12 0 0 1 115 100" /></>); break;
    case "sfera":
      c = (<><circle {...fata} cx={75} cy={62} r={48} /><path {...ascuns} d="M 27 62 A 48 14 0 0 1 123 62" /><path {...p} strokeWidth={1.8} d="M 27 62 A 48 14 0 0 0 123 62" /></>); break;
  }
  return <svg viewBox={`0 0 ${W} ${H}`} width={W * marime} height={H * marime} role="img" aria-label="Corp geometric">{c}</svg>;
}

function Tabel({ d, marime }: { d: Extract<Desen, { tip: "tabel" }>; marime: number }) {
  return (
    <table className="desen-tabel border-collapse text-left" style={{ fontSize: `${Math.max(0.7, marime) * 1}rem` }}>
      <caption className="pb-1 text-center font-bold text-mov">{d.titlu}</caption>
      <thead><tr>{d.cap.map((c) => <th key={c} className="border-2 border-mov/60 bg-mov-deschis px-3 py-1">{c}</th>)}</tr></thead>
      <tbody>
        {d.randuri.map((r, i) => (
          <tr key={i} className={r[0] === "Total" ? "font-bold" : ""}>
            {r.map((x, j) => <td key={j} className={`border-2 border-mov/60 px-3 py-0.5 ${j ? "text-right tabular-nums" : ""} ${x === "?" ? "text-portocaliu font-extrabold" : ""}`}>{x}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Bile({ bile, marime }: { bile: [string, number][]; marime: number }) {
  const toate = bile.flatMap(([c, n]) => Array.from({ length: n }, () => c));
  const col = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(toate.length * 1.5))));
  const r = 11, pas = 27, W = col * pas + 26, H = Math.ceil(toate.length / col) * pas + 26;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W * marime} height={H * marime} role="img" aria-label={bile.map(([c, n]) => `${n} ${c}`).join(", ")}>
      <rect x={3} y={3} width={W - 6} height={H - 6} rx={10} fill="#fff7e6" stroke="#8b5e3c" strokeWidth="3" />
      {toate.map((c, i) => (
        <circle key={i} cx={13 + pas / 2 + (i % col) * pas} cy={13 + pas / 2 + Math.floor(i / col) * pas} r={r} fill={CULOARE_BILA[c] ?? "#999"} stroke="#0003" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function Segmente({ d, marime }: { d: Extract<Desen, { tip: "segmente" }>; marime: number }) {
  const u = 34, x0 = 70, rand = 30;
  const lung = (l: Extract<Desen, { tip: "segmente" }>["linii"][number]) => l.parti * u + (l.plus ? 30 : 0);
  const W = x0 + Math.max(...d.linii.map(lung)) + (d.acolada ? 60 : 20), H = d.linii.length * rand + 14;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W * marime} height={H * marime} role="img" aria-label="Reprezentare prin segmente">
      {d.linii.map((l, i) => {
        const y = 18 + i * rand;
        return (
          <g key={i}>
            <text x={x0 - 8} y={y + 4} textAnchor="end" fontSize="13" fontWeight="700" fill={MOV}>{l.nume}</text>
            {Array.from({ length: l.parti }, (_, k) => (
              <g key={k}><line x1={x0 + k * u} y1={y} x2={x0 + (k + 1) * u} y2={y} stroke={MOV} strokeWidth="3" /><line x1={x0 + k * u} y1={y - 6} x2={x0 + k * u} y2={y + 6} stroke={MOV} strokeWidth="2" /></g>
            ))}
            <line x1={x0 + l.parti * u} y1={y - 6} x2={x0 + l.parti * u} y2={y + 6} stroke={MOV} strokeWidth="2" />
            {l.plus && (
              <g><line x1={x0 + l.parti * u} y1={y} x2={x0 + l.parti * u + 30} y2={y} stroke={ACCENT} strokeWidth="3" /><line x1={x0 + l.parti * u + 30} y1={y - 6} x2={x0 + l.parti * u + 30} y2={y + 6} stroke={ACCENT} strokeWidth="2" />
                <text x={x0 + l.parti * u + 15} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={ACCENT}>{l.plus}</text></g>
            )}
          </g>
        );
      })}
      {d.acolada && (() => {
        const xa = x0 + Math.max(...d.linii.map(lung)) + 10, y1 = 10, y2 = 18 + (d.linii.length - 1) * rand + 8;
        return <g><path d={`M ${xa} ${y1} q 8 0 8 8 V ${(y1 + y2) / 2 - 6} l 6 6 l -6 6 V ${y2 - 8} q 0 8 -8 8`} fill="none" stroke={MOV} strokeWidth="2" /><text x={xa + 18} y={(y1 + y2) / 2 + 5} fontSize="14" fontWeight="800" fill={MOV}>{d.acolada}</text></g>;
      })()}
    </svg>
  );
}
