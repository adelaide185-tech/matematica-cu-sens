/**
 * Mascota Fabricii de Inteligență, după ilustrația oficială: robot-copil mov cu smoc de păr,
 * vizor cyan, căști, antenă cu beculeț, vestă galbenă cu glugă mov, mănuși mov, adidași argintii.
 * Varianta animată (SVG), folosită în jocuri și cursuri; ilustrația completă e în /public/brand.
 *  - salut: flutură din mână        - ganditor: se uită în sus, mâna la bărbie
 *  - bucuros: sare, brațele sus     - incurajare: zâmbet blând, „mai încearcă”
 */
export type StareMascota = "salut" | "bucuros" | "ganditor" | "incurajare";

export const NUME_MASCOTA = "Sclipici";
/** ilustrațiile oficiale (raster) */
export const MASCOTA_PORTRET = "/brand/mascota-portret.jpg";
export const MASCOTA_SCENA = "/brand/mascota-scena.jpg";

const C = {
  cap: "#5b3fb8", capInchis: "#3d2689", fata: "#8f8be3", par: "#6a4fc0", parInchis: "#4a2f9a",
  vizor: "#8be6f2", vizorMargine: "#3fc7da", iris: "#3f6fa8", pupila: "#1f2a55", sprancene: "#2d1d63",
  casti: "#b39ad6", castiInchis: "#7d62b8", galben: "#f6c94a", galbenInchis: "#d9a521", gluga: "#9b4fb6",
  fermoar: "#3a3990", brat: "#b6b2df", bratInchis: "#8f8bc4", manusa: "#4a49b5", adidas: "#dfe1f2", talpa: "#7d62b8", obraz: "#ee8fbf", bec: "#ffe27a",
};

