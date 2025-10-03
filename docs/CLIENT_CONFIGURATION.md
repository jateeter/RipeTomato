# Client Configuration Guide

## Overview

The Idaho Events client module provides mobile-optimized interfaces for shelter clients accessing services on low-cost devices with limited bandwidth.

## Design Principles

1. **Mobile-First**: Optimized for small screens and touch interaction
2. **Offline-First**: Full functionality without internet connection
3. **Low-Bandwidth**: Minimal data transfer and efficient caching
4. **Accessibility**: Large touch targets, high contrast, simple navigation
5. **Progressive Web App**: Installable, app-like experience

---

## Architecture

### Client Module Structure

```
src/modules/client/
├── mobile/              # Mobile-optimized components
│   ├── MobileClientDashboard.tsx
│   ├── MobileBedStatus.tsx
│   ├── MobileServiceAccess.tsx
│   ├── MobileProfile.tsx
│   └── MobileCalendar.tsx
├── components/          # Reusable UI components
│   ├── SimpleCard.tsx
│   ├── TouchButton.tsx
│   ├── StatusIndicator.tsx
│   └── LoadingSpinner.tsx
└── services/           # Client-specific services
    ├── ClientDataService.ts
    ├── OfflineStorageService.ts
    └── SyncService.ts
```

---

## Configuration Files

### 1. Client Application Config

**File**: `config/client-config.json`

```json
{
  "application": {
    "name": "Idaho Events Client",
    "shortName": "IE Client",
    "description": "Shelter services access for clients",
    "version": "1.0.0",
    "theme": {
      "primaryColor": "#2563eb",
      "accentColor": "#10b981",
      "backgroundColor": "#ffffff",
      "textColor": "#1f2937"
    }
  },
  "mobile": {
    "minTouchTargetSize": 48,
    "fontSize": {
      "base": 18,
      "heading": 24,
      "large": 32
    },
    "spacing": {
      "base": 16,
      "large": 24
    }
  },
  "offline": {
    "enabled": true,
    "storageQuota": 52428800,
    "cacheStrategy": "network-first",
    "syncInterval": 300000
  },
  "performance": {
    "lazyLoadImages": true,
    "imageQuality": 0.7,
    "maxImageSize": 500000,
    "prefetchPages": ["dashboard", "services"]
  },
  "features": {
    "bedStatus": true,
    "serviceAccess": true,
    "calendar": true,
    "profile": true,
    "notifications": true
  }
}
```

### 2. PWA Configuration

**File**: `public/manifest.json`

```json
{
  "name": "Idaho Events Client",
  "short_name": "IE Client",
  "description": "Access shelter services and manage your account",
  "start_url": "/client",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. Service Worker Configuration

**File**: `src/serviceWorkerConfig.ts`

```typescript
export const serviceWorkerConfig = {
  cacheName: 'idaho-events-client-v1',
  cacheStrategy: {
    pages: 'network-first',
    api: 'network-first',
    images: 'cache-first',
    static: 'cache-first'
  },
  offlinePages: [
    '/client/dashboard',
    '/client/services',
    '/client/calendar',
    '/client/profile'
  ],
  apiEndpoints: [
    '/api/client/profile',
    '/api/client/services',
    '/api/client/calendar'
  ],
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  syncInterval: 5 * 60 * 1000 // 5 minutes
};
```

---

## Environment Variables

### Required Variables

```bash
# Client App Configuration
CLIENT_APP_NAME="Idaho Events Client"
CLIENT_BASE_URL=/client
CLIENT_API_BASE_URL=https://api.idaho-events.org

# Offline Storage
CLIENT_OFFLINE_ENABLED=true
CLIENT_STORAGE_QUOTA=52428800
CLIENT_SYNC_INTERVAL=300000

# Performance
CLIENT_LAZY_LOAD_IMAGES=true
CLIENT_IMAGE_QUALITY=0.7
CLIENT_MAX_IMAGE_SIZE=500000

# Features
CLIENT_FEATURE_BED_STATUS=true
CLIENT_FEATURE_SERVICES=true
CLIENT_FEATURE_CALENDAR=true
CLIENT_FEATURE_NOTIFICATIONS=true
```

### Optional Variables

```bash
# PWA Settings
CLIENT_PWA_ENABLED=true
CLIENT_PWA_THEME_COLOR=#2563eb
CLIENT_PWA_BACKGROUND_COLOR=#ffffff

# Analytics (Optional)
CLIENT_ANALYTICS_ENABLED=false
CLIENT_ANALYTICS_ID=

# Error Tracking (Optional)
CLIENT_ERROR_TRACKING_ENABLED=false
CLIENT_SENTRY_DSN=
```

---

## Mobile Dashboard Setup

### Creating the Mobile Dashboard

**File**: `src/modules/client/mobile/MobileClientDashboard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { SimpleCard } from '../components/SimpleCard';
import { TouchButton } from '../components/TouchButton';
import { StatusIndicator } from '../components/StatusIndicator';
import { ClientDataService } from '../services/ClientDataService';

