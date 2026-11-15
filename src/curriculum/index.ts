/**
 * Mapa curriculară. Clasele I, III, IV: lecțiile Eduten (ordinea din platformă), aliniate cu programa.
 * Clasa a II-a: curriculumul „Matematică cu Sens” (36 de lecții). Clasa a V-a: programa OM 3393/2017.
 * `generatoare: []` = lecție fără generatoare încă (geometrie, date) — vor fi adăugate în etapele următoare.
 */
import type { Clasa } from "@/motor/tipuri";

export interface Lectie {
  id: string;
  titlu: string;
  generatoare: string[];
  /** referința Eduten (pentru profesori), dacă există */
  eduten?: string;
}
export interface Capitol {
  id: string;
  titlu: string;
  lectii: Lectie[];
}

const N = {
  numaratoare: "numeratie.numaratoare",
  descomp: "numeratie.descompunere",
  compun: "numeratie.compunere",
  vecini: "numeratie.vecini",
  compar: "numeratie.comparare",
  ordon: "numeratie.ordonare",
  litere: "numeratie.litere",
  rotunj: "numeratie.rotunjire",
  sir: "numeratie.sir",
  extreme: "numeratie.extreme",
  cifreDate: "numeratie.cifre-date",
  romane: "numeratie.cifre-romane",
  adsc: "operatii.adunare-scadere",
  termen: "operatii.termen-necunoscut",
  tabla: "operatii.tabla-inmultirii",
  impTabla: "operatii.impartire-tabla",
  inmExt: "operatii.inmultire-extinsa",
  impRest: "operatii.impartire-rest",
  ordOp: "operatii.ordinea-operatiilor",
  frCol: "fractii.colorata",
  frComp: "fractii.comparare",
  frDin: "fractii.din-numar",
  ceas: "masuri.ceas",
  transf: "masuri.transformari",
  pb1: "probleme.o-operatie",
  pb2: "probleme.doua-operatii",
  af: "probleme.adevarat-fals",
  comp: "probleme.competitie",
  // din antrenament (faza D și altele)
  figuri: "antr.geo.figuri",
  corpuri: "antr.geo.corpuri",
  linii: "antr.geo.linii",
  unghiuri: "antr.geo.unghiuri",
  numFig: "antr.geo.numara",
  perim: "antr.geo.perimetru",
  arie: "antr.geo.arie",
  sim: "antr.geo.simetrie",
  coord: "antr.geo.coordonate",
  tabel: "antr.date.tabel",
  grafic: "antr.date.grafic",
  pict: "antr.date.pictograma",
  lung: "antr.mas.lungime",
  masa: "antr.mas.masa",
  capac: "antr.mas.capacitate",
  cal: "antr.timp.calendar",
  dur: "antr.timp.durata",
  bani: "antr.bani.numara",
  rest: "antr.bani.rest",
  proc: "antr.fr.procente",
  frOp: "antr.fr.operatii",
  // clasa a V-a
  v: (id: string) => `antr.v.${id}`,
} as const;

let k = 0;
const L = (titlu: string, generatoare: string[], eduten?: string): Lectie => ({ id: `l${++k}`, titlu, generatoare, eduten });
const C = (id: string, titlu: string, lectii: Lectie[]): Capitol => ({ id, titlu, lectii });

