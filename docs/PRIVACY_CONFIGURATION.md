# Privacy Configuration Guide

## Overview

Idaho Events implements a privacy-first architecture using decentralized identity (Solid Pods) and personal data vaults (HAT) to ensure client data ownership and portability.

## Architecture Principles

1. **Data Minimization**: Collect only necessary information
2. **Client Ownership**: Clients control their data storage and access
3. **Decentralization**: No central database for personal information
4. **End-to-End Encryption**: PII encrypted before storage
5. **Portability**: Easy data export and migration

---

## Solid Pod Integration

### What is Solid?

Solid (Social Linked Data) is a decentralized web specification that gives individuals control over their data through personal online data stores called Pods.

### Configuration

**File**: `config/solid-config.json`

```json
{
  "solidProvider": {
    "issuer": "https://solidcommunity.net",
    "clientId": "your-app-client-id",
    "clientName": "Idaho Events",
    "redirectUrl": "https://your-app.com/auth/callback",
    "scopes": ["openid", "profile", "offline_access"]
  },
  "podStorage": {
    "baseUrl": "/idaho-events/",
    "dataStructure": {
      "profile": "/profile/card",
      "health": "/health/",
      "services": "/services/",
      "calendar": "/calendar/",
      "documents": "/documents/"
    }
  },
  "authentication": {
    "tokenRefreshInterval": 3600000,
    "sessionTimeout": 86400000,
    "secureStorage": true
  }
}
```

### Environment Variables

```bash
# Solid Configuration
SOLID_PROVIDER_ISSUER=https://solidcommunity.net
SOLID_CLIENT_ID=your-app-client-id
SOLID_REDIRECT_URL=https://your-app.com/auth/callback

# Optional: Custom Pod Provider
SOLID_CUSTOM_PROVIDER=https://your-pod-provider.com
```

### Setting Up Solid Authentication

**1. Register Application**

Register your application with a Solid provider (e.g., solidcommunity.net, inrupt.net):

```typescript
import { SolidAuthService } from '../modules/privacy/solid/SolidAuthService';

const authService = new SolidAuthService({
  issuer: process.env.SOLID_PROVIDER_ISSUER!,
  clientId: process.env.SOLID_CLIENT_ID!,
  redirectUrl: process.env.SOLID_REDIRECT_URL!
});

// Initialize authentication
await authService.initialize();
```

**2. Client Login Flow**

```typescript
// Trigger login
await authService.login();

// Handle callback
const session = await authService.handleRedirectCallback();

// Store session
localStorage.setItem('solid-session', JSON.stringify(session));
```

**3. Access Client Data**

```typescript
import { SolidDataService } from '../modules/privacy/solid/SolidDataService';

const dataService = new SolidDataService(session);

// Read profile data
const profile = await dataService.readProfile();

// Write health data
await dataService.writeHealthRecord({
  date: new Date().toISOString(),
  type: 'checkup',
  provider: 'Shelter Medical',
  notes: 'Annual health screening'
});

// List calendar events
const events = await dataService.listCalendarEvents();
```

---

## HAT (Hub of All Things) Integration

### What is HAT?

HAT is a personal data platform that allows individuals to own and control their data in a personal microserver called a HAT.

### Configuration

**File**: `config/hat-config.json`

```json
{
  "hatProvider": {
    "serviceUrl": "https://dex.hubofallthings.com",
    "namespace": "idaho-events",
    "version": "v2.6"
  },
  "dataSchema": {
    "personalProfile": {
      "namespace": "rumpel",
      "endpoint": "profile"
    },
    "serviceRecords": {
      "namespace": "idaho-events",
      "endpoint": "services"
    },
    "healthRecords": {
      "namespace": "idaho-events",
      "endpoint": "health"
    }
  },
  "authentication": {
    "tokenLifetime": 3600,
    "refreshTokenLifetime": 604800
  }
}
```

### Environment Variables

```bash
# HAT Configuration
HAT_SERVICE_URL=https://dex.hubofallthings.com
HAT_APPLICATION_ID=your-app-id
HAT_APPLICATION_SECRET=your-app-secret
HAT_NAMESPACE=idaho-events

# HAT Provider Settings
HAT_PROVIDER_NAME=hubofallthings
HAT_PROVIDER_URL=https://hatters.hubofallthings.com
```

### Setting Up HAT Authentication

**1. Register Application**

Register your application at https://developers.hubofallthings.com:

```typescript
import { HATAuthService } from '../modules/privacy/hat/HATAuthService';

const hatAuth = new HATAuthService({
  serviceUrl: process.env.HAT_SERVICE_URL!,
  applicationId: process.env.HAT_APPLICATION_ID!,
  applicationSecret: process.env.HAT_APPLICATION_SECRET!,
  namespace: process.env.HAT_NAMESPACE!
});

// Initialize HAT connection
await hatAuth.initialize();
```

