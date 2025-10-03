export const serviceWorkerConfig = {
  cacheName: 'idaho-events-v1',
  cacheStrategy: {
    pages: 'network-first',
    api: 'network-first',
    images: 'cache-first',
    static: 'cache-first'
  },
  offlinePages: [
    '/',
    '/index.html'
  ],
  apiEndpoints: [
    '/api/client/dashboard',
    '/api/client/profile',
    '/api/client/services',
    '/api/client/calendar'
  ],
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  syncInterval: 5 * 60 * 1000 // 5 minutes
};
