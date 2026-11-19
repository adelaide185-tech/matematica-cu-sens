"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Rng } from "@/motor/rng";
import type { IntrebareArcade } from "@/motor/arcade/intrebari";
import { DURATA_RUNDA, GRESELI_MAX, NUME_VITEZA, PUNCTE_INTREBARE, puncteIntrebare, rezultatArcade, type VitezaArcade } from "@/motor/arcade/scor";
import { useCelebrare } from "@/jocuri/miscare";
import { sunetBland } from "@/antrenament/stare-client";
import { TextMate } from "@/jocuri/c3/Vizuale";

export type JocArcadeId = "baloane" | "cursa" | "racheta";
export const JOCURI_ARCADE: Record<JocArcadeId, { nume: string; icon: string; descriere: string; culoare: string; cum: string }> = {
  baloane: { nume: "Baloanele", icon: "🎈", culoare: "#e0483e", descriere: "Baloanele urcă spre cer. Spară balonul cu răspunsul corect înainte să zboare!", cum: "Atinge balonul corect (sau tastele 1–4)." },
  cursa: { nume: "Cursa cu porți", icon: "🏎️", culoare: "#2f6fd1", descriere: "Condu mașina pe banda cu răspunsul corect și treci prin poartă.", cum: "Atinge banda sau folosește săgețile ← →. „Accelerează” trece imediat prin poartă." },
  racheta: { nume: "Racheta", icon: "🚀", culoare: "#6a59a7", descriere: "Meteoriții coboară spre rachetă. Lovește-l pe cel cu răspunsul corect!", cum: "Atinge meteoritul corect (sau tastele 1–4)." },
};

type Faza = "joc" | "corect" | "gresit" | "arata";
export interface FinalArcade { greseli: number[]; rezultat: ReturnType<typeof rezultatArcade> }

function vorbeste(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/□/g, "cât").replace(/○/g, "ce semn").replace(/(\d+)\/(\d+)/g, "$1 supra $2").replace(/×|·/g, " ori ").replace(/ : /g, " împărțit la ").replace(/−/g, " minus "));
    u.lang = "ro-RO";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

/**
 * Motorul comun al jocurilor arcade: 30 de puncte pe întrebare, 3 inimioare care scad punctajul
 * (nu opresc jocul), rezolvarea după a 2-a greșeală, 3 viteze, pauză, mouse + atingere + tastatură.
 */
