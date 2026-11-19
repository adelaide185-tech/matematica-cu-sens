"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { cereRol } from "./auth";
import { decodifica } from "@/motor/calcul/config";
import { decodificaC3 } from "@/motor/clasa3/config";
import { decodificaC4 } from "@/motor/clasa4/config";
import { decodificaC5 } from "@/motor/clasa5/config";
import { JOCURI_ARCADE, NUME_CLASA_SCURT, decodificaArcade, greseliDinAlegeri } from "@/motor/arcade/config";
import { GRESELI_MAX, rezultatArcade } from "@/motor/arcade/scor";
import { puncteaza, verificaC3 } from "@/motor/clasa3/generator";
import { JOCURI_C3, SECUNDE_VITEZA } from "@/motor/clasa3/tipuri";
import { decodificaC2 } from "@/motor/clasa2/config";
import { clasificaEroare, verificaC2 } from "@/motor/clasa2/generator";
import { JOCURI_C2, NIVELURI_C2, type NivelC2 } from "@/motor/clasa2/tipuri";
import type { Sesiune } from "./sesiune-token";
import { corect, textRaspuns, totalExercitii } from "@/motor/calcul/generator";
import { exercitiiTema, filtruClaseProfesor, filtruTemeProfesor, itemiTemaC2, itemiTemaC3, itemiTemaC4, itemiTemaC5, intrebariTemaArcade, steleDinProcent, temaPentruElev } from "./teme";

export interface DateTemaNoua {
  /** configurația codificată (aceeași ca în URL-ul fișei) */
  c: string;
  titlu: string;
  /** „clasa:<id>” sau „elev:<id>” */
  tinta: string;
  limitaMinute: number | null;
  /** AAAA-LL-ZZ */
  termen: string | null;
  test: boolean;
  /** exerciții diferite pentru fiecare elev (aceleași condiții) */
  diferite: boolean;
}
export interface StareTema { eroare?: string; cod?: string; id?: string }

const LITERE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // fără O/0, I/1

function codNou(): string {
  const r = new Uint32Array(6);
  crypto.getRandomValues(r);
  return Array.from(r, (x) => LITERE[x % LITERE.length]).join("");
}

/** Grupa sau elevul care primește tema (doar din grupele profesorului). */
async function tintaTema(s: Sesiune, tinta: string): Promise<{ clasaId: string | null; elevId: string | null } | { eroare: string }> {
  const [fel, id] = tinta.split(":");
  if (fel === "clasa") {
    const c = await db.clasa.findFirst({ where: { id, ...filtruClaseProfesor(s) } });
    return c ? { clasaId: c.id, elevId: null } : { eroare: "Alege una dintre grupele tale." };
  }
  if (fel === "elev") {
    const e = await db.utilizator.findFirst({ where: { id, rol: "ELEV", inscrieri: { some: { clasa: filtruClaseProfesor(s) } } } });
    return e ? { clasaId: null, elevId: e.id } : { eroare: "Alege un elev dintr-o grupă a ta." };
  }
  return { eroare: "Alege grupa sau elevul care primește tema." };
}

