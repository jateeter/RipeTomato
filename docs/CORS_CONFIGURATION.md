# CORS Configuration for HMIS System Access

## Overview

This document describes the Cross-Origin Resource Sharing (CORS) configuration implemented to ensure reliable access to HMIS (Homeless Management Information System) APIs from the Idaho Events application.

## Problem Statement

When accessing external HMIS APIs from a browser-based application, CORS policies can block requests due to same-origin security restrictions. This implementation provides:

- **CORS-compliant HTTP client** with automatic error handling
- **Development proxy** for seamless local development
- **Fallback mechanisms** when CORS issues occur
- **Comprehensive error handling** with user-friendly messages
- **Testing tools** for diagnosing connectivity issues

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Application                          │
├─────────────────────────────────────────────────────────────────┤
│                    CORS HTTP Client                            │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Development   │   Production    │      Error Handler          │
│   Proxy         │   Direct CORS   │      & Fallbacks            │
│   (/api/*)      │   Requests      │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ HMIS Open   │ │ MediaWiki   │ │  External   │
    │ Commons     │ │    APIs     │ │   APIs      │
    │ API         │ │             │ │             │
    └─────────────┘ └─────────────┘ └─────────────┘
```

## File Structure

```
src/
├── utils/
│   └── corsHttpClient.ts           # CORS-compliant HTTP client
├── config/
│   └── corsConfig.ts              # Environment-specific CORS settings
├── components/
│   ├── CORSErrorHandler.tsx       # User-friendly error display
│   └── CORSTestingDashboard.tsx   # Admin testing interface
├── services/
│   ├── hmisAPIService.ts          # Updated with CORS support
│   ├── hmisOpenCommonsService.ts  # Updated with CORS client
│   └── mediaWikiService.ts        # Updated with fallbacks
└── setupProxy.js                  # Development proxy configuration
```

## Components

### 1. CORS HTTP Client (`src/utils/corsHttpClient.ts`)

**Purpose:** Unified HTTP client with CORS handling, automatic retries, and fallback mechanisms.

**Features:**
- Automatic CORS header injection
- Retry logic with exponential backoff
- Proxy URL support for development
- CORS error detection and handling
- Provider-specific configurations

**Usage:**
```typescript
import { corsHttpClient, CORSConfigs } from '../utils/corsHttpClient';

const response = await corsHttpClient.get(url, {
  ...CORSConfigs.hmisAPI,
  headers: {
    'Origin': window.location.origin,
    'Accept': 'application/json'
  }
});
```

### 2. CORS Configuration (`src/config/corsConfig.ts`)

**Purpose:** Environment-specific configuration for CORS settings and API endpoints.

**Key Functions:**
- `getCORSConfig()` - Returns environment-appropriate settings
- `HMISEndpoints` - Dynamic API endpoint management
- `testCORSConnectivity()` - Connectivity testing utility

**Environment Settings:**

**Development:**
```typescript
{
  hmisOpenCommonsBaseUrl: '/api/hmis-opencommons',  // Proxy URL
  useProxy: true,
  proxyUrl: '/api/cors-proxy',
  corsEnabled: true,
  retryAttempts: 2,
  timeout: 30000
}
```

**Production:**
```typescript
{
  hmisOpenCommonsBaseUrl: 'https://hmis.opencommons.org/api.php',
  useProxy: false,
  proxyUrl: process.env.REACT_APP_CORS_PROXY_URL,
  corsEnabled: true,
  retryAttempts: 3,
  timeout: 35000
}
```

### 3. Development Proxy (`src/setupProxy.js`)

**Purpose:** Automatic proxy configuration for Create React App to handle CORS during development.

**Proxy Routes:**
- `/api/hmis-opencommons/*` → `https://hmis.opencommons.org/api.php`
- `/api/cors-proxy?url=<target>` → `<target>` (generic proxy)

**Features:**
- Automatic CORS header injection
- Request/response logging
- Error handling with detailed messages
- Support for GET, POST, PUT, DELETE methods

### 4. Error Handling (`src/components/CORSErrorHandler.tsx`)

**Purpose:** User-friendly display of CORS errors with troubleshooting guidance.

**Features:**
- CORS error detection and classification
- Connectivity status display
- Suggested troubleshooting actions
- Technical details for developers
- Retry mechanisms

### 5. Testing Dashboard (`src/components/CORSTestingDashboard.tsx`)

**Purpose:** Administrative interface for testing and diagnosing CORS connectivity.

**Features:**
- Real-time connectivity testing
- Custom endpoint testing
- Configuration display
- Test result history
- Result export functionality

## Configuration

### Environment Variables

**Required for Production:**
```bash
# Primary HMIS API endpoint
REACT_APP_HMIS_API_URL=https://hmis.opencommons.org/api.php

# Optional CORS proxy for fallback
REACT_APP_CORS_PROXY_URL=https://your-cors-proxy.com/api
```

**Development (Optional):**
```bash
# Override default development settings
REACT_APP_DEV_PROXY_ENABLED=true
REACT_APP_DEV_HMIS_URL=https://staging.hmis.opencommons.org/api.php
```

### Proxy Configuration

The development proxy is automatically configured when running `npm start`. No additional setup required.

**Manual Proxy Setup (if needed):**
1. Install dependencies: `npm install http-proxy-middleware --save-dev`
2. Configure `src/setupProxy.js` with target URLs
3. Restart development server

## Usage Examples

### Basic HMIS API Request

```typescript
import { hmisAPIService } from '../services/hmisAPIService';

// Automatically uses CORS-compliant client
const facilities = await hmisAPIService.getAllFacilities({
  facilityTypes: ['shelter'],
  limit: 50
});
```

### Custom API Request with CORS

```typescript
import { corsHttpClient, CORSConfigs } from '../utils/corsHttpClient';

const response = await corsHttpClient.get('https://api.example.com/data', {
  ...CORSConfigs.hmisAPI,
  headers: {
    'Authorization': 'Bearer token',
    'Origin': window.location.origin
  },
  retryAttempts: 3,
  timeout: 30000
});
```

### Error Handling in Components

```typescript
import { useCORSErrorHandler } from '../components/CORSErrorHandler';

const MyComponent = () => {
  const { corsError, handleError, retryOperation } = useCORSErrorHandler();

  const fetchData = async () => {
    try {
      const data = await retryOperation(() => 
        hmisAPIService.getAllFacilities()
      );
      setData(data);
    } catch (error) {
      // Error automatically handled by hook
    }
  };

  return (
    <div>
      {corsError && (
        <CORSErrorHandler 
          error={corsError}
          onRetry={fetchData}
          onDismiss={() => clearError()}
        />
      )}
      {/* Component content */}
    </div>
  );
};
```

## Testing

### Automated Testing

Run CORS connectivity tests:
```bash
# Start development server
npm start

