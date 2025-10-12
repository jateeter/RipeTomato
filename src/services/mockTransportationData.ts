/**
 * Mock Transportation Data Service
 *
 * Provides realistic mock data for all transportation metrics across
 * Manager, Staff, and Client perspectives for development and testing.
 */

import {
  Vehicle,
  RideRequest,
  Driver,
  MaintenanceRecord,
  Route,
  TransportationStats,
  TransportationVoucher,
  VoucherBatch,
  TransportationAlert,
  FuelLog,
  IncidentReport
} from '../types/Transportation';

/**
 * Mock Vehicles
 */
export const mockVehicles: Vehicle[] = [
  {
    id: 'VEH001',
    name: 'Community Van 1',
    type: 'van',
    make: 'Ford',
    model: 'Transit',
    year: 2021,
    licensePlate: 'ID-TRN-001',
    vin: '1FTBW2CM2MKA12345',
    capacity: 12,
    wheelchairAccessible: true,
    fuelType: 'gasoline',
    status: 'available',
    currentMileage: 45230,
    currentLocation: {
      latitude: 43.6150,
      longitude: -116.2023,
      address: '123 Main St, Boise, ID 83702'
    },
    features: ['gps', 'backup_camera', 'wheelchair_lift', 'air_conditioning'],
    insurance: {
      provider: 'State Farm',
      policyNumber: 'SF-2023-45678',
      expirationDate: new Date('2025-12-31')
    },
    registration: {
      expirationDate: new Date('2025-06-30'),
      state: 'ID'
    },
    lastInspection: new Date('2025-09-15'),
    nextMaintenanceDue: new Date('2025-11-15'),
    nextMaintenanceMileage: 48000
  },
  {
    id: 'VEH002',
    name: 'Medical Transport Bus',
    type: 'bus',
    make: 'Chevrolet',
    model: 'Express 3500',
    year: 2020,
    licensePlate: 'ID-BUS-002',
    vin: '1GBJG31M6Y1234567',
    capacity: 15,
    wheelchairAccessible: true,
    fuelType: 'diesel',
    status: 'in_use',
    currentMileage: 62450,
    assignedDriver: 'DRV001',
    currentLocation: {
      latitude: 43.6180,
      longitude: -116.2145,
      address: 'St. Lukes Hospital, Boise, ID'
    },
    features: ['gps', 'first_aid_kit', 'wheelchair_lift', 'oxygen_system'],
    insurance: {
      provider: 'Allstate',
      policyNumber: 'AS-2023-98765',
      expirationDate: new Date('2025-11-30')
    },
    registration: {
      expirationDate: new Date('2025-05-31'),
      state: 'ID'
    },
    lastInspection: new Date('2025-08-20'),
    nextMaintenanceDue: new Date('2025-10-20'),
    nextMaintenanceMileage: 65000
  },
  {
    id: 'VEH003',
    name: 'Service Car 1',
    type: 'car',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'ID-CAR-003',
    vin: '4T1B11HK0KU123456',
    capacity: 4,
    wheelchairAccessible: false,
    fuelType: 'hybrid',
    status: 'available',
    currentMileage: 23100,
    features: ['gps', 'backup_camera', 'bluetooth'],
    insurance: {
      provider: 'Progressive',
      policyNumber: 'PG-2023-11223',
      expirationDate: new Date('2026-01-15')
    },
    registration: {
      expirationDate: new Date('2025-08-15'),
      state: 'ID'
    },
    lastInspection: new Date('2025-09-01'),
    nextMaintenanceDue: new Date('2025-12-01'),
    nextMaintenanceMileage: 26000
  },
  {
    id: 'VEH004',
    name: 'Wheelchair Van 2',
    type: 'wheelchair_accessible',
    make: 'Dodge',
    model: 'Grand Caravan',
    year: 2019,
    licensePlate: 'ID-WCV-004',
    vin: '2C4RDGCG0KR123456',
    capacity: 6,
    wheelchairAccessible: true,
    fuelType: 'gasoline',
    status: 'maintenance',
    currentMileage: 78900,
    features: ['gps', 'wheelchair_ramp', 'hand_controls'],
    insurance: {
      provider: 'Geico',
      policyNumber: 'GI-2023-33445',
      expirationDate: new Date('2025-10-31')
    },
    registration: {
      expirationDate: new Date('2025-04-30'),
      state: 'ID'
    },
    lastInspection: new Date('2025-07-10'),
    nextMaintenanceDue: new Date('2025-10-10'),
    nextMaintenanceMileage: 80000
  },
  {
    id: 'VEH005',
    name: 'Emergency Response Van',
    type: 'van',
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2023,
    licensePlate: 'ID-EMR-005',
    vin: 'WD3PE7CD3NP123456',
    capacity: 8,
    wheelchairAccessible: false,
    fuelType: 'diesel',
    status: 'in_use',
    currentMileage: 12350,
    assignedDriver: 'DRV003',
    features: ['gps', 'emergency_lights', 'first_aid_kit', 'satellite_phone'],
    insurance: {
      provider: 'State Farm',
      policyNumber: 'SF-2023-55667',
      expirationDate: new Date('2026-03-31')
    },
    registration: {
      expirationDate: new Date('2025-09-30'),
      state: 'ID'
    },
    lastInspection: new Date('2025-09-25'),
    nextMaintenanceDue: new Date('2026-01-15'),
    nextMaintenanceMileage: 15000
  }
];

