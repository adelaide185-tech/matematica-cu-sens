import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { COOKIE_SESIUNE, DURATA_SESIUNE_S, semneaza, verifica, type Rol, type Sesiune } from "./sesiune-token";

export async function sesiuneCurenta(): Promise<Sesiune | null> {
  return verifica((await cookies()).get(COOKIE_SESIUNE)?.value);
}

export async function deschideSesiune(s: Sesiune) {
  (await cookies()).set(COOKIE_SESIUNE, await semneaza(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURATA_SESIUNE_S,
  });
}

export async function inchideSesiune() {
  (await cookies()).delete(COOKIE_SESIUNE);
}

/** Pentru pagini/acțiuni de server: cere unul dintre roluri, altfel redirecționează. */
export async function cereRol(...roluri: Rol[]): Promise<Sesiune> {
  const s = await sesiuneCurenta();
  if (!s) redirect("/autentificare");
  if (!roluri.includes(s.rol)) redirect("/");
  return s;
}

export const hashParola = (p: string) => bcrypt.hash(p, 10);
export const verificaParola = (p: string, h: string) => bcrypt.compare(p, h);

/** Emailurile administratorilor (variabila ADMIN_EMAILS din Vercel), fără majuscule. */
export function emailuriAdmin(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const CUVINTE = ["mar", "para", "luna", "soare", "nor", "brad", "pisica", "catel", "stea", "lalea", "arici", "vulpe", "ursulet", "albina", "delfin", "girafa"];

/** Parolă temporară ușor de dictat unui copil: „vulpe-4821”. */
export function parolaTemporara(): string {
  const r = new Uint32Array(2);
  crypto.getRandomValues(r);
  return `${CUVINTE[r[0] % CUVINTE.length]}-${String(1000 + (r[1] % 9000))}`;
}

export const ROL_NUME: Record<Rol, string> = { ADMIN_SCOALA: "Administrator", PROFESOR: "Profesor", ELEV: "Elev" };

export function paginaDeStart(rol: Rol): string {
  return rol === "ADMIN_SCOALA" ? "/admin" : rol === "PROFESOR" ? "/profesor" : "/elev";
}