export const CURRICULUM: Record<Clasa, Capitol[]> = {
  1: [
    C("c1-u1", "Unitatea 1 · Numerele 0–31", [
      L("Formarea, citirea și scrierea numerelor de la 0 la 31", [N.numaratoare, N.compun, N.vecini]),
      L("Numere pare. Numere impare", [N.sir, N.vecini]),
      L("Compararea și ordonarea numerelor de la 0 la 31", [N.compar, N.ordon]),
    ]),
    C("c1-u2", "Unitatea 2 · Adunarea și scăderea 0–10", [
      L("Adunarea cu 1, 2, 3, 4, 5", [N.adsc, N.pb1]),
      L("Adunarea cu 6, 7, 8, 9", [N.adsc, N.pb1]),
      L("Scăderea cu 1, 2, 3, 4, 5", [N.adsc, N.af]),
      L("Scăderea cu 6, 7, 8, 9 / Aflarea unui termen necunoscut", [N.adsc, N.termen]),
    ]),
    C("c1-u3", "Unitatea 3 · Adunarea și scăderea 0–31", [
      L("Adunarea fără trecere peste ordin în concentrul 0–31", [N.adsc]),
      L("Adunarea cu trecere peste ordin în concentrul 0–31", [N.adsc, N.termen]),
      L("Scăderea cu trecere peste ordin în concentrul 0–31", [N.adsc, N.termen]),
    ]),
    C("c1-u4", "Unitatea 4 · Numerele 0–100", [
      L("Recunoașterea, formarea, scrierea și citirea numerelor 0–100", [N.numaratoare, N.descomp, N.compun, N.litere]),
      L("Compararea și ordonarea numerelor 0–100", [N.compar, N.ordon, N.vecini]),
      L("Numere pare și impare. Numerația 0–100 (recapitulare)", [N.sir, N.compar, N.descomp]),
    ]),
    C("c1-u5", "Unitatea 5 · Adunarea și scăderea 0–100", [
      L("Adunarea și scăderea fără trecere peste ordin 0–100", [N.adsc, N.pb1]),
      L("Adunarea și scăderea cu trecere peste ordin 0–100", [N.adsc, N.termen]),
      L("Recapitularea adunării și scăderii 0–100", [N.adsc, N.termen, N.pb1, N.af]),
    ]),
    C("c1-u6", "Unitatea 6 · Geometrie", [L("Figuri plane", [N.figuri, N.numFig]), L("Corpuri geometrice", [N.corpuri])]),
    C("c1-u7", "Unitatea 7 · Măsurări", [
      L("Măsurarea lungimii", [N.lung]),
      L("Volum și capacitate", [N.capac, N.masa]),
      L("Măsurarea timpului 1", [N.ceas, N.cal]),
      L("Măsurarea timpului 2", [N.ceas, N.cal]),
      L("Leul. Monede și bancnote", [N.bani]),
    ]),
  ],
  2: [
    C("c2-cap1", "Cap. 1 · Recapitulare clasa I", [
      L("L1 · Numerele până la 100: formare, citire, ordonare", [N.numaratoare, N.compar, N.ordon, N.litere]),
      L("L2 · Adunarea și scăderea fără trecere peste ordin", [N.adsc, N.termen]),
      L("L3 · Probleme simple cu o operație", [N.pb1, N.af]),
      L("L4 · Fișă de recapitulare", [N.numaratoare, N.compar, N.adsc, N.pb1]),
    ]),
    C("c2-cap2", "Cap. 2 · Numere naturale 0–1000", [
      L("L5 · Formarea numerelor din unități, zeci și sute", [N.numaratoare, N.descomp, N.compun, N.cifreDate]),
      L("L6 · Citirea și scrierea numerelor până la 1000", [N.litere, N.numaratoare, N.extreme]),
      L("L7 · Vecinii și descompunerea numerelor", [N.vecini, N.descomp, N.compun]),
      L("L8 · Compararea și ordonarea numerelor", [N.compar, N.ordon, N.rotunj]),
      L("L9 · Serii logice și succesiuni numerice", [N.sir, N.extreme, N.cifreDate]),
      L("L10 · Recapitulare: Structura numerelor naturale", [N.numaratoare, N.descomp, N.vecini, N.compar, N.ordon, N.litere, N.sir, N.extreme]),
    ]),
    C("c2-cap3", "Cap. 3 · Adunarea și scăderea 0–1000", [
      L("L11–L12 · Adunarea și scăderea fără trecere peste ordin", [N.adsc, N.pb1]),
      L("L13–L14 · Adunarea și scăderea cu trecere peste ordin", [N.adsc, N.termen]),
      L("L15 · Relația dintre adunare și scădere (proba)", [N.termen, N.adsc, N.af]),
      L("L16 · Recapitulare: Operațiile de bază", [N.adsc, N.termen, N.pb1, N.pb2]),
    ]),
    C("c2-cap4", "Cap. 4 · Înmulțirea", [
      L("L17 · Adunări repetate", [N.tabla, N.pb1]),
      L("L18–L20 · Tabla înmulțirii cu 2, 3, 4, 5, 10", [N.tabla, N.pb1]),
      L("L21 · Recapitulare: Înmulțirea", [N.tabla, N.pb1, N.ordOp]),
    ]),
    C("c2-cap5", "Cap. 5 · Împărțirea", [
      L("L22–L23 · Împărțirea; legătura cu înmulțirea", [N.impTabla, N.tabla]),
      L("L24 · Probleme cu împărțiri simple", [N.pb1, N.impTabla]),
      L("L25 · Recapitulare: Împărțirea", [N.impTabla, N.tabla, N.pb1]),
    ]),
    C("c2-cap6", "Cap. 6 · Probleme aritmetice și logice", [
      L("L26 · Probleme cu o operație", [N.pb1, N.af]),
      L("L27 · Probleme cu două operații", [N.pb2, N.af]),
      L("L28 · Probleme logice", [N.comp, N.sir, N.extreme]),
      L("L29 · Recapitulare: Strategii de rezolvare", [N.pb1, N.pb2, N.af, N.comp]),
    ]),
    C("c2-cap7", "Cap. 7 · Elemente de geometrie", [
      L("L30 · Punct, linie, segment, semidreaptă", [N.linii]),
      L("L31 · Triunghi, pătrat, dreptunghi", [N.figuri, N.numFig, N.corpuri]),
      L("L32 · Perimetrul", [N.perim]),
      L("L33 · Simetria", [N.sim]),
    ]),
    C("c2-cap8", "Cap. 8 · Măsurători", [
      L("L34 · Lungime: m, dm, cm", [N.transf, N.lung]),
      L("L35 · Masă, timp și bani", [N.transf, N.ceas, N.masa, N.capac, N.dur, N.bani, N.rest]),
    ]),
    C("c2-cap9", "Cap. 9 · Organizarea datelor", [L("Tabele și pictograme", [N.tabel, N.pict]), L("Grafice cu bare", [N.grafic, N.tabel])]),
  ],
  3: [
    C("c3-u1", "Unitatea 1 · Numere naturale 0–10 000", [
      L("Numere naturale 0–10 000", [N.numaratoare, N.descomp, N.compun, N.litere, N.compar, N.ordon], "U1 L1+L2"),
      L("Rotunjirea numerelor naturale", [N.rotunj, N.vecini], "U1 L3"),
      L("Cifre romane", [N.romane], "U1 L4"),
    ]),
    C("c3-u2", "Unitatea 2 · Adunarea și scăderea 0–10 000", [
      L("Adunarea și scăderea", [N.adsc, N.termen, N.pb1], "U2 L1+L2"),
      L("Adunarea și scăderea în coloană", [N.adsc, N.pb2], "U2 L3+L4"),
    ]),
    C("c3-u3", "Unitatea 3 · Înmulțirea", [
      L("Tabla înmulțirii", [N.tabla], "U3 L1"),
      L("Înmulțirea cu 10 și 100; zeci × zeci", [N.inmExt], "U3 L2"),
      L("Proprietățile comutativă și asociativă", [N.tabla, N.inmExt], "U3 L3"),
      L("Înmulțirea în coloană", [N.inmExt, N.pb1], "U3 L4"),
      L("Ordinea operațiilor", [N.ordOp], "U3 L7"),
    ]),
    C("c3-u4", "Unitatea 4 · Împărțirea", [
      L("Împărțirea fără rest", [N.impTabla, N.pb1], "U4 L1–L3"),
      L("Relația dintre înmulțire și împărțire", [N.impTabla, N.tabla], "U4 L4+L5"),
      L("Împărțirea cu rest", [N.impRest], "Nivel 2 – curriculum propriu"),
      L("Ordinea operațiilor", [N.ordOp, N.pb2], "U4 L7+L8"),
    ]),
    C("c3-u5", "Unitatea 5 · Probleme și date", [
      L("Înmulțirea și împărțirea, ordinea operațiilor", [N.ordOp, N.pb2, N.af], "U5 L1+L2"),
      L("Probleme de logică (Nivel 2)", [N.comp, N.extreme, N.sir]),
      L("Prelucrarea datelor: diagrame", [N.grafic, N.tabel, N.pict], "U5 L4"),
    ]),
    C("c3-u6", "Unitatea 6 · Fracții", [
      L("Introducere în fracții", [N.frCol, N.frDin], "U6 L1+L2"),
      L("Compararea fracțiilor", [N.frComp, N.frCol], "U6 L3+L4"),
    ]),
    C("c3-u7", "Unitatea 7 · Geometrie", [
      L("Drepte, segmente, puncte", [N.linii], "U7 L1+L2"),
      L("Unghiuri, poligoane", [N.unghiuri, N.figuri], "U7 L4+L5"),
      L("Figuri plane", [N.figuri, N.numFig, N.arie], "U7 L6–L8"),
      L("Simetria", [N.sim], "U7 L9"),
      L("Perimetrul", [N.perim], "U7 L10"),
      L("Forme geometrice", [N.corpuri], "U7 L11"),
    ]),
    C("c3-u8", "Unitatea 8 · Măsurători", [
      L("Calcul cu unități de lungime", [N.transf, N.lung], "U8 L1"),
      L("Unități de masă și volum", [N.transf, N.masa, N.capac], "U8 L2+L3"),
      L("Timpul și ceasurile", [N.ceas, N.dur, N.cal], "U8 L4"),
      L("Moneda", [N.bani, N.rest], "U8 L5"),
    ]),
  ],
  4: [
    C("c4-u1", "Unitatea 1 · Numerele 0–1 000 000", [
      L("Numerele naturale 0–1 000 000", [N.descomp, N.compun, N.litere, N.vecini], "U1 L1+L2"),
      L("Compararea și rotunjirea numerelor", [N.compar, N.ordon, N.rotunj], "U1 L2"),
      L("Cifre romane", [N.romane], "U1 L3"),
    ]),
    C("c4-u2", "Unitatea 2 · Adunarea și scăderea", [
      L("Adunarea și scăderea", [N.adsc, N.termen], "U2 L1"),
      L("Calcule cu numere mari", [N.adsc, N.pb2], "U2 L2+L3"),
    ]),
    C("c4-u3", "Unitatea 3 · Înmulțirea", [
      L("Proprietățile înmulțirii", [N.tabla, N.inmExt], "U3 L1"),
      L("Înmulțirea cu 10, 100, 1 000", [N.inmExt], "U3 L2"),
      L("Înmulțirea", [N.inmExt, N.pb1], "U3 L3–L7"),
      L("Ordinea operațiilor", [N.ordOp], "U3 L8"),
    ]),
    C("c4-u4", "Unitatea 4 · Împărțirea", [
      L("Împărțirea", [N.impTabla, N.impRest], "U4 L1–L5"),
      L("Împărțirea expresiilor", [N.ordOp], "U4 L7"),
    ]),
    C("c4-u5", "Unitatea 5 · Expresii, ecuații, date", [
      L("Înmulțirea și împărțirea, ordinea operațiilor", [N.ordOp, N.pb2], "U5 L1"),
      L("Ecuații (termen / factor necunoscut)", [N.termen, N.tabla], "U5 L4+L5"),
      L("Probleme de concurs", [N.comp, N.extreme]),
      L("Diagrame", [N.grafic, N.tabel], "U5 L6"),
    ]),
    C("c4-u6", "Unitatea 6 · Fracții", [
      L("Introducere în fracții", [N.frCol], "U6 L1"),
      L("Aflarea unei fracții dintr-un număr", [N.frDin], "U6 L1"),
      L("Compararea fracțiilor", [N.frComp], "U6 L2"),
      L("Adunarea și scăderea fracțiilor", [N.frOp], "U6 L4+L5"),
      L("Fracții: aplicații", [N.frDin, N.frComp, N.frCol], "Extra U6"),
      L("Procente", [N.proc], "U6 L6"),
    ]),
    C("c4-u7", "Unitatea 7 · Geometrie", [
      L("Planul de coordonate", [N.coord], "U7 L1"),
      L("Drepte perpendiculare și paralele", [N.linii], "U7 L2"),
      L("Unghiuri", [N.unghiuri], "U7 L3"),
      L("Poligoane și cerc", [N.figuri], "U7 L4–L7"),
      L("Simetria", [N.sim], "U7 L8"),
      L("Aria și perimetrul", [N.arie, N.perim], "U7 L9+L10"),
      L("Paralelipipedul dreptunghic", [N.corpuri], "U7 L11+L12"),
    ]),
    C("c4-u8", "Unitatea 8 · Măsurători", [
      L("Unități de măsură pentru lungime", [N.transf, N.lung], "U8 L1"),
      L("Unități de măsură pentru masă și volum", [N.transf, N.masa, N.capac], "U8 L2+L3"),
      L("Timpul", [N.ceas, N.dur, N.cal], "U8 L4"),
      L("Prețuri", [N.rest, N.bani], "U8 L5"),
    ]),
  ],
  5: [
    C("c5-cap1", "Numere naturale", [
      L("Scrierea, compararea, rotunjirea numerelor naturale", [N.compar, N.ordon, N.rotunj]),
      L("Puteri: pătrat, cub, puteri ale lui 10, reguli de calcul", [N.v("puteri")]),
      L("Ordinea efectuării operațiilor; paranteze", [N.v("ordine")]),
      L("Factorul comun", [N.v("factor-comun")]),
    ]),
    C("c5-cap2", "Metode aritmetice de rezolvare a problemelor", [
      L("Metoda reducerii la unitate", [N.v("unitate")]),
      L("Metoda figurativă, mersul invers, falsa ipoteză", [N.v("metode"), N.pb2]),
    ]),
    C("c5-cap3", "Divizibilitate", [
      L("Divizor, multiplu; criterii de divizibilitate cu 2, 5, 10, 3, 9", [N.v("divizibilitate")]),
      L("Numere prime și compuse", [N.v("prime")]),
    ]),
    C("c5-cap4", "Fracții ordinare", [
      L("Amplificare, simplificare, fracții echivalente", [N.v("fr-echivalente")]),
      L("Compararea fracțiilor", [N.v("fr-comparare")]),
      L("Operații cu fracții ordinare", [N.v("fr-operatii")]),
      L("Fracții dintr-un număr; procente", [N.frDin, N.proc]),
    ]),
    C("c5-cap5", "Fracții zecimale", [
      L("Scriere, transformare, comparare, rotunjire", [N.v("zecimale")]),
      L("Operații cu fracții zecimale; media aritmetică", [N.v("zecimale-op")]),
    ]),
    C("c5-cap6", "Geometrie și unități de măsură", [
      L("Segmente: lungime, mijloc, puncte coliniare", [N.v("segmente")]),
      L("Unghiuri: măsură, clasificare, calcule cu grade și minute", [N.v("unghiuri")]),
      L("Arii și volume; unități de măsură", [N.v("arie-volum"), N.transf]),
    ]),
    C("c5-cap7", "Organizarea datelor", [L("Tabele și grafice", [N.tabel, N.grafic])]),
  ],
};

export function cautaLectie(clasa: Clasa, lectieId: string): { capitol: Capitol; lectie: Lectie } | undefined {
  for (const capitol of CURRICULUM[clasa]) {
    const lectie = capitol.lectii.find((l) => l.id === lectieId);
    if (lectie) return { capitol, lectie };
  }
}

export const NUME_CLASA: Record<Clasa, string> = { 1: "Clasa I", 2: "Clasa a II-a", 3: "Clasa a III-a", 4: "Clasa a IV-a", 5: "Clasa a V-a" };
