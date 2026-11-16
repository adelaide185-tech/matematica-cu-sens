"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CURRICULUM, NUME_CLASA } from "@/curriculum";
import { FisaPrint } from "@/componente/FisaPrint";
import { construiesteFisa, query, type ParametriFisa } from "@/lib/parametri";
import { ITEMI_IMPLICITI, NR_MAX_FISA } from "@/motor/fisa";
import { NIVELURI, type Clasa, type Nivel } from "@/motor/tipuri";
import { seedNou } from "@/motor/rng";

const CHEIE_ANTET = "mcs-antet";

export default function PanouProfesor() {
  const [p, setP] = useState<ParametriFisa>(() => ({
    clasa: 2, lectie: CURRICULUM[2][1].lectii[0].id, nivel: "consolidare", nr: ITEMI_IMPLICITI.consolidare,
    seed: 1, scoala: "", profesor: "", data: "", bw: false,
  }));
  const [vedere, setVedere] = useState<"elev" | "rezolvari">("elev");

  // seed aleator + antet salvat (doar în browser)
  useEffect(() => {
    let antet = {};
    try {
      antet = JSON.parse(localStorage.getItem(CHEIE_ANTET) ?? "{}");
    } catch {}
    setP((x) => ({ ...x, ...antet, seed: seedNou(), data: new Date().toLocaleDateString("ro-RO") }));
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(CHEIE_ANTET, JSON.stringify({ scoala: p.scoala, profesor: p.profesor }));
    } catch {}
  }, [p.scoala, p.profesor]);

  const { fisa, titlu } = useMemo(() => construiesteFisa(p), [p]);
  const set = <K extends keyof ParametriFisa>(k: K, v: ParametriFisa[K]) => setP((x) => ({ ...x, [k]: v }));

  const alegeClasa = (c: Clasa) => {
    const prima = CURRICULUM[c].flatMap((x) => x.lectii).find((l) => l.generatoare.length);
    setP((x) => ({ ...x, clasa: c, lectie: prima?.id ?? "", seed: seedNou() }));
  };
  const alegeNivel = (n: Nivel) => setP((x) => ({ ...x, nivel: n, nr: ITEMI_IMPLICITI[n], seed: seedNou() }));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[400px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="text-sm font-semibold text-mov">← Acasă</Link>
          <Link href="/profesor/lectii" className="rounded-lg bg-mov-deschis px-2.5 py-1 text-sm font-bold text-mov hover:bg-mov/20">🧱 Lecții cu materiale</Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">Generator de fișe</h1>
        <Link href="/profesor/calcul" className="mt-3 flex items-center gap-3 rounded-2xl bg-galben-deschis p-3 text-sm hover:brightness-95">
          <span className="text-2xl" aria-hidden>🧮</span>
          <span><b className="text-mov">Generator de calcul</b> — 5–200 de exerciții, PDF cu barem, Word, teme online</span>
        </Link>
        <Link href="/profesor/clasa2" className={`mt-2 flex items-center gap-3 rounded-2xl p-3 text-sm hover:brightness-95 ${p.clasa === 2 ? "bg-mov text-white" : "bg-mov-deschis"}`}>
          <span className="text-2xl" aria-hidden>🎮</span>
          <span><b className={p.clasa === 2 ? "" : "text-mov"}>Clasa a II-a: jocuri și fișe</b> — noțiuni la alegere, 3 niveluri, 9 mini-jocuri, fișă PDF cu barem</span>
        </Link>
        <Link href="/profesor/clasa3" className={`mt-2 flex items-center gap-3 rounded-2xl p-3 text-sm hover:brightness-95 ${p.clasa === 3 ? "bg-mov text-white" : "bg-mov-deschis"}`}>
          <span className="text-2xl" aria-hidden>🎮</span>
          <span><b className={p.clasa === 3 ? "" : "text-mov"}>Clasa a III-a: teme și jocuri</b> — capitole la alegere, 5 mini-jocuri online, fișă PDF cu barem</span>
        </Link>
        <Link href="/profesor/clasa1" className={`mt-2 flex items-center gap-3 rounded-2xl p-3 text-sm hover:brightness-95 ${p.clasa === 1 ? "bg-mov text-white ring-4 ring-galben" : "bg-mov-deschis"}`}>
          <span className="text-2xl" aria-hidden>🚀</span>
          <span><b className={p.clasa === 1 ? "text-white" : "text-mov"}>Clasa I · jocuri și fișe pe capitole</b> — 5 mini-jocuri, 10–100 de exerciții, PDF cu barem, atribuire online</span>
        </Link>

        <Sectiune titlu="1. Clasa">
          <div className="grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as Clasa[]).map((c) => (
              <button key={c} onClick={() => alegeClasa(c)}
                className={`rounded-xl py-2 text-lg font-bold ${p.clasa === c ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`}>
                {["I", "II", "III", "IV", "V"][c - 1]}
              </button>
            ))}
          </div>
        </Sectiune>

        <Sectiune titlu="2. Unitatea și lecția">
          <select value={p.lectie} onChange={(e) => setP((x) => ({ ...x, lectie: e.target.value, seed: seedNou() }))}
            className="w-full rounded-xl border-2 border-mov/20 bg-white p-2.5 text-base">
            {CURRICULUM[p.clasa].map((cap) => (
              <optgroup key={cap.id} label={cap.titlu}>
                {cap.lectii.map((l) => (
                  <option key={l.id} value={l.id} disabled={!l.generatoare.length}>
                    {l.titlu}{l.generatoare.length ? "" : " (în curând)"}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {!CURRICULUM[p.clasa].some((c) => c.lectii.some((l) => l.generatoare.length)) && (
            <p className="mt-2 rounded-lg bg-galben-deschis p-2 text-sm">Exercițiile pentru {NUME_CLASA[p.clasa]} sunt în lucru.</p>
          )}
        </Sectiune>

        <Sectiune titlu="3. Nivelul">
          <div className="grid grid-cols-2 gap-2">
            {NIVELURI.map((n) => (
              <button key={n.id} onClick={() => alegeNivel(n.id)}
                className="rounded-xl border-2 p-2.5 text-left transition"
                style={{ borderColor: n.culoare, background: p.nivel === n.id ? n.culoare : "#fff", color: p.nivel === n.id ? "#fff" : n.culoare }}>
                <div className="font-bold">{n.nume}</div>
                <div className={`text-xs ${p.nivel === n.id ? "text-white/90" : "text-gray-600"}`}>{n.descriere}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-sm">Număr de exerciții: <b>{p.nr}</b></div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {[5, 10, 15, 20, 30, 50, 100].map((n) => (
              <button key={n} type="button" onClick={() => set("nr", n)}
                className={`rounded-lg py-1.5 text-sm font-bold ${p.nr === n ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`}>{n}</button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            Alt număr (1–{NR_MAX_FISA}):
            <input type="number" min={1} max={NR_MAX_FISA} value={p.nr}
              onChange={(e) => { const n = Number(e.target.value); if (n >= 1 && n <= NR_MAX_FISA) set("nr", n); }}
              className="w-20 rounded-lg border-2 border-mov/20 p-1.5" />
          </label>
          <p className="mt-1 text-xs text-gray-500">Exercițiile de același tip se grupează pe subpuncte (a, b, c…); pentru calcul rapid cu până la 200 de exerciții folosește Generatorul de calcul.</p>
        </Sectiune>

        <Sectiune titlu="4. Antet">
          <input placeholder="Școala" value={p.scoala} onChange={(e) => set("scoala", e.target.value)} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <input placeholder="Profesor" value={p.profesor} onChange={(e) => set("profesor", e.target.value)} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <input placeholder="Data" value={p.data} onChange={(e) => set("data", e.target.value)} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.bw} onChange={(e) => set("bw", e.target.checked)} className="accent-mov" /> Alb-negru (economie la imprimare)</label>
        </Sectiune>

        <div className="mt-5 grid gap-2">
          <button onClick={() => set("seed", seedNou())} className="rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Regenerează (numere noi)</button>
          <div className="grid grid-cols-2 gap-2">
            <a href={`/api/pdf?${query(p)}`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis">⬇️ PDF elev</a>
            <a href={`/api/pdf?${query(p, { rezolvari: "1" })}`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov">⬇️ PDF rezolvări</a>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <a href={`/fisa?${query(p)}`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center font-semibold text-mov">🖨️ Printează fișa</a>
            <a href={`/fisa?${query(p, { rezolvari: "1" })}`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center font-semibold text-mov">🖨️ Printează barem</a>
          </div>
          <p className="text-xs text-gray-500">Codul fișei: <b>{p.seed}</b>. Același cod produce exact aceleași numere pe fișa elevului și pe fișa cu rezolvări.</p>
        </div>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] gap-2">
          {(["elev", "rezolvari"] as const).map((v) => (
            <button key={v} onClick={() => setVedere(v)}
              className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>
              {v === "elev" ? "Fișa elevului" : "Rezolvări și barem"}
            </button>
          ))}
        </div>
        {fisa.itemi.length ? (
          <FisaPrint fisa={fisa} antet={{ titlu, scoala: p.scoala, profesor: p.profesor, data: p.data }} rezolvari={vedere === "rezolvari"} albNegru={p.bw} />
        ) : (
          <p className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow">Alege o lecție care are exerciții disponibile.</p>
        )}
      </main>
    </div>
  );
}

function Sectiune({ titlu, children }: { titlu: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">{titlu}</h2>
      {children}
    </section>
  );
}
