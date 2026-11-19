import Link from "next/link";
import { notFound } from "next/navigation";
import { db, dbConfigurata } from "@/lib/db";
import { cereRol } from "@/lib/auth";
import { cfgTemaC2, cfgTemaC3, cfgTemaC4, exercitiiTema, filtruTemeProfesor } from "@/lib/teme";
import { codificaC4 } from "@/motor/clasa4/config";
import { NUME_CAPITOL_C4, type CapitolC4 } from "@/motor/clasa4/tipuri";
import { codifica } from "@/motor/calcul/config";
import { codificaC3 } from "@/motor/clasa3/config";
import { MEDALII } from "@/motor/clasa3/generator";
import { JOCURI_C3, NUME_CAPITOL, type CapitolC3, type JocC3 } from "@/motor/clasa3/tipuri";
import { JOCURI_C2, NUME_EROARE, NUME_NOTIUNE, type JocC2, type NotiuneC2, type TipEroare } from "@/motor/clasa2/tipuri";
import { codificaC2 } from "@/motor/clasa2/config";
import { Reimprospatare } from "@/componente/Reimprospatare";
import { RECOMANDARE, SEMAFOR, rezumatElev, type Semafor } from "@/lib/raport-tema";
import { RaportClasa1 } from "./RaportClasa1";

export const dynamic = "force-dynamic";

const durata = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
type ItemSalvat = { id: string; text: string; inainte?: string | null; raspuns: string };

