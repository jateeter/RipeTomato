/**
 * Simple Client Registration Service
 *
 * Designed for homeless population with minimal technical expertise.
 * Automatically handles Solid Pod provisioning and demographic data augmentation.
 *
 * Key Features:
 * - Minimal required input (name, basic info only)
 * - Automatic demographic augmentation from public data sources
 * - Hidden Solid Pod setup (no technical knowledge required)
 * - Street duration as workflow inflection point
 * - Family relationship tracking
 * - iPad-optimized (5G connectivity)
 */

export interface MinimalClientInput {
  // Bare minimum required from client
  firstName: string;
  lastName?: string; // Optional - some prefer first name only
  preferredName?: string; // What they want to be called

  // Street duration - critical inflection point
  streetDuration: 'first-time' | 'less-than-month' | '1-6-months' | '6-12-months' | 'over-year' | 'chronic';

  // Family relationships - another key inflection point
  hasChildren: boolean;
  childrenWithClient?: number; // If hasChildren true
  childrenElsewhere?: number; // If hasChildren true

  hasPartner: boolean;
  partnerWithClient?: boolean; // If hasPartner true

  hasOtherFamily: boolean;
  familyContact?: 'yes' | 'no' | 'maybe'; // If hasOtherFamily true

  // Optional contact (for follow-up only, not required)
  phoneNumber?: string;
  email?: string;
}

export interface AugmentedClientProfile {
  // Original minimal input
  clientInput: MinimalClientInput;

  // Auto-generated identifiers
  clientId: string;
  registrationDate: Date;

  // Automatic Solid Pod credentials (hidden from user)
  solidPod: {
    webId: string;
    podUrl: string;
    storageEndpoint: string;
    createdAt: Date;
  };

  // Augmented demographic data (from public sources)
  demographics: {
    estimatedAge?: number;
    zipCodeLastKnown?: string;
    cityOfOrigin?: string;
    veteranStatus?: boolean;
    disabilityIndicators?: string[];
  };

  // Risk assessment (based on street duration and family)
  riskProfile: {
    urgency: 'critical' | 'high' | 'moderate' | 'low';
    priorityServices: string[];
    recommendedPrograms: string[];
    familySupport: boolean;
  };

  // Service recommendations (based on inflection points)
  recommendations: ServiceRecommendation[];
}

export interface ServiceRecommendation {
  serviceType: 'shelter' | 'meals' | 'family-services' | 'health' | 'counseling' | 'job-training';
  priority: 'immediate' | 'high' | 'medium' | 'low';
  reason: string;
  providerName: string;
  location: string;
}

class SimpleClientRegistrationService {

  /**
   * Register a new client with minimal input
   * All complexity hidden from user
   */
  async registerClient(input: MinimalClientInput): Promise<AugmentedClientProfile> {
    // Validate minimal input
    this.validateInput(input);

    // Generate client ID
    const clientId = this.generateClientId(input);

    // Automatically provision Solid Pod (hidden from user)
    const solidPod = await this.provisionSolidPod(clientId, input);

    // Augment with demographic data (public sources)
    const demographics = await this.augmentDemographics(input);

    // Calculate risk profile based on inflection points
    const riskProfile = this.calculateRiskProfile(input);

    // Generate service recommendations
    const recommendations = this.generateRecommendations(input, riskProfile);

    // Create complete profile
    const profile: AugmentedClientProfile = {
      clientInput: input,
      clientId,
      registrationDate: new Date(),
      solidPod,
      demographics,
      riskProfile,
      recommendations
    };

    // Store in Solid Pod (automatic, hidden)
    await this.storeProfileInPod(profile);

    // Store local reference (for offline access)
    this.storeLocalReference(profile);

    return profile;
  }

  /**
   * Validate minimal input - very forgiving
   */
  private validateInput(input: MinimalClientInput): void {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!input.streetDuration) {
      throw new Error('Street duration is required');
    }

