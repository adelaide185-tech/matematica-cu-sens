"use client";

import { useEffect, useMemo, useState } from "react";
import { cfgIncercareC5, decodificaC5 } from "@/motor/clasa5/config";
import { genereazaC5 } from "@/motor/clasa5/generator";
import type { ConfigC5 } from "@/motor/clasa5/tipuri";
import { MEDALII } from "@/motor/clasa3/generator";
import { inregistreaza, seteazaRezultat } from "@/jocuri/progres";
import { trimiteJocC5 } from "@/lib/actiuni-teme";
import { JocC3 } from "@/jocuri/c3/JocC3";

/** Joc liber de clasa a V-a (meniul elevului) sau previzualizarea profesorului: fără salvare pe server. */
export function JocLiberC5() {
  const [baza, setBaza] = useState<ConfigC5 | null>(null);
  const [preview, setPreview] = useState(false);
  const [incercare, setIncercare] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setPreview(q.get("preview") === "1");
    setBaza(decodificaC5(q.get("c")));
  }, []);
  const cfg = useMemo(() => (baza ? cfgIncercareC5(baza, incercare) : null), [baza, incercare]);
  const itemi = useMemo(() => (cfg ? genereazaC5(cfg).itemi : []), [cfg]);
  if (!baza) return <p className="p-8 text-center text-lg">Se încarcă jocul…</p>;
  return (
    <JocC3 key={incercare} cfg={cfg!} itemi={itemi} inapoi={preview ? "/profesor/clasa5" : "/elev/clasa5"} incercare={incercare}
      eticheta={preview ? "previzualizare – nu se salvează" : undefined}
      onFinal={(f) => {
        if (preview) return "Previzualizare: rezultatul nu se salvează.";
        const corecte = f.raspunsuri.filter((r) => r.corect).length;
        const p = corecte / Math.max(1, itemi.length);
        seteazaRezultat(corecte, itemi.length);
        inregistreaza(`c5-${baza.joc}`, 5, p >= 0.9 ? 3 : p >= 0.75 ? 2 : p >= 0.5 ? 1 : 0, { logica: corecte }, []);
      }}
      onReia={() => setIncercare((n) => n + 1)} />
  );
}

/** Jocul de clasa a V-a primit ca temă: răspunsurile se verifică din nou pe server. */
export function JocTemaC5({ cod, titlu, baza, test }: { cod: string; titlu: string; baza: ConfigC5; test: boolean }) {
  const [incercare, setIncercare] = useState(0);
  const cfg = useMemo(() => cfgIncercareC5(baza, incercare), [baza, incercare]);
  const itemi = useMemo(() => genereazaC5(cfg).itemi, [cfg]);
  return (
    <JocC3 key={incercare} cfg={cfg} itemi={itemi} titlu={titlu} inapoi="/elev/teme" incercare={incercare} eticheta={test ? "test" : undefined}
      onFinal={async (f) => {
        try {
          const r = await trimiteJocC5(cod, f.raspunsuri.map(({ id, dat, incercari, timpMs }) => ({ id, dat, incercari, timpMs })), f.incercare, f.terminat);
          if (r.eroare) return r.eroare;
          return `Rezultatul a ajuns la profesor${r.medalie ? ` (medalia de ${MEDALII[r.medalie as keyof typeof MEDALII].nume})` : ""}.`;
        } catch {
          return "Nu am putut trimite rezultatul. Verifică internetul și joacă din nou.";
        }
      }}
      onReia={test ? undefined : () => setIncercare((n) => n + 1)} />
  );
}
