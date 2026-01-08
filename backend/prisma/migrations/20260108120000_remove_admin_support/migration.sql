-- Remove suporte a admin: coluna is_admin não é mais usada.

ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "is_admin";
