#!/bin/bash
# Dumps the Postgres database to backups/<timestamp>.sql
# Usage: ./scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-timeline}"
POSTGRES_DB="${POSTGRES_DB:-timeline}"

mkdir -p backups
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUT="backups/${POSTGRES_DB}-${TIMESTAMP}.sql"

echo "Backing up database '${POSTGRES_DB}' to ${OUT}..."
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "${OUT}"

echo "Done: ${OUT}"
