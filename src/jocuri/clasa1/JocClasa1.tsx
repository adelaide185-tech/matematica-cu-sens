"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { VizualExercitiu, areIntrareProprie } from "@/antrenament/mecanici/Mecanici";
import { sunetActiv, sunetBland, seteazaSunet } from "@/antrenament/stare-client";
import { Tastatura } from "@/jocuri/componente";
import { tranzitie, useCelebrare } from "@/jocuri/miscare";
import { Rng } from "@/motor/rng";
import { JOCURI_C1 } from "@/motor/clasa1/capitole";
import { MEDALII, type ExercitiuElevC1, type Medalie, type RaspunsElevC1 } from "@/motor/clasa1/tipuri";
import { BalantaC1, BaraTimp, InsignaMedalie, PistaRacheta } from "./piese";
import { citeste, citireAutomata, opresteCitirea, seteazaCitireAutomata, usePoateCiti } from "./audio";

export interface RaspunsPas {
  ok: boolean;
  /** după 3 încercări (sau la timp expirat): rezolvarea, ca să mergem mai departe */
  rezolvare?: string;
  /** răspunsul corect, ca text (la perechi: cartonașul din dreapta) */
  corect?: string;
}
export interface RezultatFinalC1 {
  corecte: number;
  total: number;
  procent: number;
  medalie: Medalie | null;
  stele: number;
  eroare?: string;
}

export interface PropsJoc {
  titlu: string;
  exercitii: ExercitiuElevC1[];
  /** variantele din dreapta ale fiecărei table de perechi */
  dreapta: Record<number, string[]>;
  cronometru: boolean;
  secunde: number;
  verifica: (index: number, dat: unknown, incercare: number) => Promise<RaspunsPas>;
  termina: (raspunsuri: RaspunsElevC1[], timpMs: number) => Promise<RezultatFinalC1>;
  inapoi: { href: string; text: string };
  /** cheie localStorage pentru reluarea după reîncărcare (teme) */
  ciorna?: string;
  onReia?: () => void;
}

const LAUDE = ["Bravo!", "Foarte bine!", "Super!", "Ai reușit!", "Excelent!", "Așa da!"];
const INCURAJARI = ["Hai să mai încercăm o dată.", "Aproape! Uite un ajutor:", "Nicio grijă, mergem pas cu pas."];

/** Unitățile de joc: un exercițiu sau o tablă întreagă de perechi. */
function unitati(ex: ExercitiuElevC1[]): ExercitiuElevC1[][] {
  const u: ExercitiuElevC1[][] = [];
  for (const e of ex) {
    const ult = u[u.length - 1];
    if (e.tabla && ult?.[0].tabla === e.tabla) ult.push(e);
    else u.push([e]);
  }
  return u;
}

