import Link from "next/link";
import { Mascota, NUME_MASCOTA, type StareMascota } from "@/componente/Mascota";

export const metadata = { title: `${NUME_MASCOTA} · mascota Fabricii de Inteligență` };

const STARI: [StareMascota, string, string][] = [
  ["salut", "Salută", "Hi! I'm Sclipici!"],
  ["ganditor", "Se gândește", "Hmm… which one?"],
  ["bucuros", "Se bucură", "Well done!"],
  ["incurajare", "Încurajează", "Try again!"],
];

/** Prezentarea mascotei (și ghid pentru folosirea ei în cursuri). */
export default function PaginaMascota() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm font-semibold text-mov">← Acasă</Link>
      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-[2.5rem] bg-white p-6 shadow-md">
        <Mascota stare="salut" marime={200} />
        <div className="flex-1">
          <h1 className="text-4xl font-extrabold text-mov">{NUME_MASCOTA}</h1>
          <p className="mt-2 text-lg text-gray-700">Beculețul isteț al Fabricii de Inteligență. Are „creierul” din logo, ochi mari și un soclu mov. Îi însoțește pe copii la toate cursurile: îi salută, se gândește cu ei, se bucură când reușesc și îi încurajează când greșesc.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STARI.map(([s, nume, text]) => (
          <div key={s} className="flex flex-col items-center rounded-3xl bg-white p-4 text-center shadow">
            <Mascota stare={s} marime={150} />
            <b className="mt-2 text-xl text-mov">{nume}</b>
            <span className="text-gray-600">„{text}”</span>
          </div>
        ))}
      </div>
    </main>
  );
}
