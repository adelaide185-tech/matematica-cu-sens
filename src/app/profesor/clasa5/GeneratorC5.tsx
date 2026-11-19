"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FisaC3 } from "@/componente/FisaC3";
import { CAPITOLE_C5, JOCURI_C5, codificaC5, configC5Implicita, curataC5 } from "@/motor/clasa5/config";
import { genereazaC5 } from "@/motor/clasa5/generator";
import { DESCRIERE_CAPITOL_C5, ICON_CAPITOL_C5, NUME_CAPITOL_C5, type CapitolC5, type ConfigC5 } from "@/motor/clasa5/tipuri";
import { NUME_NIVEL_C4 as NUME_NIVEL_C5, type NivelC4 as NivelC5 } from "@/motor/clasa4/tipuri";
import { JOCURI_C3, NR_RAPIDE_C3, SECUNDE_VITEZA } from "@/motor/clasa3/tipuri";
import { seedNou } from "@/motor/rng";
import { creeazaTemaJocC5 } from "@/lib/actiuni-teme";
import { Camp, PanouTema, Sectiune, type Grupa } from "../calcul/GeneratorCalcul";

const CHEIE = "mcs-clasa5";
const DESCRIERE_JOC_C5: Partial<Record<ConfigC5["joc"], string>> = {
  balanta: "Compară puteri, fracții, numere zecimale, expresii și arii.",
  detectiv: "Găsește numărul care lipsește: exponenți, factor comun, amplificări, transformări.",
  constructor: "Construiește pe grilă dreptunghiul cu aria (și perimetrul) cerute (Arii și volume).",
};

