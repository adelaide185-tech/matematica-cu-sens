"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AntetJoc, Feedback, Final, Tastatura } from "@/jocuri/componente";
import { Adaptiv, inregistreaza, steleDinGreseli } from "@/jocuri/progres";
import { generator } from "@/motor/registru";
import { Rng, seedNou } from "@/motor/rng";
import type { Cerinta, Clasa, Nivel } from "@/motor/tipuri";

const TREPTE = 10;
const NIVELURI: Nivel[] = ["consolidare", "aprofundare", "evaluare"];

/** Ce exersează Scara la fiecare clasă (adunare/scădere, tabla înmulțirii, împărțire). */
function surse(clasa: Clasa): string[] {
  if (clasa === 1) return ["operatii.adunare-scadere"];
  if (clasa === 2) return ["operatii.tabla-inmultirii", "operatii.adunare-scadere"];
  return ["operatii.tabla-inmultirii", "operatii.impartire-tabla", "operatii.adunare-scadere"];
}

function intrebareNoua(rng: Rng, clasa: Clasa, nivel: Nivel): Cerinta {
  for (;;) {
    const g = generator(rng.pick(surse(clasa)));
    const item = g.generate(rng.fork(rng.int(0, 1e6)), nivel, clasa);
    const c = rng.pick(item.cerinte.filter((x) => /^\d+$/.test(x.raspuns)));
    if (c) return c;
  }
}

export default function Scara() {
  const [clasa, setClasa] = useState<Clasa>(2);
  const rng = useRef(new Rng(1));
  const adaptiv = useRef(new Adaptiv());
  const [treapta, setTreapta] = useState(0);
  const [intrebare, setIntrebare] = useState<Cerinta | null>(null);
  const [valoare, setValoare] = useState("");
  const [stare, setStare] = useState<"corect" | "gresit" | null>(null);
  const [greseli, setGreseli] = useState(0);
  const [corecte, setCorecte] = useState(0);
  const [final, setFinal] = useState<{ stele: number; trofee: string[] } | null>(null);
  const [mesaj, setMesaj] = useState<string>();

  const start = useCallback((c: Clasa) => {
    rng.current = new Rng(seedNou());
    adaptiv.current = new Adaptiv();
    setTreapta(0);
    setGreseli(0);
    setCorecte(0);
    setFinal(null);
    setValoare("");
    setStare(null);
    setIntrebare(intrebareNoua(rng.current, c, "consolidare"));
  }, []);

  useEffect(() => {
    const q = Number(new URLSearchParams(location.search).get("clasa"));
    const c = ([1, 2, 3, 4].includes(q) ? q : 2) as Clasa;
    setClasa(c);
    start(c);
  }, [start]);

  const trimite = () => {
    if (!intrebare || stare) return;
    const ok = valoare === intrebare.raspuns;
    const nivel = NIVELURI[adaptiv.current.raspuns(ok)];
    setStare(ok ? "corect" : "gresit");
    setMesaj(ok ? undefined : `Răspunsul corect: ${intrebare.raspuns}`);
    const nouaTreapta = ok ? treapta + 1 : Math.max(0, treapta - 1);
    if (ok) setCorecte((x) => x + 1);
    else setGreseli((x) => x + 1);
    setTreapta(nouaTreapta);
    setTimeout(() => {
      setStare(null);
      setValoare("");
      if (nouaTreapta >= TREPTE) {
        const g = greseli + (ok ? 0 : 1);
        const stele = steleDinGreseli(g);
        const trofee = inregistreaza("scara", clasa, stele, { viteza: corecte + 1 }, g === 0 ? ["scara-perfecta"] : []);
        setFinal({ stele, trofee });
      } else {
        setIntrebare(intrebareNoua(rng.current, clasa, nivel));
      }
    }, ok ? 700 : 1600);
  };

  // tastatura fizică (laptop)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setValoare((v) => (v + e.key).slice(0, 8));
      else if (e.key === "Backspace") setValoare((v) => v.slice(0, -1));
      else if (e.key === "Enter") document.getElementById("trimite-scara")?.click();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const parti = intrebare?.text.split("___") ?? [];
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-mov-deschis pb-10">
      <AntetJoc titlu="🪜 Scara" clasa={clasa} runda={treapta} total={TREPTE} />
      {final ? (
        <Final stele={final.stele} trofeeNoi={final.trofee} clasa={clasa} onReia={() => start(clasa)}
          mesaj={final.stele === 3 ? "Ai ajuns în vârf fără greșeli!" : "Ai ajuns în vârful scării!"} />
      ) : (
        <div className="mx-auto grid max-w-4xl items-center gap-6 px-4 md:grid-cols-[220px_1fr]">
          <svg viewBox="0 0 200 420" className="mx-auto h-[300px] md:h-[440px]" role="img" aria-label={`Treapta ${treapta} din ${TREPTE}`}>
            <rect x="40" y="10" width="10" height="400" fill="#8a6a4a" rx="4" />
            <rect x="150" y="10" width="10" height="400" fill="#8a6a4a" rx="4" />
            {Array.from({ length: TREPTE }, (_, i) => (
              <rect key={i} x="45" y={380 - i * 38} width="110" height="9" rx="3" fill={i < treapta ? "#f9c50f" : "#b08a64"} />
            ))}
            <text x="100" y="30" textAnchor="middle" fontSize="34">🏆</text>
            <motion.g initial={false} animate={{ translateY: -treapta * 38 }} transition={{ type: "spring", stiffness: 120 }}>
              <text x="100" y="375" textAnchor="middle" fontSize="40">🐿️</text>
            </motion.g>
          </svg>

          <div className="text-center">
            <motion.div key={intrebare?.text} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mx-auto mb-4 w-fit rounded-3xl bg-white px-8 py-5 text-4xl font-bold text-mov-inchis shadow-lg sm:text-5xl"
              style={stare === "gresit" ? { animation: "none" } : undefined}>
              {parti.length > 1 ? (
                <>{parti[0]}<span className="mx-1 inline-block min-w-16 rounded-xl border-4 border-dashed border-mov px-2">{valoare || "?"}</span>{parti[1]}</>
              ) : (
                <>{intrebare?.text} <span className="inline-block min-w-16 rounded-xl border-4 border-dashed border-mov px-2">{valoare || "?"}</span></>
              )}
            </motion.div>
            <Feedback stare={stare} mesaj={mesaj} />
            <div className="mt-4">
              <Tastatura valoare={valoare} onChange={setValoare} onTrimite={trimite} />
              <button id="trimite-scara" onClick={trimite} className="hidden" />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
