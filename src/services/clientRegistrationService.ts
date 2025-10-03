/**
 * Client Registration Service
 * 
 * Orchestrates the complete workflow for registering a new shelter client,
 * including creating their own Solid Pod for data sovereignty and PII management.
 * 
 * @license MIT
 */

import { Session } from '@inrupt/solid-client-authn-browser';
import ClientPodManager, { ClientPersonalData, ClientPodStructure } from './clientPodManager';
import SecurePIIDataService from './securePIIDataService';
import SolidPIICredentialManager, { 
  PIIAccessLevel, 
  UserRole, 
  PIICredentialRequest 
} from './solidPIICredentialManager';
import { safeLocalStorage } from '../utils/localStorage';

// Client Registration Data Interface
export interface ClientRegistrationData extends ClientPersonalData {
  // Intake specific fields
  intakeDate: string;
  intakeStaff: {
    id: string;
    name: string;
    webId: string;
    role: UserRole;
  };
  
  // Initial assessment
  initialAssessment: {
    housingStatus: 'unsheltered' | 'temporary' | 'doubled_up' | 'institutional';
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    immediateNeeds: string[];
    healthConcerns: string[];
    hasChildren: boolean;
    childrenCount?: number;
    veteranStatus: boolean;
    disabilityStatus: boolean;
  };

  // Service preferences
  servicePreferences: {
    preferredContactMethod: 'phone' | 'email' | 'in_person' | 'text';
    languagePreference: string;
    accessibilityNeeds?: string[];
    culturalConsiderations?: string;
    consentToShare: {
      medicalInfo: boolean;
      financialInfo: boolean;
      caseNotes: boolean;
      emergencyContact: boolean;
    };
  };
}

// Registration Result
export interface ClientRegistrationResult {
  success: boolean;
  clientId: string;
  podUrl?: string;
  accessCredentials?: {
    staffCredentialId: string;
    clientAccessCode: string;
  };
  errors?: string[];
  warnings?: string[];
}

// Registration Progress Tracking
interface RegistrationProgress {
  step: 'intake' | 'pod_creation' | 'data_storage' | 'access_setup' | 'verification' | 'completed';
  progress: number; // 0-100
  message: string;
  timestamp: string;
}

export class ClientRegistrationService {
  private session: Session;
  private podManager: ClientPodManager;
  private piiService: SecurePIIDataService;
  private credentialManager: SolidPIICredentialManager;
  
  private progressCallback?: (progress: RegistrationProgress) => void;

  constructor(session: Session, shelterPodUrl: string) {
    this.session = session;
    this.podManager = new ClientPodManager(session);
    this.piiService = new SecurePIIDataService(session, shelterPodUrl);
    this.credentialManager = new SolidPIICredentialManager(session, shelterPodUrl);
  }

  /**
   * Initialize the registration service
   */
  async initialize(): Promise<void> {
    console.log('🏠 Initializing Client Registration Service...');
    
    try {
      await this.piiService.initialize();
      await this.credentialManager.initialize();
      console.log('✅ Client Registration Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Client Registration Service:', error);
      throw error;
    }
  }

