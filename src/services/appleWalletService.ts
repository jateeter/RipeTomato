import { v4 as uuidv4 } from 'uuid';
import { 
  AppleWalletPass, 
  ShelterPass, 
  HealthCredential, 
  IdentificationPass,
  PassField,
  Barcode,
  PassUpdateRequest,
  WalletServiceStats
} from '../types/AppleWallet';
import { Client } from '../types/Shelter';
import { userPodService } from './userPodService';
import { 
  UnifiedWalletPass, 
  WalletPassType, 
  AccessLevel,
  PassMetadata,
  EmergencyContact,
  UnifiedDataRecord,
  UnifiedDataType,
  DataSource,
  PrivacyLevel,
  UNIFIED_DATA_TYPES
} from '../types/UnifiedDataOwnership';

class AppleWalletService {
  private passes: Map<string, AppleWalletPass> = new Map();
  private unifiedPasses: Map<string, UnifiedWalletPass> = new Map();
  private accessRecords: Map<string, UnifiedDataRecord[]> = new Map();
  
  private readonly config = {
    teamIdentifier: 'XYZ123ABC4', // Idaho Shelter Management Team ID
    passTypeIdentifiers: {
      shelter: 'pass.com.idaho.shelter.access',
      health: 'pass.com.idaho.shelter.health',
      identification: 'pass.com.idaho.shelter.id',
      service_entitlement: 'pass.com.idaho.shelter.services',
      emergency_contact: 'pass.com.idaho.shelter.emergency'
    },
    organizationName: 'Idaho Community Shelter',
    webServiceURL: 'https://shelter.idaho.com/wallet/',
    baseURL: 'http://localhost:3001'
  };

  /**
   * Create a unified wallet pass for individual data ownership
   */
  async createUnifiedWalletPass(
    ownerId: string, 
    passType: WalletPassType, 
    metadata: PassMetadata,
    client?: Client
  ): Promise<UnifiedWalletPass> {
    const passId = uuidv4();
    const serialNumber = `${passType.replace('_', '-').toUpperCase()}-${ownerId.substring(0, 8)}-${Date.now()}`;
    
    console.log(`📱 Creating unified wallet pass: ${passType} for owner ${ownerId}`);
    
    const accessLevel = this.determineAccessLevel(passType);
    const validFrom = new Date();
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    const unifiedPass: UnifiedWalletPass = {
      passId,
      passType,
      serialNumber,
      accessLevel,
      validFrom,
      validUntil,
      status: 'active',
      metadata,
      linkedData: {
        hatEndpoint: `shelter/${this.getDataTypeForPassType(passType)}`,
        dataReferences: [ownerId]
      }
    };

    // Store the unified pass
    this.unifiedPasses.set(passId, unifiedPass);

    // Create corresponding Apple Wallet pass for device integration
    if (client) {
      let applePass: AppleWalletPass;
      
      switch (passType) {
        case 'shelter_access':
          applePass = await this.createLegacyShelterPass(client, undefined, metadata.services || []);
          break;
        case 'health_credential':
          applePass = await this.createLegacyHealthCredential(client, 'medical_id', {
            emergencyContacts: metadata.emergencyInfo?.contacts || []
          });
          break;
        case 'identification':
          applePass = await this.createLegacyIdentificationPass(client, 'shelter_id', serialNumber);
          break;
        case 'service_entitlement':
          applePass = await this.createServiceEntitlementPass(client, metadata);
          break;
        case 'emergency_contact':
          applePass = await this.createEmergencyContactPass(client, metadata);
          break;
        default:
          throw new Error(`Unsupported pass type: ${passType}`);
      }

      // Link the unified pass with Apple pass
      unifiedPass.linkedData.dataReferences.push(applePass.id);
    }

    // Record access event
    await this.recordAccessEvent(ownerId, 'pass_created', passType, {
      passId,
      serialNumber,
      timestamp: new Date()
    });

    console.log(`✅ Created unified wallet pass: ${serialNumber} (${passType})`);
    return unifiedPass;
  }

