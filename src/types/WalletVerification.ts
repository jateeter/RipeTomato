/**
 * Wallet-Based Identity Verification Types
 * 
 * Types for QR code-based identity verification using unified data ownership model
 * supporting Solid Pod, Dataswift HAT, and Apple Wallet verification methods.
 * 
 * @license MIT
 */

import { UnifiedDataOwner, UnifiedWalletPass, WalletPassType } from './UnifiedDataOwnership';

// QR Code Verification System
export interface QRVerificationCode {
  codeId: string;
  ownerId: string;
  verificationMethod: VerificationMethod;
  qrData: QRCodeData;
  expiresAt: Date;
  usageCount: number;
  maxUsages: number;
  status: 'active' | 'used' | 'expired' | 'revoked';
  metadata: QRMetadata;
  createdAt: Date;
}

export type VerificationMethod = 'apple_wallet' | 'solid_pod' | 'dataswift_hat' | 'unified_multi';

export interface QRCodeData {
  // Standard QR payload
  version: string;
  type: 'identity_verification' | 'check_in' | 'access_control';
  ownerId: string;
  timestamp: number;
  
  // Verification data
  verificationPayload: VerificationPayload;
  
  // Security
  signature: string;
  nonce: string;
  checksum: string;
}

export interface VerificationPayload {
  // Multi-wallet references
  walletReferences: WalletReference[];
  
  // Identity claims
  identityClaims: IdentityClaim[];
  
  // Access permissions
  accessLevel: 'basic' | 'standard' | 'priority' | 'emergency';
  
  // Verification requirements
  requiredVerifications: VerificationRequirement[];
}

export interface WalletReference {
  walletType: 'apple_wallet' | 'solid_pod' | 'dataswift_hat';
  walletId: string;
  passId?: string; // For Apple Wallet passes
  podUrl?: string; // For Solid Pods
  hatDomain?: string; // For Dataswift HATs
  credentialHash: string;
  lastSync: Date;
}

export interface IdentityClaim {
  claimType: 'name' | 'dob' | 'client_id' | 'shelter_id' | 'health_status' | 'emergency_contact';
  claimValue: string;
  verifiedBy: VerificationMethod[];
  confidenceLevel: 'low' | 'medium' | 'high' | 'verified';
  lastVerified: Date;
}

export interface VerificationRequirement {
  requirementType: 'identity_match' | 'wallet_signature' | 'biometric' | 'pin' | 'multi_factor';
  required: boolean;
  weight: number; // For weighted verification scoring
  description: string;
}

export interface QRMetadata {
  generatedFor: string; // Purpose of QR code
  location?: string;
  deviceInfo?: string;
  networkInfo?: string;
  associatedServices: string[];
}

// Check-in Workflow Types
export interface WalletCheckInSession {
  sessionId: string;
  ownerId: string;
  bedReservationId?: string;
  qrCode: QRVerificationCode;
  
  // Verification process
  verificationSteps: VerificationStep[];
  currentStep: number;
  overallStatus: CheckInStatus;
  
  // Multi-wallet verification results
  walletVerifications: WalletVerificationResult[];
  finalVerification: FinalVerificationResult;
  
  // Session data
  startedAt: Date;
  completedAt?: Date;
  staffId?: string;
  location: string;
  
  // Additional data
  healthScreening?: HealthScreeningData;
  emergencyContacts?: EmergencyContactData[];
  specialRequirements?: string[];
}

export interface VerificationStep {
  stepId: string;
  stepType: 'qr_scan' | 'wallet_verify' | 'identity_match' | 'health_screen' | 'access_grant';
  stepName: string;
  description: string;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  verificationData?: any;
  errorMessage?: string;
}

export type CheckInStatus = 
  | 'initiated'
  | 'qr_scanned' 
  | 'verifying_identity'
  | 'identity_verified'
  | 'health_screening'
  | 'access_granted'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WalletVerificationResult {
  walletType: VerificationMethod;
  walletId: string;
  verificationStatus: 'success' | 'failed' | 'partial' | 'unavailable';
  verifiedClaims: IdentityClaim[];
  confidence: number; // 0-100
  verificationTime: number; // milliseconds
  errorDetails?: string;
  additionalData?: Record<string, any>;
}

export interface FinalVerificationResult {
  overallStatus: 'verified' | 'failed' | 'partial';
  confidenceScore: number; // 0-100
  verificationMethods: VerificationMethod[];
  verifiedIdentity: VerifiedIdentity;
  accessPermissions: AccessPermission[];
  recommendations: string[];
  securityFlags: SecurityFlag[];
}

