/**
 * Epic FHIR API Types and Interfaces
 * 
 * TypeScript definitions for Epic's FHIR R4 API implementation
 * following HL7 FHIR standards for health data interoperability.
 * 
 * @license MIT
 */

export interface EpicFHIRConfig {
  baseUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes: string[];
  environment: 'sandbox' | 'production' | 'development';
  version: 'R4' | 'STU3' | 'DSTU2';
  timeout?: number;
  retryAttempts?: number;
}

export interface EpicOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  patient?: string;
  encounter?: string;
  need_patient_banner?: boolean;
  smart_style_url?: string;
  issued_at: number;
}

// FHIR Resource Base
export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
    security?: Coding[];
    tag?: Coding[];
  };
  implicitRules?: string;
  language?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

export interface Quantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>' | 'ad';
  unit?: string;
  system?: string;
  code?: string;
}

// Patient Resource
export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceased?: boolean | string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  contact?: PatientContact[];
  communication?: PatientCommunication[];
  generalPractitioner?: Reference[];
  managingOrganization?: Reference;
  link?: PatientLink[];
}

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: Period;
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: Period;
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: Reference;
  period?: Period;
}

export interface PatientCommunication {
  language: CodeableConcept;
  preferred?: boolean;
}

export interface PatientLink {
  other: Reference;
  type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
}

// Observation Resource
export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  identifier?: Identifier[];
  basedOn?: Reference[];
  partOf?: Reference[];
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  focus?: Reference[];
  encounter?: Reference;
  effective?: string | Period;
  issued?: string;
  performer?: Reference[];
  value?: ObservationValue;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  bodySite?: CodeableConcept;
  method?: CodeableConcept;
  specimen?: Reference;
  device?: Reference;
  referenceRange?: ObservationReferenceRange[];
  hasMember?: Reference[];
  derivedFrom?: Reference[];
  component?: ObservationComponent[];
}

export type ObservationValue = 
  | { valueQuantity: Quantity }
  | { valueCodeableConcept: CodeableConcept }
  | { valueString: string }
  | { valueBoolean: boolean }
  | { valueInteger: number }
  | { valueRange: Range }
  | { valueRatio: Ratio }
  | { valueSampledData: SampledData }
  | { valueTime: string }
  | { valueDateTime: string }
  | { valuePeriod: Period };

export interface Range {
  low?: Quantity;
  high?: Quantity;
}

export interface Ratio {
  numerator?: Quantity;
  denominator?: Quantity;
}

export interface SampledData {
  origin: Quantity;
  period: number;
  factor?: number;
  lowerLimit?: number;
  upperLimit?: number;
  dimensions: number;
  data?: string;
}

export interface Annotation {
  author?: Reference | string;
  time?: string;
  text: string;
}

export interface ObservationReferenceRange {
  low?: Quantity;
  high?: Quantity;
  type?: CodeableConcept;
  appliesTo?: CodeableConcept[];
  age?: Range;
  text?: string;
}

export interface ObservationComponent {
  code: CodeableConcept;
  value?: ObservationValue;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  referenceRange?: ObservationReferenceRange[];
}

// Medication Request
export interface FHIRMedicationRequest extends FHIRResource {
  resourceType: 'MedicationRequest';
  identifier?: Identifier[];
  status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown';
  statusReason?: CodeableConcept;
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  category?: CodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  doNotPerform?: boolean;
  reported?: boolean | Reference;
  medication: CodeableConcept | Reference;
  subject: Reference;
  encounter?: Reference;
  supportingInformation?: Reference[];
  authoredOn?: string;
  requester?: Reference;
  performer?: Reference;
  performerType?: CodeableConcept;
  recorder?: Reference;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: Reference[];
  groupIdentifier?: Identifier;
  courseOfTherapyType?: CodeableConcept;
  insurance?: Reference[];
  note?: Annotation[];
  dosageInstruction?: Dosage[];
  dispenseRequest?: MedicationRequestDispenseRequest;
  substitution?: MedicationRequestSubstitution;
  priorPrescription?: Reference;
  detectedIssue?: Reference[];
  eventHistory?: Reference[];
}

export interface Dosage {
  sequence?: number;
  text?: string;
  additionalInstruction?: CodeableConcept[];
  patientInstruction?: string;
  timing?: Timing;
  asNeeded?: boolean | CodeableConcept;
  site?: CodeableConcept;
  route?: CodeableConcept;
  method?: CodeableConcept;
  doseAndRate?: DoseAndRate[];
  maxDosePerPeriod?: Ratio;
  maxDosePerAdministration?: Quantity;
  maxDosePerLifetime?: Quantity;
}

export interface Timing {
  event?: string[];
  repeat?: TimingRepeat;
  code?: CodeableConcept;
}

export interface TimingRepeat {
  bounds?: Period | Range | { boundsDuration: Quantity };
  count?: number;
  countMax?: number;
  duration?: number;
  durationMax?: number;
  durationUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
  frequency?: number;
  frequencyMax?: number;
  period?: number;
  periodMax?: number;
  periodUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
  dayOfWeek?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  timeOfDay?: string[];
  when?: string[];
  offset?: number;
}

