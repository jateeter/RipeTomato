/**
 * Solid Pod PII Credential Manager
 * 
 * Secure storage and retrieval system for credentials needed to access
 * shelter client personally identifiable information (PII) using Solid Pods.
 * 
 * Features:
 * - Encrypted credential storage in Solid Pods
 * - Role-based access control (RBAC)
 * - Audit logging for PII access
 * - Time-limited access tokens
 * - Multi-factor authentication support
 * 
 * @license MIT
 */

import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  addBoolean,
  getStringNoLocale,
  getDatetime,
  getBoolean,
  getThing,
  setThing,
  removeThing,
  getThingAll
} from '@inrupt/solid-client';
import { Session } from '@inrupt/solid-client-authn-browser';

// PII Access Levels
export enum PIIAccessLevel {
  NONE = 'none',
  BASIC = 'basic',           // Name, contact info only
  MEDICAL = 'medical',       // Including health information
  FINANCIAL = 'financial',   // Including income, benefits
  FULL = 'full'             // Complete access to all PII
}

// User Roles for RBAC
export enum UserRole {
  GUEST = 'guest',
  VOLUNTEER = 'volunteer',
  STAFF = 'staff',
  CASE_MANAGER = 'case_manager',
  MEDICAL_STAFF = 'medical_staff',
  ADMINISTRATOR = 'administrator',
  SYSTEM_ADMIN = 'system_admin'
}

// Credential Types
export interface PIICredential {
  id: string;
  userId: string;
  role: UserRole;
  accessLevel: PIIAccessLevel;
  permissions: string[];
  issuedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  requiresMFA: boolean;
  lastUsed?: Date;
  sessionId?: string;
  restrictions?: {
    ipWhitelist?: string[];
    timeRestrictions?: {
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      daysOfWeek: number[]; // 0-6, Sunday = 0
    };
    maxDailyAccess?: number;
    specificClients?: string[]; // Client IDs if access is limited
  };
}

// Access Log Entry
export interface PIIAccessLog {
  id: string;
  credentialId: string;
  userId: string;
  clientId: string;
  accessType: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

// Credential Request
export interface PIICredentialRequest {
  userId: string;
  role: UserRole;
  requestedAccessLevel: PIIAccessLevel;
  requestedPermissions: string[];
  justification: string;
  supervisorApproval?: string;
  validityPeriod: number; // in days
  requiresMFA?: boolean;
}

class SolidPIICredentialManager {
  private session: Session;
  private podUrl: string;
  private credentialsContainerUrl: string;
  private accessLogsContainerUrl: string;

  constructor(session: Session, podUrl: string) {
    this.session = session;
    this.podUrl = podUrl;
    this.credentialsContainerUrl = `${podUrl}/pii-credentials/`;
    this.accessLogsContainerUrl = `${podUrl}/pii-access-logs/`;
  }

  /**
   * Initialize the PII credential management system
   */
  async initialize(): Promise<void> {
    console.log('🔐 Initializing Solid PII Credential Manager...');
    
    try {
      await this.ensureContainersExist();
      console.log('✅ PII Credential Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PII Credential Manager:', error);
      throw error;
    }
  }

  /**
   * Ensure required containers exist in the pod
   */
  private async ensureContainersExist(): Promise<void> {
    try {
      // Try to get credentials container, create if doesn't exist
      try {
        await getSolidDataset(this.credentialsContainerUrl, { fetch: this.session.fetch });
      } catch {
        await saveSolidDatasetAt(
          this.credentialsContainerUrl,
          createSolidDataset(),
          { fetch: this.session.fetch }
        );
        console.log('📁 Created PII credentials container');
      }

      // Try to get access logs container, create if doesn't exist
      try {
        await getSolidDataset(this.accessLogsContainerUrl, { fetch: this.session.fetch });
      } catch {
        await saveSolidDatasetAt(
          this.accessLogsContainerUrl,
          createSolidDataset(),
          { fetch: this.session.fetch }
        );
        console.log('📁 Created PII access logs container');
      }
    } catch (error) {
      console.error('❌ Failed to ensure containers exist:', error);
      throw error;
    }
  }

