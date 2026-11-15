-- CreateTable
CREATE TABLE "SesiuneJoc" (
    "id" TEXT NOT NULL,
    "elevId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "pozitie" INTEGER NOT NULL DEFAULT 0,
    "rezultate" JSONB NOT NULL,
    "stare" TEXT NOT NULL DEFAULT 'in_curs',
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SesiuneJoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SesiuneJoc_elevId_stare_idx" ON "SesiuneJoc"("elevId", "stare");

-- AddForeignKey
ALTER TABLE "SesiuneJoc" ADD CONSTRAINT "SesiuneJoc_elevId_fkey" FOREIGN KEY ("elevId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