export default async function RezultateTema({ params }: { params: Promise<{ id: string }> }) {
  if (!dbConfigurata) notFound();
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const { id } = await params;
  const t = await db.tema.findFirst({
    where: { id, ...filtruTemeProfesor(s) },
    include: {
      clasa: { include: { elevi: { include: { elev: { select: { id: true, nume: true, prenume: true } } } } } },
      elev: { select: { id: true, nume: true, prenume: true } },
      incercari: { where: { terminat: { not: null } }, orderBy: { terminat: "desc" }, include: { raspunsuri: { select: { item: true, corect: true, raspunsElev: true, timpMs: true, competenta: true } } } },
    },
  });
  if (!t) notFound();
  const c2 = t.mecanica.startsWith("c2:");
  const c4 = t.mecanica.startsWith("c4:");
  const joc = t.mecanica.startsWith("c3:") || c4 ? (t.mecanica.slice(3) as JocC3) : c2 ? (t.mecanica.slice(3) as JocC2) : null;
  const infoJoc = joc ? (c2 ? JOCURI_C2[joc as JocC2] ?? { icon: "🎲", nume: "Mix automat" } : JOCURI_C3[joc as JocC3]) : null;
  const numeCap = (c: string) => (c4 ? NUME_CAPITOL_C4[c as CapitolC4] : undefined) ?? NUME_CAPITOL[c as CapitolC3] ?? NUME_NOTIUNE[c as NotiuneC2] ?? c;
  const elevi = (t.elev ? [t.elev] : t.clasa?.elevi.map((i) => i.elev) ?? []).sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
  if (t.mecanica === "clasa1") return <RaportClasa1 t={t} elevi={elevi} />;
  const ultima = new Map<string, (typeof t.incercari)[number]>();
  const nrIncercari = new Map<string, number>();
  for (const i of t.incercari) {
    if (!ultima.has(i.elevId)) ultima.set(i.elevId, i);
    nrIncercari.set(i.elevId, (nrIncercari.get(i.elevId) ?? 0) + 1);
  }
  // exercițiile cu cele mai multe greșeli și capitolele cu probleme (ultima încercare a fiecărui elev)
  const greseli = new Map<string, { text: string; gresit: number; total: number; raspunsuri: Map<string, number> }>();
  const capitole = new Map<string, { gresit: number; total: number }>();
  for (const i of ultima.values())
    for (const r of i.raspunsuri) {
      const it = r.item as ItemSalvat;
      const cheie = it.text;
      const g = greseli.get(cheie) ?? { text: `${it.text} ${it.inainte ?? ""} → ${it.raspuns}`, gresit: 0, total: 0, raspunsuri: new Map() };
      g.total++;
      if (!r.corect) {
        g.gresit++;
        const dat = String((r.raspunsElev as { valoare?: string })?.valoare ?? "");
        if (dat) g.raspunsuri.set(dat, (g.raspunsuri.get(dat) ?? 0) + 1);
      }
      greseli.set(cheie, g);
      if (joc) {
        const c = capitole.get(r.competenta) ?? { gresit: 0, total: 0 };
        c.total++;
        if (!r.corect) c.gresit++;
        capitole.set(r.competenta, c);
      }
    }
  const grele = [...greseli.values()].filter((g) => g.gresit).sort((a, b) => b.gresit - a.gresit).slice(0, 8);
  const link = t.seed === null ? null
    : c2 ? `/fisa/clasa2?c=${codificaC2(cfgTemaC2(t, ""))}&mod=fisa%2Bbarem` : c4 ? `/fisa/clasa4?c=${codificaC4(cfgTemaC4(t, ""))}&mod=fisa%2Bbarem` : joc ? `/fisa/clasa3?c=${codificaC3(cfgTemaC3(t, ""))}&mod=fisa%2Bbarem` : `/fisa/calcul?c=${codifica(exercitiiTema(t, "").cfg)}&mod=fisa%2Bbarem`;
  const trimisi = elevi.filter((e) => ultima.has(e.id)).length;
  const rezumate = joc ? new Map(elevi.map((e) => [e.id, rezumatElev(t, e.id)])) : null;
  const numarSemafor = (x: Semafor) => (rezumate ? [...rezumate.values()].filter((r) => r.semafor === x).length : 0);

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-8">
      <Link href="/profesor/teme" className="text-sm font-semibold text-mov">← Toate temele</Link>
      <h1 className="mt-2 text-3xl font-bold text-mov">{t.mecanica === "c2:mix" ? <span aria-hidden>🎲 </span> : infoJoc && <span aria-hidden>{infoJoc.icon} </span>}{t.titlu}</h1>
      <p className="text-gray-600">
        {infoJoc ? `${infoJoc.nume} · ` : ""}{t.test ? "Test" : "Temă"} · cod <b className="font-mono tracking-widest">{t.cod}</b> · {t.nrItemi} exerciții
        {t.limitaMinute ? ` · ${t.limitaMinute} minute` : ""}{t.seed === null ? " · exerciții diferite pentru fiecare elev" : ""}
        {joc && t.generatoare.length ? ` · ${t.generatoare.map(numeCap).join(", ")}` : ""}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm">
        {link && <a className="font-semibold text-mov underline" target="_blank" href={link}>Vezi fișa și baremul</a>}
        <span>Au trimis: <b>{trimisi}/{elevi.length}</b></span>
        <Reimprospatare />
      </div>

      {rezumate && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {(Object.keys(SEMAFOR) as Semafor[]).map((x) => <span key={x} className="rounded-full bg-white px-3 py-1 text-sm shadow">{SEMAFOR[x].icon} {SEMAFOR[x].nume}: <b>{numarSemafor(x)}</b></span>)}
          <a href={`/api/csv-tema?id=${t.id}`} className="ml-auto rounded-xl bg-mov px-3 py-1.5 text-sm font-bold text-white">⬇️ CSV (Excel)</a>
        </div>
      )}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-mov-deschis text-mov">
            <tr>
              <th className="p-3">Elev</th>{joc && <th className="p-3">Stare</th>}{joc && <th className="p-3">Medalie</th>}<th className="p-3">Corecte</th><th className="p-3">Acuratețe</th>
              {joc && <th className="p-3">Scor</th>}<th className="p-3">Timp</th><th className="p-3">Timp mediu / ex.</th><th className="p-3">Trimis</th><th className="p-3">Încercări</th><th className="p-3">Exerciții greșite</th>{joc && <th className="p-3">Rapoarte</th>}
            </tr>
          </thead>
          <tbody>
            {elevi.map((e) => {
              const i = ultima.get(e.id);
              const p = i ? Math.round((100 * i.corecte) / Math.max(1, i.total)) : null;
              const ms = i?.terminat ? i.terminat.getTime() - i.inceput.getTime() : 0;
              const gresite = i?.raspunsuri.filter((r) => !r.corect) ?? [];
              const m = i?.medalie as keyof typeof MEDALII | null | undefined;
              return (
                <tr key={e.id} className="border-t align-top">
                  <td className="p-3 font-semibold">{e.nume} {e.prenume}</td>
                  {rezumate && <td className="p-3 whitespace-nowrap" title={SEMAFOR[rezumate.get(e.id)!.semafor].nume}>{SEMAFOR[rezumate.get(e.id)!.semafor].icon} <span className="text-xs">{SEMAFOR[rezumate.get(e.id)!.semafor].nume}</span></td>}
                  {joc && <td className="p-3 text-lg">{m ? <span title={MEDALII[m].nume}>{MEDALII[m].icon} {MEDALII[m].nume}</span> : i ? "—" : ""}</td>}
                  <td className="p-3">{i ? `${i.corecte}/${i.total}` : "—"}</td>
                  <td className="p-3">{p === null ? <span className="text-gray-400">netrimis</span> : <span className={p >= 90 ? "font-bold text-green-700" : p >= 50 ? "text-amber-700" : "font-bold text-red-700"}>{p}%</span>}</td>
                  {joc && <td className="p-3">{i?.scor ?? "—"}{i?.comboMax ? <span className="ml-1 text-xs text-gray-500">🔥{i.comboMax}</span> : null}</td>}
                  <td className="p-3">{i ? durata(ms) : "—"}</td>
                  <td className="p-3">{i ? `${Math.round(ms / Math.max(1, i.total) / 100) / 10} s` : "—"}</td>
                  <td className="p-3">{i?.terminat?.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" }) ?? "—"}</td>
                  <td className="p-3">{nrIncercari.get(e.id) ?? 0}</td>
                  <td className="p-3">
                    {i && (gresite.length ? (
                      <details><summary className="cursor-pointer text-red-700">{gresite.length} greșite</summary>
                        <ul className="mt-1 grid gap-0.5 text-xs">
                          {gresite.map((r, k) => { const it = r.item as ItemSalvat; const dat = (r.raspunsElev as { valoare?: string })?.valoare; return <li key={k}><span className="font-mono">{it.text}</span> — a scris <b>{dat || "nimic"}</b>, corect <b>{it.raspuns}</b></li>; })}
                        </ul>
                      </details>
                    ) : <span className="text-green-700">niciuna 🎉</span>)}
                  </td>
                  {joc && (
                    <td className="p-3 whitespace-nowrap text-xs">
                      {i && <a className="block font-semibold text-mov underline" href={`/api/pdf-raport?t=${t.id}&e=${e.id}&tip=raport`}>📄 Pentru părinți</a>}
                      {i && (rezumate!.get(e.id)!.cea?.medalie === "aur" || rezumate!.get(e.id)!.cea?.medalie === "diamant") && <a className="mt-1 block font-semibold text-mov underline" href={`/api/pdf-raport?t=${t.id}&e=${e.id}&tip=diploma`}>🏆 Diplomă</a>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {joc && capitole.size > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-4 shadow">
          <h2 className="font-bold text-mov">Pe capitole</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {[...capitole.entries()].map(([c, v]) => {
              const p = Math.round((100 * (v.total - v.gresit)) / Math.max(1, v.total));
              return (
                <li key={c}>
                  <div className="flex justify-between text-sm"><span>{numeCap(c)}</span><b>{p}% corecte</b></div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-gray-200"><div className={`h-full ${p >= 80 ? "bg-green-500" : p >= 60 ? "bg-galben" : "bg-red-400"}`} style={{ width: `${p}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {c2 && (() => {
        const tipuri = new Map<TipEroare, Set<string>>();
        for (const [elevId, i] of ultima) for (const r of i.raspunsuri) {
          const e = (r.raspunsElev as { eroare?: TipEroare | null })?.eroare;
          if (e) { const nume = elevi.find((x) => x.id === elevId); (tipuri.get(e) ?? tipuri.set(e, new Set()).get(e)!).add(nume ? `${nume.nume} ${nume.prenume}` : "?"); }
        }
        if (!tipuri.size) return null;
        return (
          <section className="mt-6 rounded-2xl bg-white p-4 shadow">
            <h2 className="font-bold text-mov">Greșeli tipice</h2>
            <ul className="mt-2 grid gap-1 text-sm">
              {[...tipuri.entries()].sort((a, b) => b[1].size - a[1].size).map(([e, el]) => (
                <li key={e}><b>{el.size} {el.size === 1 ? "elev" : "elevi"}</b>: {NUME_EROARE[e]} <span className="text-gray-500">({[...el].join(", ")})</span>
                  {RECOMANDARE[e] && <span className="block text-xs">→ Recomandare: <Link href="/profesor/clasa2" className="font-semibold text-mov underline">{RECOMANDARE[e]}</Link></span>}
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {grele.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-4 shadow">
          <h2 className="font-bold text-mov">Exercițiile cu cele mai multe greșeli</h2>
          <ul className="mt-2 grid gap-1 text-sm">
            {grele.map((g) => {
              const frecvent = [...g.raspunsuri.entries()].sort((a, b) => b[1] - a[1])[0];
              return <li key={g.text}><span className="font-mono">{g.text}</span> — greșit de {g.gresit} din {g.total}{frecvent ? ` (cel mai des: „${frecvent[0]}”, ${frecvent[1]})` : ""}</li>;
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
