# Idaho Events - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Deployment Environments](#deployment-environments)
5. [Docker Configuration](#docker-configuration)
6. [Deployment Methods](#deployment-methods)
7. [Environment Variables](#environment-variables)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Security Considerations](#security-considerations)

---

## Overview

The Idaho Events application can be deployed in containerized environments using Docker. This guide covers deployment for:

- **Desktop Environments**: Local development and testing
- **Headless Cloud**: Production cloud deployments (AWS, Azure, GCP, DigitalOcean, etc.)
- **On-Premise Servers**: Self-hosted deployments

### Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│                                     │
│  ┌──────────┐      ┌─────────────┐ │
│  │  Nginx   │─────▶│ React App   │ │
│  │  (Port   │      │ (Static)    │ │
│  │   80)    │      └─────────────┘ │
│  └────┬─────┘                       │
│       │                             │
│       │      ┌─────────────┐        │
│       └─────▶│ Proxy Server│        │
│              │ (Port 8080) │        │
│              └─────────────┘        │
└─────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

1. **Docker** (v20.10+)
   ```bash
   # Verify Docker installation
   docker --version
   docker info
   ```

2. **Docker Compose** (v2.0+)
   ```bash
   # Verify Docker Compose installation
   docker-compose --version
   ```

3. **Git** (for cloning repository)
   ```bash
   git --version
   ```

### Optional Tools

- **Docker Desktop**: For desktop environments with GUI
- **Portainer**: Web-based Docker management UI
- **Watchtower**: Automated container updates

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 2 GB
- Disk: 10 GB

**Recommended**:
- CPU: 4 cores
- RAM: 4 GB
- Disk: 20 GB

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/idaho-events.git
cd idaho-events
```

### 2. Production Deployment

```bash
# Build and deploy
./deployment/scripts/deploy.sh production

# Application will be available at:
# - Frontend: http://localhost
# - API Proxy: http://localhost:8080
# - Health Check: http://localhost/health
```

### 3. Development Deployment

```bash
# Build and deploy development environment
./deployment/scripts/deploy.sh development

# Application will be available at:
# - Frontend: http://localhost:3000
# - API Proxy: http://localhost:8080
```

---

## Deployment Environments

### Development Environment

**Purpose**: Local development with hot-reload

**Features**:
- Source code mounted for live reload
- Debug logging enabled
- Dev tools enabled

**Dockerfile**: `Dockerfile.dev`

**Compose**: `docker-compose.dev.yml`

**Deploy**:
```bash
./deployment/scripts/deploy.sh development
```

**Access**:
- Frontend: http://localhost:3000
- Proxy: http://localhost:8080

### Production Environment

**Purpose**: Optimized production deployment

**Features**:
- Multi-stage build for smaller images
- Nginx for static file serving
- Production optimizations
- Health checks enabled

**Dockerfile**: `Dockerfile`

**Compose**: `docker-compose.yml`

**Deploy**:
```bash
./deployment/scripts/deploy.sh production
```

**Access**:
- Frontend: http://localhost (port 80)
- Proxy: http://localhost:8080

---

## Docker Configuration

### Dockerfile (Production)

**Location**: `./Dockerfile`

**Stages**:
1. **Builder Stage**: Builds React application
2. **Production Stage**: Nginx + Node.js runtime

**Key Features**:
- Alpine Linux base (minimal size)
- Multi-stage build
- Health checks
- Security hardening

### Dockerfile.dev (Development)

**Location**: `./Dockerfile.dev`

**Features**:
- Single-stage build
- Source code mounting
- Hot-reload support
- Development tools included

### Docker Compose Files

#### Production (`docker-compose.yml`)

```yaml
services:
  app:
    build: .
    ports:
      - "80:80"      # Frontend
      - "8080:8080"  # Proxy
    restart: unless-stopped
```

#### Development (`docker-compose.dev.yml`)

```yaml
services:
  app-dev:
    build:
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"  # React dev server
      - "8080:8080"  # Proxy
    volumes:
      - ./src:/app/src  # Hot-reload
```

---

## Deployment Methods

### Method 1: Automated Scripts (Recommended)

**Build Only**:
```bash
# Production
./deployment/scripts/build.sh production latest

# Development
./deployment/scripts/build.sh development latest
```

**Deploy**:
```bash
# Production
./deployment/scripts/deploy.sh production

# Development
./deployment/scripts/deploy.sh development
```

### Method 2: Docker Compose

**Production**:
```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Development**:
```bash
# Build and start
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

### Method 3: Manual Docker Commands

**Build**:
```bash
# Production
docker build -t idaho-events:latest -f Dockerfile .

# Development
docker build -t idaho-events:dev -f Dockerfile.dev .
```

**Run**:
```bash
# Production
docker run -d \
  --name idaho-events \
  -p 80:80 \
  -p 8080:8080 \
  --restart unless-stopped \
  idaho-events:latest

# Development
docker run -d \
  --name idaho-events-dev \
  -p 3000:3000 \
  -p 8080:8080 \
  -v $(pwd)/src:/app/src \
  idaho-events:dev
```

---

## Environment Variables

### Application Variables

Create `.env` file in project root:

```bash
# Node Environment
NODE_ENV=production

# Timezone
TZ=America/Boise

# API Configuration
API_BASE_URL=https://api.example.com
API_TIMEOUT=30000

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_DEBUG=false

# External Services
HMIS_API_URL=https://hmis.example.com/api
SOLID_POD_URL=https://solidcommunity.net
```

### Docker Environment

Pass environment variables to containers:

**Docker Run**:
```bash
docker run -d \
  -e NODE_ENV=production \
  -e TZ=America/Boise \
  idaho-events:latest
```

**Docker Compose**:
```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - TZ=America/Boise
```

---

## Troubleshooting

### Container Won't Start

**Check logs**:
```bash
# Docker Compose
docker-compose logs

# Direct Docker
docker logs idaho-events
```

**Common issues**:
1. **Port already in use**:
   ```bash
   # Find process using port
   lsof -i :80
   lsof -i :8080

   # Kill process or change port
   ```

2. **Out of memory**:
   ```bash
   # Increase Docker memory limit in Docker Desktop
   # Or add memory limit to compose file:
   mem_limit: 2g
   ```

3. **Build fails**:
   ```bash
   # Clear Docker cache
   docker system prune -a

   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Application Errors

**Health check failing**:
```bash
# Check health endpoint
curl http://localhost/health

# Check Nginx status
docker exec idaho-events curl http://localhost/nginx_status
```

**Proxy server not responding**:
```bash
# Check if proxy is running
docker exec idaho-events netstat -tlnp | grep 8080

# View proxy logs
docker exec idaho-events cat /var/log/nginx/error.log
```

### Performance Issues

**High CPU usage**:
```bash
# Check container stats
docker stats idaho-events

# Limit CPU
docker update --cpus="2" idaho-events
```

**High memory usage**:
```bash
# Check memory stats
docker stats --no-stream idaho-events

# Limit memory
docker update --memory="2g" idaho-events
```

---

## Monitoring and Maintenance

### Viewing Logs

**Real-time logs**:
```bash
# All logs
docker-compose logs -f

# Specific service
docker logs -f idaho-events

# Last 100 lines
docker logs --tail 100 idaho-events
```

### Health Monitoring

**Health check endpoint**:
```bash
curl http://localhost/health
```

**Container health**:
```bash
docker inspect --format='{{.State.Health.Status}}' idaho-events
```

### Updates and Maintenance

**Update container**:
```bash
# Pull latest code
git pull

# Rebuild and redeploy
./deployment/scripts/deploy.sh production
```

**Backup data**:
```bash
# Backup volumes
docker run --rm \
  -v idaho-events-data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/data-$(date +%Y%m%d).tar.gz /data
```

**Clean up**:
```bash
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

---

## Security Considerations

### Container Security

1. **Run as non-root user**: Containers run as `nginx` user
2. **Read-only filesystem**: Where possible
3. **No privileged mode**: Containers don't require elevated privileges
4. **Resource limits**: CPU and memory limits enforced

### Network Security

1. **Firewall rules**: Only expose necessary ports
2. **HTTPS**: Use reverse proxy (nginx, Traefik) for SSL/TLS
3. **API authentication**: Secure API endpoints
4. **CORS policy**: Configure allowed origins

### Secret Management

**Do not commit secrets to Git**:
```bash
# Use .env files (gitignored)
echo "SECRET_KEY=xxx" >> .env

# Or use Docker secrets
docker secret create api_key ./api_key.txt
```

**Environment-specific secrets**:
```bash
# Production secrets
.env.production

# Development secrets
.env.development
```

### Regular Updates

```bash
# Update base images
docker pull node:18-alpine
docker pull nginx:alpine

# Rebuild with latest security patches
./deployment/scripts/build.sh production latest
```

---

## Cloud Deployment Examples

### AWS EC2

```bash
# 1. Launch EC2 instance (Amazon Linux 2 or Ubuntu)

# 2. Install Docker
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone and deploy
git clone https://github.com/your-org/idaho-events.git
cd idaho-events
./deployment/scripts/deploy.sh production

# 5. Configure security group to allow ports 80, 8080
```

### DigitalOcean Droplet

```bash
# 1. Create droplet with Docker pre-installed

# 2. SSH to droplet
ssh root@your-droplet-ip

# 3. Clone and deploy
git clone https://github.com/your-org/idaho-events.git
cd idaho-events
./deployment/scripts/deploy.sh production

# 4. Configure firewall
ufw allow 80/tcp
ufw allow 8080/tcp
ufw enable
```

### Google Cloud Platform

```bash
# 1. Create Compute Engine instance

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Clone and deploy
git clone https://github.com/your-org/idaho-events.git
cd idaho-events
./deployment/scripts/deploy.sh production

# 4. Configure firewall rules in GCP Console
```

---

## Advanced Configuration

### Reverse Proxy (Nginx/Traefik)

For HTTPS and domain routing:

```nginx
# /etc/nginx/sites-available/idaho-events
server {
    listen 443 ssl http2;
    server_name idaho-events.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Auto-restart with Systemd

Create service file:

```ini
# /etc/systemd/system/idaho-events.service
[Unit]
Description=Idaho Events Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/idaho-events
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable idaho-events
sudo systemctl start idaho-events
```

---

## Summary

### Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Firewall rules configured
- [ ] SSL certificates installed (production)
- [ ] Health checks configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation reviewed

### Quick Commands Reference

```bash
# Build production
./deployment/scripts/build.sh production

# Deploy production
./deployment/scripts/deploy.sh production

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Health check
curl http://localhost/health

# Container stats
docker stats
```

---

For additional support, refer to:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

**Deployment Complete!** 🚀
