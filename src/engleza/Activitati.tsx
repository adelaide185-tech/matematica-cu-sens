"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCelebrare } from "@/jocuri/miscare";
import { inregistreaza } from "@/jocuri/progres";
import { cuCuvant, type Cuvant, type Unitate, type Varsta } from "./continut";
import { cartiPerechi, rundeAsculta, steleAsculta, stelePerechi } from "./runde";
import { LAUDE, spune } from "./voce";
import { Mascota } from "@/componente/Mascota";

/** Imaginea unui cuvânt: emoji mare; la culori o pată de culoare; la numere, atâtea stele. */
export function Imagine({ c, marime = 1 }: { c: Cuvant; marime?: number }) {
  if (c.numar)
    return (
      <span className="grid place-items-center gap-0.5 leading-none" style={{ gridTemplateColumns: `repeat(${Math.min(5, c.numar)}, auto)`, fontSize: `${(c.numar > 5 ? 1.5 : 2.1) * marime}rem` }} aria-hidden>
        {Array.from({ length: c.numar }, (_, i) => <span key={i}>{c.emoji}</span>)}
      </span>
    );
  if (c.culoare)
    return (
      <span className="relative inline-flex items-center justify-center rounded-full shadow-inner ring-4 ring-black/10" style={{ background: c.culoare, width: `${6 * marime}rem`, height: `${6 * marime}rem` }} aria-hidden>
        <span style={{ fontSize: `${2.2 * marime}rem` }}>{c.emoji}</span>
      </span>
    );
  return <span className="leading-none" style={{ fontSize: `${5 * marime}rem` }} aria-hidden>{c.emoji}</span>;
}

function Antet({ u, titlu, inapoi, pas, total }: { u: Unitate; titlu: string; inapoi: string; pas?: number; total?: number }) {
  return (
    <header className="flex items-center gap-3 py-3">
      <Link href={inapoi} className="rounded-2xl bg-white px-4 py-2 text-2xl font-bold text-mov shadow" aria-label="Înapoi">←</Link>
      <span className="text-3xl" aria-hidden>{u.icon}</span>
      <h1 className="flex-1 text-xl font-bold text-mov sm:text-2xl">{u.titlu} · <span className="text-gray-600">{titlu}</span></h1>
      {total !== undefined && <span className="rounded-2xl bg-white px-3 py-1 text-lg font-bold text-mov shadow" aria-label={`Pasul ${pas} din ${total}`}>{pas}/{total}</span>}
    </header>
  );
}

/** Cartonașe: imaginea mare, cuvântul se aude la atingere; propoziția model o dată cu cuvântul. */
export function Cartonase({ u, inapoi }: { u: Unitate; inapoi: string }) {
  const [i, setI] = useState(0);
  const [cuFraza, setCuFraza] = useState(false);
  const c = u.cuvinte[i];
  const asculta = useCallback(() => spune(cuFraza ? cuCuvant(u.fraza, c.en) : c.en), [c, cuFraza, u.fraza]);
  useEffect(() => { asculta(); }, [asculta]);
  const terminat = i === u.cuvinte.length - 1;
  useEffect(() => { if (terminat) inregistreaza(`en-${u.id}-cartonase`, 0, 3, { logica: 1 }, []); }, [terminat, u.id]);
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Cartonașe" inapoi={inapoi} pas={i + 1} total={u.cuvinte.length} />
      <div className="flex justify-center"><Mascota marime={80} stare={terminat ? "bucuros" : "salut"} spune={terminat ? "Well done!" : "Say it with me!"} /></div>
      <button type="button" onClick={asculta} aria-label={`Ascultă: ${c.en}`}
        className="mx-auto mt-2 flex min-h-[55vh] w-full flex-col items-center justify-center gap-4 rounded-[2.5rem] bg-white p-6 shadow-lg ring-8 transition active:scale-[0.98]" style={{ ["--tw-ring-color" as string]: `${u.culoare}33` }}>
        <Imagine c={c} marime={1.8} />
        <span className="text-5xl font-extrabold sm:text-6xl" style={{ color: u.culoare }}>{cuFraza ? cuCuvant(u.fraza, c.en) : c.en}</span>
        <span className="text-lg text-gray-500">{c.ro} · 🔊 atinge ca să asculți din nou</span>
      </button>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="h-16 w-24 rounded-2xl bg-white text-3xl font-bold text-mov shadow disabled:opacity-30" aria-label="Cartonașul anterior">◀</button>
        <button type="button" onClick={() => setCuFraza((x) => !x)} aria-pressed={cuFraza} className={`h-16 rounded-2xl px-5 text-lg font-bold shadow ${cuFraza ? "bg-mov text-white" : "bg-white text-mov"}`}>💬 {cuFraza ? "Doar cuvântul" : "Cu propoziție"}</button>
        {terminat
          ? <Link href={inapoi} className="flex h-16 items-center rounded-2xl bg-galben px-6 text-xl font-extrabold text-mov-inchis shadow">⭐ Gata!</Link>
          : <button type="button" onClick={() => setI((x) => x + 1)} className="h-16 w-24 rounded-2xl bg-mov text-3xl font-bold text-white shadow" aria-label="Cartonașul următor">▶</button>}
      </div>
      <p className="mt-3 text-center text-sm text-gray-500">Pentru adult: spuneți cuvântul împreună cu copilul de 2–3 ori, arătând imaginea.</p>
    </main>
  );
}

