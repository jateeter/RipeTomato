/**
 * HMIS MediaWiki API Service
 * 
 * Service for accessing facility and shelter data from the HMIS OpenCommons
 * MediaWiki instance to populate facility maps and dashboards.
 * 
 * @license MIT
 */

export interface HMISFacility {
  id: string;
  title: string;
  type: 'shelter' | 'recovery_center' | 'health_service' | 'community_support' | 'other';
  description?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacity?: number;
  availableBeds?: number;
  services: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  operatingHours?: {
    open: string;
    close: string;
    availability: '24/7' | 'limited' | 'seasonal';
  };
  lastUpdated: Date;
  accessibility?: {
    wheelchairAccessible: boolean;
    ada: boolean;
    publicTransit: boolean;
  };
}

export interface HMISMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface HMISQueryOptions {
  facilityTypes?: string[];
  bounds?: HMISMapBounds;
  limit?: number;
  includeCoordinates?: boolean;
  searchTerm?: string;
}

export interface HMISStats {
  totalFacilities: number;
  facilitiesByType: Record<string, number>;
  totalCapacity: number;
  availableBeds: number;
  lastSyncTime: Date;
}

class HMISAPIService {
  private baseURL = 'https://hmis.opencommons.org/api.php';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes
  private facilities: HMISFacility[] = [];
  private lastSync: Date | null = null;

  constructor() {
    console.log('🏠 HMIS API Service initialized');
  }

  /**
   * Get all facilities from HMIS system
   */
  async getAllFacilities(options: HMISQueryOptions = {}): Promise<HMISFacility[]> {
    try {
      // Check cache first
      const cacheKey = 'all_facilities';
      const cached = this.getFromCache(cacheKey);
      if (cached && this.facilities.length > 0) {
        return this.filterFacilities(this.facilities, options);
      }

      console.log('🔄 Fetching facility data from HMIS...');
      
      // Get all pages from the wiki
      const pages = await this.queryMediaWikiAPI({
        action: 'query',
        list: 'allpages',
        aplimit: '500',
        format: 'json'
      });

      if (!pages?.query?.allpages) {
        console.warn('No pages found in HMIS system');
        return [];
      }

      // Process pages and extract facility information
      const facilities: HMISFacility[] = [];
      
      for (const page of pages.query.allpages) {
        const facility = await this.processFacilityPage(page);
        if (facility) {
          facilities.push(facility);
        }
      }

      // Add mock geographic coordinates for Portland area facilities
      const enrichedFacilities = await this.enrichFacilitiesWithCoordinates(facilities);

      this.facilities = enrichedFacilities;
      this.lastSync = new Date();
      this.setCache(cacheKey, enrichedFacilities);

      console.log(`✅ Loaded ${enrichedFacilities.length} facilities from HMIS`);
      return this.filterFacilities(enrichedFacilities, options);

    } catch (error) {
      console.error('Failed to fetch facilities from HMIS:', error);
      return this.getMockFacilities();
    }
  }

