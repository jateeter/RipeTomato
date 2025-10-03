/**
 * Unified Health Data Service
 * 
 * Comprehensive health data service that integrates and normalizes data
 * from multiple sources including Apple HealthKit and Epic FHIR APIs.
 * 
 * @license MIT
 */

import { healthKitService } from './healthKitService';
import { EpicFHIRService } from './epicFHIRService';
import { EpicFHIRConfig } from '../types/EpicFHIR';
import { 
  HealthMetrics, 
  HealthAlert, 
  HealthDataSyncStatus,
  ClientHealthProfile,
  HealthBasedBedCriteria
} from '../types/Health';

export type HealthDataSource = 'healthkit' | 'epic_fhir' | 'combined';

export interface HealthDataProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // 1 = highest priority
  lastSync?: Date;
  syncInterval?: number; // minutes
  config?: any;
}

export interface UnifiedHealthConfig {
  providers: {
    healthkit: HealthDataProviderConfig;
    epic: HealthDataProviderConfig & { epicConfig?: EpicFHIRConfig };
  };
  dataRetentionDays: number;
  autoSync: boolean;
  syncInterval: number;
  dataMergeStrategy: 'latest' | 'average' | 'all' | 'prioritized';
  conflictResolution: 'prefer_healthkit' | 'prefer_epic' | 'merge' | 'manual';
}

export interface HealthDataSyncResult {
  source: HealthDataSource;
  success: boolean;
  recordsCount: number;
  error?: string;
  timestamp: Date;
}

export interface ConsolidatedHealthData {
  metrics: HealthMetrics[];
  alerts: HealthAlert[];
  profile: ClientHealthProfile;
  syncStatus: HealthDataSyncStatus;
  sources: HealthDataSource[];
}

export class UnifiedHealthDataService {
  private config: UnifiedHealthConfig;
  private epicService: EpicFHIRService | null = null;
  private syncInProgress = new Set<string>();
  private consolidatedData = new Map<string, ConsolidatedHealthData>();

  constructor(config?: Partial<UnifiedHealthConfig>) {
    this.config = {
      providers: {
        healthkit: {
          name: 'Apple HealthKit',
          enabled: true,
          priority: 1,
          syncInterval: 60 // 1 hour
        },
        epic: {
          name: 'Epic FHIR',
          enabled: false, // Disabled by default until configured
          priority: 2,
          syncInterval: 240 // 4 hours
        }
      },
      dataRetentionDays: 90,
      autoSync: true,
      syncInterval: 60,
      dataMergeStrategy: 'prioritized',
      conflictResolution: 'prefer_healthkit',
      ...config
    };

    console.log('🔄 Unified Health Data Service initialized');
  }

  /**
   * Configure Epic FHIR integration
   */
  configureEpicFHIR(config: EpicFHIRConfig): void {
    this.epicService = new EpicFHIRService(config);
    this.config.providers.epic.epicConfig = config;
    this.config.providers.epic.enabled = true;
    console.log('🏥 Epic FHIR integration configured');
  }

  /**
   * Initialize health data providers
   */
  async initialize(): Promise<void> {
    try {
      // Initialize HealthKit permissions
      if (this.config.providers.healthkit.enabled) {
        await healthKitService.requestPermissions();
        console.log('✅ HealthKit initialized');
      }

      // Epic FHIR initialization is handled via SMART on FHIR flow
      if (this.config.providers.epic.enabled && this.epicService) {
        console.log('✅ Epic FHIR service ready for authentication');
      }
    } catch (error) {
      console.error('Failed to initialize health data providers:', error);
      throw error;
    }
  }

  /**
   * Authenticate with Epic FHIR using SMART on FHIR
   */
  async authenticateEpic(launchContext?: any): Promise<string> {
    if (!this.epicService) {
      throw new Error('Epic FHIR service not configured');
    }

    return await this.epicService.initializeSMARTAuth(launchContext);
  }