/**
 * Mock Drivers
 */
export const mockDrivers: Driver[] = [
  {
    id: 'DRV001',
    name: 'Michael Rodriguez',
    email: 'mrodriguez@example.org',
    phone: '208-555-0101',
    licenseNumber: 'ID-DL-9876543',
    licenseExpiration: new Date('2026-03-15'),
    licenseState: 'ID',
    status: 'active',
    certifications: ['wheelchair_assistance', 'first_aid', 'defensive_driving', 'cpr'],
    currentVehicle: 'VEH002',
    availability: {
      monday: [{ start: '06:00', end: '14:00' }],
      tuesday: [{ start: '06:00', end: '14:00' }],
      wednesday: [{ start: '06:00', end: '14:00' }],
      thursday: [{ start: '06:00', end: '14:00' }],
      friday: [{ start: '06:00', end: '14:00' }],
      saturday: [],
      sunday: []
    },
    stats: {
      totalRides: 1247,
      totalMiles: 15623,
      onTimePercentage: 94.5,
      safetyRating: 4.8
    }
  },
  {
    id: 'DRV002',
    name: 'Sarah Chen',
    email: 'schen@example.org',
    phone: '208-555-0102',
    licenseNumber: 'ID-DL-8765432',
    licenseExpiration: new Date('2025-11-20'),
    licenseState: 'ID',
    status: 'active',
    certifications: ['wheelchair_assistance', 'defensive_driving', 'cpr'],
    availability: {
      monday: [{ start: '14:00', end: '22:00' }],
      tuesday: [{ start: '14:00', end: '22:00' }],
      wednesday: [{ start: '14:00', end: '22:00' }],
      thursday: [{ start: '14:00', end: '22:00' }],
      friday: [{ start: '14:00', end: '22:00' }],
      saturday: [{ start: '08:00', end: '16:00' }],
      sunday: []
    },
    stats: {
      totalRides: 892,
      totalMiles: 11234,
      onTimePercentage: 96.2,
      safetyRating: 4.9
    }
  },
  {
    id: 'DRV003',
    name: 'James Patterson',
    email: 'jpatterson@example.org',
    phone: '208-555-0103',
    licenseNumber: 'ID-DL-7654321',
    licenseExpiration: new Date('2026-07-10'),
    licenseState: 'ID',
    status: 'active',
    certifications: ['wheelchair_assistance', 'first_aid', 'defensive_driving', 'cpr', 'hazmat'],
    currentVehicle: 'VEH005',
    availability: {
      monday: [{ start: '22:00', end: '06:00' }],
      tuesday: [{ start: '22:00', end: '06:00' }],
      wednesday: [{ start: '22:00', end: '06:00' }],
      thursday: [{ start: '22:00', end: '06:00' }],
      friday: [{ start: '22:00', end: '06:00' }],
      saturday: [{ start: '16:00', end: '00:00' }],
      sunday: [{ start: '16:00', end: '00:00' }]
    },
    stats: {
      totalRides: 653,
      totalMiles: 8932,
      onTimePercentage: 91.8,
      safetyRating: 4.7
    }
  },
  {
    id: 'DRV004',
    name: 'Emily Johnson',
    email: 'ejohnson@example.org',
    phone: '208-555-0104',
    licenseNumber: 'ID-DL-6543210',
    licenseExpiration: new Date('2027-02-28'),
    licenseState: 'ID',
    status: 'active',
    certifications: ['wheelchair_assistance', 'first_aid', 'cpr'],
    availability: {
      monday: [{ start: '08:00', end: '16:00' }],
      tuesday: [{ start: '08:00', end: '16:00' }],
      wednesday: [{ start: '08:00', end: '16:00' }],
      thursday: [{ start: '08:00', end: '16:00' }],
      friday: [{ start: '08:00', end: '16:00' }],
      saturday: [],
      sunday: [{ start: '08:00', end: '16:00' }]
    },
    stats: {
      totalRides: 445,
      totalMiles: 6234,
      onTimePercentage: 97.1,
      safetyRating: 5.0
    }
  }
];