export function JocArcade({ joc, viteza, intrebari, seed, inapoi, titlu, onFinal, onReia }: {
  joc: JocArcadeId; viteza: VitezaArcade; intrebari: IntrebareArcade[]; seed: number; inapoi: string; titlu?: string;
  onFinal?: (f: FinalArcade) => void; onReia?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [runda, setRunda] = useState(0);
  const [greseli, setGreseli] = useState(0);
  const [rezultate, setRezultate] = useState<number[]>([]);
  const [faza, setFaza] = useState<Faza>("joc");
  const [ales, setAles] = useState<string | null>(null);
  const [pauza, setPauza] = useState(false);
  const [final, setFinal] = useState<FinalArcade | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const q = intrebari[idx];
  const durata = DURATA_RUNDA[joc][viteza];
  // la fiecare rundă (și după o greșeală) variantele se amestecă din nou
  const variante = useMemo(() => (q ? new Rng(seed * 31 + idx * 7 + runda * 101 + 1).shuffle(q.variante) : []), [q, seed, idx, runda]);
  const partial = useMemo(() => rezultatArcade(rezultate), [rezultate]);
  const serie = useMemo(() => { let s = 0; for (let i = rezultate.length - 1; i >= 0 && rezultate[i] === 0; i--) s++; return s; }, [rezultate]);

  useEffect(() => () => clearTimeout(timer.current), []);
  // pauză automată când elevul iese din tab
  useEffect(() => {
    const f = () => { if (document.hidden) setPauza(true); };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);

  const urmatoarea = useCallback((g: number) => {
    const r = [...rezultate, g];
    setRezultate(r);
    setGreseli(0); setAles(null); setRunda(0); setFaza("joc");
    if (idx + 1 >= intrebari.length) {
      const f = { greseli: r, rezultat: rezultatArcade(r) };
      setFinal(f);
      onFinal?.(f);
    } else setIdx(idx + 1);
  }, [rezultate, idx, intrebari.length, onFinal]);

  /** v = null: obiectele au scăpat (timpul a expirat) */
  const raspunde = useCallback((v: string | null) => {
    if (!q || faza !== "joc" || pauza) return;
    setAles(v);
    if (v === q.corect) {
      setFaza("corect");
      sunetBland();
      timer.current = setTimeout(() => urmatoarea(greseli), 750);
      return;
    }
    const g = greseli + 1;
    setGreseli(g);
    if (g >= GRESELI_MAX) { setFaza("arata"); return; }
    setFaza("gresit");
    timer.current = setTimeout(() => { setAles(null); setRunda((x) => x + 1); setFaza("joc"); }, 1100);
  }, [q, faza, pauza, greseli, urmatoarea]);

  // tastatura: 1–4 alege varianta, P = pauză, Enter = mai departe după rezolvare
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (final) return;
      if (faza === "arata" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); urmatoarea(GRESELI_MAX); return; }
      if (e.key === "p" || e.key === "P" || e.key === "Escape") { setPauza((x) => !x); return; }
      if (joc !== "cursa" && /^[1-4]$/.test(e.key)) { const v = variante[Number(e.key) - 1]; if (v !== undefined) raspunde(v); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [faza, final, joc, variante, raspunde, urmatoarea]);

  if (final) return <FinalArcadeEcran joc={joc} f={final} intrebari={intrebari} inapoi={inapoi} onReia={onReia} />;
  if (!q) return <p className="p-8 text-center text-lg">Nu am putut pregăti întrebările.</p>;
  const info = JOCURI_ARCADE[joc];
  const inimi = 3 - greseli - (faza === "arata" ? 1 : 0);
  const miscare = faza === "joc" && !pauza;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-2 pb-4 sm:px-4">
      <header className="flex items-center gap-2 pt-3 sm:gap-3">
        <Link href={inapoi} className="rounded-xl px-2 py-1 text-2xl text-mov" aria-label="Ieși din joc">✕</Link>
        <span className="text-2xl" aria-hidden>{info.icon}</span>
        <h1 className="flex-1 truncate text-lg font-bold text-mov sm:text-xl">{titlu ?? info.nume} <span className="ml-1 rounded-full bg-mov-deschis px-2 py-0.5 text-xs text-mov">{NUME_VITEZA[viteza]}</span></h1>
        <span className="text-xl" aria-label={`${Math.max(0, inimi)} inimioare la această întrebare`}>{[0, 1, 2].map((i) => <span key={i} className={i < inimi ? "" : "opacity-20 grayscale"}>❤️</span>)}</span>
        <span className="rounded-xl bg-white px-3 py-1 font-bold text-mov shadow-sm" aria-label="Punctaj">⭐ {partial.scor}</span>
        {serie >= 2 && <span className="hidden rounded-xl bg-galben px-2 py-1 font-extrabold text-mov-inchis sm:inline" aria-label={`Serie de ${serie}`}>🔥×{serie}</span>}
        <button type="button" onClick={() => setPauza((x) => !x)} className="rounded-xl bg-white px-3 py-1 text-xl shadow-sm" aria-label={pauza ? "Continuă" : "Pauză"}>{pauza ? "▶" : "⏸"}</button>
      </header>
      <div className="mt-2 flex gap-0.5" aria-label={`Întrebarea ${idx + 1} din ${intrebari.length}`}>
        {intrebari.map((x, i) => <span key={x.id} className={`h-2.5 flex-1 rounded-full ${i < rezultate.length ? (rezultate[i] === 0 ? "bg-green-500" : rezultate[i] < GRESELI_MAX ? "bg-galben" : "bg-red-400") : i === idx ? "bg-mov" : "bg-mov/15"}`} />)}
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 rounded-3xl bg-white px-4 py-3 text-center shadow-md">
        <p className={`font-extrabold text-mov-inchis ${q.text.length > 60 ? "text-lg sm:text-xl" : q.text.length > 25 ? "text-2xl" : "text-3xl sm:text-4xl"}`}><TextMate text={q.text} /></p>
        <button type="button" onClick={() => vorbeste(q.text)} className="shrink-0 rounded-full bg-mov-deschis px-2 py-1 text-lg" aria-label="Ascultă întrebarea">🔊</button>
      </div>

      <section className="relative mt-3 flex-1">
        {joc === "baloane" && <Baloane key={`${idx}-${runda}`} variante={variante} durata={durata} miscare={miscare} faza={faza} ales={ales} corect={q.corect} onAlege={raspunde} />}
        {joc === "cursa" && <Cursa key={`${idx}-${runda}`} variante={variante} durata={durata} miscare={miscare} faza={faza} ales={ales} corect={q.corect} onAlege={raspunde} />}
        {joc === "racheta" && <Racheta key={`${idx}-${runda}`} variante={variante} durata={durata} miscare={miscare} faza={faza} ales={ales} corect={q.corect} onAlege={raspunde} />}

        {pauza && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl bg-mov-inchis/70 text-white">
            <p className="text-3xl font-extrabold">Pauză</p>
            <button type="button" onClick={() => setPauza(false)} className="rounded-2xl bg-galben px-8 py-4 text-2xl font-extrabold text-mov-inchis shadow">▶ Continuă</button>
          </div>
        )}
        {faza === "corect" && <div className="pointer-events-none absolute inset-x-0 top-4 z-10 text-center"><span className="inline-block animate-[salt_0.5s] rounded-2xl bg-green-100 px-5 py-2 text-2xl font-extrabold text-green-800 shadow">✓ Corect! +{puncteIntrebare(greseli)}</span></div>}
        {faza === "gresit" && <div className="pointer-events-none absolute inset-x-0 top-4 z-10 text-center"><span className="inline-block rounded-2xl bg-red-100 px-5 py-2 text-xl font-extrabold text-red-800 shadow">{ales === null ? "Au scăpat! −1 ❤️ Mai încearcă." : "Nu e corect. −1 ❤️ Mai încearcă!"}</span></div>}
        {faza === "arata" && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-3">
            <div className="max-w-xl rounded-3xl bg-white p-5 text-center shadow-xl ring-4 ring-galben" role="status">
              <p className="text-lg font-bold text-red-700">{ales === null ? "Au scăpat din nou." : "Nici de data asta."} Hai să vedem împreună:</p>
              <p className="mt-2 text-2xl font-extrabold text-mov-inchis">Răspunsul corect: <span className="rounded-lg bg-green-100 px-2 text-green-800"><TextMate text={q.corect} /></span></p>
              <ol className="mt-3 list-decimal space-y-0.5 pl-6 text-left text-base text-gray-700">{q.rezolvare.slice(0, 5).map((p) => <li key={p}><TextMate text={p} /></li>)}</ol>
              <button type="button" onClick={() => urmatoarea(GRESELI_MAX)} className="mt-4 rounded-2xl bg-mov px-8 py-3 text-xl font-bold text-white shadow" autoFocus>Am înțeles → mai departe</button>
            </div>
          </div>
        )}
      </section>
      <p className="mt-2 text-center text-sm text-gray-500">{info.cum} · {PUNCTE_INTREBARE} de puncte pe întrebare, o greșeală costă o inimioară (10 puncte).</p>
    </main>
  );
}

