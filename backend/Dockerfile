# Stage 1: Build
# Prisma 7 requires Node.js 20.19.0+, 22.12.0+, or 24+
FROM node:22-slim AS builder

# Install OpenSSL, which is required for Prisma engines to run
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/
# Prisma 7 requires the config file for runtime operations
COPY prisma.config.ts ./ 

# Install all dependencies
RUN npm ci

# Generate Prisma Client (must be done in the container to match the OS)
RUN npx prisma generate

# Copy source code and build NestJS application
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-slim AS runner

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy built application and necessary Prisma files from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/prisma.config.ts ./

# Expose NestJS default port
EXPOSE 3000

# At runtime: Run migrations to update the DB schema, then start the NestJS server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]