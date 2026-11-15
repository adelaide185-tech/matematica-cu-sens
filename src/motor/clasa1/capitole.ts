import type { CapitolC1, JocC1, SubtemaBani, SubtemaGeometrie, SubtemaNumere, SubtemaTimp, FormaTermen } from "./tipuri";

export interface InfoCapitol {
  id: CapitolC1;
  titlu: string;
  scurt: string;
  icon: string;
  descriere: string;
  /** jocurile în care pot apărea exercițiile capitolului (în ordinea preferinței) */
  jocuri: JocC1[];
}

export const CAPITOLE_C1: InfoCapitol[] = [
  { id: "numere", titlu: "Numerele naturale 0 – 100", scurt: "Numerele 0–100", icon: "🔢",
    descriere: "Recunoaștere, numărare din 1, 2, 5, 10, zeci și unități, vecini, comparare, ordonare, par / impar.",
    jocuri: ["grupeaza", "balanta", "casuta", "perechi"] },
  { id: "adsc20", titlu: "Adunarea și scăderea 0 – 20", scurt: "Calcul 0–20", icon: "➕",
    descriere: "Fără și cu trecere peste ordin; sprijin vizual opțional (cadrul de 10).",
    jocuri: ["cursa", "perechi", "casuta", "balanta"] },
  { id: "adsc100", titlu: "Adunarea și scăderea 0 – 100", scurt: "Calcul 0–100", icon: "🧮",
    descriere: "Doar fără trecere peste ordin (34 + 25, 68 − 42) sau cu trecere (27 + 15, 52 − 18).",
    jocuri: ["cursa", "perechi", "casuta", "balanta"] },
  { id: "termen", titlu: "Aflarea termenului necunoscut", scurt: "Termenul necunoscut", icon: "❓",
    descriere: "a + □ = b, □ + a = b, a − □ = b, □ − a = b, în concentrul 0–20 sau 0–100.",
    jocuri: ["casuta", "balanta"] },
  { id: "geometrie", titlu: "Geometrie și orientare spațială", scurt: "Geometrie", icon: "🔷",
    descriere: "Cerc, pătrat, triunghi, dreptunghi; cub, sferă, cilindru; laturi și colțuri; stânga / dreapta, sus / jos, interior / exterior.",
    jocuri: ["perechi", "casuta"] },
  { id: "timp", titlu: "Timpul", scurt: "Timpul", icon: "🕒",
    descriere: "Ceasul la oră fixă și la jumătate de oră, zilele săptămânii, lunile anului, anotimpurile.",
    jocuri: ["perechi"] },
  { id: "bani", titlu: "Banii", scurt: "Banii", icon: "🪙",
    descriere: "Bancnotele de 1, 5, 10, 50 și 100 de lei; câți bani sunt; cumpărături simple.",
    jocuri: ["perechi", "casuta"] },
  { id: "lungime", titlu: "Lungimea", scurt: "Lungimea", icon: "📏",
    descriere: "Măsurarea obiectelor în centimetri, cu rigla.",
    jocuri: ["casuta"] },
  { id: "probleme", titlu: "Probleme simple", scurt: "Probleme", icon: "🧩",
    descriere: "Cu o operație (și, opțional, două operații simple), formulate scurt, cu desen ajutător.",
    jocuri: ["casuta", "cursa"] },
];

export const capitolC1 = (id: CapitolC1) => CAPITOLE_C1.find((c) => c.id === id)!;

export const JOCURI_C1: Record<JocC1, { nume: string; icon: string; descriere: string }> = {
  grupeaza: { nume: "Numără și grupează", icon: "🧺", descriere: "Formează numerele din mănunchiuri de 10 și bețișoare de 1." },
  cursa: { nume: "Cursa prietenoasă", icon: "🚀", descriere: "Racheta înaintează la fiecare răspuns corect. Cronometrul e oprit, dacă nu îl pornești tu." },
  perechi: { nume: "Potrivește perechile", icon: "🃏", descriere: "Calcul ↔ rezultat, ceas ↔ oră, figură ↔ nume, bancnotă ↔ valoare." },
  balanta: { nume: "Balanța numerelor", icon: "⚖️", descriere: "<, > sau =; balanța se înclină spre numărul mai mare." },
  casuta: { nume: "Căsuța magică", icon: "🪄", descriere: "Completează numărul care lipsește, cu tastatura mare de pe ecran." },
};

export const SUBTEME_NUMERE: { id: SubtemaNumere; nume: string }[] = [
  { id: "recunoastere", nume: "Recunoaștere" },
  { id: "numarare", nume: "Numărare (din 1, 2, 5, 10)" },
  { id: "zeci-unitati", nume: "Zeci și unități" },
  { id: "vecini", nume: "Vecinii unui număr" },
  { id: "comparare", nume: "Comparare <, >, =" },
  { id: "ordonare", nume: "Ordonare" },
  { id: "par-impar", nume: "Par / impar" },
];
export const SUBTEME_GEOMETRIE: { id: SubtemaGeometrie; nume: string }[] = [
  { id: "figuri", nume: "Figuri plane" },
  { id: "corpuri", nume: "Corpuri geometrice" },
  { id: "laturi", nume: "Laturi și colțuri" },
  { id: "pozitii", nume: "Poziții în spațiu" },
];
export const SUBTEME_TIMP: { id: SubtemaTimp; nume: string }[] = [
  { id: "ceas", nume: "Ceasul" },
  { id: "zile", nume: "Zilele săptămânii" },
  { id: "luni", nume: "Lunile anului" },
  { id: "anotimpuri", nume: "Anotimpurile" },
];
export const SUBTEME_BANI: { id: SubtemaBani; nume: string }[] = [
  { id: "recunoastere", nume: "Recunoaște bancnota" },
  { id: "numara", nume: "Câți lei sunt?" },
  { id: "cumparaturi", nume: "Cumpărături" },
];
export const FORME_TERMEN: { id: FormaTermen; nume: string }[] = [
  { id: "a+x=b", nume: "a + □ = b" },
  { id: "x+a=b", nume: "□ + a = b" },
  { id: "a-x=b", nume: "a − □ = b" },
  { id: "x-a=b", nume: "□ − a = b" },
];
