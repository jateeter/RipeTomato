/**
 * Secure PII Data Service
 * 
 * Integrates Solid Pod PII credential management with shelter client data access.
 * Provides secure, audited access to personally identifiable information.
 * 
 * @license MIT
 */

import SolidPIICredentialManager, { 
  PIICredential, 
  PIIAccessLevel, 
  UserRole,
  PIICredentialRequest 
} from './solidPIICredentialManager';
import { Session } from '@inrupt/solid-client-authn-browser';
import { safeLocalStorage } from '../utils/localStorage';

// Enhanced Client Data with PII protection
export interface SecureClientData {
  // Always accessible basic info
  id: string;
  clientNumber: string;
  registrationDate: string;
  status: 'active' | 'inactive' | 'archived';
  
  // PII Level: BASIC
  basicInfo?: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    dateOfBirth?: string;
    age?: number;
  };
  
  // PII Level: BASIC+
  contactInfo?: {
    phone?: string;
    email?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  
  // PII Level: MEDICAL
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    medicalConditions?: string[];
    healthInsurance?: {
      provider: string;
      policyNumber: string;
    };
    lastMedicalCheckup?: string;
    medicalNotes?: string;
  };
  
  // PII Level: FINANCIAL
  financialInfo?: {
    income?: number;
    incomeSource?: string;
    benefits?: {
      snap: boolean;
      medicaid: boolean;
      housingAssistance: boolean;
      socialSecurity: boolean;
    };
    employmentStatus?: string;
    employer?: string;
  };
  
  // PII Level: FULL
  fullRecord?: {
    socialSecurityNumber?: string;
    identificationDocuments?: Array<{
      type: 'drivers_license' | 'state_id' | 'passport' | 'birth_certificate';
      number: string;
      expirationDate?: string;
    }>;
    caseNotes?: Array<{
      date: string;
      author: string;
      note: string;
      category: 'housing' | 'medical' | 'financial' | 'general';
    }>;
    housingHistory?: Array<{
      type: 'shelter' | 'transitional' | 'permanent' | 'street';
      location?: string;
      startDate: string;
      endDate?: string;
    }>;
    legalIssues?: Array<{
      type: string;
      description: string;
      status: string;
      date: string;
    }>;
  };
}

// PII Access Context
export interface PIIAccessContext {
  credentialId: string;
  userId: string;
  sessionId: string;
  accessReason: string;
  ipAddress?: string;
  userAgent?: string;
}

class SecurePIIDataService {
  private credentialManager: SolidPIICredentialManager;
  private session: Session;
  private currentUserId: string | null = null;
  private currentCredentialId: string | null = null;

  constructor(session: Session, podUrl: string) {
    this.session = session;
    this.credentialManager = new SolidPIICredentialManager(session, podUrl);
  }

  /**
   * Initialize the secure PII data service
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing Secure PII Data Service...');
    
    try {
      await this.credentialManager.initialize();
      await this.restoreSession();
      console.log('✅ Secure PII Data Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Secure PII Data Service:', error);
      throw error;
    }
  }

  /**
   * Authenticate user and request PII access credentials
   */
  async authenticateForPIIAccess(request: PIICredentialRequest): Promise<string> {
    console.log(`🔐 Authenticating user for PII access: ${request.userId}`);

    try {
      const credentialId = await this.credentialManager.requestCredentials(request);
      
      // Store session info for future requests
      this.currentUserId = request.userId;
      this.currentCredentialId = credentialId;
      
      // Save to secure storage
      safeLocalStorage.setJSON('secure_pii_session', {
        userId: request.userId,
        credentialId,
        role: request.role,
        accessLevel: request.requestedAccessLevel,
        sessionStart: new Date().toISOString()
      });

      console.log('✅ PII access credentials obtained');
      return credentialId;

    } catch (error) {
      console.error('❌ Failed to authenticate for PII access:', error);
      throw error;
    }
  }

  /**
   * Get secure client data with appropriate PII filtering
   */
  async getSecureClientData(
    clientId: string, 
    context: PIIAccessContext
  ): Promise<SecureClientData | null> {
    console.log(`🔍 Retrieving secure client data: ${clientId}`);

    try {
      // Validate credentials for this access
      const canAccess = await this.credentialManager.validateCredentials(
        context.credentialId,
        clientId,
        'view_client_data'
      );

      if (!canAccess) {
        throw new Error('Access denied: Invalid or insufficient credentials');
      }

      // Get the raw client data (this would normally come from your data source)
      const rawClientData = await this.getRawClientData(clientId);
      if (!rawClientData) {
        return null;
      }

      // Get user's access level to filter PII appropriately
      const userCredentials = await this.credentialManager.getUserCredentials(context.userId);
      const activeCredential = userCredentials.find(cred => 
        cred.id === context.credentialId && cred.isActive
      );

      if (!activeCredential) {
        throw new Error('No active credentials found');
      }

      // Filter data based on access level
      const filteredData = this.filterDataByAccessLevel(rawClientData, activeCredential);
      
      console.log(`✅ Client data retrieved with ${activeCredential.accessLevel} access level`);
      return filteredData;

    } catch (error) {
      console.error('❌ Failed to retrieve secure client data:', error);
      throw error;
    }
  }