/**
 * Mock Ride Requests
 */
export const mockRideRequests: RideRequest[] = [
  {
    id: 'RIDE001',
    clientId: 'CLI001',
    clientName: 'John Smith',
    type: 'appointment',
    priority: 'high',
    status: 'scheduled',
    requestedBy: 'staff_001',
    requestedAt: new Date('2025-10-11T09:00:00'),
    scheduledDate: new Date('2025-10-12T10:00:00'),
    scheduledTime: '10:00 AM',
    estimatedDuration: 45,
    pickup: {
      address: '456 Oak St, Boise, ID 83702',
      latitude: 43.6145,
      longitude: -116.2034,
      notes: 'Call upon arrival'
    },
    dropoff: {
      address: 'Boise VA Medical Center, 500 W Fort St, Boise, ID 83702',
      latitude: 43.6087,
      longitude: -116.1951,
      notes: 'Main entrance'
    },
    passengerCount: 1,
    wheelchairRequired: false,
    assignedVehicle: 'VEH003',
    assignedDriver: 'DRV002'
  },
  {
    id: 'RIDE002',
    clientId: 'CLI002',
    clientName: 'Maria Garcia',
    type: 'appointment',
    priority: 'medium',
    status: 'in_progress',
    requestedBy: 'staff_002',
    requestedAt: new Date('2025-10-10T14:30:00'),
    scheduledDate: new Date('2025-10-12T08:30:00'),
    scheduledTime: '8:30 AM',
    estimatedDuration: 60,
    pickup: {
      address: '789 Pine Ave, Boise, ID 83704',
      latitude: 43.6250,
      longitude: -116.2156
    },
    dropoff: {
      address: 'St. Lukes Boise Medical Center, 190 E Bannock St, Boise, ID 83712',
      latitude: 43.6180,
      longitude: -116.2145
    },
    passengerCount: 1,
    wheelchairRequired: true,
    specialNeeds: ['wheelchair', 'oxygen_tank'],
    assignedVehicle: 'VEH002',
    assignedDriver: 'DRV001',
    actualPickupTime: new Date('2025-10-12T08:32:00')
  },
  {
    id: 'RIDE003',
    clientId: 'CLI003',
    clientName: 'Robert Johnson',
    type: 'grocery',
    priority: 'low',
    status: 'requested',
    requestedBy: 'CLI003',
    requestedAt: new Date('2025-10-12T07:15:00'),
    scheduledDate: new Date('2025-10-12T14:00:00'),
    scheduledTime: '2:00 PM',
    estimatedDuration: 90,
    pickup: {
      address: '321 Elm St, Boise, ID 83705',
      latitude: 43.6195,
      longitude: -116.2089
    },
    dropoff: {
      address: 'Winco Foods, 5925 W State St, Boise, ID 83703',
      latitude: 43.6134,
      longitude: -116.2687
    },
    passengerCount: 2,
    wheelchairRequired: false,
    notes: 'Needs help loading groceries'
  },
  {
    id: 'RIDE004',
    clientId: 'CLI004',
    clientName: 'Lisa Anderson',
    type: 'employment',
    priority: 'high',
    status: 'completed',
    requestedBy: 'staff_003',
    requestedAt: new Date('2025-10-11T16:00:00'),
    scheduledDate: new Date('2025-10-12T06:00:00'),
    scheduledTime: '6:00 AM',
    estimatedDuration: 30,
    pickup: {
      address: '654 Maple Dr, Boise, ID 83706',
      latitude: 43.6223,
      longitude: -116.2178
    },
    dropoff: {
      address: 'Micron Technology, 8000 S Federal Way, Boise, ID 83716',
      latitude: 43.5234,
      longitude: -116.2589
    },
    passengerCount: 1,
    wheelchairRequired: false,
    assignedVehicle: 'VEH003',
    assignedDriver: 'DRV004',
    actualPickupTime: new Date('2025-10-12T06:02:00'),
    actualDropoffTime: new Date('2025-10-12T06:28:00'),
    mileage: 12.4
  }
];