# In browser, navigate to CORS Testing Dashboard
# Or run programmatic tests
npm test -- --testNamePattern="CORS"
```

### Manual Testing

1. **Development Environment:**
   - Start app with `npm start`
   - Open browser dev tools
   - Check console for proxy messages
   - Verify requests go through `/api/hmis-opencommons`

2. **Production Environment:**
   - Build app with `npm run build`
   - Serve with static server
   - Check direct API calls to HMIS
   - Verify CORS headers in network tab

3. **CORS Testing Dashboard:**
   - Navigate to admin interface
   - Run connectivity tests
   - Test custom endpoints
   - Export results for analysis

## Troubleshooting

### Common Issues

**1. CORS Policy Errors**
```
Access to fetch at 'https://hmis.opencommons.org' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solutions:**
- Verify development proxy is running (`npm start`)
- Check `setupProxy.js` configuration
- Confirm target server has CORS headers
- Use CORS Testing Dashboard to diagnose

**2. Proxy Not Working**
```
404 Not Found for /api/hmis-opencommons
```

**Solutions:**
- Restart development server
- Check `http-proxy-middleware` installation
- Verify `setupProxy.js` exists and is configured
- Check console for proxy error messages

**3. Production CORS Issues**
```
Failed to fetch from production API
```

**Solutions:**
- Verify production API has CORS headers
- Check `REACT_APP_HMIS_API_URL` environment variable
- Implement CORS proxy server for production
- Contact HMIS API administrator

