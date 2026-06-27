#!/bin/sh
# Entrypoint: push schema to DB, then start Next.js.
# Seed is intentionally NOT run here — run manually:
#   docker compose exec app npx prisma db seed

set -e

echo "[entrypoint] Running prisma db push..."
# Belt-and-suspenders retry — compose healthcheck already gates us, but DB may need a moment
RETRIES=10
until npx prisma db push --accept-data-loss 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -eq 0 ]; then
    echo "[entrypoint] prisma db push failed after all retries — aborting"
    exit 1
  fi
  echo "[entrypoint] DB not ready, retrying in 3s... ($RETRIES left)"
  sleep 3
done

echo "[entrypoint] Schema ready. Starting Next.js..."
exec npm run start
