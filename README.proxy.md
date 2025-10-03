# CORS Proxy Server for HMIS Integration

This document describes the production-ready CORS proxy server implementation for accessing HMIS OpenCommons and other external APIs from the Idaho Events application.

## Overview

The CORS proxy server solves cross-origin resource sharing (CORS) issues by acting as an intermediary between the React frontend and external APIs. This approach is necessary because many external APIs don't include proper CORS headers for browser-based access.

## Features

- ✅ **Production-ready Express.js server** with security middleware
- ✅ **HMIS OpenCommons dedicated endpoint** with optimized routing
- ✅ **Generic CORS proxy** for other external APIs
- ✅ **Rate limiting** and request validation
- ✅ **Health monitoring** with endpoint-specific checks
- ✅ **Comprehensive error handling** with fallback mechanisms
- ✅ **Security hardening** with Helmet, CORS configuration, and input validation
- ✅ **Docker support** for containerized deployment
- ✅ **Environment-specific configurations** for development and production

## Quick Start

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the proxy server:**
   ```bash
   npm run proxy:dev
   ```

3. **Start both proxy and React app:**
   ```bash
   npm run start:with-proxy
   ```

4. **Test the setup:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3001/health/hmis
   ```

### Production Deployment

1. **Using Node.js directly:**
   ```bash
   npm run proxy:prod
   ```

2. **Using Docker:**
   ```bash
   docker build -f Dockerfile.proxy -t idaho-events-proxy .
   docker run -p 3001:3001 --env-file .env.proxy.production idaho-events-proxy
   ```

3. **Using Docker Compose:**
   ```bash
   # Development
   docker-compose -f docker-compose.proxy.yml up
   
   # Production
   docker-compose -f docker-compose.proxy.yml -f docker-compose.proxy.prod.yml up
   ```

## Configuration

### Environment Variables

Create `.env.proxy` based on the provided templates:

**Development (.env.proxy.development):**
```bash
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,https://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100
```

**Production (.env.proxy.production):**
```bash
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app.com,https://www.your-app.com
RATE_LIMIT_MAX_REQUESTS=50
```

### React App Configuration

Update your React app's environment variables:

```bash
# .env.development
REACT_APP_PROXY_URL=http://localhost:3001

# .env.production
REACT_APP_PROXY_URL=https://api.your-domain.com
```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns server health status and uptime information.

### HMIS Health Check
```bash
GET /health/hmis
```
Tests connectivity to HMIS OpenCommons and returns response time.

### HMIS OpenCommons Proxy
```bash
GET /api/hmis?action=query&format=json&<other-params>
```
Proxies requests to `https://hmis.opencommons.org/api.php` with automatic CORS headers.

### Generic CORS Proxy
```bash
GET /api/proxy?url=<encoded-target-url>
```
Proxies requests to any allowed external URL with CORS support.

## Usage Examples

### From React Application

```typescript
// Using the configured proxy endpoints
import { getProxyEndpoints, buildProxyUrl } from './config/proxyConfig';

const endpoints = getProxyEndpoints();

// HMIS OpenCommons request
const hmisData = await fetch(`${endpoints.hmisOpenCommons}?action=query&format=json`);

// Generic proxy request
const externalData = await fetch(buildProxyUrl('https://api.example.com/data'));

// Health check
const health = await fetch(endpoints.healthCheck);
```

### Direct HTTP Requests

```bash
# HMIS OpenCommons MediaWiki API
curl "http://localhost:3001/api/hmis?action=query&list=allpages&format=json"

# Generic proxy
curl "http://localhost:3001/api/proxy?url=https%3A//httpbin.org/json"

# Health checks
curl http://localhost:3001/health
curl http://localhost:3001/health/hmis
```

## Security Features

### Rate Limiting
- **Development**: 100 requests per 15-minute window
- **Production**: 50 requests per 15-minute window
- **Per-IP tracking** with standardized headers

