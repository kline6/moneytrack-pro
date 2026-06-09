#!/bin/sh
cd /app/apps/backend

echo "=== DATABASE_URL is set: $([ -n \"$DATABASE_URL\" ] && echo 'yes' || echo 'NO') ==="
echo "=== Running prisma db push ==="
npx prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss
PUSH_EXIT=$?
echo "=== prisma db push exit code: $PUSH_EXIT ==="

if [ $PUSH_EXIT -ne 0 ]; then
  echo "=== DB push failed! Trying prisma migrate deploy ==="
  npx prisma migrate deploy --schema prisma/schema.prisma 2>&1
  MIGRATE_EXIT=$?
  echo "=== prisma migrate deploy exit code: $MIGRATE_EXIT ==="
fi

echo "=== Starting server ==="
exec node dist/main.js