/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { cereRol } from "@/lib/auth";
import { dbConfigurata } from "@/lib/db";
import { incarcaTema, rezumatElev } from "@/lib/raport-tema";
import { MEDALII } from "@/motor/clasa3/generator";
import { BaraPrint } from "@/app/fisa/BaraPrint";

export const dynamic = "force-dynamic";

/** Diplomă (A4 orizontal) pentru medalia de Aur sau Diamant. */
export default async function Diploma({ params, searchParams }: { params: Promise<{ id: string; elevId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!dbConfigurata) notFound();
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const { id, elevId } = await params;
  const sp = await searchParams;
  const t = await incarcaTema(s, id);
  if (!t) notFound();
  const elev = t.elev?.id === elevId ? t.elev : t.clasa?.elevi.find((i) => i.elev.id === elevId)?.elev;
  const r = rezumatElev(t, elevId);
  const m = r.cea?.medalie as keyof typeof MEDALII | null | undefined;
  if (!elev || (m !== "aur" && m !== "diamant")) return <p className="p-8 text-center">Diploma se acordă pentru medalia de Aur sau Diamant.</p>;
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <article className="diploma">
        <div className="diploma-chenar">
          <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="mx-auto h-16" />
          <h1 className="diploma-titlu">DIPLOMĂ</h1>
          <p className="text-2xl">pentru</p>
          <p className="diploma-nume">{elev.prenume} {elev.nume}</p>
          <p className="text-2xl">care a obținut</p>
          <p className="diploma-medalie">{MEDALII[m].icon} Medalia de {MEDALII[m].nume}</p>
          <p className="text-xl">la „{t.titlu}” · {r.cea!.corecte} din {r.cea!.total} răspunsuri corecte</p>
          <div className="mt-10 flex justify-between px-16 text-lg">
            <span>Data: {r.cea!.terminat?.toLocaleDateString("ro-RO")}</span>
            <span>Profesor: ____________________</span>
          </div>
          <p className="mt-6 text-sm text-gray-500">Matematică cu Sens · Fabrica de Inteligență</p>
        </div>
      </article>
    </div>
  );
}
