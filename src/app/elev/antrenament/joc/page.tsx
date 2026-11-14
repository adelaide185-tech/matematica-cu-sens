"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SUBIECTE, subiect } from "@/antrenament/registru";
import { construiesteSesiune, stele, verdicte, VERDICTE, capacitateSelectie, type RezultatExercitiu } from "@/antrenament/sesiune";
import { raspunsText, verificaRaspuns, type Exercitiu } from "@/antrenament/tipuri";
import { salveaza, sesiuneDeschisa, seteazaSunet, sunetActiv, sunetBland, type StareSesiune } from "@/antrenament/stare-client";
import { VizualExercitiu, areIntrareProprie } from "@/antrenament/mecanici/Mecanici";
import { seedNou } from "@/motor/rng";
import { Tastatura } from "@/jocuri/componente";

const LAUDE = ["Bravo!", "Foarte bine!", "Super!", "Ai reușit!", "Excelent!", "Așa da!"];
const INCURAJARI = ["Hai să ne uităm împreună.", "Aproape! Uite un ajutor:", "Nicio problemă, încercăm pas cu pas."];

export default function JocAntrenament() {
  const router = useRouter();
  const [stare, setStare] = useState<StareSesiune | null>(null);
  const [incarcat, setIncarcat] = useState(false);

  useEffect(() => {
    sesiuneDeschisa().then((s) => {
      if (!s || s.stare === "terminata") router.replace("/elev/antrenament");
      else setStare(s);
      setIncarcat(true);
    });
  }, [router]);

  const exercitii = useMemo(() => (stare ? construiesteSesiune(SUBIECTE, stare.config) : []), [stare?.config]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!incarcat || !stare) return <main className="flex min-h-screen items-center justify-center text-xl text-mov">Pregătim exercițiile…</main>;
  if (!exercitii.length) return <main className="p-8 text-center">Nu am putut genera exerciții. <Link href="/elev/antrenament" className="text-mov underline">Înapoi</Link></main>;
  return <Sesiune stareInitiala={stare} exercitii={exercitii} />;
}