export function GeneratorC5({ grupe, online }: { grupe: Grupa[]; online: boolean }) {
  const [cfg, setCfg] = useState<ConfigC5>(() => configC5Implicita(1));
  const [gata, setGata] = useState(false);
  const [vedere, setVedere] = useState<"elev" | "raspunsuri" | "barem" | "rezolvate">("elev");

  useEffect(() => {
    try {
      const s = localStorage.getItem(CHEIE);
      setCfg(s ? { ...curataC5(JSON.parse(s)), seed: seedNou(), inlocuiri: {} } : (c) => ({ ...c, seed: seedNou() }));
    } catch {
      setCfg((c) => ({ ...c, seed: seedNou() }));
    }
    setGata(true);
  }, []);
  useEffect(() => {
    if (!gata) return;
    try { localStorage.setItem(CHEIE, JSON.stringify(cfg)); } catch {}
  }, [cfg, gata]);

  const { itemi, avertismente } = useMemo(() => genereazaC5(cfg), [cfg]);
  const c = useMemo(() => codificaC5(cfg), [cfg]);
  const set = (p: Partial<ConfigC5>) => setCfg((x) => ({ ...x, ...p }));
  const comuta = (cap: CapitolC5) => {
    const l = cfg.capitole.includes(cap) ? cfg.capitole.filter((x) => x !== cap) : [...cfg.capitole, cap];
    if (l.length) set({ capitole: CAPITOLE_C5.filter((x) => l.includes(x)), inlocuiri: {} });
  };
  const regenereaza = (id: string) => setCfg((x) => ({ ...x, inlocuiri: { ...x.inlocuiri, [id]: (x.inlocuiri[id] ?? 0) + 1 } }));
  const subtitlu = NUME_NIVEL_C5[cfg.nivel];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[460px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link href="/profesor" className="text-mov">← Fișe pe lecții</Link>
          {online && <Link href="/profesor/teme" className="text-mov">Rezultate →</Link>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">Clasa a V-a: fișe și jocuri</h1>
        <p className="text-sm text-gray-600">Capitolele din cuprins, pe Nivel 1 și Nivel 2, cu exerciții rezolvate pas cu pas. Aceleași exerciții apar pe fișa PDF și în jocul online.</p>

        <Sectiune titlu="1. Capitole (unul sau mai multe)">
          <div className="mb-2 flex gap-2 text-xs">
            <button type="button" onClick={() => set({ capitole: [...CAPITOLE_C5], inlocuiri: {} })} className="rounded-lg bg-mov-deschis px-2.5 py-1 font-semibold text-mov">Toate</button>
            <button type="button" onClick={() => set({ capitole: ["puteri", "ordine", "factor", "divizibilitate", "prime"], inlocuiri: {} })} className="rounded-lg bg-mov-deschis px-2.5 py-1 font-semibold text-mov">Numere naturale</button>
            <button type="button" onClick={() => set({ capitole: ["fractii", "zecimale"], inlocuiri: {} })} className="rounded-lg bg-mov-deschis px-2.5 py-1 font-semibold text-mov">Fracții</button>
          </div>
          <div className="grid gap-1.5">
            {CAPITOLE_C5.map((cap, i) => {
              const ales = cfg.capitole.includes(cap);
              return (
                <label key={cap} className={`flex cursor-pointer items-start gap-2 rounded-2xl border-2 p-2 ${ales ? "border-mov bg-mov-deschis/50" : "border-mov/10"}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-mov" checked={ales} onChange={() => comuta(cap)} />
                  <span>
                    <span className="block font-semibold text-mov-inchis"><span aria-hidden>{ICON_CAPITOL_C5[cap]}</span> {i + 1}. {NUME_CAPITOL_C5[cap]}</span>
                    <span className="block text-xs text-gray-600">{DESCRIERE_CAPITOL_C5[cap]}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </Sectiune>

        <Sectiune titlu="2. Nivelul">
          <div className="grid grid-cols-3 gap-2">
            {(["1", "2", "amestecat"] as NivelC5[]).map((n) => (
              <button key={n} type="button" onClick={() => set({ nivel: n, inlocuiri: {} })} className={`rounded-xl px-3 py-2 font-bold ${cfg.nivel === n ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{NUME_NIVEL_C5[n]}</button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Nivel 1: exerciții de bază. Nivel 2: transformări compuse, probleme cu mai mulți pași, numărarea cazurilor.</p>
        </Sectiune>

        <Sectiune titlu="3. Jocul">
          <div className="grid grid-cols-1 gap-2">
            {JOCURI_C5.map((j) => (
              <button key={j} type="button" onClick={() => set({ joc: j })}
                className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left ${cfg.joc === j ? "border-mov bg-mov text-white" : "border-mov/15 hover:bg-mov-deschis"}`}>
                <span className="text-2xl" aria-hidden>{JOCURI_C3[j].icon}</span>
                <span><span className="block font-bold">{JOCURI_C3[j].nume}</span><span className={`block text-xs ${cfg.joc === j ? "text-white/90" : "text-gray-600"}`}>{DESCRIERE_JOC_C5[j] ?? JOCURI_C3[j].descriere}</span></span>
              </button>
            ))}
          </div>
          {cfg.joc === "constructor" && !cfg.capitole.includes("arie") && <p className="mt-2 rounded-lg bg-galben-deschis p-2 text-xs">Constructorul lucrează cu arii pe grilă: bifează „Arii și volume”. La celelalte capitole, exercițiile apar ca întrebări obișnuite.</p>}
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

        <Sectiune titlu={`4. Câte ${cfg.joc === "memory" ? "perechi" : "exerciții"}`}>
          <div className="grid grid-cols-6 gap-1.5">
            {NR_RAPIDE_C3.map((n) => <button key={n} type="button" onClick={() => set({ nr: n })} className={`rounded-xl py-2 font-bold ${cfg.nr === n ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`}>{n}</button>)}
          </div>
        </Sectiune>

        <Sectiune titlu="5. Antet (pentru fișă)">
          <Camp eticheta="Titlu" valoare={cfg.antet.titlu} onChange={(v) => set({ antet: { ...cfg.antet, titlu: v } })} />
          <Camp eticheta="Centrul / școala" valoare={cfg.antet.centru} onChange={(v) => set({ antet: { ...cfg.antet, centru: v } })} />
          <div className="grid grid-cols-2 gap-2">
            <Camp eticheta="Data" sugestie="liber = linie" valoare={cfg.antet.data} onChange={(v) => set({ antet: { ...cfg.antet, data: v } })} />
            <Camp eticheta="Timp de lucru" sugestie="ex. 40 de minute" valoare={cfg.antet.timp} onChange={(v) => set({ antet: { ...cfg.antet, timp: v } })} />
          </div>
        </Sectiune>

        <Sectiune titlu="6. Fișa PDF">
          <button type="button" onClick={() => set({ seed: seedNou(), inlocuiri: {} })} className="w-full rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Alte exerciții</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={`/api/pdf-clasa5?c=${c}&mod=fisa`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis">⬇️ Fișa PDF</a>
            <a href={`/api/pdf-clasa5?c=${c}&mod=${encodeURIComponent("fisa+barem")}`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov">⬇️ Fișa + barem</a>
            <a href={`/api/pdf-clasa5?c=${c}&mod=rezolvate`} className="col-span-2 rounded-xl bg-green-700 px-3 py-3 text-center font-bold text-white hover:bg-green-800">⬇️ Exerciții rezolvate pas cu pas (PDF)</a>
            <a href={`/fisa/clasa5?c=${c}&mod=fisa`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează fișa</a>
            <a href={`/fisa/clasa5?c=${c}&mod=barem`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează baremul</a>
          </div>
          <a href={`/elev/clasa5/joc?c=${c}&preview=1`} target="_blank" className="mt-2 block rounded-xl border-2 border-dashed border-mov px-3 py-2 text-center font-semibold text-mov hover:bg-mov-deschis">▶ Previzualizează jocul ca elev</a>
          <p className="mt-2 text-xs text-gray-500">Codul: <b>{cfg.seed}</b>. Fișa, baremul, rezolvările și jocul online au aceleași exerciții.</p>
        </Sectiune>

        <Sectiune titlu="7. Joc interactiv online">
          {online ? <PanouTema c={c} titluImplicit={`${JOCURI_C3[cfg.joc].nume} – clasa a V-a`} grupe={grupe} dezactivat={!itemi.length} actiune={creeazaTemaJocC5} etichetaTrimite="🎮 Trimite jocul elevilor" />
            : <p className="rounded-lg bg-galben-deschis p-3 text-sm">Jocurile ca temă funcționează când aplicația are conturi (baza de date conectată). Previzualizarea merge oricum.</p>}
        </Sectiune>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2">
          {([["elev", "Fișa elevului"], ["raspunsuri", "Cu răspunsuri"], ["barem", "Barem"], ["rezolvate", "Exerciții rezolvate"]] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setVedere(v)} className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{t}</button>
          ))}
          <span className="ml-auto text-sm text-gray-600">{itemi.length} exerciții · ↻ pe un exercițiu îl înlocuiește</span>
        </div>
        {avertismente.length > 0 && <div className="mx-auto mb-4 max-w-[210mm] rounded-2xl bg-galben-deschis p-3 text-sm">{avertismente.map((a) => <p key={a}>⚠️ {a}</p>)}</div>}
        {gata && (
          <FisaC3 cfg={cfg} itemi={itemi} clasa="a V-a" subtitlu={subtitlu}
            mod={vedere === "barem" ? "barem" : vedere === "rezolvate" ? "rezolvate" : "fisa"} cuRaspunsuri={vedere === "raspunsuri"}
            onRegenereaza={vedere === "barem" ? undefined : regenereaza} />
        )}
      </main>
    </div>
  );
}
