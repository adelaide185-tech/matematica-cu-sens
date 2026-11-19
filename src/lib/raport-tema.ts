import "server-only";
import { db } from "./db";
import type { Sesiune } from "./sesiune-token";
import { cfgTemaC2, cfgTemaC3, cfgTemaC4, cfgTemaC5, filtruTemeProfesor } from "./teme";
import { genereazaC4 } from "@/motor/clasa4/generator";
import { NUME_CAPITOL_C4, type CapitolC4 } from "@/motor/clasa4/tipuri";
import { genereazaC5 } from "@/motor/clasa5/generator";
import { NUME_CAPITOL_C5, type CapitolC5 } from "@/motor/clasa5/tipuri";
import { genereazaC2 } from "@/motor/clasa2/generator";
import { COMPATIBIL, NUME_EROARE, NUME_NOTIUNE, type NivelC2, type NotiuneC2, type TipEroare } from "@/motor/clasa2/tipuri";
import { genereazaC3 } from "@/motor/clasa3/generator";
import { NUME_CAPITOL, type CapitolC3 } from "@/motor/clasa3/tipuri";
import { hash } from "@/motor/calcul/generator";

export type Semafor = "nu-a-inceput" | "sprijin" | "bine" | "progres";
export const SEMAFOR: Record<Semafor, { icon: string; nume: string }> = {
  "nu-a-inceput": { icon: "⚪", nume: "Nu a început" },
  sprijin: { icon: "🟠", nume: "Are nevoie de sprijin" },
  progres: { icon: "🔵", nume: "Pe drumul cel bun" },
  bine: { icon: "🟢", nume: "Se descurcă bine" },
};

export const numeCompetenta = (c: string) => NUME_CAPITOL[c as CapitolC3] ?? NUME_CAPITOL_C4[c as CapitolC4] ?? NUME_CAPITOL_C5[c as CapitolC5] ?? NUME_NOTIUNE[c as NotiuneC2] ?? c;

type RaspunsElev = { valoare?: string; eroare?: TipEroare | null; terminat?: boolean; nivel?: NivelC2 };

export async function incarcaTema(s: Sesiune, id: string) {
  return db.tema.findFirst({
    where: { id, ...filtruTemeProfesor(s) },
    include: {
      clasa: { include: { elevi: { include: { elev: { select: { id: true, nume: true, prenume: true } } } } } },
      elev: { select: { id: true, nume: true, prenume: true } },
      incercari: { where: { terminat: { not: null } }, orderBy: { terminat: "desc" }, include: { raspunsuri: { select: { item: true, corect: true, raspunsElev: true, timpMs: true, competenta: true } } } },
    },
  });
}
export type TemaCuRezultate = NonNullable<Awaited<ReturnType<typeof incarcaTema>>>;

/** Rezumatul unui elev: cea mai bună încercare, semaforul, ce știe și ce are de exersat. */
export function rezumatElev(t: TemaCuRezultate, elevId: string) {
  const ale = t.incercari.filter((i) => i.elevId === elevId);
  if (!ale.length) return { semafor: "nu-a-inceput" as Semafor, incercari: 0, cea: null, acuratete: null, erori: [] as [TipEroare, number][], stiu: [] as string[], exersam: [] as string[], peCompetente: [] as [string, number][] };
  const cea = [...ale].sort((a, b) => b.corecte / Math.max(1, b.total) - a.corecte / Math.max(1, a.total) || (b.scor ?? 0) - (a.scor ?? 0))[0];
  const acuratete = Math.round((100 * cea.corecte) / Math.max(1, cea.total));
  const fataViata = ale.filter((i) => i.raspunsuri.some((r) => (r.raspunsElev as RaspunsElev)?.terminat === false)).length;
  const erori = new Map<TipEroare, number>();
  for (const r of ale[0].raspunsuri) { const e = (r.raspunsElev as RaspunsElev)?.eroare; if (e && e !== "altele") erori.set(e, (erori.get(e) ?? 0) + 1); }
  const comp = new Map<string, { ok: number; tot: number }>();
  for (const r of cea.raspunsuri) { const c = comp.get(r.competenta) ?? { ok: 0, tot: 0 }; c.tot++; if (r.corect) c.ok++; comp.set(r.competenta, c); }
  const peCompetente = [...comp.entries()].map(([c, v]) => [c, Math.round((100 * v.ok) / v.tot)] as [string, number]).sort((a, b) => a[1] - b[1]);
  const erRep = [...erori.entries()].sort((a, b) => b[1] - a[1]);
  const semafor: Semafor = acuratete < 60 || fataViata >= 2 || (erRep[0]?.[1] ?? 0) >= 3 ? "sprijin" : acuratete >= 80 && cea.medalie ? "bine" : "progres";
  return {
    semafor, incercari: ale.length, cea, acuratete, erori: erRep,
    stiu: peCompetente.filter(([, p]) => p >= 80).map(([c]) => numeCompetenta(c)),
    exersam: peCompetente.filter(([, p]) => p < 80).map(([c]) => numeCompetenta(c)),
    peCompetente,
  };
}

