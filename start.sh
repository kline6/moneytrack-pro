#!/bin/sh
set -e
cd /app/apps/backend
echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema prisma/schema.prisma 2>&1 || echo "Migration may have failed, continuing..."
echo "Starting server..."
exec node dist/main.js