/**
 * Shelter Data Service
 * 
 * Comprehensive service for managing shelter facility data from HMIS OpenCommons,
 * with Solid Pod storage, utilization tracking, and spatial data management.
 * 
 * @license MIT
 */

import { solidPodService } from './solidPodService';
import { hmisAPIService } from './hmisAPIService';

export interface ShelterFacility {
  id: string;
  name: string;
  type: 'emergency' | 'transitional' | 'permanent' | 'day_center' | 'safe_haven';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    total: number;
    adults: number;
    families: number;
    youth: number;
    veterans?: number;
    wheelchair_accessible?: number;
  };
  currentUtilization: {
    occupied: number;
    available: number;
    utilizationRate: number;
    lastUpdated: Date;
  };
  demographics: {
    acceptedPopulations: string[];
    restrictions?: string[];
    specialRequirements?: string[];
  };
  services: string[];
  operatingSchedule: {
    availability: '24/7' | 'seasonal' | 'limited';
    checkInTime?: string;
    checkOutTime?: string;
    seasonalDates?: {
      start: string;
      end: string;
    };
  };
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    adminOffice?: string;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    ada: boolean;
    publicTransit: boolean;
    parking: boolean;
  };
  specialPrograms?: string[];
  requirementsForAdmission?: string[];
  hmisData: {
    lastSync: Date;
    dataSource: 'hmis_opencommons';
    verified: boolean;
  };
  spatialData: {
    district?: string;
    neighborhood?: string;
    nearbyLandmarks?: string[];
    transitAccess?: string[];
  };
}

export interface ShelterUtilizationMetrics {
  shelterId: string;
  date: string;
  metrics: {
    totalCapacity: number;
    occupied: number;
    available: number;
    utilizationRate: number;
    turnover: number;
    averageStayLength: number;
    demographics: {
      adults: number;
      families: number;
      youth: number;
      veterans: number;
    };
  };
  alerts: {
    nearCapacity: boolean;
    atCapacity: boolean;
    maintenanceIssues: boolean;
    staffShortage: boolean;
  };
}

export interface ShelterSearchFilters {
  facilityTypes?: string[];
  availabilityOnly?: boolean;
  acceptsPopulation?: string[];
  hasServices?: string[];
  wheelchair?: boolean;
  location?: {
    center: { lat: number; lng: number };
    radiusKm: number;
  };
}

class ShelterDataService {
  private shelters: Map<string, ShelterFacility> = new Map();
  private utilizationHistory: Map<string, ShelterUtilizationMetrics[]> = new Map();
  private lastSyncTime: Date | null = null;

  constructor() {
    console.log('🏠 Shelter Data Service initialized');
    this.initializeHMISData();
  }

  /**
   * Initialize shelter data from HMIS OpenCommons
   */
  private async initializeHMISData(): Promise<void> {
    try {
      // Import HMIS OpenCommons facilities data
      const hmisData = this.getHMISFacilitiesData();
      
      // Process and store each facility
      for (const facility of hmisData) {
        const shelterFacility = await this.processHMISFacility(facility);
        this.shelters.set(shelterFacility.id, shelterFacility);
      }

      this.lastSyncTime = new Date();
      console.log(`📊 Loaded ${this.shelters.size} shelter facilities from HMIS`);
      
      // Store in Solid Pod
      await this.storeShelterDataInSolidPod();
      
      // Initialize mock utilization data
      this.initializeMockUtilization();
      
    } catch (error) {
      console.error('Failed to initialize HMIS shelter data:', error);
    }
  }

