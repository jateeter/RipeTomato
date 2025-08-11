/**
 * Community Services Hub Types
 * 
 * Core types for the Community Services Hub that provides shelter management,
 * food and water services, sanitation services, and transportation services.
 * 
 * @license MIT
 */

import { UnifiedDataOwner } from './UnifiedDataOwnership';

// Core Community Services Framework
export type CommunityServiceType = 'shelter' | 'food_water' | 'sanitation' | 'transportation';

export interface CommunityConfiguration {
  communityName: string;
  locations: CommunityLocation[];
  services: CommunityServiceConfig[];
  contactInfo: ContactInformation;
  operatingHours: OperatingHours;
  emergencyProtocols: EmergencyProtocol[];
}

export interface CommunityLocation {
  locationId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  serviceTypes: CommunityServiceType[];
  capacity: Record<CommunityServiceType, number>;
  accessibility: AccessibilityFeature[];
  contactInfo: ContactInformation;
}

export interface CommunityServiceConfig {
  serviceType: CommunityServiceType;
  isEnabled: boolean;
  configuration: Record<string, any>;
  staffing: StaffingConfig;
  resources: ResourceConfig[];
}

export interface ContactInformation {
  phone: string;
  email: string;
  website?: string;
  emergencyPhone?: string;
  languages: string[];
}

export interface OperatingHours {
  timezone: string;
  schedule: {
    [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: {
      isOpen: boolean;
      openTime?: string; // HH:mm format
      closeTime?: string; // HH:mm format
      breaks?: TimeBlock[];
    };
  };
  holidays: Holiday[];
  emergencyAvailability: boolean;
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
  reason: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
  isOpen: boolean;
  specialHours?: {
    openTime: string;
    closeTime: string;
  };
}

export interface AccessibilityFeature {
  feature: 'wheelchair_accessible' | 'hearing_loop' | 'braille_signage' | 'sign_language' | 'multilingual_staff';
  available: boolean;
  notes?: string;
}

export interface StaffingConfig {
  minimumStaff: number;
  currentStaff: number;
  roles: StaffRole[];
  shiftSchedule: ShiftSchedule[];
}

export interface StaffRole {
  roleId: string;
  title: string;
  responsibilities: string[];
  requiredCertifications: string[];
  languageRequirements?: string[];
}

export interface ShiftSchedule {
  shiftId: string;
  startTime: string;
  endTime: string;
  staffRequired: number;
  assignedStaff: string[];
}

export interface ResourceConfig {
  resourceType: string;
  currentQuantity: number;
  maxCapacity: number;
  restockThreshold: number;
  unit: string;
  cost?: number;
  supplier?: string;
}

export interface EmergencyProtocol {
  protocolId: string;
  emergencyType: 'fire' | 'medical' | 'security' | 'weather' | 'power_outage' | 'other';
  triggerConditions: string[];
  responseSteps: ResponseStep[];
  contactNumbers: string[];
  evacuationPlan?: EvacuationPlan;
}

export interface ResponseStep {
  stepNumber: number;
  action: string;
  responsible: string;
  timeLimit: number; // minutes
  prerequisites?: string[];
}

export interface EvacuationPlan {
  primaryRoute: string;
  alternateRoutes: string[];
  meetingPoint: string;
  specialNeeds: string[];
}

// Service Request System
export interface ServiceRequest {
  requestId: string;
  clientId: string;
  serviceType: CommunityServiceType;
  requestType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'submitted' | 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'denied';
  submittedAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  assignedStaff?: string[];
  location: string;
  details: Record<string, any>;
  notes?: string;
  outcome?: ServiceOutcome;
}

export interface ServiceOutcome {
  outcomeType: 'successful' | 'partially_successful' | 'unsuccessful' | 'referred';
  description: string;
  resourcesUsed: ResourceUsage[];
  followUpRequired: boolean;
  referrals?: ServiceReferral[];
  clientFeedback?: ClientFeedback;
}

export interface ResourceUsage {
  resourceType: string;
  quantityUsed: number;
  cost?: number;
  notes?: string;
}

export interface ServiceReferral {
  referralId: string;
  serviceType: CommunityServiceType;
  organization: string;
  contactInfo: ContactInformation;
  reason: string;
  status: 'pending' | 'contacted' | 'accepted' | 'declined';
}

export interface ClientFeedback {
  rating: number; // 1-5 scale
  comments?: string;
  wouldRecommend: boolean;
  submittedAt: Date;
}

// Food and Water Services
export interface FoodWaterService {
  serviceId: string;
  serviceType: 'meal' | 'food_pantry' | 'water_distribution' | 'nutrition_counseling';
  name: string;
  description: string;
  location: string;
  schedule: ServiceSchedule;
  capacity: number;
  currentOccupancy: number;
  requirements: ServiceRequirement[];
  resources: FoodWaterResource[];
  nutritionInfo?: NutritionInformation;
}

export interface ServiceSchedule {
  scheduleId: string;
  serviceId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  exceptions: ScheduleException[];
}

export interface ScheduleException {
  date: string; // YYYY-MM-DD
  reason: string;
  alternativeSchedule?: {
    startTime: string;
    endTime: string;
  };
  isCancelled: boolean;
}

export interface ServiceRequirement {
  requirementType: 'age_minimum' | 'age_maximum' | 'income_verification' | 'id_required' | 'appointment_only' | 'first_time_orientation';
  value?: string | number;
  description: string;
  isStrict: boolean;
}

export interface FoodWaterResource {
  resourceId: string;
  type: 'food_item' | 'beverage' | 'utensils' | 'containers';
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expirationDate?: Date;
  allergens: string[];
  dietaryInfo: DietaryInfo;
  nutritionInfo?: NutritionInformation;
}

export interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
  customDietaryNotes?: string[];
}

