# Stage 1: Build
# Prisma 7 requires Node.js 20.19.0+, 22.12.0+, or 24+
FROM node:24-alpine AS builder

# Install OpenSSL, which is required for Prisma engines to run
RUN apk add --no-cache openssl

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/
# Prisma 7 requires the config file for runtime operations
COPY prisma.config.ts ./ 

# Install all dependencies
RUN npm ci

# Copy source code and build NestJS application
COPY . .

# Generate Prisma Client (must be done in the container to match the OS)
RUN npx prisma generate

RUN npm run build

# Stage 2: Production Runtime
FROM node:24-alpine AS runner

RUN apk add --no-cache openssl

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