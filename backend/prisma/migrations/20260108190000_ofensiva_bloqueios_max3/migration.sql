-- Ajusta capacidade máxima de bloqueios da ofensiva para 3

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