### CORS Configuration
- **Configurable allowed origins** per environment
- **Automatic preflight handling** for complex requests
- **Security headers** with Helmet middleware

### Input Validation
- **URL validation** for proxy requests
- **Domain whitelisting** in production
- **Request parameter validation** for HMIS requests

### Request Logging
- **Structured logging** with timestamps and request IDs
- **Error tracking** with context information
- **Performance monitoring** with response time tracking

## Monitoring and Maintenance

### Health Monitoring

The proxy server provides comprehensive health checks:

```bash
# Basic health (server status, uptime)
curl http://localhost:3001/health

# HMIS connectivity (tests actual HMIS API)
curl http://localhost:3001/health/hmis
```

### Log Analysis

Monitor logs for:
- **CORS errors**: Check for blocked origins
- **Rate limit hits**: Monitor traffic patterns
- **Proxy failures**: Track external API issues
- **Response times**: Monitor performance

### Metrics Collection

Key metrics to track:
- Request volume and rate limit hits
- Response times for external APIs
- Error rates by endpoint
- Health check success rates

## Troubleshooting

### Common Issues

1. **CORS errors persisting**:
   - Verify `ALLOWED_ORIGINS` includes your frontend domain
   - Check browser console for specific CORS error messages
   - Test with curl to isolate frontend vs proxy issues

2. **Rate limit exceeded**:
   - Increase `RATE_LIMIT_MAX_REQUESTS` if needed
   - Implement caching in the frontend
   - Consider user-specific rate limiting

3. **HMIS connectivity issues**:
   - Check HMIS health endpoint: `/health/hmis`
   - Verify network connectivity to `hmis.opencommons.org`
   - Review proxy logs for specific error messages

4. **Performance issues**:
   - Monitor response times in health checks
   - Consider implementing response caching
   - Review proxy timeout configurations

### Debug Mode

Enable detailed logging in development:

```bash
NODE_ENV=development LOG_LEVEL=debug npm run proxy:dev
```

### Testing Proxy Functionality

```bash
# Test basic proxy health
curl -v http://localhost:3001/health

# Test HMIS proxy with verbose output
curl -v "http://localhost:3001/api/hmis?action=query&meta=siteinfo&format=json"

# Test generic proxy
curl -v "http://localhost:3001/api/proxy?url=https%3A//httpbin.org/headers"
```

## Deployment Strategies

### Option 1: Standalone Server
Deploy the proxy server on a separate instance/container and configure the React app to use it.

### Option 2: Reverse Proxy Integration
Integrate with existing reverse proxy (Nginx, Traefik) for SSL termination and load balancing.

### Option 3: Serverless Function
Adapt the proxy logic for deployment as serverless functions (AWS Lambda, Vercel Functions).

### Option 4: API Gateway
Use cloud API Gateway services (AWS API Gateway, Google Cloud Endpoints) with custom proxy handlers.

## Performance Optimization

### Caching Strategies
- Implement response caching for frequently requested HMIS data
- Use Redis or in-memory caching for improved performance
- Configure appropriate cache headers

### Load Balancing
- Deploy multiple proxy instances behind a load balancer
- Implement health checks for automatic failover
- Consider geographic distribution for global users

### Connection Pooling
- Configure HTTP agent with connection pooling
- Optimize timeout values for different endpoints
- Implement circuit breaker patterns for external APIs

## Contributing

When contributing to the proxy server:

1. **Test all changes** with both development and production configurations
2. **Update health checks** for new endpoints or features
3. **Maintain security practices** - never log sensitive information
4. **Document new endpoints** and configuration options
5. **Test Docker deployments** to ensure compatibility

## License

MIT License - see the main project LICENSE file for details.

---

**Next Steps:**
1. Deploy the proxy server to your production environment
2. Update DNS/firewall rules to allow proxy access
3. Configure monitoring and alerting for proxy health
4. Test end-to-end functionality with the React application
5. Implement additional security measures as needed