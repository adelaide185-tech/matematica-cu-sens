"use server";

import { redirect } from "next/navigation";
import { db } from "./db";
import { deschideSesiune, emailuriAdmin, hashParola, inchideSesiune, paginaDeStart, sesiuneCurenta, verificaParola } from "./auth";
import type { Rol } from "./sesiune-token";

export interface StareFormular {
  eroare?: string;
  ok?: string;
}

const NUME_SCOALA_IMPLICIT = "Fabrica de Inteligență";

/** Limitare simplă a încercărilor de autentificare (per instanță de server). */
const incercari = new Map<string, { n: number; pana: number }>();
function blocat(email: string): boolean {
  const x = incercari.get(email);
  return Boolean(x && x.n >= 8 && x.pana > Date.now());
}
function inregistreazaEsec(email: string) {
  const x = incercari.get(email);
  const acum = Date.now();
  if (!x || x.pana < acum) incercari.set(email, { n: 1, pana: acum + 15 * 60_000 });
  else x.n++;
}

/** Doar adrese relative, ca să nu putem fi folosiți pentru redirecționări externe. */
function destinatieSigura(d: string | null | undefined): string | null {
  return d && d.startsWith("/") && !d.startsWith("//") ? d : null;
}

export async function autentificare(_: StareFormular, f: FormData): Promise<StareFormular> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const parola = String(f.get("parola") ?? "");
  if (!email || !parola) return { eroare: "Completează emailul și parola." };
  if (blocat(email)) return { eroare: "Prea multe încercări. Încearcă din nou peste 15 minute." };

  const u = await db.utilizator.findUnique({ where: { email } });
  if (!u || !(await verificaParola(parola, u.parolaHash))) {
    inregistreazaEsec(email);
    if (!u && emailuriAdmin().includes(email)) return { eroare: "Contul de administrator nu este încă activat. Mergi la „Prima configurare”." };
    return { eroare: "Email sau parolă greșită." };
  }
  incercari.delete(email);
  await db.utilizator.update({ where: { id: u.id }, data: { ultimaAutentificare: new Date() } });
  await deschideSesiune({ id: u.id, rol: u.rol as Rol, nume: `${u.prenume} ${u.nume}`.trim(), scoalaId: u.scoalaId, schimbaParola: u.schimbaParola });
  redirect(u.schimbaParola ? "/schimba-parola" : destinatieSigura(String(f.get("inapoi") ?? "")) ?? paginaDeStart(u.rol as Rol));
}

export async function deconectare() {
  await inchideSesiune();
  redirect("/autentificare");
}

/**
 * Prima configurare: un email din ADMIN_EMAILS își alege parola o singură dată.
 * Dacă nu există încă nicio școală, o creăm.
 */
export async function configurareAdmin(_: StareFormular, f: FormData): Promise<StareFormular> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const parola = String(f.get("parola") ?? "");
  const nume = String(f.get("nume") ?? "").trim();
  const prenume = String(f.get("prenume") ?? "").trim();
  if (!emailuriAdmin().includes(email)) return { eroare: "Acest email nu este în lista administratorilor (variabila ADMIN_EMAILS din Vercel)." };
  if (parola.length < 10) return { eroare: "Parola trebuie să aibă cel puțin 10 caractere." };
  if (parola !== String(f.get("parola2") ?? "")) return { eroare: "Parolele nu coincid." };
  if (!nume || !prenume) return { eroare: "Completează numele și prenumele." };
  if (await db.utilizator.findUnique({ where: { email } })) return { eroare: "Contul există deja. Folosește pagina de autentificare." };

  const scoala = (await db.scoala.findFirst({ orderBy: { creatLa: "asc" } })) ?? (await db.scoala.create({ data: { nume: NUME_SCOALA_IMPLICIT } }));
  const u = await db.utilizator.create({
    data: { email, nume, prenume, rol: "ADMIN_SCOALA", parolaHash: await hashParola(parola), schimbaParola: false, scoalaId: scoala.id, licenta: { create: {} } },
  });
  await deschideSesiune({ id: u.id, rol: "ADMIN_SCOALA", nume: `${prenume} ${nume}`, scoalaId: scoala.id, schimbaParola: false });
  redirect("/admin");
}

export async function schimbaParola(_: StareFormular, f: FormData): Promise<StareFormular> {
  const s = await sesiuneCurenta();
  if (!s) redirect("/autentificare");
  const veche = String(f.get("veche") ?? "");
  const noua = String(f.get("noua") ?? "");
  const u = await db.utilizator.findUnique({ where: { id: s.id } });
  if (!u || !(await verificaParola(veche, u.parolaHash))) return { eroare: "Parola actuală nu este corectă." };
  const minim = u.rol === "ELEV" ? 6 : 10;
  if (noua.length < minim) return { eroare: `Parola nouă trebuie să aibă cel puțin ${minim} caractere.` };
  if (noua !== String(f.get("noua2") ?? "")) return { eroare: "Parolele noi nu coincid." };
  if (noua === veche) return { eroare: "Alege o parolă diferită de cea veche." };
  await db.utilizator.update({ where: { id: u.id }, data: { parolaHash: await hashParola(noua), schimbaParola: false } });
  await deschideSesiune({ ...s, schimbaParola: false });
  redirect(paginaDeStart(s.rol));
}
