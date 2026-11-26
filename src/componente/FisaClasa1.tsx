import { FisaPrint } from "./FisaPrint";
import { fisaClasa1, genereazaClasa1 } from "@/motor/clasa1/sesiune";
import type { ConfigClasa1 } from "@/motor/clasa1/tipuri";

export type ModFisaC1 = "fisa" | "fisa+barem" | "barem";

/**
 * Fișa clasei I: A4, font mare (14 pt), 2–3 coloane, căsuțe mari.
 * „fisa+barem”: baremul (răspunsurile) începe pe o pagină nouă.
 */
export function FisaClasa1({ cfg, mod }: { cfg: ConfigClasa1; mod: ModFisaC1 }) {
  const { exercitii } = genereazaClasa1(cfg);
  const fisa = fisaClasa1(cfg, exercitii);
  const antet = { titlu: cfg.antet.titlu, scoala: cfg.antet.scoala, profesor: cfg.antet.profesor, data: cfg.antet.data };
  return (
    <div className="fisa-c1">
      {mod !== "barem" && <FisaPrint fisa={fisa} antet={antet} rezolvari={false} albNegru={cfg.albNegru} />}
      {mod !== "fisa" && (
        <div className={mod === "fisa+barem" ? "fisa-pagina-noua" : ""}>
          <FisaPrint fisa={fisa} antet={{ ...antet, titlu: `${antet.titlu} — Barem (răspunsuri)` }} rezolvari albNegru={cfg.albNegru} />
        </div>
      )}
    </div>
  );
}
