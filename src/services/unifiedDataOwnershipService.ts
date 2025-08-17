/**
 * Unified Data Ownership Service
 * 
 * This service provides a unified interface for managing individual data ownership
 * across HAT data vaults and Apple Wallet access representations.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UnifiedDataOwner,
  UnifiedDataOwnershipService,
  HATVaultConfig,
  WalletAccessConfig,
  UnifiedWalletPass,
  UnifiedDataRecord,
  DataPermissionSet,
  ConsentRecord,
  WalletPassType,
  PassMetadata,
  UnifiedDataType,
  DataPermission,
  ConsentRequest,
  AccessLogEntry,
  SynchronizationResult,
  IntegrityReport,
  HATVaultStats,
  DataFilter,
  AccessLevel,
  PrivacyLevel,
  DataSource,
  UNIFIED_DATA_TYPES
} from '../types/UnifiedDataOwnership';
import { Client } from '../types/Shelter';
import { dataswiftHATService } from './dataswiftHATService';
import { appleWalletService } from './appleWalletService';

class UnifiedDataOwnershipServiceImpl implements UnifiedDataOwnershipService {
  private dataOwners: Map<string, UnifiedDataOwner> = new Map();
  private dataRecords: Map<string, UnifiedDataRecord[]> = new Map();

  /**
   * Create a new data owner with both HAT vault and wallet access
   */
  async createDataOwner(client: Client): Promise<UnifiedDataOwner> {
    const ownerId = client.id;
    
    console.log(`🔐 Creating unified data owner for ${client.firstName} ${client.lastName}...`);

    try {
      // Provision HAT vault
      const hatVault = await this.provisionHATVault(ownerId);
      console.log(`🎩 HAT vault provisioned: ${hatVault.hatDomain}`);

      // Create wallet access configuration
      const walletAccess = await this.createWalletAccessConfig(client);
      console.log(`📱 Wallet access configured: ${walletAccess.walletId}`);

      // Create unified data permissions
      const dataPermissions = this.createDefaultPermissions(ownerId);

      // Create initial consent records
      const consentRecords = await this.createInitialConsents(client);

      // Create unified data owner
      const dataOwner: UnifiedDataOwner = {
        ownerId,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth,
        hatVault,
        walletAccess,
        dataPermissions,
        consentRecords,
        createdAt: new Date(),
        lastUpdated: new Date(),
        isActive: client.isActive
      };

      // Store the data owner
      this.dataOwners.set(ownerId, dataOwner);

      // Initialize with client's personal data
      await this.storeInitialClientData(dataOwner, client);

      console.log(`✅ Unified data owner created successfully: ${ownerId}`);
      return dataOwner;

    } catch (error) {
      console.error('Failed to create unified data owner:', error);
      throw new Error(`Failed to create data owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a data owner by ID
   */
  async getDataOwner(ownerId: string): Promise<UnifiedDataOwner | null> {
    const owner = this.dataOwners.get(ownerId);
    if (owner) {
      // Update last accessed information
      owner.lastUpdated = new Date();
      return { ...owner }; // Return copy to prevent mutations
    }
    return null;
  }

  /**
   * Update data owner information
   */
  async updateDataOwner(ownerId: string, updates: Partial<UnifiedDataOwner>): Promise<boolean> {
    const owner = this.dataOwners.get(ownerId);
    if (!owner) return false;

    try {
      const updatedOwner = {
        ...owner,
        ...updates,
        lastUpdated: new Date()
      };

      // Sync changes to HAT and Wallet if relevant fields changed
      if (updates.hatVault || updates.walletAccess) {
        await this.synchronizeOwnerData(ownerId);
      }

      this.dataOwners.set(ownerId, updatedOwner);
      console.log(`✅ Data owner updated: ${ownerId}`);
      return true;

    } catch (error) {
      console.error('Failed to update data owner:', error);
      return false;
    }
  }

  /**
   * Delete data owner and all associated data
   */
  async deleteDataOwner(ownerId: string): Promise<boolean> {
    const owner = this.dataOwners.get(ownerId);
    if (!owner) return false;

    try {
      // Revoke all wallet passes
      for (const pass of owner.walletAccess.passes) {
        await this.revokeWalletPass(pass.passId);
      }

      // Archive HAT data (in real implementation, this would properly handle data deletion)
      console.log(`🗑️ Archiving HAT data for owner: ${ownerId}`);

      // Remove from local storage
      this.dataOwners.delete(ownerId);
      this.dataRecords.delete(ownerId);

      console.log(`✅ Data owner deleted: ${ownerId}`);
      return true;

    } catch (error) {
      console.error('Failed to delete data owner:', error);
      return false;
    }
  }

  /**
   * Provision HAT vault for data owner
   */
  async provisionHATVault(ownerId: string): Promise<HATVaultConfig> {
    const owner = this.dataOwners.get(ownerId);
    if (!owner) throw new Error('Data owner not found');

    try {
      // Create HAT domain for the owner
      const hatDomain = await dataswiftHATService.createClientHAT({
        id: ownerId,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        dateOfBirth: owner.dateOfBirth,
        registrationDate: new Date(),
        isActive: owner.isActive,
        identificationVerified: true,
        totalStays: 0,
        preferredBedType: 'standard',
        restrictions: []
      } as Client);

      if (!hatDomain) {
        throw new Error('Failed to create HAT domain');
      }

      const vaultConfig: HATVaultConfig = {
        hatDomain,
        vaultId: `vault-${ownerId}`,
        status: 'active',
        endpoints: Object.keys(UNIFIED_DATA_TYPES).map(dataType => ({
          endpoint: `shelter/${dataType}`,
          dataType: dataType as UnifiedDataType,
          recordCount: 0,
          lastSync: new Date(),
          permissions: []
        })),
        storageQuota: {
          used: 0,
          limit: 1024 * 1024 * 100, // 100MB default
          unit: 'bytes'
        }
      };

      return vaultConfig;

    } catch (error) {
      console.error('Failed to provision HAT vault:', error);
      throw error;
    }
  }

  /**
   * Create wallet access configuration
   */
  private async createWalletAccessConfig(client: Client): Promise<WalletAccessConfig> {
    const walletId = `wallet-${client.id}`;
    const passes: UnifiedWalletPass[] = [];

    try {
      // Create shelter access pass
      const shelterPass = await this.createWalletPass(
        client.id,
        'shelter_access',
        {
          title: 'Idaho Shelter Access',
          description: 'Access to shelter services and facilities',
          issuer: 'Idaho Community Shelter',
          category: 'access',
          services: ['Meals', 'Showers', 'Storage', 'WiFi', 'Counseling'],
          restrictions: client.restrictions || []
        }
      );
      passes.push(shelterPass);

      // Create identification pass
      const idPass = await this.createWalletPass(
        client.id,
        'identification',
        {
          title: 'Shelter ID',
          description: 'Official shelter identification credential',
          issuer: 'Idaho Community Shelter',
          category: 'identity',
          services: []
        }
      );
      passes.push(idPass);

      // Create health credential if medical notes exist
      if (client.medicalNotes) {
        const healthPass = await this.createWalletPass(
          client.id,
          'health_credential',
          {
            title: 'Medical Information',
            description: 'Emergency medical information and contacts',
            issuer: 'Idaho Community Shelter',
            category: 'health',
            services: [],
            emergencyInfo: {
              contacts: client.emergencyContact ? [{
                name: client.emergencyContact.name,
                phone: client.emergencyContact.phone,
                relationship: client.emergencyContact.relationship,
                isPrimary: true
              }] : [],
              medicalAlerts: client.medicalNotes ? [client.medicalNotes] : [],
              accessInstructions: 'Show this pass to medical personnel in emergency'
            }
          }
        );
        passes.push(healthPass);
      }

      const walletConfig: WalletAccessConfig = {
        walletId,
        passes,
        deviceTokens: [],
        lastSync: new Date(),
        status: 'active'
      };

      return walletConfig;

    } catch (error) {
      console.error('Failed to create wallet access configuration:', error);
      throw error;
    }
  }

  /**
   * Create wallet pass with unified modeling
   */
  async createWalletPass(ownerId: string, passType: WalletPassType, metadata: PassMetadata): Promise<UnifiedWalletPass> {
    const passId = uuidv4();
    const serialNumber = `${passType.toUpperCase()}-${ownerId.substring(0, 8)}-${Date.now()}`;

    // Determine access level based on pass type
    let accessLevel: AccessLevel = 'standard';
    if (passType === 'emergency_contact') accessLevel = 'emergency';
    if (passType === 'health_credential') accessLevel = 'priority';

    const pass: UnifiedWalletPass = {
      passId,
      passType,
      serialNumber,
      accessLevel,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      status: 'active',
      metadata,
      linkedData: {
        hatEndpoint: `shelter/${this.getDataTypeForPassType(passType)}`,
        dataReferences: [ownerId]
      }
    };

    // Create the actual Apple Wallet pass
    try {
      const owner = this.dataOwners.get(ownerId);
      if (owner) {
        const client: Client = {
          id: ownerId,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone,
          dateOfBirth: owner.dateOfBirth,
          registrationDate: new Date(),
          isActive: owner.isActive,
          identificationVerified: true,
          totalStays: 0,
          preferredBedType: 'standard',
          restrictions: []
        };

        if (passType === 'shelter_access') {
          await appleWalletService.createShelterPass(client, undefined, metadata.services);
        } else if (passType === 'identification') {
          await appleWalletService.createIdentificationPass(client, 'shelter_id', serialNumber);
        } else if (passType === 'health_credential') {
          await appleWalletService.createHealthCredential(client, 'medical_id', {
            emergencyContacts: metadata.emergencyInfo?.contacts || []
          });
        }
      }
    } catch (error) {
      console.warn('Failed to create Apple Wallet pass artifact:', error);
      // Continue with unified pass creation even if Apple Wallet creation fails
    }

    console.log(`📱 Created unified wallet pass: ${passType} (${serialNumber})`);
    return pass;
  }

  /**
   * Store data with unified modeling
   */
  async storeData<T>(ownerId: string, dataType: UnifiedDataType, data: T): Promise<UnifiedDataRecord<T>> {
    const recordId = uuidv4();
    const timestamp = new Date();

    const record: UnifiedDataRecord<T> = {
      recordId,
      ownerId,
      dataType,
      data,
      source: {
        system: 'shelter',
        application: 'idaho-shelter-management',
        version: '1.0.0',
        timestamp,
        operator: 'system'
      },
      integrity: {
        hash: this.generateDataHash(data),
        verified: true
      },
      createdAt: timestamp,
      lastUpdated: timestamp,
      version: 1,
      privacyLevel: this.getDefaultPrivacyLevel(dataType),
      accessLog: [{
        timestamp,
        accessor: 'system',
        action: 'write',
        purpose: 'data_storage',
        authorized: true
      }],
      hatReference: {
        endpoint: `shelter/${dataType}`,
        recordId: `hat-${recordId}`
      }
    };

    // Store in local registry
    const ownerRecords = this.dataRecords.get(ownerId) || [];
    ownerRecords.push(record);
    this.dataRecords.set(ownerId, ownerRecords);

    // Store in HAT vault
    try {
      const owner = this.dataOwners.get(ownerId);
      if (owner && owner.hatVault.hatDomain) {
        await dataswiftHATService.storeClientData(data as any, owner.hatVault.hatDomain);
      }
    } catch (error) {
      console.warn('Failed to store in HAT vault:', error);
    }

    console.log(`💾 Stored unified data record: ${dataType} for ${ownerId}`);
    return record;
  }

  /**
   * Get data by type (returns just the data, not the full record)
   */
  async getData<T>(ownerId: string, dataType: UnifiedDataType, filters?: DataFilter): Promise<T[] | null> {
    const records = await this.retrieveData<T>(ownerId, dataType, filters);
    if (records.length === 0) {
      return null;
    }
    return records.map(record => record.data);
  }

  /**
   * Retrieve data with unified modeling
   */
  async retrieveData<T>(ownerId: string, dataType: UnifiedDataType, filters?: DataFilter): Promise<UnifiedDataRecord<T>[]> {
    const ownerRecords = this.dataRecords.get(ownerId) || [];
    let filteredRecords = ownerRecords.filter(record => record.dataType === dataType);

    // Apply filters if provided
    if (filters) {
      if (filters.dateRange) {
        filteredRecords = filteredRecords.filter(record => 
          record.createdAt >= filters.dateRange!.from && 
          record.createdAt <= filters.dateRange!.to
        );
      }

      if (filters.privacyLevel) {
        filteredRecords = filteredRecords.filter(record => 
          filters.privacyLevel!.includes(record.privacyLevel)
        );
      }

      if (filters.limit) {
        filteredRecords = filteredRecords.slice(filters.offset || 0, (filters.offset || 0) + filters.limit);
      }
    }

    // Log access
    const timestamp = new Date();
    filteredRecords.forEach(record => {
      record.accessLog.push({
        timestamp,
        accessor: 'system',
        action: 'read',
        purpose: 'data_retrieval',
        authorized: true
      });
    });

    return filteredRecords as UnifiedDataRecord<T>[];
  }

  /**
   * Synchronize data across HAT and Wallet systems
   */
  async synchronizeOwnerData(ownerId: string): Promise<SynchronizationResult> {
    const timestamp = new Date();
    const result: SynchronizationResult = {
      hatSync: { success: true, recordsUpdated: 0, errors: [] },
      walletSync: { success: true, passesUpdated: 0, errors: [] },
      conflictsResolved: 0,
      timestamp
    };

    try {
      const owner = this.dataOwners.get(ownerId);
      if (!owner) throw new Error('Data owner not found');

      // Sync HAT data
      try {
        await this.syncHATData(ownerId);
        result.hatSync.recordsUpdated = this.dataRecords.get(ownerId)?.length || 0;
      } catch (error) {
        result.hatSync.success = false;
        result.hatSync.errors.push(error instanceof Error ? error.message : 'HAT sync failed');
      }

      // Sync Wallet passes
      try {
        await this.syncWalletPasses(ownerId);
        result.walletSync.passesUpdated = owner.walletAccess.passes.length;
      } catch (error) {
        result.walletSync.success = false;
        result.walletSync.errors.push(error instanceof Error ? error.message : 'Wallet sync failed');
      }

      console.log(`🔄 Synchronized data for owner: ${ownerId}`);

    } catch (error) {
      console.error('Failed to synchronize owner data:', error);
      result.hatSync.success = false;
      result.walletSync.success = false;
    }

    return result;
  }

  /**
   * Validate data integrity across systems
   */
  async validateDataIntegrity(ownerId: string): Promise<IntegrityReport> {
    const ownerRecords = this.dataRecords.get(ownerId) || [];
    const report: IntegrityReport = {
      totalRecords: ownerRecords.length,
      validRecords: 0,
      corruptedRecords: [],
      missingReferences: [],
      hashMismatches: [],
      recommendedActions: []
    };

    for (const record of ownerRecords) {
      // Validate hash
      const currentHash = this.generateDataHash(record.data);
      if (currentHash !== record.integrity.hash) {
        report.hashMismatches.push(record.recordId);
      } else {
        report.validRecords++;
      }

      // Check HAT reference
      if (record.hatReference && !record.hatReference.recordId) {
        report.missingReferences.push(record.recordId);
      }
    }

    // Generate recommendations
    if (report.hashMismatches.length > 0) {
      report.recommendedActions.push('Re-verify and update hash values for corrupted records');
    }
    if (report.missingReferences.length > 0) {
      report.recommendedActions.push('Restore missing HAT references');
    }

    return report;
  }

  // Additional interface implementations...
  async syncHATData(ownerId: string): Promise<boolean> {
    // Implementation for HAT data synchronization
    return true;
  }

  async getHATStats(ownerId: string): Promise<HATVaultStats> {
    const ownerRecords = this.dataRecords.get(ownerId) || [];
    const recordsByType: Record<UnifiedDataType, number> = {} as any;
    
    Object.keys(UNIFIED_DATA_TYPES).forEach(type => {
      recordsByType[type as UnifiedDataType] = ownerRecords.filter(r => r.dataType === type).length;
    });

    return {
      totalRecords: ownerRecords.length,
      recordsByType,
      storageUsed: ownerRecords.length * 1024, // Approximate
      lastBackup: new Date(),
      syncStatus: 'current'
    };
  }

  async updateWalletPass(passId: string, updates: Partial<UnifiedWalletPass>): Promise<boolean> {
    // Find owner with this pass
    for (const [, owner] of Array.from(this.dataOwners.entries())) {
      const passIndex = owner.walletAccess.passes.findIndex((p: UnifiedWalletPass) => p.passId === passId);
      if (passIndex !== -1) {
        owner.walletAccess.passes[passIndex] = {
          ...owner.walletAccess.passes[passIndex],
          ...updates
        };
        return true;
      }
    }
    return false;
  }

  async revokeWalletPass(passId: string): Promise<boolean> {
    return this.updateWalletPass(passId, { status: 'revoked' });
  }

  async syncWalletPasses(ownerId: string): Promise<boolean> {
    const owner = this.dataOwners.get(ownerId);
    if (!owner) return false;
    
    owner.walletAccess.lastSync = new Date();
    return true;
  }

  async shareData(recordId: string, recipient: string, permissions: DataPermission): Promise<boolean> {
    // Implementation for data sharing
    console.log(`🔗 Sharing data record ${recordId} with ${recipient}`);
    return true;
  }

  async deleteData(recordId: string): Promise<boolean> {
    // Find and remove record
    for (const [, records] of Array.from(this.dataRecords.entries())) {
      const index = records.findIndex((r: UnifiedDataRecord) => r.recordId === recordId);
      if (index !== -1) {
        records.splice(index, 1);
        console.log(`🗑️ Deleted data record: ${recordId}`);
        return true;
      }
    }
    return false;
  }

  async requestConsent(ownerId: string, request: ConsentRequest): Promise<ConsentRecord> {
    const consentId = uuidv4();
    const timestamp = new Date();

    const consent: ConsentRecord = {
      consentId,
      ownerId,
      grantee: request.requester,
      purpose: request.purpose,
      dataTypes: request.dataTypes,
      consentText: `Consent to share ${request.dataTypes.join(', ')} data for ${request.purpose}`,
      legalBasis: request.legalBasis,
      jurisdiction: 'US-ID',
      language: 'en',
      grantedAt: timestamp,
      renewalRequired: true,
      evidence: {
        method: 'digital_signature',
        timestamp
      },
      status: 'active'
    };

    // Add to owner's consent records
    const owner = this.dataOwners.get(ownerId);
    if (owner) {
      owner.consentRecords.push(consent);
    }

    return consent;
  }

  async grantPermission(ownerId: string, permission: DataPermission): Promise<boolean> {
    const owner = this.dataOwners.get(ownerId);
    if (!owner) return false;

    owner.dataPermissions.permissions.push(permission);
    return true;
  }

  async revokePermission(permissionId: string): Promise<boolean> {
    for (const [, owner] of Array.from(this.dataOwners.entries())) {
      const index = owner.dataPermissions.permissions.findIndex((p: DataPermission) => p.permissionId === permissionId);
      if (index !== -1) {
        owner.dataPermissions.permissions[index].status = 'revoked';
        return true;
      }
    }
    return false;
  }

  async auditAccess(ownerId: string, timeRange?: { from: Date; to: Date }): Promise<AccessLogEntry[]> {
    const ownerRecords = this.dataRecords.get(ownerId) || [];
    let allLogs: AccessLogEntry[] = [];

    ownerRecords.forEach(record => {
      allLogs = allLogs.concat(record.accessLog);
    });

    if (timeRange) {
      allLogs = allLogs.filter(log => 
        log.timestamp >= timeRange.from && log.timestamp <= timeRange.to
      );
    }

    return allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async exportOwnerData(ownerId: string, format: 'json' | 'xml' | 'csv'): Promise<string> {
    const owner = this.dataOwners.get(ownerId);
    const records = this.dataRecords.get(ownerId) || [];

    const exportData = {
      owner,
      records,
      exportedAt: new Date(),
      format
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      // For demo, return JSON for other formats too
      return JSON.stringify(exportData, null, 2);
    }
  }

  // Private helper methods
  private async storeInitialClientData(owner: UnifiedDataOwner, client: Client): Promise<void> {
    // Store personal identity data
    await this.storeData(owner.ownerId, 'personal_identity', {
      firstName: client.firstName,
      lastName: client.lastName,
      dateOfBirth: client.dateOfBirth.toISOString(),
      email: client.email,
      phone: client.phone,
      identificationNumbers: {},
      addresses: []
    });

    // Store shelter record data
    await this.storeData(owner.ownerId, 'shelter_records', {
      shelterName: 'Idaho Community Shelter',
      clientId: client.id,
      bedType: client.preferredBedType || 'standard',
      checkInDate: client.registrationDate,
      services: ['Basic Services'],
      restrictions: client.restrictions || [],
      notes: client.medicalNotes || client.behavioralNotes
    });

    // Store health data if available
    if (client.medicalNotes || client.emergencyContact) {
      await this.storeData(owner.ownerId, 'health_data', {
        recordType: 'condition' as const,
        timestamp: new Date(),
        data: {
          medicalNotes: client.medicalNotes,
          emergencyContact: client.emergencyContact
        },
        verified: false
      });
    }
  }

  private createDefaultPermissions(ownerId: string): DataPermissionSet {
    return {
      owner: ownerId,
      permissions: [],
      defaultPolicy: {
        defaultAccess: 'deny',
        requireConsent: true,
        auditLevel: 'comprehensive',
        retentionPeriod: 365
      },
      lastReview: new Date(),
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };
  }

  private async createInitialConsents(client: Client): Promise<ConsentRecord[]> {
    const consentId = uuidv4();
    const timestamp = new Date();

    return [{
      consentId,
      ownerId: client.id,
      grantee: 'Idaho Community Shelter',
      purpose: 'Shelter service provision',
      dataTypes: ['personal_identity', 'shelter_records', 'health_data'],
      consentText: 'I consent to the Idaho Community Shelter storing and processing my personal data for the purpose of providing shelter services.',
      legalBasis: 'consent',
      jurisdiction: 'US-ID',
      language: 'en',
      grantedAt: timestamp,
      renewalRequired: true,
      evidence: {
        method: 'digital_signature',
        timestamp
      },
      status: 'active'
    }];
  }

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

  private getDefaultPrivacyLevel(dataType: UnifiedDataType): PrivacyLevel {
    switch (dataType) {
      case 'personal_identity': return 'private';
      case 'health_data': return 'encrypted';
      case 'emergency_data': return 'encrypted';
      case 'communication_logs': return 'private';
      case 'consent_records': return 'zero_knowledge';
      default: return 'shared';
    }
  }

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
}

export const unifiedDataOwnershipService = new UnifiedDataOwnershipServiceImpl();