import Link from "next/link";
import Image from "next/image";
import { MASCOTA_SCENA, Mascota, NUME_MASCOTA, type StareMascota } from "@/componente/Mascota";

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
    <main className="fundal-fabrica min-h-screen"><div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm font-semibold text-mov">← Acasă</Link>
      <Image src={MASCOTA_SCENA} alt={`${NUME_MASCOTA} în atelierul Fabricii de Inteligență`} width={1600} height={1194} priority className="portret-mascota mt-4 h-auto w-full rounded-[2.5rem]" />
      <div className="mt-6 flex flex-wrap items-center gap-6 rounded-[2.5rem] bg-white p-6 shadow-md">
        <Mascota stare="salut" marime={200} />
        <div className="flex-1">
          <h1 className="text-4xl font-extrabold text-mov">{NUME_MASCOTA}</h1>
          <p className="mt-2 text-lg text-gray-700">Micul inventator al Fabricii de Inteligență: un robot-copil mov cu smoc de păr, vizor cyan, căști și o antenă cu beculeț, care se aprinde când îi vine o idee. Îi însoțește pe copii la toate cursurile: îi salută, se gândește cu ei, se bucură când reușesc și îi încurajează când greșesc.</p>
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
    </div></main>
  );
}
