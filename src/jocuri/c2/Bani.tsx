/**
 * Bani desenați de noi, stilizați (nu sunt copii ale bancnotelor sau monedelor reale):
 * bancnote colorate după valoare și monede rotunde. Valorile sunt în bani (100 de bani = 1 leu).
 */
const CULORI: Record<number, [string, string]> = {
  100: ["#8fd19e", "#2e7d4f"], 500: ["#c9b6f2", "#5b3fa6"], 1000: ["#ffc59a", "#b5541b"], 5000: ["#ffe58a", "#9a7b00"], 10000: ["#9fd0ff", "#1f5fa8"],
};

export function BanDesen({ v, marime = 1 }: { v: number; marime?: number }) {
  if (v >= 100) {
    const [fond, linie] = CULORI[v] ?? ["#ddd", "#555"];
    const lei = v / 100;
    return (
      <svg viewBox="0 0 120 60" width={96 * marime} height={48 * marime} role="img" aria-label={`Bancnotă de ${lei} ${lei === 1 ? "leu" : "lei"}`}>
        <rect x="1.5" y="1.5" width="117" height="57" rx="6" fill={fond} stroke={linie} strokeWidth="3" />
        <rect x="8" y="8" width="104" height="44" rx="4" fill="none" stroke={linie} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="30" cy="30" r="13" fill="#fff" opacity="0.7" stroke={linie} />
        <text x="30" y="35" textAnchor="middle" fontSize="14" fontWeight="800" fill={linie}>★</text>
        <text x="80" y="36" textAnchor="middle" fontSize="20" fontWeight="900" fill={linie}>{lei}</text>
        <text x="80" y="49" textAnchor="middle" fontSize="9" fontWeight="800" fill={linie}>{lei === 1 ? "LEU" : "LEI"}</text>
      </svg>
    );
  }
  const auriu = v >= 10;
  return (
    <svg viewBox="0 0 60 60" width={(36 + (v >= 10 ? 8 : 0)) * marime} height={(36 + (v >= 10 ? 8 : 0)) * marime} role="img" aria-label={`Monedă de ${v} ${v === 1 ? "ban" : "bani"}`}>
      <circle cx="30" cy="30" r="27" fill={auriu ? "#f3cf5a" : "#cfd4da"} stroke={auriu ? "#a8841c" : "#7d858e"} strokeWidth="3" />
      <circle cx="30" cy="30" r="21" fill="none" stroke={auriu ? "#a8841c" : "#7d858e"} strokeWidth="1" strokeDasharray="2 2" />
      <text x="30" y="33" textAnchor="middle" fontSize="18" fontWeight="900" fill="#3a3a3a">{v}</text>
      <text x="30" y="45" textAnchor="middle" fontSize="8" fontWeight="800" fill="#3a3a3a">{v === 1 ? "BAN" : "BANI"}</text>
    </svg>
  );
}

export function GramadaBani({ bani, marime = 1 }: { bani: number[]; marime?: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {bani.map((v, i) => <BanDesen key={i} v={v} marime={marime} />)}
    </div>
  );
}