export function Mascota({ stare = "salut", marime = 140, spune, className = "" }: { stare?: StareMascota; marime?: number; spune?: string; className?: string }) {
  const bucuros = stare === "bucuros", ganditor = stare === "ganditor";
  const ochiY = ganditor ? -5 : 0, ochiX = ganditor ? 4 : 0;
  const mana = (cx: number, cy: number) => <circle cx={cx} cy={cy} r="11" fill={C.manusa} stroke="#35349a" strokeWidth="2.5" />;
  return (
    <span className={`mascota inline-flex items-end gap-2 ${className}`}>
      <svg viewBox="0 0 200 260" width={marime} height={(marime * 260) / 200} role="img" aria-label={`${NUME_MASCOTA}, mascota Fabricii de Inteligență`}
        className={bucuros ? "mascota-salt" : "mascota-plutire"}>
        <defs>
          <radialGradient id="mcap" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stopColor="#7a5fd6" /><stop offset="0.65" stopColor={C.cap} /><stop offset="1" stopColor={C.capInchis} /></radialGradient>
          <radialGradient id="mfata" cx="0.45" cy="0.35" r="0.75"><stop offset="0" stopColor="#a9a6f0" /><stop offset="1" stopColor={C.fata} /></radialGradient>
          <radialGradient id="mbec"><stop offset="0" stopColor="#fffbe0" /><stop offset="0.6" stopColor={C.bec} /><stop offset="1" stopColor="#ffb800" stopOpacity="0" /></radialGradient>
        </defs>

        {/* antena cu beculeț */}
        <path d="M138 52 Q150 34 156 18" fill="none" stroke={C.castiInchis} strokeWidth="5" strokeLinecap="round" />
        <circle cx="157" cy="13" r="16" fill="url(#mbec)" className="mascota-raze" />
        <circle cx="157" cy="13" r="7" fill={C.bec} stroke="#e0a800" strokeWidth="1.5" />
        <circle cx="137" cy="53" r="6" fill={C.castiInchis} />

        {/* brațele (în spatele corpului) */}
        <g strokeLinecap="round" fill="none">
          {stare === "salut" ? (
            <g className="mascota-flutura" style={{ transformOrigin: "150px 196px" }}>
              <path d="M146 196 Q170 184 178 156" stroke={C.brat} strokeWidth="11" strokeDasharray="7 3" />
              {mana(180, 150)}
            </g>
          ) : bucuros ? (
            <><path d="M146 194 Q172 176 182 146" stroke={C.brat} strokeWidth="11" strokeDasharray="7 3" />{mana(184, 140)}</>
          ) : ganditor ? (
            <><path d="M146 200 Q160 214 138 204" stroke={C.brat} strokeWidth="11" strokeDasharray="7 3" />{mana(130, 196)}</>
          ) : (
            <><path d="M146 198 Q166 210 168 228" stroke={C.brat} strokeWidth="11" strokeDasharray="7 3" />{mana(168, 232)}</>
          )}
          {bucuros
            ? <><path d="M54 194 Q28 176 18 146" stroke={C.brat} strokeWidth="11" strokeDasharray="7 3" />{mana(16, 140)}</>
            : <><path d="M54 198 Q34 210 32 228" stroke={C.brat} strokeWidth="11" strokeDasharray="7 3" />{mana(32, 232)}</>}
        </g>

        {/* picioarele și adidașii */}
        <rect x="78" y="226" width="14" height="16" rx="5" fill={C.fermoar} /><rect x="108" y="226" width="14" height="16" rx="5" fill={C.fermoar} />
        <path d="M66 248 Q66 236 84 236 Q96 236 96 248 Z" fill={C.adidas} stroke={C.talpa} strokeWidth="2" /><rect x="64" y="246" width="34" height="7" rx="3.5" fill={C.talpa} />
        <path d="M104 248 Q104 236 116 236 Q134 236 134 248 Z" fill={C.adidas} stroke={C.talpa} strokeWidth="2" /><rect x="102" y="246" width="34" height="7" rx="3.5" fill={C.talpa} />
        <rect x="80" y="238" width="10" height="4" rx="2" fill={C.galben} /><rect x="112" y="238" width="10" height="4" rx="2" fill={C.galben} />

        {/* corpul: vestă galbenă, glugă mov, fermoar */}
        <path d="M56 178 Q100 166 144 178 L146 222 Q100 236 54 222 Z" fill={C.fermoar} />
        <path d="M56 180 Q72 172 94 172 L92 228 Q70 226 54 220 Z" fill={C.galben} stroke={C.galbenInchis} strokeWidth="2" />
        <path d="M144 180 Q128 172 106 172 L108 228 Q130 226 146 220 Z" fill={C.galben} stroke={C.galbenInchis} strokeWidth="2" />
        <line x1="100" y1="176" x2="100" y2="230" stroke="#bfc3e8" strokeWidth="2.5" strokeDasharray="3 2.5" />
        <path d="M60 176 Q100 158 140 176 Q132 186 100 184 Q68 186 60 176 Z" fill={C.gluga} />
        <path d="M118 196 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 z" fill="#8be6f2" opacity="0.9" />

        {/* capul */}
        <g>
          {/* smocul de păr */}
          <g fill={C.par} stroke={C.parInchis} strokeWidth="2" strokeLinejoin="round">
            <path d="M86 46 Q74 22 84 6 Q92 24 98 40 Z" />
            <path d="M96 42 Q96 14 112 2 Q108 24 108 42 Z" />
            <path d="M106 44 Q118 20 134 16 Q122 32 116 48 Z" />
            <path d="M80 50 Q62 34 64 18 Q76 34 90 46 Z" />
          </g>
          <circle cx="100" cy="110" r="70" fill="url(#mcap)" />
          {/* căștile */}
          <g><ellipse cx="31" cy="116" rx="13" ry="20" fill={C.casti} stroke={C.castiInchis} strokeWidth="3" /><ellipse cx="31" cy="116" rx="6" ry="11" fill={C.castiInchis} /></g>
          <g><ellipse cx="169" cy="116" rx="13" ry="20" fill={C.casti} stroke={C.castiInchis} strokeWidth="3" /><ellipse cx="169" cy="116" rx="6" ry="11" fill={C.castiInchis} /></g>
          {/* fața (deschiderea căștii) */}
          <path d="M46 112 Q46 64 100 62 Q154 64 154 112 Q154 160 100 162 Q46 160 46 112 Z" fill="url(#mfata)" stroke={C.capInchis} strokeWidth="3" />
          {/* sprâncenele */}
          <g fill="none" stroke={C.sprancene} strokeWidth="4" strokeLinecap="round">
            <path d={ganditor ? "M64 80 Q76 70 88 76" : stare === "incurajare" ? "M64 82 Q76 76 88 80" : "M64 82 Q76 74 88 80"} />
            <path d={ganditor ? "M112 74 Q124 68 136 78" : stare === "incurajare" ? "M112 80 Q124 76 136 82" : "M112 80 Q124 74 136 82"} />
          </g>
          {/* ochii */}
          {bucuros ? (
            <g fill="none" stroke={C.pupila} strokeWidth="5" strokeLinecap="round"><path d="M64 108 Q76 94 88 108" /><path d="M112 108 Q124 94 136 108" /></g>
          ) : (
            <g>
              <ellipse cx="76" cy="105" rx="14" ry="16" fill="#fff" /><ellipse cx="124" cy="105" rx="14" ry="16" fill="#fff" />
              <g className="mascota-clipire">
                <circle cx={78 + ochiX} cy={107 + ochiY} r="9" fill={C.iris} /><circle cx={126 + ochiX} cy={107 + ochiY} r="9" fill={C.iris} />
                <circle cx={78 + ochiX} cy={107 + ochiY} r="4.5" fill={C.pupila} /><circle cx={126 + ochiX} cy={107 + ochiY} r="4.5" fill={C.pupila} />
                <circle cx={81 + ochiX} cy={103 + ochiY} r="2.6" fill="#fff" /><circle cx={129 + ochiX} cy={103 + ochiY} r="2.6" fill="#fff" />
              </g>
            </g>
          )}
          {/* vizorul transparent */}
          <path d="M38 96 Q40 86 56 86 L144 86 Q160 86 162 96 L160 118 Q158 128 144 128 L116 128 Q106 128 100 120 Q94 128 84 128 L56 128 Q42 128 40 118 Z"
            fill={C.vizor} fillOpacity="0.38" stroke={C.vizorMargine} strokeWidth="3" />
          <path d="M50 92 L82 92" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <rect x="150" y="96" width="16" height="12" rx="3" fill={C.casti} opacity="0.9" />
          {/* obrajii și gura */}
          <ellipse cx="62" cy="138" rx="9" ry="6" fill={C.obraz} opacity="0.65" /><ellipse cx="138" cy="138" rx="9" ry="6" fill={C.obraz} opacity="0.65" />
          {bucuros ? (
            <g><path d="M80 136 Q100 162 120 136 Z" fill="#3a1f5c" /><path d="M90 148 Q100 156 110 148 Q100 144 90 148 Z" fill="#f07a9a" /></g>
          ) : ganditor ? (
            <ellipse cx="106" cy="144" rx="6" ry="5" fill="#3a1f5c" />
          ) : stare === "incurajare" ? (
            <path d="M86 142 Q100 152 114 142" fill="none" stroke="#3a1f5c" strokeWidth="4.5" strokeLinecap="round" />
          ) : (
            <g><path d="M84 138 Q100 156 116 138 Z" fill="#3a1f5c" /><path d="M92 147 Q100 152 108 147 Q100 144 92 147 Z" fill="#f07a9a" /></g>
          )}
        </g>
      </svg>
      {spune && (
        <span className="mascota-bula relative mb-[45%] max-w-[16rem] rounded-3xl bg-white px-4 py-2 text-lg font-bold text-violet-inchis shadow-md ring-2 ring-cyan/60">{spune}</span>
      )}
    </span>
  );
}
