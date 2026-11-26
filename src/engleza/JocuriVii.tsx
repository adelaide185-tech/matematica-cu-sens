"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { inregistreaza } from "@/jocuri/progres";
import { Mascota, type StareMascota } from "@/componente/Mascota";
import { ICON_CUVANT, UNITATI, cuCuvant, type ActivitateEn, type Cuvant, type Unitate, type Varsta } from "./continut";
import { cutii, roata, rundeBaloane, rundeCartita, rundePropozitie, sortare, steleAsculta, type Piesa } from "./runde";
import { Antet, FinalEn, Imagine } from "./Activitati";
import { LAUDE, spune } from "./voce";
import { sunet } from "./sunete";

type PropsJoc = { u: Unitate; varsta: Varsta; seed: number; inapoi: string; onReia: () => void };

/** starea comună: greșeli, mascota, final cu stele salvate */
function useJoc(u: Unitate, act: ActivitateEn, runde: number) {
  const [greseli, setGreseli] = useState(0);
  const [mascota, setMascota] = useState<StareMascota>("ganditor");
  const [stele, setStele] = useState<number | null>(null);
  const gata = useCallback((cuStele = true) => {
    const s = cuStele ? steleAsculta(greseli, runde) : 3;
    sunet.tada();
    setStele(s);
    inregistreaza(`en-${u.id}-${act}`, 0, s, { logica: runde }, []);
  }, [greseli, runde, u.id, act]);
  const greseala = useCallback((ce: string) => { setGreseli((g) => g + 1); setMascota("incurajare"); sunet.boing(); spune(`That's ${ce}. Try again!`); }, []);
  const bravo = useCallback((ce: string, i = 0) => { setMascota("bucuros"); sunet.corect(); spune(`${LAUDE[i % LAUDE.length]} ${ce}!`); }, []);
  return { greseli, mascota, setMascota, stele, gata, greseala, bravo };
}

/** butonul mare cu cerința (se aude la apăsare) + mascota care reacționează */
function Cerinta({ text, mascota }: { text: string; mascota: StareMascota }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Mascota key={mascota + text} marime={86} stare={mascota} />
      <button type="button" onClick={() => spune(text)} className="flex items-center gap-3 rounded-full bg-violet px-6 py-3 text-xl font-extrabold text-white shadow-lg active:scale-95" aria-label={`Ascultă din nou: ${text}`}>
        🔊 <span className="text-lg font-bold text-white/95">{text}</span>
      </button>
    </div>
  );
}

// ───────── 🔨 Lovește cârtița ─────────

