"use client";

import type { ConfigSesiune, RezultatExercitiu } from "./sesiune";

export interface StareSesiune {
  id?: string;
  config: ConfigSesiune;
  pozitie: number;
  rezultate: RezultatExercitiu[];
  stare: "in_curs" | "pauza" | "terminata";
  actualizat: number;
}

const CHEIE = "mcs-antrenament";

export function citesteLocal(): StareSesiune | null {
  try {
    const s = JSON.parse(localStorage.getItem(CHEIE) ?? "null");
    return s && s.config ? s : null;
  } catch {
    return null;
  }
}

function scrieLocal(s: StareSesiune | null) {
  try {
    if (s) localStorage.setItem(CHEIE, JSON.stringify(s));
    else localStorage.removeItem(CHEIE);
  } catch {}
}

/** Salvează în browser și (dacă există cont) în baza de date. Întoarce starea cu id-ul din cont. */
export async function salveaza(s: StareSesiune): Promise<StareSesiune> {
  const cu = { ...s, actualizat: Date.now() };
  scrieLocal(cu.stare === "terminata" ? null : cu);
  try {
    const r = await fetch("/api/sesiuni", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cu.id, config: cu.config, pozitie: cu.pozitie, rezultate: cu.rezultate, stare: cu.stare }),
      keepalive: true,
    }).then((x) => x.json());
    if (r.id) {
      const cuId = { ...cu, id: r.id };
      if (cuId.stare !== "terminata") scrieLocal(cuId);
      return cuId;
    }
  } catch {}
  return cu;
}

/** Sesiunea neterminată: din cont (dacă există), altfel din browser. */
export async function sesiuneDeschisa(): Promise<StareSesiune | null> {
  const local = citesteLocal();
  try {
    const r = await fetch("/api/sesiuni", { cache: "no-store" }).then((x) => x.json());
    if (r.conectat && r.sesiune) {
      const db: StareSesiune = { id: r.sesiune.id, config: r.sesiune.config, pozitie: r.sesiune.pozitie, rezultate: r.sesiune.rezultate, stare: r.sesiune.stare, actualizat: Date.parse(r.sesiune.actualizat) };
      return local && local.actualizat > db.actualizat && local.id === db.id ? local : db;
    }
    if (r.conectat && !r.sesiune) return local && !local.id ? local : null;
  } catch {}
  return local;
}

export function stergeLocal() {
  scrieLocal(null);
}

export function sunetActiv(): boolean {
  try {
    return localStorage.getItem("mcs-sunet") === "1";
  } catch {
    return false;
  }
}
export function seteazaSunet(v: boolean) {
  try {
    localStorage.setItem("mcs-sunet", v ? "1" : "0");
  } catch {}
}

/** Un sunet scurt și blând (doar la răspuns corect, doar dacă e activat). */
export function sunetBland() {
  if (!sunetActiv()) return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {}
}
