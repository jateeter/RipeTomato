/**
 * Cached Location Service
 *
 * Provides access to cached location and shelter data from HMIS OpenCommons.
 * Uses ONLY the cache - does not make external API calls during app runtime.
 */

import { cacheInitializationService, Location, Shelter } from './cacheInitializationService';

export interface CachedLocation extends Location {
  shelter?: CachedShelter;
}

export interface CachedShelter extends Shelter {
  location?: Location;
}

export interface LocationSearchParams {
  type?: string;
  hasAvailableBeds?: boolean;
  nearCoordinates?: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
  };
  limit?: number;
}

class CachedLocationService {
  private initialized = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure cache is loaded
    await cacheInitializationService.initialize();
    this.initialized = true;

    console.log('📍 Cached Location Service initialized');
  }

  /**
   * Get all locations from cache
   */
  getAllLocations(): Location[] {
    const cacheData = cacheInitializationService.getCachedData();
    if (!cacheData) {
      console.warn('⚠️ No cache data available');
      return [];
    }

    return cacheData.locations || [];
  }

  /**
   * Get locations by type
   */
  getLocationsByType(type: string): Location[] {
    const allLocations = this.getAllLocations();
    return allLocations.filter(loc => loc.type === type);
  }

  /**
   * Get shelters only
   */
  getShelters(): CachedLocation[] {
    const cacheData = cacheInitializationService.getCachedData();
    if (!cacheData) return [];

    const shelterLocations = cacheData.locations.filter(loc => loc.type === 'shelter');

    // Attach shelter data to locations
    return shelterLocations.map(location => {
      const shelter = cacheData.shelters.find(s => s.location_id === location.id);
      return {
        ...location,
        shelter: shelter || undefined
      };
    });
  }

  /**
   * Get shelters with available beds
   */
  getSheltersWithAvailability(): CachedLocation[] {
    const shelters = this.getShelters();
    return shelters.filter(s => s.shelter && s.shelter.available_beds > 0);
  }

  /**
   * Search locations
   */
  searchLocations(params: LocationSearchParams): CachedLocation[] {
    let results = this.getAllLocations();

    // Filter by type
    if (params.type) {
      results = results.filter(loc => loc.type === params.type);
    }

    // Filter by available beds
    if (params.hasAvailableBeds) {
      const cacheData = cacheInitializationService.getCachedData();
      if (cacheData) {
        results = results.filter(loc => {
          const shelter = cacheData.shelters.find(s => s.location_id === loc.id);
          return shelter && shelter.available_beds > 0;
        });
      }
    }

    // Filter by proximity
    if (params.nearCoordinates) {
      const { latitude, longitude, radiusKm = 10 } = params.nearCoordinates;
      results = results.filter(loc => {
        if (!loc.latitude || !loc.longitude) return false;
        const distance = this.calculateDistance(
          latitude,
          longitude,
          loc.latitude,
          loc.longitude
        );
        return distance <= radiusKm;
      });
    }

    // Limit results
    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    // Attach shelter data
    const cacheData = cacheInitializationService.getCachedData();
    if (cacheData) {
      return results.map(location => ({
        ...location,
        shelter: cacheData.shelters.find(s => s.location_id === location.id)
      }));
    }

    return results.map(location => ({ ...location }));
  }

  /**
   * Get location by ID
   */
  getLocationById(id: number): CachedLocation | null {
    const allLocations = this.getAllLocations();
    const location = allLocations.find(loc => loc.id === id);

    if (!location) return null;

    const cacheData = cacheInitializationService.getCachedData();
    const shelter = cacheData?.shelters.find(s => s.location_id === id);

    return {
      ...location,
      shelter: shelter || undefined
    };
  }

  /**
   * Get locations within bounds (for map display)
   */
  getLocationsInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): CachedLocation[] {
    const allLocations = this.getAllLocations();

    const filtered = allLocations.filter(loc => {
      if (!loc.latitude || !loc.longitude) return false;

      return (
        loc.latitude >= bounds.south &&
        loc.latitude <= bounds.north &&
        loc.longitude >= bounds.west &&
        loc.longitude <= bounds.east
      );
    });

    // Attach shelter data
    const cacheData = cacheInitializationService.getCachedData();
    if (cacheData) {
      return filtered.map(location => ({
        ...location,
        shelter: cacheData.shelters.find(s => s.location_id === location.id)
      }));
    }

    return filtered.map(location => ({ ...location }));
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await cacheInitializationService.getStats();
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if cache is fresh
   */
  async isCacheFresh(): Promise<boolean> {
    return await cacheInitializationService.isFresh();
  }

  /**
   * Refresh cache (force re-initialization)
   */
  async refreshCache() {
    return await cacheInitializationService.refresh();
  }
}

export const cachedLocationService = new CachedLocationService();
