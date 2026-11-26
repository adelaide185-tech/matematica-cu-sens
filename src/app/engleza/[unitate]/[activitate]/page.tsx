"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ACTIVITATI_EN, unitate, type ActivitateEn, type Varsta } from "@/engleza/continut";
import { Asculta, Cartonase, Perechi } from "@/engleza/Activitati";
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
  if (a === "asculta") return <Asculta key={seed} u={u} varsta={varsta} seed={seed} inapoi={inapoi} onReia={reia} />;
  return <Perechi key={seed} u={u} varsta={varsta} seed={seed} inapoi={inapoi} onReia={reia} />;
}