export interface DoseAndRate {
  type?: CodeableConcept;
  dose?: Range | Quantity;
  rate?: Ratio | Range | Quantity;
}

export interface MedicationRequestDispenseRequest {
  initialFill?: {
    quantity?: Quantity;
    duration?: Quantity;
  };
  dispenseInterval?: Quantity;
  validityPeriod?: Period;
  numberOfRepeatsAllowed?: number;
  quantity?: Quantity;
  expectedSupplyDuration?: Quantity;
  performer?: Reference;
}

export interface MedicationRequestSubstitution {
  allowed: boolean | CodeableConcept;
  reason?: CodeableConcept;
}

// Condition Resource
export interface FHIRCondition extends FHIRResource {
  resourceType: 'Condition';
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onset?: string | { onsetAge: Quantity } | Period | Range;
  abatement?: string | { abatementAge: Quantity } | boolean | Period | Range;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  stage?: ConditionStage[];
  evidence?: ConditionEvidence[];
  note?: Annotation[];
}

export interface ConditionStage {
  summary?: CodeableConcept;
  assessment?: Reference[];
  type?: CodeableConcept;
}

export interface ConditionEvidence {
  code?: CodeableConcept[];
  detail?: Reference[];
}

// AllergyIntolerance Resource
export interface FHIRAllergyIntolerance extends FHIRResource {
  resourceType: 'AllergyIntolerance';
  identifier?: Identifier[];
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: 'allergy' | 'intolerance';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  criticality?: 'low' | 'high' | 'unable-to-assess';
  code?: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  onset?: string | { onsetAge: Quantity } | Period | Range;
  recordedDate?: string;
  recorder?: Reference;
  asserter?: Reference;
  lastOccurrence?: string;
  note?: Annotation[];
  reaction?: AllergyIntoleranceReaction[];
}

export interface AllergyIntoleranceReaction {
  substance?: CodeableConcept;
  manifestation: CodeableConcept[];
  description?: string;
  onset?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  exposureRoute?: CodeableConcept;
  note?: Annotation[];
}

// Bundle Resource (for search results)
export interface FHIRBundle extends FHIRResource {
  resourceType: 'Bundle';
  identifier?: Identifier;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry[];
  signature?: Signature;
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry {
  link?: BundleLink[];
  fullUrl?: string;
  resource?: FHIRResource;
  search?: BundleEntrySearch;
  request?: BundleEntryRequest;
  response?: BundleEntryResponse;
}

export interface BundleEntrySearch {
  mode?: 'match' | 'include' | 'outcome';
  score?: number;
}

export interface BundleEntryRequest {
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  ifNoneMatch?: string;
  ifModifiedSince?: string;
  ifMatch?: string;
  ifNoneExist?: string;
}

export interface BundleEntryResponse {
  status: string;
  location?: string;
  etag?: string;
  lastModified?: string;
  outcome?: FHIRResource;
}

export interface Signature {
  type: Coding[];
  when: string;
  who: Reference;
  onBehalfOf?: Reference;
  targetFormat?: string;
  sigFormat?: string;
  data?: string;
}

// Common Epic-specific extensions and value sets
export interface EpicExtension {
  url: string;
  value?: any;
}

export interface EpicPatientExtensions {
  raceExtension?: EpicExtension;
  ethnicityExtension?: EpicExtension;
  birthSexExtension?: EpicExtension;
  recordStatusExtension?: EpicExtension;
}

// Epic API Response wrapper
export interface EpicAPIResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timestamp: Date;
  requestId?: string;
}

// Epic API Error
export interface EpicAPIError {
  error: string;
  error_description?: string;
  error_uri?: string;
  status?: number;
  timestamp: Date;
  requestId?: string;
}

// Epic SMART on FHIR Context
export interface EpicSMARTContext {
  patient?: string;
  encounter?: string;
  location?: string;
  practitioner?: string;
  organization?: string;
  tenant?: string;
  'fhirServiceBaseUrl'?: string;
  'need_patient_banner'?: boolean;
  'smart_style_url'?: string;
}

// Epic Search Parameters
export interface EpicSearchParams {
  _id?: string;
  _lastUpdated?: string;
  _count?: number;
  _skip?: number;
  _sort?: string;
  _include?: string;
  _revinclude?: string;
  patient?: string;
  date?: string;
  category?: string;
  code?: string;
  status?: string;
  [key: string]: string | number | undefined;
}

// Export types for runtime checking if needed
export const EpicFHIRTypes = {
  RESOURCE_TYPES: {
    PATIENT: 'Patient',
    OBSERVATION: 'Observation',
    MEDICATION_REQUEST: 'MedicationRequest',
    CONDITION: 'Condition',
    ALLERGY_INTOLERANCE: 'AllergyIntolerance',
    BUNDLE: 'Bundle'
  },
  ENVIRONMENTS: ['sandbox', 'production', 'development'] as const,
  FHIR_VERSIONS: ['R4', 'STU3', 'DSTU2'] as const
} as const;