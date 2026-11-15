import Link from "next/link";
import { notFound } from "next/navigation";
import { db, dbConfigurata } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { exercitiiTema, filtruTemeProfesor } from "@/lib/teme";
import { codifica } from "@/motor/calcul/config";

export const dynamic = "force-dynamic";

const durata = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export default async function RezultateTema({ params }: { params: Promise<{ id: string }> }) {
  if (!dbConfigurata) notFound();
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const { id } = await params;
  const t = await db.tema.findFirst({
    where: { id, ...filtruTemeProfesor(s) },
    include: {
      clasa: { include: { elevi: { include: { elev: { select: { id: true, nume: true, prenume: true } } } } } },
      elev: { select: { id: true, nume: true, prenume: true } },
      incercari: { where: { terminat: { not: null } }, orderBy: { terminat: "desc" }, include: { raspunsuri: { select: { item: true, corect: true } } } },
    },
  });
  if (!t) notFound();
  const elevi = (t.elev ? [t.elev] : t.clasa?.elevi.map((i) => i.elev) ?? []).sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
  const ultima = new Map<string, (typeof t.incercari)[number]>();
  const nrIncercari = new Map<string, number>();
  for (const i of t.incercari) {
    if (!ultima.has(i.elevId)) ultima.set(i.elevId, i);
    nrIncercari.set(i.elevId, (nrIncercari.get(i.elevId) ?? 0) + 1);
  }
  // exercițiile cu cele mai multe greșeli (ultima încercare a fiecărui elev)
  const greseli = new Map<string, { text: string; gresit: number; total: number }>();
  for (const i of ultima.values())
    for (const r of i.raspunsuri) {
      const it = r.item as { id: string; text: string; inainte?: string | null; raspuns: string };
      const g = greseli.get(it.id) ?? { text: `${it.text} ${it.inainte ?? ""} ${it.raspuns}`, gresit: 0, total: 0 };
      g.total++;
      if (!r.corect) g.gresit++;
      greseli.set(it.id, g);
    }
  const grele = [...greseli.values()].filter((g) => g.gresit).sort((a, b) => b.gresit - a.gresit).slice(0, 8);
  const cfg = exercitiiTema(t, "").cfg;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <Link href="/profesor/teme" className="text-sm font-semibold text-mov">← Toate temele</Link>
      <h1 className="mt-2 text-3xl font-bold text-mov">{t.titlu}</h1>
      <p className="text-gray-600">
        {t.test ? "Test" : "Temă"} · cod <b className="font-mono tracking-widest">{t.cod}</b> · {t.nrItemi} exerciții
        {t.limitaMinute ? ` · ${t.limitaMinute} minute` : ""}{t.seed === null ? " · exerciții diferite pentru fiecare elev" : ""}
      </p>
      {t.seed !== null && (
        <p className="mt-1 text-sm"><a className="font-semibold text-mov underline" target="_blank" href={`/fisa/calcul?c=${codifica(cfg)}&mod=fisa%2Bbarem`}>Vezi fișa și baremul</a></p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-left">
          <thead className="bg-mov-deschis text-sm text-mov">
            <tr><th className="p-3">Elev</th><th className="p-3">Corecte</th><th className="p-3">Procent</th><th className="p-3">Timp</th><th className="p-3">Trimis</th><th className="p-3">Încercări</th></tr>
          </thead>
          <tbody>
            {elevi.map((e) => {
              const i = ultima.get(e.id);
              const p = i ? Math.round((100 * i.corecte) / Math.max(1, i.total)) : null;
              return (
                <tr key={e.id} className="border-t">
                  <td className="p-3 font-semibold">{e.nume} {e.prenume}</td>
                  <td className="p-3">{i ? `${i.corecte}/${i.total}` : "—"}</td>
                  <td className="p-3">{p === null ? <span className="text-gray-400">netrimis</span> : <span className={p >= 90 ? "font-bold text-green-700" : p >= 50 ? "text-amber-700" : "font-bold text-red-700"}>{p}%</span>}</td>
                  <td className="p-3">{i?.terminat ? durata(i.terminat.getTime() - i.inceput.getTime()) : "—"}</td>
                  <td className="p-3 text-sm">{i?.terminat?.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" }) ?? "—"}</td>
                  <td className="p-3">{nrIncercari.get(e.id) ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {grele.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-4 shadow">
          <h2 className="font-bold text-mov">Exercițiile cu cele mai multe greșeli</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {grele.map((g) => <li key={g.text}><span className="font-mono">{g.text}</span> — greșit de {g.gresit} din {g.total}</li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
