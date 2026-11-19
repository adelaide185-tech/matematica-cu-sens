import { FisaC2 } from "@/componente/FisaC2";
import type { ModFisaCalcul } from "@/componente/FisaCalcul";
import { decodificaC2 } from "@/motor/clasa2/config";
import { genereazaC2 } from "@/motor/clasa2/generator";
import type { NivelC2 } from "@/motor/clasa2/tipuri";
import { BaraPrint } from "../BaraPrint";

/** Fișa de clasa a II-a (printare și PDF). Nivelul „alege” se tipărește la nivelul Mediu. */
export default async function PaginaFisaC2({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodificaC2(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) return <p className="p-8 text-center">Fișa nu a putut fi citită.</p>;
  const mod: ModFisaCalcul = sp.mod === "barem" || sp.mod === "fisa+barem" ? sp.mod : "fisa";
  const nivel: NivelC2 = cfg.nivel === "alege" ? "mediu" : cfg.nivel;
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaC2 cfg={cfg} itemi={genereazaC2(cfg, nivel).itemi} mod={mod} />
    </div>
  );
}
