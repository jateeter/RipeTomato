/**
 * Cache Initialization Service
 *
 * Manages loading and initializing the cache database during app startup.
 * Falls back to fetching from public cache file or populating from live data.
 */

import { cacheDatabaseService, Location, Shelter } from './cacheDatabase';

export interface CacheInitializationResult {
  success: boolean;
  message: string;
  source: 'database' | 'file' | 'live' | 'none';
  error?: string;
  stats?: {
    locations: number;
    shelters: number;
    lastSync: string;
  };
}

class CacheInitializationService {
  private initialized = false;

  /**
   * Initialize cache database
   */
  async initialize(): Promise<CacheInitializationResult> {
    if (this.initialized) {
      return {
        success: true,
        message: 'Cache already initialized',
        source: 'database'
      };
    }

    try {
      // Step 1: Try to initialize database from localStorage
      console.log('📦 Initializing cache database...');
      await cacheDatabaseService.initialize();

      // Step 2: Check if cache is fresh
      const isFresh = await cacheDatabaseService.isCacheFresh();
      const metadata = await cacheDatabaseService.getCacheMetadata();

      if (isFresh && metadata.total_locations > 0) {
        console.log('✅ Using fresh cache from database');
        this.initialized = true;
        return {
          success: true,
          message: 'Fresh cache loaded from database',
          source: 'database',
          stats: {
            locations: metadata.total_locations,
            shelters: metadata.total_shelters,
            lastSync: metadata.last_sync
          }
        };
      }

      // Step 3: Try to load from public cache file
      console.log('📂 Cache stale or empty, loading from file...');
      const fileResult = await this.loadFromFile();

      if (fileResult.success) {
        this.initialized = true;
        return fileResult;
      }

      // Step 4: Fallback to live data population
      console.log('🌐 Cache file unavailable, populating from live data...');
      const liveResult = await this.populateFromLiveData();

      this.initialized = true;
      return liveResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Cache initialization failed:', errorMessage);

      return {
        success: false,
        message: 'Cache initialization failed',
        source: 'none',
        error: errorMessage
      };
    }
  }

  /**
   * Load cache from public JSON file
   */
  private async loadFromFile(): Promise<CacheInitializationResult> {
    try {
      const response = await fetch('/cache-data.json');

      if (!response.ok) {
        throw new Error(`Failed to fetch cache file: ${response.status}`);
      }

      const cacheData = await response.json();

      // Populate database from file
      for (const location of cacheData.locations) {
        const locationId = await cacheDatabaseService.addLocation({
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          type: location.type
        });

        // Add shelter if exists
        const shelter = cacheData.shelters.find((s: any) => s.location_id === location.id);
        if (shelter) {
          await cacheDatabaseService.addShelter({
            location_id: locationId,
            name: shelter.name,
            capacity: shelter.capacity,
            available_beds: shelter.available_beds,
            occupied_beds: shelter.occupied_beds,
            services: shelter.services,
            phone: shelter.phone,
            hours: shelter.hours,
            eligibility: shelter.eligibility,
            metrics: shelter.metrics,
            last_updated: shelter.last_updated
          });
        }
      }

      const metadata = await cacheDatabaseService.getCacheMetadata();

      console.log(`✅ Loaded ${metadata.total_locations} locations and ${metadata.total_shelters} shelters from file`);

      return {
        success: true,
        message: 'Cache loaded from file',
        source: 'file',
        stats: {
          locations: metadata.total_locations,
          shelters: metadata.total_shelters,
          lastSync: metadata.last_sync
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Failed to load cache from file:', errorMessage);

      return {
        success: false,
        message: 'Failed to load cache from file',
        source: 'none',
        error: errorMessage
      };
    }
  }

  /**
   * Populate cache from live data sources
   * (In production, this would call real APIs)
   */
  private async populateFromLiveData(): Promise<CacheInitializationResult> {
    try {
      console.log('🌐 Fetching live data from services...');

      // Simulated live data (would be real API calls in production)
      const liveLocations: Location[] = [
        {
          name: 'Blanchet House',
          address: '340 NW Glisan St, Portland, OR 97209',
          latitude: 45.5264,
          longitude: -122.6755,
          type: 'shelter'
        },
        {
          name: 'Outside In',
          address: '1132 SW 13th Ave, Portland, OR 97205',
          latitude: 45.5182,
          longitude: -122.6851,
          type: 'clinic'
        }
      ];

      const liveShelters: Array<Omit<Shelter, 'id' | 'location_id'> & { location_name: string }> = [
        {
          location_name: 'Blanchet House',
          name: 'Blanchet House',
          capacity: 125,
          available_beds: 15,
          occupied_beds: 110,
          services: JSON.stringify(['meals', 'shelter', 'showers', 'laundry']),
          phone: '503-241-4340',
          hours: '24/7',
          eligibility: 'Men only, 18+',
          metrics: JSON.stringify({ average_stay_days: 45, success_rate: 0.65 }),
          last_updated: new Date().toISOString()
        }
      ];

      // Clear existing cache
      await cacheDatabaseService.clearCache();

      // Add locations
      const locationMap = new Map<string, number>();
      for (const location of liveLocations) {
        const locationId = await cacheDatabaseService.addLocation(location);
        locationMap.set(location.name, locationId);
      }

      // Add shelters
      for (const shelter of liveShelters) {
        const locationId = locationMap.get(shelter.location_name);
        if (locationId) {
          await cacheDatabaseService.addShelter({
            location_id: locationId,
            name: shelter.name,
            capacity: shelter.capacity,
            available_beds: shelter.available_beds,
            occupied_beds: shelter.occupied_beds,
            services: shelter.services,
            phone: shelter.phone,
            hours: shelter.hours,
            eligibility: shelter.eligibility,
            metrics: shelter.metrics,
            last_updated: shelter.last_updated
          });
        }
      }

      const metadata = await cacheDatabaseService.getCacheMetadata();

      console.log(`✅ Populated cache with ${metadata.total_locations} locations and ${metadata.total_shelters} shelters`);

      return {
        success: true,
        message: 'Cache populated from live data',
        source: 'live',
        stats: {
          locations: metadata.total_locations,
          shelters: metadata.total_shelters,
          lastSync: metadata.last_sync
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to populate from live data:', errorMessage);

      return {
        success: false,
        message: 'Failed to populate from live data',
        source: 'none',
        error: errorMessage
      };
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.initialized) {
      await this.initialize();
    }

    return await cacheDatabaseService.getCacheMetadata();
  }

  /**
   * Check if cache is fresh
   */
  async isFresh(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    return await cacheDatabaseService.isCacheFresh();
  }

  /**
   * Refresh cache
   */
  async refresh(): Promise<CacheInitializationResult> {
    console.log('🔄 Refreshing cache...');
    this.initialized = false;
    return await this.initialize();
  }
}

export const cacheInitializationService = new CacheInitializationService();
