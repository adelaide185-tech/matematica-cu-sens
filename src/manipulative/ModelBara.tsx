"use client";

import { useState } from "react";
import { lungimeBara, lungimeMaxima, type Bara, type ModelBara as M, type Segment } from "./logica";
import { BtnUnealta, PALETA } from "./comune";

function Acolada() {
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-4 w-full" aria-hidden>
      <path d="M1,1 Q1,10 8,10 L44,10 Q50,10 50,19 Q50,10 56,10 L92,10 Q99,10 99,1" fill="none" stroke="#4f4183" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CampEticheta({ valoare, onChange, eticheta, mare = false }: { valoare: string; onChange: (v: string) => void; eticheta: string; mare?: boolean }) {
  return (
    <input value={valoare} onChange={(e) => onChange(e.target.value.replace(/[^\d?]/g, "").slice(0, 5))} aria-label={eticheta} inputMode="numeric"
      placeholder="…" onPointerDown={(e) => e.stopPropagation()}
      className={`w-full min-w-10 max-w-24 rounded-lg border-2 border-mov/40 bg-white/90 text-center font-bold text-mov-inchis outline-none focus:border-mov ${mare ? "h-11 text-xl" : "h-10 text-lg"}`} />
  );
}

/**
 * Modelul în bară (metoda figurativă din Singapore Math): bare împărțite în segmente,
 * cu valori sau „?” pe segmente și acoladă pentru întreg.
 * - în lecții: barele sunt pregătite, copilul scrie numerele pe segmentele editabile;
 * - în Atelier (`editor`): copilul construiește singur barele.
 */
export function ModelBara({ valoare, onChange, editor = false, blocat = false }: {
  valoare: M;
  onChange: (m: M) => void;
  editor?: boolean;
  blocat?: boolean;
}) {
  const [ales, setAles] = useState<{ b: number; s: number } | null>(null);
  const max = lungimeMaxima(valoare);

  const schimbaBara = (bi: number, f: (b: Bara) => Bara) => onChange({ bare: valoare.bare.map((b, i) => (i === bi ? f(b) : b)) });
  const schimbaSeg = (bi: number, si: number, f: (s: Segment) => Segment) =>
    schimbaBara(bi, (b) => ({ ...b, segmente: b.segmente.map((s, j) => (j === si ? f(s) : s)) }));

  const segAles = ales ? valoare.bare[ales.b]?.segmente[ales.s] : undefined;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5">
        {valoare.bare.map((b, bi) => (
          <div key={bi} className="flex items-start gap-2 sm:gap-3">
            <div className="w-20 shrink-0 pt-2 text-right text-base font-bold text-gray-800 sm:w-28 sm:text-lg">
              {editor && !blocat ? (
                <input value={b.nume} onChange={(e) => schimbaBara(bi, (x) => ({ ...x, nume: e.target.value.slice(0, 14) }))} aria-label="Numele barei"
                  className="w-full rounded-lg border-2 border-mov/20 px-1 text-right outline-none focus:border-mov" />
              ) : b.nume}
            </div>
            <div className="flex-1">
              <div style={{ width: `${(lungimeBara(b) / max) * 100}%` }} className="min-w-16">
                <div className="flex h-14 w-full">
                  {b.segmente.map((s, si) => {
                    const selectat = editor && ales?.b === bi && ales?.s === si;
                    return (
                      <div key={si} style={{ flexGrow: s.lungime, flexBasis: 0, background: s.punctat ? "transparent" : PALETA[s.culoare ?? bi % PALETA.length] }}
                        onClick={() => editor && !blocat && setAles({ b: bi, s: si })}
                        className={`flex min-w-10 items-center justify-center border-2 px-1 first:rounded-l-lg last:rounded-r-lg ${
                          s.punctat ? "border-dashed border-mov" : "border-mov-inchis"
                        } ${si > 0 ? "-ml-[2px]" : ""} ${selectat ? "ring-4 ring-galben ring-offset-1" : ""} ${editor && !blocat ? "cursor-pointer" : ""}`}>
                        {(s.editabil || editor) && !blocat ? (
                          <CampEticheta valoare={s.eticheta} onChange={(v) => schimbaSeg(bi, si, (x) => ({ ...x, eticheta: v }))} eticheta={`${b.nume}, segmentul ${si + 1}`} />
                        ) : (
                          <span className="text-xl font-bold text-gray-900">{s.eticheta}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {(b.total !== undefined || b.totalEditabil) && (
                  <div className="mt-1 flex flex-col items-center">
                    <Acolada />
                    <div className="mt-1">
                      {(b.totalEditabil || editor) && !blocat ? (
                        <CampEticheta mare valoare={b.total ?? ""} onChange={(v) => schimbaBara(bi, (x) => ({ ...x, total: v }))} eticheta={`${b.nume}, în total`} />
                      ) : (
                        <span className="text-xl font-bold text-mov-inchis">{b.total}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editor && !blocat && (
        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2">
            <BtnUnealta onClick={() => onChange({ bare: [...valoare.bare, { nume: `Bara ${valoare.bare.length + 1}`, segmente: [{ lungime: 4, eticheta: "" }] }] })} disabled={valoare.bare.length >= 4}>
              + Bară nouă
            </BtnUnealta>
            {ales && (
              <>
                <BtnUnealta onClick={() => schimbaBara(ales.b, (x) => ({ ...x, segmente: [...x.segmente, { lungime: 3, eticheta: "" }] }))} disabled={(valoare.bare[ales.b]?.segmente.length ?? 0) >= 8}>
                  + Segment
                </BtnUnealta>
                <BtnUnealta onClick={() => schimbaBara(ales.b, (x) => ({ ...x, total: x.total === undefined ? "?" : undefined }))}>
                  {valoare.bare[ales.b]?.total === undefined ? "＋ Acoladă (întregul)" : "− Acoladă"}
                </BtnUnealta>
                <BtnUnealta onClick={() => { onChange({ bare: valoare.bare.filter((_, i) => i !== ales.b) }); setAles(null); }}>🗑 Bara</BtnUnealta>
              </>
            )}
          </div>
          {ales && segAles && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
              <span className="text-sm font-semibold text-gray-700">Segmentul ales:</span>
              <BtnUnealta onClick={() => schimbaSeg(ales.b, ales.s, (x) => ({ ...x, lungime: Math.max(1, x.lungime - 1) }))} aria-label="Mai scurt">◀ mai scurt</BtnUnealta>
              <BtnUnealta onClick={() => schimbaSeg(ales.b, ales.s, (x) => ({ ...x, lungime: Math.min(20, x.lungime + 1) }))} aria-label="Mai lung">mai lung ▶</BtnUnealta>
              <BtnUnealta activ={segAles.punctat} onClick={() => schimbaSeg(ales.b, ales.s, (x) => ({ ...x, punctat: !x.punctat }))}>┅ Punctat</BtnUnealta>
              <BtnUnealta onClick={() => schimbaSeg(ales.b, ales.s, (x) => ({ ...x, culoare: ((x.culoare ?? ales.b) + 1) % PALETA.length }))}>🎨 Culoare</BtnUnealta>
              <BtnUnealta disabled={(valoare.bare[ales.b]?.segmente.length ?? 0) <= 1}
                onClick={() => { schimbaBara(ales.b, (x) => ({ ...x, segmente: x.segmente.filter((_, j) => j !== ales.s) })); setAles(null); }}>🗑 Segmentul</BtnUnealta>
            </div>
          )}
          {!ales && valoare.bare.length > 0 && <p className="text-sm text-gray-600">Atinge un segment ca să-l lungești, să-l colorezi sau să adaugi segmente.</p>}
        </div>
      )}
    </div>
  );
}
