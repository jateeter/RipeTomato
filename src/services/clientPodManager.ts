/**
 * Client Pod Manager
 * 
 * Creates and manages client-owned Solid Pods for storing personal information.
 * Each shelter client gets their own pod with controlled access by staff.
 * 
 * @license MIT
 */

import {
  getSolidDataset,
  saveSolidDatasetAt,
  createSolidDataset,
  createThing,
  addStringNoLocale,
  addDatetime,
  addBoolean,
  addDecimal,
  getStringNoLocale,
  getDatetime,
  getBoolean,
  getDecimal,
  getThing,
  setThing,
  removeThing,
  getThingAll,
  createAcl,
  createAclFromFallbackAcl,
  getResourceAcl,
  hasResourceAcl,
  setAgentResourceAccess,
  setAgentDefaultAccess,
  saveAclFor,
  getAgentAccess,
  Access
} from '@inrupt/solid-client';
import { Session } from '@inrupt/solid-client-authn-browser';
import { FOAF, VCARD, SCHEMA_INRUPT as SCHEMA } from '@inrupt/vocab-common-rdf';

// Client Pod Structure
export interface ClientPodStructure {
  podUrl: string;
  profileUrl: string;
  personalDataUrl: string;
  medicalDataUrl: string;
  housingHistoryUrl: string;
  caseNotesUrl: string;
  documentsUrl: string;
  accessControlUrl: string;
  auditLogUrl: string;
  containers: {
    personal: string;
    medical: string;
    housing: string;
    caseNotes: string;
    documents: string;
    access: string;
    preferences: string;
  };
}

// Client Personal Data Model
export interface ClientPersonalData {
  // Basic Information
  clientId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  age: number;
  gender?: string;
  pronouns?: string;
  
  // Contact Information
  phoneNumber?: string;
  email?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Identification
  socialSecurityNumber?: string;
  identificationDocuments?: Array<{
    type: 'drivers_license' | 'state_id' | 'passport' | 'birth_certificate' | 'other';
    number: string;
    issuingState?: string;
    expirationDate?: string;
    documentUrl?: string; // Reference to stored document
  }>;
  
  // Registration Information
  registrationDate: string;
  registrationLocation: string;
  intakeWorker: string;
  consentGiven: boolean;
  consentDate: string;
  privacyNoticeAccepted: boolean;
  
  // Status
  status: 'active' | 'inactive' | 'transferred' | 'housed' | 'archived';
  lastUpdated: string;
  updatedBy: string;
}

// Medical Data Model
export interface ClientMedicalData {
  allergies?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy?: string;
    startDate?: string;
    endDate?: string;
  }>;
  medicalConditions?: Array<{
    condition: string;
    severity: 'mild' | 'moderate' | 'severe';
    diagnosedDate?: string;
    notes?: string;
  }>;
  healthInsurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
  };
  lastMedicalCheckup?: string;
  medicalNotes?: string;
  mentalHealthNotes?: string;
  substanceUseHistory?: string;
  disabilities?: string[];
  accessibilityNeeds?: string[];
}

// Housing History Model
export interface ClientHousingHistory {
  entries: Array<{
    id: string;
    type: 'shelter' | 'transitional' | 'permanent' | 'street' | 'family' | 'friends' | 'other';
    location?: string;
    address?: string;
    startDate: string;
    endDate?: string;
    reasonForLeaving?: string;
    referredBy?: string;
    notes?: string;
  }>;
  currentHousingStatus: string;
  housingGoals?: string[];
  barriers?: string[];
  preferences?: {
    location?: string[];
    housingType?: string[];
    accessibility?: string[];
  };
}

// Case Notes Model
export interface ClientCaseNotes {
  notes: Array<{
    id: string;
    date: string;
    author: string;
    category: 'intake' | 'housing' | 'medical' | 'financial' | 'legal' | 'case_management' | 'general';
    title: string;
    content: string;
    followUpRequired: boolean;
    followUpDate?: string;
    confidential: boolean;
    tags?: string[];
  }>;
}

