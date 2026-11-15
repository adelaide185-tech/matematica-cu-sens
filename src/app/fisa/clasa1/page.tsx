import { notFound } from "next/navigation";
import { FisaClasa1, type ModFisaC1 } from "@/componente/FisaClasa1";
import { decodificaC1 } from "@/motor/clasa1/config";
import { BaraPrint } from "../BaraPrint";

/** Fișa clasei I de printat (și sursa PDF-ului): ?c=<configurație>&mod=fisa|fisa+barem|barem */
export default async function PaginaFisaClasa1({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const cfg = decodificaC1(typeof sp.c === "string" ? sp.c : null);
  if (!cfg) notFound();
  const mod: ModFisaC1 = sp.mod === "fisa+barem" || sp.mod === "barem" ? sp.mod : "fisa";
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaClasa1 cfg={cfg} mod={mod} />
    </div>
  );
}
