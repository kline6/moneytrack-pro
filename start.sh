#!/bin/sh
cd /app/apps/backend

echo "=== Running prisma db push ==="
npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss 2>&1
echo "=== DB push exit code: $? ==="

echo "=== Starting server ==="
exec node dist/main.js