"use client";
import type { Varsta } from "./continut";

const CHEIE = "mcs-engleza-varsta";
export function citesteVarsta(): Varsta {
  try { const v = Number(localStorage.getItem(CHEIE)); return v === 4 || v === 6 ? v : 5; } catch { return 5; }
}
export function salveazaVarsta(v: Varsta) {
  try { localStorage.setItem(CHEIE, String(v)); } catch {}
}
