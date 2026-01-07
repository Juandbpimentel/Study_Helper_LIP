/*
  Warnings:

  - You are about to drop the column `usuario_id` on the `registros_estudo` table. All the data in the column will be lost.
  - You are about to drop the column `tema_id` on the `revisoes` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `revisoes` table. All the data in the column will be lost.
  - You are about to drop the column `usuario_id` on the `temas_de_estudo` table. All the data in the column will be lost.
  - You are about to drop the `cronogramas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slots_estudo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `creatorId` to the `registros_estudo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `revisoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `temas_de_estudo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cronogramas" DROP CONSTRAINT "cronogramas_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "registros_estudo" DROP CONSTRAINT "registros_estudo_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "registros_estudo" DROP CONSTRAINT "registros_estudo_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "revisoes" DROP CONSTRAINT "revisoes_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "revisoes" DROP CONSTRAINT "revisoes_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "slots_estudo" DROP CONSTRAINT "slots_estudo_cronograma_id_fkey";

-- DropForeignKey
ALTER TABLE "slots_estudo" DROP CONSTRAINT "slots_estudo_tema_id_fkey";

-- DropForeignKey
ALTER TABLE "slots_estudo" DROP CONSTRAINT "slots_estudo_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "temas_de_estudo" DROP CONSTRAINT "temas_de_estudo_usuario_id_fkey";

-- DropIndex
DROP INDEX "registros_estudo_usuario_id_data_estudo_idx";

-- DropIndex
DROP INDEX "revisoes_usuario_id_data_revisao_idx";

-- AlterTable
ALTER TABLE "registros_estudo" DROP COLUMN "usuario_id",
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ALTER COLUMN "tema_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "revisoes" DROP COLUMN "tema_id",
DROP COLUMN "usuario_id",
ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "temas_de_estudo" DROP COLUMN "usuario_id",
ADD COLUMN     "cor" VARCHAR(7),
ADD COLUMN     "creatorId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "cronogramas";

-- DropTable
DROP TABLE "slots_estudo";

-- CreateTable
CREATE TABLE "cronogramas_semanais" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "cronogramas_semanais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots_cronograma" (
    "id" SERIAL NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "dia_semana" "DiaSemana" NOT NULL,
    "ordem" INTEGER DEFAULT 0,
    "cronograma_id" INTEGER NOT NULL,
    "tema_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cronogramas_semanais_creatorId_key" ON "cronogramas_semanais"("creatorId");

-- CreateIndex
CREATE INDEX "slots_cronograma_creatorId_dia_semana_idx" ON "slots_cronograma"("creatorId", "dia_semana");

-- CreateIndex
CREATE INDEX "registros_estudo_slot_id_data_estudo_idx" ON "registros_estudo"("slot_id", "data_estudo");

-- CreateIndex
CREATE INDEX "registros_estudo_creatorId_data_estudo_idx" ON "registros_estudo"("creatorId", "data_estudo");

-- CreateIndex
CREATE INDEX "revisoes_creatorId_data_revisao_idx" ON "revisoes"("creatorId", "data_revisao");

-- CreateIndex
CREATE INDEX "temas_de_estudo_creatorId_idx" ON "temas_de_estudo"("creatorId");

-- AddForeignKey
ALTER TABLE "cronogramas_semanais" ADD CONSTRAINT "cronogramas_semanais_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots_cronograma" ADD CONSTRAINT "slots_cronograma_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots_cronograma" ADD CONSTRAINT "slots_cronograma_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronogramas_semanais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots_cronograma" ADD CONSTRAINT "slots_cronograma_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "temas_de_estudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temas_de_estudo" ADD CONSTRAINT "temas_de_estudo_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estudo" ADD CONSTRAINT "registros_estudo_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots_cronograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estudo" ADD CONSTRAINT "registros_estudo_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots_cronograma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisoes" ADD CONSTRAINT "revisoes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
