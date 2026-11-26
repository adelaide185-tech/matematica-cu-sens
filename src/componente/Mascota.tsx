/**
 * Sclipici, mascota Fabricii de Inteligență: un beculeț galben cu „creierul” din logo,
 * ochi mari, obraji rozalii și un soclu mov. Desen original (SVG), folosit la toate cursurile.
 *  - salut: flutură din mână (la începutul unei activități)
 *  - bucuros: sare, ochii zâmbesc (răspuns corect, final)
 *  - ganditor: se uită în sus, așteaptă răspunsul
 *  - incurajare: zâmbet blând, „mai încearcă” (după o greșeală)
 */
export type StareMascota = "salut" | "bucuros" | "ganditor" | "incurajare";

export const NUME_MASCOTA = "Sclipici";

const GALBEN = "#f9c50f", GALBEN_INCHIS = "#e3a600", MOV = "#6a59a7", MOV_INCHIS = "#4f4183";

export function Mascota({ stare = "salut", marime = 140, spune, className = "" }: { stare?: StareMascota; marime?: number; spune?: string; className?: string }) {
  const bucuros = stare === "bucuros";
  return (
    <span className={`mascota inline-flex items-end gap-2 ${className}`}>
      <svg viewBox="0 0 200 240" width={marime} height={(marime * 240) / 200} role="img" aria-label={`${NUME_MASCOTA}, mascota Fabricii de Inteligență`}
        className={bucuros ? "mascota-salt" : "mascota-plutire"}>
        {/* razele (ca în logo) */}
        <g className="mascota-raze" stroke={MOV} strokeWidth="7" strokeLinecap="round">
          {[-70, -45, -20, 20, 45, 70].map((u) => {
            const r = (u - 90) * (Math.PI / 180);
            return <line key={u} x1={100 + 76 * Math.cos(r)} y1={92 + 76 * Math.sin(r)} x2={100 + 90 * Math.cos(r)} y2={92 + 90 * Math.sin(r)} />;
          })}
          <line x1="100" y1="2" x2="100" y2="14" />
        </g>
        {/* brațele */}
        <g stroke={GALBEN_INCHIS} strokeWidth="9" strokeLinecap="round" fill="none">
          {stare === "salut" ? (
            <g className="mascota-flutura" style={{ transformOrigin: "152px 118px" }}>
              <path d="M152 118 Q172 100 176 76" />
              <circle cx="177" cy="71" r="9" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="3" />
            </g>
          ) : bucuros ? (
            <>
              <path d="M152 118 Q176 96 180 70" /><circle cx="181" cy="65" r="9" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="3" />
            </>
          ) : stare === "ganditor" ? (
            <>
              <path d="M150 128 Q150 150 132 146" /><circle cx="128" cy="144" r="8" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="3" />
            </>
          ) : (
            <>
              <path d="M152 122 Q170 132 170 150" /><circle cx="170" cy="155" r="8" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="3" />
            </>
          )}
          {bucuros
            ? <><path d="M48 118 Q24 96 20 70" /><circle cx="19" cy="65" r="9" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="3" /></>
            : <><path d="M48 122 Q30 132 30 150" /><circle cx="30" cy="155" r="8" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="3" /></>}
        </g>
        {/* becul */}
        <path d="M100 30 C 140 30 166 58 166 94 C 166 120 150 136 140 150 L 60 150 C 50 136 34 120 34 94 C 34 58 60 30 100 30 Z" fill={GALBEN} stroke={GALBEN_INCHIS} strokeWidth="4" />
        <ellipse cx="72" cy="62" rx="12" ry="7" fill="#fff" opacity="0.55" transform="rotate(-30 72 62)" />
        {/* „creierul” din logo: buclele de sus */}
        <g fill="none" stroke={GALBEN_INCHIS} strokeWidth="4" strokeLinecap="round">
          <path d="M100 38 V 64" />
          <path d="M100 50 C 90 44 82 50 84 58" /><path d="M100 50 C 110 44 118 50 116 58" />
          <path d="M70 52 C 62 58 64 68 72 70" /><path d="M130 52 C 138 58 136 68 128 70" />
        </g>
        {/* ochii */}
        {bucuros ? (
          <g fill="none" stroke={MOV_INCHIS} strokeWidth="6" strokeLinecap="round"><path d="M64 100 Q76 86 88 100" /><path d="M112 100 Q124 86 136 100" /></g>
        ) : (
          <g>
            <ellipse cx="76" cy="98" rx="15" ry="18" fill="#fff" stroke={MOV_INCHIS} strokeWidth="3" />
            <ellipse cx="124" cy="98" rx="15" ry="18" fill="#fff" stroke={MOV_INCHIS} strokeWidth="3" />
            <g className="mascota-clipire">
              <circle cx={stare === "ganditor" ? 81 : 78} cy={stare === "ganditor" ? 90 : 101} r="8" fill={MOV_INCHIS} />
              <circle cx={stare === "ganditor" ? 129 : 126} cy={stare === "ganditor" ? 90 : 101} r="8" fill={MOV_INCHIS} />
              <circle cx={stare === "ganditor" ? 84 : 81} cy={stare === "ganditor" ? 87 : 97} r="2.6" fill="#fff" />
              <circle cx={stare === "ganditor" ? 132 : 129} cy={stare === "ganditor" ? 87 : 97} r="2.6" fill="#fff" />
            </g>
          </g>
        )}
        {/* obrajii */}
        <circle cx="56" cy="120" r="9" fill="#ff8fa3" opacity="0.7" /><circle cx="144" cy="120" r="9" fill="#ff8fa3" opacity="0.7" />
        {/* gura */}
        {bucuros ? <path d="M80 118 Q100 146 120 118 Z" fill={MOV_INCHIS} stroke={MOV_INCHIS} strokeWidth="3" strokeLinejoin="round" />
          : stare === "ganditor" ? <ellipse cx="104" cy="128" rx="6" ry="5" fill={MOV_INCHIS} />
            : stare === "incurajare" ? <path d="M84 124 Q100 134 116 124" fill="none" stroke={MOV_INCHIS} strokeWidth="5" strokeLinecap="round" />
              : <path d="M82 120 Q100 140 118 120" fill="none" stroke={MOV_INCHIS} strokeWidth="5" strokeLinecap="round" />}
        {/* soclul mov (corpul) */}
        <rect x="62" y="148" width="76" height="16" rx="8" fill={MOV} />
        <rect x="66" y="162" width="68" height="14" rx="7" fill={MOV_INCHIS} />
        <rect x="70" y="174" width="60" height="14" rx="7" fill={MOV} />
        <path d="M80 188 H120 Q116 204 100 204 Q84 204 80 188 Z" fill={MOV_INCHIS} />
        {/* picioarele */}
        <g stroke={MOV_INCHIS} strokeWidth="8" strokeLinecap="round"><line x1="88" y1="202" x2="84" y2="222" /><line x1="112" y1="202" x2="116" y2="222" /></g>
        <ellipse cx="80" cy="226" rx="13" ry="7" fill={MOV} /><ellipse cx="120" cy="226" rx="13" ry="7" fill={MOV} />
      </svg>
      {spune && (
        <span className="mascota-bula relative mb-[45%] max-w-[16rem] rounded-3xl bg-white px-4 py-2 text-lg font-bold text-mov-inchis shadow-md ring-2 ring-mov/15">{spune}</span>
      )}
    </span>
  );
}
