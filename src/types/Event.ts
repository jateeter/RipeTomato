export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  category: 'community' | 'sports' | 'arts' | 'business' | 'education' | 'family' | 'food' | 'other';
  organizer: string;
  contact?: string;
  website?: string;
  isRecurring?: boolean;
  tags?: string[];
  // Google Calendar integration fields
  googleCalendarId?: string;
  googleEventId?: string;
  lastSynced?: Date;
  syncStatus?: 'synced' | 'pending' | 'error' | 'local-only';
}

export interface WeeklyCalendar {
  weekStart: Date;
  weekEnd: Date;
  events: Event[];
}