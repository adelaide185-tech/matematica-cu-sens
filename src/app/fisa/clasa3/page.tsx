import { FisaC3 } from "@/componente/FisaC3";
import type { ModFisaCalcul } from "@/componente/FisaCalcul";
import { decodificaC3 } from "@/motor/clasa3/config";
import { genereazaC3 } from "@/motor/clasa3/generator";
import { BaraPrint } from "../BaraPrint";

/** Fișa de clasa a III-a, pentru printare și PDF. */
export default async function PaginaFisaC3({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodificaC3(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) return <p className="p-8 text-center">Fișa nu a putut fi citită. Generează-o din nou din panoul profesorului.</p>;
  const mod: ModFisaCalcul = sp.mod === "barem" || sp.mod === "fisa+barem" ? sp.mod : "fisa";
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaC3 cfg={cfg} itemi={genereazaC3(cfg).itemi} mod={mod} />
    </div>
  );
}
