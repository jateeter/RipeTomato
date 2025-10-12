/**
 * Common Location Types and Utilities
 *
 * Provides unified interfaces and utilities for working with all service location types
 * (shelter, clinic, service, food) in a consistent way across the application.
 */

/**
 * Core location types supported by the system
 */
export type LocationType = 'shelter' | 'service' | 'clinic' | 'food' | 'other';

/**
 * Status of location data quality
 */
export interface DataQuality {
  hasCoordinates: boolean;
  hasContact: boolean;
  hasHours: boolean;
  hasServices: boolean;
  completeness: number; // 0-100 percentage
}

/**
 * Contact information for a location
 */
export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  fax?: string;
}

/**
 * Operating hours for a location
 */
export interface OperatingHours {
  description?: string; // e.g., "24/7", "Mon-Fri 9am-5pm"
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  holidays?: string;
}

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // Geocoding accuracy in meters
}

/**
 * Address information
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  county?: string;
  full: string; // Complete formatted address
}

/**
 * Service categories offered at location
 */
export interface ServiceOffering {
  category: string; // e.g., 'shelter', 'food', 'healthcare', 'hygiene'
  name: string; // e.g., 'Emergency Shelter', 'Hot Meals'
  description?: string;
  availability?: string; // e.g., '24/7', 'Mon-Fri only'
}

/**
 * Capacity information for shelters/services
 */
export interface Capacity {
  total?: number;
  available?: number;
  occupied?: number;
  utilizationRate?: number; // 0-1
  lastUpdated?: string;
}

/**
 * Eligibility requirements
 */
export interface Eligibility {
  ageMin?: number;
  ageMax?: number;
  gender?: 'male' | 'female' | 'all' | 'other';
  families?: boolean;
  veterans?: boolean;
  disabilities?: boolean;
  requirements?: string[]; // Additional text requirements
  restrictions?: string[]; // Things that disqualify
}

/**
 * Common Location Interface
 *
 * Unified representation for all service location types that can be used
 * consistently throughout the UI components.
 */
export interface CommonLocation {
  // Core identification
  id: number | string;
  name: string;
  type: LocationType;

  // Geographic information
  coordinates: Coordinates;
  address: Address;

  // Contact information
  contact: ContactInfo;

  // Operating information
  hours?: OperatingHours;
  services: ServiceOffering[];

  // Capacity (primarily for shelters)
  capacity?: Capacity;

  // Eligibility
  eligibility?: Eligibility;

  // Metadata
  dataQuality: DataQuality;
  lastUpdated: string;
  createdAt: string;
  source: string; // e.g., 'HMIS', 'manual', 'API'
  verified: boolean; // Has data been verified?

  // Additional metadata as JSON
  metadata?: Record<string, any>;
}

/**
 * Converts raw cache location to CommonLocation format
 */
