/**
 * Sanitation Services
 * 
 * Manages shower facilities, restrooms, laundry services, hygiene supplies,
 * and waste disposal within the Community Services Hub.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SanitationService,
  SanitationFacility,
  SanitationSupply,
  ServiceRequest,
  ServiceSchedule,
  ServiceRequirement,
  MaintenanceRecord,
  ResourceUsage,
  ServiceOutcome
} from '../types/CommunityServices';
import { UnifiedDataOwner } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';

interface FacilityReservation {
  reservationId: string;
  facilityId: string;
  clientId: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in_use' | 'completed' | 'cancelled' | 'no_show';
  suppliesProvided: SanitationSupply[];
  staffMember?: string;
  notes?: string;
}

interface SupplyDistribution {
  distributionId: string;
  clientId: string;
  suppliesProvided: SanitationSupply[];
  distributionDate: Date;
  staffMember: string;
  isComplimentary: boolean;
  totalCost: number;
}

class SanitationServiceManager {
  private services: Map<string, SanitationService> = new Map();
  private facilities: Map<string, SanitationFacility[]> = new Map();
  private supplies: Map<string, SanitationSupply[]> = new Map();
  private reservations: FacilityReservation[] = [];
  private distributions: SupplyDistribution[] = [];
  private activeRequests: Map<string, ServiceRequest> = new Map();
  private maintenanceRecords: MaintenanceRecord[] = [];

  constructor() {
    this.initializeDefaultServices();
    console.log('🚿 Sanitation Services initialized');
  }

  /**
   * Initialize default sanitation services
   */
  private initializeDefaultServices(): void {
    const showerService: SanitationService = {
      serviceId: uuidv4(),
      serviceType: 'shower',
      name: 'Shower Facilities',
      location: 'Hygiene Center - Building A',
      facilities: [],
      supplies: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '06:00',
        endTime: '22:00',
        isRecurring: true,
        exceptions: []
      },
      accessRequirements: [
        {
          requirementType: 'id_required',
          description: 'Valid identification required',
          isStrict: false
        }
      ]
    };
    showerService.schedule.serviceId = showerService.serviceId;

    const laundryService: SanitationService = {
      serviceId: uuidv4(),
      serviceType: 'laundry',
      name: 'Laundry Facilities',
      location: 'Hygiene Center - Building B',
      facilities: [],
      supplies: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '07:00',
        endTime: '20:00',
        isRecurring: true,
        exceptions: []
      },
      accessRequirements: []
    };
    laundryService.schedule.serviceId = laundryService.serviceId;

    const restroomService: SanitationService = {
      serviceId: uuidv4(),
      serviceType: 'restroom',
      name: 'Public Restrooms',
      location: 'Multiple Locations',
      facilities: [],
      supplies: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '24:00',
        endTime: '24:00',
        isRecurring: true,
        exceptions: []
      },
      accessRequirements: []
    };
    restroomService.schedule.serviceId = restroomService.serviceId;

    const hygieneSupplyService: SanitationService = {
      serviceId: uuidv4(),
      serviceType: 'hygiene_supplies',
      name: 'Hygiene Supply Distribution',
      location: 'Supply Distribution Center',
      facilities: [],
      supplies: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
        exceptions: []
      },
      accessRequirements: [
        {
          requirementType: 'first_time_orientation',
          description: 'Brief orientation for first-time visitors',
          isStrict: false
        }
      ]
    };
    hygieneSupplyService.schedule.serviceId = hygieneSupplyService.serviceId;

    this.services.set(showerService.serviceId, showerService);
    this.services.set(laundryService.serviceId, laundryService);
    this.services.set(restroomService.serviceId, restroomService);
    this.services.set(hygieneSupplyService.serviceId, hygieneSupplyService);

    // Initialize facilities and supplies
    this.initializeFacilities();
    this.initializeSupplies();
  }

  /**
   * Initialize sanitation facilities
   */
  private initializeFacilities(): void {
    const showerService = Array.from(this.services.values()).find(s => s.serviceType === 'shower');
    const laundryService = Array.from(this.services.values()).find(s => s.serviceType === 'laundry');
    const restroomService = Array.from(this.services.values()).find(s => s.serviceType === 'restroom');

    if (showerService) {
      const showerFacilities: SanitationFacility[] = [
        {
          facilityId: uuidv4(),
          type: 'shower_stall',
          name: 'Shower Stall 1',
          isAccessible: true,
          status: 'available',
          timeLimit: 30,
          reservationRequired: true,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'shower_stall',
          name: 'Shower Stall 2',
          isAccessible: false,
          status: 'available',
          timeLimit: 30,
          reservationRequired: true,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'shower_stall',
          name: 'Family Shower Room',
          isAccessible: true,
          status: 'available',
          timeLimit: 45,
          reservationRequired: true,
          maintenanceLog: []
        }
      ];
      
      this.facilities.set(showerService.serviceId, showerFacilities);
      showerService.facilities = showerFacilities;
    }

    if (laundryService) {
      const laundryFacilities: SanitationFacility[] = [
        {
          facilityId: uuidv4(),
          type: 'washing_machine',
          name: 'Washer 1',
          isAccessible: true,
          status: 'available',
          timeLimit: 45,
          reservationRequired: false,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'washing_machine',
          name: 'Washer 2',
          isAccessible: true,
          status: 'available',
          timeLimit: 45,
          reservationRequired: false,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'dryer',
          name: 'Dryer 1',
          isAccessible: true,
          status: 'available',
          timeLimit: 60,
          reservationRequired: false,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'dryer',
          name: 'Dryer 2',
          isAccessible: true,
          status: 'available',
          timeLimit: 60,
          reservationRequired: false,
          maintenanceLog: []
        }
      ];
      
      this.facilities.set(laundryService.serviceId, laundryFacilities);
      laundryService.facilities = laundryFacilities;
    }

    if (restroomService) {
      const restroomFacilities: SanitationFacility[] = [
        {
          facilityId: uuidv4(),
          type: 'restroom_stall',
          name: 'Main Building - Men\'s Room',
          isAccessible: true,
          status: 'available',
          timeLimit: 0, // No time limit for restrooms
          reservationRequired: false,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'restroom_stall',
          name: 'Main Building - Women\'s Room',
          isAccessible: true,
          status: 'available',
          timeLimit: 0,
          reservationRequired: false,
          maintenanceLog: []
        },
        {
          facilityId: uuidv4(),
          type: 'restroom_stall',
          name: 'Gender Neutral Restroom',
          isAccessible: true,
          status: 'available',
          timeLimit: 0,
          reservationRequired: false,
          maintenanceLog: []
        }
      ];
      
      this.facilities.set(restroomService.serviceId, restroomFacilities);
      restroomService.facilities = restroomFacilities;
    }
  }

  /**
   * Initialize sanitation supplies
   */
  private initializeSupplies(): void {
    const showerService = Array.from(this.services.values()).find(s => s.serviceType === 'shower');
    const laundryService = Array.from(this.services.values()).find(s => s.serviceType === 'laundry');
    const hygieneService = Array.from(this.services.values()).find(s => s.serviceType === 'hygiene_supplies');

    const showerSupplies: SanitationSupply[] = [
      {
        supplyId: uuidv4(),
        type: 'soap',
        name: 'Body Soap',
        quantity: 50,
        unit: 'bottles',
        isComplimentary: true,
        restockLevel: 10
      },
      {
        supplyId: uuidv4(),
        type: 'shampoo',
        name: 'Shampoo/Conditioner',
        quantity: 30,
        unit: 'bottles',
        isComplimentary: true,
        restockLevel: 8
      },
      {
        supplyId: uuidv4(),
        type: 'towels',
        name: 'Clean Towels',
        quantity: 100,
        unit: 'towels',
        isComplimentary: true,
        restockLevel: 20
      }
    ];

    const laundrySupplies: SanitationSupply[] = [
      {
        supplyId: uuidv4(),
        type: 'laundry_detergent',
        name: 'Laundry Detergent',
        quantity: 25,
        unit: 'pods',
        isComplimentary: true,
        restockLevel: 5
      }
    ];

    const hygieneSupplies: SanitationSupply[] = [
      {
        supplyId: uuidv4(),
        type: 'hygiene_kit',
        name: 'Basic Hygiene Kit',
        quantity: 75,
        unit: 'kits',
        isComplimentary: true,
        restockLevel: 15
      },
      {
        supplyId: uuidv4(),
        type: 'toilet_paper',
        name: 'Toilet Paper',
        quantity: 200,
        unit: 'rolls',
        isComplimentary: true,
        restockLevel: 30
      }
    ];

    if (showerService) {
      this.supplies.set(showerService.serviceId, showerSupplies);
      showerService.supplies = showerSupplies;
    }

    if (laundryService) {
      this.supplies.set(laundryService.serviceId, laundrySupplies);
      laundryService.supplies = laundrySupplies;
    }

    if (hygieneService) {
      this.supplies.set(hygieneService.serviceId, hygieneSupplies);
      hygieneService.supplies = hygieneSupplies;
    }
  }

  /**
   * Submit a sanitation service request
   */
  async submitServiceRequest(
    clientId: string,
    serviceType: 'shower' | 'restroom' | 'laundry' | 'hygiene_supplies',
    scheduledFor?: Date,
    specialRequirements?: string[]
  ): Promise<ServiceRequest> {
    const service = Array.from(this.services.values()).find(s => s.serviceType === serviceType);
    if (!service) {
      throw new Error(`Service not found: ${serviceType}`);
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const request: ServiceRequest = {
      requestId: uuidv4(),
      clientId,
      serviceType: 'sanitation',
      requestType: serviceType,
      priority: 'medium',
      status: 'submitted',
      submittedAt: new Date(),
      scheduledFor,
      location: service.location,
      details: {
        serviceId: service.serviceId,
        serviceName: service.name,
        specialRequirements: specialRequirements || []
      }
    };

    this.activeRequests.set(request.requestId, request);
    
    console.log(`🚿 Sanitation service request submitted: ${request.requestId}`);
    return request;
  }

  /**
   * Reserve a shower facility
   */
  async reserveShowerFacility(
    clientId: string,
    scheduledTime: Date,
    duration: number = 30,
    isAccessibleRequired: boolean = false
  ): Promise<FacilityReservation> {
    const showerService = Array.from(this.services.values()).find(s => s.serviceType === 'shower');
    if (!showerService) {
      throw new Error('Shower service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Find available shower facility
    const availableFacilities = showerService.facilities.filter(f => 
      f.status === 'available' && 
      (!isAccessibleRequired || f.isAccessible)
    );

    if (availableFacilities.length === 0) {
      throw new Error('No shower facilities available');
    }

    const selectedFacility = availableFacilities[0];
    const endTime = new Date(scheduledTime.getTime() + duration * 60 * 1000);

    // Check for conflicts
    const conflicts = this.reservations.filter(r => 
      r.facilityId === selectedFacility.facilityId &&
      r.status === 'scheduled' &&
      ((scheduledTime >= r.startTime && scheduledTime < r.endTime) ||
       (endTime > r.startTime && endTime <= r.endTime))
    );

    if (conflicts.length > 0) {
      throw new Error('Facility not available at requested time');
    }

    // Get shower supplies
    const supplies = this.supplies.get(showerService.serviceId) || [];
    const providedSupplies = supplies.filter(s => s.isComplimentary && s.quantity > 0);

    const reservation: FacilityReservation = {
      reservationId: uuidv4(),
      facilityId: selectedFacility.facilityId,
      clientId,
      startTime: scheduledTime,
      endTime,
      status: 'scheduled',
      suppliesProvided: providedSupplies
    };

    this.reservations.push(reservation);

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'sanitation',
      serviceName: 'Shower Facility Reservation',
      serviceDate: scheduledTime,
      outcome: 'scheduled',
      details: {
        reservationId: reservation.reservationId,
        facilityName: selectedFacility.name,
        duration,
        suppliesProvided: providedSupplies.map(s => s.name)
      }
    });

    console.log(`🚿 Shower reservation created: ${reservation.reservationId} for client ${clientId}`);
    return reservation;
  }

  /**
   * Use laundry facility
   */
  async useLaundryFacility(
    clientId: string,
    facilityType: 'washing_machine' | 'dryer',
    staffMember: string
  ): Promise<ServiceOutcome> {
    const laundryService = Array.from(this.services.values()).find(s => s.serviceType === 'laundry');
    if (!laundryService) {
      throw new Error('Laundry service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Find available facility
    const availableFacility = laundryService.facilities.find(f => 
      f.type === facilityType && f.status === 'available'
    );

    if (!availableFacility) {
      throw new Error(`No ${facilityType} available`);
    }

    // Mark facility as occupied
    availableFacility.status = 'occupied';
    availableFacility.currentUser = {
      clientId,
      startTime: new Date(),
      estimatedEndTime: new Date(Date.now() + availableFacility.timeLimit * 60 * 1000)
    };

    // Provide supplies
    const supplies = this.supplies.get(laundryService.serviceId) || [];
    const detergent = supplies.find(s => s.type === 'laundry_detergent');
    
    const resourcesUsed: ResourceUsage[] = [];
    if (detergent && detergent.quantity > 0) {
      resourcesUsed.push({
        resourceType: 'Laundry Detergent',
        quantityUsed: 1
      });
      detergent.quantity--;
    }

    const outcome: ServiceOutcome = {
      outcomeType: 'successful',
      description: `Started using ${availableFacility.name}`,
      resourcesUsed,
      followUpRequired: true // Client needs to return when done
    };

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'sanitation',
      serviceName: 'Laundry Facility Use',
      serviceDate: new Date(),
      outcome: 'in_progress',
      details: {
        facilityName: availableFacility.name,
        facilityType,
        estimatedCompletion: availableFacility.currentUser?.estimatedEndTime,
        staffMember
      }
    });

    // Schedule facility release
    setTimeout(() => {
      this.releaseFacility(availableFacility.facilityId);
    }, availableFacility.timeLimit * 60 * 1000);

    console.log(`🧺 Laundry facility in use: ${availableFacility.name} by client ${clientId}`);
    return outcome;
  }

  /**
   * Distribute hygiene supplies
   */
  async distributeHygieneSupplies(
    clientId: string,
    requestedSupplies: string[],
    staffMember: string
  ): Promise<SupplyDistribution> {
    const hygieneService = Array.from(this.services.values()).find(s => s.serviceType === 'hygiene_supplies');
    if (!hygieneService) {
      throw new Error('Hygiene supply service not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const availableSupplies = this.supplies.get(hygieneService.serviceId) || [];
    const suppliesProvided: SanitationSupply[] = [];
    let totalCost = 0;

    // Select requested supplies that are available
    for (const requestedSupply of requestedSupplies) {
      const supply = availableSupplies.find(s => 
        s.name.toLowerCase().includes(requestedSupply.toLowerCase()) && s.quantity > 0
      );
      
      if (supply) {
        suppliesProvided.push({ ...supply, quantity: 1 });
        supply.quantity--;
        if (!supply.isComplimentary && supply.cost) {
          totalCost += supply.cost;
        }
      }
    }

    const distribution: SupplyDistribution = {
      distributionId: uuidv4(),
      clientId,
      suppliesProvided,
      distributionDate: new Date(),
      staffMember,
      isComplimentary: totalCost === 0,
      totalCost
    };

    this.distributions.push(distribution);

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'sanitation',
      serviceName: 'Hygiene Supply Distribution',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        distributionId: distribution.distributionId,
        suppliesProvided: suppliesProvided.map(s => s.name),
        totalCost,
        isComplimentary: distribution.isComplimentary,
        staffMember
      }
    });

    console.log(`🧼 Hygiene supplies distributed: ${distribution.distributionId} to client ${clientId}`);
    return distribution;
  }

  /**
   * Complete shower session
   */
  async completeShowerSession(reservationId: string, staffMember: string): Promise<void> {
    const reservation = this.reservations.find(r => r.reservationId === reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    reservation.status = 'completed';
    reservation.staffMember = staffMember;

    // Release facility
    const showerService = Array.from(this.services.values()).find(s => s.serviceType === 'shower');
    if (showerService) {
      const facility = showerService.facilities.find(f => f.facilityId === reservation.facilityId);
      if (facility) {
        facility.status = 'available';
        facility.currentUser = undefined;
      }
    }

    // Update supplies used
    const resourcesUsed: ResourceUsage[] = reservation.suppliesProvided.map(s => ({
      resourceType: s.name,
      quantityUsed: 1
    }));

    // Update unified data record
    await unifiedDataOwnershipService.storeData(reservation.clientId, 'service_history', {
      serviceType: 'sanitation',
      serviceName: 'Shower Session Completed',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        reservationId,
        duration: Math.round((new Date().getTime() - reservation.startTime.getTime()) / 60000),
        suppliesUsed: resourcesUsed.map(r => r.resourceType),
        staffMember
      }
    });

    console.log(`🚿 Shower session completed: ${reservationId}`);
  }

  /**
   * Report maintenance issue
   */
  async reportMaintenanceIssue(
    facilityId: string,
    issueType: 'cleaning' | 'repair' | 'inspection' | 'supply_restock',
    description: string,
    reportedBy: string
  ): Promise<MaintenanceRecord> {
    const record: MaintenanceRecord = {
      recordId: uuidv4(),
      facilityId,
      issueType,
      description,
      reportedAt: new Date(),
      reportedBy,
      status: 'reported'
    };

    this.maintenanceRecords.push(record);

    // Find and update facility status if it's a serious issue
    for (const [, facilities] of Array.from(this.facilities.entries())) {
      const facility = facilities.find((f: SanitationFacility) => f.facilityId === facilityId);
      if (facility) {
        facility.maintenanceLog.push(record);
        if (issueType === 'repair') {
          facility.status = 'maintenance';
        }
        break;
      }
    }

    console.log(`🔧 Maintenance issue reported: ${record.recordId}`);
    return record;
  }

  // Service management methods
  async getAvailableServices(): Promise<SanitationService[]> {
    return Array.from(this.services.values());
  }

  async getServiceById(serviceId: string): Promise<SanitationService | null> {
    return this.services.get(serviceId) || null;
  }

  async getAvailableFacilities(serviceType: 'shower' | 'laundry' | 'restroom'): Promise<SanitationFacility[]> {
    const service = Array.from(this.services.values()).find(s => s.serviceType === serviceType);
    if (!service) return [];

    return service.facilities.filter(f => f.status === 'available');
  }

  async getFacilitySchedule(facilityId: string): Promise<FacilityReservation[]> {
    return this.reservations
      .filter(r => r.facilityId === facilityId && r.status !== 'cancelled')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getSupplyInventory(serviceId: string): Promise<SanitationSupply[]> {
    return this.supplies.get(serviceId) || [];
  }

  async getMaintenanceRecords(facilityId?: string): Promise<MaintenanceRecord[]> {
    if (facilityId) {
      return this.maintenanceRecords.filter(r => r.facilityId === facilityId);
    }
    return this.maintenanceRecords;
  }

  // Private helper methods
  private releaseFacility(facilityId: string): void {
    for (const [, facilities] of Array.from(this.facilities.entries())) {
      const facility = facilities.find((f: SanitationFacility) => f.facilityId === facilityId);
      if (facility && facility.status === 'occupied') {
        facility.status = 'available';
        facility.currentUser = undefined;
        console.log(`🔓 Facility released: ${facility.name}`);
        break;
      }
    }
  }
}

export const sanitationService = new SanitationServiceManager();