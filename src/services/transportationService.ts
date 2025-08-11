/**
 * Transportation Services
 * 
 * Manages bus services, shuttle routes, ride vouchers, bicycle programs,
 * and route planning within the Community Services Hub.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TransportationService,
  Vehicle,
  TransportRoute,
  ServiceArea,
  ServicePoint,
  ServiceRequest,
  ServiceSchedule,
  ServiceRequirement,
  RouteSchedule,
  GeographicBoundary,
  ServiceOutcome,
  ResourceUsage
} from '../types/CommunityServices';
import { UnifiedDataOwner } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';

interface TripRequest {
  tripId: string;
  clientId: string;
  pickupPoint: ServicePoint;
  dropoffPoint: ServicePoint;
  requestedTime: Date;
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assignedVehicle?: string;
  assignedRoute?: string;
  actualPickupTime?: Date;
  actualDropoffTime?: Date;
  notes?: string;
}

interface RideVoucher {
  voucherId: string;
  clientId: string;
  voucherType: 'bus_pass' | 'taxi_voucher' | 'gas_card' | 'general_transport';
  value: number;
  issuedDate: Date;
  expirationDate: Date;
  isUsed: boolean;
  usedDate?: Date;
  usedFor?: string;
  restrictions: string[];
}

interface BicycleAssignment {
  assignmentId: string;
  clientId: string;
  bicycleId: string;
  checkoutDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  notes?: string;
  maintenanceRequired: boolean;
}

class TransportationServiceManager {
  private services: Map<string, TransportationService> = new Map();
  private vehicles: Map<string, Vehicle[]> = new Map();
  private routes: Map<string, TransportRoute[]> = new Map();
  private serviceAreas: Map<string, ServiceArea> = new Map();
  private tripRequests: TripRequest[] = [];
  private rideVouchers: RideVoucher[] = [];
  private bicycleAssignments: BicycleAssignment[] = [];
  private activeRequests: Map<string, ServiceRequest> = new Map();

  constructor() {
    this.initializeDefaultServices();
    console.log('🚌 Transportation Services initialized');
  }

  /**
   * Initialize default transportation services
   */
  private initializeDefaultServices(): void {
    const busService: TransportationService = {
      serviceId: uuidv4(),
      serviceType: 'bus_service',
      name: 'Community Bus Service',
      description: 'Free bus service connecting key community locations',
      serviceArea: this.createDefaultServiceArea(),
      vehicles: [],
      routes: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '06:00',
        endTime: '20:00',
        isRecurring: true,
        exceptions: []
      },
      eligibility: []
    };
    busService.schedule.serviceId = busService.serviceId;

    const shuttleService: TransportationService = {
      serviceId: uuidv4(),
      serviceType: 'shuttle',
      name: 'Medical Shuttle Service',
      description: 'Scheduled shuttle service to medical appointments and essential services',
      serviceArea: this.createDefaultServiceArea(),
      vehicles: [],
      routes: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '07:00',
        endTime: '18:00',
        isRecurring: true,
        exceptions: []
      },
      eligibility: [
        {
          requirementType: 'appointment_only',
          description: 'Medical appointments or essential services only',
          isStrict: true
        }
      ]
    };
    shuttleService.schedule.serviceId = shuttleService.serviceId;

    const voucherService: TransportationService = {
      serviceId: uuidv4(),
      serviceType: 'ride_voucher',
      name: 'Transportation Voucher Program',
      description: 'Vouchers for public transportation and emergency transportation needs',
      serviceArea: this.createDefaultServiceArea(),
      vehicles: [],
      routes: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
        exceptions: []
      },
      eligibility: [
        {
          requirementType: 'income_verification',
          description: 'Income verification required',
          isStrict: true
        }
      ]
    };
    voucherService.schedule.serviceId = voucherService.serviceId;

    const bicycleService: TransportationService = {
      serviceId: uuidv4(),
      serviceType: 'bicycle_program',
      name: 'Community Bicycle Program',
      description: 'Bicycle lending program for sustainable transportation',
      serviceArea: this.createDefaultServiceArea(),
      vehicles: [],
      routes: [],
      schedule: {
        scheduleId: uuidv4(),
        serviceId: '',
        dayOfWeek: 'monday',
        startTime: '08:00',
        endTime: '19:00',
        isRecurring: true,
        exceptions: []
      },
      eligibility: [
        {
          requirementType: 'age_minimum',
          value: 16,
          description: 'Must be at least 16 years old',
          isStrict: true
        }
      ]
    };
    bicycleService.schedule.serviceId = bicycleService.serviceId;

    this.services.set(busService.serviceId, busService);
    this.services.set(shuttleService.serviceId, shuttleService);
    this.services.set(voucherService.serviceId, voucherService);
    this.services.set(bicycleService.serviceId, bicycleService);

    // Initialize vehicles, routes, and service areas
    this.initializeVehicles();
    this.initializeRoutes();
  }

  /**
   * Create default service area
   */
  private createDefaultServiceArea(): ServiceArea {
    const servicePoints: ServicePoint[] = [
      {
        pointId: uuidv4(),
        name: 'Community Services Hub',
        address: '123 Community Way',
        coordinates: { latitude: 43.6150, longitude: -116.2023 },
        type: 'hub',
        amenities: ['shelter', 'restrooms', 'information'],
        accessibility: [
          { feature: 'wheelchair_accessible', available: true }
        ]
      },
      {
        pointId: uuidv4(),
        name: 'Medical Center',
        address: '456 Health Drive',
        coordinates: { latitude: 43.6180, longitude: -116.2050 },
        type: 'dropoff',
        amenities: ['medical_services', 'pharmacy'],
        accessibility: [
          { feature: 'wheelchair_accessible', available: true }
        ]
      },
      {
        pointId: uuidv4(),
        name: 'Job Training Center',
        address: '789 Skills Boulevard',
        coordinates: { latitude: 43.6120, longitude: -116.1980 },
        type: 'dropoff',
        amenities: ['job_training', 'computer_lab'],
        accessibility: [
          { feature: 'wheelchair_accessible', available: true }
        ]
      },
      {
        pointId: uuidv4(),
        name: 'Downtown Transit Center',
        address: '321 Transit Plaza',
        coordinates: { latitude: 43.6140, longitude: -116.2010 },
        type: 'transfer',
        amenities: ['public_transit', 'restrooms', 'information'],
        accessibility: [
          { feature: 'wheelchair_accessible', available: true }
        ]
      }
    ];

    return {
      areaId: uuidv4(),
      name: 'Community Services Area',
      boundaries: [{
        coordinates: [
          { latitude: 43.6200, longitude: -116.2100 },
          { latitude: 43.6200, longitude: -116.1900 },
          { latitude: 43.6100, longitude: -116.1900 },
          { latitude: 43.6100, longitude: -116.2100 }
        ],
        type: 'inclusion'
      }],
      servicePoints
    };
  }

  /**
   * Initialize transportation vehicles
   */
  private initializeVehicles(): void {
    const busService = Array.from(this.services.values()).find(s => s.serviceType === 'bus_service');
    const shuttleService = Array.from(this.services.values()).find(s => s.serviceType === 'shuttle');
    const bicycleService = Array.from(this.services.values()).find(s => s.serviceType === 'bicycle_program');

    if (busService) {
      const busVehicles: Vehicle[] = [
        {
          vehicleId: uuidv4(),
          type: 'bus',
          name: 'Community Bus 1',
          capacity: 25,
          accessibility: [
            { feature: 'wheelchair_accessible', available: true }
          ],
          currentStatus: 'available',
          maintenanceLog: []
        },
        {
          vehicleId: uuidv4(),
          type: 'bus',
          name: 'Community Bus 2',
          capacity: 30,
          accessibility: [
            { feature: 'wheelchair_accessible', available: true }
          ],
          currentStatus: 'available',
          maintenanceLog: []
        }
      ];
      
      this.vehicles.set(busService.serviceId, busVehicles);
      busService.vehicles = busVehicles;
    }

    if (shuttleService) {
      const shuttleVehicles: Vehicle[] = [
        {
          vehicleId: uuidv4(),
          type: 'van',
          name: 'Medical Shuttle 1',
          capacity: 8,
          accessibility: [
            { feature: 'wheelchair_accessible', available: true }
          ],
          currentStatus: 'available',
          maintenanceLog: []
        },
        {
          vehicleId: uuidv4(),
          type: 'van',
          name: 'Medical Shuttle 2',
          capacity: 12,
          accessibility: [
            { feature: 'wheelchair_accessible', available: false }
          ],
          currentStatus: 'available',
          maintenanceLog: []
        }
      ];
      
      this.vehicles.set(shuttleService.serviceId, shuttleVehicles);
      shuttleService.vehicles = shuttleVehicles;
    }

    if (bicycleService) {
      const bicycles: Vehicle[] = Array.from({ length: 20 }, (_, i) => ({
        vehicleId: uuidv4(),
        type: 'bicycle',
        name: `Community Bike ${i + 1}`,
        capacity: 1,
        accessibility: [],
        currentStatus: 'available',
        maintenanceLog: []
      }));
      
      this.vehicles.set(bicycleService.serviceId, bicycles);
      bicycleService.vehicles = bicycles;
    }
  }

  /**
   * Initialize transportation routes
   */
  private initializeRoutes(): void {
    const busService = Array.from(this.services.values()).find(s => s.serviceType === 'bus_service');
    const shuttleService = Array.from(this.services.values()).find(s => s.serviceType === 'shuttle');

    if (busService) {
      const serviceArea = busService.serviceArea;
      const route1: TransportRoute = {
        routeId: uuidv4(),
        name: 'Main Community Route',
        description: 'Connects all major community service locations',
        servicePoints: serviceArea.servicePoints.map(sp => sp.pointId),
        estimatedDuration: 45,
        distance: 8.5,
        schedule: [],
        isActive: true,
        accessibility: [
          { feature: 'wheelchair_accessible', available: true }
        ]
      };

      this.routes.set(busService.serviceId, [route1]);
      busService.routes = [route1];
    }

    if (shuttleService) {
      const serviceArea = shuttleService.serviceArea;
      const medicalRoute: TransportRoute = {
        routeId: uuidv4(),
        name: 'Medical Services Route',
        description: 'Direct service to medical facilities',
        servicePoints: serviceArea.servicePoints
          .filter(sp => sp.type === 'hub' || sp.name.includes('Medical'))
          .map(sp => sp.pointId),
        estimatedDuration: 20,
        distance: 3.2,
        schedule: [],
        isActive: true,
        accessibility: [
          { feature: 'wheelchair_accessible', available: true }
        ]
      };

      this.routes.set(shuttleService.serviceId, [medicalRoute]);
      shuttleService.routes = [medicalRoute];
    }
  }

  /**
   * Submit a transportation service request
   */
  async submitServiceRequest(
    clientId: string,
    serviceType: 'bus_service' | 'shuttle' | 'ride_voucher' | 'bicycle_program',
    requestDetails: Record<string, any>
  ): Promise<ServiceRequest> {
    const service = Array.from(this.services.values()).find(s => s.serviceType === serviceType);
    if (!service) {
      throw new Error(`Service not found: ${serviceType}`);
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Validate eligibility
    await this.validateServiceEligibility(service, owner, requestDetails);

    const request: ServiceRequest = {
      requestId: uuidv4(),
      clientId,
      serviceType: 'transportation',
      requestType: serviceType,
      priority: this.determinePriority(requestDetails),
      status: 'submitted',
      submittedAt: new Date(),
      scheduledFor: requestDetails.scheduledFor ? new Date(requestDetails.scheduledFor) : undefined,
      location: requestDetails.pickupLocation || service.serviceArea.name,
      details: {
        serviceId: service.serviceId,
        serviceName: service.name,
        ...requestDetails
      }
    };

    this.activeRequests.set(request.requestId, request);
    
    console.log(`🚌 Transportation service request submitted: ${request.requestId}`);
    return request;
  }

  /**
   * Request a trip on bus or shuttle service
   */
  async requestTrip(
    clientId: string,
    pickupPointId: string,
    dropoffPointId: string,
    requestedTime: Date,
    serviceType: 'bus_service' | 'shuttle' = 'bus_service'
  ): Promise<TripRequest> {
    const service = Array.from(this.services.values()).find(s => s.serviceType === serviceType);
    if (!service) {
      throw new Error(`Service not found: ${serviceType}`);
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const pickupPoint = service.serviceArea.servicePoints.find(sp => sp.pointId === pickupPointId);
    const dropoffPoint = service.serviceArea.servicePoints.find(sp => sp.pointId === dropoffPointId);

    if (!pickupPoint || !dropoffPoint) {
      throw new Error('Invalid pickup or dropoff point');
    }

    // Find available vehicle and route
    const availableVehicle = service.vehicles.find(v => v.currentStatus === 'available');
    const suitableRoute = service.routes.find(r => 
      r.servicePoints.includes(pickupPointId) && r.servicePoints.includes(dropoffPointId)
    );

    if (!availableVehicle) {
      throw new Error('No vehicles available');
    }

    if (!suitableRoute) {
      throw new Error('No routes available for requested points');
    }

    const tripRequest: TripRequest = {
      tripId: uuidv4(),
      clientId,
      pickupPoint,
      dropoffPoint,
      requestedTime,
      status: 'requested',
      assignedVehicle: availableVehicle.vehicleId,
      assignedRoute: suitableRoute.routeId
    };

    this.tripRequests.push(tripRequest);

    // Update vehicle status
    availableVehicle.currentStatus = 'in_service';

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'transportation',
      serviceName: `${service.name} Trip Request`,
      serviceDate: requestedTime,
      outcome: 'scheduled',
      details: {
        tripId: tripRequest.tripId,
        pickupLocation: pickupPoint.name,
        dropoffLocation: dropoffPoint.name,
        vehicleName: availableVehicle.name,
        routeName: suitableRoute.name
      }
    });

    console.log(`🚌 Trip requested: ${tripRequest.tripId} for client ${clientId}`);
    return tripRequest;
  }

  /**
   * Issue transportation voucher
   */
  async issueTransportationVoucher(
    clientId: string,
    voucherType: 'bus_pass' | 'taxi_voucher' | 'gas_card' | 'general_transport',
    value: number,
    restrictions: string[] = [],
    staffMember: string
  ): Promise<RideVoucher> {
    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const voucher: RideVoucher = {
      voucherId: uuidv4(),
      clientId,
      voucherType,
      value,
      issuedDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isUsed: false,
      restrictions
    };

    this.rideVouchers.push(voucher);

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'transportation',
      serviceName: 'Transportation Voucher Issued',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        voucherId: voucher.voucherId,
        voucherType,
        value,
        restrictions,
        expirationDate: voucher.expirationDate,
        staffMember
      }
    });

    console.log(`🎫 Transportation voucher issued: ${voucher.voucherId} to client ${clientId}`);
    return voucher;
  }

  /**
   * Checkout bicycle
   */
  async checkoutBicycle(
    clientId: string,
    expectedReturnDate: Date,
    staffMember: string
  ): Promise<BicycleAssignment> {
    const bicycleService = Array.from(this.services.values()).find(s => s.serviceType === 'bicycle_program');
    if (!bicycleService) {
      throw new Error('Bicycle program not available');
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Check if client already has a bicycle
    const existingAssignment = this.bicycleAssignments.find(
      ba => ba.clientId === clientId && !ba.actualReturnDate
    );

    if (existingAssignment) {
      throw new Error('Client already has a bicycle checked out');
    }

    // Find available bicycle
    const availableBicycle = bicycleService.vehicles.find(v => 
      v.type === 'bicycle' && v.currentStatus === 'available'
    );

    if (!availableBicycle) {
      throw new Error('No bicycles available');
    }

    const assignment: BicycleAssignment = {
      assignmentId: uuidv4(),
      clientId,
      bicycleId: availableBicycle.vehicleId,
      checkoutDate: new Date(),
      expectedReturnDate,
      condition: 'good',
      maintenanceRequired: false
    };

    this.bicycleAssignments.push(assignment);

    // Update bicycle status
    availableBicycle.currentStatus = 'in_service';

    // Store service record
    await unifiedDataOwnershipService.storeData(clientId, 'service_history', {
      serviceType: 'transportation',
      serviceName: 'Bicycle Checkout',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        assignmentId: assignment.assignmentId,
        bicycleName: availableBicycle.name,
        expectedReturnDate,
        staffMember
      }
    });

    console.log(`🚲 Bicycle checked out: ${assignment.assignmentId} to client ${clientId}`);
    return assignment;
  }

  /**
   * Return bicycle
   */
  async returnBicycle(
    assignmentId: string,
    condition: 'excellent' | 'good' | 'fair' | 'needs_repair',
    staffMember: string,
    notes?: string
  ): Promise<void> {
    const assignment = this.bicycleAssignments.find(ba => ba.assignmentId === assignmentId);
    if (!assignment) {
      throw new Error(`Assignment not found: ${assignmentId}`);
    }

    if (assignment.actualReturnDate) {
      throw new Error('Bicycle already returned');
    }

    // Update assignment
    assignment.actualReturnDate = new Date();
    assignment.condition = condition;
    assignment.maintenanceRequired = condition === 'needs_repair';
    assignment.notes = notes;

    // Update bicycle status
    const bicycleService = Array.from(this.services.values()).find(s => s.serviceType === 'bicycle_program');
    if (bicycleService) {
      const bicycle = bicycleService.vehicles.find(v => v.vehicleId === assignment.bicycleId);
      if (bicycle) {
        bicycle.currentStatus = condition === 'needs_repair' ? 'maintenance' : 'available';
      }
    }

    // Store service record
    await unifiedDataOwnershipService.storeData(assignment.clientId, 'service_history', {
      serviceType: 'transportation',
      serviceName: 'Bicycle Return',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        assignmentId,
        condition,
        maintenanceRequired: assignment.maintenanceRequired,
        staffMember,
        notes
      }
    });

    console.log(`🚲 Bicycle returned: ${assignmentId}`);
  }

  /**
   * Complete trip
   */
  async completeTrip(tripId: string): Promise<ServiceOutcome> {
    const trip = this.tripRequests.find(tr => tr.tripId === tripId);
    if (!trip) {
      throw new Error(`Trip not found: ${tripId}`);
    }

    trip.status = 'completed';
    trip.actualDropoffTime = new Date();

    // Release vehicle
    const services = Array.from(this.services.values());
    for (const service of services) {
      const vehicle = service.vehicles.find(v => v.vehicleId === trip.assignedVehicle);
      if (vehicle) {
        vehicle.currentStatus = 'available';
        break;
      }
    }

    const outcome: ServiceOutcome = {
      outcomeType: 'successful',
      description: `Trip completed from ${trip.pickupPoint.name} to ${trip.dropoffPoint.name}`,
      resourcesUsed: [{
        resourceType: 'Vehicle Usage',
        quantityUsed: 1,
        notes: 'Transportation service provided'
      }],
      followUpRequired: false
    };

    // Update service record
    await unifiedDataOwnershipService.storeData(trip.clientId, 'service_history', {
      serviceType: 'transportation',
      serviceName: 'Trip Completed',
      serviceDate: new Date(),
      outcome: 'successful',
      details: {
        tripId,
        actualDuration: trip.actualDropoffTime && trip.actualPickupTime 
          ? Math.round((trip.actualDropoffTime.getTime() - trip.actualPickupTime.getTime()) / 60000)
          : undefined
      }
    });

    console.log(`🚌 Trip completed: ${tripId}`);
    return outcome;
  }

  // Service management methods
  async getAvailableServices(): Promise<TransportationService[]> {
    return Array.from(this.services.values());
  }

  async getServiceById(serviceId: string): Promise<TransportationService | null> {
    return this.services.get(serviceId) || null;
  }

  async getAvailableVehicles(serviceId: string): Promise<Vehicle[]> {
    const vehicles = this.vehicles.get(serviceId) || [];
    return vehicles.filter(v => v.currentStatus === 'available');
  }

  async getActiveTrips(): Promise<TripRequest[]> {
    return this.tripRequests.filter(tr => tr.status === 'in_progress' || tr.status === 'scheduled');
  }

  async getClientVouchers(clientId: string): Promise<RideVoucher[]> {
    return this.rideVouchers
      .filter(rv => rv.clientId === clientId && !rv.isUsed && rv.expirationDate > new Date())
      .sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());
  }

  async getClientBicycleAssignment(clientId: string): Promise<BicycleAssignment | null> {
    return this.bicycleAssignments.find(ba => ba.clientId === clientId && !ba.actualReturnDate) || null;
  }

  // Private helper methods
  private async validateServiceEligibility(
    service: TransportationService,
    client: UnifiedDataOwner,
    requestDetails: Record<string, any>
  ): Promise<void> {
    for (const requirement of service.eligibility) {
      switch (requirement.requirementType) {
        case 'age_minimum':
          // In a real implementation, calculate age from date of birth
          break;
        case 'income_verification':
          // In a real implementation, check income verification
          break;
        case 'appointment_only':
          if (!requestDetails.appointmentConfirmation) {
            throw new Error('This service requires appointment confirmation');
          }
          break;
      }
    }
  }

  private determinePriority(details: Record<string, any>): 'low' | 'medium' | 'high' | 'urgent' | 'emergency' {
    if (details.emergency) return 'emergency';
    if (details.medical) return 'urgent';
    if (details.job_interview || details.court_appearance) return 'high';
    return 'medium';
  }
}

export const transportationService = new TransportationServiceManager();