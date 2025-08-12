import { Event } from '../types/Event';
import { GOOGLE_CONFIG, GOOGLE_CALENDAR_CONFIG } from '../config/googleConfig';
import { BedRegistration } from '../components/ClientBedRegistrationModal';
import { ShelterFacility } from './shelterDataService';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }[];
  location?: string;
  organizer?: {
    displayName?: string;
    email?: string;
  };
  htmlLink?: string;
  status?: string;
  colorId?: string;
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: 'email' | 'popup';
      minutes: number;
    }[];
  };
  extendedProperties?: {
    private?: Record<string, string>;
    shared?: Record<string, string>;
  };
}

export interface CalendarConfig {
  id: string;
  name: string;
  description: string;
  timeZone: string;
  colorId: string;
  type: 'personal' | 'shelter' | 'service_delivery' | 'staff' | 'manager';
  ownerId: string;
  permissions: {
    read: string[];
    write: string[];
    manage: string[];
  };
  syncRules: CalendarSyncRule[];
  active: boolean;
}

export interface CalendarSyncRule {
  id: string;
  sourceCalendarId: string;
  targetCalendarId: string;
  eventTypes: string[];
  syncDirection: 'one_way' | 'two_way';
  filterRules?: {
    includeKeywords?: string[];
    excludeKeywords?: string[];
    timeRange?: {
      start: string;
      end: string;
    };
  };
  transformations?: {
    titlePrefix?: string;
    locationOverride?: string;
    descriptionTemplate?: string;
  };
  active: boolean;
}

export interface PersonalCalendarSettings {
  userId: string;
  userType: 'client' | 'staff' | 'manager';
  primaryCalendarId: string;
  syncedCalendars: string[];
  notificationSettings: {
    emailReminders: boolean;
    smsReminders: boolean;
    appNotifications: boolean;
    reminderTimes: number[];
  };
  privacySettings: {
    shareWithStaff: boolean;
    shareWithManagers: boolean;
    shareEventDetails: boolean;
    restrictedEventTypes: string[];
  };
}

class GoogleCalendarService {
  private isInitialized = false;
  private isSignedIn = false;
  private gapi: any = null;
  private calendars: Map<string, CalendarConfig> = new Map();
  private syncRules: Map<string, CalendarSyncRule> = new Map();
  private personalSettings: Map<string, PersonalCalendarSettings> = new Map();

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Load calendar configurations first
      this.loadCalendarConfigurations();

      // Load Google API
      await this.loadGoogleAPI();
      
