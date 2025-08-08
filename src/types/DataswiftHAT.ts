export interface HATConfig {
  applicationId: string;
  namespace: string;
  kind: string;
  hatApiVersion: string;
  secure: boolean;
  domain?: string;
  publicKey?: string;
  customisationPath?: string;
}

export interface HATCredentials {
  accessToken: string;
  refreshToken?: string;
  expires?: Date;
  hatDomain: string;
  applicationId: string;
}

export interface HATUser {
  hatDomain: string;
  hatName: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  publicKey?: string;
  isVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface HATDataRecord {
  recordId: string;
  endpoint: string;
  data: Record<string, any>;
  dateCreated: string;
  lastUpdated: string;
}

export interface ShelterDataRecord extends HATDataRecord {
  data: {
    clientId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
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
    preferredBedType: string;
    registrationDate: string;
    isActive: boolean;
    identificationVerified: boolean;
    shelterMetadata: {
      totalStays: number;
      lastStay?: string;
      bannedUntil?: string;
      banReason?: string;
      consentGiven: boolean;
      consentDate: string;
      dataRetentionPeriod: number;
    };
  };
}

export interface HealthDataRecord extends HATDataRecord {
  data: {
    clientId: string;
    timestamp: string;
    vitals?: {
      bloodPressure?: {
        systolic: number;
        diastolic: number;
        timestamp: string;
        source: 'manual' | 'healthkit' | 'device';
      };
      heartRate?: {
        bpm: number;
        timestamp: string;
        source: 'manual' | 'healthkit' | 'device';
      };
      temperature?: {
        celsius: number;
        timestamp: string;
        source: 'manual' | 'thermometer';
      };
    };
    medications?: {
      name: string;
      dosage: string;
      frequency: string;
      prescribedBy: string;
      startDate: string;
      endDate?: string;
    }[];
    allergies?: string[];
    medicalConditions?: string[];
    vaccinations?: {
      name: string;
      date: string;
      provider: string;
      lotNumber?: string;
    }[];
    emergencyContacts?: {
      name: string;
      phone: string;
      relationship: string;
      isPrimary: boolean;
    }[];
  };
}

export interface CommunicationRecord extends HATDataRecord {
  data: {
    clientId: string;
    staffId?: string;
    type: 'sms' | 'voice_call' | 'emergency_alert' | 'notification';
    direction: 'inbound' | 'outbound';
    content: string;
    phoneNumber: string;
    timestamp: string;
    status: 'sent' | 'delivered' | 'failed' | 'answered' | 'missed';
    metadata?: {
      callDuration?: number;
      messageId?: string;
      emergency?: boolean;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    };
  };
}

export interface HATApplication {
  applicationId: string;
  name: string;
  description: string;
  developer: {
    name: string;
    email: string;
    website: string;
  };
  permissions: {
    dataDebit: string[];
    bundleId: string;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  graphics: {
    banner?: string;
    logo?: string;
    screenshots?: string[];
  };
}

export interface DataDebit {
  dataDebitId: string;
  name: string;
  purpose: string;
  bundle: {
    [endpoint: string]: {
      endpoint: string;
      mapping?: Record<string, string>;
    };
  };
  conditions: {
    period: string;
    maxRecords: number;
  };
  rolling: boolean;
  sell: boolean;
  price: number;
  enabled: boolean;
  createdAt: string;
  lastRenewal?: string;
}

export interface HATFile {
  fileId: string;
  name: string;
  source: string;
  tags?: string[];
  title?: string;
  description?: string;
  sourceURL?: string;
  dateCreated: string;
  lastUpdated: string;
  size: number;
  contentType: string;
  contentPublic: boolean;
  permissions?: {
    userId: string;
    contentReadable: boolean;
  }[];
}

export interface HATStats {
  totalRecords: number;
  endpointsCount: number;
  applicationsCount: number;
  dataDebitsCount: number;
  storageUsed: number; // in bytes
  lastBackup?: Date;
  accountAge: number; // in days
}

export interface HATEndpoint {
  endpoint: string;
  recordsCount: number;
  lastRecord?: Date;
  mapping?: Record<string, any>;
}