function Cartita({ ridicata, c, stare, onLoveste }: { ridicata: boolean; c: Cuvant | null; stare: "" | "lovita" | "gresit" | "ajutor"; onLoveste: () => void }) {
  return (
    <button type="button" onClick={onLoveste} disabled={!c || !ridicata} aria-label={c ? c.en : "Gaură goală"} className="relative h-44 w-full overflow-hidden sm:h-52">
      {/* cârtița cu cartonașul */}
      <span className={`absolute inset-x-0 bottom-8 flex flex-col items-center transition-transform duration-300 ${ridicata && c ? "translate-y-0" : "translate-y-[120%]"} ${stare === "lovita" ? "cartita-lovita" : stare === "gresit" ? "animate-[scutura_0.3s]" : ""}`}>
        {c && <span className={`mb-1 rounded-2xl bg-white px-2 py-1 shadow-md ring-4 ${stare === "ajutor" ? "animate-pulse ring-galben" : stare === "lovita" ? "ring-green-400" : "ring-white"}`}><Imagine c={c} marime={c.numar ? 0.5 : c.culoare ? 0.55 : 0.7} /></span>}
        <svg viewBox="0 0 100 70" className="w-24 sm:w-28" aria-hidden>
          <ellipse cx="50" cy="52" rx="36" ry="30" fill="#8d6e63" /><ellipse cx="50" cy="58" rx="22" ry="18" fill="#bcaaa4" />
          <circle cx="38" cy="40" r="5" fill="#2b2540" /><circle cx="62" cy="40" r="5" fill="#2b2540" /><circle cx="39.5" cy="38.5" r="1.6" fill="#fff" /><circle cx="63.5" cy="38.5" r="1.6" fill="#fff" />
          <ellipse cx="50" cy="50" rx="7" ry="5" fill="#f48fb1" /><path d="M44 58 Q50 63 56 58" stroke="#2b2540" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="30" cy="26" rx="7" ry="6" fill="#8d6e63" /><ellipse cx="70" cy="26" rx="7" ry="6" fill="#8d6e63" />
        </svg>
      </span>
      {/* gaura */}
      <span className="absolute inset-x-3 bottom-2 h-12 rounded-[50%] bg-[#4e342e] shadow-[inset_0_8px_12px_rgba(0,0,0,0.5)]" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 h-6 rounded-b-3xl bg-[#7cb342]" aria-hidden />
    </button>
  );
}

export function LovesteCartita({ u, varsta, seed, inapoi, onReia }: PropsJoc) {
  const runde = useMemo(() => rundeCartita(u, varsta, seed), [u, varsta, seed]);
  const j = useJoc(u, "cartita", runde.length);
  const [r, setR] = useState(0);
  const [ridicate, setRidicate] = useState(false);
  const [stari, setStari] = useState<Record<number, "lovita" | "gresit">>({});
  const [greseliRunda, setGreseliRunda] = useState(0);
  const runda = runde[r];
  const cerinta = runda ? cuCuvant(u.cerinta, runda.tinta.en) : "";
  useEffect(() => {
    if (!runda || j.stele !== null) return;
    setRidicate(false); setStari({}); setGreseliRunda(0); j.setMascota("ganditor");
    const t = setTimeout(() => { setRidicate(true); sunet.pop(); spune(cerinta); }, 450);
    return () => clearTimeout(t);
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  const loveste = (i: number) => {
    const c = runda.gauri[i];
    if (!c || stari[i] === "lovita" || Object.values(stari).includes("lovita")) return;
    if (c.en === runda.tinta.en) {
      sunet.bonk(); setStari((s) => ({ ...s, [i]: "lovita" })); j.bravo(c.en, r);
      setTimeout(() => { setRidicate(false); setTimeout(() => (r + 1 >= runde.length ? j.gata() : setR(r + 1)), 350); }, 1200);
    } else {
      setStari((s) => ({ ...s, [i]: "gresit" })); setGreseliRunda((g) => g + 1); j.greseala(c.en);
      setTimeout(() => setStari((s) => { const n = { ...s }; delete n[i]; return n; }), 500);
    }
  };
  if (j.stele !== null) return <FinalEn u={u} stele={j.stele} inapoi={inapoi} onReia={onReia} />;
  if (!runda) return null;
  return (
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Lovește cârtița" inapoi={inapoi} pas={r + 1} total={runde.length} />
      <Cerinta text={cerinta} mascota={j.mascota} />
      <div className={`mt-4 grid flex-1 content-center gap-3 rounded-[2.5rem] bg-[#9ccc65] p-4 shadow-inner ${runda.gauri.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
        {runda.gauri.map((c, i) => (
          <Cartita key={`${r}-${i}`} c={c} ridicata={ridicate} onLoveste={() => loveste(i)}
            stare={stari[i] ?? (greseliRunda >= 2 && c?.en === runda.tinta.en ? "ajutor" : "")} />
        ))}
      </div>
    </div></main>
  );
}

// ───────── 🎈 Sparge baloanele ─────────

const CULORI_BALON = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#8e24aa", "#ec407a"];

export function SpargeBaloanele({ u, varsta, seed, inapoi, onReia }: PropsJoc) {
  const runde = useMemo(() => rundeBaloane(u, varsta, seed), [u, varsta, seed]);
  const j = useJoc(u, "baloane", runde.length);
  const [r, setR] = useState(0);
  const [sparte, setSparte] = useState<string | null>(null);
  const [gresit, setGresit] = useState<string | null>(null);
  const [greseliRunda, setGreseliRunda] = useState(0);
  const runda = runde[r];
  // „Where's the cat?” → „Pop the cat!”; „Touch red!” → „Pop red!”
  const text = runda ? (u.cerinta.includes("the {w}") ? `Pop the ${runda.tinta.en}!` : `Pop ${runda.tinta.en}!`) : "";
  useEffect(() => { if (runda && j.stele === null) { setSparte(null); setGreseliRunda(0); j.setMascota("ganditor"); spune(text); } }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  const atinge = (c: Cuvant) => {
    if (sparte) return;
    if (c.en === runda.tinta.en) {
      sunet.pop(); setSparte(c.en); j.bravo(c.en, r);
      setTimeout(() => (r + 1 >= runde.length ? j.gata() : setR(r + 1)), 1300);
    } else { setGresit(c.en); setGreseliRunda((g) => g + 1); j.greseala(c.en); setTimeout(() => setGresit(null), 500); }
  };
  if (j.stele !== null) return <FinalEn u={u} stele={j.stele} inapoi={inapoi} onReia={onReia} />;
  if (!runda) return null;
  return (
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Sparge baloanele" inapoi={inapoi} pas={r + 1} total={runde.length} />
      <Cerinta text={text} mascota={j.mascota} />
      <div className="relative mt-4 flex flex-1 flex-wrap items-center justify-center gap-4 overflow-hidden rounded-[2.5rem] p-6" style={{ background: "linear-gradient(#bfe9ff, #f1fbff)" }}>
        <span className="absolute left-6 top-4 text-5xl opacity-80" aria-hidden>☁️</span><span className="absolute right-10 top-10 text-4xl opacity-70" aria-hidden>☁️</span>
        {runda.variante.map((c, i) => {
          const spart = sparte === c.en;
          const ajutor = greseliRunda >= 2 && c.en === runda.tinta.en && !sparte;
          return (
            <button key={`${r}-${c.en}`} type="button" onClick={() => atinge(c)} aria-label={c.en}
              className={`balon-plutire relative flex flex-col items-center ${gresit === c.en ? "animate-[scutura_0.3s]" : ""}`} style={{ animationDelay: `${i * 0.35}s`, animationDuration: `${2.6 + (i % 3) * 0.5}s` }}>
              {spart ? (
                <span className="balon-spart text-8xl" aria-hidden>💥</span>
              ) : (
                <>
                  <span className={`flex h-36 w-32 items-center justify-center rounded-[50%_50%_48%_48%] shadow-lg ring-4 sm:h-40 sm:w-36 ${ajutor ? "animate-pulse ring-galben" : "ring-white/60"}`} style={{ background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${CULORI_BALON[i % 6]} 45%)` }}>
                    <span className="rounded-full bg-white/90 p-2"><Imagine c={c} marime={c.numar ? 0.45 : c.culoare ? 0.5 : 0.62} /></span>
                  </span>
                  <span className="h-0 w-0 border-x-[7px] border-t-[10px] border-x-transparent" style={{ borderTopColor: CULORI_BALON[i % 6] }} aria-hidden />
                  <span className="h-14 w-0.5 bg-gray-500" aria-hidden />
                </>
              )}
            </button>
          );
        })}
      </div>
    </div></main>
  );
}

