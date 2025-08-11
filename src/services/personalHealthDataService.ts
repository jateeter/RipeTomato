/**
 * Personal Health Data Service
 * 
 * Exposes Apple HealthKit information through personal data stores (Solid Pod/HAT)
 * with privacy controls and client ownership management.
 * 
 * @license MIT
 */

import { healthKitService } from './healthKitService';
import { identityManagementService } from './identityManagementService';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';
import { solidPodService } from './solidPodService';
import { dataswiftHATService } from './dataswiftHATService';

export interface HealthDataExposureConfig {
  clientId: string;
  healthKitEnabled: boolean;
  dataCategories: HealthDataCategory[];
  exposureSettings: DataExposureSettings;
  privacyControls: HealthPrivacyControls;
  syncSettings: HealthSyncSettings;
  accessPermissions: HealthAccessPermission[];
}

export interface HealthDataCategory {
  category: HealthDataCategoryType;
  enabled: boolean;
  dataTypes: HealthDataType[];
  retentionPeriod: number; // days
  anonymizationLevel: 'none' | 'partial' | 'full';
  exportFormats: ('fhir' | 'json' | 'csv' | 'rdf')[];
}

export type HealthDataCategoryType = 
  | 'vitals' 
  | 'fitness' 
  | 'nutrition' 
  | 'sleep' 
  | 'medical' 
  | 'mental_health' 
  | 'reproductive' 
  | 'environmental';

export interface HealthDataType {
  identifier: string;
  displayName: string;
  unit?: string;
  dataType: 'quantity' | 'category' | 'correlation' | 'document' | 'workout';
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
}

export interface DataExposureSettings {
  primaryStore: 'solid_pod' | 'hat' | 'both';
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  batchSize: number;
  compressionEnabled: boolean;
  encryptionRequired: boolean;
  backupEnabled: boolean;
}

export interface HealthPrivacyControls {
  dataMinimization: boolean;
  purposeLimitation: boolean;
  consentRequired: boolean;
  auditLogging: boolean;
  anonymizeBeforeShare: boolean;
  automaticExpiry: boolean;
  geolocationRestriction?: {
    enabled: boolean;
    allowedRegions: string[];
  };
  timeRestriction?: {
    enabled: boolean;
    allowedHours: { start: number; end: number };
  };
}

export interface HealthSyncSettings {
  autoSync: boolean;
  syncOnAppLaunch: boolean;
  syncOnDataChange: boolean;
  conflictResolution: 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
  maxRetries: number;
  batchSyncEnabled: boolean;
}

export interface HealthAccessPermission {
  id: string;
  grantedTo: string; // service, organization, or individual
  dataCategories: HealthDataCategoryType[];
  accessLevel: 'read' | 'read_write' | 'admin';
  purpose: string;
  grantedAt: Date;
  expiresAt?: Date;
  conditions: AccessCondition[];
  revoked?: boolean;
  revokedAt?: Date;
}

export interface AccessCondition {
  type: 'location' | 'time' | 'purpose' | 'frequency' | 'data_range';
  parameters: Record<string, any>;
  description: string;
}

export interface HealthDataExport {
  exportId: string;
  clientId: string;
  dataCategories: HealthDataCategoryType[];
  format: 'fhir' | 'json' | 'csv' | 'rdf';
  dateRange: { start: Date; end: Date };
  anonymizationLevel: 'none' | 'partial' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface HealthDataSync {
  syncId: string;
  clientId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errors: SyncError[];
  progress: number; // 0-100
}

export interface SyncError {
  dataType: string;
  error: string;
  timestamp: Date;
  retryCount: number;
}

class PersonalHealthDataService {
  private configurations: Map<string, HealthDataExposureConfig> = new Map();
  private activeSyncs: Map<string, HealthDataSync> = new Map();
  private exportJobs: Map<string, HealthDataExport> = new Map();

  constructor() {
    this.initializeDefaultHealthDataTypes();
    console.log('🏥 Personal Health Data Service initialized');
  }

