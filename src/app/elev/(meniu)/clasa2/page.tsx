"use client";

import { useState } from "react";
import Link from "next/link";
import { JOCURI_LISTA_C2, codificaC2, configC2Implicita } from "@/motor/clasa2/config";
import { CAPITOLE_C2, COMPATIBIL, JOCURI_C2, type NotiuneC2 } from "@/motor/clasa2/tipuri";
import { seedNou } from "@/motor/rng";
import { PuzzleC2 } from "@/jocuri/c2/Puzzle";

/** Jocurile clasei a II-a, ca joc liber: copilul alege ce exersează și jocul. */
export default function JocuriClasa2() {
  const [notiuni, setNotiuni] = useState<NotiuneC2[]>(["op.tabla", "op.adunare", "op.scadere"]);
  const link = (joc: (typeof JOCURI_LISTA_C2)[number]) => `/elev/clasa2/joc?c=${codificaC2({ ...configC2Implicita(seedNou()), joc, notiuni, nr: 10, nivel: "alege", vieti: 3 })}`;
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12">
      <h1 className="mt-4 text-center text-3xl font-bold text-mov sm:text-4xl">Jocuri – clasa a II-a</h1>
      <section className="mt-5 grid gap-3 rounded-3xl bg-hartie p-4 shadow">
        {CAPITOLE_C2.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2">
            <span className="w-32 font-bold text-mov"><span aria-hidden>{c.icon}</span> {c.nume}</span>
            {c.notiuni.map(([n, nume]) => {
              const ales = notiuni.includes(n);
              return (
                <button key={n} type="button" onClick={() => { const l = ales ? notiuni.filter((x) => x !== n) : [...notiuni, n]; if (l.length) setNotiuni(l); }}
                  className={`min-h-12 rounded-2xl px-3 py-2 font-semibold ${ales ? "bg-mov text-white" : "bg-white text-mov ring-2 ring-mov/20"}`}>{nume}</button>
              );
            })}
          </div>
        ))}
      </section>
      <Link href={`/elev/clasa2/joc?c=${codificaC2({ ...configC2Implicita(seedNou()), notiuni, nr: 15, nivel: "alege", vieti: 3, mix: true })}`}
        className="mt-6 flex items-center gap-4 rounded-3xl bg-mov p-5 text-white shadow-lg transition hover:-translate-y-1">
        <span className="text-5xl" aria-hidden>🎲</span>
        <span className="flex-1"><span className="block text-2xl font-bold">Mix: mai multe jocuri la rând</span><span className="block text-white/90">Recunoaștere, apoi scriere, apoi viteză.</span></span>
      </Link>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {JOCURI_LISTA_C2.map((j) => {
          const ok = notiuni.some((n) => COMPATIBIL[j].includes(n));
          const card = (
            <div className={`h-full rounded-3xl bg-hartie p-6 shadow-md transition ${ok ? "hover:-translate-y-1 hover:shadow-xl" : "opacity-50"}`} style={{ borderTop: `8px solid ${JOCURI_C2[j].culoare}` }}>
              <div className="text-6xl" aria-hidden>{JOCURI_C2[j].icon}</div>
              <h2 className="mt-3 text-2xl font-bold" style={{ color: JOCURI_C2[j].culoare }}>{JOCURI_C2[j].nume}</h2>
              <p className="mt-1 text-gray-600">{JOCURI_C2[j].descriere}</p>
            </div>
          );
          return ok ? <Link key={j} href={link(j)}>{card}</Link> : <div key={j} title="Alege altă noțiune pentru acest joc">{card}</div>;
        })}
      </div>
      <PuzzleC2 />
    </main>
  );
}