export function toCommonLocation(rawLocation: any): CommonLocation {
  // Parse address
  const addressParts = (rawLocation.address || '').split(',').map((s: string) => s.trim());
  const street = addressParts[0] || rawLocation.address || 'Address not available';
  const city = rawLocation.city || addressParts[1] || 'Unknown';
  const state = rawLocation.state || 'ID';
  const zipcode = rawLocation.zipcode || rawLocation.zip || '';

  const address: Address = {
    street,
    city,
    state,
    zipcode,
    full: rawLocation.address || `${street}, ${city}, ${state} ${zipcode}`
  };

  // Parse coordinates
  const coordinates: Coordinates = {
    latitude: parseFloat(rawLocation.latitude) || 0,
    longitude: parseFloat(rawLocation.longitude) || 0
  };

  // Parse contact info
  const contact: ContactInfo = {
    phone: rawLocation.phone || rawLocation.phoneNumber,
    email: rawLocation.email,
    website: rawLocation.website || rawLocation.url
  };

  // Parse services
  let services: ServiceOffering[] = [];
  if (rawLocation.services) {
    try {
      const serviceArray = typeof rawLocation.services === 'string'
        ? JSON.parse(rawLocation.services)
        : rawLocation.services;

      services = Array.isArray(serviceArray)
        ? serviceArray.map((s: any) => ({
            category: typeof s === 'string' ? s : s.category,
            name: typeof s === 'string' ? s : s.name,
            description: typeof s === 'object' ? s.description : undefined
          }))
        : [];
    } catch (e) {
      services = [];
    }
  }

  // Add type as a service if no services defined
  if (services.length === 0 && rawLocation.type) {
    services.push({
      category: rawLocation.type,
      name: rawLocation.type.charAt(0).toUpperCase() + rawLocation.type.slice(1)
    });
  }

  // Calculate data quality
  const hasCoordinates = coordinates.latitude !== 0 && coordinates.longitude !== 0;
  const hasContact = !!(contact.phone || contact.email || contact.website);
  const hasHours = !!(rawLocation.hours || rawLocation.operatingHours);
  const hasServices = services.length > 0;

  let completeness = 0;
  if (rawLocation.name) completeness += 20;
  if (rawLocation.address) completeness += 20;
  if (hasCoordinates) completeness += 20;
  if (hasContact) completeness += 20;
  if (hasServices) completeness += 20;

  const dataQuality: DataQuality = {
    hasCoordinates,
    hasContact,
    hasHours,
    hasServices,
    completeness
  };

  // Parse hours
  let hours: OperatingHours | undefined;
  if (rawLocation.hours || rawLocation.operatingHours) {
    hours = {
      description: rawLocation.hours || rawLocation.operatingHours
    };
  }

  // Parse capacity (for shelters)
  let capacity: Capacity | undefined;
  if (rawLocation.capacity || rawLocation.available_beds || rawLocation.occupied_beds) {
    capacity = {
      total: rawLocation.capacity,
      available: rawLocation.available_beds,
      occupied: rawLocation.occupied_beds,
      utilizationRate: rawLocation.capacity
        ? (rawLocation.occupied_beds || 0) / rawLocation.capacity
        : undefined,
      lastUpdated: rawLocation.last_updated || rawLocation.updated_at
    };
  }

  // Parse eligibility
  let eligibility: Eligibility | undefined;
  if (rawLocation.eligibility) {
    eligibility = {
      requirements: typeof rawLocation.eligibility === 'string'
        ? [rawLocation.eligibility]
        : rawLocation.eligibility
    };
  }

  return {
    id: rawLocation.id,
    name: rawLocation.name || 'Unnamed Location',
    type: rawLocation.type || 'other',
    coordinates,
    address,
    contact,
    hours,
    services,
    capacity,
    eligibility,
    dataQuality,
    lastUpdated: rawLocation.updated_at || rawLocation.last_updated || new Date().toISOString(),
    createdAt: rawLocation.created_at || new Date().toISOString(),
    source: rawLocation.source || 'HMIS',
    verified: rawLocation.verified || false,
    metadata: rawLocation.metadata
  };
}

/**
 * Filters locations by type
 */
export function filterByType(locations: CommonLocation[], type: LocationType): CommonLocation[] {
  return locations.filter(loc => loc.type === type);
}

/**
 * Filters locations by data quality
 */
export function filterByQuality(locations: CommonLocation[], minCompleteness: number): CommonLocation[] {
  return locations.filter(loc => loc.dataQuality.completeness >= minCompleteness);
}

/**
 * Filters locations with coordinates
 */
export function filterGeocoded(locations: CommonLocation[]): CommonLocation[] {
  return locations.filter(loc => loc.dataQuality.hasCoordinates);
}

/**
 * Filters locations by geographic bounds
 */
export function filterByBounds(
  locations: CommonLocation[],
  bounds: { north: number; south: number; east: number; west: number }
): CommonLocation[] {
  return locations.filter(loc =>
    loc.coordinates.latitude >= bounds.south &&
    loc.coordinates.latitude <= bounds.north &&
    loc.coordinates.longitude >= bounds.west &&
    loc.coordinates.longitude <= bounds.east
  );
}

