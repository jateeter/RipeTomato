/**
 * Identity Management Service
 * 
 * Unified service for managing Solid Pod and HAT identity providers,
 * providing seamless integration for personal data management.
 * 
 * @license MIT
 */

import { solidAuthService } from './solidAuthService';
import { dataswiftHATService } from './dataswiftHATService';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';
import { UnifiedDataOwner } from '../types/UnifiedDataOwnership';

export interface IdentityProvider {
  id: string;
  name: string;
  type: 'solid' | 'hat';
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  endpoint?: string;
  capabilities: IdentityCapability[];
  lastSync?: Date;
  errorMessage?: string;
}

export interface IdentityCapability {
  name: string;
  description: string;
  available: boolean;
  dataTypes: string[];
}

export interface IdentityConfiguration {
  clientId: string;
  providers: IdentityProvider[];
  primaryProvider?: string;
  syncEnabled: boolean;
  syncFrequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  dataMapping: DataMappingRule[];
  conflictResolution: 'primary_wins' | 'newest_wins' | 'manual_review';
}

export interface DataMappingRule {
  sourceProvider: string;
  targetProvider: string;
  dataType: string;
  transformation?: DataTransformation;
  conditions: MappingCondition[];
}

export interface DataTransformation {
  type: 'format_change' | 'field_mapping' | 'value_conversion';
  rules: Record<string, any>;
}

export interface MappingCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface SyncResult {
  success: boolean;
  providersSync: ProviderSyncResult[];
  conflicts: DataConflict[];
  summary: SyncSummary;
}

export interface ProviderSyncResult {
  providerId: string;
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  lastSync: Date;
}

export interface DataConflict {
  id: string;
  dataType: string;
  providers: string[];
  values: Record<string, any>;
  resolution?: 'resolved' | 'pending';
  resolvedValue?: any;
}

export interface SyncSummary {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  conflictsFound: number;
  duration: number; // milliseconds
}

class IdentityManagementService {
  private configurations: Map<string, IdentityConfiguration> = new Map();
  private syncInProgress: Set<string> = new Set();

  constructor() {
    console.log('🔐 Identity Management Service initialized');
  }

  /**
   * Initialize identity management for a client
   */
  async initializeIdentityManagement(clientId: string): Promise<IdentityConfiguration> {
    try {
      const config: IdentityConfiguration = {
        clientId,
        providers: [],
        syncEnabled: false,
        syncFrequency: 'daily',
        dataMapping: [],
        conflictResolution: 'newest_wins'
      };

      // Check for existing Solid Pod connection
      const solidSessionInfo = solidAuthService.getSessionInfo();
      if (solidSessionInfo.isLoggedIn) {
        const solidProvider: IdentityProvider = {
          id: 'solid-pod',
          name: 'Solid Pod',
          type: 'solid',
          status: 'connected',
          endpoint: solidSessionInfo.webId,
          capabilities: await this.getSolidCapabilities(),
          lastSync: new Date()
        };
        config.providers.push(solidProvider);
        config.primaryProvider = 'solid-pod';
      } else {
        config.providers.push({
          id: 'solid-pod',
          name: 'Solid Pod',
          type: 'solid',
          status: 'disconnected',
          capabilities: await this.getSolidCapabilities()
        });
      }

      // Check for existing HAT connection (simplified)
      try {
        const hatStats = await dataswiftHATService.getHATStats();
        const hatStatus = { isConnected: !!hatStats, hatAddress: 'connected' };
        if (hatStatus.isConnected) {
          const hatProvider: IdentityProvider = {
            id: 'dataswift-hat',
            name: 'Dataswift HAT',
            type: 'hat',
            status: 'connected',
            endpoint: hatStatus.hatAddress,
            capabilities: await this.getHATCapabilities(),
            lastSync: new Date()
          };
          config.providers.push(hatProvider);
          if (!config.primaryProvider) {
            config.primaryProvider = 'dataswift-hat';
          }
        }
      } catch (error) {
        config.providers.push({
          id: 'dataswift-hat',
          name: 'Dataswift HAT',
          type: 'hat',
          status: 'disconnected',
          capabilities: await this.getHATCapabilities()
        });
      }

      // Setup default data mapping rules
      config.dataMapping = this.createDefaultDataMappings();

      this.configurations.set(clientId, config);

      // Store configuration in unified data system
      await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
        configuration: config,
        configuredAt: new Date(),
        version: '1.0'
      });