interface DashboardData {
  bedStatus: 'available' | 'occupied' | 'pending';
  upcomingServices: Service[];
  notifications: Notification[];
}

export const MobileClientDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    loadDashboardData();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const clientService = new ClientDataService();
      const dashboardData = await clientService.getDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnline = () => {
    setOffline(false);
    // Sync data when back online
    syncOfflineData();
  };

  const handleOffline = () => {
    setOffline(true);
  };

  const syncOfflineData = async () => {
    const clientService = new ClientDataService();
    await clientService.syncOfflineChanges();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mobile-dashboard p-4 min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      {offline && (
        <div className="offline-banner bg-yellow-100 text-yellow-800 p-4 mb-4 rounded-lg">
          <p className="text-lg font-semibold">Offline Mode</p>
          <p className="text-base">Changes will sync when you're back online</p>
        </div>
      )}

      {/* Welcome Header */}
      <div className="welcome-header mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-lg text-gray-600 mt-2">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Bed Status Card */}
      <SimpleCard className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Bed Status</h2>
            <p className="text-base text-gray-600 mt-1">
              {data?.bedStatus === 'available' && 'Bed available for tonight'}
              {data?.bedStatus === 'occupied' && 'Bed reserved for tonight'}
              {data?.bedStatus === 'pending' && 'Reservation pending'}
            </p>
          </div>
          <StatusIndicator
            status={data?.bedStatus || 'pending'}
            size="large"
          />
        </div>
        <TouchButton
          className="mt-4 w-full"
          variant="primary"
          onClick={() => navigate('/client/bed-status')}
        >
          Manage Bed Reservation
        </TouchButton>
      </SimpleCard>

      {/* Upcoming Services */}
      <SimpleCard className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upcoming Services
        </h2>
        {data?.upcomingServices.length === 0 ? (
          <p className="text-base text-gray-600">No upcoming services</p>
        ) : (
          <div className="space-y-3">
            {data?.upcomingServices.map(service => (
              <div
                key={service.id}
                className="service-item p-4 bg-blue-50 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {service.name}
                </h3>
                <p className="text-base text-gray-600 mt-1">
                  {service.date} at {service.time}
                </p>
              </div>
            ))}
          </div>
        )}
        <TouchButton
          className="mt-4 w-full"
          variant="secondary"
          onClick={() => navigate('/client/services')}
        >
          View All Services
        </TouchButton>
      </SimpleCard>

      {/* Quick Actions */}
      <SimpleCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <TouchButton
            variant="outline"
            onClick={() => navigate('/client/calendar')}
          >
            📅 Calendar
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => navigate('/client/profile')}
          >
            👤 Profile
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => navigate('/client/services')}
          >
            🏥 Services
          </TouchButton>
          <TouchButton
            variant="outline"
            onClick={() => navigate('/client/help')}
          >
            ❓ Help
          </TouchButton>
        </div>
      </SimpleCard>
    </div>
  );
};
```

---

## Reusable Components

### SimpleCard Component

**File**: `src/modules/client/components/SimpleCard.tsx`

```typescript
import React from 'react';

