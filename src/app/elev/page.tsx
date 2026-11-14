"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { citesteProgres, salveazaProgres, sincronizeazaProgres, TROFEE, type Progres } from "@/jocuri/progres";

const JOCURI = [
  { id: "scara", nume: "Scara", icon: "🪜", descriere: "Urcă treaptă cu treaptă rezolvând calcule.", clase: [1, 2, 3, 4], culoare: "#2f6fd1" },
  { id: "numaratoare", nume: "Numărătoarea magică", icon: "🧮", descriere: "Formează numere cu sute, zeci și unități.", clase: [1, 2, 3], culoare: "#e0483e" },
  { id: "fractii", nume: "Pizza fracțiilor", icon: "🍕", descriere: "Colorează felii și descoperă fracțiile.", clase: [2, 3, 4], culoare: "#e07a1f" },
];

export default function ZonaElev() {
  const [pr, setPr] = useState<Progres | null>(null);
  useEffect(() => {
    const p = citesteProgres();
    const q = Number(new URLSearchParams(location.search).get("clasa"));
    if ([1, 2, 3, 4, 5].includes(q)) p.clasa = q;
    setPr(p);
    sincronizeazaProgres().then((x) => setPr({ ...x, clasa: p.clasa }));
  }, []);
  const clasa = pr?.clasa ?? 2;
  const alegeClasa = (c: number) => {
    if (!pr) return;
    const p = { ...pr, clasa: c };
    salveazaProgres(p);
    setPr(p);
  };
  const totalStele = pr ? Object.values(pr.stele).reduce((a, b) => a + b, 0) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-galben-deschis to-mov-deschis px-4 pb-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between py-4">
        <Link href="/"><Image src="/brand/logo-mic.jpg" alt="Fabrica de Inteligență" width={56} height={56} className="rounded-xl" /></Link>
        <div className="flex gap-3 text-lg font-bold">
          <span className="rounded-2xl bg-white px-4 py-2 shadow">⭐ {totalStele}</span>
          <span className="rounded-2xl bg-white px-4 py-2 shadow" title="Puncte de Logică + Puncte de Viteză">🧠 {(pr?.puncteLogica ?? 0) + (pr?.puncteViteza ?? 0)}</span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-mov sm:text-4xl">Hai să ne jucăm cu matematica!</h1>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5].map((c) => (
            <button key={c} onClick={() => alegeClasa(c)}
              className={`rounded-2xl px-5 py-3 text-lg font-bold shadow ${clasa === c ? "bg-mov text-white" : "bg-white text-mov"}`}>
              Clasa {["I", "a II-a", "a III-a", "a IV-a", "a V-a"][c - 1]}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Link href="/elev/lectii" className="flex items-center gap-4 rounded-3xl bg-mov p-6 text-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
            <span className="text-6xl" aria-hidden>🧱</span>
            <span>
              <span className="block text-2xl font-bold">Lecții cu materiale</span>
              <span className="block text-white/85">Blocuri, axa numerelor, modelul în bară și altele, pas cu pas.</span>
            </span>
          </Link>
          <Link href="/elev/atelier" className="flex items-center gap-4 rounded-3xl bg-white p-6 shadow-md ring-2 ring-mov/20 transition hover:-translate-y-1 hover:shadow-xl">
            <span className="text-6xl" aria-hidden>🧰</span>
            <span>
              <span className="block text-2xl font-bold text-mov">Atelierul</span>
              <span className="block text-gray-600">Lucrează liber cu materialele: construiește, mută, descoperă.</span>
            </span>
          </Link>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {JOCURI.map((j) => {
            const disponibil = j.clase.includes(clasa);
            const stele = pr?.stele[`${j.id}-${clasa}`] ?? 0;
            const card = (
              <div className={`h-full rounded-3xl bg-white p-6 shadow-md transition ${disponibil ? "hover:-translate-y-1 hover:shadow-xl" : "opacity-50"}`}
                style={{ borderTop: `8px solid ${j.culoare}` }}>
                <div className="text-6xl">{j.icon}</div>
                <h2 className="mt-3 text-2xl font-bold" style={{ color: j.culoare }}>{j.nume}</h2>
                <p className="mt-1 text-gray-600">{j.descriere}</p>
                <div className="mt-3 text-2xl">{[1, 2, 3].map((s) => <span key={s} className={s <= stele ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
                {!disponibil && <p className="mt-2 text-sm font-semibold">Nu este disponibil pentru această clasă încă.</p>}
              </div>
            );
            return disponibil ? <Link key={j.id} href={`/elev/joc/${j.id}?clasa=${clasa}`}>{card}</Link> : <div key={j.id}>{card}</div>;
          })}
        </div>

        {pr && pr.trofee.length > 0 && (
          <section className="mt-10 rounded-3xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold text-mov">Trofeele mele</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {pr.trofee.map((t) => (
                <div key={t} className="rounded-2xl bg-galben-deschis px-4 py-2 text-center" title={TROFEE[t]?.descriere}>
                  <div className="text-3xl">{TROFEE[t]?.icon}</div>
                  <div className="text-sm font-bold">{TROFEE[t]?.nume}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
