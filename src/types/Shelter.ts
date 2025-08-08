export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phone?: string;
  email?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalNotes?: string;
  behavioralNotes?: string;
  restrictions?: string[];
  preferredBedType?: 'standard' | 'accessible' | 'family';
  lastStay?: Date;
  totalStays: number;
  isActive: boolean;
  registrationDate: Date;
  photoUrl?: string;
  identificationVerified: boolean;
  bannedUntil?: Date;
  banReason?: string;
}

export interface Bed {
  id: string;
  number: string;
  type: 'standard' | 'accessible' | 'family' | 'isolation' | 'medical';
  capacity: number;
  location: string; // Room/Area name
  floor?: number;
  isActive: boolean;
  notes?: string;
  lastCleaned?: Date;
  maintenanceRequired?: boolean;
  
  // Health-based amenities
  hasAccessibility: boolean;
  hasMedicalSupport: boolean;
  hasQuietZone: boolean;
  hasStaffProximity: boolean;
  hasTemperatureControl: boolean;
  hasMedicationStorage: boolean;
  hasEmergencyAlert: boolean;
  maxOccupancyForMedical: number;
  
  // Bed rating for health compatibility (0-100)
  healthCompatibilityScore?: number;
}

export interface BedReservation {
  id: string;
  bedId: string;
  clientId: string;
  reservationDate: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'reserved' | 'checked-in' | 'no-show' | 'checked-out' | 'cancelled';
  priority: 'standard' | 'high' | 'emergency';
  notes?: string;
  createdBy: string; // Staff member ID
  createdAt: Date;
  updatedAt: Date;
  noShowTime?: Date;
  checkInVerificationMethod?: 'photo' | 'id' | 'staff-verification' | 'biometric';
  specialRequests?: string[];
}

export interface Notification {
  id: string;
  recipientId: string; // Client ID
  recipientType: 'client' | 'staff';
  type: 'bed-assigned' | 'checkin-reminder' | 'no-show-warning' | 'waitlist-update' | 'policy-update' | 'emergency';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  sentAt: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: {
    bedNumber?: string;
    reservationId?: string;
    checkInDeadline?: Date;
  };
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  requestDate: Date;
  preferredDate: Date;
  priority: 'standard' | 'high' | 'emergency';
  specialNeeds?: string[];
  status: 'active' | 'assigned' | 'expired' | 'cancelled';
  position?: number;
  estimatedAvailability?: Date;
  notes?: string;
  createdBy: string;
}

export interface ShelterCapacity {
  date: Date;
  totalBeds: number;
  availableBeds: number;
  reservedBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
  waitlistCount: number;
  utilizationRate: number;
}

export interface CheckInSession {
  id: string;
  reservationId: string;
  clientId: string;
  startTime: Date;
  completedTime?: Date;
  status: 'in-progress' | 'completed' | 'failed' | 'abandoned';
  verificationSteps: {
    identityVerified: boolean;
    photoTaken: boolean;
    rulesAcknowledged: boolean;
    medicalScreening: boolean;
    belongingsChecked: boolean;
  };
  staffId?: string;
  notes?: string;
  failureReason?: string;
}

export interface ShelterStats {
  today: {
    totalReservations: number;
    checkedIn: number;
    noShows: number;
    waitlistCount: number;
    occupancyRate: number;
  };
  thisWeek: {
    averageOccupancy: number;
    totalClients: number;
    newRegistrations: number;
    repeatStays: number;
  };
}