/**
 * Mock Transportation Statistics
 */
export const mockTransportationStats: TransportationStats = {
  timestamp: new Date(),
  vehicles: {
    total: 5,
    available: 2,
    inUse: 2,
    maintenance: 1,
    outOfService: 0,
    utilizationRate: 0.60
  },
  rides: {
    today: 12,
    thisWeek: 67,
    thisMonth: 284,
    pending: 3,
    scheduled: 8,
    inProgress: 2,
    completed: 7,
    cancelled: 1,
    noShows: 0,
    onTimePercentage: 94.3
  },
  maintenance: {
    scheduled: 2,
    overdue: 1,
    inProgress: 1,
    completed: 18,
    totalCost: 14567.89
  },
  drivers: {
    total: 4,
    active: 4,
    onDuty: 3,
    available: 1
  },
  efficiency: {
    averageRideTime: 42,
    averageMilesPerRide: 8.7,
    totalMilesToday: 104.4,
    fuelEfficiency: 16.2
  }
};

/**
 * Mock Vouchers
 */
export const mockVouchers: TransportationVoucher[] = [
  {
    id: 'VCH001',
    type: 'bus_token',
    status: 'active',
    value: 10.00,
    clientId: 'CLI001',
    clientName: 'John Smith',
    issuedBy: 'staff_001',
    issuedAt: new Date('2025-10-01'),
    expirationDate: new Date('2025-10-31'),
    provider: 'Valley Regional Transit',
    notes: 'For medical appointments'
  },
  {
    id: 'VCH002',
    type: 'rideshare',
    status: 'active',
    value: 25.00,
    clientId: 'CLI002',
    clientName: 'Maria Garcia',
    issuedBy: 'staff_002',
    issuedAt: new Date('2025-10-05'),
    expirationDate: new Date('2025-10-31'),
    provider: 'Uber',
    restrictions: ['medical_appointments_only'],
    notes: 'Emergency medical transport'
  },
  {
    id: 'VCH003',
    type: 'gas_card',
    status: 'used',
    value: 50.00,
    clientId: 'CLI005',
    clientName: 'David Williams',
    issuedBy: 'staff_001',
    issuedAt: new Date('2025-09-15'),
    expirationDate: new Date('2025-09-30'),
    usedAt: new Date('2025-09-18'),
    usedFor: 'Job interview travel',
    provider: 'Shell',
    accountingCode: 'TRANS-2025-09'
  },
  {
    id: 'VCH004',
    type: 'transit_pass',
    status: 'active',
    value: 35.00,
    clientId: 'CLI003',
    clientName: 'Robert Johnson',
    issuedBy: 'staff_003',
    issuedAt: new Date('2025-10-01'),
    expirationDate: new Date('2025-10-31'),
    provider: 'Valley Regional Transit',
    notes: 'Monthly pass for employment'
  }
];

