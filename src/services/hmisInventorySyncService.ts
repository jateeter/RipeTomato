/**
 * HMIS OpenCommons Inventory Synchronization Service
 * 
 * Service for synchronizing shelter inventory and capacity data 
 * with the HMIS OpenCommons database at hmis.opencommons.com
 * 
 * @license MIT
 */

import { ShelterFacility, shelterDataService } from './shelterDataService';
import { googleCalendarService } from './googleCalendarService';

interface HMISInventoryRecord {
  id: string;
  facility_name: string;
  facility_type: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  location: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number;
    longitude?: number;
  };
  demographics: string[];
  services: string[];
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  operating_schedule: {
    availability: string;
    check_in_time?: string;
    check_out_time?: string;
  };
  last_updated: string;
  data_source: string;
  verification_status: 'verified' | 'pending' | 'needs_update';
}

interface SyncResult {
  success: boolean;
  syncedRecords: number;
  updatedRecords: number;
  newRecords: number;
  errors: string[];
  lastSyncTime: Date;
}

interface SyncConfiguration {
  apiEndpoint: string;
  syncInterval: number; // in milliseconds
  autoSync: boolean;
  enableRealTimeSync: boolean;
  webhookUrl?: string;
  apiKey?: string;
  maxRetries: number;
  batchSize: number;
}

class HMISInventorySyncService {
  private syncConfig: SyncConfiguration = {
    apiEndpoint: 'https://hmis.opencommons.com/api/v1/inventory',
    syncInterval: 300000, // 5 minutes
    autoSync: true,
    enableRealTimeSync: false,
    maxRetries: 3,
    batchSize: 50
  };

