import type { Clasa } from "./tipuri";

export type Calificativ = "FB" | "B" | "S" | "I";

export const NUME_CALIFICATIV: Record<Calificativ, string> = {
  FB: "Foarte bine",
  B: "Bine",
  S: "Suficient",
  I: "Insuficient",
};

/** Praguri implicite (procent din punctajul itemilor), configurabile de profesor. */
export const PRAGURI_IMPLICITE = { FB: 90, B: 70, S: 50 };

export function calificativ(procent: number, praguri = PRAGURI_IMPLICITE): Calificativ {
  if (procent >= praguri.FB) return "FB";
  if (procent >= praguri.B) return "B";
  if (procent >= praguri.S) return "S";
  return "I";
}

/** Clasa a V-a: 90 de puncte pe itemi + 10 din oficiu → nota = total / 10, rotunjită la 2 zecimale. */
export function nota(puncteObtinute: number, puncteMaxime: number): number {
  const scalat = puncteMaxime > 0 ? (puncteObtinute / puncteMaxime) * 90 : 0;
  return Math.round((scalat + 10) * 10) / 100;
}

/** Descriptori de performanță afișați în barem. */
export function descriptori(clasa: Clasa, puncteMaxime: number, praguri = PRAGURI_IMPLICITE) {
  if (clasa === 5) {
    return [
      { eticheta: "Nota", text: `Nota = (punctaj obținut × 90 / ${puncteMaxime} + 10 din oficiu) : 10` },
    ];
  }
  const p = (proc: number) => Math.ceil((proc / 100) * puncteMaxime);
  return [
    { eticheta: "FB", text: `${p(praguri.FB)} – ${puncteMaxime} puncte` },
    { eticheta: "B", text: `${p(praguri.B)} – ${p(praguri.FB) - 1} puncte` },
    { eticheta: "S", text: `${p(praguri.S)} – ${p(praguri.B) - 1} puncte` },
    { eticheta: "I", text: `0 – ${p(praguri.S) - 1} puncte` },
  ];
}