**2. Client Authentication**

```typescript
// Authenticate client with HAT
const authResult = await hatAuth.authenticateClient({
  username: clientEmail,
  password: clientPassword
});

// Get access token
const token = authResult.accessToken;

// Store encrypted token
await secureStorage.setItem('hat-token', token);
```

**3. Access Client Data**

```typescript
import { HATDataService } from '../modules/privacy/hat/HATDataService';

const hatData = new HATDataService(token);

// Create data record
await hatData.createRecord('services', {
  serviceType: 'shelter',
  date: new Date().toISOString(),
  location: 'Main Shelter',
  duration: 30
});

// Read data records
const records = await hatData.getRecords('services', {
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Update record
await hatData.updateRecord('services', recordId, {
  status: 'completed'
});
```

---

## PII Encryption & Secure Storage

### Encryption Service

**File**: `src/modules/privacy/pii/EncryptionService.ts`

The encryption service provides end-to-end encryption for sensitive data before storage.

### Configuration

**File**: `config/encryption-config.json`

```json
{
  "encryption": {
    "algorithm": "aes-256-gcm",
    "keyDerivation": "pbkdf2",
    "keyLength": 32,
    "saltLength": 16,
    "iterations": 100000
  },
  "secureStorage": {
    "provider": "browser-crypto",
    "fallback": "memory",
    "persistence": true
  },
  "piiFields": [
    "ssn",
    "dateOfBirth",
    "medicalRecords",
    "address",
    "phoneNumber",
    "email"
  ]
}
```

### Environment Variables

```bash
# Encryption Settings
ENCRYPTION_ALGORITHM=aes-256-gcm
ENCRYPTION_KEY_LENGTH=32
ENCRYPTION_ITERATIONS=100000

# Secure Storage
SECURE_STORAGE_PROVIDER=browser-crypto
SECURE_STORAGE_PERSISTENCE=true
```

### Using Encryption Service

**1. Initialize Encryption**

```typescript
import { EncryptionService } from '../modules/privacy/pii/EncryptionService';

const encryption = new EncryptionService({
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2'
});

await encryption.initialize();
```

**2. Encrypt Sensitive Data**

```typescript
const sensitiveData = {
  ssn: '123-45-6789',
  dateOfBirth: '1980-01-15',
  medicalHistory: ['diabetes', 'hypertension']
};

// Encrypt entire object
const encrypted = await encryption.encryptObject(sensitiveData);

// Result: { data: '...', iv: '...', salt: '...', tag: '...' }
```

**3. Decrypt Data**

```typescript
const decrypted = await encryption.decryptObject(encrypted);

// Result: Original sensitiveData object
```

**4. Field-Level Encryption**

```typescript
// Encrypt single field
const encryptedSSN = await encryption.encryptField('ssn', '123-45-6789');

// Decrypt single field
const decryptedSSN = await encryption.decryptField('ssn', encryptedSSN);
```

### PII Manager

**Using PIIManager for automatic encryption**:

```typescript
import { PIIManager } from '../modules/privacy/pii/PIIManager';

const piiManager = new PIIManager({
  encryptionService: encryption,
  storageProvider: 'solid' // or 'hat'
});

// Store encrypted PII
await piiManager.storeClientData(clientId, {
  ssn: '123-45-6789',
  dateOfBirth: '1980-01-15',
  address: {
    street: '123 Main St',
    city: 'Boise',
    state: 'ID',
    zip: '83702'
  }
});

// Retrieve and decrypt PII
const clientData = await piiManager.retrieveClientData(clientId);
```

---

## Client Data Workflows

### Registration Flow

```typescript
import { ClientRegistrationService } from '../modules/privacy/ClientRegistrationService';

const registration = new ClientRegistrationService({
  solidAuth: solidAuthService,
  hatAuth: hatAuthService,
  piiManager: piiManager
});

// Register new client
const client = await registration.registerClient({
  // Basic info (unencrypted)
  firstName: 'John',
  lastName: 'Doe',
  preferredName: 'John',

  // PII (automatically encrypted)
  dateOfBirth: '1980-01-15',
  ssn: '123-45-6789',

  // Storage preferences
  storageProvider: 'solid', // or 'hat'
  podUrl: 'https://johndoe.solidcommunity.net'
});
```

### Data Access Flow

