"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Tastatura } from "@/jocuri/componente";
import { useCelebrare } from "@/jocuri/miscare";
import { Ceas, Fractie, Grupe, Numaratoare } from "@/componente/svg/Vizual";
import { TextMate } from "@/jocuri/c3/Vizuale";
import { MEDALII, puncteaza, type Medalie } from "@/motor/clasa3/generator";
import { verificaC2 } from "@/motor/clasa2/generator";
import { JOCURI_C2, NIVELURI_C2, VITEZA_BULE, type ConfigC2, type ItemC2, type NivelC2, type VizualC2 } from "@/motor/clasa2/tipuri";
import { Rng } from "@/motor/rng";
import { seteazaSunet, sunetActiv, sunetBland } from "@/antrenament/stare-client";

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
  const [vieti, setVieti] = useState<number>(cfg.vieti);
  const [final, setFinal] = useState<{ terminat: boolean; mesaj?: string } | null>(null);
  const [sunet, setSunet] = useState(false);
  const trimis = useRef(false);
  const montat = useMontat();
  useEffect(() => setSunet(sunetActiv()), []);
  const joc = JOCURI_C2[cfg.joc];
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
    if (!cfg.vieti) return;
    setVieti((v) => {
      const n = v - 1;
      if (n <= 0) setTimeout(() => setRez((r) => { termina(r, false); return r; }), 900);
      return n;
    });
  }, [cfg.vieti, termina]);
  const corect = useCallback(() => sunetBland(), []);

  if (!nivel) return <AlegeNivel joc={cfg.joc} inapoi={inapoi} onAlege={setNivel} />;
  if (final) return <Final puncte={puncte} mult={mult} rez={rez} itemi={itemi} terminat={final.terminat} mesaj={final.mesaj} inapoi={inapoi} onReia={onReia} />;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-3 pb-6 sm:px-6">
      <header className="sticky top-0 z-10 -mx-3 bg-[#fdf8ef]/95 px-3 pt-3 pb-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Link href={inapoi} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl text-mov shadow-sm" aria-label="Ieși din joc">✕</Link>
          <span className="text-3xl" aria-hidden>{joc.icon}</span>
          <h1 className="flex-1 truncate text-xl font-extrabold text-mov sm:text-2xl">{titlu ?? joc.nume}{eticheta && <span className="ml-2 rounded-full bg-galben px-2 py-0.5 text-xs text-mov-inchis">{eticheta}</span>}</h1>
          {cfg.vieti > 0 && <span className="text-2xl" aria-label={`${vieti} inimi`}>{Array.from({ length: cfg.vieti }, (_, i) => <span key={i} className={i < vieti ? "" : "opacity-20 grayscale"}>❤️</span>)}</span>}
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
      {cfg.joc === "perechi" && <Perechi itemi={itemi} rez={rez} onGata={gata} onGreseala={greseala} onCorect={corect} seed={cfg.seed} />}
      {cfg.joc === "bule" && <Bule itemi={itemi} rez={rez} nivel={nivel} onGata={gata} onGreseala={greseala} onCorect={corect} />}
      {cfg.joc === "scara" && <Scara itemi={itemi} rez={rez} mod={cfg.modScara} vieti={cfg.vieti} onGata={gata} onGreseala={greseala} onCorect={corect} />}
      {cfg.joc === "casute" && <Casute itemi={itemi} rez={rez} onGata={gata} onGreseala={greseala} onCorect={corect} />}
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

// ───────────────────────── final ─────────────────────────

function Final({ puncte, mult, rez, itemi, terminat, mesaj, inapoi, onReia }: {
  puncte: ReturnType<typeof puncteaza>; mult: number; rez: RaspunsJocC2[]; itemi: ItemC2[]; terminat: boolean; mesaj?: string; inapoi: string; onReia?: () => void;
}) {
  useCelebrare(puncte.stele >= 2, puncte.stele === 3 ? "mare" : "mica");
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
