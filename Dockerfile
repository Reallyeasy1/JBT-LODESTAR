# Lodestar — local development image
# Single stage: full node_modules kept so `prisma`, `tsx`, and `prisma db seed` work at runtime.
# Not optimised for image size — this runs locally via docker compose.

FROM node:20-slim

# Prisma engines require openssl
RUN apt-get update -qq && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (layer cache friendly)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Entrypoint: wait for DB, push schema, then start
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