      console.log(`🔐 Identity management initialized for client ${clientId}`);
      return config;

    } catch (error) {
      console.error('Failed to initialize identity management:', error);
      throw error;
    }
  }

  /**
   * Connect to a Solid Pod
   */
  async connectSolidPod(clientId: string, providerUrl?: string): Promise<boolean> {
    try {
      const config = this.configurations.get(clientId);
      if (!config) {
        throw new Error('Identity configuration not found');
      }

      // Update provider status
      const solidProvider = config.providers.find(p => p.id === 'solid-pod');
      if (solidProvider) {
        solidProvider.status = 'connecting';
      }

      // Attempt Solid Pod connection
      await solidAuthService.login(providerUrl);
      const sessionInfo = solidAuthService.getSessionInfo();

      if (sessionInfo.isLoggedIn) {
        if (solidProvider) {
          solidProvider.status = 'connected';
          solidProvider.endpoint = sessionInfo.webId;
          solidProvider.lastSync = new Date();
          solidProvider.errorMessage = undefined;
        }

        // Set as primary if no primary provider exists
        if (!config.primaryProvider) {
          config.primaryProvider = 'solid-pod';
        }

        // Update configuration
        this.configurations.set(clientId, config);

        // Store updated configuration
        await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
          configuration: config,
          updatedAt: new Date()
        });

        console.log(`🔐 Solid Pod connected for client ${clientId}`);
        return true;
      }

      throw new Error('Solid Pod authentication failed');

    } catch (error) {
      const config = this.configurations.get(clientId);
      const solidProvider = config?.providers.find(p => p.id === 'solid-pod');
      if (solidProvider) {
        solidProvider.status = 'error';
        solidProvider.errorMessage = error instanceof Error ? error.message : 'Connection failed';
      }
      
      console.error('Solid Pod connection failed:', error);
      return false;
    }
  }

  /**
   * Connect to a HAT
   */
  async connectHAT(clientId: string, hatAddress: string): Promise<boolean> {
    try {
      const config = this.configurations.get(clientId);
      if (!config) {
        throw new Error('Identity configuration not found');
      }

      // Update provider status
      const hatProvider = config.providers.find(p => p.id === 'dataswift-hat');
      if (hatProvider) {
        hatProvider.status = 'connecting';
      }

      // Attempt HAT connection using authenticate method
      const credentials = await dataswiftHATService.authenticate(hatAddress);
      const connected = !!credentials;

      if (connected) {
        if (hatProvider) {
          hatProvider.status = 'connected';
          hatProvider.endpoint = hatAddress;
          hatProvider.lastSync = new Date();
          hatProvider.errorMessage = undefined;
        }

        // Set as primary if no primary provider exists
        if (!config.primaryProvider) {
          config.primaryProvider = 'dataswift-hat';
        }

        // Update configuration
        this.configurations.set(clientId, config);

        // Store updated configuration
        await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
          configuration: config,
          updatedAt: new Date()
        });

        console.log(`🔐 HAT connected for client ${clientId}: ${hatAddress}`);
        return true;
      }

      throw new Error('HAT connection failed');

    } catch (error) {
      const config = this.configurations.get(clientId);
      const hatProvider = config?.providers.find(p => p.id === 'dataswift-hat');
      if (hatProvider) {
        hatProvider.status = 'error';
        hatProvider.errorMessage = error instanceof Error ? error.message : 'Connection failed';
      }

      console.error('HAT connection failed:', error);
      return false;
    }
  }

  /**
   * Sync data between identity providers
   */
  async syncIdentityProviders(clientId: string): Promise<SyncResult> {
    if (this.syncInProgress.has(clientId)) {
      throw new Error('Sync already in progress for this client');
    }

    this.syncInProgress.add(clientId);
    const startTime = Date.now();

    try {
      const config = this.configurations.get(clientId);
      if (!config) {
        throw new Error('Identity configuration not found');
      }

      const result: SyncResult = {
        success: true,
        providersSync: [],
        conflicts: [],
        summary: {
          totalRecords: 0,
          successfulRecords: 0,
          failedRecords: 0,
          conflictsFound: 0,
          duration: 0
        }
      };

      const connectedProviders = config.providers.filter(p => p.status === 'connected');
      
      if (connectedProviders.length < 2) {
        console.log('Insufficient connected providers for sync');
        result.summary.duration = Date.now() - startTime;
        return result;
      }

      // Get data from all connected providers
      const providerData: Map<string, Record<string, any>> = new Map();

      for (const provider of connectedProviders) {
        try {
          const data = await this.getProviderData(clientId, provider);
          providerData.set(provider.id, data);

          result.providersSync.push({
            providerId: provider.id,
            success: true,
            recordsProcessed: Object.keys(data).length,
            errors: [],
            lastSync: new Date()
          });

          result.summary.totalRecords += Object.keys(data).length;

        } catch (error) {
          result.providersSync.push({
            providerId: provider.id,
            success: false,
            recordsProcessed: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            lastSync: new Date()
          });
          result.success = false;
        }
      }

      // Apply data mapping rules and detect conflicts
      const { mappedData, conflicts } = await this.applyDataMappingAndDetectConflicts(
        providerData,
        config.dataMapping,
        config.conflictResolution
      );

      result.conflicts = conflicts;
      result.summary.conflictsFound = conflicts.length;

      // Write synchronized data back to providers
      for (const [providerId, data] of Array.from(mappedData.entries())) {
        const provider = connectedProviders.find(p => p.id === providerId);
        if (!provider) continue;

        try {
          await this.writeProviderData(clientId, provider, data);
          
          const syncResult = result.providersSync.find(s => s.providerId === providerId);
          if (syncResult) {
            syncResult.success = true;
            result.summary.successfulRecords += Object.keys(data).length;
          }

        } catch (error) {
          const syncResult = result.providersSync.find(s => s.providerId === providerId);
          if (syncResult) {
            syncResult.success = false;
            syncResult.errors.push(error instanceof Error ? error.message : 'Write failed');
          }
          result.summary.failedRecords += Object.keys(data).length;
          result.success = false;
        }
      }

      result.summary.duration = Date.now() - startTime;

      // Store sync result
      await unifiedDataOwnershipService.storeData(clientId, 'access_records', {
        result,
        timestamp: new Date()
      });

      console.log(`🔐 Identity sync completed for client ${clientId}: ${result.success ? 'SUCCESS' : 'PARTIAL'}`);
      return result;

    } finally {
      this.syncInProgress.delete(clientId);
    }
  }

  /**
   * Get identity configuration for a client
   */
  async getIdentityConfiguration(clientId: string): Promise<IdentityConfiguration | null> {
    let config = this.configurations.get(clientId);
    
    if (!config) {
      // Try to load from storage
      try {
        const storedDataArray = await unifiedDataOwnershipService.retrieveData(clientId, 'personal_identity');
        if (storedDataArray.length > 0 && (storedDataArray[0].data as any)?.configuration) {
          config = (storedDataArray[0].data as any).configuration as IdentityConfiguration;
          this.configurations.set(clientId, config);
        }
      } catch (error) {
        console.error('Failed to load identity configuration:', error);
      }
    }

    return config || null;
  }

  /**
   * Update identity configuration
   */
  async updateIdentityConfiguration(
    clientId: string, 
    updates: Partial<IdentityConfiguration>
  ): Promise<IdentityConfiguration> {
    const config = this.configurations.get(clientId);
    if (!config) {
      throw new Error('Identity configuration not found');
    }

    const updatedConfig = { ...config, ...updates };
    this.configurations.set(clientId, updatedConfig);

    // Store updated configuration
    await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
      configuration: updatedConfig,
      updatedAt: new Date()
    });

    return updatedConfig;
  }

  /**
   * Disconnect an identity provider
   */
  async disconnectProvider(clientId: string, providerId: string): Promise<boolean> {
    try {
      const config = this.configurations.get(clientId);
      if (!config) {
        throw new Error('Identity configuration not found');
      }

      const provider = config.providers.find(p => p.id === providerId);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Disconnect based on provider type
      if (provider.type === 'solid') {
        await solidAuthService.logout();
      } else if (provider.type === 'hat') {
        // HAT disconnection handled through service cleanup
        console.log('HAT provider disconnected');
      }

      // Update provider status
      provider.status = 'disconnected';
      provider.endpoint = undefined;
      provider.lastSync = undefined;
      provider.errorMessage = undefined;

      // Update primary provider if this was the primary
      if (config.primaryProvider === providerId) {
        const connectedProvider = config.providers.find(p => p.status === 'connected');
        config.primaryProvider = connectedProvider?.id;
      }

      this.configurations.set(clientId, config);

      // Store updated configuration
      await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
        configuration: config,
        updatedAt: new Date()
      });

      console.log(`🔐 Provider ${providerId} disconnected for client ${clientId}`);
      return true;

    } catch (error) {
      console.error('Failed to disconnect provider:', error);
      return false;
    }
  }

  // Private helper methods

  private async getSolidCapabilities(): Promise<IdentityCapability[]> {
    return [
      {
        name: 'Personal Data Storage',
        description: 'Store personal data in your Solid Pod',
        available: true,
        dataTypes: ['personal_identity', 'health_data', 'documents', 'preferences']
      },
      {
        name: 'Access Control',
        description: 'Fine-grained access control for your data',
        available: true,
        dataTypes: ['access_permissions', 'sharing_rules']
      },
      {
        name: 'Linked Data',
        description: 'Semantic web standards for data interoperability',
        available: true,
        dataTypes: ['rdf_data', 'ontologies']
      }
    ];
  }

  private async getHATCapabilities(): Promise<IdentityCapability[]> {
    return [
      {
        name: 'Data Exchange',
        description: 'Exchange data with various services and applications',
        available: true,
        dataTypes: ['external_services', 'api_integrations']
      },
      {
        name: 'Analytics',
        description: 'Personal data analytics and insights',
        available: true,
        dataTypes: ['analytics_data', 'insights', 'patterns']
      },
      {
        name: 'Marketplace',
        description: 'Participate in data marketplaces',
        available: true,
        dataTypes: ['market_data', 'transactions']
      }
    ];
  }

  private createDefaultDataMappings(): DataMappingRule[] {
    return [
      {
        sourceProvider: 'solid-pod',
        targetProvider: 'dataswift-hat',
        dataType: 'personal_identity',
        conditions: []
      },
      {
        sourceProvider: 'dataswift-hat',
        targetProvider: 'solid-pod',
        dataType: 'health_data',
        conditions: []
      },
      {
        sourceProvider: 'solid-pod',
        targetProvider: 'dataswift-hat',
        dataType: 'preferences',
        conditions: []
      }
    ];
  }

  private async getProviderData(
    clientId: string, 
    provider: IdentityProvider
  ): Promise<Record<string, any>> {
    if (provider.type === 'solid') {
      // Get data from Solid Pod
      return await this.getSolidPodData(clientId);
    } else if (provider.type === 'hat') {
      // Get data from HAT
      return await this.getHATData(clientId);
    }
    return {};
  }

  private async writeProviderData(
    clientId: string,
    provider: IdentityProvider,
    data: Record<string, any>
  ): Promise<void> {
    if (provider.type === 'solid') {
      await this.writeSolidPodData(clientId, data);
    } else if (provider.type === 'hat') {
      await this.writeHATData(clientId, data);
    }
  }

  private async getSolidPodData(clientId: string): Promise<Record<string, any>> {
    // Implementation would use solidDataService to retrieve data
    // This is a simplified mock for demonstration
    return {
      personal_identity: { name: 'John Doe', age: 30 },
      preferences: { theme: 'dark', language: 'en' }
    };
  }

  private async getHATData(clientId: string): Promise<Record<string, any>> {
    // Implementation would use dataswiftHATService to retrieve data
    // This is a simplified mock for demonstration
    return {
      health_data: { steps: 10000, heartRate: 72 },
      external_services: { connected: ['google', 'apple'] }
    };
  }

  private async writeSolidPodData(clientId: string, data: Record<string, any>): Promise<void> {
    // Implementation would use solidDataService to write data
    console.log(`Writing to Solid Pod for ${clientId}:`, Object.keys(data));
  }

  private async writeHATData(clientId: string, data: Record<string, any>): Promise<void> {
    // Implementation would use dataswiftHATService to write data
    console.log(`Writing to HAT for ${clientId}:`, Object.keys(data));
  }

  private async applyDataMappingAndDetectConflicts(
    providerData: Map<string, Record<string, any>>,
    mappingRules: DataMappingRule[],
    conflictResolution: string
  ): Promise<{
    mappedData: Map<string, Record<string, any>>;
    conflicts: DataConflict[];
  }> {
    const mappedData: Map<string, Record<string, any>> = new Map();
    const conflicts: DataConflict[] = [];

    // Initialize mapped data structure
    for (const [providerId] of Array.from(providerData.entries())) {
      mappedData.set(providerId, {});
    }

    // Apply mapping rules and detect conflicts
    for (const rule of mappingRules) {
      const sourceData = providerData.get(rule.sourceProvider)?.[rule.dataType];
      const targetData = providerData.get(rule.targetProvider)?.[rule.dataType];

      if (sourceData && targetData) {
        // Conflict detected
        const conflict: DataConflict = {
          id: `${rule.sourceProvider}-${rule.targetProvider}-${rule.dataType}`,
          dataType: rule.dataType,
          providers: [rule.sourceProvider, rule.targetProvider],
          values: {
            [rule.sourceProvider]: sourceData,
            [rule.targetProvider]: targetData
          },
          resolution: 'pending'
        };

        // Apply conflict resolution strategy
        if (conflictResolution === 'newest_wins') {
          // For demo, assume source is newer
          conflict.resolvedValue = sourceData;
          conflict.resolution = 'resolved';
        }

        conflicts.push(conflict);
      }

      // Map data according to rules
      if (sourceData) {
        const targetMappedData = mappedData.get(rule.targetProvider) || {};
        targetMappedData[rule.dataType] = sourceData;
        mappedData.set(rule.targetProvider, targetMappedData);
      }
    }

    return { mappedData, conflicts };
  }
}

export const identityManagementService = new IdentityManagementService();