/**
 * Community Configuration Service
 * 
 * Manages community-specific settings, locations, and service configurations
 * for the Community Services Hub, allowing customization for different communities.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  CommunityConfiguration,
  CommunityLocation,
  CommunityServiceConfig,
  ContactInformation,
  OperatingHours,
  EmergencyProtocol,
  AccessibilityFeature,
  StaffingConfig,
  ResourceConfig,
  CommunityServiceType,
  COMMUNITY_SERVICE_TYPES
} from '../types/CommunityServices';

interface ConfigurationTemplate {
  templateId: string;
  templateName: string;
  description: string;
  targetPopulation: string;
  recommendedServices: CommunityServiceType[];
  configuration: Partial<CommunityConfiguration>;
}

interface CommunityProfile {
  profileId: string;
  communityName: string;
  population: number;
  demographics: {
    primaryLanguages: string[];
    ageGroups: { group: string; percentage: number }[];
    specialNeeds: string[];
  };
  economicProfile: {
    unemploymentRate: number;
    povertyRate: number;
    medianIncome: number;
    housingChallenges: string[];
  };
  geographicInfo: {
    region: string;
    climate: string;
    ruralUrban: 'rural' | 'urban' | 'suburban';
    transportationAccess: 'limited' | 'moderate' | 'good' | 'excellent';
  };
}

class CommunityConfigurationService {
  private configurations: Map<string, CommunityConfiguration> = new Map();
  private templates: ConfigurationTemplate[] = [];
  private profiles: Map<string, CommunityProfile> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeDefaultConfiguration();
    console.log('🏘️ Community Configuration Service initialized');
  }

  /**
   * Initialize configuration templates for different community types
   */
  private initializeTemplates(): void {
    const urbanTemplate: ConfigurationTemplate = {
      templateId: uuidv4(),
      templateName: 'Urban Community Hub',
      description: 'Configuration optimized for urban areas with high population density',
      targetPopulation: 'Urban communities with diverse populations',
      recommendedServices: ['shelter', 'food_water', 'sanitation', 'transportation'],
      configuration: {
        communityName: 'Urban Community Services Hub',
        operatingHours: {
          timezone: 'America/New_York',
          schedule: {
            monday: { isOpen: true, openTime: '06:00', closeTime: '23:00', breaks: [] },
            tuesday: { isOpen: true, openTime: '06:00', closeTime: '23:00', breaks: [] },
            wednesday: { isOpen: true, openTime: '06:00', closeTime: '23:00', breaks: [] },
            thursday: { isOpen: true, openTime: '06:00', closeTime: '23:00', breaks: [] },
            friday: { isOpen: true, openTime: '06:00', closeTime: '23:00', breaks: [] },
            saturday: { isOpen: true, openTime: '07:00', closeTime: '22:00', breaks: [] },
            sunday: { isOpen: true, openTime: '08:00', closeTime: '21:00', breaks: [] }
          },
          holidays: [],
          emergencyAvailability: true
        }
      }
    };

    const ruralTemplate: ConfigurationTemplate = {
      templateId: uuidv4(),
      templateName: 'Rural Community Hub',
      description: 'Configuration optimized for rural areas with transportation challenges',
      targetPopulation: 'Rural communities with limited transportation',
      recommendedServices: ['shelter', 'food_water', 'transportation'],
      configuration: {
        communityName: 'Rural Community Services Hub',
        operatingHours: {
          timezone: 'America/Chicago',
          schedule: {
            monday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
            tuesday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
            wednesday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
            thursday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
            friday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
            saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00', breaks: [] },
            sunday: { isOpen: false, breaks: [] }
          },
          holidays: [],
          emergencyAvailability: true
        }
      }
    };

    const mobileCrisisTemplate: ConfigurationTemplate = {
      templateId: uuidv4(),
      templateName: 'Mobile Crisis Response',
      description: 'Mobile configuration for disaster response and temporary services',
      targetPopulation: 'Communities affected by natural disasters or emergencies',
      recommendedServices: ['shelter', 'food_water', 'sanitation'],
      configuration: {
        communityName: 'Mobile Crisis Response Hub',
        operatingHours: {
          timezone: 'America/Denver',
          schedule: {
            monday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] },
            tuesday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] },
            wednesday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] },
            thursday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] },
            friday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] },
            saturday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] },
            sunday: { isOpen: true, openTime: '24:00', closeTime: '24:00', breaks: [] }
          },
          holidays: [],
          emergencyAvailability: true
        }
      }
    };

    this.templates = [urbanTemplate, ruralTemplate, mobileCrisisTemplate];
  }

  /**
   * Initialize default configuration for Idaho Community Services Hub
   */
  private initializeDefaultConfiguration(): void {
    const defaultConfig: CommunityConfiguration = {
      communityName: 'Idaho Community Services Hub',
      locations: [
        {
          locationId: uuidv4(),
          name: 'Main Community Center',
          address: {
            street: '123 Community Way',
            city: 'Boise',
            state: 'Idaho',
            zipCode: '83702',
            coordinates: {
              latitude: 43.6150,
              longitude: -116.2023
            }
          },
          serviceTypes: ['shelter', 'food_water', 'sanitation', 'transportation'],
          capacity: {
            shelter: 150,
            food_water: 300,
            sanitation: 50,
            transportation: 100
          },
          accessibility: [
            { feature: 'wheelchair_accessible', available: true },
            { feature: 'hearing_loop', available: true },
            { feature: 'multilingual_staff', available: true }
          ],
          contactInfo: {
            phone: '(208) 555-0123',
            email: 'main@idahocommunityservices.org',
            emergencyPhone: '(208) 555-0911',
            languages: ['English', 'Spanish']
          }
        },
        {
          locationId: uuidv4(),
          name: 'West Side Outreach Center',
          address: {
            street: '456 Outreach Drive',
            city: 'Boise',
            state: 'Idaho',
            zipCode: '83704',
            coordinates: {
              latitude: 43.6140,
              longitude: -116.2180
            }
          },
          serviceTypes: ['food_water', 'sanitation'],
          capacity: {
            shelter: 0,
            food_water: 150,
            sanitation: 25,
            transportation: 0
          },
          accessibility: [
            { feature: 'wheelchair_accessible', available: true },
            { feature: 'multilingual_staff', available: true }
          ],
          contactInfo: {
            phone: '(208) 555-0124',
            email: 'westside@idahocommunityservices.org',
            languages: ['English', 'Spanish']
          }
        }
      ],
      services: this.generateDefaultServiceConfigs(),
      contactInfo: {
        phone: '(208) 555-0100',
        email: 'info@idahocommunityservices.org',
        website: 'https://idahocommunityservices.org',
        emergencyPhone: '(208) 555-0911',
        languages: ['English', 'Spanish']
      },
      operatingHours: {
        timezone: 'America/Boise',
        schedule: {
          monday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          tuesday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          wednesday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          thursday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          friday: { isOpen: true, openTime: '06:00', closeTime: '22:00', breaks: [] },
          saturday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] },
          sunday: { isOpen: true, openTime: '08:00', closeTime: '20:00', breaks: [] }
        },
        holidays: [
          {
            date: '2024-01-01',
            name: 'New Year\'s Day',
            isOpen: false
          },
          {
            date: '2024-07-04',
            name: 'Independence Day',
            isOpen: true,
            specialHours: { openTime: '10:00', closeTime: '16:00' }
          },
          {
            date: '2024-12-25',
            name: 'Christmas Day',
            isOpen: false
          }
        ],
        emergencyAvailability: true
      },
      emergencyProtocols: this.generateDefaultEmergencyProtocols()
    };

    this.configurations.set('default', defaultConfig);

    // Create a community profile for Idaho
    const idahoProfile: CommunityProfile = {
      profileId: uuidv4(),
      communityName: 'Boise, Idaho Community',
      population: 235684,
      demographics: {
        primaryLanguages: ['English', 'Spanish'],
        ageGroups: [
          { group: '18-25', percentage: 15.2 },
          { group: '26-35', percentage: 22.8 },
          { group: '36-45', percentage: 18.5 },
          { group: '46-55', percentage: 16.3 },
          { group: '56-65', percentage: 14.1 },
          { group: '65+', percentage: 13.1 }
        ],
        specialNeeds: ['Mental health support', 'Substance abuse recovery', 'Job training']
      },
      economicProfile: {
        unemploymentRate: 3.2,
        povertyRate: 12.8,
        medianIncome: 58750,
        housingChallenges: ['Affordable housing shortage', 'Rising rent costs']
      },
      geographicInfo: {
        region: 'Pacific Northwest',
        climate: 'Semi-arid',
        ruralUrban: 'urban',
        transportationAccess: 'moderate'
      }
    };

    this.profiles.set('idaho-boise', idahoProfile);
  }

  /**
   * Generate default service configurations
   */
  private generateDefaultServiceConfigs(): CommunityServiceConfig[] {
    return Object.values(COMMUNITY_SERVICE_TYPES).map(serviceType => ({
      serviceType,
      isEnabled: true,
      configuration: this.getDefaultServiceConfiguration(serviceType),
      staffing: this.getDefaultStaffingConfig(serviceType),
      resources: this.getDefaultResourceConfigs(serviceType)
    }));
  }

  /**
   * Get default configuration for a specific service type
   */
  private getDefaultServiceConfiguration(serviceType: CommunityServiceType): Record<string, any> {
    switch (serviceType) {
      case 'shelter':
        return {
          maxOccupancy: 150,
          bedTypes: ['standard', 'accessible', 'family'],
          checkInTime: '19:00',
          checkOutTime: '07:00',
          maxStayDays: 30,
          requiresReservation: false,
          walkInsAccepted: true
        };
      case 'food_water':
        return {
          mealsPerDay: 3,
          servingHours: {
            breakfast: { start: '07:00', end: '09:00' },
            lunch: { start: '12:00', end: '14:00' },
            dinner: { start: '17:00', end: '19:00' }
          },
          dietaryAccommodations: ['vegetarian', 'vegan', 'gluten-free', 'halal'],
          pantryAccess: 'weekly',
          waterDistribution: '24/7'
        };
      case 'sanitation':
        return {
          showerTimeLimit: 30,
          laundryTimeLimit: 120,
          reservationRequired: true,
          hygieneKitsAvailable: true,
          accessibilityFeatures: true
        };
      case 'transportation':
        return {
          serviceRadius: 15, // miles
          scheduleType: 'on-demand',
          wheelchairAccessible: true,
          medicalTransport: true,
          jobInterviewTransport: true,
          maxPassengers: 8
        };
      default:
        return {};
    }
  }

  /**
   * Get default staffing configuration for a service type
   */
  private getDefaultStaffingConfig(serviceType: CommunityServiceType): StaffingConfig {
    const baseConfig = {
      shiftSchedule: [
        {
          shiftId: uuidv4(),
          startTime: '06:00',
          endTime: '14:00',
          staffRequired: 2,
          assignedStaff: []
        },
        {
          shiftId: uuidv4(),
          startTime: '14:00',
          endTime: '22:00',
          staffRequired: 3,
          assignedStaff: []
        },
        {
          shiftId: uuidv4(),
          startTime: '22:00',
          endTime: '06:00',
          staffRequired: 1,
          assignedStaff: []
        }
      ]
    };

    switch (serviceType) {
      case 'shelter':
        return {
          minimumStaff: 2,
          currentStaff: 8,
          roles: [
            {
              roleId: uuidv4(),
              title: 'Shelter Coordinator',
              responsibilities: ['Client intake', 'Bed assignment', 'Safety monitoring'],
              requiredCertifications: ['First Aid', 'CPR'],
              languageRequirements: ['English']
            },
            {
              roleId: uuidv4(),
              title: 'Case Manager',
              responsibilities: ['Client assessment', 'Service planning', 'Resource coordination'],
              requiredCertifications: ['Social Work License'],
              languageRequirements: ['English', 'Spanish']
            }
          ],
          ...baseConfig
        };
      case 'food_water':
        return {
          minimumStaff: 3,
          currentStaff: 12,
          roles: [
            {
              roleId: uuidv4(),
              title: 'Food Service Coordinator',
              responsibilities: ['Meal planning', 'Kitchen management', 'Volunteer coordination'],
              requiredCertifications: ['Food Safety', 'ServSafe'],
              languageRequirements: ['English']
            },
            {
              roleId: uuidv4(),
              title: 'Nutritionist',
              responsibilities: ['Dietary planning', 'Special diet accommodation', 'Nutrition education'],
              requiredCertifications: ['Registered Dietitian'],
              languageRequirements: ['English', 'Spanish']
            }
          ],
          ...baseConfig
        };
      default:
        return {
          minimumStaff: 1,
          currentStaff: 4,
          roles: [],
          ...baseConfig
        };
    }
  }

  /**
   * Get default resource configurations for a service type
   */
  private getDefaultResourceConfigs(serviceType: CommunityServiceType): ResourceConfig[] {
    switch (serviceType) {
      case 'shelter':
        return [
          {
            resourceType: 'Beds',
            currentQuantity: 150,
            maxCapacity: 150,
            restockThreshold: 10,
            unit: 'units'
          },
          {
            resourceType: 'Bedding',
            currentQuantity: 300,
            maxCapacity: 400,
            restockThreshold: 50,
            unit: 'sets'
          },
          {
            resourceType: 'Lockers',
            currentQuantity: 150,
            maxCapacity: 150,
            restockThreshold: 5,
            unit: 'units'
          }
        ];
      case 'food_water':
        return [
          {
            resourceType: 'Food Items',
            currentQuantity: 2500,
            maxCapacity: 5000,
            restockThreshold: 500,
            unit: 'servings'
          },
          {
            resourceType: 'Water Bottles',
            currentQuantity: 1000,
            maxCapacity: 2000,
            restockThreshold: 200,
            unit: 'bottles'
          },
          {
            resourceType: 'Kitchen Supplies',
            currentQuantity: 50,
            maxCapacity: 100,
            restockThreshold: 10,
            unit: 'units'
          }
        ];
      default:
        return [];
    }
  }

  /**
   * Generate default emergency protocols
   */
  private generateDefaultEmergencyProtocols(): EmergencyProtocol[] {
    return [
      {
        protocolId: uuidv4(),
        emergencyType: 'fire',
        triggerConditions: ['Fire alarm activation', 'Visible smoke', 'Staff reports fire'],
        responseSteps: [
          {
            stepNumber: 1,
            action: 'Activate fire alarm system',
            responsible: 'Any Staff',
            timeLimit: 1
          },
          {
            stepNumber: 2,
            action: 'Call 911',
            responsible: 'Senior Staff',
            timeLimit: 2
          },
          {
            stepNumber: 3,
            action: 'Begin evacuation procedures',
            responsible: 'All Staff',
            timeLimit: 5
          }
        ],
        contactNumbers: ['911', '(208) 555-0911'],
        evacuationPlan: {
          primaryRoute: 'Main entrance and emergency exits',
          alternateRoutes: ['Side exits', 'Emergency windows (ground floor)'],
          meetingPoint: 'Parking lot across the street',
          specialNeeds: ['Assist clients with mobility issues', 'Account for all clients']
        }
      },
      {
        protocolId: uuidv4(),
        emergencyType: 'medical',
        triggerConditions: ['Medical emergency reported', 'Client requires immediate medical attention'],
        responseSteps: [
          {
            stepNumber: 1,
            action: 'Assess client condition',
            responsible: 'First Aid Certified Staff',
            timeLimit: 2
          },
          {
            stepNumber: 2,
            action: 'Call 911 if serious',
            responsible: 'Senior Staff',
            timeLimit: 3
          },
          {
            stepNumber: 3,
            action: 'Provide first aid',
            responsible: 'First Aid Certified Staff',
            timeLimit: 5
          }
        ],
        contactNumbers: ['911', '(208) 555-0911', '(208) 555-HEALTH']
      }
    ];
  }

  /**
   * Create a new community configuration
   */
  async createConfiguration(
    communityName: string,
    locations: CommunityLocation[],
    templateId?: string
  ): Promise<CommunityConfiguration> {
    let baseConfig: Partial<CommunityConfiguration> = {};

    if (templateId) {
      const template = this.templates.find(t => t.templateId === templateId);
      if (template) {
        baseConfig = template.configuration;
      }
    }

    const config: CommunityConfiguration = {
      communityName,
      locations,
      services: this.generateDefaultServiceConfigs(),
      contactInfo: {
        phone: '(555) 000-0000',
        email: `info@${communityName.toLowerCase().replace(/\s+/g, '')}.org`,
        languages: ['English']
      },
      operatingHours: {
        timezone: 'America/New_York',
        schedule: {
          monday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breaks: [] },
          tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breaks: [] },
          wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breaks: [] },
          thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breaks: [] },
          friday: { isOpen: true, openTime: '08:00', closeTime: '18:00', breaks: [] },
          saturday: { isOpen: true, openTime: '09:00', closeTime: '17:00', breaks: [] },
          sunday: { isOpen: false, breaks: [] }
        },
        holidays: [],
        emergencyAvailability: true
      },
      emergencyProtocols: this.generateDefaultEmergencyProtocols(),
      ...baseConfig
    };

    const configId = uuidv4();
    this.configurations.set(configId, config);

    console.log(`🏘️ Configuration created: ${communityName} (${configId})`);
    return config;
  }

  /**
   * Get configuration by ID or default
   */
  async getConfiguration(configId: string = 'default'): Promise<CommunityConfiguration | null> {
    return this.configurations.get(configId) || null;
  }

  /**
   * Update configuration
   */
  async updateConfiguration(
    configId: string,
    updates: Partial<CommunityConfiguration>
  ): Promise<boolean> {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const updatedConfig = { ...config, ...updates };
    this.configurations.set(configId, updatedConfig);

    console.log(`🏘️ Configuration updated: ${configId}`);
    return true;
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<ConfigurationTemplate[]> {
    return [...this.templates];
  }

  /**
   * Add a new location to a configuration
   */
  async addLocation(
    configId: string,
    location: Omit<CommunityLocation, 'locationId'>
  ): Promise<boolean> {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const newLocation: CommunityLocation = {
      locationId: uuidv4(),
      ...location
    };

    config.locations.push(newLocation);
    console.log(`📍 Location added: ${newLocation.name} to ${config.communityName}`);
    return true;
  }

  /**
   * Update service configuration
   */
  async updateServiceConfig(
    configId: string,
    serviceType: CommunityServiceType,
    updates: Partial<CommunityServiceConfig>
  ): Promise<boolean> {
    const config = this.configurations.get(configId);
    if (!config) return false;

    const serviceIndex = config.services.findIndex(s => s.serviceType === serviceType);
    if (serviceIndex === -1) return false;

    config.services[serviceIndex] = { ...config.services[serviceIndex], ...updates };
    console.log(`🔧 Service configuration updated: ${serviceType} in ${config.communityName}`);
    return true;
  }

  /**
   * Get community profile
   */
  async getCommunityProfile(profileId: string): Promise<CommunityProfile | null> {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Create community profile
   */
  async createCommunityProfile(profile: Omit<CommunityProfile, 'profileId'>): Promise<string> {
    const profileId = uuidv4();
    const newProfile: CommunityProfile = {
      profileId,
      ...profile
    };

    this.profiles.set(profileId, newProfile);
    console.log(`📊 Community profile created: ${profile.communityName} (${profileId})`);
    return profileId;
  }

  /**
   * Get configuration recommendations based on community profile
   */
  async getConfigurationRecommendations(profileId: string): Promise<{
    recommendedTemplate: ConfigurationTemplate | null;
    serviceRecommendations: {
      serviceType: CommunityServiceType;
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
    }[];
    staffingRecommendations: string[];
    resourceRecommendations: string[];
  }> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {
        recommendedTemplate: null,
        serviceRecommendations: [],
        staffingRecommendations: [],
        resourceRecommendations: []
      };
    }

    // Select template based on geographic info
    let recommendedTemplate: ConfigurationTemplate | null = null;
    if (profile.geographicInfo.ruralUrban === 'urban') {
      recommendedTemplate = this.templates.find(t => t.templateName.includes('Urban')) || null;
    } else if (profile.geographicInfo.ruralUrban === 'rural') {
      recommendedTemplate = this.templates.find(t => t.templateName.includes('Rural')) || null;
    }

    // Generate service recommendations based on community needs
    const serviceRecommendations = Object.values(COMMUNITY_SERVICE_TYPES).map(serviceType => {
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let reasoning = 'Standard community service';

      switch (serviceType) {
        case 'shelter':
          if (profile.economicProfile.povertyRate > 15) {
            priority = 'high';
            reasoning = 'High poverty rate indicates significant need for shelter services';
          }
          break;
        case 'food_water':
          priority = 'high';
          reasoning = 'Food security is a fundamental need for all communities';
          break;
        case 'transportation':
          if (profile.geographicInfo.transportationAccess === 'limited') {
            priority = 'high';
            reasoning = 'Limited transportation access requires enhanced services';
          } else if (profile.geographicInfo.ruralUrban === 'rural') {
            priority = 'high';
            reasoning = 'Rural communities typically have limited transportation options';
          }
          break;
        case 'sanitation':
          priority = 'medium';
          reasoning = 'Important for health and dignity, standard priority';
          break;
      }

      return { serviceType, priority, reasoning };
    });

    // Generate staffing recommendations
    const staffingRecommendations = [];
    if (profile.demographics.primaryLanguages.length > 1) {
      staffingRecommendations.push('Hire multilingual staff to serve diverse population');
    }
    if (profile.demographics.specialNeeds.includes('Mental health support')) {
      staffingRecommendations.push('Consider hiring mental health professionals or counselors');
    }
    if (profile.economicProfile.unemploymentRate > 5) {
      staffingRecommendations.push('Add job placement specialists to help with employment services');
    }

    // Generate resource recommendations
    const resourceRecommendations = [];
    if (profile.geographicInfo.climate === 'Semi-arid' || profile.geographicInfo.climate.includes('desert')) {
      resourceRecommendations.push('Increase water storage capacity for arid climate');
    }
    if (profile.population > 200000) {
      resourceRecommendations.push('Consider multiple locations to serve large population');
    }
    if (profile.economicProfile.housingChallenges.includes('Affordable housing shortage')) {
      resourceRecommendations.push('Expand shelter capacity to address housing shortage');
    }

    return {
      recommendedTemplate,
      serviceRecommendations,
      staffingRecommendations,
      resourceRecommendations
    };
  }

  /**
   * Export configuration for deployment
   */
  async exportConfiguration(configId: string): Promise<string | null> {
    const config = this.configurations.get(configId);
    if (!config) return null;

    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(configData: string, configId?: string): Promise<string> {
    try {
      const config: CommunityConfiguration = JSON.parse(configData);
      const id = configId || uuidv4();
      
      this.configurations.set(id, config);
      console.log(`🏘️ Configuration imported: ${config.communityName} (${id})`);
      return id;
    } catch (error) {
      throw new Error('Invalid configuration data');
    }
  }
}

export const communityConfigService = new CommunityConfigurationService();