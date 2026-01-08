-- AlterEnum
ALTER TYPE "StatusRevisao" ADD VALUE 'Expirada';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "max_slots_por_dia" INTEGER,
ADD COLUMN     "revisao_atraso_expira_dias" INTEGER,
ADD COLUMN     "slot_atraso_grace_dias" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slot_atraso_max_dias" INTEGER NOT NULL DEFAULT 7;
