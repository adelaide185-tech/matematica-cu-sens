/* eslint-disable @next/next/no-img-element */
import type { ConfigCalcul, ExCalcul } from "@/motor/calcul/tipuri";
import { coloaneFisa, fmt, textRaspuns } from "@/motor/calcul/generator";

export type ModFisaCalcul = "fisa" | "fisa+barem" | "barem";

/** Fișa de calcul A4: antet, exerciții pe 2–4 coloane și (opțional) pagina cu baremul. */
export function FisaCalcul({ cfg, exercitii, mod = "fisa", cuRaspunsuri = false, onRegenereaza }: {
  cfg: ConfigCalcul;
  exercitii: ExCalcul[];
  mod?: ModFisaCalcul;
  /** previzualizare pentru profesor: răspunsurile apar cu roșu pe fișă */
  cuRaspunsuri?: boolean;
  onRegenereaza?: (id: string) => void;
}) {
  const col = coloaneFisa(cfg, exercitii);
  // rândurile umplu prima pagină (spațiu de scris generos la fișele scurte); fișele lungi trec pe mai multe pagini
  const randuri = Math.ceil(exercitii.length / col);
  const inaltime = Math.max(9, Math.min(24, 212 / Math.max(1, randuri)));
  return (
    <div className="fc-document">
      {mod !== "barem" && (
        <article className={`fc fc-col${col}`}>
          <Antet cfg={cfg} />
          <ol className="fc-itemi" style={{ gridTemplateColumns: `repeat(${col}, minmax(0, 1fr))` }}>
            {exercitii.map((e, i) => (
              <li key={e.id} className={`fc-item ${e.coloana ? "fc-item-coloana" : ""}`} style={{ minHeight: `${inaltime}mm` }}>
                <span className="fc-nr">{i + 1}.</span>
                {e.coloana ? <Coloana e={e} raspuns={cuRaspunsuri} simbol={cfg.simbolInmultire} /> : <Orizontal e={e} raspuns={cuRaspunsuri} />}
                {onRegenereaza && (
                  <button type="button" onClick={() => onRegenereaza(e.id)} title="Alt exercițiu în locul acestuia"
                    className="fc-regen nu-printa" aria-label={`Regenerează exercițiul ${i + 1}`}>↻</button>
                )}
              </li>
            ))}
          </ol>
          <footer className="fc-subsol">Fabrica de Inteligență · Matematică cu Sens · cod fișă {cfg.seed} · {exercitii.length} exerciții</footer>
        </article>
      )}
      {mod !== "fisa" && (
        <article className="fc fc-barem">
          <header className="fc-antet-barem">
            <h1>Barem de corectare</h1>
            <p>{cfg.antet.titlu} · cod fișă <b>{cfg.seed}</b> · {exercitii.length} exerciții</p>
          </header>
          <ol className="fc-raspunsuri">
            {exercitii.map((e, i) => (
              <li key={e.id}><span className="fc-nr">{i + 1}.</span> {e.inainte ? `${e.inainte} ` : ""}<b>{textRaspuns(e)}</b></li>
            ))}
          </ol>
          <footer className="fc-subsol">Punctaj: 1 punct pentru fiecare exercițiu corect · total {exercitii.length} puncte</footer>
        </article>
      )}
    </div>
  );
}

function Antet({ cfg }: { cfg: ConfigCalcul }) {
  const a = cfg.antet;
  return (
    <header className="fc-antet">
      <div className="fc-antet-sus">
        {a.logo && <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="fc-logo" />}
        <div className="fc-antet-text">
          {a.centru && <div className="fc-centru">{a.centru}</div>}
          {a.profesor && <div>Profesor: {a.profesor}</div>}
        </div>
      </div>
      <h1 className="fc-titlu">{a.titlu}</h1>
      <div className="fc-campuri">
        <span>Numele și prenumele: <span className="fc-linie fc-linie-lunga" /></span>
        <span>Data: {a.data ? <b>{a.data}</b> : <span className="fc-linie" />}</span>
        <span>Timp de lucru: {a.timp ? <b>{a.timp}</b> : <span className="fc-linie" />}</span>
      </div>
    </header>
  );
}

function Orizontal({ e, raspuns }: { e: ExCalcul; raspuns: boolean }) {
  const r = e.raspuns;
  const gol = (t: string) => (raspuns ? <span className="fc-r">{t}</span> : <span className="fc-linie" />);
  return (
    <span className="fc-text">
      {e.text}{" "}
      {e.inainte && <span className="fc-inainte">{e.inainte} </span>}
      {r.tip === "rest" ? <>{gol(fmt(r.cat))} rest {gol(fmt(r.rest))}</> : gol(fmt(r.valoare))}
    </span>
  );
}

function Coloana({ e, raspuns, simbol }: { e: ExCalcul; raspuns: boolean; simbol: string }) {
  const { numere, op } = e.coloana!;
  const r = e.raspuns.tip === "numar" ? fmt(e.raspuns.valoare) : "";
  return (
    <span className="fc-col-calc">
      {numere.map((n, i) => (
        <span key={i} className="fc-col-rand"><span className="fc-col-op">{i === numere.length - 1 ? (op === "-" ? "−" : op === "×" ? simbol : op) : ""}</span>{fmt(n)}</span>
      ))}
      <span className="fc-col-bara" />
      <span className={`fc-col-rand fc-col-rez ${op === "×" && Math.min(...numere) > 9 ? "fc-col-lung" : ""}`}>{raspuns ? <span className="fc-r">{r}</span> : " "}</span>
    </span>
  );
}
