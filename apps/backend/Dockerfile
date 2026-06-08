FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/ ./apps/backend/
COPY packages/shared/ ./packages/shared/
RUN pnpm install --frozen-lockfile
RUN cd apps/backend && npx prisma generate && pnpm build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
WORKDIR /app
RUN addgroup --system --gid 1001 appgroup && adduser --system --uid 1001 appuser
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/apps/backend/package.json ./apps/backend/
COPY --from=build /app/packages/shared ./packages/shared
USER appuser
EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]
