"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Tastatura } from "@/jocuri/componente";
import { useCelebrare } from "@/jocuri/miscare";
import { Fractie } from "@/componente/svg/Vizual";
import { MEDALII, cateBuneC3, puncteaza, verificaC3, type Medalie } from "@/motor/clasa3/generator";
import { mesajCateBune } from "@/motor/cateBune";
import { ScaraMedalii } from "@/componente/ScaraMedalii";
import { JOCURI_C3, SECUNDE_VITEZA, type ConfigC3, type ItemC3 as ItemC3Strict } from "@/motor/clasa3/tipuri";
import type { Desen } from "@/motor/clasa4/tipuri";
import { DesenC4 } from "@/jocuri/c4/DesenC4";
import { Rng } from "@/motor/rng";
import { FataC3, FiguraC3, TextMate } from "./Vizuale";

/** Itemul unui joc: de clasa a III-a sau a IV-a (care adaugă desene și rezolvări). */
export type ItemJoc = Omit<ItemC3Strict, "capitol" | "verificare"> & { capitol: string; desen?: Desen; rezolvare?: string[] };
type ItemC3 = ItemJoc;
/** Ce folosește jocul din configurație (clasa a III-a și a IV-a au aceleași câmpuri) */
export type CfgJoc = Pick<ConfigC3, "joc" | "seed" | "vieti" | "viteza">;

export interface RaspunsJoc { id: string; dat: string | null; corect: boolean; incercari: number; timpMs: number }
export interface FinalJoc { raspunsuri: RaspunsJoc[]; vietiRamase: number; terminat: boolean; incercare: number }

type Stare = { tip: "corect" } | { tip: "gresit"; mesaj: string; arata?: string } | null;

/** Timpul de lucru la Sprint pentru un item (problemele și împărțirile cu rest primesc mai mult). */
export function timpItem(cfg: CfgJoc, it: ItemC3, combo: number): number {
  const baza = SECUNDE_VITEZA[cfg.viteza] * 1000 * (it.capitol === "probleme" || it.desen || it.text.length > 40 ? 2.5 : it.raspuns.tip === "rest" ? 1.6 : 1);
  return Math.max(4000, baza * Math.pow(0.9, Math.floor(combo / 3)));
}

function vorbeste(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/□/g, "căsuța").replace(/(\d+)\/(\d+)/g, "$1 supra $2").replace(/×/g, " ori ").replace(/ : /g, " împărțit la ").replace(/−/g, " minus "));
    u.lang = "ro-RO";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

/**
 * Cele 5 jocuri de clasa a III-a, pe același motor: progres, vieți, combo, punctaj, medalie.
 * `onFinal` primește răspunsurile (tema le trimite pe server, unde se verifică din nou).
 */