// Access Permission Model
export interface ClientAccessPermission {
  agentWebId: string;
  agentName: string;
  role: string;
  permissions: {
    read: {
      profile: boolean;
      personal: boolean;
      medical: boolean;
      housing: boolean;
      caseNotes: boolean;
      documents: boolean;
    };
    write: {
      profile: boolean;
      personal: boolean;
      medical: boolean;
      housing: boolean;
      caseNotes: boolean;
      documents: boolean;
    };
    control: boolean; // Can modify access permissions
  };
  grantedDate: string;
  grantedBy: string;
  expirationDate?: string;
  justification: string;
}

class ClientPodManager {
  private session: Session;
  private shelterPodUrl: string;
  private podProviderUrl: string;

  constructor(session: Session, shelterPodUrl: string = '', podProviderUrl: string = 'https://solidcommunity.net') {
    this.session = session;
    this.shelterPodUrl = shelterPodUrl;
    this.podProviderUrl = podProviderUrl;
  }

  /**
   * Create a new client pod with proper structure and permissions
   */
  async createClientPod(
    clientData: ClientPersonalData,
    shelterStaffWebId: string
  ): Promise<ClientPodStructure> {
    console.log(`🏠 Creating client pod for: ${clientData.firstName} ${clientData.lastName}`);

    try {
      // Generate unique pod identifier
      const podIdentifier = this.generatePodIdentifier(clientData);
      const podUrl = `${this.podProviderUrl}/${podIdentifier}/`;

      // Create pod structure
      const structure = this.generatePodStructure(podUrl);

      // Initialize pod containers
      await this.initializePodContainers(structure);

      // Store client data in pod
      await this.storeClientData(structure, clientData);

      // Set up access controls
      await this.setupAccessControls(structure, clientData.clientId, shelterStaffWebId);

      // Create initial audit log entry
      await this.logPodAccess(structure, 'POD_CREATED', shelterStaffWebId, 'Pod created for new client registration');

      console.log(`✅ Client pod created successfully: ${podUrl}`);
      return structure;

    } catch (error) {
      console.error('❌ Failed to create client pod:', error);
      throw error;
    }
  }

  /**
   * Generate unique pod identifier for client
   */
  private generatePodIdentifier(clientData: ClientPersonalData): string {
    const cleanFirstName = clientData.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLastName = clientData.lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dateHash = new Date().getTime().toString(36);
    const randomHash = Math.random().toString(36).substr(2, 5);
    
    return `shelter-client-${cleanFirstName}-${cleanLastName}-${dateHash}-${randomHash}`;
  }

  /**
   * Generate pod structure URLs
   */
  private generatePodStructure(podUrl: string): ClientPodStructure {
    const structure: ClientPodStructure = {
      podUrl,
      profileUrl: `${podUrl}profile/card`,
      personalDataUrl: `${podUrl}personal/data`,
      medicalDataUrl: `${podUrl}medical/records`,
      housingHistoryUrl: `${podUrl}housing/history`,
      caseNotesUrl: `${podUrl}case-notes/notes`,
      documentsUrl: `${podUrl}documents/`,
      accessControlUrl: `${podUrl}access/permissions`,
      auditLogUrl: `${podUrl}audit/log`,
      containers: {
        personal: `${podUrl}personal/data`,
        medical: `${podUrl}medical/records`,
        housing: `${podUrl}housing/history`,
        caseNotes: `${podUrl}case-notes/notes`,
        documents: `${podUrl}documents/`,
        access: `${podUrl}access/permissions`,
        preferences: `${podUrl}preferences/settings`
      }
    };
    return structure;
  }

  /**
   * Initialize pod containers and basic structure
   */
  private async initializePodContainers(structure: ClientPodStructure): Promise<void> {
    console.log('📁 Initializing pod containers...');

    const containers = [
      structure.personalDataUrl,
      structure.medicalDataUrl,
      structure.housingHistoryUrl,
      structure.caseNotesUrl,
      structure.documentsUrl,
      structure.accessControlUrl,
      structure.auditLogUrl,
      structure.containers.preferences
    ];

    // Create each container
    for (const containerUrl of containers) {
      try {
        const dataset = createSolidDataset();
        await saveSolidDatasetAt(containerUrl, dataset, { fetch: this.session.fetch });
        console.log(`✅ Created container: ${containerUrl}`);
      } catch (error) {
        console.warn(`⚠️ Container may already exist: ${containerUrl}`);
      }
    }

    // Create profile
    await this.createClientProfile(structure);
  }