/**
 * Mock Voucher Batch
 */
export const mockVoucherBatch: VoucherBatch = {
  id: 'BATCH001',
  name: 'October 2025 Transit Passes',
  type: 'transit_pass',
  quantity: 50,
  totalValue: 1750.00,
  createdBy: 'admin_001',
  createdAt: new Date('2025-10-01'),
  expirationDate: new Date('2025-10-31'),
  issuedCount: 23,
  usedCount: 15,
  provider: 'Valley Regional Transit',
  status: 'active'
};

/**
 * Mock Alerts
 */
export const mockAlerts: TransportationAlert[] = [
  {
    id: 'ALERT001',
    type: 'maintenance_due',
    severity: 'warning',
    title: 'Vehicle Maintenance Due',
    message: 'Community Van 1 is due for scheduled maintenance in 3 days',
    entityId: 'VEH001',
    entityType: 'vehicle',
    createdAt: new Date('2025-10-12T08:00:00'),
    acknowledged: false,
    actionRequired: true
  },
  {
    id: 'ALERT002',
    type: 'license_expiring',
    severity: 'warning',
    title: 'Driver License Expiring',
    message: 'Sarah Chen\'s driver license expires in 45 days',
    entityId: 'DRV002',
    entityType: 'driver',
    createdAt: new Date('2025-10-10T09:00:00'),
    acknowledged: true,
    acknowledgedBy: 'admin_001',
    acknowledgedAt: new Date('2025-10-10T10:30:00'),
    actionRequired: true,
    actionTaken: 'Renewal reminder sent to driver'
  },
  {
    id: 'ALERT003',
    type: 'ride_delay',
    severity: 'info',
    title: 'Ride Running Late',
    message: 'RIDE002 is running 15 minutes behind schedule',
    entityId: 'RIDE002',
    entityType: 'ride',
    createdAt: new Date('2025-10-12T08:45:00'),
    acknowledged: true,
    acknowledgedBy: 'DRV001',
    acknowledgedAt: new Date('2025-10-12T08:46:00')
  }
];

/**
 * Mock Routes
 */
export const mockRoutes: Route[] = [
  {
    id: 'ROUTE001',
    name: 'Morning Medical Route',
    date: new Date('2025-10-12'),
    driverId: 'DRV001',
    driverName: 'Michael Rodriguez',
    vehicleId: 'VEH002',
    vehicleName: 'Medical Transport Bus',
    status: 'in_progress',
    stops: [
      {
        id: 'STOP001',
        rideRequestId: 'RIDE002',
        sequence: 1,
        type: 'pickup',
        clientName: 'Maria Garcia',
        address: '789 Pine Ave, Boise, ID 83704',
        latitude: 43.6250,
        longitude: -116.2156,
        scheduledTime: '08:30',
        actualArrival: new Date('2025-10-12T08:32:00'),
        completed: true
      },
      {
        id: 'STOP002',
        rideRequestId: 'RIDE002',
        sequence: 2,
        type: 'dropoff',
        clientName: 'Maria Garcia',
        address: 'St. Lukes Boise Medical Center',
        latitude: 43.6180,
        longitude: -116.2145,
        scheduledTime: '09:00',
        completed: false
      }
    ],
    estimatedDistance: 5.2,
    estimatedDuration: 45,
    startTime: new Date('2025-10-12T08:15:00')
  }
];

/**
 * Mock Maintenance Records
 */
