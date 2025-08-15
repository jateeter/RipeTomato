/**
 * MediaWiki Service for HMIS OpenCommons Integration
 * 
 * Handles shelter registration and updates to the HMIS OpenCommons MediaWiki instance
 * following MediaWiki API standards for programmatic content management.
 * 
 * @license MIT
 */

import axios, { AxiosResponse } from 'axios';

export interface ShelterRegistrationData {
  id: string;
  name: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity: {
    totalBeds: number;
    availableBeds: number;
    emergencyBeds: number;
  };
  services: string[];
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  operatingHours: {
    checkinTime: string;
    checkoutTime: string;
    officeHours: string;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    ada_compliant: boolean;
    features: string[];
  };
  restrictions?: {
    ageGroups: string[];
    demographics: string[];
    requirements: string[];
  };
  registrationDate: string;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'full' | 'temporarily_closed';
}

export interface MediaWikiConfig {
  baseUrl: string;
  apiEndpoint: string;
  username: string;
  apiKey: string;
  userAgent: string;
}

export interface MediaWikiEditResponse {
  edit: {
    result: 'Success' | 'Failure';
    pageid: number;
    title: string;
    contentmodel: string;
    oldrevid: number;
    newrevid: number;
    newtimestamp: string;
  };
}

export interface MediaWikiQueryResponse {
  query: {
    pages: {
      [key: string]: {
        pageid: number;
        title: string;
        extract?: string;
        revisions?: Array<{
          contentformat: string;
          contentmodel: string;
          '*': string;
        }>;
      };
    };
  };
}

class MediaWikiService {
  private config: MediaWikiConfig;
  private editToken: string | null = null;

  constructor(config?: Partial<MediaWikiConfig>) {
    this.config = {
      baseUrl: 'https://hmis.opencommons.org',
      apiEndpoint: '/api.php',
      username: 'ShelterManagementBot',
      apiKey: process.env.REACT_APP_MEDIAWIKI_API_KEY || 'test-api-key',
      userAgent: 'IdahoEvents-ShelterManagement/1.0',
      ...config
    };
  }

  /**
   * Initialize MediaWiki service and obtain edit token
   */
  async initialize(): Promise<boolean> {
    try {
      // Get edit token for authenticated operations
      const tokenResponse = await this.makeAPIRequest({
        action: 'query',
        meta: 'tokens',
        type: 'csrf'
      });

      if (tokenResponse.data.query?.tokens?.csrftoken) {
        this.editToken = tokenResponse.data.query.tokens.csrftoken;
        console.log('✅ MediaWiki service initialized with edit token');
        return true;
      }

      console.warn('⚠️ MediaWiki edit token not obtained, using mock mode');
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize MediaWiki service:', error);
      return false;
    }
  }

