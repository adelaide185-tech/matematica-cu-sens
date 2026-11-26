import { FisaEngleza, type ModFisaEn } from "@/componente/FisaEngleza";
import { decodificaFisaEn, genereazaFisaEn } from "@/engleza/fise";
import { BaraPrint } from "../BaraPrint";

/** Fișa de engleză (4–6 ani) pentru printare și PDF: ?c=…&mod=fisa|educatoare|ambele */
export default async function PaginaFisaEngleza({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodificaFisaEn(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) return <p className="p-8 text-center">Fișa nu a putut fi citită. Generează-o din nou din panoul profesorului.</p>;
  const mod: ModFisaEn = sp.mod === "fisa" || sp.mod === "educatoare" ? sp.mod : "ambele";
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaEngleza cfg={cfg} sectiuni={genereazaFisaEn(cfg)} mod={mod} />
    </div>
  );
}