// ───────── 🎁 Deschide cutia ─────────

export function DeschideCutia({ u, varsta, seed, inapoi, onReia }: PropsJoc) {
  const lista = useMemo(() => cutii(u, varsta, seed), [u, varsta, seed]);
  const j = useJoc(u, "cutia", lista.length);
  const [deschise, setDeschise] = useState<number[]>([]);
  const [arata, setArata] = useState<number | null>(null);
  useEffect(() => { j.setMascota("salut"); spune("Open a box!"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const deschide = (i: number) => {
    if (arata !== null) return;
    sunet.deschide(); setArata(i); j.setMascota("bucuros");
    if (!deschise.includes(i)) setDeschise((d) => [...d, i]);
    setTimeout(() => spune(`${cuCuvant(u.fraza, lista[i].en)} Say: ${lista[i].en}!`), 350);
  };
  const inchide = () => { setArata(null); j.setMascota("salut"); if (deschise.length >= lista.length) j.gata(false); };
  if (j.stele !== null) return <FinalEn u={u} stele={j.stele} inapoi={inapoi} onReia={onReia} />;
  return (
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Deschide cutia" inapoi={inapoi} pas={deschise.length} total={lista.length} />
      <div className="flex justify-center"><Mascota key={j.mascota} marime={86} stare={j.mascota} spune={deschise.length ? "What's inside?" : "Open a box!"} /></div>
      <div className={`mt-4 grid flex-1 content-center gap-4 ${lista.length <= 6 ? "grid-cols-3" : lista.length <= 8 ? "grid-cols-4" : "grid-cols-5"}`}>
        {lista.map((c, i) => {
          const d = deschise.includes(i);
          return (
            <button key={i} type="button" onClick={() => deschide(i)} aria-label={d ? `Cutia ${i + 1}: ${c.en}` : `Cutia ${i + 1}`}
              className={`relative flex aspect-square items-center justify-center rounded-3xl shadow-lg transition active:scale-95 ${d ? "bg-white" : ""}`}
              style={d ? undefined : { background: `linear-gradient(135deg, ${["#e0483e", "#5b3fb8", "#1fa9bd", "#e07a1f", "#2e9e5b"][i % 5]}, #3d2689)` }}>
              {d ? <Imagine c={c} marime={c.numar ? 0.45 : c.culoare ? 0.55 : 0.7} /> : (
                <>
                  <span className="absolute inset-x-0 top-[38%] h-3 bg-galben" aria-hidden /><span className="absolute inset-y-0 left-[46%] w-3 bg-galben" aria-hidden />
                  <span className="relative text-4xl font-extrabold text-white drop-shadow">{i + 1}</span>
                  <span className="absolute -top-3 text-4xl" aria-hidden>🎀</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {arata !== null && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-violet-inchis/60 p-4" onClick={inchide}>
          <div className="cutie-deschisa flex max-w-md flex-col items-center gap-3 rounded-[2.5rem] bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Imagine c={lista[arata]} marime={1.6} />
            <p className="text-5xl font-extrabold" style={{ color: u.culoare }}>{lista[arata].en}</p>
            <p className="text-gray-500">{lista[arata].ro} · spune și tu cu voce tare!</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => spune(lista[arata].en)} className="h-14 rounded-2xl bg-mov-deschis px-5 text-lg font-bold text-mov">🔊 Încă o dată</button>
              <button type="button" onClick={inchide} className="h-14 rounded-2xl bg-violet px-6 text-lg font-extrabold text-white" autoFocus>✅ Am spus!</button>
            </div>
          </div>
        </div>
      )}
    </div></main>
  );
}

// ───────── 🎡 Roata ─────────

const CULORI_ROATA = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa", "#ec407a", "#00acc1"];

export function Roata({ u, varsta, seed, inapoi, onReia }: PropsJoc) {
  const { segmente, opriri } = useMemo(() => roata(u, varsta, seed), [u, varsta, seed]);
  const j = useJoc(u, "roata", opriri.length);
  const [k, setK] = useState(0);
  const [unghi, setUnghi] = useState(0);
  const [stare, setStare] = useState<"astept" | "invarte" | "arata">("astept");
  const n = segmente.length, felie = 360 / n;
  const curent = segmente[opriri[k] ?? 0];
  useEffect(() => { j.setMascota("salut"); spune("Spin the wheel!"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const invarte = () => {
    if (stare === "invarte") return;
    const tinta = opriri[k];
    // segmentul i e centrat la i*felie + felie/2 (de la ora 12, în sensul acelor); acul e sus
    const fin = 360 * 4 + (360 - (tinta * felie + felie / 2));
    setUnghi((a) => a - (a % 360) + fin);
    setStare("invarte"); sunet.rotire(); j.setMascota("ganditor");
    setTimeout(() => { setStare("arata"); j.setMascota("bucuros"); sunet.corect(); spune(`What's this? ... It's ${segmente[tinta].numar || segmente[tinta].culoare ? "" : "a "}${segmente[tinta].en}! Say: ${segmente[tinta].en}!`); }, 2600);
  };
  const urmator = () => { if (k + 1 >= opriri.length) j.gata(false); else { setK(k + 1); setStare("astept"); j.setMascota("salut"); } };
  if (j.stele !== null) return <FinalEn u={u} stele={j.stele} inapoi={inapoi} onReia={onReia} />;
  const R = 150;
  return (
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center px-4 pb-6">
      <div className="w-full"><Antet u={u} titlu="Roata" inapoi={inapoi} pas={k + (stare === "arata" ? 1 : 0)} total={opriri.length} /></div>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="relative">
          <span className="absolute left-1/2 top-[-14px] z-10 -translate-x-1/2 text-5xl drop-shadow" aria-hidden>🔻</span>
          <svg viewBox="-160 -160 320 320" className="h-[min(70vw,22rem)] w-[min(70vw,22rem)] drop-shadow-xl" style={{ transform: `rotate(${unghi}deg)`, transition: stare === "invarte" ? "transform 2.5s cubic-bezier(.15,.85,.25,1)" : "none" }} role="img" aria-label="Roata cu imagini">
            {segmente.map((c, i) => {
              const a0 = ((i * felie - 90) * Math.PI) / 180, a1 = (((i + 1) * felie - 90) * Math.PI) / 180, am = (((i + 0.5) * felie - 90) * Math.PI) / 180;
              return (
                <g key={c.en}>
                  <path d={`M0 0 L ${R * Math.cos(a0)} ${R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`} fill={CULORI_ROATA[i % 8]} stroke="#fff" strokeWidth="4" />
                  <text x={100 * Math.cos(am)} y={100 * Math.sin(am)} textAnchor="middle" dominantBaseline="central" fontSize={c.numar ? 22 : 40} transform={`rotate(${(i + 0.5) * felie} ${100 * Math.cos(am)} ${100 * Math.sin(am)})`}>{c.numar ? c.numar : c.culoare ? "●" : c.emoji}</text>
                </g>
              );
            })}
            <circle r="26" fill="#fff" stroke="#5b3fb8" strokeWidth="6" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Mascota key={j.mascota} marime={110} stare={j.mascota} spune={stare === "arata" ? "Say it!" : "Spin!"} />
          {stare !== "arata" && <button type="button" onClick={invarte} disabled={stare === "invarte"} className="h-16 rounded-2xl bg-galben px-8 text-2xl font-extrabold text-violet-inchis shadow-lg disabled:opacity-50">🎡 Învârte!</button>}
        </div>
      </div>
      {stare === "arata" && (
        <div className="cutie-deschisa mt-4 flex flex-col items-center gap-2 rounded-[2.5rem] bg-white p-6 text-center shadow-xl">
          <Imagine c={curent} marime={1.2} />
          <p className="text-5xl font-extrabold" style={{ color: u.culoare }}>{curent.en}</p>
          <p className="text-gray-500">{curent.ro} · spune cuvântul cu voce tare!</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => spune(curent.en)} className="h-14 rounded-2xl bg-mov-deschis px-5 text-lg font-bold text-mov">🔊 Încă o dată</button>
            <button type="button" onClick={urmator} className="h-14 rounded-2xl bg-violet px-6 text-lg font-extrabold text-white">✅ Am spus!</button>
          </div>
        </div>
      )}
    </div></main>
  );
}

// ───────── 🗂️ Sortează ─────────

export function Sorteaza({ u, varsta, seed, inapoi, onReia }: PropsJoc) {
  const { cosuri, itemi } = useMemo(() => sortare(u, UNITATI, varsta, seed), [u, varsta, seed]);
  const j = useJoc(u, "sorteaza", itemi.length);
  const [puse, setPuse] = useState<number[]>([]);
  const [ales, setAles] = useState<number | null>(null);
  const [gresitCos, setGresitCos] = useState<number | null>(null);
  const [trag, setTrag] = useState<{ i: number; x: number; y: number } | null>(null);
  const cosRef = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  useEffect(() => { j.setMascota("salut"); spune(`${cosuri[0].titlu} or ${cosuri[1].titlu}?`); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pune = (i: number, cos: 0 | 1) => {
    const it = itemi[i];
    if (it.cos === cos) {
      const p = [...puse, i]; setPuse(p); setAles(null); j.bravo(it.c.en, p.length);
      if (p.length === itemi.length) setTimeout(() => j.gata(), 900);
    } else { setGresitCos(cos); j.greseala(it.c.en); setTimeout(() => setGresitCos(null), 500); }
  };
  const alege = (i: number) => { setAles(i); sunet.clic(); spune(itemi[i].c.en); };
  // tragere cu degetul / mouse-ul: la ridicare, verificăm peste ce coș e
  const muta = (e: React.PointerEvent) => { if (trag) setTrag({ ...trag, x: e.clientX, y: e.clientY }); };
  const lasa = (e: React.PointerEvent) => {
    if (!trag) return;
    const peste = cosRef.findIndex((r) => { const b = r.current?.getBoundingClientRect(); return b && e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom; });
    const i = trag.i; setTrag(null);
    if (peste === 0 || peste === 1) pune(i, peste);
  };
  if (j.stele !== null) return <FinalEn u={u} stele={j.stele} inapoi={inapoi} onReia={onReia} />;
  return (
    <main className="fundal-fabrica min-h-screen touch-none" onPointerMove={muta} onPointerUp={lasa}><div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Sortează" inapoi={inapoi} pas={puse.length} total={itemi.length} />
      <div className="flex justify-center"><Mascota key={j.mascota + puse.length} marime={80} stare={j.mascota} spune={ales !== null ? "Which basket?" : "Touch a picture!"} /></div>
      <div className="mt-3 flex min-h-36 flex-wrap items-center justify-center gap-3">
        {itemi.map((it, i) => puse.includes(i) ? null : (
          <button key={i} type="button" aria-label={it.c.en} aria-pressed={ales === i}
            onClick={() => alege(i)} onPointerDown={(e) => { alege(i); setTrag({ i, x: e.clientX, y: e.clientY }); }}
            className={`flex h-28 w-28 items-center justify-center rounded-3xl bg-white shadow-lg transition ${ales === i ? "-translate-y-2 ring-8 ring-galben" : "ring-2 ring-white"}`}>
            <Imagine c={it.c} marime={it.c.numar ? 0.45 : it.c.culoare ? 0.6 : 0.75} />
          </button>
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-4 pt-4">
        {cosuri.map((c, k) => (
          <div key={c.id} ref={cosRef[k]} role="button" tabIndex={0} aria-label={`Coșul ${c.titlu}`} onClick={() => ales !== null && pune(ales, k as 0 | 1)}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && ales !== null) pune(ales, k as 0 | 1); }}
            className={`flex min-h-44 cursor-pointer flex-col items-center rounded-[2rem] border-8 border-dashed bg-white/80 p-3 shadow-lg transition ${gresitCos === k ? "animate-[scutura_0.3s] border-red-300" : ales !== null ? "border-galben" : "border-white"}`}>
            <span className="text-5xl" aria-hidden>{c.icon}</span>
            <span className="text-2xl font-extrabold" style={{ color: c.culoare }}>{c.titlu}</span>
            <div className="mt-2 flex flex-wrap justify-center gap-1">{puse.filter((i) => itemi[i].cos === k).map((i) => <span key={i} className="rounded-xl bg-white p-1 shadow"><Imagine c={itemi[i].c} marime={itemi[i].c.numar ? 0.25 : 0.4} /></span>)}</div>
          </div>
        ))}
      </div>
      {trag && <span className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-2 opacity-90 shadow-2xl" style={{ left: trag.x, top: trag.y }} aria-hidden><Imagine c={itemi[trag.i].c} marime={0.6} /></span>}
    </div></main>
  );
}

// ───────── 🧩 Construiește propoziția ─────────

function PiesaVizual({ p }: { p: Piesa }) {
  if (p.poza) return <span className="flex flex-col items-center gap-1"><Imagine c={p.poza} marime={p.poza.numar ? 0.35 : p.poza.culoare ? 0.45 : 0.6} /><span className="text-sm font-bold">{p.text}</span></span>;
  const ic = p.text.split(" ").map((w) => ICON_CUVANT[w.toLowerCase()]).filter(Boolean).join("");
  return <span className="flex flex-col items-center gap-1"><span className="text-3xl" aria-hidden>{ic || "💬"}</span><span className="text-lg font-extrabold">{p.text}</span></span>;
}

export function ConstruiestePropozitia({ u, varsta, seed, inapoi, onReia }: PropsJoc) {
  const runde = useMemo(() => rundePropozitie(u, varsta, seed), [u, varsta, seed]);
  const j = useJoc(u, "propozitie", runde.length);
  const [r, setR] = useState(0);
  const [puse, setPuse] = useState<Piesa[]>([]);
  const [gresit, setGresit] = useState<string | null>(null);
  const runda = runde[r];
  const toate = useMemo(() => (runda ? [...runda.piese, ...(runda.capcana ? [runda.capcana] : [])].sort((a, b) => ((a.id.charCodeAt(1) * 7 + seed + r) % 5) - ((b.id.charCodeAt(1) * 7 + seed + r) % 5) || a.id.localeCompare(b.id)) : []), [runda, seed, r]);
  useEffect(() => { if (runda && j.stele === null) { setPuse([]); j.setMascota("ganditor"); spune(`Listen: ${runda.propozitie}`); } }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  const alege = (p: Piesa) => {
    if (puse.includes(p) || puse.length >= runda.piese.length) return;
    const urm = runda.piese[puse.length];
    if (p.id === urm.id) {
      sunet.clic(); spune(p.text);
      const n = [...puse, p]; setPuse(n);
      if (n.length === runda.piese.length) {
        setTimeout(() => { j.bravo("", r); spune(`${LAUDE[r % LAUDE.length]} ${runda.propozitie}`); }, 500);
        setTimeout(() => (r + 1 >= runde.length ? j.gata() : setR(r + 1)), 2600);
      }
    } else { setGresit(p.id); j.greseala(p.text); setTimeout(() => setGresit(null), 500); }
  };
  if (j.stele !== null) return <FinalEn u={u} stele={j.stele} inapoi={inapoi} onReia={onReia} />;
  if (!runda) return null;
  const complet = puse.length === runda.piese.length;
  return (
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Construiește propoziția" inapoi={inapoi} pas={r + 1} total={runde.length} />
      <Cerinta text={runda.propozitie} mascota={j.mascota} />
      {/* locurile din propoziție */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-[2rem] bg-white/70 p-4 shadow-inner">
        {runda.piese.map((p, i) => (
          <span key={p.id} className={`flex min-h-28 min-w-28 items-center justify-center rounded-3xl border-4 p-3 ${puse[i] ? `border-transparent bg-white shadow-md ${complet ? "ring-4 ring-green-400" : ""}` : "border-dashed border-violet/40"}`}>
            {puse[i] ? <PiesaVizual p={puse[i]} /> : <span className="text-3xl font-extrabold text-violet/30">{i + 1}</span>}
          </span>
        ))}
      </div>
      {/* piesele de ales */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {toate.filter((p) => !puse.includes(p)).map((p) => (
          <button key={p.id} type="button" onClick={() => alege(p)} aria-label={p.text}
            className={`flex min-h-28 min-w-28 items-center justify-center rounded-3xl bg-white p-3 text-violet-inchis shadow-lg ring-4 transition active:scale-95 ${gresit === p.id ? "animate-[scutura_0.3s] ring-red-300" : "ring-cyan/60"}`}>
            <PiesaVizual p={p} />
          </button>
        ))}
      </div>
    </div></main>
  );
}
