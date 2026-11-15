"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FisaCalcul } from "@/componente/FisaCalcul";
import { blocImplicit, codifica, configImplicita, curata } from "@/motor/calcul/config";
import { genereazaCalcul, totalExercitii } from "@/motor/calcul/generator";
import {
  INTERVALE, NR_MAX, NR_MIN, NR_RAPIDE, NUME_MENTAL, NUME_TIP, TABELE,
  type Bloc, type ConfigCalcul, type OpSimbol, type TipOperatie, type VariantaMentala,
} from "@/motor/calcul/tipuri";
import { seedNou } from "@/motor/rng";
import { exportCsv, exportDocx } from "@/lib/export-calcul";
import { creeazaTemaCalcul } from "@/lib/actiuni-teme";

export interface Grupa { id: string; nume: string; elevi: { id: string; nume: string }[] }

const CHEIE = "mcs-calcul";
const TIPURI = Object.keys(NUME_TIP) as TipOperatie[];
const OPS: { op: OpSimbol; eticheta: string }[] = [{ op: "+", eticheta: "+" }, { op: "-", eticheta: "−" }, { op: "×", eticheta: "×" }, { op: ":", eticheta: ":" }];

/** împarte un total între blocuri (cât mai egal) */
function distribuie(blocuri: Bloc[], total: number): Bloc[] {
  const n = blocuri.length;
  return blocuri.map((b, i) => ({ ...b, nr: Math.floor(total / n) + (i < total % n ? 1 : 0) }));
}

