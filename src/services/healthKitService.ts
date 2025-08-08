import { v4 as uuidv4 } from 'uuid';
import { format, subDays, isAfter, isBefore } from 'date-fns';
import { 
  HealthMetrics, 
  HealthAlert, 
  HealthKitData, 
  ClientHealthProfile,
  HealthDataSyncStatus,
  HealthBasedBedCriteria
} from '../types/Health';

class HealthKitService {
  private isSupported: boolean = false;
  private permissions: string[] = [];
  private syncInProgress: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if HealthKit is supported on this platform
   */
  private checkSupport(): void {
    // In a real iOS app, this would check for HealthKit availability
    // For web/React, we simulate this based on user agent
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    this.isSupported = isIOS && isSafari;
    console.log(`HealthKit supported: ${this.isSupported}`);
  }

  /**
   * Request permissions for HealthKit data types
   */
  async requestPermissions(permissions: string[] = []): Promise<boolean> {
    try {
      const defaultPermissions = [
        'HKQuantityTypeIdentifierHeartRate',
        'HKQuantityTypeIdentifierBloodPressureSystolic',
        'HKQuantityTypeIdentifierBloodPressureDiastolic',
        'HKQuantityTypeIdentifierBodyTemperature',
        'HKQuantityTypeIdentifierOxygenSaturation',
        'HKQuantityTypeIdentifierRespiratoryRate',
        'HKQuantityTypeIdentifierBodyMass',
        'HKQuantityTypeIdentifierHeight',
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierDistanceWalkingRunning',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKCategoryTypeIdentifierSleepAnalysis',
        'HKQuantityTypeIdentifierAppleExerciseTime'
      ];

      const requestedPermissions = permissions.length > 0 ? permissions : defaultPermissions;
      
      if (this.isSupported) {
        // In a real implementation, this would use the HealthKit API
        // For now, simulate permission request
        console.log('Requesting HealthKit permissions:', requestedPermissions);
        
        // Simulate permission dialog and approval
        const granted = await this.simulatePermissionDialog();
        
        if (granted) {
          this.permissions = requestedPermissions;
          return true;
        }
      } else {
        // For non-iOS platforms, we'll use mock data
        console.log('HealthKit not supported, using mock data');
        this.permissions = requestedPermissions;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request HealthKit permissions:', error);
      return false;
    }
  }

  /**
   * Simulate permission dialog for demo purposes
   */
  private async simulatePermissionDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      const granted = window.confirm(
        'This app would like to access your health data from Apple Health to help match you with appropriate shelter accommodations.\n\n' +
        'Data types: Heart rate, blood pressure, weight, activity, sleep data\n\n' +
        'Allow access?'
      );
      setTimeout(() => resolve(granted), 1000);
    });
  }

  /**
   * Sync health data from HealthKit
   */
  async syncHealthData(clientId: string): Promise<HealthMetrics[]> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;

    try {
      if (this.isSupported && this.permissions.length > 0) {
        return await this.fetchRealHealthData(clientId);
      } else {
        // Use mock data for demo/development
        return await this.generateMockHealthData(clientId);
      }
    } catch (error) {
      console.error('Health data sync failed:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Fetch real health data from HealthKit (iOS only)
   */
  private async fetchRealHealthData(clientId: string): Promise<HealthMetrics[]> {
    // In a real iOS app, this would use HealthKit queries
    console.log('Fetching real HealthKit data for client:', clientId);
    
    // Simulate HealthKit data fetching
    const mockData = await this.generateMockHealthData(clientId);
    return mockData;
  }

  /**
   * Generate realistic mock health data for development/demo
   */
  private async generateMockHealthData(clientId: string): Promise<HealthMetrics[]> {
    const metrics: HealthMetrics[] = [];
    const now = new Date();
    
    // Generate data for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = subDays(now, i);
      
      const metric: HealthMetrics = {
        id: uuidv4(),
        clientId,
        timestamp: date,
        
        // Vital Signs (simulate some variation)
        heartRate: 70 + Math.floor(Math.random() * 30), // 70-100 bpm
        bloodPressure: {
          systolic: 110 + Math.floor(Math.random() * 30), // 110-140
          diastolic: 70 + Math.floor(Math.random() * 20)  // 70-90
        },
        temperature: 97 + Math.random() * 2, // 97-99°F
        oxygenSaturation: 95 + Math.floor(Math.random() * 5), // 95-100%
        respiratoryRate: 12 + Math.floor(Math.random() * 8), // 12-20/min
        
        // Physical Measurements
        weight: 150 + Math.floor(Math.random() * 100), // 150-250 lbs
        height: 65 + Math.floor(Math.random() * 10), // 65-75 inches
        
        // Activity Data
        stepCount: Math.floor(Math.random() * 15000), // 0-15000 steps
        distanceWalked: Math.random() * 10, // 0-10 miles
        activeEnergyBurned: Math.floor(Math.random() * 2000), // 0-2000 calories
        exerciseMinutes: Math.floor(Math.random() * 120), // 0-120 minutes
        
        // Sleep Data
        sleepHours: 4 + Math.random() * 6, // 4-10 hours
        sleepQuality: ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)] as any,
        
        // Mental Health (often challenging for homeless individuals)
        stressLevel: 3 + Math.floor(Math.random() * 7), // 3-10 (higher stress)
        moodScore: 2 + Math.floor(Math.random() * 6), // 2-8 (lower mood)
        anxietyLevel: 2 + Math.floor(Math.random() * 8), // 2-10 (higher anxiety)
        
        // Medical Conditions (common in homeless population)
        chronicConditions: this.generateChronicConditions(),
        currentMedications: this.generateMedications(),
        allergies: this.generateAllergies(),
        
        // Emergency status
        hasEmergencyCondition: Math.random() < 0.05, // 5% chance
        
        dataSource: 'healthkit',
        syncedAt: new Date()
      };

      // Calculate BMI if height and weight available
      if (metric.height && metric.weight) {
        const heightInMeters = metric.height * 0.0254;
        const weightInKg = metric.weight * 0.453592;
        metric.bmi = weightInKg / (heightInMeters * heightInMeters);
      }

      metrics.push(metric);
    }

    return metrics;
  }

  /**
   * Generate realistic chronic conditions for homeless population
   */
  private generateChronicConditions(): string[] {
    const conditions = [
      'Diabetes Type 2', 'Hypertension', 'Depression', 'Anxiety Disorder',
      'Chronic Back Pain', 'Arthritis', 'Substance Use Disorder', 'COPD',
      'Heart Disease', 'Hepatitis C', 'HIV', 'Tuberculosis', 'Asthma'
    ];
    
    const numConditions = Math.floor(Math.random() * 4); // 0-3 conditions
    const selected: string[] = [];
    
    for (let i = 0; i < numConditions; i++) {
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      if (!selected.includes(condition)) {
        selected.push(condition);
      }
    }
    
    return selected;
  }

  /**
   * Generate realistic medications
   */
  private generateMedications(): string[] {
    const medications = [
      'Metformin', 'Lisinopril', 'Sertraline', 'Ibuprofen', 'Gabapentin',
      'Hydrocodone', 'Albuterol', 'Furosemide', 'Insulin', 'Warfarin'
    ];
    
    const numMeds = Math.floor(Math.random() * 5); // 0-4 medications
    const selected: string[] = [];
    
    for (let i = 0; i < numMeds; i++) {
      const med = medications[Math.floor(Math.random() * medications.length)];
      if (!selected.includes(med)) {
        selected.push(med);
      }
    }
    
    return selected;
  }

  /**
   * Generate realistic allergies
   */
  private generateAllergies(): string[] {
    const allergies = [
      'Penicillin', 'Sulfa drugs', 'Peanuts', 'Shellfish', 'Latex',
      'Dust mites', 'Pet dander', 'Aspirin', 'Codeine'
    ];
    
    const numAllergies = Math.floor(Math.random() * 3); // 0-2 allergies
    const selected: string[] = [];
    
    for (let i = 0; i < numAllergies; i++) {
      const allergy = allergies[Math.floor(Math.random() * allergies.length)];
      if (!selected.includes(allergy)) {
        selected.push(allergy);
      }
    }
    
    return selected;
  }

  /**
   * Analyze health data and generate health-based bed criteria
   */
  generateBedCriteria(metrics: HealthMetrics[]): HealthBasedBedCriteria {
    if (metrics.length === 0) {
      return {
        requiresmedicalSupervision: false,
        needsAccessibility: false,
        requiresQuietEnvironment: false,
        needsProximityToStaff: false,
        temperatureRegulation: 'standard',
        mobilityAssistance: false,
        medicationReminders: false,
        emergencyMonitoring: false
      };
    }

    const latestMetric = metrics[0]; // Most recent data
    const criteria: HealthBasedBedCriteria = {
      requiresmedicalSupervision: false,
      needsAccessibility: false,
      requiresQuietEnvironment: false,
      needsProximityToStaff: false,
      temperatureRegulation: 'standard',
      mobilityAssistance: false,
      medicationReminders: false,
      emergencyMonitoring: false
    };

    // Analyze vital signs for medical supervision needs
    if (latestMetric.bloodPressure) {
      const { systolic, diastolic } = latestMetric.bloodPressure;
      if (systolic > 140 || diastolic > 90 || systolic < 90) {
        criteria.requiresmedicalSupervision = true;
        criteria.needsProximityToStaff = true;
      }
    }

    if (latestMetric.heartRate && (latestMetric.heartRate > 100 || latestMetric.heartRate < 60)) {
      criteria.requiresmedicalSupervision = true;
      criteria.emergencyMonitoring = true;
    }

    if (latestMetric.oxygenSaturation && latestMetric.oxygenSaturation < 95) {
      criteria.requiresmedicalSupervision = true;
      criteria.emergencyMonitoring = true;
    }

    // Chronic conditions analysis
    const conditions = latestMetric.chronicConditions || [];
    if (conditions.includes('Diabetes Type 2') || conditions.includes('Heart Disease')) {
      criteria.medicationReminders = true;
      criteria.needsProximityToStaff = true;
    }

    if (conditions.includes('COPD') || conditions.includes('Asthma')) {
      criteria.requiresQuietEnvironment = true;
      criteria.emergencyMonitoring = true;
    }

    if (conditions.includes('Chronic Back Pain') || conditions.includes('Arthritis')) {
      criteria.needsAccessibility = true;
      criteria.mobilityAssistance = true;
    }

    // Mental health considerations
    if (latestMetric.stressLevel && latestMetric.stressLevel > 7) {
      criteria.requiresQuietEnvironment = true;
    }

    if (latestMetric.anxietyLevel && latestMetric.anxietyLevel > 7) {
      criteria.requiresQuietEnvironment = true;
      criteria.needsProximityToStaff = true;
    }

    // Medications requiring supervision
    const medications = latestMetric.currentMedications || [];
    if (medications.includes('Insulin') || medications.includes('Warfarin')) {
      criteria.medicationReminders = true;
      criteria.requiresmedicalSupervision = true;
    }

    // Emergency conditions
    if (latestMetric.hasEmergencyCondition) {
      criteria.emergencyMonitoring = true;
      criteria.requiresmedicalSupervision = true;
      criteria.needsProximityToStaff = true;
    }

    return criteria;
  }

  /**
   * Generate health alerts based on metrics
   */
  generateHealthAlerts(clientId: string, metrics: HealthMetrics[]): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    
    if (metrics.length === 0) return alerts;
    
    const latestMetric = metrics[0];

    // Vital signs alerts
    if (latestMetric.bloodPressure) {
      const { systolic, diastolic } = latestMetric.bloodPressure;
      if (systolic > 180 || diastolic > 120) {
        alerts.push({
          id: uuidv4(),
          clientId,
          type: 'critical',
          category: 'vitals',
          title: 'Severe Hypertension',
          description: `Blood pressure ${systolic}/${diastolic} is dangerously high`,
          recommendations: [
            'Seek immediate medical attention',
            'Monitor blood pressure closely',
            'Ensure medication compliance'
          ],
          createdAt: new Date(),
          acknowledged: false
        });
      } else if (systolic > 140 || diastolic > 90) {
        alerts.push({
          id: uuidv4(),
          clientId,
          type: 'warning',
          category: 'vitals',
          title: 'High Blood Pressure',
          description: `Blood pressure ${systolic}/${diastolic} is elevated`,
          recommendations: [
            'Schedule medical check-up',
            'Consider medication review',
            'Monitor daily'
          ],
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    // Heart rate alerts
    if (latestMetric.heartRate) {
      if (latestMetric.heartRate > 120) {
        alerts.push({
          id: uuidv4(),
          clientId,
          type: 'warning',
          category: 'vitals',
          title: 'Elevated Heart Rate',
          description: `Heart rate of ${latestMetric.heartRate} bpm is high`,
          recommendations: ['Rest and monitor', 'Check for fever or stress'],
          createdAt: new Date(),
          acknowledged: false
        });
      }
    }

    // Medication alerts
    const medications = latestMetric.currentMedications || [];
    if (medications.includes('Insulin')) {
      alerts.push({
        id: uuidv4(),
        clientId,
        type: 'info',
        category: 'medication',
        title: 'Insulin Management',
        description: 'Client requires insulin administration',
        recommendations: [
          'Ensure proper storage of insulin',
          'Monitor blood glucose levels',
          'Provide meal timing support'
        ],
        createdAt: new Date(),
        acknowledged: false
      });
    }

    // Emergency condition alert
    if (latestMetric.hasEmergencyCondition) {
      alerts.push({
        id: uuidv4(),
        clientId,
        type: 'critical',
        category: 'emergency',
        title: 'Emergency Health Condition',
        description: latestMetric.emergencyNotes || 'Client has an active emergency health condition',
        recommendations: [
          'Immediate medical evaluation required',
          'Ensure 24/7 monitoring',
          'Have emergency contacts ready'
        ],
        createdAt: new Date(),
        acknowledged: false
      });
    }

    return alerts;
  }

  /**
   * Get sync status
   */
  getSyncStatus(clientId: string): HealthDataSyncStatus {
    return {
      lastSync: new Date(),
      status: this.syncInProgress ? 'syncing' : 'synced',
      recordsCount: 7, // Mock count
      pendingSync: 0
    };
  }

  /**
   * Check if HealthKit is available
   */
  isHealthKitAvailable(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permissions
   */
  getPermissions(): string[] {
    return [...this.permissions];
  }
}

export const healthKitService = new HealthKitService();