  /**
   * Complete Epic authentication with authorization code
   */
  async completeEpicAuth(code: string, state: string): Promise<void> {
    if (!this.epicService) {
      throw new Error('Epic FHIR service not configured');
    }

    await this.epicService.exchangeCodeForToken(code, state);
    console.log('✅ Epic FHIR authentication completed');
  }

  /**
   * Sync health data from all enabled providers
   */
  async syncHealthData(clientId: string, options?: {
    sources?: HealthDataSource[];
    forceSync?: boolean;
  }): Promise<HealthDataSyncResult[]> {
    if (this.syncInProgress.has(clientId)) {
      throw new Error('Sync already in progress for this client');
    }

    this.syncInProgress.add(clientId);
    const results: HealthDataSyncResult[] = [];

    try {
      const sources = options?.sources || this.getEnabledSources();

      // Sync from HealthKit
      if (sources.includes('healthkit') && this.config.providers.healthkit.enabled) {
        const result = await this.syncFromHealthKit(clientId, options?.forceSync);
        results.push(result);
      }

      // Sync from Epic FHIR
      if (sources.includes('epic_fhir') && this.config.providers.epic.enabled && this.epicService?.isConnected()) {
        const result = await this.syncFromEpicFHIR(clientId, options?.forceSync);
        results.push(result);
      }

      // Consolidate data from all sources
      await this.consolidateHealthData(clientId);

      console.log(`✅ Health data sync completed for client ${clientId}`);
      return results;
    } catch (error) {
      console.error('Health data sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress.delete(clientId);
    }
  }

  /**
   * Get consolidated health data for a client
   */
  async getHealthData(clientId: string, options?: {
    includeAlerts?: boolean;
    dateRange?: { start: Date; end: Date };
    sources?: HealthDataSource[];
  }): Promise<ConsolidatedHealthData> {
    // Check if we have recent consolidated data
    const existing = this.consolidatedData.get(clientId);
    const shouldRefresh = !existing || 
      (Date.now() - existing.syncStatus.lastSync.getTime()) > (this.config.syncInterval * 60 * 1000);

    if (shouldRefresh) {
      await this.syncHealthData(clientId, { sources: options?.sources });
    }

    let data = this.consolidatedData.get(clientId);
    if (!data) {
      // Return empty data structure if no data available
      data = {
        metrics: [],
        alerts: [],
        profile: this.createEmptyHealthProfile(clientId),
        syncStatus: {
          lastSync: new Date(),
          status: 'never_synced',
          recordsCount: 0,
          pendingSync: 0
        },
        sources: []
      };
    }

    // Apply filters if specified
    if (options?.dateRange) {
      data.metrics = data.metrics.filter(metric => 
        metric.timestamp >= options.dateRange!.start && 
        metric.timestamp <= options.dateRange!.end
      );
    }

    if (!options?.includeAlerts) {
      data.alerts = [];
    }

    return { ...data };
  }

  /**
   * Generate health-based bed criteria using consolidated data
   */
  generateBedCriteria(clientId: string): HealthBasedBedCriteria {
    const data = this.consolidatedData.get(clientId);
    if (!data || data.metrics.length === 0) {
      return healthKitService.generateBedCriteria([]);
    }

    // Use the HealthKit service's logic but with consolidated data
    return healthKitService.generateBedCriteria(data.metrics);
  }

  /**
   * Get health alerts for a client
   */
  getHealthAlerts(clientId: string, options?: {
    severity?: 'info' | 'warning' | 'critical';
    acknowledged?: boolean;
  }): HealthAlert[] {
    const data = this.consolidatedData.get(clientId);
    if (!data) return [];

    let alerts = data.alerts;

    if (options?.severity) {
      alerts = alerts.filter(alert => alert.type === options.severity);
    }

    if (options?.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === options.acknowledged);
    }

    return alerts;
  }

