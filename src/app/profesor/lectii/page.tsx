import Link from "next/link";
import { LECTII } from "@/lectii/lectii";
import { NoteProfesor } from "@/lectii/NoteProfesor";
import { MANIPULATIVE } from "@/manipulative/stare";

export const metadata = { title: "Lecții cu materiale · Matematică cu Sens" };

/** Pagina profesorului: lecțiile cu note (obiectiv, desfășurare, întrebări, greșeli frecvente) și linkuri pentru clasă. */
export default function LectiiProfesor() {
  return (
    <main className="min-h-screen bg-[#faf9fd] px-4 pb-12">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 py-5">
        <div>
          <h1 className="text-3xl font-bold text-mov">Lecții cu materiale</h1>
          <p className="text-gray-600">Clasa a II-a · manipulative virtuale, de proiectat pe tablă sau de trimis elevilor.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profesor" className="rounded-xl bg-white px-4 py-2 font-bold text-mov shadow ring-1 ring-mov/10">📝 Fișe</Link>
          <Link href="/elev/atelier" className="rounded-xl bg-mov px-4 py-2 font-bold text-white shadow">🧰 Atelierul</Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl bg-galben-deschis p-4 text-gray-800">
          <b>Cum le folosiți:</b> „Proiectează la clasă” deschide lecția cu notele alături. Elevii primesc linkul lecției
          (fără note). În <Link href="/elev/atelier" className="font-bold text-mov underline">Atelier</Link> pregătiți orice situație
          (de exemplu, o tablă a sutelor cu numere acoperite) și copiați linkul: elevii pornesc exact de acolo.
        </div>

        {LECTII.map((l) => {
          const m = MANIPULATIVE.find((x) => x.tip === l.manipulativ);
          return (
            <details key={l.id} className="group rounded-3xl bg-white p-5 shadow ring-1 ring-mov/10">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="text-4xl" aria-hidden>{l.icon}</span>
                  <span>
                    <span className="block text-xl font-bold text-mov">{l.titlu}</span>
                    <span className="block text-sm text-gray-600">{l.capitol} · {m?.nume} · {l.pasi.length} pași · ~{l.minute} min</span>
                  </span>
                </span>
                <span className="text-sm font-semibold text-mov group-open:hidden">Vezi notele ▾</span>
              </summary>
              <div className="mt-4 border-t border-mov/10 pt-4">
                <NoteProfesor l={l} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/elev/lectii/${l.id}?profesor=1`} className="rounded-xl bg-mov px-4 py-2 font-bold text-white">▶ Proiectează la clasă</Link>
                  <Link href={`/elev/lectii/${l.id}`} className="rounded-xl bg-mov-deschis px-4 py-2 font-bold text-mov">Linkul pentru elevi</Link>
                  <Link href={`/elev/atelier?m=${l.manipulativ}`} className="rounded-xl bg-white px-4 py-2 font-bold text-mov ring-1 ring-mov/20">Deschide {m?.nume} în Atelier</Link>
                </div>
              </div>
            </details>
          );
        })}
      </section>
    </main>
  );
}
