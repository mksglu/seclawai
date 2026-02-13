# Stage 1: Build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install && npm cache clean --force

COPY *.ts tsconfig.json ./
RUN npx tsup *.ts --format esm --out-dir dist

# Stage 2: Production runtime
FROM node:20-alpine

RUN apk add --no-cache wget && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget --spider -q http://localhost:3000/health || exit 1

CMD ["node", "dist/agent.js"]