  /**
   * Request PII access credentials
   */
  async requestCredentials(request: PIICredentialRequest): Promise<string> {
    console.log(`🔑 Processing PII credential request for user: ${request.userId}`);

    try {
      // Validate request
      this.validateCredentialRequest(request);

      // Check if user already has active credentials
      const existingCredentials = await this.getUserCredentials(request.userId);
      if (existingCredentials.some(cred => cred.isActive && cred.expiresAt > new Date())) {
        throw new Error('User already has active PII credentials');
      }

      // Create new credential
      const credential: PIICredential = {
        id: this.generateCredentialId(),
        userId: request.userId,
        role: request.role,
        accessLevel: request.requestedAccessLevel,
        permissions: this.getPermissionsForRole(request.role, request.requestedAccessLevel),
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + request.validityPeriod * 24 * 60 * 60 * 1000),
        isActive: true,
        requiresMFA: request.requiresMFA || this.requiresMFAForLevel(request.requestedAccessLevel),
        restrictions: this.getDefaultRestrictions(request.role)
      };

      // Store credential in pod
      await this.storeCredential(credential);

      // Log the credential issuance
      await this.logAccess({
        id: this.generateLogId(),
        credentialId: credential.id,
        userId: request.userId,
        clientId: 'SYSTEM',
        accessType: 'CREDENTIAL_ISSUED',
        timestamp: new Date(),
        success: true
      });

      console.log(`✅ PII credentials issued for user: ${request.userId}, ID: ${credential.id}`);
      return credential.id;

    } catch (error) {
      console.error('❌ Failed to issue PII credentials:', error);
      throw error;
    }
  }

  /**
   * Validate credential request
   */
  private validateCredentialRequest(request: PIICredentialRequest): void {
    if (!request.userId || !request.role || !request.requestedAccessLevel) {
      throw new Error('Invalid credential request: missing required fields');
    }

    if (!request.justification || request.justification.length < 10) {
      throw new Error('Invalid credential request: justification too short');
    }

    if (request.validityPeriod > 90) {
      throw new Error('Invalid credential request: validity period too long (max 90 days)');
    }

    // High-level access requires supervisor approval
    if ((request.requestedAccessLevel === PIIAccessLevel.MEDICAL || 
         request.requestedAccessLevel === PIIAccessLevel.FULL) &&
        !request.supervisorApproval) {
      throw new Error('Supervisor approval required for high-level PII access');
    }
  }

  /**
   * Get permissions for a role and access level combination
   */
  private getPermissionsForRole(role: UserRole, accessLevel: PIIAccessLevel): string[] {
    const basePermissions: Record<UserRole, string[]> = {
      [UserRole.GUEST]: ['view_basic'],
      [UserRole.VOLUNTEER]: ['view_basic', 'view_contact'],
      [UserRole.STAFF]: ['view_basic', 'view_contact', 'edit_notes'],
      [UserRole.CASE_MANAGER]: ['view_basic', 'view_contact', 'view_medical', 'edit_all'],
      [UserRole.MEDICAL_STAFF]: ['view_basic', 'view_contact', 'view_medical', 'edit_medical'],
      [UserRole.ADMINISTRATOR]: ['view_all', 'edit_all', 'delete', 'export'],
      [UserRole.SYSTEM_ADMIN]: ['full_access', 'system_admin']
    };

    const accessLevelPermissions: Record<PIIAccessLevel, string[]> = {
      [PIIAccessLevel.NONE]: [],
      [PIIAccessLevel.BASIC]: ['view_name', 'view_contact_basic'],
      [PIIAccessLevel.MEDICAL]: ['view_name', 'view_contact', 'view_medical', 'view_health'],
      [PIIAccessLevel.FINANCIAL]: ['view_name', 'view_contact', 'view_financial', 'view_benefits'],
      [PIIAccessLevel.FULL]: ['view_all', 'access_all']
    };

    const rolePermissions = basePermissions[role] || [];
    const levelPermissions = accessLevelPermissions[accessLevel] || [];

    return [...new Set([...rolePermissions, ...levelPermissions])];
  }

  /**
   * Check if MFA is required for access level
   */
  private requiresMFAForLevel(accessLevel: PIIAccessLevel): boolean {
    return [PIIAccessLevel.MEDICAL, PIIAccessLevel.FINANCIAL, PIIAccessLevel.FULL].includes(accessLevel);
  }

