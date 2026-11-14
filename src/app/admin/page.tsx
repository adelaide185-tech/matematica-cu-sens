import { db } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { atribuieProfesor } from "@/lib/actiuni-admin";
import { BaraCont } from "@/componente/BaraCont";
import { FormClasa, FormImport, FormProfesor, ButonResetare } from "./Formulare";

export const dynamic = "force-dynamic";

const CLASE = ["", "I", "a II-a", "a III-a", "a IV-a", "a V-a"];

export default async function Admin() {
  const s = await cereRol("ADMIN_SCOALA");
  const [scoala, clase, profesori] = await Promise.all([
    db.scoala.findUnique({ where: { id: s.scoalaId } }),
    db.clasa.findMany({
      where: { scoalaId: s.scoalaId },
      orderBy: [{ nivel: "asc" }, { nume: "asc" }],
      include: {
        profesori: { select: { id: true, nume: true, prenume: true } },
        elevi: { include: { elev: { select: { id: true, nume: true, prenume: true, email: true, puncteLogica: true, puncteViteza: true, ultimaAutentificare: true, schimbaParola: true } } } },
      },
    }),
    db.utilizator.findMany({ where: { scoalaId: s.scoalaId, rol: { in: ["PROFESOR", "ADMIN_SCOALA"] } }, orderBy: { nume: "asc" } }),
  ]);
  const optProf = profesori.map((p) => ({ id: p.id, nume: `${p.prenume} ${p.nume}` }));

  return (
    <>
      <BaraCont />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-bold text-mov">Administrare · {scoala?.nume}</h1>
        <p className="mt-1 text-gray-600">Creează clase, conturi de profesori și importă elevii. Parolele temporare se afișează o singură dată: descarcă-le sau printează-le.</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <Panou titlu="1. Clasă nouă"><FormClasa profesori={optProf} /></Panou>
          <Panou titlu="2. Profesor nou"><FormProfesor /></Panou>
          <Panou titlu="3. Importă elevi (CSV)"><FormImport clase={clase.map((c) => ({ id: c.id, nume: `${c.nume} (clasa ${CLASE[c.nivel]})` }))} /></Panou>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-mov">Clase ({clase.length})</h2>
          {clase.length === 0 && <p className="mt-2 text-gray-600">Nicio clasă încă. Începe cu formularul „Clasă nouă”.</p>}
          <div className="mt-3 grid gap-4">
            {clase.map((c) => (
              <details key={c.id} className="rounded-2xl bg-white p-4 shadow" open={clase.length <= 2}>
                <summary className="cursor-pointer text-lg font-bold">
                  {c.nume} <span className="font-normal text-gray-500">· clasa {CLASE[c.nivel]} · {c.anScolar} · {c.elevi.length} elevi · prof. {c.profesori.map((p) => `${p.prenume} ${p.nume}`).join(", ") || "—"}</span>
                </summary>
                <form action={atribuieProfesor} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <input type="hidden" name="clasaId" value={c.id} />
                  <select name="profesorId" className="rounded-lg border-2 border-mov/20 p-1.5">{optProf.map((p) => <option key={p.id} value={p.id}>{p.nume}</option>)}</select>
                  <button className="rounded-lg bg-mov-deschis px-3 py-1.5 font-semibold text-mov">Adaugă profesor la clasă</button>
                </form>
                {c.elevi.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="border-b text-gray-500"><th className="py-1.5">Elev</th><th>Email</th><th>Puncte</th><th>Ultima intrare</th><th /></tr></thead>
                      <tbody>
                        {c.elevi.map(({ elev: e }) => (
                          <tr key={e.id} className="border-b last:border-0">
                            <td className="py-1.5 font-semibold">{e.prenume} {e.nume}</td>
                            <td>{e.email}</td>
                            <td>🧠 {e.puncteLogica + e.puncteViteza}</td>
                            <td>{e.ultimaAutentificare ? e.ultimaAutentificare.toLocaleDateString("ro-RO") : e.schimbaParola ? "încă nu a intrat" : "—"}</td>
                            <td className="text-right"><ButonResetare id={e.id} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </details>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold text-mov">Profesori și administratori ({profesori.length})</h2>
          <table className="mt-3 w-full rounded-2xl bg-white text-left text-sm shadow">
            <tbody>
              {profesori.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-semibold">{p.prenume} {p.nume}</td>
                  <td>{p.email}</td>
                  <td>{p.rol === "ADMIN_SCOALA" ? "Administrator" : "Profesor"}</td>
                  <td className="pr-3 text-right">{p.id !== s.id && <ButonResetare id={p.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}

function Panou({ titlu, children }: { titlu: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-3 text-lg font-bold text-mov">{titlu}</h2>
      {children}
    </section>
  );
}
