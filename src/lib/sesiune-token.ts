/**
 * Token de sesiune semnat (JWT HS256). Fără dependențe Node: rulează și în middleware (Edge).
 */
import { SignJWT, jwtVerify } from "jose";

export type Rol = "ADMIN_SCOALA" | "PROFESOR" | "ELEV";

export interface Sesiune {
  id: string;
  rol: Rol;
  nume: string;
  scoalaId: string;
  schimbaParola: boolean;
}

export const COOKIE_SESIUNE = "mcs_sesiune";
export const DURATA_SESIUNE_S = 60 * 60 * 24 * 30; // 30 de zile

async function cheie(): Promise<Uint8Array> {
  // AUTH_SECRET recomandat; altfel cheie derivată din URL-ul bazei de date (secret pe server).
  const baza =
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    Object.entries(process.env).find(([k, v]) => /_(DATABASE_URL|POSTGRES_URL)$/.test(k) && v)?.[1] ||
    "";
  if (!baza) throw new Error("AUTH_SECRET lipsește");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`mcs-sesiune:${baza}`));
  return new Uint8Array(hash);
}

export async function semneaza(s: Sesiune): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DURATA_SESIUNE_S}s`)
    .sign(await cheie());
}

export async function verifica(token: string | undefined): Promise<Sesiune | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await cheie(), { algorithms: ["HS256"] });
    return payload as unknown as Sesiune;
  } catch {
    return null;
  }
}