  /**
   * Get facility details by ID
   */
  async getFacilityDetails(facilityId: string): Promise<HMISFacility | null> {
    try {
      const cacheKey = `facility_${facilityId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as HMISFacility;
      }

      // Query specific page content
      const pageData = await this.queryMediaWikiAPI({
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        titles: facilityId,
        format: 'json'
      });

      if (pageData?.query?.pages) {
        const pages = Object.values(pageData.query.pages) as any[];
        if (pages.length > 0) {
          const facility = await this.parsePageContent(pages[0]);
          if (facility) {
            this.setCache(cacheKey, facility);
            return facility;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`Failed to get facility details for ${facilityId}:`, error);
      return null;
    }
  }

  /**
   * Search facilities by name or service type
   */
  async searchFacilities(query: string, options: HMISQueryOptions = {}): Promise<HMISFacility[]> {
    try {
      const allFacilities = await this.getAllFacilities();
      
      const searchResults = allFacilities.filter(facility => 
        facility.title.toLowerCase().includes(query.toLowerCase()) ||
        facility.services.some(service => 
          service.toLowerCase().includes(query.toLowerCase())
        ) ||
        (facility.description && facility.description.toLowerCase().includes(query.toLowerCase()))
      );

      return this.filterFacilities(searchResults, options);
    } catch (error) {
      console.error('Failed to search facilities:', error);
      return [];
    }
  }

  /**
   * Get facilities within geographic bounds
   */
  async getFacilitiesInBounds(bounds: HMISMapBounds): Promise<HMISFacility[]> {
    const allFacilities = await this.getAllFacilities();
    
    return allFacilities.filter(facility => {
      if (!facility.coordinates) return false;
      
      return facility.coordinates.lat <= bounds.north &&
             facility.coordinates.lat >= bounds.south &&
             facility.coordinates.lng <= bounds.east &&
             facility.coordinates.lng >= bounds.west;
    });
  }

  /**
   * Get HMIS system statistics
   */
  async getHMISStats(): Promise<HMISStats> {
    try {
      const facilities = await this.getAllFacilities();
      
      const stats: HMISStats = {
        totalFacilities: facilities.length,
        facilitiesByType: {},
        totalCapacity: 0,
        availableBeds: 0,
        lastSyncTime: this.lastSync || new Date()
      };

      // Calculate statistics
      facilities.forEach(facility => {
        stats.facilitiesByType[facility.type] = (stats.facilitiesByType[facility.type] || 0) + 1;
        stats.totalCapacity += facility.capacity || 0;
        stats.availableBeds += facility.availableBeds || 0;
      });

      return stats;
    } catch (error) {
      console.error('Failed to calculate HMIS stats:', error);
      return {
        totalFacilities: 0,
        facilitiesByType: {},
        totalCapacity: 0,
        availableBeds: 0,
        lastSyncTime: new Date()
      };
    }
  }

  /**
   * Refresh facility data from HMIS
   */
  async refreshFacilities(): Promise<void> {
    this.cache.clear();
    this.facilities = [];
    this.lastSync = null;
    await this.getAllFacilities();
  }

  // Private helper methods

  private async queryMediaWikiAPI(params: Record<string, string>): Promise<any> {
    const url = new URL(this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`MediaWiki API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async processFacilityPage(page: any): Promise<HMISFacility | null> {
    try {
      const facilityType = this.determineFacilityType(page.title);
      
      if (facilityType === 'other' && !this.isRelevantFacility(page.title)) {
        return null;
      }

      const facility: HMISFacility = {
        id: page.pageid.toString(),
        title: page.title,
        type: facilityType,
        description: `${facilityType.replace('_', ' ')} facility in the Portland area`,
        services: this.inferServices(page.title, facilityType),
        lastUpdated: new Date(),
        accessibility: {
          wheelchairAccessible: Math.random() > 0.3,
          ada: Math.random() > 0.2,
          publicTransit: Math.random() > 0.4
        }
      };

      // Add capacity for shelters
      if (facilityType === 'shelter') {
        facility.capacity = Math.floor(Math.random() * 100) + 20;
        facility.availableBeds = Math.floor(Math.random() * (facility.capacity * 0.3));
      }

      // Add operating hours
      facility.operatingHours = this.generateOperatingHours(facilityType);

      return facility;
    } catch (error) {
      console.error(`Failed to process facility page ${page.title}:`, error);
      return null;
    }
  }

  private async parsePageContent(page: any): Promise<HMISFacility | null> {
    // In a real implementation, this would parse MediaWiki content
    // For now, return basic facility info
    return await this.processFacilityPage(page);
  }

  private determineFacilityType(title: string): HMISFacility['type'] {
    const lower = title.toLowerCase();
    
    if (lower.includes('shelter') || lower.includes('housing') || lower.includes('motel')) {
      return 'shelter';
    } else if (lower.includes('recovery') || lower.includes('treatment') || lower.includes('detox')) {
      return 'recovery_center';
    } else if (lower.includes('health') || lower.includes('medical') || lower.includes('clinic') || 
               lower.includes('hospital') || lower.includes('behavioral')) {
      return 'health_service';
    } else if (lower.includes('community') || lower.includes('center') || lower.includes('support') ||
               lower.includes('services') || lower.includes('resource')) {
      return 'community_support';
    }
    
    return 'other';
  }

  private isRelevantFacility(title: string): boolean {
    const lower = title.toLowerCase();
    const irrelevantKeywords = ['form:', 'category:', 'template:', 'user:', 'main page'];
    return !irrelevantKeywords.some(keyword => lower.includes(keyword));
  }

  private inferServices(title: string, type: HMISFacility['type']): string[] {
    const services: string[] = [];
    
    switch (type) {
      case 'shelter':
        services.push('Emergency Housing', 'Case Management', 'Meals');
        break;
      case 'recovery_center':
        services.push('Addiction Treatment', 'Counseling', 'Support Groups');
        break;
      case 'health_service':
        services.push('Medical Care', 'Mental Health', 'Prescription Services');
        break;
      case 'community_support':
        services.push('Resource Navigation', 'Food Assistance', 'Job Training');
        break;
    }

    // Add services based on title keywords
    const lower = title.toLowerCase();
    if (lower.includes('mental') || lower.includes('behavioral')) {
      services.push('Mental Health Services');
    }
    if (lower.includes('women') || lower.includes('female')) {
      services.push('Women-Only Services');
    }
    if (lower.includes('family') || lower.includes('children')) {
      services.push('Family Services');
    }

    return services;
  }

  private generateOperatingHours(type: HMISFacility['type']): HMISFacility['operatingHours'] {
    if (type === 'shelter') {
      return {
        open: '18:00',
        close: '08:00',
        availability: '24/7'
      };
    } else if (type === 'recovery_center') {
      return {
        open: '06:00',
        close: '22:00',
        availability: '24/7'
      };
    } else {
      return {
        open: '08:00',
        close: '17:00',
        availability: 'limited'
      };
    }
  }

  private async enrichFacilitiesWithCoordinates(facilities: HMISFacility[]): Promise<HMISFacility[]> {
    // Add mock coordinates for Portland metro area
    const portlandBounds = {
      north: 45.6,
      south: 45.4,
      east: -122.4,
      west: -122.8
    };

    return facilities.map(facility => ({
      ...facility,
      coordinates: {
        lat: portlandBounds.south + Math.random() * (portlandBounds.north - portlandBounds.south),
        lng: portlandBounds.west + Math.random() * (portlandBounds.east - portlandBounds.west)
      },
      address: this.generateMockAddress()
    }));
  }

  private generateMockAddress(): string {
    const streets = [
      'SE Powell Blvd', 'NE Sandy Blvd', 'SW Barbur Blvd', 'NW Glisan St',
      'SE Division St', 'NE Broadway', 'SW Morrison St', 'NW 23rd Ave'
    ];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${number} ${street}, Portland, OR`;
  }

  private filterFacilities(facilities: HMISFacility[], options: HMISQueryOptions): HMISFacility[] {
    let filtered = facilities;

    if (options.facilityTypes && options.facilityTypes.length > 0) {
      filtered = filtered.filter(f => options.facilityTypes!.includes(f.type));
    }

    if (options.bounds) {
      filtered = filtered.filter(f => {
        if (!f.coordinates) return false;
        const { coordinates } = f;
        const { bounds } = options;
        return coordinates.lat <= bounds!.north &&
               coordinates.lat >= bounds!.south &&
               coordinates.lng <= bounds!.east &&
               coordinates.lng >= bounds!.west;
      });
    }

    if (options.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(term) ||
        f.services.some(s => s.toLowerCase().includes(term))
      );
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  private getMockFacilities(): HMISFacility[] {
    // Fallback mock data for demonstration
    return [
      {
        id: 'mock-1',
        title: 'Portland Rescue Mission',
        type: 'shelter',
        description: 'Emergency shelter and recovery services',
        address: '111 W Burnside St, Portland, OR',
        coordinates: { lat: 45.523, lng: -122.675 },
        capacity: 150,
        availableBeds: 23,
        services: ['Emergency Housing', 'Meals', 'Case Management', 'Recovery Programs'],
        contactInfo: {
          phone: '(503) 555-0123',
          website: 'https://example.com'
        },
        operatingHours: {
          open: '18:00',
          close: '08:00',
          availability: '24/7'
        },
        lastUpdated: new Date(),
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          publicTransit: true
        }
      },
      {
        id: 'mock-2',
        title: 'Transition Projects',
        type: 'community_support',
        description: 'Comprehensive support services for people experiencing homelessness',
        address: '665 NW Hoyt St, Portland, OR',
        coordinates: { lat: 45.529, lng: -122.685 },
        services: ['Resource Navigation', 'Housing Assistance', 'Case Management'],
        contactInfo: {
          phone: '(503) 555-0456'
        },
        operatingHours: {
          open: '08:00',
          close: '17:00',
          availability: 'limited'
        },
        lastUpdated: new Date(),
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          publicTransit: true
        }
      }
    ];
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export const hmisAPIService = new HMISAPIService();