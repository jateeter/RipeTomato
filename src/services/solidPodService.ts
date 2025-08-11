/**
 * Solid Pod Document Management Service
 * 
 * Manages private document storage and sharing using Solid Pods,
 * enabling clients to control their data and share documents via QR codes.
 * 
 * @license MIT
 */

import { v4 as uuidv4 } from 'uuid';
import {
  SharedDocument,
  CommunityServiceType
} from '../types/CommunityServices';
import { UnifiedDataOwner } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from './unifiedDataOwnershipService';

interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  contentType: string;
  uploadedAt: Date;
  lastModified: Date;
  tags: string[];
  description?: string;
  isEncrypted: boolean;
  encryptionMethod?: string;
}

interface SolidPodDocument {
  metadata: DocumentMetadata;
  solidPodUrl: string;
  localCacheUrl?: string;
  accessRights: DocumentAccessRight[];
  sharingHistory: DocumentSharingRecord[];
  backupStatus: 'none' | 'backing_up' | 'backed_up' | 'backup_failed';
}

interface DocumentAccessRight {
  accessId: string;
  grantedTo: string; // staff role, individual ID, or organization
  accessLevel: 'view' | 'download' | 'edit' | 'full';
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  revokedAt?: Date;
  revokedBy?: string;
  conditions?: AccessCondition[];
}

interface AccessCondition {
  conditionType: 'time_limited' | 'location_restricted' | 'purpose_specific' | 'approval_required';
  value: any;
  description: string;
}

interface DocumentSharingRecord {
  sharingId: string;
  sharedWith: string;
  sharedAt: Date;
  accessLevel: 'view' | 'download' | 'edit' | 'full';
  sharingMethod: 'qr_code' | 'direct_link' | 'staff_request' | 'automatic';
  qrCodeGenerated?: boolean;
  qrCodeId?: string;
  accessedAt?: Date;
  accessCount: number;
  revokedAt?: Date;
}

interface QRDocumentAccess {
  qrCodeId: string;
  documentId: string;
  clientId: string;
  accessLevel: 'view' | 'download' | 'edit' | 'full';
  generatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  accessCount: number;
  maxAccessCount: number;
  allowedServices: CommunityServiceType[];
  allowedStaff?: string[];
  qrCodeData: string;
  solidPodUrl: string;
}

class SolidPodDocumentService {
  private documents: Map<string, SolidPodDocument> = new Map();
  private clientDocuments: Map<string, string[]> = new Map(); // clientId -> documentIds[]
  private qrDocumentAccess: Map<string, QRDocumentAccess> = new Map();
  private sharedDocuments: Map<string, SharedDocument[]> = new Map(); // clientId -> SharedDocument[]

  constructor() {
    this.initializeDefaultDocuments();
    console.log('📄 Solid Pod Document Service initialized');
  }

  /**
   * Initialize some default documents for testing
   */
  private initializeDefaultDocuments(): void {
    // This would be replaced with actual Solid Pod integration
    const sampleDocuments = [
      {
        fileName: 'identification.pdf',
        fileType: 'pdf',
        contentType: 'application/pdf',
        tags: ['identification', 'official'],
        description: 'Government-issued photo identification'
      },
      {
        fileName: 'medical_records.pdf',
        fileType: 'pdf',
        contentType: 'application/pdf',
        tags: ['medical', 'health'],
        description: 'Recent medical records and prescriptions'
      },
      {
        fileName: 'employment_history.pdf',
        fileType: 'pdf',
        contentType: 'application/pdf',
        tags: ['employment', 'work'],
        description: 'Employment history and references'
      }
    ];

    // Create mock documents for demonstration
    sampleDocuments.forEach(docInfo => {
      const documentId = uuidv4();
      const metadata: DocumentMetadata = {
        documentId,
        fileName: docInfo.fileName,
        fileType: docInfo.fileType,
        fileSize: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
        contentType: docInfo.contentType,
        uploadedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        lastModified: new Date(),
        tags: docInfo.tags,
        description: docInfo.description,
        isEncrypted: true,
        encryptionMethod: 'AES-256'
      };

      const document: SolidPodDocument = {
        metadata,
        solidPodUrl: `https://solidcommunity.net/profile/documents/${documentId}`,
        accessRights: [],
        sharingHistory: [],
        backupStatus: 'backed_up'
      };

      this.documents.set(documentId, document);
    });
  }

