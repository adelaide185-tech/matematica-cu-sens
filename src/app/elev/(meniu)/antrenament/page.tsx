"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SUBIECTE, subiect } from "@/antrenament/registru";
import { capacitate, capacitateSelectie, LUNGIMI } from "@/antrenament/sesiune";
import { DOMENII, NIVELURI_JOC, type Domeniu, type NivelJoc } from "@/antrenament/tipuri";
import { salveaza, sesiuneDeschisa, type StareSesiune } from "@/antrenament/stare-client";
import { seedNou } from "@/motor/rng";
import type { Clasa } from "@/motor/tipuri";

const NUME_CLASA = ["", "I", "a II-a", "a III-a", "a IV-a", "a V-a"];

export default function ConfigurareAntrenament() {
  const router = useRouter();
  const [clasa, setClasa] = useState<Clasa>(2);
  const [nivel, setNivel] = useState<NivelJoc>("usor");
  const [alese, setAlese] = useState<string[]>([]);
  const [n, setN] = useState(20);
  const [deschisa, setDeschisa] = useState<StareSesiune | null>(null);
  const [porneste, setPorneste] = useState(false);

  // pre-completare din link (profesorul poate trimite: ?clasa=2&subiecte=op.tabla,op.impartire&nivel=mediu&n=50)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const c = Number(q.get("clasa"));
    if ([1, 2, 3, 4, 5].includes(c)) setClasa(c as Clasa);
    else {
      try {
        const p = JSON.parse(localStorage.getItem("mcs-progres") ?? "{}");
        if ([1, 2, 3, 4, 5].includes(p.clasa)) setClasa(p.clasa);
      } catch {}
    }
    const niv = q.get("nivel");
    if (niv && NIVELURI_JOC.some((x) => x.id === niv)) setNivel(niv as NivelJoc);
    const s = q.get("subiecte")?.split(",").filter((id) => subiect(id));
    if (s?.length) setAlese(s);
    const nn = Number(q.get("n"));
    if ((LUNGIMI as readonly number[]).includes(nn)) setN(nn);
    sesiuneDeschisa().then(setDeschisa);
  }, []);

  const disponibile = useMemo(() => SUBIECTE.filter((s) => s.clase.includes(clasa)), [clasa]);
  const selectate = useMemo(() => alese.map(subiect).filter((s) => s && s.clase.includes(clasa)) as typeof SUBIECTE, [alese, clasa]);
  const maxPosibil = useMemo(() => (selectate.length ? capacitateSelectie(selectate, nivel, clasa) : 0), [selectate, nivel, clasa]);
  const nEfectiv = Math.min(n, maxPosibil);

  const comuta = (id: string) => setAlese((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const peDomenii = (Object.keys(DOMENII) as Domeniu[])
    .map((d) => ({ d, lista: disponibile.filter((s) => s.domeniu === d) }))
    .filter((x) => x.lista.length);

  const start = async () => {
    if (!selectate.length || porneste) return;
    setPorneste(true);
    const stare: StareSesiune = {
      config: { clasa, nivel, subiecte: selectate.map((s) => s.id), n: nEfectiv, seed: seedNou() },
      pozitie: 0, rezultate: [], stare: "in_curs", actualizat: Date.now(),
    };
    await salveaza(stare);
    router.push("/elev/antrenament/joc");
  };

  return (
    <main className="min-h-screen px-4 pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between py-4">
          <Link href="/elev" className="flex h-tinta items-center rounded-2xl bg-hartie px-5 text-lg font-bold text-mov shadow-sm">← Jocuri</Link>
          <h1 className="text-2xl font-bold text-mov sm:text-3xl">Antrenament</h1>
          <span className="w-24" />
        </div>

        {deschisa && deschisa.stare !== "terminata" && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-hartie p-5 shadow-md ring-2 ring-galben">
            <div>
              <div className="text-lg font-bold text-mov">Ai o sesiune începută</div>
              <div className="text-gray-600">
                {deschisa.config.subiecte.map((id) => subiect(id)?.titlu).filter(Boolean).join(", ")} · {deschisa.pozitie} din {deschisa.config.n} exerciții
              </div>
            </div>
            <button onClick={() => router.push("/elev/antrenament/joc")} className="h-tinta rounded-2xl bg-mov px-6 text-lg font-bold text-white">▶ Continuă de unde ai rămas</button>
          </div>
        )}

        <Pas nr={1} titlu="Clasa">
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as Clasa[]).map((c) => (
              <button key={c} onClick={() => setClasa(c)} aria-pressed={clasa === c}
                className={`h-tinta rounded-2xl px-5 text-lg font-bold shadow ${clasa === c ? "bg-mov text-white" : "bg-hartie text-mov"}`}>Clasa {NUME_CLASA[c]}</button>
            ))}
          </div>
        </Pas>

        <Pas nr={2} titlu="Ce vrei să exersezi? Poți alege mai multe.">
          <div className="space-y-5">
            {peDomenii.map(({ d, lista }) => {
              const toate = lista.every((s) => alese.includes(s.id));
              return (
                <div key={d}>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-bold text-mov">{DOMENII[d].icon} {DOMENII[d].nume}</h3>
                    <button onClick={() => setAlese((a) => (toate ? a.filter((x) => !lista.some((s) => s.id === x)) : [...new Set([...a, ...lista.map((s) => s.id)])]))}
                      className="h-tinta rounded-xl px-4 text-base font-semibold text-mov underline">{toate ? "Debifează tot" : "Alege tot"}</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lista.map((s) => {
                      const ales = alese.includes(s.id);
                      return (
                        <button key={s.id} onClick={() => comuta(s.id)} aria-pressed={ales}
                          className={`flex min-h-20 items-center gap-3 rounded-2xl p-3 text-left shadow transition ${ales ? "bg-mov text-white ring-4 ring-galben" : "bg-hartie hover:ring-2 hover:ring-mov/30"}`}>
                          <span className="text-3xl" aria-hidden>{ales ? "✅" : s.icon}</span>
                          <span>
                            <span className="block font-bold">{s.titlu}</span>
                            <span className={`block text-sm ${ales ? "text-white/90" : "text-gray-600"}`}>{s.descriere}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Pas>

        <Pas nr={3} titlu="Nivelul">
          <div className="grid gap-3 sm:grid-cols-3">
            {NIVELURI_JOC.map((x) => (
              <button key={x.id} onClick={() => setNivel(x.id)} aria-pressed={nivel === x.id}
                className="min-h-16 rounded-2xl border-4 p-3 text-left"
                style={{ borderColor: x.culoare, background: nivel === x.id ? x.culoare : "#fff", color: nivel === x.id ? "#fff" : x.culoare }}>
                <div className="text-lg font-bold">{x.nume}</div>
                <div className={`text-sm ${nivel === x.id ? "text-white/90" : "text-gray-600"}`}>{x.descriere}</div>
              </button>
            ))}
          </div>
        </Pas>

        <Pas nr={4} titlu="Câte exerciții?">
          <div className="flex flex-wrap gap-3">
            {LUNGIMI.map((l) => {
              const prea = selectate.length > 0 && l > maxPosibil;
              return (
                <button key={l} onClick={() => setN(l)} disabled={prea} aria-pressed={n === l}
                  title={prea ? `Selecția are doar ${maxPosibil} exerciții diferite la acest nivel` : undefined}
                  className={`h-tinta w-24 rounded-2xl text-2xl font-bold shadow ${n === l && !prea ? "bg-mov text-white" : "bg-hartie text-mov"} disabled:opacity-35`}>{l}</button>
              );
            })}
          </div>
          {selectate.length > 0 && maxPosibil < 100 && (
            <p className="mt-3 rounded-xl bg-hartie/80 p-3 text-sm text-gray-700">
              ℹ️ Subiectele alese au împreună <b>{maxPosibil}</b> exerciții diferite la nivelul {NIVELURI_JOC.find((x) => x.id === nivel)?.nume}
              {selectate.length > 1 && <> ({selectate.map((s) => `${s.titlu}: ${capacitate(s, nivel, clasa)}`).join(", ")})</>}.
              Nu repetăm exerciții: pentru o sesiune mai lungă, adaugă un subiect sau alege alt nivel.
            </p>
          )}
        </Pas>

        <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-hartie p-4 shadow-lg">
          <div className="text-gray-700">
            {selectate.length === 0 ? "Alege cel puțin un subiect." : (
              <>
                <b>{nEfectiv}</b> exerciții · {selectate.length === 1 ? selectate[0].titlu : `${selectate.length} subiecte amestecate`} · {NIVELURI_JOC.find((x) => x.id === nivel)?.nume}
              </>
            )}
          </div>
          <button onClick={start} disabled={!selectate.length || porneste} className="h-16 rounded-2xl bg-galben px-8 text-xl font-bold text-mov-inchis shadow disabled:opacity-40">
            {porneste ? "Pregătim…" : "Începe ▶"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Pas({ nr, titlu, children }: { nr: number; titlu: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-3xl bg-hartie/60 p-4 sm:p-5">
      <h2 className="mb-3 text-lg font-bold text-gray-700"><span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-mov text-white">{nr}</span>{titlu}</h2>
      {children}
    </section>
  );
}