  /**
   * Get sync status for all providers
   */
  getSyncStatus(clientId: string): HealthDataSyncStatus {
    const data = this.consolidatedData.get(clientId);
    return data?.syncStatus || {
      lastSync: new Date(0),
      status: 'never_synced',
      recordsCount: 0,
      pendingSync: 0
    };
  }

  /**
   * Get provider connection status
   */
  getProviderStatus(): Record<string, { connected: boolean; lastSync?: Date; error?: string }> {
    return {
      healthkit: {
        connected: healthKitService.isHealthKitAvailable(),
        lastSync: this.config.providers.healthkit.lastSync
      },
      epic: {
        connected: this.epicService?.isConnected() || false,
        lastSync: this.config.providers.epic.lastSync,
        error: this.epicService?.getConnectionStatus().error
      }
    };
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(provider: 'healthkit' | 'epic', config: Partial<HealthDataProviderConfig>): void {
    this.config.providers[provider] = {
      ...this.config.providers[provider],
      ...config
    };
  }

  /**
   * Disconnect from a provider
   */
  async disconnectProvider(provider: 'healthkit' | 'epic'): Promise<void> {
    this.config.providers[provider].enabled = false;
    
    if (provider === 'epic' && this.epicService) {
      this.epicService.disconnect();
    }

    console.log(`🔌 Disconnected from ${provider}`);
  }

  // Private helper methods

  private async syncFromHealthKit(clientId: string, forceSync?: boolean): Promise<HealthDataSyncResult> {
    try {
      const metrics = await healthKitService.syncHealthData(clientId);
      
      this.config.providers.healthkit.lastSync = new Date();
      
      return {
        source: 'healthkit',
        success: true,
        recordsCount: metrics.length,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        source: 'healthkit',
        success: false,
        recordsCount: 0,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  private async syncFromEpicFHIR(clientId: string, forceSync?: boolean): Promise<HealthDataSyncResult> {
    if (!this.epicService) {
      return {
        source: 'epic_fhir',
        success: false,
        recordsCount: 0,
        error: 'Epic FHIR service not configured',
        timestamp: new Date()
      };
    }

    try {
      const metrics = await this.epicService.convertToHealthMetrics(clientId);
      
      this.config.providers.epic.lastSync = new Date();
      
      return {
        source: 'epic_fhir',
        success: true,
        recordsCount: metrics.length,
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        source: 'epic_fhir',
        success: false,
        recordsCount: 0,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  private async consolidateHealthData(clientId: string): Promise<void> {
    const allMetrics: HealthMetrics[] = [];
    const allAlerts: HealthAlert[] = [];
    const sources: HealthDataSource[] = [];

    // Collect data from HealthKit
    if (this.config.providers.healthkit.enabled) {
      try {
        const healthKitMetrics = await healthKitService.syncHealthData(clientId);
        allMetrics.push(...healthKitMetrics);
        
        const healthKitAlerts = healthKitService.generateHealthAlerts(clientId, healthKitMetrics);
        allAlerts.push(...healthKitAlerts);
        
        sources.push('healthkit');
      } catch (error) {
        console.warn('Failed to collect HealthKit data:', error);
      }
    }

    // Collect data from Epic FHIR
    if (this.config.providers.epic.enabled && this.epicService?.isConnected()) {
      try {
        const epicMetrics = await this.epicService.convertToHealthMetrics(clientId);
        allMetrics.push(...epicMetrics);
        
        // Generate alerts from Epic data
        const epicAlerts = healthKitService.generateHealthAlerts(clientId, epicMetrics);
        allAlerts.push(...epicAlerts);
        
        sources.push('epic_fhir');
      } catch (error) {
        console.warn('Failed to collect Epic FHIR data:', error);
      }
    }

    // Merge and deduplicate data based on strategy
    const consolidatedMetrics = this.mergeHealthMetrics(allMetrics);
    const consolidatedAlerts = this.deduplicateAlerts(allAlerts);

    // Create health profile
    const profile = this.createHealthProfile(clientId, consolidatedMetrics);

    // Store consolidated data
    this.consolidatedData.set(clientId, {
      metrics: consolidatedMetrics,
      alerts: consolidatedAlerts,
      profile,
      syncStatus: {
        lastSync: new Date(),
        status: 'synced',
        recordsCount: consolidatedMetrics.length,
        pendingSync: 0
      },
      sources
    });
  }

  private mergeHealthMetrics(metrics: HealthMetrics[]): HealthMetrics[] {
    if (this.config.dataMergeStrategy === 'all') {
      return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    // Group by date
    const metricsByDate = new Map<string, HealthMetrics[]>();
    metrics.forEach(metric => {
      const dateKey = metric.timestamp.toISOString().split('T')[0];
      if (!metricsByDate.has(dateKey)) {
        metricsByDate.set(dateKey, []);
      }
      metricsByDate.get(dateKey)!.push(metric);
    });

    // Merge metrics for each date based on strategy
    const mergedMetrics: HealthMetrics[] = [];
    metricsByDate.forEach((dateMetrics, dateKey) => {
      if (dateMetrics.length === 1) {
        mergedMetrics.push(dateMetrics[0]);
      } else {
        const merged = this.mergeMetricsForDate(dateMetrics);
        mergedMetrics.push(merged);
      }
    });

    return mergedMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private mergeMetricsForDate(metrics: HealthMetrics[]): HealthMetrics {
    const base = metrics[0];
    const merged: HealthMetrics = { ...base };

    if (this.config.dataMergeStrategy === 'prioritized') {
      // Sort by data source priority
      const prioritized = metrics.sort((a, b) => {
        const aPriority = a.dataSource === 'healthkit' ? 
          this.config.providers.healthkit.priority : 
          this.config.providers.epic.priority;
        const bPriority = b.dataSource === 'healthkit' ? 
          this.config.providers.healthkit.priority : 
          this.config.providers.epic.priority;
        return aPriority - bPriority;
      });

      // Use highest priority source as base, fill in missing data from others
      for (const metric of prioritized) {
        Object.keys(metric).forEach(key => {
          if (merged[key as keyof HealthMetrics] === undefined && metric[key as keyof HealthMetrics] !== undefined) {
            (merged as any)[key] = (metric as any)[key];
          }
        });
      }
    } else if (this.config.dataMergeStrategy === 'average') {
      // Average numeric values where possible
      const numericFields = ['heartRate', 'temperature', 'oxygenSaturation', 'respiratoryRate', 'weight', 'height'];
      numericFields.forEach(field => {
        const values = metrics.map(m => (m as any)[field]).filter(v => v !== undefined);
        if (values.length > 0) {
          (merged as any)[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });

      // Handle blood pressure separately
      const bpValues = metrics.map(m => m.bloodPressure).filter(bp => bp !== undefined);
      if (bpValues.length > 0) {
        merged.bloodPressure = {
          systolic: bpValues.reduce((sum, bp) => sum + bp!.systolic, 0) / bpValues.length,
          diastolic: bpValues.reduce((sum, bp) => sum + bp!.diastolic, 0) / bpValues.length
        };
      }
    }

    // Combine arrays (medications, conditions, allergies)
    merged.currentMedications = [...new Set(metrics.flatMap(m => m.currentMedications || []))];
    merged.chronicConditions = [...new Set(metrics.flatMap(m => m.chronicConditions || []))];
    merged.allergies = [...new Set(metrics.flatMap(m => m.allergies || []))];

    return merged;
  }

  private deduplicateAlerts(alerts: HealthAlert[]): HealthAlert[] {
    const seen = new Set<string>();
    return alerts.filter(alert => {
      const key = `${alert.clientId}_${alert.category}_${alert.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private createHealthProfile(clientId: string, metrics: HealthMetrics[]): ClientHealthProfile {
    if (metrics.length === 0) {
      return this.createEmptyHealthProfile(clientId);
    }

    const latest = metrics[0];
    return {
      clientId,
      lastUpdated: new Date(),
      healthMetrics: metrics,
      healthAlerts: [],
      bedCriteria: this.generateBedCriteria(clientId),
      syncStatus: {
        lastSync: new Date(),
        status: 'synced',
        recordsCount: metrics.length,
        pendingSync: 0
      },
      consentGiven: true,
      dataRetentionDays: this.config.dataRetentionDays,
      summary: {
        overallHealthScore: this.calculateHealthScore(latest),
        riskLevel: this.calculateRiskLevel(latest),
        chronicConditionsCount: (latest.chronicConditions || []).length,
        activeMedicationsCount: (latest.currentMedications || []).length,
        lastVitalsCheck: latest.timestamp,
        emergencyFlags: latest.hasEmergencyCondition ? ['emergency_condition'] : []
      },
      vitals: {
        bloodPressure: latest.bloodPressure,
        heartRate: latest.heartRate,
        temperature: latest.temperature,
        oxygenSaturation: latest.oxygenSaturation,
        respiratoryRate: latest.respiratoryRate
      },
      conditions: latest.chronicConditions || [],
      medications: latest.currentMedications || [],
      allergies: latest.allergies || [],
      dataSource: latest.dataSource,
      bedRequirements: this.generateBedCriteria(clientId)
    };
  }

  private createEmptyHealthProfile(clientId: string): ClientHealthProfile {
    return {
      clientId,
      lastUpdated: new Date(),
      healthMetrics: [],
      healthAlerts: [],
      bedCriteria: healthKitService.generateBedCriteria([]),
      syncStatus: {
        lastSync: new Date(0),
        status: 'never_synced',
        recordsCount: 0,
        pendingSync: 0
      },
      consentGiven: false,
      dataRetentionDays: this.config.dataRetentionDays,
      summary: {
        overallHealthScore: 0,
        riskLevel: 'unknown',
        chronicConditionsCount: 0,
        activeMedicationsCount: 0,
        emergencyFlags: []
      },
      vitals: {},
      conditions: [],
      medications: [],
      allergies: [],
      dataSource: 'none',
      bedRequirements: healthKitService.generateBedCriteria([])
    };
  }

  private calculateHealthScore(metrics: HealthMetrics): number {
    let score = 100;
    
    // Deduct points for concerning vital signs
    if (metrics.bloodPressure) {
      if (metrics.bloodPressure.systolic > 140 || metrics.bloodPressure.diastolic > 90) {
        score -= 15;
      }
    }
    
    if (metrics.heartRate && (metrics.heartRate > 100 || metrics.heartRate < 60)) {
      score -= 10;
    }
    
    if (metrics.oxygenSaturation && metrics.oxygenSaturation < 95) {
      score -= 20;
    }
    
    // Deduct for chronic conditions
    score -= ((metrics.chronicConditions?.length || 0) * 5);
    
    // Deduct for emergency conditions
    if (metrics.hasEmergencyCondition) {
      score -= 30;
    }
    
    return Math.max(0, score);
  }

  private calculateRiskLevel(metrics: HealthMetrics): 'low' | 'medium' | 'high' | 'critical' | 'unknown' {
    const score = this.calculateHealthScore(metrics);
    
    if (metrics.hasEmergencyCondition) return 'critical';
    if (score < 40) return 'high';
    if (score < 70) return 'medium';
    return 'low';
  }

  private getEnabledSources(): HealthDataSource[] {
    const sources: HealthDataSource[] = [];
    
    if (this.config.providers.healthkit.enabled) {
      sources.push('healthkit');
    }
    
    if (this.config.providers.epic.enabled) {
      sources.push('epic_fhir');
    }
    
    return sources;
  }
}

export const unifiedHealthDataService = new UnifiedHealthDataService();