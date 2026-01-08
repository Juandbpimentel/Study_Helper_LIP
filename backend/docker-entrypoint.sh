#!/bin/sh
set -e

# Prisma precisa de DATABASE_URL em runtime (container), não no build da imagem.

npx prisma generate
echo "[entrypoint] Running: prisma migrate deploy"
npx prisma migrate deploy
echo "[entrypoint] Done: prisma migrate deploy"

exec "$@"