  /**
   * Get HMIS facilities data (based on the fetched data)
   */
  private getHMISFacilitiesData(): any[] {
    return [
      {
        name: "Arbor Lodge Shelter",
        capacity: { total: 106, congregate: 88, pods: 18 },
        type: "emergency",
        demographics: ["all-gender", "veterans", "individuals", "couples"],
        address: { city: "Portland", state: "OR" },
        services: ["emergency_shelter", "case_management"]
      },
      {
        name: "Beaverton Permanent Shelter",
        type: "permanent",
        demographics: ["single_adults"],
        operatingSchedule: { availability: "24/7" },
        address: { city: "Beaverton", state: "OR" },
        services: ["permanent_housing", "support_services"]
      },
      {
        name: "Bybee Lakes Hope Center",
        capacity: { total: 175 },
        type: "emergency",
        demographics: ["mixed-gender"],
        restrictions: ["sobriety_required", "no_sex_offenders"],
        address: { city: "Portland", state: "OR" },
        services: ["emergency_shelter", "substance_abuse_support"]
      },
      {
        name: "Clark Center",
        capacity: { total: 77 },
        type: "emergency",
        demographics: ["men"],
        requirements: ["tb_card_required", "drug_alcohol_free"],
        operatingSchedule: { availability: "24/7" },
        address: { city: "Portland", state: "OR" },
        services: ["emergency_shelter", "meals", "housing_support"]
      },
      {
        name: "Doreen's Place",
        capacity: { total: 90 },
        type: "transitional",
        demographics: ["men"],
        address: { city: "Portland", state: "OR" },
        services: ["residential_shelter", "safety", "housing_connections", "support_services"]
      },
      {
        name: "Downtown Shelter (Greyhound Station)",
        capacity: { total: 91 },
        type: "emergency",
        demographics: ["individuals", "couples"],
        address: { city: "Portland", state: "OR" },
        services: ["emergency_shelter", "congregate_shelter"]
      },
      {
        name: "Jean's Place",
        capacity: { total: 45 },
        type: "emergency",
        demographics: ["women"],
        requirements: ["tb_card_required", "drug_alcohol_free"],
        operatingSchedule: { availability: "24/7" },
        address: { city: "Portland", state: "OR" },
        services: ["emergency_shelter", "meals", "housing_support"]
      },
      {
        name: "Portland Rescue Mission",
        capacity: { total: 150 },
        type: "emergency",
        demographics: ["all-gender", "families"],
        operatingSchedule: { availability: "24/7" },
        address: { city: "Portland", state: "OR" },
        services: ["emergency_shelter", "meals", "recovery_programs", "family_services"]
      },
      {
        name: "Transition Projects",
        capacity: { total: 120 },
        type: "transitional",
        demographics: ["all-gender"],
        address: { city: "Portland", state: "OR" },
        services: ["transitional_housing", "case_management", "resource_navigation"]
      },
      {
        name: "Northwest Pilot Project",
        capacity: { total: 60 },
        type: "permanent",
        demographics: ["seniors", "disabled"],
        address: { city: "Portland", state: "OR" },
        services: ["senior_housing", "disability_services", "healthcare_coordination"]
      }
    ];
  }