  private lastSyncTime: Date | null = null;
  private syncInProgress: boolean = false;
  private syncIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🏢 HMIS Inventory Sync Service initialized');
    this.loadSyncConfiguration();
    this.startAutoSync();
  }

  /**
   * Initialize synchronization with HMIS OpenCommons
   */
  async initialize(): Promise<boolean> {
    try {
      // Test connection to HMIS API
      await this.testConnection();
      
      // Perform initial sync
      await this.performFullSync();
      
      console.log('✅ HMIS Inventory Sync Service ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize HMIS sync service:', error);
      return false;
    }
  }

  /**
   * Test connection to HMIS OpenCommons API
   */
  private async testConnection(): Promise<boolean> {
    try {
      // Simulate API connection test
      console.log('🔗 Testing connection to HMIS OpenCommons...');
      
      // In a real implementation, this would make an actual API call
      const testResponse = await this.simulateAPICall('/health', 'GET');
      
      if (testResponse.status === 'healthy') {
        console.log('✅ HMIS API connection successful');
        return true;
      } else {
        throw new Error('HMIS API health check failed');
      }
    } catch (error) {
      console.error('HMIS API connection test failed:', error);
      return false;
    }
  }

  /**
   * Perform full synchronization with HMIS database
   */
  async performFullSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('🔄 Starting full HMIS inventory synchronization...');

      // Fetch current inventory from HMIS
      const hmisInventory = await this.fetchHMISInventory();
      
      // Get current local shelter data
      const localShelters = await shelterDataService.getAllShelters();
      
      // Perform synchronization
      const syncResult = await this.synchronizeInventoryData(hmisInventory, localShelters);
      
      // Update calendars with any capacity changes
      await this.updateCalendarsWithCapacityChanges(syncResult);
      
      this.lastSyncTime = new Date();
      this.saveSyncConfiguration();

      const duration = Date.now() - startTime;
      console.log(`✅ HMIS sync completed in ${duration}ms:`, syncResult);

      return syncResult;
    } catch (error) {
      console.error('HMIS sync failed:', error);
      return {
        success: false,
        syncedRecords: 0,
        updatedRecords: 0,
        newRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncTime: new Date()
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Fetch inventory data from HMIS OpenCommons
   */
  private async fetchHMISInventory(): Promise<HMISInventoryRecord[]> {
    try {
      console.log('📥 Fetching inventory from HMIS OpenCommons...');
      
      // Simulate API call to HMIS
      const response = await this.simulateAPICall('/inventory/shelters', 'GET', {
        include_capacity: true,
        include_availability: true,
        format: 'json'
      });

      // Transform the mock data to HMIS format
      const mockHMISData: HMISInventoryRecord[] = [
        {
          id: 'hmis_001',
          facility_name: 'Arbor Lodge Shelter',
          facility_type: 'emergency',
          total_beds: 106,
          available_beds: 23,
          occupied_beds: 83,
          location: {
            street: '2145 N Going St',
            city: 'Portland',
            state: 'OR',
            zip_code: '97217',
            latitude: 45.5523,
            longitude: -122.6867
          },
          demographics: ['all-gender', 'veterans', 'individuals', 'couples'],
          services: ['emergency_shelter', 'case_management', 'meals'],
          contact: {
            phone: '(503) 555-0106',
            email: 'intake@arborlodge.org',
            website: 'https://arborlodge.org'
          },
          operating_schedule: {
            availability: '24/7',
            check_in_time: '18:00',
            check_out_time: '08:00'
          },
          last_updated: new Date().toISOString(),
          data_source: 'hmis_opencommons',
          verification_status: 'verified'
        },
        {
          id: 'hmis_002',
          facility_name: 'Bybee Lakes Hope Center',
          facility_type: 'emergency',
          total_beds: 175,
          available_beds: 34,
          occupied_beds: 141,
          location: {
            street: '12600 SE Foster Rd',
            city: 'Portland',
            state: 'OR',
            zip_code: '97236',
            latitude: 45.5045,
            longitude: -122.5364
          },
          demographics: ['mixed-gender', 'adults'],
          services: ['emergency_shelter', 'substance_abuse_support', 'mental_health'],
          contact: {
            phone: '(503) 555-0175',
            email: 'services@bybeelakes.org'
          },
          operating_schedule: {
            availability: '24/7'
          },
          last_updated: new Date().toISOString(),
          data_source: 'hmis_opencommons',
          verification_status: 'verified'
        },
        {
          id: 'hmis_003',
          facility_name: 'Portland Rescue Mission',
          facility_type: 'emergency',
          total_beds: 150,
          available_beds: 18,
          occupied_beds: 132,
          location: {
            street: '111 W Burnside St',
            city: 'Portland',
            state: 'OR',
            zip_code: '97209',
            latitude: 45.5230,
            longitude: -122.6794
          },
          demographics: ['all-gender', 'families', 'veterans'],
          services: ['emergency_shelter', 'meals', 'recovery_programs', 'family_services'],
          contact: {
            phone: '(503) 555-0150',
            email: 'help@portlandrescue.org',
            website: 'https://portlandrescue.org'
          },
          operating_schedule: {
            availability: '24/7'
          },
          last_updated: new Date().toISOString(),
          data_source: 'hmis_opencommons',
          verification_status: 'verified'
        }
      ];

      console.log(`📊 Retrieved ${mockHMISData.length} records from HMIS`);
      return mockHMISData;
      
    } catch (error) {
      console.error('Failed to fetch HMIS inventory:', error);
      throw error;
    }
  }

  /**
   * Synchronize inventory data between HMIS and local database
   */
  private async synchronizeInventoryData(
    hmisData: HMISInventoryRecord[],
    localShelters: ShelterFacility[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedRecords: 0,
      updatedRecords: 0,
      newRecords: 0,
      errors: [],
      lastSyncTime: new Date()
    };

    try {
      // Create lookup map for local shelters
      const localShelterMap = new Map<string, ShelterFacility>();
      localShelters.forEach(shelter => {
        // Try to match by name (in real implementation, would use proper ID matching)
        const normalizedName = shelter.name.toLowerCase().replace(/\s+/g, '_');
        localShelterMap.set(normalizedName, shelter);
      });

      for (const hmisRecord of hmisData) {
        try {
          const normalizedHMISName = hmisRecord.facility_name.toLowerCase().replace(/\s+/g, '_');
          const existingLocalShelter = localShelterMap.get(normalizedHMISName);

          if (existingLocalShelter) {
            // Update existing shelter with HMIS data
            const updatedShelter = await this.updateShelterFromHMIS(existingLocalShelter, hmisRecord);
            if (updatedShelter) {
              result.updatedRecords++;
              
              // Update shelter utilization in local database
              await shelterDataService.updateShelterUtilization(existingLocalShelter.id, {
                occupied: hmisRecord.occupied_beds,
                available: hmisRecord.available_beds,
                utilizationRate: hmisRecord.occupied_beds / hmisRecord.total_beds
              });
            }
          } else {
            // Create new shelter from HMIS data
            const newShelter = await this.createShelterFromHMIS(hmisRecord);
            if (newShelter) {
              result.newRecords++;
              
              // Create calendar for new shelter
              await googleCalendarService.createShelterCalendar(newShelter);
            }
          }

          result.syncedRecords++;

        } catch (recordError) {
          result.errors.push(`Failed to sync ${hmisRecord.facility_name}: ${recordError instanceof Error ? recordError.message : 'Unknown error'}`);
        }
      }

      console.log(`📈 HMIS Sync Results:`, result);
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      return result;
    }
  }

  /**
   * Update existing shelter with HMIS data
   */
  private async updateShelterFromHMIS(
    localShelter: ShelterFacility,
    hmisRecord: HMISInventoryRecord
  ): Promise<ShelterFacility | null> {
    try {
      // Check if update is needed
      const needsUpdate = this.compareInventoryData(localShelter, hmisRecord);
      
      if (!needsUpdate) {
        return null; // No changes needed
      }

      // Update shelter data with HMIS information
      const updatedShelter: ShelterFacility = {
        ...localShelter,
        capacity: {
          ...localShelter.capacity,
          total: hmisRecord.total_beds
        },
        currentUtilization: {
          occupied: hmisRecord.occupied_beds,
          available: hmisRecord.available_beds,
          utilizationRate: hmisRecord.occupied_beds / hmisRecord.total_beds,
          lastUpdated: new Date()
        },
        contactInfo: {
          ...localShelter.contactInfo,
          phone: hmisRecord.contact.phone || localShelter.contactInfo.phone,
          email: hmisRecord.contact.email || localShelter.contactInfo.email,
          website: hmisRecord.contact.website || localShelter.contactInfo.website
        },
        hmisData: {
          ...localShelter.hmisData,
          lastSync: new Date(),
          verified: hmisRecord.verification_status === 'verified'
        }
      };

      console.log(`🔄 Updated shelter ${localShelter.name} with HMIS data`);
      return updatedShelter;

    } catch (error) {
      console.error(`Failed to update shelter ${localShelter.name}:`, error);
      return null;
    }
  }

  /**
   * Create new shelter from HMIS data
   */
  private async createShelterFromHMIS(hmisRecord: HMISInventoryRecord): Promise<ShelterFacility | null> {
    try {
      const newShelter: ShelterFacility = {
        id: `hmis_${hmisRecord.id}`,
        name: hmisRecord.facility_name,
        type: hmisRecord.facility_type as ShelterFacility['type'],
        address: {
          street: hmisRecord.location.street,
          city: hmisRecord.location.city,
          state: hmisRecord.location.state,
          zipCode: hmisRecord.location.zip_code,
          coordinates: hmisRecord.location.latitude && hmisRecord.location.longitude ? {
            lat: hmisRecord.location.latitude,
            lng: hmisRecord.location.longitude
          } : undefined
        },
        capacity: {
          total: hmisRecord.total_beds,
          adults: Math.floor(hmisRecord.total_beds * 0.8),
          families: Math.floor(hmisRecord.total_beds * 0.15),
          youth: Math.floor(hmisRecord.total_beds * 0.05),
          wheelchair_accessible: Math.floor(hmisRecord.total_beds * 0.1)
        },
        currentUtilization: {
          occupied: hmisRecord.occupied_beds,
          available: hmisRecord.available_beds,
          utilizationRate: hmisRecord.occupied_beds / hmisRecord.total_beds,
          lastUpdated: new Date()
        },
        demographics: {
          acceptedPopulations: hmisRecord.demographics,
          restrictions: [],
          specialRequirements: []
        },
        services: hmisRecord.services,
        operatingSchedule: {
          availability: hmisRecord.operating_schedule.availability as ShelterFacility['operatingSchedule']['availability'],
          checkInTime: hmisRecord.operating_schedule.check_in_time,
          checkOutTime: hmisRecord.operating_schedule.check_out_time
        },
        contactInfo: {
          phone: hmisRecord.contact.phone,
          email: hmisRecord.contact.email,
          website: hmisRecord.contact.website
        },
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          publicTransit: true,
          parking: true
        },
        hmisData: {
          lastSync: new Date(),
          dataSource: 'hmis_opencommons',
          verified: hmisRecord.verification_status === 'verified'
        },
        spatialData: {
          district: 'Unknown',
          neighborhood: 'Unknown',
          nearbyLandmarks: [],
          transitAccess: []
        }
      };

      console.log(`🆕 Created new shelter from HMIS: ${newShelter.name}`);
      return newShelter;

    } catch (error) {
      console.error(`Failed to create shelter from HMIS data:`, error);
      return null;
    }
  }

  /**
   * Compare inventory data to determine if update is needed
   */
  private compareInventoryData(
    localShelter: ShelterFacility,
    hmisRecord: HMISInventoryRecord
  ): boolean {
    // Check capacity changes
    if (localShelter.capacity.total !== hmisRecord.total_beds) return true;
    
    // Check utilization changes
    if (localShelter.currentUtilization.occupied !== hmisRecord.occupied_beds) return true;
    if (localShelter.currentUtilization.available !== hmisRecord.available_beds) return true;
    
    // Check contact information changes
    if (localShelter.contactInfo.phone !== hmisRecord.contact.phone) return true;
    if (localShelter.contactInfo.email !== hmisRecord.contact.email) return true;

    // No significant changes detected
    return false;
  }

  /**
   * Update calendars with capacity changes
   */
  private async updateCalendarsWithCapacityChanges(syncResult: SyncResult): Promise<void> {
    try {
      if (syncResult.updatedRecords > 0 || syncResult.newRecords > 0) {
        console.log('📅 Updating calendars with capacity changes...');
        
        // Synchronize all calendars to reflect capacity changes
        await googleCalendarService.synchronizeCalendars();
        
        console.log('✅ Calendar updates completed');
      }
    } catch (error) {
      console.error('Failed to update calendars:', error);
    }
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (this.syncConfig.autoSync && !this.syncIntervalId) {
      this.syncIntervalId = setInterval(async () => {
        try {
          await this.performIncrementalSync();
        } catch (error) {
          console.error('Auto sync failed:', error);
        }
      }, this.syncConfig.syncInterval);

      console.log(`🔄 Auto sync enabled (${this.syncConfig.syncInterval / 1000}s interval)`);
    }
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      console.log('⏹️ Auto sync stopped');
    }
  }

  /**
   * Perform incremental sync (lighter than full sync)
   */
  private async performIncrementalSync(): Promise<SyncResult> {
    console.log('⚡ Performing incremental HMIS sync...');
    
    // For now, perform full sync (in real implementation, would only sync changes)
    return await this.performFullSync();
  }

  /**
   * Get sync status and statistics
   */
  getSyncStatus(): {
    lastSyncTime: Date | null;
    syncInProgress: boolean;
    autoSyncEnabled: boolean;
    syncInterval: number;
  } {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      autoSyncEnabled: this.syncConfig.autoSync,
      syncInterval: this.syncConfig.syncInterval
    };
  }

  /**
   * Update sync configuration
   */
  updateSyncConfig(config: Partial<SyncConfiguration>): void {
    this.syncConfig = { ...this.syncConfig, ...config };
    this.saveSyncConfiguration();
    
    // Restart auto sync if interval changed
    if (config.syncInterval || config.autoSync !== undefined) {
      this.stopAutoSync();
      if (this.syncConfig.autoSync) {
        this.startAutoSync();
      }
    }
  }

  /**
   * Simulate API call (for testing)
   */
  private async simulateAPICall(endpoint: string, method: string, params?: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate successful response
    if (endpoint === '/health') {
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }
    
    if (endpoint === '/inventory/shelters') {
      return { status: 'success', data: [] }; // Data is mocked above
    }
    
    return { status: 'success' };
  }

  /**
   * Save sync configuration to localStorage
   */
  private saveSyncConfiguration(): void {
    const configData = {
      syncConfig: this.syncConfig,
      lastSyncTime: this.lastSyncTime?.toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('hmis_sync_config', JSON.stringify(configData));
  }

  /**
   * Load sync configuration from localStorage
   */
  private loadSyncConfiguration(): void {
    try {
      const configData = localStorage.getItem('hmis_sync_config');
      if (configData) {
        const config = JSON.parse(configData);
        this.syncConfig = { ...this.syncConfig, ...config.syncConfig };
        this.lastSyncTime = config.lastSyncTime ? new Date(config.lastSyncTime) : null;
        
        console.log('📋 HMIS sync configuration loaded');
      }
    } catch (error) {
      console.error('Failed to load sync configuration:', error);
    }
  }
}

export const hmisInventorySyncService = new HMISInventorySyncService();