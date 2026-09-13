#!/usr/bin/env bash

set -euo pipefail
umask 077

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
COMPOSE_FILE="$PROJECT_ROOT/compose.dev-db.yaml"
COMPOSE=(docker compose --project-name dchurch-crm-dev --file "$COMPOSE_FILE")

fail() {
  printf 'sync-dev-db: %s\n' "$1" >&2
  exit 1
}

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
[[ -f "$COMPOSE_FILE" ]] || fail "missing $COMPOSE_FILE"
command -v docker >/dev/null 2>&1 || fail 'Docker is required'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose v2 is required'

# The project env file is the source of truth for both URLs.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

[[ -n "${DB_SYNC_SOURCE_URL:-}" ]] || fail 'DB_SYNC_SOURCE_URL is not configured'
[[ -n "${DATABASE_URL:-}" ]] || fail 'DATABASE_URL is not configured'
[[ "$DB_SYNC_SOURCE_URL" != "$DATABASE_URL" ]] || fail 'source and target database URLs must differ'

LOCAL_POSTGRES_PORT="${LOCAL_POSTGRES_PORT:-5433}"
LOCAL_POSTGRES_DB="${LOCAL_POSTGRES_DB:-dchurch_crm}"
LOCAL_POSTGRES_USER="${LOCAL_POSTGRES_USER:-postgres}"
LOCAL_POSTGRES_PASSWORD="${LOCAL_POSTGRES_PASSWORD:-postgres}"

TARGET_DATABASE="$(DATABASE_URL="$DATABASE_URL" \
  LOCAL_POSTGRES_PORT="$LOCAL_POSTGRES_PORT" \
  LOCAL_POSTGRES_DB="$LOCAL_POSTGRES_DB" \
  LOCAL_POSTGRES_USER="$LOCAL_POSTGRES_USER" \
  LOCAL_POSTGRES_PASSWORD="$LOCAL_POSTGRES_PASSWORD" \
  node --input-type=module <<'NODE'
const url = new URL(process.env.DATABASE_URL);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
  process.exitCode = 4;
} else if (!localHosts.has(url.hostname)) {
  process.exitCode = 2;
} else {
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(database)) {
    process.exitCode = 3;
  } else if (
    database !== process.env.LOCAL_POSTGRES_DB ||
    (url.port || '5432') !== process.env.LOCAL_POSTGRES_PORT ||
    decodeURIComponent(url.username) !== process.env.LOCAL_POSTGRES_USER ||
    decodeURIComponent(url.password) !== process.env.LOCAL_POSTGRES_PASSWORD
  ) {
    process.exitCode = 5;
  } else {
    process.stdout.write(database);
  }
}
NODE
)" || {
  status=$?
  case "$status" in
    2) fail 'DATABASE_URL must target localhost, 127.0.0.1, or ::1' ;;
    3) fail 'the database name in DATABASE_URL is not supported' ;;
    4) fail 'DATABASE_URL must be a PostgreSQL URL' ;;
    5) fail 'DATABASE_URL must match the local PostgreSQL Docker configuration' ;;
    *) fail 'DATABASE_URL is not a valid PostgreSQL URL' ;;
  esac
}

DUMP_FILE="$(mktemp "${TMPDIR:-/tmp}/dchurch-crm-production.XXXXXX.sql")"
cleanup() {
  rm -f "$DUMP_FILE"
}
trap cleanup EXIT

printf 'Downloading source database dump...\n'
docker run --rm postgres:17-alpine \
  pg_dump --format=plain --no-owner --no-privileges \
  --exclude-extension=supabase_vault "$DB_SYNC_SOURCE_URL" >"$DUMP_FILE"

[[ -s "$DUMP_FILE" ]] || fail 'the downloaded dump is empty'

printf 'Starting local PostgreSQL...\n'
"${COMPOSE[@]}" up -d postgres >/dev/null

for _ in {1..20}; do
  if "${COMPOSE[@]}" exec -T postgres \
    pg_isready -h 127.0.0.1 -U "$LOCAL_POSTGRES_USER" -d "$LOCAL_POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi

  sleep 1
done

"${COMPOSE[@]}" exec -T postgres \
  pg_isready -h 127.0.0.1 -U "$LOCAL_POSTGRES_USER" -d "$LOCAL_POSTGRES_DB" >/dev/null 2>&1 ||
  fail 'local PostgreSQL did not become ready'

printf 'Replacing local database...\n'
"${COMPOSE[@]}" exec -T postgres \
  env "PGPASSWORD=$LOCAL_POSTGRES_PASSWORD" \
  psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -U "$LOCAL_POSTGRES_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"$LOCAL_POSTGRES_DB\" WITH (FORCE)" \
  -c "CREATE DATABASE \"$LOCAL_POSTGRES_DB\" OWNER \"$LOCAL_POSTGRES_USER\"" >/dev/null

"${COMPOSE[@]}" exec -T postgres \
  env "PGPASSWORD=$LOCAL_POSTGRES_PASSWORD" \
  psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -U "$LOCAL_POSTGRES_USER" -d "$LOCAL_POSTGRES_DB" \
  <"$DUMP_FILE" >/dev/null

printf 'Local database is synchronized.\n'
