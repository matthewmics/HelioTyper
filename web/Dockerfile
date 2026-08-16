FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY web/package.json ./web/package.json
COPY api/package.json ./api/package.json
RUN pnpm install --filter web --frozen-lockfile

COPY web ./web
WORKDIR /app/web

EXPOSE 3000

CMD ["pnpm", "exec", "next", "dev", "--webpack"]
