"use client";

import { useMemo, useState } from "react";
import { cfgIncercareArcade, JOCURI_ARCADE, type ConfigArcade } from "@/motor/arcade/config";
import { intrebariArcade } from "@/motor/arcade/intrebari";
import { trimiteJocArcade } from "@/lib/actiuni-teme";
import { JocArcade } from "./JocArcade";

const MEDALIE: Record<string, string> = { diamant: "Diamant", aur: "Aur", argint: "Argint", bronz: "Bronz" };

/** Jocul arcade primit ca temă: la final, alegerile merg la server, unde se verifică din nou. */
export function JocTemaArcade({ cod, titlu, baza, test }: { cod: string; titlu: string; baza: ConfigArcade; test: boolean }) {
  const [incercare, setIncercare] = useState(0);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const cfg = useMemo(() => cfgIncercareArcade(baza, incercare), [baza, incercare]);
  const intrebari = useMemo(() => intrebariArcade(cfg.clasa, cfg.seed, cfg.n, cfg.dif), [cfg]);
  return (
    <>
      <JocArcade key={incercare} joc={cfg.joc} viteza={cfg.viteza} intrebari={intrebari} seed={cfg.seed} inapoi="/elev/teme" titlu={`${titlu}${test ? " · test" : ""}`}
        onFinal={async (f) => {
          setMesaj("Trimitem rezultatul…");
          try {
            const r = await trimiteJocArcade(cod, intrebari.map((q, i) => ({ id: q.id, alegeri: f.alegeri[i], timpMs: f.timpi[i] })), incercare, true);
            setMesaj(r.eroare ?? `Rezultatul a ajuns la profesor${r.medalie ? ` (medalia de ${MEDALIE[r.medalie]})` : ""}.`);
          } catch {
            setMesaj("Nu am putut trimite rezultatul. Verifică internetul și joacă din nou.");
          }
        }}
        onReia={test ? undefined : () => { setMesaj(null); setIncercare((n) => n + 1); }} />
      {mesaj && <p role="status" className="fixed inset-x-0 bottom-4 z-30 mx-auto w-fit rounded-2xl bg-green-50 px-5 py-3 text-center font-semibold text-green-800 shadow-lg ring-2 ring-green-300">{mesaj}</p>}
      <span className="sr-only">{JOCURI_ARCADE[cfg.joc].nume}</span>
    </>
  );
}
