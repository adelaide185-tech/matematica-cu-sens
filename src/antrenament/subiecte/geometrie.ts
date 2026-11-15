import type { Clasa } from "@/motor/tipuri";
import type { Rng } from "@/motor/rng";
import type { Corp, FormaPlana, NivelJoc, Subiect } from "../tipuri";
import { dif } from "./comun";

const CULORI = ["#6a59a7", "#2f6fd1", "#e07a1f", "#2e9e5b", "#e0483e", "#c9a400"];

export const NUME_FORMA: Record<FormaPlana, string> = {
  triunghi: "triunghi", patrat: "pătrat", dreptunghi: "dreptunghi", cerc: "cerc", pentagon: "pentagon",
  hexagon: "hexagon", romb: "romb", trapez: "trapez", oval: "oval",
};
const LATURI: Partial<Record<FormaPlana, number>> = { triunghi: 3, patrat: 4, dreptunghi: 4, pentagon: 5, hexagon: 6, romb: 4, trapez: 4 };

function formeClasa(clasa: Clasa, nivel: NivelJoc): FormaPlana[] {
  const baza: FormaPlana[] = ["triunghi", "patrat", "dreptunghi", "cerc"];
  if (clasa <= 2) return nivel === "usor" ? baza : [...baza, "oval"];
  return clasa === 3 ? [...baza, "pentagon", "hexagon"] : [...baza, "pentagon", "hexagon", "romb", "trapez"];
}

/** Rotiri „frumoase”, ca figurile să nu apară mereu în aceeași poziție. */
const ROT = [0, 15, 30, 45, 60, 90, 120, 160, 200, 250, 300, 330];

