/**
 * Rulat la build (Vercel): aplică migrările Prisma pe baza de date Neon.
 * Fără bază de date configurată, build-ul continuă în „mod demonstrativ” (fără conturi).
 */
import { execSync } from "node:child_process";
import { urlBazaDate, urlDirect } from "./db-env.mjs";

const url = urlBazaDate();
if (!url) {
  console.warn("⚠️  Nicio bază de date configurată (DATABASE_URL). Aplicația pornește în mod demonstrativ, fără conturi.");
  process.exit(0);
}
const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: urlDirect() };
execSync("npx prisma migrate deploy", { stdio: "inherit", env });