interface SimpleCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SimpleCard: React.FC<SimpleCardProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`
      bg-white
      rounded-lg
      shadow-md
      p-6
      ${className}
    `}>
      {children}
    </div>
  );
};
```

### TouchButton Component

**File**: `src/modules/client/components/TouchButton.tsx`

```typescript
import React from 'react';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  disabled?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false
}) => {
  const baseStyles = `
    min-h-[48px]
    px-6
    py-3
    rounded-lg
    font-semibold
    text-lg
    transition-colors
    active:scale-95
    disabled:opacity-50
    disabled:cursor-not-allowed
  `;

  const variantStyles = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-gray-600 text-white active:bg-gray-700',
    outline: 'bg-white border-2 border-gray-300 text-gray-800 active:bg-gray-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
```

### StatusIndicator Component

**File**: `src/modules/client/components/StatusIndicator.tsx`

```typescript
import React from 'react';

interface StatusIndicatorProps {
  status: 'available' | 'occupied' | 'pending' | 'unavailable';
  size?: 'small' | 'medium' | 'large';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const statusConfig = {
    available: { color: 'bg-green-500', label: '✓' },
    occupied: { color: 'bg-blue-500', label: '●' },
    pending: { color: 'bg-yellow-500', label: '...' },
    unavailable: { color: 'bg-red-500', label: '✗' }
  };

  const config = statusConfig[status];

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${config.color}
        rounded-full
        flex
        items-center
        justify-center
        text-white
        font-bold
        text-xl
      `}
    >
      {config.label}
    </div>
  );
};
```

---

## Client Services

### ClientDataService

**File**: `src/modules/client/services/ClientDataService.ts`

```typescript
import { OfflineStorageService } from './OfflineStorageService';
import { SyncService } from './SyncService';

export class ClientDataService {
  private offlineStorage: OfflineStorageService;
  private syncService: SyncService;

  constructor() {
    this.offlineStorage = new OfflineStorageService();
    this.syncService = new SyncService();
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      // Try to fetch from network first
      if (navigator.onLine) {
        const response = await fetch('/api/client/dashboard');
        const data = await response.json();

        // Cache for offline use
        await this.offlineStorage.set('dashboard-data', data);

        return data;
      } else {
        // Fall back to cached data
        const cached = await this.offlineStorage.get('dashboard-data');
        if (!cached) {
          throw new Error('No offline data available');
        }
        return cached;
      }
    } catch (error) {
      // Fall back to cached data on error
      const cached = await this.offlineStorage.get('dashboard-data');
      if (cached) {
        return cached;
      }
      throw error;
    }
  }

  async updateBedReservation(status: 'reserve' | 'cancel'): Promise<void> {
    const update = {
      action: status,
      timestamp: new Date().toISOString()
    };

    if (navigator.onLine) {
      // Send to server immediately
      await fetch('/api/client/bed-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
    } else {
      // Queue for sync when online
      await this.syncService.queueUpdate('bed-reservation', update);
    }
  }

  async syncOfflineChanges(): Promise<void> {
    await this.syncService.syncPendingUpdates();
  }
}
```

### OfflineStorageService

**File**: `src/modules/client/services/OfflineStorageService.ts`

```typescript
export class OfflineStorageService {
  private dbName = 'idaho-events-client';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { autoIncrement: true });
        }
      };
    });
  }

  async get(key: string): Promise<any> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
```

---

## Performance Optimization

### 1. Code Splitting

```typescript
// Use lazy loading for non-critical pages
const MobileBedStatus = React.lazy(() =>
  import('./mobile/MobileBedStatus')
);
const MobileServiceAccess = React.lazy(() =>
  import('./mobile/MobileServiceAccess')
);

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/client/bed-status" component={MobileBedStatus} />
  <Route path="/client/services" component={MobileServiceAccess} />
</Suspense>
```

### 2. Image Optimization

```typescript
// Lazy load images
const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} src={imageSrc || ''} alt={alt} />;
};
```

### 3. Virtual Scrolling

```typescript
// Use virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

const ServiceList: React.FC<{ services: Service[] }> = ({ services }) => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <ServiceCard service={services[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={services.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

---

## Testing Client Features

### Unit Tests

```typescript
describe('MobileClientDashboard', () => {
  it('should render dashboard with data', async () => {
    const { getByText } = render(<MobileClientDashboard />);

    await waitFor(() => {
      expect(getByText('Welcome Back!')).toBeInTheDocument();
    });
  });

  it('should show offline indicator when offline', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const { getByText } = render(<MobileClientDashboard />);
    expect(getByText('Offline Mode')).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
describe('Client Dashboard E2E', () => {
  it('should navigate through client features', () => {
    cy.visit('/client/dashboard');

    // Check dashboard loads
    cy.contains('Welcome Back!').should('be.visible');

    // Navigate to bed status
    cy.contains('Manage Bed Reservation').click();
    cy.url().should('include', '/client/bed-status');

    // Reserve bed
    cy.contains('Reserve Bed').click();
    cy.contains('Bed reserved successfully').should('be.visible');
  });

  it('should work offline', () => {
    cy.visit('/client/dashboard');

    // Go offline
    cy.window().then(win => {
      win.dispatchEvent(new Event('offline'));
    });

    // Check offline indicator
    cy.contains('Offline Mode').should('be.visible');

    // Try to navigate (should use cached data)
    cy.contains('View All Services').click();
    cy.contains('Services').should('be.visible');
  });
});
```

---

## Deployment Checklist

- [ ] Generate PWA icons (72x72, 96x96, 128x128, 144x144, 192x192, 512x512)
- [ ] Configure manifest.json with correct URLs
- [ ] Register service worker
- [ ] Test offline functionality
- [ ] Test on low-bandwidth connection (throttle to 3G)
- [ ] Test on actual low-cost devices (Android Go, budget phones)
- [ ] Verify touch targets are at least 48x48 pixels
- [ ] Test with screen readers
- [ ] Verify color contrast ratios meet WCAG AA standards
- [ ] Test PWA installation on iOS and Android
- [ ] Configure HTTPS for production
- [ ] Set up analytics (if enabled)
- [ ] Configure error tracking (if enabled)

---

## Troubleshooting

### Common Issues

**1. PWA Not Installing**
- Check manifest.json is accessible
- Verify all required icons exist
- Ensure HTTPS is enabled
- Check service worker registration

**2. Offline Mode Not Working**
- Verify service worker is registered
- Check IndexedDB is available
- Review cache strategy configuration
- Test online/offline event listeners

**3. Poor Performance on Low-End Devices**
- Enable code splitting
- Reduce image quality
- Implement virtual scrolling
- Minimize JavaScript bundle size

**4. Touch Targets Too Small**
- Verify minimum 48x48 pixels
- Increase padding around buttons
- Test on actual mobile devices

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Agent Configuration](./AGENT_CONFIGURATION.md)
- [Privacy Configuration](./PRIVACY_CONFIGURATION.md)
- [Mobile Optimization](./MOBILE_OPTIMIZATION.md)
