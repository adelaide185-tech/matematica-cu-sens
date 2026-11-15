import Link from "next/link";
import { db, dbConfigurata } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { filtruTemeProfesor, MECANICI_TEME } from "@/lib/teme";
import { stergeTema } from "@/lib/actiuni-teme";
import { FormActiune } from "@/componente/FormActiune";
import { Reimprospatare } from "@/componente/Reimprospatare";
import { JOCURI_C3, type JocC3 } from "@/motor/clasa3/tipuri";
import { MEDALII } from "@/motor/clasa3/generator";

export const dynamic = "force-dynamic";

export default async function TemeProfesor() {
  if (!dbConfigurata) return <p className="p-8 text-center">Temele online funcționează când aplicația are conturi.</p>;
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const teme = await db.tema.findMany({
    where: { ...filtruTemeProfesor(s), OR: [{ mecanica: { in: [...MECANICI_TEME] } }, { mecanica: { startsWith: "c3:" } }] },
    orderBy: { creatLa: "desc" },
    include: {
      clasa: { select: { nume: true, _count: { select: { elevi: true } } } },
      elev: { select: { nume: true, prenume: true } },
      incercari: { where: { terminat: { not: null } }, select: { elevId: true, corecte: true, total: true, medalie: true } },
    },
  });
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-mov">Teme, teste și jocuri online</h1>
          <Reimprospatare />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profesor/calcul" className="rounded-xl bg-mov px-4 py-2 font-bold text-white hover:bg-mov-inchis">+ Fișă de calcul</Link>
          <Link href="/profesor/clasa3" className="rounded-xl bg-galben px-4 py-2 font-bold text-mov-inchis hover:brightness-95">+ Joc clasa a III-a</Link>
          <Link href="/profesor/clasa1" className="rounded-xl bg-galben px-4 py-2 font-bold text-mov-inchis hover:brightness-95">+ Jocuri Clasa I</Link>
        </div>
      </div>
      {!teme.length && <p className="mt-6 rounded-2xl bg-white p-6 shadow">Nu ai trimis încă nicio temă. Generează o fișă și apasă „Trimite elevilor”.</p>}
      <div className="mt-6 grid gap-3">
        {teme.map((t) => {
          const elevi = new Set(t.incercari.map((i) => i.elevId)).size;
          const tinta = t.elev ? `${t.elev.nume} ${t.elev.prenume}` : t.clasa?.nume ?? "—";
          const din = t.elev ? 1 : t.clasa?._count.elevi ?? 0;
          const medie = t.incercari.length ? Math.round((100 * t.incercari.reduce((a, i) => a + i.corecte / Math.max(1, i.total), 0)) / t.incercari.length) : null;
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow">
              <div className="flex-1">
                <Link href={`/profesor/teme/${t.id}`} className="text-lg font-bold text-mov hover:underline">{t.titlu}</Link>
                <div className="text-sm text-gray-600">
                  {t.mecanica === "clasa1" ? "🚀 Jocuri Clasa I · " : ""}{t.mecanica.startsWith("c3:") ? `${JOCURI_C3[t.mecanica.slice(3) as JocC3]?.icon ?? "🎮"} ${JOCURI_C3[t.mecanica.slice(3) as JocC3]?.nume ?? "Joc"} · ` : ""}{t.test ? "Test" : "Temă"} · {tinta} · {t.nrItemi} exerciții{t.limitaMinute ? ` · ${t.limitaMinute} min` : ""}
                  {t.termen ? ` · termen ${t.termen.toLocaleDateString("ro-RO")}` : ""}
                </div>
              </div>
              <div className="text-center"><div className="text-xs text-gray-500">Cod</div><div className="font-mono text-lg font-bold tracking-widest">{t.cod}</div></div>
              <div className="text-center"><div className="text-xs text-gray-500">Au trimis</div><div className="text-lg font-bold">{elevi}/{din}</div></div>
              <div className="text-center"><div className="text-xs text-gray-500">Media</div><div className="text-lg font-bold">{medie === null ? "—" : `${medie}%`}</div></div>
              {t.mecanica.startsWith("c3:") && (
                <div className="text-center"><div className="text-xs text-gray-500">Medalii</div><div className="text-lg">{(["diamant", "aur", "argint", "bronz"] as const).map((m) => { const n = t.incercari.filter((i) => i.medalie === m).length; return n ? <span key={m} title={MEDALII[m].nume}>{MEDALII[m].icon}{n > 1 ? `×${n}` : ""} </span> : null; })}{!t.incercari.some((i) => i.medalie) && "—"}</div></div>
              )}
              <FormActiune actiune={async () => { "use server"; await stergeTema(t.id); }} confirmare={`Ștergi tema „${t.titlu}” și rezultatele ei?`}>
                <button type="submit" className="rounded-lg px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">Șterge</button>
              </FormActiune>
            </div>
          );
        })}
      </div>
    </main>
  );
}
