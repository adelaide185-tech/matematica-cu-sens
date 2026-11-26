"use client";

import { useState } from "react";
import Link from "next/link";
import { CAPITOLE_C5, JOCURI_C5, codificaC5, configC5Implicita } from "@/motor/clasa5/config";
import { ICON_CAPITOL_C5, NUME_CAPITOL_C5, type CapitolC5 } from "@/motor/clasa5/tipuri";
import { NUME_NIVEL_C4 as NUME_NIVEL_C5, type NivelC4 as NivelC5 } from "@/motor/clasa4/tipuri";
import { JOCURI_C3 } from "@/motor/clasa3/tipuri";
import { seedNou } from "@/motor/rng";

/** Jocurile de clasa a V-a, ca joc liber: elevul alege capitolele, nivelul și jocul. */
export default function JocuriClasa5() {
  const [capitole, setCapitole] = useState<CapitolC5[]>(["puteri", "fractii", "zecimale"]);
  const [nivel, setNivel] = useState<NivelC5>("1");
  const [nr, setNr] = useState(10);
  const link = (joc: (typeof JOCURI_C5)[number]) =>
    `/elev/clasa5/joc?c=${codificaC5({ ...configC5Implicita(seedNou()), joc, nr, nivel, capitole: joc === "constructor" ? ["arie"] : capitole, vieti: 3 })}`;
  return (
    <main className="mx-auto max-w-5xl px-4 pb-12">
      <h1 className="mt-4 text-center text-3xl font-bold text-mov sm:text-4xl">Jocuri de matematică – clasa a V-a</h1>
      <section className="mt-5 rounded-3xl bg-hartie p-4 shadow">
        <h2 className="font-bold text-mov">Ce vrei să exersezi?</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CAPITOLE_C5.map((c) => {
            const ales = capitole.includes(c);
            return (
              <button key={c} type="button" onClick={() => { const l = ales ? capitole.filter((x) => x !== c) : [...capitole, c]; if (l.length) setCapitole(l); }}
                className={`min-h-12 rounded-2xl px-3 py-2 font-semibold ${ales ? "bg-mov text-white" : "bg-white text-mov ring-2 ring-mov/20"}`}>
                <span aria-hidden>{ICON_CAPITOL_C5[c]}</span> {NUME_CAPITOL_C5[c]}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 font-semibold text-mov">Nivelul:
          {(["1", "2", "amestecat"] as NivelC5[]).map((n) => <button key={n} type="button" onClick={() => setNivel(n)} className={`h-12 rounded-2xl px-4 ${nivel === n ? "bg-mov text-white" : "bg-white ring-2 ring-mov/20"}`}>{NUME_NIVEL_C5[n]}</button>)}
          <span className="ml-4">Câte exerciții:</span>
          {[10, 15, 20].map((n) => <button key={n} type="button" onClick={() => setNr(n)} className={`h-12 w-14 rounded-2xl ${nr === n ? "bg-mov text-white" : "bg-white ring-2 ring-mov/20"}`}>{n}</button>)}
        </div>
      </section>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {JOCURI_C5.map((j) => (
          <Link key={j} href={link(j)} className="rounded-3xl bg-hartie p-6 shadow-md transition hover:-translate-y-1 hover:shadow-xl" style={{ borderTop: `8px solid ${JOCURI_C3[j].culoare}` }}>
            <div className="text-6xl" aria-hidden>{JOCURI_C3[j].icon}</div>
            <h2 className="mt-3 text-2xl font-bold" style={{ color: JOCURI_C3[j].culoare }}>{JOCURI_C3[j].nume}</h2>
            <p className="mt-1 text-gray-600">{j === "constructor" ? "Construiește pe grilă dreptunghiuri cu aria cerută." : JOCURI_C3[j].descriere}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
