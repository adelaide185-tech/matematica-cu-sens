"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JOCURI_ARCADE, JOCURI_ARCADE_IDS, NUME_CLASA_SCURT, codificaArcade, configArcadeImplicita, curataArcade, type ConfigArcade } from "@/motor/arcade/config";
import { intrebariArcade, NUME_DIFICULTATE, type DificultateArcade } from "@/motor/arcade/intrebari";
import { NUME_VITEZA, PUNCTE_INTREBARE, type VitezaArcade } from "@/motor/arcade/scor";
import { seedNou } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";
import { creeazaTemaArcade } from "@/lib/actiuni-teme";
import { TextMate } from "@/jocuri/c3/Vizuale";
import { PanouTema, Sectiune, type Grupa } from "../calcul/GeneratorCalcul";

const CHEIE = "mcs-arcade";

/** Profesorul alege jocul arcade, îl vede cu întrebările și răspunsurile și îl trimite ca temă. */
export function GeneratorArcade({ grupe, online }: { grupe: Grupa[]; online: boolean }) {
  const [cfg, setCfg] = useState<ConfigArcade>(() => configArcadeImplicita(1));
  const [gata, setGata] = useState(false);
  useEffect(() => {
    try {
      const s = localStorage.getItem(CHEIE);
      setCfg(s ? { ...curataArcade(JSON.parse(s)), seed: seedNou() } : (c) => ({ ...c, seed: seedNou() }));
    } catch {
      setCfg((c) => ({ ...c, seed: seedNou() }));
    }
    setGata(true);
  }, []);
  useEffect(() => { if (gata) try { localStorage.setItem(CHEIE, JSON.stringify(cfg)); } catch {} }, [cfg, gata]);
  const set = (p: Partial<ConfigArcade>) => setCfg((x) => ({ ...x, ...p }));
  const intrebari = useMemo(() => intrebariArcade(cfg.clasa, cfg.seed, cfg.n, cfg.dif), [cfg]);
  const c = useMemo(() => codificaArcade(cfg), [cfg]);
  const info = JOCURI_ARCADE[cfg.joc];
  const btn = (activ: boolean) => `rounded-xl px-3 py-2 font-bold ${activ ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[440px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link href="/profesor" className="text-mov">← Fișe pe lecții</Link>
          {online && <Link href="/profesor/teme" className="text-mov">Rezultate →</Link>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">🕹️ Jocuri arcade (clasele I–V)</h1>
        <p className="text-sm text-gray-600">Baloanele, Cursa cu porți și Racheta, pe exercițiile clasei alese. {PUNCTE_INTREBARE} de puncte pe întrebare, 3 inimioare care scad punctajul (jocul nu se oprește), rezolvarea după a doua greșeală.</p>

        <Sectiune titlu="1. Clasa">
          <div className="grid grid-cols-5 gap-1.5">
            {NUME_CLASA_SCURT.map((n, i) => <button key={n} type="button" onClick={() => set({ clasa: (i + 1) as Clasa })} className={btn(cfg.clasa === i + 1)} aria-pressed={cfg.clasa === i + 1}>{["I", "II", "III", "IV", "V"][i]}</button>)}
          </div>
        </Sectiune>
        <Sectiune titlu="2. Jocul">
          <div className="grid gap-2">
            {JOCURI_ARCADE_IDS.map((j) => (
              <button key={j} type="button" onClick={() => set({ joc: j })} aria-pressed={cfg.joc === j}
                className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left ${cfg.joc === j ? "border-mov bg-mov text-white" : "border-mov/15 hover:bg-mov-deschis"}`}>
                <span className="text-2xl" aria-hidden>{JOCURI_ARCADE[j].icon}</span>
                <span><span className="block font-bold">{JOCURI_ARCADE[j].nume}</span><span className={`block text-xs ${cfg.joc === j ? "text-white/90" : "text-gray-600"}`}>{JOCURI_ARCADE[j].descriere}</span></span>
              </button>
            ))}
          </div>
        </Sectiune>
        <Sectiune titlu="3. Viteza, dificultatea, numărul">
          <div className="flex flex-wrap items-center gap-1.5 text-sm">Viteza:
            {([1, 2, 3] as VitezaArcade[]).map((v) => <button key={v} type="button" onClick={() => set({ viteza: v })} className={btn(cfg.viteza === v)} aria-pressed={cfg.viteza === v}>{NUME_VITEZA[v]}</button>)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">Exerciții:
            {(["usor", "mediu", "greu"] as DificultateArcade[]).map((d) => <button key={d} type="button" onClick={() => set({ dif: d })} className={btn(cfg.dif === d)} aria-pressed={cfg.dif === d}>{NUME_DIFICULTATE[d]}</button>)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">Întrebări:
            {[5, 10, 15, 20].map((n) => <button key={n} type="button" onClick={() => set({ n })} className={`${btn(cfg.n === n)} w-12`} aria-pressed={cfg.n === n}>{n}</button>)}
          </div>
          <p className="mt-2 text-xs text-gray-500">Viteza schimbă doar cât de repede se mișcă obiectele. Dificultatea alege exercițiile (la clasele III–V: Nivel 1, amestecat sau Nivel 2).</p>
        </Sectiune>
        <Sectiune titlu="4. Verifică">
          <button type="button" onClick={() => set({ seed: seedNou() })} className="w-full rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Alte întrebări</button>
          <a href={`/elev/arcade/joc?j=${cfg.joc}&clasa=${cfg.clasa}&v=${cfg.viteza}&n=${cfg.n}&d=${cfg.dif}&seed=${cfg.seed}&preview=1`} target="_blank"
            className="mt-2 block rounded-xl border-2 border-dashed border-mov px-3 py-2 text-center font-semibold text-mov hover:bg-mov-deschis">▶ Previzualizează jocul ca elev</a>
        </Sectiune>
        <Sectiune titlu="5. Trimite ca temă">
          {online
            ? <PanouTema c={c} titluImplicit={`${info.nume} – clasa ${NUME_CLASA_SCURT[cfg.clasa - 1]}`} grupe={grupe} dezactivat={!intrebari.length} actiune={creeazaTemaArcade} etichetaTrimite="🕹️ Trimite jocul elevilor" />
            : <p className="rounded-lg bg-galben-deschis p-3 text-sm">Temele funcționează când aplicația are conturi (baza de date conectată). Previzualizarea merge oricum.</p>}
          <p className="mt-2 text-xs text-gray-500">Cu „alte exerciții pentru fiecare elev”, fiecare primește alte întrebări de același fel. La „Mai joc o dată”, întrebările se schimbă (la test, se joacă o singură dată).</p>
        </Sectiune>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow" style={{ borderTop: `8px solid ${info.culoare}` }}>
            <span className="text-5xl" aria-hidden>{info.icon}</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold" style={{ color: info.culoare }}>{info.nume} · clasa {NUME_CLASA_SCURT[cfg.clasa - 1]}</h2>
              <p className="text-sm text-gray-600">{NUME_VITEZA[cfg.viteza]} · exerciții {NUME_DIFICULTATE[cfg.dif].toLowerCase()} · {intrebari.length} întrebări · cod {cfg.seed}</p>
            </div>
          </div>
          <h3 className="mt-5 font-bold text-mov">Întrebările (în joc, variantele se amestecă la fiecare rundă)</h3>
          <ol className="mt-2 grid gap-2">
            {gata && intrebari.map((q, i) => (
              <li key={q.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-baseline gap-2"><span className="font-bold text-mov">{i + 1}.</span><span className="font-semibold"><TextMate text={q.text} /></span></div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-sm">
                  {q.variante.map((v) => <span key={v} className={`rounded-lg px-2 py-0.5 ${v === q.corect ? "bg-green-100 font-bold text-green-800 ring-1 ring-green-400" : "bg-gray-100 text-gray-600"}`}><TextMate text={v} />{v === q.corect ? " ✓" : ""}</span>)}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