export interface NutritionInformation {
  servingSize: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

// Sanitation Services
export interface SanitationService {
  serviceId: string;
  serviceType: 'shower' | 'restroom' | 'laundry' | 'hygiene_supplies' | 'waste_disposal';
  name: string;
  location: string;
  facilities: SanitationFacility[];
  supplies: SanitationSupply[];
  schedule: ServiceSchedule;
  accessRequirements: ServiceRequirement[];
}

export interface SanitationFacility {
  facilityId: string;
  type: 'shower_stall' | 'restroom_stall' | 'washing_machine' | 'dryer' | 'sink' | 'disposal_unit';
  name: string;
  isAccessible: boolean;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order';
  timeLimit: number; // minutes
  reservationRequired: boolean;
  currentUser?: {
    clientId: string;
    startTime: Date;
    estimatedEndTime: Date;
  };
  maintenanceLog: MaintenanceRecord[];
}

export interface SanitationSupply {
  supplyId: string;
  type: 'soap' | 'shampoo' | 'towels' | 'toilet_paper' | 'laundry_detergent' | 'hygiene_kit';
  name: string;
  quantity: number;
  unit: string;
  isComplimentary: boolean;
  cost?: number;
  restockLevel: number;
}

export interface MaintenanceRecord {
  recordId: string;
  facilityId: string;
  issueType: 'cleaning' | 'repair' | 'inspection' | 'supply_restock';
  description: string;
  reportedAt: Date;
  reportedBy: string;
  assignedTo?: string;
  completedAt?: Date;
  cost?: number;
  status: 'reported' | 'assigned' | 'in_progress' | 'completed' | 'deferred';
}

// Transportation Services
export interface TransportationService {
  serviceId: string;
  serviceType: 'bus_service' | 'shuttle' | 'ride_voucher' | 'bicycle_program' | 'route_planning';
  name: string;
  description: string;
  serviceArea: ServiceArea;
  vehicles: Vehicle[];
  routes: TransportRoute[];
  schedule: ServiceSchedule;
  eligibility: ServiceRequirement[];
}

export interface ServiceArea {
  areaId: string;
  name: string;
  boundaries: GeographicBoundary[];
  servicePoints: ServicePoint[];
  restrictedAreas?: RestrictedArea[];
}

export interface GeographicBoundary {
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  type: 'inclusion' | 'exclusion';
}

export interface ServicePoint {
  pointId: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: 'pickup' | 'dropoff' | 'hub' | 'transfer';
  amenities: string[];
  accessibility: AccessibilityFeature[];
}

export interface RestrictedArea {
  areaId: string;
  name: string;
  coordinates: GeographicBoundary['coordinates'];
  reason: string;
  restrictions: string[];
  timeRestrictions?: TimeBlock[];
}

export interface Vehicle {
  vehicleId: string;
  type: 'bus' | 'van' | 'car' | 'bicycle';
  name: string;
  capacity: number;
  accessibility: AccessibilityFeature[];
  currentStatus: 'available' | 'in_service' | 'maintenance' | 'out_of_service';
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  assignedRoute?: string;
  assignedDriver?: string;
  fuelLevel?: number;
  maintenanceLog: MaintenanceRecord[];
}

export interface TransportRoute {
  routeId: string;
  name: string;
  description: string;
  servicePoints: string[]; // Array of ServicePoint IDs in order
  estimatedDuration: number; // minutes
  distance: number; // miles or kilometers
  schedule: RouteSchedule[];
  isActive: boolean;
  accessibility: AccessibilityFeature[];
}

export interface RouteSchedule {
  scheduleId: string;
  routeId: string;
  vehicleId: string;
  driverId: string;
  departureTime: string;
  arrivalTimes: {
    servicePointId: string;
    estimatedArrival: string;
  }[];
  daysOfWeek: string[];
  isRecurring: boolean;
}

// Client Services Interface
export interface ClientServiceDashboard {
  clientId: string;
  owner: UnifiedDataOwner;
  availableServices: AvailableService[];
  activeRequests: ServiceRequest[];
  serviceHistory: CompletedServiceRecord[];
  documentsShared: SharedDocument[];
  upcomingAppointments: ServiceAppointment[];
  notifications: ClientNotification[];
}

export interface AvailableService {
  serviceType: CommunityServiceType;
  serviceName: string;
  location: string;
  nextAvailable: Date;
  requirements: ServiceRequirement[];
  estimatedWaitTime?: number; // minutes
  cost?: number;
  description: string;
}

export interface CompletedServiceRecord {
  serviceId: string;
  serviceType: CommunityServiceType;
  serviceName: string;
  completedAt: Date;
  outcome: ServiceOutcome;
  location: string;
  staffMember: string;
  clientSatisfaction?: ClientFeedback;
}

export interface SharedDocument {
  documentId: string;
  documentName: string;
  documentType: string;
  solidPodUrl: string;
  sharedWith: string[];
  sharedAt: Date;
  expiresAt?: Date;
  accessLevel: 'view' | 'download' | 'edit' | 'full';
  qrCode?: string; // QR code for sharing access
}

export interface ServiceAppointment {
  appointmentId: string;
  serviceType: CommunityServiceType;
  serviceName: string;
  scheduledFor: Date;
  location: string;
  staffMember?: string;
  duration: number; // minutes
  requirements: string[];
  confirmationRequired: boolean;
  reminderSent: boolean;
}

export interface ClientNotification {
  notificationId: string;
  type: 'appointment_reminder' | 'service_available' | 'document_request' | 'emergency_alert' | 'schedule_change';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date;
  actionRequired?: NotificationAction;
}

export interface NotificationAction {
  actionType: 'confirm_appointment' | 'share_document' | 'update_profile' | 'contact_staff';
  actionUrl?: string;
  deadline?: Date;
}

// Organization Management
export interface OrganizationDashboard {
  organizationId: string;
  communityConfig: CommunityConfiguration;
  serviceMetrics: ServiceMetrics[];
  staffMetrics: StaffMetrics;
  resourceMetrics: ResourceMetrics;
  clientMetrics: ClientMetrics;
  financialMetrics: FinancialMetrics;
  alerts: OrganizationAlert[];
  reports: OrganizationReport[];
}

export interface ServiceMetrics {
  serviceType: CommunityServiceType;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  averageWaitTime: number; // minutes
  averageServiceTime: number; // minutes
  clientSatisfactionRating: number; // 1-5 scale
  capacityUtilization: number; // percentage
  trends: MetricTrend[];
}

export interface MetricTrend {
  date: string; // YYYY-MM-DD
  value: number;
  metric: string;
}

export interface StaffMetrics {
  totalStaff: number;
  activeStaff: number;
  staffUtilization: number; // percentage
  averageServiceTime: number; // minutes per client
  trainingCompletionRate: number; // percentage
  staffSatisfactionRating?: number; // 1-5 scale
  certificationExpirations: CertificationExpiration[];
}

export interface CertificationExpiration {
  staffId: string;
  staffName: string;
  certificationType: string;
  expirationDate: Date;
  daysUntilExpiration: number;
}

export interface ResourceMetrics {
  totalResources: number;
  lowStockItems: number;
  expiredItems: number;
  totalInventoryValue: number;
  monthlyConsumption: ResourceConsumption[];
  wasteMetrics: WasteMetrics;
}

export interface ResourceConsumption {
  resourceType: string;
  quantityUsed: number;
  cost: number;
  month: string; // YYYY-MM
}

export interface WasteMetrics {
  foodWaste: number; // percentage
  supplyWaste: number; // percentage
  costOfWaste: number;
  wasteReductionGoals: WasteReductionGoal[];
}

export interface WasteReductionGoal {
  goalId: string;
  targetReduction: number; // percentage
  currentReduction: number; // percentage
  targetDate: Date;
  strategies: string[];
}

export interface ClientMetrics {
  totalActiveClients: number;
  newClientsThisMonth: number;
  returningClients: number;
  averageServicesPerClient: number;
  clientRetentionRate: number; // percentage
  demographicBreakdown: DemographicData;
  serviceUtilization: ServiceUtilizationData[];
}

export interface DemographicData {
  ageGroups: { group: string; count: number }[];
  genderDistribution: { gender: string; count: number }[];
  ethnicityDistribution: { ethnicity: string; count: number }[];
  languagePreferences: { language: string; count: number }[];
  specialNeeds: { need: string; count: number }[];
}

export interface ServiceUtilizationData {
  serviceType: CommunityServiceType;
  uniqueClients: number;
  totalSessions: number;
  averageSessionsPerClient: number;
  peakUsageTimes: PeakUsageTime[];
}

export interface PeakUsageTime {
  timeSlot: string; // HH:mm-HH:mm
  dayOfWeek: string;
  averageOccupancy: number;
}

export interface FinancialMetrics {
  totalBudget: number;
  budgetUtilization: number; // percentage
  costPerClient: number;
  costPerService: ServiceCostBreakdown[];
  fundingSources: FundingSource[];
  grants: GrantInformation[];
  donations: DonationSummary;
}

export interface ServiceCostBreakdown {
  serviceType: CommunityServiceType;
  totalCost: number;
  costPerClient: number;
  majorExpenses: ExpenseCategory[];
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface FundingSource {
  sourceId: string;
  sourceName: string;
  sourceType: 'government' | 'grant' | 'donation' | 'fees' | 'other';
  amount: number;
  percentage: number;
  restrictions?: string[];
  renewalDate?: Date;
}

export interface GrantInformation {
  grantId: string;
  grantName: string;
  funder: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  requirements: string[];
  reportingRequirements: ReportingRequirement[];
}

export interface ReportingRequirement {
  requirementId: string;
  reportType: string;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'on-demand';
  nextDueDate: Date;
  isCompleted: boolean;
}

export interface DonationSummary {
  totalDonations: number;
  averageDonation: number;
  donorCount: number;
  recurringDonors: number;
  inKindDonations: InKindDonation[];
}

export interface InKindDonation {
  donationId: string;
  donor: string;
  itemType: string;
  estimatedValue: number;
  receivedAt: Date;
  condition: 'new' | 'good' | 'fair' | 'needs_repair';
}

export interface OrganizationAlert {
  alertId: string;
  alertType: 'resource_shortage' | 'staff_shortage' | 'equipment_failure' | 'capacity_exceeded' | 'certification_expiring' | 'grant_deadline' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedServices: CommunityServiceType[];
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  actionTaken?: string;
  followUpRequired: boolean;
}

export interface OrganizationReport {
  reportId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  title: string;
  generatedAt: Date;
  generatedBy: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  sections: ReportSection[];
  attachments?: ReportAttachment[];
}

export interface ReportSection {
  sectionId: string;
  title: string;
  content: string;
  charts?: ChartData[];
  tables?: TableData[];
}

export interface ChartData {
  chartId: string;
  chartType: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface TableData {
  tableId: string;
  title: string;
  headers: string[];
  rows: any[][];
}

export interface ReportAttachment {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  solidPodUrl?: string;
}

// Constants
export const COMMUNITY_SERVICE_TYPES = {
  SHELTER: 'shelter',
  FOOD_WATER: 'food_water',
  SANITATION: 'sanitation',
  TRANSPORTATION: 'transportation'
} as const;

// Array version for easier iteration
export const COMMUNITY_SERVICE_TYPE_VALUES: CommunityServiceType[] = [
  'shelter',
  'food_water', 
  'sanitation',
  'transportation'
];

export const SERVICE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
  EMERGENCY: 'emergency'
} as const;

export const SERVICE_STATUSES = {
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DENIED: 'denied'
} as const;