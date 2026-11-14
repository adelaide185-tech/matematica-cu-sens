"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { cereRol, hashParola, parolaTemporara } from "./auth";
import { randuriElevi } from "./csv";

export interface ContNou {
  nume: string;
  prenume: string;
  email: string;
  parola: string;
  clasa?: string;
}
export interface StareAdmin {
  eroare?: string;
  ok?: string;
  conturi?: ContNou[];
  erori?: string[];
}

export async function creeazaClasa(_: StareAdmin, f: FormData): Promise<StareAdmin> {
  const s = await cereRol("ADMIN_SCOALA");
  const nume = String(f.get("nume") ?? "").trim();
  const nivel = Number(f.get("nivel"));
  const anScolar = String(f.get("anScolar") ?? "").trim() || anScolarCurent();
  if (!nume || ![1, 2, 3, 4, 5].includes(nivel)) return { eroare: "Alege nivelul (I–V) și un nume pentru clasă." };
  const profesorId = String(f.get("profesorId") ?? "");
  await db.clasa.create({
    data: {
      nume, nivel, anScolar, scoalaId: s.scoalaId,
      ...(profesorId && { profesori: { connect: { id: profesorId } } }),
    },
  });
  revalidatePath("/admin");
  return { ok: `Clasa „${nume}” a fost creată.` };
}

export async function creeazaProfesor(_: StareAdmin, f: FormData): Promise<StareAdmin> {
  const s = await cereRol("ADMIN_SCOALA");
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const nume = String(f.get("nume") ?? "").trim();
  const prenume = String(f.get("prenume") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !nume || !prenume) return { eroare: "Completează numele, prenumele și un email valid." };
  if (await db.utilizator.findUnique({ where: { email } })) return { eroare: `Există deja un cont cu emailul ${email}.` };
  const parola = parolaTemporara();
  await db.utilizator.create({
    data: { email, nume, prenume, rol: "PROFESOR", parolaHash: await hashParola(parola), scoalaId: s.scoalaId, licenta: { create: {} } },
  });
  revalidatePath("/admin");
  return { ok: "Contul de profesor a fost creat.", conturi: [{ nume, prenume, email, parola }] };
}

/** Import elevi dintr-o listă CSV (lipită sau încărcată). Parolele temporare se afișează o singură dată. */
export async function importaElevi(_: StareAdmin, f: FormData): Promise<StareAdmin> {
  const s = await cereRol("ADMIN_SCOALA");
  const clasaId = String(f.get("clasaId") ?? "");
  const clasa = await db.clasa.findFirst({ where: { id: clasaId, scoalaId: s.scoalaId } });
  if (!clasa) return { eroare: "Alege clasa în care se importă elevii." };

  const fisier = f.get("fisier");
  let text = String(f.get("text") ?? "");
  if (fisier instanceof File && fisier.size > 0) {
    if (fisier.size > 500_000) return { eroare: "Fișierul este prea mare (maximum 500 KB)." };
    text = await fisier.text();
  }
  const { randuri, erori } = randuriElevi(text);
  if (!randuri.length) return { eroare: "Nu am găsit niciun elev valid în listă.", erori };

  const existente = await db.utilizator.findMany({ where: { email: { in: randuri.map((r) => r.email) } }, select: { email: true } });
  const ocupate = new Set(existente.map((e) => e.email));
  const conturi: ContNou[] = [];
  for (const r of randuri) {
    if (ocupate.has(r.email)) {
      erori.push(`${r.email}: există deja un cont cu acest email (nu a fost modificat).`);
      continue;
    }
    const parola = parolaTemporara();
    await db.utilizator.create({
      data: {
        ...r, rol: "ELEV", parolaHash: await hashParola(parola), scoalaId: s.scoalaId,
        licenta: { create: {} }, inscrieri: { create: { clasaId: clasa.id } },
      },
    });
    conturi.push({ ...r, parola, clasa: clasa.nume });
  }
  revalidatePath("/admin");
  return { ok: `Am creat ${conturi.length} conturi de elevi în clasa ${clasa.nume}.`, conturi, erori };
}

export async function reseteazaParola(_: StareAdmin, f: FormData): Promise<StareAdmin> {
  const s = await cereRol("ADMIN_SCOALA");
  const id = String(f.get("id") ?? "");
  const u = await db.utilizator.findFirst({ where: { id, scoalaId: s.scoalaId } });
  if (!u) return { eroare: "Utilizator negăsit." };
  if (u.id === s.id) return { eroare: "Pentru contul tău folosește „Schimbă parola”." };
  const parola = parolaTemporara();
  await db.utilizator.update({ where: { id }, data: { parolaHash: await hashParola(parola), schimbaParola: true } });
  return { ok: "Parola a fost resetată.", conturi: [{ nume: u.nume, prenume: u.prenume, email: u.email, parola }] };
}

export async function atribuieProfesor(f: FormData) {
  const s = await cereRol("ADMIN_SCOALA");
  const clasaId = String(f.get("clasaId") ?? "");
  const profesorId = String(f.get("profesorId") ?? "");
  const [clasa, prof] = await Promise.all([
    db.clasa.findFirst({ where: { id: clasaId, scoalaId: s.scoalaId } }),
    db.utilizator.findFirst({ where: { id: profesorId, scoalaId: s.scoalaId, rol: { in: ["PROFESOR", "ADMIN_SCOALA"] } } }),
  ]);
  if (clasa && prof) await db.clasa.update({ where: { id: clasa.id }, data: { profesori: { connect: { id: prof.id } } } });
  revalidatePath("/admin");
}

function anScolarCurent(): string {
  const d = new Date();
  const a = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${a}-${a + 1}`;
}