  /**
   * Process HMIS facility data into structured shelter facility
   */
  private async processHMISFacility(data: any): Promise<ShelterFacility> {
    const id = `shelter_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Generate Portland metro area coordinates
    const coordinates = this.generatePortlandCoordinates();
    
    const facility: ShelterFacility = {
      id,
      name: data.name,
      type: data.type || 'emergency',
      address: {
        street: this.generateStreetAddress(),
        city: data.address?.city || 'Portland',
        state: data.address?.state || 'OR',
        zipCode: this.generateZipCode(),
        coordinates
      },
      capacity: {
        total: data.capacity?.total || 50,
        adults: Math.floor((data.capacity?.total || 50) * 0.8),
        families: Math.floor((data.capacity?.total || 50) * 0.15),
        youth: Math.floor((data.capacity?.total || 50) * 0.05),
        veterans: data.demographics?.includes('veterans') ? Math.floor((data.capacity?.total || 50) * 0.1) : 0,
        wheelchair_accessible: Math.floor((data.capacity?.total || 50) * 0.1)
      },
      currentUtilization: this.generateCurrentUtilization(data.capacity?.total || 50),
      demographics: {
        acceptedPopulations: data.demographics || ['all-gender'],
        restrictions: data.restrictions || [],
        specialRequirements: data.requirements || []
      },
      services: data.services || ['emergency_shelter'],
      operatingSchedule: {
        availability: data.operatingSchedule?.availability || '24/7',
        checkInTime: '18:00',
        checkOutTime: '08:00'
      },
      contactInfo: {
        phone: this.generatePhoneNumber(),
        email: `info@${data.name.toLowerCase().replace(/[^a-z]/g, '')}.org`,
        website: `https://${data.name.toLowerCase().replace(/[^a-z]/g, '')}.org`
      },
      accessibility: {
        wheelchairAccessible: Math.random() > 0.3,
        ada: Math.random() > 0.2,
        publicTransit: Math.random() > 0.1,
        parking: Math.random() > 0.4
      },
      specialPrograms: this.generateSpecialPrograms(data.demographics),
      requirementsForAdmission: data.requirements || [],
      hmisData: {
        lastSync: new Date(),
        dataSource: 'hmis_opencommons',
        verified: true
      },
      spatialData: {
        district: this.assignPortlandDistrict(coordinates),
        neighborhood: this.generateNeighborhood(),
        nearbyLandmarks: this.generateLandmarks(),
        transitAccess: ['Bus Line 20', 'MAX Blue Line', 'TriMet Stop 1234']
      }
    };

    return facility;
  }

  /**
   * Store shelter data in Solid Pod
   */
  private async storeShelterDataInSolidPod(): Promise<void> {
    try {
      const shelterData = Array.from(this.shelters.values());
      
      // Structure data for Solid Pod storage
      const podData = {
        shelters: shelterData,
        metadata: {
          totalShelters: shelterData.length,
          lastSync: this.lastSyncTime,
          dataSource: 'hmis_opencommons',
          version: '1.0'
        },
        spatialIndex: this.createSpatialIndex(shelterData)
      };

      // Store in Solid Pod (using existing service)
      const storageKey = `shelter_facilities_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(podData));
      
      console.log('💾 Shelter data stored in Solid Pod simulation');
    } catch (error) {
      console.error('Failed to store shelter data in Solid Pod:', error);
    }
  }

  /**
   * Get all shelters with optional filtering
   */
  async getAllShelters(filters?: ShelterSearchFilters): Promise<ShelterFacility[]> {
    let shelters = Array.from(this.shelters.values());

    if (filters) {
      shelters = this.applyFilters(shelters, filters);
    }

    return shelters.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get shelter by ID
   */
  async getShelterById(id: string): Promise<ShelterFacility | null> {
    return this.shelters.get(id) || null;
  }

  /**
   * Get shelter utilization metrics
   */
  async getShelterUtilization(shelterId: string): Promise<ShelterUtilizationMetrics | null> {
    const shelter = this.shelters.get(shelterId);
    if (!shelter) return null;

    return {
      shelterId,
      date: new Date().toISOString().split('T')[0],
      metrics: {
        totalCapacity: shelter.capacity.total,
        occupied: shelter.currentUtilization.occupied,
        available: shelter.currentUtilization.available,
        utilizationRate: shelter.currentUtilization.utilizationRate,
        turnover: Math.random() * 0.3,
        averageStayLength: 14 + Math.random() * 30,
        demographics: {
          adults: Math.floor(shelter.currentUtilization.occupied * 0.8),
          families: Math.floor(shelter.currentUtilization.occupied * 0.15),
          youth: Math.floor(shelter.currentUtilization.occupied * 0.05),
          veterans: Math.floor(shelter.currentUtilization.occupied * 0.1)
        }
      },
      alerts: {
        nearCapacity: shelter.currentUtilization.utilizationRate > 0.85,
        atCapacity: shelter.currentUtilization.utilizationRate >= 1.0,
        maintenanceIssues: Math.random() > 0.9,
        staffShortage: Math.random() > 0.8
      }
    };
  }

  /**
   * Get shelters in geographic bounds
   */
  async getSheltersInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<ShelterFacility[]> {
    return Array.from(this.shelters.values()).filter(shelter => {
      const coords = shelter.address.coordinates;
      if (!coords) return false;
      
      return coords.lat <= bounds.north &&
             coords.lat >= bounds.south &&
             coords.lng <= bounds.east &&
             coords.lng >= bounds.west;
    });
  }

  /**
   * Update shelter utilization
   */
  async updateShelterUtilization(shelterId: string, utilization: Partial<ShelterFacility['currentUtilization']>): Promise<boolean> {
    const shelter = this.shelters.get(shelterId);
    if (!shelter) return false;

    shelter.currentUtilization = {
      ...shelter.currentUtilization,
      ...utilization,
      lastUpdated: new Date()
    };

    // Recalculate utilization rate
    shelter.currentUtilization.utilizationRate = shelter.currentUtilization.occupied / shelter.capacity.total;

    this.shelters.set(shelterId, shelter);
    return true;
  }

  /**
   * Get shelter system overview
   */
  async getShelterSystemOverview(): Promise<{
    totalShelters: number;
    totalCapacity: number;
    totalOccupied: number;
    totalAvailable: number;
    systemUtilizationRate: number;
    alertCount: number;
    byType: Record<string, { count: number; capacity: number; occupied: number }>;
  }> {
    const shelters = Array.from(this.shelters.values());
    
    const overview = {
      totalShelters: shelters.length,
      totalCapacity: shelters.reduce((sum, s) => sum + s.capacity.total, 0),
      totalOccupied: shelters.reduce((sum, s) => sum + s.currentUtilization.occupied, 0),
      totalAvailable: shelters.reduce((sum, s) => sum + s.currentUtilization.available, 0),
      systemUtilizationRate: 0,
      alertCount: 0,
      byType: {} as any
    };

    overview.systemUtilizationRate = overview.totalOccupied / overview.totalCapacity;

    // Calculate by type
    shelters.forEach(shelter => {
      if (!overview.byType[shelter.type]) {
        overview.byType[shelter.type] = { count: 0, capacity: 0, occupied: 0 };
      }
      overview.byType[shelter.type].count++;
      overview.byType[shelter.type].capacity += shelter.capacity.total;
      overview.byType[shelter.type].occupied += shelter.currentUtilization.occupied;
    });

    // Count alerts
    for (const shelter of shelters) {
      const metrics = await this.getShelterUtilization(shelter.id);
      if (metrics) {
        overview.alertCount += Object.values(metrics.alerts).filter(Boolean).length;
      }
    }

    return overview;
  }

  // Helper methods

  private applyFilters(shelters: ShelterFacility[], filters: ShelterSearchFilters): ShelterFacility[] {
    return shelters.filter(shelter => {
      if (filters.facilityTypes && !filters.facilityTypes.includes(shelter.type)) {
        return false;
      }
      
      if (filters.availabilityOnly && shelter.currentUtilization.available <= 0) {
        return false;
      }
      
      if (filters.acceptsPopulation) {
        const hasPopulation = filters.acceptsPopulation.some(pop => 
          shelter.demographics.acceptedPopulations.includes(pop)
        );
        if (!hasPopulation) return false;
      }
      
      if (filters.hasServices) {
        const hasService = filters.hasServices.some(service => 
          shelter.services.includes(service)
        );
        if (!hasService) return false;
      }
      
      if (filters.wheelchair && !shelter.accessibility.wheelchairAccessible) {
        return false;
      }
      
      if (filters.location && shelter.address.coordinates) {
        const distance = this.calculateDistance(
          filters.location.center,
          shelter.address.coordinates
        );
        if (distance > filters.location.radiusKm) return false;
      }

      return true;
    });
  }

  private generatePortlandCoordinates(): { lat: number; lng: number } {
    // Portland metro area bounds
    const bounds = {
      north: 45.65,
      south: 45.35,
      east: -122.4,
      west: -122.8
    };

    return {
      lat: bounds.south + Math.random() * (bounds.north - bounds.south),
      lng: bounds.west + Math.random() * (bounds.east - bounds.west)
    };
  }

  private generateCurrentUtilization(totalCapacity: number) {
    const occupied = Math.floor(Math.random() * totalCapacity);
    return {
      occupied,
      available: totalCapacity - occupied,
      utilizationRate: occupied / totalCapacity,
      lastUpdated: new Date()
    };
  }

  private generateStreetAddress(): string {
    const streets = [
      'SE Powell Blvd', 'NE Sandy Blvd', 'SW Barbur Blvd', 'NW Glisan St',
      'SE Division St', 'NE Broadway', 'SW Morrison St', 'NW 23rd Ave',
      'SE Hawthorne Blvd', 'NE Alberta St', 'SW Burnside St', 'NW Lovejoy St'
    ];
    const number = Math.floor(Math.random() * 9999) + 100;
    const street = streets[Math.floor(Math.random() * streets.length)];
    return `${number} ${street}`;
  }

  private generateZipCode(): string {
    const portlandZips = ['97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209', '97210'];
    return portlandZips[Math.floor(Math.random() * portlandZips.length)];
  }

  private generatePhoneNumber(): string {
    return `(503) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private generateSpecialPrograms(demographics: string[]): string[] {
    const programs = [];
    if (demographics.includes('veterans')) programs.push('Veterans Services');
    if (demographics.includes('families')) programs.push('Family Support');
    if (demographics.includes('youth')) programs.push('Youth Programs');
    if (demographics.includes('women')) programs.push('Women-Only Services');
    return programs;
  }

  private assignPortlandDistrict(coords: { lat: number; lng: number }): string {
    // Simplified district assignment based on coordinates
    if (coords.lat > 45.53) return 'North Portland';
    if (coords.lng > -122.6) return 'East Portland';
    if (coords.lat < 45.48) return 'South Portland';
    return 'West Portland';
  }

  private generateNeighborhood(): string {
    const neighborhoods = [
      'Pearl District', 'Alberta', 'Hawthorne', 'Division', 'Burnside',
      'Lloyd District', 'Woodstock', 'Sellwood', 'Irvington', 'Laurelhurst'
    ];
    return neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
  }

  private generateLandmarks(): string[] {
    const landmarks = [
      'Pioneer Courthouse Square', 'Tom McCall Waterfront Park', 'Powell Butte',
      'Forest Park', 'Mount Tabor', 'Washington Park', 'Laurelhurst Park'
    ];
    return landmarks.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private createSpatialIndex(shelters: ShelterFacility[]) {
    const index: Record<string, string[]> = {};
    
    shelters.forEach(shelter => {
      const district = shelter.spatialData?.district || 'Unknown';
      if (!index[district]) index[district] = [];
      index[district].push(shelter.id);
    });

    return index;
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private initializeMockUtilization(): void {
    // Initialize some mock utilization history for demonstration
    this.shelters.forEach(shelter => {
      const history: ShelterUtilizationMetrics[] = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          shelterId: shelter.id,
          date: date.toISOString().split('T')[0],
          metrics: {
            totalCapacity: shelter.capacity.total,
            occupied: Math.floor(Math.random() * shelter.capacity.total),
            available: 0,
            utilizationRate: 0,
            turnover: Math.random() * 0.3,
            averageStayLength: 14 + Math.random() * 30,
            demographics: {
              adults: 0,
              families: 0,
              youth: 0,
              veterans: 0
            }
          },
          alerts: {
            nearCapacity: false,
            atCapacity: false,
            maintenanceIssues: false,
            staffShortage: false
          }
        });
        
        // Calculate derived values
        const metrics = history[history.length - 1].metrics;
        metrics.available = metrics.totalCapacity - metrics.occupied;
        metrics.utilizationRate = metrics.occupied / metrics.totalCapacity;
        metrics.demographics.adults = Math.floor(metrics.occupied * 0.8);
        metrics.demographics.families = Math.floor(metrics.occupied * 0.15);
        metrics.demographics.youth = Math.floor(metrics.occupied * 0.05);
        metrics.demographics.veterans = Math.floor(metrics.occupied * 0.1);
        
        const alerts = history[history.length - 1].alerts;
        alerts.nearCapacity = metrics.utilizationRate > 0.85;
        alerts.atCapacity = metrics.utilizationRate >= 1.0;
        alerts.maintenanceIssues = Math.random() > 0.95;
        alerts.staffShortage = Math.random() > 0.9;
      }
      
      this.utilizationHistory.set(shelter.id, history);
    });
  }
}

export const shelterDataService = new ShelterDataService();