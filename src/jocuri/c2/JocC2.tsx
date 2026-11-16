"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Tastatura } from "@/jocuri/componente";
import { useCelebrare } from "@/jocuri/miscare";
import { Ceas, Fractie, Grupe, Numaratoare } from "@/componente/svg/Vizual";
import { TextMate } from "@/jocuri/c3/Vizuale";
import { MEDALII, puncteaza, type Medalie } from "@/motor/clasa3/generator";
import { verificaC2 } from "@/motor/clasa2/generator";
import { JOCURI_C2, NIVELURI_C2, VITEZA_BULE, VITEZA_TINTE, type ConfigC2, type ItemC2, type JocC2, type NivelC2, type VizualC2 } from "@/motor/clasa2/tipuri";
import { deblocheazaPiesa } from "./Puzzle";
import { Rng } from "@/motor/rng";
import { seteazaSunet, sunetActiv, sunetBland } from "@/antrenament/stare-client";
import { BANCNOTE, MONEDE } from "@/motor/clasa2/tipuri";
import { textBani } from "@/motor/clasa2/generator";
import { BanDesen, GramadaBani } from "./Bani";

export interface RaspunsJocC2 { id: string; dat: string | null; corect: boolean; incercari: number; timpMs: number; greseli: string[] }
export interface FinalJocC2 { raspunsuri: RaspunsJocC2[]; nivel: NivelC2; incercare: number; terminat: boolean }

/** „bonk” moale la greșeală (doar cu sunetul pornit) */
function sunetGresit() {
  if (!sunetActiv()) return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.2);
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.25);
  } catch {}
}

function vorbeste(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text.replace(/□/g, "căsuța").replace(/…/g, "cât").replace(/×/g, " ori ").replace(/ : /g, " împărțit la ").replace(/−/g, " minus ").replace(/1\/2/g, "o doime").replace(/1\/4/g, "o pătrime").replace(/1\/3/g, "o treime"));
    u.lang = "ro-RO";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

function useMontat() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function VizualC2View({ v, marime = 1 }: { v: VizualC2; marime?: number }) {
  if (v.tip === "numaratoare") return <Numaratoare sute={v.sute} zeci={v.zeci} unitati={v.unitati} marime={0.8 * marime} />;
  if (v.tip === "grupe") return <Grupe grupe={v.grupe} cate={v.cate} simbol="●" />;
  if (v.tip === "ceas") return <Ceas ore={v.ore} minute={v.minute} marime={1.3 * marime} />;
  return <Fractie forma={v.forma} parti={v.parti} colorate={v.colorate} marime={marime} />;
}

/** Fața din stânga a unui cartonaș: desenul (ceas, fracție) sau textul */
function FataSt({ it, marime = 0.6 }: { it: ItemC2; marime?: number }) {
  if (it.vizual && (it.vizual.tip === "ceas" || it.vizual.tip === "fractie")) return <VizualC2View v={it.vizual} marime={marime} />;
  return <TextMate text={it.st ?? it.text} />;
}

/**
 * Mini-jocurile de clasa a II-a pe un motor comun: nivel (ales de copil sau de profesor), inimi, combo, medalie.
 * `onFinal` primește răspunsurile (la teme, serverul le verifică din nou).
 */
export function JocC2({ cfg, itemiPentru, inapoi, titlu, onFinal, onReia, incercare = 0, eticheta }: {
  cfg: ConfigC2; itemiPentru: (n: NivelC2) => ItemC2[]; inapoi: string; titlu?: string;
  onFinal?: (f: FinalJocC2) => Promise<string | void> | string | void; onReia?: () => void; incercare?: number; eticheta?: string;
}) {
  const [nivel, setNivel] = useState<NivelC2 | null>(cfg.nivel === "alege" ? null : cfg.nivel);
  const itemi = useMemo(() => (nivel ? itemiPentru(nivel) : []), [nivel, itemiPentru]);
  const [rez, setRez] = useState<RaspunsJocC2[]>([]);
  // „Mix automat”: jocurile vin pe rând (segmente); Memorie și Integrama sunt jocuri de explorare, fără inimi
  const segmente = useMemo(() => {
    const out: { joc: JocC2; itemi: ItemC2[]; start: number }[] = [];
    itemi.forEach((it, i) => { const j = it.joc ?? cfg.joc; const u = out[out.length - 1]; if (u && u.joc === j) u.itemi.push(it); else out.push({ joc: j, itemi: [it], start: i }); });
    return out;
  }, [itemi, cfg.joc]);
  const seg = segmente.find((x) => x.start + x.itemi.length > rez.length) ?? segmente[segmente.length - 1];
  const jocCurent: JocC2 = seg?.joc ?? cfg.joc;
  const exploratie = (j: JocC2) => j === "memorie" || j === "integrama";
  const cuInimi = cfg.mix ? cfg.vieti : exploratie(cfg.joc) ? 0 : cfg.vieti;
  const faraInimiAcum = exploratie(jocCurent);
  const jocRef = useRef(jocCurent);
  jocRef.current = jocCurent;
  const [vieti, setVieti] = useState<number>(cuInimi);
  const [final, setFinal] = useState<{ terminat: boolean; mesaj?: string } | null>(null);
  const [sunet, setSunet] = useState(false);
  const trimis = useRef(false);
  const montat = useMontat();
  useEffect(() => setSunet(sunetActiv()), []);
  const joc = JOCURI_C2[jocCurent];
  const comboCurent = useMemo(() => { let c = 0; for (let i = rez.length - 1; i >= 0 && rez[i].corect && rez[i].incercari <= 1; i--) c++; return c; }, [rez]);
  const puncte = useMemo(() => puncteaza(rez, Math.max(1, itemi.length)), [rez, itemi.length]);
  const mult = nivel ? NIVELURI_C2[nivel].multiplicator : 1;

  const termina = useCallback(async (r: RaspunsJocC2[], terminat: boolean) => {
    if (trimis.current || !nivel) return;
    trimis.current = true;
    setFinal({ terminat });
    const m = await onFinal?.({ raspunsuri: r, nivel, incercare, terminat });
    if (m) setFinal({ terminat, mesaj: m });
  }, [onFinal, nivel, incercare]);

  /** un item rezolvat (corect sau nu) */
  const gata = useCallback((r: RaspunsJocC2) => {
    setRez((x) => {
      const n = [...x, r];
      if (n.length >= itemi.length) setTimeout(() => termina(n, true), 700);
      return n;
    });
  }, [itemi.length, termina]);
  /** o greșeală: −1 inimă (dacă jocul are inimi); la 0 inimi jocul se oprește, scorul rămâne */
  const greseala = useCallback(() => {
    sunetGresit();
    if (!cuInimi || exploratie(jocRef.current)) return;
    setVieti((v) => {
      const n = v - 1;
      if (n <= 0) setTimeout(() => setRez((r) => { termina(r, false); return r; }), 900);
      return n;
    });
  }, [cuInimi, termina]);
  const corect = useCallback(() => sunetBland(), []);

  if (!nivel) return <AlegeNivel joc={cfg.joc} inapoi={inapoi} onAlege={setNivel} />;
  if (final) return <Final puncte={puncte} mult={mult} rez={rez} itemi={itemi} terminat={final.terminat} mesaj={final.mesaj} inapoi={inapoi} onReia={onReia} />;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-3 pb-6 sm:px-6">
      <header className="sticky top-0 z-10 -mx-3 bg-[#fdf8ef]/95 px-3 pt-3 pb-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href={inapoi} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-mov shadow-sm" aria-label="Ieși din joc">✕</Link>
          <span className="text-3xl" aria-hidden>{joc.icon}</span>
          <h1 className="flex-1 truncate text-xl font-extrabold text-mov sm:text-2xl">{titlu ?? joc.nume}{cfg.mix && segmente.length > 1 && <span className="ml-2 rounded-full bg-mov-deschis px-2 py-0.5 text-sm text-mov">{joc.icon} jocul {segmente.indexOf(seg!) + 1} din {segmente.length}</span>}{eticheta && <span className="ml-2 rounded-full bg-galben px-2 py-0.5 text-xs text-mov-inchis">{eticheta}</span>}</h1>
          {cuInimi > 0 && !faraInimiAcum && <span className="text-2xl" aria-label={`${vieti} inimi`}>{Array.from({ length: cuInimi }, (_, i) => <span key={i} className={i < vieti ? "" : "opacity-20 grayscale"}>❤️</span>)}</span>}
          <span className="rounded-2xl bg-white px-3 py-1.5 text-lg font-extrabold text-mov shadow-sm" aria-label="Punctaj">⭐ {Math.round(puncte.scor * mult)}</span>
          {comboCurent >= 3 && <span className="animate-pulse rounded-2xl bg-galben px-3 py-1.5 text-lg font-extrabold text-mov-inchis motion-reduce:animate-none" aria-label={`Combo ${comboCurent}`}>🔥×{comboCurent}</span>}
          <button type="button" onClick={() => { const v = !sunet; setSunet(v); seteazaSunet(v); }} aria-pressed={sunet} aria-label={sunet ? "Oprește sunetul" : "Pornește sunetul"} className="h-12 w-12 rounded-2xl bg-white text-2xl shadow-sm">{sunet ? "🔔" : "🔕"}</button>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <p className="text-xl font-bold text-mov-inchis">{joc.instructiune}</p>
          {montat && <button type="button" onClick={() => vorbeste(joc.instructiune)} className="h-12 w-12 rounded-full bg-galben text-2xl shadow-sm" aria-label="Ascultă">🔊</button>}
        </div>
        <div className="mt-2 flex gap-0.5" aria-label={`${rez.length} din ${itemi.length}`}>
          {itemi.length <= 25 ? itemi.map((x, i) => <span key={x.id} className={`h-3 flex-1 rounded-full ${rez[i] ? (rez[i].corect ? "bg-green-500" : "bg-red-400") : "bg-mov/15"}`} />)
            : <div className="h-3 flex-1 overflow-hidden rounded-full bg-mov/15"><div className="h-full bg-green-500 transition-all" style={{ width: `${(100 * rez.length) / itemi.length}%` }} /></div>}
        </div>
      </header>
      {seg && <div key={seg.start} className="contents">{(() => {
        const p = { itemi: seg.itemi, rez: rez.slice(seg.start), onGata: gata, onGreseala: greseala, onCorect: corect };
        switch (seg.joc) {
          case "perechi": return <Perechi {...p} seed={cfg.seed} />;
          case "bule": return <Bule {...p} nivel={nivel} />;
          case "scara": return <Scara {...p} mod={cfg.modScara} vieti={cfg.vieti} />;
          case "casute": return <Casute {...p} />;
          case "balanta": return <Balanta {...p} vieti={cuInimi} />;
          case "ordonare": return <Ordonare {...p} />;
          case "ceas": return <CeasJoc {...p} vieti={cuInimi} />;
          case "magazin": return <Magazin {...p} nivel={nivel} vieti={cuInimi} />;
          case "memorie": return <Memorie {...p} nivel={nivel} seed={cfg.seed} />;
          case "provocare": return <Provocare {...p} vieti={cuInimi} />;
          case "integrama": return <IntegramaJoc {...p} />;
          case "tinte": return <Tinte {...p} nivel={nivel} />;
        }
      })()}</div>}
    </main>
  );
}

