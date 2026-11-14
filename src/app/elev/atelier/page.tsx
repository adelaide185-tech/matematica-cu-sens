"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Manipulativ } from "@/manipulative/Manipulativ";
import { BtnUnealta, Comutator } from "@/manipulative/comune";
import { codifica, decodifica, MANIPULATIVE, stareInitiala, type StareManip, type TipManip } from "@/manipulative/stare";

type Stari = Record<TipManip, StareManip>;
const toate = (): Stari => Object.fromEntries(MANIPULATIVE.map((m) => [m.tip, stareInitiala(m.tip)])) as Stari;

function NumarMic({ eticheta, valoare, onChange, min = 0, max = 10000 }: { eticheta: string; valoare: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const [text, setText] = useState(String(valoare));
  useEffect(() => setText(String(valoare)), [valoare]);
  return (
    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">
      {eticheta}
      <input inputMode="numeric" value={text} onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={() => { const n = Math.min(max, Math.max(min, Number(text) || min)); setText(String(n)); onChange(n); }}
        className="h-11 w-20 rounded-xl border-2 border-mov/20 px-2 text-center font-bold outline-none focus:border-mov" />
    </label>
  );
}

/** Setările fiecărui manipulativ (ce poate pregăti profesorul înainte de oră). */
function Setari({ s, set }: { s: StareManip; set: (s: StareManip) => void }) {
  switch (s.tip) {
    case "blocuri":
      return <Comutator eticheta="Doar zeci și unități" valoare={!!s.faraSute} onChange={(v) => set({ ...s, faraSute: v, v: v ? { ...s.v, sute: 0 } : s.v })} />;
    case "rekenrek":
      return (
        <div className="flex gap-2">
          <BtnUnealta activ={s.randuri === 1} onClick={() => set({ ...s, randuri: 1, v: { ...s.v, jos: 0 } })}>1 rând (0–10)</BtnUnealta>
          <BtnUnealta activ={(s.randuri ?? 2) === 2} onClick={() => set({ ...s, randuri: 2 })}>2 rânduri (0–20)</BtnUnealta>
        </div>
      );
    case "cadru":
      return (
        <div className="flex gap-2">
          <BtnUnealta activ={s.unSingurCadru} onClick={() => set({ ...s, unSingurCadru: true, v: [...s.v.slice(0, 10), ...Array(10).fill(0)] as typeof s.v })}>Un cadru (10)</BtnUnealta>
          <BtnUnealta activ={!s.unSingurCadru} onClick={() => set({ ...s, unSingurCadru: false })}>Cadru dublu (20)</BtnUnealta>
        </div>
      );
    case "axa": {
      const a = s.v;
      const nou = (x: Partial<typeof a>) => {
        const v = { ...a, ...x };
        if (v.sfarsit <= v.start) v.sfarsit = v.start + v.pas * 10;
        set({ ...s, v: { ...v, puncte: v.puncte.filter((p) => p >= v.start && p <= v.sfarsit), salturi: [] } });
      };
      return (
        <div className="flex flex-wrap items-center gap-2">
          <NumarMic eticheta="De la" valoare={a.start} onChange={(n) => nou({ start: n })} />
          <NumarMic eticheta="până la" valoare={a.sfarsit} onChange={(n) => nou({ sfarsit: n })} max={10000} />
          <NumarMic eticheta="din" valoare={a.pas} onChange={(n) => nou({ pas: Math.max(1, n) })} min={1} />
          <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">în
            <select value={a.fin} onChange={(e) => nou({ fin: Number(e.target.value) })} className="h-11 rounded-xl border-2 border-mov/20 px-2 font-bold">
              {[1, 2, 5, 10, 50, 100].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <Comutator eticheta="Ascunde numerele" valoare={!!a.faraEtichete} onChange={(v) => set({ ...s, v: { ...a, faraEtichete: v } })} />
          <BtnUnealta onClick={() => set({ ...s, v: { ...a, puncte: [], salturi: [] } })}>Șterge punctele</BtnUnealta>
        </div>
      );
    }
    case "tabla":
      return (
        <label className="flex items-center gap-1 text-sm font-semibold text-gray-700">Numerele
          <select value={s.v.start} onChange={(e) => set({ ...s, v: { start: Number(e.target.value), colorate: {}, ascunse: [] } })}
            className="h-11 rounded-xl border-2 border-mov/20 px-2 font-bold">
            {Array.from({ length: 10 }, (_, i) => i * 100 + 1).map((st) => <option key={st} value={st}>{st}–{st + 99}</option>)}
            <option value={0}>0–99</option>
          </select>
        </label>
      );
    case "bara":
      return null;
  }
}

/**
 * Atelierul: manipulativele, de folosit liber (ca „spațiul de lucru” din Brainingcamp).
 * Profesorul pregătește o situație și o trimite elevilor printr-un link care păstrează starea.
 */
export default function Atelier() {
  const [tip, setTip] = useState<TipManip>("blocuri");
  const [stari, setStari] = useState<Stari>(toate);
  const [arataNumar, setArataNumar] = useState(true);
  const [ascunde, setAscunde] = useState(false);
  const [dezvaluie, setDezvaluie] = useState(false);
  const [copiat, setCopiat] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = q.get("s") ? decodifica(q.get("s")!) : null;
    const m = q.get("m") as TipManip | null;
    if (s) {
      setStari((x) => ({ ...x, [s.tip]: s }));
      setTip(s.tip);
      if (q.get("n") === "0") setArataNumar(false);
    } else if (m && MANIPULATIVE.some((x) => x.tip === m)) setTip(m);
  }, []);

  const stare = stari[tip];
  const set = (s: StareManip) => setStari((x) => ({ ...x, [s.tip]: s }));
  const info = MANIPULATIVE.find((m) => m.tip === tip)!;

  const copiazaLink = async () => {
    const url = `${location.origin}/elev/atelier?s=${codifica(stare)}${arataNumar ? "" : "&n=0"}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copiază linkul:", url);
    }
    setCopiat(true);
    setTimeout(() => setCopiat(false), 2500);
  };

  const ecranMare = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-galben-deschis to-mov-deschis pb-12">
      <header className="flex flex-wrap items-center justify-between gap-3 p-4">
        <Link href="/elev" className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">← Înapoi</Link>
        <h1 className="text-2xl font-bold text-mov sm:text-3xl">🧰 Atelierul cu materiale</h1>
        <Link href="/elev/lectii" className="rounded-xl bg-mov px-3 py-2 font-bold text-white shadow">Lecții ghidate →</Link>
      </header>

      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2" aria-label="Alege materialul">
        {MANIPULATIVE.map((m) => (
          <button key={m.tip} onClick={() => { setTip(m.tip); setAscunde(false); setDezvaluie(false); }} aria-current={tip === m.tip}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 font-bold shadow transition ${tip === m.tip ? "bg-mov text-white" : "bg-white text-mov hover:bg-mov-deschis"}`}>
            <span className="text-2xl" aria-hidden>{m.icon}</span>{m.nume}
          </button>
        ))}
      </nav>

      <section className="mx-auto mt-3 max-w-6xl px-4">
        <div className="rounded-3xl bg-white/70 p-4 shadow-lg sm:p-6">
          <p className="mb-3 text-center text-gray-700">{info.descriere}</p>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <Setari s={stare} set={set} />
            {(tip === "blocuri" || tip === "rekenrek" || tip === "cadru") && <Comutator eticheta="Arată numărul" valoare={arataNumar} onChange={setArataNumar} />}
            {tip === "tabla" && (
              <>
                <Comutator eticheta="Acoperă numere" valoare={ascunde} onChange={setAscunde} />
                {stare.tip === "tabla" && stare.v.ascunse.length > 0 && <Comutator eticheta="Arată ce e sub ?" valoare={dezvaluie} onChange={setDezvaluie} />}
              </>
            )}
          </div>
          <Manipulativ stare={stare} onChange={set} arataNumar={arataNumar} editor modAscunde={ascunde} dezvaluie={dezvaluie} />
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <BtnUnealta onClick={() => set(stareInitiala(tip))}>↺ Începe din nou</BtnUnealta>
          <BtnUnealta onClick={copiazaLink}>{copiat ? "✓ Link copiat!" : "🔗 Copiază linkul pentru elevi"}</BtnUnealta>
          <BtnUnealta onClick={ecranMare}>⛶ Ecran mare (tablă)</BtnUnealta>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">Linkul păstrează exact ce vezi acum: elevii pornesc de la aceeași situație.</p>
      </section>
    </main>
  );
}