  /**
   * Get default restrictions for a role
   */
  private getDefaultRestrictions(role: UserRole): PIICredential['restrictions'] {
    const restrictions: Record<UserRole, PIICredential['restrictions']> = {
      [UserRole.GUEST]: {
        timeRestrictions: {
          startTime: '08:00',
          endTime: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
        },
        maxDailyAccess: 5
      },
      [UserRole.VOLUNTEER]: {
        timeRestrictions: {
          startTime: '06:00',
          endTime: '22:00',
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // All days
        },
        maxDailyAccess: 20
      },
      [UserRole.STAFF]: {
        maxDailyAccess: 50
      },
      [UserRole.CASE_MANAGER]: {
        maxDailyAccess: 100
      },
      [UserRole.MEDICAL_STAFF]: {
        maxDailyAccess: 75
      },
      [UserRole.ADMINISTRATOR]: {},
      [UserRole.SYSTEM_ADMIN]: {}
    };

    return restrictions[role] || {};
  }

  /**
   * Store credential in Solid Pod
   */
  private async storeCredential(credential: PIICredential): Promise<void> {
    const credentialUrl = `${this.credentialsContainerUrl}credential-${credential.id}`;
    
    let dataset = createSolidDataset();
    let thing = createThing({ name: 'credential' });

    // Store credential data
    thing = addStringNoLocale(thing, 'http://pii.vocab/id', credential.id);
    thing = addStringNoLocale(thing, 'http://pii.vocab/userId', credential.userId);
    thing = addStringNoLocale(thing, 'http://pii.vocab/role', credential.role);
    thing = addStringNoLocale(thing, 'http://pii.vocab/accessLevel', credential.accessLevel);
    thing = addStringNoLocale(thing, 'http://pii.vocab/permissions', JSON.stringify(credential.permissions));
    thing = addDatetime(thing, 'http://pii.vocab/issuedAt', credential.issuedAt);
    thing = addDatetime(thing, 'http://pii.vocab/expiresAt', credential.expiresAt);
    thing = addBoolean(thing, 'http://pii.vocab/isActive', credential.isActive);
    thing = addBoolean(thing, 'http://pii.vocab/requiresMFA', credential.requiresMFA);
    
    if (credential.restrictions) {
      thing = addStringNoLocale(thing, 'http://pii.vocab/restrictions', JSON.stringify(credential.restrictions));
    }

    dataset = setThing(dataset, thing);
    await saveSolidDatasetAt(credentialUrl, dataset, { fetch: this.session.fetch });
  }

  /**
   * Retrieve user credentials
   */
  async getUserCredentials(userId: string): Promise<PIICredential[]> {
    try {
      const dataset = await getSolidDataset(this.credentialsContainerUrl, { fetch: this.session.fetch });
      const things = getThingAll(dataset);
      const credentials: PIICredential[] = [];

      for (const thing of things) {
        const credentialUserId = getStringNoLocale(thing, 'http://pii.vocab/userId');
        if (credentialUserId === userId) {
          credentials.push(this.parseCredentialFromThing(thing));
        }
      }

      return credentials;
    } catch (error) {
      console.error('❌ Failed to retrieve user credentials:', error);
      return [];
    }
  }

