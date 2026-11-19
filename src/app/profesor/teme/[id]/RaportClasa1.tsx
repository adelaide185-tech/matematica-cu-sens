import Link from "next/link";
import { CAPITOLE_C1 } from "@/motor/clasa1/capitole";
import { codificaC1, curataC1 } from "@/motor/clasa1/config";
import { MEDALII, medalie, type Medalie } from "@/motor/clasa1/tipuri";

interface Raspuns {
  item: unknown;
  corect: boolean;
  raspunsElev: unknown;
  timpMs: number;
  competenta: string;
}
interface Incercare {
  elevId: string;
  corecte: number;
  total: number;
  inceput: Date;
  terminat: Date | null;
  raspunsuri: Raspuns[];
}
interface TemaRaport {
  id: string;
  cod: string;
  titlu: string;
  test: boolean;
  nrItemi: number;
  seed: number | null;
  config: unknown;
  termen: Date | null;
  incercari: Incercare[];
}
type Elev = { id: string; nume: string; prenume: string };
type Item = { enunt: string; raspuns: string; capitol: string; fisa?: string };
type RE = { primul?: string; incercari?: number; ajutor?: boolean };

const durata = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
const sec = (ms: number) => `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
const proc = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const culoare = (p: number) => (p >= 90 ? "bg-green-100 text-green-800" : p >= 75 ? "bg-lime-100 text-lime-800" : p >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800");

function Insigna({ m }: { m: Medalie | null }) {
  if (!m) return <span className="text-gray-500">—</span>;
  return <span className="whitespace-nowrap font-bold" style={{ color: MEDALII[m].culoare }}>{MEDALII[m].icon} {MEDALII[m].nume}</span>;
}

/** Raportul profesorului pentru jocurile clasei I: medalie, acuratețe, viteză și unde a greșit fiecare elev. */
export function RaportClasa1({ t, elevi }: { t: TemaRaport; elevi: Elev[] }) {
  const cfg = curataC1((t.config ?? {}) as Record<string, unknown>);
  const capitole = CAPITOLE_C1.filter((c) => cfg.capitole.includes(c.id));
  const ultima = new Map<string, Incercare>();
  const nrIncercari = new Map<string, number>();
  for (const i of t.incercari) {
    if (!ultima.has(i.elevId)) ultima.set(i.elevId, i);
    nrIncercari.set(i.elevId, (nrIncercari.get(i.elevId) ?? 0) + 1);
  }
  const trimise = [...ultima.values()];
  const medie = trimise.length ? Math.round(trimise.reduce((s, i) => s + proc(i.corecte, i.total), 0) / trimise.length) : null;
  const medalii = new Map<Medalie | null, number>();
  for (const i of trimise) {
    const m = medalie(proc(i.corecte, i.total));
    medalii.set(m, (medalii.get(m) ?? 0) + 1);
  }
  const timpMediu = trimise.length ? trimise.reduce((s, i) => s + (i.terminat ? i.terminat.getTime() - i.inceput.getTime() : 0), 0) / trimise.length : 0;

  // greșelile frecvente (ultima încercare a fiecărui elev): exercițiu → de câte ori greșit + răspunsul greșit cel mai des
  const greseli = new Map<string, { item: Item; gresit: number; total: number; raspunsuri: Map<string, number> }>();
  for (const i of trimise)
    for (const r of i.raspunsuri) {
      const it = r.item as Item;
      const k = `${it.enunt}|${it.raspuns}`;
      const g = greseli.get(k) ?? { item: it, gresit: 0, total: 0, raspunsuri: new Map() };
      g.total++;
      if (!r.corect) {
        g.gresit++;
        const dat = (r.raspunsElev as RE)?.primul || "fără răspuns";
        g.raspunsuri.set(dat, (g.raspunsuri.get(dat) ?? 0) + 1);
      }
      greseli.set(k, g);
    }
  const grele = [...greseli.values()].filter((g) => g.gresit).sort((a, b) => b.gresit - a.gresit || b.gresit / b.total - a.gresit / a.total).slice(0, 10);

  const peCapitol = (i: Incercare, cap: string) => {
    const l = i.raspunsuri.filter((r) => r.competenta === cap);
    return { corecte: l.filter((r) => r.corect).length, total: l.length };
  };
  const clasaCapitol = capitole.map((c) => {
    const s = trimise.reduce((acc, i) => { const p = peCapitol(i, c.id); return { corecte: acc.corecte + p.corecte, total: acc.total + p.total }; }, { corecte: 0, total: 0 });
    return { ...c, ...s };
  });

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-8">
      <Link href="/profesor/teme" className="text-sm font-semibold text-mov">← Toate temele</Link>
      <h1 className="mt-2 text-3xl font-bold text-mov">🚀 {t.titlu}</h1>
      <p className="text-gray-600">
        Jocuri Clasa I · {t.test ? "test" : "temă"} · cod <b className="font-mono tracking-widest">{t.cod}</b> · {t.nrItemi} exerciții
        {t.termen ? ` · termen ${t.termen.toLocaleDateString("ro-RO")}` : ""}{t.seed === null ? " · exerciții diferite pentru fiecare elev" : ""}
      </p>
      <p className="mt-1 text-sm text-gray-600">Capitole: {capitole.map((c) => `${c.icon} ${c.scurt}`).join(" · ")}</p>
      <p className="mt-1 flex flex-wrap gap-4 text-sm">
        <a className="font-semibold text-mov underline" target="_blank" href={`/elev/clasa1?c=${codificaC1(cfg)}`}>Încearcă jocul</a>
        {t.seed !== null && <a className="font-semibold text-mov underline" target="_blank" href={`/fisa/clasa1?c=${codificaC1(cfg)}&mod=fisa%2Bbarem`}>Fișa și baremul</a>}
      </p>

      <section className="mt-5 grid gap-3 sm:grid-cols-4">
        <Card titlu="Au terminat" valoare={`${trimise.length} / ${elevi.length}`} />
        <Card titlu="Acuratețe medie (din prima)" valoare={medie === null ? "—" : `${medie}%`} />
        <Card titlu="Timp mediu" valoare={trimise.length ? durata(timpMediu) : "—"} />
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-xs text-gray-500">Medalii</div>
          <div className="mt-1 flex flex-wrap gap-2 text-lg">
            {(["diamant", "aur", "argint", "bronz"] as Medalie[]).map((m) => <span key={m} title={MEDALII[m].nume}>{MEDALII[m].icon} {medalii.get(m) ?? 0}</span>)}
            <span title="sub 50%">🌱 {medalii.get(null) ?? 0}</span>
          </div>
        </div>
      </section>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-mov-deschis text-mov">
            <tr>
              <th className="p-3">Elev</th><th className="p-3">Medalie</th><th className="p-3">Din prima</th><th className="p-3">Acuratețe</th>
              <th className="p-3">Cu ajutor</th><th className="p-3">Timp total</th><th className="p-3">Timp / exercițiu</th>
              {capitole.map((c) => <th key={c.id} className="p-3 text-center" title={c.titlu}>{c.icon}</th>)}
              <th className="p-3">Trimis</th><th className="p-3">Încercări</th>
            </tr>
          </thead>
          <tbody>
            {elevi.map((e) => {
              const i = ultima.get(e.id);
              const p = i ? proc(i.corecte, i.total) : null;
              const ajutor = i ? i.raspunsuri.filter((r) => (r.raspunsElev as RE)?.ajutor).length : 0;
              const timp = i?.terminat ? i.terminat.getTime() - i.inceput.getTime() : 0;
              const median = i ? [...i.raspunsuri.map((r) => r.timpMs)].sort((a, b) => a - b)[Math.floor(i.raspunsuri.length / 2)] ?? 0 : 0;
              return (
                <tr key={e.id} className="border-t align-top">
                  <td className="p-3 font-semibold">
                    {e.nume} {e.prenume}
                    {i && i.corecte < i.total && <Detalii i={i} />}
                  </td>
                  <td className="p-3">{p === null ? <span className="text-gray-400">netrimis</span> : <Insigna m={medalie(p)} />}</td>
                  <td className="p-3">{i ? `${i.corecte}/${i.total}` : "—"}</td>
                  <td className="p-3">{p === null ? "—" : <span className={`rounded-md px-2 py-0.5 font-bold ${culoare(p)}`}>{p}%</span>}</td>
                  <td className="p-3">{i ? ajutor : "—"}</td>
                  <td className="p-3">{i ? durata(timp) : "—"}</td>
                  <td className="p-3">{i ? sec(median) : "—"}</td>
                  {capitole.map((c) => {
                    if (!i) return <td key={c.id} className="p-3 text-center text-gray-300">·</td>;
                    const x = peCapitol(i, c.id);
                    return <td key={c.id} className="p-2 text-center">{x.total ? <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${culoare(proc(x.corecte, x.total))}`}>{x.corecte}/{x.total}</span> : "·"}</td>;
                  })}
                  <td className="p-3">{i?.terminat?.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" }) ?? "—"}</td>
                  <td className="p-3">{nrIncercari.get(e.id) ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">„Din prima” = rezolvat corect la prima încercare, fără rezolvarea arătată. Medalii: 🥉 ≥ 50%, 🥈 ≥ 75%, 🥇 ≥ 90%, 💎 100%. Timpul pe exercițiu este mediana.</p>

      {trimise.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-4 shadow">
          <h2 className="font-bold text-mov">Pe capitole (toată grupa)</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {clasaCapitol.map((c) => {
              const p = proc(c.corecte, c.total);
              return (
                <div key={c.id} className="rounded-xl border p-3">
                  <div className="font-semibold">{c.icon} {c.scurt}</div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-mov" style={{ width: `${p}%` }} /></div>
                  <div className="mt-1 text-sm text-gray-600">{c.total ? `${p}% din prima (${c.corecte}/${c.total})` : "fără exerciții"}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {grele.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-4 shadow">
          <h2 className="font-bold text-mov">Exercițiile cu cele mai multe greșeli</h2>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {grele.map((g) => {
              const [frecvent, cati] = [...g.raspunsuri.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
              return (
                <li key={`${g.item.enunt}|${g.item.raspuns}`} className="flex flex-wrap gap-x-2">
                  <span>{CAPITOLE_C1.find((c) => c.id === g.item.capitol)?.icon}</span>
                  <span className="font-semibold">{g.item.enunt}</span>
                  <span>→ corect: <b>{g.item.raspuns}</b></span>
                  <span className="text-red-700">greșit de {g.gresit} din {g.total}</span>
                  {cati > 1 && <span className="text-gray-600">(de {cati} ori „{frecvent}”)</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function Card({ titlu, valoare }: { titlu: string; valoare: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <div className="text-xs text-gray-500">{titlu}</div>
      <div className="mt-1 text-2xl font-bold text-mov-inchis">{valoare}</div>
    </div>
  );
}

/** Unde a greșit elevul: exercițiul, ce a răspuns prima dată, răspunsul corect. */
function Detalii({ i }: { i: Incercare }) {
  const gresite = i.raspunsuri.filter((r) => !r.corect);
  return (
    <details className="mt-1 font-normal">
      <summary className="cursor-pointer text-xs font-semibold text-mov">Unde a greșit ({gresite.length})</summary>
      <ul className="mt-1 grid gap-1 text-xs">
        {gresite.map((r, k) => {
          const it = r.item as Item;
          const re = r.raspunsElev as RE;
          return (
            <li key={k} className="rounded bg-red-50 px-2 py-1">
              {CAPITOLE_C1.find((c) => c.id === it.capitol)?.icon} {it.enunt} — a răspuns „{re?.primul || "fără răspuns"}”, corect: <b>{it.raspuns}</b>
              {re?.ajutor ? " · a văzut rezolvarea" : re?.incercari && re.incercari > 1 ? ` · corect după ${re.incercari} încercări` : ""}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
