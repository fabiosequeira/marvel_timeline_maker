#!/bin/bash
# Restores the Postgres database from a pg_dump SQL file.
# Usage: ./scripts/restore.sh backups/timeline-20250101-120000.sql
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path-to-backup.sql>"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "File not found: $BACKUP_FILE"
  exit 1
fi

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-timeline}"
POSTGRES_DB="${POSTGRES_DB:-timeline}"

echo "This will DROP and recreate all data in database '${POSTGRES_DB}'."
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "Restoring from ${BACKUP_FILE}..."
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker compose exec -T postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" < "${BACKUP_FILE}"

echo "Restore complete. You may want to restart the app: docker compose restart app"