  /**
   * Upload a document to the client's Solid Pod
   */
  async uploadDocument(
    clientId: string,
    fileName: string,
    fileData: ArrayBuffer | Blob,
    fileType: string,
    contentType: string,
    tags: string[] = [],
    description?: string,
    encryptDocument: boolean = true
  ): Promise<SolidPodDocument> {
    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const documentId = uuidv4();
    const now = new Date();

    // In a real implementation, this would interact with the Solid Pod API
    const metadata: DocumentMetadata = {
      documentId,
      fileName,
      fileType,
      fileSize: fileData instanceof ArrayBuffer ? fileData.byteLength : fileData.size,
      contentType,
      uploadedAt: now,
      lastModified: now,
      tags,
      description,
      isEncrypted: encryptDocument,
      encryptionMethod: encryptDocument ? 'AES-256' : undefined
    };

    const document: SolidPodDocument = {
      metadata,
      solidPodUrl: `https://solidcommunity.net/profile/documents/${documentId}`,
      accessRights: [],
      sharingHistory: [],
      backupStatus: 'backing_up'
    };

    // Store document
    this.documents.set(documentId, document);

    // Associate with client
    const clientDocs = this.clientDocuments.get(clientId) || [];
    clientDocs.push(documentId);
    this.clientDocuments.set(clientId, clientDocs);

    // Simulate backup completion
    setTimeout(() => {
      document.backupStatus = 'backed_up';
    }, 2000);

    // Store in unified data system
    await unifiedDataOwnershipService.storeData(clientId, 'personal_identity', {
      documentId,
      fileName,
      solidPodUrl: document.solidPodUrl,
      uploadedAt: now,
      tags,
      description
    });

    console.log(`📄 Document uploaded to Solid Pod: ${fileName} for client ${clientId}`);
    return document;
  }

  /**
   * Get all documents for a client
   */
  async getClientDocuments(clientId: string): Promise<SolidPodDocument[]> {
    const documentIds = this.clientDocuments.get(clientId) || [];
    return documentIds
      .map(id => this.documents.get(id))
      .filter((doc): doc is SolidPodDocument => doc !== undefined);
  }

  /**
   * Share a document with specific access rights
   */
  async shareDocument(
    clientId: string,
    documentId: string,
    sharedWith: string,
    accessLevel: 'view' | 'download' | 'edit' | 'full',
    expiresAt?: Date,
    conditions?: AccessCondition[]
  ): Promise<DocumentAccessRight> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    // Check if client owns this document
    const clientDocs = this.clientDocuments.get(clientId) || [];
    if (!clientDocs.includes(documentId)) {
      throw new Error('Client does not own this document');
    }

    const accessRight: DocumentAccessRight = {
      accessId: uuidv4(),
      grantedTo: sharedWith,
      accessLevel,
      grantedAt: new Date(),
      expiresAt,
      isActive: true,
      conditions
    };

    document.accessRights.push(accessRight);

    // Create sharing record
    const sharingRecord: DocumentSharingRecord = {
      sharingId: uuidv4(),
      sharedWith,
      sharedAt: new Date(),
      accessLevel,
      sharingMethod: 'staff_request',
      accessCount: 0
    };

    document.sharingHistory.push(sharingRecord);

    // Update shared documents list
    const sharedDocs = this.sharedDocuments.get(clientId) || [];
    const sharedDoc: SharedDocument = {
      documentId,
      documentName: document.metadata.fileName,
      documentType: document.metadata.tags[0] || 'document',
      solidPodUrl: document.solidPodUrl,
      sharedWith: [sharedWith],
      sharedAt: new Date(),
      expiresAt,
      accessLevel
    };

