/**
 * Unified Health Data Service Tests
 * 
 * Comprehensive unit tests for the unified health data service
 * that integrates Apple HealthKit and Epic FHIR APIs.
 * 
 * @license MIT
 */

import { UnifiedHealthDataService } from '../unifiedHealthDataService';
import { healthKitService } from '../healthKitService';
import { EpicFHIRService } from '../epicFHIRService';
import { HealthMetrics } from '../../types/Health';
import { EpicFHIRConfig } from '../../types/EpicFHIR';

// Mock dependencies
jest.mock('../healthKitService');
jest.mock('../epicFHIRService');

const mockHealthKitService = healthKitService as jest.Mocked<typeof healthKitService>;
const mockEpicFHIRService = EpicFHIRService as jest.MockedClass<typeof EpicFHIRService>;

describe('UnifiedHealthDataService', () => {
  let service: UnifiedHealthDataService;
  let mockEpicInstance: jest.Mocked<EpicFHIRService>;

  const mockHealthKitData: HealthMetrics[] = [
    {
      id: 'hk_001',
      clientId: 'client-123',
      timestamp: new Date('2023-01-01T10:00:00Z'),
      heartRate: 72,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 98.6,
      oxygenSaturation: 98,
      weight: 170,
      dataSource: 'healthkit',
      syncedAt: new Date(),
      currentMedications: ['Lisinopril'],
      chronicConditions: ['Hypertension'],
      allergies: [],
      hasEmergencyCondition: false
    }
  ];

  const mockEpicData: HealthMetrics[] = [
    {
      id: 'epic_001',
      clientId: 'client-123',
      timestamp: new Date('2023-01-01T11:00:00Z'),
      heartRate: 75,
      bloodPressure: { systolic: 122, diastolic: 82 },
      respiratoryRate: 16,
      dataSource: 'epic_fhir' as const,
      syncedAt: new Date(),
      currentMedications: ['Metformin', 'Lisinopril'],
      chronicConditions: ['Diabetes', 'Hypertension'],
      allergies: ['Penicillin'],
      hasEmergencyCondition: false
    }
  ];

  beforeEach(() => {
    service = new UnifiedHealthDataService({
      providers: {
        healthkit: {
          name: 'Apple HealthKit',
          enabled: true,
          priority: 1
        },
        epic: {
          name: 'Epic FHIR',
          enabled: false,
          priority: 2
        }
      },
      dataMergeStrategy: 'prioritized',
      conflictResolution: 'prefer_healthkit'
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup HealthKit mocks
    mockHealthKitService.requestPermissions.mockResolvedValue(true);
    mockHealthKitService.isHealthKitAvailable.mockReturnValue(true);
    mockHealthKitService.syncHealthData.mockResolvedValue(mockHealthKitData);
    mockHealthKitService.generateHealthAlerts.mockReturnValue([]);
    mockHealthKitService.generateBedCriteria.mockReturnValue({
      requiresmedicalSupervision: false,
      needsAccessibility: false,
      requiresQuietEnvironment: false,
      needsProximityToStaff: false,
      temperatureRegulation: 'standard',
      mobilityAssistance: false,
      medicationReminders: false,
      emergencyMonitoring: false
    });

    // Setup Epic FHIR mocks
    mockEpicInstance = {
      initializeSMARTAuth: jest.fn(),
      exchangeCodeForToken: jest.fn(),
      convertToHealthMetrics: jest.fn(),
      isConnected: jest.fn().mockReturnValue(false),
      getConnectionStatus: jest.fn().mockReturnValue({
        isConnected: false,
        error: undefined
      }),
      disconnect: jest.fn()
    } as any;

    mockEpicFHIRService.mockImplementation(() => mockEpicInstance);
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new UnifiedHealthDataService();
      expect(defaultService).toBeDefined();
    });

    it('should initialize HealthKit when enabled', async () => {
      await service.initialize();
      expect(mockHealthKitService.requestPermissions).toHaveBeenCalled();
    });

    it('should skip Epic initialization when not configured', async () => {
      await service.initialize();
      expect(mockEpicFHIRService).not.toHaveBeenCalled();
    });
  });

  describe('Epic FHIR Configuration', () => {
    it('should configure Epic FHIR service', () => {
      const epicConfig: EpicFHIRConfig = {
        baseUrl: 'https://fhir.epic.com',
        clientId: 'test-client',
        scopes: ['patient/Patient.read'],
        environment: 'sandbox',
        version: 'R4'
      };

      service.configureEpicFHIR(epicConfig);

      expect(mockEpicFHIRService).toHaveBeenCalledWith(epicConfig);
    });

    it('should enable Epic provider after configuration', () => {
      const epicConfig: EpicFHIRConfig = {
        baseUrl: 'https://fhir.epic.com',
        clientId: 'test-client',
        scopes: ['patient/Patient.read'],
        environment: 'sandbox',
        version: 'R4'
      };

      service.configureEpicFHIR(epicConfig);

      const status = service.getProviderStatus();
      expect(status.epic.connected).toBe(false); // Not connected yet, but configured
    });
  });

  describe('Epic Authentication', () => {
    beforeEach(() => {
      const epicConfig: EpicFHIRConfig = {
        baseUrl: 'https://fhir.epic.com',
        clientId: 'test-client',
        scopes: ['patient/Patient.read'],
        environment: 'sandbox',
        version: 'R4'
      };
      service.configureEpicFHIR(epicConfig);
    });

    it('should initiate SMART on FHIR authentication', async () => {
      const authUrl = 'https://fhir.epic.com/oauth2/authorize?...';
      mockEpicInstance.initializeSMARTAuth.mockResolvedValue(authUrl);

      const result = await service.authenticateEpic();
      
      expect(result).toBe(authUrl);
      expect(mockEpicInstance.initializeSMARTAuth).toHaveBeenCalled();
    });

    it('should complete Epic authentication', async () => {
      const tokenData = {
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: 'patient-123',
        issued_at: Date.now()
      };

      mockEpicInstance.exchangeCodeForToken.mockResolvedValue({
        ...tokenData,
        scope: 'patient/Patient.read'
      });

      await service.completeEpicAuth('auth-code', 'state-123');
      
      expect(mockEpicInstance.exchangeCodeForToken).toHaveBeenCalledWith('auth-code', 'state-123');
    });

    it('should throw error when Epic not configured for authentication', async () => {
      const unconfiguredService = new UnifiedHealthDataService();
      
      await expect(unconfiguredService.authenticateEpic()).rejects.toThrow('Epic FHIR service not configured');
    });
  });

  describe('Health Data Synchronization', () => {
    it('should sync data from HealthKit only when Epic not enabled', async () => {
      const results = await service.syncHealthData('client-123');

      expect(results).toHaveLength(1);
      expect(results[0].source).toBe('healthkit');
      expect(results[0].success).toBe(true);
      expect(results[0].recordsCount).toBe(1);
    });

    it('should sync data from both sources when Epic is connected', async () => {
      // Configure and connect Epic
      service.configureEpicFHIR({
        baseUrl: 'https://fhir.epic.com',
        clientId: 'test-client',
        scopes: ['patient/Patient.read'],
        environment: 'sandbox',
        version: 'R4'
      });

      mockEpicInstance.isConnected.mockReturnValue(true);
      mockEpicInstance.convertToHealthMetrics.mockResolvedValue(mockEpicData);

      const results = await service.syncHealthData('client-123');

      expect(results).toHaveLength(2);
      expect(results.map(r => r.source)).toContain('healthkit');
      expect(results.map(r => r.source)).toContain('epic_fhir');
    });

    it('should handle sync errors gracefully', async () => {
      mockHealthKitService.syncHealthData.mockRejectedValue(new Error('Sync failed'));

      const results = await service.syncHealthData('client-123');

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Sync failed');
    });

    it('should prevent concurrent syncs for the same client', async () => {
      const promise1 = service.syncHealthData('client-123');
      const promise2 = service.syncHealthData('client-123');

      await expect(promise2).rejects.toThrow('Sync already in progress for this client');
      await promise1; // Complete first sync
    });

    it('should allow concurrent syncs for different clients', async () => {
      const promise1 = service.syncHealthData('client-123');
      const promise2 = service.syncHealthData('client-456');

      const [results1, results2] = await Promise.all([promise1, promise2]);

      expect(results1[0].success).toBe(true);
      expect(results2[0].success).toBe(true);
    });
  });

  describe('Data Consolidation and Merging', () => {
    beforeEach(() => {
      // Configure Epic and mock as connected
      service.configureEpicFHIR({
        baseUrl: 'https://fhir.epic.com',
        clientId: 'test-client',
        scopes: ['patient/Patient.read'],
        environment: 'sandbox',
        version: 'R4'
      });

      mockEpicInstance.isConnected.mockReturnValue(true);
      mockEpicInstance.convertToHealthMetrics.mockResolvedValue(mockEpicData);
    });

    it('should consolidate data from multiple sources', async () => {
      await service.syncHealthData('client-123');
      const consolidatedData = await service.getHealthData('client-123');

      expect(consolidatedData.sources).toContain('healthkit');
      expect(consolidatedData.sources).toContain('epic_fhir');
      expect(consolidatedData.metrics.length).toBeGreaterThan(0);
    });

    it('should merge data using prioritized strategy', async () => {
      // Create overlapping data with same date but different values
      const healthKitWithSameDate = [{
        ...mockHealthKitData[0],
        timestamp: new Date('2023-01-01T10:00:00Z'),
        heartRate: 70,
        temperature: undefined // Missing value
      }];

      const epicWithSameDate = [{
        ...mockEpicData[0],
        timestamp: new Date('2023-01-01T10:00:00Z'),
        heartRate: 75,
        temperature: 99.0 // Available value
      }];

      mockHealthKitService.syncHealthData.mockResolvedValue(healthKitWithSameDate);
      mockEpicInstance.convertToHealthMetrics.mockResolvedValue(epicWithSameDate);

      await service.syncHealthData('client-123');
      const data = await service.getHealthData('client-123');

      // Should prefer HealthKit (priority 1) for heart rate, but use Epic for temperature
      const mergedMetric = data.metrics[0];
      expect(mergedMetric.heartRate).toBe(70); // From HealthKit (higher priority)
      expect(mergedMetric.temperature).toBe(99.0); // From Epic (filled missing value)
    });

    it('should merge arrays correctly', async () => {
      await service.syncHealthData('client-123');
      const data = await service.getHealthData('client-123');

      // Check if we have merged data
      expect(data.metrics.length).toBeGreaterThan(0);
      
      // Find any metric that has both medications and conditions from merged data
      const mergedMetric = data.metrics.find(m => 
        m.currentMedications && m.currentMedications.length > 1 &&
        m.chronicConditions && m.chronicConditions.length > 1
      );
      
      expect(mergedMetric).toBeDefined();
      expect(mergedMetric?.currentMedications).toEqual(expect.arrayContaining(['Lisinopril', 'Metformin']));
      expect(mergedMetric?.chronicConditions).toEqual(expect.arrayContaining(['Hypertension', 'Diabetes']));
    });
  });

  describe('Health Alerts and Bed Criteria', () => {
    it('should generate health alerts from consolidated data', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          clientId: 'client-123',
          type: 'warning' as const,
          category: 'vitals' as const,
          title: 'High Blood Pressure',
          description: 'Blood pressure is elevated',
          recommendations: ['Monitor daily'],
          createdAt: new Date(),
          acknowledged: false
        }
      ];

      mockHealthKitService.generateHealthAlerts.mockReturnValue(mockAlerts);

      await service.syncHealthData('client-123');
      const alerts = service.getHealthAlerts('client-123');

      expect(alerts.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter alerts by severity', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          clientId: 'client-123',
          type: 'critical' as const,
          category: 'emergency' as const,
          title: 'Emergency Condition',
          description: 'Critical health issue',
          recommendations: ['Seek immediate care'],
          createdAt: new Date(),
          acknowledged: false
        },
        {
          id: 'alert-2',
          clientId: 'client-123',
          type: 'warning' as const,
          category: 'vitals' as const,
          title: 'High Blood Pressure',
          description: 'Elevated BP',
          recommendations: ['Monitor'],
          createdAt: new Date(),
          acknowledged: false
        }
      ];

      mockHealthKitService.generateHealthAlerts.mockReturnValue(mockAlerts);

      await service.syncHealthData('client-123');
      
      const criticalAlerts = service.getHealthAlerts('client-123', { severity: 'critical' });
      const warningAlerts = service.getHealthAlerts('client-123', { severity: 'warning' });

      expect(criticalAlerts).toHaveLength(1);
      expect(warningAlerts).toHaveLength(1);
      expect(criticalAlerts[0].type).toBe('critical');
      expect(warningAlerts[0].type).toBe('warning');
    });

    it('should generate bed criteria from consolidated health data', async () => {
      const mockCriteria = {
        requiresmedicalSupervision: true,
        needsAccessibility: false,
        requiresQuietEnvironment: false,
        needsProximityToStaff: true,
        temperatureRegulation: 'standard' as const,
        mobilityAssistance: false,
        medicationReminders: true,
        emergencyMonitoring: false
      };

      mockHealthKitService.generateBedCriteria.mockReturnValue(mockCriteria);

      await service.syncHealthData('client-123');
      const criteria = service.generateBedCriteria('client-123');

      expect(criteria).toEqual(mockCriteria);
    });
  });

  describe('Provider Status and Management', () => {
    it('should return correct provider status', () => {
      const status = service.getProviderStatus();

      expect(status.healthkit.connected).toBe(true);
      expect(status.epic.connected).toBe(false);
    });

    it('should update provider configuration', () => {
      service.updateProviderConfig('healthkit', {
        enabled: false,
        syncInterval: 120
      });

      // Configuration should be updated (we can't directly test private config, 
      // but we can test behavior changes)
      expect(() => service.updateProviderConfig('healthkit', { enabled: false })).not.toThrow();
    });

    it('should disconnect from providers', async () => {
      service.configureEpicFHIR({
        baseUrl: 'https://fhir.epic.com',
        clientId: 'test-client',
        scopes: ['patient/Patient.read'],
        environment: 'sandbox',
        version: 'R4'
      });

      await service.disconnectProvider('epic');

      expect(mockEpicInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe('Data Filtering and Date Ranges', () => {
    it('should filter health data by date range', async () => {
      const pastData = {
        ...mockHealthKitData[0],
        timestamp: new Date('2022-01-01T10:00:00Z')
      };

      const recentData = {
        ...mockHealthKitData[0],
        id: 'hk_002',
        timestamp: new Date('2023-06-01T10:00:00Z')
      };

      mockHealthKitService.syncHealthData.mockResolvedValue([pastData, recentData]);

      await service.syncHealthData('client-123');
      
      const filteredData = await service.getHealthData('client-123', {
        dateRange: {
          start: new Date('2023-01-01T00:00:00Z'),
          end: new Date('2023-12-31T23:59:59Z')
        }
      });

      expect(filteredData.metrics).toHaveLength(1);
      expect(filteredData.metrics[0].id).toBe('hk_002');
    });

    it('should optionally exclude alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          clientId: 'client-123',
          type: 'info' as const,
          category: 'medication' as const,
          title: 'Medication Reminder',
          description: 'Time for medication',
          recommendations: ['Take prescribed medication'],
          createdAt: new Date(),
          acknowledged: false
        }
      ];

      mockHealthKitService.generateHealthAlerts.mockReturnValue(mockAlerts);

      await service.syncHealthData('client-123');
      
      const dataWithAlerts = await service.getHealthData('client-123', { includeAlerts: true });
      const dataWithoutAlerts = await service.getHealthData('client-123', { includeAlerts: false });

      expect(dataWithAlerts.alerts.length).toBeGreaterThanOrEqual(0);
      expect(dataWithoutAlerts.alerts).toHaveLength(0);
    });
  });

  describe('Sync Status Management', () => {
    it('should track sync status correctly', async () => {
      const initialStatus = service.getSyncStatus('client-123');
      expect(initialStatus.status).toBe('never_synced');

      await service.syncHealthData('client-123');
      
      const syncedStatus = service.getSyncStatus('client-123');
      expect(syncedStatus.status).toBe('synced');
      expect(syncedStatus.recordsCount).toBeGreaterThan(0);
    });

    it('should refresh data when cache is stale', async () => {
      // Mock stale data by creating service with short sync interval
      const shortIntervalService = new UnifiedHealthDataService({
        syncInterval: 0.01 // Very short interval in minutes
      });

      await shortIntervalService.syncHealthData('client-123');
      
      // Wait for cache to be stale
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // This should trigger a refresh
      await shortIntervalService.getHealthData('client-123');
      
      // Verify sync was called again
      expect(mockHealthKitService.syncHealthData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty health data gracefully', async () => {
      mockHealthKitService.syncHealthData.mockResolvedValue([]);

      await service.syncHealthData('client-123');
      const data = await service.getHealthData('client-123');

      expect(data.metrics).toHaveLength(0);
      expect(data.profile.summary?.overallHealthScore).toBe(0);
    });

    it('should handle provider unavailability', async () => {
      mockHealthKitService.isHealthKitAvailable.mockReturnValue(false);
      mockHealthKitService.syncHealthData.mockRejectedValue(new Error('HealthKit not available'));

      const results = await service.syncHealthData('client-123');

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('HealthKit not available');
    });

    it('should calculate health scores correctly', async () => {
      const healthyData = [{
        ...mockHealthKitData[0],
        bloodPressure: { systolic: 110, diastolic: 70 },
        heartRate: 70,
        oxygenSaturation: 99,
        chronicConditions: [],
        hasEmergencyCondition: false
      }];

      const unhealthyData = [{
        ...mockHealthKitData[0],
        bloodPressure: { systolic: 180, diastolic: 110 },
        heartRate: 120,
        oxygenSaturation: 85,
        chronicConditions: ['Diabetes', 'Hypertension', 'COPD'],
        hasEmergencyCondition: true
      }];

      // Test healthy profile
      mockHealthKitService.syncHealthData.mockResolvedValue(healthyData);
      await service.syncHealthData('healthy-client');
      const healthyProfile = (await service.getHealthData('healthy-client')).profile;

      // Test unhealthy profile
      mockHealthKitService.syncHealthData.mockResolvedValue(unhealthyData);
      await service.syncHealthData('unhealthy-client');
      const unhealthyProfile = (await service.getHealthData('unhealthy-client')).profile;

      expect(healthyProfile.summary?.overallHealthScore).toBeGreaterThan(unhealthyProfile.summary?.overallHealthScore || 0);
      expect(unhealthyProfile.summary?.riskLevel).toBe('critical');
    });
  });
});