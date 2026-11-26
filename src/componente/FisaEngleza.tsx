/* eslint-disable @next/next/no-img-element */
import type { Cuvant } from "@/engleza/continut";
import { TIPURI_FISA_EN, scriptEducatoare, type ConfigFisaEn, type SectiuneEn } from "@/engleza/fise";

/** Imaginea pentru hârtie: emoji; în mod „umbră”: siluetă neagră; „de colorat”: gri deschis. */
function Poza({ c, marime = 15, mod = "normal", color }: { c: Cuvant; marime?: number; mod?: "normal" | "umbra" | "colorat"; color: boolean }) {
  const filtru = mod === "umbra" ? "brightness(0)" : mod === "colorat" ? "grayscale(1) opacity(0.28)" : color ? "none" : "grayscale(1)";
  if (c.numar)
    return <span className="fe-poza" style={{ fontSize: `${c.numar > 5 ? marime * 0.38 : marime * 0.5}mm`, filter: filtru, display: "inline-grid", gridTemplateColumns: `repeat(${Math.min(5, c.numar)}, auto)` }} aria-label={c.en}>{Array.from({ length: c.numar }, (_, i) => <span key={i}>{c.emoji}</span>)}</span>;
  if (c.culoare && mod === "normal")
    return <span className="fe-pata" style={{ width: `${marime}mm`, height: `${marime}mm`, background: color ? c.culoare : "#fff" }} aria-label={c.en}>{!color && <b>{c.en}</b>}</span>;
  return <span className="fe-poza" style={{ fontSize: `${marime}mm`, filter: filtru }} aria-label={c.en}>{c.emoji}</span>;
}

function Cerinta({ s, nr }: { s: SectiuneEn; nr: number }) {
  const t = TIPURI_FISA_EN[s.tip];
  return (
    <h2 className="fe-cerinta">
      <span className="fe-nr">{nr}</span>
      <span className="fe-picto" aria-hidden>{t.icon}</span>
      <span><b>{t.en}</b> <span className="fe-ro">{t.ro}</span></span>
    </h2>
  );
}

function Sectiune({ s, nr, color, onRegenereaza }: { s: SectiuneEn; nr: number; color: boolean; onRegenereaza?: (id: string) => void }) {
  let corp: React.ReactNode = null;
  switch (s.tip) {
    case "asculta":
      corp = (
        <ol className="fe-randuri">
          {s.randuri.map((r, i) => (
            <li key={i} className="fe-rand"><span className="fe-nrmic">{i + 1}</span>{r.variante.map((c, j) => <span key={j} className="fe-celula"><Poza c={c} color={color} /></span>)}</li>
          ))}
        </ol>
      );
      break;
    case "umbre":
      corp = (
        <div className="fe-umbre">
          <div className="fe-col">{s.stanga.map((c, i) => <div key={i} className="fe-umbra-rand"><Poza c={c} color={color} marime={14} /><span className="fe-punct" /></div>)}</div>
          <div className="fe-col">{s.dreapta.map((c, i) => <div key={i} className="fe-umbra-rand"><span className="fe-punct" /><Poza c={c} color={color} marime={14} mod="umbra" /><span className="fe-nrmic">{i + 1}</span></div>)}</div>
        </div>
      );
      break;
    case "coloreaza":
      corp = (
        <div className="fe-grila3">
          {s.itemi.map((x, i) => (
            <div key={i} className="fe-colorat">
              <Poza c={x.c} color={color} marime={26} mod="colorat" />
              <span className="fe-indiciu-culoare"><Poza c={x.culoare} color={color} marime={7} /> <b>{x.culoare.en}</b></span>
            </div>
          ))}
        </div>
      );
      break;
    case "numara":
      corp = (
        <div className="fe-grila2">
          {s.itemi.map((x, i) => (
            <div key={i} className="fe-numara">
              <span className="fe-grup" style={{ gridTemplateColumns: `repeat(${Math.min(5, x.n)}, auto)` }}>{Array.from({ length: x.n }, (_, k) => <span key={k} style={{ filter: color ? "none" : "grayscale(1)" }}>{x.c.emoji}</span>)}</span>
              <span className="fe-optiuni">{x.variante.map((n) => <span key={n} className="fe-cifra">{n}</span>)}</span>
            </div>
          ))}
        </div>
      );
      break;
    case "intrus":
      corp = (
        <ol className="fe-randuri">
          {s.randuri.map((r, i) => <li key={i} className="fe-rand"><span className="fe-nrmic">{i + 1}</span>{r.imagini.map((c, j) => <span key={j} className="fe-celula"><Poza c={c} color={color} /></span>)}</li>)}
        </ol>
      );
      break;
    case "traseaza":
      corp = (
        <div className="fe-traseaza">
          {s.itemi.map((c, i) => (
            <div key={i} className="fe-trasare">
              <Poza c={c} color={color} marime={13} />
              <svg viewBox={`0 0 ${Math.max(120, c.en.length * 34)} 60`} className="fe-litere" aria-label={`Scrie peste: ${c.en}`}>
                <line x1="0" y1="50" x2="100%" y2="50" stroke="#999" strokeWidth="0.8" />
                <line x1="0" y1="20" x2="100%" y2="20" stroke="#ddd" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x="4" y="49" fontSize="48" fontFamily="'Comic Sans MS', 'Nunito', sans-serif" fill="none" stroke="#777" strokeWidth="1.3" strokeDasharray="2.5 2.5">{c.en}</text>
              </svg>
            </div>
          ))}
        </div>
      );
      break;
  }
  return (
    <section className="fe-sectiune">
      <Cerinta s={s} nr={nr} />
      {corp}
      {onRegenereaza && <button type="button" onClick={() => onRegenereaza(s.id)} className="fc-regen nu-printa" title="Alte imagini pentru acest exercițiu" aria-label={`Regenerează exercițiul ${nr}`}>↻</button>}
    </section>
  );
}

