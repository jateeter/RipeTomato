import { Client, Bed, BedReservation, Notification, WaitlistEntry, ShelterCapacity } from '../types/Shelter';

export const mockClients: Client[] = [
  {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: new Date('1985-03-15'),
    phone: '(208) 555-0123',
    email: 'john.smith@email.com',
    emergencyContact: {
      name: 'Mary Smith',
      phone: '(208) 555-0124',
      relationship: 'Sister'
    },
    preferredBedType: 'standard',
    lastStay: new Date('2024-07-10'),
    totalStays: 15,
    isActive: true,
    registrationDate: new Date('2024-01-15'),
    identificationVerified: true
  },
  {
    id: 'client-2',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    dateOfBirth: new Date('1992-08-22'),
    phone: '(208) 555-0125',
    medicalNotes: 'Diabetes - requires refrigerated medication',
    preferredBedType: 'accessible',
    lastStay: new Date('2024-07-12'),
    totalStays: 8,
    isActive: true,
    registrationDate: new Date('2024-03-20'),
    identificationVerified: true
  },
  {
    id: 'client-3',
    firstName: 'Robert',
    lastName: 'Johnson',
    dateOfBirth: new Date('1978-11-05'),
    phone: '(208) 555-0126',
    behavioralNotes: 'PTSD - may need quiet location',
    preferredBedType: 'standard',
    totalStays: 32,
    isActive: true,
    registrationDate: new Date('2023-08-10'),
    identificationVerified: true
  },
  {
    id: 'client-4',
    firstName: 'Sarah',
    lastName: 'Williams',
    dateOfBirth: new Date('1990-05-18'),
    phone: '(208) 555-0127',
    preferredBedType: 'family',
    totalStays: 3,
    isActive: true,
    registrationDate: new Date('2024-06-01'),
    identificationVerified: false
  }
];

export const mockBeds: Bed[] = [
  { 
    id: 'bed-1', 
    number: 'A01', 
    type: 'standard', 
    capacity: 1, 
    location: 'Room A', 
    floor: 1, 
    isActive: true,
    hasAccessibility: false,
    hasMedicalSupport: false,
    hasQuietZone: false,
    hasStaffProximity: true,
    hasTemperatureControl: false,
    hasMedicationStorage: false,
    hasEmergencyAlert: false,
    maxOccupancyForMedical: 2
  },
  { 
    id: 'bed-2', 
    number: 'A02', 
    type: 'standard', 
    capacity: 1, 
    location: 'Room A', 
    floor: 1, 
    isActive: true,
    hasAccessibility: false,
    hasMedicalSupport: false,
    hasQuietZone: false,
    hasStaffProximity: true,
    hasTemperatureControl: false,
    hasMedicationStorage: false,
    hasEmergencyAlert: false,
    maxOccupancyForMedical: 2
  },
  { 
    id: 'bed-3', 
    number: 'A03', 
    type: 'accessible', 
    capacity: 1, 
    location: 'Room A', 
    floor: 1, 
    isActive: true,
    hasAccessibility: true,
    hasMedicalSupport: false,
    hasQuietZone: false,
    hasStaffProximity: true,
    hasTemperatureControl: true,
    hasMedicationStorage: false,
    hasEmergencyAlert: true,
    maxOccupancyForMedical: 1
  },
  { 
    id: 'bed-4', 
    number: 'B01', 
    type: 'standard', 
    capacity: 1, 
    location: 'Room B', 
    floor: 1, 
    isActive: true,
    hasAccessibility: false,
    hasMedicalSupport: false,
    hasQuietZone: false,
    hasStaffProximity: false,
    hasTemperatureControl: false,
    hasMedicationStorage: false,
    hasEmergencyAlert: false,
    maxOccupancyForMedical: 2
  },
  { 
    id: 'bed-5', 
    number: 'B02', 
    type: 'standard', 
    capacity: 1, 
    location: 'Room B', 
    floor: 1, 
    isActive: true,
    hasAccessibility: false,
    hasMedicalSupport: false,
    hasQuietZone: false,
    hasStaffProximity: false,
    hasTemperatureControl: false,
    hasMedicationStorage: false,
    hasEmergencyAlert: false,
    maxOccupancyForMedical: 2
  },
  { 
    id: 'bed-6', 
    number: 'C01', 
    type: 'family', 
    capacity: 4, 
    location: 'Family Suite C', 
    floor: 2, 
    isActive: true,
    hasAccessibility: true,
    hasMedicalSupport: false,
    hasQuietZone: true,
    hasStaffProximity: false,
    hasTemperatureControl: true,
    hasMedicationStorage: false,
    hasEmergencyAlert: false,
    maxOccupancyForMedical: 2
  },
  { 
    id: 'bed-7', 
    number: 'D01', 
    type: 'isolation', 
    capacity: 1, 
    location: 'Isolation Room D', 
    floor: 2, 
    isActive: true,
    hasAccessibility: false,
    hasMedicalSupport: true,
    hasQuietZone: true,
    hasStaffProximity: true,
    hasTemperatureControl: true,
    hasMedicationStorage: true,
    hasEmergencyAlert: true,
    maxOccupancyForMedical: 1
  },
  { 
    id: 'bed-8', 
    number: 'E01', 
    type: 'standard', 
    capacity: 1, 
    location: 'Room E', 
    floor: 2, 
    isActive: true, 
    maintenanceRequired: true,
    hasAccessibility: false,
    hasMedicalSupport: false,
    hasQuietZone: false,
    hasStaffProximity: false,
    hasTemperatureControl: false,
    hasMedicationStorage: false,
    hasEmergencyAlert: false,
    maxOccupancyForMedical: 2
  }
];