```typescript
// Case worker requests client data (with permission)
const clientManager = new ClientDataManager({
  piiManager: piiManager,
  permissionService: permissionService
});

// Check permissions
const hasPermission = await clientManager.checkPermission(
  caseWorkerId,
  clientId,
  'read-profile'
);

if (hasPermission) {
  // Access allowed data only
  const profile = await clientManager.getClientProfile(clientId, {
    fields: ['firstName', 'lastName', 'services']
  });
}
```

### Data Export Flow

```typescript
// Client requests data export
const exportService = new DataExportService({
  solidData: solidDataService,
  hatData: hatDataService
});

// Export all client data
const exportedData = await exportService.exportClientData(clientId, {
  format: 'json', // or 'csv', 'pdf'
  includeHistory: true,
  encryptExport: true
});

// Download export
await exportService.downloadExport(exportedData, 'my-data-export.json');
```

---

## Privacy-First Development Patterns

### 1. Minimize Data Collection

```typescript
// BAD: Collecting unnecessary data
const client = {
  name: 'John Doe',
  ssn: '123-45-6789',
  mothersMaidenName: 'Smith', // Not needed
  bankAccount: '...' // Not needed
};

// GOOD: Collect only what's needed
const client = {
  name: 'John Doe',
  ssn: '123-45-6789' // Required for HMIS
};
```

### 2. Encrypt Before Storage

```typescript
// BAD: Storing plaintext PII
await storage.save('client-data', {
  ssn: '123-45-6789'
});

// GOOD: Encrypt before storage
const encrypted = await encryption.encryptObject({
  ssn: '123-45-6789'
});
await storage.save('client-data', encrypted);
```

### 3. Implement Access Controls

```typescript
// BAD: No permission checks
function getClientSSN(clientId) {
  return database.query('SELECT ssn FROM clients WHERE id = ?', [clientId]);
}

// GOOD: Permission-based access
async function getClientSSN(caseWorkerId, clientId) {
  const hasPermission = await permissions.check(
    caseWorkerId,
    clientId,
    'read-ssn'
  );

  if (!hasPermission) {
    throw new Error('Access denied');
  }

  const encrypted = await storage.get(`client-${clientId}-ssn`);
  return await encryption.decrypt(encrypted);
}
```

### 4. Audit Sensitive Access

```typescript
// Log all PII access
await auditLog.record({
  timestamp: new Date().toISOString(),
  actor: caseWorkerId,
  action: 'read-ssn',
  subject: clientId,
  result: 'success'
});
```

---

## Testing Privacy Features

### Unit Tests

```typescript
describe('EncryptionService', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const encryption = new EncryptionService();
    const data = { ssn: '123-45-6789' };

    const encrypted = await encryption.encryptObject(data);
    expect(encrypted.data).not.toEqual(data.ssn);

    const decrypted = await encryption.decryptObject(encrypted);
    expect(decrypted.ssn).toEqual(data.ssn);
  });
});
```

### Integration Tests

```typescript
describe('Solid Pod Integration', () => {
  it('should store and retrieve encrypted data from Pod', async () => {
    const solidData = new SolidDataService(session);
    const piiManager = new PIIManager({ storageProvider: 'solid' });

    await piiManager.storeClientData('client-123', {
      ssn: '123-45-6789'
    });

    const retrieved = await piiManager.retrieveClientData('client-123');
    expect(retrieved.ssn).toEqual('123-45-6789');
  });
});
```

---

## Troubleshooting

### Common Issues

**1. Solid Pod Authentication Fails**
- Verify `SOLID_CLIENT_ID` is correct
- Check redirect URL matches registered URL exactly
- Ensure Pod provider is accessible

**2. HAT Token Expired**
- Implement token refresh logic
- Check `tokenLifetime` configuration
- Verify system time is synchronized

**3. Encryption/Decryption Errors**
- Verify encryption key is consistent
- Check salt and IV are stored with encrypted data
- Ensure algorithm matches between encryption/decryption

**4. Permission Denied Errors**
- Verify Pod/HAT access control lists (ACL)
- Check client granted necessary permissions
- Review permission service configuration

---

## Security Best Practices

1. **Never Log Sensitive Data**: Don't log PII, tokens, or encryption keys
2. **Use HTTPS**: Always use TLS for data transmission
3. **Rotate Keys**: Implement key rotation for encryption keys
4. **Audit Access**: Log all access to sensitive data
5. **Minimal Permissions**: Grant least privilege necessary
6. **Secure Key Storage**: Never hardcode keys in source code
7. **Regular Security Reviews**: Audit privacy implementations regularly
8. **Client Consent**: Always obtain explicit consent for data collection

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Agent Configuration](./AGENT_CONFIGURATION.md)
- [Client Configuration](./CLIENT_CONFIGURATION.md)
- [Mobile Optimization](./MOBILE_OPTIMIZATION.md)
