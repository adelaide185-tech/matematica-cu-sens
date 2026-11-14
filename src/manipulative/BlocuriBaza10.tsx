"use client";

import { AnimatePresence, motion } from "framer-motion";
import { desface, grupeaza, MAX_BLOCURI, modificaBlocuri, valoareBlocuri, type Blocuri } from "./logica";
import { BtnUnealta } from "./comune";

const CULORI = { sute: "#e0483e", zeci: "#2f6fd1", unitati: "#f2a20c" };
const NUME = { sute: "Sute", zeci: "Zeci", unitati: "Unități" };

/** O sută: pătrat 10×10. */
function PiesaSuta() {
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16 sm:h-20 sm:w-20" aria-hidden>
      <rect x="1" y="1" width="98" height="98" rx="3" fill={CULORI.sute} />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} stroke="#fff" strokeOpacity={0.55} strokeWidth="1.2">
          <line x1={(i + 1) * 10} y1="1" x2={(i + 1) * 10} y2="99" />
          <line x1="1" y1={(i + 1) * 10} x2="99" y2={(i + 1) * 10} />
        </g>
      ))}
    </svg>
  );
}

/** O zece: bară 1×10. */
function PiesaZece() {
  return (
    <svg viewBox="0 0 10 100" className="h-16 w-[0.9rem] sm:h-20 sm:w-[1.1rem]" aria-hidden>
      <rect x="0.5" y="0.5" width="9" height="99" rx="1.5" fill={CULORI.zeci} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1="0.5" y1={(i + 1) * 10} x2="9.5" y2={(i + 1) * 10} stroke="#fff" strokeOpacity={0.6} strokeWidth="1" />
      ))}
    </svg>
  );
}

function PiesaUnitate() {
  return (
    <svg viewBox="0 0 10 10" className="h-[0.9rem] w-[0.9rem] sm:h-[1.1rem] sm:w-[1.1rem]" aria-hidden>
      <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" fill={CULORI.unitati} />
    </svg>
  );
}

const PIESA = { sute: PiesaSuta, zeci: PiesaZece, unitati: PiesaUnitate };

/**
 * Blocurile baza 10 pe tabelul de valoare pozițională.
 * Atingi „+” ca să adaugi o piesă, atingi o piesă ca să o scoți; schimbi 10 → 1 sau 1 → 10.
 */
export function BlocuriBaza10({
  valoare, onChange, arataNumar = true, blocat = false, faraSute = false,
}: {
  valoare: Blocuri;
  onChange: (b: Blocuri) => void;
  arataNumar?: boolean;
  blocat?: boolean;
  faraSute?: boolean;
}) {
  const ordine = (faraSute ? ["zeci", "unitati"] : ["sute", "zeci", "unitati"]) as (keyof Blocuri)[];
  const total = valoareBlocuri(valoare);
  const aplica = (b: Blocuri | null) => b && !blocat && onChange(b);

  return (
    <div className="w-full">
      <div className={`grid gap-2 ${faraSute ? "grid-cols-2" : "grid-cols-3"}`}>
        {ordine.map((o) => {
          const Piesa = PIESA[o];
          return (
            <section key={o} className="flex min-h-64 flex-col rounded-2xl bg-white/80 shadow-inner ring-1 ring-black/5" aria-label={`${NUME[o]}: ${valoare[o]}`}>
              <h3 className="rounded-t-2xl py-1.5 text-center text-sm font-bold text-white sm:text-base" style={{ background: CULORI[o] }}>
                {NUME[o]} {arataNumar && <span className="ml-1 rounded-md bg-white/25 px-1.5">{valoare[o]}</span>}
              </h3>
              <div className={`flex flex-1 flex-wrap content-start justify-center gap-1 p-2 ${o === "unitati" ? "mx-auto max-w-[8.5rem] sm:max-w-[10rem]" : ""}`}>
                <AnimatePresence initial={false}>
                  {Array.from({ length: valoare[o] }, (_, i) => (
                    <motion.button key={`${o}-${i}`} type="button" layout
                      initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 26 }}
                      onClick={() => aplica(modificaBlocuri(valoare, o, -1))} disabled={blocat}
                      aria-label={`Scoate ${o === "sute" ? "o sută" : o === "zeci" ? "o zece" : "o unitate"}`}
                      className="rounded-sm focus-visible:outline-3 focus-visible:outline-mov disabled:cursor-default">
                      <Piesa />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
              {!blocat && (
                <div className="flex flex-col gap-1.5 p-2">
                  <div className="flex gap-1.5">
                    <BtnUnealta className="flex-1" onClick={() => aplica(modificaBlocuri(valoare, o, -1))} disabled={valoare[o] === 0} aria-label={`Scoate din ${NUME[o]}`}>−</BtnUnealta>
                    <BtnUnealta className="flex-1" onClick={() => aplica(modificaBlocuri(valoare, o, 1))} disabled={valoare[o] >= MAX_BLOCURI[o]} aria-label={`Adaugă la ${NUME[o]}`}>+</BtnUnealta>
                  </div>
                  {o === "unitati" && valoare.unitati >= 10 && (
                    <BtnUnealta activ onClick={() => aplica(grupeaza(valoare, "unitati"))}>10 unități → 1 zece</BtnUnealta>
                  )}
                  {o === "zeci" && valoare.zeci >= 10 && !faraSute && (
                    <BtnUnealta activ onClick={() => aplica(grupeaza(valoare, "zeci"))}>10 zeci → 1 sută</BtnUnealta>
                  )}
                  {o === "zeci" && valoare.zeci > 0 && (
                    <BtnUnealta onClick={() => aplica(desface(valoare, "zeci"))} disabled={!desface(valoare, "zeci")}>1 zece → 10 unități</BtnUnealta>
                  )}
                  {o === "sute" && valoare.sute > 0 && (
                    <BtnUnealta onClick={() => aplica(desface(valoare, "sute"))} disabled={!desface(valoare, "sute")}>1 sută → 10 zeci</BtnUnealta>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      {arataNumar && (
        <p className="mt-3 text-center text-2xl font-bold text-mov-inchis" aria-live="polite">
          {!faraSute && <>{valoare.sute} S + </>}{valoare.zeci} Z + {valoare.unitati} U = <span className="text-3xl">{total}</span>
        </p>
      )}
    </div>
  );
}
