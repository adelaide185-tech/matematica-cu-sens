"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Manipulativ } from "@/manipulative/Manipulativ";
import { lectie, steleLectie } from "@/lectii/lectii";
import { NoteProfesor } from "@/lectii/NoteProfesor";
import { inregistreaza, seteazaRezultat } from "@/jocuri/progres";
import { Final } from "@/jocuri/componente";
import type { StareManip } from "@/manipulative/stare";

const MESAJE_BRAVO = ["Bravo! ✨", "Exact! 🌟", "Ai găsit singur! 🎉", "Foarte bine! 👏"];

export default function PlayerLectie() {
  const { id } = useParams<{ id: string }>();
  const l = lectie(id);
  const [pas, setPas] = useState(0);
  const [stare, setStare] = useState<StareManip | null>(l?.pasi[0].start ?? null);
  const [raspuns, setRaspuns] = useState("");
  const [greseli, setGreseli] = useState(0);
  const [mesaj, setMesaj] = useState<{ tip: "bine" | "inca" | "ajutor"; text: string } | null>(null);
  const [rezolvat, setRezolvat] = useState(false);
  const [dinPrima, setDinPrima] = useState(0);
  const [final, setFinal] = useState<{ stele: number; trofee: string[] } | null>(null);
  const [profesor, setProfesor] = useState(false);
  const [note, setNote] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(location.search).get("profesor") === "1";
    setProfesor(p);
    setNote(p);
  }, []);

  if (!l || !stare) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mov-deschis p-6">
        <p className="text-2xl font-bold text-mov">Lecția nu există.</p>
        <Link href="/elev/lectii" className="rounded-2xl bg-mov px-5 py-3 font-bold text-white">Vezi lecțiile</Link>
      </main>
    );
  }

  const p = l.pasi[pas];
  const verificate = l.pasi.filter((x) => x.verifica).length;

  const incepePas = (i: number) => {
    setPas(i);
    setStare(l.pasi[i].start);
    setRaspuns("");
    setGreseli(0);
    setMesaj(null);
    setRezolvat(false);
  };

  const termina = (corecteFinal: number) => {
    const stele = steleLectie(corecteFinal, verificate);
    seteazaRezultat(corecteFinal, verificate);
    const trofee = inregistreaza(`lectie-${l.id}`, l.clasa, stele, { logica: corecteFinal * 2 }, []);
    setFinal({ stele, trofee });
  };

  const urmatorul = (corecte = dinPrima) => {
    if (pas + 1 >= l.pasi.length) termina(corecte);
    else incepePas(pas + 1);
  };

  const verifica = () => {
    if (!p.verifica) return urmatorul();
    const r = raspuns.trim() === "" ? null : Number(raspuns);
    const v = p.verifica(stare, r);
    if (v === true) {
      setRezolvat(true);
      const nou = greseli === 0 ? dinPrima + 1 : dinPrima;
      if (greseli === 0) setDinPrima(nou);
      setMesaj({ tip: "bine", text: greseli === 0 ? MESAJE_BRAVO[pas % MESAJE_BRAVO.length] : "Bravo, ai reușit! Ai lucrat cu ajutor." });
      return;
    }
    const g = greseli + 1;
    setGreseli(g);
    const indicii = p.indicii ?? [];
    if (g > indicii.length) {
      // după toate indiciile: arătăm rezolvarea, apoi copilul o poate reface sau merge mai departe
      if (p.solutie?.stare) setStare(p.solutie.stare);
      if (p.solutie?.raspuns !== undefined) setRaspuns(String(p.solutie.raspuns));
      setMesaj({ tip: "ajutor", text: "Hai să ne uităm împreună la rezolvare. Uită-te bine, apoi mergi mai departe." });
      setRezolvat(true);
    } else {
      setMesaj({ tip: "inca", text: `${v} 💡 ${indicii[g - 1]}` });
    }
  };

  const reia = () => {
    setDinPrima(0);
    setFinal(null);
    incepePas(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-galben-deschis to-mov-deschis pb-12">
      <header className="flex flex-wrap items-center justify-between gap-3 p-4">
        <Link href={profesor ? "/profesor/lectii" : "/elev/lectii"} className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">← Lecții</Link>
        <h1 className="text-xl font-bold text-mov sm:text-2xl">{l.icon} {l.titlu}</h1>
        <div className="flex items-center gap-2">
          {profesor && (
            <button onClick={() => setNote((x) => !x)} className={`rounded-xl px-3 py-2 font-bold shadow ${note ? "bg-mov text-white" : "bg-white text-mov"}`}>📋 Note</button>
          )}
          <div className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">{Math.min(pas + 1, l.pasi.length)} / {l.pasi.length}</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/70" role="progressbar" aria-valuemin={0} aria-valuemax={l.pasi.length} aria-valuenow={final ? l.pasi.length : pas}>
          <motion.div className="h-full rounded-full bg-verde" initial={{ width: 0 }} animate={{ width: `${((final ? l.pasi.length : pas) / l.pasi.length) * 100}%` }} />
        </div>

        {final ? (
          <Final stele={final.stele} trofeeNoi={final.trofee} clasa={l.clasa} onReia={reia} mesaj="Ai terminat lecția!" />
        ) : (
          <div className={`grid gap-4 ${note ? "lg:grid-cols-[1fr_20rem]" : ""}`}>
            <section className="rounded-3xl bg-white/80 p-4 shadow-lg sm:p-6">
              <motion.p key={pas} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="mb-4 rounded-2xl bg-white px-4 py-3 text-center text-xl font-bold text-mov-inchis shadow-sm sm:text-2xl">
                {p.text}
              </motion.p>

              <Manipulativ key={`${pas}`} stare={stare} onChange={(s) => !rezolvat && setStare(s)} blocat={rezolvat} arataNumar={p.arataNumar ?? true} />

              {p.intrebare && (
                <form className="mt-5 flex flex-wrap items-center justify-center gap-3" onSubmit={(e) => { e.preventDefault(); if (!rezolvat) verifica(); }}>
                  <label htmlFor="raspuns" className="text-2xl font-bold text-mov-inchis">{p.intrebare}</label>
                  <input id="raspuns" inputMode="numeric" autoComplete="off" value={raspuns} disabled={rezolvat}
                    onChange={(e) => setRaspuns(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
                    className="h-16 w-32 rounded-2xl border-4 border-mov/30 bg-white text-center text-3xl font-bold text-mov-inchis outline-none focus:border-mov" />
                </form>
              )}

              <AnimatePresence mode="wait">
                {mesaj && (
                  <motion.div key={mesaj.text} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} role="status"
                    className={`mx-auto mt-4 max-w-2xl rounded-2xl px-5 py-3 text-center text-lg font-bold ${
                      mesaj.tip === "bine" ? "bg-verde text-white" : mesaj.tip === "ajutor" ? "bg-albastru text-white" : "bg-galben-deschis text-mov-inchis ring-2 ring-galben"
                    }`}>
                    {mesaj.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {!rezolvat && p.verifica && (
                  <button onClick={verifica} className="h-16 w-full max-w-xs rounded-2xl bg-mov text-2xl font-bold text-white shadow active:scale-95">Verifică ✓</button>
                )}
                {!rezolvat && p.verifica && greseli > 0 && (
                  <button onClick={() => { setStare(p.start); setRaspuns(""); setMesaj(null); }} className="h-16 rounded-2xl bg-white px-5 text-lg font-bold text-mov shadow">↺ De la capăt</button>
                )}
                {(rezolvat || !p.verifica) && (
                  <button onClick={() => urmatorul()} className="h-16 w-full max-w-xs rounded-2xl bg-verde text-2xl font-bold text-white shadow active:scale-95">
                    {pas + 1 >= l.pasi.length ? "Termină lecția 🎉" : "Mai departe →"}
                  </button>
                )}
              </div>
            </section>

            {note && (
              <aside className="rounded-3xl bg-white p-5 shadow-lg" aria-label="Note pentru profesor">
                <h2 className="mb-3 text-lg font-bold text-mov">📋 Note pentru profesor</h2>
                <NoteProfesor l={l} />
              </aside>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
