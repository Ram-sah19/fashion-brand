# =======================================================
# Velora Circle Backend - Production Multi-Stage Dockerfile
# Orchestrates all 6 microservices + API Gateway on Render
# =======================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy root package.json
COPY package.json ./

# Copy each backend service package manifests for caching
COPY backend/auth-service/package*.json ./backend/auth-service/
COPY backend/user-service/package*.json ./backend/user-service/
COPY backend/message-service/package*.json ./backend/message-service/
COPY backend/circle-service/package*.json ./backend/circle-service/
COPY backend/notification-service/package*.json ./backend/notification-service/
COPY backend/call-service/package*.json ./backend/call-service/
COPY gateway/package*.json ./gateway/

# Install dependencies across all backend services
RUN npm run install:backend

# Copy source files
COPY backend/ ./backend/
COPY gateway/ ./gateway/
COPY scripts/ ./scripts/

# Build all TypeScript projects
RUN npm run build:backend

# =======================================================
# Runtime Stage
# =======================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root manifest and scripts
COPY package.json ./
COPY scripts/ ./scripts/

# Copy built artifacts and production dependencies from builder
COPY --from=builder /app/backend/ ./backend/
COPY --from=builder /app/gateway/ ./gateway/

# Create uploads directory for message service with correct permissions
RUN mkdir -p /app/backend/message-service/uploads && chown -R node:node /app

USER node

EXPOSE 4000

CMD ["node", "scripts/start-all.js"]
