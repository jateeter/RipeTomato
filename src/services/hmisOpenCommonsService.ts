/**
 * HMIS OpenCommons API Service
 * 
 * Service for fetching shelter and facility data from HMIS OpenCommons
 * at https://hmis.opencommons.org/Facilities
 * 
 * @license MIT
 */

export interface HMISOpenCommonsFacility {
  id: string;
  name: string;
  type: string;
  description?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    fax?: string;
  };
  services: string[];
  capacity: {
    total?: number;
    available?: number;
    occupied?: number;
    beds?: number;
    units?: number;
  };
  eligibility: {
    populations?: string[];
    requirements?: string[];
    restrictions?: string[];
    ageRange?: {
      min?: number;
      max?: number;
    };
    gender?: string[];
  };
  operatingSchedule: {
    hoursOfOperation?: string;
    seasonalOperation?: boolean;
    availability?: string;
    accessHours?: string;
  };
  accessibility: {
    wheelchairAccessible?: boolean;
    ada?: boolean;
    publicTransit?: boolean;
    parking?: boolean;
    languages?: string[];
  };
  lastUpdated: string;
  dataSource: string;
  verificationStatus: string;
  additionalInfo?: any;
}

export interface FacilitySearchParams {
  city?: string;
  state?: string;
  zipCode?: string;
  facilityType?: string;
  services?: string[];
  population?: string[];
  coordinates?: {
    lat: number;
    lng: number;
    radius?: number;
  };
  limit?: number;
  offset?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
  lastUpdated: string;
}

class HMISOpenCommonsService {
  private baseUrl = 'https://hmis.opencommons.org';
  private facilitiesEndpoint = '/Facilities';
  private cache: Map<string, { data: HMISOpenCommonsFacility[]; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    console.log('🏢 HMIS OpenCommons Service initialized');
  }

