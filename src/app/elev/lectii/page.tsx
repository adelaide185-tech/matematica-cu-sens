"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LECTII } from "@/lectii/lectii";
import { citesteProgres } from "@/jocuri/progres";
import { MANIPULATIVE } from "@/manipulative/stare";

export default function ListaLectii() {
  const [stele, setStele] = useState<Record<string, number>>({});
  useEffect(() => setStele(citesteProgres().stele), []);
  const capitole = [...new Set(LECTII.map((l) => l.capitol))];

  return (
    <main className="min-h-screen bg-gradient-to-b from-galben-deschis to-mov-deschis px-4 pb-12">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/elev" className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">← Jocuri</Link>
        <Link href="/elev/atelier" className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">🧰 Atelierul</Link>
      </header>
      <section className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-mov sm:text-4xl">Lecții cu materiale</h1>
        <p className="mt-2 text-center text-lg text-gray-700">Clasa a II-a · Pui mâna, vezi, apoi scrii.</p>

        {capitole.map((c) => (
          <div key={c} className="mt-8">
            <h2 className="mb-3 text-2xl font-bold text-mov-inchis">{c}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LECTII.filter((l) => l.capitol === c).map((l) => {
                const s = stele[`lectie-${l.id}-${l.clasa}`] ?? 0;
                const m = MANIPULATIVE.find((x) => x.tip === l.manipulativ);
                return (
                  <Link key={l.id} href={`/elev/lectii/${l.id}`}
                    className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="text-5xl" aria-hidden>{l.icon}</div>
                    <h3 className="mt-2 text-xl font-bold text-mov">{l.titlu}</h3>
                    <p className="mt-1 text-sm text-gray-600">{m?.icon} {m?.nume} · {l.pasi.length} pași · ~{l.minute} min</p>
                    <div className="mt-auto pt-3 text-2xl" aria-label={`${s} stele din 3`}>
                      {[1, 2, 3].map((k) => <span key={k} className={k <= s ? "" : "opacity-20 grayscale"}>⭐</span>)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
