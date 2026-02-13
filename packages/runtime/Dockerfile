FROM node:20-alpine

RUN apk add --no-cache wget && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY agent.js ./

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
    CMD wget --spider -q http://localhost:3000/health || exit 1

CMD ["node", "agent.js"]