export const mockReservations: BedReservation[] = [
  {
    id: 'res-1',
    bedId: 'bed-1',
    clientId: 'client-1',
    reservationDate: new Date(),
    status: 'checked-in',
    priority: 'standard',
    createdBy: 'staff-1',
    createdAt: new Date('2024-07-13T14:00:00'),
    updatedAt: new Date('2024-07-13T18:30:00'),
    checkInTime: new Date('2024-07-13T18:30:00'),
    checkInVerificationMethod: 'photo'
  },
  {
    id: 'res-2',
    bedId: 'bed-3',
    clientId: 'client-2',
    reservationDate: new Date(),
    status: 'reserved',
    priority: 'high',
    createdBy: 'staff-2',
    createdAt: new Date('2024-07-13T15:30:00'),
    updatedAt: new Date('2024-07-13T15:30:00'),
    notes: 'Client needs accessible bed due to mobility issues'
  },
  {
    id: 'res-3',
    bedId: 'bed-4',
    clientId: 'client-3',
    reservationDate: new Date(),
    status: 'no-show',
    priority: 'standard',
    createdBy: 'staff-1',
    createdAt: new Date('2024-07-13T12:00:00'),
    updatedAt: new Date('2024-07-13T20:00:00'),
    noShowTime: new Date('2024-07-13T20:00:00')
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    recipientId: 'client-2',
    recipientType: 'client',
    type: 'bed-assigned',
    title: 'Bed Assignment Confirmed',
    message: 'Your bed (A03) has been assigned for tonight. Please check in by 7:00 PM.',
    priority: 'high',
    isRead: false,
    sentAt: new Date('2024-07-13T15:30:00'),
    actionRequired: true,
    metadata: {
      bedNumber: 'A03',
      reservationId: 'res-2',
      checkInDeadline: new Date('2024-07-13T19:00:00')
    }
  },
  {
    id: 'notif-2',
    recipientId: 'client-4',
    recipientType: 'client',
    type: 'waitlist-update',
    title: 'Waitlist Update',
    message: 'You are now #2 on the waitlist. We expect a family bed to be available tomorrow.',
    priority: 'normal',
    isRead: false,
    sentAt: new Date('2024-07-13T16:45:00'),
    actionRequired: false
  },
  {
    id: 'notif-3',
    recipientId: 'client-3',
    recipientType: 'client',
    type: 'no-show-warning',
    title: 'No-Show Recorded',
    message: 'You did not check in for your reserved bed tonight. This affects your priority for future reservations.',
    priority: 'high',
    isRead: false,
    sentAt: new Date('2024-07-13T20:00:00'),
    actionRequired: false
  }
];

export const mockWaitlist: WaitlistEntry[] = [
  {
    id: 'wait-1',
    clientId: 'client-4',
    requestDate: new Date('2024-07-13T10:00:00'),
    preferredDate: new Date(),
    priority: 'high',
    specialNeeds: ['family-bed', 'ground-floor'],
    status: 'active',
    position: 2,
    estimatedAvailability: new Date('2024-07-14T18:00:00'),
    createdBy: 'staff-1'
  },
  {
    id: 'wait-2',
    clientId: 'client-5',
    requestDate: new Date('2024-07-13T14:30:00'),
    preferredDate: new Date(),
    priority: 'standard',
    status: 'active',
    position: 3,
    createdBy: 'staff-2'
  }
];

export const mockCapacity: ShelterCapacity = {
  date: new Date(),
  totalBeds: 8,
  availableBeds: 3,
  reservedBeds: 2,
  occupiedBeds: 2,
  maintenanceBeds: 1,
  waitlistCount: 2,
  utilizationRate: 0.75
};