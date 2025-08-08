import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  getDatetime,
  getBoolean,
  getUrl,
  setThing,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  setStringNoLocale,
  setDatetime,
  setBoolean,
  setUrl,
  buildThing,
  getContainedResourceUrlAll,
  deleteSolidDataset,
  getSourceUrl
} from '@inrupt/solid-client';
import { RDF, FOAF, VCARD, DCTERMS } from '@inrupt/vocab-common-rdf';
import { solidAuthService } from './solidAuthService';
import { SOLID_CONFIG } from '../config/solidConfig';
import { Client, BedReservation, CheckInSession } from '../types/Shelter';

// Custom vocabulary for shelter data
const SHELTER = {
  Client: 'https://shelter.vocab/Client',
  BedReservation: 'https://shelter.vocab/BedReservation',
  CheckInSession: 'https://shelter.vocab/CheckInSession',
  hasEmergencyContact: 'https://shelter.vocab/hasEmergencyContact',
  hasMedicalNotes: 'https://shelter.vocab/hasMedicalNotes',
  hasBehavioralNotes: 'https://shelter.vocab/hasBehavioralNotes',
  hasRestrictions: 'https://shelter.vocab/hasRestrictions',
  preferredBedType: 'https://shelter.vocab/preferredBedType',
  totalStays: 'https://shelter.vocab/totalStays',
  lastStay: 'https://shelter.vocab/lastStay',
  isActive: 'https://shelter.vocab/isActive',
  identificationVerified: 'https://shelter.vocab/identificationVerified',
  bedId: 'https://shelter.vocab/bedId',
  clientId: 'https://shelter.vocab/clientId',
  reservationDate: 'https://shelter.vocab/reservationDate',
  checkInTime: 'https://shelter.vocab/checkInTime',
  checkOutTime: 'https://shelter.vocab/checkOutTime',
  status: 'https://shelter.vocab/status',
  priority: 'https://shelter.vocab/priority',
  reservationId: 'https://shelter.vocab/reservationId',
  consentGiven: 'https://shelter.vocab/consentGiven',
  consentDate: 'https://shelter.vocab/consentDate',
  dataRetentionPeriod: 'https://shelter.vocab/dataRetentionPeriod'
};

export interface SolidClientData extends Omit<Client, 'id'> {
  podUrl: string;
  consentGiven: boolean;
  consentDate: Date;
  dataRetentionPeriod: number; // days
}

class SolidDataService {
  private authenticatedFetch: typeof fetch;

  constructor() {
    this.authenticatedFetch = solidAuthService.getFetch();
  }

  /**
   * Create or update client data in their personal pod
   */
  async saveClientToPod(client: Client, consent: boolean = false): Promise<string | null> {
    try {
      if (!solidAuthService.isAuthenticated()) {
        throw new Error('User must be authenticated to save data to pod');
      }

      const webId = solidAuthService.getWebId();
      const podUrl = solidAuthService.getPodRootUrl();
      
      if (!webId || !podUrl) {
        throw new Error('Unable to determine user pod location');
      }

      // Create client dataset URL
      const clientDatasetUrl = `${podUrl}${SOLID_CONFIG.dataStructure.clients}${client.id}.ttl`;
      
      // Create or get existing dataset
      let dataset;
      try {
        dataset = await getSolidDataset(clientDatasetUrl, { fetch: this.authenticatedFetch });
      } catch (error) {
        // Dataset doesn't exist, create new one
        dataset = createSolidDataset();
      }

      // Build client data thing
      const clientThing = buildThing(createThing({ name: client.id }))
        .addUrl(RDF.type, SHELTER.Client)
        .addStringNoLocale(FOAF.firstName, client.firstName)
        .addStringNoLocale(FOAF.lastName, client.lastName)
        .addDatetime(VCARD.bday, client.dateOfBirth)
        .addStringNoLocale(VCARD.tel, client.phone || '')
        .addStringNoLocale(VCARD.email, client.email || '')
        .addStringNoLocale(SHELTER.hasMedicalNotes, client.medicalNotes || '')
        .addStringNoLocale(SHELTER.hasBehavioralNotes, client.behavioralNotes || '')
        .addStringNoLocale(SHELTER.preferredBedType, client.preferredBedType || 'standard')
        .addInteger(SHELTER.totalStays, client.totalStays)
        .addBoolean(SHELTER.isActive, client.isActive)
        .addBoolean(SHELTER.identificationVerified, client.identificationVerified)
        .addDatetime(DCTERMS.created, client.registrationDate)
        .addBoolean(SHELTER.consentGiven, consent)
        .addDatetime(SHELTER.consentDate, new Date())
        .addInteger(SHELTER.dataRetentionPeriod, 365) // 1 year default
        .build();

      // Add emergency contact if present
      if (client.emergencyContact) {
        const emergencyThing = buildThing(createThing({ name: `${client.id}-emergency` }))
          .addStringNoLocale(FOAF.name, client.emergencyContact.name)
          .addStringNoLocale(VCARD.tel, client.emergencyContact.phone)
          .addStringNoLocale(VCARD.role, client.emergencyContact.relationship)
          .build();
        
        dataset = setThing(dataset, emergencyThing);
      }

      // Add last stay date if present
      if (client.lastStay) {
        buildThing(clientThing)
          .addDatetime(SHELTER.lastStay, client.lastStay)
          .build();
      }

      // Save client thing to dataset
      dataset = setThing(dataset, clientThing);

      // Save dataset to pod
      await saveSolidDatasetAt(clientDatasetUrl, dataset, { fetch: this.authenticatedFetch });
      
      return clientDatasetUrl;
    } catch (error) {
      console.error('Failed to save client to pod:', error);
      throw error;
    }
  }

