"use client";

import { useEffect, useMemo, useState } from "react";
import { JocArcade, JOCURI_ARCADE, type JocArcadeId } from "@/jocuri/arcade/JocArcade";
import { intrebariArcade, type DificultateArcade } from "@/motor/arcade/intrebari";
import type { VitezaArcade } from "@/motor/arcade/scor";
import { inregistreaza, seteazaRezultat } from "@/jocuri/progres";
import { seedNou } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

interface Setari { joc: JocArcadeId; clasa: Clasa; viteza: VitezaArcade; n: number; dif: DificultateArcade; seed: number }

/** Jocul arcade: /elev/arcade/joc?j=baloane&clasa=3&v=2&n=10&d=mediu */
export default function PaginaJocArcade() {
  const [s, setS] = useState<Setari | null>(null);
  const [runda, setRunda] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const joc = (Object.keys(JOCURI_ARCADE) as JocArcadeId[]).includes(q.get("j") as JocArcadeId) ? (q.get("j") as JocArcadeId) : "baloane";
    const clasa = ([1, 2, 3, 4, 5].includes(Number(q.get("clasa"))) ? Number(q.get("clasa")) : 2) as Clasa;
    const viteza = ([1, 2, 3].includes(Number(q.get("v"))) ? Number(q.get("v")) : 1) as VitezaArcade;
    const n = [5, 10, 15, 20].includes(Number(q.get("n"))) ? Number(q.get("n")) : 10;
    const dif = (["usor", "mediu", "greu"].includes(q.get("d") ?? "") ? q.get("d") : "mediu") as DificultateArcade;
    setS({ joc, clasa, viteza, n, dif, seed: Number(q.get("seed")) || seedNou() });
  }, []);
  const intrebari = useMemo(() => (s ? intrebariArcade(s.clasa, s.seed, s.n, s.dif) : []), [s]);
  if (!s) return <p className="p-8 text-center text-lg">Se încarcă jocul…</p>;
  return (
    <JocArcade key={`${s.seed}-${runda}`} joc={s.joc} viteza={s.viteza} intrebari={intrebari} seed={s.seed} inapoi={`/elev/arcade?clasa=${s.clasa}`}
      titlu={`${JOCURI_ARCADE[s.joc].nume} · clasa ${["I", "a II-a", "a III-a", "a IV-a", "a V-a"][s.clasa - 1]}`}
      onFinal={({ rezultat }) => {
        seteazaRezultat(rezultat.rezolvate, intrebari.length);
        inregistreaza(`arc-${s.joc}`, s.clasa, rezultat.stele, { viteza: Math.min(50, rezultat.dinPrima) }, []);
      }}
      onReia={() => { setS({ ...s, seed: seedNou() }); setRunda((r) => r + 1); }} />
  );
}