/**
 * Sorts locations by distance from a point
 */
export function sortByDistance(
  locations: CommonLocation[],
  center: { latitude: number; longitude: number }
): CommonLocation[] {
  return [...locations].sort((a, b) => {
    const distA = calculateDistance(center, a.coordinates);
    const distB = calculateDistance(center, b.coordinates);
    return distA - distB;
  });
}

/**
 * Calculates distance between two points (Haversine formula)
 */
export function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Groups locations by type
 */
export function groupByType(locations: CommonLocation[]): Record<LocationType, CommonLocation[]> {
  const groups: Record<string, CommonLocation[]> = {
    shelter: [],
    service: [],
    clinic: [],
    food: [],
    other: []
  };

  locations.forEach(loc => {
    if (groups[loc.type]) {
      groups[loc.type].push(loc);
    } else {
      groups.other.push(loc);
    }
  });

  return groups as Record<LocationType, CommonLocation[]>;
}

/**
 * Groups locations by city
 */
export function groupByCity(locations: CommonLocation[]): Record<string, CommonLocation[]> {
  const groups: Record<string, CommonLocation[]> = {};

  locations.forEach(loc => {
    const city = loc.address.city || 'Unknown';
    if (!groups[city]) {
      groups[city] = [];
    }
    groups[city].push(loc);
  });

  return groups;
}

/**
 * Gets statistics about a set of locations
 */
export function getLocationStats(locations: CommonLocation[]) {
  const total = locations.length;
  const geocoded = locations.filter(loc => loc.dataQuality.hasCoordinates).length;
  const withContact = locations.filter(loc => loc.dataQuality.hasContact).length;
  const verified = locations.filter(loc => loc.verified).length;

  const byType = groupByType(locations);
  const byCityCount = Object.keys(groupByCity(locations)).length;

  const avgCompleteness = locations.reduce((sum, loc) =>
    sum + loc.dataQuality.completeness, 0
  ) / (total || 1);

  return {
    total,
    geocoded,
    geocodedPercent: Math.round((geocoded / (total || 1)) * 100),
    withContact,
    withContactPercent: Math.round((withContact / (total || 1)) * 100),
    verified,
    verifiedPercent: Math.round((verified / (total || 1)) * 100),
    avgCompleteness: Math.round(avgCompleteness),
    byType: {
      shelter: byType.shelter.length,
      service: byType.service.length,
      clinic: byType.clinic.length,
      food: byType.food.length,
      other: byType.other.length
    },
    cities: byCityCount
  };
}

/**
 * Formats a location for display
 */
export function formatLocationForDisplay(location: CommonLocation): string {
  let display = `${location.name}\n`;
  display += `${location.address.full}\n`;

  if (location.contact.phone) {
    display += `📞 ${location.contact.phone}\n`;
  }

  if (location.hours?.description) {
    display += `🕒 ${location.hours.description}\n`;
  }

  if (location.services.length > 0) {
    display += `🏥 ${location.services.map(s => s.name).join(', ')}\n`;
  }

  return display;
}

/**
 * Validates a location has minimum required data
 */
export function isValidLocation(location: CommonLocation, requireCoordinates = false): boolean {
  if (!location.name || !location.address.full) {
    return false;
  }

  if (requireCoordinates && !location.dataQuality.hasCoordinates) {
    return false;
  }

  return true;
}

/**
 * Merges duplicate locations by name and address
 */
export function deduplicateLocations(locations: CommonLocation[]): CommonLocation[] {
  const seen = new Map<string, CommonLocation>();

  locations.forEach(loc => {
    const key = `${loc.name.toLowerCase()}-${loc.address.street.toLowerCase()}`;

    if (!seen.has(key)) {
      seen.set(key, loc);
    } else {
      // Keep the one with better data quality
      const existing = seen.get(key)!;
      if (loc.dataQuality.completeness > existing.dataQuality.completeness) {
        seen.set(key, loc);
      }
    }
  });

  return Array.from(seen.values());
}
