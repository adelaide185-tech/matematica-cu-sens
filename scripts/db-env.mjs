/**
 * Găsește URL-ul bazei de date oricum l-ar fi numit integrarea Vercel ↔ Neon
 * (DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL sau cu prefix, ex. STORAGE_DATABASE_URL).
 * Folosit la build (migrări) și importat de src/lib/db.ts.
 */
export function urlBazaDate(env = process.env) {
  const directe = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
  for (const k of directe) if (env[k]) return env[k];
  const cuPrefix = Object.keys(env).find((k) => /_(DATABASE_URL|POSTGRES_PRISMA_URL|POSTGRES_URL)$/.test(k) && env[k]);
  return cuPrefix ? env[cuPrefix] : undefined;
}

export function urlDirect(env = process.env) {
  const directe = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];
  for (const k of directe) if (env[k]) return env[k];
  const cuPrefix = Object.keys(env).find((k) => /_(DATABASE_URL_UNPOOLED|POSTGRES_URL_NON_POOLING)$/.test(k) && env[k]);
  return cuPrefix ? env[cuPrefix] : urlBazaDate(env);
}
