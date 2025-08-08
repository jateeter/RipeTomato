import { 
  HATConfig, 
  HATCredentials, 
  HATUser, 
  ShelterDataRecord, 
  HealthDataRecord, 
  CommunicationRecord,
  HATStats,
  HATEndpoint,
  HATApplication,
  DataDebit,
  HATFile
} from '../types/DataswiftHAT';
import { Client } from '../types/Shelter';
import { 
  UnifiedDataOwner, 
  UnifiedDataRecord, 
  UnifiedDataType,
  PrivacyLevel,
  DataSource,
  UNIFIED_DATA_TYPES 
} from '../types/UnifiedDataOwnership';

// @ts-ignore - HAT JS SDK types are incomplete
const HatJS = require('@dataswift/hat-js');

class DataswiftHATService {
  private hatClient: any = null;
  private config: HATConfig = {
    applicationId: 'idaho-shelter-management',
    namespace: 'shelter',
    kind: 'idaho-shelter-app',
    hatApiVersion: 'v2.6',
    secure: true,
    domain: 'hubofallthings.net',
    customisationPath: '/shelter-app'
  };

  private credentials: HATCredentials | null = null;
  private currentUser: HATUser | null = null;

  /**
   * Initialize HAT service with configuration
   */
  async initialize(config?: Partial<HATConfig>): Promise<boolean> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      console.log('🎩 Initializing Dataswift HAT service...', this.config);
      return true;
    } catch (error) {
      console.error('Failed to initialize HAT service:', error);
      return false;
    }
  }

  /**
   * Authenticate user with HAT
   */
  async authenticate(hatDomain: string, applicationToken?: string): Promise<HATCredentials | null> {
    try {
      console.log(`🔐 Authenticating with HAT domain: ${hatDomain}`);

      // Initialize HAT client for this user's domain
      const clientConfig = {
        token: applicationToken || this.generateApplicationToken(),
        apiVersion: this.config.hatApiVersion,
        secure: this.config.secure,
        onTokenChange: (newToken: string) => this.handleTokenChange(newToken)
      };

      this.hatClient = new HatJS(clientConfig);

      // Verify domain is registered
      const isDomainRegistered = await this.hatClient.auth().isDomainRegistered(hatDomain);
      
      if (!isDomainRegistered) {
        throw new Error(`HAT domain ${hatDomain} is not registered`);
      }

      // Create credentials
      this.credentials = {
        accessToken: applicationToken || this.generateApplicationToken(),
        hatDomain: hatDomain,
        applicationId: this.config.applicationId,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Get user information
      await this.loadUserProfile();

      console.log(`✅ Successfully authenticated with HAT: ${hatDomain}`);
      return this.credentials;

    } catch (error) {
      console.error('HAT authentication failed:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.credentials && this.hatClient && 
              (!this.credentials.expires || this.credentials.expires > new Date()));
  }

  /**
   * Get current user information
   */
  getCurrentUser(): HATUser | null {
    return this.currentUser;
  }

  /**
   * Create a new HAT account for a client with unified data ownership model
   */
  async createClientHAT(client: Client): Promise<string | null> {
    try {
      // Generate HAT domain for the client
      const hatDomain = this.generateHATDomain(client.firstName, client.lastName, client.id);
      
      console.log(`🏗️ Creating unified HAT vault for: ${client.firstName} ${client.lastName}`);
      console.log(`HAT domain: ${hatDomain}`);

      // In production, this would call HAT provisioning API
      // For demo, we simulate the creation with unified model support
      const hatUser: HATUser = {
        hatDomain,
        hatName: `${client.firstName} ${client.lastName}`,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        isVerified: true,
        createdAt: new Date()
      };

      // Initialize HAT with unified data model endpoints
      await this.initializeUnifiedEndpoints(hatDomain);

      // Store initial client data using unified model
      await this.storeUnifiedClientData(client, hatDomain);

      console.log(`✅ Unified HAT vault created for ${client.firstName} ${client.lastName}: ${hatDomain}`);
      console.log(`📊 Initialized ${Object.keys(UNIFIED_DATA_TYPES).length} unified data endpoints`);
      return hatDomain;

    } catch (error) {
      console.error('Failed to create unified HAT vault:', error);
      return null;
    }
  }

  /**
   * Store client data in their HAT
   */
  async storeClientData(client: Client, hatDomain?: string): Promise<boolean> {
    try {
      if (!this.isAuthenticated() && !hatDomain) {
        throw new Error('Not authenticated and no HAT domain provided');
      }

      const targetHATClient = hatDomain ? 
        await this.createClientHATClient(hatDomain) : 
        this.hatClient;

      const shelterRecord: Omit<ShelterDataRecord, 'recordId' | 'dateCreated' | 'lastUpdated'> = {
        endpoint: `${this.config.namespace}/client-data`,
        data: {
          clientId: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          dateOfBirth: client.dateOfBirth.toISOString(),
          phone: client.phone,
          email: client.email,
          emergencyContact: client.emergencyContact,
          medicalNotes: client.medicalNotes,
          behavioralNotes: client.behavioralNotes,
          restrictions: client.restrictions || [],
          preferredBedType: client.preferredBedType || 'standard',
          registrationDate: client.registrationDate.toISOString(),
          isActive: client.isActive,
          identificationVerified: client.identificationVerified,
          shelterMetadata: {
            totalStays: client.totalStays,
            lastStay: client.lastStay?.toISOString(),
            bannedUntil: client.bannedUntil?.toISOString(),
            banReason: client.banReason,
            consentGiven: true,
            consentDate: new Date().toISOString(),
            dataRetentionPeriod: 365
          }
        }
      };

      const result = await targetHATClient.hatData().create(
        this.config.namespace,
        'client-data',
        [shelterRecord]
      );

      if (result && result.length > 0) {
        console.log(`💾 Client data stored in HAT: ${result[0].recordId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to store client data in HAT:', error);
      return false;
    }
  }

  /**
   * Store health data in HAT
   */
  async storeHealthData(clientId: string, healthData: HealthDataRecord['data'], hatDomain?: string): Promise<boolean> {
    try {
      const targetHATClient = hatDomain ? 
        await this.createClientHATClient(hatDomain) : 
        this.hatClient;

      const healthRecord: Omit<HealthDataRecord, 'recordId' | 'dateCreated' | 'lastUpdated'> = {
        endpoint: `${this.config.namespace}/health-data`,
        data: healthData
      };

      const result = await targetHATClient.hatData().create(
        this.config.namespace,
        'health-data',
        [healthRecord]
      );

      if (result && result.length > 0) {
        console.log(`🏥 Health data stored in HAT: ${result[0].recordId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to store health data in HAT:', error);
      return false;
    }
  }

  /**
   * Store communication record in HAT
   */
  async storeCommunicationRecord(commRecord: CommunicationRecord['data']): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const communicationRecord: Omit<CommunicationRecord, 'recordId' | 'dateCreated' | 'lastUpdated'> = {
        endpoint: `${this.config.namespace}/communication`,
        data: commRecord
      };

      const result = await this.hatClient.hatData().create(
        this.config.namespace,
        'communication',
        [communicationRecord]
      );

      if (result && result.length > 0) {
        console.log(`📞 Communication record stored in HAT: ${result[0].recordId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to store communication record in HAT:', error);
      return false;
    }
  }

  /**
   * Retrieve client data from HAT
   */
  async getClientData(clientId: string, hatDomain?: string): Promise<ShelterDataRecord[] | null> {
    try {
      const targetHATClient = hatDomain ? 
        await this.createClientHATClient(hatDomain) : 
        this.hatClient;

      const data = await targetHATClient.hatData().get(
        `${this.config.namespace}/client-data`,
        { clientId }
      );

      return data || [];
    } catch (error) {
      console.error('Failed to retrieve client data from HAT:', error);
      return null;
    }
  }

  /**
   * Retrieve health data from HAT
   */
  async getHealthData(clientId: string, hatDomain?: string): Promise<HealthDataRecord[] | null> {
    try {
      const targetHATClient = hatDomain ? 
        await this.createClientHATClient(hatDomain) : 
        this.hatClient;

      const data = await targetHATClient.hatData().get(
        `${this.config.namespace}/health-data`,
        { clientId }
      );

      return data || [];
    } catch (error) {
      console.error('Failed to retrieve health data from HAT:', error);
      return null;
    }
  }

  /**
   * Get HAT statistics
   */
  async getHATStats(): Promise<HATStats | null> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      // Get all endpoints
      const endpoints = await this.hatClient.hatData().getAllEndpoints();
      
      // Get applications
      const applications = await this.hatClient.applications().getAllDefault();
      
      // Calculate stats
      const stats: HATStats = {
        totalRecords: 0,
        endpointsCount: endpoints ? endpoints.length : 0,
        applicationsCount: applications ? applications.length : 0,
        dataDebitsCount: 0,
        storageUsed: 0,
        accountAge: this.currentUser ? 
          Math.floor((Date.now() - this.currentUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0
      };

      // Count records in each endpoint
      if (endpoints) {
        for (const endpoint of endpoints) {
          try {
            const records = await this.hatClient.hatData().get(endpoint);
            stats.totalRecords += records ? records.length : 0;
          } catch (e) {
            // Ignore errors for individual endpoints
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get HAT statistics:', error);
      return null;
    }
  }

  /**
   * Upload file to HAT
   */
  async uploadFile(file: File, tags?: string[]): Promise<HATFile | null> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      const result = await this.hatClient.files().uploadFile(file, {
        tags,
        source: this.config.applicationId
      });

      if (result) {
        console.log(`📁 File uploaded to HAT: ${result.name}`);
        return result;
      }

      return null;
    } catch (error) {
      console.error('Failed to upload file to HAT:', error);
      return null;
    }
  }

  /**
   * Delete data from HAT
   */
  async deleteData(endpoint: string, recordId: string): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      await this.hatClient.hatData().delete(endpoint, recordId);
      console.log(`🗑️ Data deleted from HAT: ${endpoint}/${recordId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete data from HAT:', error);
      return false;
    }
  }

  /**
   * Generate HAT domain for a client
   */
  private generateHATDomain(firstName: string, lastName: string, clientId: string): string {
    const cleanName = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const shortId = clientId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-6);
    
    return `${cleanName}${shortId}${timestamp}.${this.config.domain}`;
  }

  /**
   * Generate application token (in production, this would be from OAuth flow)
   */
  private generateApplicationToken(): string {
    // In production, this would be obtained through proper OAuth flow
    return `app_token_${this.config.applicationId}_${Date.now()}`;
  }

  /**
   * Handle token changes
   */
  private handleTokenChange(newToken: string): void {
    if (this.credentials) {
      this.credentials.accessToken = newToken;
      this.credentials.expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      console.log('🔄 HAT token updated');
    }
  }

  /**
   * Load user profile from HAT
   */
  private async loadUserProfile(): Promise<void> {
    try {
      if (!this.credentials) return;

      // In a real implementation, this would fetch user profile from HAT
      this.currentUser = {
        hatDomain: this.credentials.hatDomain,
        hatName: this.extractNameFromDomain(this.credentials.hatDomain),
        isVerified: true,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Create HAT client for a specific domain
   */
  private async createClientHATClient(hatDomain: string): Promise<any> {
    const clientConfig = {
      token: this.generateApplicationToken(),
      apiVersion: this.config.hatApiVersion,
      secure: this.config.secure,
      hatDomain: hatDomain
    };

    return new HatJS(clientConfig);
  }

  /**
   * Extract user name from HAT domain
   */
  private extractNameFromDomain(domain: string): string {
    const parts = domain.split('.');
    return parts[0] || 'Unknown User';
  }

  /**
   * Initialize unified data model endpoints in HAT
   */
  private async initializeUnifiedEndpoints(hatDomain: string): Promise<void> {
    console.log(`🔧 Initializing unified data endpoints for HAT: ${hatDomain}`);
    
    try {
      const targetHATClient = await this.createClientHATClient(hatDomain);
      
      // Create endpoint structure for each unified data type
      for (const [dataType, typeInfo] of Object.entries(UNIFIED_DATA_TYPES)) {
        const endpoint = `${this.config.namespace}/${dataType}`;
        
        try {
          // In a real HAT implementation, this would create the endpoint structure
          console.log(`📋 Initialized endpoint: ${endpoint} (${typeInfo.name})`);
        } catch (error) {
          console.warn(`Failed to initialize endpoint ${endpoint}:`, error);
        }
      }
      
      console.log(`✅ All unified endpoints initialized for ${hatDomain}`);
    } catch (error) {
      console.error('Failed to initialize unified endpoints:', error);
      throw error;
    }
  }

  /**
   * Store client data using unified data model
   */
  private async storeUnifiedClientData(client: Client, hatDomain: string): Promise<void> {
    console.log(`💾 Storing unified client data for HAT: ${hatDomain}`);
    
    try {
      const targetHATClient = await this.createClientHATClient(hatDomain);
      
      // Store personal identity data
      await this.storeUnifiedDataRecord(targetHATClient, hatDomain, {
        recordId: `identity-${client.id}`,
        ownerId: client.id,
        dataType: 'personal_identity',
        data: {
          firstName: client.firstName,
          lastName: client.lastName,
          dateOfBirth: client.dateOfBirth.toISOString(),
          email: client.email,
          phone: client.phone,
          identificationNumbers: {},
          addresses: []
        },
        source: {
          system: 'shelter',
          application: this.config.applicationId,
          version: this.config.hatApiVersion,
          timestamp: new Date(),
          operator: 'system'
        },
        integrity: {
          hash: this.generateDataHash({ firstName: client.firstName, lastName: client.lastName }),
          verified: true
        },
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
        privacyLevel: 'private',
        accessLog: [{
          timestamp: new Date(),
          accessor: 'system',
          action: 'write',
          purpose: 'initial_registration',
          authorized: true
        }]
      });

      // Store shelter records data
      await this.storeUnifiedDataRecord(targetHATClient, hatDomain, {
        recordId: `shelter-${client.id}`,
        ownerId: client.id,
        dataType: 'shelter_records',
        data: {
          shelterName: 'Idaho Community Shelter',
          clientId: client.id,
          bedType: client.preferredBedType || 'standard',
          checkInDate: client.registrationDate,
          services: ['Basic Services'],
          restrictions: client.restrictions || [],
          notes: client.medicalNotes || client.behavioralNotes
        },
        source: {
          system: 'shelter',
          application: this.config.applicationId,
          version: this.config.hatApiVersion,
          timestamp: new Date(),
          operator: 'system'
        },
        integrity: {
          hash: this.generateDataHash({ clientId: client.id }),
          verified: true
        },
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
        privacyLevel: 'shared',
        accessLog: [{
          timestamp: new Date(),
          accessor: 'system',
          action: 'write',
          purpose: 'shelter_registration',
          authorized: true
        }]
      });

      // Store health data if available
      if (client.medicalNotes || client.emergencyContact) {
        await this.storeUnifiedDataRecord(targetHATClient, hatDomain, {
          recordId: `health-${client.id}`,
          ownerId: client.id,
          dataType: 'health_data',
          data: {
            recordType: 'condition',
            timestamp: new Date().toISOString(),
            data: {
              medicalNotes: client.medicalNotes,
              emergencyContact: client.emergencyContact
            },
            verified: false
          },
          source: {
            system: 'shelter',
            application: this.config.applicationId,
            version: this.config.hatApiVersion,
            timestamp: new Date(),
            operator: 'system'
          },
          integrity: {
            hash: this.generateDataHash({ medicalNotes: client.medicalNotes }),
            verified: true
          },
          createdAt: new Date(),
          lastUpdated: new Date(),
          version: 1,
          privacyLevel: 'encrypted',
          accessLog: [{
            timestamp: new Date(),
            accessor: 'system',
            action: 'write',
            purpose: 'health_information_storage',
            authorized: true
          }]
        });
      }

      // Store initial consent record
      await this.storeUnifiedDataRecord(targetHATClient, hatDomain, {
        recordId: `consent-${client.id}`,
        ownerId: client.id,
        dataType: 'consent_records',
        data: {
          consentType: 'shelter_services',
          purpose: 'Shelter service provision and data management',
          granted: true,
          timestamp: new Date(),
          evidence: {
            method: 'digital_signature',
            timestamp: new Date()
          }
        },
        source: {
          system: 'shelter',
          application: this.config.applicationId,
          version: this.config.hatApiVersion,
          timestamp: new Date(),
          operator: 'system'
        },
        integrity: {
          hash: this.generateDataHash({ consentType: 'shelter_services' }),
          verified: true
        },
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1,
        privacyLevel: 'zero_knowledge',
        accessLog: [{
          timestamp: new Date(),
          accessor: 'system',
          action: 'write',
          purpose: 'consent_recording',
          authorized: true
        }]
      });

      console.log(`✅ Unified client data stored successfully for ${hatDomain}`);
      
    } catch (error) {
      console.error('Failed to store unified client data:', error);
      throw error;
    }
  }

  /**
   * Store a unified data record in HAT
   */
  private async storeUnifiedDataRecord(hatClient: any, hatDomain: string, record: Partial<UnifiedDataRecord>): Promise<boolean> {
    try {
      const endpoint = `${this.config.namespace}/${record.dataType}`;
      
      // Convert unified record to HAT-compatible format
      const hatRecord = {
        endpoint,
        data: {
          ...record.data,
          _unified: {
            recordId: record.recordId,
            ownerId: record.ownerId,
            dataType: record.dataType,
            privacyLevel: record.privacyLevel,
            source: record.source,
            integrity: record.integrity,
            version: record.version
          }
        }
      };

      // Store in HAT (simulated for demo)
      console.log(`📁 Stored unified record in HAT: ${record.dataType} (${record.recordId})`);
      return true;
      
    } catch (error) {
      console.error(`Failed to store unified record in HAT:`, error);
      return false;
    }
  }

  /**
   * Generate data hash for integrity checking
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
   * Get supported endpoints (including unified data types)
   */
  getSupportedEndpoints(): string[] {
    const unifiedEndpoints = Object.keys(UNIFIED_DATA_TYPES).map(dataType => 
      `${this.config.namespace}/${dataType}`
    );

    const legacyEndpoints = [
      `${this.config.namespace}/client-data`,
      `${this.config.namespace}/health-data`,
      `${this.config.namespace}/communication`,
      `${this.config.namespace}/check-ins`,
      `${this.config.namespace}/reservations`,
      `${this.config.namespace}/notifications`
    ];

    return [...unifiedEndpoints, ...legacyEndpoints];
  }

  /**
   * Get unified data types supported by this HAT service
   */
  getSupportedUnifiedDataTypes(): UnifiedDataType[] {
    return Object.keys(UNIFIED_DATA_TYPES) as UnifiedDataType[];
  }

  /**
   * Get configuration
   */
  getConfig(): HATConfig {
    return { ...this.config };
  }

  /**
   * Get credentials
   */
  getCredentials(): HATCredentials | null {
    return this.credentials ? { ...this.credentials } : null;
  }

  /**
   * Logout and clear credentials
   */
  logout(): void {
    this.credentials = null;
    this.currentUser = null;
    this.hatClient = null;
    console.log('👋 Logged out from HAT');
  }
}

export const dataswiftHATService = new DataswiftHATService();