/** Salvează tema cu un cod unic de 6 caractere. */
async function salveazaTema(data: Omit<Prisma.TemaUncheckedCreateInput, "cod">): Promise<StareTema> {
  for (let i = 0; i < 5; i++) {
    try {
      const t = await db.tema.create({ data: { ...data, cod: codNou() } });
      revalidatePath("/profesor/teme");
      return { cod: t.cod, id: t.id };
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
  }
  return { eroare: "Nu am putut genera un cod unic. Încearcă din nou." };
}

const limitaSiTermen = (d: Pick<DateTemaNoua, "limitaMinute" | "termen">) => ({
  limitaMinute: d.limitaMinute && d.limitaMinute > 0 ? Math.min(240, Math.floor(d.limitaMinute)) : null,
  termen: d.termen && /^\d{4}-\d{2}-\d{2}$/.test(d.termen) ? new Date(`${d.termen}T23:59:59`) : null,
});

export async function creeazaTemaCalcul(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodifica(d.c);
  if (!cfg || totalExercitii(cfg) < 1) return { eroare: "Fișa nu are exerciții." };
  const t = await tintaTema(s, d.tinta);
  if ("eroare" in t) return t;
  return salveazaTema({
    titlu: d.titlu.trim().slice(0, 120) || cfg.antet.titlu, profesorId: s.id, ...t,
    mecanica: "calcul", generatoare: [], nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
    nrItemi: Math.min(totalExercitii(cfg), 200), seed: d.diferite ? null : cfg.seed,
    config: cfg as unknown as Prisma.InputJsonValue, ...limitaSiTermen(d), test: d.test,
  });
}

/** Jocurile de clasa a II-a trimise ca temă (noțiuni, joc, nivel, număr de exerciții). */
export async function creeazaTemaJocC2(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodificaC2(d.c);
  if (!cfg) return { eroare: "Configurația jocului nu a putut fi citită." };
  const t = await tintaTema(s, d.tinta);
  if ("eroare" in t) return t;
  return salveazaTema({
    titlu: d.titlu.trim().slice(0, 120) || `${cfg.mix ? "Mix automat" : JOCURI_C2[cfg.joc].nume} – clasa a II-a`, profesorId: s.id, ...t,
    mecanica: cfg.mix ? "c2:mix" : `c2:${cfg.joc}`, generatoare: cfg.notiuni, nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
    nrItemi: cfg.nr, seed: d.diferite ? null : cfg.seed,
    config: cfg as unknown as Prisma.InputJsonValue, ...limitaSiTermen(d), test: d.test,
  });
}

/** Jocurile de clasa a III-a trimise ca temă: configurația (capitole, joc, număr) + codul jocului. */
export async function creeazaTemaJocC3(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodificaC3(d.c);
  if (!cfg) return { eroare: "Configurația jocului nu a putut fi citită." };
  const t = await tintaTema(s, d.tinta);
  if ("eroare" in t) return t;
  return salveazaTema({
    titlu: d.titlu.trim().slice(0, 120) || `${JOCURI_C3[cfg.joc].nume} – clasa a III-a`, profesorId: s.id, ...t,
    mecanica: `c3:${cfg.joc}`, generatoare: cfg.capitole, nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
    nrItemi: cfg.nr, seed: d.diferite ? null : cfg.seed,
    config: cfg as unknown as Prisma.InputJsonValue, ...limitaSiTermen(d), test: d.test,
  });
}

/** Jocurile de clasa a IV-a trimise ca temă. */
export async function creeazaTemaJocC4(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodificaC4(d.c);
  if (!cfg) return { eroare: "Configurația jocului nu a putut fi citită." };
  const t = await tintaTema(s, d.tinta);
  if ("eroare" in t) return t;
  return salveazaTema({
    titlu: d.titlu.trim().slice(0, 120) || `${JOCURI_C3[cfg.joc].nume} – clasa a IV-a`, profesorId: s.id, ...t,
    mecanica: `c4:${cfg.joc}`, generatoare: cfg.capitole, nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
    nrItemi: cfg.nr, seed: d.diferite ? null : cfg.seed,
    config: cfg as unknown as Prisma.InputJsonValue, ...limitaSiTermen(d), test: d.test,
  });
}

/** Jocurile de clasa a V-a trimise ca temă. */
export async function creeazaTemaJocC5(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodificaC5(d.c);
  if (!cfg) return { eroare: "Configurația jocului nu a putut fi citită." };
  const t = await tintaTema(s, d.tinta);
  if ("eroare" in t) return t;
  return salveazaTema({
    titlu: d.titlu.trim().slice(0, 120) || `${JOCURI_C3[cfg.joc].nume} – clasa a V-a`, profesorId: s.id, ...t,
    mecanica: `c5:${cfg.joc}`, generatoare: cfg.capitole, nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
    nrItemi: cfg.nr, seed: d.diferite ? null : cfg.seed,
    config: cfg as unknown as Prisma.InputJsonValue, ...limitaSiTermen(d), test: d.test,
  });
}

/** Jocurile arcade (Baloanele, Cursa cu porți, Racheta) trimise ca temă: clasa, jocul, viteza, dificultatea, numărul. */
export async function creeazaTemaArcade(d: DateTemaNoua): Promise<StareTema> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const cfg = decodificaArcade(d.c);
  if (!cfg) return { eroare: "Configurația jocului nu a putut fi citită." };
  const t = await tintaTema(s, d.tinta);
  if ("eroare" in t) return t;
  return salveazaTema({
    titlu: d.titlu.trim().slice(0, 120) || `${JOCURI_ARCADE[cfg.joc].nume} – clasa ${NUME_CLASA_SCURT[cfg.clasa - 1]}`, profesorId: s.id, ...t,
    mecanica: `arc:${cfg.joc}`, generatoare: [`clasa${cfg.clasa}`], nivel: d.test ? "EVALUARE" : "CONSOLIDARE",
    nrItemi: cfg.n, seed: d.diferite ? null : cfg.seed,
    config: cfg as unknown as Prisma.InputJsonValue, ...limitaSiTermen(d), test: d.test,
  });
}

