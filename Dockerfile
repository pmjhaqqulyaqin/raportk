# ============================================
#  RaportK — Multi-stage Docker Build
#  Frontend: Vite React  |  Backend: Express TS
# ============================================

# === Stage 1: Build Frontend ===
FROM node:20-alpine AS build-frontend
WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source & build
COPY index.html vite.config.js eslint.config.js ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# === Stage 2: Build Backend ===
FROM node:20-alpine AS build-backend
WORKDIR /app/backend

# Install ALL dependencies (including devDeps for tsc)
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy backend source & compile
COPY backend/tsconfig.json ./
COPY backend/src/ ./src/
RUN npx tsc

# === Stage 3: Production Image ===
FROM node:20-alpine AS production
WORKDIR /app

# Copy backend compiled output + production dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled backend JS
COPY --from=build-backend /app/backend/dist ./dist

# Copy frontend static build
COPY --from=build-frontend /app/dist ./public

# Copy drizzle config & schema for migrations
COPY backend/drizzle.config.ts ./drizzle.config.ts
COPY backend/src/db/schema.ts ./src/db/schema.ts

# Install drizzle-kit globally for migrations (used by deploy.sh)
RUN npm install -g drizzle-kit tsx drizzle-orm dotenv

# Create uploads directory with subdirectories
RUN mkdir -p /app/uploads/profiles

# Expose backend port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
