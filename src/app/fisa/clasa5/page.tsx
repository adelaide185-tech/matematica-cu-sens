import { FisaC3, type ModFisaC } from "@/componente/FisaC3";
import { decodificaC5 } from "@/motor/clasa5/config";
import { genereazaC5 } from "@/motor/clasa5/generator";
import { NUME_NIVEL_C4 } from "@/motor/clasa4/tipuri";
import { BaraPrint } from "../BaraPrint";

/** Fișa de clasa a V-a (fișă, barem sau exerciții rezolvate), pentru printare și PDF. */
export default async function PaginaFisaC5({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodificaC5(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) return <p className="p-8 text-center">Fișa nu a putut fi citită. Generează-o din nou din panoul profesorului.</p>;
  const mod: ModFisaC = sp.mod === "barem" || sp.mod === "fisa+barem" || sp.mod === "rezolvate" ? sp.mod : "fisa";
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaC3 cfg={cfg} itemi={genereazaC5(cfg).itemi} mod={mod} clasa="a V-a" subtitlu={NUME_NIVEL_C4[cfg.nivel]} />
    </div>
  );
}
