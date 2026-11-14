import { FisaPrint } from "@/componente/FisaPrint";
import { citesteParametri, construiesteFisa } from "@/lib/parametri";
import { BaraPrint } from "./BaraPrint";

/** Pagina de printare: aceeași fișă, randată pe server, în format A4. Folosită și de generatorul PDF. */
export default async function PaginaFisa({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const p = citesteParametri(sp);
  const rezolvari = sp.rezolvari === "1";
  const { fisa, titlu } = construiesteFisa(p);
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <FisaPrint fisa={fisa} antet={{ titlu, scoala: p.scoala, profesor: p.profesor, data: p.data }} rezolvari={rezolvari} albNegru={p.bw} />
    </div>
  );
}
