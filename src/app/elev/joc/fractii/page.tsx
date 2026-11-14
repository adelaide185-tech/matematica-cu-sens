"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AntetJoc, Feedback, Final } from "@/jocuri/componente";
import { Adaptiv, inregistreaza, seteazaRezultat, steleDinGreseli } from "@/jocuri/progres";
import { Fractie } from "@/componente/svg/Vizual";
import { Rng, seedNou } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

const RUNDE = 8;
const NUMITORI = [[2, 4], [3, 4, 5, 6, 8], [5, 6, 8, 10, 12]];

interface Runda {
  tip: "coloreaza" | "recunoaste";
  forma: "cerc" | "dreptunghi";
  c: number;
  p: number;
  optiuni: string[];
}

function rundaNoua(rng: Rng, nivel: number, i: number): Runda {
  const p = rng.pick(NUMITORI[nivel]);
  const c = rng.int(1, p - 1);
  const tip = i % 2 === 0 ? "coloreaza" : "recunoaste";
  // variante greșite tipice: fracția inversată, partea necolorată, numitor greșit
  const corect = `${c}/${p}`;
  const distr = new Set([`${p}/${c}`, `${p - c}/${p}`, `${c}/${p + 1}`, `${c + 1}/${p}`].filter((x) => x !== corect));
  const optiuni = rng.shuffle([corect, ...rng.shuffle([...distr]).slice(0, 3)]);
  return { tip, forma: rng.bool(0.65) ? "cerc" : "dreptunghi", c, p, optiuni };
}

export default function JocFractii() {
  const [clasa, setClasa] = useState<Clasa>(3);
  const rng = useRef(new Rng(1));
  const adaptiv = useRef(new Adaptiv());
  const [nr, setNr] = useState(0);
  const [r, setR] = useState<Runda | null>(null);
  const [sel, setSel] = useState<boolean[]>([]);
  const [stare, setStare] = useState<"corect" | "gresit" | null>(null);
  const [greseli, setGreseli] = useState(0);
  const [final, setFinal] = useState<{ stele: number; trofee: string[] } | null>(null);

  const pregateste = (x: Runda) => {
    setR(x);
    setSel(Array(x.p).fill(false));
  };

  const start = useCallback((c: Clasa) => {
    rng.current = new Rng(seedNou());
    adaptiv.current = new Adaptiv(c >= 3 ? 1 : 0);
    setNr(0);
    setGreseli(0);
    setFinal(null);
    pregateste(rundaNoua(rng.current, adaptiv.current.nivel, 0));
  }, []);

  useEffect(() => {
    const q = Number(new URLSearchParams(location.search).get("clasa"));
    const c = ([2, 3, 4].includes(q) ? q : 3) as Clasa;
    setClasa(c);
    start(c);
  }, [start]);

  const raspunde = (ok: boolean) => {
    if (stare || !r) return;
    const nivel = adaptiv.current.raspuns(ok);
    setStare(ok ? "corect" : "gresit");
    if (!ok) setGreseli((g) => g + 1);
    setTimeout(() => {
      setStare(null);
      if (!ok) {
        if (r.tip === "coloreaza") setSel(Array(r.p).fill(false));
        return;
      }
      if (nr + 1 >= RUNDE) {
        const stele = steleDinGreseli(greseli);
        seteazaRezultat(RUNDE, RUNDE + greseli);
        const trofee = inregistreaza("fractii", clasa, stele, { logica: RUNDE }, stele === 3 ? ["fractii-3"] : []);
        setFinal({ stele, trofee });
      } else {
        setNr(nr + 1);
        pregateste(rundaNoua(rng.current, nivel, nr + 1));
      }
    }, ok ? 800 : 1500);
  };

  const colorate = sel.filter(Boolean).length;
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-galben-deschis pb-10">
      <AntetJoc titlu="🍕 Pizza fracțiilor" clasa={clasa} runda={nr} total={RUNDE} />
      {final ? (
        <Final stele={final.stele} trofeeNoi={final.trofee} clasa={clasa} onReia={() => start(clasa)} mesaj="Ești un adevărat bucătar de fracții!" />
      ) : r && (
        <div className="mx-auto max-w-3xl px-4 text-center">
          {r.tip === "coloreaza" ? (
            <>
              <p className="text-2xl font-bold text-mov-inchis">
                Colorează <Frac c={r.c} p={r.p} /> din {r.forma === "cerc" ? "pizza" : "ciocolată"}
              </p>
              <p className="mt-1 text-gray-600">Atinge feliile ca să le colorezi.</p>
              <motion.div key={`${nr}-${r.p}`} initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="mt-4 flex justify-center">
                <Fractie forma={r.forma} parti={r.p} colorate={0} selectate={sel} marime={2.4} culoare={r.forma === "cerc" ? "#e07a1f" : "#7b4a2a"}
                  onParte={(i) => !stare && setSel((s) => s.map((v, j) => (j === i ? !v : v)))} />
              </motion.div>
              <p className="mt-3 text-lg">Ai colorat <b>{colorate}</b> din <b>{r.p}</b> părți</p>
              <Feedback stare={stare} mesaj={`Trebuie colorate ${r.c} părți din ${r.p}.`} />
              <button onClick={() => raspunde(colorate === r.c)} className="mt-4 h-16 w-full max-w-xs rounded-2xl bg-mov text-2xl font-bold text-white shadow active:scale-95">Verifică ✓</button>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-mov-inchis">Ce fracție este colorată?</p>
              <motion.div key={`${nr}-${r.p}`} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 flex justify-center">
                <Fractie forma={r.forma} parti={r.p} colorate={r.c} marime={2.2} culoare="#6a59a7" />
              </motion.div>
              <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3">
                {r.optiuni.map((o) => {
                  const [c, p] = o.split("/").map(Number);
                  return (
                    <button key={o} onClick={() => raspunde(o === `${r.c}/${r.p}`)}
                      className="h-24 rounded-2xl bg-white text-3xl font-bold text-mov shadow ring-2 ring-mov/20 active:scale-95">
                      <Frac c={c} p={p} />
                    </button>
                  );
                })}
              </div>
              <Feedback stare={stare} mesaj={`Sunt colorate ${r.c} părți din ${r.p}: ${r.c}/${r.p}`} />
            </>
          )}
        </div>
      )}
    </main>
  );
}

function Frac({ c, p }: { c: number; p: number }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center align-middle leading-none" aria-label={`${c} pe ${p}`}>
      <span>{c}</span>
      <span className="my-0.5 h-[3px] w-full min-w-6 bg-current" />
      <span>{p}</span>
    </span>
  );
}
