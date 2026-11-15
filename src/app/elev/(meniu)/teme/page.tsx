import Link from "next/link";
import { redirect } from "next/navigation";
import { db, dbConfigurata } from "@/lib/db";
import { sesiuneCurenta } from "@/lib/auth";
import { filtruTemeElev } from "@/lib/teme";

export const dynamic = "force-dynamic";

async function deschideCod(f: FormData) {
  "use server";
  const cod = String(f.get("cod") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cod) redirect(`/elev/tema/${cod}`);
}

export default async function TemeleMele() {
  const s = dbConfigurata ? await sesiuneCurenta() : null;
  if (!s || s.rol !== "ELEV") {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-3xl font-bold text-mov">Temele mele</h1>
        <p className="mt-4 rounded-2xl bg-hartie p-6 shadow">Temele online apar aici după ce intri cu contul tău de elev.</p>
      </main>
    );
  }
  const teme = await db.tema.findMany({
    where: filtruTemeElev(s.id),
    orderBy: { creatLa: "desc" },
    take: 50,
    include: { incercari: { where: { elevId: s.id, terminat: { not: null } }, orderBy: { terminat: "desc" }, take: 1 } },
  });
  return (
    <main className="mx-auto max-w-3xl px-4 pb-12">
      <h1 className="mt-4 text-center text-3xl font-bold text-mov">Temele mele</h1>
      <form action={deschideCod} className="mx-auto mt-5 flex max-w-md gap-2">
        <input name="cod" placeholder="Codul de la profesor" maxLength={8} autoComplete="off"
          className="flex-1 rounded-2xl border-2 border-mov/30 bg-white p-3 text-center font-mono text-xl uppercase tracking-widest" />
        <button type="submit" className="rounded-2xl bg-mov px-5 font-bold text-white">Deschide</button>
      </form>
      <div className="mt-6 grid gap-3">
        {!teme.length && <p className="rounded-2xl bg-hartie p-6 text-center shadow">Nu ai nicio temă acum. 🎉</p>}
        {teme.map((t) => {
          const i = t.incercari[0];
          const p = i ? Math.round((100 * i.corecte) / Math.max(1, i.total)) : null;
          const expirat = t.termen && t.termen < new Date();
          return (
            <Link key={t.id} href={`/elev/tema/${t.cod}`} className="flex items-center gap-4 rounded-3xl bg-hartie p-5 shadow transition hover:-translate-y-0.5 hover:shadow-lg">
              <span className="text-4xl" aria-hidden>{t.test ? "📝" : "✏️"}</span>
              <span className="flex-1">
                <span className="block text-xl font-bold text-mov">{t.titlu}</span>
                <span className="block text-sm text-gray-600">
                  {t.nrItemi} exerciții{t.limitaMinute ? ` · ${t.limitaMinute} minute` : ""}
                  {t.termen ? ` · până pe ${t.termen.toLocaleDateString("ro-RO")}` : ""}{expirat ? " (termen trecut)" : ""}
                </span>
              </span>
              {p === null ? <span className="rounded-2xl bg-galben px-4 py-2 font-bold text-mov-inchis">Începe</span>
                : <span className="rounded-2xl bg-green-100 px-4 py-2 font-bold text-green-800">{i.corecte}/{i.total} {"⭐".repeat(i.stele)}</span>}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
