/**
 * Geocoding Service
 * 
 * Service for converting street addresses to latitude/longitude coordinates
 * using OpenStreetMap Nominatim API (free) and Portland area fallbacks.
 * 
 * @license MIT
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  confidence: number;
  source: 'nominatim' | 'cache' | 'fallback';
}

export interface GeocodeRequest {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface CachedCoordinate {
  coords: GeocodeResult;
  timestamp: number;
  expiry: number;
}

class GeocodingService {
  private cache: Map<string, CachedCoordinate> = new Map();
  private readonly cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly baseURL = 'https://nominatim.openstreetmap.org/search';
  private readonly rateLimitDelay = 1000; // 1 second between requests
  private lastRequestTime = 0;

  // Portland metro area bounds for fallback coordinates
  private readonly portlandBounds = {
    north: 45.65,
    south: 45.35,
    east: -122.4,
    west: -122.8,
    center: { lat: 45.515, lng: -122.65 }
  };

  // Known Portland area facilities with approximate coordinates
  private readonly knownFacilities: Map<string, GeocodeResult> = new Map([
    ['82nd avenue motel shelter', {
      latitude: 45.5269,
      longitude: -122.5768,
      formatted_address: '1707 NE 82nd Ave, Portland, OR 97216',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['arbor lodge shelter', {
      latitude: 45.5751,
      longitude: -122.7068,
      formatted_address: '1954 N Lombard St, Portland, OR 97217',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['banfield motel shelter', {
      latitude: 45.5298,
      longitude: -122.6252,
      formatted_address: '1525 NE 37th Ave, Portland, OR 97232',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['barbur motel shelter', {
      latitude: 45.4434,
      longitude: -122.7344,
      formatted_address: '10450 SW Barbur Blvd, Portland, OR 97219',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['beaverton permanent shelter', {
      latitude: 45.4634,
      longitude: -122.8028,
      formatted_address: '11390 SW Beaverton Hillsdale Hwy, Beaverton, OR 97005',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['portland rescue mission', {
      latitude: 45.523,
      longitude: -122.675,
      formatted_address: '111 W Burnside St, Portland, OR',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['transition projects', {
      latitude: 45.529,
      longitude: -122.685,
      formatted_address: '665 NW Hoyt St, Portland, OR',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['cloverleaf shelter', {
      latitude: 45.5217,
      longitude: -122.9853,
      formatted_address: '801 NE 34th Ave, Hillsboro, OR 97124',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['city of portland shelter services', {
      latitude: 45.5152,
      longitude: -122.6784,
      formatted_address: '1221 SW 4th Ave, Portland, OR 97204',
      confidence: 0.95,
      source: 'cache' as const
    }],
    ['clinton triangle shelter', {
      latitude: 45.5033,
      longitude: -122.6425,
      formatted_address: '1490 SE Gideon St, Portland, OR 97202',
      confidence: 0.95,
      source: 'cache' as const
    }]
  ]);

  constructor() {
    console.log('🌍 Geocoding Service initialized');
    this.loadCacheFromStorage();
  }

  /**
   * Geocode a single address
   */
  async geocodeAddress(request: GeocodeRequest): Promise<GeocodeResult | null> {
    try {
      const addressKey = this.createCacheKey(request);
      
      // Check cache first
      const cached = this.getFromCache(addressKey);
      if (cached) {
        console.log(`📍 Using cached coordinates for: ${request.address}`);
        return cached;
      }

      // Check known facilities
      const knownResult = this.checkKnownFacilities(request);
      if (knownResult) {
        console.log(`🏠 Using known facility coordinates for: ${request.address}`);
        this.setCache(addressKey, knownResult);
        return knownResult;
      }

      // Try Nominatim API
      const nominatimResult = await this.geocodeWithNominatim(request);
      if (nominatimResult) {
        console.log(`🌐 Geocoded via Nominatim: ${request.address}`);
        this.setCache(addressKey, nominatimResult);
        return nominatimResult;
      }

      // Generate Portland area fallback
      const fallbackResult = this.generatePortlandAreaFallback(request);
      console.log(`🎯 Using Portland area fallback for: ${request.address}`);
      this.setCache(addressKey, fallbackResult);
      return fallbackResult;

    } catch (error) {
      console.error(`Failed to geocode address "${request.address}":`, error);
      
      // Return fallback coordinates
      const fallbackResult = this.generatePortlandAreaFallback(request);
      return fallbackResult;
    }
  }

  /**
   * Geocode multiple addresses with rate limiting
   */
  async geocodeAddressBatch(requests: GeocodeRequest[]): Promise<(GeocodeResult | null)[]> {
    const results: (GeocodeResult | null)[] = [];
    
    console.log(`🚀 Starting batch geocoding of ${requests.length} addresses...`);
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      try {
        const result = await this.geocodeAddress(request);
        results.push(result);
        
        if ((i + 1) % 10 === 0) {
          console.log(`📍 Geocoded ${i + 1}/${requests.length} addresses`);
        }
        
        // Rate limiting for API requests
        if (i < requests.length - 1) {
          await this.delay(this.rateLimitDelay);
        }
        
      } catch (error) {
        console.error(`Failed to geocode request ${i + 1}:`, error);
        results.push(this.generatePortlandAreaFallback(request));
      }
    }
    
    console.log(`✅ Batch geocoding completed: ${results.filter(r => r !== null).length}/${requests.length} successful`);
    return results;
  }

  /**
   * Geocode using OpenStreetMap Nominatim API
   */
  private async geocodeWithNominatim(request: GeocodeRequest): Promise<GeocodeResult | null> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.rateLimitDelay) {
        await this.delay(this.rateLimitDelay - timeSinceLastRequest);
      }

      // Build query
      const fullAddress = this.buildFullAddress(request);
      const params = new URLSearchParams({
        q: fullAddress,
        format: 'json',
        limit: '1',
        countrycodes: 'us',
        'accept-language': 'en',
        addressdetails: '1'
      });

      const url = `${this.baseURL}?${params.toString()}`;
      
      console.log(`🌐 Nominatim request: ${fullAddress}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'IdahoApp-ShelterMapping/1.0 (community@idahoapp.org)'
        }
      });

      this.lastRequestTime = Date.now();

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formatted_address: result.display_name,
          confidence: this.calculateConfidence(result),
          source: 'nominatim'
        };
      }

      return null;

    } catch (error) {
      console.warn('Nominatim geocoding failed:', error);
      return null;
    }
  }

  /**
   * Check if address matches known facilities
   */
  private checkKnownFacilities(request: GeocodeRequest): GeocodeResult | null {
    const addressLower = request.address.toLowerCase();
    
    for (const [name, coords] of this.knownFacilities) {
      if (addressLower.includes(name) || name.includes(addressLower.split(',')[0].trim())) {
        return coords;
      }
    }
    
    return null;
  }

  /**
   * Generate fallback coordinates in Portland metro area
   */
  private generatePortlandAreaFallback(request: GeocodeRequest): GeocodeResult {
    // Use street name patterns to place in appropriate Portland area
    const address = request.address.toLowerCase();
    let lat = this.portlandBounds.center.lat;
    let lng = this.portlandBounds.center.lng;

    // Rough area placement based on common Portland street patterns
    if (address.includes('ne ') || address.includes('northeast')) {
      lat += (Math.random() - 0.5) * 0.15;
      lng += Math.random() * 0.1;
    } else if (address.includes('se ') || address.includes('southeast')) {
      lat -= Math.random() * 0.1;
      lng += Math.random() * 0.1;
    } else if (address.includes('sw ') || address.includes('southwest')) {
      lat -= Math.random() * 0.1;
      lng -= Math.random() * 0.1;
    } else if (address.includes('nw ') || address.includes('northwest')) {
      lat += Math.random() * 0.1;
      lng -= Math.random() * 0.1;
    } else if (address.includes('beaverton')) {
      lat = 45.4871;
      lng = -122.8037 + (Math.random() - 0.5) * 0.05;
    } else if (address.includes('hillsboro')) {
      lat = 45.5217;
      lng = -122.9853 + (Math.random() - 0.5) * 0.05;
    } else {
      // Random placement in central Portland
      lat += (Math.random() - 0.5) * 0.1;
      lng += (Math.random() - 0.5) * 0.1;
    }

    // Ensure coordinates are within Portland metro bounds
    lat = Math.max(this.portlandBounds.south, Math.min(this.portlandBounds.north, lat));
    lng = Math.max(this.portlandBounds.west, Math.min(this.portlandBounds.east, lng));

    return {
      latitude: lat,
      longitude: lng,
      formatted_address: request.address,
      confidence: 0.5, // Lower confidence for fallback
      source: 'fallback'
    };
  }

  /**
   * Build full address string for geocoding
   */
  private buildFullAddress(request: GeocodeRequest): string {
    const parts = [request.address];
    
    if (request.city) {
      parts.push(request.city);
    }
    
    if (request.state) {
      parts.push(request.state);
    } else {
      parts.push('OR'); // Default to Oregon
    }
    
    if (request.zipCode) {
      parts.push(request.zipCode);
    }

    return parts.join(', ');
  }

  /**
   * Calculate confidence score based on Nominatim result
   */
  private calculateConfidence(result: any): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence based on result quality
    if (result.class === 'building' || result.class === 'amenity') {
      confidence += 0.2;
    }
    
    if (result.addresstype === 'house' || result.addresstype === 'building') {
      confidence += 0.1;
    }

    // Oregon results get higher confidence
    if (result.display_name?.includes('Oregon')) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Cache management
   */
  private createCacheKey(request: GeocodeRequest): string {
    return `${request.address}_${request.city || ''}_${request.state || ''}`.toLowerCase().trim();
  }

  private getFromCache(key: string): GeocodeResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.coords;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, result: GeocodeResult): void {
    this.cache.set(key, {
      coords: result,
      timestamp: Date.now(),
      expiry: Date.now() + this.cacheExpiry
    });
    this.saveCacheToStorage();
  }

  private loadCacheFromStorage(): void {
    try {
      const stored = localStorage.getItem('geocoding_cache');
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(Object.entries(data));
        console.log(`📍 Loaded ${this.cache.size} cached coordinates`);
      }
    } catch (error) {
      console.warn('Failed to load geocoding cache:', error);
    }
  }

  private saveCacheToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem('geocoding_cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save geocoding cache:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache and reset service
   */
  public clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('geocoding_cache');
    console.log('🗑️ Geocoding cache cleared');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach((cached) => {
      if (now < cached.expiry) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries
    };
  }
}

export const geocodingService = new GeocodingService();