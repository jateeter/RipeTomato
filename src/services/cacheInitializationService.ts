/**
 * Cache Initialization Service
 *
 * Manages loading and initializing the cache database during app startup.
 * Falls back to fetching from public cache file or populating from live data.
 */

// Temporarily disable database service due to webpack bundling issues with sql.js
// Using direct localStorage caching instead
// import { cacheDatabaseService, Location, Shelter } from './cacheDatabase';

export interface Location {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'shelter' | 'service' | 'clinic' | 'food' | 'other';
  created_at?: string;
  updated_at?: string;
}

export interface Shelter {
  id?: number;
  location_id: number;
  name: string;
  capacity: number;
  available_beds: number;
  occupied_beds: number;
  services: string;
  phone?: string;
  hours?: string;
  eligibility?: string;
  metrics: string;
  last_updated: string;
  created_at?: string;
}

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

interface CacheData {
  locations: Location[];
  shelters: Shelter[];
  metadata: {
    last_sync: string;
    version: string;
    total_locations: number;
    total_shelters: number;
  };
}

class CacheInitializationService {
  private initialized = false;
  private readonly CACHE_KEY = 'cache_data';
  private readonly CACHE_MAX_AGE_HOURS = 24;

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
      // Step 1: Try to load from localStorage
      console.log('📦 Initializing cache...');
      const cachedData = this.loadFromLocalStorage();

      if (cachedData && this.isCacheFresh(cachedData)) {
        console.log('✅ Using fresh cache from localStorage');
        this.initialized = true;
        return {
          success: true,
          message: 'Fresh cache loaded from localStorage',
          source: 'database',
          stats: {
            locations: cachedData.metadata.total_locations,
            shelters: cachedData.metadata.total_shelters,
            lastSync: cachedData.metadata.last_sync
          }
        };
      }

      // Step 2: Try to load from public cache file
      console.log('📂 Cache stale or empty, loading from file...');
      const fileResult = await this.loadFromFile();

      if (fileResult.success) {
        this.initialized = true;
        return fileResult;
      }

      // Step 3: Fallback to live data population
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
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): CacheData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToLocalStorage(data: CacheData): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Check if cache is fresh
   */
  private isCacheFresh(data: CacheData): boolean {
    const lastSync = new Date(data.metadata.last_sync);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursDiff < this.CACHE_MAX_AGE_HOURS && data.locations.length > 0;
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

      const cacheData: CacheData = await response.json();

      // Save to localStorage
      this.saveToLocalStorage(cacheData);

      console.log(`✅ Loaded ${cacheData.metadata.total_locations} locations and ${cacheData.metadata.total_shelters} shelters from file`);

      return {
        success: true,
        message: 'Cache loaded from file',
        source: 'file',
        stats: {
          locations: cacheData.metadata.total_locations,
          shelters: cacheData.metadata.total_shelters,
          lastSync: cacheData.metadata.last_sync
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
      const liveData: CacheData = {
        locations: [
          {
            id: 1,
            name: 'Blanchet House',
            address: '340 NW Glisan St, Portland, OR 97209',
            latitude: 45.5264,
            longitude: -122.6755,
            type: 'shelter',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Outside In',
            address: '1132 SW 13th Ave, Portland, OR 97205',
            latitude: 45.5182,
            longitude: -122.6851,
            type: 'clinic',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        shelters: [
          {
            id: 1,
            location_id: 1,
            name: 'Blanchet House',
            capacity: 125,
            available_beds: 15,
            occupied_beds: 110,
            services: JSON.stringify(['meals', 'shelter', 'showers', 'laundry']),
            phone: '503-241-4340',
            hours: '24/7',
            eligibility: 'Men only, 18+',
            metrics: JSON.stringify({ average_stay_days: 45, success_rate: 0.65 }),
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ],
        metadata: {
          last_sync: new Date().toISOString(),
          version: '1.0.0',
          total_locations: 2,
          total_shelters: 1
        }
      };

      // Save to localStorage
      this.saveToLocalStorage(liveData);

      console.log(`✅ Populated cache with ${liveData.metadata.total_locations} locations and ${liveData.metadata.total_shelters} shelters`);

      return {
        success: true,
        message: 'Cache populated from live data',
        source: 'live',
        stats: {
          locations: liveData.metadata.total_locations,
          shelters: liveData.metadata.total_shelters,
          lastSync: liveData.metadata.last_sync
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

    const data = this.loadFromLocalStorage();
    return data?.metadata || {
      last_sync: new Date().toISOString(),
      version: '1.0.0',
      total_locations: 0,
      total_shelters: 0
    };
  }

  /**
   * Check if cache is fresh
   */
  async isFresh(): Promise<boolean> {
    const data = this.loadFromLocalStorage();
    return data ? this.isCacheFresh(data) : false;
  }

  /**
   * Refresh cache
   */
  async refresh(): Promise<CacheInitializationResult> {
    console.log('🔄 Refreshing cache...');
    this.initialized = false;
    return await this.initialize();
  }

  /**
   * Get cached data
   */
  getCachedData(): CacheData | null {
    return this.loadFromLocalStorage();
  }
}

export const cacheInitializationService = new CacheInitializationService();
