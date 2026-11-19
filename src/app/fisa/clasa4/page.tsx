import { FisaC3, type ModFisaC } from "@/componente/FisaC3";
import { decodificaC4 } from "@/motor/clasa4/config";
import { genereazaC4 } from "@/motor/clasa4/generator";
import { NUME_NIVEL_C4 } from "@/motor/clasa4/tipuri";
import { BaraPrint } from "../BaraPrint";

/** Fișa de clasa a IV-a (fișă, barem sau exerciții rezolvate), pentru printare și PDF. */
export default async function PaginaFisaC4({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodificaC4(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) return <p className="p-8 text-center">Fișa nu a putut fi citită. Generează-o din nou din panoul profesorului.</p>;
  const mod: ModFisaC = sp.mod === "barem" || sp.mod === "fisa+barem" || sp.mod === "rezolvate" ? sp.mod : "fisa";
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaC3 cfg={cfg} itemi={genereazaC4(cfg).itemi} mod={mod} clasa="a IV-a" subtitlu={`semestrul al II-lea · ${NUME_NIVEL_C4[cfg.nivel]}`} />
    </div>
  );
}
