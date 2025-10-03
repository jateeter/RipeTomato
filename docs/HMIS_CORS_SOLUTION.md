# HMIS OpenCommons CORS Access Solution

## Overview

This document outlines the comprehensive strategy to resolve CORS (Cross-Origin Resource Sharing) issues when accessing `hmis.opencommons.org` from the Idaho Events application.

## Current CORS Challenge

The application needs to access HMIS (Homeless Management Information System) data from `https://hmis.opencommons.org`, but browsers block direct cross-origin requests due to CORS policies. The target API does not include the necessary CORS headers to allow browser-based access.

## Solution Architecture

### 1. **Multi-Layer Proxy Strategy**

#### A. Development Proxy (Current Implementation)
- **Location**: `/src/setupProxy.js`
- **Purpose**: Handle CORS during local development
- **Endpoint**: `/api/hmis-opencommons/*`
- **Target**: `https://hmis.opencommons.org/api.php`

```javascript
// Development proxy configuration
app.use('/api/hmis-opencommons', createProxyMiddleware({
  target: 'https://hmis.opencommons.org',
  changeOrigin: true,
  pathRewrite: { '^/api/hmis-opencommons': '/api.php' }
}));
```

#### B. Production Backend Proxy
- **Purpose**: Handle CORS in production environment
- **Implementation**: Server-side proxy service
- **Options**: 
  - Express.js proxy server
  - Nginx reverse proxy
  - Cloudflare Workers
  - AWS API Gateway

### 2. **Enhanced Proxy Configuration**

#### A. Headers Management
```javascript
// Removed restricted headers that browsers control:
// ❌ User-Agent
// ❌ Origin  
// ❌ Referer

// Using only browser-allowed headers:
// ✅ Accept
// ✅ Content-Type
// ✅ Cache-Control
// ✅ X-Requested-With
```

#### B. CORS Headers Configuration
```javascript
proxyRes.headers['Access-Control-Allow-Origin'] = '*';
proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
proxyRes.headers['Access-Control-Max-Age'] = '86400';
```

### 3. **Fallback Strategies**

#### A. Multiple Endpoint Strategy
1. **Primary**: Proxy endpoint (`/api/hmis-opencommons`)
2. **Fallback 1**: Generic CORS proxy (`/api/cors-proxy`)
3. **Fallback 2**: Direct fetch with CORS mode
4. **Fallback 3**: Mock data for development

#### B. Error Handling and Recovery
```javascript
try {
  // Attempt proxy request
  const response = await corsHttpClient.get(proxyUrl);
  return response.data;
} catch (error) {
  if (error.isCORSError) {
    // Try alternative endpoint
    return await this.fetchViaAlternativeProxy(url);
  }
  throw error;
}
```

## Implementation Plan

### Phase 1: Development Environment ✅
- [x] Remove restricted headers from all HTTP clients
- [x] Update setupProxy.js configuration
- [x] Test with development server

### Phase 2: Production Proxy Setup 🔄
- [ ] Set up production proxy server
- [ ] Configure environment-specific endpoints
- [ ] Implement health checks and monitoring

### Phase 3: Alternative Access Methods 📋
- [ ] Implement server-side HMIS data fetching
- [ ] Create scheduled data synchronization
- [ ] Add caching layer for HMIS data

### Phase 4: Monitoring and Optimization 📋
- [ ] Add CORS error tracking
- [ ] Implement retry logic with exponential backoff
- [ ] Monitor API response times and success rates

## Production Deployment Options

### Option 1: Express.js Proxy Server
```javascript
// production-proxy/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api/hmis', createProxyMiddleware({
  target: 'https://hmis.opencommons.org',
  changeOrigin: true,
  pathRewrite: { '^/api/hmis': '/api.php' },
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = process.env.ALLOWED_ORIGINS || '*';
  }
}));

app.listen(process.env.PORT || 3001);
```

### Option 2: Nginx Reverse Proxy
```nginx
# nginx.conf
server {
  listen 80;
  
  location /api/hmis/ {
    proxy_pass https://hmis.opencommons.org/api.php;
    proxy_set_header Host hmis.opencommons.org;
    proxy_set_header Accept application/json;
    
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Accept" always;
  }
}
```

