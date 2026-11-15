/**
 * Adaptor: subiectele din antrenament (geometrie, date, măsurări, bani…) devin generatoare de fișe.
 * Pe fișă intră doar exercițiile care se pot rezolva pe hârtie (fără mecanici doar-pe-ecran:
 * ceas cu ace mobile, colorare pe rețea, magazin, blocuri).
 */
import type { Cerinta, Generator, Nivel } from "../tipuri";
import { raspunsText, type Exercitiu, type NivelJoc, type Subiect } from "@/antrenament/tipuri";
import { SUBIECTE } from "@/antrenament/registru";

const NIVEL: Record<Nivel, NivelJoc> = { consolidare: "usor", aprofundare: "mediu", evaluare: "mediu", competitie: "provocare" };

/** Se poate rezolva pe hârtie? */
function printabil(e: Omit<Exercitiu, "subiectId">): boolean {
  const m = e.mecanica;
  if (e.raspuns.tip === "construit" || e.raspuns.tip === "multime") return false;
  if (m.tip === "blocuri" || m.tip === "magazin" || m.tip === "ordonare" || m.tip === "farfurii") return false;
  if ((m.tip === "ceas" || m.tip === "fractie" || m.tip === "simetrie" || m.tip === "coordonate") && "interactiv" in m && m.interactiv) return false;
  return true;
}

export function dinSubiect(s: Subiect): Generator {
  return {
    id: `antr.${s.id}`,
    titlu: s.titlu,
    clase: s.clase,
    competente: [],
    niveluri: ["consolidare", "aprofundare", "evaluare", "competitie"],
    generate(rng, nivel, clasa) {
      const k = nivel === "consolidare" ? 4 : 3;
      const ex: Omit<Exercitiu, "subiectId">[] = [];
      const chei = new Set<string>();
      // dacă la nivelul cerut subiectul are doar exerciții „pe ecran”, trecem la nivelul următor
      const niveluri: NivelJoc[] = NIVEL[nivel] === "usor" ? ["usor", "mediu", "provocare"] : NIVEL[nivel] === "mediu" ? ["mediu", "provocare"] : ["provocare", "mediu"];
      for (let i = 0; i < 120 && ex.length < k; i++) {
        const e = s.exercitiu(rng, niveluri[Math.min(niveluri.length - 1, Math.floor(i / 40))], clasa);
        if (!printabil(e) || chei.has(e.cheie)) continue;
        chei.add(e.cheie);
        ex.push(e);
      }
      const cerinte: Cerinta[] = ex.map((e) => ({
        text: e.enunt,
        raspuns: raspunsText(e.raspuns),
        mecanica: e.mecanica,
        ...(e.raspuns.tip === "optiune" && { optiuni: e.raspuns.optiuni, alegere: true }),
        ...(e.raspuns.tip === "campuri" && { dupa: "", campuri: e.raspuns.etichete }),
        latime: "m",
      }));
      return {
        generatorId: this.id,
        enunt: `${s.titlu}:`,
        interactiune: "input",
        coloane: ex.length > 1 ? 2 : 1,
        cerinte,
        rezolvare: ex.map((e, i) => `${String.fromCharCode(97 + i)}) ${e.indicii[e.indicii.length - 1]}`),
        punctaj: cerinte.length,
        dificultate: ex[0]?.dificultate ?? 3,
      };
    },
  };
}

/** Subiectele care completează lecțiile de geometrie, date, măsurări și bani de pe fișe. */
const PENTRU_FISE = [
  "geo.figuri", "geo.corpuri", "geo.linii", "geo.unghiuri", "geo.numara", "geo.perimetru", "geo.arie", "geo.simetrie", "geo.coordonate",
  "date.tabel", "date.grafic", "date.pictograma",
  "mas.lungime", "mas.masa", "mas.capacitate", "timp.calendar", "timp.durata", "bani.numara", "bani.rest", "fr.procente", "fr.operatii",
];

export const GENERATOARE_DIN_ANTRENAMENT: Generator[] = SUBIECTE.filter((s) => PENTRU_FISE.includes(s.id)).map(dinSubiect);