interface PropsScena { variante: string[]; durata: number; miscare: boolean; faza: Faza; ales: string | null; corect: string; onAlege: (v: string | null) => void }

const stilVarianta = (v: string, p: PropsScena) =>
  p.faza !== "joc" && v === p.corect && (p.faza === "corect" || p.faza === "arata") ? "ring-4 ring-green-500 bg-green-100 text-green-900"
    : p.faza !== "joc" && v === p.ales ? "ring-4 ring-red-500 bg-red-100 text-red-900 animate-[scutura_0.3s]" : "";

/** Baloanele urcă de jos în sus; balonul atins se sparge. */
function Baloane(p: PropsScena) {
  const k = p.variante.length;
  const culori = ["#e0483e", "#2f6fd1", "#2e9e5b", "#e07a1f"];
  const intarzieri = [0, 0.06, 0.03, 0.09];
  return (
    <div className="arcade-cer relative h-[58vh] min-h-[22rem] overflow-hidden rounded-3xl" style={{ background: "linear-gradient(#8fd3ff, #e7f6ff)" }}>
      <span className="absolute left-[8%] top-[12%] text-5xl opacity-80" aria-hidden>☁️</span>
      <span className="absolute right-[10%] top-[30%] text-4xl opacity-70" aria-hidden>☁️</span>
      {p.variante.map((v, i) => {
        const ultim = intarzieri[i] === Math.max(...intarzieri.slice(0, k));
        return (
          <button key={v} type="button" onClick={() => p.onAlege(v)} aria-label={`Balonul ${i + 1}: ${v}`}
            onAnimationEnd={(e) => { if (ultim && e.animationName === "urcaBalon") p.onAlege(null); }}
            className="arcade-urca absolute flex flex-col items-center"
            style={{ left: `${((i + 0.5) / k) * 100}%`, animationDuration: `${p.durata}ms`, animationDelay: `${intarzieri[i] * p.durata}ms`, animationPlayState: p.miscare ? "running" : "paused" }}>
            <span className={`arcade-balon flex min-h-24 min-w-24 items-center justify-center rounded-[50%] px-3 text-2xl font-extrabold text-white shadow-lg sm:min-h-28 sm:min-w-28 sm:text-3xl ${stilVarianta(v, p)}`}
              style={{ background: stilVarianta(v, p) ? undefined : culori[i % 4] }}>
              <TextMate text={v} />
            </span>
            <span className="h-10 w-0.5 bg-gray-500" aria-hidden />
            <span className="absolute -left-2 -top-2 rounded-full bg-white px-1.5 text-xs font-bold text-gray-600 shadow" aria-hidden>{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Cursa: porțile coboară spre mașină; la sosire, contează banda pe care e mașina. */
function Cursa(p: PropsScena) {
  const k = p.variante.length;
  const [banda, setBanda] = useState(Math.floor((k - 1) / 2));
  const bandaRef = useRef(banda);
  bandaRef.current = banda;
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setBanda((b) => Math.max(0, b - 1));
      else if (e.key === "ArrowRight") setBanda((b) => Math.min(k - 1, b + 1));
      else if (/^[1-4]$/.test(e.key) && Number(e.key) <= k) setBanda(Number(e.key) - 1);
      else if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") { e.preventDefault(); p.onAlege(p.variante[bandaRef.current]); }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [k, p]);
  return (
    <div className="relative h-[58vh] min-h-[22rem] overflow-hidden rounded-3xl bg-[#4b4f58]">
      <div className={`arcade-sosea absolute inset-0 ${p.miscare ? "" : "[animation-play-state:paused]"}`} aria-hidden />
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${k}, 1fr)` }}>
        {p.variante.map((v, i) => (
          <button key={i} type="button" onPointerDown={() => setBanda(i)} className={`h-full border-x-2 border-dashed border-white/40 ${banda === i ? "bg-white/10" : ""}`} aria-label={`Banda ${i + 1}: ${v}`} />
        ))}
      </div>
      <div className="arcade-coboara pointer-events-none absolute inset-x-0 grid gap-2 px-2" onAnimationEnd={(e) => { if (e.animationName === "coboaraPoarta") p.onAlege(p.variante[bandaRef.current]); }}
        style={{ gridTemplateColumns: `repeat(${k}, 1fr)`, animationDuration: `${p.durata}ms`, animationPlayState: p.miscare ? "running" : "paused" }}>
        {p.variante.map((v) => (
          <div key={v} className={`flex min-h-16 items-center justify-center rounded-xl border-4 border-galben bg-white px-2 text-center text-xl font-extrabold text-mov-inchis shadow-lg sm:text-2xl ${stilVarianta(v, p)}`}>
            <TextMate text={v} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-3 text-5xl transition-[left] duration-200 sm:text-6xl" style={{ left: `calc(${((banda + 0.5) / k) * 100}% - 1.6rem)` }} aria-label={`Mașina este pe banda ${banda + 1}`}>🏎️</div>
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button type="button" onClick={() => setBanda((b) => Math.max(0, b - 1))} className="h-14 w-14 rounded-2xl bg-white/90 text-2xl font-bold shadow" aria-label="Mută la stânga">←</button>
        <button type="button" onClick={() => setBanda((b) => Math.min(k - 1, b + 1))} className="h-14 w-14 rounded-2xl bg-white/90 text-2xl font-bold shadow" aria-label="Mută la dreapta">→</button>
      </div>
      <button type="button" onClick={() => p.onAlege(p.variante[banda])} className="absolute bottom-2 left-2 h-14 rounded-2xl bg-galben px-4 text-lg font-extrabold text-mov-inchis shadow" aria-label="Accelerează prin poartă">⚡ Accelerează</button>
    </div>
  );
}

/** Racheta: meteoriții coboară; meteoritul atins e lovit de laser. */
function Racheta(p: PropsScena) {
  const k = p.variante.length;
  const [tinta, setTinta] = useState<number | null>(null);
  const trage = (i: number) => {
    if (p.faza !== "joc" || !p.miscare || tinta !== null) return;
    setTinta(i);
    setTimeout(() => p.onAlege(p.variante[i]), 260);
  };
  const x = (i: number) => ((i + 0.5) / k) * 100;
  return (
    <div className="relative h-[58vh] min-h-[22rem] overflow-hidden rounded-3xl" style={{ background: "radial-gradient(circle at 30% 20%, #3b2f7a, #120d2e 70%)" }}>
      {Array.from({ length: 28 }, (_, i) => <span key={i} className="absolute h-1 w-1 rounded-full bg-white/70" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }} aria-hidden />)}
      {p.variante.map((v, i) => (
        <button key={v} type="button" onClick={() => trage(i)} aria-label={`Meteoritul ${i + 1}: ${v}`}
          onAnimationEnd={(e) => { if (i === 0 && e.animationName === "coboaraMeteorit") p.onAlege(null); }}
          className="arcade-meteorit absolute -translate-x-1/2"
          style={{ left: `${x(i)}%`, animationDuration: `${p.durata}ms`, animationPlayState: p.miscare && tinta === null ? "running" : "paused" }}>
          <span className={`flex min-h-20 min-w-20 items-center justify-center rounded-[45%_55%_50%_50%] border-4 border-[#8a6a4a] bg-[#b98a5e] px-2 text-xl font-extrabold text-white shadow-[0_0_18px_#ffb46655] sm:min-h-24 sm:min-w-24 sm:text-2xl ${stilVarianta(v, p)} ${tinta === i ? "scale-110" : ""}`}>
            <TextMate text={v} />
          </span>
          <span className="absolute -left-1 -top-1 rounded-full bg-white px-1.5 text-xs font-bold text-gray-700" aria-hidden>{i + 1}</span>
        </button>
      ))}
      {tinta !== null && <span className="pointer-events-none absolute bottom-16 w-1.5 -translate-x-1/2 animate-[laser_0.26s_ease-out] bg-gradient-to-t from-cyan-300 to-white" style={{ left: `${x(tinta)}%`, top: "15%" }} aria-hidden />}
      <div className="pointer-events-none absolute bottom-2 -translate-x-1/2 text-5xl transition-[left] duration-200 sm:text-6xl" style={{ left: `${tinta === null ? 50 : x(tinta)}%` }} aria-hidden>🚀</div>
    </div>
  );
}

function FinalArcadeEcran({ joc, f, intrebari, inapoi, onReia }: { joc: JocArcadeId; f: FinalArcade; intrebari: IntrebareArcade[]; inapoi: string; onReia?: () => void }) {
  const r = f.rezultat;
  useCelebrare(r.stele >= 2, r.stele === 3 ? "mare" : "mica");
  const MED = { diamant: ["💎", "Diamant"], aur: ["🥇", "Aur"], argint: ["🥈", "Argint"], bronz: ["🥉", "Bronz"] } as const;
  const gresite = intrebari.filter((_, i) => f.greseli[i] > 0);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-center">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="text-7xl" aria-hidden>{r.medalie ? MED[r.medalie][0] : JOCURI_ARCADE[joc].icon}</div>
        <h1 className="mt-2 text-3xl font-extrabold text-mov">{r.medalie ? `Medalia de ${MED[r.medalie][1]}!` : "Bravo că ai terminat!"}</h1>
        <div className="mt-1 text-4xl">{[1, 2, 3].map((s) => <span key={s} className={s <= r.stele ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Punctaj", `${r.scor} / ${r.max}`], ["Din prima", `${r.dinPrima}/${intrebari.length}`], ["Rezolvate", `${r.rezolvate}/${intrebari.length}`], ["Cea mai lungă serie", `🔥 ${r.serieMax}`]].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-mov-deschis p-3"><dt className="text-sm text-gray-600">{a}</dt><dd className="text-2xl font-extrabold text-mov-inchis">{b}</dd></div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-gray-500">Medalii: 🥉 Bronz de la 50%, 🥈 Argint de la 70%, 🥇 Aur de la 90%, 💎 Diamant: toate întrebările din prima.</p>
        {gresite.length > 0 && (
          <div className="mt-4 text-left">
            <h2 className="font-bold text-mov">De exersat:</h2>
            <ul className="mt-1 grid gap-1">{gresite.slice(0, 8).map((q) => <li key={q.id} className="rounded-lg bg-red-50 px-3 py-1.5"><TextMate text={q.text} /> → <b><TextMate text={q.corect} /></b></li>)}</ul>
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {onReia && <button type="button" onClick={onReia} className="rounded-2xl bg-galben px-6 py-3 text-lg font-bold text-mov-inchis shadow">Mai joc o dată</button>}
          <Link href={inapoi} className="rounded-2xl bg-mov px-6 py-3 text-lg font-bold text-white shadow">Înapoi</Link>
        </div>
      </div>
    </main>
  );
}