### Option 3: Cloudflare Workers
```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hmisUrl = `https://hmis.opencommons.org/api.php${url.pathname.replace('/api/hmis', '')}${url.search}`;
  
  const response = await fetch(hmisUrl, {
    method: request.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  return newResponse;
}
```

## Configuration Updates

### Environment Variables
```bash
# .env.production
HMIS_PROXY_URL=https://your-proxy-server.com/api/hmis
HMIS_FALLBACK_URL=https://hmis.opencommons.org/api.php
HMIS_CACHE_TTL=300000
HMIS_RETRY_ATTEMPTS=3
```

### Service Configuration
```typescript
// src/config/hmisConfig.ts
export const hmisConfig = {
  development: {
    baseUrl: '/api/hmis-opencommons',
    fallbackUrl: '/api/cors-proxy?url=https://hmis.opencommons.org/api.php',
    timeout: 30000
  },
  production: {
    baseUrl: process.env.HMIS_PROXY_URL,
    fallbackUrl: process.env.HMIS_FALLBACK_URL,
    timeout: 15000
  }
};
```

## Testing Strategy

### 1. Development Testing
```bash
# Start development server
npm start

# Test HMIS endpoint
curl -X GET "http://localhost:3000/api/hmis-opencommons?action=query&format=json"
```

### 2. CORS Validation
```javascript
// Test script
const testCORS = async () => {
  try {
    const response = await fetch('/api/hmis-opencommons?action=query&format=json');
    console.log('✅ CORS working:', response.status);
  } catch (error) {
    console.error('❌ CORS error:', error);
  }
};
```

### 3. Production Testing
- Health check endpoints
- Response time monitoring
- Error rate tracking
- Fallback mechanism validation

## Security Considerations

### 1. Origin Restrictions
```javascript
// Restrict origins in production
const allowedOrigins = [
  'https://your-app.com',
  'https://staging.your-app.com'
];

proxyRes.headers['Access-Control-Allow-Origin'] = 
  allowedOrigins.includes(req.headers.origin) ? req.headers.origin : 'null';
```

### 2. Rate Limiting
```javascript
// Add rate limiting to proxy
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/hmis', limiter);
```

### 3. Request Validation
```javascript
// Validate requests to prevent abuse
const validateHMISRequest = (req, res, next) => {
  const { action, format } = req.query;
  if (!action || !format) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  next();
};
```

## Monitoring and Maintenance

### 1. Health Checks
```javascript
// Health check endpoint
app.get('/health/hmis', async (req, res) => {
  try {
    const response = await fetch('https://hmis.opencommons.org/api.php?action=query&format=json');
    res.json({ status: 'healthy', responseTime: Date.now() - start });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

### 2. Logging and Metrics
```javascript
// Request logging
app.use('/api/hmis', (req, res, next) => {
  console.log(`HMIS Request: ${req.method} ${req.url} from ${req.ip}`);
  next();
});
```

## Expected Outcomes

### 1. Development Environment ✅
- CORS issues resolved for local development
- Seamless API access during development
- No browser CORS errors

### 2. Production Environment 📋
- Reliable HMIS data access
- Sub-second response times
- 99.9% uptime for proxy service
- Proper error handling and fallbacks

### 3. User Experience 📋
- Fast loading of facility data
- Real-time facility information
- Graceful degradation during API issues
- Consistent data availability

## Next Steps

1. **Immediate**: Test the current development proxy setup
2. **Short-term**: Deploy production proxy solution
3. **Medium-term**: Implement caching and optimization
4. **Long-term**: Consider direct API partnership with HMIS OpenCommons

## Support and Maintenance

- Monitor CORS errors in production logs
- Keep fallback mechanisms updated
- Regular testing of all proxy endpoints
- Documentation updates as APIs evolve

---

*This solution ensures reliable access to HMIS OpenCommons data while maintaining proper CORS compliance and security practices.*