export function GeneratorCalcul({ grupe, online }: { grupe: Grupa[]; online: boolean }) {
  const [cfg, setCfg] = useState<ConfigCalcul>(() => configImplicita(1));
  const [gata, setGata] = useState(false);
  const [vedere, setVedere] = useState<"elev" | "raspunsuri" | "barem">("elev");
  const [exportInCurs, setExportInCurs] = useState(false);

  // ultima configurație a profesorului (doar în acest browser) + seed nou
  useEffect(() => {
    try {
      const salvat = localStorage.getItem(CHEIE);
      if (salvat) setCfg({ ...curata(JSON.parse(salvat)), seed: seedNou(), inlocuiri: {} });
      else setCfg((c) => ({ ...c, seed: seedNou() }));
    } catch {
      setCfg((c) => ({ ...c, seed: seedNou() }));
    }
    setGata(true);
  }, []);
  useEffect(() => {
    if (!gata) return;
    try {
      localStorage.setItem(CHEIE, JSON.stringify(cfg));
    } catch {}
  }, [cfg, gata]);

  const { exercitii, avertismente } = useMemo(() => genereazaCalcul(cfg), [cfg]);
  const total = totalExercitii(cfg);
  const c = useMemo(() => codifica(cfg), [cfg]);
  const prea_putine = total < NR_MIN;

  const set = (p: Partial<ConfigCalcul>) => setCfg((x) => ({ ...x, ...p }));
  // schimbarea condițiilor unui bloc dă exerciții noi în blocul respectiv: înlocuirile vechi nu mai au sens
  const setBloc = (i: number, p: Partial<Bloc>) =>
    setCfg((x) => ({
      ...x,
      blocuri: x.blocuri.map((b, j) => (j === i ? { ...b, ...p } : b)),
      inlocuiri: Object.fromEntries(Object.entries(x.inlocuiri).filter(([k]) => !k.startsWith(`b${i}-`))),
    }));
  const setTotal = (n: number) => setCfg((x) => ({ ...x, blocuri: distribuie(x.blocuri, Math.min(NR_MAX, Math.max(NR_MIN, n))) }));
  const regenereaza = (id: string) => setCfg((x) => ({ ...x, inlocuiri: { ...x.inlocuiri, [id]: (x.inlocuiri[id] ?? 0) + 1 } }));
  const altele = () => set({ seed: seedNou(), inlocuiri: {} });

  const exporta = async (f: () => Promise<void> | void) => {
    setExportInCurs(true);
    try {
      await f();
    } finally {
      setExportInCurs(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[440px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link href="/profesor" className="text-mov">← Fișe pe lecții</Link>
          {online && <Link href="/profesor/teme" className="text-mov">Teme online →</Link>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">Generator de calcul</h1>
        <p className="text-sm text-gray-600">Fișe cu 5–200 de exerciții, pe tipuri de operații, intervale și condiții alese de tine.</p>

        <Sectiune titlu="1. Câte exerciții">
          <div className="grid grid-cols-6 gap-1.5">
            {NR_RAPIDE.map((n) => (
              <button key={n} type="button" onClick={() => setTotal(n)}
                className={`rounded-xl py-2 font-bold ${total === n ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`}>{n}</button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            Alt număr ({NR_MIN}–{NR_MAX}):
            <input type="number" min={NR_MIN} max={NR_MAX} value={total}
              onChange={(e) => { const n = Number(e.target.value); if (n >= NR_MIN && n <= NR_MAX) setTotal(n); }}
              onBlur={(e) => setTotal(Number(e.target.value) || NR_MIN)}
              className="w-24 rounded-lg border-2 border-mov/20 p-1.5" />
          </label>
          {cfg.blocuri.length > 1 && <p className="mt-1 text-xs text-gray-500">Totalul se împarte între tipurile de mai jos; poți schimba numărul la fiecare tip.</p>}
        </Sectiune>

        <Sectiune titlu="2. Tipuri de exerciții">
          <div className="grid gap-3">
            {cfg.blocuri.map((b, i) => (
              <EditorBloc key={i} b={b} index={i} poateSterge={cfg.blocuri.length > 1}
                onChange={(p) => setBloc(i, p)}
                onTip={(tip) => setCfg((x) => ({ ...x, blocuri: x.blocuri.map((y, j) => (j === i ? { ...blocImplicit(tip), nr: y.nr } : y)), inlocuiri: Object.fromEntries(Object.entries(x.inlocuiri).filter(([k]) => !k.startsWith(`b${i}-`))) }))}
                onSterge={() => setCfg((x) => ({ ...x, blocuri: x.blocuri.filter((_, j) => j !== i), inlocuiri: {} }))} />
            ))}
          </div>
          {cfg.blocuri.length < 8 && (
            <button type="button" onClick={() => set({ blocuri: [...cfg.blocuri, { ...blocImplicit("inmultire"), nr: 5 }] })}
              className="mt-3 w-full rounded-xl border-2 border-dashed border-mov/40 py-2 font-semibold text-mov hover:bg-mov-deschis">+ Adaugă alt tip de exerciții</button>
          )}
        </Sectiune>

        <Sectiune titlu="3. Aranjare">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-mov" checked={cfg.amesteca} onChange={(e) => set({ amesteca: e.target.checked })} /> Amestecă exercițiile de tipuri diferite</label>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            Coloane:
            {(["auto", 2, 3, 4] as const).map((k) => (
              <button key={k} type="button" onClick={() => set({ coloane: k })}
                className={`rounded-lg px-3 py-1 font-semibold ${cfg.coloane === k ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{k === "auto" ? "automat" : k}</button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            Înmulțirea:
            {(["×", "·"] as const).map((k) => (
              <button key={k} type="button" onClick={() => set({ simbolInmultire: k })}
                className={`h-8 w-10 rounded-lg text-lg font-bold ${cfg.simbolInmultire === k ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{k}</button>
            ))}
            <span className="ml-3">Necunoscuta:</span>
            {(["□", "x", "a", "?"] as const).map((k) => (
              <button key={k} type="button" onClick={() => set({ necunoscuta: k })}
                className={`h-8 w-9 rounded-lg text-lg font-bold ${cfg.necunoscuta === k ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{k}</button>
            ))}
          </div>
        </Sectiune>

        <Sectiune titlu="4. Antet">
          <Camp eticheta="Titlu" valoare={cfg.antet.titlu} onChange={(v) => set({ antet: { ...cfg.antet, titlu: v } })} />
          <Camp eticheta="Centrul / școala" valoare={cfg.antet.centru} onChange={(v) => set({ antet: { ...cfg.antet, centru: v } })} />
          <Camp eticheta="Profesor" valoare={cfg.antet.profesor} onChange={(v) => set({ antet: { ...cfg.antet, profesor: v } })} />
          <div className="grid grid-cols-2 gap-2">
            <Camp eticheta="Data" sugestie="liber = linie" valoare={cfg.antet.data} onChange={(v) => set({ antet: { ...cfg.antet, data: v } })} />
            <Camp eticheta="Timp de lucru" sugestie="ex. 20 de minute" valoare={cfg.antet.timp} onChange={(v) => set({ antet: { ...cfg.antet, timp: v } })} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-mov" checked={cfg.antet.logo} onChange={(e) => set({ antet: { ...cfg.antet, logo: e.target.checked } })} /> Logo Fabrica de Inteligență</label>
        </Sectiune>

        <Sectiune titlu="5. Descarcă / printează">
          <button type="button" onClick={altele} className="w-full rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Alte numere (fișă nouă)</button>
          <div className={`mt-2 grid grid-cols-2 gap-2 ${prea_putine ? "pointer-events-none opacity-40" : ""}`}>
            <a href={`/api/pdf-calcul?c=${c}&mod=fisa`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis">⬇️ Descarcă fișa PDF</a>
            <a href={`/api/pdf-calcul?c=${c}&mod=${encodeURIComponent("fisa+barem")}`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov">⬇️ Fișa + barem (PDF)</a>
            <a href={`/fisa/calcul?c=${c}&mod=fisa`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează fișa</a>
            <a href={`/fisa/calcul?c=${c}&mod=barem`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center text-sm font-semibold text-mov">🖨️ Printează baremul</a>
            <button type="button" disabled={exportInCurs} onClick={() => exporta(() => exportDocx(cfg, exercitii))} className="rounded-xl border-2 border-mov/40 px-3 py-2 text-sm font-semibold text-mov hover:bg-mov-deschis">📝 Word (.docx)</button>
            <button type="button" onClick={() => exportCsv(cfg, exercitii)} className="rounded-xl border-2 border-mov/40 px-3 py-2 text-sm font-semibold text-mov hover:bg-mov-deschis">📊 CSV (Excel)</button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Codul fișei: <b>{cfg.seed}</b>. Fișa, baremul și tema online au exact aceleași exerciții.</p>
        </Sectiune>

        <Sectiune titlu="6. Temă sau test online">
          {online ? <PanouTema c={c} titluImplicit={cfg.antet.titlu} grupe={grupe} dezactivat={prea_putine} />
            : <p className="rounded-lg bg-galben-deschis p-3 text-sm">Temele online funcționează când aplicația are conturi (baza de date conectată).</p>}
        </Sectiune>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2">
          {([["elev", "Fișa elevului"], ["raspunsuri", "Cu răspunsuri"], ["barem", "Barem"]] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setVedere(v)}
              className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{t}</button>
          ))}
          <span className="ml-auto text-sm text-gray-600">{exercitii.length} exerciții · ↻ pe un exercițiu îl înlocuiește</span>
        </div>
        {(avertismente.length > 0 || prea_putine) && (
          <div className="mx-auto mb-4 max-w-[210mm] rounded-2xl bg-galben-deschis p-3 text-sm">
            {prea_putine && <p>O fișă are cel puțin {NR_MIN} exerciții.</p>}
            {avertismente.map((a) => <p key={a}>⚠️ {a}</p>)}
          </div>
        )}
        {gata && (
          <FisaCalcul cfg={cfg} exercitii={exercitii} mod={vedere === "barem" ? "barem" : "fisa"} cuRaspunsuri={vedere === "raspunsuri"}
            onRegenereaza={vedere === "barem" ? undefined : regenereaza} />
        )}
      </main>
    </div>
  );
}

function EditorBloc({ b, index, poateSterge, onChange, onTip, onSterge }: {
  b: Bloc; index: number; poateSterge: boolean;
  onChange: (p: Partial<Bloc>) => void; onTip: (t: TipOperatie) => void; onSterge: () => void;
}) {
  const preset = INTERVALE.find((p) => p.min === b.min && p.max === b.max && p.rezultatInInterval === b.rezultatInInterval)?.id ?? "personalizat";
  const cuTabele = (b.tip === "inmultire" || b.tip === "impartire") && !!b.tabele;
  const arataInterval = !cuTabele;
  const toggle = <T,>(lista: T[] | undefined, v: T) => (lista?.includes(v) ? lista.filter((x) => x !== v) : [...(lista ?? []), v]);
  return (
    <div className="min-w-0 rounded-2xl border-2 border-mov/15 bg-mov-deschis/40 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mov text-sm font-bold text-white">{index + 1}</span>
        <select value={b.tip} onChange={(e) => onTip(e.target.value as TipOperatie)} className="min-w-0 flex-1 rounded-lg border-2 border-mov/20 bg-white p-1.5 font-semibold">
          {TIPURI.map((t) => <option key={t} value={t}>{NUME_TIP[t]}</option>)}
        </select>
        <input type="number" min={0} max={NR_MAX} value={b.nr} onChange={(e) => onChange({ nr: Math.max(0, Math.min(NR_MAX, Number(e.target.value) || 0)) })}
          className="w-16 rounded-lg border-2 border-mov/20 p-1.5 text-center" aria-label="Număr de exerciții" />
        {poateSterge && <button type="button" onClick={onSterge} className="rounded-lg px-2 text-lg text-gray-500 hover:bg-white" aria-label="Șterge tipul">✕</button>}
      </div>

      {(b.tip === "inmultire" || b.tip === "impartire") && (
        <Alegeri valoare={cuTabele ? "tabla" : "interval"} onChange={(v) => onChange(v === "tabla" ? { tabele: [2, 3, 4, 5, 6, 7, 8, 9, 10] } : { tabele: undefined, min: b.tip === "inmultire" ? 10 : 0, max: b.tip === "inmultire" ? 99 : 1000, rezultatInInterval: b.tip === "impartire" })}
          optiuni={[["tabla", b.tip === "inmultire" ? "Tabla înmulțirii" : "Tabla împărțirii"], ["interval", b.tip === "inmultire" ? "Numere mai mari" : "Numere mai mari"]]} />
      )}
      {cuTabele && (
        <div className="mt-2">
          <div className="text-xs text-gray-600">{b.tip === "inmultire" ? "Tablele (al doilea factor):" : "Împărțitorii:"}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {TABELE.map((t) => (
              <button key={t} type="button" onClick={() => { const l = toggle(b.tabele, t); if (l.length) onChange({ tabele: l.sort((x, y) => x - y) }); }}
                className={`h-8 w-8 rounded-lg text-sm font-bold ${b.tabele?.includes(t) ? "bg-mov text-white" : "bg-white text-mov"}`}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {arataInterval && (
        <div className="mt-2 grid gap-1 text-sm">
          <label className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-gray-600">{b.tip === "impartire" ? "Deîmpărțit" : b.tip === "inmultire" ? "Factorul 1" : "Numere"}:</span>
            <select value={preset} onChange={(e) => { const p = INTERVALE.find((x) => x.id === e.target.value); if (p) onChange({ min: p.min, max: p.max, rezultatInInterval: p.rezultatInInterval }); }}
              className="min-w-0 flex-1 rounded-lg border-2 border-mov/20 bg-white p-1">
              {INTERVALE.map((p) => <option key={p.id} value={p.id}>{p.eticheta}</option>)}
              <option value="personalizat">alt interval…</option>
            </select>
          </label>
          <div className="flex items-center gap-2 pl-[88px]">
            <NumarMic valoare={b.min} onChange={(v) => onChange({ min: v, max: Math.max(v, b.max) })} /> –
            <NumarMic valoare={b.max} onChange={(v) => onChange({ max: Math.max(v, b.min) })} />
          </div>
          {b.tip !== "mental" && (
            <label className="flex items-center gap-2 pl-[88px] text-xs"><input type="checkbox" className="accent-mov" checked={b.rezultatInInterval} onChange={(e) => onChange({ rezultatInInterval: e.target.checked })} />
              {b.tip === "impartire" ? "deîmpărțitul nu depășește intervalul" : "și rezultatul rămâne în interval"}</label>
          )}
        </div>
      )}

      {((b.tip === "inmultire" && !cuTabele) || (b.tip === "impartire" && !cuTabele) || b.tip === "combinate" || b.tip === "ecuatii") && (
        <label className="mt-1 flex items-center gap-2 text-sm">
          <span className="w-20 shrink-0 text-gray-600">{b.tip === "impartire" ? "Împărțitor" : b.tip === "inmultire" ? "Factorul 2" : "La × și :"}</span>
          <NumarMic valoare={b.min2 ?? 2} onChange={(v) => onChange({ min2: Math.max(1, v), max2: Math.max(v, b.max2 ?? 10) })} /> –
          <NumarMic valoare={b.max2 ?? 10} onChange={(v) => onChange({ max2: Math.max(v, b.min2 ?? 2) })} />
        </label>
      )}

      {(b.tip === "adunare" || b.tip === "scadere") && (
        <Alegeri valoare={b.trecere ?? "oricare"} onChange={(v) => onChange({ trecere: v as Bloc["trecere"] })}
          optiuni={[["oricare", "oricum"], ["fara", "fără trecere"], ["cu", "cu trecere"]]} />
      )}
      {b.tip === "adunare" && (
        <Alegeri valoare={String(b.termeni ?? 2)} onChange={(v) => onChange({ termeni: Number(v) })}
          optiuni={[["2", "2 termeni"], ["3", "3 termeni"], ["4", "4 termeni"]]} />
      )}
      {b.tip === "impartire" && (
        <Alegeri valoare={b.rest ?? "exacta"} onChange={(v) => onChange({ rest: v as Bloc["rest"] })}
          optiuni={[["exacta", "exactă (fără rest)"], ["cu-rest", "cu rest"], ["amestecat", "amestecat"]]} />
      )}
      {(b.tip === "combinate" || b.tip === "ecuatii") && (
        <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
          <span className="text-gray-600">Operații:</span>
          {OPS.map(({ op, eticheta }) => (
            <button key={op} type="button" onClick={() => { const l = toggle(b.operatii, op); if (l.length) onChange({ operatii: l }); }}
              className={`h-8 w-9 rounded-lg text-lg font-bold ${b.operatii?.includes(op) ? "bg-mov text-white" : "bg-white text-mov"}`}>{eticheta}</button>
          ))}
        </div>
      )}
      {b.tip === "combinate" && (
        <>
          <Alegeri valoare={String(b.nrOperatii ?? 2)} onChange={(v) => onChange({ nrOperatii: Number(v) })} optiuni={[["2", "2 operații"], ["3", "3 operații"]]} />
          <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-mov" checked={!!b.paranteze} onChange={(e) => onChange({ paranteze: e.target.checked })} /> cu paranteze rotunde</label>
        </>
      )}
      {b.tip === "mental" && (
        <div className="mt-2 grid gap-1 text-sm">
          {(Object.keys(NUME_MENTAL) as VariantaMentala[]).map((v) => (
            <label key={v} className="flex items-center gap-2"><input type="checkbox" className="accent-mov" checked={!!b.variante?.includes(v)}
              onChange={() => { const l = toggle(b.variante, v); if (l.length) onChange({ variante: l }); }} /> {NUME_MENTAL[v]}</label>
          ))}
        </div>
      )}
      {(b.tip === "adunare" || b.tip === "scadere" || b.tip === "inmultire") && (
        <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-mov" checked={!!b.coloana} onChange={(e) => onChange({ coloana: e.target.checked })} /> așezate în coloană</label>
      )}
      {b.tip === "scadere" && (
        <label className="mt-1 flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" className="accent-mov" checked={!!b.negative} onChange={(e) => onChange({ negative: e.target.checked })} /> permite rezultate negative (după clasa a V-a)</label>
      )}
    </div>
  );
}

function PanouTema({ c, titluImplicit, grupe, dezactivat }: { c: string; titluImplicit: string; grupe: Grupa[]; dezactivat: boolean }) {
  const [titlu, setTitlu] = useState("");
  const [tinta, setTinta] = useState("");
  const [limita, setLimita] = useState("");
  const [termen, setTermen] = useState("");
  const [test, setTest] = useState(false);
  const [diferite, setDiferite] = useState(false);
  const [stare, setStare] = useState<{ eroare?: string; cod?: string; id?: string } | null>(null);
  const [trimite, setTrimite] = useState(false);

  if (!grupe.length) return <p className="rounded-lg bg-galben-deschis p-3 text-sm">Nu ai încă grupe. Administratorul școlii te poate adăuga la o clasă din panoul de administrare.</p>;

  const salveaza = async () => {
    setTrimite(true);
    try {
      setStare(await creeazaTemaCalcul({ c, titlu: titlu || titluImplicit, tinta, limitaMinute: Number(limita) || null, termen: termen || null, test, diferite }));
    } catch {
      setStare({ eroare: "Nu am putut salva tema. Încearcă din nou." });
    } finally {
      setTrimite(false);
    }
  };

  return (
    <div className="grid gap-2 text-sm">
      <Camp eticheta="Titlul temei" sugestie={titluImplicit} valoare={titlu} onChange={setTitlu} />
      <label className="grid gap-1">
        <span className="text-gray-600">Pentru</span>
        <select value={tinta} onChange={(e) => setTinta(e.target.value)} className="rounded-lg border-2 border-mov/20 bg-white p-2">
          <option value="">— alege grupa sau elevul —</option>
          <optgroup label="Toată grupa">
            {grupe.map((g) => <option key={g.id} value={`clasa:${g.id}`}>{g.nume} ({g.elevi.length} elevi)</option>)}
          </optgroup>
          {grupe.filter((g) => g.elevi.length).map((g) => (
            <optgroup key={g.id} label={`Un elev din ${g.nume}`}>
              {g.elevi.map((e) => <option key={e.id} value={`elev:${e.id}`}>{e.nume}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1"><span className="text-gray-600">Timp (minute)</span>
          <input type="number" min={1} max={240} placeholder="fără limită" value={limita} onChange={(e) => setLimita(e.target.value)} className="rounded-lg border-2 border-mov/20 p-2" /></label>
        <label className="grid gap-1"><span className="text-gray-600">Termen</span>
          <input type="date" value={termen} onChange={(e) => setTermen(e.target.value)} className="rounded-lg border-2 border-mov/20 p-2" /></label>
      </div>
      <label className="flex items-center gap-2"><input type="checkbox" className="accent-mov" checked={test} onChange={(e) => setTest(e.target.checked)} /> Test: o singură trimitere</label>
      <label className="flex items-center gap-2"><input type="checkbox" className="accent-mov" checked={diferite} onChange={(e) => setDiferite(e.target.checked)} /> Exerciții diferite pentru fiecare elev (aceleași condiții)</label>
      <button type="button" disabled={!tinta || trimite || dezactivat} onClick={salveaza}
        className="rounded-xl bg-mov px-4 py-3 font-bold text-white hover:bg-mov-inchis disabled:opacity-40">{trimite ? "Se salvează…" : "📤 Trimite elevilor"}</button>
      {stare?.eroare && <p className="rounded-lg bg-red-50 p-2 text-red-700">{stare.eroare}</p>}
      {stare?.cod && (
        <div className="rounded-xl bg-green-50 p-3 text-green-900">
          Tema a fost trimisă. Codul ei: <b className="text-lg tracking-widest">{stare.cod}</b>
          <div className="mt-1">Elevii o găsesc la „Temele mele” sau introduc codul. <Link href={`/profesor/teme/${stare.id}`} className="font-semibold underline">Vezi rezultatele →</Link></div>
        </div>
      )}
    </div>
  );
}

function Sectiune({ titlu, children }: { titlu: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">{titlu}</h2>
      {children}
    </section>
  );
}

function Camp({ eticheta, valoare, onChange, sugestie }: { eticheta: string; valoare: string; onChange: (v: string) => void; sugestie?: string }) {
  return (
    <label className="mb-2 grid gap-1 text-sm">
      <span className="text-gray-600">{eticheta}</span>
      <input value={valoare} placeholder={sugestie} onChange={(e) => onChange(e.target.value)} className="rounded-lg border-2 border-mov/20 p-2" />
    </label>
  );
}

function NumarMic({ valoare, onChange }: { valoare: number; onChange: (v: number) => void }) {
  return <input type="number" min={0} value={valoare} onChange={(e) => onChange(Math.max(0, Math.min(1_000_000, Number(e.target.value) || 0)))} className="w-24 min-w-0 rounded-lg border-2 border-mov/20 p-1" />;
}

function Alegeri({ valoare, optiuni, onChange }: { valoare: string; optiuni: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1 text-sm">
      {optiuni.map(([v, t]) => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`rounded-lg px-2.5 py-1 font-semibold ${valoare === v ? "bg-mov text-white" : "bg-white text-mov"}`}>{t}</button>
      ))}
    </div>
  );
}