  /**
   * Set progress callback for UI updates
   */
  setProgressCallback(callback: (progress: RegistrationProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Update registration progress
   */
  private updateProgress(
    step: RegistrationProgress['step'], 
    progress: number, 
    message: string
  ): void {
    const progressUpdate: RegistrationProgress = {
      step,
      progress,
      message,
      timestamp: new Date().toISOString()
    };

    console.log(`📊 Registration Progress: ${progress}% - ${message}`);
    this.progressCallback?.(progressUpdate);
  }

  /**
   * Register a new shelter client with complete workflow
   */
  async registerNewClient(
    registrationData: ClientRegistrationData
  ): Promise<ClientRegistrationResult> {
    console.log('🆕 Starting new client registration:', registrationData.firstName, registrationData.lastName);
    
    const result: ClientRegistrationResult = {
      success: false,
      clientId: '',
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Intake validation
      this.updateProgress('intake', 10, 'Validating intake information...');
      const validationResult = this.validateRegistrationData(registrationData);
      
      if (!validationResult.isValid) {
        result.errors = validationResult.errors;
        return result;
      }

      if (validationResult.warnings.length > 0) {
        result.warnings = validationResult.warnings;
      }

      // Generate unique client ID
      const clientId = this.generateClientId(registrationData);
      result.clientId = clientId;

      // Step 2: Create client-owned pod
      this.updateProgress('pod_creation', 30, 'Creating client-owned Solid Pod...');
      
      const podStructure = await this.podManager.createClientPod(
        registrationData,
        registrationData.intakeStaff.webId
      );
      
      result.podUrl = podStructure.podUrl;

      // Step 3: Store client data in their pod
      this.updateProgress('data_storage', 50, 'Storing client data securely...');
      
      await this.storeClientDataInPod(registrationData, podStructure);

      // Step 4: Set up access credentials for staff
      this.updateProgress('access_setup', 70, 'Setting up staff access credentials...');
      
      const accessCredentials = await this.setupStaffAccess(
        clientId,
        podStructure,
        registrationData.intakeStaff
      );
      
      result.accessCredentials = accessCredentials;

      // Step 5: Create client access code
      this.updateProgress('access_setup', 80, 'Generating client access code...');
      
      const clientAccessCode = await this.generateClientAccessCode(clientId, podStructure);
      result.accessCredentials!.clientAccessCode = clientAccessCode;

      // Step 6: Final verification
      this.updateProgress('verification', 90, 'Verifying registration integrity...');
      
      const verificationResult = await this.verifyRegistration(clientId, podStructure);
      
      if (!verificationResult.success) {
        if (result.errors) {
        result.errors.push(...verificationResult.errors);
      } else {
        result.errors = verificationResult.errors;
      }
        return result;
      }

      // Step 7: Complete registration
      this.updateProgress('completed', 100, 'Client registration completed successfully!');
      
      // Store registration record
      await this.recordRegistration(clientId, registrationData, result);
      
      result.success = true;
      console.log('✅ Client registration completed successfully:', clientId);
      
      return result;

    } catch (error) {
      console.error('❌ Client registration failed:', error);
      if (result.errors) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      } else {
        result.errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
      }
      this.updateProgress('intake', 0, `Registration failed: ${result.errors[0]}`);
      return result;
    }
  }

  /**
   * Validate registration data
   */
  private validateRegistrationData(data: ClientRegistrationData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    if (!data.dateOfBirth) errors.push('Date of birth is required');
    if (!data.intakeStaff?.webId) errors.push('Intake staff information is required');

    // Date validations
    const birthDate = new Date(data.dateOfBirth);
    const today = new Date();
    const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 0 || age > 120) {
      errors.push('Invalid date of birth');
    } else if (age < 18) {
      // In a real system, we'd check for guardian information
      // For now, just warn
      warnings.push('Minor client - ensure guardian information is available');
    }

    // Contact information warnings
    if (!data.phoneNumber && !data.email) {
      warnings.push('No contact information provided - this may limit service delivery');
    }

    // Emergency contact warnings
    if (!data.emergencyContact) {
      warnings.push('No emergency contact provided - recommended for safety');
    }

    // Assessment validations
    if (data.initialAssessment.urgencyLevel === 'critical' && !data.initialAssessment.immediateNeeds?.length) {
      warnings.push('Critical urgency level requires immediate needs assessment');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(data: ClientRegistrationData): string {
    const timestamp = Date.now();
    const initials = `${data.firstName[0]}${data.lastName[0]}`.toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CL_${initials}_${timestamp}_${random}`;
  }

  /**
   * Store client data in their pod
   */
  private async storeClientDataInPod(
    registrationData: ClientRegistrationData,
    podStructure: ClientPodStructure
  ): Promise<void> {
    console.log('💾 Storing client data in pod...');

    try {
      // Store personal information
      await this.podManager.storePersonalData(
        podStructure.containers.personal,
        registrationData
      );

      // Store initial assessment
      await this.podManager.storeInitialAssessment(
        podStructure.containers.caseNotes,
        registrationData.initialAssessment,
        registrationData.intakeStaff
      );

      // Store service preferences
      await this.podManager.storeServicePreferences(
        podStructure.containers.preferences,
        registrationData.servicePreferences
      );

      console.log('✅ Client data stored successfully in pod');

    } catch (error) {
      console.error('❌ Failed to store client data in pod:', error);
      throw new Error(`Data storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up staff access to client pod
   */
  private async setupStaffAccess(
    clientId: string,
    podStructure: ClientPodStructure,
    intakeStaff: ClientRegistrationData['intakeStaff']
  ): Promise<{ staffCredentialId: string; clientAccessCode: string }> {
    console.log('🔑 Setting up staff access credentials...');

    try {
      // Create PII access request for intake staff
      const piiRequest: PIICredentialRequest = {
        userId: intakeStaff.id,
        role: intakeStaff.role,
        requestedAccessLevel: this.determineRequiredAccessLevel(intakeStaff.role),
        requestedPermissions: this.getPermissionsForRole(intakeStaff.role),
        justification: `Initial intake and registration for client ${clientId}`,
        validityPeriod: 90, // 3 months for intake staff
        requiresMFA: intakeStaff.role === UserRole.MEDICAL_STAFF || 
                     intakeStaff.role === UserRole.ADMINISTRATOR
      };

      // Request credentials through PII service
      const credentialId = await this.piiService.authenticateForPIIAccess(piiRequest);

      // Set up pod-specific access permissions
      await this.podManager.grantStaffAccess(
        podStructure.podUrl,
        intakeStaff.webId,
        intakeStaff.role,
        credentialId
      );

      console.log('✅ Staff access credentials configured');

      return {
        staffCredentialId: credentialId,
        clientAccessCode: '' // Will be set later
      };

    } catch (error) {
      console.error('❌ Failed to setup staff access:', error);
      throw new Error(`Staff access setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate client access code for pod management
   */
  private async generateClientAccessCode(
    clientId: string,
    podStructure: ClientPodStructure
  ): Promise<string> {
    console.log('🎫 Generating client access code...');

    try {
      // Create secure access code
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10).toUpperCase();
      const accessCode = `${clientId.substring(0, 6)}-${random}-${timestamp.toString(36).toUpperCase()}`;

      // Store access code metadata in client pod
      await this.podManager.storeAccessCode(
        podStructure.containers.access,
        accessCode,
        clientId
      );

      console.log('✅ Client access code generated');
      return accessCode;

    } catch (error) {
      console.error('❌ Failed to generate client access code:', error);
      throw new Error(`Access code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify registration integrity
   */
  private async verifyRegistration(
    clientId: string,
    podStructure: ClientPodStructure
  ): Promise<{ success: boolean; errors: string[] }> {
    console.log('🔍 Verifying registration integrity...');
    
    const errors: string[] = [];

    try {
      // Verify pod accessibility
      const podExists = await this.podManager.verifyPodExists(podStructure.podUrl);
      if (!podExists) {
        errors.push('Client pod verification failed - pod not accessible');
      }

      // Verify data containers
      for (const [containerName, containerUrl] of Object.entries(podStructure.containers)) {
        const containerExists = await this.podManager.verifyContainerExists(containerUrl);
        if (!containerExists) {
          errors.push(`Container verification failed: ${containerName}`);
        }
      }

      // Verify access permissions
      const hasAccess = this.piiService.hasPIIAccess();
      if (!hasAccess) {
        errors.push('PII access verification failed');
      }

      console.log(`✅ Registration verification completed with ${errors.length} errors`);

      return {
        success: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('❌ Registration verification failed:', error);
      errors.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Record registration in shelter system
   */
  private async recordRegistration(
    clientId: string,
    registrationData: ClientRegistrationData,
    result: ClientRegistrationResult
  ): Promise<void> {
    console.log('📝 Recording registration in shelter system...');

    try {
      const registrationRecord = {
        clientId,
        registrationDate: new Date().toISOString(),
        intakeStaff: registrationData.intakeStaff,
        podUrl: result.podUrl,
        accessCredentials: result.accessCredentials,
        initialAssessment: registrationData.initialAssessment,
        status: 'active'
      };

      // Store in local storage for session management
      safeLocalStorage.setJSON(`client_registration_${clientId}`, registrationRecord);

      // In a full implementation, this would also store in shelter database
      console.log('✅ Registration recorded successfully');

    } catch (error) {
      console.warn('⚠️ Failed to record registration:', error);
      // Non-critical error - don't fail registration
    }
  }

  /**
   * Determine required access level for staff role
   */
  private determineRequiredAccessLevel(role: UserRole): PIIAccessLevel {
    const roleAccessMap: Record<UserRole, PIIAccessLevel> = {
      [UserRole.GUEST]: PIIAccessLevel.NONE,
      [UserRole.VOLUNTEER]: PIIAccessLevel.BASIC,
      [UserRole.STAFF]: PIIAccessLevel.BASIC,
      [UserRole.CASE_MANAGER]: PIIAccessLevel.FINANCIAL,
      [UserRole.MEDICAL_STAFF]: PIIAccessLevel.MEDICAL,
      [UserRole.ADMINISTRATOR]: PIIAccessLevel.FULL,
      [UserRole.SYSTEM_ADMIN]: PIIAccessLevel.FULL
    };

    return roleAccessMap[role] || PIIAccessLevel.BASIC;
  }

  /**
   * Get permissions for staff role
   */
  private getPermissionsForRole(role: UserRole): string[] {
    const rolePermissions: Record<UserRole, string[]> = {
      [UserRole.GUEST]: ['view_basic'],
      [UserRole.VOLUNTEER]: ['view_basic'],
      [UserRole.STAFF]: ['view_basic', 'edit_notes'],
      [UserRole.CASE_MANAGER]: ['view_basic', 'edit_notes', 'view_financial', 'edit_case_plan'],
      [UserRole.MEDICAL_STAFF]: ['view_basic', 'view_medical', 'edit_medical'],
      [UserRole.ADMINISTRATOR]: ['view_all', 'edit_all', 'delete', 'export'],
      [UserRole.SYSTEM_ADMIN]: ['view_all', 'edit_all', 'delete', 'export', 'system_admin']
    };

    return rolePermissions[role] || ['view_basic'];
  }

  /**
   * Get registration by client ID
   */
  getRegistrationRecord(clientId: string): any {
    return safeLocalStorage.getJSON(`client_registration_${clientId}`);
  }

  /**
   * Get all client registrations
   */
  getAllRegistrations(): any[] {
    const registrations: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('client_registration_')) {
        const record = safeLocalStorage.getJSON(key);
        if (record) {
          registrations.push(record);
        }
      }
    }
    
    return registrations;
  }
}

export default ClientRegistrationService;