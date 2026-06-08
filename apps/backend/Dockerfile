FROM node:20
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate
WORKDIR /app
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/backend/ ./apps/backend/
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && pnpm build
RUN cd apps/backend && npx prisma generate && pnpm build
EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]