  /**
   * Retrieve client data from pod
   */
  async getClientFromPod(clientId: string, podUrl?: string): Promise<SolidClientData | null> {
    try {
      const targetPodUrl = podUrl || solidAuthService.getPodRootUrl();
      
      if (!targetPodUrl) {
        throw new Error('Pod URL not available');
      }

      const clientDatasetUrl = `${targetPodUrl}${SOLID_CONFIG.dataStructure.clients}${clientId}.ttl`;
      
      const dataset = await getSolidDataset(clientDatasetUrl, { fetch: this.authenticatedFetch });
      const clientThing = getThing(dataset, `${clientDatasetUrl}#${clientId}`);
      
      if (!clientThing) {
        return null;
      }

      // Extract client data
      const clientData: SolidClientData = {
        firstName: getStringNoLocale(clientThing, FOAF.firstName) || '',
        lastName: getStringNoLocale(clientThing, FOAF.lastName) || '',
        dateOfBirth: getDatetime(clientThing, VCARD.bday) || new Date(),
        phone: getStringNoLocale(clientThing, VCARD.tel) || undefined,
        email: getStringNoLocale(clientThing, VCARD.email) || undefined,
        medicalNotes: getStringNoLocale(clientThing, SHELTER.hasMedicalNotes) || undefined,
        behavioralNotes: getStringNoLocale(clientThing, SHELTER.hasBehavioralNotes) || undefined,
        preferredBedType: getStringNoLocale(clientThing, SHELTER.preferredBedType) as any || 'standard',
        totalStays: parseInt(getStringNoLocale(clientThing, SHELTER.totalStays) || '0'),
        isActive: getBoolean(clientThing, SHELTER.isActive) || false,
        identificationVerified: getBoolean(clientThing, SHELTER.identificationVerified) || false,
        registrationDate: getDatetime(clientThing, DCTERMS.created) || new Date(),
        podUrl: targetPodUrl,
        consentGiven: getBoolean(clientThing, SHELTER.consentGiven) || false,
        consentDate: getDatetime(clientThing, SHELTER.consentDate) || new Date(),
        dataRetentionPeriod: parseInt(getStringNoLocale(clientThing, SHELTER.dataRetentionPeriod) || '365'),
        restrictions: [], // Would need to be stored as separate things or in an array format
        lastStay: getDatetime(clientThing, SHELTER.lastStay) || undefined
      };

      // Get emergency contact if exists
      try {
        const emergencyThing = getThing(dataset, `${clientDatasetUrl}#${clientId}-emergency`);
        if (emergencyThing) {
          clientData.emergencyContact = {
            name: getStringNoLocale(emergencyThing, FOAF.name) || '',
            phone: getStringNoLocale(emergencyThing, VCARD.tel) || '',
            relationship: getStringNoLocale(emergencyThing, VCARD.role) || ''
          };
        }
      } catch (error) {
        // Emergency contact not found, continue without it
      }

      return clientData;
    } catch (error) {
      console.error('Failed to get client from pod:', error);
      throw error;
    }
  }