export interface RaspunsArcadeTrimis { id: string; alegeri: (string | null)[]; timpMs: number }

/**
 * Elevul termină un joc arcade dat ca temă. Serverul regenerează întrebările (cod + încercare),
 * recalculează greșelile din alegerile trimise (nu are încredere în punctajul calculat în browser)
 * și salvează punctajul, medalia și răspunsurile pe capitole.
 */
export async function trimiteJocArcade(cod: string, raspunsuri: RaspunsArcadeTrimis[], incercare: number, terminat: boolean): Promise<RezultatJocC3> {
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema || !tema.mecanica.startsWith("arc:")) return { eroare: "Tema nu există sau nu este pentru tine." };
  if (tema.test) {
    const deja = await db.incercare.count({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } } });
    if (deja) return { eroare: "Ai trimis deja acest test." };
  }
  const nrInc = Math.max(0, Math.min(1000, Math.floor(Number(incercare) || 0)));
  const { intrebari } = intrebariTemaArcade(tema, s.id, nrInc);
  const dupaId = new Map((Array.isArray(raspunsuri) ? raspunsuri : []).slice(0, 50).map((r) => [String(r?.id), r]));
  const rez = intrebari.map((q) => {
    const r = dupaId.get(q.id);
    const alegeri = Array.isArray(r?.alegeri) ? r!.alegeri.slice(0, 10).map((a) => (a === null ? null : String(a).slice(0, 60))) : [];
    const greseli = greseliDinAlegeri(q, alegeri);
    return { q, alegeri, greseli, timpMs: Math.max(0, Math.min(600000, Math.floor(Number(r?.timpMs) || 0))) };
  });
  const p = rezultatArcade(rez.map((r) => r.greseli));
  const timp = rez.reduce((a, r) => a + r.timpMs, 0);
  const acum = new Date();
  await db.incercare.create({
    data: {
      elevId: s.id, temaId: tema.id, mecanica: tema.mecanica, inceput: new Date(acum.getTime() - timp), terminat: acum,
      corecte: p.rezolvate, total: intrebari.length, stele: p.stele, scor: p.scor, scorMax: p.max, medalie: p.medalie, comboMax: p.serieMax,
      raspunsuri: {
        create: rez.map((r) => ({
          generatorId: `arc.${r.q.sursa}`, competenta: r.q.sursa, dificultate: Math.max(1, r.alegeri.length),
          item: { id: r.q.id, text: r.q.text, inainte: null, raspuns: r.q.corect },
          // în raport apare prima alegere greșită (greșeala tipică), altfel răspunsul corect
          raspunsElev: { valoare: r.alegeri.find((a) => a !== r.q.corect) === null ? "(a scăpat)" : r.alegeri.find((a) => a !== r.q.corect) ?? (r.alegeri.length ? r.q.corect : "(nerezolvat)"), incercari: r.alegeri.length, terminat, greseli: r.greseli },
          corect: r.greseli < GRESELI_MAX, timpMs: r.timpMs,
        })),
      },
    },
  });
  // fără revalidatePath: paginile elevului sunt dinamice, iar reîmprospătarea ar înlocui ecranul cu rezultatul (la test: „Ai trimis deja”)
  return { scor: p.scor, medalie: p.medalie, procent: p.procent };
}