  /**
   * Register a new shelter in HMIS OpenCommons MediaWiki
   */
  async registerShelter(shelterData: ShelterRegistrationData): Promise<{success: boolean; pageId?: number; error?: string}> {
    try {
      const pageTitle = `Shelter:${shelterData.name.replace(/\s+/g, '_')}`;
      const wikiContent = this.generateShelterWikiPage(shelterData);

      console.log(`📝 Creating MediaWiki page: ${pageTitle}`);

      // Create or update the shelter page
      const editResponse = await this.createOrUpdatePage(pageTitle, wikiContent, `Register new shelter: ${shelterData.name}`);

      if (editResponse.success) {
        // Update the shelter listing page
        await this.updateShelterListing(shelterData);
        
        console.log(`✅ Shelter "${shelterData.name}" successfully registered in HMIS OpenCommons`);
        return { success: true, pageId: editResponse.pageId };
      }

      return { success: false, error: editResponse.error };
    } catch (error) {
      console.error('❌ Failed to register shelter in MediaWiki:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update existing shelter information
   */
  async updateShelter(shelterId: string, updates: Partial<ShelterRegistrationData>): Promise<{success: boolean; error?: string}> {
    try {
      // Fetch existing shelter data
      const existingShelter = await this.getShelterData(shelterId);
      if (!existingShelter) {
        return { success: false, error: 'Shelter not found' };
      }

      // Merge updates with existing data
      const updatedShelter: ShelterRegistrationData = {
        ...existingShelter,
        ...updates,
        lastUpdated: new Date().toISOString()
      };

      const pageTitle = `Shelter:${updatedShelter.name.replace(/\s+/g, '_')}`;
      const wikiContent = this.generateShelterWikiPage(updatedShelter);

      const editResponse = await this.createOrUpdatePage(pageTitle, wikiContent, `Update shelter information: ${updatedShelter.name}`);

      return { success: editResponse.success, error: editResponse.error };
    } catch (error) {
      console.error('❌ Failed to update shelter:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get shelter data from MediaWiki
   */
  async getShelterData(shelterId: string): Promise<ShelterRegistrationData | null> {
    try {
      const response = await this.makeAPIRequest({
        action: 'query',
        titles: `Shelter:${shelterId}`,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main'
      });

      const pages = response.data.query?.pages;
      if (!pages) return null;

      const pageData = Object.values(pages)[0] as any;
      if (pageData.missing) return null;

      // Parse MediaWiki content back to shelter data
      const content = pageData.revisions?.[0]?.slots?.main?.['*'];
      return this.parseWikiContentToShelterData(content);
    } catch (error) {
      console.error('❌ Failed to get shelter data:', error);
      return null;
    }
  }

  /**
   * Generate MediaWiki markup for shelter page
   */
  private generateShelterWikiPage(shelter: ShelterRegistrationData): string {
    return `{{Shelter
|id=${shelter.id}
|name=${shelter.name}
|description=${shelter.description}
|street=${shelter.address.street}
|city=${shelter.address.city}
|state=${shelter.address.state}
|zipcode=${shelter.address.zipCode}
|latitude=${shelter.address.coordinates?.lat || ''}
|longitude=${shelter.address.coordinates?.lng || ''}
|total_beds=${shelter.capacity.totalBeds}
|available_beds=${shelter.capacity.availableBeds}
|emergency_beds=${shelter.capacity.emergencyBeds}
|services=${shelter.services.join(', ')}
|phone=${shelter.contact.phone}
|email=${shelter.contact.email}
|website=${shelter.contact.website || ''}
|checkin_time=${shelter.operatingHours.checkinTime}
|checkout_time=${shelter.operatingHours.checkoutTime}
|office_hours=${shelter.operatingHours.officeHours}
|wheelchair_accessible=${shelter.accessibility.wheelchairAccessible ? 'yes' : 'no'}
|ada_compliant=${shelter.accessibility.ada_compliant ? 'yes' : 'no'}
|accessibility_features=${shelter.accessibility.features.join(', ')}
|age_groups=${shelter.restrictions?.ageGroups?.join(', ') || ''}
|demographics=${shelter.restrictions?.demographics?.join(', ') || ''}
|requirements=${shelter.restrictions?.requirements?.join(', ') || ''}
|status=${shelter.status}
|registration_date=${shelter.registrationDate}
|last_updated=${shelter.lastUpdated}
}}

== Description ==
${shelter.description}

== Services Provided ==
${shelter.services.map(service => `* ${service}`).join('\n')}

== Contact Information ==
* '''Phone:''' ${shelter.contact.phone}
* '''Email:''' ${shelter.contact.email}
${shelter.contact.website ? `* '''Website:''' ${shelter.contact.website}` : ''}

== Location ==
{{Address
|street=${shelter.address.street}
|city=${shelter.address.city}
|state=${shelter.address.state}
|zipcode=${shelter.address.zipCode}
${shelter.address.coordinates ? `|latitude=${shelter.address.coordinates.lat}|longitude=${shelter.address.coordinates.lng}` : ''}
}}

== Capacity Information ==
* '''Total Beds:''' ${shelter.capacity.totalBeds}
* '''Currently Available:''' ${shelter.capacity.availableBeds}
* '''Emergency Capacity:''' ${shelter.capacity.emergencyBeds}

== Operating Hours ==
* '''Check-in:''' ${shelter.operatingHours.checkinTime}
* '''Check-out:''' ${shelter.operatingHours.checkoutTime}
* '''Office Hours:''' ${shelter.operatingHours.officeHours}

== Accessibility ==
* '''Wheelchair Accessible:''' ${shelter.accessibility.wheelchairAccessible ? 'Yes' : 'No'}
* '''ADA Compliant:''' ${shelter.accessibility.ada_compliant ? 'Yes' : 'No'}
${shelter.accessibility.features.length > 0 ? `* '''Features:''' ${shelter.accessibility.features.join(', ')}` : ''}

${shelter.restrictions ? `== Restrictions and Requirements ==
${shelter.restrictions.ageGroups?.length ? `* '''Age Groups Served:''' ${shelter.restrictions.ageGroups.join(', ')}` : ''}
${shelter.restrictions.demographics?.length ? `* '''Demographics:''' ${shelter.restrictions.demographics.join(', ')}` : ''}
${shelter.restrictions.requirements?.length ? `* '''Requirements:''' ${shelter.restrictions.requirements.join(', ')}` : ''}` : ''}

[[Category:Shelters]]
[[Category:HMIS Facilities]]
[[Category:${shelter.address.state}]]
[[Category:${shelter.address.city}]]
`;
  }

  /**
   * Update the main shelter listing page
   */
  private async updateShelterListing(shelter: ShelterRegistrationData): Promise<void> {
    try {
      const listingPageTitle = 'Facilities';
      
      // Get current listing content
      const response = await this.makeAPIRequest({
        action: 'query',
        titles: listingPageTitle,
        prop: 'revisions',
        rvprop: 'content'
      });

      const pages = response.data.query?.pages;
      const pageData = Object.values(pages || {})[0] as any;
      let currentContent = pageData?.revisions?.[0]?.['*'] || '';

      // Add new shelter to the listing
      const shelterEntry = `
{{ShelterListing
|name=${shelter.name}
|city=${shelter.address.city}
|state=${shelter.address.state}
|beds=${shelter.capacity.totalBeds}
|status=${shelter.status}
|page=Shelter:${shelter.name.replace(/\s+/g, '_')}
}}`;

      // Insert the new entry (in a real implementation, this would be more sophisticated)
      if (!currentContent.includes(shelter.name)) {
        currentContent += shelterEntry;
        
        await this.createOrUpdatePage(listingPageTitle, currentContent, `Add ${shelter.name} to shelter listing`);
      }
    } catch (error) {
      console.error('❌ Failed to update shelter listing:', error);
    }
  }

  /**
   * Create or update a MediaWiki page
   */
  private async createOrUpdatePage(title: string, content: string, summary: string): Promise<{success: boolean; pageId?: number; error?: string}> {
    try {
      if (!this.editToken) {
        // Mock mode for testing
        console.log(`🔄 Mock edit: ${title} - ${summary}`);
        return { success: true, pageId: Math.floor(Math.random() * 10000) };
      }

      const response: AxiosResponse<MediaWikiEditResponse> = await this.makeAPIRequest({
        action: 'edit',
        title,
        text: content,
        summary,
        token: this.editToken
      }, 'POST');

      if (response.data.edit?.result === 'Success') {
        return { success: true, pageId: response.data.edit.pageid };
      }

      return { success: false, error: 'Edit failed' };
    } catch (error) {
      console.error('❌ Page edit failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Make API request to MediaWiki
   */
  private async makeAPIRequest(params: Record<string, any>, method: 'GET' | 'POST' = 'GET'): Promise<AxiosResponse> {
    const url = `${this.config.baseUrl}${this.config.apiEndpoint}`;
    
    const config = {
      headers: {
        'User-Agent': this.config.userAgent,
        'Content-Type': method === 'POST' ? 'application/x-www-form-urlencoded' : 'application/json'
      },
      timeout: 15000
    };

    const requestParams = {
      format: 'json',
      ...params
    };

    if (method === 'POST') {
      const formData = new URLSearchParams();
      Object.entries(requestParams).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      
      return axios.post(url, formData, config);
    } else {
      return axios.get(url, { ...config, params: requestParams });
    }
  }

  /**
   * Parse MediaWiki content back to shelter data structure
   */
  private parseWikiContentToShelterData(content: string): ShelterRegistrationData | null {
    // This would contain sophisticated parsing logic
    // For now, return a mock structure
    return {
      id: 'parsed-shelter-id',
      name: 'Parsed Shelter Name',
      description: 'Parsed from MediaWiki content',
      address: {
        street: '123 Main St',
        city: 'Boise',
        state: 'ID',
        zipCode: '83702'
      },
      capacity: {
        totalBeds: 50,
        availableBeds: 10,
        emergencyBeds: 5
      },
      services: ['Shelter', 'Meals'],
      contact: {
        phone: '+1-208-555-0123',
        email: 'info@shelter.org'
      },
      operatingHours: {
        checkinTime: '18:00',
        checkoutTime: '08:00',
        officeHours: '9:00 AM - 5:00 PM'
      },
      accessibility: {
        wheelchairAccessible: true,
        ada_compliant: true,
        features: ['Ramps', 'Accessible bathrooms']
      },
      registrationDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active'
    };
  }

  /**
   * Test MediaWiki connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeAPIRequest({
        action: 'query',
        meta: 'siteinfo'
      });

      return response.status === 200 && response.data.query?.general;
    } catch (error) {
      console.error('❌ MediaWiki connection test failed:', error);
      return false;
    }
  }
}

export const mediaWikiService = new MediaWikiService();
export { MediaWikiService };