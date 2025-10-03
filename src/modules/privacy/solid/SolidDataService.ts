import { SolidSession } from './SolidAuthService';

export interface HealthRecord {
  date: string;
  type: string;
  provider: string;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
}

export class SolidDataService {
  private session: SolidSession;
  private baseUrl: string;

  constructor(session: SolidSession, baseUrl?: string) {
    this.session = session;
    this.baseUrl = baseUrl || '/idaho-events/';
  }

  async readProfile(): Promise<any> {
    if (!this.session.isLoggedIn || !this.session.webId) {
      throw new Error('Not authenticated');
    }

    if (typeof window === 'undefined') {
      throw new Error('Solid operations require browser environment');
    }

    try {
      const { getSolidDataset, getThing, getStringNoLocale } = await import('@inrupt/solid-client');

      const profileUrl = `${this.session.webId}${this.baseUrl}profile/card`;
      const dataset = await getSolidDataset(profileUrl, {
        fetch: fetch.bind(window)
      });

      const profile = getThing(dataset, profileUrl);

      return {
        name: profile ? getStringNoLocale(profile, 'http://xmlns.com/foaf/0.1/name') : undefined,
        webId: this.session.webId
      };
    } catch (error) {
      console.error('Failed to read profile:', error);
      throw error;
    }
  }

  async writeHealthRecord(record: HealthRecord): Promise<void> {
    if (!this.session.isLoggedIn || !this.session.webId) {
      throw new Error('Not authenticated');
    }

    if (typeof window === 'undefined') {
      throw new Error('Solid operations require browser environment');
    }

    try {
      const {
        getSolidDataset,
        setThing,
        buildThing,
        createThing,
        saveSolidDatasetAt
      } = await import('@inrupt/solid-client');

      const healthUrl = `${this.session.webId}${this.baseUrl}health/`;
      const recordUrl = `${healthUrl}${Date.now()}`;

      let dataset;
      try {
        dataset = await getSolidDataset(healthUrl, { fetch: fetch.bind(window) });
      } catch {
        // Create new dataset if it doesn't exist
        const { createSolidDataset } = await import('@inrupt/solid-client');
        dataset = createSolidDataset();
      }

      const recordThing = buildThing(createThing({ url: recordUrl }))
        .addStringNoLocale('http://schema.org/date', record.date)
        .addStringNoLocale('http://schema.org/type', record.type)
        .addStringNoLocale('http://schema.org/provider', record.provider)
        .addStringNoLocale('http://schema.org/description', record.notes)
        .build();

      const updatedDataset = setThing(dataset, recordThing);
      await saveSolidDatasetAt(healthUrl, updatedDataset, { fetch: fetch.bind(window) });
    } catch (error) {
      console.error('Failed to write health record:', error);
      throw error;
    }
  }

  async listCalendarEvents(): Promise<CalendarEvent[]> {
    if (!this.session.isLoggedIn || !this.session.webId) {
      throw new Error('Not authenticated');
    }

    if (typeof window === 'undefined') {
      throw new Error('Solid operations require browser environment');
    }

    try {
      const { getSolidDataset, getThingAll, getStringNoLocale } = await import('@inrupt/solid-client');

      const calendarUrl = `${this.session.webId}${this.baseUrl}calendar/`;
      const dataset = await getSolidDataset(calendarUrl, { fetch: fetch.bind(window) });

      const things = getThingAll(dataset);

      return things.map(thing => ({
        id: thing.url,
        title: getStringNoLocale(thing, 'http://schema.org/name') || '',
        date: getStringNoLocale(thing, 'http://schema.org/startDate') || '',
        time: getStringNoLocale(thing, 'http://schema.org/startTime') || '',
        description: getStringNoLocale(thing, 'http://schema.org/description')
      }));
    } catch (error) {
      console.error('Failed to list calendar events:', error);
      return [];
    }
  }

  async writeData(path: string, data: any): Promise<void> {
    if (!this.session.isLoggedIn || !this.session.webId) {
      throw new Error('Not authenticated');
    }

    if (typeof window === 'undefined') {
      throw new Error('Solid operations require browser environment');
    }

    try {
      const { overwriteFile } = await import('@inrupt/solid-client');

      const dataUrl = `${this.session.webId}${this.baseUrl}${path}`;
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

      await overwriteFile(dataUrl, blob, { fetch: fetch.bind(window) });
    } catch (error) {
      console.error('Failed to write data:', error);
      throw error;
    }
  }

  async readData(path: string): Promise<any> {
    if (!this.session.isLoggedIn || !this.session.webId) {
      throw new Error('Not authenticated');
    }

    if (typeof window === 'undefined') {
      throw new Error('Solid operations require browser environment');
    }

    try {
      const { getFile } = await import('@inrupt/solid-client');

      const dataUrl = `${this.session.webId}${this.baseUrl}${path}`;
      const file = await getFile(dataUrl, { fetch: fetch.bind(window) });

      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to read data:', error);
      throw error;
    }
  }
}