/** 3 exerciții de exersat acasă, din noțiunea cu cele mai slabe rezultate (doar la jocurile de clasa a II-a și a III-a). */
export function exercitiiAcasa(t: TemaCuRezultate, elevId: string, competenta: string | undefined): { text: string; raspuns: string }[] {
  if (!competenta) return [];
  const seed = hash(t.cod.charCodeAt(0), elevId.length, competenta.length, 7) % 2 ** 31;
  if (t.mecanica.startsWith("c2:")) {
    const n = competenta as NotiuneC2;
    const joc = (["casute", "scara", "bule", "perechi", "balanta", "ordonare", "ceas", "magazin", "provocare"] as const).find((j) => COMPATIBIL[j].includes(n));
    if (!joc) return [];
    const nivel = (t.incercari.find((i) => i.elevId === elevId)?.raspunsuri[0]?.raspunsElev as RaspunsElev)?.nivel ?? "mediu";
    return genereazaC2({ ...cfgTemaC2(t, elevId), mix: false, joc, notiuni: [n], nr: 3, seed }, nivel).itemi.map((i) => ({ text: i.st && i.raspuns.tip === "pereche" ? `${i.st} = ?` : i.text, raspuns: i.afis }));
  }
  if (t.mecanica.startsWith("c3:")) {
    return genereazaC3({ ...cfgTemaC3(t, elevId), joc: "sprint", capitole: [competenta as CapitolC3], nr: 3, seed }).itemi.map((i) => ({ text: i.text, raspuns: i.afis }));
  }
  if (t.mecanica.startsWith("c4:")) {
    return genereazaC4({ ...cfgTemaC4(t, elevId), joc: "sprint", capitole: [competenta as CapitolC4], nr: 3, seed }).itemi.map((i) => ({ text: i.text, raspuns: i.afis }));
  }
  if (t.mecanica.startsWith("c5:")) {
    return genereazaC5({ ...cfgTemaC5(t, elevId), joc: "sprint", capitole: [competenta as CapitolC5], nr: 3, seed }).itemi.map((i) => ({ text: i.text, raspuns: i.afis }));
  }
  return [];
}

/** Recomandări pentru profesor, după greșelile tipice din grupă (clasa a II-a). */
export const RECOMANDARE: Partial<Record<TipEroare, string>> = {
  trecere_omisa: "Scara sau Căsuțele cu „Adunarea”, opțiunea „cu trecere”, nivel Mediu, 10 exerciții",
  imprumut_omis: "Scara cu „Scăderea”, opțiunea „cu trecere”, nivel Mediu",
  tabel_vecin: "Bule sau Perechi rapide cu „Tabla înmulțirii”, tablele greșite",
  unitate_m_cm: "Balanța cu „Transformăm unități (m, cm)”",
  bani_lei_bani: "Magazinul („Câți bani sunt”), nivel Ușor",
  ceas_fara_un_sfert: "Ceasul cu „+ sferturi”, „mută acele”",
  ceas_ace_inversate: "Ceasul, nivel Ușor (citește ora)",
  operatie_inversa: "Provocarea în imagini (alegerea operației)",
  ordin_gresit: "Perechi rapide cu „Formăm numere” / „Descompunem numere”",
  necunoscuta_inversata: "Balanța cu „Numărul care lipsește” (echilibrează)",
};
export { NUME_EROARE };
