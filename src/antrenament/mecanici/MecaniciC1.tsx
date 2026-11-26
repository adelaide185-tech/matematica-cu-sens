import type { RelatieSpatiala } from "../tipuri";

/**
 * Mecanicile clasei I: bețișoare (zeci legate în mănunchiuri + unități) și orientarea spațială.
 * SVG static: aceeași componentă în joc și pe fișa PDF.
 */
export function Betisoare({ zeci, unitati }: { zeci: number; unitati: number }) {
  const latM = 30; // lățimea unui mănunchi
  const latU = 12;
  const w = Math.max(120, zeci * (latM + 10) + (unitati ? 16 : 0) + unitati * latU + 16);
  const h = 110;
  const bet = (x: number, k: string) => <rect key={k} x={x} y={10} width={4} height={86} rx={2} fill="#e0a64a" stroke="#9a6a1e" strokeWidth={0.8} />;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto h-auto w-full" style={{ maxWidth: Math.min(w * 1.4, 560) }}
      role="img" aria-label={`${zeci} ${zeci === 1 ? "mănunchi de zece" : "mănunchiuri de câte zece"} și ${unitati} ${unitati === 1 ? "bețișor" : "bețișoare"}`}>
      {Array.from({ length: zeci }, (_, z) => {
        const x0 = 8 + z * (latM + 10);
        return (
          <g key={`z${z}`}>
            {Array.from({ length: 10 }, (_, i) => bet(x0 + i * 2.7, `z${z}b${i}`))}
            <rect x={x0 - 2} y={48} width={latM + 2} height={9} rx={3} fill="#e0483e" />
          </g>
        );
      })}
      {Array.from({ length: unitati }, (_, u) => bet(8 + zeci * (latM + 10) + (zeci ? 8 : 0) + u * latU, `u${u}`))}
    </svg>
  );
}

const ETICHETE: Record<RelatieSpatiala, string> = {
  stanga: "în stânga", dreapta: "în dreapta", sus: "deasupra", jos: "dedesubt", interior: "în interior", exterior: "în exterior",
};
export const textRelatie = (r: RelatieSpatiala) => ETICHETE[r];

export function Pozitie({ reper, obiect, relatie }: { reper: string; obiect: string; relatie: RelatieSpatiala }) {
  const chenar = relatie === "interior" || relatie === "exterior";
  const pos: Record<RelatieSpatiala, [number, number]> = {
    stanga: [55, 90], dreapta: [245, 90], sus: [150, 28], jos: [150, 158], interior: [150, 96], exterior: [262, 160],
  };
  const [x, y] = pos[relatie];
  return (
    <svg viewBox="0 0 300 190" className="mx-auto h-auto w-full max-w-sm" role="img" aria-label={`${obiect} este ${ETICHETE[relatie]} față de ${chenar ? "chenar" : reper}`}>
      {chenar ? (
        <rect x={80} y={45} width={140} height={100} rx={18} fill="#ece9f6" stroke="#6a59a7" strokeWidth={4} strokeDasharray="10 6" />
      ) : (
        <text x={150} y={108} textAnchor="middle" fontSize={64}>{reper}</text>
      )}
      <text x={x} y={y + 14} textAnchor="middle" fontSize={44}>{obiect}</text>
    </svg>
  );
}
