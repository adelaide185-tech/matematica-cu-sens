"use client";

import { useEffect, useState } from "react";
import { spuneText } from "@/lib/voce";

/** Disponibilitatea citirii, aflată după montare (pe server nu există; altfel randarea ar diferi). */
export function usePoateCiti(): boolean {
  const [da, setDa] = useState(false);
  useEffect(() => setDa(poateCiti()), []);
  return da;
}

/** Citirea cerinței cu vocea browserului (română), pentru copiii care încă citesc încet. */
export function poateCiti(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pentruVoce(t: string): string {
  return t
    .replace(/□|\?(?=\s*[=+−-])|_{3}/g, " căsuța ")
    .replace(/−/g, " minus ")
    .replace(/\+/g, " plus ")
    .replace(/(\d)\s*=\s*\?/g, "$1 egal cu cât")
    .replace(/=/g, " egal ")
    .replace(/</g, " mai mic decât ")
    .replace(/>/g, " mai mare decât ")
    .replace(/(\d+):00/g, "ora $1")
    .replace(/(\d+):30/g, "ora $1 și jumătate")
    .replace(/\s+/g, " ")
    .trim();
}

export function citeste(text: string) {
  if (!poateCiti() || !text) return;
  try {
    // vocea jucăușă comună (mai rară, ton mai înalt; reglabilă de adult)
    spuneText(pentruVoce(text), "ro");
  } catch {}
}

export function opresteCitirea() {
  try {
    if (poateCiti()) window.speechSynthesis.cancel();
  } catch {}
}

const CHEIE_AUTO = "mcs-c1-citire-auto";
export function citireAutomata(): boolean {
  try {
    return localStorage.getItem(CHEIE_AUTO) === "1";
  } catch {
    return false;
  }
}
export function seteazaCitireAutomata(v: boolean) {
  try {
    localStorage.setItem(CHEIE_AUTO, v ? "1" : "0");
  } catch {}
}
