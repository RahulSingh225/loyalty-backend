FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package.json package-lock.json ./
RUN npm ci --production

COPY .env ./

EXPOSE 3000

CMD ["node", "dist/server.js"]