# Build stage
FROM node:22.12.0-bullseye-slim AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci for reproducible builds
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# Runtime stage
FROM node:22.12.0-bullseye-slim

WORKDIR /app

# Install minimal runtime dependencies for Electron desktop app
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    libxss1 \
    libxrandr2 \
    libxcomposite1 \
    libxdamage1 \
    libxkbcommon0 \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy node_modules and app from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app . .

# Create non-root user for security
RUN useradd -m -u 1001 nodejs && chown -R nodejs:nodejs /app

USER nodejs

# Expose port for extensions/services
EXPOSE 3000

# Default command
CMD ["npm", "start"]