  /**
   * Update client PII data with proper access control
   */
  async updateSecureClientData(
    clientId: string,
    updates: Partial<SecureClientData>,
    context: PIIAccessContext
  ): Promise<boolean> {
    console.log(`📝 Updating secure client data: ${clientId}`);

    try {
      // Validate credentials for write access
      const canEdit = await this.credentialManager.validateCredentials(
        context.credentialId,
        clientId,
        'edit_client_data'
      );

      if (!canEdit) {
        throw new Error('Access denied: Insufficient permissions for editing');
      }

      // Determine what fields can be updated based on access level
      const userCredentials = await this.credentialManager.getUserCredentials(context.userId);
      const activeCredential = userCredentials.find(cred => 
        cred.id === context.credentialId && cred.isActive
      );

      if (!activeCredential) {
        throw new Error('No active credentials found');
      }

      // Filter updates based on permissions
      const allowedUpdates = this.filterUpdatesByPermissions(updates, activeCredential);
      
      if (Object.keys(allowedUpdates).length === 0) {
        throw new Error('No valid updates provided for your access level');
      }

      // Perform the actual update (implement based on your data storage)
      await this.performDataUpdate(clientId, allowedUpdates);

      console.log(`✅ Client data updated successfully: ${Object.keys(allowedUpdates).join(', ')}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to update secure client data:', error);
      throw error;
    }
  }

  /**
   * Get PII access audit trail for a client
   */
  async getClientPIIAuditTrail(clientId: string, days: number = 30): Promise<Array<{
    timestamp: Date;
    userId: string;
    action: string;
    accessLevel: string;
    success: boolean;
    ipAddress?: string;
  }>> {
    console.log(`📋 Retrieving PII audit trail for client: ${clientId}`);

    try {
      // This would require extending the credential manager to filter logs by client ID
      // For now, return a placeholder structure
      const auditTrail: Array<{
        timestamp: Date;
        userId: string;
        action: string;
        accessLevel: string;
        success: boolean;
        ipAddress?: string;
      }> = [];

      console.log(`✅ Retrieved ${auditTrail.length} audit entries for client ${clientId}`);
      return auditTrail;

    } catch (error) {
      console.error('❌ Failed to retrieve audit trail:', error);
      return [];
    }
  }

  /**
   * Filter raw client data based on access level
   */
  private filterDataByAccessLevel(
    rawData: any, 
    credential: PIICredential
  ): SecureClientData {
    const filteredData: SecureClientData = {
      id: rawData.id,
      clientNumber: rawData.clientNumber || rawData.id,
      registrationDate: rawData.registrationDate || new Date().toISOString(),
      status: rawData.status || 'active'
    };

    // BASIC level - name and basic contact
    if (credential.accessLevel === PIIAccessLevel.BASIC || 
        credential.accessLevel === PIIAccessLevel.MEDICAL ||
        credential.accessLevel === PIIAccessLevel.FINANCIAL ||
        credential.accessLevel === PIIAccessLevel.FULL) {
      
      filteredData.basicInfo = {
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        preferredName: rawData.preferredName,
        dateOfBirth: rawData.dateOfBirth,
        age: rawData.age
      };

      filteredData.contactInfo = {
        phone: rawData.phone,
        email: rawData.email,
        emergencyContact: rawData.emergencyContact
      };
    }

    // MEDICAL level
    if (credential.accessLevel === PIIAccessLevel.MEDICAL ||
        credential.accessLevel === PIIAccessLevel.FULL) {
      
      filteredData.medicalInfo = {
        allergies: rawData.allergies,
        medications: rawData.medications,
        medicalConditions: rawData.medicalConditions,
        healthInsurance: rawData.healthInsurance,
        lastMedicalCheckup: rawData.lastMedicalCheckup,
        medicalNotes: rawData.medicalNotes
      };
    }

    // FINANCIAL level
    if (credential.accessLevel === PIIAccessLevel.FINANCIAL ||
        credential.accessLevel === PIIAccessLevel.FULL) {
      
      filteredData.financialInfo = {
        income: rawData.income,
        incomeSource: rawData.incomeSource,
        benefits: rawData.benefits,
        employmentStatus: rawData.employmentStatus,
        employer: rawData.employer
      };
    }

    // FULL level
    if (credential.accessLevel === PIIAccessLevel.FULL) {
      filteredData.fullRecord = {
        socialSecurityNumber: rawData.socialSecurityNumber,
        identificationDocuments: rawData.identificationDocuments,
        caseNotes: rawData.caseNotes,
        housingHistory: rawData.housingHistory,
        legalIssues: rawData.legalIssues
      };
    }

    return filteredData;
  }

  /**
   * Filter updates based on user permissions
   */
  private filterUpdatesByPermissions(
    updates: Partial<SecureClientData>,
    credential: PIICredential
  ): Partial<SecureClientData> {
    const allowedUpdates: Partial<SecureClientData> = {};

    // Check each section against permissions
    if (updates.basicInfo && credential.permissions.includes('edit_basic')) {
      allowedUpdates.basicInfo = updates.basicInfo;
    }

    if (updates.contactInfo && credential.permissions.includes('edit_contact')) {
      allowedUpdates.contactInfo = updates.contactInfo;
    }

    if (updates.medicalInfo && 
        (credential.permissions.includes('edit_medical') || 
         credential.permissions.includes('edit_all'))) {
      allowedUpdates.medicalInfo = updates.medicalInfo;
    }

    if (updates.financialInfo && 
        (credential.permissions.includes('edit_financial') || 
         credential.permissions.includes('edit_all'))) {
      allowedUpdates.financialInfo = updates.financialInfo;
    }

    if (updates.fullRecord && 
        (credential.permissions.includes('full_access') || 
         credential.permissions.includes('system_admin'))) {
      allowedUpdates.fullRecord = updates.fullRecord;
    }

    return allowedUpdates;
  }

  /**
   * Get raw client data from data source
   */
  private async getRawClientData(clientId: string): Promise<any> {
    // This would integrate with your actual data storage
    // For now, return mock data
    return {
      id: clientId,
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-0123',
      email: 'john.doe@example.com',
      dateOfBirth: '1980-01-01',
      age: 44,
      allergies: ['Penicillin'],
      medicalConditions: ['Diabetes'],
      income: 1200,
      benefits: {
        snap: true,
        medicaid: true
      },
      registrationDate: '2024-01-01',
      status: 'active'
    };
  }

  /**
   * Perform actual data update
   */
  private async performDataUpdate(clientId: string, updates: Partial<SecureClientData>): Promise<void> {
    // This would integrate with your actual data storage system
    // For example: database update, file system, another Solid Pod, etc.
    console.log(`💾 Performing data update for client ${clientId}:`, updates);
  }

  /**
   * Restore session from storage
   */
  private async restoreSession(): Promise<void> {
    try {
      const sessionData = safeLocalStorage.getJSON('secure_pii_session') as any;
      if (sessionData && sessionData.credentialId) {
        this.currentUserId = sessionData.userId;
        this.currentCredentialId = sessionData.credentialId;
        console.log('🔄 PII session restored');
      }
    } catch (error) {
      console.warn('⚠️ Could not restore PII session:', error);
    }
  }

  /**
   * End current PII session
   */
  async endPIISession(): Promise<void> {
    console.log('🔓 Ending PII session');
    
    try {
      // Clear current session
      this.currentUserId = null;
      this.currentCredentialId = null;
      
      // Remove from storage
      safeLocalStorage.removeItem('secure_pii_session');
      
      console.log('✅ PII session ended');
    } catch (error) {
      console.error('❌ Error ending PII session:', error);
    }
  }

  /**
   * Check if current session has PII access
   */
  hasPIIAccess(): boolean {
    return !!(this.currentUserId && this.currentCredentialId);
  }

  /**
   * Get current PII access level
   */
  getCurrentAccessLevel(): PIIAccessLevel | null {
    const sessionData = safeLocalStorage.getJSON('secure_pii_session') as any;
    return sessionData?.accessLevel || null;
  }

  /**
   * Create PII access context for requests
   */
  createAccessContext(accessReason: string): PIIAccessContext | null {
    if (!this.currentUserId || !this.currentCredentialId) {
      return null;
    }

    return {
      credentialId: this.currentCredentialId,
      userId: this.currentUserId,
      sessionId: this.session.info.sessionId || 'unknown',
      accessReason,
      ipAddress: undefined, // Would be populated by backend
      userAgent: navigator.userAgent
    };
  }

  /**
   * Get credential manager for advanced operations
   */
  getCredentialManager(): SolidPIICredentialManager {
    return this.credentialManager;
  }
}

export default SecurePIIDataService;