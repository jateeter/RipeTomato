/**
 * Production CORS Proxy Server
 * 
 * Express.js server for handling CORS requests in production environment.
 * This server acts as an intermediary to bypass CORS restrictions when
 * accessing HMIS OpenCommons and other external APIs.
 * 
 * Usage:
 *   node proxy-server.js
 * 
 * Environment Variables:
 *   - PORT: Server port (default: 3001)
 *   - ALLOWED_ORIGINS: Comma-separated list of allowed origins
 *   - NODE_ENV: Environment (production, development)
 * 
 * @license MIT
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow proxy responses
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'https://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Original-URL'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
  credentials: false,
  maxAge: 86400 // 24 hours
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// HMIS health check endpoint
app.get('/health/hmis', async (req, res) => {
  const start = Date.now();
  
  try {
    // Use require for Node.js 16 compatibility
    const fetch = require('node-fetch');
    const response = await fetch('https://hmis.opencommons.org/api.php?action=query&format=json&meta=siteinfo', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    const responseTime = Date.now() - start;
    
    if (response.ok) {
      res.json({ 
        status: 'healthy', 
        responseTime: `${responseTime}ms`,
        endpoint: 'hmis.opencommons.org',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy', 
        error: `HTTP ${response.status}`,
        responseTime: `${responseTime}ms`,
        endpoint: 'hmis.opencommons.org'
      });
    }
  } catch (error) {
    const responseTime = Date.now() - start;
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message,
      responseTime: `${responseTime}ms`,
      endpoint: 'hmis.opencommons.org'
    });
  }
});

// Request validation middleware
const validateHMISRequest = (req, res, next) => {
  const { action, format } = req.query;
  
  if (!action) {
    return res.status(400).json({ 
      error: 'Missing required parameter: action',
      expectedFormat: '?action=query&format=json'
    });
  }
  
  // Set default format if not provided
  if (!format) {
    req.query.format = 'json';
  }
  
  next();
};

// HMIS OpenCommons MediaWiki API proxy
app.use('/api/hmis', 
  validateHMISRequest,
  createProxyMiddleware({
    target: 'https://hmis.opencommons.org',
    changeOrigin: true,
    pathRewrite: {
      '^/api/hmis': '/api.php'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Proxying HMIS request: ${req.method} ${req.originalUrl}`);
      
      // Add standard headers (avoiding restricted headers)
      proxyReq.setHeader('Accept', 'application/json, text/html, */*');
      proxyReq.setHeader('Cache-Control', 'no-cache');
      proxyReq.setHeader('Pragma', 'no-cache');
      
      // Add request tracking
      const requestId = Math.random().toString(36).substring(2, 15);
      proxyReq.setHeader('X-Request-ID', requestId);
      req.requestId = requestId;
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      proxyRes.headers['Access-Control-Max-Age'] = '86400';
      
      // Add request ID to response
      if (req.requestId) {
        proxyRes.headers['X-Request-ID'] = req.requestId;
      }
      
      console.log(`✅ HMIS proxy response: ${proxyRes.statusCode} for ${req.originalUrl} (${req.requestId || 'no-id'})`);
    },
    onError: (err, req, res) => {
      console.error(`❌ HMIS proxy error for ${req.originalUrl}:`, {
        error: err.message,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      
      res.status(502).json({
        error: 'Proxy error',
        message: 'Unable to reach HMIS service',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        retryAfter: 5
      });
    },
    timeout: 30000,
    proxyTimeout: 30000,
    logLevel: 'warn'
  })
);

// Generic CORS proxy with URL validation
const validateProxyUrl = (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'Missing target URL',
      usage: '/api/proxy?url=<encoded-url>'
    });
  }
  
  try {
    const url = new URL(decodeURIComponent(targetUrl));
    
    // Whitelist of allowed domains for security
    const allowedDomains = [
      'hmis.opencommons.org',
      'api.example.com',
      // Add more allowed domains as needed
    ];
    
    if (process.env.NODE_ENV === 'production') {
      const isAllowed = allowedDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return res.status(403).json({
          error: 'Domain not allowed',
          domain: url.hostname,
          allowedDomains
        });
      }
    }
    
    req.targetUrl = url;
    next();
  } catch (error) {
    res.status(400).json({
      error: 'Invalid URL format',
      providedUrl: targetUrl
    });
  }
};

app.use('/api/proxy',
  validateProxyUrl,
  createProxyMiddleware({
    target: 'http://localhost:3000', // Dummy target
    changeOrigin: true,
    router: (req) => {
      const url = req.targetUrl;
      return `${url.protocol}//${url.host}`;
    },
    pathRewrite: (path, req) => {
      const url = req.targetUrl;
      return url.pathname + url.search;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Generic proxy: ${req.method} ${req.targetUrl.href}`);
      
      proxyReq.setHeader('Accept', 'application/json, text/html, */*');
      proxyReq.setHeader('X-Original-URL', req.targetUrl.href);
      proxyReq.setHeader('X-Forwarded-For', req.ip);
      
      const requestId = Math.random().toString(36).substring(2, 15);
      proxyReq.setHeader('X-Request-ID', requestId);
      req.requestId = requestId;
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add CORS headers
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      proxyRes.headers['Access-Control-Max-Age'] = '86400';
      
      if (req.requestId) {
        proxyRes.headers['X-Request-ID'] = req.requestId;
      }
      
      console.log(`✅ Proxy response: ${proxyRes.statusCode} for ${req.targetUrl.href}`);
    },
    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${req.targetUrl?.href || 'unknown'}:`, err.message);
      
      res.status(502).json({
        error: 'Proxy error',
        message: 'Unable to reach target service',
        targetUrl: req.targetUrl?.href,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    },
    timeout: 25000,
    proxyTimeout: 25000
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /health',
      'GET /health/hmis',
      'GET /api/hmis?action=query&format=json',
      'GET /api/proxy?url=<encoded-url>'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    requestId: req.requestId || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🌐 CORS Proxy Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
  console.log(`🏥 HMIS health: http://localhost:${PORT}/health/hmis`);
  console.log(`📋 Available endpoints:`);
  console.log(`  - GET  /api/hmis?action=query&format=json`);
  console.log(`  - GET  /api/proxy?url=<encoded-url>`);
});

module.exports = app;