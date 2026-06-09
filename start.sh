#!/bin/sh
set -e
cd /app/apps/backend

echo "=== Running prisma db push ==="
npx prisma db push --schema prisma/schema.prisma --skip-generate
echo "=== DB push complete ==="

echo "=== Starting server ==="
exec node dist/main.js