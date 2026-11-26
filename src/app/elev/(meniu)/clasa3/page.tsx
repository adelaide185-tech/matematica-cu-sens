"use client";

import { useState } from "react";
import Link from "next/link";
import { CAPITOLE, JOCURI, codificaC3, configC3Implicita } from "@/motor/clasa3/config";
import { ICON_CAPITOL, JOCURI_C3, NUME_CAPITOL, type CapitolC3 } from "@/motor/clasa3/tipuri";
import { seedNou } from "@/motor/rng";

/** Jocurile de clasa a III-a, ca joc liber: elevul alege capitolele și jocul. */
export default function JocuriClasa3() {
  const [capitole, setCapitole] = useState<CapitolC3[]>(["adunare", "inmultire", "impartire"]);
  const [nr, setNr] = useState(10);
  const link = (joc: (typeof JOCURI)[number]) =>
    `/elev/clasa3/joc?c=${codificaC3({ ...configC3Implicita(seedNou()), joc, nr, capitole: joc === "constructor" ? ["fractii", "masuri"] : capitole, vieti: 3 })}`;
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12">
      <h1 className="mt-4 text-center text-3xl font-bold text-mov sm:text-4xl">Jocuri de matematică – clasa a III-a</h1>
      <section className="mt-5 rounded-3xl bg-hartie p-4 shadow">
        <h2 className="font-bold text-mov">Ce vrei să exersezi?</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CAPITOLE.map((c) => {
            const ales = capitole.includes(c);
            return (
              <button key={c} type="button" onClick={() => { const l = ales ? capitole.filter((x) => x !== c) : [...capitole, c]; if (l.length) setCapitole(l); }}
                className={`min-h-12 rounded-2xl px-3 py-2 font-semibold ${ales ? "bg-mov text-white" : "bg-white text-mov ring-2 ring-mov/20"}`}>
                <span aria-hidden>{ICON_CAPITOL[c]}</span> {NUME_CAPITOL[c]}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-semibold text-mov">Câte exerciții:
          {[10, 15, 20, 25].map((n) => <button key={n} type="button" onClick={() => setNr(n)} className={`h-12 w-14 rounded-2xl ${nr === n ? "bg-mov text-white" : "bg-white ring-2 ring-mov/20"}`}>{n}</button>)}
        </div>
      </section>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {JOCURI.map((j) => (
          <Link key={j} href={link(j)} className="rounded-3xl bg-hartie p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl" style={{ borderTop: `8px solid ${JOCURI_C3[j].culoare}` }}>
            <div className="text-6xl" aria-hidden>{JOCURI_C3[j].icon}</div>
            <h2 className="mt-3 text-2xl font-bold" style={{ color: JOCURI_C3[j].culoare }}>{JOCURI_C3[j].nume}</h2>
            <p className="mt-1 text-gray-600">{JOCURI_C3[j].descriere}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
