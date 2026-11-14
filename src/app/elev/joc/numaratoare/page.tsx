"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AntetJoc, Feedback, Final } from "@/jocuri/componente";
import { Adaptiv, inregistreaza, seteazaRezultat, steleDinGreseli } from "@/jocuri/progres";
import { Numaratoare } from "@/componente/svg/Vizual";
import { numarInLitere } from "@/motor/limba";
import { Rng, seedNou } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

const RUNDE = 8;
type Ordin = "mii" | "sute" | "zeci" | "unitati";
type Stare = Record<Ordin, number>;
const ZERO: Stare = { mii: 0, sute: 0, zeci: 0, unitati: 0 };

function cifreClasa(c: Clasa) {
  return c === 1 ? 2 : c === 2 ? 3 : 4;
}

/** Cum se cere numărul: cu cifre, cu litere sau ca sumă amestecată (după dificultatea adaptivă). */
function cerinta(rng: Rng, clasa: Clasa, nivel: number): { tinta: number; text: string } {
  const k = cifreClasa(clasa);
  const tinta = rng.int(10 ** (k - 1), 10 ** k - 1);
  if (nivel === 0) return { tinta, text: String(tinta) };
  if (nivel === 1) return { tinta, text: numarInLitere(tinta) };
  const c = String(tinta).split("").map(Number);
  const nume = ["unități", "zeci", "sute", "mii"];
  const parti = c
    .map((d, i) => ({ d, o: c.length - 1 - i }))
    .filter((x) => x.d > 0)
    .map((x) => `${x.d} ${x.d === 1 ? ["unitate", "zece", "sută", "mie"][x.o] : nume[x.o]}`);
  return { tinta, text: rng.shuffle(parti).join(" + ") };
}

export default function JocNumaratoare() {
  const [clasa, setClasa] = useState<Clasa>(2);
  const rng = useRef(new Rng(1));
  const adaptiv = useRef(new Adaptiv());
  const [runda, setRunda] = useState(0);
  const [cer, setCer] = useState<{ tinta: number; text: string } | null>(null);
  const [bile, setBile] = useState<Stare>(ZERO);
  const [stare, setStare] = useState<"corect" | "gresit" | null>(null);
  const [greseli, setGreseli] = useState(0);
  const [final, setFinal] = useState<{ stele: number; trofee: string[] } | null>(null);

  const start = useCallback((c: Clasa) => {
    rng.current = new Rng(seedNou());
    adaptiv.current = new Adaptiv();
    setRunda(0);
    setGreseli(0);
    setFinal(null);
    setBile(ZERO);
    setCer(cerinta(rng.current, c, 0));
  }, []);

  useEffect(() => {
    const q = Number(new URLSearchParams(location.search).get("clasa"));
    const c = ([1, 2, 3].includes(q) ? q : 2) as Clasa;
    setClasa(c);
    start(c);
  }, [start]);

  const k = cifreClasa(clasa);
  const valoare = bile.mii * 1000 + bile.sute * 100 + bile.zeci * 10 + bile.unitati;

  const modifica = (o: Ordin, d: 1 | -1) => {
    if (stare) return;
    setBile((b) => ({ ...b, [o]: Math.min(9, Math.max(0, b[o] + d)) }));
  };

  const verifica = () => {
    if (!cer || stare) return;
    const ok = valoare === cer.tinta;
    const nivel = adaptiv.current.raspuns(ok);
    setStare(ok ? "corect" : "gresit");
    if (!ok) setGreseli((g) => g + 1);
    setTimeout(() => {
      setStare(null);
      if (!ok) return; // mai încearcă aceeași cerință
      setBile(ZERO);
      if (runda + 1 >= RUNDE) {
        const stele = steleDinGreseli(greseli);
        seteazaRezultat(RUNDE, RUNDE + greseli);
        const trofee = inregistreaza("numaratoare", clasa, stele, { logica: RUNDE }, stele === 3 ? ["numaratoare-3"] : []);
        setFinal({ stele, trofee });
      } else {
        setRunda((r) => r + 1);
        setCer(cerinta(rng.current, clasa, nivel));
      }
    }, ok ? 800 : 1400);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-mov-deschis pb-10">
      <AntetJoc titlu="🧮 Numărătoarea magică" clasa={clasa} runda={runda} total={RUNDE} />
      {final ? (
        <Final stele={final.stele} trofeeNoi={final.trofee} clasa={clasa} onReia={() => start(clasa)} mesaj="Ai format toate numerele!" />
      ) : (
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-lg font-semibold text-gray-700">Formează pe numărătoare numărul:</p>
          <motion.div key={cer?.text} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="mx-auto mt-2 w-fit max-w-full rounded-3xl bg-white px-6 py-4 text-3xl font-bold text-mov-inchis shadow-lg sm:text-4xl">
            {cer?.text}
          </motion.div>
          <p className="mt-3 text-sm text-gray-600">Atinge o tijă ca să adaugi o bilă. Atinge o bilă ca să o scoți.</p>
          <div className="mt-3 flex justify-center rounded-3xl bg-white/70 p-4 shadow">
            <Numaratoare mii={k === 4 ? bile.mii : undefined} sute={bile.sute} zeci={bile.zeci} unitati={bile.unitati} marime={2.1} onTija={modifica} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            {(["mii", "sute", "zeci", "unitati"] as Ordin[]).slice(4 - k).map((o) => (
              <div key={o} className="flex items-center gap-1 rounded-2xl bg-white px-2 py-1 shadow">
                <button onClick={() => modifica(o, -1)} className="h-11 w-11 rounded-xl bg-mov-deschis text-2xl font-bold text-mov">−</button>
                <span className="w-16 font-bold">{o === "unitati" ? "unități" : o}: {bile[o]}</span>
                <button onClick={() => modifica(o, 1)} className="h-11 w-11 rounded-xl bg-mov text-2xl font-bold text-white">+</button>
              </div>
            ))}
          </div>
          <Feedback stare={stare} mesaj={`Pe numărătoare este ${valoare}. Mai încearcă!`} />
          <button onClick={verifica} className="mt-4 h-16 w-full max-w-xs rounded-2xl bg-mov text-2xl font-bold text-white shadow active:scale-95">Verifică ✓</button>
        </div>
      )}
    </main>
  );
}
