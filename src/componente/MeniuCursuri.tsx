import Link from "next/link";

/** Cursurile platformei. Pentru un curs nou se adaugă o intrare aici (și pagina lui). */
export const CURSURI = [
  { id: "mate", nume: "Mate cu SENS", icon: "🔢", descriere: "Matematică pentru clasele I–V: fișe, lecții, jocuri și teme", gata: true },
  { id: "engleza", nume: "Engleză", icon: "🇬🇧", descriere: "Cursul de limba engleză", gata: false },
] as const;

/** Unde duce fiecare curs, după rolul celui conectat (fără cont: pagina de prezentare). */
export function linkCurs(id: (typeof CURSURI)[number]["id"], rol?: string | null): string {
  if (id === "engleza") return "/engleza";
  if (rol === "ELEV") return "/elev";
  if (rol) return "/profesor";
  return "/#mate-cu-sens";
}

/** Meniul „Cursuri” (listă derulantă; merge și fără JavaScript). */
export function MeniuCursuri({ rol, aliniere = "dreapta" }: { rol?: string | null; aliniere?: "stanga" | "dreapta" }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-2 py-1 font-semibold text-mov hover:bg-mov-deschis [&::-webkit-details-marker]:hidden">
        📚 Cursuri <span className="text-xs transition group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className={`absolute z-50 mt-1 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-mov/15 ${aliniere === "dreapta" ? "right-0" : "left-0"}`}>
        {CURSURI.map((c) => (
          <Link key={c.id} href={linkCurs(c.id, rol)} className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-mov-deschis">
            <span className="text-2xl" aria-hidden>{c.icon}</span>
            <span>
              <span className="block font-bold text-mov">{c.nume}{!c.gata && <span className="ml-2 rounded-full bg-galben px-2 py-0.5 text-xs text-mov-inchis">în curând</span>}</span>
              <span className="block text-xs text-gray-600">{c.descriere}</span>
            </span>
          </Link>
        ))}
      </div>
    </details>
  );
}
