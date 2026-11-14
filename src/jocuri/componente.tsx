"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TROFEE } from "./progres";

/** Tastatură numerică mare, pentru tabletă și tablă interactivă. */
export function Tastatura({ valoare, onChange, onTrimite, extra = [] }: { valoare: string; onChange: (v: string) => void; onTrimite: () => void; extra?: string[] }) {
  const taste = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ...extra, "0"];
  return (
    <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2 select-none">
      {taste.map((t) => (
        <button key={t} onClick={() => onChange((valoare + t).slice(0, 8))}
          className="h-16 rounded-2xl bg-white text-3xl font-bold text-mov shadow ring-1 ring-mov/20 active:scale-95">
          {t}
        </button>
      ))}
      <button onClick={() => onChange(valoare.slice(0, -1))} aria-label="Șterge" className="h-16 rounded-2xl bg-mov-deschis text-2xl font-bold text-mov active:scale-95">⌫</button>
      <button onClick={onTrimite} disabled={!valoare} className="col-span-3 h-16 rounded-2xl bg-mov text-2xl font-bold text-white shadow active:scale-95 disabled:opacity-40">
        Verifică ✓
      </button>
    </div>
  );
}

export function AntetJoc({ titlu, clasa, runda, total }: { titlu: string; clasa: number; runda: number; total: number }) {
  return (
    <header className="flex items-center justify-between gap-3 p-4">
      <Link href={`/elev?clasa=${clasa}`} className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">← Jocuri</Link>
      <h1 className="text-xl font-bold text-mov sm:text-2xl">{titlu}</h1>
      <div className="rounded-xl bg-white px-3 py-2 font-bold text-mov shadow">{Math.min(runda + 1, total)} / {total}</div>
    </header>
  );
}

export function Feedback({ stare, mesaj }: { stare: "corect" | "gresit" | null; mesaj?: string }) {
  return (
    <AnimatePresence>
      {stare && (
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
          className={`mx-auto mt-3 w-fit rounded-2xl px-5 py-2 text-xl font-bold ${stare === "corect" ? "bg-verde text-white" : "bg-portocaliu text-white"}`}>
          {stare === "corect" ? "Bravo! ✨" : mesaj ?? "Mai încearcă!"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Final({ stele, mesaj, trofeeNoi, onReia, clasa }: { stele: number; mesaj: string; trofeeNoi: string[]; onReia: () => void; clasa: number }) {
  return (
    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mx-auto mt-6 max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
      <div className="flex justify-center gap-2 text-6xl">
        {[1, 2, 3].map((s) => (
          <motion.span key={s} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 * s, type: "spring" }}
            className={s <= stele ? "" : "opacity-20 grayscale"}>⭐</motion.span>
        ))}
      </div>
      <p className="mt-4 text-2xl font-bold text-mov">{mesaj}</p>
      {trofeeNoi.map((t) => (
        <motion.div key={t} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }} className="mt-4 rounded-2xl bg-galben-deschis p-3">
          <div className="text-4xl">{TROFEE[t]?.icon}</div>
          <div className="font-bold">Trofeu nou: {TROFEE[t]?.nume}</div>
          <div className="text-sm text-gray-600">{TROFEE[t]?.descriere}</div>
        </motion.div>
      ))}
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={onReia} className="rounded-2xl bg-galben px-5 py-3 text-lg font-bold text-mov-inchis">Joacă din nou</button>
        <Link href={`/elev?clasa=${clasa}`} className="rounded-2xl bg-mov px-5 py-3 text-lg font-bold text-white">Alte jocuri</Link>
      </div>
    </motion.div>
  );
}