      await window.gapi.load('client:auth2', async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_CONFIG.API_KEY,
          clientId: GOOGLE_CONFIG.CLIENT_ID,
          discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
          scope: GOOGLE_CONFIG.SCOPES
        });

        this.gapi = window.gapi;
        this.isInitialized = true;
        
        // Check if user is already signed in
        const authInstance = this.gapi.auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
      });

      console.log('📅 Google Calendar Service with enhanced features initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
      return false;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.isInitialized && this.isSignedIn) {
        const authInstance = this.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        this.isSignedIn = false;
      }
    } catch (error) {
      console.error('Google sign-out failed:', error);
    }
  }

  isUserSignedIn(): boolean {
    return this.isSignedIn && this.isInitialized;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      if (!this.isUserSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      const response = await this.gapi.client.calendar.events.list({
        calendarId: GOOGLE_CONFIG.CALENDAR_ID,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: GOOGLE_CALENDAR_CONFIG.SINGLE_EVENTS,
        orderBy: GOOGLE_CALENDAR_CONFIG.ORDER_BY,
        maxResults: GOOGLE_CALENDAR_CONFIG.MAX_RESULTS
      });

      const googleEvents: GoogleCalendarEvent[] = response.result.items || [];
      return googleEvents.map(this.convertGoogleEventToLocal);
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
      throw error;
    }
  }

  async createEvent(event: Event): Promise<string> {
    try {
      if (!this.isUserSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      const googleEvent = this.convertLocalEventToGoogle(event);
      
      const response = await this.gapi.client.calendar.events.insert({
        calendarId: GOOGLE_CONFIG.CALENDAR_ID,
        resource: googleEvent
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      throw error;
    }
  }

  async updateEvent(event: Event): Promise<void> {
    try {
      if (!this.isUserSignedIn() || !event.googleEventId) {
        throw new Error('User not signed in or event not synced with Google Calendar');
      }

      const googleEvent = this.convertLocalEventToGoogle(event);
      
      await this.gapi.client.calendar.events.update({
        calendarId: GOOGLE_CONFIG.CALENDAR_ID,
        eventId: event.googleEventId,
        resource: googleEvent
      });
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(googleEventId: string): Promise<void> {
    try {
      if (!this.isUserSignedIn()) {
        throw new Error('User not signed in to Google Calendar');
      }

      await this.gapi.client.calendar.events.delete({
        calendarId: GOOGLE_CONFIG.CALENDAR_ID,
        eventId: googleEventId
      });
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      throw error;
    }
  }

  private convertGoogleEventToLocal(googleEvent: GoogleCalendarEvent): Event {
    const startTime = new Date(googleEvent.start.dateTime || googleEvent.start.date || '');
    const endTime = new Date(googleEvent.end.dateTime || googleEvent.end.date || '');

    // Try to extract category from description or use 'other' as default
    const category = this.extractCategoryFromDescription(googleEvent.description) || 'other';

    return {
      id: `google-${googleEvent.id}`,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      startTime,
      endTime,
      location: googleEvent.location || '',
      category: category as any,
      organizer: googleEvent.organizer?.displayName || googleEvent.organizer?.email || 'Unknown',
      contact: googleEvent.organizer?.email,
      website: googleEvent.htmlLink,
      googleCalendarId: GOOGLE_CONFIG.CALENDAR_ID,
      googleEventId: googleEvent.id,
      lastSynced: new Date(),
      syncStatus: 'synced'
    };
  }

  private convertLocalEventToGoogle(event: Event): any {
    return {
      summary: event.title,
      description: this.formatDescriptionForGoogle(event),
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: GOOGLE_CALENDAR_CONFIG.TIME_ZONE
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: GOOGLE_CALENDAR_CONFIG.TIME_ZONE
      },
      location: event.location,
      organizer: {
        displayName: event.organizer
      }
    };
  }

  private formatDescriptionForGoogle(event: Event): string {
    let description = event.description;
    
    // Add category information
    description += `\n\nCategory: ${event.category}`;
    
    // Add contact information
    if (event.contact) {
      description += `\nContact: ${event.contact}`;
    }
    
    // Add website
    if (event.website) {
      description += `\nWebsite: ${event.website}`;
    }
    
    // Add tags
    if (event.tags && event.tags.length > 0) {
      description += `\nTags: ${event.tags.join(', ')}`;
    }
    
    return description;
  }

  private extractCategoryFromDescription(description?: string): string | null {
    if (!description) return null;
    
    const categoryMatch = description.match(/Category:\s*(\w+)/i);
    return categoryMatch ? categoryMatch[1].toLowerCase() : null;
  }

  // Enhanced Calendar Management Methods

  /**
   * Create personal calendar for a user
   */
  async createPersonalCalendar(
    userId: string, 
    userType: 'client' | 'staff' | 'manager',
    userDetails: {
      name: string;
      email: string;
      department?: string;
    }
  ): Promise<string> {
    const calendarId = `personal_${userId}_${Date.now()}`;
    
    const calendar: CalendarConfig = {
      id: calendarId,
      name: `${userDetails.name} - Personal Calendar`,
      description: `Personal calendar for ${userType}: ${userDetails.name}`,
      timeZone: 'America/Los_Angeles',
      colorId: this.getColorByUserType(userType),
      type: 'personal',
      ownerId: userId,
      permissions: {
        read: [userId],
        write: [userId],
        manage: [userId]
      },
      syncRules: [],
      active: true
    };

    // Set up default permissions based on user type
    if (userType === 'client') {
      calendar.permissions.read.push('staff', 'manager');
    } else if (userType === 'staff') {
      calendar.permissions.read.push('manager');
    }

    this.calendars.set(calendarId, calendar);

    // Create personal settings
    const personalSettings: PersonalCalendarSettings = {
      userId,
      userType,
      primaryCalendarId: calendarId,
      syncedCalendars: [],
      notificationSettings: {
        emailReminders: true,
        smsReminders: userType === 'client',
        appNotifications: true,
        reminderTimes: [15, 60]
      },
      privacySettings: {
        shareWithStaff: userType === 'client',
        shareWithManagers: true,
        shareEventDetails: userType !== 'client',
        restrictedEventTypes: userType === 'client' ? ['medical', 'personal'] : []
      }
    };

    this.personalSettings.set(userId, personalSettings);
    this.saveCalendarConfigurations();

    console.log(`📅 Created personal calendar for ${userType} ${userDetails.name}:`, calendarId);
    return calendarId;
  }

  /**
   * Create shelter-specific calendar
   */
  async createShelterCalendar(shelter: ShelterFacility): Promise<string> {
    const calendarId = `shelter_${shelter.id}`;
    
    const calendar: CalendarConfig = {
      id: calendarId,
      name: `${shelter.name} - Facility Calendar`,
      description: `Calendar for ${shelter.name} facility operations, bed registrations, and events`,
      timeZone: 'America/Los_Angeles',
      colorId: '9',
      type: 'shelter',
      ownerId: 'system',
      permissions: {
        read: ['staff', 'manager', 'supervisor'],
        write: ['staff', 'manager'],
        manage: ['manager', 'supervisor']
      },
      syncRules: [],
      active: true
    };

    this.calendars.set(calendarId, calendar);
    this.saveCalendarConfigurations();

    console.log(`🏠 Created shelter calendar for ${shelter.name}:`, calendarId);
    return calendarId;
  }

  /**
   * Create service delivery calendar
   */
  async createServiceDeliveryCalendar(
    managerId: string,
    serviceType: string,
    organizationId: string
  ): Promise<string> {
    const calendarId = `service_${serviceType}_${organizationId}`;
    
    const calendar: CalendarConfig = {
      id: calendarId,
      name: `${serviceType} - Service Delivery Calendar`,
      description: `Service delivery calendar for ${serviceType} case management and client appointments`,
      timeZone: 'America/Los_Angeles',
      colorId: '11',
      type: 'service_delivery',
      ownerId: managerId,
      permissions: {
        read: ['staff', 'manager', 'supervisor'],
        write: ['staff', 'manager'],
        manage: ['manager', 'supervisor']
      },
      syncRules: [],
      active: true
    };

    this.calendars.set(calendarId, calendar);
    this.saveCalendarConfigurations();

    console.log(`🤝 Created service delivery calendar for ${serviceType}:`, calendarId);
    return calendarId;
  }

  /**
   * Create bed registration event
   */
  async createBedRegistrationEvent(
    registration: BedRegistration,
    shelterCalendarId: string,
    clientCalendarId?: string
  ): Promise<string> {
    const eventId = `bed_reg_${registration.id}_${Date.now()}`;
    
    const event: GoogleCalendarEvent = {
      id: eventId,
      summary: `Bed Registration - ${registration.clientName}`,
      description: `
Bed Registration Details:
- Client: ${registration.clientName}
- Shelter: ${registration.shelterName}
- Check-in: ${registration.checkInDate.toLocaleDateString()}
- Expected Check-out: ${registration.expectedCheckOutDate?.toLocaleDateString() || 'TBD'}
- Bed Type: ${registration.bedType}
- Status: ${registration.status}

Special Requirements:
${registration.specialNeeds?.join(', ') || 'None'}

Medical Notes: ${registration.medicalNotes || 'None'}
Behavioral Notes: ${registration.behavioralNotes || 'None'}
      `.trim(),
      start: {
        date: registration.checkInDate.toISOString().split('T')[0],
        timeZone: 'America/Los_Angeles'
      },
      end: {
        date: registration.expectedCheckOutDate 
          ? registration.expectedCheckOutDate.toISOString().split('T')[0]
          : new Date(registration.checkInDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        timeZone: 'America/Los_Angeles'
      },
      attendees: [
        {
          email: `client_${registration.clientId}@system.local`,
          displayName: registration.clientName,
          responseStatus: 'accepted'
        }
      ],
      location: registration.shelterName,
      colorId: '7',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
          { method: 'popup', minutes: 60 }
        ]
      },
      extendedProperties: {
        private: {
          registrationId: registration.id,
          clientId: registration.clientId,
          shelterId: registration.shelterId,
          eventType: 'bed_registration'
        }
      }
    };

    await this.addEventToCalendar(shelterCalendarId, event);

    if (clientCalendarId) {
      const clientEvent = {
        ...event,
        summary: `Shelter Stay - ${registration.shelterName}`,
        description: `
Your shelter stay details:
- Shelter: ${registration.shelterName}
- Check-in: ${registration.checkInDate.toLocaleDateString()}
- Expected duration: ${Math.ceil((registration.expectedCheckOutDate?.getTime() || Date.now() + 30 * 24 * 60 * 60 * 1000 - registration.checkInDate.getTime()) / (24 * 60 * 60 * 1000))} days

Remember to follow shelter guidelines and contact staff if you need assistance.
        `.trim(),
        colorId: '2'
      };
      await this.addEventToCalendar(clientCalendarId, clientEvent);
    }

    console.log(`📅 Created bed registration event: ${eventId}`);
    return eventId;
  }

  /**
   * Set up calendar synchronization
   */
  async setupCalendarSync(
    clientId: string,
    clientCalendarId: string,
    serviceDeliveryCalendarId: string
  ): Promise<string> {
    const syncRuleId = `sync_${clientId}_${Date.now()}`;
    
    const syncRule: CalendarSyncRule = {
      id: syncRuleId,
      sourceCalendarId: clientCalendarId,
      targetCalendarId: serviceDeliveryCalendarId,
      eventTypes: ['appointment', 'case_meeting', 'service_delivery'],
      syncDirection: 'two_way',
      filterRules: {
        includeKeywords: ['appointment', 'meeting', 'service', 'case'],
        excludeKeywords: ['personal', 'private'],
        timeRange: {
          start: '06:00',
          end: '20:00'
        }
      },
      transformations: {
        titlePrefix: '[Client] ',
        descriptionTemplate: 'Client appointment - see staff calendar for details'
      },
      active: true
    };

    this.syncRules.set(syncRuleId, syncRule);
    
    const sourceCalendar = this.calendars.get(clientCalendarId);
    const targetCalendar = this.calendars.get(serviceDeliveryCalendarId);
    
    if (sourceCalendar) {
      sourceCalendar.syncRules.push(syncRule);
    }
    if (targetCalendar) {
      targetCalendar.syncRules.push(syncRule);
    }

    this.saveCalendarConfigurations();

    console.log(`🔄 Set up calendar synchronization: ${syncRuleId}`);
    return syncRuleId;
  }

  /**
   * Synchronize calendars
   */
  async synchronizeCalendars(): Promise<void> {
    try {
      console.log('🔄 Starting calendar synchronization...');
      
      const syncRules = Array.from(this.syncRules.values());
      for (const syncRule of syncRules) {
        if (!syncRule.active) continue;
        await this.executeSyncRule(syncRule);
      }

      console.log('✅ Calendar synchronization completed');
    } catch (error) {
      console.error('Calendar synchronization failed:', error);
    }
  }

  /**
   * Execute sync rule
   */
  private async executeSyncRule(syncRule: CalendarSyncRule): Promise<void> {
    try {
      const sourceEvents = await this.getCalendarEvents(syncRule.sourceCalendarId);
      const targetEvents = await this.getCalendarEvents(syncRule.targetCalendarId);

      const eventsToSync = sourceEvents.filter(event => 
        this.shouldSyncEvent(event, syncRule)
      );

      for (const event of eventsToSync) {
        const existingEvent = targetEvents.find(te => 
          te.extendedProperties?.private?.syncedFrom === event.id
        );

        if (existingEvent) {
          await this.updateSyncedEvent(existingEvent, event, syncRule);
        } else {
          await this.createSyncedEvent(event, syncRule);
        }
      }

      console.log(`✅ Sync rule executed: ${syncRule.id}`);
    } catch (error) {
      console.error(`Failed to execute sync rule ${syncRule.id}:`, error);
    }
  }

  /**
   * Add event to calendar
   */
  private async addEventToCalendar(calendarId: string, event: GoogleCalendarEvent): Promise<void> {
    const storageKey = `calendar_events_${calendarId}`;
    const existingEvents = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingEvents.push(event);
    localStorage.setItem(storageKey, JSON.stringify(existingEvents));
    
    console.log(`➕ Added event to calendar ${calendarId}:`, event.summary);
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(calendarId: string): Promise<GoogleCalendarEvent[]> {
    const storageKey = `calendar_events_${calendarId}`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  /**
   * Check if event should be synced
   */
  private shouldSyncEvent(event: GoogleCalendarEvent, syncRule: CalendarSyncRule): boolean {
    const eventType = event.extendedProperties?.private?.eventType;
    if (eventType && !syncRule.eventTypes.includes(eventType)) {
      return false;
    }

    if (syncRule.filterRules?.includeKeywords) {
      const hasIncludeKeyword = syncRule.filterRules.includeKeywords.some(keyword =>
        event.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        event.description?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasIncludeKeyword) return false;
    }

    if (syncRule.filterRules?.excludeKeywords) {
      const hasExcludeKeyword = syncRule.filterRules.excludeKeywords.some(keyword =>
        event.summary.toLowerCase().includes(keyword.toLowerCase()) ||
        event.description?.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasExcludeKeyword) return false;
    }

    return true;
  }

  /**
   * Create synced event
   */
  private async createSyncedEvent(sourceEvent: GoogleCalendarEvent, syncRule: CalendarSyncRule): Promise<void> {
    const syncedEvent: GoogleCalendarEvent = {
      ...sourceEvent,
      id: `synced_${sourceEvent.id}_${Date.now()}`,
      extendedProperties: {
        ...sourceEvent.extendedProperties,
        private: {
          ...sourceEvent.extendedProperties?.private,
          syncedFrom: sourceEvent.id,
          syncRuleId: syncRule.id
        }
      }
    };

    if (syncRule.transformations?.titlePrefix) {
      syncedEvent.summary = syncRule.transformations.titlePrefix + syncedEvent.summary;
    }
    if (syncRule.transformations?.descriptionTemplate) {
      syncedEvent.description = syncRule.transformations.descriptionTemplate;
    }
    if (syncRule.transformations?.locationOverride) {
      syncedEvent.location = syncRule.transformations.locationOverride;
    }

    await this.addEventToCalendar(syncRule.targetCalendarId, syncedEvent);
  }

  /**
   * Update synced event
   */
  private async updateSyncedEvent(
    existingEvent: GoogleCalendarEvent,
    sourceEvent: GoogleCalendarEvent,
    syncRule: CalendarSyncRule
  ): Promise<void> {
    const updatedEvent: GoogleCalendarEvent = {
      ...sourceEvent,
      id: existingEvent.id,
      extendedProperties: existingEvent.extendedProperties
    };

    if (syncRule.transformations?.titlePrefix) {
      updatedEvent.summary = syncRule.transformations.titlePrefix + sourceEvent.summary;
    }

    const storageKey = `calendar_events_${syncRule.targetCalendarId}`;
    const events = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const eventIndex = events.findIndex((e: GoogleCalendarEvent) => e.id === existingEvent.id);
    if (eventIndex !== -1) {
      events[eventIndex] = updatedEvent;
      localStorage.setItem(storageKey, JSON.stringify(events));
    }
  }

  /**
   * Get user calendars
   */
  async getUserCalendars(userId: string): Promise<CalendarConfig[]> {
    const allCalendars = Array.from(this.calendars.values());
    return allCalendars.filter(calendar =>
      calendar.ownerId === userId ||
      calendar.permissions.read.includes(userId) ||
      calendar.permissions.read.includes('staff') ||
      calendar.permissions.read.includes('manager')
    );
  }

  /**
   * Get calendar overview
   */
  async getCalendarOverview(userId: string): Promise<{
    personalCalendar?: CalendarConfig;
    syncedCalendars: CalendarConfig[];
    upcomingEvents: GoogleCalendarEvent[];
    syncStatus: 'active' | 'error' | 'disabled';
  }> {
    const personalSettings = this.personalSettings.get(userId);
    const personalCalendar = personalSettings 
      ? this.calendars.get(personalSettings.primaryCalendarId)
      : undefined;
    
    const syncedCalendars = personalSettings?.syncedCalendars
      .map(id => this.calendars.get(id))
      .filter(Boolean) as CalendarConfig[] || [];

    const userCalendars = await this.getUserCalendars(userId);
    const upcomingEvents: GoogleCalendarEvent[] = [];
    
    for (const calendar of userCalendars) {
      const events = await this.getCalendarEvents(calendar.id);
      const futureEvents = events.filter(event => {
        const eventDate = new Date(event.start.dateTime || event.start.date || '');
        return eventDate > new Date();
      }).slice(0, 5);
      
      upcomingEvents.push(...futureEvents);
    }

    upcomingEvents.sort((a, b) => {
      const dateA = new Date(a.start.dateTime || a.start.date || '');
      const dateB = new Date(b.start.dateTime || b.start.date || '');
      return dateA.getTime() - dateB.getTime();
    });

    return {
      personalCalendar,
      syncedCalendars,
      upcomingEvents: upcomingEvents.slice(0, 10),
      syncStatus: 'active'
    };
  }

  /**
   * Get color by user type
   */
  private getColorByUserType(userType: string): string {
    const colors = {
      client: '3',
      staff: '6',
      manager: '11',
      shelter: '9',
      service: '10'
    };
    return colors[userType as keyof typeof colors] || '1';
  }

  /**
   * Save calendar configurations
   */
  private saveCalendarConfigurations(): void {
    const configData = {
      calendars: Array.from(this.calendars.entries()),
      syncRules: Array.from(this.syncRules.entries()),
      personalSettings: Array.from(this.personalSettings.entries()),
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('google_calendar_config', JSON.stringify(configData));
  }

  /**
   * Load calendar configurations
   */
  private loadCalendarConfigurations(): void {
    try {
      const configData = localStorage.getItem('google_calendar_config');
      if (configData) {
        const config = JSON.parse(configData);
        
        this.calendars = new Map(config.calendars);
        this.syncRules = new Map(config.syncRules);
        this.personalSettings = new Map(config.personalSettings);
        
        console.log('📅 Calendar configurations loaded');
      }
    } catch (error) {
      console.error('Failed to load calendar configurations:', error);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();