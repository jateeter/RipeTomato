export interface HealthMetrics {
  id: string;
  clientId: string;
  timestamp: Date;
  
  // Vital Signs
  heartRate?: number; // bpm
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  temperature?: number; // fahrenheit
  oxygenSaturation?: number; // percentage
  respiratoryRate?: number; // breaths per minute
  
  // Physical Measurements
  weight?: number; // pounds
  height?: number; // inches
  bmi?: number;
  
  // Activity Data
  stepCount?: number;
  distanceWalked?: number; // miles
  activeEnergyBurned?: number; // calories
  exerciseMinutes?: number;
  
  // Sleep Data
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Mental Health Indicators
  stressLevel?: number; // 1-10 scale
  moodScore?: number; // 1-10 scale
  anxietyLevel?: number; // 1-10 scale
  
  // Medical Conditions
  chronicConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  
  // Emergency Indicators
  hasEmergencyCondition?: boolean;
  emergencyNotes?: string;
  
  // Data Source
  dataSource: 'healthkit' | 'manual' | 'wearable' | 'medical';
  syncedAt: Date;
}

export interface HealthAlert {
  id: string;
  clientId: string;
  type: 'critical' | 'warning' | 'info';
  category: 'vitals' | 'medication' | 'emergency' | 'wellness';
  title: string;
  description: string;
  recommendations?: string[];
  createdAt: Date;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface HealthBasedBedCriteria {
  requiresmedicalSupervision: boolean;
  needsAccessibility: boolean;
  requiresQuietEnvironment: boolean;
  needsProximityToStaff: boolean;
  temperatureRegulation: 'standard' | 'cooling' | 'warming';
  mobilityAssistance: boolean;
  medicationReminders: boolean;
  emergencyMonitoring: boolean;
}

export interface BedHealthCompatibility {
  bedId: string;
  hasAccessibility: boolean;
  hasMedicalSupport: boolean;
  hasQuietZone: boolean;
  hasStaffProximity: boolean;
  hasTemperatureControl: boolean;
  hasMedicationStorage: boolean;
  hasEmergencyAlert: boolean;
  maxOccupancyForMedical: number;
}

export interface HealthKitData {
  // HealthKit specific data structures
  identifier: string;
  startDate: Date;
  endDate: Date;
  value: number | string;
  unit: string;
  metadata?: Record<string, any>;
}

export interface HealthDataSyncStatus {
  lastSync: Date;
  status: 'synced' | 'syncing' | 'error' | 'disconnected';
  errorMessage?: string;
  recordsCount: number;
  pendingSync: number;
}

export interface ClientHealthProfile {
  clientId: string;
  healthMetrics: HealthMetrics[];
  healthAlerts: HealthAlert[];
  bedCriteria: HealthBasedBedCriteria;
  syncStatus: HealthDataSyncStatus;
  consentGiven: boolean;
  consentDate?: Date;
  dataRetentionDays: number;
}