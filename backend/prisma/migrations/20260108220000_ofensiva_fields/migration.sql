-- Add ofensiva (streak) persisted fields to usuarios

ALTER TABLE "usuarios"
  ADD COLUMN IF NOT EXISTS "ofensiva_atual" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ofensiva_bloqueios_totais" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS "ofensiva_bloqueios_usados" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ofensiva_ultimo_dia_ativo" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ofensiva_atualizada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
