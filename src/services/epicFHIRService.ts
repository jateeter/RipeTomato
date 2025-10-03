/**
 * Epic FHIR Service
 * 
 * Service for interacting with Epic's FHIR R4 API to access patient health data
 * including observations, medications, conditions, and allergies.
 * 
 * @license MIT
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  EpicFHIRConfig, 
  EpicOAuthToken, 
  EpicAPIResponse, 
  EpicAPIError,
  FHIRBundle,
  FHIRPatient,
  FHIRObservation,
  FHIRMedicationRequest,
  FHIRCondition,
  FHIRAllergyIntolerance,
  EpicSearchParams,
  EpicSMARTContext
} from '../types/EpicFHIR';
import { HealthMetrics } from '../types/Health';

interface EpicConnectionStatus {
  isConnected: boolean;
  lastSync?: Date;
  patientId?: string;
  accessToken?: string;
  expiresAt?: Date;
  error?: string;
}

export class EpicFHIRService {
  private config: EpicFHIRConfig;
  private httpClient: AxiosInstance;
  private accessToken: EpicOAuthToken | null = null;
  private connectionStatus: EpicConnectionStatus = { isConnected: false };
  private smartContext: EpicSMARTContext | null = null;

  constructor(config: EpicFHIRConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
        // Removed User-Agent as it's a restricted browser header
      }
    });

    this.setupInterceptors();
    console.log('🏥 Epic FHIR Service initialized');
  }

  /**
   * Setup HTTP interceptors for authentication and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor for adding auth token
    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.accessToken?.access_token) {
          config.headers.Authorization = `Bearer ${this.accessToken.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.accessToken?.refresh_token) {
          try {
            await this.refreshAccessToken();
            // Retry the original request
            return this.httpClient(error.config);
          } catch (refreshError) {
            this.connectionStatus = { isConnected: false, error: 'Token refresh failed' };
            throw refreshError;
          }
        }
        throw error;
      }
    );
  }

  /**
   * Initialize SMART on FHIR authentication flow
   */
  async initializeSMARTAuth(launchContext?: EpicSMARTContext): Promise<string> {
    try {
      if (launchContext) {
        this.smartContext = launchContext;
      }

      // Build authorization URL
      const authUrl = new URL(`${this.config.baseUrl}/oauth2/authorize`);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', this.config.clientId);
      authUrl.searchParams.append('redirect_uri', this.config.redirectUri || window.location.origin);
      authUrl.searchParams.append('scope', this.config.scopes.join(' '));
      authUrl.searchParams.append('state', this.generateState());
      authUrl.searchParams.append('aud', this.config.baseUrl);

      console.log('🔐 Initiating SMART on FHIR auth flow');
      return authUrl.toString();
    } catch (error) {
      console.error('Failed to initialize SMART auth:', error);
      throw new Error('SMART authentication initialization failed');
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<EpicOAuthToken> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth2/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri || window.location.origin
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = {
        ...response.data,
        issued_at: Date.now()
      };

      this.connectionStatus = {
        isConnected: true,
        lastSync: new Date(),
        patientId: this.accessToken?.patient,
        accessToken: this.accessToken?.access_token,
        expiresAt: new Date(Date.now() + ((this.accessToken?.expires_in || 0) * 1000))
      };

      console.log('✅ Successfully obtained Epic access token');
      return this.accessToken!;
    } catch (error: any) {
      const epicError: EpicAPIError = {
        error: error.response?.data?.error || 'token_exchange_failed',
        error_description: error.response?.data?.error_description || error.message,
        status: error.response?.status,
        timestamp: new Date()
      };
      
      this.connectionStatus = { isConnected: false, error: epicError.error };
      throw epicError;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<EpicOAuthToken> {
    if (!this.accessToken?.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${this.config.baseUrl}/oauth2/token`, {
        grant_type: 'refresh_token',
        refresh_token: this.accessToken.refresh_token,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = {
        ...this.accessToken,
        ...response.data,
        issued_at: Date.now()
      };

      console.log('🔄 Successfully refreshed Epic access token');
      return this.accessToken!;
    } catch (error: any) {
      console.error('Failed to refresh Epic token:', error);
      throw error;
    }
  }

  /**
   * Get patient information
   */
  async getPatient(patientId: string): Promise<EpicAPIResponse<FHIRPatient>> {
    try {
      const response: AxiosResponse<FHIRPatient> = await this.httpClient.get(`/Patient/${patientId}`);
      
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Search for observations (vital signs, lab results, etc.)
   */
  async searchObservations(params: EpicSearchParams): Promise<EpicAPIResponse<FHIRBundle>> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });

      const response: AxiosResponse<FHIRBundle> = await this.httpClient.get(
        `/Observation?${searchParams.toString()}`
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to search observations:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get patient's vital signs
   */
  async getVitalSigns(patientId: string, dateRange?: { start: Date; end: Date }): Promise<FHIRObservation[]> {
    const params: EpicSearchParams = {
      patient: patientId,
      category: 'vital-signs',
      _sort: '-date',
      _count: 100
    };

    if (dateRange) {
      params.date = `ge${dateRange.start.toISOString()}&date=le${dateRange.end.toISOString()}`;
    }

    const response = await this.searchObservations(params);
    return this.extractResourcesFromBundle<FHIRObservation>(response.data, 'Observation');
  }

  /**
   * Get patient's medications
   */
  async getMedications(patientId: string): Promise<FHIRMedicationRequest[]> {
    try {
      const response: AxiosResponse<FHIRBundle> = await this.httpClient.get(
        `/MedicationRequest?patient=${patientId}&status=active&_sort=-_lastUpdated&_count=50`
      );

      return this.extractResourcesFromBundle<FHIRMedicationRequest>(response.data, 'MedicationRequest');
    } catch (error) {
      console.error('Failed to fetch medications:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get patient's conditions
   */
  async getConditions(patientId: string): Promise<FHIRCondition[]> {
    try {
      const response: AxiosResponse<FHIRBundle> = await this.httpClient.get(
        `/Condition?patient=${patientId}&clinical-status=active&_sort=-_lastUpdated&_count=50`
      );

      return this.extractResourcesFromBundle<FHIRCondition>(response.data, 'Condition');
    } catch (error) {
      console.error('Failed to fetch conditions:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Get patient's allergies
   */
  async getAllergies(patientId: string): Promise<FHIRAllergyIntolerance[]> {
    try {
      const response: AxiosResponse<FHIRBundle> = await this.httpClient.get(
        `/AllergyIntolerance?patient=${patientId}&clinical-status=active&_sort=-_lastUpdated&_count=50`
      );

      return this.extractResourcesFromBundle<FHIRAllergyIntolerance>(response.data, 'AllergyIntolerance');
    } catch (error) {
      console.error('Failed to fetch allergies:', error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Convert Epic FHIR data to standardized HealthMetrics format
   */
  async convertToHealthMetrics(patientId: string): Promise<HealthMetrics[]> {
    try {
      const [patient, vitals, medications, conditions, allergies] = await Promise.all([
        this.getPatient(patientId),
        this.getVitalSigns(patientId),
        this.getMedications(patientId),
        this.getConditions(patientId),
        this.getAllergies(patientId)
      ]);

      // Group observations by date
      const metricsMap = new Map<string, Partial<HealthMetrics>>();
      
      vitals.forEach(obs => {
        const date = this.extractObservationDate(obs);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!metricsMap.has(dateKey)) {
          metricsMap.set(dateKey, {
            id: `epic_${patientId}_${dateKey}`,
            clientId: patientId,
            timestamp: date,
            dataSource: 'epic_fhir',
            syncedAt: new Date()
          });
        }

        const metric = metricsMap.get(dateKey)!;
        this.mapObservationToMetric(obs, metric);
      });

      // Convert to array and add additional data
      const healthMetrics: HealthMetrics[] = Array.from(metricsMap.values()).map(metric => ({
        ...metric,
        currentMedications: this.extractMedicationNames(medications),
        chronicConditions: this.extractConditionNames(conditions),
        allergies: this.extractAllergyNames(allergies),
        hasEmergencyCondition: this.checkForEmergencyConditions(conditions)
      } as HealthMetrics));

      return healthMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to convert Epic data to HealthMetrics:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): EpicConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if service is connected and authenticated
   */
  isConnected(): boolean {
    if (!this.connectionStatus.isConnected || !this.accessToken) {
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    const expiresAt = this.accessToken.issued_at + (this.accessToken.expires_in * 1000);
    
    if (now >= expiresAt && !this.accessToken.refresh_token) {
      this.connectionStatus.isConnected = false;
      return false;
    }

    return true;
  }

  /**
   * Disconnect and clear authentication
   */
  disconnect(): void {
    this.accessToken = null;
    this.connectionStatus = { isConnected: false };
    this.smartContext = null;
    console.log('🔌 Disconnected from Epic FHIR service');
  }

  // Private helper methods

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private extractResourcesFromBundle<T>(bundle: FHIRBundle, resourceType: string): T[] {
    if (!bundle.entry) return [];
    
    return bundle.entry
      .filter(entry => entry.resource?.resourceType === resourceType)
      .map(entry => entry.resource as T);
  }

  private extractObservationDate(obs: FHIRObservation): Date {
    if (typeof obs.effective === 'string') {
      return new Date(obs.effective);
    } else if (obs.effective && 'start' in obs.effective) {
      return new Date(obs.effective.start!);
    }
    return obs.issued ? new Date(obs.issued) : new Date();
  }

  private mapObservationToMetric(obs: FHIRObservation, metric: Partial<HealthMetrics>): void {
    const code = obs.code.coding?.[0]?.code;
    const value = this.extractObservationValue(obs);

    if (!value) return;

    switch (code) {
      case '8867-4': // Heart rate
        metric.heartRate = Math.round(value);
        break;
      case '8480-6': // Systolic BP
        if (!metric.bloodPressure) metric.bloodPressure = { systolic: 0, diastolic: 0 };
        metric.bloodPressure.systolic = Math.round(value);
        break;
      case '8462-4': // Diastolic BP
        if (!metric.bloodPressure) metric.bloodPressure = { systolic: 0, diastolic: 0 };
        metric.bloodPressure.diastolic = Math.round(value);
        break;
      case '8310-5': // Body temperature
        metric.temperature = value;
        break;
      case '2708-6': // Oxygen saturation
        metric.oxygenSaturation = Math.round(value);
        break;
      case '9279-1': // Respiratory rate
        metric.respiratoryRate = Math.round(value);
        break;
      case '29463-7': // Body weight
        metric.weight = value;
        break;
      case '8302-2': // Body height
        metric.height = value;
        break;
    }
  }

  private extractObservationValue(obs: FHIRObservation): number | null {
    if (!obs.value) return null;
    
    if ('valueQuantity' in obs.value) {
      return obs.value.valueQuantity.value || null;
    } else if ('valueInteger' in obs.value) {
      return obs.value.valueInteger;
    }
    
    return null;
  }

  private extractMedicationNames(medications: FHIRMedicationRequest[]): string[] {
    return medications
      .map(med => {
        if ('coding' in med.medication) {
          return med.medication.coding?.[0]?.display || med.medication.text;
        }
        return null;
      })
      .filter((name): name is string => name !== null);
  }

  private extractConditionNames(conditions: FHIRCondition[]): string[] {
    return conditions
      .map(condition => condition.code?.coding?.[0]?.display || condition.code?.text)
      .filter((name): name is string => name !== null && name !== undefined);
  }

  private extractAllergyNames(allergies: FHIRAllergyIntolerance[]): string[] {
    return allergies
      .map(allergy => allergy.code?.coding?.[0]?.display || allergy.code?.text)
      .filter((name): name is string => name !== null && name !== undefined);
  }

  private checkForEmergencyConditions(conditions: FHIRCondition[]): boolean {
    const emergencyKeywords = ['emergency', 'acute', 'severe', 'critical', 'urgent'];
    
    return conditions.some(condition => {
      const text = (condition.code?.text || '').toLowerCase();
      const display = (condition.code?.coding?.[0]?.display || '').toLowerCase();
      
      return emergencyKeywords.some(keyword => 
        text.includes(keyword) || display.includes(keyword)
      );
    });
  }

  private handleAPIError(error: any): EpicAPIError {
    const epicError: EpicAPIError = {
      error: error.response?.data?.issue?.[0]?.code || error.response?.data?.error || 'api_error',
      error_description: error.response?.data?.issue?.[0]?.diagnostics || error.message,
      status: error.response?.status,
      timestamp: new Date(),
      requestId: error.response?.headers?.['x-request-id']
    };

    return epicError;
  }
}

export default EpicFHIRService;