export interface VerifiedIdentity {
  ownerId: string;
  fullName: string;
  clientId: string;
  verificationLevel: 'low' | 'medium' | 'high' | 'maximum';
  verificationSources: VerificationMethod[];
  identityScore: number; // 0-100
  lastVerified: Date;
}

export interface AccessPermission {
  permissionType: 'bed_access' | 'service_access' | 'facility_access' | 'emergency_access';
  granted: boolean;
  restrictions?: string[];
  validUntil?: Date;
  grantedBy: string;
}

export interface SecurityFlag {
  flagType: 'duplicate_identity' | 'expired_credentials' | 'suspicious_activity' | 'verification_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
  flaggedAt: Date;
}

// Health and Emergency Data
export interface HealthScreeningData {
  temperature?: number;
  symptoms: string[];
  medicalAlerts: string[];
  medications: string[];
  emergencyInstructions?: string;
  screenedBy: string;
  screenedAt: Date;
  cleared: boolean;
  notes?: string;
}

export interface EmergencyContactData {
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  verified: boolean;
  lastContacted?: Date;
  accessLevel: 'basic' | 'full' | 'emergency_only';
}

// Management Perspective Types
export interface ManagementVerificationDashboard {
  activeSessions: WalletCheckInSession[];
  pendingVerifications: PendingVerification[];
  recentCompletions: CompletedVerification[];
  securityAlerts: SecurityAlert[];
  systemStats: VerificationSystemStats;
}

export interface PendingVerification {
  sessionId: string;
  ownerId: string;
  clientName: string;
  qrCodeId: string;
  waitingTime: number; // minutes
  currentStep: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  assignedStaff?: string;
  location: string;
}

export interface CompletedVerification {
  sessionId: string;
  ownerId: string;
  clientName: string;
  verificationResult: 'success' | 'failed';
  completionTime: number; // minutes
  verificationMethods: VerificationMethod[];
  confidenceScore: number;
  completedAt: Date;
  staffId: string;
}

export interface SecurityAlert {
  alertId: string;
  alertType: 'failed_verification' | 'duplicate_attempt' | 'suspicious_qr' | 'expired_credentials' | 'system_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  relatedSession?: string;
  ownerId?: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedBy?: string;
  resolution?: string;
}

export interface VerificationSystemStats {
  todayVerifications: number;
  successRate: number;
  averageVerificationTime: number; // minutes
  walletMethodStats: {
    appleWallet: { count: number; successRate: number };
    solidPod: { count: number; successRate: number };
    dataswiftHat: { count: number; successRate: number };
    unified: { count: number; successRate: number };
  };
  securityMetrics: {
    falsePositives: number;
    falseNegatives: number;
    flaggedSessions: number;
    blockedAttempts: number;
  };
}

// Client Perspective Types
export interface ClientVerificationInterface {
  ownerId: string;
  availableWallets: ClientWalletOption[];
  selectedWallet?: ClientWalletOption;
  qrCode?: QRVerificationCode;
  verificationInstructions: VerificationInstruction[];
  currentStatus: ClientVerificationStatus;
  sessionData?: WalletCheckInSession;
}

export interface ClientWalletOption {
  walletType: VerificationMethod;
  walletName: string;
  walletId: string;
  isAvailable: boolean;
  lastSync?: Date;
  credentialStatus: 'valid' | 'expired' | 'needs_update' | 'unavailable';
  icon: string;
  description: string;
  verificationCapabilities: string[];
}

export interface VerificationInstruction {
  stepNumber: number;
  instruction: string;
  action?: 'scan_qr' | 'open_wallet' | 'show_screen' | 'wait' | 'follow_staff';
  expectedDuration: number; // seconds
  icon?: string;
  isCompleted: boolean;
}

export type ClientVerificationStatus = 
  | 'wallet_selection'
  | 'generating_qr'
  | 'ready_to_scan'
  | 'verification_in_progress'
  | 'waiting_for_staff'
  | 'verification_complete'
  | 'verification_failed'
  | 'session_expired';

// Notification Agent Types
export interface ShelterSchedulingAgent {
  agentId: string;
  agentName: string;
  isActive: boolean;
  monitoredEvents: SchedulingEventType[];
  notificationChannels: NotificationChannel[];
  configuration: AgentConfiguration;
  stats: AgentStats;
}