export function JocClasa1(p: PropsJoc) {
  const grupe = useMemo(() => unitati(p.exercitii), [p.exercitii]);
  const [poz, setPoz] = useState(0);
  const [rez, setRez] = useState<(RaspunsElevC1 | null)[]>(() => p.exercitii.map(() => null));
  const [final, setFinal] = useState<RezultatFinalC1 | null>(null);
  const [trimite, setTrimite] = useState(false);
  const [sunet, setSunet] = useState(false);
  const [auto, setAuto] = useState(false);
  const citire = usePoateCiti();
  const start = useRef(Date.now());
  const trimis = useRef(false);

  useEffect(() => {
    setSunet(sunetActiv());
    setAuto(citireAutomata());
    if (!p.ciorna) return;
    try {
      const c = JSON.parse(localStorage.getItem(p.ciorna) ?? "null");
      if (c && Array.isArray(c.rez) && c.rez.length === p.exercitii.length) {
        setRez(c.rez);
        setPoz(Math.min(Number(c.poz) || 0, grupe.length));
        start.current = Number(c.start) || start.current;
      }
    } catch {}
    return () => opresteCitirea();
  }, [p.ciorna, p.exercitii.length, grupe.length]);

  useEffect(() => {
    if (!p.ciorna || final) return;
    try {
      localStorage.setItem(p.ciorna, JSON.stringify({ rez, poz, start: start.current }));
    } catch {}
  }, [rez, poz, p.ciorna, final]);

  const facute = rez.filter(Boolean).length;
  const termina = useCallback(async (toate: (RaspunsElevC1 | null)[]) => {
    if (trimis.current) return;
    trimis.current = true;
    setTrimite(true);
    try {
      const r = await p.termina(toate.map((x) => x ?? { primul: null, incercari: 0, ajutor: true, timpMs: 0 }), Date.now() - start.current);
      setFinal(r);
      if (r.eroare) trimis.current = false;
      else if (p.ciorna) try { localStorage.removeItem(p.ciorna); } catch {}
    } catch {
      setFinal({ corecte: 0, total: 0, procent: 0, medalie: null, stele: 0, eroare: "Nu am putut trimite rezultatul. Verifică internetul și încearcă din nou." });
      trimis.current = false;
    } finally {
      setTrimite(false);
    }
  }, [p]);

  const rezRef = useRef(rez);
  rezRef.current = rez;
  const gataUnitate = useCallback((r: Record<number, RaspunsElevC1>) => {
    const nou = rezRef.current.map((v, i) => r[i] ?? v);
    rezRef.current = nou;
    setRez(nou);
    const urm = poz + 1;
    setPoz(urm);
    if (urm >= grupe.length) termina(nou);
  }, [poz, grupe.length, termina]);

  if (final && !final.eroare) return <FinalC1 r={final} inapoi={p.inapoi} onReia={p.onReia} />;
  const unit = grupe[poz];

  return (
    <main className="min-h-screen bg-crem pb-10">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 pt-4">
        <Link href={p.inapoi.href} className="flex h-tinta items-center rounded-2xl bg-hartie px-5 text-lg font-bold text-mov shadow-sm">← {p.inapoi.text}</Link>
        <h1 className="flex-1 text-center text-xl font-extrabold text-mov-inchis sm:text-2xl">{p.titlu}</h1>
        {citire && (
          <button type="button" onClick={() => { const v = !auto; setAuto(v); seteazaCitireAutomata(v); }} aria-pressed={auto}
            className={`h-tinta rounded-2xl px-4 text-lg font-bold shadow-sm ${auto ? "bg-galben text-mov-inchis" : "bg-hartie text-mov"}`} title="Citește singur fiecare cerință">
            🗣️ {auto ? "Citesc eu" : "Citire"}
          </button>
        )}
        <button type="button" onClick={() => { const v = !sunet; setSunet(v); seteazaSunet(v); }} aria-pressed={sunet} aria-label={sunet ? "Oprește sunetul" : "Pornește sunetul"}
          className="h-tinta w-tinta rounded-2xl bg-hartie text-2xl shadow-sm">{sunet ? "🔔" : "🔕"}</button>
      </header>
      <div className="mx-auto mt-2 max-w-5xl px-4">
        <PistaRacheta facute={facute} total={p.exercitii.length} />
        <p className="text-center text-sm font-semibold text-mov/80">{facute} din {p.exercitii.length}</p>
      </div>

      {final?.eroare && (
        <div className="mx-auto mt-4 max-w-xl rounded-2xl bg-galben-deschis p-4 text-center">
          <p className="font-bold">{final.eroare}</p>
          <button type="button" onClick={() => termina(rez)} disabled={trimite} className="mt-3 h-tinta rounded-2xl bg-mov px-6 text-lg font-bold text-white">Încearcă din nou</button>
        </div>
      )}
      {!unit && !final && <p className="mt-10 text-center text-2xl font-bold text-mov">{trimite ? "Trimit rezultatul…" : "Gata!"}</p>}
      {unit && (unit[0].tabla ? (
        <TablaPerechi key={`t${poz}`} ex={unit} dreapta={p.dreapta[unit[0].tabla] ?? []} memorie={unit[0].tabla % 3 === 0}
          verifica={p.verifica} auto={auto} onGata={gataUnitate} />
      ) : (
        <EcranExercitiu key={`e${poz}`} ex={unit[0]} cronometru={p.cronometru} secunde={p.secunde} verifica={p.verifica} auto={auto}
          onGata={(r) => gataUnitate({ [unit[0].index]: r })} />
      ))}
    </main>
  );
}

