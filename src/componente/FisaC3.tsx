/* eslint-disable @next/next/no-img-element */
import type { ConfigC3, ItemC3 } from "@/motor/clasa3/tipuri";
import { JOCURI_C3 } from "@/motor/clasa3/tipuri";
import { Fractie } from "@/componente/svg/Vizual";
import { Caroiaj, FataC3, FiguraC3, TextMate } from "@/jocuri/c3/Vizuale";
import type { ModFisaCalcul } from "./FisaCalcul";

/** Coloanele fișei: exercițiile cu desen sau text lung merg pe 2 coloane. */
export function coloaneC3(cfg: Pick<ConfigC3, "coloane">, itemi: ItemC3[]): 2 | 3 | 4 {
  if (cfg.coloane !== "auto") return cfg.coloane;
  const lung = Math.max(0, ...itemi.map((e) => (e.figura || e.fractie || e.st?.fractie || e.raspuns.tip === "construit" ? 40 : e.text.length)));
  if (lung > 26) return 2;
  const n = itemi.length;
  return n <= 12 ? 2 : n <= 30 || lung > 17 ? 3 : 4;
}

/** Fișa de clasa a III-a: aceleași exerciții ca în joc, pe A4, cu barem pe pagină separată. */
export function FisaC3({ cfg, itemi, mod = "fisa", cuRaspunsuri = false, onRegenereaza }: {
  cfg: ConfigC3; itemi: ItemC3[]; mod?: ModFisaCalcul; cuRaspunsuri?: boolean; onRegenereaza?: (id: string) => void;
}) {
  const col = coloaneC3(cfg, itemi);
  const randuri = Math.ceil(itemi.length / col);
  const cuDesene = itemi.some((e) => e.figura || e.fractie || e.raspuns.tip === "construit");
  const inaltime = cuDesene ? 10 : Math.max(10, Math.min(26, 212 / Math.max(1, randuri)));
  const a = cfg.antet;
  return (
    <div className="fc-document">
      {mod !== "barem" && (
        <article className={`fc fc-col${col}`}>
          <header className="fc-antet">
            <div className="fc-antet-sus">
              {a.logo && <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="fc-logo" />}
              <div className="fc-antet-text">
                {a.centru && <div className="fc-centru">{a.centru}</div>}
                {a.profesor && <div>Profesor: {a.profesor}</div>}
                <div>Clasa a III-a · {JOCURI_C3[cfg.joc].nume}</div>
              </div>
            </div>
            <h1 className="fc-titlu">{a.titlu}</h1>
            <div className="fc-campuri">
              <span>Numele și prenumele: <span className="fc-linie fc-linie-lunga" /></span>
              <span>Data: {a.data ? <b>{a.data}</b> : <span className="fc-linie" />}</span>
              <span>Timp de lucru: {a.timp ? <b>{a.timp}</b> : <span className="fc-linie" />}</span>
            </div>
            {cfg.joc === "balanta" && <p className="fc-instructiune">Completează cu semnul potrivit: &lt;, = sau &gt;.</p>}
            {cfg.joc === "memory" && <p className="fc-instructiune">Calculează și scrie rezultatul.</p>}
          </header>
          <ol className="fc-itemi" style={{ gridTemplateColumns: `repeat(${col}, minmax(0, 1fr))` }}>
            {itemi.map((e, i) => (
              <li key={e.id} className="fc-item fc-item-c3" style={{ minHeight: `${inaltime}mm` }}>
                <span className="fc-nr">{i + 1}.</span>
                <ItemPrint e={e} raspuns={cuRaspunsuri} />
                {onRegenereaza && (
                  <button type="button" onClick={() => onRegenereaza(e.id)} title="Alt exercițiu în locul acestuia" className="fc-regen nu-printa" aria-label={`Regenerează exercițiul ${i + 1}`}>↻</button>
                )}
              </li>
            ))}
          </ol>
          <footer className="fc-subsol">Fabrica de Inteligență · Matematică cu Sens · clasa a III-a · cod fișă {cfg.seed} · {itemi.length} exerciții</footer>
        </article>
      )}
      {mod !== "fisa" && (
        <article className="fc fc-barem">
          <header className="fc-antet-barem">
            <h1>Barem de corectare</h1>
            <p>{a.titlu} · clasa a III-a · cod fișă <b>{cfg.seed}</b> · {itemi.length} exerciții</p>
          </header>
          <ol className="fc-raspunsuri fc-raspunsuri-c3">
            {itemi.map((e, i) => (
              <li key={e.id}><span className="fc-nr">{i + 1}.</span> <b><TextMate text={e.afis} /></b></li>
            ))}
          </ol>
          <footer className="fc-subsol">Punctaj: 1 punct pentru fiecare exercițiu corect · total {itemi.length} puncte</footer>
        </article>
      )}
    </div>
  );
}

function ItemPrint({ e, raspuns }: { e: ItemC3; raspuns: boolean }) {
  const R = () => (raspuns ? <span className="fc-r"><TextMate text={e.afis} /></span> : <span className="fc-linie" />);
  const desen = e.figura ? <FiguraC3 f={e.figura} marime={0.62} /> : e.fractie && e.raspuns.tip !== "colorare" ? <Fractie forma={e.fractie.forma} parti={e.fractie.parti} colorate={e.fractie.colorate} marime={0.5} /> : null;
  let corp: React.ReactNode;
  if (e.fel === "pereche") corp = <span className="fc-text"><FataC3 f={e.st!} marime={0.45} /> = {R()}</span>;
  else if (e.fel === "comparatie" || e.text.includes("○")) corp = <span className="fc-text"><TextMate text={e.text.replace("○", raspuns ? `‹${e.afis}›` : "○")} /></span>;
  else if (e.raspuns.tip === "construit") corp = <span className="fc-text fc-wrap"><TextMate text={e.text} />{raspuns ? <> {R()}</> : <span className="fc-caroiaj"><Caroiaj /></span>}</span>;
  else if (e.raspuns.tip === "colorare") corp = <span className="fc-text fc-wrap"><TextMate text={e.text} /> <span className="fc-caroiaj"><Fractie forma={e.fractie!.forma} parti={e.fractie!.parti} colorate={raspuns ? e.raspuns.cerut : 0} marime={0.5} /></span></span>;
  else if (e.text.includes("□") && !e.text.startsWith("Pune")) corp = <span className="fc-text"><TextMate text={e.text} /> <span className="fc-inainte"><TextMate text="□ =" /></span> {raspuns ? <span className="fc-r">{e.afis.replace("□ = ", "")}</span> : <span className="fc-linie" />}</span>;
  else if (e.raspuns.tip === "rest") corp = <span className="fc-text"><TextMate text={e.text} /> {raspuns ? <span className="fc-r">{e.afis}</span> : <><span className="fc-linie" /> rest <span className="fc-linie" /></>}</span>;
  else corp = <span className={`fc-text ${e.text.length > 30 ? "fc-wrap" : ""}`}><TextMate text={e.text} /> {R()}</span>;
  return desen ? <span className="fc-cu-desen">{desen}{corp}</span> : corp;
}
