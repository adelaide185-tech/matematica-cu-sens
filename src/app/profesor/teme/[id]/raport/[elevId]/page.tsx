/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { cereRol } from "@/lib/auth";
import { dbConfigurata } from "@/lib/db";
import { NUME_EROARE, exercitiiAcasa, incarcaTema, rezumatElev } from "@/lib/raport-tema";
import { MEDALII } from "@/motor/clasa3/generator";
import { TextMate } from "@/jocuri/c3/Vizuale";
import { BaraPrint } from "@/app/fisa/BaraPrint";

export const dynamic = "force-dynamic";

/** Raportul pentru părinți: o pagină A4 per copil (medalie, ce știe, ce exersăm acasă, 3 exerciții). */
export default async function RaportParinti({ params, searchParams }: { params: Promise<{ id: string; elevId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  if (!dbConfigurata) notFound();
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const { id, elevId } = await params;
  const sp = await searchParams;
  const t = await incarcaTema(s, id);
  if (!t) notFound();
  const elev = t.elev?.id === elevId ? t.elev : t.clasa?.elevi.find((i) => i.elev.id === elevId)?.elev;
  if (!elev) notFound();
  const r = rezumatElev(t, elevId);
  const m = r.cea?.medalie as keyof typeof MEDALII | null | undefined;
  const ex = exercitiiAcasa(t, elevId, r.peCompetente[0]?.[1] !== undefined && r.peCompetente[0][1] < 100 ? r.peCompetente[0][0] : undefined);
  return (
    <div className="py-6 print:py-0">
      {sp.pdf !== "1" && <BaraPrint />}
      <article className="fc fc-c2">
        <header className="fc-antet">
          <div className="fc-antet-sus">
            <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="fc-logo" />
            <div className="fc-antet-text"><div className="fc-centru">Raport pentru părinți</div><div>{new Date().toLocaleDateString("ro-RO")}</div></div>
          </div>
          <h1 className="fc-titlu">{elev.nume} {elev.prenume}</h1>
          <p className="text-center">Tema: <b>{t.titlu}</b></p>
        </header>
        {!r.cea ? <p className="mt-6 text-center text-lg">Tema nu a fost încă rezolvată.</p> : (
          <>
            <section className="mt-4 flex items-center justify-center gap-6 text-center">
              <div className="text-6xl">{m ? MEDALII[m].icon : "💪"}</div>
              <div>
                <div className="text-2xl font-bold text-mov">{m ? `Medalia de ${MEDALII[m].nume}` : "Continuăm exersarea!"}</div>
                <div className="text-3xl">{[1, 2, 3].map((k) => <span key={k} className={k <= (r.cea!.stele ?? 0) ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
                <div>{r.cea.corecte} din {r.cea.total} corecte ({r.acuratete}%){r.cea.comboMax ? ` · 🔥 ${r.cea.comboMax} la rând` : ""}</div>
              </div>
            </section>
            <section className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-green-300 p-3">
                <h2 className="font-bold text-green-800">✓ Ce știe bine</h2>
                <ul className="mt-1 list-disc pl-5">{r.stiu.length ? r.stiu.map((x) => <li key={x}>{x}</li>) : <li>Suntem la început — fiecare încercare contează!</li>}</ul>
              </div>
              <div className="rounded-2xl border-2 border-amber-300 p-3">
                <h2 className="font-bold text-amber-800">✏️ Ce exersăm acasă</h2>
                <ul className="mt-1 list-disc pl-5">
                  {r.exersam.map((x) => <li key={x}>{x}</li>)}
                  {r.erori.slice(0, 2).map(([e]) => <li key={e}>Atenție la: {NUME_EROARE[e].replace(/^a /, "").replace(/^nu /, "")}</li>)}
                  {!r.exersam.length && !r.erori.length && <li>Să păstrăm ritmul: câte 10 minute pe zi.</li>}
                </ul>
              </div>
            </section>
            {ex.length > 0 && (
              <section className="mt-5">
                <h2 className="font-bold text-mov">3 exerciții de făcut împreună</h2>
                <ol className="mt-2 grid gap-3">{ex.map((e, k) => <li key={k} className="text-lg">{k + 1}. <TextMate text={e.text} /> <span className="fc-linie fc-linie-lunga" /></li>)}</ol>
                <p className="mt-2 text-xs text-gray-500">Răspunsuri: {ex.map((e, k) => `${k + 1}) ${e.raspuns}`).join(" · ")}</p>
              </section>
            )}
          </>
        )}
        <footer className="fc-subsol">Fabrica de Inteligență · Matematică cu Sens · raport generat pentru familie</footer>
      </article>
    </div>
  );
}
