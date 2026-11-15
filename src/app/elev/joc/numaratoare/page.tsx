"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AntetJoc, Feedback, Final } from "@/jocuri/componente";
import { NumaratoareAnimata, ORDINE, type Ordin } from "@/jocuri/NumaratoareAnimata";
import { tranzitie } from "@/jocuri/miscare";
import { Adaptiv, inregistreaza, seteazaRezultat, steleDinGreseli } from "@/jocuri/progres";
import { numarInLitere } from "@/motor/limba";
import { Rng, seedNou } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

const RUNDE = 8;
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
  const [regrupare, setRegrupare] = useState<Ordin | null>(null);
  const [schimb, setSchimb] = useState<string | null>(null);

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

  const tije = (["mii", "sute", "zeci", "unitati"] as Ordin[]).slice(4 - k);

  const modifica = (o: Ordin, d: 1 | -1) => {
    if (stare || regrupare) return;
    setSchimb(null);
    if (d === 1 && bile[o] === 9) {
      // a zecea bilă: se formează o unitate de ordin superior (dacă tija din stânga mai are loc)
      const i = tije.indexOf(o);
      const sus = i > 0 ? tije[i - 1] : null;
      if (sus && bile[sus] < 9) setRegrupare(o);
      return;
    }
    setBile((b) => ({ ...b, [o]: Math.min(9, Math.max(0, b[o] + d)) }));
  };

  const regrupat = () => {
    if (!regrupare) return;
    const i = tije.indexOf(regrupare);
    const sus = tije[i - 1];
    const a = ORDINE.find((x) => x.k === regrupare)!;
    const b = ORDINE.find((x) => x.k === sus)!;
    setBile((x) => ({ ...x, [regrupare]: 0, [sus]: x[sus] + 1 }));
    setSchimb(`10 ${a.nume} = 1 ${b.unu.split(" ")[1]}`);
    setRegrupare(null);
  };

  const verifica = () => {
    if (!cer || stare || regrupare) return;
    const ok = valoare === cer.tinta;
    const nivel = adaptiv.current.raspuns(ok);
    setStare(ok ? "corect" : "gresit");
    if (!ok) setGreseli((g) => g + 1);
    setTimeout(() => {
      setStare(null);
      setSchimb(null);
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
    <main className="min-h-screen pb-10">
      <AntetJoc titlu="🧮 Numărătoarea magică" clasa={clasa} runda={runda} total={RUNDE} />
      {final ? (
        <Final stele={final.stele} trofeeNoi={final.trofee} clasa={clasa} onReia={() => start(clasa)} mesaj="Ai format toate numerele!" />
      ) : (
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-xl font-bold text-gray-700">Formează pe numărătoare numărul:</p>
          <motion.div key={cer?.text} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={tranzitie("mediu")}
            className="mx-auto mt-2 w-fit max-w-full rounded-3xl bg-hartie px-6 py-4 text-3xl font-bold text-mov-inchis shadow-lg sm:text-4xl">
            {cer?.text}
          </motion.div>
          <div className="mt-4 grid items-center gap-4 lg:grid-cols-[1fr_auto]">
            <div className="flex justify-center rounded-3xl bg-hartie p-3 shadow-sm">
              <NumaratoareAnimata tije={tije} bile={bile} regrupare={regrupare} onRegrupat={regrupat}
                onAtinge={(o) => modifica(o, 1)} onScoate={(o) => modifica(o, -1)} />
            </div>
            <div className="flex flex-wrap justify-center gap-3 lg:flex-col">
              {tije.map((o) => {
                const d = ORDINE.find((x) => x.k === o)!;
                return (
                  <div key={o} className="flex items-center gap-2 rounded-2xl bg-hartie p-2 shadow-sm">
                    <button type="button" onClick={() => modifica(o, -1)} aria-label={`scoate ${d.unu}`} className="h-tinta w-tinta rounded-xl bg-mov-deschis text-3xl font-bold text-mov">−</button>
                    <span className="w-24 text-center text-lg font-bold" style={{ color: d.culoare }}>{d.nume}<span className="block text-3xl text-cerneala">{bile[o]}</span></span>
                    <button type="button" onClick={() => modifica(o, 1)} aria-label={`adaugă ${d.unu}`} className="h-tinta w-tinta rounded-xl text-3xl font-bold text-white" style={{ background: d.culoare }}>+</button>
                  </div>
                );
              })}
            </div>
          </div>
          {/* un singur loc pentru mesaje: fie schimbul „10 = 1”, fie verdictul */}
          {stare ? <Feedback stare={stare} mesaj={`Pe numărătoare este ${valoare}. Mai încearcă!`} /> : (
            <div className="min-h-[4.5rem]" aria-live="polite">
              <AnimatePresence>
                {schimb && (
                  <motion.p key={schimb} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={tranzitie("scurt")}
                    className="mx-auto mt-3 w-fit rounded-2xl bg-galben-deschis px-6 py-3 text-2xl font-extrabold text-mov-inchis ring-2 ring-galben">
                    🔁 {schimb}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
          <button onClick={verifica} className="mt-2 h-tinta w-full max-w-xs rounded-2xl bg-mov text-2xl font-bold text-white shadow active:scale-95">Verifică ✓</button>
        </div>
      )}
    </main>
  );
}
