FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --progress=false

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY data ./data

EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget --quiet --tries=1 --spider http://127.0.0.1:4173/api/health || exit 1

CMD ["node", "server/app.js"]