  /**
   * Initialize health data exposure for a client
   */
  async initializeHealthDataExposure(
    clientId: string,
    preferences?: Partial<HealthDataExposureConfig>
  ): Promise<HealthDataExposureConfig> {
    try {
      // Check HealthKit availability
      const currentPermissions = healthKitService.getPermissions();
      const authStatus = currentPermissions.length > 0 ? 'authorized' : 'not_authorized';
      
      const defaultConfig: HealthDataExposureConfig = {
        clientId,
        healthKitEnabled: authStatus === 'authorized',
        dataCategories: this.getDefaultDataCategories(),
        exposureSettings: {
          primaryStore: 'solid_pod',
          updateFrequency: 'daily',
          batchSize: 100,
          compressionEnabled: true,
          encryptionRequired: true,
          backupEnabled: true
        },
        privacyControls: {
          dataMinimization: true,
          purposeLimitation: true,
          consentRequired: true,
          auditLogging: true,
          anonymizeBeforeShare: false,
          automaticExpiry: true
        },
        syncSettings: {
          autoSync: true,
          syncOnAppLaunch: true,
          syncOnDataChange: false,
          conflictResolution: 'newest_wins',
          maxRetries: 3,
          batchSyncEnabled: true
        },
        accessPermissions: []
      };

      const config = { ...defaultConfig, ...preferences };
      this.configurations.set(clientId, config);

      // Store configuration
      await unifiedDataOwnershipService.storeData(clientId, 'health_data', {
        configuration: config,
        configuredAt: new Date(),
        version: '1.0'
      });

      console.log(`🏥 Health data exposure initialized for client ${clientId}`);
      return config;

    } catch (error) {
      console.error('Failed to initialize health data exposure:', error);
      throw error;
    }
  }

  /**
   * Request HealthKit authorization and configure data access
   */
  async authorizeHealthKit(
    clientId: string,
    requestedCategories: HealthDataCategoryType[]
  ): Promise<boolean> {
    try {
      // Request HealthKit authorization
      const authorized = await healthKitService.requestPermissions();
      
      if (!authorized) {
        return false;
      }

      // Update configuration
      const config = this.configurations.get(clientId);
      if (config) {
        config.healthKitEnabled = true;
        
        // Enable requested categories
        config.dataCategories.forEach(category => {
          if (requestedCategories.includes(category.category)) {
            category.enabled = true;
          }
        });

        this.configurations.set(clientId, config);

        // Store updated configuration
        await unifiedDataOwnershipService.storeData(clientId, 'health_data', {
          configuration: config,
          updatedAt: new Date()
        });

        // Trigger initial sync if auto-sync is enabled
        if (config.syncSettings.autoSync) {
          this.startHealthDataSync(clientId);
        }
      }

      return true;

    } catch (error) {
      console.error('HealthKit authorization failed:', error);
      return false;
    }
  }

  /**
   * Start syncing health data to personal data stores
   */
  async startHealthDataSync(clientId: string): Promise<string> {
    const config = this.configurations.get(clientId);
    if (!config || !config.healthKitEnabled) {
      throw new Error('Health data not configured or HealthKit not authorized');
    }

    if (this.activeSyncs.has(clientId)) {
      throw new Error('Sync already in progress');
    }

    const syncId = `sync-${clientId}-${Date.now()}`;
    const sync: HealthDataSync = {
      syncId,
      clientId,
      startedAt: new Date(),
      status: 'running',
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      errors: [],
      progress: 0
    };

    this.activeSyncs.set(clientId, sync);

    // Start sync process in background
    this.performHealthDataSync(clientId, sync);

    return syncId;
  }

  /**
   * Export health data in specified format
   */
  async exportHealthData(
    clientId: string,
    categories: HealthDataCategoryType[],
    format: 'fhir' | 'json' | 'csv' | 'rdf',
    dateRange?: { start: Date; end: Date },
    anonymizationLevel: 'none' | 'partial' | 'full' = 'none'
  ): Promise<string> {
    const config = this.configurations.get(clientId);
    if (!config) {
      throw new Error('Health data not configured');
    }

    const exportId = `export-${clientId}-${Date.now()}`;
    const exportJob: HealthDataExport = {
      exportId,
      clientId,
      dataCategories: categories,
      format,
      dateRange: dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      },
      anonymizationLevel,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      createdAt: new Date()
    };

    this.exportJobs.set(exportId, exportJob);

    // Start export process
    this.performHealthDataExport(exportId);

    return exportId;
  }