    sharedDocs.push(sharedDoc);
    this.sharedDocuments.set(clientId, sharedDocs);

    console.log(`📄 Document shared: ${documentId} with ${sharedWith} (${accessLevel})`);
    return accessRight;
  }

  /**
   * Generate QR code for document access
   */
  async generateDocumentQRCode(
    clientId: string,
    documentId: string,
    accessLevel: 'view' | 'download' | 'edit' | 'full' = 'view',
    expirationHours: number = 24,
    maxAccessCount: number = 5,
    allowedServices?: CommunityServiceType[],
    allowedStaff?: string[]
  ): Promise<QRDocumentAccess> {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Check if client owns this document
    const clientDocs = this.clientDocuments.get(clientId) || [];
    if (!clientDocs.includes(documentId)) {
      throw new Error('Client does not own this document');
    }

    const qrCodeId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

    // Create QR code data payload
    const qrData = {
      version: '1.0',
      type: 'document_access',
      qrCodeId,
      documentId,
      clientId,
      accessLevel,
      solidPodUrl: document.solidPodUrl,
      fileName: document.metadata.fileName,
      fileType: document.metadata.fileType,
      expiresAt: expiresAt.toISOString(),
      allowedServices: allowedServices || [],
      signature: this.generateQRSignature({
        documentId,
        clientId,
        accessLevel,
        expiresAt: expiresAt.toISOString()
      }),
      timestamp: now.toISOString()
    };

    const qrAccess: QRDocumentAccess = {
      qrCodeId,
      documentId,
      clientId,
      accessLevel,
      generatedAt: now,
      expiresAt,
      isActive: true,
      accessCount: 0,
      maxAccessCount,
      allowedServices: allowedServices || ['shelter', 'food_water', 'sanitation', 'transportation'],
      allowedStaff,
      qrCodeData: JSON.stringify(qrData),
      solidPodUrl: document.solidPodUrl
    };

    this.qrDocumentAccess.set(qrCodeId, qrAccess);

    // Update document sharing history
    const sharingRecord: DocumentSharingRecord = {
      sharingId: uuidv4(),
      sharedWith: 'qr_code_access',
      sharedAt: now,
      accessLevel,
      sharingMethod: 'qr_code',
      qrCodeGenerated: true,
      qrCodeId,
      accessCount: 0
    };

    document.sharingHistory.push(sharingRecord);

    // Store QR generation in unified data system
    await unifiedDataOwnershipService.storeData(clientId, 'access_records', {
      type: 'document_qr_generated',
      documentId,
      qrCodeId,
      accessLevel,
      expiresAt,
      allowedServices: allowedServices || [],
      generatedAt: now
    });

    console.log(`📱 QR code generated for document: ${documentId} (${accessLevel} access)`);
    return qrAccess;
  }

  /**
   * Validate QR code and provide document access
   */
  async validateDocumentQRCode(
    qrCodeData: string,
    requestingService: CommunityServiceType,
    staffId?: string
  ): Promise<{
    isValid: boolean;
    document?: SolidPodDocument;
    accessLevel?: 'view' | 'download' | 'edit' | 'full';
    errorMessage?: string;
    qrAccess?: QRDocumentAccess;
  }> {
    try {
      const qrData = JSON.parse(qrCodeData);

      if (qrData.type !== 'document_access' || !qrData.qrCodeId) {
        return {
          isValid: false,
          errorMessage: 'Invalid QR code format'
        };
      }

      const qrAccess = this.qrDocumentAccess.get(qrData.qrCodeId);
      if (!qrAccess) {
        return {
          isValid: false,
          errorMessage: 'QR code not found or expired'
        };
      }

      // Check if QR code is still active
      if (!qrAccess.isActive) {
        return {
          isValid: false,
          errorMessage: 'QR code has been deactivated'
        };
      }

      // Check expiration
      if (qrAccess.expiresAt < new Date()) {
        qrAccess.isActive = false;
        return {
          isValid: false,
          errorMessage: 'QR code has expired'
        };
      }

      // Check access count
      if (qrAccess.accessCount >= qrAccess.maxAccessCount) {
        qrAccess.isActive = false;
        return {
          isValid: false,
          errorMessage: 'QR code access limit exceeded'
        };
      }

      // Check service permissions
      if (!qrAccess.allowedServices.includes(requestingService)) {
        return {
          isValid: false,
          errorMessage: `Access not allowed for ${requestingService} service`
        };
      }

      // Check staff permissions if specified
      if (qrAccess.allowedStaff && staffId && !qrAccess.allowedStaff.includes(staffId)) {
        return {
          isValid: false,
          errorMessage: 'Access not allowed for this staff member'
        };
      }

      // Verify signature
      const expectedSignature = this.generateQRSignature({
        documentId: qrAccess.documentId,
        clientId: qrAccess.clientId,
        accessLevel: qrAccess.accessLevel,
        expiresAt: qrAccess.expiresAt.toISOString()
      });

      if (qrData.signature !== expectedSignature) {
        return {
          isValid: false,
          errorMessage: 'QR code signature verification failed'
        };
      }

      // Get document
      const document = this.documents.get(qrAccess.documentId);
      if (!document) {
        return {
          isValid: false,
          errorMessage: 'Document not found'
        };
      }

      // Increment access count
      qrAccess.accessCount++;

      // Update sharing history
      const sharingRecord = document.sharingHistory.find(r => r.qrCodeId === qrData.qrCodeId);
      if (sharingRecord) {
        sharingRecord.accessCount++;
        if (!sharingRecord.accessedAt) {
          sharingRecord.accessedAt = new Date();
        }
      }

      // Log access in unified data system
      await unifiedDataOwnershipService.storeData(qrAccess.clientId, 'access_records', {
        type: 'document_qr_accessed',
        documentId: qrAccess.documentId,
        qrCodeId: qrData.qrCodeId,
        accessLevel: qrAccess.accessLevel,
        accessedBy: staffId || 'unknown',
        accessedService: requestingService,
        accessedAt: new Date()
      });

      console.log(`📱 QR document access granted: ${qrAccess.documentId} to ${requestingService}`);

      return {
        isValid: true,
        document,
        accessLevel: qrAccess.accessLevel,
        qrAccess
      };

    } catch (error) {
      return {
        isValid: false,
        errorMessage: 'QR code parsing failed'
      };
    }
  }

  /**
   * Revoke document access or QR code
   */
  async revokeAccess(
    clientId: string,
    accessId?: string,
    qrCodeId?: string,
    revokedBy?: string
  ): Promise<boolean> {
    const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
    if (!owner) {
      throw new Error(`Client not found: ${clientId}`);
    }

    let revoked = false;

    if (accessId) {
      // Revoke specific document access
      for (const document of Array.from(this.documents.values())) {
        const accessRight = document.accessRights.find((ar: DocumentAccessRight) => ar.accessId === accessId);
        if (accessRight) {
          accessRight.isActive = false;
          accessRight.revokedAt = new Date();
          accessRight.revokedBy = revokedBy;
          revoked = true;
          break;
        }
      }
    }

    if (qrCodeId) {
      // Revoke QR code access
      const qrAccess = this.qrDocumentAccess.get(qrCodeId);
      if (qrAccess && qrAccess.clientId === clientId) {
        qrAccess.isActive = false;
        
        // Update sharing history
        const document = this.documents.get(qrAccess.documentId);
        if (document) {
          const sharingRecord = document.sharingHistory.find(r => r.qrCodeId === qrCodeId);
          if (sharingRecord) {
            sharingRecord.revokedAt = new Date();
          }
        }
        
        revoked = true;
      }
    }

    if (revoked) {
      // Log revocation in unified data system
      await unifiedDataOwnershipService.storeData(clientId, 'access_records', {
        type: 'access_revoked',
        accessId,
        qrCodeId,
        revokedBy: revokedBy || clientId,
        revokedAt: new Date()
      });

      console.log(`🔒 Document access revoked: accessId=${accessId}, qrCodeId=${qrCodeId}`);
    }

    return revoked;
  }

  /**
   * Get shared documents for a client
   */
  async getSharedDocuments(clientId: string): Promise<SharedDocument[]> {
    const documents = await this.getClientDocuments(clientId);
    const sharedDocuments: SharedDocument[] = [];

    for (const document of documents) {
      // Check if document has any active access rights or QR codes
      const activeAccessRights = document.accessRights.filter(ar => ar.isActive);
      const activeQRCodes = Array.from(this.qrDocumentAccess.values())
        .filter(qr => qr.documentId === document.metadata.documentId && qr.isActive);

      if (activeAccessRights.length > 0 || activeQRCodes.length > 0) {
        const sharedWith = [
          ...activeAccessRights.map(ar => ar.grantedTo),
          ...activeQRCodes.map(() => 'QR Code Access')
        ];

        const latestSharing = document.sharingHistory
          .sort((a, b) => b.sharedAt.getTime() - a.sharedAt.getTime())[0];

        const qrCode = activeQRCodes.length > 0 ? activeQRCodes[0].qrCodeId : undefined;

        const sharedDoc: SharedDocument = {
          documentId: document.metadata.documentId,
          documentName: document.metadata.fileName,
          documentType: document.metadata.tags[0] || 'document',
          solidPodUrl: document.solidPodUrl,
          sharedWith: Array.from(new Set(sharedWith)), // Remove duplicates
          sharedAt: latestSharing?.sharedAt || document.metadata.uploadedAt,
          expiresAt: activeAccessRights.find(ar => ar.expiresAt)?.expiresAt ||
                    activeQRCodes.find(qr => qr.expiresAt)?.expiresAt,
          accessLevel: latestSharing?.accessLevel || 'view',
          qrCode
        };

        sharedDocuments.push(sharedDoc);
      }
    }

    return sharedDocuments;
  }

  /**
   * Get document access analytics
   */
  async getDocumentAnalytics(clientId: string, documentId?: string): Promise<{
    totalDocuments: number;
    sharedDocuments: number;
    activeQRCodes: number;
    totalAccess: number;
    accessByService: Record<CommunityServiceType, number>;
    recentAccess: Array<{
      documentName: string;
      accessedAt: Date;
      accessedBy: string;
      service: CommunityServiceType;
    }>;
  }> {
    const documents = documentId 
      ? [this.documents.get(documentId)].filter(Boolean) as SolidPodDocument[]
      : await this.getClientDocuments(clientId);

    const analytics = {
      totalDocuments: documents.length,
      sharedDocuments: 0,
      activeQRCodes: 0,
      totalAccess: 0,
      accessByService: {} as Record<CommunityServiceType, number>,
      recentAccess: [] as any[]
    };

    for (const document of documents) {
      // Count shared documents
      if (document.accessRights.some(ar => ar.isActive) || 
          Array.from(this.qrDocumentAccess.values()).some(qr => qr.documentId === document.metadata.documentId && qr.isActive)) {
        analytics.sharedDocuments++;
      }

      // Count active QR codes
      analytics.activeQRCodes += Array.from(this.qrDocumentAccess.values())
        .filter(qr => qr.documentId === document.metadata.documentId && qr.isActive).length;

      // Count total access
      analytics.totalAccess += document.sharingHistory.reduce((sum, history) => sum + history.accessCount, 0);
    }

    return analytics;
  }

  // Private helper methods
  private generateQRSignature(data: {
    documentId: string;
    clientId: string;
    accessLevel: string;
    expiresAt: string;
  }): string {
    // Simple signature generation for demo
    const payload = JSON.stringify(data);
    return Buffer.from(payload).toString('base64').substring(0, 32);
  }
}

export const solidPodService = new SolidPodDocumentService();