interface PropsJoc { itemi: ItemC2[]; rez: RaspunsJocC2[]; onGata: (r: RaspunsJocC2) => void; onGreseala: () => void; onCorect: () => void }

function AlegeNivel({ joc, inapoi, onAlege }: { joc: ConfigC2["joc"]; inapoi: string; onAlege: (n: NivelC2) => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-7xl" aria-hidden>{JOCURI_C2[joc].icon}</span>
      <h1 className="text-3xl font-extrabold text-mov">{JOCURI_C2[joc].nume}</h1>
      <p className="text-2xl font-bold text-mov-inchis">Alege nivelul!</p>
      <div className="grid w-full gap-4 sm:grid-cols-3">
        {(Object.keys(NIVELURI_C2) as NivelC2[]).map((n) => (
          <button key={n} type="button" onClick={() => onAlege(n)} className="flex min-h-36 flex-col items-center justify-center gap-1 rounded-3xl bg-white p-4 shadow-md ring-4 ring-mov/10 transition hover:-translate-y-1 hover:ring-mov/40">
            <span className="text-6xl" aria-hidden>{NIVELURI_C2[n].icon}</span>
            <span className="text-2xl font-extrabold text-mov">{NIVELURI_C2[n].nume}</span>
            <span className="text-sm text-gray-600">{NIVELURI_C2[n].descriere}</span>
          </button>
        ))}
      </div>
      <Link href={inapoi} className="font-semibold text-mov">← Înapoi</Link>
    </main>
  );
}

// ───────────────────────── T1: Perechi rapide ─────────────────────────