**4. Network Timeout Errors**
```
Request timeout after 30000ms
```

**Solutions:**
- Check network connectivity
- Verify HMIS server availability
- Adjust timeout in `corsConfig.ts`
- Use fallback endpoints if available

### Debug Mode

Enable detailed CORS logging:
```bash
REACT_APP_CORS_DEBUG=true npm start
```

This provides:
- Detailed request/response logging
- CORS header analysis
- Proxy routing information
- Error stack traces

### Testing Checklist

- [ ] Development proxy working (`/api/hmis-opencommons`)
- [ ] Direct API calls successful (production)
- [ ] CORS headers present in responses
- [ ] Error handling displays user-friendly messages
- [ ] Retry mechanisms working for temporary failures
- [ ] Testing dashboard accessible and functional
- [ ] Build completes without CORS-related errors

## Production Deployment

### Server-Side CORS Configuration

If you control the HMIS server, add these headers:

```apache
# Apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
Header always set Access-Control-Max-Age "86400"
```

```nginx
# Nginx
add_header Access-Control-Allow-Origin "*";
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
add_header Access-Control-Max-Age "86400";
```

### CORS Proxy Server

For production environments where you cannot modify the HMIS server:

1. **Deploy CORS Proxy:**
   ```bash
   # Example using cors-anywhere
   npm install cors-anywhere
   
   # Deploy to your server
   const cors_proxy = require('cors-anywhere');
   cors_proxy.createServer({
     originWhitelist: ['https://your-app.com'],
     requireHeader: ['origin', 'x-requested-with'],
     removeHeaders: ['cookie', 'cookie2']
   }).listen(8080, '0.0.0.0');
   ```

2. **Configure Production Environment:**
   ```bash
   REACT_APP_CORS_PROXY_URL=https://your-cors-proxy.com
   ```

### Security Considerations

1. **Origin Restrictions:**
   - Configure CORS to allow only your domain
   - Use environment-specific origin settings
   - Validate origin on server-side

2. **Proxy Security:**
   - Restrict proxy access to authorized domains
   - Implement rate limiting
   - Log and monitor proxy usage

3. **Credential Handling:**
   - Avoid sending credentials with CORS requests
   - Use tokens instead of cookies for authentication
   - Implement proper token refresh mechanisms

## Monitoring

### Metrics to Track

- CORS request success rate
- Average response times
- Error frequencies by type
- Proxy usage statistics
- Browser compatibility issues

### Alerting

Set up alerts for:
- High CORS error rates (>5%)
- Proxy server downtime
- API endpoint unavailability
- Unusual error patterns

## Future Enhancements

1. **Advanced Caching:**
   - Implement request/response caching
   - Add cache invalidation strategies
   - Support offline functionality

2. **Enhanced Error Recovery:**
   - Automatic endpoint failover
   - Intelligent retry strategies
   - Circuit breaker patterns

3. **Performance Optimization:**
   - Request batching for bulk operations
   - Connection pooling
   - Request deduplication

4. **Security Improvements:**
   - Request signing and validation
   - Enhanced proxy authentication
   - Content security policy enforcement

## Support

For CORS-related issues:

1. Check this documentation first
2. Use the CORS Testing Dashboard to diagnose
3. Review browser console and network logs
4. Export test results for support analysis
5. Contact system administrator with diagnostic data

## License

MIT License - See main project LICENSE file for details.