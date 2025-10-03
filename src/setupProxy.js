/**
 * Development Proxy Setup for CORS
 * 
 * Configures proxy middleware to handle CORS issues during development
 * by proxying requests to external HMIS APIs through the development server.
 * 
 * This file is automatically detected by Create React App.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // HMIS OpenCommons MediaWiki API Proxy  
  // Using router-based approach for better debugging and control
  app.use(
    '/api/hmis-opencommons',
    createProxyMiddleware({
      target: 'https://hmis.opencommons.org',
      changeOrigin: true,
      pathRewrite: (path, req) => {
        // Since middleware strips /api/hmis-opencommons, we get path like "/?params"
        // Convert to "/api.php?params"
        const newPath = path.startsWith('/') && path !== '/' ? 
          `/api.php${path.substring(1)}` :
          `/api.php${path}`;
        console.log(`🔄 HMIS Path rewrite: "${path}" -> "${newPath}"`);
        return newPath;
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`📤 HMIS Request: ${req.method} ${req.url}`);
        console.log(`   Target: https://hmis.opencommons.org${proxyReq.path}`);
        
        // Set clean headers for MediaWiki API
        proxyReq.setHeader('Accept', 'application/json, text/html, */*');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.setHeader('Cache-Control', 'no-cache');
        
        // Remove potentially problematic headers
        proxyReq.removeHeader('user-agent');
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
        
        console.log(`   Final headers: ${Object.keys(proxyReq.getHeaders()).join(', ')}`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`📥 HMIS Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
        console.log(`   Content-Type: ${proxyRes.headers['content-type'] || 'none'}`);
        
        // Add CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        proxyRes.headers['Access-Control-Max-Age'] = '86400';
        
        // Check for unexpected HTML responses
        const contentType = proxyRes.headers['content-type'] || '';
        if (contentType.includes('text/html') && req.url.includes('format=json')) {
          console.log(`   ⚠️ Got HTML instead of JSON - API might have failed`);
        }
      },
      onError: (err, req, res) => {
        console.error(`❌ HMIS Proxy Error: ${err.message}`);
        console.error(`   URL: ${req.url}`);
        res.status(500).json({
          error: 'HMIS Proxy Error',
          message: err.message,
          url: req.url
        });
      }
    })
  );

  // Generic CORS Proxy for any external API
  app.use(
    '/api/cors-proxy',
    createProxyMiddleware({
      target: 'http://localhost:3000', // Dummy target, will be overridden
      changeOrigin: true,
      router: (req) => {
        // Extract the target URL from query parameters
        const targetUrl = req.query.url;
        if (targetUrl) {
          try {
            const url = new URL(targetUrl);
            return `${url.protocol}//${url.host}`;
          } catch (error) {
            console.error('Invalid target URL:', targetUrl);
            return 'http://localhost:3000'; // Fallback
          }
        }
        return 'http://localhost:3000';
      },
      pathRewrite: (path, req) => {
        // Extract the target URL and return the path
        const targetUrl = req.query.url;
        if (targetUrl) {
          try {
            const url = new URL(targetUrl);
            return url.pathname + url.search;
          } catch (error) {
            console.error('Invalid target URL:', targetUrl);
            return '/';
          }
        }
        return '/';
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
      onProxyReq: (proxyReq, req, res) => {
        const targetUrl = req.query.url;
        console.log(`🔄 Generic CORS proxy: ${req.method} ${targetUrl}`);
        
        // Add standard headers (avoiding restricted headers like User-Agent)
        proxyReq.setHeader('Accept', 'application/json, text/html, */*');
        
        // Add original URL header for debugging
        if (targetUrl) {
          proxyReq.setHeader('X-Original-URL', targetUrl);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to all responses
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        proxyRes.headers['Access-Control-Max-Age'] = '86400';
        
        const targetUrl = req.query.url;
        console.log(`✅ CORS proxy response: ${proxyRes.statusCode} for ${targetUrl}`);
      },
      onError: (err, req, res) => {
        const targetUrl = req.query.url;
        console.error(`❌ CORS proxy error for ${targetUrl}:`, err.message);
        res.status(500).json({
          error: 'CORS proxy error',
          message: err.message,
          targetUrl: targetUrl
        });
      },
      logLevel: 'info'
    })
  );

  // Handle preflight OPTIONS requests
  app.options('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');
    res.status(200).end();
  });

  console.log('🌐 CORS proxy middleware configured:');
  console.log('  - /api/hmis-opencommons/* -> https://hmis.opencommons.org/api.php');
  console.log('  - /api/cors-proxy?url=<target> -> <target>');
  console.log('  - Automatic CORS headers added to all responses');
};