/** Ascultă și atinge: se aude cerința („Where's the cat?”), copilul atinge imaginea. */
export function Asculta({ u, varsta, seed, inapoi, onReia }: { u: Unitate; varsta: Varsta; seed: number; inapoi: string; onReia: () => void }) {
  const runde = useMemo(() => rundeAsculta(u, varsta, seed), [u, varsta, seed]);
  const [r, setR] = useState(0);
  const [greseli, setGreseli] = useState(0);
  const [greseliRunda, setGreseliRunda] = useState(0);
  const [stare, setStare] = useState<{ ok: boolean; en: string } | null>(null);
  const [gata, setGata] = useState<number | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const runda = runde[r];
  const cerinta = runda ? cuCuvant(u.cerinta, runda.tinta.en) : "";
  useEffect(() => () => clearTimeout(t.current), []);
  useEffect(() => { if (runda && !gata) spune(cerinta); }, [r]); // eslint-disable-line react-hooks/exhaustive-deps

  const alege = (c: Cuvant) => {
    if (!runda || stare?.ok) return;
    if (c.en === runda.tinta.en) {
      setStare({ ok: true, en: c.en });
      spune(`${LAUDE[r % LAUDE.length]} ${c.en}!`);
      t.current = setTimeout(() => {
        setStare(null); setGreseliRunda(0);
        if (r + 1 >= runde.length) {
          const s = steleAsculta(greseli, runde.length);
          setGata(s);
          inregistreaza(`en-${u.id}-asculta`, 0, s, { logica: runde.length - Math.min(greseli, runde.length) }, []);
        } else setR(r + 1);
      }, 1400);
    } else {
      setGreseli((g) => g + 1); setGreseliRunda((g) => g + 1);
      setStare({ ok: false, en: c.en });
      spune(`That's ${c.en}. Try again! ${cerinta}`);
      t.current = setTimeout(() => setStare(null), 900);
    }
  };

  if (gata !== null) return <FinalEn u={u} stele={gata} inapoi={inapoi} onReia={onReia} />;
  if (!runda) return null;
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Ascultă și atinge" inapoi={inapoi} pas={r + 1} total={runde.length} />
      <div className="flex items-center justify-center gap-3">
        <Mascota marime={90} stare={stare ? (stare.ok ? "bucuros" : "incurajare") : "ganditor"} key={stare ? `${r}-${stare.ok}-${stare.en}` : `g${r}`} />
        <button type="button" onClick={() => spune(cerinta)} className="flex items-center gap-3 rounded-full bg-mov px-6 py-3 text-2xl font-extrabold text-white shadow-lg active:scale-95" aria-label={`Ascultă din nou: ${cerinta}`}>
          🔊 <span className="text-lg font-bold text-white/90">{cerinta}</span>
        </button>
      </div>
      <div className={`mt-6 grid flex-1 content-center gap-4 ${runda.variante.length === 2 ? "grid-cols-2" : runda.variante.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
        {runda.variante.map((c) => {
          const ok = stare?.ok && c.en === runda.tinta.en, gresit = stare && !stare.ok && stare.en === c.en;
          // după 2 greșeli la aceeași rundă, imaginea corectă „pulsează” ca ajutor
          const ajutor = greseliRunda >= 2 && c.en === runda.tinta.en && !stare?.ok;
          return (
            <button key={c.en} type="button" onClick={() => alege(c)} aria-label={c.en}
              className={`flex min-h-44 items-center justify-center rounded-[2rem] bg-white p-4 shadow-lg ring-8 transition active:scale-95 sm:min-h-56 ${ok ? "ring-green-400 animate-[salt_0.5s]" : gresit ? "ring-red-300 animate-[scutura_0.3s]" : ajutor ? "animate-pulse ring-galben" : "ring-transparent"}`}>
              <Imagine c={c} marime={1.2} />
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center gap-1 text-2xl" aria-hidden>{runde.map((_, i) => <span key={i} className={i < r || (i === r && stare?.ok) ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
    </main>
  );
}

/** Perechi: cartonașe cu imagini, întoarse; la întoarcere se aude cuvântul. */
export function Perechi({ u, varsta, seed, inapoi, onReia }: { u: Unitate; varsta: Varsta; seed: number; inapoi: string; onReia: () => void }) {
  const carti = useMemo(() => cartiPerechi(u, varsta, seed), [u, varsta, seed]);
  const [deschise, setDeschise] = useState<string[]>([]);
  const [gasite, setGasite] = useState<string[]>([]);
  const [mutari, setMutari] = useState(0);
  const [gata, setGata] = useState<number | null>(null);
  const perechi = carti.length / 2;
  const atinge = (k: { cheie: string; c: Cuvant }) => {
    if (deschise.length >= 2 || deschise.includes(k.cheie) || gasite.includes(k.c.en)) return;
    spune(k.c.en);
    const d = [...deschise, k.cheie];
    setDeschise(d);
    if (d.length < 2) return;
    const m = mutari + 1;
    setMutari(m);
    const [a, b] = d.map((x) => carti.find((y) => y.cheie === x)!);
    if (a.c.en === b.c.en) {
      setTimeout(() => {
        const g = [...gasite, a.c.en];
        setGasite(g); setDeschise([]);
        spune(`${LAUDE[g.length % LAUDE.length]} ${a.c.en}!`);
        if (g.length === perechi) {
          const s = stelePerechi(m, perechi);
          setTimeout(() => setGata(s), 900);
          inregistreaza(`en-${u.id}-perechi`, 0, s, { logica: perechi }, []);
        }
      }, 500);
    } else setTimeout(() => setDeschise([]), 1100);
  };
  if (gata !== null) return <FinalEn u={u} stele={gata} inapoi={inapoi} onReia={onReia} />;
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-6">
      <Antet u={u} titlu="Perechi" inapoi={inapoi} pas={gasite.length} total={perechi} />
      <div className="flex justify-center"><Mascota key={gasite.length} marime={80} stare={gasite.length ? "bucuros" : "salut"} spune={gasite.length ? `${LAUDE[gasite.length % LAUDE.length]}` : "Find the pairs!"} /></div>
      <div className={`mt-2 grid flex-1 content-center gap-3 ${carti.length <= 6 ? "grid-cols-3" : "grid-cols-4"}`}>
        {carti.map((k) => {
          const vizibil = deschise.includes(k.cheie) || gasite.includes(k.c.en);
          return (
            <button key={k.cheie} type="button" onClick={() => atinge(k)} aria-label={vizibil ? k.c.en : "Cartonaș întors"}
              className={`flex aspect-square items-center justify-center rounded-3xl shadow-lg transition active:scale-95 ${gasite.includes(k.c.en) ? "bg-green-100 ring-4 ring-green-400" : vizibil ? "bg-white" : "text-white"}`}
              style={vizibil ? undefined : { background: u.culoare }}>
              {vizibil ? <Imagine c={k.c} marime={k.c.numar ? 0.6 : 0.8} /> : <span className="text-5xl" aria-hidden>❓</span>}
            </button>
          );
        })}
      </div>
    </main>
  );
}

function FinalEn({ u, stele, inapoi, onReia }: { u: Unitate; stele: number; inapoi: string; onReia: () => void }) {
  useCelebrare(true, stele === 3 ? "mare" : "mica");
  useEffect(() => { spune(stele === 3 ? "Fantastic! Well done!" : "Well done!"); }, [stele]);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="rounded-[2.5rem] bg-white p-8 shadow-xl">
        <Mascota stare="bucuros" marime={150} />
        <p className="mt-2 text-4xl font-extrabold text-mov">Well done!</p>
        <p className="text-lg text-gray-600">Bravo!</p>
        <div className="mt-3 text-6xl" aria-label={`${stele} stele`}>{[1, 2, 3].map((s) => <span key={s} className={s <= stele ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onReia} className="h-16 rounded-2xl bg-galben px-6 text-xl font-extrabold text-mov-inchis shadow">🔁 Încă o dată</button>
          <Link href={inapoi} className="flex h-16 items-center rounded-2xl bg-mov px-6 text-xl font-extrabold text-white shadow">🏠 Înapoi</Link>
        </div>
      </div>
    </main>
  );
}