// ═════════════ un exercițiu ═════════════

function EcranExercitiu({ ex, cronometru, secunde, verifica, auto, onGata }: {
  ex: ExercitiuElevC1; cronometru: boolean; secunde: number; auto: boolean;
  verifica: PropsJoc["verifica"]; onGata: (r: RaspunsElevC1) => void;
}) {
  const redus = useReducedMotion();
  const [incercari, setIncercari] = useState(0);
  const [primul, setPrimul] = useState<{ v: unknown } | null>(null);
  const [mesaj, setMesaj] = useState<{ tip: "bravo" | "ajutor"; text: string } | null>(null);
  const [rezolvare, setRezolvare] = useState<string | null>(null);
  const [ocupat, setOcupat] = useState(false);
  const [gata, setGata] = useState(false);
  const [inclinare, setInclinare] = useState<-1 | 0 | 1 | null>(null);
  const [valoare, setValoare] = useState<unknown>(null);
  const [text, setText] = useState("");
  const [campuri, setCampuri] = useState<string[]>(() => (ex.etichete ?? []).map(() => ""));
  const [campActiv, setCampActiv] = useState(0);
  const inceput = useRef(Date.now());
  const cuTimp = cronometru && ex.ecran === "cursa";
  const [ramas, setRamas] = useState(secunde);

  useEffect(() => { if (auto) citeste(ex.enunt); }, [auto, ex.enunt]);

  const termina = useCallback((r: Omit<RaspunsElevC1, "timpMs">) => onGata({ ...r, timpMs: Date.now() - inceput.current }), [onGata]);

  const trimite = useCallback(async (dat: unknown) => {
    if (ocupat || gata || rezolvare !== null) return;
    if (dat === null || dat === "" || (Array.isArray(dat) && !dat.length)) return;
    const prim = primul ?? { v: dat };
    if (!primul) setPrimul(prim);
    const inc = incercari + 1;
    setOcupat(true);
    try {
      const r = await verifica(ex.index, dat, inc);
      if (r.ok) {
        sunetBland();
        setGata(true);
        if (ex.mecanica.tip === "balanta") setInclinare(dat === "<" ? 1 : dat === ">" ? -1 : 0);
        setMesaj({ tip: "bravo", text: LAUDE[(ex.index + inc) % LAUDE.length] });
        setTimeout(() => termina({ primul: prim.v, incercari: inc, ajutor: false }), redus ? 500 : 1100);
        return;
      }
      setIncercari(inc);
      if (r.rezolvare) {
        setRezolvare(r.rezolvare);
        setMesaj(null);
      } else {
        setMesaj({ tip: "ajutor", text: `${INCURAJARI[(inc - 1) % INCURAJARI.length]} ${ex.indicii[Math.min(inc, ex.indicii.length) - 1] ?? ""}` });
      }
      setText("");
      setCampuri((c) => c.map(() => ""));
      setCampActiv(0);
    } finally {
      setOcupat(false);
    }
  }, [ocupat, gata, rezolvare, primul, incercari, verifica, ex, termina, redus]);

  // cronometrul (doar în cursă, doar dacă profesorul l-a pornit)
  useEffect(() => {
    if (!cuTimp || gata || rezolvare !== null) return;
    const t = setInterval(() => setRamas((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(t);
  }, [cuTimp, gata, rezolvare]);
  useEffect(() => {
    if (!cuTimp || ramas > 0 || gata || rezolvare !== null) return;
    verifica(ex.index, null, 99).then((r) => {
      setRezolvare(r.rezolvare ?? `Răspunsul corect: ${r.corect ?? "?"}.`);
      setMesaj(null);
      if (!primul) setPrimul({ v: null });
    });
  }, [cuTimp, ramas, gata, rezolvare, verifica, ex.index, primul]);

  // tastatura fizică pentru numere
  useEffect(() => {
    const numeric = ex.tip === "numar" || ex.tip === "campuri";
    const h = (e: KeyboardEvent) => {
      if (!numeric || gata || rezolvare !== null) return;
      if (/^\d$/.test(e.key)) scrie((v) => (v + e.key).slice(0, 3));
      else if (e.key === "Backspace") scrie((v) => v.slice(0, -1));
      else if (e.key === "Enter") verificaCurent();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  const scrie = (f: (v: string) => string) => {
    if (ex.tip === "campuri") setCampuri((c) => c.map((v, i) => (i === campActiv ? f(v) : v)));
    else setText(f);
  };
  const verificaCurent = () => {
    if (ex.tip === "numar") trimite(text === "" ? null : Number(text));
    else if (ex.tip === "campuri") { if (campuri.every((x) => x !== "")) trimite(campuri.map(Number)); }
    else trimite(valoare);
  };
  const onValoare = useCallback((v: unknown) => setValoare(v), []);

  const m = ex.mecanica;
  const indiciu = rezolvare ? 3 : Math.min(2, incercari);
  const joc = ex.ecran === "intrebare" ? null : JOCURI_C1[ex.ecran];
  // calculele se arată cu „căsuța magică” în locul semnului întrebării
  const dinMecanica = m.tip === "expresie" && /□|= \?$/.test(m.text);
  const expr = dinMecanica ? (m as { text: string }).text.replace("= ?", "= □") : ex.tip === "numar" && /= \?$/.test(ex.enunt) ? ex.enunt.replace("= ?", "= □") : null;
  const faraDesen = dinMecanica || (expr !== null && m.tip === "expresie");
  const afisajNumar = gata && ex.tip === "numar" ? text || "✓" : text;

  return (
    <section className="mx-auto mt-4 max-w-4xl px-4">
      <div className="rounded-3xl bg-hartie p-5 shadow-md sm:p-8">
        {joc && <p className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-mov/70"><span aria-hidden>{joc.icon}</span> {joc.nume}</p>}
        <div className="flex items-start justify-center gap-3">
          <h2 className="text-center text-2xl font-bold leading-snug text-cerneala sm:text-3xl">{expr && /= \?$/.test(ex.enunt) ? "Calculează!" : ex.enunt}</h2>
          <BtnAscult text={ex.enunt} />
        </div>
        {cuTimp && !gata && rezolvare === null && <BaraTimp ramas={ramas} total={secunde} />}

        <div className="mt-5 flex min-h-[8rem] items-center justify-center">
          {m.tip === "balanta" ? (
            <BalantaC1 stanga={m.stanga} dreapta={m.dreapta} inclinare={gata ? (m.necunoscut ? 0 : inclinare) : null} />
          ) : (
            <div className="w-full">
              {!faraDesen && <VizualExercitiu m={m} indiciu={indiciu} onValoare={onValoare} rezolvat={gata} />}
              {expr && <div className={faraDesen ? "" : "mt-4"}><ExpresieCasuta text={expr} valoare={afisajNumar} gata={gata} /></div>}
            </div>
          )}
        </div>

        <Mesaj mesaj={mesaj} />
        {rezolvare !== null ? (
          <div className="mx-auto mt-4 max-w-xl rounded-2xl bg-galben-deschis p-5 text-center ring-2 ring-galben">
            <p className="text-xl font-bold text-cerneala">Uite cum se face:</p>
            <p className="mt-1 text-2xl">{rezolvare}</p>
            <button type="button" onClick={() => termina({ primul: primul?.v ?? null, incercari, ajutor: true })}
              className="mt-4 h-tinta rounded-2xl bg-mov px-8 text-xl font-bold text-white shadow">Am înțeles, mai departe ▶</button>
          </div>
        ) : (
          <div className={`mt-5 ${gata || ocupat ? "pointer-events-none opacity-70" : ""}`}>
            {ex.tip === "optiune" && m.tip === "balanta" ? (
              <div className="mx-auto grid max-w-lg grid-cols-3 gap-4">
                {(["<", "=", ">"] as const).map((s) => (
                  <motion.button key={s} type="button" whileTap={{ scale: 0.92 }} onClick={() => trimite(s)}
                    className="flex min-h-[6rem] flex-col items-center justify-center rounded-3xl bg-mov text-white shadow-md">
                    <span className="text-6xl font-extrabold leading-none">{s}</span>
                    <span className="text-sm font-semibold">{s === "<" ? "mai mic" : s === ">" ? "mai mare" : "egal"}</span>
                  </motion.button>
                ))}
              </div>
            ) : ex.tip === "optiune" ? (
              <div className={`mx-auto grid max-w-2xl gap-4 ${ex.optiuni!.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                {ex.optiuni!.map((o) => (
                  <motion.button key={o} type="button" whileTap={{ scale: 0.94 }} onClick={() => trimite(o)}
                    className={`min-h-[5.5rem] rounded-3xl bg-white px-3 font-extrabold text-mov-inchis shadow-md ring-4 ring-mov/15 hover:ring-mov/40 ${ex.optiuni!.some((x) => x.length > 8) ? "text-2xl" : "text-3xl"}`}>
                    {o}
                  </motion.button>
                ))}
              </div>
            ) : ex.tip === "numar" ? (
              <>
                {!expr && (
                  <div className="mx-auto mb-4 flex h-20 w-44 items-center justify-center rounded-3xl border-4 border-dashed border-galben bg-white text-5xl font-extrabold text-mov-inchis" aria-live="polite">{text || "?"}</div>
                )}
                <Tastatura valoare={text} onChange={(v) => setText(v.slice(0, 3))} onTrimite={verificaCurent} />
              </>
            ) : ex.tip === "campuri" ? (
              <>
                <div className="mx-auto mb-4 flex flex-wrap justify-center gap-4">
                  {ex.etichete!.map((et, i) => (
                    <button key={et} type="button" onClick={() => setCampActiv(i)}
                      className={`flex flex-col items-center rounded-3xl p-3 ${campActiv === i ? "bg-galben-deschis ring-4 ring-galben" : "bg-white ring-2 ring-mov/20"}`}>
                      <span className="flex h-20 w-28 items-center justify-center text-5xl font-extrabold text-mov-inchis">{campuri[i] || "?"}</span>
                      <span className="text-lg font-bold text-mov">{et}</span>
                    </button>
                  ))}
                </div>
                <Tastatura valoare={campuri[campActiv] ?? ""} onChange={(v) => { setCampuri((c) => c.map((x, i) => (i === campActiv ? v.slice(0, 3) : x))); if (v.length >= 1 && campActiv < campuri.length - 1 && v.length > (campuri[campActiv] ?? "").length && (ex.etichete![campActiv] === "zeci")) setCampActiv(campActiv + 1); }} onTrimite={verificaCurent} />
              </>
            ) : (
              areIntrareProprie(m) || ex.tip === "ordine" ? (
                <div className="text-center">
                  <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={verificaCurent}
                    className="h-tinta rounded-2xl bg-mov px-10 text-2xl font-extrabold text-white shadow">Verifică ✓</motion.button>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ExpresieCasuta({ text, valoare, gata }: { text: string; valoare: string; gata: boolean }) {
  const [a, b] = text.split("□");
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-5xl font-extrabold text-mov-inchis sm:text-6xl" aria-live="polite">
      <span>{a}</span>
      <motion.span animate={gata ? { scale: [1, 1.15, 1] } : {}} transition={tranzitie("mediu")}
        className={`inline-flex h-24 min-w-28 items-center justify-center rounded-3xl border-4 px-3 ${gata ? "border-verde bg-green-50 text-verde" : "border-dashed border-galben bg-white"}`}>
        {valoare || <span className="text-galben">✦</span>}
      </motion.span>
      {b !== undefined && <span>{b}</span>}
    </div>
  );
}

function Mesaj({ mesaj }: { mesaj: { tip: "bravo" | "ajutor"; text: string } | null }) {
  return (
    <div aria-live="polite" className="min-h-[3.5rem]">
      <AnimatePresence mode="wait">
        {mesaj && (
          <motion.p key={mesaj.text} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={tranzitie("scurt")}
            className={`mx-auto mt-3 w-fit max-w-xl rounded-2xl px-6 py-3 text-center text-2xl font-bold ${mesaj.tip === "bravo" ? "bg-verde text-white" : "bg-galben-deschis text-cerneala ring-2 ring-galben"}`}>
            {mesaj.tip === "bravo" ? `${mesaj.text} ✨` : mesaj.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function BtnAscult({ text }: { text: string }) {
  const citire = usePoateCiti();
  if (!citire) return null;
  return (
    <button type="button" onClick={() => citeste(text)} aria-label="Ascultă cerința"
      className="h-tinta w-tinta shrink-0 rounded-2xl bg-galben text-3xl shadow-sm active:scale-95">🔊</button>
  );
}

// ═════════════ tabla de perechi (și varianta „memory”) ═════════════

type Carte = { id: string; fel: "s" | "d"; index?: number; eticheta: string; ex?: ExercitiuElevC1 };

function TablaPerechi({ ex, dreapta, memorie, verifica, auto, onGata }: {
  ex: ExercitiuElevC1[]; dreapta: string[]; memorie: boolean; auto: boolean;
  verifica: PropsJoc["verifica"]; onGata: (r: Record<number, RaspunsElevC1>) => void;
}) {
  const redus = useReducedMotion();
  const stanga: Carte[] = ex.map((e) => ({ id: `s${e.index}`, fel: "s", index: e.index, eticheta: e.pereche?.stanga ?? e.enunt, ex: e }));
  const drepte: Carte[] = dreapta.map((d, i) => ({ id: `d${i}`, fel: "d", eticheta: d }));
  // la „memory”, cărțile stau amestecate, cu fața în jos
  const [ordineMemorie] = useState(() => new Rng(ex[0].index * 7919 + 17).shuffle([...stanga, ...drepte]));
  const [selectat, setSelectat] = useState<Carte | null>(null);
  const [intoarse, setIntoarse] = useState<Carte[]>([]);
  const [potrivite, setPotrivite] = useState<Record<string, string>>({}); // id stânga → id dreapta
  const [gresit, setGresit] = useState<string[]>([]);
  const [ocupat, setOcupat] = useState(false);
  const [mesaj, setMesaj] = useState<{ tip: "bravo" | "ajutor"; text: string } | null>(null);
  const rez = useRef<Record<number, RaspunsElevC1>>({});
  const inc = useRef<Record<number, number>>({});
  const inceput = useRef(Date.now());
  const enunt = memorie ? "Întoarce câte două cărți și găsește perechile!" : "Atinge un cartonaș din stânga, apoi perechea lui din dreapta.";

  useEffect(() => { if (auto) citeste(enunt); }, [auto, enunt]);
  const folosite = new Set(Object.values(potrivite));
  const gata = Object.keys(potrivite).length === ex.length;
  useEffect(() => {
    if (!gata) return;
    const t = setTimeout(() => onGata(rez.current), redus ? 400 : 1000);
    return () => clearTimeout(t);
  }, [gata, onGata, redus]);

  const incearca = async (s: Carte, d: Carte) => {
    const i = s.index!;
    const n = (inc.current[i] ?? 0) + 1;
    inc.current[i] = n;
    setOcupat(true);
    try {
      // la „memory” nu penalizăm ghicitul: contează doar perechea găsită
      const r = await verifica(i, d.eticheta, memorie ? 1 : n);
      if (r.ok) {
        sunetBland();
        setPotrivite((p) => ({ ...p, [s.id]: d.id }));
        rez.current[i] = { primul: memorie ? d.eticheta : rez.current[i]?.primul ?? d.eticheta, incercari: memorie ? 1 : n, ajutor: false, timpMs: Date.now() - inceput.current };
        setMesaj({ tip: "bravo", text: LAUDE[(i + n) % LAUDE.length] });
        return true;
      }
      if (!memorie && rez.current[i] === undefined) rez.current[i] = { primul: d.eticheta, incercari: n, ajutor: false, timpMs: 0 };
      setGresit([s.id, d.id]);
      setTimeout(() => setGresit([]), 600);
      if (!memorie && r.rezolvare && r.corect) {
        const cd = drepte.find((x) => x.eticheta === r.corect && !folosite.has(x.id));
        if (cd) {
          setPotrivite((p) => ({ ...p, [s.id]: cd.id }));
          rez.current[i] = { ...rez.current[i], incercari: n, ajutor: true, timpMs: Date.now() - inceput.current };
          setMesaj({ tip: "ajutor", text: `Uite perechea: ${r.rezolvare}` });
        }
      } else if (!memorie) setMesaj({ tip: "ajutor", text: `${INCURAJARI[(n - 1) % INCURAJARI.length]} ${s.ex?.indicii[Math.min(n, 2) - 1] ?? ""}` });
      return false;
    } finally {
      setOcupat(false);
    }
  };

  const atinge = async (c: Carte) => {
    if (ocupat || gata) return;
    if (c.fel === "s" ? potrivite[c.id] : folosite.has(c.id)) return;
    if (memorie) {
      if (intoarse.some((x) => x.id === c.id) || intoarse.length >= 2) return;
      const noi = [...intoarse, c];
      setIntoarse(noi);
      if (noi.length < 2) return;
      const s = noi.find((x) => x.fel === "s");
      const d = noi.find((x) => x.fel === "d");
      const ok = s && d ? await incearca(s, d) : false;
      setTimeout(() => setIntoarse([]), ok ? 0 : 1100);
      return;
    }
    if (!selectat || selectat.fel === c.fel) return setSelectat(c);
    const [s, d] = c.fel === "s" ? [c, selectat] : [selectat, c];
    setSelectat(null);
    await incearca(s, d);
  };

  const fata = (c: Carte) => (
    c.fel === "s" && c.ex?.pereche?.stangaMecanica ? (
      <div className="pointer-events-none w-full max-w-[200px] [&_svg]:max-h-28"><VizualExercitiu m={c.ex.pereche.stangaMecanica} indiciu={0} rezolvat={false} /></div>
    ) : (
      <span className="text-2xl font-extrabold sm:text-3xl">{c.eticheta}</span>
    )
  );
  const clase = (c: Carte, vizibil: boolean) => {
    const pot = c.fel === "s" ? potrivite[c.id] : folosite.has(c.id);
    return `relative flex min-h-[7rem] items-center justify-center rounded-3xl p-3 text-mov-inchis shadow-md transition ${
      pot ? "bg-green-100 ring-4 ring-verde" : gresit.includes(c.id) ? "bg-red-50 ring-4 ring-red-300" : selectat?.id === c.id ? "bg-galben-deschis ring-4 ring-galben" : vizibil ? "bg-white ring-2 ring-mov/20" : "bg-mov text-white"
    }`;
  };

  return (
    <section className="mx-auto mt-4 max-w-5xl px-4">
      <div className="rounded-3xl bg-hartie p-5 shadow-md sm:p-8">
        <p className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-mov/70"><span aria-hidden>🃏</span> {memorie ? "Memory vizual" : JOCURI_C1.perechi.nume}</p>
        <div className="flex items-start justify-center gap-3">
          <h2 className="text-center text-2xl font-bold text-cerneala sm:text-3xl">{enunt}</h2>
          <BtnAscult text={enunt} />
        </div>
        <Mesaj mesaj={mesaj} />
        {memorie ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ordineMemorie.map((c) => {
              const vizibil = intoarse.some((x) => x.id === c.id) || (c.fel === "s" ? Boolean(potrivite[c.id]) : folosite.has(c.id));
              return (
                <motion.button key={c.id} type="button" onClick={() => atinge(c)} whileTap={{ scale: 0.95 }} aria-label={vizibil ? c.eticheta : "carte întoarsă"} className={clase(c, vizibil)}>
                  {vizibil ? fata(c) : <span className="text-4xl" aria-hidden>❓</span>}
                  {(c.fel === "s" ? potrivite[c.id] : folosite.has(c.id)) && <span className="absolute right-2 top-1 text-2xl text-verde">✓</span>}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-8">
            <div className="grid content-start gap-3">
              {stanga.map((c) => (
                <motion.button key={c.id} type="button" onClick={() => atinge(c)} whileTap={{ scale: 0.96 }} aria-label={c.eticheta} className={clase(c, true)}>
                  {fata(c)}
                  {potrivite[c.id] && <span className="absolute right-2 top-1 text-2xl text-verde">✓</span>}
                </motion.button>
              ))}
            </div>
            <div className="grid content-start gap-3">
              {drepte.map((c) => (
                <motion.button key={c.id} type="button" onClick={() => atinge(c)} whileTap={{ scale: 0.96 }} className={clase(c, true)}>
                  {fata(c)}
                  {folosite.has(c.id) && <span className="absolute right-2 top-1 text-2xl text-verde">✓</span>}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ═════════════ finalul ═════════════

const MESAJ_MEDALIE: Record<string, string> = {
  diamant: "Perfect! Toate din prima!",
  aur: "Extraordinar!",
  argint: "Foarte bine lucrat!",
  bronz: "Bravo, ai reușit!",
  niciuna: "Ai muncit frumos! Mai exersăm și data viitoare iese și mai bine.",
};

export function FinalC1({ r, inapoi, onReia }: { r: RezultatFinalC1; inapoi: PropsJoc["inapoi"]; onReia?: () => void }) {
  const redus = useReducedMotion();
  useCelebrare(true, r.medalie === "aur" || r.medalie === "diamant" ? "mare" : "mica");
  useEffect(() => { opresteCitirea(); }, []);
  return (
    <main className="flex min-h-screen items-center justify-center bg-crem p-4">
      <motion.div initial={redus ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={tranzitie("lung")}
        className="w-full max-w-lg rounded-3xl bg-hartie p-8 text-center shadow-lg">
        <motion.div initial={redus ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={tranzitie("lung", 0.2)}>
          <InsignaMedalie m={r.medalie} mare />
        </motion.div>
        <p className="mt-4 text-3xl font-extrabold text-mov-inchis">{MESAJ_MEDALIE[r.medalie ?? "niciuna"]}</p>
        <div className="mt-3 flex justify-center gap-2 text-5xl" aria-label={`${r.stele} stele din 3`}>
          {[1, 2, 3].map((s) => <span key={s} className={s <= r.stele ? "" : "opacity-20 grayscale"}>⭐</span>)}
        </div>
        <p className="mt-3 text-xl">Ai rezolvat din prima <b>{r.corecte}</b> din <b>{r.total}</b> ({r.procent}%).</p>
        {r.medalie && r.medalie !== "diamant" && (
          <p className="mt-1 text-gray-600">
            Următoarea medalie: {MEDALII[r.medalie === "bronz" ? "argint" : r.medalie === "argint" ? "aur" : "diamant"].icon} la {MEDALII[r.medalie === "bronz" ? "argint" : r.medalie === "argint" ? "aur" : "diamant"].prag}%.
          </p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onReia && <button type="button" onClick={onReia} className="h-tinta rounded-2xl bg-galben px-7 text-xl font-bold text-mov-inchis shadow-sm">Joacă din nou</button>}
          <Link href={inapoi.href} className="flex h-tinta items-center rounded-2xl bg-mov px-7 text-xl font-bold text-white shadow-sm">{inapoi.text}</Link>
        </div>
      </motion.div>
    </main>
  );
}
