"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ACTIVITATI_EN, unitate, type ActivitateEn, type Varsta } from "@/engleza/continut";
import { Asculta, Cartonase, Perechi } from "@/engleza/Activitati";
import { ConstruiestePropozitia, DeschideCutia, LovesteCartita, Roata, Sorteaza, SpargeBaloanele } from "@/engleza/JocuriVii";
import { citesteVarsta } from "@/engleza/Varsta";
import { seedNou } from "@/motor/rng";

/** O activitate dintr-o unitate (cartonașe, ascultă și atinge, perechi). */
export default function PaginaActivitate() {
  const { unitate: id, activitate } = useParams<{ unitate: string; activitate: string }>();
  const u = unitate(id);
  const [varsta, setVarsta] = useState<Varsta | null>(null);
  const [seed, setSeed] = useState(1);
  useEffect(() => { setVarsta(citesteVarsta()); setSeed(seedNou()); }, []);
  if (!u || !(activitate in ACTIVITATI_EN)) return <main className="p-8 text-center">Activitatea nu există. <Link href="/engleza" className="text-mov underline">Înapoi</Link></main>;
  if (!varsta) return <main className="p-8 text-center text-xl text-mov">Pregătim jocul…</main>;
  const inapoi = `/engleza/${u.id}`;
  const a = activitate as ActivitateEn;
  const reia = () => setSeed(seedNou());
  if (a === "cartonase") return <Cartonase u={u} inapoi={inapoi} />;
  const p = { u, varsta, seed, inapoi, onReia: reia };
  switch (a) {
    case "asculta": return <Asculta key={seed} {...p} />;
    case "perechi": return <Perechi key={seed} {...p} />;
    case "cartita": return <LovesteCartita key={seed} {...p} />;
    case "baloane": return <SpargeBaloanele key={seed} {...p} />;
    case "cutia": return <DeschideCutia key={seed} {...p} />;
    case "roata": return <Roata key={seed} {...p} />;
    case "sorteaza": return <Sorteaza key={seed} {...p} />;
    case "propozitie": return <ConstruiestePropozitia key={seed} {...p} />;
  }
}