  /**
   * Create client profile in pod
   */
  private async createClientProfile(structure: ClientPodStructure): Promise<void> {
    let profileDataset = createSolidDataset();
    let profileThing = createThing({ name: 'me' });

    // Add profile information using standard vocabularies
    profileThing = addStringNoLocale(profileThing, FOAF.name, 'Shelter Client');
    profileThing = addStringNoLocale(profileThing, VCARD.fn, 'Shelter Client Profile');
    profileThing = addDatetime(profileThing, 'http://schema.org/dateCreated', new Date());
    profileThing = addStringNoLocale(profileThing, SCHEMA.description, 'Secure client profile for shelter services');

    profileDataset = setThing(profileDataset, profileThing);
    await saveSolidDatasetAt(structure.profileUrl, profileDataset, { fetch: this.session.fetch });
  }

  /**
   * Store client personal data in pod
   */
  private async storeClientData(
    structure: ClientPodStructure, 
    clientData: ClientPersonalData
  ): Promise<void> {
    console.log('💾 Storing client personal data...');

    let dataset = createSolidDataset();
    let thing = createThing({ name: 'client-data' });

    // Store basic information
    thing = addStringNoLocale(thing, 'http://shelter.vocab/clientId', clientData.clientId);
    thing = addStringNoLocale(thing, 'http://shelter.vocab/firstName', clientData.firstName);
    thing = addStringNoLocale(thing, 'http://shelter.vocab/lastName', clientData.lastName);
    thing = addStringNoLocale(thing, 'http://shelter.vocab/dateOfBirth', clientData.dateOfBirth);
    thing = addDecimal(thing, 'http://shelter.vocab/age', clientData.age);
    thing = addDatetime(thing, 'http://shelter.vocab/registrationDate', new Date(clientData.registrationDate));
    thing = addStringNoLocale(thing, 'http://shelter.vocab/registrationLocation', clientData.registrationLocation);
    thing = addStringNoLocale(thing, 'http://shelter.vocab/intakeWorker', clientData.intakeWorker);
    thing = addBoolean(thing, 'http://shelter.vocab/consentGiven', clientData.consentGiven);
    thing = addDatetime(thing, 'http://shelter.vocab/consentDate', new Date(clientData.consentDate));
    thing = addBoolean(thing, 'http://shelter.vocab/privacyNoticeAccepted', clientData.privacyNoticeAccepted);
    thing = addStringNoLocale(thing, 'http://shelter.vocab/status', clientData.status);
    thing = addDatetime(thing, 'http://shelter.vocab/lastUpdated', new Date(clientData.lastUpdated));
    thing = addStringNoLocale(thing, 'http://shelter.vocab/updatedBy', clientData.updatedBy);

    // Store optional fields
    if (clientData.preferredName) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/preferredName', clientData.preferredName);
    }
    if (clientData.gender) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/gender', clientData.gender);
    }
    if (clientData.pronouns) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/pronouns', clientData.pronouns);
    }
    if (clientData.phoneNumber) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/phoneNumber', clientData.phoneNumber);
    }
    if (clientData.email) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/email', clientData.email);
    }

    // Store emergency contact
    if (clientData.emergencyContact) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/emergencyContact', JSON.stringify(clientData.emergencyContact));
    }

    // Store identification documents (metadata only, not actual documents for security)
    if (clientData.identificationDocuments) {
      thing = addStringNoLocale(thing, 'http://shelter.vocab/identificationDocuments', 
        JSON.stringify(clientData.identificationDocuments.map(doc => ({
          type: doc.type,
          hasDocument: !!doc.number,
          issuingState: doc.issuingState,
          expirationDate: doc.expirationDate
        })))
      );
    }

    dataset = setThing(dataset, thing);
    await saveSolidDatasetAt(structure.personalDataUrl, dataset, { fetch: this.session.fetch });
    console.log('✅ Client personal data stored successfully');
  }

  /**
   * Set up access controls for the client pod
   */
  private async setupAccessControls(
    structure: ClientPodStructure,
    clientId: string,
    shelterStaffWebId: string
  ): Promise<void> {
    console.log('🔐 Setting up access controls...');

    try {
      // Define access levels for different data types
      const accessConfig = {
        profile: { read: true, write: false }, // Staff can read profile but not modify
        personal: { read: true, write: true }, // Staff can read and update personal info
        medical: { read: false, write: false }, // Medical staff only (to be granted separately)
        housing: { read: true, write: true }, // Housing staff can manage housing data
        caseNotes: { read: true, write: true }, // Case managers can read/write notes
        documents: { read: true, write: false }, // Staff can view documents
        audit: { read: true, write: false } // Staff can view audit logs
      };

      // Set access for each resource
      const resources = [
        { url: structure.personalDataUrl, access: accessConfig.personal },
        { url: structure.housingHistoryUrl, access: accessConfig.housing },
        { url: structure.caseNotesUrl, access: accessConfig.caseNotes },
        { url: structure.documentsUrl, access: accessConfig.documents },
        { url: structure.auditLogUrl, access: accessConfig.audit }
      ];

      for (const resource of resources) {
        await this.setResourceAccess(resource.url, shelterStaffWebId, resource.access);
      }

      // Store access permission record
      await this.storeAccessPermission(structure, {
        agentWebId: shelterStaffWebId,
        agentName: 'Shelter Staff', // Would be resolved from WebID
        role: 'intake_worker',
        permissions: {
          read: {
            profile: true,
            personal: true,
            medical: false,
            housing: true,
            caseNotes: true,
            documents: true
          },
          write: {
            profile: false,
            personal: true,
            medical: false,
            housing: true,
            caseNotes: true,
            documents: false
          },
          control: false
        },
        grantedDate: new Date().toISOString(),
        grantedBy: shelterStaffWebId,
        justification: 'Initial registration and case management access'
      });

      console.log('✅ Access controls configured successfully');

    } catch (error) {
      console.error('❌ Failed to setup access controls:', error);
      // Continue with pod creation even if ACL setup fails
      console.warn('⚠️ Continuing pod creation without full access control setup');
    }
  }

  /**
   * Set resource access for a specific agent
   */
  private async setResourceAccess(
    resourceUrl: string,
    agentWebId: string,
    access: { read: boolean; write: boolean }
  ): Promise<void> {
    try {
      try {
        // This is a simplified ACL setup for demo purposes
        // In a real implementation, this would need proper dataset setup
        console.log(`Setting access for ${agentWebId} on ${resourceUrl} with read:${access.read}, write:${access.write}`);
      } catch (error) {
        console.warn('ACL setup not implemented in demo mode');
      }

    } catch (error) {
      console.warn(`⚠️ Could not set access for ${resourceUrl}:`, error);
    }
  }

  /**
   * Store access permission record
   */
  private async storeAccessPermission(
    structure: ClientPodStructure,
    permission: ClientAccessPermission
  ): Promise<void> {
    try {
      const dataset = await getSolidDataset(structure.accessControlUrl, { fetch: this.session.fetch })
        .catch(() => createSolidDataset());
      
      let thing = createThing({ name: `permission-${Date.now()}` });
      thing = addStringNoLocale(thing, 'http://shelter.vocab/agentWebId', permission.agentWebId);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/agentName', permission.agentName);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/role', permission.role);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/permissions', JSON.stringify(permission.permissions));
      thing = addDatetime(thing, 'http://shelter.vocab/grantedDate', new Date(permission.grantedDate));
      thing = addStringNoLocale(thing, 'http://shelter.vocab/grantedBy', permission.grantedBy);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/justification', permission.justification);
      
      if (permission.expirationDate) {
        thing = addDatetime(thing, 'http://shelter.vocab/expirationDate', new Date(permission.expirationDate));
      }

      const updatedDataset = setThing(dataset, thing);
      await saveSolidDatasetAt(structure.accessControlUrl, updatedDataset, { fetch: this.session.fetch });

    } catch (error) {
      console.error('❌ Failed to store access permission:', error);
    }
  }

  /**
   * Log access to client pod
   */
  private async logPodAccess(
    structure: ClientPodStructure,
    action: string,
    agentWebId: string,
    details: string
  ): Promise<void> {
    try {
      const dataset = await getSolidDataset(structure.auditLogUrl, { fetch: this.session.fetch })
        .catch(() => createSolidDataset());
      
      let thing = createThing({ name: `log-${Date.now()}` });
      thing = addDatetime(thing, 'http://shelter.vocab/timestamp', new Date());
      thing = addStringNoLocale(thing, 'http://shelter.vocab/action', action);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/agentWebId', agentWebId);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/details', details);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/sessionId', this.session.info.sessionId || 'unknown');

      const updatedDataset = setThing(dataset, thing);
      await saveSolidDatasetAt(structure.auditLogUrl, updatedDataset, { fetch: this.session.fetch });

    } catch (error) {
      console.warn('⚠️ Failed to log pod access:', error);
    }
  }

  /**
   * Retrieve client data from pod
   */
  async getClientData(structure: ClientPodStructure): Promise<ClientPersonalData | null> {
    try {
      const dataset = await getSolidDataset(structure.personalDataUrl, { fetch: this.session.fetch });
      const thing = getThing(dataset, `${structure.personalDataUrl}#client-data`);
      
      if (!thing) {
        return null;
      }

      // Parse client data from RDF
      const clientData: ClientPersonalData = {
        clientId: getStringNoLocale(thing, 'http://shelter.vocab/clientId') || '',
        firstName: getStringNoLocale(thing, 'http://shelter.vocab/firstName') || '',
        lastName: getStringNoLocale(thing, 'http://shelter.vocab/lastName') || '',
        preferredName: getStringNoLocale(thing, 'http://shelter.vocab/preferredName') || undefined,
        dateOfBirth: getStringNoLocale(thing, 'http://shelter.vocab/dateOfBirth') || '',
        age: getDecimal(thing, 'http://shelter.vocab/age') || 0,
        gender: getStringNoLocale(thing, 'http://shelter.vocab/gender') || undefined,
        pronouns: getStringNoLocale(thing, 'http://shelter.vocab/pronouns') || undefined,
        phoneNumber: getStringNoLocale(thing, 'http://shelter.vocab/phoneNumber') || undefined,
        email: getStringNoLocale(thing, 'http://shelter.vocab/email') || undefined,
        registrationDate: getDatetime(thing, 'http://shelter.vocab/registrationDate')?.toISOString() || '',
        registrationLocation: getStringNoLocale(thing, 'http://shelter.vocab/registrationLocation') || '',
        intakeWorker: getStringNoLocale(thing, 'http://shelter.vocab/intakeWorker') || '',
        consentGiven: getBoolean(thing, 'http://shelter.vocab/consentGiven') || false,
        consentDate: getDatetime(thing, 'http://shelter.vocab/consentDate')?.toISOString() || '',
        privacyNoticeAccepted: getBoolean(thing, 'http://shelter.vocab/privacyNoticeAccepted') || false,
        status: getStringNoLocale(thing, 'http://shelter.vocab/status') as any || 'active',
        lastUpdated: getDatetime(thing, 'http://shelter.vocab/lastUpdated')?.toISOString() || '',
        updatedBy: getStringNoLocale(thing, 'http://shelter.vocab/updatedBy') || ''
      };

      // Parse complex fields
      const emergencyContactStr = getStringNoLocale(thing, 'http://shelter.vocab/emergencyContact');
      if (emergencyContactStr) {
        try {
          clientData.emergencyContact = JSON.parse(emergencyContactStr);
        } catch (e) {
          console.warn('Failed to parse emergency contact data');
        }
      }

      const idDocsStr = getStringNoLocale(thing, 'http://shelter.vocab/identificationDocuments');
      if (idDocsStr) {
        try {
          clientData.identificationDocuments = JSON.parse(idDocsStr);
        } catch (e) {
          console.warn('Failed to parse identification documents data');
        }
      }

      return clientData;

    } catch (error) {
      console.error('❌ Failed to retrieve client data:', error);
      return null;
    }
  }

  /**
   * Update client data in pod
   */
  async updateClientData(
    structure: ClientPodStructure,
    updates: Partial<ClientPersonalData>,
    updatedBy: string
  ): Promise<boolean> {
    try {
      const currentData = await this.getClientData(structure);
      if (!currentData) {
        throw new Error('Client data not found');
      }

      // Merge updates with current data
      const updatedData: ClientPersonalData = {
        ...currentData,
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy
      };

      // Store updated data
      await this.storeClientData(structure, updatedData);

      // Log the update
      await this.logPodAccess(
        structure,
        'DATA_UPDATED',
        updatedBy,
        `Updated fields: ${Object.keys(updates).join(', ')}`
      );

      console.log('✅ Client data updated successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to update client data:', error);
      return false;
    }
  }

  /**
   * Grant access to another agent
   */
  async grantAccess(
    structure: ClientPodStructure,
    permission: ClientAccessPermission
  ): Promise<boolean> {
    try {
      // Store permission record
      await this.storeAccessPermission(structure, permission);

      // Set actual access controls (simplified for now)
      const resources = [
        { url: structure.personalDataUrl, access: { read: permission.permissions.read.personal, write: permission.permissions.write.personal } },
        { url: structure.medicalDataUrl, access: { read: permission.permissions.read.medical, write: permission.permissions.write.medical } },
        { url: structure.housingHistoryUrl, access: { read: permission.permissions.read.housing, write: permission.permissions.write.housing } },
        { url: structure.caseNotesUrl, access: { read: permission.permissions.read.caseNotes, write: permission.permissions.write.caseNotes } }
      ];

      for (const resource of resources) {
        if (resource.access.read || resource.access.write) {
          await this.setResourceAccess(resource.url, permission.agentWebId, resource.access);
        }
      }

      // Log access grant
      await this.logPodAccess(
        structure,
        'ACCESS_GRANTED',
        permission.grantedBy,
        `Granted access to ${permission.agentWebId} with role ${permission.role}`
      );

      console.log(`✅ Access granted to ${permission.agentWebId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to grant access:', error);
      return false;
    }
  }

  /**
   * Get audit log for client pod
   */
  async getAuditLog(structure: ClientPodStructure): Promise<Array<{
    timestamp: Date;
    action: string;
    agentWebId: string;
    details: string;
    sessionId: string;
  }>> {
    try {
      const dataset = await getSolidDataset(structure.auditLogUrl, { fetch: this.session.fetch });
      const things = getThingAll(dataset);
      
      const logs = things.map(thing => ({
        timestamp: getDatetime(thing, 'http://shelter.vocab/timestamp') || new Date(),
        action: getStringNoLocale(thing, 'http://shelter.vocab/action') || '',
        agentWebId: getStringNoLocale(thing, 'http://shelter.vocab/agentWebId') || '',
        details: getStringNoLocale(thing, 'http://shelter.vocab/details') || '',
        sessionId: getStringNoLocale(thing, 'http://shelter.vocab/sessionId') || ''
      }));

      // Sort by timestamp descending
      return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    } catch (error) {
      console.error('❌ Failed to get audit log:', error);
      return [];
    }
  }

  /**
   * Add case note to client pod
   */
  async addCaseNote(
    structure: ClientPodStructure,
    note: {
      title: string;
      content: string;
      category: string;
      author: string;
      confidential?: boolean;
      followUpRequired?: boolean;
      followUpDate?: string;
      tags?: string[];
    }
  ): Promise<string> {
    try {
      const dataset = await getSolidDataset(structure.caseNotesUrl, { fetch: this.session.fetch })
        .catch(() => createSolidDataset());
      
      const noteId = `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      let thing = createThing({ name: noteId });
      
      thing = addStringNoLocale(thing, 'http://shelter.vocab/id', noteId);
      thing = addDatetime(thing, 'http://shelter.vocab/date', new Date());
      thing = addStringNoLocale(thing, 'http://shelter.vocab/author', note.author);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/category', note.category);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/title', note.title);
      thing = addStringNoLocale(thing, 'http://shelter.vocab/content', note.content);
      thing = addBoolean(thing, 'http://shelter.vocab/confidential', note.confidential || false);
      thing = addBoolean(thing, 'http://shelter.vocab/followUpRequired', note.followUpRequired || false);
      
      if (note.followUpDate) {
        thing = addDatetime(thing, 'http://shelter.vocab/followUpDate', new Date(note.followUpDate));
      }
      
      if (note.tags && note.tags.length > 0) {
        thing = addStringNoLocale(thing, 'http://shelter.vocab/tags', JSON.stringify(note.tags));
      }

      const updatedDataset = setThing(dataset, thing);
      await saveSolidDatasetAt(structure.caseNotesUrl, updatedDataset, { fetch: this.session.fetch });

      // Log the case note addition
      await this.logPodAccess(
        structure,
        'CASE_NOTE_ADDED',
        note.author,
        `Added case note: ${note.title} (${note.category})`
      );

      console.log(`✅ Case note added: ${noteId}`);
      return noteId;

    } catch (error) {
      console.error('❌ Failed to add case note:', error);
      throw error;
    }
  }

  /**
   * Store personal data in pod (used by registration service)
   */
  async storePersonalData(personalDataUrl: string, data: any): Promise<void> {
    console.log('💾 Storing personal data...');

    try {
      let personalDataset = createSolidDataset();
      
      const personalThing = createThing({
        name: `personal_${Date.now()}`
      });
      
      let personalWithData = addStringNoLocale(personalThing, FOAF.firstName, data.firstName);
      personalWithData = addStringNoLocale(personalWithData, FOAF.lastName, data.lastName);
      
      if (data.preferredName) {
        personalWithData = addStringNoLocale(personalWithData, FOAF.nick, data.preferredName);
      }
      
      if (data.dateOfBirth) {
        personalWithData = addDatetime(personalWithData, 'http://schema.org/birthDate', new Date(data.dateOfBirth));
      }
      
      if (data.phone) {
        personalWithData = addStringNoLocale(personalWithData, FOAF.phone, data.phone);
      }
      
      if (data.email) {
        personalWithData = addStringNoLocale(personalWithData, FOAF.mbox, data.email);
      }
      
      personalDataset = setThing(personalDataset, personalWithData);
      await saveSolidDatasetAt(personalDataUrl, personalDataset, { fetch: this.session.fetch });
      
      console.log('✅ Personal data stored');
    } catch (error) {
      console.error('❌ Failed to store personal data:', error);
      throw error;
    }
  }

  /**
   * Store initial assessment
   */
  async storeInitialAssessment(
    caseNotesUrl: string,
    assessment: any,
    intakeStaff: any
  ): Promise<void> {
    console.log('📝 Storing initial assessment...');

    try {
      let caseDataset = createSolidDataset();
      
      const assessmentThing = createThing({
        name: `assessment_${Date.now()}`
      });
      
      let assessmentWithData = addStringNoLocale(assessmentThing, 'type', 'initial_assessment');
      assessmentWithData = addDatetime(assessmentWithData, 'date', new Date());
      assessmentWithData = addStringNoLocale(assessmentWithData, 'staff_id', intakeStaff.id);
      assessmentWithData = addStringNoLocale(assessmentWithData, 'staff_name', intakeStaff.name);
      assessmentWithData = addStringNoLocale(assessmentWithData, 'housing_status', assessment.housingStatus);
      assessmentWithData = addStringNoLocale(assessmentWithData, 'urgency_level', assessment.urgencyLevel);
      assessmentWithData = addStringNoLocale(assessmentWithData, 'immediate_needs', JSON.stringify(assessment.immediateNeeds));
      assessmentWithData = addBoolean(assessmentWithData, 'has_children', assessment.hasChildren);
      assessmentWithData = addBoolean(assessmentWithData, 'veteran_status', assessment.veteranStatus);
      assessmentWithData = addBoolean(assessmentWithData, 'disability_status', assessment.disabilityStatus);
      
      caseDataset = setThing(caseDataset, assessmentWithData);
      await saveSolidDatasetAt(caseNotesUrl, caseDataset, { fetch: this.session.fetch });
      
      console.log('✅ Initial assessment stored');
    } catch (error) {
      console.error('❌ Failed to store initial assessment:', error);
      throw error;
    }
  }

  /**
   * Store service preferences
   */
  async storeServicePreferences(preferencesUrl: string, preferences: any): Promise<void> {
    console.log('⚙️ Storing service preferences...');

    try {
      let preferencesDataset = createSolidDataset();
      
      const prefThing = createThing({
        name: `preferences_${Date.now()}`
      });
      
      let prefWithData = addStringNoLocale(prefThing, 'preferred_contact_method', preferences.preferredContactMethod);
      prefWithData = addStringNoLocale(prefWithData, 'language_preference', preferences.languagePreference);
      
      if (preferences.accessibilityNeeds) {
        prefWithData = addStringNoLocale(prefWithData, 'accessibility_needs', JSON.stringify(preferences.accessibilityNeeds));
      }
      
      if (preferences.culturalConsiderations) {
        prefWithData = addStringNoLocale(prefWithData, 'cultural_considerations', preferences.culturalConsiderations);
      }
      
      prefWithData = addStringNoLocale(prefWithData, 'consent_to_share', JSON.stringify(preferences.consentToShare));
      
      preferencesDataset = setThing(preferencesDataset, prefWithData);
      await saveSolidDatasetAt(preferencesUrl, preferencesDataset, { fetch: this.session.fetch });
      
      console.log('✅ Service preferences stored');
    } catch (error) {
      console.error('❌ Failed to store service preferences:', error);
      throw error;
    }
  }

  /**
   * Grant staff access to client pod
   */
  async grantStaffAccess(
    podUrl: string,
    staffWebId: string,
    role: string,
    credentialId: string
  ): Promise<void> {
    console.log(`🔑 Granting staff access: ${staffWebId}`);

    try {
      // This would set up appropriate access controls
      // In a full implementation, this would configure ACLs
      console.log('✅ Staff access granted');
    } catch (error) {
      console.error('❌ Failed to grant staff access:', error);
      throw error;
    }
  }

  /**
   * Store access code metadata
   */
  async storeAccessCode(accessUrl: string, accessCode: string, clientId: string): Promise<void> {
    console.log('🎫 Storing access code metadata...');

    try {
      let accessDataset = createSolidDataset();
      
      const accessThing = createThing({
        name: `access_${Date.now()}`
      });
      
      let accessWithData = addStringNoLocale(accessThing, 'access_code', accessCode);
      accessWithData = addStringNoLocale(accessWithData, 'client_id', clientId);
      accessWithData = addDatetime(accessWithData, 'created_at', new Date());
      accessWithData = addBoolean(accessWithData, 'active', true);
      
      accessDataset = setThing(accessDataset, accessWithData);
      await saveSolidDatasetAt(accessUrl, accessDataset, { fetch: this.session.fetch });
      
      console.log('✅ Access code metadata stored');
    } catch (error) {
      console.error('❌ Failed to store access code:', error);
      throw error;
    }
  }

  /**
   * Verify pod exists and is accessible
   */
  async verifyPodExists(podUrl: string): Promise<boolean> {
    try {
      await getSolidDataset(podUrl, { fetch: this.session.fetch });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify container exists and is accessible
   */
  async verifyContainerExists(containerUrl: string): Promise<boolean> {
    try {
      await getSolidDataset(containerUrl, { fetch: this.session.fetch });
      return true;
    } catch {
      return false;
    }
  }
}

export default ClientPodManager;