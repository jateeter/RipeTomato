export type PassType = 'boardingPass' | 'coupon' | 'eventTicket' | 'generic' | 'storeCard';

export interface AppleWalletPass {
  id: string;
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  serialNumber: string;
  
  // Pass appearance
  formatVersion: number;
  description: string;
  logoText?: string;
  foregroundColor?: string;
  backgroundColor?: string;
  labelColor?: string;
  
  // Pass type specific data
  generic?: GenericPass;
  storeCard?: StoreCardPass;
  eventTicket?: EventTicketPass;
  
  // Fields
  headerFields?: PassField[];
  primaryFields?: PassField[];
  secondaryFields?: PassField[];
  auxiliaryFields?: PassField[];
  backFields?: PassField[];
  
  // Barcodes/QR codes
  barcodes?: Barcode[];
  
  // Location and time
  locations?: Location[];
  expirationDate?: Date;
  voided?: boolean;
  
  // Associated app
  associatedStoreIdentifiers?: number[];
  appLaunchURL?: string;
  
  // User info
  userInfo?: Record<string, any>;
  
  // Web service
  webServiceURL?: string;
  authenticationToken?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface PassField {
  key: string;
  label?: string;
  value: string;
  changeMessage?: string;
  textAlignment?: 'left' | 'center' | 'right' | 'natural';
  attributedValue?: string;
  currencyCode?: string;
  dateStyle?: 'none' | 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'none' | 'short' | 'medium' | 'long' | 'full';
  isRelative?: boolean;
  ignoresTimeZone?: boolean;
  numberStyle?: 'decimal' | 'percent' | 'scientific' | 'spellOut';
}

export interface Barcode {
  message: string;
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128';
  messageEncoding: string;
  altText?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
  relevantText?: string;
}

export interface GenericPass {
  // Generic passes are the most flexible
}

export interface StoreCardPass {
  // Store cards (loyalty cards, membership cards)
}

export interface EventTicketPass {
  // Event tickets
}

export interface ShelterPass extends AppleWalletPass {
  clientId: string;
  clientName: string;
  shelterName: string;
  bedNumber?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  emergencyContact?: string;
  medicalAlerts?: string[];
  accessLevel: 'guest' | 'resident' | 'staff' | 'volunteer';
  services: string[];
}

export interface HealthCredential extends AppleWalletPass {
  clientId: string;
  credentialType: 'vaccination' | 'medical_id' | 'insurance' | 'prescription' | 'allergy_alert';
  issuer: string;
  issuedDate: Date;
  expirationDate?: Date;
  verificationData: string;
  healthData?: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    emergencyContacts?: {
      name: string;
      phone: string;
      relationship: string;
    }[];
    medicalConditions?: string[];
  };
}

export interface IdentificationPass extends AppleWalletPass {
  clientId: string;
  documentType: 'shelter_id' | 'temporary_id' | 'service_card';
  issuingOrganization: string;
  documentNumber: string;
  issuedDate: Date;
  expirationDate?: Date;
  photo?: string; // Base64 encoded image
  biometricData?: string; // Encrypted biometric hash
  securityFeatures: string[];
}

export interface WalletIntegrationConfig {
  teamIdentifier: string;
  passTypeIdentifiers: {
    shelter: string;
    health: string;
    identification: string;
  };
  certificatePath: string;
  privateKeyPath: string;
  wwdrCertificatePath: string;
  webServiceURL: string;
  organizationName: string;
}

export interface PassUpdateRequest {
  passId: string;
  serialNumber: string;
  fields: Partial<{
    headerFields: PassField[];
    primaryFields: PassField[];
    secondaryFields: PassField[];
    auxiliaryFields: PassField[];
    backFields: PassField[];
  }>;
  barcodes?: Barcode[];
  userInfo?: Record<string, any>;
}

export interface WalletServiceStats {
  totalPasses: number;
  activepasses: number;
  passByType: Record<string, number>;
  recentInstalls: number;
  updatesSent: number;
  lastUpdate: Date;
}