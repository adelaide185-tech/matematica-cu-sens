import type { Lectie } from "./lectii";

/** Notele pentru profesor: obiectiv, desfășurare (concret → pictorial → abstract), întrebări, greșeli frecvente. */
export function NoteProfesor({ l }: { l: Lectie }) {
  const n = l.note;
  return (
    <div className="space-y-3 text-sm leading-relaxed text-gray-800 sm:text-base">
      <p><b className="text-mov">Obiectiv.</b> {n.obiectiv}</p>
      <p><b className="text-mov">Material fizic.</b> {n.materiale}</p>
      <div>
        <b className="text-mov">Desfășurare</b>
        <ol className="mt-1 list-decimal space-y-1 pl-5">{n.desfasurare.map((x) => <li key={x}>{x}</li>)}</ol>
      </div>
      <div>
        <b className="text-mov">Întrebări pentru clasă</b>
        <ul className="mt-1 list-disc space-y-1 pl-5">{n.intrebari.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <div>
        <b className="text-mov">Greșeli frecvente</b>
        <ul className="mt-1 list-disc space-y-1 pl-5">{n.greseli.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
      <p className="text-gray-600">Competențe: {l.competente.join(", ")} · aprox. {l.minute} minute · {l.pasi.length} pași</p>
    </div>
  );
}
