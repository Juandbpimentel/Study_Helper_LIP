-- Ajusta capacidade máxima de bloqueios da ofensiva para 3

-- Em bases novas (shadow DB do Prisma), esta migration pode rodar antes da migration
-- que cria os campos de ofensiva. Garanta que as colunas existam para evitar P3006.
ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "ofensiva_bloqueios_totais" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS "ofensiva_bloqueios_usados" INTEGER NOT NULL DEFAULT 0;

-- Atualiza default da coluna
ALTER TABLE "usuarios"
  ALTER COLUMN "ofensiva_bloqueios_totais" SET DEFAULT 3;

-- Normaliza dados existentes
UPDATE "usuarios"
SET "ofensiva_bloqueios_totais" = 3
WHERE "ofensiva_bloqueios_totais" < 3;

UPDATE "usuarios"
SET "ofensiva_bloqueios_totais" = 3
WHERE "ofensiva_bloqueios_totais" > 3;

UPDATE "usuarios"
SET "ofensiva_bloqueios_usados" = 3
WHERE "ofensiva_bloqueios_usados" > 3;
