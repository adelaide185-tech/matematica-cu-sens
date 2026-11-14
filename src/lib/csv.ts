/** Citire CSV simplă (virgulă sau punct și virgulă, ghilimele), pentru importul elevilor. */
export function citesteCsv(text: string): string[][] {
  const linii = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!linii.length) return [];
  const sep = (linii[0].match(/;/g)?.length ?? 0) > (linii[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  return linii.map((linie) => {
    const out: string[] = [];
    let cur = "";
    let ghilimele = false;
    for (let i = 0; i < linie.length; i++) {
      const ch = linie[i];
      if (ghilimele) {
        if (ch === '"' && linie[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') ghilimele = false;
        else cur += ch;
      } else if (ch === '"') ghilimele = true;
      else if (ch === sep) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  });
}

export interface RandElev {
  nume: string;
  prenume: string;
  email: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Acceptă coloanele nume, prenume, email (în orice ordine, cu antet) sau, fără antet,
 * ordinea „nume, prenume, email”. Întoarce rândurile valide și erorile pe linii.
 */
export function randuriElevi(text: string): { randuri: RandElev[]; erori: string[] } {
  const tabel = citesteCsv(text);
  if (!tabel.length) return { randuri: [], erori: ["Lista este goală."] };
  const antet = tabel[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  const areAntet = antet.some((h) => h.includes("email") || h === "nume" || h === "prenume");
  const idx = areAntet
    ? { nume: antet.findIndex((h) => h === "nume" || h === "nume de familie"), prenume: antet.findIndex((h) => h.startsWith("prenume")), email: antet.findIndex((h) => h.includes("email") || h.includes("e-mail")) }
    : { nume: 0, prenume: 1, email: 2 };
  if (idx.email < 0 || idx.nume < 0 || idx.prenume < 0) return { randuri: [], erori: ["Antetul trebuie să conțină coloanele: nume, prenume, email."] };

  const randuri: RandElev[] = [];
  const erori: string[] = [];
  const vazute = new Set<string>();
  tabel.slice(areAntet ? 1 : 0).forEach((r, i) => {
    const linie = i + (areAntet ? 2 : 1);
    const email = (r[idx.email] ?? "").toLowerCase();
    const nume = r[idx.nume] ?? "";
    const prenume = r[idx.prenume] ?? "";
    if (!EMAIL.test(email)) return erori.push(`Linia ${linie}: email invalid („${email}”).`);
    if (!nume || !prenume) return erori.push(`Linia ${linie}: lipsește numele sau prenumele.`);
    if (vazute.has(email)) return erori.push(`Linia ${linie}: emailul ${email} apare de două ori.`);
    vazute.add(email);
    randuri.push({ nume, prenume, email });
  });
  return { randuri, erori };
}

export function scrieCsv(randuri: string[][]): string {
  return "﻿" + randuri.map((r) => r.map((c) => (/[",;\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\r\n");
}
