import Image from "next/image";
import Link from "next/link";
import { sesiuneCurenta, ROL_NUME } from "@/lib/auth";
import { deconectare } from "@/lib/actiuni-cont";

/** Bara de sus cu numele utilizatorului și ieșirea din cont (doar când există conturi). */
export async function BaraCont() {
  const s = await sesiuneCurenta();
  if (!s) return null;
  return (
    <div className="nu-printa flex items-center justify-between gap-3 border-b border-mov/10 bg-white px-4 py-2 text-sm">
      <Link href="/" className="flex items-center gap-2 font-bold text-mov">
        <Image src="/brand/logo-mic.jpg" alt="" width={32} height={32} className="rounded-lg" />
        <span className="hidden sm:inline">Matematică cu Sens</span>
      </Link>
      <nav className="flex items-center gap-3">
        {s.rol === "ADMIN_SCOALA" && <Link href="/admin" className="font-semibold text-mov hover:underline">Administrare</Link>}
        {s.rol !== "ELEV" && <Link href="/profesor" className="font-semibold text-mov hover:underline">Fișe</Link>}
        {s.rol !== "ELEV" && <Link href="/profesor/lectii" className="font-semibold text-mov hover:underline">Lecții</Link>}
        <Link href="/elev" className="font-semibold text-mov hover:underline">Jocuri</Link>
        <Link href="/elev/atelier" className="font-semibold text-mov hover:underline">Atelier</Link>
        <span className="hidden text-gray-600 md:inline">{s.nume} · {ROL_NUME[s.rol]}</span>
        <Link href="/schimba-parola" className="text-gray-600 hover:underline">Parola</Link>
        <form action={deconectare}><button className="rounded-lg bg-mov-deschis px-3 py-1 font-semibold text-mov">Ieși</button></form>
      </nav>
    </div>
  );
}
