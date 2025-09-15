/**
 * Epic FHIR Service Tests
 * 
 * Comprehensive unit tests for Epic FHIR API integration
 * including authentication, data fetching, and error handling.
 * 
 * @license MIT
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { EpicFHIRService } from '../epicFHIRService';
import { EpicFHIRConfig, FHIRBundle, FHIRPatient, FHIRObservation } from '../../types/EpicFHIR';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a proper mock axios instance
const mockAxiosInstance = {
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  defaults: {
    adapter: jest.fn(),
    headers: {}
  }
} as any;

// Add axios properties for MockAdapter
mockAxiosInstance.defaults.adapter = jest.fn();

describe('EpicFHIRService', () => {
  let service: EpicFHIRService;
  let mockAxios: MockAdapter;
  let config: EpicFHIRConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset the mock instance methods
    mockAxiosInstance.get.mockClear();
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.interceptors.request.use.mockClear();
    mockAxiosInstance.interceptors.response.use.mockClear();
    
    // Setup axios.create to return our mock instance
    mockedAxios.create = jest.fn(() => mockAxiosInstance);
    
    // Setup global axios methods for token exchange
    mockedAxios.post = jest.fn();
    
    config = {
      baseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
      scopes: ['patient/Patient.read', 'patient/Observation.read'],
      environment: 'sandbox',
      version: 'R4',
      timeout: 10000,
      retryAttempts: 2
    };

    // Create MockAdapter on the instance
    mockAxios = new MockAdapter(mockAxiosInstance);
    
    // Now create the service after mocking is setup
    service = new EpicFHIRService(config);
  });

  afterEach(() => {
    if (mockAxios) {
      mockAxios.restore();
    }
    jest.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(service).toBeDefined();
      expect(service.getConnectionStatus().isConnected).toBe(false);
    });

    it('should set default timeout and retry attempts', () => {
      const minimalConfig: EpicFHIRConfig = {
        baseUrl: 'https://test.com',
        clientId: 'test',
        scopes: ['patient/Patient.read'],
        environment: 'development',
        version: 'R4'
      };

      const serviceWithDefaults = new EpicFHIRService(minimalConfig);
      expect(serviceWithDefaults).toBeDefined();
    });
  });

  describe('SMART on FHIR Authentication', () => {
    it('should generate correct authorization URL', async () => {
      const authUrl = await service.initializeSMARTAuth();
      
      expect(authUrl).toContain('https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('scope=patient%2FPatient.read');
      expect(authUrl).toContain('patient%2FObservation.read');
      expect(authUrl).toContain('aud=https%3A%2F%2Ffhir.epic.com%2Finterconnect-fhir-oauth');
    });

    it('should include launch context in authorization URL if provided', async () => {
      const launchContext = {
        patient: '12345',
        encounter: '67890'
      };

      const authUrl = await service.initializeSMARTAuth(launchContext);
      expect(authUrl).toContain('response_type=code');
    });

    it('should exchange authorization code for access token', async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'patient/Patient.read',
        patient: '12345'
      };

      // Mock the global axios.post call used in exchangeCodeForToken
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });

      const token = await service.exchangeCodeForToken('auth-code', 'state-123');

      expect(token.access_token).toBe('test-access-token');
      expect(token.patient).toBe('12345');
      expect(service.isConnected()).toBe(true);
    });

    it('should handle token exchange errors', async () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid'
      };

      // Mock axios to reject the promise
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: errorResponse
        }
      });

      await expect(service.exchangeCodeForToken('invalid-code', 'state-123'))
        .rejects.toBeTruthy();
    });

    it('should refresh access token when expired', async () => {
      // First, set up an access token that will expire
      const initialToken = {
        access_token: 'initial-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
        scope: 'patient/Patient.read',
        patient: '12345'
      };

      // Mock initial token exchange
      mockedAxios.post.mockResolvedValueOnce({ data: initialToken });
      await service.exchangeCodeForToken('auth-code', 'state-123');

      // Check that interceptors were set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
      
      // Verify the response interceptor was configured properly
      const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0];
      expect(responseInterceptor).toBeDefined();
      expect(typeof responseInterceptor[1]).toBe('function'); // Error handler
    });
  });

  describe('Patient Data Retrieval', () => {
    beforeEach(async () => {
      // Mock authentication
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');
    });

    it('should fetch patient data', async () => {
      const patientData: FHIRPatient = {
        resourceType: 'Patient',
        id: '12345',
        name: [{
          use: 'official',
          family: 'Doe',
          given: ['John']
        }],
        gender: 'male',
        birthDate: '1990-01-01'
      };

      mockAxiosInstance.get.mockResolvedValue({ data: patientData, status: 200 });

      const response = await service.getPatient('12345');
      
      expect(response.data.resourceType).toBe('Patient');
      expect(response.data.id).toBe('12345');
      expect(response.data.name?.[0]?.family).toBe('Doe');
      expect(response.status).toBe(200);
    });

    it('should handle patient not found errors', async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: {
          status: 404,
          data: {
            resourceType: 'OperationOutcome',
            issue: [{
              severity: 'error',
              code: 'not-found',
              diagnostics: 'Patient not found'
            }]
          }
        }
      });

      await expect(service.getPatient('invalid-id')).rejects.toBeTruthy();
    });
  });

  describe('Observations and Vital Signs', () => {
    beforeEach(async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');
    });

    it('should search for observations', async () => {
      const observationBundle: FHIRBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 2,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-1',
              status: 'final' as const,
              category: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs'
                }]
              }],
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8867-4',
                  display: 'Heart rate'
                }]
              },
              subject: { reference: 'Patient/12345' },
              effective: '2023-01-01T10:00:00Z',
              value: {
                valueQuantity: {
                  value: 72,
                  unit: '/min',
                  system: 'http://unitsofmeasure.org',
                  code: '/min'
                }
              }
            } as FHIRObservation
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: observationBundle, status: 200 });

      const response = await service.searchObservations({
        patient: '12345',
        category: 'vital-signs'
      });

      expect(response.data.resourceType).toBe('Bundle');
      expect(response.data.entry?.length).toBe(1);
      expect(response.data.entry?.[0].resource?.resourceType).toBe('Observation');
    });

    it('should get vital signs for a patient', async () => {
      const vitalSignsBundle: FHIRBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 3,
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'hr-1',
              status: 'final',
              category: [{ coding: [{ code: 'vital-signs' }] }],
              code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] },
              subject: { reference: 'Patient/12345' },
              effectiveDateTime: '2023-01-01T10:00:00Z',
              value: { valueQuantity: { value: 72, unit: '/min' } }
            } as FHIRObservation
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'bp-sys-1',
              status: 'final',
              category: [{ coding: [{ code: 'vital-signs' }] }],
              code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
              subject: { reference: 'Patient/12345' },
              effectiveDateTime: '2023-01-01T10:00:00Z',
              value: { valueQuantity: { value: 120, unit: 'mmHg' } }
            } as FHIRObservation
          }
        ]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: vitalSignsBundle, status: 200 });

      const vitals = await service.getVitalSigns('12345');

      expect(vitals).toHaveLength(2);
      expect(vitals[0].id).toBe('hr-1');
      expect(vitals[1].id).toBe('bp-sys-1');
    });

    it('should handle date range filters for vital signs', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      mockAxiosInstance.get.mockResolvedValue({ 
        data: {
          resourceType: 'Bundle',
          type: 'searchset',
          total: 0,
          entry: []
        },
        status: 200
      });

      await service.getVitalSigns('12345', { start: startDate, end: endDate });

      expect(mockAxiosInstance.get).toHaveBeenCalled();
      const callArgs = mockAxiosInstance.get.mock.calls[0][0];
      expect(callArgs).toContain('date=ge2023-01-01');
      expect(callArgs).toContain('le2023-01-31');
    });
  });

  describe('Medications, Conditions, and Allergies', () => {
    beforeEach(async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');
    });

    it('should fetch patient medications', async () => {
      const medicationsBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [{
          resource: {
            resourceType: 'MedicationRequest',
            id: 'med-1',
            status: 'active',
            intent: 'order',
            medication: {
              coding: [{
                display: 'Lisinopril 10mg'
              }]
            },
            subject: { reference: 'Patient/12345' }
          }
        }]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: medicationsBundle, status: 200 });

      const medications = await service.getMedications('12345');
      expect(medications).toHaveLength(1);
      expect(medications[0].id).toBe('med-1');
    });

    it('should fetch patient conditions', async () => {
      const conditionsBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [{
          resource: {
            resourceType: 'Condition',
            id: 'cond-1',
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: {
              coding: [{
                display: 'Hypertension'
              }]
            },
            subject: { reference: 'Patient/12345' }
          }
        }]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: conditionsBundle, status: 200 });

      const conditions = await service.getConditions('12345');
      expect(conditions).toHaveLength(1);
      expect(conditions[0].id).toBe('cond-1');
    });

    it('should fetch patient allergies', async () => {
      const allergiesBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [{
          resource: {
            resourceType: 'AllergyIntolerance',
            id: 'allergy-1',
            clinicalStatus: { coding: [{ code: 'active' }] },
            code: {
              coding: [{
                display: 'Penicillin'
              }]
            },
            patient: { reference: 'Patient/12345' }
          }
        }]
      };

      mockAxiosInstance.get.mockResolvedValue({ data: allergiesBundle, status: 200 });

      const allergies = await service.getAllergies('12345');
      expect(allergies).toHaveLength(1);
      expect(allergies[0].id).toBe('allergy-1');
    });
  });

  describe('Data Conversion to HealthMetrics', () => {
    beforeEach(async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');
    });

    it('should convert FHIR data to HealthMetrics format', async () => {
      // Mock all the required API calls
      const patientData = {
        resourceType: 'Patient',
        id: '12345',
        name: [{ family: 'Doe', given: ['John'] }]
      };

      const vitalsBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{
          resource: {
            resourceType: 'Observation',
            id: 'hr-1',
            status: 'final',
            code: { coding: [{ code: '8867-4' }] },
            effectiveDateTime: '2023-01-01T10:00:00Z',
            value: { valueQuantity: { value: 72 } }
          }
        }]
      };

      const medicationsBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{
          resource: {
            resourceType: 'MedicationRequest',
            id: 'med-1',
            medication: {
              coding: [{ display: 'Lisinopril 10mg' }]
            }
          }
        }]
      };

      const conditionsBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [{
          resource: {
            resourceType: 'Condition',
            id: 'cond-1',
            code: {
              coding: [{ display: 'Hypertension' }]
            }
          }
        }]
      };

      const allergiesBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: []
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: patientData, status: 200 })
        .mockResolvedValueOnce({ data: vitalsBundle, status: 200 })
        .mockResolvedValueOnce({ data: medicationsBundle, status: 200 })
        .mockResolvedValueOnce({ data: conditionsBundle, status: 200 })
        .mockResolvedValueOnce({ data: allergiesBundle, status: 200 });

      const healthMetrics = await service.convertToHealthMetrics('12345');

      expect(healthMetrics).toBeDefined();
      expect(healthMetrics.length).toBeGreaterThan(0);
      expect(healthMetrics[0].clientId).toBe('12345');
      expect(healthMetrics[0].dataSource).toBe('epic_fhir');
      expect(healthMetrics[0].heartRate).toBe(72);
      expect(healthMetrics[0].currentMedications).toContain('Lisinopril 10mg');
      expect(healthMetrics[0].chronicConditions).toContain('Hypertension');
    });

    it('should handle empty FHIR bundles gracefully', async () => {
      const emptyBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 0,
        entry: []
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { resourceType: 'Patient', id: '12345' }, status: 200 })
        .mockResolvedValue({ data: emptyBundle, status: 200 });

      const healthMetrics = await service.convertToHealthMetrics('12345');
      expect(healthMetrics).toBeDefined();
      expect(Array.isArray(healthMetrics)).toBe(true);
    });
  });

  describe('Connection Status and Error Handling', () => {
    it('should return correct connection status when not connected', () => {
      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(false);
      expect(status.patientId).toBeUndefined();
    });

    it('should return correct connection status when connected', async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');

      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(true);
      expect(status.patientId).toBe('12345');
      expect(status.accessToken).toBe('test-access-token');
    });

    it('should handle network errors gracefully', async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');

      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'));

      await expect(service.getPatient('12345')).rejects.toBeTruthy();
    });

    it('should disconnect and clear authentication', () => {
      service.disconnect();
      
      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(false);
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('FHIR Observation Value Extraction', () => {
    beforeEach(async () => {
      const tokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        patient: '12345'
      };
      mockedAxios.post.mockResolvedValue({ data: tokenResponse });
      await service.exchangeCodeForToken('auth-code', 'state-123');
    });

    it('should extract blood pressure values correctly', async () => {
      const bpBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'bp-sys',
              status: 'final',
              code: { coding: [{ code: '8480-6' }] },
              effectiveDateTime: '2023-01-01T10:00:00Z',
              value: { valueQuantity: { value: 120 } }
            }
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'bp-dia',
              status: 'final',
              code: { coding: [{ code: '8462-4' }] },
              effectiveDateTime: '2023-01-01T10:00:00Z',
              value: { valueQuantity: { value: 80 } }
            }
          }
        ]
      };

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { resourceType: 'Patient', id: '12345' }, status: 200 })
        .mockResolvedValueOnce({ data: bpBundle, status: 200 })
        .mockResolvedValueOnce({ data: { resourceType: 'Bundle', entry: [] }, status: 200 })
        .mockResolvedValueOnce({ data: { resourceType: 'Bundle', entry: [] }, status: 200 })
        .mockResolvedValueOnce({ data: { resourceType: 'Bundle', entry: [] }, status: 200 });

      const healthMetrics = await service.convertToHealthMetrics('12345');
      
      expect(healthMetrics[0].bloodPressure).toEqual({
        systolic: 120,
        diastolic: 80
      });
    });
  });
});