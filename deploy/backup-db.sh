#!/usr/bin/env bash
# Daily PostgreSQL backup (run via cron: 0 3 * * * /path/to/deploy/backup-db.sh)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "Backing up PostgreSQL to $BACKUP_DIR/bookedforreal-$TIMESTAMP.dump ..."
pg_dump "$DATABASE_URL" -Fc --no-owner > "$BACKUP_DIR/bookedforreal-$TIMESTAMP.dump"

# Delete backups older than the retention window.
find "$BACKUP_DIR" -name "bookedforreal-*.dump" -mtime "+$RETENTION_DAYS" -delete

echo "Backup complete. Retained $(ls -1 "$BACKUP_DIR" | wc -l | tr -d ' ') file(s)."
