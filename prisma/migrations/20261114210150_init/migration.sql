-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN_SCOALA', 'PROFESOR', 'ELEV');

-- CreateEnum
CREATE TYPE "TipLicenta" AS ENUM ('GRATUIT', 'PLATIT');

-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('CONSOLIDARE', 'APROFUNDARE', 'EVALUARE', 'COMPETITIE');

-- CreateTable
CREATE TABLE "Scoala" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "localitate" TEXT,
    "logoUrl" TEXT,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scoala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilizator" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "parolaHash" TEXT NOT NULL,
    "schimbaParola" BOOLEAN NOT NULL DEFAULT true,
    "nume" TEXT NOT NULL,
    "prenume" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "scoalaId" TEXT NOT NULL,
    "puncteLogica" INTEGER NOT NULL DEFAULT 0,
    "puncteViteza" INTEGER NOT NULL DEFAULT 0,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaAutentificare" TIMESTAMP(3),

    CONSTRAINT "Utilizator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Licenta" (
    "id" TEXT NOT NULL,
    "utilizatorId" TEXT NOT NULL,
    "tip" "TipLicenta" NOT NULL DEFAULT 'GRATUIT',
    "valabilPanaLa" TIMESTAMP(3),
    "pretEuro" INTEGER,

    CONSTRAINT "Licenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clasa" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "anScolar" TEXT NOT NULL,
    "scoalaId" TEXT NOT NULL,

    CONSTRAINT "Clasa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscriere" (
    "elevId" TEXT NOT NULL,
    "clasaId" TEXT NOT NULL,

    CONSTRAINT "Inscriere_pkey" PRIMARY KEY ("elevId","clasaId")
);

-- CreateTable
CREATE TABLE "Capitol" (
    "id" TEXT NOT NULL,
    "clasa" INTEGER NOT NULL,
    "ordine" INTEGER NOT NULL,
    "titlu" TEXT NOT NULL,

    CONSTRAINT "Capitol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lectie" (
    "id" TEXT NOT NULL,
    "capitolId" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL,
    "titlu" TEXT NOT NULL,
    "competente" TEXT[],
    "generatoare" TEXT[],

    CONSTRAINT "Lectie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fisa" (
    "id" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "titlu" TEXT NOT NULL,
    "clasa" INTEGER NOT NULL,
    "lectieIds" TEXT[],
    "competente" TEXT[],
    "nivel" "Nivel" NOT NULL,
    "seed" INTEGER NOT NULL,
    "config" JSONB NOT NULL,
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tema" (
    "id" TEXT NOT NULL,
    "cod" TEXT NOT NULL,
    "titlu" TEXT NOT NULL,
    "profesorId" TEXT NOT NULL,
    "clasaId" TEXT,
    "mecanica" TEXT NOT NULL,
    "generatoare" TEXT[],
    "nivel" "Nivel" NOT NULL,
    "nrItemi" INTEGER NOT NULL DEFAULT 15,
    "seed" INTEGER,
    "termen" TIMESTAMP(3),
    "creatLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incercare" (
    "id" TEXT NOT NULL,
    "elevId" TEXT NOT NULL,
    "temaId" TEXT,
    "mecanica" TEXT NOT NULL,
    "lectieId" TEXT,
    "inceput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminat" TIMESTAMP(3),
    "corecte" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "stele" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Incercare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaspunsItem" (
    "id" TEXT NOT NULL,
    "incercareId" TEXT NOT NULL,
    "generatorId" TEXT NOT NULL,
    "competenta" TEXT NOT NULL,
    "dificultate" INTEGER NOT NULL,
    "item" JSONB NOT NULL,
    "raspunsElev" JSONB NOT NULL,
    "corect" BOOLEAN NOT NULL,
    "timpMs" INTEGER NOT NULL,

    CONSTRAINT "RaspunsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stapanire" (
    "elevId" TEXT NOT NULL,
    "competenta" TEXT NOT NULL,
    "scor" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "incercari" INTEGER NOT NULL DEFAULT 0,
    "actualizat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stapanire_pkey" PRIMARY KEY ("elevId","competenta")
);

-- CreateTable
CREATE TABLE "Recompensa" (
    "id" TEXT NOT NULL,
    "nume" TEXT NOT NULL,
    "descriere" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Recompensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecompensaObtinuta" (
    "elevId" TEXT NOT NULL,
    "recompensaId" TEXT NOT NULL,
    "obtinutLa" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecompensaObtinuta_pkey" PRIMARY KEY ("elevId","recompensaId")
);

-- CreateTable
CREATE TABLE "_ProfesorClasa" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfesorClasa_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilizator_email_key" ON "Utilizator"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Licenta_utilizatorId_key" ON "Licenta"("utilizatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Tema_cod_key" ON "Tema"("cod");

-- CreateIndex
CREATE INDEX "_ProfesorClasa_B_index" ON "_ProfesorClasa"("B");

-- AddForeignKey
ALTER TABLE "Utilizator" ADD CONSTRAINT "Utilizator_scoalaId_fkey" FOREIGN KEY ("scoalaId") REFERENCES "Scoala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Licenta" ADD CONSTRAINT "Licenta_utilizatorId_fkey" FOREIGN KEY ("utilizatorId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clasa" ADD CONSTRAINT "Clasa_scoalaId_fkey" FOREIGN KEY ("scoalaId") REFERENCES "Scoala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscriere" ADD CONSTRAINT "Inscriere_elevId_fkey" FOREIGN KEY ("elevId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscriere" ADD CONSTRAINT "Inscriere_clasaId_fkey" FOREIGN KEY ("clasaId") REFERENCES "Clasa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lectie" ADD CONSTRAINT "Lectie_capitolId_fkey" FOREIGN KEY ("capitolId") REFERENCES "Capitol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fisa" ADD CONSTRAINT "Fisa_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Utilizator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_profesorId_fkey" FOREIGN KEY ("profesorId") REFERENCES "Utilizator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_clasaId_fkey" FOREIGN KEY ("clasaId") REFERENCES "Clasa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incercare" ADD CONSTRAINT "Incercare_elevId_fkey" FOREIGN KEY ("elevId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incercare" ADD CONSTRAINT "Incercare_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaspunsItem" ADD CONSTRAINT "RaspunsItem_incercareId_fkey" FOREIGN KEY ("incercareId") REFERENCES "Incercare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stapanire" ADD CONSTRAINT "Stapanire_elevId_fkey" FOREIGN KEY ("elevId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompensaObtinuta" ADD CONSTRAINT "RecompensaObtinuta_elevId_fkey" FOREIGN KEY ("elevId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecompensaObtinuta" ADD CONSTRAINT "RecompensaObtinuta_recompensaId_fkey" FOREIGN KEY ("recompensaId") REFERENCES "Recompensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfesorClasa" ADD CONSTRAINT "_ProfesorClasa_A_fkey" FOREIGN KEY ("A") REFERENCES "Clasa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfesorClasa" ADD CONSTRAINT "_ProfesorClasa_B_fkey" FOREIGN KEY ("B") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
