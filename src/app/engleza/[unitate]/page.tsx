"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ACTIVITATI_EN, unitate, type ActivitateEn } from "@/engleza/continut";
import { Imagine } from "@/engleza/Activitati";
import { citesteProgres } from "@/jocuri/progres";
import { spune } from "@/engleza/voce";

/** O unitate: cuvintele (atinge ca să le auzi) și cele 3 activități. */
export default function PaginaUnitate() {
  const { unitate: id } = useParams<{ unitate: string }>();
  const u = unitate(id);
  const [stele, setStele] = useState<Record<string, number>>({});
  useEffect(() => setStele(citesteProgres().stele), []);
  if (!u) return <main className="p-8 text-center">Unitatea nu există. <Link href="/engleza" className="text-mov underline">Înapoi</Link></main>;
  return (
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto min-h-screen max-w-5xl px-4 pb-12">
      <header className="flex items-center gap-3 py-4">
        <Link href="/engleza" className="rounded-2xl bg-white px-4 py-2 text-2xl font-bold text-mov shadow" aria-label="Înapoi la unități">←</Link>
        <span className="text-5xl" aria-hidden>{u.icon}</span>
        <h1 className="text-3xl font-extrabold sm:text-4xl" style={{ color: u.culoare }}>{u.titlu} <span className="text-xl font-bold text-gray-500">· {u.titluRo}</span></h1>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(ACTIVITATI_EN) as ActivitateEn[]).map((a) => {
          const s = stele[`en-${u.id}-${a}-0`] ?? 0;
          return (
            <Link key={a} href={`/engleza/${u.id}/${a}`} className="flex flex-col items-center gap-1 rounded-[2rem] bg-white p-5 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl">
              <span className="text-6xl" aria-hidden>{ACTIVITATI_EN[a].icon}</span>
              <span className="text-2xl font-extrabold text-mov">{ACTIVITATI_EN[a].nume}</span>
              <span className="text-sm text-gray-600">{ACTIVITATI_EN[a].descriere}</span>
              <span className="mt-1 text-xl" aria-label={`${s} stele`}>{[1, 2, 3].map((k) => <span key={k} className={k <= s ? "" : "opacity-20 grayscale"}>⭐</span>)}</span>
            </Link>
          );
        })}
      </div>
      <h2 className="mt-8 text-xl font-bold text-mov">Cuvintele unității <span className="text-sm font-normal text-gray-500">(atinge o imagine ca s-o auzi)</span></h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {u.cuvinte.map((c) => (
          <button key={c.en} type="button" onClick={() => spune(c.en)} className="flex flex-col items-center gap-2 rounded-3xl bg-white p-4 shadow active:scale-95" aria-label={`Ascultă: ${c.en}`}>
            <span className="grid h-24 place-items-center"><Imagine c={c} marime={c.numar ? 0.6 : 0.75} /></span>
            <span className="text-xl font-extrabold" style={{ color: u.culoare }}>{c.en}</span>
            <span className="text-sm text-gray-500">{c.ro}</span>
          </button>
        ))}
      </div>
    </div></main>
  );
}