function Sesiune({ stareInitiala, exercitii }: { stareInitiala: StareSesiune; exercitii: Exercitiu[] }) {
  const router = useRouter();
  const redus = useReducedMotion();
  const total = exercitii.length;
  const [stare, setStare] = useState<StareSesiune>(stareInitiala);
  const poz = Math.min(stare.pozitie, total);
  const ex = exercitii[poz];

  const [incercari, setIncercari] = useState(0);
  const [indiciu, setIndiciu] = useState(0);
  const [mesaj, setMesaj] = useState<{ tip: "bravo" | "ajutor"; text: string } | null>(null);
  const [valoare, setValoare] = useState<unknown>(null);
  const [text, setText] = useState("");
  const [campuri, setCampuri] = useState<string[]>([]);
  const [campActiv, setCampActiv] = useState(0);
  const [blocat, setBlocat] = useState(false);
  const [sunet, setSunet] = useState(false);
  const inceput = useRef(Date.now());

  useEffect(() => setSunet(sunetActiv()), []);
  // exercițiu nou → resetăm tot
  useEffect(() => {
    setIncercari(0);
    setIndiciu(0);
    setMesaj(null);
    setValoare(null);
    setText("");
    setCampuri(ex?.raspuns.tip === "campuri" ? ex.raspuns.valori.map(() => "") : []);
    setCampActiv(0);
    setBlocat(false);
    inceput.current = Date.now();
  }, [poz, ex]);

  const persista = useCallback(async (s: StareSesiune) => {
    const salvat = await salveaza(s);
    setStare((x) => ({ ...x, id: salvat.id ?? x.id }));
  }, []);

  const trimite = useCallback((dat: unknown) => {
    if (!ex || blocat) return;
    const ok = verificaRaspuns(ex.raspuns, dat);
    const nIncercari = incercari + 1;
    if (ok) {
      sunetBland();
      setBlocat(true);
      setMesaj({ tip: "bravo", text: indiciu >= 3 ? "Bravo, acum ai înțeles!" : LAUDE[(poz + nIncercari) % LAUDE.length] });
      const rez: RezultatExercitiu = { subiectId: ex.subiectId, incercari: nIncercari, cuAjutor: indiciu >= 3, timpMs: Date.now() - inceput.current };
      const urm: StareSesiune = { ...stare, pozitie: poz + 1, rezultate: [...stare.rezultate, rez], stare: poz + 1 >= total ? "terminata" : "in_curs" };
      setTimeout(() => {
        setStare(urm);
        if (urm.stare === "terminata" || urm.pozitie % 5 === 0) persista(urm);
      }, redus ? 400 : 1000);
      return;
    }
    // greșit: ajutor treptat, fără penalizare
    setIncercari(nIncercari);
    const k = Math.min(3, nIncercari);
    setIndiciu(k);
    setMesaj({ tip: "ajutor", text: k >= 3 ? `${ex.indicii[2]} (Răspunsul: ${raspunsText(ex.raspuns)}.) Acum scrie tu răspunsul, ca să mergem mai departe.` : `${INCURAJARI[(nIncercari - 1) % INCURAJARI.length]} ${ex.indicii[k - 1]}` });
    setText("");
    if (ex.raspuns.tip === "campuri") {
      // păstrăm câmpurile corecte, golim doar ce e greșit
      const r = ex.raspuns;
      setCampuri((c) => c.map((v, i) => (Number(v) === r.valori[i] ? v : "")));
    }
  }, [ex, blocat, incercari, indiciu, poz, stare, total, persista, redus]);

  const verificaCurent = () => {
    if (!ex) return;
    const r = ex.raspuns;
    if (r.tip === "numar") trimite(text === "" ? null : Number(text));
    else if (r.tip === "campuri") trimite(campuri.map((x) => (x === "" ? NaN : Number(x))));
    else trimite(valoare);
  };

  // tastatura fizică
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!ex || blocat) return;
      if (ex.raspuns.tip !== "numar" && ex.raspuns.tip !== "campuri") return;
      if (/^\d$/.test(e.key)) scrie((v) => (v + e.key).slice(0, 8));
      else if (e.key === "Backspace") scrie((v) => v.slice(0, -1));
      else if (e.key === "Enter") verificaCurent();
      else if (e.key === "Tab" && ex.raspuns.tip === "campuri") { e.preventDefault(); setCampActiv((i) => (i + 1) % campuri.length); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const scrie = (f: (v: string) => string) => {
    if (ex?.raspuns.tip === "campuri") setCampuri((c) => c.map((v, i) => (i === campActiv ? f(v) : v)));
    else setText(f);
  };

  const pauza = async () => {
    await salveaza({ ...stare, pozitie: poz, stare: "pauza" });
    router.push("/elev/antrenament");
  };

  const onValoare = useCallback((v: unknown) => setValoare(v), []);

  if (stare.stare === "terminata" || !ex) return <Final stare={stare} exercitii={exercitii} />;
  const s = subiect(ex.subiectId);
  const progres = (poz / total) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-b from-galben-deschis via-white to-mov-deschis pb-10">
      <header className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-4">
        <button onClick={pauza} className="h-12 rounded-xl bg-white px-4 font-bold text-mov shadow">⏸ Pauză</button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-sm font-semibold text-gray-600">
            <span>{s?.icon} {s?.titlu}</span>
            <span>{poz + 1} din {total}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white shadow-inner" role="progressbar" aria-valuenow={poz} aria-valuemin={0} aria-valuemax={total} aria-label="Progres">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-verde to-galben" initial={false} animate={{ width: `${progres}%` }} style={{ width: `${progres}%` }} />
          </div>
        </div>
        <button onClick={() => { seteazaSunet(!sunet); setSunet(!sunet); }} aria-label={sunet ? "Oprește sunetul" : "Pornește sunetul blând"} className="h-12 w-12 rounded-xl bg-white text-xl shadow">{sunet ? "🔔" : "🔕"}</button>
      </header>

      <AnimatePresence mode="wait">
        <motion.section key={poz} initial={redus ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={redus ? undefined : { opacity: 0, y: -12 }}
          className="mx-auto mt-5 max-w-4xl px-4">
          <div className="rounded-3xl bg-white p-5 shadow-lg sm:p-7">
            <h1 className="mb-4 text-center text-2xl font-bold leading-snug text-mov-inchis sm:text-3xl">{ex.enunt}</h1>
            {!(ex.mecanica.tip === "expresie" && ex.enunt.replace(/\s/g, "").includes(ex.mecanica.text.replace(/\s/g, ""))) && (
              <VizualExercitiu m={ex.mecanica} indiciu={indiciu} onValoare={onValoare} rezolvat={blocat} />
            )}
          </div>

          <div aria-live="polite" className="min-h-[3.5rem]">
            {mesaj && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`mx-auto mt-4 max-w-2xl rounded-2xl p-4 text-lg ${mesaj.tip === "bravo" ? "bg-verde text-center text-2xl font-bold text-white" : "bg-galben-deschis text-gray-800 ring-2 ring-galben"}`}>
                {mesaj.tip === "ajutor" && <span className="mr-2" aria-hidden>💡</span>}{mesaj.text}
              </motion.div>
            )}
          </div>

          <div className="mt-4">
            <Intrare ex={ex} text={text} campuri={campuri} campActiv={campActiv} setCampActiv={setCampActiv} indiciu={indiciu}
              scrie={scrie} trimite={trimite} verifica={verificaCurent} blocat={blocat} valoare={valoare} />
          </div>
        </motion.section>
      </AnimatePresence>
    </main>
  );
}

