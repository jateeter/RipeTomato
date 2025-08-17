/**
 * Unified Individual Data Ownership Model
 * 
 * This model provides a unified approach to individual data ownership through:
 * 1. HAT (Hub of All Things) personal data vaults for secure storage
 * 2. Apple Wallet digital passes for access and identity representation
 * 3. Consistent interfaces across both systems for seamless integration
 * 
 * @license MIT
 */

import { Client } from './Shelter';

// Core unified identity and ownership model
export interface UnifiedDataOwner {
  // Core Identity
  ownerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth: Date;
  
  // Data Ownership Infrastructure
  hatVault: HATVaultConfig;
  walletAccess: WalletAccessConfig;
  
  // Unified Permissions and Consent
  dataPermissions: DataPermissionSet;
  consentRecords: ConsentRecord[];
  
  // Metadata
  createdAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

// HAT Data Vault Configuration
export interface HATVaultConfig {
  hatDomain: string;
  vaultId: string;
  status: 'provisioning' | 'active' | 'suspended' | 'archived';
  credentials?: {
    accessToken: string;
    refreshToken?: string;
    expires?: Date;
  };
  endpoints: HATEndpointConfig[];
  storageQuota: {
    used: number;
    limit: number;
    unit: 'bytes' | 'KB' | 'MB' | 'GB';
  };
}

export interface HATEndpointConfig {
  endpoint: string;
  dataType: UnifiedDataType;
  recordCount: number;
  lastSync: Date;
  permissions: EndpointPermission[];
}

export interface EndpointPermission {
  applicationId: string;
  access: 'read' | 'write' | 'read-write';
  purpose: string;
  expires?: Date;
}

// Apple Wallet Access Configuration
export interface WalletAccessConfig {
  walletId: string;
  passes: UnifiedWalletPass[];
  deviceTokens: string[];
  lastSync: Date;
  status: 'active' | 'suspended' | 'revoked';
}

export interface UnifiedWalletPass {
  passId: string;
  passType: WalletPassType;
  serialNumber: string;
  accessLevel: AccessLevel;
  validFrom: Date;
  validUntil?: Date;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  metadata: PassMetadata;
  linkedData: {
    hatEndpoint?: string;
    dataReferences: string[];
  };
}

export type WalletPassType = 
  | 'shelter_access'
  | 'health_credential' 
  | 'identification'
  | 'service_entitlement'
  | 'emergency_contact';

export type AccessLevel = 
  | 'basic'
  | 'standard' 
  | 'priority'
  | 'emergency'
  | 'staff';

export interface PassMetadata {
  title: string;
  description: string;
  issuer: string;
  category: string;
  services: string[];
  restrictions?: string[];
  emergencyInfo?: EmergencyInfo;
}

export interface EmergencyInfo {
  contacts: EmergencyContact[];
  medicalAlerts: string[];
  accessInstructions: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

// Unified Data Types across HAT and Wallet
export type UnifiedDataType = 
  | 'personal_identity'
  | 'shelter_records'
  | 'health_data'
  | 'communication_logs'
  | 'access_records'
  | 'consent_records'
  | 'emergency_data'
  | 'service_history'
  | 'agent_configuration'
  | 'agent_notifications'
  | 'agent_reminders'
  | 'service_allocations'
  | 'staff_notifications'
  | 'workflow_notifications'
  | 'agent_registry';

// Unified Data Record Model
export interface UnifiedDataRecord<T = any> {
  recordId: string;
  ownerId: string;
  dataType: UnifiedDataType;
  data: T;
  
  // Provenance and Integrity
  source: DataSource;
  integrity: {
    hash: string;
    signature?: string;
    verified: boolean;
  };
  
  // Lifecycle
  createdAt: Date;
  lastUpdated: Date;
  version: number;
  
  // Privacy and Access
  privacyLevel: PrivacyLevel;
  accessLog: AccessLogEntry[];
  
