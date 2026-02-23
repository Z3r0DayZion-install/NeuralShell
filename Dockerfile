# syntax=docker/dockerfile:1.7

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Runtime stage
FROM node:22-alpine

LABEL maintainer="NeuralShell Team"
LABEL description="NeuralShell Router - Intelligent AI Request Router"

WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/state && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Copy only production dependencies and app code from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/router.js ./
COPY --from=builder --chown=nodejs:nodejs /app/production-server.js ./
COPY --from=builder --chown=nodejs:nodejs /app/replayEngine.js ./
COPY --from=builder --chown=nodejs:nodejs /app/qualityScoring.js ./
COPY --from=builder --chown=nodejs:nodejs /app/queryAPI.js ./
COPY --from=builder --chown=nodejs:nodejs /app/config.yaml.example ./config.yaml
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/src ./src

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use production server
CMD ["node", "production-server.js"]
