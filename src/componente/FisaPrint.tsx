import type { Fisa } from "@/motor/fisa";
import type { Cerinta, Item } from "@/motor/tipuri";
import { NIVELURI } from "@/motor/tipuri";
import { LITERE } from "@/motor/generatoare/comun";
import { NUME_CLASA } from "@/curriculum";
import { Vizual } from "./svg/Vizual";
import { VizualExercitiu } from "@/antrenament/mecanici/Mecanici";

export interface Antet {
  scoala?: string;
  profesor?: string;
  data?: string;
  titlu: string;
}

/** Fișa A4 gata de printat. `rezolvari` = varianta pentru profesor (răspunsuri + pași + barem). */
export function FisaPrint({ fisa, antet, rezolvari, albNegru }: { fisa: Fisa; antet: Antet; rezolvari: boolean; albNegru: boolean }) {
  const nivel = NIVELURI.find((n) => n.id === fisa.config.nivel)!;
  const culoare = albNegru ? "#222" : nivel.culoare;
  const evaluare = fisa.config.nivel === "evaluare";
  const cl5 = fisa.config.clasa === 5;
  return (
    <article className="fisa" style={{ ["--accent" as string]: culoare }}>
      <header className="fisa-antet">
        <div className="fisa-antet-sus">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-orizontal.jpg" alt="Fabrica de Inteligență" className="fisa-logo" style={albNegru ? { filter: "grayscale(1)" } : undefined} />
          <div className="fisa-meta">
            {antet.scoala && <div>{antet.scoala}</div>}
            {antet.profesor && <div>Prof. {antet.profesor}</div>}
            <div>{NUME_CLASA[fisa.config.clasa]}{antet.data ? ` · ${antet.data}` : ""}</div>
          </div>
        </div>
        <div className="fisa-nume">Numele și prenumele: <span className="linie lunga" /></div>
        <h1 className="fisa-titlu">
          {antet.titlu}
          <span className="fisa-nivel">{rezolvari ? "Rezolvări și barem · " : ""}{nivel.nume}</span>
        </h1>
      </header>

      <ol className="fisa-itemi">
        {fisa.itemi.map((it, i) => (
          <ItemFisa key={i} item={it} nr={i + 1} rezolvari={rezolvari} arataPunctaj={evaluare} />
        ))}
      </ol>

      {evaluare && (
        <section className="fisa-barem">
          {rezolvari ? (
            <>
              <h2>Barem de corectare și descriptori de performanță</h2>
              <p>Punctaj total pe itemi: <b>{fisa.puncteMaxime} puncte</b>{cl5 ? " (se adaugă 10 puncte din oficiu)" : ""}. Fiecare cerință corectă primește punctajul indicat; răspunsurile parțiale se punctează proporțional.</p>
              <table>
                <tbody>
                  {fisa.descriptori.map((d) => (
                    <tr key={d.eticheta}><th>{d.eticheta}</th><td>{d.text}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="fisa-rezultat">
              Punctaj: ______ / {fisa.puncteMaxime} &nbsp;&nbsp; {cl5 ? "Nota: ______" : "Calificativ: ______"}
            </div>
          )}
        </section>
      )}
      <footer className="fisa-subsol">Fabrica de Inteligență · Matematică cu Sens · fișă generată (cod {fisa.config.seed})</footer>
    </article>
  );
}

function ItemFisa({ item, nr, rezolvari, arataPunctaj }: { item: Item; nr: number; rezolvari: boolean; arataPunctaj: boolean }) {
  const multe = item.cerinte.length > 1;
  const per = item.punctaj / item.cerinte.length;
  return (
    <li className="fisa-item">
      <div className="fisa-enunt">
        <span className="fisa-nr">{nr}.</span> {item.enunt}
        {arataPunctaj && <span className="fisa-puncte">({item.punctaj} p)</span>}
      </div>
      {item.vizual && <div className="fisa-vizual"><Vizual v={item.vizual} /></div>}
      <div className="fisa-cerinte" style={{ gridTemplateColumns: `repeat(${item.coloane ?? 1}, minmax(0, 1fr))` }}>
        {item.cerinte.map((c, j) => (
          <CerintaFisa key={j} c={c} litera={multe ? LITERE[j] : undefined} rezolvari={rezolvari} tip={item.interactiune} />
        ))}
      </div>
      {!rezolvari && item.spatiuLucru ? <div className="fisa-lucru" style={{ height: `${item.spatiuLucru * 9}mm` }} /> : null}
      {rezolvari && (item.rezolvare.length > 0 || (arataPunctaj && multe)) && (
        <div className="fisa-rezolvare">
          {item.rezolvare.map((r, k) => <div key={k}>{r}</div>)}
          {arataPunctaj && multe && <div className="fisa-barem-item">Barem: {item.cerinte.length} × {Number.isInteger(per) ? per : per.toFixed(1)} p</div>}
        </div>
      )}
    </li>
  );
}

function CerintaFisa({ c, litera, rezolvari, tip }: { c: Cerinta; litera?: string; rezolvari: boolean; tip: Item["interactiune"] }) {
  const cuOptiuni = (tip === "alegere" || c.alegere) && c.optiuni;
  const raspuns = <span className="raspuns">{c.raspuns}</span>;
  const linie = <span className={`linie ${c.latime === "l" ? "lunga" : c.latime === "m" ? "medie" : ""}`} />;
  return (
    <div className="fisa-cerinta">
      {c.vizual && <div className="fisa-vizual"><Vizual v={c.vizual} marime={0.85} /></div>}
      {c.mecanica && c.mecanica.tip !== "expresie" && <div className="fisa-mecanica"><VizualExercitiu m={c.mecanica} indiciu={0} rezolvat={false} /></div>}
      <div>
        {litera && <b>{litera}) </b>}
        {c.text.includes("___") ? (
          <>
            {c.text.split("___")[0]}
            {rezolvari ? raspuns : <span className="casuta" />}
            {c.text.split("___")[1]}
          </>
        ) : (
          <>
            {c.text}{" "}
            {c.campuri && !rezolvari ? (
              <span className="block">{c.campuri.map((e) => <span key={e} className="mr-4 inline-block">{e} <span className="linie" /></span>)}</span>
            ) : cuOptiuni ? null : rezolvari ? raspuns : tip === "adevarat-fals" ? <span className="af">A / F</span> : linie}
            {c.dupa}
          </>
        )}
      </div>
      {cuOptiuni && (
        <ul className="fisa-optiuni">
          {c.optiuni!.map((o) => (
            <li key={o} className={rezolvari && o === c.raspuns ? "corect" : ""}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