  // Cross-system references
  hatReference?: {
    endpoint: string;
    recordId: string;
  };
  walletReference?: {
    passId: string;
    fieldId?: string;
  };
}

export interface DataSource {
  system: 'hat' | 'wallet' | 'shelter' | 'healthkit' | 'external';
  application: string;
  version: string;
  timestamp: Date;
  operator?: string;
}

export type PrivacyLevel = 'public' | 'shared' | 'private' | 'encrypted' | 'zero_knowledge';

export interface AccessLogEntry {
  timestamp: Date;
  accessor: string;
  action: 'read' | 'write' | 'delete' | 'share';
  purpose: string;
  authorized: boolean;
  ipAddress?: string;
}

// Permissions and Consent Management
export interface DataPermissionSet {
  owner: string;
  permissions: DataPermission[];
  defaultPolicy: PermissionPolicy;
  lastReview: Date;
  nextReview: Date;
}

export interface DataPermission {
  permissionId: string;
  grantee: string; // Application, organization, or individual
  dataTypes: UnifiedDataType[];
  access: AccessRight[];
  purpose: string;
  conditions: PermissionCondition[];
  grantedAt: Date;
  expires?: Date;
  status: 'active' | 'suspended' | 'revoked';
}

export type AccessRight = 'read' | 'write' | 'delete' | 'share' | 'export' | 'monetize';

export interface PermissionCondition {
  type: 'time_limit' | 'usage_limit' | 'location_restriction' | 'purpose_binding';
  value: string;
  metadata?: Record<string, any>;
}

export interface PermissionPolicy {
  defaultAccess: 'deny' | 'prompt' | 'allow';
  requireConsent: boolean;
  auditLevel: 'none' | 'basic' | 'detailed' | 'comprehensive';
  retentionPeriod: number; // days
}

// Consent Management
export interface ConsentRecord {
  consentId: string;
  ownerId: string;
  grantee: string;
  purpose: string;
  dataTypes: UnifiedDataType[];
  consentText: string;
  
  // Legal and Compliance
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  jurisdiction: string;
  language: string;
  
  // Lifecycle
  grantedAt: Date;
  withdrawnAt?: Date;
  expires?: Date;
  renewalRequired: boolean;
  
  // Evidence
  evidence: ConsentEvidence;
  
  status: 'active' | 'withdrawn' | 'expired' | 'renewed';
}

export interface ConsentEvidence {
  method: 'digital_signature' | 'checkbox' | 'voice' | 'written' | 'biometric';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  witnesses?: string[];
  artifacts?: string[]; // File references
}

// Unified Service Interface
export interface UnifiedDataOwnershipService {
  // Core Ownership Management
  createDataOwner(client: Client): Promise<UnifiedDataOwner>;
  getDataOwner(ownerId: string): Promise<UnifiedDataOwner | null>;
  updateDataOwner(ownerId: string, updates: Partial<UnifiedDataOwner>): Promise<boolean>;
  deleteDataOwner(ownerId: string): Promise<boolean>;
  
  // HAT Vault Operations
  provisionHATVault(ownerId: string): Promise<HATVaultConfig>;
  syncHATData(ownerId: string): Promise<boolean>;
  getHATStats(ownerId: string): Promise<HATVaultStats>;
  
  // Wallet Access Operations
  createWalletPass(ownerId: string, passType: WalletPassType, metadata: PassMetadata): Promise<UnifiedWalletPass>;
  updateWalletPass(passId: string, updates: Partial<UnifiedWalletPass>): Promise<boolean>;
  revokeWalletPass(passId: string): Promise<boolean>;
  syncWalletPasses(ownerId: string): Promise<boolean>;
  
  // Data Operations
  storeData<T>(ownerId: string, dataType: UnifiedDataType, data: T): Promise<UnifiedDataRecord<T>>;
  getData<T>(ownerId: string, dataType: UnifiedDataType, filters?: DataFilter): Promise<T[] | null>;
  retrieveData<T>(ownerId: string, dataType: UnifiedDataType, filters?: DataFilter): Promise<UnifiedDataRecord<T>[]>;
  shareData(recordId: string, recipient: string, permissions: DataPermission): Promise<boolean>;
  deleteData(recordId: string): Promise<boolean>;
  
