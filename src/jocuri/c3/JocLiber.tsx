"use client";

import { useEffect, useMemo, useState } from "react";
import { cfgIncercare, decodificaC3 } from "@/motor/clasa3/config";
import { genereazaC3 } from "@/motor/clasa3/generator";
import type { ConfigC3 } from "@/motor/clasa3/tipuri";
import { inregistreaza } from "@/jocuri/progres";
import { JocC3 } from "./JocC3";

/** Joc liber (din meniul elevului) sau previzualizarea profesorului: fără salvare pe server. */
export function JocLiber() {
  const [baza, setBaza] = useState<ConfigC3 | null>(null);
  const [preview, setPreview] = useState(false);
  const [incercare, setIncercare] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setPreview(q.get("preview") === "1");
    setBaza(decodificaC3(q.get("c")));
  }, []);
  const cfg = useMemo(() => (baza ? cfgIncercare(baza, incercare) : null), [baza, incercare]);
  const itemi = useMemo(() => (cfg ? genereazaC3(cfg).itemi : []), [cfg]);
  if (!baza) return <p className="p-8 text-center text-lg">Se încarcă jocul…</p>;
  return (
    <JocC3 key={incercare} cfg={cfg!} itemi={itemi} inapoi={preview ? "/profesor/clasa3" : "/elev/clasa3"} incercare={incercare}
      eticheta={preview ? "previzualizare – nu se salvează" : undefined}
      onFinal={(f) => {
        if (preview) return "Previzualizare: rezultatul nu se salvează.";
        const corecte = f.raspunsuri.filter((r) => r.corect).length;
        const p = corecte / Math.max(1, itemi.length);
        inregistreaza(`c3-${baza.joc}`, 3, p >= 0.9 ? 3 : p >= 0.75 ? 2 : p >= 0.5 ? 1 : 0, { logica: corecte }, []);
      }}
      onReia={() => setIncercare((n) => n + 1)} />
  );
}
