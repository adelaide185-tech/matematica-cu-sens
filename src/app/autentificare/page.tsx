import Link from "next/link";
import { redirect } from "next/navigation";
import { CardCentrat } from "@/componente/ui";
import { dbConfigurata } from "@/lib/db";
import { emailuriAdmin, paginaDeStart, sesiuneCurenta } from "@/lib/auth";
import { FormularAutentificare } from "./Formular";

export const dynamic = "force-dynamic";

export default async function Autentificare({ searchParams }: { searchParams: Promise<{ inapoi?: string }> }) {
  if (!dbConfigurata) redirect("/");
  const s = await sesiuneCurenta();
  if (s) redirect(paginaDeStart(s.rol));
  const { inapoi } = await searchParams;
  return (
    <CardCentrat titlu="Intră în cont" subtitlu="Matematică cu Sens">
      <FormularAutentificare inapoi={inapoi ?? ""} />
      {emailuriAdmin().length > 0 && (
        <p className="mt-5 text-center text-sm text-gray-500">
          Administrator nou? <Link href="/configurare" className="font-semibold text-mov underline">Prima configurare</Link>
        </p>
      )}
    </CardCentrat>
  );
}
