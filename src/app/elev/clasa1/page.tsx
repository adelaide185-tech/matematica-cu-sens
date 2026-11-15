"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CAPITOLE_C1 } from "@/motor/clasa1/capitole";
import { configImplicitaC1, decodificaC1 } from "@/motor/clasa1/config";
import { dreaptaTable, genereazaClasa1, pasC1, pentruElev, rezultatC1 } from "@/motor/clasa1/sesiune";
import type { CapitolC1, ConfigClasa1, RaspunsElevC1 } from "@/motor/clasa1/tipuri";
import { seedNou } from "@/motor/rng";
import { JocClasa1 } from "@/jocuri/clasa1/JocClasa1";

/** Jocul liber al clasei I (fără cont) și previzualizarea profesorului (?c=configurație). */
export default function PaginaClasa1() {
  return (
    <Suspense fallback={<main className="p-8 text-center text-xl text-mov">Pregătim jocul…</main>}>
      <JocLiber />
    </Suspense>
  );
}

function JocLiber() {
  const sp = useSearchParams();
  const dinProfesor = useMemo(() => decodificaC1(sp.get("c")), [sp]);
  const [cfg, setCfg] = useState<ConfigClasa1 | null>(dinProfesor);
  const [runda, setRunda] = useState(0);

  if (!cfg) return <Alegere onStart={(c) => setCfg(c)} />;
  return <Sesiune key={`${cfg.seed}-${runda}`} cfg={cfg} previzualizare={Boolean(dinProfesor)}
    onReia={() => { setCfg({ ...cfg, seed: seedNou() }); setRunda((r) => r + 1); }} />;
}

function Sesiune({ cfg, previzualizare, onReia }: { cfg: ConfigClasa1; previzualizare: boolean; onReia: () => void }) {
  const { exercitii } = useMemo(() => genereazaClasa1(cfg), [cfg]);
  const elev = useMemo(() => pentruElev(exercitii), [exercitii]);
  const dreapta = useMemo(() => dreaptaTable(exercitii, cfg.seed), [exercitii, cfg.seed]);
  const verifica = useCallback(async (i: number, dat: unknown, inc: number) => pasC1(exercitii[i], dat, inc), [exercitii]);
  const termina = useCallback(async (r: RaspunsElevC1[]) => {
    const x = rezultatC1(exercitii, r);
    return { corecte: x.corecte, total: x.total, procent: x.procent, medalie: x.medalie, stele: x.stele };
  }, [exercitii]);
  if (!exercitii.length) return <main className="p-8 text-center">Nu am putut pregăti exercițiile. <Link href="/elev/clasa1" className="text-mov underline">Înapoi</Link></main>;
  return (
    <JocClasa1 titlu={previzualizare ? `Previzualizare · ${cfg.antet.titlu}` : "Jocurile clasei I"} exercitii={elev} dreapta={dreapta}
      cronometru={cfg.cronometru} secunde={cfg.secunde} verifica={verifica} termina={termina} onReia={onReia}
      inapoi={previzualizare ? { href: "/profesor/clasa1", text: "Profesor" } : { href: "/elev?clasa=1", text: "Jocuri" }} />
  );
}

function Alegere({ onStart }: { onStart: (c: ConfigClasa1) => void }) {
  const [alese, setAlese] = useState<CapitolC1[]>([]);
  const [n, setN] = useState(10);
  const comuta = (id: CapitolC1) => setAlese((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const start = () => onStart({ ...configImplicitaC1(seedNou()), capitole: alese, n });
  return (
    <main className="min-h-screen bg-crem px-4 pb-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between py-4">
        <Link href="/elev?clasa=1" className="flex h-tinta items-center rounded-2xl bg-hartie px-5 text-lg font-bold text-mov shadow-sm">← Jocuri</Link>
      </header>
      <h1 className="text-center text-3xl font-extrabold text-mov sm:text-4xl">Ce vrei să exersezi?</h1>
      <p className="mt-1 text-center text-lg text-gray-700">Atinge unul sau mai multe cartonașe.</p>
      <div className="mx-auto mt-6 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPITOLE_C1.map((c) => {
          const ales = alese.includes(c.id);
          return (
            <motion.button key={c.id} type="button" whileTap={{ scale: 0.97 }} onClick={() => comuta(c.id)} aria-pressed={ales}
              className={`flex min-h-[7rem] items-center gap-4 rounded-3xl p-5 text-left shadow-md transition ${ales ? "bg-mov text-white ring-4 ring-galben" : "bg-hartie text-mov-inchis"}`}>
              <span className="text-5xl" aria-hidden>{c.icon}</span>
              <span className="text-2xl font-extrabold">{c.scurt}</span>
              {ales && <span className="ml-auto text-3xl" aria-hidden>✓</span>}
            </motion.button>
          );
        })}
      </div>
      <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-3">
        <span className="text-xl font-bold text-mov-inchis">Câte exerciții?</span>
        {[10, 15, 20].map((k) => (
          <button key={k} type="button" onClick={() => setN(k)} aria-pressed={n === k}
            className={`h-tinta min-w-tinta rounded-2xl px-5 text-2xl font-extrabold shadow ${n === k ? "bg-mov text-white" : "bg-hartie text-mov"}`}>{k}</button>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button type="button" disabled={!alese.length} onClick={start}
          className="h-20 rounded-3xl bg-galben px-12 text-3xl font-extrabold text-mov-inchis shadow-lg disabled:opacity-40">Hai să ne jucăm! 🚀</button>
      </div>
    </main>
  );
}
