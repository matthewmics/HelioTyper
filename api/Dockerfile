FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --filter api --frozen-lockfile

COPY api ./api
WORKDIR /app/api

# The generated client is gitignored, so build it into the image. In dev the
# bind mount replaces it with the host's copy, which is fine: Prisma 7 generates
# plain TypeScript, nothing platform specific.
RUN pnpm exec prisma generate

EXPOSE 3000

CMD ["pnpm", "run", "start:dev"]
