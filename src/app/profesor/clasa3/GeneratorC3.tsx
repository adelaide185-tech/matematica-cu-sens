"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FisaC3 } from "@/componente/FisaC3";
import { CAPITOLE, JOCURI, codificaC3, configC3Implicita, curataC3 } from "@/motor/clasa3/config";
import { genereazaC3 } from "@/motor/clasa3/generator";
import {
  ICON_CAPITOL, JOCURI_C3, NR_RAPIDE_C3, NUME_CAPITOL, NUME_FRACTII, NUME_IMPARTIRE, NUME_INMULTIRE, NUME_MASURI, NUME_NUMERE, NUME_PROBLEME, SECUNDE_VITEZA,
  type CapitolC3, type ConfigC3, type OptiuniC3,
} from "@/motor/clasa3/tipuri";
import { seedNou } from "@/motor/rng";
import { creeazaTemaJocC3 } from "@/lib/actiuni-teme";
import { Camp, PanouTema, Sectiune, type Grupa } from "../calcul/GeneratorCalcul";

const CHEIE = "mcs-clasa3";

function Cipuri<T extends string>({ toate, alese, nume, onChange }: { toate: T[]; alese: T[]; nume: Record<T, string>; onChange: (v: T[]) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {toate.map((t) => {
        const ales = alese.includes(t);
        return (
          <button key={t} type="button" onClick={() => { const l = ales ? alese.filter((x) => x !== t) : [...alese, t]; if (l.length) onChange(l); }}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${ales ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/20"}`}>{nume[t]}</button>
        );
      })}
    </div>
  );
}

function Alegere<T extends string>({ valoare, optiuni, onChange }: { valoare: T; optiuni: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1 text-xs">
      {optiuni.map(([v, t]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={`rounded-lg px-2.5 py-1 font-semibold ${valoare === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/20"}`}>{t}</button>
      ))}
    </div>
  );
}

export function GeneratorC3({ grupe, online }: { grupe: Grupa[]; online: boolean }) {
  const [cfg, setCfg] = useState<ConfigC3>(() => configC3Implicita(1));
  const [gata, setGata] = useState(false);
  const [vedere, setVedere] = useState<"elev" | "raspunsuri" | "barem">("elev");

  useEffect(() => {
    try {
      const s = localStorage.getItem(CHEIE);
      setCfg(s ? { ...curataC3(JSON.parse(s)), seed: seedNou(), inlocuiri: {} } : (c) => ({ ...c, seed: seedNou() }));
    } catch {
      setCfg((c) => ({ ...c, seed: seedNou() }));
    }
    setGata(true);
  }, []);
  useEffect(() => {
    if (!gata) return;
    try { localStorage.setItem(CHEIE, JSON.stringify(cfg)); } catch {}
  }, [cfg, gata]);

  const { itemi, avertismente } = useMemo(() => genereazaC3(cfg), [cfg]);
  const c = useMemo(() => codificaC3(cfg), [cfg]);
  const set = (p: Partial<ConfigC3>) => setCfg((x) => ({ ...x, ...p }));
  const opt = <K extends keyof OptiuniC3>(k: K, v: OptiuniC3[K]) => setCfg((x) => ({ ...x, optiuni: { ...x.optiuni, [k]: v }, inlocuiri: {} }));
  const comuta = (cap: CapitolC3) => {
    const l = cfg.capitole.includes(cap) ? cfg.capitole.filter((x) => x !== cap) : [...cfg.capitole, cap];
    if (l.length) set({ capitole: CAPITOLE.filter((x) => l.includes(x)) });
  };
  const regenereaza = (id: string) => setCfg((x) => ({ ...x, inlocuiri: { ...x.inlocuiri, [id]: (x.inlocuiri[id] ?? 0) + 1 } }));
  const o = cfg.optiuni;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[460px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link href="/profesor" className="text-mov">← Fișe pe lecții</Link>
          {online && <Link href="/profesor/teme" className="text-mov">Rezultate →</Link>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">Clasa a III-a: teme și jocuri</h1>
        <p className="text-sm text-gray-600">Alege capitolele, jocul și numărul de exerciții. Aceleași exerciții apar pe fișa PDF și în jocul online.</p>

        <Sectiune titlu="1. Capitole (unul sau mai multe)">
          <div className="grid gap-2">
            {CAPITOLE.map((cap) => {
              const ales = cfg.capitole.includes(cap);
              return (
                <div key={cap} className={`rounded-2xl border-2 p-2.5 ${ales ? "border-mov bg-mov-deschis/50" : "border-mov/10"}`}>
                  <label className="flex cursor-pointer items-center gap-2 font-semibold text-mov-inchis">
                    <input type="checkbox" className="h-5 w-5 accent-mov" checked={ales} onChange={() => comuta(cap)} />
                    <span aria-hidden>{ICON_CAPITOL[cap]}</span> {NUME_CAPITOL[cap]}
                  </label>
                  {ales && cap === "numere" && <Cipuri toate={Object.keys(NUME_NUMERE) as (keyof typeof NUME_NUMERE)[]} alese={o.numere} nume={NUME_NUMERE} onChange={(v) => opt("numere", v)} />}
                  {ales && cap === "adunare" && (
                    <>
                      <Alegere valoare={o.adunare.trecere} optiuni={[["oricare", "oricum"], ["fara", "fără trecere peste ordin"], ["cu", "cu trecere peste ordin"]]} onChange={(v) => opt("adunare", { ...o.adunare, trecere: v })} />
                      <label className="mt-1 flex items-center gap-2 text-xs"><input type="checkbox" className="accent-mov" checked={o.adunare.necunoscut} onChange={(e) => opt("adunare", { ...o.adunare, necunoscut: e.target.checked })} /> și aflarea termenului necunoscut (a + □ = b, □ − a = b, a − □ = b)</label>
                    </>
                  )}
                  {ales && cap === "inmultire" && (
                    <>
                      <Cipuri toate={Object.keys(NUME_INMULTIRE) as (keyof typeof NUME_INMULTIRE)[]} alese={o.inmultire.tipuri} nume={NUME_INMULTIRE} onChange={(v) => opt("inmultire", { ...o.inmultire, tipuri: v })} />
                      {o.inmultire.tipuri.includes("1cifra") && <Alegere valoare={o.inmultire.trecere} optiuni={[["oricare", "oricum"], ["fara", "fără trecere"], ["cu", "cu trecere"]]} onChange={(v) => opt("inmultire", { ...o.inmultire, trecere: v })} />}
                    </>
                  )}
                  {ales && cap === "impartire" && (
                    <>
                      <Cipuri toate={Object.keys(NUME_IMPARTIRE) as (keyof typeof NUME_IMPARTIRE)[]} alese={o.impartire.tipuri} nume={NUME_IMPARTIRE} onChange={(v) => opt("impartire", { ...o.impartire, tipuri: v })} />
                      <Alegere valoare={o.impartire.rest} optiuni={[["exacta", "exactă (rest 0)"], ["cu-rest", "cu rest (D = Î × C + R, R < Î)"], ["amestecat", "amestecat"]]} onChange={(v) => opt("impartire", { ...o.impartire, rest: v })} />
                    </>
                  )}
                  {ales && cap === "ordine" && <Alegere valoare={o.ordine.paranteze} optiuni={[["fara", "fără paranteze"], ["cu", "cu paranteze rotunde"], ["amestecat", "amestecat"]]} onChange={(v) => opt("ordine", { paranteze: v })} />}
                  {ales && cap === "fractii" && <Cipuri toate={Object.keys(NUME_FRACTII) as (keyof typeof NUME_FRACTII)[]} alese={o.fractii} nume={NUME_FRACTII} onChange={(v) => opt("fractii", v)} />}
                  {ales && cap === "masuri" && <Cipuri toate={Object.keys(NUME_MASURI) as (keyof typeof NUME_MASURI)[]} alese={o.masuri} nume={NUME_MASURI} onChange={(v) => opt("masuri", v)} />}
                  {ales && cap === "probleme" && <Cipuri toate={Object.keys(NUME_PROBLEME) as (keyof typeof NUME_PROBLEME)[]} alese={o.probleme} nume={NUME_PROBLEME} onChange={(v) => opt("probleme", v)} />}
                </div>
              );
            })}
          </div>
        </Sectiune>

        <Sectiune titlu="2. Jocul">
          <div className="grid grid-cols-1 gap-2">
            {JOCURI.map((j) => (
              <button key={j} type="button" onClick={() => set({ joc: j })}
                className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left ${cfg.joc === j ? "border-mov bg-mov text-white" : "border-mov/15 hover:bg-mov-deschis"}`}>
                <span className="text-2xl" aria-hidden>{JOCURI_C3[j].icon}</span>
                <span><span className="block font-bold">{JOCURI_C3[j].nume}</span><span className={`block text-xs ${cfg.joc === j ? "text-white/90" : "text-gray-600"}`}>{JOCURI_C3[j].descriere}</span></span>
              </button>
            ))}
          </div>
          {cfg.joc === "constructor" && !cfg.capitole.some((x) => x === "fractii" || x === "masuri") && <p className="mt-2 rounded-lg bg-galben-deschis p-2 text-xs">Constructorul lucrează cu perimetre și fracții (capitolele „Fracții” și „Geometrie și unități de măsură”).</p>}
          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">Vieți:
              {([0, 3, 5] as const).map((v) => <button key={v} type="button" onClick={() => set({ vieti: v })} className={`rounded-lg px-3 py-1 font-semibold ${cfg.vieti === v ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{v ? `${v} ❤️` : "fără (relaxat)"}</button>)}
            </div>
            {cfg.joc === "sprint" && (
              <div className="flex flex-wrap items-center gap-2">Viteza:
                {([1, 2, 3] as const).map((v) => <button key={v} type="button" onClick={() => set({ viteza: v })} className={`rounded-lg px-3 py-1 font-semibold ${cfg.viteza === v ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{["lent", "mediu", "rapid"][v - 1]} ({SECUNDE_VITEZA[v]} s)</button>)}
              </div>
            )}
          </div>
        </Sectiune>

        <Sectiune titlu={`3. Câte ${cfg.joc === "memory" ? "perechi" : "exerciții"}`}>
          <div className="grid grid-cols-6 gap-1.5">
            {NR_RAPIDE_C3.map((n) => <button key={n} type="button" onClick={() => set({ nr: n })} className={`rounded-xl py-2 font-bold ${cfg.nr === n ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`}>{n}</button>)}
          </div>
        </Sectiune>

        <Sectiune titlu="4. Antet (pentru fișă)">
          <Camp eticheta="Titlu" valoare={cfg.antet.titlu} onChange={(v) => set({ antet: { ...cfg.antet, titlu: v } })} />
          <Camp eticheta="Centrul / școala" valoare={cfg.antet.centru} onChange={(v) => set({ antet: { ...cfg.antet, centru: v } })} />
          <div className="grid grid-cols-2 gap-2">
            <Camp eticheta="Data" sugestie="liber = linie" valoare={cfg.antet.data} onChange={(v) => set({ antet: { ...cfg.antet, data: v } })} />
            <Camp eticheta="Timp de lucru" sugestie="ex. 30 de minute" valoare={cfg.antet.timp} onChange={(v) => set({ antet: { ...cfg.antet, timp: v } })} />
          </div>
        </Sectiune>

        <Sectiune titlu="5. Fișa PDF">
          <button type="button" onClick={() => set({ seed: seedNou(), inlocuiri: {} })} className="w-full rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Alte exerciții</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={`/api/pdf-clasa3?c=${c}&mod=fisa`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis">⬇️ Descarcă fișa PDF</a>
            <a href={`/api/pdf-clasa3?c=${c}&mod=${encodeURIComponent("fisa+barem")}`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov">⬇️ Fișa + barem (PDF)</a>
            <a href={`/fisa/clasa3?c=${c}&mod=fisa`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează fișa</a>
            <a href={`/fisa/clasa3?c=${c}&mod=barem`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează baremul</a>
          </div>
          <a href={`/elev/clasa3/joc?c=${c}&preview=1`} target="_blank" className="mt-2 block rounded-xl border-2 border-dashed border-mov px-3 py-2 text-center font-semibold text-mov hover:bg-mov-deschis">▶ Previzualizează jocul ca elev</a>
          <p className="mt-2 text-xs text-gray-500">Codul: <b>{cfg.seed}</b>. Fișa, baremul și jocul online au aceleași exerciții.</p>
        </Sectiune>

        <Sectiune titlu="6. Joc interactiv online">
          {online ? <PanouTema c={c} titluImplicit={`${JOCURI_C3[cfg.joc].nume} – clasa a III-a`} grupe={grupe} dezactivat={!itemi.length} actiune={creeazaTemaJocC3} etichetaTrimite="🎮 Trimite jocul elevilor" />
            : <p className="rounded-lg bg-galben-deschis p-3 text-sm">Jocurile ca temă funcționează când aplicația are conturi (baza de date conectată). Previzualizarea merge oricum.</p>}
        </Sectiune>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2">
          {([["elev", "Fișa elevului"], ["raspunsuri", "Cu răspunsuri"], ["barem", "Barem"]] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setVedere(v)} className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{t}</button>
          ))}
          <span className="ml-auto text-sm text-gray-600">{itemi.length} exerciții · ↻ pe un exercițiu îl înlocuiește</span>
        </div>
        {avertismente.length > 0 && <div className="mx-auto mb-4 max-w-[210mm] rounded-2xl bg-galben-deschis p-3 text-sm">{avertismente.map((a) => <p key={a}>⚠️ {a}</p>)}</div>}
        {gata && <FisaC3 cfg={cfg} itemi={itemi} mod={vedere === "barem" ? "barem" : "fisa"} cuRaspunsuri={vedere === "raspunsuri"} onRegenereaza={vedere === "barem" ? undefined : regenereaza} />}
      </main>
    </div>
  );
}