  /**
   * Grant access to health data
   */
  async grantHealthDataAccess(
    clientId: string,
    grantedTo: string,
    dataCategories: HealthDataCategoryType[],
    accessLevel: 'read' | 'read_write' | 'admin',
    purpose: string,
    expiresAt?: Date,
    conditions: AccessCondition[] = []
  ): Promise<string> {
    const config = this.configurations.get(clientId);
    if (!config) {
      throw new Error('Health data not configured');
    }

    const permission: HealthAccessPermission = {
      id: `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      grantedTo,
      dataCategories,
      accessLevel,
      purpose,
      grantedAt: new Date(),
      expiresAt,
      conditions,
      revoked: false
    };

    config.accessPermissions.push(permission);
    this.configurations.set(clientId, config);

    // Store updated configuration
    await unifiedDataOwnershipService.storeData(clientId, 'health_data', {
      configuration: config,
      updatedAt: new Date()
    });

    // Log access grant
    await unifiedDataOwnershipService.storeData(clientId, 'access_records', {
      action: 'access_granted',
      permissionId: permission.id,
      grantedTo,
      dataCategories,
      accessLevel,
      purpose,
      timestamp: new Date()
    });

    console.log(`🏥 Health data access granted to ${grantedTo} for client ${clientId}`);
    return permission.id;
  }

  /**
   * Revoke health data access
   */
  async revokeHealthDataAccess(clientId: string, permissionId: string): Promise<boolean> {
    const config = this.configurations.get(clientId);
    if (!config) {
      return false;
    }

    const permission = config.accessPermissions.find(p => p.id === permissionId);
    if (!permission || permission.revoked) {
      return false;
    }

    permission.revoked = true;
    permission.revokedAt = new Date();

    this.configurations.set(clientId, config);

    // Store updated configuration
    await unifiedDataOwnershipService.storeData(clientId, 'health_data', {
      configuration: config,
      updatedAt: new Date()
    });

    // Log access revocation
    await unifiedDataOwnershipService.storeData(clientId, 'access_records', {
      action: 'access_revoked',
      permissionId: permission.id,
      grantedTo: permission.grantedTo,
      timestamp: new Date()
    });

    console.log(`🏥 Health data access revoked for permission ${permissionId}`);
    return true;
  }

  /**
   * Get health data configuration
   */
  async getHealthDataConfiguration(clientId: string): Promise<HealthDataExposureConfig | null> {
    let config = this.configurations.get(clientId);
    
    if (!config) {
      try {
        const storedDataArray = await unifiedDataOwnershipService.retrieveData(clientId, 'health_data');
        if (storedDataArray.length > 0 && (storedDataArray[0].data as any)?.configuration) {
          config = (storedDataArray[0].data as any).configuration as HealthDataExposureConfig;
          this.configurations.set(clientId, config);
        }
      } catch (error) {
        console.error('Failed to load health data configuration:', error);
      }
    }

    return config || null;
  }

  /**
   * Update health data configuration
   */
  async updateHealthDataConfiguration(
    clientId: string,
    updates: Partial<HealthDataExposureConfig>
  ): Promise<HealthDataExposureConfig> {
    const config = this.configurations.get(clientId);
    if (!config) {
      throw new Error('Health data configuration not found');
    }

    const updatedConfig = { ...config, ...updates };
    this.configurations.set(clientId, updatedConfig);

    // Store updated configuration
    await unifiedDataOwnershipService.storeData(clientId, 'health_data', {
      configuration: updatedConfig,
      updatedAt: new Date()
    });

    return updatedConfig;
  }

  /**
   * Get sync status
   */
  getSyncStatus(clientId: string): HealthDataSync | null {
    return this.activeSyncs.get(clientId) || null;
  }

  /**
   * Get export status
   */
  getExportStatus(exportId: string): HealthDataExport | null {
    return this.exportJobs.get(exportId) || null;
  }

  /**
   * Get health data access audit log
   */
  async getHealthDataAccessLog(
    clientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    try {
      // This would retrieve audit log entries from the unified data store
      const logRecords = await unifiedDataOwnershipService.retrieveData(clientId, 'access_records');
      return logRecords.map(record => record.data);
    } catch (error) {
      console.error('Failed to retrieve health data access log:', error);
      return [];
    }
  }

  // Private helper methods

  private async performHealthDataSync(clientId: string, sync: HealthDataSync): Promise<void> {
    try {
      const config = this.configurations.get(clientId);
      if (!config) {
        throw new Error('Configuration not found');
      }

      const identityConfig = await identityManagementService.getIdentityConfiguration(clientId);
      if (!identityConfig) {
        throw new Error('Identity configuration not found');
      }

      const enabledCategories = config.dataCategories.filter(c => c.enabled);
      const totalDataTypes = enabledCategories.reduce((sum, cat) => sum + cat.dataTypes.length, 0);
      
      let processedCount = 0;

      for (const category of enabledCategories) {
        for (const dataType of category.dataTypes) {
          if (!dataType.enabled) continue;

          try {
            // Get health data from HealthKit
            const healthData = await healthKitService.syncHealthData(clientId);

            // Apply privacy controls
            const processedData = this.applyPrivacyControls(healthData, config.privacyControls);

            // Store in appropriate data stores
            if (config.exposureSettings.primaryStore === 'solid_pod' || config.exposureSettings.primaryStore === 'both') {
              await this.storeInSolidPod(clientId, category.category, dataType.identifier, processedData);
            }

            if (config.exposureSettings.primaryStore === 'hat' || config.exposureSettings.primaryStore === 'both') {
              await this.storeInHAT(clientId, category.category, dataType.identifier, processedData);
            }

            sync.recordsSuccessful++;
            processedCount++;
            sync.progress = Math.round((processedCount / totalDataTypes) * 100);

          } catch (error) {
            console.error(`Failed to sync ${dataType.identifier}:`, error);
            sync.recordsFailed++;
            sync.errors.push({
              dataType: dataType.identifier,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
              retryCount: 0
            });
          }

          sync.recordsProcessed++;
        }
      }

      sync.status = 'completed';
      sync.completedAt = new Date();
      sync.progress = 100;

      // Store sync result
      await unifiedDataOwnershipService.storeData(clientId, 'health_data', {
        syncResults: sync,
        timestamp: new Date()
      });

      console.log(`🏥 Health data sync completed for client ${clientId}: ${sync.recordsSuccessful}/${sync.recordsProcessed} successful`);

    } catch (error) {
      sync.status = 'failed';
      sync.completedAt = new Date();
      sync.errors.push({
        dataType: 'sync_process',
        error: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date(),
        retryCount: 0
      });

      console.error('Health data sync failed:', error);
    } finally {
      this.activeSyncs.delete(clientId);
    }
  }

  private async performHealthDataExport(exportId: string): Promise<void> {
    const exportJob = this.exportJobs.get(exportId);
    if (!exportJob) {
      return;
    }

    try {
      exportJob.status = 'processing';

      const config = this.configurations.get(exportJob.clientId);
      if (!config) {
        throw new Error('Configuration not found');
      }

      // Collect data for export
      const exportData: Record<string, any> = {};

      for (const categoryType of exportJob.dataCategories) {
        const category = config.dataCategories.find(c => c.category === categoryType);
        if (!category || !category.enabled) continue;

        exportData[categoryType] = {};

        for (const dataType of category.dataTypes) {
          if (!dataType.enabled) continue;

          const healthData = await healthKitService.syncHealthData(exportJob.clientId);

          // Apply anonymization if required
          const processedData = this.applyAnonymization(healthData, exportJob.anonymizationLevel);
          exportData[categoryType][dataType.identifier] = processedData;
        }
      }

      // Format data according to requested format
      const formattedData = this.formatExportData(exportData, exportJob.format);

      // Store export file (in real implementation, this would be stored securely)
      const downloadUrl = await this.storeExportFile(exportId, formattedData);

      exportJob.status = 'completed';
      exportJob.downloadUrl = downloadUrl;

      console.log(`🏥 Health data export completed: ${exportId}`);

    } catch (error) {
      exportJob.status = 'failed';
      console.error('Health data export failed:', error);
    }
  }

  private applyPrivacyControls(data: any[], controls: HealthPrivacyControls): any[] {
    let processedData = [...data];

    if (controls.dataMinimization) {
      // Remove unnecessary fields
      processedData = processedData.map(item => {
        const essential = { value: item.value, date: item.date, unit: item.unit };
        return essential;
      });
    }

    if (controls.anonymizeBeforeShare) {
      // Remove or hash identifying information
      processedData = processedData.map(item => ({
        ...item,
        sourceDevice: 'anonymized',
        metadata: undefined
      }));
    }

    return processedData;
  }

  private applyAnonymization(data: any[], level: 'none' | 'partial' | 'full'): any[] {
    if (level === 'none') return data;

    return data.map(item => {
      if (level === 'partial') {
        return {
          ...item,
          sourceDevice: 'anonymized',
          userId: 'anonymized'
        };
      } else if (level === 'full') {
        return {
          value: item.value,
          date: item.date,
          unit: item.unit
        };
      }
      return item;
    });
  }

  private formatExportData(data: Record<string, any>, format: string): string {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'fhir':
        return this.convertToFHIR(data);
      case 'rdf':
        return this.convertToRDF(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private convertToCSV(data: Record<string, any>): string {
    // Simplified CSV conversion
    const rows: string[] = ['Category,DataType,Value,Date,Unit'];
    
    for (const [category, categoryData] of Object.entries(data)) {
      for (const [dataType, values] of Object.entries(categoryData)) {
        if (Array.isArray(values)) {
          for (const value of values) {
            rows.push(`${category},${dataType},${value.value},${value.date},${value.unit || ''}`);
          }
        }
      }
    }

    return rows.join('\n');
  }

  private convertToFHIR(data: Record<string, any>): string {
    // Simplified FHIR conversion (would need full FHIR specification implementation)
    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: []
    };

    // This would be expanded to create proper FHIR resources
    return JSON.stringify(bundle, null, 2);
  }

  private convertToRDF(data: Record<string, any>): string {
    // Simplified RDF conversion (would need proper RDF library)
    let rdf = '@prefix health: <http://health.example.org/> .\n';
    rdf += '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n\n';

    // This would be expanded to create proper RDF triples
    return rdf;
  }

  private async storeInSolidPod(
    clientId: string,
    category: string,
    dataType: string,
    data: any[]
  ): Promise<void> {
    // This would use the Solid Pod service to store data
    console.log(`Storing in Solid Pod: ${category}/${dataType} (${data.length} records)`);
  }

  private async storeInHAT(
    clientId: string,
    category: string,
    dataType: string,
    data: any[]
  ): Promise<void> {
    // This would use the HAT service to store data
    console.log(`Storing in HAT: ${category}/${dataType} (${data.length} records)`);
  }

  private async storeExportFile(exportId: string, data: string): Promise<string> {
    // In a real implementation, this would store the file securely and return a download URL
    return `https://api.example.com/exports/${exportId}/download`;
  }

  private initializeDefaultHealthDataTypes(): void {
    // This would initialize the default health data types supported by the system
  }

  private getDefaultDataCategories(): HealthDataCategory[] {
    return [
      {
        category: 'vitals',
        enabled: false,
        dataTypes: [
          {
            identifier: 'HKQuantityTypeIdentifierHeartRate',
            displayName: 'Heart Rate',
            unit: 'bpm',
            dataType: 'quantity',
            enabled: false,
            sensitivity: 'medium'
          },
          {
            identifier: 'HKQuantityTypeIdentifierBloodPressure',
            displayName: 'Blood Pressure',
            unit: 'mmHg',
            dataType: 'quantity',
            enabled: false,
            sensitivity: 'high'
          }
        ],
        retentionPeriod: 90,
        anonymizationLevel: 'none',
        exportFormats: ['json', 'fhir', 'csv']
      },
      {
        category: 'fitness',
        enabled: false,
        dataTypes: [
          {
            identifier: 'HKQuantityTypeIdentifierStepCount',
            displayName: 'Step Count',
            unit: 'steps',
            dataType: 'quantity',
            enabled: false,
            sensitivity: 'low'
          },
          {
            identifier: 'HKQuantityTypeIdentifierActiveEnergyBurned',
            displayName: 'Active Energy',
            unit: 'kcal',
            dataType: 'quantity',
            enabled: false,
            sensitivity: 'low'
          }
        ],
        retentionPeriod: 365,
        anonymizationLevel: 'none',
        exportFormats: ['json', 'csv']
      },
      {
        category: 'sleep',
        enabled: false,
        dataTypes: [
          {
            identifier: 'HKCategoryTypeIdentifierSleepAnalysis',
            displayName: 'Sleep Analysis',
            dataType: 'category',
            enabled: false,
            sensitivity: 'medium'
          }
        ],
        retentionPeriod: 30,
        anonymizationLevel: 'none',
        exportFormats: ['json', 'csv']
      }
    ];
  }
}

export const personalHealthDataService = new PersonalHealthDataService();