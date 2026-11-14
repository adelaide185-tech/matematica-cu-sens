"use client";

/**
 * Progresul elevului. În această etapă se păstrează în browser (localStorage);
 * după activarea conturilor se va salva în baza de date (tabelele Incercare / Stapanire / RecompensaObtinuta).
 */
export interface Progres {
  stele: Record<string, number>; // cheie: joc-clasa → cel mai bun scor (0–3)
  puncteLogica: number;
  puncteViteza: number;
  trofee: string[];
  clasa: number;
}

const CHEIE = "mcs-progres";
const GOL: Progres = { stele: {}, puncteLogica: 0, puncteViteza: 0, trofee: [], clasa: 2 };

export function citesteProgres(): Progres {
  try {
    return { ...GOL, ...JSON.parse(localStorage.getItem(CHEIE) ?? "{}") };
  } catch {
    return GOL;
  }
}

export function salveazaProgres(p: Progres) {
  try {
    localStorage.setItem(CHEIE, JSON.stringify(p));
  } catch {}
}

export const TROFEE: Record<string, { nume: string; icon: string; descriere: string }> = {
  "prima-stea": { nume: "Prima stea", icon: "⭐", descriere: "Ai terminat primul joc" },
  "scara-perfecta": { nume: "Alpinist", icon: "🧗", descriere: "Ai urcat Scara fără nicio greșeală" },
  "numaratoare-3": { nume: "Maestrul sutelor", icon: "🧮", descriere: "3 stele la Numărătoarea magică" },
  "fractii-3": { nume: "Bucătar de fracții", icon: "🍕", descriere: "3 stele la Pizza fracțiilor" },
  "100-puncte": { nume: "Carte de Misiuni", icon: "📜", descriere: "Ai strâns 100 de puncte" },
};

/** Înregistrează rezultatul unui joc și întoarce trofeele noi. */
export function inregistreaza(joc: string, clasa: number, stele: number, puncte: { logica?: number; viteza?: number }, trofeeCandidate: string[]): string[] {
  const p = citesteProgres();
  const cheie = `${joc}-${clasa}`;
  p.stele[cheie] = Math.max(p.stele[cheie] ?? 0, stele);
  p.puncteLogica += puncte.logica ?? 0;
  p.puncteViteza += puncte.viteza ?? 0;
  const candidate = [...trofeeCandidate, "prima-stea"];
  if (p.puncteLogica + p.puncteViteza >= 100) candidate.push("100-puncte");
  const noi = candidate.filter((t) => !p.trofee.includes(t));
  p.trofee.push(...noi);
  salveazaProgres(p);
  // cu cont de elev: salvăm și în baza de date (fără să blocăm jocul dacă nu reușește)
  fetch("/api/progres", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ joc, clasa, stele, logica: puncte.logica ?? 0, viteza: puncte.viteza ?? 0, trofee: candidate, ...rezultat }),
    keepalive: true,
  }).catch(() => {});
  return noi;
}

let rezultat: { corecte?: number; total?: number } = {};
/** Răspunsurile corecte / totale ale jocului în curs (trimise odată cu rezultatul). */
export function seteazaRezultat(corecte: number, total: number) {
  rezultat = { corecte, total };
}

/** Combină progresul din browser cu cel din cont (cel mai bun scor câștigă). */
export async function sincronizeazaProgres(): Promise<Progres> {
  const local = citesteProgres();
  try {
    const r = await fetch("/api/progres", { cache: "no-store" }).then((x) => x.json());
    if (!r.conectat) return local;
    const stele = { ...local.stele };
    for (const [k, v] of Object.entries(r.stele as Record<string, number>)) stele[k] = Math.max(stele[k] ?? 0, v);
    const p: Progres = {
      ...local,
      stele,
      puncteLogica: Math.max(local.puncteLogica, r.puncteLogica),
      puncteViteza: Math.max(local.puncteViteza, r.puncteViteza),
      trofee: [...new Set([...local.trofee, ...r.trofee])],
    };
    salveazaProgres(p);
    return p;
  } catch {
    return local;
  }
}

/** Dificultate adaptivă simplă: 3 corecte la rând → urcă; 2 greșeli la rând → coboară. */
export class Adaptiv {
  nivel: number;
  private corecte = 0;
  private gresite = 0;
  constructor(start = 0, private max = 2) {
    this.nivel = start;
  }
  raspuns(corect: boolean): number {
    if (corect) {
      this.corecte++;
      this.gresite = 0;
      if (this.corecte >= 3 && this.nivel < this.max) {
        this.nivel++;
        this.corecte = 0;
      }
    } else {
      this.gresite++;
      this.corecte = 0;
      if (this.gresite >= 2 && this.nivel > 0) {
        this.nivel--;
        this.gresite = 0;
      }
    }
    return this.nivel;
  }
}

export function steleDinGreseli(greseli: number): number {
  return greseli === 0 ? 3 : greseli <= 2 ? 2 : 1;
}