function Perechi({ itemi, rez, onGata, onGreseala, onCorect, seed }: PropsJoc & { seed: number }) {
  const PE_RUNDA = 6;
  const runda = Math.floor(rez.length / PE_RUNDA);
  const din = useMemo(() => itemi.slice(runda * PE_RUNDA, runda * PE_RUNDA + PE_RUNDA), [itemi, runda]);
  const dreapta = useMemo(() => {
    const raspunsuri = new Set(din.map((i) => i.afis));
    // 2–3 cartonașe fără pereche (răspunsuri greșite tipice), ca să nu se ghicească prin eliminare
    const fals = [...new Set(din.flatMap((i) => i.distractori.map((d) => d.v)).filter((v) => !raspunsuri.has(v)))];
    const rng = new Rng(seed + runda * 7);
    return rng.shuffle([...din.map((i) => ({ v: i.afis, id: i.id })), ...rng.shuffle(fals).slice(0, Math.min(3, Math.max(2, Math.floor(din.length / 2)))).map((v) => ({ v, id: "" }))]);
  }, [din, seed, runda]);
  const stanga = useMemo(() => new Rng(seed + runda * 13).shuffle(din), [din, seed, runda]);
  const [sel, setSel] = useState<{ parte: "st" | "dr"; k: string } | null>(null);
  const [scutura, setScutura] = useState<string[]>([]);
  const greseli = useRef<Record<string, string[]>>({});
  const start = useRef(Date.now());
  useEffect(() => { start.current = Date.now(); setSel(null); }, [runda]);
  const gasite = new Set(rez.map((r) => r.id));

  const potriveste = (idSt: string, dr: { v: string; id: string }, cheieDr: string) => {
    if (dr.id === idSt) {
      onCorect();
      onGata({ id: idSt, dat: "ok", corect: true, incercari: 1 + (greseli.current[idSt]?.length ?? 0), timpMs: Date.now() - start.current, greseli: greseli.current[idSt] ?? [] });
    } else {
      (greseli.current[idSt] ??= []).push(dr.v);
      setScutura([idSt, cheieDr]);
      setTimeout(() => setScutura([]), 400);
      onGreseala();
    }
    setSel(null);
  };
  const atingeSt = (it: ItemC2) => {
    if (gasite.has(it.id)) return;
    if (sel?.parte === "dr") { const k = Number(sel.k); potriveste(it.id, dreapta[k], sel.k); return; }
    setSel({ parte: "st", k: it.id });
  };
  const atingeDr = (k: number) => {
    const d = dreapta[k];
    if (d.id && gasite.has(d.id)) return;
    if (sel?.parte === "st") { potriveste(sel.k, d, String(k)); return; }
    setSel({ parte: "dr", k: String(k) });
  };
  const carte = "flex min-h-20 w-full items-center justify-center rounded-2xl px-3 py-2 text-center text-2xl font-extrabold shadow transition active:scale-95";
  return (
    <section className="mt-4 grid grid-cols-2 gap-4 sm:gap-8">
      <div className="grid content-start gap-3">
        {stanga.map((it) => (
          <button key={it.id} type="button" onClick={() => atingeSt(it)} disabled={gasite.has(it.id)}
            className={`${carte} ${gasite.has(it.id) ? "bg-green-100 text-green-800 opacity-60" : sel?.parte === "st" && sel.k === it.id ? "bg-white text-mov-inchis ring-4 ring-albastru" : "bg-white text-mov-inchis ring-2 ring-mov/15"} ${scutura.includes(it.id) ? "animate-[scutura_0.3s] bg-red-100" : ""}`}>
            {gasite.has(it.id) && <span className="mr-2" aria-hidden>✓</span>}<FataSt it={it} />
          </button>
        ))}
      </div>
      <div className="grid content-start gap-3">
        {dreapta.map((d, k) => {
          const facut = !!d.id && gasite.has(d.id);
          return (
            <button key={`${d.v}-${k}`} type="button" onClick={() => atingeDr(k)} disabled={facut}
              className={`${carte} ${facut ? "bg-green-100 text-green-800 opacity-60" : sel?.parte === "dr" && sel.k === String(k) ? "bg-galben-deschis text-mov-inchis ring-4 ring-albastru" : "bg-galben-deschis text-mov-inchis ring-2 ring-galben"} ${scutura.includes(String(k)) ? "animate-[scutura_0.3s] bg-red-100" : ""}`}>
              {facut && <span className="mr-2" aria-hidden>✓</span>}<TextMate text={d.v} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ───────────────────────── T3: Bule care cad ─────────────────────────

function Enunt({ it }: { it: ItemC2 }) {
  const montat = useMontat();
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3 rounded-3xl bg-white p-4 text-center shadow-md">
      {it.vizual && <VizualC2View v={it.vizual} />}
      <p className={`font-extrabold text-mov-inchis ${it.text.length > 50 ? "text-2xl" : "text-4xl"}`}>
        <TextMate text={it.text} />
        {montat && <button type="button" onClick={() => vorbeste(it.text)} className="ml-2 h-12 w-12 rounded-full bg-galben align-middle text-2xl" aria-label="Ascultă cerința">🔊</button>}
      </p>
    </div>
  );
}

function Bule({ itemi, rez, nivel, onGata, onGreseala, onCorect }: PropsJoc & { nivel: NivelC2 }) {
  const it = itemi[rez.length];
  const [sparte, setSparte] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  const greseli = useRef<string[]>([]);
  const start = useRef(Date.now());
  const bule = useMemo(() => {
    if (!it) return [];
    const r = new Rng(rez.length * 977 + it.cheie.length);
    const valori = r.shuffle([it.afis, ...it.distractori.slice(0, 4).map((d) => d.v)]);
    return valori.map((v, i) => ({ v, x: 6 + (88 / valori.length) * i + r.int(0, 6), intarziere: r.next() * 2.5 }));
  }, [it, rez.length]);
  useEffect(() => { setSparte([]); setOk(false); greseli.current = []; start.current = Date.now(); }, [it?.id]);
  if (!it) return null;
  const durata = VITEZA_BULE[nivel];
  const atinge = (v: string) => {
    if (ok || sparte.includes(v)) return;
    if (verificaC2(it, v)) {
      setOk(true);
      onCorect();
      setTimeout(() => onGata({ id: it.id, dat: v, corect: true, incercari: 1 + greseli.current.length, timpMs: Date.now() - start.current, greseli: greseli.current }), 450);
    } else {
      greseli.current.push(v);
      setSparte((s) => [...s, v]);
      onGreseala();
    }
  };
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-3">
      <Enunt it={it} />
      <div className="relative h-[52vh] min-h-80 w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-sky-200 shadow-inner">
        {bule.map((b) => {
          const spart = sparte.includes(b.v), bun = ok && b.v === it.afis;
          return (
            <button key={b.v} type="button" onClick={() => atinge(b.v)} disabled={spart}
              className={`bula absolute flex h-24 w-24 items-center justify-center rounded-full text-2xl font-extrabold shadow-lg transition sm:h-28 sm:w-28 ${spart ? "scale-75 bg-gray-300 text-gray-500 opacity-0 duration-300" : bun ? "scale-125 bg-green-400 text-white" : "bg-white/90 text-mov-inchis ring-4 ring-white"}`}
              style={{ left: `${b.x}%`, animationDuration: `${durata}s`, animationDelay: `${b.intarziere}s`, animationPlayState: ok ? "paused" : "running" }}>
              <TextMate text={b.v} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ───────────────────────── T5: Scara ─────────────────────────

function Scara({ itemi, rez, mod, vieti, onGata, onGreseala, onCorect }: PropsJoc & { mod: ConfigC2["modScara"]; vieti: number }) {
  const it = itemi[rez.length];
  const [gresite, setGresite] = useState<string[]>([]);
  const [stare, setStare] = useState<"ok" | "arata" | null>(null);
  const start = useRef(Date.now());
  useEffect(() => { setGresite([]); setStare(null); start.current = Date.now(); }, [it?.id]);
  const urcate = rez.filter((r) => r.corect).length;
  const trepte = Math.min(10, itemi.length);
  const pozitie = Math.round((urcate / Math.max(1, itemi.length)) * trepte);
  const variante = useMemo(() => (it ? new Rng(it.cheie.length * 31 + rez.length).shuffle([it.afis, ...it.distractori.slice(0, 3).map((d) => d.v)]) : []), [it, rez.length]);
  if (!it) return null;
  const numeric = /^\d+$/.test(it.afis);
  const raspunde = (v: string) => {
    if (stare) return;
    if (verificaC2(it, v)) {
      setStare("ok");
      onCorect();
      setTimeout(() => onGata({ id: it.id, dat: v, corect: true, incercari: gresite.length + 1, timpMs: Date.now() - start.current, greseli: gresite }), 650);
      return;
    }
    const g = [...gresite, v];
    setGresite(g);
    onGreseala();
    // fără inimi, după 3 încercări arătăm răspunsul și mergem mai departe (nu blocăm copilul)
    if (!vieti && g.length >= 3) {
      setStare("arata");
      setTimeout(() => onGata({ id: it.id, dat: v, corect: false, incercari: g.length, timpMs: Date.now() - start.current, greseli: g }), 1800);
    }
  };
  return (
    <section className="mt-3 grid flex-1 gap-4 sm:grid-cols-[150px_1fr]">
      <div className="relative mx-auto hidden h-[58vh] w-28 sm:block" aria-label={`Treapta ${pozitie} din ${trepte}`}>
        <div className="absolute inset-y-0 left-3 w-2 rounded bg-[#8b5e3c]" /><div className="absolute inset-y-0 right-3 w-2 rounded bg-[#8b5e3c]" />
        {Array.from({ length: trepte }, (_, i) => <div key={i} className="absolute left-3 right-3 h-2 rounded bg-[#b07d52]" style={{ bottom: `${((i + 0.5) / trepte) * 92}%` }} />)}
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-4xl" aria-hidden>🏆</span>
        <span className="absolute left-1/2 -translate-x-1/2 text-5xl transition-all duration-500 motion-reduce:transition-none" style={{ bottom: `${(pozitie / trepte) * 88}%` }} aria-hidden>🧗</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Enunt it={it} />
        {stare === "ok" && <p className="rounded-2xl bg-green-100 px-6 py-2 text-3xl font-extrabold text-green-800" role="status">✓</p>}
        {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis" role="status">Răspunsul: <TextMate text={it.afis} /></p>}
        {gresite.length >= 2 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
        {!stare && (mod === "tastatura" && numeric
          ? <IntrareNumar key={gresite.length} onRaspuns={raspunde} scutura={gresite.length > 0} />
          : (
            <div className={`grid w-full max-w-2xl gap-3 ${variante.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
              {variante.map((v) => {
                const g = gresite.includes(v);
                return (
                  <button key={v} type="button" disabled={g} onClick={() => raspunde(v)}
                    className={`min-h-tinta rounded-2xl px-3 py-3 text-2xl font-extrabold shadow transition active:scale-95 sm:text-3xl ${g ? "bg-red-100 text-red-700 line-through opacity-60" : "bg-white text-mov-inchis ring-2 ring-mov/20 hover:bg-mov-deschis"}`}>
                    {g && <span aria-hidden>✗ </span>}<TextMate text={v} />
                  </button>
                );
              })}
            </div>
          ))}
      </div>
    </section>
  );
}

function IntrareNumar({ onRaspuns, scutura }: { onRaspuns: (v: string) => void; scutura: boolean }) {
  const [v, setV] = useState("");
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setV((x) => (x + e.key).slice(0, 5));
      else if (e.key === "Backspace") setV((x) => x.slice(0, -1));
      else if (e.key === "Enter" && v) onRaspuns(v);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [v, onRaspuns]);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className={`flex h-16 min-w-32 items-center justify-center rounded-2xl border-4 border-mov bg-white px-4 text-4xl font-extrabold tabular-nums text-mov-inchis ${scutura ? "animate-[scutura_0.3s]" : ""}`} aria-live="polite">{v || " "}</div>
      <Tastatura valoare={v} onChange={(x) => setV(x.replace(/\D/g, "").slice(0, 5))} onTrimite={() => v && onRaspuns(v)} />
    </div>
  );
}

// ───────────────────────── T6: Completează căsuțele ─────────────────────────

function Casute({ itemi, rez, onGata, onGreseala, onCorect }: PropsJoc) {
  const it = itemi[rez.length];
  const n = it ? (it.text.match(/□/g) ?? []).length : 0;
  const [val, setVal] = useState<string[]>([]);
  const [activ, setActiv] = useState(0);
  const [gresite, setGresite] = useState<string[]>([]);
  const [stare, setStare] = useState<{ tip: "ok"; alte: string } | { tip: "arata" } | null>(null);
  const [scutura, setScutura] = useState(false);
  const start = useRef(Date.now());
  const montat = useMontat();
  useEffect(() => { setVal(Array(n).fill("")); setActiv(0); setGresite([]); setStare(null); start.current = Date.now(); }, [it?.id, n]);
  const verifica = useCallback(() => {
    if (!it || stare || val.some((x) => !x)) return;
    const dat = val.join("|");
    if (verificaC2(it, dat)) {
      onCorect();
      const sol = it.raspuns.tip === "casute" ? it.raspuns.solutii : [];
      const alte = sol.filter((x) => x.join("|") !== dat).map((x) => x.join(" × ")).join(", ");
      setStare({ tip: "ok", alte });
      setTimeout(() => onGata({ id: it.id, dat, corect: true, incercari: gresite.length + 1, timpMs: Date.now() - start.current, greseli: gresite }), alte ? 1800 : 700);
      return;
    }
    const g = [...gresite, dat];
    setGresite(g);
    setScutura(true);
    setTimeout(() => setScutura(false), 350);
    onGreseala();
    if (g.length >= 2) {
      setStare({ tip: "arata" });
      setTimeout(() => onGata({ id: it.id, dat, corect: false, incercari: g.length, timpMs: Date.now() - start.current, greseli: g }), 2000);
    } else setVal(Array(n).fill(""));
  }, [it, stare, val, gresite, n, onCorect, onGata, onGreseala]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setVal((x) => x.map((y, i) => (i === activ ? (y + e.key).slice(0, 4) : y)));
      else if (e.key === "Backspace") setVal((x) => x.map((y, i) => (i === activ ? y.slice(0, -1) : y)));
      else if (e.key === "Enter") verifica();
      else if (e.key === "Tab" && n > 1) { e.preventDefault(); setActiv((a) => (a + 1) % n); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [activ, n, verifica]);
  if (!it) return null;
  let k = -1;
  const parti = it.text.split(/(□)/g);
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-4">
      {it.vizual && <VizualC2View v={it.vizual} />}
      <div className={`flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-white p-5 text-center text-3xl font-extrabold text-mov-inchis shadow-md sm:text-4xl ${scutura ? "animate-[scutura_0.3s]" : ""}`}>
        {parti.map((p, i) => {
          if (p !== "□") return <span key={i}>{p}</span>;
          const j = ++k;
          return (
            <button key={i} type="button" onClick={() => setActiv(j)} aria-label={`Căsuța ${j + 1}`}
              className={`inline-flex h-16 min-w-20 items-center justify-center rounded-xl border-4 px-2 tabular-nums ${stare?.tip === "ok" ? "border-green-500 bg-green-50" : activ === j ? "border-mov bg-galben-deschis" : "border-mov/30 bg-white"}`}>
              {stare?.tip === "arata" ? <span className="text-green-700">{(it.raspuns as { solutii: number[][] }).solutii[0][j]}</span> : val[j] || " "}
            </button>
          );
        })}
        {montat && <button type="button" onClick={() => vorbeste(it.text)} className="h-12 w-12 rounded-full bg-galben text-2xl" aria-label="Ascultă cerința">🔊</button>}
      </div>
      {stare?.tip === "ok" && <p className="rounded-2xl bg-green-100 px-6 py-2 text-2xl font-extrabold text-green-800" role="status">✓{stare.alte && <span className="block text-lg font-semibold">Mai erau: {stare.alte}</span>}</p>}
      {gresite.length === 1 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
      {!stare && <Tastatura valoare={val[activ] ?? ""} onChange={(x) => setVal((v) => v.map((y, i) => (i === activ ? x.replace(/\D/g, "").slice(0, 4) : y)))} onTrimite={verifica} />}
    </section>
  );
}

// ───────────────────────── T7: Balanța ─────────────────────────

const GREUTATI = [1, 2, 5, 10, 50, 100];

function Taler({ text, jos, children }: { text?: string; jos: number; children?: React.ReactNode }) {
  return (
    <div className="flex w-[44%] flex-col items-center transition-transform duration-500 motion-reduce:transition-none" style={{ transform: `translateY(${jos}px)` }}>
      <div className="h-10 w-0.5 bg-[#6b4426]" />
      <div className="flex min-h-24 w-full flex-wrap items-center justify-center gap-1 rounded-b-[3rem] rounded-t-md border-4 border-[#6b4426] bg-white p-3 text-center text-3xl font-extrabold text-mov-inchis shadow sm:text-4xl">
        {text && <TextMate text={text} />}{children}
      </div>
    </div>
  );
}

function Balanta({ itemi, rez, vieti, onGata, onGreseala, onCorect }: PropsJoc & { vieti: number }) {
  const it = itemi[rez.length];
  const [gresite, setGresite] = useState<string[]>([]);
  const [stare, setStare] = useState<"ok" | "arata" | null>(null);
  const [puse, setPuse] = useState<number[]>([]);
  const [clatina, setClatina] = useState(false);
  const start = useRef(Date.now());
  useEffect(() => { setGresite([]); setStare(null); setPuse([]); start.current = Date.now(); }, [it?.id]);
  if (!it) return null;
  const raspunde = (v: string) => {
    if (stare) return;
    if (verificaC2(it, v)) {
      setStare("ok");
      onCorect();
      setTimeout(() => onGata({ id: it.id, dat: v, corect: true, incercari: gresite.length + 1, timpMs: Date.now() - start.current, greseli: gresite }), 900);
      return;
    }
    const g = [...gresite, v];
    setGresite(g);
    setClatina(true);
    setTimeout(() => setClatina(false), 500);
    onGreseala();
    if ((!vieti && g.length >= 2) || (it.echilibru && g.length >= 3)) {
      setStare("arata");
      setTimeout(() => onGata({ id: it.id, dat: v, corect: false, incercari: g.length, timpMs: Date.now() - start.current, greseli: g }), 1900);
    }
  };
  const suma = puse.reduce((a, b) => a + b, 0);
  const tinta = it.echilibru ? Number(it.afis) : 0;
  // înclinarea: spre partea mai grea (la „echilibrează”, după greutățile puse)
  const semn = it.echilibru ? (suma < tinta ? "<" : suma > tinta ? ">" : "=") : stare ? it.afis : null;
  const unghi = semn === "<" ? 1 : semn === ">" ? -1 : 0;
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-4">
      {it.echilibru && <p className="rounded-2xl bg-white px-5 py-2 text-2xl font-extrabold text-mov-inchis shadow">⚖️ Echilibrează balanța! <button type="button" onClick={() => vorbeste("Echilibrează balanța! Pune greutăți pe talerul din stânga.")} className="ml-1 h-11 w-11 rounded-full bg-galben text-xl" aria-label="Ascultă">🔊</button></p>}
      <div className={`relative w-full max-w-3xl pt-8 ${clatina ? "animate-[scutura_0.4s]" : ""}`} aria-label="Balanța">
        <div className="mx-auto h-4 w-[88%] rounded-full bg-[#6b4426] transition-transform duration-500 motion-reduce:transition-none" style={{ transform: `rotate(${unghi * 6}deg)` }} />
        <div className="flex justify-between px-[2%]">
          <Taler jos={-unghi * 24} text={it.echilibru ? undefined : it.st}>
            {it.echilibru && <><span>{it.st!.split(" + ")[0]} +</span>{puse.length ? puse.map((g, i) => (
              <button key={i} type="button" onClick={() => !stare && setPuse((p) => p.filter((_, j) => j !== i))} className="rounded-lg bg-galben px-2 py-0.5 text-2xl shadow" aria-label={`Scoate greutatea ${g}`}>{g}</button>
            )) : <span className="text-gray-300">□</span>}</>}
          </Taler>
          <div className="mt-2 flex flex-col items-center">
            <span className="rounded-full bg-galben px-4 py-1 text-3xl font-extrabold text-mov-inchis shadow">{it.echilibru ? (suma === tinta && stare === "ok" ? "=" : "?") : stare ? it.afis : "?"}</span>
            <div className="h-28 w-3 bg-[#8b5e3c]" /><div className="h-4 w-32 rounded-full bg-[#8b5e3c]" />
          </div>
          <Taler jos={unghi * 24} text={it.dr} />
        </div>
      </div>
      {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis" role="status">Răspunsul: {it.afis}</p>}
      {gresite.length >= 1 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
      {!stare && !it.echilibru && (
        <div className="grid w-full max-w-xl grid-cols-3 gap-3">
          {["<", "=", ">"].map((v) => (
            <button key={v} type="button" disabled={gresite.includes(v)} onClick={() => raspunde(v)}
              className={`h-24 rounded-3xl text-6xl font-extrabold shadow transition active:scale-95 ${gresite.includes(v) ? "bg-red-100 text-red-400" : "bg-white text-mov-inchis ring-4 ring-mov/20 hover:bg-mov-deschis"}`} aria-label={v === "<" ? "mai mic" : v === ">" ? "mai mare" : "egal"}>{v}</button>
          ))}
        </div>
      )}
      {!stare && it.echilibru && (
        <div className="flex w-full max-w-2xl flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            {GREUTATI.map((g) => <button key={g} type="button" onClick={() => setPuse((p) => [...p, g].slice(0, 20))} className="h-16 min-w-16 rounded-2xl bg-galben px-3 text-2xl font-extrabold text-mov-inchis shadow active:scale-95" aria-label={`Pune greutatea ${g}`}>{g}</button>)}
          </div>
          <p className="text-lg text-gray-600">Pe taler: <b className="text-mov-inchis">{suma}</b></p>
          <button type="button" disabled={!puse.length} onClick={() => raspunde(String(suma))} className="h-tinta w-full max-w-sm rounded-2xl bg-mov text-2xl font-extrabold text-white shadow disabled:opacity-40">Verifică ✓</button>
        </div>
      )}
    </section>
  );
}

// ───────────────────────── T8: Ordonează ─────────────────────────

function Ordonare({ itemi, rez, onGata, onGreseala, onCorect }: PropsJoc) {
  const it = itemi[rez.length];
  const [puse, setPuse] = useState<string[]>([]);
  const [scutura, setScutura] = useState<string | null>(null);
  const greseli = useRef<string[]>([]);
  const start = useRef(Date.now());
  useEffect(() => { setPuse([]); greseli.current = []; start.current = Date.now(); }, [it?.id]);
  if (!it || it.raspuns.tip !== "ordine") return null;
  const corect = it.raspuns.corect;
  const atinge = (c: string) => {
    if (puse.includes(c) || puse.length >= corect.length) return;
    if (c === corect[puse.length]) {
      const p = [...puse, c];
      setPuse(p);
      if (p.length === corect.length) {
        onCorect();
        setTimeout(() => onGata({ id: it.id, dat: p.join("|"), corect: true, incercari: 1 + greseli.current.length, timpMs: Date.now() - start.current, greseli: greseli.current }), 800);
      }
    } else {
      greseli.current.push(c);
      setScutura(c);
      setTimeout(() => setScutura(null), 350);
      onGreseala();
    }
  };
  const cresc = it.sens === "crescator";
  return (
    <section className="mt-4 flex flex-1 flex-col items-center gap-5">
      <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-3 shadow">
        <span className="text-5xl" aria-hidden>{cresc ? "↗️" : "↘️"}</span>
        <span className="text-3xl font-extrabold text-mov-inchis">{/^\d+$/.test(corect[0]) ? (cresc ? "De la mic la mare" : "De la mare la mic") : cresc ? "În ordinea din calendar" : "În ordine inversă"}</span>
        <span className="text-4xl" aria-hidden>{cresc ? "📶" : "🪜"}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {it.cartonase!.map((c) => {
          const pus = puse.includes(c);
          return (
            <button key={c} type="button" onClick={() => atinge(c)} disabled={pus}
              className={`h-24 min-w-28 rounded-3xl px-4 text-3xl font-extrabold shadow transition active:scale-95 ${pus ? "opacity-20" : scutura === c ? "animate-[scutura_0.3s] bg-red-100 text-red-700" : "bg-white text-mov-inchis ring-4 ring-mov/20 hover:bg-mov-deschis"}`}>
              {c}
            </button>
          );
        })}
      </div>
      <div className="flex min-h-28 w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-mov/30 p-3">
        {corect.map((_, i) => (
          <span key={i} className={`flex h-20 min-w-24 flex-col items-center justify-center rounded-2xl px-3 text-2xl font-extrabold ${puse[i] ? "bg-green-100 text-green-800" : "bg-mov-deschis text-mov/40"}`}>
            <span className="text-xs font-bold">{i + 1}</span>{puse[i] ?? "?"}
          </span>
        ))}
      </div>
      {greseli.current.length >= 2 && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
    </section>
  );
}

// ───────────────────────── încercări comune (Ceas, Magazin) ─────────────────────────

/** Răspuns cu încercări: corect → următorul; greșit → −1 inimă, a doua oară indiciu, a treia (sau fără inimi, a doua) arată răspunsul. */
function useIncercari(it: ItemC2 | undefined, vieti: number, { onGata, onGreseala, onCorect }: Pick<PropsJoc, "onGata" | "onGreseala" | "onCorect">) {
  const [gresite, setGresite] = useState<string[]>([]);
  const [stare, setStare] = useState<"ok" | "arata" | null>(null);
  const start = useRef(Date.now());
  useEffect(() => { setGresite([]); setStare(null); start.current = Date.now(); }, [it?.id]);
  const raspunde = (v: string) => {
    if (!it || stare) return false;
    if (verificaC2(it, v)) {
      setStare("ok");
      onCorect();
      setTimeout(() => onGata({ id: it.id, dat: v, corect: true, incercari: gresite.length + 1, timpMs: Date.now() - start.current, greseli: gresite }), 900);
      return true;
    }
    const g = [...gresite, v];
    setGresite(g);
    onGreseala();
    if (g.length >= (vieti ? 3 : 2)) {
      setStare("arata");
      setTimeout(() => onGata({ id: it.id, dat: v, corect: false, incercari: g.length, timpMs: Date.now() - start.current, greseli: g }), 2000);
    }
    return false;
  };
  return { gresite, stare, raspunde };
}

// ───────────────────────── T10: Ceasul ─────────────────────────

function Sageti({ eticheta, sus, jos }: { eticheta: string; sus: () => void; jos: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold text-mov-inchis">{eticheta}</span>
      <button type="button" onClick={sus} className="h-16 w-20 rounded-2xl bg-white text-3xl font-extrabold text-mov shadow ring-2 ring-mov/20 active:scale-95" aria-label={`${eticheta}: înainte`}>▲</button>
      <button type="button" onClick={jos} className="h-16 w-20 rounded-2xl bg-white text-3xl font-extrabold text-mov shadow ring-2 ring-mov/20 active:scale-95" aria-label={`${eticheta}: înapoi`}>▼</button>
    </div>
  );
}

function CeasJoc({ itemi, rez, vieti, onGata, onGreseala, onCorect }: PropsJoc & { vieti: number }) {
  const it = itemi[rez.length];
  const { gresite, stare, raspunde } = useIncercari(it, vieti, { onGata, onGreseala, onCorect });
  const [ore, setOre] = useState(12);
  const [min, setMin] = useState(0);
  const [clipire, setClipire] = useState(false);
  useEffect(() => { setOre(12); setMin(0); }, [it?.id]);
  const variante = useMemo(() => (it ? new Rng(it.cheie.length * 17 + rez.length).shuffle([it.afis, ...it.distractori.map((d) => d.v)]) : []), [it, rez.length]);
  if (!it) return null;
  if (it.modCeas === "muta") {
    const r = it.raspuns as { ore: number; minute: number };
    const arata = stare === "arata";
    const verifica = () => {
      if (!raspunde(`${ore}:${min}`)) { setClipire(true); setTimeout(() => { setClipire(false); if (!arata) { setOre(12); setMin(0); } }, 500); }
    };
    return (
      <section className="mt-3 flex flex-1 flex-col items-center gap-3">
        <p className="rounded-3xl bg-white px-6 py-3 text-3xl font-extrabold text-mov-inchis shadow">🕒 {it.text}</p>
        <div className={`flex flex-wrap items-center justify-center gap-6 ${clipire ? "animate-[scutura_0.4s]" : ""}`}>
          <Sageti eticheta="Ora" sus={() => setOre((h) => (h % 12) + 1)} jos={() => setOre((h) => (h === 1 ? 12 : h - 1))} />
          <div className={`rounded-full p-2 ${stare === "ok" ? "bg-green-200" : "bg-white"} shadow-lg`}><Ceas ore={arata ? r.ore : ore} minute={arata ? r.minute : min} marime={2.1} /></div>
          <Sageti eticheta="Minutarul" sus={() => setMin((m) => (m + 15) % 60)} jos={() => setMin((m) => (m + 45) % 60)} />
        </div>
        {gresite.length >= 1 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 Minutarul (acul lung, mov): sus = fix, jos = jumătate.{gresite.length >= 2 ? ` ${it.indiciu}` : ""}</p>}
        {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis">Așa arată {it.afis}.</p>}
        {!stare && <button type="button" onClick={verifica} className="h-tinta w-full max-w-sm rounded-2xl bg-mov text-2xl font-extrabold text-white shadow">Verifică ✓</button>}
      </section>
    );
  }
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-4">
      <div className={`rounded-full p-2 shadow-lg ${stare === "ok" ? "bg-green-200" : "bg-white"}`}>{it.vizual && <VizualC2View v={it.vizual} marime={1.7} />}</div>
      {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis">Ceasul arată {it.afis}.</p>}
      {gresite.length >= 2 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
      {!stare && (
        <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {variante.map((v) => (
            <button key={v} type="button" disabled={gresite.includes(v)} onClick={() => raspunde(v)}
              className={`min-h-tinta rounded-2xl px-3 text-2xl font-extrabold shadow active:scale-95 ${gresite.includes(v) ? "bg-red-100 text-red-400 line-through" : "bg-white text-mov-inchis ring-2 ring-mov/20 hover:bg-mov-deschis"}`}>{v}</button>
          ))}
        </div>
      )}
    </section>
  );
}

// ───────────────────────── T11: Magazinul ─────────────────────────

function Magazin({ itemi, rez, nivel, vieti, onGata, onGreseala, onCorect }: PropsJoc & { nivel: NivelC2; vieti: number }) {
  const it = itemi[rez.length];
  const { gresite, stare, raspunde } = useIncercari(it, vieti, { onGata, onGreseala, onCorect });
  const [tejghea, setTejghea] = useState<number[]>([]);
  const [scutura, setScutura] = useState(false);
  useEffect(() => setTejghea([]), [it?.id]);
  const variante = useMemo(() => (it ? new Rng(it.cheie.length * 23 + rez.length).shuffle([it.afis, ...it.distractori.slice(0, 3).map((d) => d.v)]) : []), [it, rez.length]);
  if (!it || !it.magazin) return null;
  const g = it.magazin;
  const portofel = nivel === "usor" ? [100, 500, 1000] : nivel === "mediu" ? [50, 100, 500, 1000, 5000] : [...MONEDE, ...BANCNOTE];
  const suma = tejghea.reduce((a, b) => a + b, 0);
  const greseala = () => { setScutura(true); setTimeout(() => setScutura(false), 400); };
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-4">
      {g.mod !== "numara" && (
        <div className="flex items-center gap-4 rounded-3xl bg-white px-6 py-3 shadow">
          <span className="text-6xl" aria-hidden>{g.emoji}</span>
          <span className="text-left">
            <span className="block text-xl text-gray-600">{g.produs}</span>
            <span className="block rounded-xl bg-galben px-3 py-1 text-2xl font-extrabold text-mov-inchis">{textBani(g.pret!)}</span>
          </span>
          {g.mod === "rest" && <span className="ml-2 flex flex-col items-center text-lg text-gray-600">Plătești cu<BanDesen v={g.platit!} marime={1.2} /></span>}
        </div>
      )}
      {g.mod === "numara" && (
        <>
          <p className="rounded-3xl bg-white px-6 py-2 text-3xl font-extrabold text-mov-inchis shadow">{it.text}</p>
          <div className="rounded-3xl bg-[#f3e6cf] p-4 shadow-inner"><GramadaBani bani={g.bani!} marime={1.2} /></div>
          {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis">Sunt {it.afis}.</p>}
          {gresite.length >= 1 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
          {!stare && (
            <div className="grid w-full max-w-2xl grid-cols-2 gap-3">
              {variante.map((v) => <button key={v} type="button" disabled={gresite.includes(v)} onClick={() => raspunde(v)} className={`min-h-tinta rounded-2xl px-3 text-xl font-extrabold shadow active:scale-95 ${gresite.includes(v) ? "bg-red-100 text-red-400 line-through" : "bg-white text-mov-inchis ring-2 ring-mov/20 hover:bg-mov-deschis"}`}>{v}</button>)}
            </div>
          )}
        </>
      )}
      {g.mod === "plateste" && (
        <>
          <p className="text-2xl font-extrabold text-mov-inchis">Plătește exact! <span className="text-gray-500">Atinge banii din portofel.</span></p>
          <div className={`flex min-h-28 w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-3xl border-4 p-3 ${stare === "ok" ? "border-green-400 bg-green-50" : "border-dashed border-[#8b5e3c]/40 bg-[#f3e6cf]"} ${scutura ? "animate-[scutura_0.4s]" : ""}`} aria-label="Tejgheaua">
            {tejghea.length ? tejghea.map((v, i) => <button key={i} type="button" disabled={!!stare} onClick={() => setTejghea((t) => t.filter((_, j) => j !== i))} aria-label="Întoarce în portofel"><BanDesen v={v} /></button>) : <span className="text-lg text-gray-500">Tejgheaua e goală</span>}
          </div>
          <p className="text-xl text-gray-700">Pe tejghea: <b className="text-mov-inchis">{suma ? textBani(suma) : "0 lei"}</b></p>
          {gresite.length >= 1 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
          {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-xl font-bold text-mov-inchis">De exemplu: <span className="inline-flex flex-wrap gap-1 align-middle">{[...BANCNOTE, ...MONEDE].sort((a, b) => b - a).reduce<number[]>((acc, v) => { let r = g.pret! - acc.reduce((x, y) => x + y, 0); while (r >= v) { acc.push(v); r -= v; } return acc; }, []).map((v, i) => <BanDesen key={i} v={v} marime={0.7} />)}</span></p>}
          {!stare && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-white p-3 shadow" aria-label="Portofelul">
                {portofel.map((v) => <button key={v} type="button" onClick={() => setTejghea((t) => [...t, v].slice(0, 20))} className="rounded-xl p-1 transition hover:bg-mov-deschis active:scale-95"><BanDesen v={v} marime={1.1} /></button>)}
              </div>
              <button type="button" disabled={!suma} onClick={() => { if (!raspunde(String(suma))) { greseala(); setTejghea([]); } }} className="h-tinta w-full max-w-sm rounded-2xl bg-mov text-2xl font-extrabold text-white shadow disabled:opacity-40">Plătesc 🛒</button>
            </>
          )}
        </>
      )}
      {g.mod === "rest" && (
        <>
          <p className="text-2xl font-extrabold text-mov-inchis">Cât rest primești? <span className="text-gray-500">({g.inBani ? "în bani" : "în lei"})</span></p>
          {gresite.length >= 1 && !stare && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
          {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis">Restul: {it.afis} {g.inBani ? "bani" : "lei"}</p>}
          {stare === "ok" && <p className="rounded-2xl bg-green-100 px-6 py-2 text-3xl font-extrabold text-green-800">✓</p>}
          {!stare && <IntrareNumar key={gresite.length} onRaspuns={(v) => raspunde(v)} scutura={gresite.length > 0} />}
        </>
      )}
      {stare === "ok" && g.mod !== "rest" && <p className="rounded-2xl bg-green-100 px-6 py-2 text-3xl font-extrabold text-green-800" role="status">✓ {g.mod === "plateste" ? "🛒" : ""}</p>}
    </section>
  );
}

// ───────────────────────── T12: Provocarea în imagini ─────────────────────────

const OPERATII = ["+", "−", "×", ":"] as const;

function BaraModel({ m, arata }: { m: NonNullable<ItemC2["model"]>; arata: boolean }) {
  const W = 520;
  const segment = (x: number, w: number, fill: string, text: string, k: string) => (
    <g key={k}><rect x={x} y={20} width={w} height={44} rx={6} fill={fill} stroke="#4f4183" strokeWidth={2} /><text x={x + w / 2} y={48} textAnchor="middle" fontSize={18} fontWeight={800} fill="#2a2150">{text}</text></g>
  );
  let parti: React.ReactNode[] = [], total = "?";
  if (m.tip === "plus") { const t = m.a + m.b; parti = [segment(0, (W * m.a) / t, "#c9b6f2", String(m.a), "a"), segment((W * m.a) / t, (W * m.b) / t, "#ffe58a", String(m.b), "b")]; total = arata ? String(t) : "?"; }
  if (m.tip === "minus") { const r = m.a - m.b; parti = [segment(0, (W * m.b) / m.a, "#ffc59a", String(m.b), "b"), segment((W * m.b) / m.a, (W * r) / m.a, "#c8e6c9", arata ? String(r) : "?", "r")]; total = String(m.a); }
  if (m.tip === "grupe") { parti = Array.from({ length: m.a }, (_, i) => segment((W / m.a) * i, W / m.a, i % 2 ? "#c9b6f2" : "#d9ccf7", String(m.b), String(i))); total = arata ? String(m.a * m.b) : "?"; }
  if (m.tip === "imparte") { parti = Array.from({ length: m.b }, (_, i) => segment((W / m.b) * i, W / m.b, i % 2 ? "#c8e6c9" : "#dcedc8", arata ? String(m.a / m.b) : "?", String(i))); total = String(m.a); }
  return (
    <svg viewBox={`-4 0 ${W + 8} 100`} className="w-full max-w-xl" role="img" aria-label="Bara-model: părțile și întregul">
      {parti}
      <path d={`M0 72 Q0 82 10 82 H${W / 2 - 10} L${W / 2} 92 L${W / 2 + 10} 82 H${W - 10} Q${W} 82 ${W} 72`} fill="none" stroke="#4f4183" strokeWidth={2} />
      <text x={W / 2} y={100} textAnchor="middle" fontSize={16} fontWeight={800} fill="#4f4183">{total}</text>
    </svg>
  );
}

function Provocare({ itemi, rez, vieti, onGata, onGreseala, onCorect }: PropsJoc & { vieti: number }) {
  const it = itemi[rez.length];
  const [pas, setPas] = useState(0);
  const [faza, setFaza] = useState<"op" | "rezultat">("op");
  const [opGresite, setOpGresite] = useState<string[]>([]);
  const [valGresite, setValGresite] = useState<string[]>([]);
  const [stare, setStare] = useState<"ok" | "arata" | null>(null);
  const start = useRef(Date.now());
  const montat = useMontat();
  useEffect(() => { setPas(0); setFaza("op"); setOpGresite([]); setValGresite([]); setStare(null); start.current = Date.now(); }, [it?.id]);
  if (!it || !it.pasi) return null;
  const p = it.pasi[pas];
  const termina = (corect: boolean, dat: string) => onGata({ id: it.id, dat, corect, incercari: 1 + valGresite.length, timpMs: Date.now() - start.current, greseli: [...opGresite.map((o) => `operația ${o}`), ...valGresite] });
  const alegeOp = (o: string) => {
    if (o === p.op) { setFaza("rezultat"); setOpGresite((g) => g); return; }
    // greșeala la operație nu costă o inimă: bara-model se completează ca indiciu
    setOpGresite((g) => [...g, o]);
  };
  const scrie = (v: string) => {
    if (Number(v) === p.valoare) {
      onCorect();
      if (pas + 1 < it.pasi!.length) { setPas(pas + 1); setFaza("op"); return; }
      setStare("ok");
      setTimeout(() => termina(true, v), 900);
      return;
    }
    const g = [...valGresite, v];
    setValGresite(g);
    onGreseala();
    if (g.length >= (vieti ? 3 : 2)) { setStare("arata"); setTimeout(() => onGata({ id: it.id, dat: v, corect: false, incercari: g.length, timpMs: Date.now() - start.current, greseli: g }), 2200); }
  };
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-3">
      <div className="flex w-full max-w-3xl items-center gap-3 rounded-3xl bg-white p-4 shadow">
        <span className="text-6xl" aria-hidden>{it.emoji}</span>
        <p className="flex-1 text-2xl font-bold text-mov-inchis">{it.text}</p>
        {montat && <button type="button" onClick={() => vorbeste(it.text)} className="h-12 w-12 shrink-0 rounded-full bg-galben text-2xl" aria-label="Ascultă problema">🔊</button>}
      </div>
      {it.model && <div className={`w-full max-w-xl rounded-2xl transition ${opGresite.length > 0 && !stare ? "bg-galben-deschis ring-4 ring-galben" : ""}`}><BaraModel m={it.model} arata={stare === "arata"} /></div>}
      {it.pasi.length > 1 && <p className="rounded-full bg-mov-deschis px-4 py-1 font-bold text-mov">Pasul {pas + 1} din {it.pasi.length}</p>}
      <p className="text-2xl font-extrabold text-mov-inchis">{p.intrebare}</p>
      {stare === "ok" && <p className="rounded-2xl bg-green-100 px-6 py-2 text-3xl font-extrabold text-green-800" role="status">✓ {it.afis}</p>}
      {stare === "arata" && <p className="rounded-2xl bg-galben-deschis px-6 py-2 text-2xl font-bold text-mov-inchis" role="status">Răspunsul: {p.valoare}</p>}
      {!stare && faza === "op" && (
        <>
          <p className="text-lg text-gray-600">Ce operație facem?</p>
          <div className="grid grid-cols-4 gap-3">
            {OPERATII.map((o) => <button key={o} type="button" disabled={opGresite.includes(o)} onClick={() => alegeOp(o)} className={`h-20 w-20 rounded-3xl text-5xl font-extrabold shadow active:scale-95 ${opGresite.includes(o) ? "bg-red-100 text-red-300" : "bg-white text-mov-inchis ring-4 ring-mov/20"}`} aria-label={`operația ${o}`}>{o}</button>)}
          </div>
          {opGresite.length > 0 && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 Uită-te la bară: {it.indiciu}</p>}
        </>
      )}
      {!stare && faza === "rezultat" && (
        <>
          <p className="text-lg text-gray-600">Operația: <b className="text-3xl text-mov">{p.op}</b> · Cât face?</p>
          {valGresite.length > 0 && <p className="max-w-xl rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis" role="status">💡 {it.indiciu}</p>}
          <IntrareNumar key={`${pas}-${valGresite.length}`} onRaspuns={scrie} scutura={valGresite.length > 0} />
        </>
      )}
    </section>
  );
}

// ───────────────────────── T9: Integrama ─────────────────────────

const LITERE_TASTE = "AĂÂBCDEFGHIÎJKLMNOPQRSȘTȚUVWXYZ".split("");

function IntegramaJoc({ itemi, rez, onGata, onGreseala, onCorect }: PropsJoc) {
  const rezolvate = new Map(rez.map((r) => [r.id, r]));
  const grupe = [...new Set(itemi.map((i) => i.integrama!.grup))];
  const grup = grupe.find((g) => itemi.some((i) => i.integrama!.grup === g && !rezolvate.has(i.id))) ?? grupe[grupe.length - 1];
  const cuv = itemi.filter((i) => i.integrama!.grup === grup);
  const q0 = cuv[0]?.integrama;
  const [sel, setSel] = useState<string | null>(null);
  const [litere, setLitere] = useState<Record<string, string>>({});
  const [gresite, setGresite] = useState<Record<string, string[]>>({});
  const [scutura, setScutura] = useState(false);
  const [cursor, setCursor] = useState(0);
  const start = useRef(Date.now());
  useEffect(() => { setSel(null); setLitere({}); setCursor(0); start.current = Date.now(); }, [grup]);
  useEffect(() => setCursor(0), [sel]);
  if (!q0) return null;
  const celuleDe = (it: ItemC2) => { const q = it.integrama!; const w = (it.raspuns as { valoare: string }).valoare; return Array.from({ length: w.length }, (_, k) => `${q.r + (q.dir === "v" ? k : 0)},${q.c + (q.dir === "o" ? k : 0)}`); };
  const harta = new Map<string, { litera: string; nr?: number }>();
  cuv.forEach((it) => celuleDe(it).forEach((k, i) => { const e = harta.get(k) ?? { litera: (it.raspuns as { valoare: string }).valoare[i] }; if (i === 0) e.nr = it.integrama!.nr; harta.set(k, e); }));
  const ales = cuv.find((i) => i.id === sel) ?? cuv.find((i) => !rezolvate.has(i.id));
  const celuleAles = ales ? celuleDe(ales) : [];
  const corecte = new Set(cuv.filter((i) => rezolvate.get(i.id)?.corect).flatMap(celuleDe));
  const aratate = new Set(cuv.filter((i) => rezolvate.has(i.id) && !rezolvate.get(i.id)!.corect).flatMap(celuleDe));
  const valoareCelula = (k: string) => (corecte.has(k) || aratate.has(k) ? harta.get(k)!.litera : litere[k] ?? "");
  const blocat = (k: string) => corecte.has(k) || aratate.has(k);
  /** Cursorul merge pe tot cuvântul: literele fixate (din cuvinte rezolvate) se sar; dacă copilul le tastează și pe ele, sunt „consumate”. */
  const tasta = (l: string) => {
    if (!ales || rezolvate.has(ales.id)) return;
    let i = cursor;
    while (i < celuleAles.length && blocat(celuleAles[i])) {
      if (harta.get(celuleAles[i])!.litera === l) { setCursor(i + 1); return; }
      i++;
    }
    if (i >= celuleAles.length) return;
    const k = celuleAles[i];
    setLitere((x) => ({ ...x, [k]: l }));
    setCursor(i + 1);
  };
  const sterge = () => {
    if (!ales) return;
    let i = Math.min(cursor, celuleAles.length) - 1;
    while (i >= 0 && blocat(celuleAles[i])) i--;
    if (i < 0) return;
    const k = celuleAles[i];
    setLitere((x) => { const n = { ...x }; delete n[k]; return n; });
    setCursor(i);
  };
  const verifica = () => {
    if (!ales || rezolvate.has(ales.id)) return;
    const dat = celuleAles.map(valoareCelula).join("");
    if (dat.length < celuleAles.length) return;
    if (verificaC2(ales, dat)) {
      onCorect();
      onGata({ id: ales.id, dat, corect: true, incercari: 1 + (gresite[ales.id]?.length ?? 0), timpMs: Date.now() - start.current, greseli: gresite[ales.id] ?? [] });
      setSel(null);
      setCursor(0);
      return;
    }
    const g = [...(gresite[ales.id] ?? []), dat];
    setGresite((x) => ({ ...x, [ales.id]: g }));
    setScutura(true); setTimeout(() => setScutura(false), 400);
    onGreseala();
    // literele greșite (care nu sunt în încrucișări corecte) se șterg
    setLitere((x) => { const n = { ...x }; celuleAles.forEach((k) => { if (!corecte.has(k)) delete n[k]; }); return n; });
    setCursor(0);
    if (g.length >= 3) onGata({ id: ales.id, dat, corect: false, incercari: g.length, timpMs: Date.now() - start.current, greseli: g });
  };
  const C = 40;
  return (
    <section className="mt-3 grid flex-1 gap-4 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-3">
        <div className={`relative rounded-xl bg-white p-2 shadow ${scutura ? "animate-[scutura_0.4s]" : ""}`} style={{ width: q0.cols * C + 16, height: q0.rows * C + 16 }}>
          {[...harta.entries()].map(([k, e]) => {
            const [r, c] = k.split(",").map(Number);
            const inAles = celuleAles.includes(k);
            return (
              <button key={k} type="button" onClick={() => { const w = cuv.find((i) => celuleDe(i).includes(k) && !rezolvate.has(i.id)); if (w) setSel(w.id); }}
                className={`absolute flex items-center justify-center border-2 text-xl font-extrabold ${corecte.has(k) ? "border-green-500 bg-green-100 text-green-800" : aratate.has(k) ? "border-galben bg-galben-deschis text-mov-inchis" : inAles ? "border-mov bg-mov-deschis text-mov-inchis" : "border-mov/30 bg-white text-mov-inchis"}`}
                style={{ left: 8 + c * C, top: 8 + r * C, width: C - 2, height: C - 2 }} aria-label={`Căsuța ${r + 1}, ${c + 1}`}>
                {e.nr && <span className="absolute left-0.5 top-0 text-[10px] font-bold text-mov">{e.nr}</span>}{valoareCelula(k)}
              </button>
            );
          })}
        </div>
        <div className="grid max-w-md grid-cols-8 gap-1">
          {LITERE_TASTE.map((l) => <button key={l} type="button" onClick={() => tasta(l)} className={`h-12 rounded-xl text-xl font-extrabold shadow-sm active:scale-95 ${"ĂÂÎȘȚ".includes(l) ? "bg-galben text-mov-inchis" : "bg-white text-mov-inchis ring-1 ring-mov/20"}`}>{l}</button>)}
          <button type="button" onClick={sterge} className="col-span-2 h-12 rounded-xl bg-mov-deschis text-2xl font-bold text-mov" aria-label="Șterge">⌫</button>
        </div>
        <button type="button" onClick={verifica} className="h-tinta w-full max-w-sm rounded-2xl bg-mov text-2xl font-extrabold text-white shadow">Verifică ✓</button>
        {!q0.diacritice && <p className="text-sm text-gray-500">Poți scrie și fără diacritice.</p>}
      </div>
      <div className="grid content-start gap-3">
        {(["o", "v"] as const).map((d) => (
          <div key={d} className="rounded-2xl bg-white p-3 shadow">
            <h3 className="text-xl font-extrabold text-mov">{d === "o" ? "Orizontal →" : "Vertical ↓"}</h3>
            <ul className="mt-1 grid gap-1">
              {cuv.filter((i) => i.integrama!.dir === d).sort((a, b) => a.integrama!.nr - b.integrama!.nr).map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => !rezolvate.has(i.id) && setSel(i.id)} className={`w-full rounded-xl px-3 py-2 text-left text-xl font-bold ${rezolvate.get(i.id)?.corect ? "bg-green-100 text-green-800" : ales?.id === i.id ? "bg-mov-deschis text-mov-inchis ring-2 ring-mov" : "text-mov-inchis hover:bg-mov-deschis"}`}>
                    {i.integrama!.nr}. <TextMate text={i.text.split(": ").slice(1).join(": ")} />{rezolvate.get(i.id)?.corect && " ✓"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {ales && gresite[ales.id]?.length ? <p className="rounded-2xl bg-galben-deschis px-4 py-2 text-lg text-mov-inchis">💡 {ales.indiciu}</p> : null}
      </div>
    </section>
  );
}

// ───────────────────────── T4: Ținte ─────────────────────────

function Tinte({ itemi, rez, nivel, onGata, onGreseala, onCorect }: PropsJoc & { nivel: NivelC2 }) {
  const it = itemi[rez.length];
  const [lovite, setLovite] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  const greseli = useRef<string[]>([]);
  const start = useRef(Date.now());
  const tinte = useMemo(() => (it ? new Rng(rez.length * 131 + it.cheie.length).shuffle([it.afis, ...it.distractori.slice(0, 4).map((d) => d.v)]) : []), [it, rez.length]);
  useEffect(() => { setLovite([]); setOk(false); greseli.current = []; start.current = Date.now(); }, [it?.id]);
  if (!it) return null;
  const durata = 900 / VITEZA_TINTE[nivel];
  const atinge = (v: string) => {
    if (ok || lovite.includes(v)) return;
    if (verificaC2(it, v)) {
      setOk(true);
      onCorect();
      setTimeout(() => onGata({ id: it.id, dat: v, corect: true, incercari: 1 + greseli.current.length, timpMs: Date.now() - start.current, greseli: greseli.current }), 600);
    } else {
      greseli.current.push(v);
      setLovite((x) => [...x, v]);
      onGreseala();
    }
  };
  return (
    <section className="mt-3 flex flex-1 flex-col items-center gap-3">
      <div className="relative h-56 w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 to-emerald-200 shadow-inner" aria-label="Râul cu ținte">
        <div className="absolute inset-x-0 bottom-0 h-16 bg-sky-400/60" />
        {tinte.map((v, i) => {
          const gresit = lovite.includes(v), bun = ok && v === it.afis;
          return (
            <button key={v} type="button" onClick={() => atinge(v)} disabled={gresit}
              className={`tinta absolute top-10 flex h-28 w-28 items-center justify-center rounded-full border-8 text-2xl font-extrabold shadow-lg ${gresit ? "translate-y-24 border-gray-400 bg-gray-300 text-gray-500 opacity-0 transition duration-500" : bun ? "border-green-600 bg-green-300 text-white" : "border-red-500 bg-white text-mov-inchis"}`}
              style={{ animationDuration: `${durata}s`, animationDelay: `${-(i * durata) / tinte.length}s`, animationPlayState: ok ? "paused" : "running" }}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-500"><TextMate text={v} /></span>
            </button>
          );
        })}
      </div>
      <div className="w-full max-w-2xl rounded-3xl bg-white p-4 text-center shadow-md">
        {it.vizual && <VizualC2View v={it.vizual} marime={0.8} />}
        <p className="text-3xl font-extrabold text-mov-inchis"><TextMate text={it.text} /></p>
      </div>
    </section>
  );
}

// ───────────────────────── T2: Memorie ─────────────────────────

/* eslint-disable @next/next/no-img-element */
function Memorie({ itemi, rez, nivel, onGata, onGreseala, onCorect, seed }: PropsJoc & { nivel: NivelC2; seed: number }) {
  const PE_TABLA = nivel === "provocare" ? 10 : 8;
  const nrTabla = Math.floor(rez.length / PE_TABLA);
  const carti = useMemo(() => new Rng(seed + nrTabla * 101).shuffle(itemi.slice(nrTabla * PE_TABLA, nrTabla * PE_TABLA + PE_TABLA).flatMap((it) => [
    { cheie: `${it.id}-st`, it, fata: "st" as const }, { cheie: `${it.id}-dr`, it, fata: "dr" as const },
  ])), [itemi, nrTabla, PE_TABLA, seed]);
  const [intoarse, setIntoarse] = useState<string[]>([]);
  const [rosii, setRosii] = useState<string[]>([]);
  const mutari = useRef<Record<string, number>>({});
  const start = useRef(Date.now());
  useEffect(() => { setIntoarse([]); start.current = Date.now(); }, [nrTabla]);
  const gasite = new Set(rez.map((r) => r.id));
  const atinge = (c: (typeof carti)[number]) => {
    if (gasite.has(c.it.id) || intoarse.includes(c.cheie) || intoarse.length >= 2) return;
    const noi = [...intoarse, c.cheie];
    setIntoarse(noi);
    if (noi.length < 2) return;
    const [a, b] = noi.map((k) => carti.find((x) => x.cheie === k)!);
    if (a.it.id === b.it.id) {
      onCorect();
      setTimeout(() => { onGata({ id: a.it.id, dat: "ok", corect: true, incercari: 1 + (mutari.current[a.it.id] ?? 0), timpMs: Date.now() - start.current, greseli: [] }); setIntoarse([]); }, 400);
    } else {
      mutari.current[a.it.id] = (mutari.current[a.it.id] ?? 0) + 1;
      mutari.current[b.it.id] = (mutari.current[b.it.id] ?? 0) + 1;
      setRosii(noi);
      onGreseala();
      setTimeout(() => { setIntoarse([]); setRosii([]); }, 1000);
    }
  };
  return (
    <section className={`mx-auto mt-4 grid w-full max-w-3xl gap-3 ${PE_TABLA === 10 ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-4"}`}>
      {carti.map((c) => {
        const gasit = gasite.has(c.it.id), vizibil = gasit || intoarse.includes(c.cheie);
        return (
          <button key={c.cheie} type="button" onClick={() => atinge(c)} aria-label={vizibil ? (c.fata === "st" ? c.it.st ?? c.it.text : c.it.afis) : "Carte întoarsă"}
            className={`flex aspect-[4/3] items-center justify-center rounded-2xl p-1 text-center text-xl font-extrabold shadow transition sm:text-2xl ${gasit ? "bg-green-100 text-green-800 ring-4 ring-green-400" : rosii.includes(c.cheie) ? "bg-red-50 text-mov-inchis ring-4 ring-red-400" : vizibil ? "bg-white text-mov-inchis ring-2 ring-mov/30" : "bg-mov hover:brightness-110"}`}>
            {vizibil ? (c.fata === "st" ? <FataSt it={c.it} marime={0.5} /> : <TextMate text={c.it.afis} />) : <img src="/brand/logo-mic.jpg" alt="" className="h-3/5 rounded-xl opacity-90" />}
          </button>
        );
      })}
    </section>
  );
}

// ───────────────────────── final ─────────────────────────

function Final({ puncte, mult, rez, itemi, terminat, mesaj, inapoi, onReia }: {
  puncte: ReturnType<typeof puncteaza>; mult: number; rez: RaspunsJocC2[]; itemi: ItemC2[]; terminat: boolean; mesaj?: string; inapoi: string; onReia?: () => void;
}) {
  useCelebrare(puncte.stele >= 2, puncte.stele === 3 ? "mare" : "mica");
  const [piesa, setPiesa] = useState(false);
  useEffect(() => { if (puncte.stele === 3 && terminat) setPiesa(deblocheazaPiesa()); }, [puncte.stele, terminat]);
  const m = puncte.medalie as Medalie;
  const timpMediu = rez.length ? Math.round(rez.reduce((s, r) => s + r.timpMs, 0) / rez.length / 100) / 10 : 0;
  const deExersat = itemi.filter((it) => rez.find((r) => r.id === it.id && (!r.corect || r.incercari > 1)));
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-center">
      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="text-8xl" aria-hidden>{m ? MEDALII[m].icon : "💪"}</div>
        <h1 className="mt-2 text-3xl font-extrabold text-mov">{m ? MEDALII[m].nume : terminat ? "Bravo!" : "Mai încercăm o dată? 💪"}</h1>
        <div className="mt-1 text-5xl">{[1, 2, 3].map((s) => <span key={s} className={s <= puncte.stele ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["⭐", `${Math.round(puncte.scor * mult)}`], ["✓", `${puncte.corecte}/${itemi.length}`], ["🎯", `${puncte.acuratete}%`], ["⏱", `${timpMediu} s`]].map(([a, b]) => (
            <div key={a} className="rounded-2xl bg-mov-deschis p-3"><dt className="text-2xl" aria-hidden>{a}</dt><dd className="text-2xl font-extrabold text-mov-inchis">{b}</dd></div>
          ))}
        </dl>
        {puncte.comboMax >= 3 && <p className="mt-3 text-xl font-bold text-portocaliu">🔥 ×{puncte.comboMax}</p>}
        {piesa && <p className="mt-3 rounded-2xl bg-galben-deschis px-4 py-2 text-xl font-bold text-mov-inchis">🧩 Ai câștigat o piesă de puzzle! <Link href="/elev/clasa2" className="underline">Vezi puzzle-ul</Link></p>}
        {mesaj && <p className="mt-3 rounded-xl bg-green-50 p-2 text-green-800">{mesaj}</p>}
        {deExersat.length > 0 && (
          <ul className="mt-4 grid gap-1 text-left">
            {deExersat.slice(0, 6).map((it) => <li key={it.id} className="rounded-xl bg-galben-deschis px-3 py-1.5 text-lg"><TextMate text={it.st ?? it.text} /> → <b><TextMate text={it.afis} /></b></li>)}
          </ul>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {onReia && <button type="button" onClick={onReia} className="min-h-tinta rounded-2xl bg-galben px-6 text-xl font-bold text-mov-inchis shadow">Încă o dată 💪</button>}
          <Link href={inapoi} className="flex min-h-tinta items-center rounded-2xl bg-mov px-6 text-xl font-bold text-white shadow">Înapoi</Link>
        </div>
      </div>
    </main>
  );
}
