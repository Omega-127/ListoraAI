FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/mock-platforms/package*.json ./apps/mock-platforms/

RUN npm ci

COPY apps/mock-platforms ./apps/mock-platforms

RUN npm run build --workspace=apps/mock-platforms

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY apps/mock-platforms/package*.json ./apps/mock-platforms/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/mock-platforms/dist ./apps/mock-platforms/dist

EXPOSE 4100

CMD ["node", "apps/mock-platforms/dist/server.js"]
