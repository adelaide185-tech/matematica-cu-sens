import Link from "next/link";
import Image from "next/image";

export default function Acasa() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      <Image src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" width={420} height={142} priority className="h-auto w-[300px] sm:w-[420px]" />
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-mov text-center">Matematică cu Sens</h1>
      <p className="mt-2 text-center text-lg text-gray-600 max-w-xl">Fișe de lucru și jocuri pentru clasele I–V, aliniate cu programa școlară.</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 w-full max-w-3xl">
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
