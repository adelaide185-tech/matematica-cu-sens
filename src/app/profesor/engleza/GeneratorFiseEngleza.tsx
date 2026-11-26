"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FisaEngleza, type ModFisaEn } from "@/componente/FisaEngleza";
import { UNITATI, type Varsta } from "@/engleza/continut";
import { TIPURI_EN, TIPURI_FISA_EN, codificaFisaEn, configFisaEnImplicita, curataFisaEn, genereazaFisaEn, type ConfigFisaEn, type TipFisaEn } from "@/engleza/fise";
import { seedNou } from "@/motor/rng";
import { Camp, Sectiune } from "../calcul/GeneratorCalcul";

const CHEIE = "mcs-fise-engleza";

/** Generatorul de fișe English 4–6 ani: teme, tipuri de exerciții, vârstă, antet → PDF cu fișa educatoarei. */
export function GeneratorFiseEngleza() {
  const [cfg, setCfg] = useState<ConfigFisaEn>(() => configFisaEnImplicita(1));
  const [gata, setGata] = useState(false);
  const [vedere, setVedere] = useState<ModFisaEn>("fisa");
  useEffect(() => {
    try {
      const s = localStorage.getItem(CHEIE);
      setCfg(s ? { ...curataFisaEn(JSON.parse(s)), seed: seedNou(), inlocuiri: {} } : (c) => ({ ...c, seed: seedNou() }));
    } catch { setCfg((c) => ({ ...c, seed: seedNou() })); }
    setGata(true);
  }, []);
  useEffect(() => { if (gata) try { localStorage.setItem(CHEIE, JSON.stringify(cfg)); } catch {} }, [cfg, gata]);
  const set = (p: Partial<ConfigFisaEn>) => setCfg((x) => ({ ...x, ...p, inlocuiri: p.antet || p.color !== undefined ? x.inlocuiri : {} }));
  const sectiuni = useMemo(() => genereazaFisaEn(cfg), [cfg]);
  const c = useMemo(() => codificaFisaEn(cfg), [cfg]);
  const comuta = <T,>(lista: T[], x: T, toate: T[]) => { const l = lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]; return l.length ? toate.filter((y) => l.includes(y)) : lista; };
  const regenereaza = (id: string) => setCfg((x) => ({ ...x, inlocuiri: { ...x.inlocuiri, [id]: (x.inlocuiri[id] ?? 0) + 1 } }));
  const btn = (activ: boolean) => `rounded-xl px-3 py-2 font-bold ${activ ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[440px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link href="/profesor" className="text-mov">← Panoul profesorului</Link>
          <Link href="/engleza" className="text-mov">Jocurile copiilor →</Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">🇬🇧 Fișe English · 4–6 ani</h1>
        <p className="text-sm text-gray-600">Fișe cu imagini, fără citit pentru copii. Educatoarea citește cerințele din „Fișa educatoarei”, care conține și răspunsurile.</p>

        <Sectiune titlu="1. Vârsta copiilor">
          <div className="grid grid-cols-3 gap-2">
            {([4, 5, 6] as Varsta[]).map((v) => <button key={v} type="button" onClick={() => set({ varsta: v })} className={btn(cfg.varsta === v)} aria-pressed={cfg.varsta === v}>{v} ani</button>)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Vârsta schimbă câte exerciții și câte imagini sunt pe rând (4 ani: puține și mari).</p>
        </Sectiune>

        <Sectiune titlu="2. Temele (cuvintele)">
          <div className="grid grid-cols-2 gap-1.5">
            {UNITATI.map((u) => {
              const ales = cfg.unitati.includes(u.id);
              return (
                <label key={u.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-2 text-sm ${ales ? "border-mov bg-mov-deschis/50" : "border-mov/10"}`}>
                  <input type="checkbox" className="h-4 w-4 accent-mov" checked={ales} onChange={() => set({ unitati: comuta(cfg.unitati, u.id, UNITATI.map((x) => x.id)) })} />
                  <span aria-hidden>{u.icon}</span><span><b className="text-mov-inchis">{u.titlu}</b> <span className="text-gray-500">{u.titluRo}</span></span>
                </label>
              );
            })}
          </div>
        </Sectiune>

        <Sectiune titlu="3. Exercițiile de pe fișă">
          <div className="grid gap-1.5">
            {TIPURI_EN.map((t) => {
              const ales = cfg.tipuri.includes(t), info = TIPURI_FISA_EN[t];
              const potrivit = info.varsteRecomandate.includes(cfg.varsta);
              return (
                <label key={t} className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-2 text-sm ${ales ? "border-mov bg-mov-deschis/50" : "border-mov/10"}`}>
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-mov" checked={ales} onChange={() => set({ tipuri: comuta(cfg.tipuri, t as TipFisaEn, TIPURI_EN) })} />
                  <span className="text-xl" aria-hidden>{info.icon}</span>
                  <span><b className="text-mov-inchis">{info.en}</b> <span className="text-gray-500">{info.ro}</span><span className="block text-xs text-gray-600">{info.descriere}</span>
                    {!potrivit && <span className="block text-xs font-semibold text-portocaliu">recomandat pentru {info.varsteRecomandate.join(", ")} ani</span>}</span>
                </label>
              );
            })}
          </div>
        </Sectiune>

        <Sectiune titlu="4. Antet și tipar">
          <Camp eticheta="Titlu" valoare={cfg.antet.titlu} onChange={(v) => set({ antet: { ...cfg.antet, titlu: v } })} />
          <Camp eticheta="Grădinița / grupa" valoare={cfg.antet.gradinita} onChange={(v) => set({ antet: { ...cfg.antet, gradinita: v } })} />
          <div className="grid grid-cols-2 gap-2">
            <Camp eticheta="Educatoare" valoare={cfg.antet.educatoare} onChange={(v) => set({ antet: { ...cfg.antet, educatoare: v } })} />
            <Camp eticheta="Data" sugestie="liber = linie" valoare={cfg.antet.data} onChange={(v) => set({ antet: { ...cfg.antet, data: v } })} />
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-mov" checked={cfg.color} onChange={(e) => set({ color: e.target.checked })} /> Printez color (altfel alb-negru; la „Colours” culorile apar scrise)</label>
        </Sectiune>

        <Sectiune titlu="5. Descarcă / printează">
          <button type="button" onClick={() => set({ seed: seedNou() })} className="w-full rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Alte exerciții</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={`/api/pdf-engleza?c=${c}&mod=fisa`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis">⬇️ Fișa copiilor (PDF)</a>
            <a href={`/api/pdf-engleza?c=${c}&mod=ambele`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov">⬇️ Fișa + fișa educatoarei</a>
            <a href={`/fisa/engleza?c=${c}&mod=fisa`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează fișa</a>
            <a href={`/fisa/engleza?c=${c}&mod=educatoare`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Fișa educatoarei</a>
          </div>
          <p className="mt-2 text-xs text-gray-500">Cod fișă: <b>{cfg.seed}</b>. ↻ pe un exercițiu îi schimbă imaginile.</p>
        </Sectiune>
      </aside>
      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2">
          {([["fisa", "Fișa copiilor"], ["educatoare", "Fișa educatoarei"]] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setVedere(v)} className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{t}</button>
          ))}
          <span className="ml-auto text-sm text-gray-600">{sectiuni.length} exerciții · {cfg.varsta} ani</span>
        </div>
        {gata && <FisaEngleza cfg={cfg} sectiuni={sectiuni} mod={vedere} onRegenereaza={vedere === "fisa" ? regenereaza : undefined} />}
      </main>
    </div>
  );
}