export async function stergeTema(id: string): Promise<void> {
  const s = await cereRol("PROFESOR", "ADMIN_SCOALA");
  const t = await db.tema.findFirst({ where: { id, ...filtruTemeProfesor(s) } });
  if (!t) return;
  await db.$transaction([db.incercare.deleteMany({ where: { temaId: t.id } }), db.tema.delete({ where: { id: t.id } })]);
  revalidatePath("/profesor/teme");
}

export interface RaspunsDat { valoare?: string; cat?: string; rest?: string }
export interface RezultatTema {
  eroare?: string;
  corecte?: number;
  total?: number;
  stele?: number;
  detalii?: { corect: boolean; raspuns: string }[];
}

/** Elevul trimite tema: verificarea se face pe server (răspunsurile corecte nu ajung la elev înainte). */
export async function trimiteTema(cod: string, raspunsuri: RaspunsDat[], timpMs: number): Promise<RezultatTema> {
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema || tema.mecanica !== "calcul") return { eroare: "Tema nu există sau nu este pentru tine." };
  if (tema.test) {
    const deja = await db.incercare.count({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } } });
    if (deja) return { eroare: "Ai trimis deja acest test." };
  }
  const { exercitii } = exercitiiTema(tema, s.id);
  const timp = Math.max(0, Math.min(Math.floor(Number(timpMs) || 0), 24 * 3600 * 1000));
  const rez = exercitii.map((e, i) => ({ e, dat: raspunsuri[i] ?? {}, ok: corect(e, raspunsuri[i] ?? {}) }));
  const corecte = rez.filter((r) => r.ok).length;
  const stele = steleDinProcent((100 * corecte) / Math.max(1, exercitii.length));
  const acum = new Date();
  await db.incercare.create({
    data: {
      elevId: s.id, temaId: tema.id, mecanica: "calcul",
      inceput: new Date(acum.getTime() - timp), terminat: acum,
      corecte, total: exercitii.length, stele,
      raspunsuri: {
        create: rez.map(({ e, dat, ok }) => ({
          generatorId: `calcul.${e.tip}`, competenta: "calcul", dificultate: 1,
          item: { id: e.id, text: e.text, inainte: e.inainte ?? null, raspuns: textRaspuns(e) },
          raspunsElev: { valoare: String(dat.valoare ?? "").slice(0, 20), cat: String(dat.cat ?? "").slice(0, 20), rest: String(dat.rest ?? "").slice(0, 20) },
          corect: ok, timpMs: Math.round(timp / Math.max(1, exercitii.length)),
        })),
      },
    },
  });
  // fără revalidatePath: paginile elevului sunt dinamice, iar reîmprospătarea ar înlocui ecranul cu rezultatul (la test: „Ai trimis deja”)
  return { corecte, total: exercitii.length, stele, detalii: rez.map((r) => ({ corect: r.ok, raspuns: textRaspuns(r.e) })) };
}

export interface RaspunsJocTrimis { id: string; dat: string | null; incercari: number; timpMs: number }
export interface RezultatJocC3 { eroare?: string; scor?: number; medalie?: string | null; procent?: number }

/**
 * Elevul termină un joc de clasa a III-a. Serverul regenerează exercițiile din cod (+ numărul încercării),
 * verifică din nou fiecare răspuns și calculează punctajul și medalia.
 */
