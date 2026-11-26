import Link from "next/link";
import Image from "next/image";
import { MeniuCursuri } from "@/componente/MeniuCursuri";

export const metadata = { title: "Engleză · Fabrica de Inteligență" };

/** Cursul de engleză: pagina de pornire (conținutul se adaugă aici). */
export default function Engleza() {
  return (
    <main className="min-h-screen px-4 pb-12">
      <header className="mx-auto flex max-w-5xl items-center justify-between py-4">
        <Link href="/"><Image src="/brand/logo-mic.jpg" alt="Fabrica de Inteligență" width={56} height={56} className="h-14 w-14 rounded-xl" /></Link>
        <MeniuCursuri />
      </header>
      <section className="mx-auto mt-6 max-w-2xl rounded-3xl bg-white p-8 text-center shadow-md">
        <div className="text-6xl" aria-hidden>🇬🇧</div>
        <h1 className="mt-3 text-3xl font-bold text-mov sm:text-4xl">Engleză</h1>
        <p className="mt-3 text-lg text-gray-600">Cursul de limba engleză este în pregătire și va apărea aici.</p>
        <Link href="/" className="mt-6 inline-block rounded-2xl bg-mov px-6 py-3 text-lg font-bold text-white shadow">← Înapoi la cursuri</Link>
      </section>
    </main>
  );
}
