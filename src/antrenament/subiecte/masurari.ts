import type { Clasa } from "@/motor/tipuri";
import type { NivelJoc, Subiect } from "../tipuri";
import { dif, fmt } from "./comun";
import { cuSubstantiv } from "@/motor/limba";

const SINGULAR: Record<string, string> = { "săptămâni": "săptămână", ore: "oră", zile: "zi", ani: "an", decenii: "deceniu", minute: "minut", secole: "secol", milenii: "mileniu", luni: "lună", secunde: "secundă" };
const cuUnitate = (n: number, pl: string) => cuSubstantiv(n, SINGULAR[pl] ?? pl, pl);

const OBIECTE_LUNGI = ["✏️", "🖍️", "🔑", "🥕", "🐛", "📎", "🖊️", "🌿"];

// ───────── lungime ─────────

export const lungime: Subiect = {
  id: "mas.lungime",
  titlu: "Măsurăm cu rigla",
  descriere: "Cât de lung este obiectul?",
  domeniu: "masurari",
  clase: [1, 2, 3, 4],
  icon: "📏",
  exercitiu(rng, nivel, clasa) {
    const mm = clasa >= 3 && nivel === "provocare";
    const max = clasa === 1 ? 10 : 14;
    const lungimeCm = mm ? rng.int(10, (max - 1) * 10) / 10 : rng.int(1, nivel === "usor" ? max : max - 4);
    const start = nivel === "usor" ? 0 : rng.int(1, Math.max(1, Math.floor(max - lungimeCm)));
    const obiect = rng.pick(OBIECTE_LUNGI);
    const val = mm ? Math.round(lungimeCm * 10) : lungimeCm;
    const unit = mm ? "mm" : "cm";
    return {
      cheie: `lung:${obiect}:${start}:${lungimeCm}`, fapt: `${start}:${lungimeCm}`,
      enunt: `Cât de lung este obiectul? (în ${unit === "mm" ? "milimetri" : "centimetri"})`,
      mecanica: { tip: "rigla", start, lungime: lungimeCm, unitate: unit, obiect },
      raspuns: { tip: "numar", valoare: val },
      indicii: [
        start === 0 ? "Obiectul începe de la 0. Unde se termină?" : `Atenție: obiectul nu începe de la 0, ci de la ${start}!`,
        start === 0 ? "Citește numărul de sub capătul obiectului." : `Scade: unde se termină − ${start}.`,
        mm ? `${fmt(start + lungimeCm)} − ${start} = ${lungimeCm} cm = ${val} mm` : `${start + lungimeCm} − ${start} = ${lungimeCm} cm`,
      ],
      dificultate: dif(nivel, clasa),
    };
  },
};

/** Reguli de transformare pe clase (programa: cl. II m–dm–cm; cl. III + mm, km; masă și capacitate). */
function reguli(clasa: Clasa): [string, string, number][] {
  const r: [string, string, number][] = [["m", "cm", 100], ["m", "dm", 10], ["dm", "cm", 10]];
  if (clasa >= 3) r.push(["cm", "mm", 10], ["m", "mm", 1000], ["km", "m", 1000], ["kg", "g", 1000], ["l", "ml", 1000]);
  if (clasa >= 4) r.push(["t", "kg", 1000], ["hl", "l", 100], ["dm", "mm", 100]);
  return r;
}