export async function trimiteJocC3(cod: string, raspunsuri: RaspunsJocTrimis[], incercare: number, terminat: boolean): Promise<RezultatJocC3> {
  return trimiteJocC34("c3", cod, raspunsuri, incercare, terminat);
}

/** Același traseu pentru jocurile de clasa a IV-a (aceleași 5 jocuri, alt conținut). */
export async function trimiteJocC4(cod: string, raspunsuri: RaspunsJocTrimis[], incercare: number, terminat: boolean): Promise<RezultatJocC3> {
  return trimiteJocC34("c4", cod, raspunsuri, incercare, terminat);
}

/** Jocurile de clasa a V-a: același traseu. */
export async function trimiteJocC5(cod: string, raspunsuri: RaspunsJocTrimis[], incercare: number, terminat: boolean): Promise<RezultatJocC3> {
  return trimiteJocC34("c5", cod, raspunsuri, incercare, terminat);
}

async function trimiteJocC34(clasa: "c3" | "c4" | "c5", cod: string, raspunsuri: RaspunsJocTrimis[], incercare: number, terminat: boolean): Promise<RezultatJocC3> {
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema || !tema.mecanica.startsWith(`${clasa}:`)) return { eroare: "Tema nu există sau nu este pentru tine." };
  if (tema.test) {
    const deja = await db.incercare.count({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } } });
    if (deja) return { eroare: "Ai trimis deja acest test." };
  }
  const nrInc = Math.max(0, Math.min(1000, Math.floor(Number(incercare) || 0)));
  const { cfg, itemi } = clasa === "c3" ? itemiTemaC3(tema, s.id, nrInc) : clasa === "c4" ? itemiTemaC4(tema, s.id, nrInc) : itemiTemaC5(tema, s.id, nrInc);
  const dupaId = new Map(raspunsuri.slice(0, 200).map((r) => [String(r.id), r]));
  const rez = (itemi as { id: string; capitol: string; text: string; afis: string; raspuns: Parameters<typeof verificaC3>[0]["raspuns"] }[]).map((it) => {
    const r = dupaId.get(it.id);
    const dat = r?.dat === null || r?.dat === undefined ? null : String(r.dat).slice(0, 40);
    // la Memory, perechea e găsită în joc; la celelalte jocuri, răspunsul se verifică aici
    const ok = !!r && dat !== null && verificaC3(it, dat);
    return { it, dat, corect: ok, incercari: Math.max(1, Math.min(9, Math.floor(Number(r?.incercari) || 1))), timpMs: Math.max(0, Math.min(600000, Math.floor(Number(r?.timpMs) || 0))), raspuns: !!r };
  });
  const p = puncteaza(rez.filter((r) => r.raspuns), itemi.length, cfg.joc === "sprint" ? SECUNDE_VITEZA[cfg.viteza] * 1000 : undefined);
  const timp = rez.reduce((a, r) => a + r.timpMs, 0);
  const acum = new Date();
  await db.incercare.create({
    data: {
      elevId: s.id, temaId: tema.id, mecanica: tema.mecanica, inceput: new Date(acum.getTime() - timp), terminat: acum,
      corecte: p.corecte, total: itemi.length, stele: p.stele, scor: p.scor, scorMax: p.scorMax, medalie: p.medalie, comboMax: p.comboMax,
      raspunsuri: {
        create: rez.map((r) => ({
          generatorId: `${clasa}.${r.it.capitol}`, competenta: r.it.capitol, dificultate: r.incercari,
          item: { id: r.it.id, text: r.it.text, inainte: null, raspuns: r.it.afis },
          raspunsElev: { valoare: r.dat ?? (r.raspuns ? "(timp expirat)" : "(nerezolvat)"), incercari: r.incercari, terminat },
          corect: r.corect, timpMs: r.timpMs,
        })),
      },
    },
  });
  // fără revalidatePath: paginile elevului sunt dinamice, iar reîmprospătarea ar înlocui ecranul cu rezultatul (la test: „Ai trimis deja”)
  return { scor: p.scor, medalie: p.medalie, procent: p.procent };
}

