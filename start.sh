#!/bin/sh
set -e
cd /app/apps/backend

echo "=== Running prisma migrate deploy ==="
npx prisma migrate deploy --schema prisma/schema.prisma
echo "=== Migrations complete ==="

echo "=== Starting server ==="
exec node dist/main.js