  // Consent and Permissions
  requestConsent(ownerId: string, request: ConsentRequest): Promise<ConsentRecord>;
  grantPermission(ownerId: string, permission: DataPermission): Promise<boolean>;
  revokePermission(permissionId: string): Promise<boolean>;
  auditAccess(ownerId: string, timeRange?: { from: Date; to: Date }): Promise<AccessLogEntry[]>;
  
  // Cross-system Synchronization
  synchronizeOwnerData(ownerId: string): Promise<SynchronizationResult>;
  validateDataIntegrity(ownerId: string): Promise<IntegrityReport>;
  exportOwnerData(ownerId: string, format: 'json' | 'xml' | 'csv'): Promise<string>;
}

// Supporting interfaces
export interface HATVaultStats {
  totalRecords: number;
  recordsByType: Record<UnifiedDataType, number>;
  storageUsed: number;
  lastBackup?: Date;
  syncStatus: 'current' | 'pending' | 'error';
}

export interface DataFilter {
  dateRange?: { from: Date; to: Date };
  source?: DataSource;
  privacyLevel?: PrivacyLevel[];
  limit?: number;
  offset?: number;
}

export interface ConsentRequest {
  requestId: string;
  requester: string;
  purpose: string;
  dataTypes: UnifiedDataType[];
  accessRights: AccessRight[];
  duration?: number; // days
  legalBasis: ConsentRecord['legalBasis'];
}

export interface SynchronizationResult {
  hatSync: { success: boolean; recordsUpdated: number; errors: string[] };
  walletSync: { success: boolean; passesUpdated: number; errors: string[] };
  conflictsResolved: number;
  timestamp: Date;
}

export interface IntegrityReport {
  totalRecords: number;
  validRecords: number;
  corruptedRecords: string[];
  missingReferences: string[];
  hashMismatches: string[];
  recommendedActions: string[];
}

// Utility types for type-safe operations
export interface TypedDataRecord<T extends UnifiedDataType> extends UnifiedDataRecord {
  dataType: T;
  data: DataTypeMap[T];
}

export interface DataTypeMap {
  'personal_identity': PersonalIdentityData;
  'shelter_records': ShelterRecordData;
  'health_data': HealthRecordData;
  'communication_logs': CommunicationData;
  'access_records': AccessRecordData;
  'consent_records': ConsentData;
  'emergency_data': EmergencyData;
  'service_history': ServiceHistoryData;
  'agent_configuration': AgentConfigurationData;
  'agent_notifications': AgentNotificationData;
  'agent_reminders': AgentReminderData;
  'service_allocations': ServiceAllocationData;
  'staff_notifications': StaffNotificationData;
  'workflow_notifications': WorkflowNotificationData;
  'agent_registry': AgentRegistryData;
}

// Specific data type interfaces
export interface PersonalIdentityData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  identificationNumbers?: Record<string, string>;
  addresses?: Address[];
}

export interface Address {
  type: 'home' | 'mailing' | 'temporary' | 'emergency';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  validFrom: Date;
  validUntil?: Date;
}

export interface ShelterRecordData {
  shelterName: string;
  clientId: string;
  bedType: string;
  checkInDate: Date;
  checkOutDate?: Date;
  services: string[];
  restrictions: string[];
  notes?: string;
}

export interface HealthRecordData {
  recordType: 'vitals' | 'medication' | 'allergy' | 'condition' | 'vaccination';
  timestamp: Date;
  provider?: string;
  data: Record<string, any>;
  verified: boolean;
}

export interface CommunicationData {
  type: 'sms' | 'call' | 'email' | 'alert';
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  parties: string[];
  content?: string;
  metadata?: Record<string, any>;
}

export interface AccessRecordData {
  location: string;
  accessType: 'entry' | 'exit' | 'service' | 'resource';
  timestamp: Date;
  method: 'wallet_pass' | 'manual' | 'emergency';
  authorized: boolean;
  duration?: number;
}

export interface ConsentData {
  consentType: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  evidence: ConsentEvidence;
}

export interface EmergencyData {
  alertType: 'medical' | 'safety' | 'missing' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  location?: string;
  contacts: EmergencyContact[];
  instructions: string[];
}

export interface ServiceHistoryData {
  serviceName: string;
  provider: string;
  startDate: Date;
  endDate?: Date;
  outcome?: string;
  notes?: string;
  followUpRequired: boolean;
}

// Agent-related data type interfaces
export interface AgentConfigurationData {
  agentId: string;
  agentType: string;
  configuration: Record<string, any>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentNotificationData {
  notificationId: string;
  agentId: string;
  type: string;
  message: string;
  priority: string;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface AgentReminderData {
  reminderId: string;
  agentId: string;
  type: string;
  title: string;
  description: string;
  scheduledFor: Date;
  status: string;
  metadata?: Record<string, any>;
}

export interface ServiceAllocationData {
  allocationId: string;
  clientId: string;
  serviceType: string;
  status: string;
  allocatedAt: Date;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
}

export interface StaffNotificationData {
  notificationId: string;
  staffId: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  metadata?: Record<string, any>;
}

export interface WorkflowNotificationData {
  notificationId: string;
  workflowId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  triggeredAt: Date;
  processedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AgentRegistryData {
  registryId: string;
  agentId: string;
  clientId: string;
  status: string;
  spawnedAt: Date;
  lastActivity?: Date;
  configuration: Record<string, any>;
  metadata?: Record<string, any>;
}

// Constants and Enums
export const UNIFIED_DATA_TYPES: Record<UnifiedDataType, { name: string; description: string; icon: string }> = {
  'personal_identity': { 
    name: 'Personal Identity', 
    description: 'Basic personal information and identification', 
    icon: '👤' 
  },
  'shelter_records': { 
    name: 'Shelter Records', 
    description: 'Accommodation and shelter service history', 
    icon: '🏠' 
  },
  'health_data': { 
    name: 'Health Data', 
    description: 'Medical information and health records', 
    icon: '🏥' 
  },
  'communication_logs': { 
    name: 'Communication Logs', 
    description: 'Communication history and messages', 
    icon: '📞' 
  },
  'access_records': { 
    name: 'Access Records', 
    description: 'Facility and service access history', 
    icon: '🔐' 
  },
  'consent_records': { 
    name: 'Consent Records', 
    description: 'Data sharing and privacy consents', 
    icon: '✅' 
  },
  'emergency_data': { 
    name: 'Emergency Data', 
    description: 'Emergency contact and critical information', 
    icon: '🚨' 
  },
  'service_history': { 
    name: 'Service History', 
    description: 'History of services received and outcomes', 
    icon: '📋' 
  },
  'agent_configuration': {
    name: 'Agent Configuration',
    description: 'AI agent configuration and settings',
    icon: '⚙️'
  },
  'agent_notifications': {
    name: 'Agent Notifications',
    description: 'Notifications from AI agents',
    icon: '🔔'
  },
  'agent_reminders': {
    name: 'Agent Reminders',
    description: 'Scheduled reminders from AI agents',
    icon: '⏰'
  },
  'service_allocations': {
    name: 'Service Allocations',
    description: 'Allocated services and resources',
    icon: '🎯'
  },
  'staff_notifications': {
    name: 'Staff Notifications',
    description: 'Notifications for staff members',
    icon: '👨‍💼'
  },
  'workflow_notifications': {
    name: 'Workflow Notifications',
    description: 'Automated workflow notifications',
    icon: '🔄'
  },
  'agent_registry': {
    name: 'Agent Registry',
    description: 'Registry of active AI agents',
    icon: '📝'
  }
};

export const PRIVACY_LEVELS: Record<PrivacyLevel, { name: string; description: string; color: string }> = {
  'public': { 
    name: 'Public', 
    description: 'Publicly accessible information', 
    color: 'green' 
  },
  'shared': { 
    name: 'Shared', 
    description: 'Shared with authorized parties', 
    color: 'blue' 
  },
  'private': { 
    name: 'Private', 
    description: 'Private to the individual', 
    color: 'yellow' 
  },
  'encrypted': { 
    name: 'Encrypted', 
    description: 'Encrypted and access controlled', 
    color: 'orange' 
  },
  'zero_knowledge': { 
    name: 'Zero Knowledge', 
    description: 'Zero-knowledge encrypted', 
    color: 'red' 
  }
};