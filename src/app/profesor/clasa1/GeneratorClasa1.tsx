"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FisaPrint } from "@/componente/FisaPrint";
import { CAPITOLE_C1, FORME_TERMEN, JOCURI_C1, SUBTEME_BANI, SUBTEME_GEOMETRIE, SUBTEME_NUMERE, SUBTEME_TIMP } from "@/motor/clasa1/capitole";
import { codificaC1, configImplicitaC1, curataC1, JOCURI_TOATE } from "@/motor/clasa1/config";
import { fisaClasa1, genereazaClasa1 } from "@/motor/clasa1/sesiune";
import { NR_EXERCITII_C1, SECUNDE_C1, type CapitolC1, type ConfigClasa1, type OptiuniC1, type Trecere } from "@/motor/clasa1/tipuri";
import { seedNou } from "@/motor/rng";
import { creeazaTemaClasa1, type StareTemaClasa1 } from "@/lib/actiuni-clasa1";
import type { Grupa } from "../calcul/GeneratorCalcul";

const CHEIE = "mcs-clasa1-config";
const CHEIE_ANTET = "mcs-antet";

export function GeneratorClasa1({ grupe, online }: { grupe: Grupa[]; online: boolean }) {
  const [cfg, setCfg] = useState<ConfigClasa1>(() => configImplicitaC1(1));
  const [vedere, setVedere] = useState<"fisa" | "barem" | "joc">("fisa");

  // seed nou + ultima configurație și antetul salvate (doar în browser)
  useEffect(() => {
    let salvat: Partial<ConfigClasa1> = {};
    let antet: { scoala?: string; profesor?: string } = {};
    try {
      salvat = JSON.parse(localStorage.getItem(CHEIE) ?? "{}");
      antet = JSON.parse(localStorage.getItem(CHEIE_ANTET) ?? "{}");
    } catch {}
    const impl = configImplicitaC1(1);
    setCfg(curataC1({
      ...impl, ...salvat, seed: seedNou(),
      antet: { ...impl.antet, ...(salvat.antet ?? {}), scoala: antet.scoala ?? "", profesor: antet.profesor ?? "", data: new Date().toLocaleDateString("ro-RO") },
    } as unknown as Record<string, unknown>));
  }, []);
  useEffect(() => {
    try {
      const { seed: _s, ...rest } = cfg; // eslint-disable-line @typescript-eslint/no-unused-vars
      localStorage.setItem(CHEIE, JSON.stringify(rest));
      localStorage.setItem(CHEIE_ANTET, JSON.stringify({ scoala: cfg.antet.scoala, profesor: cfg.antet.profesor }));
    } catch {}
  }, [cfg]);

  const { exercitii, lipsa } = useMemo(() => genereazaClasa1(cfg), [cfg]);
  const fisa = useMemo(() => fisaClasa1(cfg, exercitii), [cfg, exercitii]);
  const c = useMemo(() => codificaC1(cfg), [cfg]);

  const set = <K extends keyof ConfigClasa1>(k: K, v: ConfigClasa1[K], seed = false) => setCfg((x) => ({ ...x, [k]: v, ...(seed ? { seed: seedNou() } : {}) }));
  const setO = <K extends keyof OptiuniC1>(k: K, v: Partial<OptiuniC1[K]>) => setCfg((x) => ({ ...x, seed: seedNou(), optiuni: { ...x.optiuni, [k]: { ...x.optiuni[k], ...v } } }));
  const comutaCapitol = (id: CapitolC1) => setCfg((x) => ({ ...x, seed: seedNou(), capitole: x.capitole.includes(id) ? x.capitole.filter((y) => y !== id) : [...x.capitole, id] }));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const nimic = !cfg.capitole.length;
  const antet = { titlu: cfg.antet.titlu, scoala: cfg.antet.scoala, profesor: cfg.antet.profesor, data: cfg.antet.data };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[440px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <Link href="/profesor" className="text-sm font-semibold text-mov">← Fișe pe lecții</Link>
        <h1 className="mt-2 text-2xl font-bold text-mov">Clasa I · jocuri și fișe</h1>
        <p className="text-sm text-gray-600">Alege capitolele, numărul de exerciții și jocurile. Aceleași exerciții ajung pe fișa PDF și în jocul elevilor.</p>

        <Sectiune titlu="1. Capitole (unul sau mai multe)">
          <div className="grid gap-2">
            {CAPITOLE_C1.map((cap) => {
              const ales = cfg.capitole.includes(cap.id);
              return (
                <div key={cap.id} className={`rounded-xl border-2 ${ales ? "border-mov bg-mov-deschis/60" : "border-mov/15"}`}>
                  <label className="flex cursor-pointer items-start gap-2 p-2.5">
                    <input type="checkbox" checked={ales} onChange={() => comutaCapitol(cap.id)} className="mt-1 h-5 w-5 accent-mov" />
                    <span>
                      <span className="font-bold text-mov-inchis">{cap.icon} {cap.titlu}</span>
                      <span className="block text-xs text-gray-600">{cap.descriere}</span>
                    </span>
                  </label>
                  {ales && <div className="border-t border-mov/15 px-3 pb-3 pt-2 text-sm"><OptiuniCapitol id={cap.id} o={cfg.optiuni} setO={setO} toggle={toggle} /></div>}
                </div>
              );
            })}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cfg.suportVizual} onChange={(e) => set("suportVizual", e.target.checked, true)} className="h-5 w-5 accent-mov" />
            Sprijin vizual (cadrul de 10, bețișoare, axa numerelor, desenul problemei)
          </label>
        </Sectiune>

        <Sectiune titlu="2. Număr de exerciții">
          <div className="grid grid-cols-6 gap-1">
            {NR_EXERCITII_C1.map((n) => (
              <button key={n} type="button" onClick={() => set("n", n, true)}
                className={`rounded-lg py-2 text-sm font-bold ${cfg.n === n ? "bg-mov text-white" : "bg-mov-deschis text-mov hover:bg-mov/20"}`}>{n}</button>
            ))}
          </div>
          {lipsa > 0 && !nimic && (
            <p className="mt-2 rounded-lg bg-galben-deschis p-2 text-sm">Capitolele alese au doar {exercitii.length} exerciții diferite cu aceste opțiuni. Adaugă un capitol sau o subtemă ca să ajungi la {cfg.n}.</p>
          )}
        </Sectiune>

        <Sectiune titlu="3. Jocurile elevilor">
          <div className="grid gap-1.5">
            {JOCURI_TOATE.map((j) => (
              <label key={j} className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 hover:bg-mov-deschis/50">
                <input type="checkbox" checked={cfg.jocuri.includes(j)} onChange={() => set("jocuri", toggle(cfg.jocuri, j), true)} className="mt-1 h-5 w-5 accent-mov" />
                <span><b>{JOCURI_C1[j].icon} {JOCURI_C1[j].nume}</b><span className="block text-xs text-gray-600">{JOCURI_C1[j].descriere}</span></span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Exercițiile care nu se potrivesc unui joc permis apar cu variante mari sau cu tastatura pe ecran.</p>
          <div className="mt-3 rounded-xl bg-galben-deschis p-3 text-sm">
            <label className="flex items-center gap-2 font-semibold">
              <input type="checkbox" checked={cfg.cronometru} onChange={(e) => set("cronometru", e.target.checked)} className="h-5 w-5 accent-mov" />
              Cronometru în „Cursa prietenoasă”
            </label>
            <p className="mt-1 text-xs text-gray-700">Implicit oprit, pentru copiii care se emoționează. Când timpul trece, copilul vede rezolvarea și merge mai departe.</p>
            {cfg.cronometru && (
              <div className="mt-2 flex gap-1">
                {SECUNDE_C1.map((s) => (
                  <button key={s} type="button" onClick={() => set("secunde", s)}
                    className={`rounded-lg px-3 py-1 font-bold ${cfg.secunde === s ? "bg-mov text-white" : "bg-white text-mov"}`}>{s} s</button>
                ))}
              </div>
            )}
          </div>
        </Sectiune>

        <Sectiune titlu="4. Antetul fișei">
          <input placeholder="Titlul fișei" value={cfg.antet.titlu} onChange={(e) => set("antet", { ...cfg.antet, titlu: e.target.value })} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <input placeholder="Școala" value={cfg.antet.scoala} onChange={(e) => set("antet", { ...cfg.antet, scoala: e.target.value })} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <input placeholder="Profesor" value={cfg.antet.profesor} onChange={(e) => set("antet", { ...cfg.antet, profesor: e.target.value })} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <input placeholder="Data" value={cfg.antet.data} onChange={(e) => set("antet", { ...cfg.antet, data: e.target.value })} className="mb-2 w-full rounded-xl border-2 border-mov/20 p-2" />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>Coloane:</span>
            {([2, 3] as const).map((k) => (
              <button key={k} type="button" onClick={() => set("coloane", k)} className={`rounded-lg px-3 py-1 font-bold ${cfg.coloane === k ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{k}</button>
            ))}
            <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.albNegru} onChange={(e) => set("albNegru", e.target.checked)} className="accent-mov" /> Alb-negru</label>
          </div>
        </Sectiune>

        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => set("seed", seedNou())} className="rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Regenerează (exerciții noi)</button>
          <div className="grid grid-cols-2 gap-2">
            <a aria-disabled={nimic} href={nimic ? undefined : `/api/pdf-clasa1?c=${c}&mod=fisa`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis aria-disabled:opacity-40">⬇️ Descarcă Fișa PDF</a>
            <a aria-disabled={nimic} href={nimic ? undefined : `/api/pdf-clasa1?c=${c}&mod=fisa%2Bbarem`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov aria-disabled:opacity-40">⬇️ Fișa + Barem (Răspunsuri)</a>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <a href={nimic ? undefined : `/fisa/clasa1?c=${c}&mod=fisa%2Bbarem`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center font-semibold text-mov">🖨️ Printează</a>
            <a href={nimic ? undefined : `/elev/clasa1?c=${c}`} target="_blank" className="rounded-xl border-2 border-mov px-3 py-2 text-center font-semibold text-mov">🎮 Încearcă jocul</a>
          </div>
          <p className="text-xs text-gray-500">Codul fișei: <b>{cfg.seed}</b>. Același cod dă aceleași exerciții pe fișă, în barem și în joc.</p>
        </div>

        <Sectiune titlu="5. Trimite ca joc interactiv">
          {online ? <PanouAtribuire c={c} titluImplicit={cfg.antet.titlu} grupe={grupe} dezactivat={nimic || !exercitii.length} />
            : <p className="rounded-lg bg-galben-deschis p-3 text-sm">Jocurile online funcționează când aplicația are conturi (baza de date conectată). Până atunci, folosește „Încearcă jocul” și fișa PDF.</p>}
        </Sectiune>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap gap-2">
          {([["fisa", "Fișa elevului"], ["barem", "Barem (răspunsuri)"], ["joc", `Exercițiile din joc (${exercitii.length})`]] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setVedere(v)}
              className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{t}</button>
          ))}
        </div>
        {nimic ? (
          <p className="mx-auto max-w-xl rounded-2xl bg-white p-6 text-center shadow">Alege cel puțin un capitol.</p>
        ) : vedere === "joc" ? (
          <ListaJoc exercitii={exercitii.map((e) => ({ capitol: e.capitol, ecran: e.ecran, enunt: e.enunt, tabla: e.tabla }))} />
        ) : (
          <div className="fisa-c1"><FisaPrint fisa={fisa} antet={antet} rezolvari={vedere === "barem"} albNegru={cfg.albNegru} /></div>
        )}
      </main>
    </div>
  );
}

function OptiuniCapitol({ id, o, setO, toggle }: {
  id: CapitolC1; o: OptiuniC1;
  setO: <K extends keyof OptiuniC1>(k: K, v: Partial<OptiuniC1[K]>) => void;
  toggle: <T>(arr: T[], v: T) => T[];
}) {
  const Chip = ({ activ, onClick, children }: { activ: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} aria-pressed={activ}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${activ ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{children}</button>
  );
  const Trec = ({ k }: { k: "adsc20" | "adsc100" }) => (
    <div className="mt-1">
      <div className="mb-1 text-xs font-bold text-gray-600">Trecerea peste ordin</div>
      <div className="flex flex-wrap gap-1">
        {([["fara", "Doar fără trecere"], ["cu", "Cu trecere"], ["ambele", "Amestecat"]] as [Trecere, string][]).map(([t, n]) => (
          <Chip key={t} activ={o[k].trecere === t} onClick={() => setO(k, { trecere: t })}>{n}</Chip>
        ))}
      </div>
      <div className="mb-1 mt-2 text-xs font-bold text-gray-600">Operații</div>
      <div className="flex gap-1">
        {(["+", "-"] as const).map((op) => (
          <Chip key={op} activ={o[k].operatii.includes(op)} onClick={() => { const v = toggle(o[k].operatii, op); if (v.length) setO(k, { operatii: v }); }}>{op === "+" ? "Adunare" : "Scădere"}</Chip>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">{k === "adsc20" ? "Ex.: 12 + 5, 17 − 4 (fără) · 8 + 5, 13 − 6 (cu)" : "Ex.: 34 + 25, 68 − 42 (fără) · 27 + 15, 52 − 18 (cu)"}</p>
    </div>
  );
  const Subteme = <T extends string>({ lista, alese, k }: { lista: { id: T; nume: string }[]; alese: T[]; k: "numere" | "geometrie" | "timp" | "bani" }) => (
    <div className="flex flex-wrap gap-1">
      {lista.map((s) => (
        <Chip key={s.id} activ={alese.includes(s.id)} onClick={() => { const v = toggle(alese, s.id); if (v.length) setO(k, { subteme: v } as never); }}>{s.nume}</Chip>
      ))}
    </div>
  );
  switch (id) {
    case "numere":
      return (
        <>
          <Subteme lista={SUBTEME_NUMERE} alese={o.numere.subteme} k="numere" />
          {o.numere.subteme.includes("numarare") && (
            <div className="mt-2 flex flex-wrap items-center gap-1"><span className="text-xs font-bold text-gray-600">Numărăm din:</span>
              {([1, 2, 5, 10] as const).map((p) => <Chip key={p} activ={o.numere.pasi.includes(p)} onClick={() => { const v = toggle(o.numere.pasi, p); if (v.length) setO("numere", { pasi: v }); }}>{p} în {p}</Chip>)}
            </div>
          )}
        </>
      );
    case "adsc20": return <Trec k="adsc20" />;
    case "adsc100": return <Trec k="adsc100" />;
    case "termen":
      return (
        <>
          <div className="flex flex-wrap gap-1">{FORME_TERMEN.map((f) => <Chip key={f.id} activ={o.termen.forme.includes(f.id)} onClick={() => { const v = toggle(o.termen.forme, f.id); if (v.length) setO("termen", { forme: v }); }}>{f.nume}</Chip>)}</div>
          <div className="mt-2 flex items-center gap-1"><span className="text-xs font-bold text-gray-600">Concentrul:</span>{([20, 100] as const).map((m) => <Chip key={m} activ={o.termen.max === m} onClick={() => setO("termen", { max: m })}>0–{m}</Chip>)}</div>
        </>
      );
    case "geometrie": return <Subteme lista={SUBTEME_GEOMETRIE} alese={o.geometrie.subteme} k="geometrie" />;
    case "timp":
      return (
        <>
          <Subteme lista={SUBTEME_TIMP} alese={o.timp.subteme} k="timp" />
          {o.timp.subteme.includes("ceas") && (
            <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={o.timp.jumatati} onChange={(e) => setO("timp", { jumatati: e.target.checked })} className="accent-mov" /> Și jumătatea de oră (3:30)</label>
          )}
        </>
      );
    case "bani": return <Subteme lista={SUBTEME_BANI} alese={o.bani.subteme} k="bani" />;
    case "lungime": return <p className="text-xs text-gray-600">Obiecte de 2–14 cm, pe riglă; uneori nu încep de la 0.</p>;
    case "probleme":
      return (
        <>
          <div className="flex items-center gap-1"><span className="text-xs font-bold text-gray-600">Concentrul:</span>{([20, 100] as const).map((m) => <Chip key={m} activ={o.probleme.max === m} onClick={() => setO("probleme", { max: m })}>0–{m}</Chip>)}</div>
          <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={o.probleme.douaOperatii} onChange={(e) => setO("probleme", { douaOperatii: e.target.checked })} className="accent-mov" /> Și probleme cu două operații simple</label>
        </>
      );
  }
}

function ListaJoc({ exercitii }: { exercitii: { capitol: CapitolC1; ecran: string; enunt: string; tabla?: number }[] }) {
  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-4 shadow">
      <p className="mb-3 text-sm text-gray-600">Ordinea în care elevul primește exercițiile. Perechile se joacă pe table de 3–5 cartonașe.</p>
      <ol className="grid gap-1">
        {exercitii.map((e, i) => {
          const joc = e.ecran === "intrebare" ? { icon: "❔", nume: "Întrebare" } : JOCURI_C1[e.ecran as keyof typeof JOCURI_C1];
          const cap = CAPITOLE_C1.find((c) => c.id === e.capitol)!;
          return (
            <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1 odd:bg-mov-deschis/40">
              <span className="w-8 text-right font-mono text-sm text-gray-500">{i + 1}.</span>
              <span title={cap.titlu}>{cap.icon}</span>
              <span className="flex-1">{e.enunt}</span>
              <span className="whitespace-nowrap text-sm text-mov">{joc.icon} {joc.nume}{e.tabla ? ` · tabla ${e.tabla}` : ""}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PanouAtribuire({ c, titluImplicit, grupe, dezactivat }: { c: string; titluImplicit: string; grupe: Grupa[]; dezactivat: boolean }) {
  const [titlu, setTitlu] = useState("");
  const [tinta, setTinta] = useState("");
  const [termen, setTermen] = useState("");
  const [test, setTest] = useState(false);
  const [diferite, setDiferite] = useState(false);
  const [stare, setStare] = useState<StareTemaClasa1 | null>(null);
  const [trimite, setTrimite] = useState(false);
  if (!grupe.length) return <p className="rounded-lg bg-galben-deschis p-3 text-sm">Nu ai încă grupe. Administratorul școlii te poate adăuga la o clasă din panoul de administrare.</p>;
  const salveaza = async () => {
    setTrimite(true);
    setStare(null);
    try {
      setStare(await creeazaTemaClasa1({ c, titlu: titlu || titluImplicit, tinta, termen: termen || null, test, diferite }));
    } catch {
      setStare({ eroare: "Nu am putut salva. Încearcă din nou." });
    } finally {
      setTrimite(false);
    }
  };
  return (
    <div className="grid gap-2 text-sm">
      <input placeholder={titluImplicit} value={titlu} onChange={(e) => setTitlu(e.target.value)} className="rounded-lg border-2 border-mov/20 p-2" />
      <select value={tinta} onChange={(e) => setTinta(e.target.value)} className="rounded-lg border-2 border-mov/20 bg-white p-2">
        <option value="">Cine primește jocul?</option>
        <optgroup label="Toată grupa">
          {grupe.map((g) => <option key={g.id} value={`clasa:${g.id}`}>{g.nume} ({g.elevi.length} elevi)</option>)}
        </optgroup>
        {grupe.filter((g) => g.elevi.length).map((g) => (
          <optgroup key={g.id} label={`Un elev din ${g.nume}`}>
            {g.elevi.map((e) => <option key={e.id} value={`elev:${e.id}`}>{e.nume}</option>)}
          </optgroup>
        ))}
      </select>
      <label className="flex items-center gap-2">Termen: <input type="date" value={termen} onChange={(e) => setTermen(e.target.value)} className="rounded-lg border-2 border-mov/20 p-1.5" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={diferite} onChange={(e) => setDiferite(e.target.checked)} className="accent-mov" /> Exerciții diferite pentru fiecare elev</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} className="accent-mov" /> Test (se poate trimite o singură dată)</label>
      <button type="button" disabled={!tinta || trimite || dezactivat} onClick={salveaza}
        className="rounded-xl bg-mov px-4 py-3 font-bold text-white hover:bg-mov-inchis disabled:opacity-40">{trimite ? "Se salvează…" : "🎮 Atribuie ca joc interactiv"}</button>
      {stare?.eroare && <p className="rounded-lg bg-red-50 p-2 text-red-800">{stare.eroare}</p>}
      {stare?.cod && (
        <div className="rounded-xl bg-green-50 p-3">
          <p>Gata! Elevii intră la <b>Temele mele</b> și scriu codul:</p>
          <p className="my-1 text-center font-mono text-3xl font-bold tracking-widest text-mov">{stare.cod}</p>
          <Link href={`/profesor/teme/${stare.id}`} className="font-semibold text-mov underline">Vezi rezultatele →</Link>
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