export function JocC3({ cfg, itemi, titlu, inapoi, onFinal, onReia, incercare = 0, eticheta }: {
  cfg: CfgJoc; itemi: ItemC3[]; titlu?: string; inapoi: string;
  onFinal?: (f: FinalJoc) => Promise<string | void> | string | void;
  onReia?: () => void; incercare?: number; eticheta?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [vieti, setVieti] = useState<number>(cfg.vieti);
  const [rez, setRez] = useState<RaspunsJoc[]>([]);
  const [incercari, setIncercari] = useState(0);
  const [stare, setStare] = useState<Stare>(null);
  const [final, setFinal] = useState<{ terminat: boolean; mesaj?: string } | null>(null);
  const start = useRef(Date.now());
  const trimis = useRef(false);
  const joc = JOCURI_C3[cfg.joc];
  const total = itemi.length;
  const it = itemi[idx];

  const puncte = useMemo(() => puncteaza(rez, total, cfg.joc === "sprint" ? SECUNDE_VITEZA[cfg.viteza] * 1000 : undefined), [rez, total, cfg.joc, cfg.viteza]);
  const comboCurent = useMemo(() => { let c = 0; for (let i = rez.length - 1; i >= 0 && rez[i].corect && rez[i].incercari <= 1; i--) c++; return c; }, [rez]);

  const termina = useCallback(async (r: RaspunsJoc[], terminat: boolean, v: number) => {
    if (trimis.current) return;
    trimis.current = true;
    setFinal({ terminat });
    const m = await onFinal?.({ raspunsuri: r, vietiRamase: v, terminat, incercare });
    if (m) setFinal({ terminat, mesaj: m });
  }, [onFinal, incercare]);

  const urmator = useCallback((r: RaspunsJoc[], v: number) => {
    setStare(null);
    setIncercari(0);
    start.current = Date.now();
    if (cfg.vieti && v <= 0) return termina(r, false, v);
    if (idx + 1 >= total) return termina(r, true, v);
    setIdx((i) => i + 1);
  }, [cfg.vieti, idx, total, termina]);

  /** răspunsul la itemul curent (dat = null: timp expirat) */
  const raspunde = useCallback((dat: string | null) => {
    // după „Mai încearcă”, elevul poate răspunde direct (fără să apese „Încerc din nou”)
    if (!it || final || (stare && (stare.tip === "corect" || stare.arata))) return;
    const ok = dat !== null && verificaC3(it, dat);
    const timpMs = Date.now() - start.current;
    if (ok) {
      const r = [...rez, { id: it.id, dat, corect: true, incercari: incercari + 1, timpMs }];
      setRez(r);
      setStare({ tip: "corect" });
      setTimeout(() => urmator(r, vieti), 650);
      return;
    }
    const v = cfg.vieti ? vieti - 1 : vieti;
    if (cfg.vieti) setVieti(v);
    const ultima = cfg.joc === "sprint" || incercari >= 1 || (cfg.vieti > 0 && v <= 0);
    if (ultima) {
      const r = [...rez, { id: it.id, dat, corect: false, incercari: incercari + 1, timpMs }];
      setRez(r);
      setStare({ tip: "gresit", mesaj: dat === null ? "Timpul a expirat!" : "Nu e corect.", arata: it.afis });
      setTimeout(() => urmator(r, v), it.rezolvare?.length && cfg.joc !== "sprint" ? 5000 : 1900);
    } else {
      setIncercari(1);
      const bune = dat === null ? null : mesajCateBune(cateBuneC3(it, dat), "căsuțe");
      setStare({ tip: "gresit", mesaj: `Mai încearcă! ${bune ? bune + " " : ""}💡 ${it.indiciu}` });
    }
  }, [it, stare, final, rez, incercari, vieti, cfg.vieti, cfg.joc, urmator]);

  const reincearca = () => setStare(null);

  if (final) return <Final cfg={cfg} puncte={puncte} rez={rez} itemi={itemi} terminat={final.terminat} mesaj={final.mesaj} inapoi={inapoi} onReia={onReia} />;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-3 pb-6 sm:px-6">
      <header className="sticky top-0 z-10 -mx-3 bg-[#fdf8ef]/95 px-3 pt-3 pb-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href={inapoi} className="rounded-xl px-2 py-1 text-2xl text-mov" aria-label="Ieși din joc">✕</Link>
          <span className="text-2xl" aria-hidden>{joc.icon}</span>
          <h1 className="flex-1 truncate text-lg font-bold text-mov sm:text-xl">{titlu ?? joc.nume}{eticheta && <span className="ml-2 rounded-full bg-galben px-2 py-0.5 text-xs text-mov-inchis">{eticheta}</span>}</h1>
          {cfg.vieti > 0 && <span className="text-xl" aria-label={`${vieti} vieți`}>{Array.from({ length: cfg.vieti }, (_, i) => <span key={i} className={i < vieti ? "" : "opacity-20 grayscale"}>❤️</span>)}</span>}
          <span className="rounded-xl bg-white px-3 py-1 font-bold text-mov shadow-sm" aria-label="Punctaj">⭐ {puncte.scor}</span>
          {comboCurent >= 2 && <span className="rounded-xl bg-galben px-2 py-1 font-extrabold text-mov-inchis" aria-label={`Combo ${comboCurent}`}>🔥×{comboCurent}</span>}
        </div>
        <div className="mt-2 flex gap-0.5" aria-label={`Exercițiul ${Math.min(idx + 1, total)} din ${total}`}>
          {cfg.joc === "memory" ? (
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-mov/15"><div className="h-full bg-mov transition-all" style={{ width: `${(100 * rez.length) / total}%` }} /></div>
          ) : (
            itemi.map((x, i) => {
              const r = rez[i];
              return <span key={x.id} className={`h-2.5 flex-1 rounded-full ${r ? (r.corect ? "bg-green-500" : "bg-red-400") : i === idx ? "bg-mov" : "bg-mov/15"}`} />;
            })
          )}
        </div>
      </header>

      {cfg.joc === "memory" ? (
        <Memory cfg={cfg} itemi={itemi} vieti={vieti} onPereche={(id, inc, timpMs) => setRez((r) => [...r, { id, dat: "ok", corect: true, incercari: inc, timpMs }])}
          onGreseala={() => {
            if (!cfg.vieti) return;
            const v = vieti - 1;
            setVieti(v);
            if (v <= 0) termina(rez, false, v);
          }}
          onGata={(r) => termina(r, true, vieti)} rez={rez} />
      ) : it ? (
        <section key={it.id} className="mt-4 flex flex-1 flex-col items-center gap-4">
          {cfg.joc === "sprint" && <BaraTimp cheie={it.id} ms={timpItem(cfg, it, comboCurent)} oprit={!!stare} onExpirat={() => raspunde(null)} />}
          <Enunt it={it} joc={cfg.joc} stare={stare} />
          <Feedback stare={stare} onReincearca={reincearca} rezolvare={it.rezolvare} />
          {!(stare && (stare.tip === "corect" || stare.arata)) && <Intrare key={`${it.id}-${incercari}`} it={it} onRaspuns={raspunde} blocat={false} />}
        </section>
      ) : null}
    </main>
  );
}