export const figuriPlane: Subiect = {
  id: "geo.figuri",
  titlu: "Figuri plane",
  descriere: "Recunoaște figura; numără laturile și colțurile",
  domeniu: "geometrie",
  clase: [1, 2, 3, 4],
  icon: "🔷",
  exercitiu(rng, nivel, clasa) {
    const forme = formeClasa(clasa, nivel);
    const forma = rng.pick(forme);
    const rotatie = forma === "cerc" ? 0 : rng.pick(ROT);
    const culoare = rng.pick(CULORI);
    const intreaba = forma !== "cerc" && forma !== "oval" && nivel !== "usor" ? rng.int(0, 2) : 0;
    if (intreaba > 0) {
      const n = LATURI[forma]!;
      const ce = intreaba === 1 ? "laturi" : "colțuri (vârfuri)";
      return {
        cheie: `fig-${intreaba}:${forma}:${rotatie}`, fapt: forma,
        enunt: `Câte ${ce} are figura?`,
        mecanica: { tip: "figura", forma, rotatie, culoare },
        raspuns: { tip: "numar", valoare: n },
        indicii: [intreaba === 1 ? "Latura este o linie dreaptă de la un colț la altul." : "Colțul (vârful) este locul unde se întâlnesc două laturi.", "Pune degetul pe un colț și numără, mergând de jur împrejur.", `Un ${NUME_FORMA[forma]} are ${n} ${ce.split(" ")[0]}.`],
        dificultate: dif(nivel, clasa),
      };
    }
    const optiuni = rng.shuffle([forma, ...rng.shuffle(forme.filter((f) => f !== forma)).slice(0, 3)]).map((f) => NUME_FORMA[f]);
    return {
      cheie: `fig-n:${forma}:${rotatie}:${culoare}`, fapt: forma,
      enunt: "Ce figură este aceasta?",
      mecanica: { tip: "figura", forma, rotatie, culoare },
      raspuns: { tip: "optiune", valoare: NUME_FORMA[forma], optiuni },
      indicii: [
        forma === "cerc" || forma === "oval" ? "Figura nu are colțuri: e rotundă." : `Numără laturile: are ${LATURI[forma]}.`,
        forma === "patrat" ? "Toate cele 4 laturi sunt egale." : forma === "dreptunghi" ? "Laturile opuse sunt egale, două lungi și două scurte." : forma === "oval" ? "E rotundă, dar alungită." : "Uită-te la colțuri și la laturi.",
        `Este un ${NUME_FORMA[forma]}.`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

const NUME_CORP: Record<Corp, string> = { cub: "cub", sfera: "sferă", cilindru: "cilindru", con: "con", paralelipiped: "paralelipiped", piramida: "piramidă" };
const OBIECTE_CORP: Partial<Record<Corp, string[]>> = {
  cub: ["🎲", "🧊"], sfera: ["⚽", "🏀", "🌍", "🍊"], cilindru: ["🥫", "🧻", "🕯️"], con: ["🍦", "🎄"], paralelipiped: ["📦", "🧱", "📕"],
};
const FMV: Partial<Record<Corp, [number, number, number]>> = { cub: [6, 12, 8], paralelipiped: [6, 12, 8], piramida: [5, 8, 5] };

export const corpuri: Subiect = {
  id: "geo.corpuri",
  titlu: "Corpuri geometrice",
  descriere: "Cub, sferă, cilindru, con…",
  domeniu: "geometrie",
  clase: [1, 2, 3, 4],
  icon: "🧊",
  exercitiu(rng, nivel, clasa) {
    const toate: Corp[] = clasa === 1 ? ["cub", "sfera", "cilindru", "con"] : ["cub", "sfera", "cilindru", "con", "paralelipiped", "piramida"];
    const corp = rng.pick(toate);
    const culoare = rng.pick(CULORI);
    const v = clasa >= 3 && FMV[corp] && nivel !== "usor" ? rng.int(0, 2) : rng.int(0, 1);
    if (v === 2) {
      const [f, m, vv] = FMV[corp]!;
      const k = rng.int(0, 2);
      const [ce, r] = k === 0 ? ["fețe", f] : k === 1 ? ["muchii", m] : ["vârfuri", vv];
      return {
        cheie: `corp-${ce}:${corp}`, fapt: corp,
        enunt: `Câte ${ce} are ${NUME_CORP[corp] === "piramidă" ? "piramida (cu baza pătrat)" : `un ${NUME_CORP[corp]}`}?`,
        mecanica: { tip: "corp", corp, culoare },
        raspuns: { tip: "numar", valoare: r },
        indicii: ["Fața e o suprafață plată; muchia e linia unde se întâlnesc două fețe; vârful e colțul.", "Numără întâi ce vezi în față, apoi ce e ascuns în spate.", `${NUME_CORP[corp]}: ${f} fețe, ${m} muchii, ${vv} vârfuri.`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    if (v === 1 && OBIECTE_CORP[corp]) {
      const bun = rng.pick(OBIECTE_CORP[corp]!);
      const rai = rng.shuffle(Object.entries(OBIECTE_CORP).filter(([c]) => c !== corp).flatMap(([, o]) => o!)).slice(0, 3);
      return {
        cheie: `corp-ob:${corp}:${bun}:${[...rai].sort().join("")}`, fapt: corp,
        enunt: `Care obiect are forma de ${NUME_CORP[corp]}?`,
        mecanica: { tip: "corp", corp, culoare },
        raspuns: { tip: "optiune", valoare: bun, optiuni: rng.shuffle([bun, ...rai]) },
        indicii: [`Uită-te la desenul ${NUME_CORP[corp] === "sferă" ? "sferei" : "corpului"}.`, "Imaginează-ți obiectul din toate părțile.", `${bun} are forma de ${NUME_CORP[corp]}.`],
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `corp-n:${corp}:${culoare}`, fapt: corp,
      enunt: "Ce corp geometric este acesta?",
      mecanica: { tip: "corp", corp, culoare },
      raspuns: { tip: "optiune", valoare: NUME_CORP[corp], optiuni: rng.shuffle([corp, ...rng.shuffle(toate.filter((c) => c !== corp)).slice(0, 3)]).map((c) => NUME_CORP[c]) },
      indicii: [corp === "sfera" ? "Se rostogolește în orice direcție." : corp === "cilindru" ? "Are două fețe rotunde și se poate rostogoli." : corp === "con" ? "Are o față rotundă și un vârf." : "Are fețe plate.", "Gândește-te la un obiect din jurul tău cu aceeași formă.", `Este un ${NUME_CORP[corp]}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const linii: Subiect = {
  id: "geo.linii",
  titlu: "Punct, dreaptă, segment",
  descriere: "Semidreaptă; drepte paralele și perpendiculare",
  domeniu: "geometrie",
  clase: [2, 3, 4],
  icon: "📍",
  exercitiu(rng, nivel, clasa) {
    const pozitie = clasa === 4 && nivel !== "usor" && rng.bool(0.6);
    const feluri = pozitie ? (["paralele", "perpendiculare", "concurente"] as const) : (["punct", "dreapta", "semidreapta", "segment"] as const);
    const fel = rng.pick(feluri);
    const rotatie = rng.pick([0, 20, 35, 60, 90, 110, 145, 170]);
    const NUME: Record<string, string> = { punct: "punct", dreapta: "dreaptă", semidreapta: "semidreaptă", segment: "segment", paralele: "drepte paralele", perpendiculare: "drepte perpendiculare", concurente: "drepte concurente (se taie, dar nu în unghi drept)" };
    const scurt: Record<string, string> = { ...NUME, concurente: "drepte concurente" };
    const AJUTOR: Record<string, string> = {
      punct: "Un punct e doar un loc, fără lungime.",
      dreapta: "Dreapta nu are capete: continuă la nesfârșit în ambele părți (săgeți la ambele capete).",
      semidreapta: "Semidreapta are un singur capăt (un punct) și continuă la nesfârșit în cealaltă parte.",
      segment: "Segmentul are două capete: se poate măsura cu rigla.",
      paralele: "Dreptele paralele nu se întâlnesc niciodată, oricât le-am prelungi.",
      perpendiculare: "Dreptele perpendiculare se taie în unghi drept (ca un colț de caiet).",
      concurente: "Dreptele concurente se taie într-un punct.",
    };
    return {
      cheie: `linie:${fel}:${rotatie}`, fapt: fel,
      enunt: pozitie ? "Cum sunt cele două drepte?" : "Ce este desenat?",
      mecanica: { tip: "linie", fel, rotatie },
      raspuns: { tip: "optiune", valoare: scurt[fel], optiuni: rng.shuffle(feluri.map((f) => scurt[f])) },
      indicii: [pozitie ? "Se întâlnesc dreptele? Dacă da, ce fel de unghi fac?" : "Uită-te la capete: câte puncte vezi? Sunt săgeți?", AJUTOR[fel], `Este: ${NUME[fel]}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const unghiuri: Subiect = {
  id: "geo.unghiuri",
  titlu: "Unghiuri",
  descriere: "Drept, ascuțit sau obtuz? Folosește colțarul",
  domeniu: "geometrie",
  clase: [3, 4],
  icon: "📐",
  exercitiu(rng, nivel, clasa) {
    const rotatie = rng.int(0, 11) * 30;
    if (clasa === 4 && nivel === "provocare" && rng.bool()) {
      const grade = rng.pick([30, 45, 60, 90, 120, 135, 150]);
      const opt = rng.shuffle([grade, ...rng.shuffle([30, 45, 60, 90, 120, 135, 150].filter((g) => g !== grade)).slice(0, 3)]).map((g) => `${g}°`);
      return {
        cheie: `unghi-g:${grade}:${rotatie}`, fapt: `${grade}`,
        enunt: "Estimează măsura unghiului:",
        mecanica: { tip: "unghi", grade, rotatie },
        raspuns: { tip: "optiune", valoare: `${grade}°`, optiuni: opt },
        indicii: ["Compară cu colțul drept (90°): e mai mic sau mai mare?", grade < 90 ? "E mai mic decât 90°: jumătate din unghiul drept are 45°." : grade === 90 ? "Se potrivește exact cu colțarul." : "E mai mare decât 90°: unghiul drept + încă o bucată.", `Unghiul are ${grade}°.`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    const tip = rng.pick(["drept", "ascutit", "obtuz"] as const);
    const grade = tip === "drept" ? 90 : tip === "ascutit" ? rng.pick(nivel === "usor" ? [30, 45] : [25, 40, 55, 70, 80]) : rng.pick(nivel === "usor" ? [135, 150] : [100, 110, 125, 140, 160]);
    const nume = { drept: "drept", ascutit: "ascuțit", obtuz: "obtuz" }[tip];
    return {
      cheie: `unghi:${grade}:${rotatie}`, fapt: tip,
      enunt: "Ce fel de unghi este?",
      mecanica: { tip: "unghi", grade, rotatie },
      raspuns: { tip: "optiune", valoare: nume, optiuni: ["ascuțit", "drept", "obtuz"] },
      indicii: ["Pune colțarul (unghiul drept) peste unghi.", "Mai mic decât colțarul → ascuțit; exact cât colțarul → drept; mai mare → obtuz.", `Unghiul este ${nume}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const numaraFiguri: Subiect = {
  id: "geo.numara",
  titlu: "Numără figurile",
  descriere: "Câte triunghiuri? Câte cercuri?",
  domeniu: "geometrie",
  clase: [1, 2, 3],
  icon: "🔺",
  exercitiu(rng, nivel, clasa) {
    const tipuri = rng.shuffle(formeClasa(Math.min(clasa, 2) as Clasa, "usor")).slice(0, nivel === "usor" ? 2 : 3);
    const total = rng.int(nivel === "usor" ? 4 : 6, nivel === "provocare" ? 12 : 9);
    const locuri = rng.shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, total);
    const forme = locuri.map((loc, i) => ({
      forma: tipuri[i % tipuri.length],
      x: (loc % 4) * 25 + 12.5 + rng.int(-4, 4),
      y: Math.floor(loc / 4) * 33 + 16 + rng.int(-4, 4),
      s: nivel === "provocare" ? rng.int(7, 12) : 10,
      rot: nivel === "usor" ? 0 : rng.pick(ROT),
      culoare: nivel === "provocare" ? rng.pick(CULORI) : CULORI[tipuri.indexOf(tipuri[i % tipuri.length])],
    }));
    const cauta = rng.pick(tipuri);
    const r = forme.filter((f) => f.forma === cauta).length;
    const plural: Record<string, string> = { triunghi: "triunghiuri", patrat: "pătrate", dreptunghi: "dreptunghiuri", cerc: "cercuri", oval: "ovale" };
    return {
      cheie: `num-fig:${cauta}:${forme.map((f) => `${f.forma[0]}${Math.round(f.x)}${Math.round(f.y)}`).join("")}`, fapt: `${cauta}:${r}`,
      enunt: `Câte ${plural[cauta]} vezi?`,
      mecanica: { tip: "scena", forme },
      raspuns: { tip: "numar", valoare: r },
      indicii: [nivel === "provocare" ? "Atenție: figurile au culori și mărimi diferite; contează forma!" : "Uită-te după formă, nu după culoare.", "Numără de la stânga la dreapta, rând cu rând, și pune degetul pe fiecare.", `Sunt ${r} ${plural[cauta]}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

// ───────── rețea: perimetru, arie, simetrie ─────────

/** Dreptunghi de mărime aleatoare, așezat oriunde pe rețea (nu doar în colț). */
function dreptunghiOriunde(rng: Rng, W: number, H: number): number[] {
  let w = rng.int(1, W - 1);
  const h = rng.int(1, H - 1);
  if (w === 1 && h === 1) w = 2;
  return dreptunghiPeGrila(W, rng.int(0, W - w), rng.int(0, H - h), w, h);
}

function dreptunghiPeGrila(W: number, x0: number, y0: number, w: number, h: number): number[] {
  const c: number[] = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) c.push(y * W + x);
  return c;
}

/** Perimetrul (în laturi de pătrățel) al unei figuri formate din pătrățele. */
export function perimetruCelule(W: number, celule: number[]): number {
  const s = new Set(celule);
  let p = 0;
  for (const c of celule) {
    const x = c % W;
    const vecini = [c - W, c + W, x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1];
    for (const v of vecini) if (v < 0 || !s.has(v)) p++;
  }
  return p;
}

/** Figură în formă de L: dreptunghi din care lipsește un colț. */
function formaL(rng: Rng, W: number, H: number): number[] {
  const w = rng.int(3, Math.min(6, W - 1));
  const h = rng.int(3, Math.min(5, H - 1));
  const tw = rng.int(1, w - 1);
  const th = rng.int(1, h - 1);
  const colt = rng.int(0, 3);
  return dreptunghiPeGrila(W, 1, 1, w, h).filter((c) => {
    const x = (c % W) - 1;
    const y = Math.floor(c / W) - 1;
    const dx = colt % 2 === 0 ? x < tw : x >= w - tw;
    const dy = colt < 2 ? y < th : y >= h - th;
    return !(dx && dy);
  });
}

export const perimetru: Subiect = {
  id: "geo.perimetru",
  titlu: "Perimetrul",
  descriere: "Drumul de jur împrejurul figurii",
  domeniu: "geometrie",
  clase: [2, 3, 4],
  icon: "🚶",
  exercitiu(rng, nivel, clasa) {
    const W = 9, H = 7;
    if (nivel === "usor" || (nivel === "provocare" && rng.bool())) {
      const celule = nivel === "usor" ? dreptunghiOriunde(rng, W, H) : formaL(rng, W, H);
      const p = perimetruCelule(W, celule);
      return {
        cheie: `per-g:${celule.join(",")}`, fapt: `${p}`,
        enunt: "Fiecare latură de pătrățel are 1 cm. Care este perimetrul figurii (în cm)?",
        mecanica: { tip: "grila", latime: W, inaltime: H, celule },
        raspuns: { tip: "numar", valoare: p },
        indicii: ["Perimetrul este lungimea drumului de jur împrejurul figurii.", "Pornește dintr-un colț și numără fiecare latură de pătrățel de pe margine, până te întorci.", `Perimetrul este ${p} cm.`],
        dificultate: dif(nivel, clasa, nivel === "provocare" ? 1 : 0),
      };
    }
    const tip = rng.int(0, nivel === "provocare" ? 2 : 1);
    if (tip === 2) {
      // latura lipsă dintr-un dreptunghi cu perimetrul dat
      const L = rng.int(4, 15), l = rng.int(2, L - 1);
      return {
        cheie: `per-lipsa:${L}:${l}`, fapt: `${L}x${l}`,
        enunt: `Un dreptunghi are perimetrul ${2 * (L + l)} cm și lungimea ${L} cm. Cât este lățimea?`,
        mecanica: { tip: "grila", latime: W, inaltime: H, celule: dreptunghiPeGrila(W, 1, 1, 6, 3), laturi: { L, l: 0 } },
        raspuns: { tip: "numar", valoare: l },
        indicii: [`Perimetrul = L + l + L + l. Cele două lungimi împreună: ${L} + ${L} = ${2 * L} cm.`, `${2 * (L + l)} − ${2 * L} = ${2 * l} cm pentru cele două lățimi.`, `${2 * l} : 2 = ${l} cm`],
        dificultate: dif(nivel, clasa, 2),
      };
    }
    const patrat = tip === 1;
    const L = rng.int(2, clasa === 2 ? 12 : 30);
    const l = patrat ? L : rng.int(1, L - 1);
    const p = 2 * (L + l);
    return {
      cheie: `per-l:${patrat ? "p" : "d"}:${L}:${l}`, fapt: `${L}x${l}`,
      enunt: patrat ? `Care este perimetrul pătratului cu latura de ${L} cm?` : `Care este perimetrul dreptunghiului cu lungimea ${L} cm și lățimea ${l} cm?`,
      mecanica: { tip: "grila", latime: W, inaltime: H, celule: dreptunghiPeGrila(W, 1, 1, patrat ? 4 : 6, patrat ? 4 : 3), laturi: { L, l } },
      raspuns: { tip: "numar", valoare: p },
      indicii: [patrat ? "Pătratul are 4 laturi egale." : "Dreptunghiul are două lungimi și două lățimi.", patrat ? `${L} + ${L} + ${L} + ${L} sau 4 × ${L}` : `${L} + ${l} + ${L} + ${l}`, `Perimetrul este ${p} cm.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const arie: Subiect = {
  id: "geo.arie",
  titlu: "Aria",
  descriere: "Câte pătrățele acoperă figura?",
  domeniu: "geometrie",
  clase: [3, 4],
  icon: "🟩",
  exercitiu(rng, nivel, clasa) {
    const W = 9, H = 7;
    if (nivel === "provocare" && clasa === 4 && rng.bool()) {
      const L = rng.int(2, 20), l = rng.int(1, 12);
      const patrat = rng.bool(0.3);
      const ll = patrat ? L : l;
      return {
        cheie: `arie-l:${L}:${ll}`, fapt: `${L}x${ll}`,
        enunt: patrat ? `Care este aria pătratului cu latura de ${L} cm (în cm²)?` : `Care este aria dreptunghiului cu L = ${L} cm și l = ${ll} cm (în cm²)?`,
        mecanica: { tip: "grila", latime: W, inaltime: H, celule: dreptunghiPeGrila(W, 1, 1, patrat ? 4 : 6, patrat ? 4 : 3), laturi: { L, l: ll } },
        raspuns: { tip: "numar", valoare: L * ll },
        indicii: ["Aria = câte pătrățele de 1 cm² încap în figură.", `Un rând are ${L} pătrățele; sunt ${ll} rânduri.`, `${L} × ${ll} = ${L * ll} cm²`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    const celule = nivel === "usor" ? dreptunghiOriunde(rng, W, H) : formaL(rng, W, H);
    return {
      cheie: `arie-g:${celule.join(",")}`, fapt: `${celule.length}`,
      enunt: "Fiecare pătrățel are 1 cm². Care este aria figurii (în cm²)?",
      mecanica: { tip: "grila", latime: W, inaltime: H, celule },
      raspuns: { tip: "numar", valoare: celule.length },
      indicii: ["Aria înseamnă câte pătrățele acoperă figura (nu marginea!).", nivel === "usor" ? "Numără pătrățelele de pe un rând și înmulțește cu numărul de rânduri." : "Împarte figura în dreptunghiuri, află aria fiecăruia și adună.", `Aria este ${celule.length} cm².`],
      dificultate: dif(nivel, clasa),
    };
  },
};

/** Axe de simetrie (în grade; 90 = verticală) pentru figurile desenate fără rotire. */
const AXE: Partial<Record<FormaPlana, number[]>> = {
  patrat: [0, 45, 90, 135], dreptunghi: [0, 90], triunghi: [90, 30, 150], romb: [0, 90], trapez: [90],
  hexagon: [0, 30, 60, 90, 120, 150], pentagon: [90, 18, 54, 126, 162], oval: [0, 90],
};

export const simetrie: Subiect = {
  id: "geo.simetrie",
  titlu: "Simetria",
  descriere: "Oglindește desenul; axa de simetrie",
  domeniu: "geometrie",
  clase: [2, 3, 4],
  icon: "🦋",
  exercitiu(rng, nivel, clasa) {
    const v = nivel === "usor" ? 0 : rng.int(0, clasa >= 3 ? 2 : 1);
    if (v === 0) {
      const W = nivel === "usor" ? 6 : 8;
      const H = nivel === "usor" ? 4 : 6;
      const orizontala = nivel === "provocare" && rng.bool();
      // jumătatea dată: stânga (sau sus)
      const jum = orizontala ? Array.from({ length: (H / 2) * W }, (_, i) => i) : Array.from({ length: H * W }, (_, i) => i).filter((i) => i % W < W / 2);
      const k = rng.int(nivel === "usor" ? 2 : 3, nivel === "usor" ? 4 : 7);
      const date = rng.shuffle(jum).slice(0, k).sort((a, b) => a - b);
      const oglinda = date.map((c) => (orizontala ? (H - 1 - Math.floor(c / W)) * W + (c % W) : Math.floor(c / W) * W + (W - 1 - (c % W)))).sort((a, b) => a - b);
      return {
        cheie: `sim:${orizontala ? "o" : "v"}:${W}:${date.join(",")}`, fapt: date.join(","),
        enunt: `Colorează pătrățelele ca desenul să fie simetric față de linia punctată.`,
        mecanica: { tip: "simetrie", latime: W, inaltime: H, celule: date, axa: orizontala ? "orizontala" : "verticala", interactiv: true },
        raspuns: { tip: "multime", valori: oglinda },
        indicii: ["Linia punctată e ca o oglindă: fiecare pătrățel colorat are „geamănul” lui de partea cealaltă.", `Numără cât de departe e pătrățelul de linie, apoi numără la fel de partea cealaltă.`, `Trebuie colorate ${oglinda.length} pătrățele, la aceeași distanță de linie.`],
        dificultate: dif(nivel, clasa),
      };
    }
    const forme = (Object.keys(AXE) as FormaPlana[]).filter((f) => formeClasa(clasa, "provocare").includes(f));
    const forma = rng.pick(forme);
    if (v === 2) {
      const n = AXE[forma]!.length;
      return {
        cheie: `sim-axe:${forma}`, fapt: forma,
        enunt: `Câte axe de simetrie are ${forma === "triunghi" ? "triunghiul echilateral" : forma === "pentagon" || forma === "hexagon" ? `${NUME_FORMA[forma]}ul regulat` : forma === "trapez" ? "trapezul isoscel" : `${NUME_FORMA[forma]}ul`}?`,
        mecanica: { tip: "figura", forma, rotatie: 0, culoare: rng.pick(CULORI) },
        raspuns: { tip: "numar", valoare: n },
        indicii: ["O axă de simetrie împarte figura în două jumătăți care se suprapun perfect la îndoire.", "Încearcă: verticală, orizontală, pe diagonale…", `${NUME_FORMA[forma]}: ${n} ${n === 1 ? "axă" : "axe"} de simetrie.`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    const corecte = AXE[forma]!;
    const da = rng.bool();
    const axa = da ? rng.pick(corecte) : rng.pick([0, 20, 45, 70, 90, 110, 135, 160].filter((a) => !corecte.includes(a)));
    return {
      cheie: `sim-da:${forma}:${axa}`, fapt: forma,
      enunt: "Este linia punctată o axă de simetrie a figurii?",
      mecanica: { tip: "figura", forma, rotatie: 0, culoare: rng.pick(CULORI), axa },
      raspuns: { tip: "optiune", valoare: da ? "Da" : "Nu", optiuni: ["Da", "Nu"] },
      indicii: ["Imaginează-ți că îndoi foaia pe linia punctată.", "Cele două jumătăți se suprapun exact?", da ? "Da: jumătățile se suprapun." : "Nu: jumătățile nu se suprapun."],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const coordonate: Subiect = {
  id: "geo.coordonate",
  titlu: "Planul de coordonate",
  descriere: "Vânătoarea de comori pe rețea",
  domeniu: "geometrie",
  clase: [4],
  icon: "🗺️",
  exercitiu(rng, nivel) {
    const max = nivel === "usor" ? 5 : 8;
    const x = rng.int(nivel === "provocare" ? 0 : 1, max);
    const y = rng.int(nivel === "provocare" ? 0 : 1, max);
    if (rng.bool()) {
      return {
        cheie: `coord-pune:${max}:${x}:${y}`, fapt: `${x},${y}`,
        enunt: `Ascunde comoara în punctul (${x}, ${y}).`,
        mecanica: { tip: "coordonate", max, interactiv: true },
        raspuns: { tip: "construit", valoare: x * 100 + y },
        indicii: ["Primul număr spune cât mergi spre dreapta (pe axa orizontală).", "Al doilea număr spune cât urci (pe axa verticală).", `Mergi ${x} pași la dreapta și ${y} pași în sus.`],
        dificultate: dif(nivel, 4),
      };
    }
    return {
      cheie: `coord-citeste:${max}:${x}:${y}`, fapt: `${x},${y}`,
      enunt: "Unde este comoara? Scrie coordonatele.",
      mecanica: { tip: "coordonate", max, punct: [x, y] },
      raspuns: { tip: "campuri", valori: [x, y], etichete: ["x (orizontal)", "y (vertical)"] },
      indicii: ["Coboară cu privirea de la comoară până la axa de jos: acolo e x.", "Mergi de la comoară spre stânga, până la axa verticală: acolo e y.", `Comoara este în (${x}, ${y}).`],
      dificultate: dif(nivel, 4),
    };
  },
};

export const SUBIECTE_GEOMETRIE = [figuriPlane, corpuri, linii, unghiuri, numaraFiguri, perimetru, arie, simetrie, coordonate];
