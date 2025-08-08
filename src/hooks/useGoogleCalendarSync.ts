import { useState, useCallback } from 'react';
import { Event } from '../types/Event';
import { googleCalendarService } from '../services/googleCalendarService';
import { mockEvents } from '../data/mockEvents';

interface SyncState {
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  syncedEventsCount: number;
}

export const useGoogleCalendarSync = () => {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    error: null,
    lastSyncTime: null,
    syncedEventsCount: 0
  });

  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

  const syncFromGoogleCalendar = useCallback(async (startDate: Date, endDate: Date): Promise<Event[]> => {
    if (!isGoogleSignedIn) {
      throw new Error('Not signed in to Google Calendar');
    }

    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const googleEvents = await googleCalendarService.getEvents(startDate, endDate);
      
      // Merge Google events with local events
      const localEvents = events.filter(event => !event.googleEventId);
      const mergedEvents = [...localEvents, ...googleEvents];
      
      setEvents(mergedEvents);
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: new Date(),
        syncedEventsCount: googleEvents.length
      }));

      return mergedEvents;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with Google Calendar';
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [isGoogleSignedIn, events]);

  const syncToGoogleCalendar = useCallback(async (event: Event): Promise<Event> => {
    if (!isGoogleSignedIn) {
      throw new Error('Not signed in to Google Calendar');
    }

    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let updatedEvent: Event;

      if (event.googleEventId) {
        // Update existing Google Calendar event
        await googleCalendarService.updateEvent(event);
        updatedEvent = {
          ...event,
          lastSynced: new Date(),
          syncStatus: 'synced'
        };
      } else {
        // Create new Google Calendar event
        const googleEventId = await googleCalendarService.createEvent(event);
        updatedEvent = {
          ...event,
          googleEventId,
          lastSynced: new Date(),
          syncStatus: 'synced'
        };
      }

      // Update local events
      setEvents(prevEvents => 
        prevEvents.map(e => e.id === event.id ? updatedEvent : e)
      );

      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: new Date()
      }));

      return updatedEvent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync to Google Calendar';
      
      // Update event with error status
      const errorEvent = {
        ...event,
        syncStatus: 'error' as const
      };
      
      setEvents(prevEvents => 
        prevEvents.map(e => e.id === event.id ? errorEvent : e)
      );

      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [isGoogleSignedIn]);

  const deleteFromGoogleCalendar = useCallback(async (event: Event): Promise<void> => {
    if (!isGoogleSignedIn || !event.googleEventId) {
      throw new Error('Not signed in to Google Calendar or event not synced');
    }

    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await googleCalendarService.deleteEvent(event.googleEventId);
      
      // Remove from local events or mark as local-only
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id 
            ? { ...e, googleEventId: undefined, syncStatus: 'local-only' as const }
            : e
        )
      );

      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: new Date()
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete from Google Calendar';
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, [isGoogleSignedIn]);

  const addLocalEvent = useCallback((newEvent: Event) => {
    const eventWithDefaults = {
      ...newEvent,
      syncStatus: 'local-only' as const
    };
    setEvents(prevEvents => [...prevEvents, eventWithDefaults]);
    return eventWithDefaults;
  }, []);

  const updateLocalEvent = useCallback((updatedEvent: Event) => {
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  }, []);

  const deleteLocalEvent = useCallback((eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  }, []);

  const handleAuthChange = useCallback((signedIn: boolean) => {
    setIsGoogleSignedIn(signedIn);
    if (!signedIn) {
      // Clear Google Calendar events when signed out
      setEvents(prevEvents => 
        prevEvents.filter(event => !event.googleEventId)
      );
      setSyncState({
        isLoading: false,
        error: null,
        lastSyncTime: null,
        syncedEventsCount: 0
      });
    }
  }, []);

  return {
    events,
    syncState,
    isGoogleSignedIn,
    syncFromGoogleCalendar,
    syncToGoogleCalendar,
    deleteFromGoogleCalendar,
    addLocalEvent,
    updateLocalEvent,
    deleteLocalEvent,
    handleAuthChange
  };
};