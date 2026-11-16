/* eslint-disable @next/next/no-img-element */
import type { ConfigC2, ItemC2 } from "@/motor/clasa2/tipuri";
import { JOCURI_C2 } from "@/motor/clasa2/tipuri";
import { TextMate } from "@/jocuri/c3/Vizuale";
import { VizualC2View } from "@/jocuri/c2/JocC2";
import type { ModFisaCalcul } from "./FisaCalcul";

/** Fișa de clasa a II-a: font mare, 2–3 coloane, aceleași exerciții ca în joc; baremul pe pagină separată. */
export function FisaC2({ cfg, itemi, mod = "fisa", cuRaspunsuri = false, onRegenereaza }: {
  cfg: ConfigC2; itemi: ItemC2[]; mod?: ModFisaCalcul; cuRaspunsuri?: boolean; onRegenereaza?: (id: string) => void;
}) {
  const cuDesene = itemi.some((e) => e.vizual);
  const lung = Math.max(0, ...itemi.map((e) => (e.st ?? e.text).length));
  const col = cfg.coloane !== "auto" ? cfg.coloane : cuDesene || lung > 28 ? 2 : itemi.length <= 12 ? 2 : 3;
  const randuri = Math.ceil(itemi.length / col);
  const inaltime = cuDesene ? 12 : Math.max(12, Math.min(28, 212 / Math.max(1, randuri)));
  const a = cfg.antet;
  return (
    <div className="fc-document">
      {mod !== "barem" && (
        <article className={`fc fc-c2 fc-col${col}`}>
          <header className="fc-antet">
            <div className="fc-antet-sus">
              {a.logo && <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="fc-logo" />}
              <div className="fc-antet-text">
                {a.centru && <div className="fc-centru">{a.centru}</div>}
                {a.profesor && <div>Profesor: {a.profesor}</div>}
                <div>Clasa a II-a · {JOCURI_C2[cfg.joc].nume}</div>
              </div>
            </div>
            <h1 className="fc-titlu">{a.titlu}</h1>
            <div className="fc-campuri">
              <span>Numele: <span className="fc-linie fc-linie-lunga" /></span>
              <span>Data: {a.data ? <b>{a.data}</b> : <span className="fc-linie" />}</span>
            </div>
            {cfg.joc === "casute" && <p className="fc-instructiune">Completează căsuțele.</p>}
            {cfg.joc === "perechi" && <p className="fc-instructiune">Scrie rezultatul.</p>}
          </header>
          <ol className="fc-itemi" style={{ gridTemplateColumns: `repeat(${col}, minmax(0, 1fr))` }}>
            {itemi.map((e, i) => (
              <li key={e.id} className="fc-item fc-item-c3" style={{ minHeight: `${inaltime}mm` }}>
                <span className="fc-nr">{i + 1}.</span>
                <span className="fc-cu-desen">
                  {e.vizual && <VizualC2View v={e.vizual} marime={0.55} />}
                  <span className={`fc-text ${e.text.length > 30 ? "fc-wrap" : ""}`}>
                    {e.raspuns.tip === "casute"
                      ? <TextMate text={cuRaspunsuri ? e.text.replace(/□/g, "▢") + `  (${e.afis})` : e.text} />
                      : <><TextMate text={e.raspuns.tip === "pereche" && !e.vizual && !e.text.includes("…") ? `${e.st} =` : e.text.replace(/ …$/, "").replace(" … ", " ___ ")} /> {cuRaspunsuri ? <span className="fc-r"><TextMate text={e.afis} /></span> : <span className="fc-linie" />}</>}
                  </span>
                </span>
                {onRegenereaza && <button type="button" onClick={() => onRegenereaza(e.id)} title="Alt exercițiu" className="fc-regen nu-printa" aria-label={`Regenerează exercițiul ${i + 1}`}>↻</button>}
              </li>
            ))}
          </ol>
          <footer className="fc-subsol">Fabrica de Inteligență · Matematică cu Sens · clasa a II-a · cod fișă {cfg.seed} · {itemi.length} exerciții</footer>
        </article>
      )}
      {mod !== "fisa" && (
        <article className="fc fc-barem">
          <header className="fc-antet-barem"><h1>Barem de corectare</h1><p>{a.titlu} · clasa a II-a · cod fișă <b>{cfg.seed}</b></p></header>
          <ol className="fc-raspunsuri fc-raspunsuri-c3">
            {itemi.map((e, i) => <li key={e.id}><span className="fc-nr">{i + 1}.</span> <b><TextMate text={e.afis} /></b></li>)}
          </ol>
          <footer className="fc-subsol">1 punct pentru fiecare exercițiu corect · total {itemi.length} puncte</footer>
        </article>
      )}
    </div>
  );
}
