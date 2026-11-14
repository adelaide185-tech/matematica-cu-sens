/**
 * Lecții ghidate pe manipulative (clasa a II-a, Matematică cu Sens / Singapore Math).
 * Fiecare lecție merge concret → pictorial → abstract: copilul manipulează, apoi scrie numărul.
 * Notele pentru profesor țin locul „Teacher Notes” din Brainingcamp.
 */
import {
  aceleasiNumere, blocuriDin, cadruDin, capatSalturi, colorateTabla, drumContinuu, esteCanonic, numaraCadru,
  numarDinEticheta, valoareBlocuri, type Axa, type Blocuri, type Cadru, type ModelBara, type Rekenrek, type Tabla,
} from "@/manipulative/logica";
import type { StareManip, TipManip } from "@/manipulative/stare";

/** `true` = corect; un text = încă nu, cu un mesaj blând și specific. */
export type Verdict = true | string;

export interface Pas {
  text: string;
  start: StareManip;
  /** fără `verifica`: pas de explorare („Mai departe”) */
  verifica?: (s: StareManip, raspuns: number | null) => Verdict;
  /** cere și un răspuns scris (număr) */
  intrebare?: string;
  /** de la ușor la explicit; după ele se arată rezolvarea */
  indicii?: string[];
  solutie?: { stare?: StareManip; raspuns?: number };
  arataNumar?: boolean;
}

export interface NoteProfesor {
  obiectiv: string;
  materiale: string;
  desfasurare: string[];
  intrebari: string[];
  greseli: string[];
}

export interface Lectie {
  id: string;
  titlu: string;
  icon: string;
  clasa: 2;
  capitol: string;
  manipulativ: TipManip;
  competente: string[];
  minute: number;
  note: NoteProfesor;
  pasi: Pas[];
}

// ───────── ajutoare pentru verificări ─────────

const bl = (s: StareManip): Blocuri => (s.tip === "blocuri" ? s.v : { sute: 0, zeci: 0, unitati: 0 });
const rk = (s: StareManip): Rekenrek => (s.tip === "rekenrek" ? s.v : { sus: 0, jos: 0 });
const cd = (s: StareManip): Cadru => (s.tip === "cadru" ? s.v : cadruDin(0));
const ax = (s: StareManip): Axa => (s.tip === "axa" ? s.v : { start: 0, sfarsit: 1, pas: 1, fin: 1, puncte: [], salturi: [] });
const tb = (s: StareManip): Tabla => (s.tip === "tabla" ? s.v : { start: 1, colorate: {}, ascunse: [] });
const mb = (s: StareManip): ModelBara => (s.tip === "bara" ? s.v : { bare: [] });

const blocuri = (n: number, faraSute = false): StareManip => ({ tip: "blocuri", v: blocuriDin(n), faraSute });
const blocuriLibere = (b: Blocuri, faraSute = false): StareManip => ({ tip: "blocuri", v: b, faraSute });
const axa = (v: Partial<Axa> & Pick<Axa, "start" | "sfarsit" | "pas">, moduri: ("punct" | "salt")[] = ["punct"]): StareManip => ({
  tip: "axa", v: { fin: 1, puncte: [], salturi: [], ...v }, moduri,
});

function raspunsul(r: number | null, corect: number): Verdict {
  if (r === null) return "Scrie și răspunsul în căsuță.";
  return r === corect ? true : `Ai scris ${r}. Mai numără o dată, cu ajutorul desenului.`;
}

/** Numărul format pe blocuri, apoi forma „cu cele mai puține piese”. */
function formeaza(s: StareManip, tinta: number, ajutor: string): Verdict {
  const b = bl(s);
  const v = valoareBlocuri(b);
  if (v !== tinta) return `Pe masă este ${v}. ${ajutor}`;
  if (!esteCanonic(b)) return "Numărul e corect! Poți folosi mai puține piese? Schimbă 10 piese pe una mai mare.";
  return true;
}

function eticheteBara(s: StareManip, bara: number): string[] {
  return mb(s).bare[bara]?.segmente.map((x) => x.eticheta.trim()) ?? [];
}

// ───────── lecțiile ─────────