function Intrare({ ex, text, campuri, campActiv, setCampActiv, indiciu, scrie, trimite, verifica, blocat, valoare }: {
  ex: Exercitiu; text: string; campuri: string[]; campActiv: number; setCampActiv: (i: number) => void; indiciu: number;
  scrie: (f: (v: string) => string) => void; trimite: (v: unknown) => void; verifica: () => void; blocat: boolean; valoare: unknown;
}) {
  const r = ex.raspuns;
  if (r.tip === "optiune") {
    return (
      <div className={`mx-auto grid max-w-2xl gap-3 ${r.optiuni.length <= 3 && r.optiuni.every((o) => o.length <= 6) ? "grid-cols-3" : "sm:grid-cols-2"}`}>
        {r.optiuni.map((o) => (
          <button key={o} disabled={blocat} onClick={() => trimite(o)}
            className={`min-h-16 rounded-2xl bg-white px-4 py-3 text-xl font-bold text-mov-inchis shadow ring-2 transition active:scale-95 ${indiciu >= 3 && o === r.valoare ? "ring-4 ring-verde" : "ring-mov/20"} ${o.length <= 3 ? "text-4xl" : ""}`}>
            {o}
          </button>
        ))}
      </div>
    );
  }
  if (r.tip === "construit" || r.tip === "ordine" || areIntrareProprie(ex.mecanica)) {
    return (
      <div className="text-center">
        <button onClick={verifica} disabled={blocat || valoare === null || (Array.isArray(valoare) && valoare.length === 0)}
          className="h-16 w-full max-w-xs rounded-2xl bg-mov text-2xl font-bold text-white shadow disabled:opacity-40">Verifică ✓</button>
      </div>
    );
  }
  return (
    <div className="mx-auto grid max-w-3xl items-start gap-4 md:grid-cols-[1fr_320px]">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {r.tip === "campuri" ? (
          r.etichete.map((e, i) => (
            <button key={i} onClick={() => setCampActiv(i)} aria-label={`${e}: ${campuri[i] || "gol"}`}
              className={`flex min-w-28 flex-col items-center rounded-2xl bg-white px-3 py-2 shadow ${campActiv === i ? "ring-4 ring-mov" : "ring-2 ring-mov/20"}`}>
              <span className="text-sm font-semibold text-gray-600">{e}</span>
              <span className="min-h-10 text-4xl font-bold text-mov-inchis">{campuri[i] || "?"}</span>
            </button>
          ))
        ) : (
          <div className="min-w-40 rounded-2xl border-4 border-dashed border-mov bg-white px-6 py-2 text-center text-5xl font-bold text-mov-inchis" aria-label="răspunsul tău">{text || "?"}</div>
        )}
      </div>
      <Tastatura valoare={r.tip === "campuri" ? campuri[campActiv] ?? "" : text} onChange={(v) => scrie(() => v)} onTrimite={verifica} />
    </div>
  );
}

