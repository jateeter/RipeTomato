import { Event } from '../types/Event';
import { GOOGLE_CONFIG, GOOGLE_CALENDAR_CONFIG } from '../config/googleConfig';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GoogleCalendarEvent {
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
  location?: string;
  organizer?: {
    displayName?: string;
    email?: string;
  };
  htmlLink?: string;
  status?: string;
}

class GoogleCalendarService {
  private isInitialized = false;
  private isSignedIn = false;
  private gapi: any = null;

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

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
}

export const googleCalendarService = new GoogleCalendarService();