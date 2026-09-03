FROM node:24-alpine AS builder

WORKDIR /usr/src/app

ENV HUSKY=0

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:24-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV HUSKY=0

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --prod --frozen-lockfile --filter api

COPY --from=builder /usr/src/app/apps/api/dist ./apps/api/dist
COPY --from=builder /usr/src/app/apps/api/generated ./apps/api/generated
COPY --from=builder /usr/src/app/apps/client/dist ./apps/client/dist

WORKDIR /usr/src/app/apps/api

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