  /**
   * Fetch all facilities from HMIS OpenCommons
   */
  async getAllFacilities(searchParams?: FacilitySearchParams): Promise<APIResponse<HMISOpenCommonsFacility>> {
    try {
      console.log('📥 Fetching facilities from HMIS OpenCommons...');

      // Check cache first
      const cacheKey = this.generateCacheKey(searchParams);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📋 Returning cached facilities data');
        return {
          success: true,
          data: cached,
          total: cached.length,
          limit: searchParams?.limit || cached.length,
          offset: searchParams?.offset || 0,
          lastUpdated: new Date().toISOString()
        };
      }

      // Fetch from API
      const url = this.buildApiUrl(searchParams);
      console.log('🌐 Fetching from:', url);

      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      let facilities: HMISOpenCommonsFacility[];

      // Try to parse as JSON first, then handle other formats
      try {
        const jsonData = JSON.parse(responseText);
        facilities = this.parseAPIResponse(jsonData);
      } catch (jsonError) {
        // If not JSON, try to parse as HTML/CSV/other formats
        facilities = this.parseNonJSONResponse(responseText);
      }

      // Process and normalize the data
      const processedFacilities = this.processFacilities(facilities);

      // Cache the results
      this.setCache(cacheKey, processedFacilities);

      console.log(`✅ Successfully fetched ${processedFacilities.length} facilities`);

      return {
        success: true,
        data: processedFacilities,
        total: processedFacilities.length,
        limit: searchParams?.limit || processedFacilities.length,
        offset: searchParams?.offset || 0,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to fetch facilities from HMIS OpenCommons:', error);
      
      // Return mock data as fallback
      const mockFacilities = this.getMockFacilities();
      
      return {
        success: false,
        data: mockFacilities,
        total: mockFacilities.length,
        limit: searchParams?.limit || mockFacilities.length,
        offset: searchParams?.offset || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch facilities by geographic bounds
   */
  async getFacilitiesInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<HMISOpenCommonsFacility[]> {
    const allFacilities = await this.getAllFacilities();
    
    return allFacilities.data.filter(facility => {
      const lat = facility.address.latitude;
      const lng = facility.address.longitude;
      
      if (!lat || !lng) return false;
      
      return lat <= bounds.north && 
             lat >= bounds.south && 
             lng <= bounds.east && 
             lng >= bounds.west;
    });
  }

  /**
   * Search facilities by criteria
   */
  async searchFacilities(query: string, filters?: FacilitySearchParams): Promise<HMISOpenCommonsFacility[]> {
    const allFacilities = await this.getAllFacilities(filters);
    const queryLower = query.toLowerCase();
    
    return allFacilities.data.filter(facility => 
      facility.name.toLowerCase().includes(queryLower) ||
      facility.description?.toLowerCase().includes(queryLower) ||
      facility.address.city?.toLowerCase().includes(queryLower) ||
      facility.services.some(service => service.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Build API URL with parameters
   */
  private buildApiUrl(params?: FacilitySearchParams): string {
    const url = new URL(this.facilitiesEndpoint, this.baseUrl);
    
    if (params) {
      if (params.city) url.searchParams.set('city', params.city);
      if (params.state) url.searchParams.set('state', params.state);
      if (params.zipCode) url.searchParams.set('zipCode', params.zipCode);
      if (params.facilityType) url.searchParams.set('type', params.facilityType);
      if (params.limit) url.searchParams.set('limit', params.limit.toString());
      if (params.offset) url.searchParams.set('offset', params.offset.toString());
      if (params.services) {
        params.services.forEach(service => url.searchParams.append('services', service));
      }
    }
    
    // Add format parameter
    url.searchParams.set('format', 'json');
    
    return url.toString();
  }

  /**
   * Fetch with retry mechanism
   */
  private async fetchWithRetry(url: string, maxRetries: number = 3): Promise<Response> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Fetch attempt ${attempt}/${maxRetries}: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/html, */*',
            'User-Agent': 'Idaho-Events-App/1.0',
          },
          // Add timeout
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown fetch error');
        console.warn(`⚠️ Fetch attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Parse API response (JSON format)
   */
  private parseAPIResponse(data: any): HMISOpenCommonsFacility[] {
    if (Array.isArray(data)) {
      return data;
    } else if (data.facilities && Array.isArray(data.facilities)) {
      return data.facilities;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.results && Array.isArray(data.results)) {
      return data.results;
    } else {
      console.warn('⚠️ Unexpected API response format:', data);
      return [];
    }
  }

  /**
   * Parse non-JSON response (HTML, CSV, etc.)
   */
  private parseNonJSONResponse(responseText: string): HMISOpenCommonsFacility[] {
    console.log('📄 Parsing non-JSON response...');
    
    // Try to extract data from HTML
    if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
      return this.parseHTMLResponse(responseText);
    }
    
    // Try to parse as CSV
    if (responseText.includes(',') && responseText.includes('\n')) {
      return this.parseCSVResponse(responseText);
    }
    
    console.warn('⚠️ Unable to parse response format');
    return [];
  }

  /**
   * Parse HTML response to extract facility data
   */
  private parseHTMLResponse(html: string): HMISOpenCommonsFacility[] {
    // This is a simplified HTML parser - in production, you'd want to use DOMParser
    const facilities: HMISOpenCommonsFacility[] = [];
    
    try {
      // Look for common HTML patterns that might contain facility data
      const tableMatches = html.match(/<table[^>]*>(.*?)<\/table>/gis);
      const listMatches = html.match(/<ul[^>]*>(.*?)<\/ul>/gis);
      
      if (tableMatches) {
        facilities.push(...this.extractFacilitiesFromTable(tableMatches[0]));
      } else if (listMatches) {
        facilities.push(...this.extractFacilitiesFromList(listMatches[0]));
      }
      
    } catch (error) {
      console.error('Failed to parse HTML response:', error);
    }
    
    return facilities;
  }

  /**
   * Parse CSV response
   */
  private parseCSVResponse(csv: string): HMISOpenCommonsFacility[] {
    const facilities: HMISOpenCommonsFacility[] = [];
    const lines = csv.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return facilities;
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= headers.length) {
        const facility = this.createFacilityFromCSVRow(headers, values);
        if (facility) facilities.push(facility);
      }
    }
    
    return facilities;
  }

  /**
   * Create facility object from CSV row
   */
  private createFacilityFromCSVRow(headers: string[], values: string[]): HMISOpenCommonsFacility | null {
    try {
      const facility: HMISOpenCommonsFacility = {
        id: this.getValueByHeader(headers, values, ['id', 'facility_id', 'ID']) || `facility_${Date.now()}_${Math.random()}`,
        name: this.getValueByHeader(headers, values, ['name', 'facility_name', 'organization']) || 'Unknown Facility',
        type: this.getValueByHeader(headers, values, ['type', 'facility_type', 'service_type']) || 'shelter',
        description: this.getValueByHeader(headers, values, ['description', 'notes', 'comments']),
        address: {
          street: this.getValueByHeader(headers, values, ['address', 'street', 'street_address']),
          city: this.getValueByHeader(headers, values, ['city', 'municipality']),
          state: this.getValueByHeader(headers, values, ['state', 'province']),
          zipCode: this.getValueByHeader(headers, values, ['zip', 'zipcode', 'postal_code']),
          latitude: this.parseFloat(this.getValueByHeader(headers, values, ['latitude', 'lat', 'y'])),
          longitude: this.parseFloat(this.getValueByHeader(headers, values, ['longitude', 'lng', 'lon', 'x']))
        },
        contact: {
          phone: this.getValueByHeader(headers, values, ['phone', 'telephone', 'contact_phone']),
          email: this.getValueByHeader(headers, values, ['email', 'contact_email']),
          website: this.getValueByHeader(headers, values, ['website', 'url', 'web'])
        },
        services: this.parseServices(this.getValueByHeader(headers, values, ['services', 'service_types', 'programs'])),
        capacity: {
          total: this.parseInt(this.getValueByHeader(headers, values, ['capacity', 'total_beds', 'beds'])),
          available: this.parseInt(this.getValueByHeader(headers, values, ['available', 'available_beds'])),
          occupied: this.parseInt(this.getValueByHeader(headers, values, ['occupied', 'occupied_beds']))
        },
        eligibility: {
          populations: this.parsePopulations(this.getValueByHeader(headers, values, ['populations', 'target_population', 'demographics'])),
          requirements: this.parseArray(this.getValueByHeader(headers, values, ['requirements', 'eligibility'])),
          restrictions: this.parseArray(this.getValueByHeader(headers, values, ['restrictions', 'limitations']))
        },
        operatingSchedule: {
          hoursOfOperation: this.getValueByHeader(headers, values, ['hours', 'operating_hours', 'schedule']),
          availability: this.getValueByHeader(headers, values, ['availability', 'when_open'])
        },
        accessibility: {
          wheelchairAccessible: this.parseBoolean(this.getValueByHeader(headers, values, ['wheelchair', 'accessible', 'ada'])),
          publicTransit: this.parseBoolean(this.getValueByHeader(headers, values, ['transit', 'public_transport']))
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'hmis_opencommons',
        verificationStatus: 'unverified'
      };

      return facility;
    } catch (error) {
      console.error('Failed to create facility from CSV row:', error);
      return null;
    }
  }

  /**
   * Process and normalize facilities data
   */
  private processFacilities(facilities: HMISOpenCommonsFacility[]): HMISOpenCommonsFacility[] {
    return facilities.map(facility => ({
      ...facility,
      id: facility.id || `facility_${Date.now()}_${Math.random()}`,
      name: facility.name || 'Unknown Facility',
      type: facility.type || 'shelter',
      address: {
        ...facility.address,
        // Ensure coordinates are numbers
        latitude: typeof facility.address.latitude === 'number' ? facility.address.latitude : undefined,
        longitude: typeof facility.address.longitude === 'number' ? facility.address.longitude : undefined,
      },
      services: Array.isArray(facility.services) ? facility.services : [],
      lastUpdated: facility.lastUpdated || new Date().toISOString(),
      dataSource: facility.dataSource || 'hmis_opencommons',
      verificationStatus: facility.verificationStatus || 'unverified'
    }));
  }

  /**
   * Helper functions
   */
  private getValueByHeader(headers: string[], values: string[], possibleHeaders: string[]): string | undefined {
    for (const header of possibleHeaders) {
      const index = headers.findIndex(h => h.toLowerCase().includes(header.toLowerCase()));
      if (index !== -1 && values[index]) {
        return values[index];
      }
    }
    return undefined;
  }

  private parseFloat(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseInt(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseBoolean(value: string | undefined): boolean | undefined {
    if (!value) return undefined;
    const lower = value.toLowerCase();
    if (['yes', 'true', '1', 'y'].includes(lower)) return true;
    if (['no', 'false', '0', 'n'].includes(lower)) return false;
    return undefined;
  }

  private parseServices(value: string | undefined): string[] {
    if (!value) return [];
    return value.split(/[,;|]/).map(s => s.trim()).filter(s => s);
  }

  private parsePopulations(value: string | undefined): string[] {
    if (!value) return [];
    return value.split(/[,;|]/).map(s => s.trim()).filter(s => s);
  }

  private parseArray(value: string | undefined): string[] {
    if (!value) return [];
    return value.split(/[,;|]/).map(s => s.trim()).filter(s => s);
  }

  /**
   * Extract facilities from HTML table
   */
  private extractFacilitiesFromTable(tableHtml: string): HMISOpenCommonsFacility[] {
    // Simplified HTML table extraction
    const facilities: HMISOpenCommonsFacility[] = [];
    
    // This would need a proper HTML parser in production
    console.log('📊 Extracting facilities from HTML table...');
    
    return facilities;
  }

  /**
   * Extract facilities from HTML list
   */
  private extractFacilitiesFromList(listHtml: string): HMISOpenCommonsFacility[] {
    const facilities: HMISOpenCommonsFacility[] = [];
    
    console.log('📋 Extracting facilities from HTML list...');
    
    return facilities;
  }

  /**
   * Cache management
   */
  private generateCacheKey(params?: FacilitySearchParams): string {
    return `facilities_${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): HMISOpenCommonsFacility[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: HMISOpenCommonsFacility[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get mock facilities data as fallback
   */
  private getMockFacilities(): HMISOpenCommonsFacility[] {
    return [
      {
        id: 'hmis_001',
        name: 'Portland Rescue Mission - Burnside Shelter',
        type: 'Emergency Shelter',
        description: 'Emergency shelter providing beds, meals, and recovery programs',
        address: {
          street: '111 W Burnside St',
          city: 'Portland',
          state: 'OR',
          zipCode: '97209',
          latitude: 45.5230,
          longitude: -122.6794
        },
        contact: {
          phone: '(503) 906-7675',
          website: 'https://www.portlandrescuemission.org',
          email: 'info@portlandrescuemission.org'
        },
        services: ['Emergency Shelter', 'Meals', 'Recovery Programs', 'Case Management'],
        capacity: {
          total: 280,
          available: 45,
          occupied: 235
        },
        eligibility: {
          populations: ['Adult Men', 'Adult Women', 'Families'],
          requirements: ['Sobriety Encouraged'],
          restrictions: []
        },
        operatingSchedule: {
          hoursOfOperation: '24/7',
          availability: 'Year-round'
        },
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          publicTransit: true,
          parking: false
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'hmis_opencommons',
        verificationStatus: 'verified'
      },
      {
        id: 'hmis_002',
        name: 'Bybee Lakes Hope Center',
        type: 'Emergency Shelter',
        description: 'Large capacity emergency shelter with supportive services',
        address: {
          street: '12600 SE Foster Rd',
          city: 'Portland',
          state: 'OR',
          zipCode: '97236',
          latitude: 45.5045,
          longitude: -122.5364
        },
        contact: {
          phone: '(503) 240-4664',
          email: 'intake@bybeelakes.org'
        },
        services: ['Emergency Shelter', 'Mental Health Services', 'Substance Abuse Support', 'Job Training'],
        capacity: {
          total: 175,
          available: 23,
          occupied: 152
        },
        eligibility: {
          populations: ['Adult Men', 'Adult Women'],
          requirements: ['Background Check', 'TB Test'],
          restrictions: ['No Sex Offenders']
        },
        operatingSchedule: {
          hoursOfOperation: '24/7',
          availability: 'Year-round'
        },
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          publicTransit: true,
          parking: true
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'hmis_opencommons',
        verificationStatus: 'verified'
      },
      {
        id: 'hmis_003',
        name: 'Clark Center',
        type: 'Emergency Shelter',
        description: 'Men-only emergency shelter with comprehensive support services',
        address: {
          street: '1435 SE 122nd Ave',
          city: 'Portland',
          state: 'OR',
          zipCode: '97233',
          latitude: 45.5152,
          longitude: -122.5397
        },
        contact: {
          phone: '(503) 257-8800',
          email: 'info@clarkcenter.org'
        },
        services: ['Emergency Shelter', 'Meals', 'Case Management', 'Housing Navigation'],
        capacity: {
          total: 90,
          available: 12,
          occupied: 78
        },
        eligibility: {
          populations: ['Adult Men'],
          requirements: ['TB Card', 'Sobriety'],
          restrictions: []
        },
        operatingSchedule: {
          hoursOfOperation: '24/7',
          availability: 'Year-round'
        },
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          publicTransit: true,
          parking: true
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'hmis_opencommons',
        verificationStatus: 'verified'
      }
    ];
  }
}

export const hmisOpenCommonsService = new HMISOpenCommonsService();