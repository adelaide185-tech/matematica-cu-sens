"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { JOCURI_ARCADE, type JocArcadeId } from "@/jocuri/arcade/JocArcade";
import { NUME_DIFICULTATE, type DificultateArcade } from "@/motor/arcade/intrebari";
import { NUME_VITEZA, PUNCTE_INTREBARE, type VitezaArcade } from "@/motor/arcade/scor";
import { citesteProgres, sincronizeazaProgres, type Progres } from "@/jocuri/progres";

const CLASE = ["I", "a II-a", "a III-a", "a IV-a", "a V-a"];
const VITEZOMETRU: Record<VitezaArcade, string> = { 1: "🐢", 2: "🐇", 3: "🐆" };

/** Jocurile arcade pentru clasele I–V: alegi clasa, viteza, dificultatea și jocul. */
export default function JocuriArcade() {
  const [clasa, setClasa] = useState(2);
  const [viteza, setViteza] = useState<VitezaArcade>(1);
  const [dif, setDif] = useState<DificultateArcade>("mediu");
  const [n, setN] = useState(10);
  const [pr, setPr] = useState<Progres | null>(null);
  useEffect(() => {
    const p = citesteProgres();
    const q = Number(new URLSearchParams(location.search).get("clasa"));
    setClasa([1, 2, 3, 4, 5].includes(q) ? q : p.clasa || 2);
    setPr(p);
    sincronizeazaProgres().then(setPr);
  }, []);
  const link = (j: JocArcadeId) => `/elev/arcade/joc?j=${j}&clasa=${clasa}&v=${viteza}&n=${n}&d=${dif}`;
  const buton = (activ: boolean) => `h-12 rounded-2xl px-4 font-bold shadow-sm ${activ ? "bg-mov text-white" : "bg-white text-mov ring-2 ring-mov/20"}`;
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12">
      <h1 className="mt-4 text-center text-3xl font-bold text-mov sm:text-4xl">Jocuri arcade</h1>
      <p className="mt-1 text-center text-gray-600">Răspunde repede și corect! {PUNCTE_INTREBARE} de puncte pe întrebare, 3 inimioare. O greșeală costă o inimioară, dar jocul merge mai departe.</p>
      <section className="mt-5 grid gap-3 rounded-3xl bg-hartie p-4 shadow">
        <div className="flex flex-wrap items-center gap-2 font-semibold text-mov">Clasa:
          {CLASE.map((c, i) => <button key={c} type="button" onClick={() => setClasa(i + 1)} className={buton(clasa === i + 1)} aria-pressed={clasa === i + 1}>{c}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-mov">Viteza:
          {([1, 2, 3] as VitezaArcade[]).map((v) => <button key={v} type="button" onClick={() => setViteza(v)} className={buton(viteza === v)} aria-pressed={viteza === v}>{VITEZOMETRU[v]} {NUME_VITEZA[v]}</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-mov">Exercițiile:
          {(["usor", "mediu", "greu"] as DificultateArcade[]).map((d) => <button key={d} type="button" onClick={() => setDif(d)} className={buton(dif === d)} aria-pressed={dif === d}>{NUME_DIFICULTATE[d]}</button>)}
          <span className="ml-2">Câte:</span>
          {[5, 10, 15, 20].map((x) => <button key={x} type="button" onClick={() => setN(x)} className={`${buton(n === x)} w-14 px-0`} aria-pressed={n === x}>{x}</button>)}
        </div>
      </section>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {(Object.keys(JOCURI_ARCADE) as JocArcadeId[]).map((j) => {
          const info = JOCURI_ARCADE[j];
          const stele = pr?.stele[`arc-${j}-${clasa}`] ?? 0;
          return (
            <Link key={j} href={link(j)} className="rounded-3xl bg-hartie p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl" style={{ borderTop: `8px solid ${info.culoare}` }}>
              <div className="text-6xl" aria-hidden>{info.icon}</div>
              <h2 className="mt-3 text-2xl font-bold" style={{ color: info.culoare }}>{info.nume}</h2>
              <p className="mt-1 text-gray-600">{info.descriere}</p>
              <div className="mt-3 text-2xl" aria-label={`${stele} stele`}>{[1, 2, 3].map((s) => <span key={s} className={s <= stele ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
