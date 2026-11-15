"use client";

import { useMemo, useState } from "react";
import { cfgIncercare } from "@/motor/clasa3/config";
import { genereazaC3, MEDALII } from "@/motor/clasa3/generator";
import type { ConfigC3 } from "@/motor/clasa3/tipuri";
import { trimiteJocC3 } from "@/lib/actiuni-teme";
import { JocC3 } from "./JocC3";

/** Jocul primit ca temă: la final, răspunsurile merg la server (verificate din nou acolo). */
export function JocTema({ cod, titlu, baza, test }: { cod: string; titlu: string; baza: ConfigC3; test: boolean }) {
  const [incercare, setIncercare] = useState(0);
  const cfg = useMemo(() => cfgIncercare(baza, incercare), [baza, incercare]);
  const itemi = useMemo(() => genereazaC3(cfg).itemi, [cfg]);
  return (
    <JocC3 key={incercare} cfg={cfg} itemi={itemi} titlu={titlu} inapoi="/elev/teme" incercare={incercare} eticheta={test ? "test" : undefined}
      onFinal={async (f) => {
        try {
          const r = await trimiteJocC3(cod, f.raspunsuri.map(({ id, dat, incercari, timpMs }) => ({ id, dat, incercari, timpMs })), f.incercare, f.terminat);
          if (r.eroare) return r.eroare;
          return `Rezultatul a ajuns la profesor${r.medalie ? ` (medalia de ${MEDALII[r.medalie as keyof typeof MEDALII].nume})` : ""}.`;
        } catch {
          return "Nu am putut trimite rezultatul. Verifică internetul și joacă din nou.";
        }
      }}
      onReia={test ? undefined : () => setIncercare((n) => n + 1)} />
  );
}
