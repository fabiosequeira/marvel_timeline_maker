#!/bin/sh
set -e

MAX_RETRIES=30
RETRY_DELAY=2
i=0

echo "Running database migrations (will retry until Postgres is ready)..."
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "Database did not become ready after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "  migration failed (database probably not ready yet) - retry $i/$MAX_RETRIES in ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
done

echo "Migrations applied. Starting application..."
exec node server.js