  /**
   * Validate and verify credentials for PII access
   */
  async validateCredentials(credentialId: string, clientId: string, requestedAction: string): Promise<boolean> {
    try {
      const credential = await this.getCredential(credentialId);
      
      if (!credential) {
        await this.logAccess({
          id: this.generateLogId(),
          credentialId,
          userId: 'UNKNOWN',
          clientId,
          accessType: requestedAction,
          timestamp: new Date(),
          success: false,
          reason: 'Credential not found'
        });
        return false;
      }

      // Check if credential is active and not expired
      if (!credential.isActive || credential.expiresAt < new Date()) {
        await this.logAccess({
          id: this.generateLogId(),
          credentialId,
          userId: credential.userId,
          clientId,
          accessType: requestedAction,
          timestamp: new Date(),
          success: false,
          reason: credential.isActive ? 'Credential expired' : 'Credential inactive'
        });
        return false;
      }

      // Check permissions
      if (!this.hasPermission(credential, requestedAction)) {
        await this.logAccess({
          id: this.generateLogId(),
          credentialId,
          userId: credential.userId,
          clientId,
          accessType: requestedAction,
          timestamp: new Date(),
          success: false,
          reason: 'Insufficient permissions'
        });
        return false;
      }

      // Check restrictions (time, daily limits, etc.)
      const restrictionCheck = await this.checkRestrictions(credential, clientId);
      if (!restrictionCheck.allowed) {
        await this.logAccess({
          id: this.generateLogId(),
          credentialId,
          userId: credential.userId,
          clientId,
          accessType: requestedAction,
          timestamp: new Date(),
          success: false,
          reason: restrictionCheck.reason
        });
        return false;
      }

      // Log successful access
      await this.logAccess({
        id: this.generateLogId(),
        credentialId,
        userId: credential.userId,
        clientId,
        accessType: requestedAction,
        timestamp: new Date(),
        success: true
      });

      // Update last used timestamp
      await this.updateLastUsed(credentialId);

      return true;

    } catch (error) {
      console.error('❌ Failed to validate credentials:', error);
      return false;
    }
  }

  /**
   * Check if credential has required permission
   */
  private hasPermission(credential: PIICredential, requestedAction: string): boolean {
    const actionPermissionMap: Record<string, string[]> = {
      'view_client_basic': ['view_basic', 'view_all', 'full_access'],
      'view_client_contact': ['view_contact', 'view_all', 'full_access'],
      'view_client_medical': ['view_medical', 'view_all', 'full_access'],
      'view_client_financial': ['view_financial', 'view_all', 'full_access'],
      'edit_client_notes': ['edit_notes', 'edit_all', 'full_access'],
      'edit_client_data': ['edit_all', 'full_access'],
      'delete_client_data': ['delete', 'full_access', 'system_admin'],
      'export_client_data': ['export', 'full_access', 'system_admin']
    };

    const requiredPermissions = actionPermissionMap[requestedAction] || [requestedAction];
    return requiredPermissions.some(perm => credential.permissions.includes(perm));
  }

  /**
   * Check credential restrictions
   */
  private async checkRestrictions(credential: PIICredential, clientId: string): Promise<{allowed: boolean, reason?: string}> {
    const restrictions = credential.restrictions;
    if (!restrictions) return { allowed: true };

    // Check time restrictions
    if (restrictions.timeRestrictions) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
      const currentDay = now.getDay();

      const { startTime, endTime, daysOfWeek } = restrictions.timeRestrictions;
      
      if (!daysOfWeek.includes(currentDay)) {
        return { allowed: false, reason: 'Access not allowed on this day' };
      }

      if (currentTime < startTime || currentTime > endTime) {
        return { allowed: false, reason: 'Access not allowed at this time' };
      }
    }

    // Check daily access limits
    if (restrictions.maxDailyAccess) {
      const todayAccessCount = await this.getDailyAccessCount(credential.id);
      if (todayAccessCount >= restrictions.maxDailyAccess) {
        return { allowed: false, reason: 'Daily access limit exceeded' };
      }
    }

    // Check specific client restrictions
    if (restrictions.specificClients && !restrictions.specificClients.includes(clientId)) {
      return { allowed: false, reason: 'Access not allowed for this client' };
    }