export const LECTII: Lectie[] = [
  {
    id: "sute-zeci-unitati",
    titlu: "Sute, zeci și unități",
    icon: "🧱",
    clasa: 2,
    capitol: "Numerele 0–1000",
    manipulativ: "blocuri",
    competente: ["MEM 1.1", "MEM 1.2"],
    minute: 15,
    note: {
      obiectiv: "Elevul formează numere de trei cifre cu blocuri și înțelege schimbul 10 → 1 (10 unități = 1 zece, 10 zeci = 1 sută).",
      materiale: "Echivalent fizic: bețișoare legate în mănunchiuri de câte 10, plăcuțe de 100 sau cuburi Dienes.",
      desfasurare: [
        "Concret: copiii numără 10 unități și le „leagă” într-o zece (pasul 1). Insistați: o zece e tot 10, doar că e strânsă.",
        "Pictorial: formează 234 și 305 citind pe coloane; numărul apare sub tabel, ca legătură cu scrierea.",
        "Abstract: la pasul 4, 1 sută, 14 zeci și 3 unități nu se poate citi direct: copilul grupează și abia apoi scrie numărul.",
        "Încheiere: o sută desfăcută în zeci pregătește scăderea cu împrumut.",
      ],
      intrebari: ["Ce s-a schimbat când am legat 10 unități? Ce a rămas la fel?", "De ce scriem 0 în 305? Ce s-ar întâmpla dacă nu l-am scrie?", "Câte zeci sunt în 234 cu totul?"],
      greseli: ["Scrierea „3005” pentru 3 sute și 5 unități.", "Citirea „1 sută, 14 zeci, 3 unități” ca 1143.", "Confuzia între cifra zecilor și numărul total de zeci."],
    },
    pasi: [
      {
        text: "Pune câte o unitate pe coloana Unități până ai 10. Apoi schimbă cele 10 unități pe o zece.",
        start: blocuri(0, true),
        verifica: (s) => {
          const b = bl(s);
          if (b.zeci === 1 && b.unitati === 0) return true;
          if (b.unitati === 10) return "Ai 10 unități! Acum apasă „10 unități → 1 zece”.";
          return `Ai ${valoareBlocuri(b)}. Vrem exact o zece și nicio unitate.`;
        },
        indicii: ["Atinge „+” la Unități de 10 ori.", "Când sunt 10 unități, apare butonul „10 unități → 1 zece”. Apasă-l."],
        solutie: { stare: blocuri(10, true) },
      },
      {
        text: "Formează numărul 234 cu cele mai puține piese.",
        start: blocuri(0),
        verifica: (s) => formeaza(s, 234, "Ne trebuie 2 sute, 3 zeci și 4 unități."),
        indicii: ["Cifra din stânga (2) îți spune câte sute pui.", "Atinge „+” la Sute de 2 ori, la Zeci de 3 ori și la Unități de 4 ori."],
        solutie: { stare: blocuri(234) },
      },
      {
        text: "Acum formează 305. Ce pui pe coloana Zeci?",
        start: blocuri(0),
        verifica: (s) => formeaza(s, 305, "Citește cifrele pe rând: sute, zeci, unități."),
        indicii: ["Cifra 0 de la mijloc spune că nu punem nicio zece.", "3 sute, 0 zeci, 5 unități."],
        solutie: { stare: blocuri(305) },
      },
      {
        text: "Pe masă sunt 1 sută, 14 zeci și 3 unități. Grupează piesele, apoi scrie ce număr este.",
        start: blocuriLibere({ sute: 1, zeci: 14, unitati: 3 }),
        intrebare: "Ce număr este?",
        verifica: (s, r) => (!esteCanonic(bl(s)) ? "Grupează întâi: 10 zeci se schimbă într-o sută." : raspunsul(r, 243)),
        indicii: ["Apasă „10 zeci → 1 sută”.", "Acum sunt 2 sute, 4 zeci și 3 unități."],
        solutie: { stare: blocuri(243), raspuns: 243 },
      },
      {
        text: "Desface o sută în zeci. Câte zeci are o sută?",
        start: blocuri(100),
        intrebare: "O sută are … zeci",
        verifica: (s, r) => {
          const b = bl(s);
          if (b.sute !== 0 || b.zeci !== 10) return "Apasă „1 sută → 10 zeci” și uită-te pe coloana Zeci.";
          return raspunsul(r, 10);
        },
        indicii: ["Apasă „1 sută → 10 zeci”.", "Numără barele albastre."],
        solutie: { stare: blocuriLibere({ sute: 0, zeci: 10, unitati: 0 }), raspuns: 10 },
      },
    ],
  },

  {
    id: "adunare-trecere",
    titlu: "Adunarea cu trecere peste zece",
    icon: "➕",
    clasa: 2,
    capitol: "Adunarea și scăderea 0–100",
    manipulativ: "blocuri",
    competente: ["MEM 1.4"],
    minute: 15,
    note: {
      obiectiv: "Elevul adună două numere de două cifre cu trecere peste ordin și explică de ce „se ține minte 1”: 10 unități devin o zece.",
      materiale: "Echivalent fizic: bețișoare și mănunchiuri, pe un tabel Z | U desenat pe bancă.",
      desfasurare: [
        "Formează primul termen (47), apoi adaugă al doilea pe coloane (3 zeci, 8 unități).",
        "Opriți-vă la 15 unități: „Putem citi numărul așa? Ce facem cu ele?”. Grupați.",
        "Legătura cu calculul în coloană: zecea nouă este „1-ul ținut minte”.",
        "Pasul 4 e de lucru independent; observați cine grupează fără să fie întrebat.",
      ],
      intrebari: ["De unde a apărut zecea a opta?", "Am fi obținut același rezultat dacă adunam întâi zecile?", "Când NU trebuie să grupăm?"],
      greseli: ["7 + 8 = 15 scris ca „715” (unitățile nu se grupează).", "Uitarea zecii obținute din grupare (47 + 38 = 75)."],
    },
    pasi: [
      {
        text: "Formează primul număr: 47.",
        start: blocuri(0, true),
        verifica: (s) => formeaza(s, 47, "Ne trebuie 4 zeci și 7 unități."),
        indicii: ["Atinge „+” la Zeci de 4 ori, apoi „+” la Unități de 7 ori."],
        solutie: { stare: blocuri(47, true) },
      },
      {
        text: "Adaugă 38: încă 3 zeci și 8 unități. Nu grupa încă.",
        start: blocuri(47, true),
        verifica: (s) => {
          const v = valoareBlocuri(bl(s));
          return v === 85 ? true : v < 85 ? `Ai ${v}. Mai adaugă până ai pus 3 zeci și 8 unități în plus.` : `Ai ${v}: ai pus prea multe. Scoate câteva piese.`;
        },
        indicii: ["Atinge „+” la Zeci de 3 ori și la Unități de 8 ori."],
        solutie: { stare: blocuriLibere({ sute: 0, zeci: 7, unitati: 15 }, true) },
      },
      {
        text: "Sunt 15 unități: prea multe pentru o singură cifră! Schimbă 10 unități pe o zece. Cât fac 47 + 38?",
        start: blocuriLibere({ sute: 0, zeci: 7, unitati: 15 }, true),
        intrebare: "47 + 38 =",
        verifica: (s, r) => (!esteCanonic(bl(s)) ? "Apasă întâi „10 unități → 1 zece”." : raspunsul(r, 85)),
        indicii: ["După grupare sunt 8 zeci și 5 unități."],
        solutie: { stare: blocuri(85, true), raspuns: 85 },
      },
      {
        text: "Acum singur: calculează 56 + 27 cu blocurile. Formează 56, adaugă 27, apoi grupează.",
        start: blocuri(0, true),
        intrebare: "56 + 27 =",
        verifica: (s, r) => {
          const b = bl(s);
          const v = valoareBlocuri(b);
          if (v !== 83) return `Pe masă este ${v}. Formează 56, apoi adaugă 2 zeci și 7 unități.`;
          if (!esteCanonic(b)) return "Valoarea e bună! Grupează unitățile ca să poți citi numărul.";
          return raspunsul(r, 83);
        },
        indicii: ["6 unități + 7 unități = 13 unități: se face o zece și rămân 3.", "5 zeci + 2 zeci + zecea nouă = 8 zeci."],
        solutie: { stare: blocuri(83, true), raspuns: 83 },
      },
    ],
  },

  {
    id: "prietenii-lui-10",
    titlu: "Prietenii lui 10",
    icon: "🔲",
    clasa: 2,
    capitol: "Adunarea și scăderea 0–100",
    manipulativ: "cadru",
    competente: ["MEM 1.4", "MEM 1.6"],
    minute: 10,
    note: {
      obiectiv: "Elevul găsește complementul până la 10 și îl folosește la adunarea cu trecere peste 10 (8 + 5 = 8 + 2 + 3).",
      materiale: "Echivalent fizic: cutia de ouă de 10 sau un cadru desenat, cu jetoane în două culori.",
      desfasurare: [
        "Pasul 1–2: „câte goluri sunt?” se vede dintr-o privire, fără numărare.",
        "Pasul 3: insistați să umple întâi primul cadru (strategia „fac 10”). Notați pe tablă: 8 + 5 = 8 + 2 + 3 = 13.",
        "Extindere orală: 9 + 4, 7 + 6, 28 + 5.",
      ],
      intrebari: ["De ce e mai ușor să ajungem întâi la 10?", "Cum am despărțit 5?"],
      greseli: ["Numărarea din 1 în 1 a tuturor jetoanelor.", "Așezarea jetoanelor galbene în al doilea cadru înainte de a umple primul."],
    },
    pasi: [
      {
        text: "Pune 7 jetoane roșii în cadru. Câte căsuțe au rămas goale?",
        start: { tip: "cadru", v: cadruDin(0), unSingurCadru: true },
        intrebare: "Goale:",
        verifica: (s, r) => {
          const c = cd(s);
          if (numaraCadru(c, 1) !== 7 || numaraCadru(c, 2) > 0) return `Sunt ${numaraCadru(c, 1)} jetoane roșii. Vrem exact 7 roșii.`;
          return raspunsul(r, 3);
        },
        indicii: ["Un rând plin are 5. Mai pune 2 pe al doilea rând.", "Numără căsuțele albe: 10 − 7."],
        solutie: { stare: { tip: "cadru", v: cadruDin(7), unSingurCadru: true }, raspuns: 3 },
      },
      {
        text: "În cadru sunt 6 jetoane roșii. Completează cu jetoane galbene până la 10.",
        start: { tip: "cadru", v: cadruDin(6), unSingurCadru: true },
        intrebare: "6 + … = 10",
        verifica: (s, r) => {
          const c = cd(s);
          if (numaraCadru(c, 1) !== 6) return "Lasă cele 6 jetoane roșii pe loc.";
          if (numaraCadru(c) !== 10) return `Sunt ${numaraCadru(c)} jetoane. Cadrul plin are 10.`;
          return raspunsul(r, 4);
        },
        indicii: ["Alege „Jeton galben”, apoi atinge căsuțele goale.", "Câte jetoane galbene ai pus?"],
        solutie: { stare: { tip: "cadru", v: cadruDin(6, 4), unSingurCadru: true }, raspuns: 4 },
      },
      {
        text: "8 + 5: sunt 8 roșii. Adaugă 5 galbene, umplând întâi primul cadru.",
        start: { tip: "cadru", v: cadruDin(8) },
        intrebare: "8 + 5 =",
        verifica: (s, r) => {
          const c = cd(s);
          if (numaraCadru(c, 1) !== 8) return "Lasă cele 8 jetoane roșii pe loc.";
          if (numaraCadru(c, 2) !== 5) return `Ai pus ${numaraCadru(c, 2)} galbene. Vrem 5.`;
          if (numaraCadru(c.slice(0, 10)) !== 10) return "Umple întâi primul cadru, ca să faci 10!";
          return raspunsul(r, 13);
        },
        indicii: ["8 are nevoie de 2 ca să facă 10.", "Din cele 5 galbene, 2 merg în primul cadru și 3 în al doilea: 10 + 3."],
        solutie: { stare: { tip: "cadru", v: cadruDin(8, 5) }, raspuns: 13 },
      },
    ],
  },

  {
    id: "rekenrek-20",
    titlu: "Adunări și scăderi până la 20",
    icon: "🔴",
    clasa: 2,
    capitol: "Adunarea și scăderea 0–100",
    manipulativ: "rekenrek",
    competente: ["MEM 1.4"],
    minute: 10,
    note: {
      obiectiv: "Elevul „vede” numerele până la 20 în grupe de 5 și 10 și calculează prin 10, fără să numere din 1 în 1.",
      materiale: "Rekenrek fizic sau numărătoare cu 2 rânduri, colorată 5 + 5.",
      desfasurare: [
        "Regula: mutăm bilele dintr-o singură atingere (dintr-o „împingere”), nu una câte una.",
        "La 9 + 6, întrebați: „Cât lipsește sus până la 10?”. Mutarea gândită a unei bile de jos sus dă 10 + 5.",
        "La scădere: 14 − 5 = 14 − 4 − 1 (întâi ajungem la 10).",
      ],
      intrebari: ["Cum ai știut că sunt 9 fără să numeri?", "Ce dublu îți amintește 7 + 8?"],
      greseli: ["Mutarea bilelor una câte una (numărare, nu structurare).", "La scădere, scoaterea bilelor de pe rândul de sus întâi."],
    },
    pasi: [
      {
        text: "Arată 10 pe rândul de sus, dintr-o singură atingere.",
        start: { tip: "rekenrek", v: { sus: 0, jos: 0 } },
        verifica: (s) => (rk(s).sus === 10 && rk(s).jos === 0 ? true : `Sus sunt ${rk(s).sus} bile. Atinge ultima bilă albă din dreapta.`),
        indicii: ["Atinge a zecea bilă (ultima albă): vin toate cele 10 deodată."],
        solutie: { stare: { tip: "rekenrek", v: { sus: 10, jos: 0 } } },
      },
      {
        text: "Arată 9 + 6: sus 9 bile, jos 6 bile.",
        start: { tip: "rekenrek", v: { sus: 0, jos: 0 } },
        intrebare: "9 + 6 =",
        verifica: (s, r) => {
          const x = rk(s);
          if (x.sus !== 9 || x.jos !== 6) return `Acum sunt ${x.sus} sus și ${x.jos} jos. Vrem 9 sus și 6 jos.`;
          return raspunsul(r, 15);
        },
        indicii: ["9 = 5 roșii + 4 albe. 6 = 5 roșii + 1 albă.", "Sus mai lipsește o bilă până la 10: ia-o în gând de jos. 10 + 5 = ?"],
        solutie: { stare: { tip: "rekenrek", v: { sus: 9, jos: 6 } }, raspuns: 15 },
      },
      {
        text: "Sunt 14 bile. Scoate 5, întâi de pe rândul de jos.",
        start: { tip: "rekenrek", v: { sus: 10, jos: 4 } },
        intrebare: "14 − 5 =",
        verifica: (s, r) => {
          const x = rk(s);
          if (x.sus + x.jos !== 9) return `Au rămas ${x.sus + x.jos} bile. Trebuie să scoți exact 5.`;
          return raspunsul(r, 9);
        },
        indicii: ["Scoate cele 4 bile de jos: ajungi la 10.", "Mai scoate una de sus."],
        solutie: { stare: { tip: "rekenrek", v: { sus: 9, jos: 0 } }, raspuns: 9 },
      },
    ],
  },

  {
    id: "axa-rotunjire",
    titlu: "Numerele pe axă și rotunjirea",
    icon: "📏",
    clasa: 2,
    capitol: "Numerele 0–1000",
    manipulativ: "axa",
    competente: ["MEM 1.2", "MEM 1.3"],
    minute: 15,
    note: {
      obiectiv: "Elevul așază numere pe axă, alege vecinul cel mai apropiat și rotunjește la zeci și la sute (cu 5 în sus).",
      materiale: "O sfoară întinsă în clasă cu cleme (gradațiile) sau axa desenată pe tablă.",
      desfasurare: [
        "347 se găsește întâi între 340 și 350, apoi se numără 7 gradații mici.",
        "Rotunjirea este o întrebare de distanță: „la care zece ajungi mai repede?”.",
        "Pasul 4 (fără numere pe gradații) exersează estimarea: acceptăm o abatere mică.",
      ],
      intrebari: ["Între ce zeci se află 347? Cât e până la fiecare?", "Ce facem cu 345, care e exact la mijloc?"],
      greseli: ["Rotunjirea prin „tăierea” cifrei (347 → 340).", "Numărarea gradațiilor începând cu 1 în loc de 0."],
    },
    pasi: [
      {
        text: "Pune pe axă numărul 347.",
        start: axa({ start: 300, sfarsit: 400, pas: 10 }),
        verifica: (s) => {
          const p = ax(s).puncte;
          if (p.includes(347) && p.length === 1) return true;
          if (p.length === 0) return "Atinge axa acolo unde crezi că e 347.";
          return `Ai pus ${p.join(", ")}. Găsește întâi 340, apoi numără 7 gradații mici.`;
        },
        indicii: ["347 este între 340 și 350.", "De la 340, numără 7 gradații mici spre dreapta. Poți și să scrii 347 în căsuța de sub axă."],
        solutie: { stare: axa({ start: 300, sfarsit: 400, pas: 10, puncte: [347] }) },
      },
      {
        text: "La ce zece este mai aproape 347? Pune un punct și pe ea.",
        start: axa({ start: 300, sfarsit: 400, pas: 10, puncte: [347] }),
        intrebare: "347 rotunjit la zeci este",
        verifica: (s, r) => {
          const p = ax(s).puncte;
          if (!p.includes(347)) return "Lasă punctul 347 pe axă.";
          if (!p.includes(350) || p.length !== 2) return "Pune un al doilea punct pe zecea cea mai apropiată de 347.";
          return raspunsul(r, 350);
        },
        indicii: ["De la 347 până la 340 sunt 7 pași. Până la 350?", "Până la 350 sunt doar 3 pași."],
        solutie: { stare: axa({ start: 300, sfarsit: 400, pas: 10, puncte: [347, 350] }), raspuns: 350 },
      },
      {
        text: "Pune pe axă numărul 680. La ce sută se rotunjește?",
        start: axa({ start: 0, sfarsit: 1000, pas: 100, fin: 10 }),
        intrebare: "680 rotunjit la sute este",
        verifica: (s, r) => (ax(s).puncte.includes(680) ? raspunsul(r, 700) : "Pune întâi punctul 680: e între 600 și 700."),
        indicii: ["Fiecare gradație mică înseamnă 10.", "680 e la 8 gradații după 600 și la 2 gradații înainte de 700."],
        solutie: { stare: axa({ start: 0, sfarsit: 1000, pas: 100, fin: 10, puncte: [680] }), raspuns: 700 },
      },
      {
        text: "Estimează: numerele au fost ascunse. Pune un punct unde crezi că este 75.",
        start: axa({ start: 0, sfarsit: 100, pas: 10, faraEtichete: true }),
        verifica: (s) => {
          const p = ax(s).puncte;
          if (p.length === 0) return "Atinge axa acolo unde crezi că e 75.";
          const cel = p[p.length - 1];
          return Math.abs(cel - 75) <= 2 ? true : cel < 75 ? "Ești puțin prea la stânga. 75 e la mijloc între 70 și 80." : "Ești puțin prea la dreapta. 75 e la mijloc între 70 și 80.";
        },
        indicii: ["Mijlocul axei este 50.", "Numără gradațiile mari: 0, 10, 20 … până la 70, apoi încă jumătate de pas."],
        solutie: { stare: axa({ start: 0, sfarsit: 100, pas: 10, faraEtichete: true, puncte: [75] }) },
      },
    ],
  },

  {
    id: "scadere-salturi",
    titlu: "Scăderea cu salturi pe axă",
    icon: "🦘",
    clasa: 2,
    capitol: "Adunarea și scăderea 0–100",
    manipulativ: "axa",
    competente: ["MEM 1.4"],
    minute: 15,
    note: {
      obiectiv: "Elevul scade descompunând scăzătorul în zeci și unități și reprezintă calculul prin salturi pe axa goală.",
      materiale: "Axa desenată pe tablă; copiii pot face salturile și pe o sfoară cu cleme.",
      desfasurare: [
        "63 − 27: întâi saltul mare (−20), apoi saltul mic (−7).",
        "Arătați că se poate și altfel: −3 până la 60, −20, −4. Toate drumurile ajung la 36.",
        "Pasul 3 e liber: lăudați strategia, nu doar rezultatul.",
      ],
      intrebari: ["Ce salt ai făcut întâi? De ce?", "Cum poți verifica rezultatul cu o adunare (proba)?"],
      greseli: ["Scăderea zecilor și adunarea unităților (63 − 27 = 43 + 7).", "Pornirea salturilor de la scăzător, nu de la descăzut."],
    },
    pasi: [
      {
        text: "Calculăm 63 − 27. Pleacă din 63 și sari înapoi 20 (2 zeci).",
        start: axa({ start: 30, sfarsit: 70, pas: 10 }, ["salt"]),
        verifica: (s) => {
          const sal = ax(s).salturi;
          if (sal.length === 0) return "Atinge întâi 63, apoi locul unde ajungi după 20 de pași înapoi.";
          if (sal[0].de !== 63) return `Ai plecat din ${sal[0].de}. Pleacă din 63.`;
          return sal[0].la === 43 && sal.length === 1 ? true : `Ai ajuns la ${sal[sal.length - 1].la}. Înapoi 20 din 63 înseamnă 2 zeci mai puțin.`;
        },
        indicii: ["63 − 10 = 53, încă −10 = ?", "Ajungi la 43. Poți scrie 63 apoi 43 în căsuța de sub axă."],
        solutie: { stare: axa({ start: 30, sfarsit: 70, pas: 10, salturi: [{ de: 63, la: 43 }] }, ["salt"]) },
      },
      {
        text: "Acum sari înapoi încă 7 unități. Unde ajungi?",
        start: axa({ start: 30, sfarsit: 70, pas: 10, salturi: [{ de: 63, la: 43 }] }, ["salt"]),
        intrebare: "63 − 27 =",
        verifica: (s, r) => {
          const sal = ax(s).salturi;
          if (!drumContinuu(sal) || sal[0]?.de !== 63) return "Salturile trebuie să pornească din 63 și să se lege unul de altul.";
          if (capatSalturi(sal) !== 36) return `Ai ajuns la ${capatSalturi(sal)}. Din 43 mai sari 7 pași înapoi.`;
          return raspunsul(r, 36);
        },
        indicii: ["Atinge 43, apoi numără 7 gradații mici spre stânga.", "43 − 3 = 40, apoi 40 − 4 = 36."],
        solutie: { stare: axa({ start: 30, sfarsit: 70, pas: 10, salturi: [{ de: 63, la: 43 }, { de: 43, la: 36 }] }, ["salt"]), raspuns: 36 },
      },
      {
        text: "Singur: calculează 52 − 18 cu salturi, cum vrei tu.",
        start: axa({ start: 30, sfarsit: 60, pas: 10 }, ["salt"]),
        intrebare: "52 − 18 =",
        verifica: (s, r) => {
          const sal = ax(s).salturi;
          if (sal.length === 0) return "Pleacă din 52 și fă salturi înapoi.";
          if (sal[0].de !== 52) return `Primul salt pleacă din ${sal[0].de}. Pleacă din 52.`;
          if (!drumContinuu(sal)) return "Fiecare salt pleacă de unde s-a oprit cel dinainte.";
          if (sal.some((x) => x.la > x.de)) return "La scădere sărim doar înapoi (spre stânga).";
          if (capatSalturi(sal) !== 34) return `Ai ajuns la ${capatSalturi(sal)}. În total trebuie să sari 18 pași înapoi.`;
          return raspunsul(r, 34);
        },
        indicii: ["Poți sări −10, apoi −8.", "Sau: −2 până la 50, apoi −10, apoi −6."],
        solutie: { stare: axa({ start: 30, sfarsit: 60, pas: 10, salturi: [{ de: 52, la: 42 }, { de: 42, la: 34 }] }, ["salt"]), raspuns: 34 },
      },
    ],
  },

  {
    id: "tabla-sutelor",
    titlu: "Tiparele tablei sutelor",
    icon: "💯",
    clasa: 2,
    capitol: "Numerele 0–1000",
    manipulativ: "tabla",
    competente: ["MEM 1.1", "MEM 3.1"],
    minute: 10,
    note: {
      obiectiv: "Elevul descoperă regularitățile tablei: pe coloană +10, pe rând +1, și le folosește ca să găsească numere ascunse.",
      materiale: "Tabla sutelor printată și jetoane transparente sau creioane colorate.",
      desfasurare: [
        "Colorarea numerelor care se termină în 7 scoate în evidență coloana: cifra unităților rămâne, crește cifra zecilor.",
        "Numere ascunse: copiii explică cu vecinii („e sub 124, deci cu 10 mai mare”).",
        "În Atelier puteți pregăti propriile table cu numere acoperite și trimite linkul.",
      ],
      intrebari: ["Ce se schimbă când cobori un rând? Dar când mergi la dreapta?", "Unde ar fi 207 dacă tabla ar continua?"],
      greseli: ["Confuzia sus/jos (−10/+10).", "La capăt de rând: crezi că după 130 urmează 140, nu 131."],
    },
    pasi: [
      {
        text: "Colorează toate numerele care se termină în 7.",
        start: { tip: "tabla", v: { start: 1, colorate: {}, ascunse: [] } },
        verifica: (s) => {
          const c = colorateTabla(tb(s));
          const corect = [7, 17, 27, 37, 47, 57, 67, 77, 87, 97];
          if (aceleasiNumere(c, corect)) return true;
          const lipsa = corect.filter((x) => !c.includes(x)).length;
          const inPlus = c.filter((x) => !corect.includes(x));
          if (inPlus.length) return `${inPlus.slice(0, 3).join(", ")} nu se termină în 7. Șterge-le cu radiera.`;
          return `Mai lipsesc ${lipsa}. Caută-le pe aceeași coloană.`;
        },
        indicii: ["Sunt toate pe aceeași coloană.", "7, 17, 27 … până la 97: zece numere."],
        solutie: { stare: { tip: "tabla", v: { start: 1, colorate: Object.fromEntries([7, 17, 27, 37, 47, 57, 67, 77, 87, 97].map((n) => [n, 0])), ascunse: [] } } },
      },
      {
        text: "Uită-te la coloana colorată. Cu cât este mai mare fiecare număr decât cel de deasupra lui?",
        start: { tip: "tabla", v: { start: 1, colorate: Object.fromEntries([7, 17, 27, 37, 47, 57, 67, 77, 87, 97].map((n) => [n, 0])), ascunse: [] } },
        intrebare: "Cu",
        verifica: (_, r) => raspunsul(r, 10),
        indicii: ["Compară 27 cu 17.", "Cifra zecilor crește cu 1: o zece mai mult."],
        solutie: { raspuns: 10 },
      },
      {
        text: "Un număr s-a ascuns sub „?”. Ce număr este?",
        start: { tip: "tabla", v: { start: 101, colorate: {}, ascunse: [146] } },
        intrebare: "Numărul ascuns este",
        verifica: (_, r) => raspunsul(r, 146),
        indicii: ["Uită-te la vecinul din stânga și la cel din dreapta.", "Deasupra lui e 136: cu 10 mai mult."],
        solutie: { raspuns: 146 },
      },
      {
        text: "Colorează numărul cu 10 mai mare decât 156 și numărul cu 1 mai mic decât 156.",
        start: { tip: "tabla", v: { start: 101, colorate: { 156: 4 }, ascunse: [] } },
        verifica: (s) => {
          const c = colorateTabla(tb(s)).filter((x) => x !== 156);
          return aceleasiNumere(c, [166, 155]) ? true : c.length < 2 ? "Colorează două numere: unul sub 156 și unul în stânga lui." : `Ai colorat ${c.join(", ")}. Cu 10 mai mare e dedesubt; cu 1 mai mic e în stânga.`;
        },
        indicii: ["Cu 10 mai mare: un rând mai jos.", "Cu 1 mai mic: o căsuță la stânga."],
        solutie: { stare: { tip: "tabla", v: { start: 101, colorate: { 156: 4, 166: 0, 155: 1 }, ascunse: [] } } },
      },
    ],
  },

  {
    id: "bara-parte-intreg",
    titlu: "Modelul în bară: parte și întreg",
    icon: "📊",
    clasa: 2,
    capitol: "Probleme",
    manipulativ: "bara",
    competente: ["MEM 5.2", "MEM 1.4"],
    minute: 15,
    note: {
      obiectiv: "Elevul reprezintă o problemă cu o operație printr-o bară (părți și întreg) și alege operația din desen: întregul = suma părților, partea = întreg − cealaltă parte.",
      materiale: "Benzi de hârtie colorate sau desenul pe caiet (metoda figurativă).",
      desfasurare: [
        "Citiți problema de două ori. Întrebați: „Ce știm? Ce căutăm?” (șablonul în 4 pași).",
        "Cifrele merg pe segmente, „?” merge acolo unde e necunoscuta.",
        "Problema a doua are necunoscută o parte: din desen se vede de ce scădem.",
      ],
      intrebari: ["Unde este întregul pe desen? Dar părțile?", "Ce operație ne arată desenul? De ce?"],
      greseli: ["Adunarea automată a tuturor numerelor din enunț („60 + 24”).", "Segmente de lungimi egale pentru numere foarte diferite (acceptat, dar discutați)."],
    },
    pasi: [
      {
        text: "Ana are 25 de mere roșii și 17 mere verzi. Câte mere are în total? Scrie pe bară ce știm.",
        start: {
          tip: "bara",
          v: { bare: [{ nume: "Merele Anei", segmente: [{ lungime: 25, eticheta: "", editabil: true }, { lungime: 17, eticheta: "", editabil: true, culoare: 2 }], total: "?" }] },
        },
        verifica: (s) => {
          const e = eticheteBara(s, 0);
          if (e.some((x) => x === "")) return "Scrie câte un număr pe fiecare segment.";
          return aceleasiNumere(e.map(Number), [25, 17]) ? true : "Pe segmente scriem merele roșii și merele verzi: 25 și 17.";
        },
        indicii: ["Segmentul lung: merele roșii. Segmentul scurt: merele verzi."],
        solutie: {
          stare: { tip: "bara", v: { bare: [{ nume: "Merele Anei", segmente: [{ lungime: 25, eticheta: "25" }, { lungime: 17, eticheta: "17", culoare: 2 }], total: "?" }] } },
        },
      },
      {
        text: "Acolada arată întregul. Calculează-l și scrie-l în locul semnului întrebării.",
        start: {
          tip: "bara",
          v: { bare: [{ nume: "Merele Anei", segmente: [{ lungime: 25, eticheta: "25" }, { lungime: 17, eticheta: "17", culoare: 2 }], total: "", totalEditabil: true }] },
        },
        verifica: (s) => {
          const t = numarDinEticheta(mb(s).bare[0]?.total);
          return t === 42 ? true : t === null ? "Scrie numărul sub acoladă." : `${t} nu e chiar bine. Întregul = 25 + 17.`;
        },
        indicii: ["Întregul se află adunând părțile.", "25 + 17: 20 + 10 = 30, 5 + 7 = 12, 30 + 12 = ?"],
        solutie: {
          stare: { tip: "bara", v: { bare: [{ nume: "Merele Anei", segmente: [{ lungime: 25, eticheta: "25" }, { lungime: 17, eticheta: "17", culoare: 2 }], total: "42" }] } },
        },
      },
      {
        text: "În coș sunt 60 de nuci. 24 sunt cojite. Câte nuci nu sunt cojite? Scrie numărul pe segmentul gol.",
        start: {
          tip: "bara",
          v: { bare: [{ nume: "Nucile", segmente: [{ lungime: 24, eticheta: "24" }, { lungime: 36, eticheta: "", editabil: true, culoare: 1 }], total: "60" }] },
        },
        verifica: (s) => {
          const x = numarDinEticheta(eticheteBara(s, 0)[1]);
          return x === 36 ? true : x === null ? "Scrie numărul pe segmentul gol." : x === 84 ? "Am adunat, dar 60 este întregul! Căutăm o parte: 60 − 24." : `${x} nu e chiar bine. Partea = întregul − cealaltă parte.`;
        },
        indicii: ["60 este întregul (acolada). 24 este o parte.", "60 − 24 = 60 − 20 − 4."],
        solutie: {
          stare: { tip: "bara", v: { bare: [{ nume: "Nucile", segmente: [{ lungime: 24, eticheta: "24" }, { lungime: 36, eticheta: "36", culoare: 1 }], total: "60" }] } },
        },
      },
    ],
  },

  {
    id: "bara-comparatie",
    titlu: "Modelul în bară: „cu atât mai mult”",
    icon: "⚖️",
    clasa: 2,
    capitol: "Probleme",
    manipulativ: "bara",
    competente: ["MEM 5.2"],
    minute: 15,
    note: {
      obiectiv: "Elevul reprezintă o problemă de comparație cu două bare aliniate și găsește cantitatea mai mare (partea comună + diferența).",
      materiale: "Benzi de hârtie de două culori, așezate una sub alta.",
      desfasurare: [
        "Barele încep din același loc. Partea punctată este diferența („cu 12 mai multe”).",
        "Întrebarea a doua (împreună) leagă comparația de parte–întreg.",
        "Extindere: „cu 12 mai puține”: ce bară e mai scurtă?",
      ],
      intrebari: ["Ce parte au la fel cei doi copii?", "Unde vedem „cu 12 mai multe” pe desen?"],
      greseli: ["Scăderea în loc de adunare din cauza cuvântului „mai”.", "Desenarea diferenței pe bara mai scurtă."],
    },
    pasi: [
      {
        text: "Mihai are 34 de cartonașe. Ioana are cu 12 mai multe decât Mihai. Scrie numerele pe bare.",
        start: {
          tip: "bara",
          v: {
            bare: [
              { nume: "Mihai", segmente: [{ lungime: 34, eticheta: "", editabil: true }] },
              { nume: "Ioana", segmente: [{ lungime: 34, eticheta: "", editabil: true, culoare: 3 }, { lungime: 12, eticheta: "", editabil: true, punctat: true }], total: "?" },
            ],
          },
        },
        verifica: (s) => {
          const m = eticheteBara(s, 0);
          const i = eticheteBara(s, 1);
          if ([...m, ...i].some((x) => x === "")) return "Completează toate cele trei segmente.";
          if (m[0] !== "34") return "Bara lui Mihai arată cartonașele lui: 34.";
          if (i[0] !== "34") return "Prima parte a barei Ioanei este cât a lui Mihai.";
          if (i[1] !== "12") return "Partea punctată arată cu cât are Ioana mai mult: 12.";
          return true;
        },
        indicii: ["Ioana are tot atâtea cât Mihai și încă ceva.", "Mihai: 34. Ioana: 34 și încă 12."],
        solutie: {
          stare: {
            tip: "bara",
            v: {
              bare: [
                { nume: "Mihai", segmente: [{ lungime: 34, eticheta: "34" }] },
                { nume: "Ioana", segmente: [{ lungime: 34, eticheta: "34", culoare: 3 }, { lungime: 12, eticheta: "12", punctat: true }], total: "?" },
              ],
            },
          },
        },
      },
      {
        text: "Câte cartonașe are Ioana? Scrie numărul sub acoladă.",
        start: {
          tip: "bara",
          v: {
            bare: [
              { nume: "Mihai", segmente: [{ lungime: 34, eticheta: "34" }] },
              { nume: "Ioana", segmente: [{ lungime: 34, eticheta: "34", culoare: 3 }, { lungime: 12, eticheta: "12", punctat: true }], total: "", totalEditabil: true },
            ],
          },
        },
        verifica: (s) => {
          const t = numarDinEticheta(mb(s).bare[1]?.total);
          return t === 46 ? true : t === 22 ? "Ioana are MAI MULTE decât Mihai, deci adunăm: 34 + 12." : t === null ? "Scrie numărul sub acoladă." : `${t} nu e chiar bine. Adună cele două părți ale barei.`;
        },
        indicii: ["Bara Ioanei = 34 + 12."],
        solutie: {
          stare: {
            tip: "bara",
            v: {
              bare: [
                { nume: "Mihai", segmente: [{ lungime: 34, eticheta: "34" }] },
                { nume: "Ioana", segmente: [{ lungime: 34, eticheta: "34", culoare: 3 }, { lungime: 12, eticheta: "12", punctat: true }], total: "46" },
              ],
            },
          },
        },
      },
      {
        text: "Câte cartonașe au Mihai și Ioana împreună?",
        start: {
          tip: "bara",
          v: {
            bare: [
              { nume: "Mihai", segmente: [{ lungime: 34, eticheta: "34" }] },
              { nume: "Ioana", segmente: [{ lungime: 34, eticheta: "34", culoare: 3 }, { lungime: 12, eticheta: "12", punctat: true }], total: "46" },
            ],
          },
        },
        intrebare: "Împreună:",
        verifica: (_, r) => (r === 46 ? "Atât are doar Ioana. Adaugă și cartonașele lui Mihai." : raspunsul(r, 80)),
        indicii: ["Împreună = ce are Mihai + ce are Ioana.", "34 + 46 = ?"],
        solutie: { raspuns: 80 },
      },
    ],
  },
];

export function lectie(id: string): Lectie | undefined {
  return LECTII.find((l) => l.id === id);
}

/** Stele după câți pași au fost rezolvați din prima (fără indicii). */
export function steleLectie(dinPrima: number, totalVerificate: number): number {
  if (totalVerificate === 0) return 3;
  const r = dinPrima / totalVerificate;
  return r >= 0.9 ? 3 : r >= 0.6 ? 2 : 1;
}
