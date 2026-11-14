import { PrismaClient } from "@prisma/client";
import { urlBazaDate } from "../../scripts/db-env.mjs";

/** URL-ul bazei de date (oricum l-ar fi numit integrarea Vercel ↔ Neon). */
export const URL_DB: string | undefined = urlBazaDate();

/** Fără bază de date, aplicația rulează în „mod demonstrativ”: fișe și jocuri fără conturi. */
export const dbConfigurata = Boolean(URL_DB);

const global_ = globalThis as unknown as { prisma?: PrismaClient };

export const db: PrismaClient =
  global_.prisma ?? new PrismaClient(URL_DB ? { datasourceUrl: URL_DB } : undefined);

if (process.env.NODE_ENV !== "production") global_.prisma = db;