// ───────────────────────── enunțul, după joc ─────────────────────────

function Enunt({ it, joc, stare }: { it: ItemC3; joc: CfgJoc["joc"]; stare: Stare }) {
  const asculta = <button type="button" onClick={() => vorbeste(it.text)} className="ml-2 rounded-full bg-white px-2 py-1 text-lg shadow-sm" aria-label="Ascultă enunțul">🔊</button>;
  if (joc === "balanta" && it.st && it.dr) {
    const s = stare?.tip === "corect" || stare?.arata ? it.afis : null;
    const unghi = s === "<" ? -8 : s === ">" ? 8 : 0;
    return (
      <div className="w-full max-w-2xl">
        <p className="text-center text-lg font-semibold text-gray-600">Care parte este mai mare? {asculta}</p>
        <div className="relative mx-auto mt-3 h-56 w-full">
          <div className="absolute left-1/2 top-16 h-36 w-3 -translate-x-1/2 rounded bg-[#8b5e3c]" />
          <div className="absolute bottom-0 left-1/2 h-4 w-40 -translate-x-1/2 rounded-full bg-[#8b5e3c]" />
          <div className="absolute left-0 right-0 top-12 transition-transform duration-500 motion-reduce:transition-none" style={{ transform: `rotate(${unghi}deg)` }}>
            <div className="mx-auto h-3 w-[86%] rounded-full bg-[#6b4426]" />
            <div className="mt-2 flex justify-between gap-2">
              {[it.st, it.dr].map((f, i) => (
                <div key={i} className="flex min-h-24 w-[46%] items-center justify-center rounded-b-[2.5rem] rounded-t-lg border-4 border-[#6b4426] bg-white p-3 text-center text-2xl font-extrabold text-mov-inchis shadow sm:text-3xl">
                  <FataC3 f={f} />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute left-1/2 top-[7.5rem] -translate-x-1/2 rounded-full bg-galben px-4 py-1 text-3xl font-extrabold text-mov-inchis shadow">{s ?? "?"}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-3xl bg-white p-5 text-center shadow-md">
      {joc === "detectiv" && <span className="text-4xl" aria-hidden>🔍</span>}
      {it.figura && <FiguraC3 f={it.figura} marime={1.1} />}
      {it.desen && <div className="max-w-full overflow-x-auto"><DesenC4 d={it.desen} marime={it.desen.tip === "segmente" ? 1.3 : 1.15} /></div>}
      {it.fractie && it.raspuns.tip !== "colorare" && <Fractie forma={it.fractie.forma} parti={it.fractie.parti} colorate={it.fractie.colorate} marime={1.1} />}
      <p className={`font-extrabold text-mov-inchis ${it.text.length > 60 ? "text-xl" : it.text.length > 30 ? "text-2xl" : "text-4xl"}`}>
        <TextMate text={it.text.replace("○", "?")} />{asculta}
      </p>
    </div>
  );
}

function Feedback({ stare, onReincearca, rezolvare }: { stare: Stare; onReincearca: () => void; rezolvare?: string[] }) {
  if (!stare) return null;
  if (stare.tip === "corect") return <p className="rounded-2xl bg-green-100 px-5 py-2 text-2xl font-extrabold text-green-800" role="status">✓ Corect!</p>;
  return (
    <div className="max-w-2xl rounded-2xl bg-red-50 px-5 py-3 text-center text-red-800" role="status">
      <p className="text-xl font-bold">✗ {stare.mesaj.split(" 💡 ")[0]}</p>
      {stare.mesaj.includes("💡") && <p className="mt-1 text-base text-gray-700">💡 {stare.mesaj.split(" 💡 ")[1]}</p>}
      {stare.arata && <p className="mt-1 text-lg">Răspunsul corect: <b><TextMate text={stare.arata} /></b></p>}
      {stare.arata && rezolvare && rezolvare.length > 0 && (
        <ol className="mt-2 list-decimal rounded-xl bg-white px-8 py-2 text-left text-base text-gray-800">{rezolvare.map((p) => <li key={p}>{p}</li>)}</ol>
      )}
      {!stare.arata && <button type="button" onClick={onReincearca} className="mt-2 rounded-xl bg-mov px-5 py-2 font-bold text-white">Încerc din nou</button>}
    </div>
  );
}

function BaraTimp({ cheie, ms, oprit, onExpirat }: { cheie: string; ms: number; oprit: boolean; onExpirat: () => void }) {
  const [ramas, setRamas] = useState(ms);
  const expirat = useRef(false);
  useEffect(() => { setRamas(ms); expirat.current = false; }, [cheie, ms]);
  useEffect(() => {
    if (oprit) return;
    let ultim = Date.now();
    const t = setInterval(() => {
      if (document.hidden) { ultim = Date.now(); return; } // pauză când elevul iese din tab
      const acum = Date.now();
      setRamas((r) => {
        const n = r - (acum - ultim);
        if (n <= 0 && !expirat.current) { expirat.current = true; setTimeout(onExpirat, 0); }
        return Math.max(0, n);
      });
      ultim = acum;
    }, 100);
    return () => clearInterval(t);
  }, [oprit, cheie, onExpirat]);
  const p = ramas / ms;
  return (
    <div className="w-full max-w-2xl" aria-label={`Timp rămas: ${Math.ceil(ramas / 1000)} secunde`}>
      <div className="h-4 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full transition-[width] duration-100 ${p < 0.15 ? "bg-red-500" : p < 0.4 ? "bg-galben" : "bg-green-500"}`} style={{ width: `${p * 100}%` }} />
      </div>
      <p className="mt-1 text-right text-sm font-semibold text-gray-600">⏱ {Math.ceil(ramas / 1000)} s</p>
    </div>
  );
}

// ───────────────────────── intrarea răspunsului ─────────────────────────

function Intrare({ it, onRaspuns, blocat }: { it: ItemC3; onRaspuns: (d: string) => void; blocat: boolean }) {
  const r = it.raspuns;
  if (r.tip === "varianta")
    return (
      <div className={`grid w-full max-w-2xl gap-3 ${r.variante.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {r.variante.map((v) => (
          <button key={v} type="button" disabled={blocat} onClick={() => onRaspuns(v)}
            className="min-h-tinta rounded-2xl bg-white px-3 py-3 text-2xl font-extrabold text-mov-inchis shadow ring-2 ring-mov/20 transition hover:bg-mov-deschis active:scale-95 disabled:opacity-50 sm:text-3xl">
            <TextMate text={v} />
          </button>
        ))}
      </div>
    );
  if (r.tip === "construit") return <Constructor onRaspuns={onRaspuns} />;
  if (r.tip === "colorare") return <Colorare it={it} onRaspuns={onRaspuns} />;
  return <Numeric it={it} onRaspuns={onRaspuns} />;
}

function Numeric({ it, onRaspuns }: { it: ItemC3; onRaspuns: (d: string) => void }) {
  const rest = it.raspuns.tip === "rest";
  const [v, setV] = useState(["", ""]);
  const [activ, setActiv] = useState(0);
  const set = (s: string) => setV((x) => x.map((y, i) => (i === activ ? s.replace(/\D/g, "").slice(0, 6) : y)));
  const trimite = useCallback(() => {
    if (!v[0] || (rest && !v[1])) { if (rest && v[0]) setActiv(1); return; }
    onRaspuns(rest ? `${v[0]}|${v[1]}` : v[0]);
  }, [v, rest, onRaspuns]);
  // tastatura fizică
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setV((x) => x.map((y, i) => (i === activ ? (y + e.key).slice(0, 6) : y)));
      else if (e.key === "Backspace") setV((x) => x.map((y, i) => (i === activ ? y.slice(0, -1) : y)));
      else if (e.key === "Enter") trimite();
      else if (rest && (e.key === "Tab" || e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); setActiv((a) => 1 - a); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [activ, rest, trimite]);
  const cutie = (i: number) => (
    <button type="button" onClick={() => setActiv(i)} aria-label={rest ? (i ? "Restul" : "Câtul") : "Răspunsul"}
      className={`h-16 min-w-28 rounded-2xl border-4 bg-white px-3 text-4xl font-extrabold tabular-nums text-mov-inchis ${activ === i ? "border-mov" : "border-mov/20"}`}>
      {v[i] || " "}
    </button>
  );
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3 text-3xl font-bold text-mov-inchis">
        {it.text.includes("□") && <TextMate text="□ =" />}
        {cutie(0)}
        {rest && <><span>rest</span>{cutie(1)}</>}
      </div>
      <Tastatura valoare={v[activ]} onChange={set} onTrimite={trimite} />
    </div>
  );
}

const CELULE = { col: 12, rand: 8 };

/** Constructorul: dreptunghi pe grilă (1 pătrățel = 1 cm), se trage de colț sau se folosesc butoanele. */
function Constructor({ onRaspuns }: { onRaspuns: (d: string) => void }) {
  const [L, setL] = useState(1);
  const [l, setl] = useState(1);
  const svg = useRef<SVGSVGElement>(null);
  const trage = useRef(false);
  const u = 34;
  const muta = (e: React.PointerEvent) => {
    if (!trage.current || !svg.current) return;
    const b = svg.current.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * (CELULE.col * u), y = ((e.clientY - b.top) / b.height) * (CELULE.rand * u);
    setL(Math.min(CELULE.col, Math.max(1, Math.round(x / u))));
    setl(Math.min(CELULE.rand, Math.max(1, Math.round(y / u))));
  };
  const buton = (t: string, f: () => void, eticheta: string) => <button type="button" onClick={f} aria-label={eticheta} className="h-12 w-12 rounded-xl bg-white text-2xl font-bold text-mov shadow ring-2 ring-mov/20">{t}</button>;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <svg ref={svg} viewBox={`0 0 ${CELULE.col * u} ${CELULE.rand * u}`} className="w-full max-w-xl touch-none select-none rounded-xl bg-white shadow"
        onPointerDown={(e) => { trage.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); muta(e); }} onPointerMove={muta} onPointerUp={() => (trage.current = false)}
        role="img" aria-label={`Dreptunghi de ${L} pe ${l} pătrățele`}>
        {Array.from({ length: CELULE.col + 1 }, (_, i) => <line key={`v${i}`} x1={i * u} y1={0} x2={i * u} y2={CELULE.rand * u} stroke="#ddd" />)}
        {Array.from({ length: CELULE.rand + 1 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * u} x2={CELULE.col * u} y2={i * u} stroke="#ddd" />)}
        <rect x={0} y={0} width={L * u} height={l * u} fill="#6a59a744" stroke="#4f4183" strokeWidth="4" />
        <circle cx={L * u} cy={l * u} r={13} fill="#f9c50f" stroke="#4f4183" strokeWidth="3" />
      </svg>
      <div className="flex flex-wrap items-center justify-center gap-3 text-lg font-bold text-mov-inchis">
        <span>Lungimea:</span>{buton("−", () => setL((x) => Math.max(1, x - 1)), "Micșorează lungimea")}<span className="w-14 text-center">{L} cm</span>{buton("+", () => setL((x) => Math.min(CELULE.col, x + 1)), "Mărește lungimea")}
        <span className="ml-2">Lățimea:</span>{buton("−", () => setl((x) => Math.max(1, x - 1)), "Micșorează lățimea")}<span className="w-14 text-center">{l} cm</span>{buton("+", () => setl((x) => Math.min(CELULE.rand, x + 1)), "Mărește lățimea")}
      </div>
      <button type="button" onClick={() => onRaspuns(`${L}x${l}`)} className="h-tinta w-full max-w-sm rounded-2xl bg-mov text-2xl font-extrabold text-white shadow">Verifică ✓</button>
    </div>
  );
}

function Colorare({ it, onRaspuns }: { it: ItemC3; onRaspuns: (d: string) => void }) {
  const f = it.fractie!;
  const [sel, setSel] = useState<boolean[]>(() => Array(f.parti).fill(false));
  const n = sel.filter(Boolean).length;
  return (
    <div className="flex flex-col items-center gap-3">
      <Fractie forma={f.forma} parti={f.parti} colorate={0} selectate={sel} marime={2} culoare="#e07a1f" onParte={(i) => setSel((s) => s.map((x, j) => (j === i ? !x : x)))} />
      <p className="text-lg text-gray-600">Atinge părțile ca să le colorezi. Ai colorat {n} din {f.parti}.</p>
      <button type="button" disabled={!n} onClick={() => onRaspuns(String(n))} className="h-tinta w-full max-w-sm rounded-2xl bg-mov text-2xl font-extrabold text-white shadow disabled:opacity-40">Verifică ✓</button>
    </div>
  );
}

// ───────────────────────── Memory ─────────────────────────

interface Carte { cheie: string; id: string; f: ItemC3["st"]; parte: "st" | "dr" }

function Memory({ cfg, itemi, rez, onPereche, onGreseala, onGata }: {
  cfg: CfgJoc; itemi: ItemC3[]; vieti: number; rez: RaspunsJoc[];
  onPereche: (id: string, incercari: number, timpMs: number) => void; onGreseala: () => void; onGata: (r: RaspunsJoc[]) => void;
}) {
  const PE_TABLA = 6;
  const table = useMemo(() => {
    const t: ItemC3[][] = [];
    for (let i = 0; i < itemi.length; i += PE_TABLA) t.push(itemi.slice(i, i + PE_TABLA));
    return t;
  }, [itemi]);
  const nrTabla = Math.min(table.length - 1, Math.floor(rez.length / PE_TABLA));
  const carti = useMemo<Carte[]>(() => new Rng(cfg.seed + nrTabla * 101).shuffle((table[nrTabla] ?? []).flatMap((it) => [
    { cheie: `${it.id}-st`, id: it.id, f: it.st, parte: "st" as const }, { cheie: `${it.id}-dr`, id: it.id, f: it.dr, parte: "dr" as const },
  ])), [table, cfg.seed, nrTabla]);
  const [intoarse, setIntoarse] = useState<string[]>([]);
  const [gresite, setGresite] = useState<Record<string, number>>({});
  const start = useRef(Date.now());
  const gasite = new Set(rez.map((r) => r.id));
  const ultimRez = useRef(rez);
  ultimRez.current = rez;

  useEffect(() => { start.current = Date.now(); setIntoarse([]); }, [nrTabla]);
  useEffect(() => {
    if (rez.length === itemi.length && rez.length) onGata(rez);
  }, [rez, itemi.length, onGata]);

  const atinge = (c: Carte) => {
    if (gasite.has(c.id) || intoarse.includes(c.cheie) || intoarse.length >= 2) return;
    const noi = [...intoarse, c.cheie];
    setIntoarse(noi);
    if (noi.length < 2) return;
    const [a, b] = noi.map((k) => carti.find((x) => x.cheie === k)!);
    if (a.id === b.id) {
      setTimeout(() => {
        onPereche(a.id, 1 + (gresite[a.id] ?? 0), Date.now() - start.current);
        setIntoarse([]);
      }, 450);
    } else {
      setGresite((g) => ({ ...g, [a.id]: (g[a.id] ?? 0) + 1, [b.id]: (g[b.id] ?? 0) + 1 }));
      onGreseala();
      setTimeout(() => setIntoarse([]), 1100);
    }
  };

  return (
    <section className="mt-4">
      <p className="mb-3 text-center text-lg text-gray-600">Găsește perechile: fiecare calcul cu rezultatul lui. Tabla {nrTabla + 1} din {table.length}.</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {carti.map((c) => {
          const vizibil = gasite.has(c.id) || intoarse.includes(c.cheie);
          return (
            <button key={c.cheie} type="button" onClick={() => atinge(c)} aria-label={vizibil ? c.f?.text : "Cartonaș întors"}
              className={`flex aspect-[4/3] items-center justify-center rounded-2xl p-2 text-center text-xl font-extrabold shadow transition sm:text-2xl ${gasite.has(c.id) ? "bg-green-100 text-green-800 ring-2 ring-green-400" : vizibil ? "bg-white text-mov-inchis ring-2 ring-mov/30" : "bg-mov text-white hover:brightness-110"}`}>
              {vizibil ? <FataC3 f={c.f!} marime={0.55} /> : <span className="text-3xl" aria-hidden>❓</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ───────────────────────── ecranul final ─────────────────────────

function Final({ cfg, puncte, rez, itemi, terminat, mesaj, inapoi, onReia }: {
  cfg: CfgJoc; puncte: ReturnType<typeof puncteaza>; rez: RaspunsJoc[]; itemi: ItemC3[]; terminat: boolean; mesaj?: string; inapoi: string; onReia?: () => void;
}) {
  useCelebrare(puncte.stele >= 2, puncte.stele === 3 ? "mare" : "mica");
  const gresite = itemi.filter((it) => rez.find((r) => r.id === it.id && !r.corect) || !rez.find((r) => r.id === it.id));
  const timpMediu = rez.length ? Math.round(rez.reduce((s, r) => s + r.timpMs, 0) / rez.length / 100) / 10 : 0;
  const m = puncte.medalie as Medalie;
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-center">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="text-7xl" aria-hidden>{m ? MEDALII[m].icon : "💪"}</div>
        <h1 className="mt-2 text-3xl font-extrabold text-mov">{m ? `Medalia de ${MEDALII[m].nume}!` : terminat ? "Bravo că ai terminat!" : "Ai rămas fără vieți"}</h1>
        <div className="mt-1 text-4xl">{[1, 2, 3].map((s) => <span key={s} className={s <= puncte.stele ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
        <ScaraMedalii puncte={puncte} />
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Punctaj", `${puncte.scor}`], ["Corecte", `${puncte.corecte}/${itemi.length}`], ["Acuratețe", `${puncte.acuratete}%`], ["Timp mediu", `${timpMediu} s`]].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-mov-deschis p-3"><dt className="text-sm text-gray-600">{a}</dt><dd className="text-2xl font-extrabold text-mov-inchis">{b}</dd></div>
          ))}
        </dl>
        {puncte.comboMax >= 3 && <p className="mt-3 text-lg font-bold text-portocaliu">🔥 Cel mai lung combo: {puncte.comboMax} răspunsuri corecte la rând!</p>}
        {mesaj && <p className="mt-3 rounded-xl bg-green-50 p-2 text-green-800">{mesaj}</p>}
        {gresite.length > 0 && cfg.joc !== "memory" && (
          <div className="mt-4 text-left">
            <h2 className="font-bold text-mov">De exersat:</h2>
            <ul className="mt-1 grid gap-1">
              {gresite.slice(0, 10).map((it) => <li key={it.id} className="rounded-lg bg-red-50 px-3 py-1.5"><TextMate text={it.text} /> → <b><TextMate text={it.afis} /></b>{it.rezolvare && <span className="block text-sm text-gray-600">{it.rezolvare.join(" · ")}</span>}</li>)}
            </ul>
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {onReia && <button type="button" onClick={onReia} className="rounded-2xl bg-galben px-6 py-3 text-lg font-bold text-mov-inchis shadow">Mai încerc o dată</button>}
          <Link href={inapoi} className="rounded-2xl bg-mov px-6 py-3 text-lg font-bold text-white shadow">Înapoi</Link>
        </div>
      </div>
    </main>
  );
}