export const transformari: Subiect = {
  id: "mas.transformari",
  titlu: "Transformăm unități",
  descriere: "Scara unităților: ×10, ×100, ×1000",
  domeniu: "masurari",
  clase: [2, 3, 4],
  icon: "🔁",
  exercitiu(rng, nivel, clasa) {
    const [mare, mic, f] = rng.pick(reguli(clasa));
    const x = rng.int(1, nivel === "usor" ? 9 : 20);
    const scara = f === 10 ? [mare, mic] : f === 100 ? [mare, "…", mic] : [mare, "…", "…", mic];
    if (nivel !== "usor" && rng.bool(0.45)) {
      const y = rng.int(1, f - 1);
      return {
        cheie: `tr2:${x}${mare}${y}${mic}`, fapt: `${mare}${mic}`,
        enunt: `${x} ${mare} ${y} ${mic} = ? ${mic}`,
        mecanica: { tip: "calendar", elemente: scara },
        raspuns: { tip: "numar", valoare: x * f + y },
        indicii: [`1 ${mare} = ${f} ${mic}.`, `${x} ${mare} = ${x * f} ${mic}; mai adaugă ${y} ${mic}.`, `${x * f} + ${y} = ${x * f + y} ${mic}`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    const inJos = rng.bool();
    return {
      cheie: `tr:${inJos ? "j" : "s"}:${x}:${mare}${mic}`, fapt: `${mare}${mic}`,
      enunt: inJos ? `${x} ${mare} = ? ${mic}` : `${fmt(x * f)} ${mic} = ? ${mare}`,
      mecanica: { tip: "calendar", elemente: scara },
      raspuns: { tip: "numar", valoare: inJos ? x * f : x },
      indicii: [`1 ${mare} = ${f} ${mic}.`, inJos ? `Din unitatea mare în cea mică → înmulțim cu ${f}.` : `Din unitatea mică în cea mare → împărțim la ${f}.`, inJos ? `${x} × ${f} = ${fmt(x * f)} ${mic}` : `${fmt(x * f)} : ${f} = ${x} ${mare}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

// ───────── masă ─────────

export const masa: Subiect = {
  id: "mas.masa",
  titlu: "Cântărim",
  descriere: "Citește cântarul; adună greutățile",
  domeniu: "masurari",
  clase: [1, 2, 3, 4],
  icon: "⚖️",
  exercitiu(rng, nivel, clasa) {
    const OB = ["🍉", "🎃", "🍎", "🥔", "🧀", "🍞", "🐱", "📦"];
    const obiect = rng.pick(OB);
    const tipEx = rng.int(0, 3);
    if (tipEx === 3) {
      // care e mai greu? (comparare pe balanță)
      const [o1, o2] = rng.shuffle(OB).slice(0, 2);
      const g = clasa <= 2 ? "kg" : "g";
      const val = () => (g === "kg" ? rng.int(1, 20) : rng.int(2, 40) * 50);
      const a = val();
      let b = val();
      if (b === a) b = a + (g === "kg" ? 1 : 50);
      const greu = a > b ? o1 : o2;
      return {
        cheie: `greu:${g}:${Math.min(a, b)}:${Math.max(a, b)}`, fapt: `${a}?${b}`,
        enunt: `${o1} cântărește ${a} ${g}, ${o2} cântărește ${b} ${g}. Care este mai greu?`,
        mecanica: { tip: "balanta", stanga: `${o1} ${a} ${g}`, dreapta: `${o2} ${b} ${g}`, valStanga: a, valDreapta: b },
        raspuns: { tip: "optiune", valoare: greu, optiuni: [o1, o2] },
        indicii: ["Compară numerele: care e mai mare?", "Talerul cu obiectul mai greu coboară.", `${greu} este mai greu (${Math.max(a, b)} ${g}).`],
        dificultate: dif(nivel, clasa),
      };
    }
    if (tipEx === 2 && clasa >= 2) {
      // cât mai trebuie până la 1 kg (2 kg)?
      const tinta = clasa === 2 ? 1000 : rng.pick([1000, 2000]);
      const are = clasa === 2 ? rng.int(1, 9) * 100 : rng.int(1, tinta / 50 - 1) * 50;
      if (are < tinta) {
        return {
          cheie: `masa-lipsa:${are}:${tinta}`, fapt: `${are}`,
          enunt: `Pe cântar sunt ${are} g. Câte grame mai trebuie puse ca să fie ${tinta / 1000} kg?`,
          mecanica: { tip: "cantar", valoare: are, max: tinta, pas: clasa === 2 ? 100 : 50, unitate: "g", obiect },
          raspuns: { tip: "numar", valoare: tinta - are },
          indicii: ["1 kg = 1000 g.", `${tinta} − ${are} = ?`, `Mai trebuie ${tinta - are} g.`],
          dificultate: dif(nivel, clasa, 1),
        };
      }
    }
    if (tipEx === 1 && clasa >= 2) {
      const greutati = rng.distinct(rng.int(2, 3), () => rng.pick(clasa === 2 ? [1, 2, 5] : [100, 200, 500, 1000, 2000]), String);
      const unitate = clasa === 2 ? "kg" : "g";
      const total = greutati.reduce((a, b) => a + b, 0);
      const txt = greutati.map((g) => (unitate === "g" && g >= 1000 ? `${g / 1000} kg` : `${g} ${unitate}`)).join(" + ");
      return {
        cheie: `greut:${greutati.sort((a, b) => a - b).join("+")}`, fapt: `${total}`,
        enunt: `Pe taler sunt greutățile: ${txt}. Cât cântăresc împreună (în ${unitate === "g" ? "grame" : "kilograme"})?`,
        mecanica: { tip: "expresie", text: "" },
        raspuns: { tip: "numar", valoare: total },
        indicii: [unitate === "g" ? "1 kg = 1000 g. Transformă totul în grame." : "Adună kilogramele.", `Adună: ${greutati.join(" + ")}.`, `${greutati.join(" + ")} = ${total} ${unitate}`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    const [max, pas, unitate] =
      clasa === 1 ? [20, 1, "kg"] :
      clasa === 2 ? (nivel === "usor" || rng.bool() ? [20, 1, "kg"] : [1000, 100, "g"]) :
      nivel === "usor" ? (rng.bool() ? [1000, 100, "g"] : [20, 1, "kg"]) : [2000, 50, "g"];
    const valoare = rng.int(1, Math.floor(max / pas) - 1) * pas;
    return {
      cheie: `cantar:${unitate}:${valoare}`, fapt: `${valoare}${unitate}`,
      enunt: `Cât cântărește? (în ${unitate === "g" ? "grame" : "kilograme"})`,
      mecanica: { tip: "cantar", valoare, max, pas, unitate, obiect },
      raspuns: { tip: "numar", valoare },
      indicii: [`Fiecare liniuță mică înseamnă ${pas} ${unitate}.`, "Pornește de la cel mai apropiat număr scris și numără liniuțele până la ac.", `Acul arată ${fmt(valoare)} ${unitate}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

// ───────── capacitate ─────────

export const capacitate: Subiect = {
  id: "mas.capacitate",
  titlu: "Cât lichid este?",
  descriere: "Citește recipientul gradat",
  domeniu: "masurari",
  clase: [1, 2, 3, 4],
  icon: "🧃",
  exercitiu(rng, nivel, clasa) {
    if (rng.bool(0.3)) {
      // care recipient are mai mult?
      const u = clasa <= 2 ? "l" : "ml";
      const v = () => (u === "l" ? rng.int(1, 20) : rng.int(2, 40) * 50);
      const a = v();
      let b = v();
      if (a === b) b = a + (u === "l" ? 1 : 50);
      const [r1, r2] = rng.shuffle(["🫙 borcanul", "🪣 găleata", "🍶 sticla", "🫖 ceainicul", "🥛 cana", "🧴 flaconul"]).slice(0, 2);
      const mai = a > b ? r1 : r2;
      return {
        cheie: `cap-cmp:${u}:${Math.min(a, b)}:${Math.max(a, b)}`, fapt: `${a}?${b}`,
        enunt: `În ${r1} sunt ${a} ${u}, în ${r2} sunt ${b} ${u}. Unde este mai mult lichid?`,
        mecanica: { tip: "recipient", valoare: Math.max(a, b), max: u === "l" ? 21 : 2050, pas: u === "l" ? 1 : 50, unitate: u },
        raspuns: { tip: "optiune", valoare: mai, optiuni: [r1, r2] },
        indicii: ["Compară cele două cantități.", "Numărul mai mare înseamnă mai mult lichid.", `${mai}: ${Math.max(a, b)} ${u}`],
        dificultate: dif(nivel, clasa),
      };
    }
    const [max, pas, unitate]: [number, number, string] =
      clasa === 1 ? [12, 1, "pahare"] :
      clasa === 2 ? (nivel === "usor" || rng.bool() ? [20, 1, "l"] : [1000, 100, "ml"]) :
      nivel === "usor" ? (rng.bool() ? [1000, 100, "ml"] : [20, 1, "l"]) : [2000, 50, "ml"];
    const valoare = rng.int(1, Math.floor(max / pas) - 1) * pas;
    if (nivel === "provocare" && unitate === "ml") {
      const lipsa = max / 2 >= valoare ? 1000 - valoare : 2000 - valoare;
      const pana = valoare + lipsa;
      return {
        cheie: `cap-lipsa:${valoare}:${pana}`, fapt: `${valoare}`,
        enunt: `Câți mililitri mai trebuie turnați ca să ajungă la ${pana === 1000 ? "1 litru" : "2 litri"}?`,
        mecanica: { tip: "recipient", valoare, max, pas, unitate },
        raspuns: { tip: "numar", valoare: lipsa },
        indicii: [`Citește întâi cât lichid este: ${valoare} ml.`, `1 l = 1000 ml. ${pana} − ${valoare} = ?`, `${pana} − ${valoare} = ${lipsa} ml`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    return {
      cheie: `cap:${unitate}:${valoare}`, fapt: `${valoare}${unitate}`,
      enunt: unitate === "pahare" ? "Câte pahare de suc sunt în carafă?" : `Cât lichid este în recipient? (în ${unitate === "l" ? "litri" : "mililitri"})`,
      mecanica: { tip: "recipient", valoare, max, pas, unitate },
      raspuns: { tip: "numar", valoare },
      indicii: [`Fiecare liniuță înseamnă ${pas} ${unitate === "pahare" ? "pahar" : unitate}.`, "Citește liniuța la care ajunge lichidul.", `${fmt(valoare)} ${unitate}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

// ───────── timp ─────────

/** Minutele permise pe ceas, după clasă și nivel (programa: cl. I ore fixe, cl. II jumătăți/sferturi, apoi minute). */
function minuteCeas(clasa: Clasa, nivel: NivelJoc): number {
  if (clasa === 1) return 60;
  if (clasa === 2) return nivel === "usor" ? 30 : 15;
  if (clasa === 3) return nivel === "usor" ? 15 : 5;
  return nivel === "provocare" ? 1 : 5;
}

const hm = (h: number, m: number) => `${h}:${String(m).padStart(2, "0")}`;
function vorbit(h: number, m: number): string {
  const urm = (h % 12) + 1;
  if (m === 0) return `ora ${h} fix`;
  if (m === 30) return `${h} și jumătate`;
  if (m === 15) return `${h} și un sfert`;
  if (m === 45) return `${urm} fără un sfert`;
  return m < 30 ? `${h} și ${m} minute` : `${urm} fără ${60 - m} minute`;
}

export const ceas: Subiect = {
  id: "timp.ceas",
  titlu: "Ceasul",
  descriere: "Citește ora sau mută acele",
  domeniu: "timp",
  clase: [1, 2, 3, 4],
  icon: "🕒",
  exercitiu(rng, nivel, clasa) {
    const pas = minuteCeas(clasa, nivel);
    const h = rng.int(1, 12);
    const m = pas >= 60 ? 0 : rng.int(0, Math.floor(59 / pas)) * pas;
    const v = rng.int(0, 2);
    const ind = [
      "Acul mic (scurt) arată ora; acul mare (lung) arată minutele.",
      m === 0 ? "Când acul mare e la 12, este „fix”." : `Acul mare la ${m / 5 === Math.floor(m / 5) ? m / 5 : "între cifre"}: fiecare cifră de pe ceas înseamnă 5 minute.`,
      `${hm(h, m)} — „${vorbit(h, m)}”`,
    ];
    if (v === 0) {
      return {
        cheie: `ceas-set:${h}:${m}`, fapt: hm(h, m),
        enunt: `Mută acele ca ceasul să arate ${nivel === "provocare" ? `„${vorbit(h, m)}”` : hm(h, m)}.`,
        mecanica: { tip: "ceas", ore: 12, minute: 0, interactiv: true, pasMinute: pas >= 60 ? 60 : Math.min(pas, 30) },
        raspuns: { tip: "construit", valoare: (h % 12) * 60 + m },
        indicii: ind,
        dificultate: dif(nivel, clasa),
      };
    }
    if (v === 1 || clasa === 1) {
      const variante = rng.distinct(3, () => {
        const hh = rng.pick([h, (h % 12) + 1, ((h + 10) % 12) + 1, m === 0 ? h : rng.int(1, 12)]);
        const mm = pas >= 60 ? 0 : rng.pick([m, (m + 30) % 60, (60 - m) % 60, rng.int(0, 11) * 5]);
        return hm(hh, mm);
      }).filter((x) => x !== hm(h, m)).slice(0, 3);
      for (let k = 1; variante.length < 3; k++) if (!variante.includes(hm(((h + k) % 12) + 1, m))) variante.push(hm(((h + k) % 12) + 1, m));
      return {
        cheie: `ceas-alege:${h}:${m}`, fapt: hm(h, m),
        enunt: "Ce oră arată ceasul?",
        mecanica: { tip: "ceas", ore: h, minute: m },
        raspuns: { tip: "optiune", valoare: hm(h, m), optiuni: rng.shuffle([hm(h, m), ...variante]) },
        indicii: ind,
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `ceas-scrie:${h}:${m}`, fapt: hm(h, m),
      enunt: "Scrie ora pe care o arată ceasul:",
      mecanica: { tip: "ceas", ore: h, minute: m },
      raspuns: { tip: "campuri", valori: [h, m], etichete: ["ora", "minute"] },
      indicii: ind,
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

export const durata: Subiect = {
  id: "timp.durata",
  titlu: "Cât timp a trecut?",
  descriere: "Ora de început, durata, ora de sfârșit",
  domeniu: "timp",
  clase: [2, 3, 4],
  icon: "⏳",
  exercitiu(rng, nivel, clasa) {
    const pas = clasa === 2 ? (nivel === "usor" ? 60 : 30) : clasa === 3 ? 5 : nivel === "provocare" ? 1 : 5;
    const start = rng.int(7, 18) * 60 + (pas >= 60 ? 0 : rng.int(0, Math.floor(59 / pas)) * pas);
    const durataMin = rng.int(1, clasa === 2 ? 4 : 8) * Math.max(pas, clasa === 2 ? 30 : 5) + (clasa === 4 && nivel === "provocare" ? rng.int(0, 4) : 0);
    const final = start + durataMin;
    const f = (x: number) => hm(Math.floor(x / 60), x % 60);
    const act = rng.pick(["Filmul", "Lecția de înot", "Excursia", "Antrenamentul", "Spectacolul", "Ora de pian"]);
    if (rng.bool()) {
      return {
        cheie: `dur-final:${start}:${durataMin}`, fapt: `${start}+${durataMin}`,
        enunt: `${act} începe la ${f(start)} și durează ${durataMin % 60 === 0 ? cuSubstantiv(durataMin / 60, "oră", "ore") : cuSubstantiv(durataMin, "minut", "minute")}. La ce oră se termină?`,
        mecanica: { tip: "linieTimp", start, durata: durataMin },
        raspuns: { tip: "campuri", valori: [Math.floor(final / 60), final % 60], etichete: ["ora", "minute"] },
        indicii: ["Adună întâi orele întregi, apoi minutele.", `Dacă minutele trec de 60, mai adaugă o oră (60 de minute = 1 oră).`, `${f(start)} + ${durataMin} min = ${f(final)}`],
        dificultate: dif(nivel, clasa, 1),
      };
    }
    return {
      cheie: `dur-cat:${start}:${durataMin}`, fapt: `${start}+${durataMin}`,
      enunt: `${act} a început la ${f(start)} și s-a terminat la ${f(final)}. Câte minute a durat?`,
      mecanica: { tip: "linieTimp", start, durata: durataMin },
      raspuns: { tip: "numar", valoare: durataMin },
      indicii: ["Numără de la ora de început până la ora întreagă următoare, apoi mai departe.", "1 oră = 60 de minute.", `De la ${f(start)} la ${f(final)}: ${cuSubstantiv(durataMin, "minut", "minute")}`],
      dificultate: dif(nivel, clasa, 1),
    };
  },
};

const ZILE = ["luni", "marți", "miercuri", "joi", "vineri", "sâmbătă", "duminică"];
const LUNI = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];

export const calendar: Subiect = {
  id: "timp.calendar",
  titlu: "Zile, luni, ani",
  descriere: "Calendarul și unitățile de timp",
  domeniu: "timp",
  clase: [1, 2, 3, 4],
  icon: "📅",
  exercitiu(rng, nivel, clasa) {
    const tip = rng.int(0, clasa === 1 ? 1 : 2);
    if (tip === 0) {
      const z = rng.int(0, 6);
      const d = nivel === "usor" ? rng.pick([1, -1]) : rng.pick([2, 3, 4, -2, -3, 5, 8, 10]);
      const r = ZILE[(((z + d) % 7) + 7) % 7];
      return {
        cheie: `zi:${z}:${d}`, fapt: `${z}:${d}`,
        enunt: d === 1 ? `Azi este ${ZILE[z]}. Ce zi va fi mâine?` : d === -1 ? `Azi este ${ZILE[z]}. Ce zi a fost ieri?` : d > 0 ? `Azi este ${ZILE[z]}. Ce zi va fi peste ${d} zile?` : `Azi este ${ZILE[z]}. Ce zi a fost acum ${-d} zile?`,
        mecanica: { tip: "calendar", elemente: ZILE, evidentiat: z },
        raspuns: { tip: "optiune", valoare: r, optiuni: rng.shuffle([r, ...rng.shuffle(ZILE.filter((x) => x !== r)).slice(0, 3)]) },
        indicii: ["Săptămâna are 7 zile; după duminică vine iar luni.", `Numără ${Math.abs(d)} ${Math.abs(d) === 1 ? "zi" : "zile"} ${d > 0 ? "înainte" : "înapoi"}, pe fâșie.`, `Răspuns: ${r}`],
        dificultate: dif(nivel, clasa),
      };
    }
    if (tip === 1) {
      const l = rng.int(0, 11);
      const d = nivel === "usor" ? 1 : rng.pick([2, 3, 4, 6, -1, -2]);
      const r = LUNI[(((l + d) % 12) + 12) % 12];
      return {
        cheie: `luna:${l}:${d}`, fapt: `${l}:${d}`,
        enunt: d === 1 ? `Ce lună vine după ${LUNI[l]}?` : d > 0 ? `Ce lună va fi peste ${d} luni, dacă acum este ${LUNI[l]}?` : `Ce lună a fost acum ${-d} ${d === -1 ? "lună" : "luni"}, dacă acum este ${LUNI[l]}?`,
        mecanica: { tip: "calendar", elemente: LUNI.map((x) => x.slice(0, 3)), evidentiat: l },
        raspuns: { tip: "optiune", valoare: r, optiuni: rng.shuffle([r, ...rng.shuffle(LUNI.filter((x) => x !== r)).slice(0, 3)]) },
        indicii: ["Anul are 12 luni, de la ianuarie la decembrie.", `Numără pe fâșie ${Math.abs(d)} ${d > 0 ? "înainte" : "înapoi"}.`, `Răspuns: ${r}`],
        dificultate: dif(nivel, clasa),
      };
    }
    const reg: [string, string, number][] = [["săptămâni", "zile", 7], ["ore", "minute", 60], ["zile", "ore", 24]];
    if (clasa >= 3) reg.push(["ani", "luni", 12], ["decenii", "ani", 10], ["minute", "secunde", 60]);
    if (clasa >= 4) reg.push(["secole", "ani", 100], ["milenii", "ani", 1000]);
    const [mare, mic, f] = rng.pick(reg);
    const x = rng.int(1, nivel === "usor" ? 3 : 9);
    return {
      cheie: `ut:${x}:${mare}`, fapt: `${mare}`,
      enunt: `${cuUnitate(x, mare)} = ? ${mic}`,
      mecanica: { tip: "expresie", text: "" },
      raspuns: { tip: "numar", valoare: x * f },
      indicii: [`Ține minte: 1 ${SINGULAR[mare]} = ${f} ${mic}.`, `${x} × ${f}`, `${cuUnitate(x, mare)} = ${cuUnitate(x * f, mic)}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

// ───────── bani ─────────

/** Monede și bancnote românești, în bani (100 bani = 1 leu). Desenate generic, fără imitarea bancnotelor reale. */
const PIESE: Record<Clasa, number[]> = {
  1: [100, 500, 1000],
  2: [10, 50, 100, 500, 1000],
  3: [10, 50, 100, 500, 1000, 5000],
  4: [5, 10, 50, 100, 500, 1000, 5000, 10000],
  5: [5, 10, 50, 100, 500, 1000, 5000, 10000],
};
export const textBani = (b: number) => (b % 100 === 0 ? `${fmt(b / 100)} ${b === 100 ? "leu" : "lei"}` : b < 100 ? `${b} bani` : `${Math.floor(b / 100)} lei și ${b % 100} bani`);

export const numaraBanii: Subiect = {
  id: "bani.numara",
  titlu: "Câți bani sunt?",
  descriere: "Numără monedele și bancnotele",
  domeniu: "bani",
  clase: [1, 2, 3, 4],
  icon: "🪙",
  exercitiu(rng, nivel, clasa) {
    const piese = PIESE[clasa].filter((p) => (clasa === 1 || nivel !== "usor" ? true : p >= 100));
    const k = rng.int(2, nivel === "usor" ? 5 : 6);
    const alese = Array.from({ length: k }, () => rng.pick(piese)).sort((a, b) => b - a);
    const total = alese.reduce((a, b) => a + b, 0);
    const cuBani = total % 100 !== 0;
    if (rng.bool(0.3)) {
      const pret = Math.max(100, total + rng.pick([-3, -2, -1, 1, 2, 3]) * (clasa === 1 ? 100 : rng.pick([10, 50, 100])));
      const ajung = total >= pret;
      return {
        cheie: `ajung:${alese.join("+")}:${pret}`, fapt: `${total}?${pret}`,
        enunt: `Ai banii de mai jos. O jucărie costă ${textBani(pret)}. Îți ajung banii?`,
        mecanica: { tip: "bani", piese: alese },
        raspuns: { tip: "optiune", valoare: ajung ? "Da, ajung" : "Nu, nu ajung", optiuni: ["Da, ajung", "Nu, nu ajung"] },
        indicii: ["Numără întâi câți bani ai.", `Ai ${textBani(total)}. Compară cu prețul.`, ajung ? `${textBani(total)} ≥ ${textBani(pret)}: ajung.` : `${textBani(total)} < ${textBani(pret)}: nu ajung.`],
        dificultate: dif(nivel, clasa),
      };
    }
    return {
      cheie: `numbani:${alese.join("+")}`, fapt: String(total),
      enunt: cuBani ? "Câți bani sunt în total?" : "Câți lei sunt în total?",
      mecanica: { tip: "bani", piese: alese },
      raspuns: cuBani ? { tip: "campuri", valori: [Math.floor(total / 100), total % 100], etichete: ["lei", "bani"] } : { tip: "numar", valoare: total / 100 },
      indicii: ["Începe cu bancnotele cele mai mari, apoi adaugă monedele.", "100 de bani = 1 leu.", `Total: ${textBani(total)}`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const plateste: Subiect = {
  id: "bani.plateste",
  titlu: "La magazin: plătește exact",
  descriere: "Alege monedele și bancnotele potrivite",
  domeniu: "bani",
  clase: [1, 2, 3, 4],
  icon: "🛒",
  exercitiu(rng, nivel, clasa) {
    const piese = PIESE[clasa].filter((p) => (clasa === 1 || nivel !== "usor" ? true : p >= 100));
    // orice preț care se poate plăti exact cu piesele clasei (multiplu al celei mai mici piese)
    const mic = Math.min(...piese);
    const maxLei = { 1: 50, 2: nivel === "usor" ? 30 : 100, 3: nivel === "usor" ? 100 : 300, 4: nivel === "usor" ? 300 : 1000, 5: 1000 }[clasa];
    const pret = rng.int(2, Math.floor((maxLei * 100) / mic)) * mic;
    const produs = rng.pick(["🧸 ursulețul", "📚 cartea", "⚽ mingea", "🖍️ creioanele", "🧃 sucul", "🪁 zmeul", "🎒 penarul", "🍦 înghețata"]);
    return {
      cheie: `plata:${pret}`, fapt: String(pret),
      enunt: `${produs} costă ${textBani(pret)}. Plătește exact!`,
      mecanica: { tip: "magazin", pret, disponibile: piese, produs },
      raspuns: { tip: "construit", valoare: pret },
      indicii: ["Alege întâi bancnota cea mai mare care nu depășește prețul.", "Apoi completează cu bani mai mici până ajungi exact la preț.", `Trebuie să plătești ${textBani(pret)}.`],
      dificultate: dif(nivel, clasa),
    };
  },
};

export const rest: Subiect = {
  id: "bani.rest",
  titlu: "Cât rest primești?",
  descriere: "Plătești, cumperi, primești restul",
  domeniu: "bani",
  clase: [2, 3, 4],
  icon: "🧾",
  exercitiu(rng, nivel, clasa) {
    const bancnota = rng.pick(clasa === 2 ? [10, 50] : clasa === 3 ? [50, 100] : [100, 200, 500]);
    const nrProduse = nivel === "provocare" ? 2 : 1;
    const preturi = Array.from({ length: nrProduse }, () => rng.int(1, Math.floor(bancnota / (nrProduse + 0.5))));
    const total = preturi.reduce((a, b) => a + b, 0);
    const r = bancnota - total;
    return {
      cheie: `rest:${bancnota}:${preturi.join("+")}`, fapt: `${bancnota}-${total}`,
      enunt: `Cumperi ${nrProduse === 1 ? `un produs de ${preturi[0]} lei` : `două produse, de ${preturi[0]} lei și de ${preturi[1]} lei`} și plătești cu o bancnotă de ${bancnota} lei. Cât rest primești (în lei)?`,
      mecanica: { tip: "bani", piese: [bancnota * 100] },
      raspuns: { tip: "numar", valoare: r },
      indicii: [nrProduse > 1 ? `Află întâi cât costă împreună: ${preturi.join(" + ")}.` : "Restul = cât ai dat − cât costă.", `${bancnota} − ${total} = ?`, `Restul: ${r} lei`],
      dificultate: dif(nivel, clasa, nrProduse - 1),
    };
  },
};

export const SUBIECTE_MASURARI = [lungime, transformari, masa, capacitate, ceas, durata, calendar, numaraBanii, plateste, rest];
