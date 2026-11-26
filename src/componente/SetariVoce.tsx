"use client";

import { useEffect, useState } from "react";
import { SETARI_IMPLICITE, citesteSetari, laSchimbareaVocilor, salveazaSetari, spuneText, vociDisponibile, type LimbaVoce, type SetariVoce } from "@/lib/voce";
import { Mascota } from "./Mascota";

const PROBA: Record<LimbaVoce, string> = { en: "Hi! I'm Sclipici! Let's play together!", ro: "Bună! Eu sunt Sclipici! Hai să ne jucăm!" };

/** Reglajele vocii (pentru părinte / educatoare): vocea, viteza, tonul; se păstrează în browser. */
export function SetariVoceAdult({ limba = "en" }: { limba?: LimbaVoce }) {
  const [deschis, setDeschis] = useState(false);
  const [s, setS] = useState<SetariVoce>(SETARI_IMPLICITE[limba]);
  const [voci, setVoci] = useState<{ nume: string; lang: string }[]>([]);
  useEffect(() => {
    setS(citesteSetari(limba));
    const incarca = () => setVoci(vociDisponibile(limba).map((v) => ({ nume: v.name, lang: v.lang })));
    incarca();
    return laSchimbareaVocilor(incarca);
  }, [limba]);
  const schimba = (p: Partial<SetariVoce>) => { const n = { ...s, ...p }; setS(n); salveazaSetari(limba, n); };
  return (
    <div className="inline-block text-left">
      <button type="button" onClick={() => setDeschis((x) => !x)} aria-expanded={deschis} className="rounded-full bg-white px-5 py-2 font-bold text-mov shadow">⚙️ Vocea</button>
      {deschis && (
        <div className="mt-2 w-[min(92vw,26rem)] rounded-3xl bg-white p-4 shadow-xl ring-1 ring-mov/15">
          <div className="flex items-center gap-3">
            <Mascota stare="salut" marime={70} />
            <p className="text-sm text-gray-600">Pentru adult: alege vocea care îi place copilului. Vocile depind de dispozitiv; pe Microsoft Edge sunt și voci de copil (de ex. „Maisie”).</p>
          </div>
          <label className="mt-3 block text-sm font-semibold text-gray-700">Vocea
            <select value={s.nume ?? ""} onChange={(e) => schimba({ nume: e.target.value || null })} className="mt-1 w-full rounded-xl border-2 border-mov/20 p-2">
              <option value="">Automat (cea mai jucăușă găsită)</option>
              {voci.map((v) => <option key={v.nume} value={v.nume}>{v.nume} · {v.lang}</option>)}
            </select>
          </label>
          {!voci.length && <p className="mt-1 text-xs text-portocaliu">Browserul nu a găsit încă nicio voce pentru această limbă.</p>}
          <label className="mt-3 block text-sm font-semibold text-gray-700">Viteza: {s.viteza <= 0.7 ? "foarte rar" : s.viteza <= 0.85 ? "rar" : s.viteza <= 1 ? "normal" : "repede"}
            <input type="range" min={0.5} max={1.2} step={0.05} value={s.viteza} onChange={(e) => schimba({ viteza: Number(e.target.value) })} className="w-full accent-mov" aria-label="Viteza vocii" />
          </label>
          <label className="mt-2 block text-sm font-semibold text-gray-700">Tonul: {s.ton >= 1.4 ? "foarte jucăuș" : s.ton >= 1.15 ? "jucăuș" : "normal"}
            <input type="range" min={0.8} max={1.8} step={0.05} value={s.ton} onChange={(e) => schimba({ ton: Number(e.target.value) })} className="w-full accent-mov" aria-label="Tonul vocii" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => spuneText(PROBA[limba], limba)} className="rounded-xl bg-mov px-4 py-2 font-bold text-white">🔊 Ascultă</button>
            <button type="button" onClick={() => { setS(SETARI_IMPLICITE[limba]); salveazaSetari(limba, SETARI_IMPLICITE[limba]); }} className="rounded-xl bg-mov-deschis px-4 py-2 font-bold text-mov">Revino la implicit</button>
          </div>
        </div>
      )}
    </div>
  );
}
