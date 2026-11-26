import Link from "next/link";
import Image from "next/image";
import { CURSURI, MeniuCursuri, linkCurs } from "@/componente/MeniuCursuri";
import { MASCOTA_PORTRET } from "@/componente/Mascota";

export default function Acasa() {
  return (
    <main className="fundal-fabrica min-h-screen flex flex-col items-center px-4 pb-10">
      <header className="flex w-full max-w-5xl justify-end py-3">
        <MeniuCursuri />
      </header>
      <section className="flex w-full max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-center">
        <Link href="/mascota" aria-label="Fă cunoștință cu Sclipici, mascota noastră" className="shrink-0">
          <Image src={MASCOTA_PORTRET} alt="Sclipici, mascota Fabricii de Inteligență" width={315} height={428} priority className="portret-mascota h-auto w-[220px] rounded-[2.5rem] sm:w-[260px]" />
        </Link>
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Image src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" width={420} height={142} priority className="h-auto w-[280px] rounded-2xl mix-blend-multiply sm:w-[400px]" />
          <p className="mt-3 max-w-md text-xl font-semibold text-violet-inchis">Bună! Eu sunt <span className="text-violet">Sclipici</span>. Hai să descoperim împreună matematica și engleza! 🚀</p>
        </div>
      </section>

      <section className="mt-6 w-full max-w-3xl" aria-labelledby="cursuri">
        <h2 id="cursuri" className="text-center text-2xl font-bold text-violet-inchis">Cursuri</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CURSURI.map((c) => (
            <Link key={c.id} href={linkCurs(c.id)} className={`flex items-center gap-4 rounded-3xl p-5 shadow-lg ring-4 ring-white/70 transition hover:-translate-y-0.5 hover:shadow-xl ${c.gata ? `${c.id === "engleza" ? "card-curs-engleza" : "card-curs-mate"} text-white` : "bg-white text-mov"}`}>
              <span className="text-5xl" aria-hidden>{c.icon}</span>
              <span>
                <span className="block text-2xl font-bold">{c.nume}{!c.gata && <span className="ml-2 rounded-full bg-galben px-2 py-0.5 align-middle text-xs text-mov-inchis">în curând</span>}</span>
                <span className={`block text-sm ${c.gata ? "text-white/85" : "text-gray-600"}`}>{c.descriere}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <h1 id="mate-cu-sens" className="mt-12 scroll-mt-6 text-3xl sm:text-4xl font-bold text-mov text-center">Mate cu SENS</h1>
      <p className="mt-2 text-center text-lg text-gray-600 max-w-xl">Fișe de lucru și jocuri pentru clasele I–V, aliniate cu programa școlară.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 w-full max-w-3xl">
        <Link href="/profesor" className="group rounded-3xl bg-white p-8 shadow-md ring-2 ring-mov/10 hover:ring-mov transition">
          <div className="text-5xl">📝</div>
          <h2 className="mt-3 text-2xl font-bold text-mov">Sunt profesor</h2>
          <p className="mt-2 text-gray-600">Generez fișe pe 4 niveluri (Consolidare, Aprofundare, Evaluare, Competiție), cu rezolvări și barem, gata de printat. Predau cu lecții pe materiale virtuale.</p>
          <span className="mt-4 inline-block font-semibold text-mov group-hover:underline">Generează o fișă →</span>
        </Link>
        <Link href="/elev" className="group rounded-3xl bg-galben-deschis p-8 shadow-md ring-2 ring-galben/40 hover:ring-galben transition">
          <div className="text-5xl">🎮</div>
          <h2 className="mt-3 text-2xl font-bold text-mov">Sunt elev</h2>
          <p className="mt-2 text-gray-700">Mă joc și exersez cu blocuri, axa numerelor și modelul în bară, plus Scara, Numărătoarea magică și Pizza fracțiilor. Câștig stele și trofee!</p>
          <span className="mt-4 inline-block font-semibold text-mov group-hover:underline">Hai la joacă →</span>
        </Link>
      </div>
    </main>
  );
}