export interface RaspunsJocC2Trimis { id: string; dat: string | null; incercari: number; timpMs: number; greseli: string[] }

/**
 * Elevul termină un joc de clasa a II-a: serverul regenerează exercițiile (cod + încercare + nivel),
 * verifică fiecare răspuns, eticheteză greșeala tipică și salvează punctajul și medalia.
 */
export async function trimiteJocC2(cod: string, raspunsuri: RaspunsJocC2Trimis[], nivel: NivelC2, incercare: number, terminat: boolean): Promise<RezultatJocC3> {
  const s = await cereRol("ELEV");
  const tema = await temaPentruElev(cod, s.id);
  if (!tema || !tema.mecanica.startsWith("c2:")) return { eroare: "Tema nu există sau nu este pentru tine." };
  if (tema.test) {
    const deja = await db.incercare.count({ where: { temaId: tema.id, elevId: s.id, terminat: { not: null } } });
    if (deja) return { eroare: "Ai trimis deja acest test." };
  }
  const niv: NivelC2 = (["usor", "mediu", "provocare"] as const).includes(nivel) ? nivel : "mediu";
  const { nivel: jucat, itemi } = itemiTemaC2(tema, s.id, Math.max(0, Math.min(1000, Math.floor(Number(incercare) || 0))), niv);
  const dupaId = new Map(raspunsuri.slice(0, 200).map((r) => [String(r.id), r]));
  const rez = itemi.map((it) => {
    const r = dupaId.get(it.id);
    const dat = r?.dat === null || r?.dat === undefined ? null : String(r.dat).slice(0, 40);
    const greseli = Array.isArray(r?.greseli) ? r!.greseli.slice(0, 9).map((g) => String(g).slice(0, 40)) : [];
    return {
      it, dat, greseli, raspuns: !!r, corect: !!r && dat !== null && verificaC2(it, dat),
      incercari: Math.max(1, Math.min(9, Math.floor(Number(r?.incercari) || 1))), timpMs: Math.max(0, Math.min(600000, Math.floor(Number(r?.timpMs) || 0))),
    };
  });
  const p = puncteaza(rez.filter((r) => r.raspuns), itemi.length);
  const mult = NIVELURI_C2[jucat].multiplicator;
  const timp = rez.reduce((a, r) => a + r.timpMs, 0);
  const acum = new Date();
  await db.incercare.create({
    data: {
      elevId: s.id, temaId: tema.id, mecanica: tema.mecanica, inceput: new Date(acum.getTime() - timp), terminat: acum,
      corecte: p.corecte, total: itemi.length, stele: p.stele, scor: Math.round(p.scor * mult), scorMax: Math.round(p.scorMax * mult), medalie: p.medalie, comboMax: p.comboMax,
      raspunsuri: {
        create: rez.map((r) => {
          const gresit = r.greseli[0] ?? (r.corect ? null : r.dat);
          return {
            generatorId: `c2.${r.it.notiune}`, competenta: r.it.notiune, dificultate: r.incercari,
            item: { id: r.it.id, text: r.it.st ? `${r.it.st}` : r.it.text, inainte: null, raspuns: r.it.afis },
            raspunsElev: {
              valoare: gresit ?? r.dat ?? (r.raspuns ? "(timp expirat)" : "(nerezolvat)"), incercari: r.incercari, terminat, nivel: jucat,
              eroare: r.corect && !r.greseli.length ? null : r.raspuns ? clasificaEroare(r.it, gresit) : "altele",
            },
            corect: r.corect, timpMs: r.timpMs,
          };
        }),
      },
    },
  });
  // fără revalidatePath: paginile elevului sunt dinamice, iar reîmprospătarea ar înlocui ecranul cu rezultatul (la test: „Ai trimis deja”)
  return { scor: Math.round(p.scor * mult), medalie: p.medalie, procent: p.procent };
}
