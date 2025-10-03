/**
 * Privacy Module
 *
 * Secure storage and management of private information using:
 * - Solid Pods for decentralized identity
 * - HAT (Hub of All Things) for personal data vaults
 * - PII encryption and secure credential management
 */

// Solid Pod services
export {
  SolidAuthService,
  type SolidAuthConfig,
  type SolidSession
} from './solid/SolidAuthService';

export {
  SolidDataService,
  type HealthRecord,
  type CalendarEvent
} from './solid/SolidDataService';

export {
  SolidPodManager
} from './solid/SolidPodManager';

// HAT services
export {
  HATAuthService,
  type HATAuthConfig,
  type HATAuthResult
} from './hat/HATAuthService';

export {
  HATDataService,
  type HATRecord
} from './hat/HATDataService';

export {
  HATManager
} from './hat/HATManager';

// PII encryption services
export {
  EncryptionService,
  type EncryptionConfig,
  type EncryptedData
} from './pii/EncryptionService';

export {
  SecureStorage
} from './pii/SecureStorage';

export {
  PIIManager,
  type PIIManagerConfig,
  type ClientPIIData
} from './pii/PIIManager';