  /**
   * Create a shelter access pass for a client (legacy method with unified integration)
   */
  async createShelterPass(client: Client, bedNumber?: string, services: string[] = []): Promise<ShelterPass> {
    // Create unified pass first
    const metadata: PassMetadata = {
      title: 'Idaho Shelter Access',
      description: 'Access to shelter services and facilities',
      issuer: this.config.organizationName,
      category: 'access',
      services: services.length > 0 ? services : ['Meals', 'Showers', 'Storage', 'WiFi'],
      restrictions: client.restrictions || []
    };

    const unifiedPass = await this.createUnifiedWalletPass(
      client.id, 
      'shelter_access', 
      metadata, 
      client
    );

    // Return the Apple Wallet pass
    return await this.createLegacyShelterPass(client, bedNumber, services);
  }

  /**
   * Legacy shelter pass creation (maintains compatibility)
   */
  private async createLegacyShelterPass(client: Client, bedNumber?: string, services: string[] = []): Promise<ShelterPass> {
    const passId = uuidv4();
    const serialNumber = `SHELTER-${client.id.toUpperCase()}-${Date.now()}`;
    
    const shelterPass: ShelterPass = {
      id: passId,
      passTypeIdentifier: this.config.passTypeIdentifiers.shelter,
      teamIdentifier: this.config.teamIdentifier,
      organizationName: this.config.organizationName,
      serialNumber,
      formatVersion: 1,
      
      description: 'Idaho Community Shelter Access Pass',
      logoText: 'Idaho Shelter',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(34, 139, 34)',
      labelColor: 'rgb(255, 255, 255)',
      
      // Client and shelter specific data
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      shelterName: 'Idaho Community Shelter',
      bedNumber,
      checkInDate: new Date(),
      accessLevel: 'resident',
      services,
      
      // Generic pass structure
      generic: {},
      
      // Pass fields
      headerFields: [
        {
          key: 'shelter-name',
          label: 'Shelter',
          value: 'Idaho Community Shelter'
        }
      ],
      primaryFields: [
        {
          key: 'client-name',
          label: 'Resident',
          value: `${client.firstName} ${client.lastName}`
        },
        {
          key: 'client-id',
          label: 'ID',
          value: client.id.toUpperCase()
        }
      ],
      secondaryFields: [
        {
          key: 'bed-number',
          label: 'Bed',
          value: bedNumber || 'Unassigned'
        },
        {
          key: 'check-in',
          label: 'Check-in',
          value: new Date().toLocaleDateString(),
          dateStyle: 'short'
        }
      ],
      auxiliaryFields: [
        {
          key: 'phone',
          label: 'Phone',
          value: client.phone || 'Not provided'
        },
        {
          key: 'emergency',
          label: 'Emergency Contact',
          value: client.emergencyContact?.name || 'Not provided'
        }
      ],
      backFields: [
        {
          key: 'services',
          label: 'Available Services',
          value: services.length > 0 ? services.join(', ') : 'Basic shelter services'
        },
        {
          key: 'rules',
          label: 'Shelter Rules',
          value: 'Respect others, no alcohol/drugs, follow curfew, maintain cleanliness'
        },
        {
          key: 'emergency-info',
          label: 'Emergency',
          value: 'Call 911 for medical emergencies. Contact front desk for shelter issues.'
        }
      ],
      
      // QR Code for check-in/verification
      barcodes: [
        {
          message: JSON.stringify({
            clientId: client.id,
            passId: passId,
            timestamp: Date.now(),
            type: 'shelter-access'
          }),
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
          altText: `Shelter ID: ${client.id}`
        }
      ],
      
      // Shelter location for relevance
      locations: [
        {
          latitude: 43.6150,
          longitude: -116.2023,
          relevantText: 'You are near Idaho Community Shelter'
        }
      ],
      
      webServiceURL: this.config.webServiceURL,
      authenticationToken: this.generateAuthToken(passId),
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.passes.set(passId, shelterPass);
    
    // Store pass in user's pod
    await this.storePassInUserPod(client.id, shelterPass);
    
    console.log(`🎫 Created shelter access pass for ${client.firstName} ${client.lastName}`);
    return shelterPass;
  }

  /**
   * Create a health credential pass
   */
  async createHealthCredential(
    client: Client,
    credentialType: HealthCredential['credentialType'],
    healthData?: HealthCredential['healthData']
  ): Promise<HealthCredential> {
    const passId = uuidv4();
    const serialNumber = `HEALTH-${client.id.toUpperCase()}-${Date.now()}`;
    
    const healthCredential: HealthCredential = {
      id: passId,
      passTypeIdentifier: this.config.passTypeIdentifiers.health,
      teamIdentifier: this.config.teamIdentifier,
      organizationName: this.config.organizationName,
      serialNumber,
      formatVersion: 1,
      
      description: 'Health Credential',
      logoText: 'Health ID',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(220, 20, 60)',
      labelColor: 'rgb(255, 255, 255)',
      
      // Health credential specific data
      clientId: client.id,
      credentialType,
      issuer: 'Idaho Community Shelter Health Services',
      issuedDate: new Date(),
      verificationData: this.generateVerificationData(client.id, credentialType),
      healthData,
      
      // Generic pass structure
      generic: {},
      
      // Pass fields
      headerFields: [
        {
          key: 'credential-type',
          label: 'Type',
          value: this.formatCredentialType(credentialType)
        }
      ],
      primaryFields: [
        {
          key: 'client-name',
          label: 'Name',
          value: `${client.firstName} ${client.lastName}`
        },
        {
          key: 'issued-date',
          label: 'Issued',
          value: new Date().toLocaleDateString(),
          dateStyle: 'short'
        }
      ],
      secondaryFields: [],
      auxiliaryFields: [],
      backFields: [
        {
          key: 'issuer',
          label: 'Issued By',
          value: 'Idaho Community Shelter Health Services'
        },
        {
          key: 'verification',
          label: 'Verification Code',
          value: this.generateVerificationData(client.id, credentialType).substring(0, 16) + '...'
        }
      ],
      
      // Add health-specific fields
      ...this.buildHealthFields(healthData),
      
      // QR Code for verification
      barcodes: [
        {
          message: JSON.stringify({
            clientId: client.id,
            credentialType,
            verificationData: this.generateVerificationData(client.id, credentialType),
            timestamp: Date.now()
          }),
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
          altText: `Health Credential: ${credentialType}`
        }
      ],
      
      webServiceURL: this.config.webServiceURL,
      authenticationToken: this.generateAuthToken(passId),
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.passes.set(passId, healthCredential);
    await this.storePassInUserPod(client.id, healthCredential);
    
    console.log(`🏥 Created health credential (${credentialType}) for ${client.firstName} ${client.lastName}`);
    return healthCredential;
  }

  /**
   * Create an identification pass
   */
  async createIdentificationPass(
    client: Client,
    documentType: IdentificationPass['documentType'],
    documentNumber: string,
    photo?: string
  ): Promise<IdentificationPass> {
    const passId = uuidv4();
    const serialNumber = `ID-${client.id.toUpperCase()}-${Date.now()}`;
    
    const idPass: IdentificationPass = {
      id: passId,
      passTypeIdentifier: this.config.passTypeIdentifiers.identification,
      teamIdentifier: this.config.teamIdentifier,
      organizationName: this.config.organizationName,
      serialNumber,
      formatVersion: 1,
      
      description: 'Idaho Shelter Identification',
      logoText: 'ID Card',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(0, 123, 191)',
      labelColor: 'rgb(255, 255, 255)',
      
      // ID specific data
      clientId: client.id,
      documentType,
      issuingOrganization: 'Idaho Community Shelter',
      documentNumber,
      issuedDate: new Date(),
      photo,
      securityFeatures: ['digital_signature', 'timestamp_verification', 'biometric_hash'],
      
      // Generic pass structure
      generic: {},
      
      // Pass fields
      headerFields: [
        {
          key: 'document-type',
          label: 'Type',
          value: this.formatDocumentType(documentType)
        }
      ],
      primaryFields: [
        {
          key: 'client-name',
          label: 'Name',
          value: `${client.firstName} ${client.lastName}`
        },
        {
          key: 'document-number',
          label: 'ID Number',
          value: documentNumber
        }
      ],
      secondaryFields: [
        {
          key: 'date-of-birth',
          label: 'Date of Birth',
          value: client.dateOfBirth.toLocaleDateString(),
          dateStyle: 'medium'
        },
        {
          key: 'issued-date',
          label: 'Issued',
          value: new Date().toLocaleDateString(),
          dateStyle: 'short'
        }
      ],
      auxiliaryFields: [
        {
          key: 'client-id',
          label: 'Client ID',
          value: client.id.toUpperCase()
        }
      ],
      backFields: [
        {
          key: 'issuing-org',
          label: 'Issued By',
          value: 'Idaho Community Shelter'
        },
        {
          key: 'security-features',
          label: 'Security Features',
          value: 'Digital signature, biometric verification, tamper detection'
        },
        {
          key: 'validity',
          label: 'Validity',
          value: 'Valid for shelter services and identification purposes'
        }
      ],
      
      // QR Code for verification
      barcodes: [
        {
          message: JSON.stringify({
            clientId: client.id,
            documentType,
            documentNumber,
            biometricHash: this.generateBiometricHash(client),
            timestamp: Date.now()
          }),
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
          altText: `ID: ${documentNumber}`
        }
      ],
      
      webServiceURL: this.config.webServiceURL,
      authenticationToken: this.generateAuthToken(passId),
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.passes.set(passId, idPass);
    await this.storePassInUserPod(client.id, idPass);
    
    console.log(`🆔 Created identification pass (${documentType}) for ${client.firstName} ${client.lastName}`);
    return idPass;
  }

  /**
   * Generate .pkpass file URL for download
   */
  generatePassURL(passId: string): string {
    return `${this.config.baseURL}/wallet/passes/${passId}.pkpass`;
  }

  /**
   * Update an existing pass
   */
  async updatePass(updateRequest: PassUpdateRequest): Promise<boolean> {
    const pass = this.passes.get(updateRequest.passId);
    if (!pass) {
      throw new Error(`Pass not found: ${updateRequest.passId}`);
    }

    // Update fields
    if (updateRequest.fields.headerFields) {
      pass.headerFields = updateRequest.fields.headerFields;
    }
    if (updateRequest.fields.primaryFields) {
      pass.primaryFields = updateRequest.fields.primaryFields;
    }
    if (updateRequest.fields.secondaryFields) {
      pass.secondaryFields = updateRequest.fields.secondaryFields;
    }
    if (updateRequest.fields.auxiliaryFields) {
      pass.auxiliaryFields = updateRequest.fields.auxiliaryFields;
    }
    if (updateRequest.fields.backFields) {
      pass.backFields = updateRequest.fields.backFields;
    }

    // Update other data
    if (updateRequest.barcodes) {
      pass.barcodes = updateRequest.barcodes;
    }
    if (updateRequest.userInfo) {
      pass.userInfo = { ...pass.userInfo, ...updateRequest.userInfo };
    }

    pass.updatedAt = new Date();
    
    // Trigger push notification to update passes in users' wallets
    await this.sendPassUpdate(pass);
    
    console.log(`📱 Updated pass ${updateRequest.passId}`);
    return true;
  }

  /**
   * Get all passes for a client
   */
  getClientPasses(clientId: string): AppleWalletPass[] {
    return Array.from(this.passes.values()).filter(pass => {
      return (pass as any).clientId === clientId;
    });
  }

  /**
   * Get pass by ID
   */
  getPass(passId: string): AppleWalletPass | undefined {
    return this.passes.get(passId);
  }

  /**
   * Revoke a pass
   */
  async revokePass(passId: string): Promise<boolean> {
    const pass = this.passes.get(passId);
    if (!pass) return false;

    pass.voided = true;
    pass.updatedAt = new Date();
    
    await this.sendPassUpdate(pass);
    console.log(`❌ Revoked pass ${passId}`);
    return true;
  }

  /**
   * Get wallet service statistics
   */
  getStatistics(): WalletServiceStats {
    const passes = Array.from(this.passes.values());
    const activePasses = passes.filter(p => !p.voided);
    
    const passByType: Record<string, number> = {};
    passes.forEach(pass => {
      const type = this.getPassTypeFromIdentifier(pass.passTypeIdentifier);
      passByType[type] = (passByType[type] || 0) + 1;
    });

    // Mock recent installs (in production, this would come from Apple's feedback)
    const recentInstalls = Math.floor(Math.random() * 10) + 5;
    const updatesSent = passes.reduce((sum, pass) => {
      return sum + (pass.updatedAt > pass.createdAt ? 1 : 0);
    }, 0);

    return {
      totalPasses: passes.length,
      activepasses: activePasses.length,
      passByType,
      recentInstalls,
      updatesSent,
      lastUpdate: new Date()
    };
  }

  /**
   * Store pass in user's pod
   */
  private async storePassInUserPod(clientId: string, pass: AppleWalletPass): Promise<void> {
    try {
      const userPod = userPodService.getUserPod(clientId);
      if (userPod) {
        // In a real implementation, this would store the pass data in the user's pod
        console.log(`💾 Stored pass ${pass.id} in user pod: ${userPod.containers.wallet}`);
      }
    } catch (error) {
      console.error('Failed to store pass in user pod:', error);
    }
  }

  /**
   * Build health-specific fields for health credentials
   */
  private buildHealthFields(healthData?: HealthCredential['healthData']): Partial<AppleWalletPass> {
    if (!healthData) return {};

    const secondaryFields: PassField[] = [];
    const auxiliaryFields: PassField[] = [];
    const backFields: PassField[] = [];

    if (healthData.bloodType) {
      secondaryFields.push({
        key: 'blood-type',
        label: 'Blood Type',
        value: healthData.bloodType
      });
    }

    if (healthData.allergies && healthData.allergies.length > 0) {
      auxiliaryFields.push({
        key: 'allergies',
        label: 'Allergies',
        value: healthData.allergies.join(', ')
      });
    }

    if (healthData.medications && healthData.medications.length > 0) {
      backFields.push({
        key: 'medications',
        label: 'Current Medications',
        value: healthData.medications.join(', ')
      });
    }

    if (healthData.emergencyContacts && healthData.emergencyContacts.length > 0) {
      const contact = healthData.emergencyContacts[0];
      backFields.push({
        key: 'emergency-contact',
        label: 'Emergency Contact',
        value: `${contact.name} (${contact.relationship}): ${contact.phone}`
      });
    }

    return { secondaryFields, auxiliaryFields, backFields };
  }

  /**
   * Generate authentication token for pass
   */
  private generateAuthToken(passId: string): string {
    // In production, use proper JWT or similar secure token
    const data = `${passId}-${Date.now()}`;
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  /**
   * Generate verification data for health credentials
   */
  private generateVerificationData(clientId: string, credentialType: string): string {
    const data = `${clientId}-${credentialType}-${Date.now()}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Generate biometric hash for identification
   */
  private generateBiometricHash(client: Client): string {
    // In production, this would be a proper biometric hash
    const data = `${client.id}-${client.firstName}-${client.lastName}-${client.dateOfBirth.getTime()}`;
    return Buffer.from(data).toString('base64');
  }

  /**
   * Send push notification for pass updates
   */
  private async sendPassUpdate(pass: AppleWalletPass): Promise<void> {
    // In production, this would send push notifications to Apple's servers
    console.log(`📱 Sending pass update notification for ${pass.serialNumber}`);
  }

  /**
   * Format credential type for display
   */
  private formatCredentialType(type: HealthCredential['credentialType']): string {
    const types = {
      vaccination: 'Vaccination Record',
      medical_id: 'Medical ID',
      insurance: 'Insurance Card',
      prescription: 'Prescription',
      allergy_alert: 'Allergy Alert'
    };
    return types[type] || type;
  }

  /**
   * Format document type for display
   */
  private formatDocumentType(type: IdentificationPass['documentType']): string {
    const types = {
      shelter_id: 'Shelter ID',
      temporary_id: 'Temporary ID',
      service_card: 'Service Card'
    };
    return types[type] || type;
  }

  /**
   * Get pass type from identifier
   */
  private getPassTypeFromIdentifier(identifier: string): string {
    if (identifier.includes('shelter')) return 'Shelter Access';
    if (identifier.includes('health')) return 'Health Credential';
    if (identifier.includes('id')) return 'Identification';
    if (identifier.includes('services')) return 'Service Entitlement';
    if (identifier.includes('emergency')) return 'Emergency Contact';
    return 'Unknown';
  }

  // ========== UNIFIED MODEL METHODS ==========

  /**
   * Determine access level based on pass type
   */
  private determineAccessLevel(passType: WalletPassType): AccessLevel {
    switch (passType) {
      case 'shelter_access': return 'standard';
      case 'health_credential': return 'priority';
      case 'identification': return 'basic';
      case 'service_entitlement': return 'standard';
      case 'emergency_contact': return 'emergency';
      default: return 'basic';
    }
  }

  /**
   * Get unified data type for pass type
   */
  private getDataTypeForPassType(passType: WalletPassType): UnifiedDataType {
    switch (passType) {
      case 'shelter_access': return 'access_records';
      case 'health_credential': return 'health_data';
      case 'identification': return 'personal_identity';
      case 'service_entitlement': return 'service_history';
      case 'emergency_contact': return 'emergency_data';
      default: return 'personal_identity';
    }
  }

  /**
   * Record access event for unified data ownership
   */
  private async recordAccessEvent(
    ownerId: string, 
    action: 'pass_created' | 'pass_used' | 'pass_updated' | 'pass_revoked', 
    passType: WalletPassType, 
    data: any
  ): Promise<void> {
    const recordId = uuidv4();
    const timestamp = new Date();
    
    const accessRecord: UnifiedDataRecord = {
      recordId,
      ownerId,
      dataType: 'access_records',
      data: {
        location: this.config.organizationName,
        accessType: this.getAccessTypeFromAction(action),
        timestamp,
        method: 'wallet_pass',
        authorized: true,
        duration: undefined,
        passType,
        passData: data
      },
      source: {
        system: 'wallet',
        application: 'apple-wallet-service',
        version: '1.0.0',
        timestamp,
        operator: 'system'
      },
      integrity: {
        hash: this.generateDataHash({ action, passType, data }),
        verified: true
      },
      createdAt: timestamp,
      lastUpdated: timestamp,
      version: 1,
      privacyLevel: 'shared',
      accessLog: [{
        timestamp,
        accessor: 'apple-wallet-service',
        action: 'write',
        purpose: 'access_logging',
        authorized: true
      }]
    };

    // Store access record
    const ownerRecords = this.accessRecords.get(ownerId) || [];
    ownerRecords.push(accessRecord);
    this.accessRecords.set(ownerId, ownerRecords);

    console.log(`📋 Recorded access event: ${action} (${passType}) for ${ownerId}`);
  }

  /**
   * Get access type from action
   */
  private getAccessTypeFromAction(action: string): 'entry' | 'exit' | 'service' | 'resource' {
    switch (action) {
      case 'pass_used': return 'entry';
      case 'pass_created': return 'service';
      case 'pass_updated': return 'service';
      case 'pass_revoked': return 'exit';
      default: return 'service';
    }
  }

  /**
   * Create service entitlement pass
   */
  private async createServiceEntitlementPass(client: Client, metadata: PassMetadata): Promise<AppleWalletPass> {
    const passId = uuidv4();
    const serialNumber = `SERVICE-${client.id.toUpperCase()}-${Date.now()}`;

    const pass: AppleWalletPass = {
      id: passId,
      passTypeIdentifier: this.config.passTypeIdentifiers.service_entitlement,
      teamIdentifier: this.config.teamIdentifier,
      organizationName: this.config.organizationName,
      serialNumber,
      formatVersion: 1,
      
      description: metadata.description,
      logoText: 'Services',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(75, 0, 130)',
      labelColor: 'rgb(255, 255, 255)',
      
      generic: {},
      
      headerFields: [{
        key: 'services',
        label: 'Services',
        value: metadata.title
      }],
      primaryFields: [{
        key: 'client-name',
        label: 'Name',
        value: `${client.firstName} ${client.lastName}`
      }],
      secondaryFields: metadata.services.map((service, index) => ({
        key: `service-${index}`,
        label: 'Service',
        value: service
      })),
      auxiliaryFields: [],
      backFields: [{
        key: 'terms',
        label: 'Terms & Conditions',
        value: 'Valid for enrolled services only. Non-transferable.'
      }],
      
      barcodes: [{
        message: JSON.stringify({
          clientId: client.id,
          passId,
          services: metadata.services,
          timestamp: Date.now()
        }),
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: `Services: ${metadata.services.join(', ')}`
      }],
      
      webServiceURL: this.config.webServiceURL,
      authenticationToken: this.generateAuthToken(passId),
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.passes.set(passId, pass);
    return pass;
  }

  /**
   * Create emergency contact pass
   */
  private async createEmergencyContactPass(client: Client, metadata: PassMetadata): Promise<AppleWalletPass> {
    const passId = uuidv4();
    const serialNumber = `EMERGENCY-${client.id.toUpperCase()}-${Date.now()}`;

    const pass: AppleWalletPass = {
      id: passId,
      passTypeIdentifier: this.config.passTypeIdentifiers.emergency_contact,
      teamIdentifier: this.config.teamIdentifier,
      organizationName: this.config.organizationName,
      serialNumber,
      formatVersion: 1,
      
      description: 'Emergency Contact Information',
      logoText: 'Emergency',
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(220, 20, 60)',
      labelColor: 'rgb(255, 255, 255)',
      
      generic: {},
      
      headerFields: [{
        key: 'emergency',
        label: 'Emergency',
        value: 'Contact Info'
      }],
      primaryFields: [{
        key: 'client-name',
        label: 'Name',
        value: `${client.firstName} ${client.lastName}`
      }],
      secondaryFields: metadata.emergencyInfo?.contacts.map((contact, index) => ({
        key: `contact-${index}`,
        label: contact.relationship,
        value: `${contact.name}: ${contact.phone}`
      })) || [],
      auxiliaryFields: [],
      backFields: [
        ...(metadata.emergencyInfo?.medicalAlerts.map((alert, index) => ({
          key: `alert-${index}`,
          label: 'Medical Alert',
          value: alert
        })) || []),
        {
          key: 'instructions',
          label: 'Instructions',
          value: metadata.emergencyInfo?.accessInstructions || 'Show to emergency personnel'
        }
      ],
      
      barcodes: [{
        message: JSON.stringify({
          clientId: client.id,
          emergencyContacts: metadata.emergencyInfo?.contacts || [],
          medicalAlerts: metadata.emergencyInfo?.medicalAlerts || [],
          timestamp: Date.now()
        }),
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: 'Emergency Contact Information'
      }],
      
      webServiceURL: this.config.webServiceURL,
      authenticationToken: this.generateAuthToken(passId),
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.passes.set(passId, pass);
    return pass;
  }

  /**
   * Generate data hash for integrity
   */
  private generateDataHash(data: any): string {
    // Simple hash implementation for demo
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get unified passes for owner
   */
  getUnifiedPasses(ownerId: string): UnifiedWalletPass[] {
    return Array.from(this.unifiedPasses.values()).filter(pass => 
      pass.linkedData.dataReferences.includes(ownerId)
    );
  }

  /**
   * Get access records for owner
   */
  getAccessRecords(ownerId: string): UnifiedDataRecord[] {
    return this.accessRecords.get(ownerId) || [];
  }

  /**
   * Update unified wallet pass
   */
  async updateUnifiedWalletPass(passId: string, updates: Partial<UnifiedWalletPass>): Promise<boolean> {
    const pass = this.unifiedPasses.get(passId);
    if (!pass) return false;

    const updatedPass = { ...pass, ...updates };
    this.unifiedPasses.set(passId, updatedPass);

    // Record the update
    if (pass.linkedData.dataReferences[0]) {
      await this.recordAccessEvent(
        pass.linkedData.dataReferences[0], 
        'pass_updated', 
        pass.passType, 
        { passId, updates }
      );
    }

    console.log(`📱 Updated unified wallet pass: ${passId}`);
    return true;
  }

  /**
   * Revoke unified wallet pass
   */
  async revokeUnifiedWalletPass(passId: string): Promise<boolean> {
    const pass = this.unifiedPasses.get(passId);
    if (!pass) return false;

    pass.status = 'revoked';

    // Record the revocation
    if (pass.linkedData.dataReferences[0]) {
      await this.recordAccessEvent(
        pass.linkedData.dataReferences[0], 
        'pass_revoked', 
        pass.passType, 
        { passId, reason: 'revoked' }
      );
    }

    console.log(`❌ Revoked unified wallet pass: ${passId}`);
    return true;
  }

  /**
   * Rename legacy methods for clarity
   */
  async createLegacyHealthCredential(
    client: Client,
    credentialType: HealthCredential['credentialType'],
    healthData?: HealthCredential['healthData']
  ): Promise<HealthCredential> {
    return this.createHealthCredential(client, credentialType, healthData);
  }

  async createLegacyIdentificationPass(
    client: Client,
    documentType: IdentificationPass['documentType'],
    documentNumber: string,
    photo?: string
  ): Promise<IdentificationPass> {
    return this.createIdentificationPass(client, documentType, documentNumber, photo);
  }
}

export const appleWalletService = new AppleWalletService();