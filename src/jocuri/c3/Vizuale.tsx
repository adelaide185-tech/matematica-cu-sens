import { Fractie } from "@/componente/svg/Vizual";
import type { Fata, Figura } from "@/motor/clasa3/tipuri";

/** Text matematic: „3/4” devine fracție cu bară; „□” e evidențiat. */
export function TextMate({ text, className = "" }: { text: string; className?: string }) {
  const parti = text.split(/(\d+\/\d+|□)/g);
  return (
    <span className={className}>
      {parti.map((p, i) => {
        const f = p.match(/^(\d+)\/(\d+)$/);
        if (f)
          return (
            <span key={i} className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.8em] leading-none" aria-label={`${f[1]} supra ${f[2]}`}>
              <span className="px-0.5">{f[1]}</span>
              <span className="w-full border-t-2 border-current" />
              <span className="px-0.5">{f[2]}</span>
            </span>
          );
        if (p === "□") return <span key={i} className="mx-0.5 inline-block h-[1.1em] w-[1.3em] rounded-sm border-2 border-current align-middle" aria-label="numărul lipsă" />;
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}

/** Fața unui cartonaș / talger: desen de fracție sau text */
export function FataC3({ f, marime = 0.7 }: { f: Fata; marime?: number }) {
  if (f.fractie) return <Fractie forma={f.fractie.forma} parti={f.fractie.parti} colorate={f.fractie.colorate} marime={marime} />;
  return <TextMate text={f.text} />;
}

const U = 22; // px pe centimetru, pe grilă

/** Figurile pentru perimetru: dreptunghi / pătrat pe caroiaj, triunghi cu laturile notate. */
export function FiguraC3({ f, marime = 1 }: { f: Figura; marime?: number }) {
  if (f.tip === "triunghi") {
    // triunghi desenat cu laturile proporționale (din lungimile date)
    const { a, b, c } = f;
    const x = (a * a + c * c - b * b) / (2 * a);
    const h = Math.sqrt(Math.max(1, c * c - x * x));
    const k = 150 / Math.max(a, h, 1);
    const P = [[10, 10 + h * k], [10 + a * k, 10 + h * k], [10 + x * k, 10]];
    const W = Math.max(...P.map((p) => p[0])) + 30, H = 10 + h * k + 28;
    const mij = (i: number, j: number) => [(P[i][0] + P[j][0]) / 2, (P[i][1] + P[j][1]) / 2];
    return (
      <svg viewBox={`-20 0 ${W + 20} ${H}`} width={(W + 20) * marime} height={H * marime} role="img" aria-label={`Triunghi cu laturile ${a}, ${b} și ${c} ${f.unitate}`}>
        <polygon points={P.map((p) => p.join(",")).join(" ")} fill="#ece9f6" stroke="#4f4183" strokeWidth="2.5" />
        {([[0, 1, a, 0, 18], [1, 2, b, 14, 0], [2, 0, c, -16, 0]] as const).map(([i, j, l, dx, dy]) => {
          const [mx, my] = mij(i, j);
          return <text key={`${i}${j}`} x={mx + dx} y={my + dy} textAnchor="middle" fontSize="14" fontWeight="700" fill="#4f4183">{l} {f.unitate}</text>;
        })}
      </svg>
    );
  }
  const L = f.tip === "patrat" ? f.l : f.L, l = f.l;
  const W = (L + 2) * U, H = (l + 2) * U;
  return (
    <svg viewBox={`0 0 ${W} ${H + 6}`} width={W * marime} height={(H + 6) * marime} role="img" aria-label={`${f.tip === "patrat" ? "Pătrat" : "Dreptunghi"} ${L} pe ${l} ${f.unitate}`}>
      {f.grila && Array.from({ length: L + 3 }, (_, i) => <line key={`v${i}`} x1={i * U} y1={0} x2={i * U} y2={H} stroke="#d8d3ec" strokeWidth="1" />)}
      {f.grila && Array.from({ length: l + 3 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * U} x2={W} y2={i * U} stroke="#d8d3ec" strokeWidth="1" />)}
      <rect x={U} y={U} width={L * U} height={l * U} fill="#6a59a733" stroke="#4f4183" strokeWidth="3" />
      <text x={U + (L * U) / 2} y={U - 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#4f4183">{L} {f.unitate}</text>
      <text x={U + L * U + 5} y={U + (l * U) / 2 + 4} fontSize="13" fontWeight="700" fill="#4f4183">{l} {f.unitate}</text>
    </svg>
  );
}

/** Caroiaj gol (pe fișă, pentru „construiește”) */
export function Caroiaj({ col = 12, rand = 7 }: { col?: number; rand?: number }) {
  const u = 14;
  return (
    <svg viewBox={`0 0 ${col * u + 1} ${rand * u + 1}`} width={col * u + 1} height={rand * u + 1} aria-hidden>
      {Array.from({ length: col + 1 }, (_, i) => <line key={`v${i}`} x1={i * u + 0.5} y1={0} x2={i * u + 0.5} y2={rand * u} stroke="#bbb" strokeWidth="0.8" />)}
      {Array.from({ length: rand + 1 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * u + 0.5} x2={col * u} y2={i * u + 0.5} stroke="#bbb" strokeWidth="0.8" />)}
    </svg>
  );
}
