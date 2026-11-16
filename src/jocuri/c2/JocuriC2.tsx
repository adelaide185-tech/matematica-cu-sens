"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cfgIncercareC2, decodificaC2 } from "@/motor/clasa2/config";
import { genereazaC2 } from "@/motor/clasa2/generator";
import { MEDALII } from "@/motor/clasa3/generator";
import type { ConfigC2, NivelC2 } from "@/motor/clasa2/tipuri";
import { inregistreaza } from "@/jocuri/progres";
import { trimiteJocC2 } from "@/lib/actiuni-teme";
import { JocC2 } from "./JocC2";

/** Joc liber (meniul elevului) sau previzualizarea profesorului: fără salvare pe server. */
export function JocLiberC2() {
  const [baza, setBaza] = useState<ConfigC2 | null>(null);
  const [preview, setPreview] = useState(false);
  const [incercare, setIncercare] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    setPreview(q.get("preview") === "1");
    setBaza(decodificaC2(q.get("c")));
  }, []);
  const cfg = useMemo(() => (baza ? cfgIncercareC2(baza, incercare) : null), [baza, incercare]);
  const itemiPentru = useCallback((n: NivelC2) => (cfg ? genereazaC2(cfg, n).itemi : []), [cfg]);
  if (!cfg) return <p className="p-8 text-center text-lg">Se încarcă jocul…</p>;
  return (
    <JocC2 key={incercare} cfg={cfg} itemiPentru={itemiPentru} inapoi={preview ? "/profesor/clasa2" : "/elev/clasa2"} incercare={incercare}
      eticheta={preview ? "previzualizare" : undefined}
      onFinal={(f) => {
        if (preview) return "Previzualizare: rezultatul nu se salvează.";
        const corecte = f.raspunsuri.filter((r) => r.corect).length;
        const p = corecte / Math.max(1, f.raspunsuri.length);
        inregistreaza(`c2-${cfg.joc}`, 2, p >= 0.9 ? 3 : p >= 0.75 ? 2 : p >= 0.5 ? 1 : 0, { logica: corecte }, []);
      }}
      onReia={() => setIncercare((n) => n + 1)} />
  );
}

/** Jocul primit ca temă: rezultatul merge la server, unde se verifică din nou. */
export function JocTemaC2({ cod, titlu, baza, test }: { cod: string; titlu: string; baza: ConfigC2; test: boolean }) {
  const [incercare, setIncercare] = useState(0);
  const cfg = useMemo(() => cfgIncercareC2(baza, incercare), [baza, incercare]);
  const itemiPentru = useCallback((n: NivelC2) => genereazaC2(cfg, n).itemi, [cfg]);
  return (
    <JocC2 key={incercare} cfg={cfg} itemiPentru={itemiPentru} titlu={titlu} inapoi="/elev/teme" incercare={incercare} eticheta={test ? "test" : undefined}
      onFinal={async (f) => {
        try {
          const r = await trimiteJocC2(cod, f.raspunsuri.map(({ id, dat, incercari, timpMs, greseli }) => ({ id, dat, incercari, timpMs, greseli })), f.nivel, f.incercare, f.terminat);
          if (r.eroare) return r.eroare;
          const m = r.medalie ? MEDALII[r.medalie as keyof typeof MEDALII] : null;
          return `Rezultatul a ajuns la profesor${m ? ` (${m.icon} ${m.nume})` : ""}.`;
        } catch {
          return "Nu am putut trimite rezultatul. Verifică internetul și joacă din nou.";
        }
      }}
      onReia={test ? undefined : () => setIncercare((n) => n + 1)} />
  );
}
