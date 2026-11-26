"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MeniuCursuri } from "@/componente/MeniuCursuri";
import { citesteProgres, sincronizeazaProgres } from "@/jocuri/progres";
import { ACTIVITATI_EN, UNITATI, type ActivitateEn, type Varsta } from "./continut";
import { citesteVarsta, salveazaVarsta } from "./Varsta";
import { Imagine } from "./Activitati";
import { spune } from "./voce";
import { Mascota } from "@/componente/Mascota";
import { SetariVoceAdult } from "@/componente/SetariVoce";

const ACT = Object.keys(ACTIVITATI_EN) as ActivitateEn[];
const steleUnitate = (s: Record<string, number>, u: string) => ACT.filter((a) => a !== "cartonase").reduce((t, a) => t + (s[`en-${u}-${a}-0`] ?? 0), 0);

/** Cursul de engleză 4–6 ani: alegerea vârstei și a unității. */
export function HubEngleza() {
  const [varsta, setVarsta] = useState<Varsta>(5);
  const [stele, setStele] = useState<Record<string, number>>({});
  useEffect(() => {
    setVarsta(citesteVarsta());
    setStele(citesteProgres().stele);
    sincronizeazaProgres().then((p) => setStele(p.stele));
  }, []);
  const alege = (v: Varsta) => { setVarsta(v); salveazaVarsta(v); };
  return (
    <main className="fundal-fabrica min-h-screen px-4 pb-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between py-4">
        <Link href="/"><Image src="/brand/logo-mic.jpg" alt="Fabrica de Inteligență" width={56} height={56} className="h-14 w-14 rounded-xl" /></Link>
        <MeniuCursuri />
      </header>
      <section className="mx-auto max-w-5xl text-center">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={() => spune("Hi! I'm Sclipici! Let's play!")} aria-label="Sclipici te salută"><Mascota stare="salut" marime={130} spune="Hi! I'm Sclipici!" /></button>
          <h1 className="text-4xl font-extrabold text-mov sm:text-5xl">🇬🇧 English <span className="text-gray-500">· 4–6 ani</span></h1>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-lg text-gray-600">Copiii ascultă cuvintele în engleză și ating imaginile. Nu trebuie să știe să citească. Un adult pornește jocul și dă volumul mai tare. 🔊</p>
        <div className="mt-3 flex flex-wrap items-start justify-center gap-2">
          <button type="button" onClick={() => spune("Hello! Let's play!")} className="rounded-full bg-white px-5 py-2 font-bold text-mov shadow">🔊 Testează sunetul</button>
          <SetariVoceAdult limba="en" />
          <Link href="/profesor/engleza" className="rounded-full bg-mov-deschis px-5 py-2 font-bold text-mov shadow">🖨️ Pentru educatoare: fișe de lucru</Link>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-lg font-bold text-mov">Vârsta copilului:
          {([4, 5, 6] as Varsta[]).map((v) => (
            <button key={v} type="button" onClick={() => alege(v)} aria-pressed={varsta === v}
              className={`h-14 rounded-2xl px-5 shadow ${varsta === v ? "bg-mov text-white" : "bg-white text-mov"}`}>{v} ani</button>
          ))}
        </div>
        <p className="mt-1 text-sm text-gray-500">{varsta === 4 ? "2 imagini de ales, jocuri scurte" : varsta === 5 ? "3 imagini de ales" : "4 imagini de ales, jocuri mai lungi"}</p>
      </section>
      <div className="mx-auto mt-8 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {UNITATI.map((u, i) => {
          const s = steleUnitate(stele, u.id);
          return (
            <Link key={u.id} href={`/engleza/${u.id}`} className="group rounded-[2rem] bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl" style={{ borderTop: `10px solid ${u.culoare}` }}>
              <div className="flex items-center gap-3">
                <span className="text-5xl" aria-hidden>{u.icon}</span>
                <span>
                  <span className="block text-sm font-bold text-gray-500">Unit {i + 1}</span>
                  <span className="block text-2xl font-extrabold" style={{ color: u.culoare }}>{u.titlu}</span>
                  <span className="block text-gray-600">{u.titluRo}</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">{u.cuvinte.slice(0, 5).map((c) => <span key={c.en} className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gray-50"><Imagine c={c} marime={c.numar ? 0.25 : c.culoare ? 0.4 : 0.45} /></span>)}</div>
              <div className="mt-3 text-xl" aria-label={`${s} stele din 6`}>{Array.from({ length: 6 }, (_, k) => <span key={k} className={k < s ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