export const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'MAINT001',
    vehicleId: 'VEH004',
    vehicleName: 'Wheelchair Van 2',
    type: 'routine',
    status: 'in_progress',
    description: 'Oil change, tire rotation, and 80k mile service',
    scheduledDate: new Date('2025-10-12'),
    mileageAtService: 78900,
    facility: 'Idaho Auto Care',
    cost: 450.00,
    notes: 'Also replacing air filter'
  },
  {
    id: 'MAINT002',
    vehicleId: 'VEH001',
    vehicleName: 'Community Van 1',
    type: 'routine',
    status: 'scheduled',
    description: 'Scheduled 48k mile maintenance',
    scheduledDate: new Date('2025-11-15'),
    mileageAtService: 48000,
    nextServiceMileage: 54000
  }
];

/**
 * Mock Fuel Logs
 */
export const mockFuelLogs: FuelLog[] = [
  {
    id: 'FUEL001',
    vehicleId: 'VEH001',
    vehicleName: 'Community Van 1',
    date: new Date('2025-10-10'),
    driverId: 'DRV001',
    driverName: 'Michael Rodriguez',
    fuelType: 'gasoline',
    quantity: 18.5,
    cost: 64.75,
    pricePerUnit: 3.50,
    mileage: 45100,
    location: 'Chevron - State St'
  },
  {
    id: 'FUEL002',
    vehicleId: 'VEH002',
    vehicleName: 'Medical Transport Bus',
    date: new Date('2025-10-11'),
    driverId: 'DRV001',
    driverName: 'Michael Rodriguez',
    fuelType: 'diesel',
    quantity: 25.0,
    cost: 92.50,
    pricePerUnit: 3.70,
    mileage: 62300,
    location: 'Flying J - I-84'
  }
];

/**
 * Service functions to retrieve mock data
 */
export const transportationMockDataService = {
  // Vehicles
  getVehicles: () => Promise.resolve(mockVehicles),
  getVehicleById: (id: string) => Promise.resolve(mockVehicles.find(v => v.id === id)),
  getAvailableVehicles: () => Promise.resolve(mockVehicles.filter(v => v.status === 'available')),

  // Drivers
  getDrivers: () => Promise.resolve(mockDrivers),
  getDriverById: (id: string) => Promise.resolve(mockDrivers.find(d => d.id === id)),
  getAvailableDrivers: () => Promise.resolve(mockDrivers.filter(d => d.status === 'active' && !d.currentVehicle)),

  // Rides
  getRideRequests: () => Promise.resolve(mockRideRequests),
  getRideById: (id: string) => Promise.resolve(mockRideRequests.find(r => r.id === id)),
  getPendingRides: () => Promise.resolve(mockRideRequests.filter(r => r.status === 'requested' || r.status === 'scheduled')),
  getClientRides: (clientId: string) => Promise.resolve(mockRideRequests.filter(r => r.clientId === clientId)),

  // Stats
  getTransportationStats: () => Promise.resolve(mockTransportationStats),

  // Vouchers
  getVouchers: () => Promise.resolve(mockVouchers),
  getClientVouchers: (clientId: string) => Promise.resolve(mockVouchers.filter(v => v.clientId === clientId)),
  getActiveVouchers: () => Promise.resolve(mockVouchers.filter(v => v.status === 'active')),

  // Alerts
  getAlerts: () => Promise.resolve(mockAlerts),
  getUnacknowledgedAlerts: () => Promise.resolve(mockAlerts.filter(a => !a.acknowledged)),

  // Routes
  getRoutes: () => Promise.resolve(mockRoutes),
  getActiveRoutes: () => Promise.resolve(mockRoutes.filter(r => r.status === 'in_progress')),

  // Maintenance
  getMaintenanceRecords: () => Promise.resolve(mockMaintenanceRecords),
  getPendingMaintenance: () => Promise.resolve(mockMaintenanceRecords.filter(m => m.status === 'scheduled' || m.status === 'overdue')),

  // Fuel
  getFuelLogs: () => Promise.resolve(mockFuelLogs),

  // Batch operations
  getVoucherBatch: () => Promise.resolve(mockVoucherBatch)
};
