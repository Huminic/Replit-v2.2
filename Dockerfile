# Nexxus Connect v2.2 — Multi-stage production build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev

EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "dist/index.cjs"]
