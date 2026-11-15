-- AlterTable
ALTER TABLE "Tema" ADD COLUMN     "config" JSONB,
ADD COLUMN     "elevId" TEXT,
ADD COLUMN     "limitaMinute" INTEGER,
ADD COLUMN     "test" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_elevId_fkey" FOREIGN KEY ("elevId") REFERENCES "Utilizator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
