# Idaho Events Architecture Documentation

## Overview

Idaho Events is a privacy-first, mobile-optimized shelter management system with multi-language agent support and secure personal data storage.

## System Architecture

### Core Modules

```
src/
├── modules/
│   ├── agents/          # Multi-language agent operations
│   ├── privacy/         # Private information storage (Solid/HAT)
│   ├── client/          # Client-facing mobile interfaces
│   └── shared/          # Shared utilities and types
├── components/          # Legacy UI components (to be migrated)
├── services/           # Legacy services (to be migrated)
└── config/             # Application configuration
```

## Module Breakdown

### 1. Agents Module (`src/modules/agents/`)

**Purpose**: Multi-language agent operations and bot management

**Structure**:
```
agents/
├── core/              # Core agent functionality
│   ├── AgentManager.ts
│   ├── BotLabCore.ts
│   └── AgentRegistry.ts
├── runtime/           # Multi-language runtime
│   ├── RuntimeManager.ts
│   ├── JavaScriptRuntime.ts
│   └── PythonRuntime.ts
└── python/           # Python agent implementations
    ├── base_agent.py
    ├── weather_monitoring_agent.py
    └── analytics_agent.py
```

**Key Features**:
- JavaScript/TypeScript and Python agent support
- Cross-language messaging protocol
- Agent lifecycle management
- Resource monitoring and health checks

**Configuration**:
- See `docs/AGENT_CONFIGURATION.md`

---

### 2. Privacy Module (`src/modules/privacy/`)

**Purpose**: Secure storage and management of private information

**Structure**:
```
privacy/
├── solid/             # Solid Pod integration
│   ├── SolidAuthService.ts
│   ├── SolidDataService.ts
│   └── SolidPodManager.ts
├── hat/              # HAT (Hub of All Things) integration
│   ├── HATAuthService.ts
│   ├── HATDataService.ts
│   └── HATManager.ts
└── pii/              # PII credential management
    ├── PIIManager.ts
    ├── SecureStorage.ts
    └── EncryptionService.ts
```

**Key Features**:
- Decentralized identity with Solid Pods
- Personal data vaults with HAT
- PII encryption and secure credential storage
- Client data ownership and portability

**Configuration**:
- See `docs/PRIVACY_CONFIGURATION.md`

---

### 3. Client Module (`src/modules/client/`)

**Purpose**: Mobile-optimized client interfaces for low-cost devices

**Structure**:
```
client/
├── mobile/           # Mobile-first components
│   ├── MobileClientDashboard.tsx
│   ├── MobileBedStatus.tsx
│   ├── MobileServiceAccess.tsx
│   └── MobileProfile.tsx
├── components/       # Reusable client components
│   ├── SimpleCard.tsx
│   ├── TouchButton.tsx
│   └── StatusIndicator.tsx
└── services/        # Client-specific services
    ├── ClientDataService.ts
    └── OfflineStorageService.ts
```

**Key Features**:
- Optimized for low-bandwidth connections
- Offline-first architecture
- Touch-friendly large UI elements
- Minimal resource usage
- Progressive Web App (PWA) support

**Configuration**:
- See `docs/CLIENT_CONFIGURATION.md`

---

### 4. Shared Module (`src/modules/shared/`)

**Purpose**: Common utilities, types, and services used across modules

**Structure**:
```
shared/
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── hooks/           # React hooks
└── constants/       # Application constants
```

---

## Data Flow

### Client Interaction Flow

```
Mobile Client
    ↓
Client Dashboard (PWA)
    ↓
Client Services Layer
    ↓
Privacy Layer (Solid/HAT) ← → Agent System
    ↓
External Services (HMIS, Calendar, etc.)
```

### Agent Communication Flow

```
JavaScript Agent ← → Multi-Language Runtime ← → Python Agent
                           ↓
                    Message Bus/Event System
                           ↓
                    Service Integration Layer
```

### Privacy Data Flow

```
Client Input
    ↓
PII Manager (Encryption)
    ↓
Storage Provider (Solid Pod or HAT)
    ↓
Decentralized Storage
```

---

## Key Technologies

### Frontend
- React 19.1.0 with TypeScript
- Tailwind CSS for responsive design
- PWA capabilities for offline support

### Privacy & Identity
- Solid Protocol (Inrupt SDK)
- HAT (Dataswift)
- Client-side encryption

### Agent System
- Node.js runtime for JavaScript agents
- Python 3.9+ for Python agents
- JSON-based cross-language messaging

### Testing
- Jest for unit tests
- Cypress for E2E tests
- React Testing Library for component tests

---

## Performance Considerations

### Mobile Optimization
- Code splitting for minimal initial load
- Lazy loading of non-critical features
- Service Worker for offline caching
- Image optimization and lazy loading
- Virtual scrolling for large lists

### Low-Bandwidth Support
- Delta sync for data updates
- Compressed API responses
- Optimistic UI updates
- Background sync when online

---

## Security Architecture

### Data Protection Layers

1. **Transport Layer**: HTTPS/TLS for all communications
2. **Application Layer**: Client-side encryption before storage
3. **Storage Layer**: Decentralized storage (Solid/HAT)
4. **Access Control**: Role-based permissions

### Privacy Principles

- **Data Minimization**: Collect only necessary data
- **Client Ownership**: Clients control their data
- **Decentralization**: No central data store
- **Encryption**: End-to-end encryption for PII
- **Portability**: Easy data export/migration

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Mobile Clients (PWA)            │
│  (Low-cost Android/iOS devices)         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         React Application               │
│  (Served via CDN/Static Hosting)        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         CORS Proxy Server               │
│  (Node.js Express - Optional)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         External Services               │
│  HMIS | Solid Pods | HAT | Calendar     │
└─────────────────────────────────────────┘
```

---

## Migration Path

### Phase 1: Module Creation ✓
- Create modular directory structure
- Document architecture

### Phase 2: Service Migration
- Move agent services to `modules/agents/`
- Move privacy services to `modules/privacy/`
- Update imports

### Phase 3: Component Refactoring
- Create mobile-first client dashboard
- Migrate reusable components to modules
- Remove duplicate code

### Phase 4: Testing & Optimization
- Update tests for new structure
- Performance optimization
- Mobile device testing

---

## Getting Started

### For Developers

1. Review module-specific documentation in `/docs`
2. Follow configuration guides for each subsystem
3. Use module structure for new features
4. Maintain separation of concerns

### For Contributors

1. Read `CONTRIBUTING.md`
2. Follow the established module patterns
3. Write tests for new functionality
4. Document configuration changes

---

## Related Documentation

- [Agent Configuration](./AGENT_CONFIGURATION.md)
- [Privacy Configuration](./PRIVACY_CONFIGURATION.md)
- [Client Configuration](./CLIENT_CONFIGURATION.md)
- [API Reference](./API_REFERENCE.md)
- [Mobile Optimization](./MOBILE_OPTIMIZATION.md)