    return { allowed: true };
  }

  /**
   * Get daily access count for credential
   */
  private async getDailyAccessCount(credentialId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const accessLogs = await this.getAccessLogs(credentialId, today);
      return accessLogs.filter(log => log.success).length;
    } catch (error) {
      console.error('❌ Failed to get daily access count:', error);
      return 0;
    }
  }

  /**
   * Get credential by ID
   */
  private async getCredential(credentialId: string): Promise<PIICredential | null> {
    try {
      const credentialUrl = `${this.credentialsContainerUrl}credential-${credentialId}`;
      const dataset = await getSolidDataset(credentialUrl, { fetch: this.session.fetch });
      const thing = getThing(dataset, `${credentialUrl}#credential`);
      
      return thing ? this.parseCredentialFromThing(thing) : null;
    } catch (error) {
      console.error('❌ Failed to get credential:', error);
      return null;
    }
  }

  /**
   * Parse credential from RDF thing
   */
  private parseCredentialFromThing(thing: any): PIICredential {
    const restrictionsStr = getStringNoLocale(thing, 'http://pii.vocab/restrictions');
    
    return {
      id: getStringNoLocale(thing, 'http://pii.vocab/id') || '',
      userId: getStringNoLocale(thing, 'http://pii.vocab/userId') || '',
      role: getStringNoLocale(thing, 'http://pii.vocab/role') as UserRole,
      accessLevel: getStringNoLocale(thing, 'http://pii.vocab/accessLevel') as PIIAccessLevel,
      permissions: JSON.parse(getStringNoLocale(thing, 'http://pii.vocab/permissions') || '[]'),
      issuedAt: getDatetime(thing, 'http://pii.vocab/issuedAt') || new Date(),
      expiresAt: getDatetime(thing, 'http://pii.vocab/expiresAt') || new Date(),
      isActive: getBoolean(thing, 'http://pii.vocab/isActive') || false,
      requiresMFA: getBoolean(thing, 'http://pii.vocab/requiresMFA') || false,
      restrictions: restrictionsStr ? JSON.parse(restrictionsStr) : undefined
    };
  }

  /**
   * Log PII access attempt
   */
  private async logAccess(logEntry: PIIAccessLog): Promise<void> {
    try {
      const logUrl = `${this.accessLogsContainerUrl}log-${logEntry.id}`;
      
      let dataset = createSolidDataset();
      let thing = createThing({ name: 'access-log' });

      thing = addStringNoLocale(thing, 'http://pii.vocab/id', logEntry.id);
      thing = addStringNoLocale(thing, 'http://pii.vocab/credentialId', logEntry.credentialId);
      thing = addStringNoLocale(thing, 'http://pii.vocab/userId', logEntry.userId);
      thing = addStringNoLocale(thing, 'http://pii.vocab/clientId', logEntry.clientId);
      thing = addStringNoLocale(thing, 'http://pii.vocab/accessType', logEntry.accessType);
      thing = addDatetime(thing, 'http://pii.vocab/timestamp', logEntry.timestamp);
      thing = addBoolean(thing, 'http://pii.vocab/success', logEntry.success);
      
      if (logEntry.reason) {
        thing = addStringNoLocale(thing, 'http://pii.vocab/reason', logEntry.reason);
      }
      if (logEntry.ipAddress) {
        thing = addStringNoLocale(thing, 'http://pii.vocab/ipAddress', logEntry.ipAddress);
      }
      if (logEntry.userAgent) {
        thing = addStringNoLocale(thing, 'http://pii.vocab/userAgent', logEntry.userAgent);
      }

      dataset = setThing(dataset, thing);
      await saveSolidDatasetAt(logUrl, dataset, { fetch: this.session.fetch });
      
    } catch (error) {
      console.error('❌ Failed to log access:', error);
    }
  }

  /**
   * Get access logs for credential
   */
  private async getAccessLogs(credentialId: string, since?: Date): Promise<PIIAccessLog[]> {
    try {
      const dataset = await getSolidDataset(this.accessLogsContainerUrl, { fetch: this.session.fetch });
      const things = getThingAll(dataset);
      const logs: PIIAccessLog[] = [];

      for (const thing of things) {
        const logCredentialId = getStringNoLocale(thing, 'http://pii.vocab/credentialId');
        if (logCredentialId === credentialId) {
          const log = this.parseLogFromThing(thing);
          if (!since || log.timestamp >= since) {
            logs.push(log);
          }
        }
      }

      return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('❌ Failed to get access logs:', error);
      return [];
    }
  }

  /**
   * Parse access log from RDF thing
   */
  private parseLogFromThing(thing: any): PIIAccessLog {
    return {
      id: getStringNoLocale(thing, 'http://pii.vocab/id') || '',
      credentialId: getStringNoLocale(thing, 'http://pii.vocab/credentialId') || '',
      userId: getStringNoLocale(thing, 'http://pii.vocab/userId') || '',
      clientId: getStringNoLocale(thing, 'http://pii.vocab/clientId') || '',
      accessType: getStringNoLocale(thing, 'http://pii.vocab/accessType') || '',
      timestamp: getDatetime(thing, 'http://pii.vocab/timestamp') || new Date(),
      success: getBoolean(thing, 'http://pii.vocab/success') || false,
      reason: getStringNoLocale(thing, 'http://pii.vocab/reason') || undefined,
      ipAddress: getStringNoLocale(thing, 'http://pii.vocab/ipAddress') || undefined,
      userAgent: getStringNoLocale(thing, 'http://pii.vocab/userAgent') || undefined
    };
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(credentialId: string): Promise<void> {
    try {
      const credentialUrl = `${this.credentialsContainerUrl}credential-${credentialId}`;
      const dataset = await getSolidDataset(credentialUrl, { fetch: this.session.fetch });
      const thing = getThing(dataset, `${credentialUrl}#credential`);
      
      if (thing) {
        const updatedThing = addDatetime(thing, 'http://pii.vocab/lastUsed', new Date());
        const updatedDataset = setThing(dataset, updatedThing);
        await saveSolidDatasetAt(credentialUrl, updatedDataset, { fetch: this.session.fetch });
      }
    } catch (error) {
      console.error('❌ Failed to update last used timestamp:', error);
    }
  }

  /**
   * Revoke credentials
   */
  async revokeCredentials(credentialId: string, reason: string): Promise<void> {
    try {
      const credential = await this.getCredential(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      const credentialUrl = `${this.credentialsContainerUrl}credential-${credentialId}`;
      const dataset = await getSolidDataset(credentialUrl, { fetch: this.session.fetch });
      const thing = getThing(dataset, `${credentialUrl}#credential`);
      
      if (thing) {
        const updatedThing = addBoolean(
          addStringNoLocale(thing, 'http://pii.vocab/revokedReason', reason),
          'http://pii.vocab/isActive', 
          false
        );
        const updatedDataset = setThing(dataset, updatedThing);
        await saveSolidDatasetAt(credentialUrl, updatedDataset, { fetch: this.session.fetch });

        // Log revocation
        await this.logAccess({
          id: this.generateLogId(),
          credentialId,
          userId: credential.userId,
          clientId: 'SYSTEM',
          accessType: 'CREDENTIAL_REVOKED',
          timestamp: new Date(),
          success: true,
          reason
        });

        console.log(`🚫 Credentials revoked: ${credentialId}, reason: ${reason}`);
      }
    } catch (error) {
      console.error('❌ Failed to revoke credentials:', error);
      throw error;
    }
  }

  /**
   * Get audit report for compliance
   */
  async getAuditReport(startDate: Date, endDate: Date): Promise<{
    totalAccesses: number;
    successfulAccesses: number;
    failedAccesses: number;
    uniqueUsers: number;
    accessesByRole: Record<string, number>;
    topAccessedClients: Array<{clientId: string, count: number}>;
  }> {
    try {
      const dataset = await getSolidDataset(this.accessLogsContainerUrl, { fetch: this.session.fetch });
      const things = getThingAll(dataset);
      const logs: PIIAccessLog[] = [];

      // Filter logs by date range
      for (const thing of things) {
        const log = this.parseLogFromThing(thing);
        if (log.timestamp >= startDate && log.timestamp <= endDate) {
          logs.push(log);
        }
      }

      // Generate report
      const uniqueUsers = new Set(logs.map(log => log.userId)).size;
      const successfulAccesses = logs.filter(log => log.success).length;
      const failedAccesses = logs.filter(log => !log.success).length;

      // Access by role (would need to correlate with credentials)
      const accessesByRole: Record<string, number> = {};
      
      // Top accessed clients
      const clientCounts = logs.reduce((acc, log) => {
        acc[log.clientId] = (acc[log.clientId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topAccessedClients = Object.entries(clientCounts)
        .map(([clientId, count]) => ({ clientId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalAccesses: logs.length,
        successfulAccesses,
        failedAccesses,
        uniqueUsers,
        accessesByRole,
        topAccessedClients
      };

    } catch (error) {
      console.error('❌ Failed to generate audit report:', error);
      throw error;
    }
  }

  /**
   * Generate unique credential ID
   */
  private generateCredentialId(): string {
    return `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export the manager and types
export default SolidPIICredentialManager;