export type ModFisaEn = "fisa" | "educatoare" | "ambele";

/** Fișa copilului (A4) și „Fișa educatoarei” (ce se citește cu voce tare + răspunsurile). */
export function FisaEngleza({ cfg, sectiuni, mod = "ambele", onRegenereaza }: { cfg: ConfigFisaEn; sectiuni: SectiuneEn[]; mod?: ModFisaEn; onRegenereaza?: (id: string) => void }) {
  const a = cfg.antet;
  return (
    <div className="fc-document">
      {mod !== "educatoare" && (
        <article className="fc fe">
          <header className="fc-antet">
            <div className="fc-antet-sus">
              <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="fc-logo" />
              <div className="fc-antet-text">
                {a.gradinita && <div className="fc-centru">{a.gradinita}</div>}
                {a.educatoare && <div>Educatoare: {a.educatoare}</div>}
                <div>English · {cfg.varsta} ani</div>
              </div>
            </div>
            <h1 className="fc-titlu">{a.titlu}</h1>
            <div className="fc-campuri"><span>Name / Numele: <span className="fc-linie fc-linie-lunga" /></span><span>Data: {a.data ? <b>{a.data}</b> : <span className="fc-linie" />}</span><span className="fe-fata">🙂 😐 🙁</span></div>
          </header>
          {sectiuni.map((s, i) => <Sectiune key={s.id} s={s} nr={i + 1} color={cfg.color} onRegenereaza={onRegenereaza} />)}
          <footer className="fc-subsol">Fabrica de Inteligență · English 4–6 ani · cod fișă {cfg.seed}</footer>
        </article>
      )}
      {mod !== "fisa" && (
        <article className="fc fc-barem fe-educatoare">
          <header className="fc-antet-barem">
            <h1>Fișa educatoarei · {a.titlu}</h1>
            <p>Citiți cu voce tare, rar, de 2 ori. Copiii lucrează pe fișă, apoi verificați împreună. Cod fișă <b>{cfg.seed}</b> · {cfg.varsta} ani</p>
          </header>
          {sectiuni.map((s, i) => (
            <section key={s.id} className="fe-script">
              <h2><span className="fe-nr">{i + 1}</span> {TIPURI_FISA_EN[s.tip].en} <span className="fe-ro">{TIPURI_FISA_EN[s.tip].ro}</span></h2>
              <ol>{scriptEducatoare(s).map((x, k) => <li key={k}><span className="fe-spune">🗣️ „{x.spune}”</span> <span className="fe-raspuns">✓ {x.raspuns}</span></li>)}</ol>
            </section>
          ))}
          <footer className="fc-subsol">Fișa educatoarei · nu se dă copiilor</footer>
        </article>
      )}
    </div>
  );
}