  /**
   * Save bed reservation data
   */
  async saveReservationToPod(reservation: BedReservation, clientPodUrl: string): Promise<string | null> {
    try {
      if (!solidAuthService.isAuthenticated()) {
        throw new Error('User must be authenticated');
      }

      const reservationDatasetUrl = `${clientPodUrl}${SOLID_CONFIG.dataStructure.shelter}reservations/${reservation.id}.ttl`;
      
      let dataset;
      try {
        dataset = await getSolidDataset(reservationDatasetUrl, { fetch: this.authenticatedFetch });
      } catch (error) {
        dataset = createSolidDataset();
      }

      const reservationThing = buildThing(createThing({ name: reservation.id }))
        .addUrl(RDF.type, SHELTER.BedReservation)
        .addStringNoLocale(SHELTER.bedId, reservation.bedId)
        .addStringNoLocale(SHELTER.clientId, reservation.clientId)
        .addDatetime(SHELTER.reservationDate, reservation.reservationDate)
        .addStringNoLocale(SHELTER.status, reservation.status)
        .addStringNoLocale(SHELTER.priority, reservation.priority)
        .addStringNoLocale(DCTERMS.creator, reservation.createdBy)
        .addDatetime(DCTERMS.created, reservation.createdAt)
        .addDatetime(DCTERMS.modified, reservation.updatedAt)
        .build();

      dataset = setThing(dataset, reservationThing);
      await saveSolidDatasetAt(reservationDatasetUrl, dataset, { fetch: this.authenticatedFetch });
      
      return reservationDatasetUrl;
    } catch (error) {
      console.error('Failed to save reservation to pod:', error);
      throw error;
    }
  }

  /**
   * Save check-in session data
   */
  async saveCheckInSessionToPod(session: CheckInSession, clientPodUrl: string): Promise<string | null> {
    try {
      if (!solidAuthService.isAuthenticated()) {
        throw new Error('User must be authenticated');
      }

      const sessionDatasetUrl = `${clientPodUrl}${SOLID_CONFIG.dataStructure.shelter}checkins/${session.id}.ttl`;
      
      let dataset;
      try {
        dataset = await getSolidDataset(sessionDatasetUrl, { fetch: this.authenticatedFetch });
      } catch (error) {
        dataset = createSolidDataset();
      }

      const sessionThing = buildThing(createThing({ name: session.id }))
        .addUrl(RDF.type, SHELTER.CheckInSession)
        .addStringNoLocale(SHELTER.reservationId, session.reservationId)
        .addStringNoLocale(SHELTER.clientId, session.clientId)
        .addDatetime(DCTERMS.created, session.startTime)
        .addStringNoLocale(SHELTER.status, session.status)
        .addBoolean('https://shelter.vocab/identityVerified', session.verificationSteps.identityVerified)
        .addBoolean('https://shelter.vocab/photoTaken', session.verificationSteps.photoTaken)
        .addBoolean('https://shelter.vocab/rulesAcknowledged', session.verificationSteps.rulesAcknowledged)
        .addBoolean('https://shelter.vocab/medicalScreening', session.verificationSteps.medicalScreening)
        .addBoolean('https://shelter.vocab/belongingsChecked', session.verificationSteps.belongingsChecked)
        .build();

      if (session.completedTime) {
        buildThing(sessionThing)
          .addDatetime(DCTERMS.modified, session.completedTime)
          .build();
      }

      if (session.notes) {
        buildThing(sessionThing)
          .addStringNoLocale(DCTERMS.description, session.notes)
          .build();
      }

      dataset = setThing(dataset, sessionThing);
      await saveSolidDatasetAt(sessionDatasetUrl, dataset, { fetch: this.authenticatedFetch });
      
      return sessionDatasetUrl;
    } catch (error) {
      console.error('Failed to save check-in session to pod:', error);
      throw error;
    }
  }

  /**
   * Get all client IDs that have consented to data sharing
   */
  async getConsentedClients(): Promise<string[]> {
    try {
      const podUrl = solidAuthService.getPodRootUrl();
      if (!podUrl) return [];

      const clientsContainerUrl = `${podUrl}${SOLID_CONFIG.dataStructure.clients}`;
      
      // This would require iterating through all client datasets
      // For now, return empty array - full implementation would need proper container handling
      return [];
    } catch (error) {
      console.error('Failed to get consented clients:', error);
      return [];
    }
  }

  /**
   * Delete client data (for GDPR compliance)
   */
  async deleteClientData(clientId: string): Promise<boolean> {
    try {
      if (!solidAuthService.isAuthenticated()) {
        throw new Error('User must be authenticated');
      }

      const podUrl = solidAuthService.getPodRootUrl();
      if (!podUrl) return false;

      const clientDatasetUrl = `${podUrl}${SOLID_CONFIG.dataStructure.clients}${clientId}.ttl`;
      
      await deleteSolidDataset(clientDatasetUrl, { fetch: this.authenticatedFetch });
      return true;
    } catch (error) {
      console.error('Failed to delete client data:', error);
      return false;
    }
  }

  /**
   * Check if client has given consent for data sharing
   */
  async hasClientConsent(clientId: string, podUrl?: string): Promise<boolean> {
    try {
      const clientData = await this.getClientFromPod(clientId, podUrl);
      return clientData?.consentGiven || false;
    } catch (error) {
      console.error('Failed to check client consent:', error);
      return false;
    }
  }
}

export const solidDataService = new SolidDataService();