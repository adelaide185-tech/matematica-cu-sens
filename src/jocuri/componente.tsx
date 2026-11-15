"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TROFEE } from "./progres";
import { tranzitie, useCelebrare } from "./miscare";

/** Tastatură numerică mare (taste ≥ 64 px), pentru tabletă și tablă interactivă. */
export function Tastatura({ valoare, onChange, onTrimite, extra = [] }: { valoare: string; onChange: (v: string) => void; onTrimite: () => void; extra?: string[] }) {
  const taste = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ...extra, "0"];
  return (
    <div className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3 select-none">
      {taste.map((t) => (
        <motion.button key={t} type="button" whileTap={{ scale: 0.93 }} transition={tranzitie("scurt")} onClick={() => onChange((valoare + t).slice(0, 8))}
          className="h-tinta rounded-2xl bg-hartie text-4xl font-extrabold text-mov-inchis shadow-sm ring-2 ring-mov/15">
          {t}
        </motion.button>
      ))}
      <motion.button type="button" whileTap={{ scale: 0.93 }} onClick={() => onChange(valoare.slice(0, -1))} aria-label="Șterge"
        className="h-tinta rounded-2xl bg-mov-deschis text-3xl font-bold text-mov">⌫</motion.button>
      <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onTrimite} disabled={!valoare}
        className="col-span-3 h-tinta rounded-2xl bg-mov text-2xl font-extrabold text-white shadow disabled:opacity-40">
        Verifică ✓
      </motion.button>
    </div>
  );
}

/** Antetul de joc: doar ieșirea, titlul și progresul. Nimic altceva pe ecran. */
export function AntetJoc({ titlu, clasa, runda, total }: { titlu: string; clasa: number; runda: number; total: number }) {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-4">
      <Link href={`/elev?clasa=${clasa}`} className="flex h-tinta items-center rounded-2xl bg-hartie px-5 text-lg font-bold text-mov shadow-sm">← Jocuri</Link>
      <h1 className="text-center text-2xl font-extrabold text-mov-inchis sm:text-3xl">{titlu}</h1>
      <div className="flex h-tinta min-w-tinta items-center justify-center rounded-2xl bg-hartie px-4 text-xl font-extrabold text-mov shadow-sm" aria-label={`Runda ${Math.min(runda + 1, total)} din ${total}`}>
        {Math.min(runda + 1, total)} / {total}
      </div>
    </header>
  );
}

export function Feedback({ stare, mesaj }: { stare: "corect" | "gresit" | null; mesaj?: string }) {
  return (
    <div aria-live="polite" className="min-h-[4.5rem]">
      <AnimatePresence>
        {stare && (
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={tranzitie("scurt")}
            className={`mx-auto mt-3 w-fit max-w-xl rounded-2xl px-6 py-3 text-2xl font-bold ${stare === "corect" ? "bg-verde text-white" : "bg-galben-deschis text-cerneala ring-2 ring-galben"}`}>
            {stare === "corect" ? "Bravo! ✨" : mesaj ?? "Mai încearcă!"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Final({ stele, mesaj, trofeeNoi, onReia, clasa }: { stele: number; mesaj: string; trofeeNoi: string[]; onReia: () => void; clasa: number }) {
  const redus = useReducedMotion();
  useCelebrare(true, stele >= 2 ? "mare" : "mica");
  return (
    <motion.div initial={redus ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={tranzitie("lung")}
      className="mx-auto mt-6 max-w-lg rounded-3xl bg-hartie p-8 text-center shadow-lg">
      <div className="flex justify-center gap-3 text-7xl" aria-label={`${stele} stele din 3`}>
        {[1, 2, 3].map((s) => (
          <motion.span key={s} initial={redus ? false : { scale: 0, rotate: -60 }} animate={{ scale: 1, rotate: 0 }} transition={tranzitie("mediu", 0.15 * s)}
            className={s <= stele ? "" : "opacity-20 grayscale"}>⭐</motion.span>
        ))}
      </div>
      <p className="mt-4 text-3xl font-extrabold text-mov-inchis">{mesaj}</p>
      {trofeeNoi.map((t) => (
        <motion.div key={t} initial={redus ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={tranzitie("mediu", 0.6)}
          className="mt-4 rounded-2xl bg-galben-deschis p-4">
          <div className="text-5xl">{TROFEE[t]?.icon}</div>
          <div className="text-lg font-bold">Trofeu nou: {TROFEE[t]?.nume}</div>
          <div className="text-gray-700">{TROFEE[t]?.descriere}</div>
        </motion.div>
      ))}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onReia} className="h-tinta rounded-2xl bg-galben px-7 text-xl font-bold text-mov-inchis shadow-sm">Joacă din nou</button>
        <Link href={`/elev?clasa=${clasa}`} className="flex h-tinta items-center rounded-2xl bg-mov px-7 text-xl font-bold text-white shadow-sm">Alte jocuri</Link>
      </div>
    </motion.div>
  );
}