function Final({ stare, exercitii }: { stare: StareSesiune; exercitii: Exercitiu[] }) {
  const router = useRouter();
  const v = verdicte(stare.rezultate);
  const st = stele(stare.rezultate);
  const deExersat = v.filter((x) => x.verdict !== "stapanit").map((x) => x.subiectId);
  const dinPrima = stare.rezultate.filter((r) => r.incercari === 1).length;

  const reia = async (subiecte: string[]) => {
    const sub = subiecte.map(subiect).filter(Boolean) as typeof SUBIECTE;
    const n = Math.min(Math.max(10, Math.min(stare.config.n, 20)), capacitateSelectie(sub, stare.config.nivel, stare.config.clasa));
    await salveaza({ config: { ...stare.config, subiecte, n, seed: seedNou() }, pozitie: 0, rezultate: [], stare: "in_curs", actualizat: Date.now() });
    router.refresh();
    location.reload();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-galben-deschis to-mov-deschis px-4 py-8">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow-lg sm:p-8">
        <div className="text-6xl">{[1, 2, 3].map((i) => <span key={i} className={i <= st ? "" : "opacity-20 grayscale"}>⭐</span>)}</div>
        <h1 className="mt-3 text-3xl font-bold text-mov">Ai terminat {exercitii.length} exerciții!</h1>
        <p className="mt-1 text-lg text-gray-600">{dinPrima} din prima încercare. Fiecare greșeală te-a ajutat să înveți ceva nou. 💜</p>

        <div className="mt-6 space-y-3 text-left">
          {v.map((x) => {
            const s = subiect(x.subiectId);
            const d = VERDICTE[x.verdict];
            return (
              <div key={x.subiectId} className="rounded-2xl border-2 p-4" style={{ borderColor: d.culoare }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-lg font-bold">{s?.icon} {s?.titlu}</span>
                  <span className="rounded-full px-3 py-1 font-bold text-white" style={{ background: d.culoare }}>{d.icon} {d.nume}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${x.procent}%`, background: d.culoare }} /></div>
                <div className="mt-1 text-sm text-gray-600">{x.dinPrima} din {x.total} din prima{x.cuAjutor ? ` · ${x.cuAjutor} cu ajutor` : ""}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {deExersat.length > 0 && (
            <button onClick={() => reia(deExersat)} className="h-14 rounded-2xl bg-galben px-6 text-lg font-bold text-mov-inchis shadow">🔁 Exersează ce a fost greu</button>
          )}
          <button onClick={() => reia(stare.config.subiecte)} className="h-14 rounded-2xl bg-mov px-6 text-lg font-bold text-white shadow">Încă o sesiune</button>
          <Link href="/elev/antrenament" className="flex h-14 items-center rounded-2xl bg-white px-6 text-lg font-bold text-mov shadow ring-2 ring-mov/20">Alte subiecte</Link>
        </div>
      </div>
    </main>
  );
}
