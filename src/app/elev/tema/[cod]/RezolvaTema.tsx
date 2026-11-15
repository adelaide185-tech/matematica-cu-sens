"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trimiteTema, type RaspunsDat, type RezultatTema } from "@/lib/actiuni-teme";
import { fmt } from "@/motor/calcul/generator";
import type { OpSimbol } from "@/motor/calcul/tipuri";

export interface ExercitiuElev {
  text: string;
  inainte?: string;
  coloana?: { numere: number[]; op: OpSimbol };
  rest: boolean;
}

const ceas = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function RezolvaTema({ cod, titlu, exercitii, limitaMinute, test, simbol, anterior }: {
  cod: string; titlu: string; exercitii: ExercitiuElev[]; limitaMinute: number | null; test: boolean; simbol: string;
  anterior: { corecte: number; total: number } | null;
}) {
  const cheie = `mcs-tema-${cod}`;
  const [raspunsuri, setRaspunsuri] = useState<RaspunsDat[]>(() => exercitii.map(() => ({})));
  const [start, setStart] = useState<number | null>(null);
  const [acum, setAcum] = useState(0);
  const [rezultat, setRezultat] = useState<RezultatTema | null>(null);
  const [trimite, setTrimite] = useState(false);
  const trimis = useRef(false);

  // ciornă: răspunsurile și ora de început rămân dacă elevul reîncarcă pagina
  useEffect(() => {
    let s = Date.now();
    try {
      const c = JSON.parse(localStorage.getItem(cheie) ?? "null");
      if (c && Array.isArray(c.r) && c.r.length === exercitii.length) {
        setRaspunsuri(c.r);
        s = Number(c.start) || s;
      }
    } catch {}
    setStart(s);
    setAcum(Date.now());
  }, [cheie, exercitii.length]);
  useEffect(() => {
    if (start === null || rezultat) return;
    try {
      localStorage.setItem(cheie, JSON.stringify({ r: raspunsuri, start }));
    } catch {}
  }, [raspunsuri, start, cheie, rezultat]);

  const trimiteAcum = useCallback(async () => {
    if (trimis.current || start === null) return;
    trimis.current = true;
    setTrimite(true);
    try {
      const r = await trimiteTema(cod, raspunsuri, Date.now() - start);
      setRezultat(r);
      if (!r.eroare) {
        try {
          localStorage.removeItem(cheie);
        } catch {}
      } else trimis.current = false;
    } catch {
      setRezultat({ eroare: "Nu am putut trimite tema. Verifică internetul și încearcă din nou." });
      trimis.current = false;
    } finally {
      setTrimite(false);
    }
  }, [cod, raspunsuri, start, cheie]);

  const scurs = start === null ? 0 : Math.max(0, Math.floor((acum - start) / 1000));
  const ramas = limitaMinute ? limitaMinute * 60 - scurs : null;

  useEffect(() => {
    if (rezultat && !rezultat.eroare) return;
    const t = setInterval(() => setAcum(Date.now()), 500);
    return () => clearInterval(t);
  }, [rezultat]);
  // timpul s-a terminat → trimitem ce a scris elevul
  useEffect(() => {
    if (ramas !== null && ramas <= 0 && start !== null && !rezultat) trimiteAcum();
  }, [ramas, start, rezultat, trimiteAcum]);

  const completate = raspunsuri.filter((r, i) => (exercitii[i].rest ? r.cat && r.rest : r.valoare)).length;
  const set = (i: number, p: RaspunsDat) => setRaspunsuri((x) => x.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const gata = rezultat && !rezultat.eroare;

  const confirmaSiTrimite = () => {
    const lipsa = exercitii.length - completate;
    if (lipsa && !confirm(`Mai ai ${lipsa} exerciții necompletate. Trimiți așa?`)) return;
    trimiteAcum();
  };

  return (
    <main className="min-h-screen px-3 pb-28 sm:px-6">
      <header className="sticky top-0 z-10 -mx-3 mb-4 flex flex-wrap items-center gap-3 bg-white/90 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link href="/elev/teme" className="font-semibold text-mov">← Temele mele</Link>
        <h1 className="flex-1 text-xl font-bold text-mov sm:text-2xl">{titlu}</h1>
        <span className={`rounded-2xl px-4 py-2 font-mono text-xl font-bold shadow ${ramas !== null && ramas <= 60 && !gata ? "bg-red-100 text-red-700" : "bg-hartie text-mov"}`} aria-live="polite">
          ⏱ {ramas !== null && !gata ? ceas(Math.max(0, ramas)) : ceas(scurs)}
        </span>
      </header>

      {anterior && !gata && <p className="mx-auto mb-3 max-w-4xl rounded-2xl bg-galben-deschis p-3 text-center">Data trecută ai avut {anterior.corecte} din {anterior.total}. Hai să încercăm din nou!</p>}
      {test && !gata && <p className="mx-auto mb-3 max-w-4xl rounded-2xl bg-mov-deschis p-3 text-center text-mov">Acesta e un test: îl poți trimite o singură dată.</p>}

      {gata && rezultat && (
        <section className="mx-auto mb-5 max-w-4xl rounded-3xl bg-hartie p-6 text-center shadow-lg">
          <div className="text-5xl">{"⭐".repeat(rezultat.stele ?? 0) || "💪"}</div>
          <p className="mt-2 text-2xl font-bold text-mov">{rezultat.corecte} din {rezultat.total} corecte</p>
          <p className="text-gray-600">Timp: {ceas(scurs)}. Mai jos vezi răspunsurile corecte la exercițiile greșite.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/elev/teme" className="rounded-2xl bg-mov px-5 py-3 font-bold text-white">Înapoi la teme</Link>
            {!test && <button type="button" onClick={() => location.reload()} className="rounded-2xl bg-galben px-5 py-3 font-bold text-mov-inchis">Încearcă din nou</button>}
          </div>
        </section>
      )}

      <ol className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
        {exercitii.map((e, i) => {
          const d = rezultat?.detalii?.[i];
          return (
            <li key={i} className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-2 ${d ? (d.corect ? "ring-green-400" : "ring-red-300") : "ring-transparent"}`}>
              <span className="w-8 text-right font-bold text-mov">{i + 1}.</span>
              <div className="flex flex-1 flex-wrap items-center gap-2 text-xl">
                {e.coloana ? <Coloana e={e} simbol={simbol} /> : <span className="font-semibold tabular-nums">{e.text}</span>}
                {e.inainte && <span className="font-semibold">{e.inainte}</span>}
                {e.rest ? (
                  <>
                    <Camp valoare={raspunsuri[i].cat ?? ""} onChange={(v) => set(i, { cat: v })} blocat={!!gata} eticheta={`Câtul la exercițiul ${i + 1}`} />
                    <span>rest</span>
                    <Camp valoare={raspunsuri[i].rest ?? ""} onChange={(v) => set(i, { rest: v })} blocat={!!gata} eticheta={`Restul la exercițiul ${i + 1}`} mic />
                  </>
                ) : (
                  <Camp valoare={raspunsuri[i].valoare ?? ""} onChange={(v) => set(i, { valoare: v })} blocat={!!gata} eticheta={`Răspunsul la exercițiul ${i + 1}`} />
                )}
              </div>
              {d && <span className="text-2xl" aria-label={d.corect ? "corect" : "greșit"}>{d.corect ? "✅" : "❌"}</span>}
              {d && !d.corect && <span className="w-full pl-11 text-sm text-green-800">Corect: <b>{d.raspuns}</b></span>}
            </li>
          );
        })}
      </ol>

      {!gata && (
        <div className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-center gap-4 bg-white/95 p-3 shadow-[0_-4px_16px_rgb(0_0_0/0.08)]">
          <span className="font-semibold text-gray-600">{completate}/{exercitii.length} completate</span>
          <button type="button" disabled={trimite || start === null} onClick={confirmaSiTrimite}
            className="rounded-2xl bg-mov px-6 py-3 text-lg font-bold text-white hover:bg-mov-inchis disabled:opacity-50">{trimite ? "Se verifică…" : "Trimite ✓"}</button>
          {rezultat?.eroare && <span className="text-red-700">{rezultat.eroare}</span>}
        </div>
      )}
    </main>
  );
}

function Camp({ valoare, onChange, blocat, eticheta, mic }: { valoare: string; onChange: (v: string) => void; blocat: boolean; eticheta: string; mic?: boolean }) {
  return (
    <input value={valoare} onChange={(e) => onChange(e.target.value.replace(/[^\d\s−-]/g, "").slice(0, 12))} disabled={blocat}
      inputMode="numeric" autoComplete="off" aria-label={eticheta}
      className={`${mic ? "w-16" : "w-28"} rounded-xl border-2 border-mov/30 bg-white p-2 text-center text-xl font-bold tabular-nums focus:border-mov focus:outline-none disabled:bg-gray-50`} />
  );
}

function Coloana({ e, simbol }: { e: ExercitiuElev; simbol: string }) {
  const { numere, op } = e.coloana!;
  return (
    <span className="inline-flex flex-col items-end font-mono text-xl leading-tight">
      {numere.map((n, i) => (
        <span key={i} className="flex w-full justify-between gap-3"><span className="font-bold">{i === numere.length - 1 ? (op === "-" ? "−" : op === "×" ? simbol : op) : ""}</span>{fmt(n)}</span>
      ))}
      <span className="mt-0.5 w-full border-t-2 border-gray-800" />
    </span>
  );
}
