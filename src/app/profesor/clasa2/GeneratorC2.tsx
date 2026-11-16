"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FisaC2 } from "@/componente/FisaC2";
import { JOCURI_LISTA_C2, codificaC2, configC2Implicita, curataC2 } from "@/motor/clasa2/config";
import { genereazaC2 } from "@/motor/clasa2/generator";
import { CAPITOLE_C2, COMPATIBIL, JOCURI_C2, NIVELURI_C2, NR_RAPIDE_C2, type ConfigC2, type NivelC2, type NotiuneC2, type OptiuniC2 } from "@/motor/clasa2/tipuri";
import { seedNou } from "@/motor/rng";
import { creeazaTemaJocC2 } from "@/lib/actiuni-teme";
import { Camp, PanouTema, Sectiune, type Grupa } from "../calcul/GeneratorCalcul";

const CHEIE = "mcs-clasa2";

function Cip({ ales, onClick, children, dezactivat }: { ales: boolean; onClick: () => void; children: React.ReactNode; dezactivat?: boolean }) {
  return <button type="button" disabled={dezactivat} onClick={onClick} className={`rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-30 ${ales ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/20"}`}>{children}</button>;
}

export function GeneratorC2({ grupe, online }: { grupe: Grupa[]; online: boolean }) {
  const [cfg, setCfg] = useState<ConfigC2>(() => configC2Implicita(1));
  const [gata, setGata] = useState(false);
  const [vedere, setVedere] = useState<"elev" | "raspunsuri" | "barem">("elev");
  useEffect(() => {
    try {
      const s = localStorage.getItem(CHEIE);
      setCfg(s ? { ...curataC2(JSON.parse(s)), seed: seedNou(), inlocuiri: {} } : (c) => ({ ...c, seed: seedNou() }));
    } catch { setCfg((c) => ({ ...c, seed: seedNou() })); }
    setGata(true);
  }, []);
  useEffect(() => { if (gata) try { localStorage.setItem(CHEIE, JSON.stringify(cfg)); } catch {} }, [cfg, gata]);

  const nivelFisa: NivelC2 = cfg.nivel === "alege" ? "mediu" : cfg.nivel;
  const { itemi, avertismente } = useMemo(() => genereazaC2(cfg, nivelFisa), [cfg, nivelFisa]);
  const c = useMemo(() => codificaC2(cfg), [cfg]);
  const set = (p: Partial<ConfigC2>) => setCfg((x) => ({ ...x, ...p }));
  const opt = <K extends keyof OptiuniC2>(k: K, v: OptiuniC2[K]) => setCfg((x) => ({ ...x, optiuni: { ...x.optiuni, [k]: v }, inlocuiri: {} }));
  const comuta = (n: NotiuneC2) => { const l = cfg.notiuni.includes(n) ? cfg.notiuni.filter((x) => x !== n) : [...cfg.notiuni, n]; if (l.length) set({ notiuni: l, inlocuiri: {} }); };
  const toggle = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);
  const are = (...n: NotiuneC2[]) => n.some((x) => cfg.notiuni.includes(x));
  const o = cfg.optiuni;
  const compatibile = cfg.notiuni.filter((n) => COMPATIBIL[cfg.joc].includes(n)).length;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[480px_1fr]">
      <aside className="bg-white p-5 shadow-md lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link href="/profesor" className="text-mov">← Fișe pe lecții</Link>
          {online && <Link href="/profesor/teme" className="text-mov">Rezultate →</Link>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-mov">Clasa a II-a: jocuri și fișe</h1>
        <p className="text-sm text-gray-600">Alege noțiunile, jocul și nivelul. Aceleași exerciții ajung pe fișa PDF și în jocul online.</p>

        <Sectiune titlu="1. Noțiuni (una sau mai multe)">
          <div className="grid gap-2">
            {CAPITOLE_C2.map((cap) => (
              <div key={cap.id} className="rounded-2xl border-2 border-mov/10 p-2.5">
                <div className="font-bold text-mov-inchis"><span aria-hidden>{cap.icon}</span> {cap.nume}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {cap.notiuni.map(([n, nume]) => <Cip key={n} ales={cfg.notiuni.includes(n)} onClick={() => comuta(n)}>{nume}{!COMPATIBIL[cfg.joc].includes(n) ? " ·" : ""}</Cip>)}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">„·” = noțiunea nu se joacă în jocul ales (rămâne pentru alt joc).</p>
        </Sectiune>

        <Sectiune titlu="2. Opțiuni de conținut">
          <div className="grid gap-2 text-sm">
            {are("op.adunare", "op.scadere", "op.termen") && (
              <div>Trecerea peste ordin:
                <div className="mt-1 flex flex-wrap gap-1">{(["oricum", "fara", "cu"] as const).map((t) => <Cip key={t} ales={o.trecere === t} onClick={() => opt("trecere", t)}>{t === "fara" ? "fără trecere" : t === "cu" ? "cu trecere" : "oricum (după nivel)"}</Cip>)}</div>
                {o.trecere === "cu" && <div className="mt-1 flex flex-wrap gap-1">{(["zeci", "sute", "ambele"] as const).map((t) => <Cip key={t} ales={o.trecereLa === t} onClick={() => opt("trecereLa", t)}>la {t}</Cip>)}</div>}
              </div>
            )}
            {are("op.termen") && <div>Forma necunoscutei:<div className="mt-1 flex flex-wrap gap-1">{(["a+x=b", "x+a=b", "x-a=b", "a-x=b"] as const).map((f) => <Cip key={f} ales={o.forme.includes(f)} onClick={() => { const l = toggle(o.forme, f); if (l.length) opt("forme", l); }}>{f.replace("x", "□").replace("-", "−")}</Cip>)}</div></div>}
            {are("op.tabla", "op.impartire", "op.comutativ") && <div>Tablele:<div className="mt-1 flex flex-wrap gap-1">{[2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => <Cip key={t} ales={o.table.includes(t)} onClick={() => { const l = toggle(o.table, t); if (l.length) opt("table", l.sort((a, b) => a - b)); }}>{t}</Cip>)}</div></div>}
            {are("op.dublu") && <div>Dublul / triplul / jumătatea / sfertul:<div className="mt-1 flex flex-wrap gap-1">{(["dublul", "triplul", "jumatatea", "sfertul"] as const).map((f) => <Cip key={f} ales={o.dublu.includes(f)} onClick={() => { const l = toggle(o.dublu, f); if (l.length) opt("dublu", l); }}>{f === "jumatatea" ? "jumătatea" : f}</Cip>)}</div></div>}
            {are("num.rotunjire") && <div>Rotunjire:<div className="mt-1 flex flex-wrap gap-1">{([10, 100, 0] as const).map((r) => <Cip key={r} ales={o.rotunjireLa === r} onClick={() => opt("rotunjireLa", r)}>{r === 0 ? "la zeci și la sute" : r === 10 ? "la zeci" : "la sute"}</Cip>)}</div></div>}
            {are("fr.parte", "fr.din") && <div>Fracții:<div className="mt-1 flex flex-wrap gap-1">{(["1/2", "1/4", "1/3"] as const).map((f) => <Cip key={f} ales={o.fractii.includes(f)} onClick={() => { const l = toggle(o.fractii, f); if (l.length) opt("fractii", l); }}>{f}{f === "1/3" ? " (Provocare)" : ""}</Cip>)}</div></div>}
            {are("timp.ceas") && <div>Ceasul:<div className="mt-1 flex flex-wrap gap-1">{([60, 30, 15] as const).map((p) => <Cip key={p} ales={o.timpPas === p} onClick={() => opt("timpPas", p)}>{p === 60 ? "ore fixe" : p === 30 ? "+ jumătăți" : "+ sferturi"}</Cip>)}</div></div>}
            {are("bani.numara", "bani.rest") && <label className="flex items-center gap-2">Suma maximă: <input type="number" min={5} max={100} value={o.baniMax} onChange={(e) => opt("baniMax", Math.min(100, Math.max(5, Number(e.target.value) || 100)))} className="w-20 rounded-lg border-2 border-mov/20 p-1" /> lei</label>}
          </div>
        </Sectiune>

        <Sectiune titlu="3. Jocul">
          <div className="grid grid-cols-2 gap-2">
            {JOCURI_LISTA_C2.map((j) => {
              const n = cfg.notiuni.filter((x) => COMPATIBIL[j].includes(x)).length;
              return (
                <button key={j} type="button" onClick={() => set({ joc: j })} className={`rounded-2xl border-2 p-2.5 text-left ${cfg.joc === j ? "border-mov bg-mov text-white" : "border-mov/15 hover:bg-mov-deschis"} ${n ? "" : "opacity-50"}`}>
                  <span className="text-2xl" aria-hidden>{JOCURI_C2[j].icon}</span> <span className="font-bold">{JOCURI_C2[j].nume}</span>
                  <span className={`block text-xs ${cfg.joc === j ? "text-white/90" : "text-gray-600"}`}>{n ? `${n} noțiuni potrivite` : "nicio noțiune potrivită"}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-gray-500">În curând: Provocarea în imagini, Integrama, Ținte.</p>
          {cfg.joc === "ordonare" && <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">Sensul: {(["ambele", "crescator", "descrescator"] as const).map((x) => <Cip key={x} ales={o.sens === x} onClick={() => opt("sens", x)}>{x === "ambele" ? "amestecat" : x === "crescator" ? "crescător" : "descrescător"}</Cip>)}</div>}
          {cfg.joc === "balanta" && <p className="mt-2 text-xs text-gray-500">„Numărul care lipsește” (și adunarea la Provocare) apare ca „echilibrează balanța” cu greutăți.</p>}
          {cfg.joc === "ceas" && <p className="mt-2 text-xs text-gray-500">Ușor: citește ora (fix și jumătate). Mediu și Provocare: și „mută acele”; sferturile apar cu opțiunea „+ sferturi” de la Ceasul.</p>}
          {cfg.joc === "magazin" && <p className="mt-2 text-xs text-gray-500">Plătește exact, „Câți bani sunt?” și „Cât rest primești?”. Ușor: doar lei, până la 20; Provocare: și monede de 1, 5, 10, 50 de bani.</p>}
          {cfg.joc === "memorie" && <p className="mt-2 text-xs text-gray-500">Memorie e joc de explorare: fără inimi; 8 perechi pe tablă (10 la Provocare).</p>}
          {cfg.joc === "scara" && <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">Răspuns: <Cip ales={cfg.modScara === "variante"} onClick={() => set({ modScara: "variante" })}>variante (butoane)</Cip><Cip ales={cfg.modScara === "tastatura"} onClick={() => set({ modScara: "tastatura" })}>tastatură</Cip></div>}
        </Sectiune>

        <Sectiune titlu="4. Nivel, vieți, număr">
          <div className="flex flex-wrap gap-1 text-sm">
            {(Object.keys(NIVELURI_C2) as NivelC2[]).map((n) => <Cip key={n} ales={cfg.nivel === n} onClick={() => set({ nivel: n })}>{NIVELURI_C2[n].icon} {NIVELURI_C2[n].nume}</Cip>)}
            <Cip ales={cfg.nivel === "alege"} onClick={() => set({ nivel: "alege" })}>copilul alege</Cip>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">Vieți: {([3, 5, 0] as const).map((v) => <Cip key={v} ales={cfg.vieti === v} onClick={() => set({ vieti: v })}>{v ? `${v} ❤️` : "fără (sprijin)"}</Cip>)}</div>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {NR_RAPIDE_C2.map((n) => <button key={n} type="button" onClick={() => set({ nr: n })} className={`rounded-xl py-2 font-bold ${cfg.nr === n ? "bg-mov text-white" : "bg-mov-deschis text-mov"}`}>{n}</button>)}
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">Alt număr (5–100): <input type="number" min={5} max={100} value={cfg.nr} onChange={(e) => { const n = Number(e.target.value); if (n >= 5 && n <= 100) set({ nr: n }); }} className="w-20 rounded-lg border-2 border-mov/20 p-1" /></label>
        </Sectiune>

        <Sectiune titlu="5. Antet și fișa PDF">
          <Camp eticheta="Titlu" valoare={cfg.antet.titlu} onChange={(v) => set({ antet: { ...cfg.antet, titlu: v } })} />
          <Camp eticheta="Centrul / școala" valoare={cfg.antet.centru} onChange={(v) => set({ antet: { ...cfg.antet, centru: v } })} />
          <button type="button" onClick={() => set({ seed: seedNou(), inlocuiri: {} })} className="w-full rounded-xl bg-galben px-4 py-3 font-bold text-mov-inchis hover:brightness-95">🎲 Alte exerciții</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a href={`/api/pdf-clasa2?c=${c}&mod=fisa`} className="rounded-xl bg-mov px-3 py-3 text-center font-bold text-white hover:bg-mov-inchis">⬇️ Descarcă fișa PDF</a>
            <a href={`/api/pdf-clasa2?c=${c}&mod=${encodeURIComponent("fisa+barem")}`} className="rounded-xl bg-mov-inchis px-3 py-3 text-center font-bold text-white hover:bg-mov">⬇️ Fișa + barem</a>
          </div>
          <a href={`/elev/clasa2/joc?c=${c}&preview=1`} target="_blank" className="mt-2 block rounded-xl border-2 border-dashed border-mov px-3 py-2 text-center font-semibold text-mov hover:bg-mov-deschis">▶ Previzualizează ca elev</a>
          {cfg.nivel === "alege" && <p className="mt-1 text-xs text-gray-500">Fișa se tipărește la nivelul Mediu; în joc, copilul își alege nivelul.</p>}
        </Sectiune>

        <Sectiune titlu="6. Trimite ca joc">
          {online ? <PanouTema c={c} titluImplicit={`${JOCURI_C2[cfg.joc].nume} – clasa a II-a`} grupe={grupe} dezactivat={!compatibile || !itemi.length} actiune={creeazaTemaJocC2} etichetaTrimite="🎮 Trimite jocul elevilor" />
            : <p className="rounded-lg bg-galben-deschis p-3 text-sm">Jocurile ca temă funcționează când aplicația are conturi. Previzualizarea merge oricum.</p>}
        </Sectiune>
      </aside>

      <main className="p-4 sm:p-8">
        <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2">
          {([["elev", "Fișa elevului"], ["raspunsuri", "Cu răspunsuri"], ["barem", "Barem"]] as const).map(([v, t]) => (
            <button key={v} type="button" onClick={() => setVedere(v)} className={`rounded-full px-4 py-1.5 font-semibold ${vedere === v ? "bg-mov text-white" : "bg-white text-mov ring-1 ring-mov/30"}`}>{t}</button>
          ))}
          <span className="ml-auto text-sm text-gray-600">{itemi.length} exerciții · nivel {NIVELURI_C2[nivelFisa].nume}</span>
        </div>
        {avertismente.length > 0 && <div className="mx-auto mb-4 max-w-[210mm] rounded-2xl bg-galben-deschis p-3 text-sm">{avertismente.map((a) => <p key={a}>⚠️ {a}</p>)}</div>}
        {gata && itemi.length > 0 && <FisaC2 cfg={cfg} itemi={itemi} mod={vedere === "barem" ? "barem" : "fisa"} cuRaspunsuri={vedere === "raspunsuri"} onRegenereaza={vedere === "barem" ? undefined : (id) => setCfg((x) => ({ ...x, inlocuiri: { ...x.inlocuiri, [id]: (x.inlocuiri[id] ?? 0) + 1 } }))} />}
      </main>
    </div>
  );
}