export type SchedulingEventType = 
  | 'bed_reservation_created'
  | 'bed_reservation_cancelled'
  | 'check_in_due'
  | 'check_in_overdue'
  | 'no_show_detected'
  | 'bed_availability_low'
  | 'waiting_list_updated'
  | 'emergency_bed_needed'
  | 'maintenance_scheduled'
  | 'staff_schedule_change';

export interface NotificationChannel {
  channelType: 'sms' | 'push' | 'email' | 'in_app' | 'voice' | 'webhook';
  channelId: string;
  isEnabled: boolean;
  configuration: Record<string, any>;
  lastUsed?: Date;
  deliveryStats: {
    sent: number;
    delivered: number;
    failed: number;
    opened: number;
  };
}

export interface AgentConfiguration {
  checkInterval: number; // minutes
  businessHours: {
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  escalationRules: EscalationRule[];
  notificationTemplates: NotificationTemplate[];
  filters: AgentFilter[];
}

export interface EscalationRule {
  ruleId: string;
  eventType: SchedulingEventType;
  condition: string;
  escalationDelay: number; // minutes
  escalationTarget: string; // staff ID or group
  maxEscalations: number;
  isActive: boolean;
}

export interface NotificationTemplate {
  templateId: string;
  eventType: SchedulingEventType;
  channel: NotificationChannel['channelType'];
  subject?: string;
  message: string;
  variables: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AgentFilter {
  filterId: string;
  filterType: 'client_priority' | 'bed_type' | 'time_range' | 'staff_availability';
  condition: string;
  action: 'include' | 'exclude' | 'prioritize';
}

export interface AgentStats {
  totalNotifications: number;
  notificationsToday: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number; // minutes
  lastActivity: Date;
  uptime: number; // percentage
}

// Unified Service Interfaces
export interface WalletVerificationService {
  // QR Code Management
  generateQRCode(ownerId: string, purpose: string, options?: QRGenerationOptions): Promise<QRVerificationCode>;
  validateQRCode(qrData: string): Promise<QRValidationResult>;
  revokeQRCode(codeId: string): Promise<boolean>;
  
  // Verification Process
  startVerificationSession(qrCodeId: string, staffId?: string): Promise<WalletCheckInSession>;
  processVerificationStep(sessionId: string, stepData: any): Promise<VerificationStep>;
  completeVerification(sessionId: string): Promise<FinalVerificationResult>;
  cancelVerification(sessionId: string, reason: string): Promise<boolean>;
  
  // Multi-wallet Verification
  verifyAppleWallet(walletData: any, claims: IdentityClaim[]): Promise<WalletVerificationResult>;
  verifySolidPod(podData: any, claims: IdentityClaim[]): Promise<WalletVerificationResult>;
  verifyDataswiftHAT(hatData: any, claims: IdentityClaim[]): Promise<WalletVerificationResult>;
  
  // Management Interface
  getActiveSessions(): Promise<WalletCheckInSession[]>;
  getVerificationDashboard(): Promise<ManagementVerificationDashboard>;
  getSystemStats(): Promise<VerificationSystemStats>;
  
  // Client Interface
  getClientInterface(ownerId: string): Promise<ClientVerificationInterface>;
  getAvailableWallets(ownerId: string): Promise<ClientWalletOption[]>;
}

export interface QRGenerationOptions {
  expirationMinutes?: number;
  maxUsages?: number;
  requiredVerifications?: VerificationRequirement[];
  location?: string;
  additionalData?: Record<string, any>;
}

export interface QRValidationResult {
  isValid: boolean;
  qrCode?: QRVerificationCode;
  errorMessage?: string;
  securityFlags?: SecurityFlag[];
  recommendedAction: 'proceed' | 'manual_review' | 'reject';
}

// Constants and Enums
export const VERIFICATION_METHODS = {
  APPLE_WALLET: 'apple_wallet',
  SOLID_POD: 'solid_pod',
  DATASWIFT_HAT: 'dataswift_hat',
  UNIFIED_MULTI: 'unified_multi'
} as const;

export const CHECK_IN_STEPS = {
  QR_GENERATION: 'qr_generation',
  QR_SCAN: 'qr_scan',
  WALLET_VERIFICATION: 'wallet_verification',
  IDENTITY_MATCHING: 'identity_matching',
  HEALTH_SCREENING: 'health_screening',
  ACCESS_GRANTING: 'access_granting',
  COMPLETION: 'completion'
} as const;

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  EMERGENCY: 'emergency'
} as const;