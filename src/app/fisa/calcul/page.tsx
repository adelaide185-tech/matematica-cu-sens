import { FisaCalcul, type ModFisaCalcul } from "@/componente/FisaCalcul";
import { decodifica } from "@/motor/calcul/config";
import { genereazaCalcul } from "@/motor/calcul/generator";
import { BaraPrint } from "../BaraPrint";

/** Pagina de printare a fișei de calcul (folosită și de generatorul PDF). */
export default async function PaginaFisaCalcul({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodifica(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) return <p className="p-8 text-center">Fișa nu a putut fi citită. Generează-o din nou din panoul profesorului.</p>;
  const mod: ModFisaCalcul = sp.mod === "barem" || sp.mod === "fisa+barem" ? sp.mod : "fisa";
  const { exercitii } = genereazaCalcul(cfg);
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaCalcul cfg={cfg} exercitii={exercitii} mod={mod} />
    </div>
  );
}
