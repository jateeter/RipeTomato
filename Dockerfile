# Idaho Events - Production Dockerfile
# Multi-stage build for optimized production deployment

# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy application source
COPY . .

# Build the application
RUN npm run build

# ============================================
# Stage 2: Production Stage
# ============================================
FROM nginx:alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    curl

# Copy nginx configuration
COPY deployment/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deployment/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy proxy server for API requests
COPY --from=builder /app/proxy-server.js /app/
COPY --from=builder /app/package*.json /app/
WORKDIR /app
RUN npm ci --only=production --legacy-peer-deps

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Copy startup script
COPY deployment/scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose ports
# 80 - Nginx (frontend)
# 8080 - Proxy server (API)
EXPOSE 80 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Set entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