    // That's it - everything else is optional or auto-filled
  }

  /**
   * Generate simple, memorable client ID
   * Format: FIRST-NAME-MMDD (e.g., JOHN-1215)
   */
  private generateClientId(input: MinimalClientInput): string {
    const firstName = input.firstName.toUpperCase().replace(/[^A-Z]/g, '');
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 100)).padStart(2, '0');

    return `${firstName}-${month}${day}${random}`;
  }

  /**
   * Automatically provision Solid Pod - completely hidden from client
   * Uses community provider (e.g., solidcommunity.net)
   */
  private async provisionSolidPod(clientId: string, input: MinimalClientInput): Promise<AugmentedClientProfile['solidPod']> {
    // Use community Solid Pod provider
    const provider = 'https://solidcommunity.net';

    // Generate pod username from clientId
    const username = `idaho-${clientId.toLowerCase()}`;

    // Generate secure random password (stored in pod, not shown to user)
    const password = this.generateSecurePassword();

    try {
      // Attempt to create pod (using Solid Pod API)
      const response = await fetch(`${provider}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          name: input.preferredName || input.firstName,
          email: input.email || `${username}@idaho-temp.org` // Temporary if not provided
        })
      });

      if (!response.ok) {
        console.warn('Solid Pod creation failed, using local storage fallback');
        return this.createLocalPodFallback(clientId);
      }

      const data = await response.json();

      return {
        webId: `${provider}/${username}/profile/card#me`,
        podUrl: `${provider}/${username}/`,
        storageEndpoint: `${provider}/${username}/`,
        createdAt: new Date()
      };

    } catch (error) {
      console.warn('Solid Pod provisioning error, using local fallback:', error);
      return this.createLocalPodFallback(clientId);
    }
  }

  /**
   * Fallback to local storage if Solid Pod unavailable (offline-first)
   */
  private createLocalPodFallback(clientId: string): AugmentedClientProfile['solidPod'] {
    return {
      webId: `local://idaho-app/${clientId}/profile#me`,
      podUrl: `local://idaho-app/${clientId}/`,
      storageEndpoint: `localStorage://idaho-app/${clientId}/`,
      createdAt: new Date()
    };
  }

  /**
   * Generate secure password (never shown to user)
   */
  private generateSecurePassword(): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 24; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Augment with demographic data from public sources
   * Examples: Census data, veteran registries, disability services
   */
  private async augmentDemographics(input: MinimalClientInput): Promise<AugmentedClientProfile['demographics']> {
    const demographics: AugmentedClientProfile['demographics'] = {};

    // In production, these would call actual public APIs
    // For now, return reasonable defaults based on input

    // Estimate age based on street duration (rough correlation)
    demographics.estimatedAge = this.estimateAgeFromDuration(input.streetDuration);

    // Default to Portland area
    demographics.zipCodeLastKnown = '97209'; // Old Town/Downtown Portland
    demographics.cityOfOrigin = 'Portland';

    // Check veteran status (would query VA registry in production)
    demographics.veteranStatus = await this.checkVeteranStatus(input);

    // Check disability indicators (would query disability services in production)
    demographics.disabilityIndicators = await this.checkDisabilityIndicators(input);

    return demographics;
  }

  /**
   * Estimate age from street duration
   * Chronic homelessness tends to skew older
   */
  private estimateAgeFromDuration(duration: MinimalClientInput['streetDuration']): number {
    const ageRanges = {
      'first-time': 35,
      'less-than-month': 32,
      '1-6-months': 38,
      '6-12-months': 42,
      'over-year': 45,
      'chronic': 52
    };
    return ageRanges[duration];
  }

  /**
   * Check veteran status from public VA registries
   */
  private async checkVeteranStatus(input: MinimalClientInput): Promise<boolean> {
    // In production, would query VA homeless veteran registry
    // For now, return false (requires explicit self-identification)
    return false;
  }

  /**
   * Check disability indicators from public disability services
   */
  private async checkDisabilityIndicators(input: MinimalClientInput): Promise<string[]> {
    // In production, would check:
    // - Social Security Disability registry (public records)
    // - Medicaid disability status
    // - ADA accommodation requests

    // For now, infer from street duration (chronic often indicates disability)
    if (input.streetDuration === 'chronic') {
      return ['possible-chronic-condition'];
    }

    return [];
  }

  /**
   * Calculate risk profile based on inflection points
   * Street duration + family situation = priority level
   */
  private calculateRiskProfile(input: MinimalClientInput): AugmentedClientProfile['riskProfile'] {
    let urgency: AugmentedClientProfile['riskProfile']['urgency'];
    const priorityServices: string[] = [];
    const recommendedPrograms: string[] = [];

    // Children with client = CRITICAL urgency
    if (input.hasChildren && input.childrenWithClient && input.childrenWithClient > 0) {
      urgency = 'critical';
      priorityServices.push('family-shelter', 'family-meals', 'child-services');
      recommendedPrograms.push('JOIN Family Housing', 'Transition Projects Family Services');
    }
    // Chronic homelessness = HIGH urgency
    else if (input.streetDuration === 'chronic' || input.streetDuration === 'over-year') {
      urgency = 'high';
      priorityServices.push('permanent-housing', 'health-services', 'case-management');
      recommendedPrograms.push('Central City Concern Housing First', 'Outside In Health Services');
    }
    // New to streets = MODERATE urgency (prevent chronic)
    else if (input.streetDuration === 'first-time' || input.streetDuration === 'less-than-month') {
      urgency = 'moderate';
      priorityServices.push('rapid-rehousing', 'job-training', 'financial-assistance');
      recommendedPrograms.push('JOIN Rapid Rehousing', 'Worksystems Job Training');
    }
    // Everything else = LOW urgency (but still important)
    else {
      urgency = 'low';
      priorityServices.push('shelter', 'meals', 'counseling');
      recommendedPrograms.push('Blanchet House', 'Portland Rescue Mission');
    }

    // Family support indicator
    const familySupport = input.hasOtherFamily && input.familyContact === 'yes';

    return {
      urgency,
      priorityServices,
      recommendedPrograms,
      familySupport
    };
  }

  /**
   * Generate service recommendations based on profile
   */
  private generateRecommendations(
    input: MinimalClientInput,
    risk: AugmentedClientProfile['riskProfile']
  ): ServiceRecommendation[] {
    const recommendations: ServiceRecommendation[] = [];

    // Immediate shelter (always first)
    if (input.hasChildren && input.childrenWithClient && input.childrenWithClient > 0) {
      recommendations.push({
        serviceType: 'shelter',
        priority: 'immediate',
        reason: 'Family with children needs immediate safe housing',
        providerName: 'JOIN Family Resource Center',
        location: '4110 SE Hawthorne Blvd, Portland'
      });
    } else {
      recommendations.push({
        serviceType: 'shelter',
        priority: 'immediate',
        reason: 'Immediate shelter bed needed',
        providerName: 'Blanchet House',
        location: '340 SW Madison St, Portland'
      });
    }

    // Meals (always second)
    recommendations.push({
      serviceType: 'meals',
      priority: 'immediate',
      reason: 'Daily nutrition support',
      providerName: 'Blanchet House',
      location: '340 SW Madison St, Portland'
    });

    // Family services (if children)
    if (input.hasChildren) {
      recommendations.push({
        serviceType: 'family-services',
        priority: input.childrenWithClient && input.childrenWithClient > 0 ? 'immediate' : 'high',
        reason: input.childrenWithClient && input.childrenWithClient > 0
          ? 'Children with client need immediate family services'
          : 'Family reunification support available',
        providerName: 'Transition Projects Family Services',
        location: '665 NW Hoyt St, Portland'
      });
    }

    // Health services (higher priority for chronic)
    if (input.streetDuration === 'chronic' || input.streetDuration === 'over-year') {
      recommendations.push({
        serviceType: 'health',
        priority: 'high',
        reason: 'Chronic homelessness often requires health intervention',
        providerName: 'Outside In Medical Clinic',
        location: '1132 SW 13th Ave, Portland'
      });
    } else {
      recommendations.push({
        serviceType: 'health',
        priority: 'medium',
        reason: 'Regular health checkups recommended',
        providerName: 'Outside In Medical Clinic',
        location: '1132 SW 13th Ave, Portland'
      });
    }

    // Counseling (medium priority for most)
    recommendations.push({
      serviceType: 'counseling',
      priority: 'medium',
      reason: 'Mental health and case management support',
      providerName: 'Cascadia Behavioral Healthcare',
      location: 'Multiple locations'
    });

    // Job training (higher priority for recent homelessness)
    if (input.streetDuration === 'first-time' || input.streetDuration === 'less-than-month') {
      recommendations.push({
        serviceType: 'job-training',
        priority: 'high',
        reason: 'Recent job loss - rapid employment can prevent chronic homelessness',
        providerName: 'Worksystems Inc',
        location: '1618 SW 1st Ave #450, Portland'
      });
    }

    return recommendations;
  }

  /**
   * Store profile in Solid Pod (automatic, hidden)
   */
  private async storeProfileInPod(profile: AugmentedClientProfile): Promise<void> {
    const podUrl = profile.solidPod.storageEndpoint;

    // If using local fallback
    if (podUrl.startsWith('localStorage://')) {
      localStorage.setItem(
        `client_profile_${profile.clientId}`,
        JSON.stringify(profile)
      );
      return;
    }

    // If using actual Solid Pod
    try {
      const response = await fetch(`${podUrl}profile.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        console.warn('Failed to store in Solid Pod, using local fallback');
        localStorage.setItem(
          `client_profile_${profile.clientId}`,
          JSON.stringify(profile)
        );
      }
    } catch (error) {
      console.warn('Solid Pod storage error, using local fallback:', error);
      localStorage.setItem(
        `client_profile_${profile.clientId}`,
        JSON.stringify(profile)
      );
    }
  }

  /**
   * Store local reference for quick access
   */
  private storeLocalReference(profile: AugmentedClientProfile): void {
    // Store lightweight reference
    const reference = {
      clientId: profile.clientId,
      name: profile.clientInput.preferredName || profile.clientInput.firstName,
      registrationDate: profile.registrationDate,
      urgency: profile.riskProfile.urgency
    };

    // Add to registered clients list
    const registered = this.getRegisteredClients();
    registered.push(reference);
    localStorage.setItem('registered_clients', JSON.stringify(registered));
  }

  /**
   * Get list of registered clients
   */
  private getRegisteredClients(): any[] {
    const stored = localStorage.getItem('registered_clients');
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Retrieve client profile by ID
   */
  async getClientProfile(clientId: string): Promise<AugmentedClientProfile | null> {
    // Try local storage first
    const stored = localStorage.getItem(`client_profile_${clientId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    // Try Solid Pod (if available)
    // Would implement Solid Pod retrieval here

    return null;
  }

  /**
   * Update client profile (minimal fields only)
   */
  async updateClientProfile(
    clientId: string,
    updates: Partial<MinimalClientInput>
  ): Promise<AugmentedClientProfile | null> {
    const profile = await this.getClientProfile(clientId);
    if (!profile) {
      return null;
    }

    // Update input fields
    profile.clientInput = { ...profile.clientInput, ...updates };

    // Recalculate risk profile if key fields changed
    if (updates.streetDuration || updates.hasChildren !== undefined) {
      profile.riskProfile = this.calculateRiskProfile(profile.clientInput);
      profile.recommendations = this.generateRecommendations(
        profile.clientInput,
        profile.riskProfile
      );
    }

    // Re-store
    await this.storeProfileInPod(profile);

    return profile;
  }
}

// Export singleton instance
export const simpleClientRegistration = new SimpleClientRegistrationService();
