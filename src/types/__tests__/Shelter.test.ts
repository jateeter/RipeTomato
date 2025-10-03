/**
 * Shelter Types Tests
 */

import type {
  ShelterFacility,
  ShelterType,
  BedType,
  ShelterCapacity,
  ShelterStatus,
  AccessibilityFeatures,
  ShelterServices,
  ShelterContact,
  CheckInRequirements,
  ShelterRules,
  ShelterStatistics,
  ShelterLocation,
  ShelterSearch,
  BedAvailability
} from '../Shelter';

describe('Shelter Types', () => {
  describe('ShelterFacility', () => {
    it('should define correct shelter facility structure', () => {
      const mockShelter: ShelterFacility = {
        id: 'shelter-123',
        name: 'Test Emergency Shelter',
        type: 'emergency',
        status: 'active',
        capacity: {
          total: 50,
          available: 25,
          occupied: 25,
          reserved: 0
        },
        location: {
          address: '123 Main St, Portland, OR 97201',
          coordinates: {
            lat: 45.515,
            lng: -122.65
          },
          zipCode: '97201',
          neighborhood: 'Downtown'
        },
        contact: {
          phone: '503-123-4567',
          email: 'contact@shelter.org',
          website: 'https://shelter.org'
        },
        services: ['emergency_housing', 'meals', 'case_management'],
        accessibility: {
          wheelchairAccessible: true,
          ada: true,
          elevatorAccess: true,
          serviceAnimalsAllowed: true
        },
        checkInRequirements: {
          idRequired: false,
          backgroundCheck: false,
          sobriety: false,
          referralRequired: false
        },
        operatingHours: {
          checkIn: '18:00',
          checkOut: '08:00',
          alwaysOpen: false
        },
        rules: {
          maxStayDays: 30,
          curfew: '21:00',
          alcoholPolicy: 'prohibited',
          petPolicy: 'service_animals_only'
        },
        lastUpdated: new Date(),
        createdAt: new Date()
      };

      expect(mockShelter.id).toBe('shelter-123');
      expect(mockShelter.name).toBe('Test Emergency Shelter');
      expect(mockShelter.type).toBe('emergency');
      expect(mockShelter.capacity.total).toBe(50);
      expect(mockShelter.location.coordinates.lat).toBe(45.515);
      expect(mockShelter.services).toContain('emergency_housing');
      expect(mockShelter.accessibility.wheelchairAccessible).toBe(true);
    });

    it('should support optional fields', () => {
      const minimalShelter: Partial<ShelterFacility> = {
        id: 'minimal-shelter',
        name: 'Minimal Shelter',
        type: 'emergency',
        status: 'active'
      };

      expect(minimalShelter.id).toBe('minimal-shelter');
      expect(minimalShelter.capacity).toBeUndefined();
      expect(minimalShelter.location).toBeUndefined();
    });
  });

  describe('ShelterType', () => {
    it('should define valid shelter types', () => {
      const validTypes: ShelterType[] = [
        'emergency',
        'transitional',
        'permanent',
        'family',
        'youth',
        'women',
        'men',
        'veterans',
        'overflow'
      ];

      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('BedType', () => {
    it('should define valid bed types', () => {
      const validBedTypes: BedType[] = [
        'single',
        'double',
        'bunk',
        'cot',
        'mat',
        'family_room',
        'private_room',
        'dormitory'
      ];

      validBedTypes.forEach(bedType => {
        expect(typeof bedType).toBe('string');
      });
    });
  });

  describe('ShelterCapacity', () => {
    it('should calculate occupancy correctly', () => {
      const capacity: ShelterCapacity = {
        total: 100,
        available: 30,
        occupied: 70,
        reserved: 10
      };

      expect(capacity.total).toBe(capacity.occupied + capacity.available);
      expect(capacity.occupied + capacity.reserved).toBeLessThanOrEqual(capacity.total);
    });

    it('should handle different bed type capacities', () => {
      const capacityWithBedTypes: ShelterCapacity = {
        total: 50,
        available: 20,
        occupied: 30,
        reserved: 0,
        byBedType: {
          single: 20,
          double: 15,
          family_room: 10,
          cot: 5
        }
      };

      const bedTypeTotal = Object.values(capacityWithBedTypes.byBedType!).reduce((sum, count) => sum + count, 0);
      expect(bedTypeTotal).toBe(capacityWithBedTypes.total);
    });
  });

  describe('ShelterStatus', () => {
    it('should define valid statuses', () => {
      const validStatuses: ShelterStatus[] = [
        'active',
        'inactive',
        'full',
        'maintenance',
        'temporary_closure',
        'emergency_only'
      ];

      validStatuses.forEach(status => {
        expect(typeof status).toBe('string');
        expect(['active', 'inactive', 'full', 'maintenance', 'temporary_closure', 'emergency_only']).toContain(status);
      });
    });
  });

  describe('AccessibilityFeatures', () => {
    it('should define comprehensive accessibility options', () => {
      const accessibility: AccessibilityFeatures = {
        wheelchairAccessible: true,
        ada: true,
        elevatorAccess: false,
        rampAccess: true,
        accessibleBathrooms: true,
        serviceAnimalsAllowed: true,
        brailleSignage: false,
        hearingLoop: false,
        visualAlerts: true
      };

      expect(typeof accessibility.wheelchairAccessible).toBe('boolean');
      expect(typeof accessibility.ada).toBe('boolean');
      expect(accessibility.serviceAnimalsAllowed).toBe(true);
    });
  });

  describe('ShelterServices', () => {
    it('should define available services', () => {
      const services: ShelterServices[] = [
        'emergency_housing',
        'meals',
        'showers',
        'laundry',
        'case_management',
        'mental_health',
        'substance_abuse',
        'job_training',
        'medical_care',
        'childcare',
        'pet_care',
        'storage',
        'transportation',
        'mail_services'
      ];

      services.forEach(service => {
        expect(typeof service).toBe('string');
      });

      expect(services).toContain('emergency_housing');
      expect(services).toContain('meals');
      expect(services).toContain('case_management');
    });
  });

  describe('ShelterLocation', () => {
    it('should define complete location information', () => {
      const location: ShelterLocation = {
        address: '123 Main St, Portland, OR 97201',
        coordinates: {
          lat: 45.515,
          lng: -122.65
        },
        zipCode: '97201',
        neighborhood: 'Downtown',
        transitAccess: {
          busLines: ['20', '4', '14'],
          maxLines: ['Blue', 'Red'],
          walkingDistance: '2 blocks to MAX station'
        },
        parking: {
          available: true,
          spaces: 10,
          cost: 'free',
          restrictions: 'client parking only'
        }
      };

      expect(location.coordinates.lat).toBeCloseTo(45.515);
      expect(location.transitAccess?.busLines).toContain('20');
      expect(location.parking?.available).toBe(true);
    });
  });

  describe('CheckInRequirements', () => {
    it('should define check-in requirements', () => {
      const requirements: CheckInRequirements = {
        idRequired: true,
        backgroundCheck: false,
        sobriety: true,
        referralRequired: false,
        ageRestrictions: {
          minAge: 18,
          maxAge: undefined
        },
        documentation: ['id', 'income_verification'],
        interviews: {
          required: true,
          schedulingRequired: false,
          duration: 30
        }
      };

      expect(requirements.idRequired).toBe(true);
      expect(requirements.ageRestrictions?.minAge).toBe(18);
      expect(requirements.documentation).toContain('id');
    });
  });

  describe('ShelterStatistics', () => {
    it('should calculate shelter statistics', () => {
      const stats: ShelterStatistics = {
        totalCapacity: 500,
        currentOccupancy: 350,
        occupancyRate: 0.7,
        availableBeds: 150,
        averageStayDuration: 45,
        monthlyIntake: 120,
        monthlyExits: 100,
        demographics: {
          adults: 200,
          children: 50,
          families: 25,
          singles: 275,
          veterans: 30
        }
      };

      expect(stats.occupancyRate).toBeCloseTo(0.7);
      expect(stats.totalCapacity).toBe(stats.currentOccupancy + stats.availableBeds);
      expect(stats.demographics.adults + stats.demographics.children).toBe(250);
    });
  });

  describe('ShelterSearch', () => {
    it('should define search parameters', () => {
      const searchParams: ShelterSearch = {
        location: {
          lat: 45.515,
          lng: -122.65,
          radius: 5000
        },
        filters: {
          type: ['emergency', 'transitional'],
          services: ['meals', 'case_management'],
          accessibility: true,
          availability: true
        },
        sort: {
          by: 'distance',
          order: 'asc'
        },
        pagination: {
          page: 1,
          limit: 20
        }
      };

      expect(searchParams.location.radius).toBe(5000);
      expect(searchParams.filters.type).toContain('emergency');
      expect(searchParams.sort.by).toBe('distance');
    });
  });

  describe('BedAvailability', () => {
    it('should track bed availability over time', () => {
      const availability: BedAvailability = {
        shelterId: 'shelter-123',
        timestamp: new Date(),
        snapshot: {
          total: 50,
          available: 15,
          occupied: 35,
          reserved: 0
        },
        predictions: {
          nextHour: 12,
          next4Hours: 8,
          next24Hours: 20
        },
        trends: {
          dailyAverage: 18,
          weeklyTrend: 'increasing',
          peakOccupancyHour: 22,
          lowestOccupancyHour: 8
        }
      };

      expect(availability.snapshot.total).toBe(50);
      expect(availability.predictions.nextHour).toBe(12);
      expect(availability.trends.weeklyTrend).toBe('increasing');
    });
  });

  describe('Type Guards', () => {
    it('should validate shelter facility objects', () => {
      const validShelter = {
        id: 'test-1',
        name: 'Test Shelter',
        type: 'emergency' as ShelterType,
        status: 'active' as ShelterStatus
      };

      const invalidShelter = {
        id: 'test-2',
        // missing required name field
        type: 'emergency',
        status: 'active'
      };

      expect(validShelter.id).toBeDefined();
      expect(validShelter.name).toBeDefined();
      expect(invalidShelter.name).toBeUndefined();
    });

    it('should validate capacity constraints', () => {
      const validCapacity: ShelterCapacity = {
        total: 100,
        available: 40,
        occupied: 60,
        reserved: 0
      };

      const invalidCapacity = {
        total: 100,
        available: 60,
        occupied: 70, // This would exceed total
        reserved: 0
      };

      expect(validCapacity.occupied + validCapacity.available).toBe(validCapacity.total);
      expect(invalidCapacity.occupied + invalidCapacity.available).toBeGreaterThan(invalidCapacity.total);
    });
  });
});