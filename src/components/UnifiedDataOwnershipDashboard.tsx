/**
 * Unified Data Ownership Dashboard
 * 
 * This dashboard provides a comprehensive interface for managing individual data ownership
 * through the unified model that combines HAT data vaults and Apple Wallet access representations.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  UnifiedDataOwner,
  UnifiedWalletPass,
  UnifiedDataRecord,
  UnifiedDataType,
  WalletPassType,
  PrivacyLevel,
  AccessLogEntry,
  DataPermission,
  ConsentRecord,
  HATVaultStats,
  SynchronizationResult,
  IntegrityReport,
  UNIFIED_DATA_TYPES,
  PRIVACY_LEVELS
} from '../types/UnifiedDataOwnership';
import { Client } from '../types/Shelter';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';
import { appleWalletService } from '../services/appleWalletService';

interface UnifiedDataOwnershipDashboardProps {
  staffId?: string;
  selectedClient?: Client | null;
}

const UnifiedDataOwnershipDashboard: React.FC<UnifiedDataOwnershipDashboardProps> = ({ 
  staffId, 
  selectedClient 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'owners' | 'privacy' | 'wallet' | 'audit' | 'sync'>('overview');
  const [dataOwners, setDataOwners] = useState<UnifiedDataOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<UnifiedDataOwner | null>(null);
  const [ownerData, setOwnerData] = useState<Record<UnifiedDataType, UnifiedDataRecord[]>>({} as any);
  const [walletPasses, setWalletPasses] = useState<UnifiedWalletPass[]>([]);
  const [auditLog, setAuditLog] = useState<AccessLogEntry[]>([]);
  const [hatStats, setHATStats] = useState<HATVaultStats | null>(null);
  const [syncResult, setSyncResult] = useState<SynchronizationResult | null>(null);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Demo data for showcase
  const [demoOwners] = useState<UnifiedDataOwner[]>([
    {
      ownerId: 'demo-owner-001',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@example.com',
      phone: '+1-208-555-0101',
      dateOfBirth: new Date('1985-03-15'),
      hatVault: {
        hatDomain: 'alice-johnson-demo.hubofallthings.net',
        vaultId: 'vault-demo-001',
        status: 'active',
        endpoints: Object.keys(UNIFIED_DATA_TYPES).map(type => ({
          endpoint: `shelter/${type}`,
          dataType: type as UnifiedDataType,
          recordCount: Math.floor(Math.random() * 10) + 1,
          lastSync: new Date(),
          permissions: []
        })),
        storageQuota: {
          used: 5242880, // 5MB
          limit: 104857600, // 100MB
          unit: 'bytes'
        }
      },
      walletAccess: {
        walletId: 'wallet-demo-001',
        passes: [
          {
            passId: 'pass-shelter-001',
            passType: 'shelter_access',
            serialNumber: 'SHELTER-ACCESS-001-2025',
            accessLevel: 'standard',
            validFrom: new Date(),
            validUntil: new Date(2025, 11, 31),
            status: 'active',
            metadata: {
              title: 'Idaho Shelter Access',
              description: 'Access to shelter services',
              issuer: 'Idaho Community Shelter',
              category: 'access',
              services: ['Meals', 'Showers', 'Storage', 'WiFi']
            },
            linkedData: {
              hatEndpoint: 'shelter/access_records',
              dataReferences: ['demo-owner-001']
            }
          },
          {
            passId: 'pass-health-001',
            passType: 'health_credential',
            serialNumber: 'HEALTH-CRED-001-2025',
            accessLevel: 'priority',
            validFrom: new Date(),
            validUntil: new Date(2025, 11, 31),
            status: 'active',
            metadata: {
              title: 'Medical Information',
              description: 'Emergency medical information',
              issuer: 'Idaho Community Shelter',
              category: 'health',
              services: [],
              emergencyInfo: {
                contacts: [{
                  name: 'Bob Johnson',
                  phone: '+1-208-555-0102',
                  relationship: 'spouse',
                  isPrimary: true
                }],
                medicalAlerts: ['Type 1 Diabetes'],
                accessInstructions: 'Show to medical personnel'
              }
            },
            linkedData: {
              hatEndpoint: 'shelter/health_data',
              dataReferences: ['demo-owner-001']
            }
          }
        ],
        deviceTokens: ['device-token-123'],
        lastSync: new Date(),
        status: 'active'
      },
      dataPermissions: {
        owner: 'demo-owner-001',
        permissions: [{
          permissionId: 'perm-001',
          grantee: 'Idaho Community Shelter',
          dataTypes: ['personal_identity', 'shelter_records'],
          access: ['read', 'write'],
          purpose: 'Shelter service provision',
          conditions: [],
          grantedAt: new Date(),
          status: 'active'
        }],
        defaultPolicy: {
          defaultAccess: 'deny',
          requireConsent: true,
          auditLevel: 'comprehensive',
          retentionPeriod: 365
        },
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
      consentRecords: [{
        consentId: 'consent-001',
        ownerId: 'demo-owner-001',
        grantee: 'Idaho Community Shelter',
        purpose: 'Shelter services and data management',
        dataTypes: ['personal_identity', 'shelter_records', 'health_data'],
        consentText: 'I consent to data processing for shelter services',
        legalBasis: 'consent',
        jurisdiction: 'US-ID',
        language: 'en',
        grantedAt: new Date(),
        renewalRequired: true,
        evidence: {
          method: 'digital_signature',
          timestamp: new Date()
        },
        status: 'active'
      }],
      createdAt: new Date(2024, 0, 15),
      lastUpdated: new Date(),
      isActive: true
    }
  ]);

  useEffect(() => {
    loadDemoData();
  }, []);

  useEffect(() => {
    if (selectedOwner) {
      loadOwnerDetails(selectedOwner.ownerId);
    }
  }, [selectedOwner]);

  const loadDemoData = () => {
    setDataOwners(demoOwners);
    if (demoOwners.length > 0) {
      setSelectedOwner(demoOwners[0]);
    }
  };

  const loadOwnerDetails = async (ownerId: string) => {
    setIsLoading(true);
    try {
      // Load data for each type
      const ownerDataMap: Record<UnifiedDataType, UnifiedDataRecord[]> = {} as any;
      
      for (const dataType of Object.keys(UNIFIED_DATA_TYPES) as UnifiedDataType[]) {
        try {
          const records = await unifiedDataOwnershipService.retrieveData(ownerId, dataType);
          ownerDataMap[dataType] = records;
        } catch (error) {
          console.warn(`Failed to load ${dataType} data:`, error);
          ownerDataMap[dataType] = [];
        }
      }
      
      setOwnerData(ownerDataMap);

      // Load wallet passes
      const passes = appleWalletService.getUnifiedPasses(ownerId);
      setWalletPasses(passes);

      // Load audit log
      const auditEntries = await unifiedDataOwnershipService.auditAccess(ownerId);
      setAuditLog(auditEntries);

      // Load HAT stats
      const stats = await unifiedDataOwnershipService.getHATStats(ownerId);
      setHATStats(stats);

    } catch (error) {
      console.error('Failed to load owner details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynchronize = async (ownerId: string) => {
    setIsLoading(true);
    try {
      const result = await unifiedDataOwnershipService.synchronizeOwnerData(ownerId);
      setSyncResult(result);
      
      // Reload data after sync
      await loadOwnerDetails(ownerId);
      
      const message = `🔄 Synchronization completed!
      
HAT Sync: ${result.hatSync.success ? '✅' : '❌'} (${result.hatSync.recordsUpdated} records)
Wallet Sync: ${result.walletSync.success ? '✅' : '❌'} (${result.walletSync.passesUpdated} passes)
Conflicts Resolved: ${result.conflictsResolved}`;

      window.alert(message);

    } catch (error) {
      console.error('Synchronization failed:', error);
      window.alert(`❌ Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateIntegrity = async (ownerId: string) => {
    setIsLoading(true);
    try {
      const report = await unifiedDataOwnershipService.validateDataIntegrity(ownerId);
      setIntegrityReport(report);

      const message = `🔍 Data Integrity Report:
      
Total Records: ${report.totalRecords}
Valid Records: ${report.validRecords}
Issues Found: ${report.corruptedRecords.length + report.missingReferences.length + report.hashMismatches.length}

${report.recommendedActions.length > 0 ? 
  `Recommendations:\n${report.recommendedActions.map(action => `• ${action}`).join('\n')}` : 
  'No issues found. Data integrity is good!'
}`;

      window.alert(message);

    } catch (error) {
      console.error('Integrity validation failed:', error);
      window.alert(`❌ Integrity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <h3 className="text-2xl font-bold mb-2">🔐 Unified Data Ownership</h3>
        <p className="text-blue-100 mb-4">
          Individual data ownership through HAT data vaults and Apple Wallet access representations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{dataOwners.length}</div>
            <div className="text-sm opacity-80">Data Owners</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{dataOwners.reduce((sum, owner) => sum + owner.walletAccess.passes.length, 0)}</div>
            <div className="text-sm opacity-80">Wallet Passes</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{dataOwners.reduce((sum, owner) => sum + owner.hatVault.endpoints.reduce((endpointSum, ep) => endpointSum + ep.recordCount, 0), 0)}</div>
            <div className="text-sm opacity-80">Data Records</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Benefits */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-bold mb-4 text-gray-800">✅ Key Benefits</h4>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Individual Data Ownership:</strong> Each person owns and controls their personal data</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Zero-Knowledge Privacy:</strong> Service providers cannot access raw personal data</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Data Portability:</strong> Complete control over data sharing and transfer</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Digital Wallet Integration:</strong> Seamless access through Apple Wallet</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Compliance by Design:</strong> Built-in GDPR and privacy compliance</span>
            </div>
          </div>
        </div>

        {/* Data Types */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-bold mb-4 text-gray-800">📊 Supported Data Types</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(UNIFIED_DATA_TYPES).map(([type, info]) => (
              <div key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <span className="text-lg">{info.icon}</span>
                <div>
                  <div className="font-medium">{info.name}</div>
                  <div className="text-xs text-gray-500">{info.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOwnersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Data Owners</h3>
        <div className="text-sm text-gray-500">{dataOwners.length} total owners</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Owners List */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800">👥 Individual Data Owners</h4>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {dataOwners.map((owner) => (
              <div
                key={owner.ownerId}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedOwner?.ownerId === owner.ownerId ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedOwner(owner)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {owner.firstName} {owner.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{owner.email}</div>
                    <div className="text-xs text-gray-400">
                      Created: {format(owner.createdAt, 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className={`w-3 h-3 rounded-full ${owner.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div className="text-xs text-gray-500 mt-1">
                      {owner.hatVault.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>🎩 {owner.hatVault.endpoints.length} endpoints</span>
                  <span>📱 {owner.walletAccess.passes.length} passes</span>
                  <span>🔐 {owner.dataPermissions.permissions.length} permissions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Details */}
        {selectedOwner && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">
                📋 {selectedOwner.firstName} {selectedOwner.lastName}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSynchronize(selectedOwner.ownerId)}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  🔄 Sync
                </button>
                <button
                  onClick={() => handleValidateIntegrity(selectedOwner.ownerId)}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  🔍 Validate
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* HAT Vault Info */}
              <div className="border border-gray-200 rounded p-3">
                <div className="font-medium text-gray-700 mb-2">🎩 HAT Data Vault</div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div><strong>Domain:</strong> {selectedOwner.hatVault.hatDomain}</div>
                  <div><strong>Status:</strong> <span className={`capitalize ${selectedOwner.hatVault.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{selectedOwner.hatVault.status}</span></div>
                  <div><strong>Storage:</strong> {(selectedOwner.hatVault.storageQuota.used / 1024 / 1024).toFixed(1)}MB / {(selectedOwner.hatVault.storageQuota.limit / 1024 / 1024).toFixed(0)}MB</div>
                  <div><strong>Endpoints:</strong> {selectedOwner.hatVault.endpoints.length}</div>
                </div>
              </div>

              {/* Wallet Access Info */}
              <div className="border border-gray-200 rounded p-3">
                <div className="font-medium text-gray-700 mb-2">📱 Wallet Access</div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div><strong>Wallet ID:</strong> {selectedOwner.walletAccess.walletId}</div>
                  <div><strong>Status:</strong> <span className={`capitalize ${selectedOwner.walletAccess.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{selectedOwner.walletAccess.status}</span></div>
                  <div><strong>Passes:</strong> {selectedOwner.walletAccess.passes.length}</div>
                  <div><strong>Last Sync:</strong> {format(selectedOwner.walletAccess.lastSync, 'MMM d, yyyy h:mm a')}</div>
                </div>
              </div>

              {/* Data Permissions */}
              <div className="border border-gray-200 rounded p-3">
                <div className="font-medium text-gray-700 mb-2">🔐 Data Permissions</div>
                <div className="text-sm space-y-1 text-gray-600">
                  <div><strong>Active Permissions:</strong> {selectedOwner.dataPermissions.permissions.filter(p => p.status === 'active').length}</div>
                  <div><strong>Default Access:</strong> <span className="capitalize">{selectedOwner.dataPermissions.defaultPolicy.defaultAccess}</span></div>
                  <div><strong>Audit Level:</strong> <span className="capitalize">{selectedOwner.dataPermissions.defaultPolicy.auditLevel}</span></div>
                  <div><strong>Consent Required:</strong> {selectedOwner.dataPermissions.defaultPolicy.requireConsent ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">🔐 Privacy & Consent Management</h3>
      
      {selectedOwner ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Privacy Levels */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Privacy Levels</h4>
            <div className="space-y-3">
              {Object.entries(PRIVACY_LEVELS).map(([level, info]) => (
                <div key={level} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div>
                    <div className="font-medium">{info.name}</div>
                    <div className="text-sm text-gray-600">{info.description}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full bg-${info.color}-500`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Consent Records */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Consent Records</h4>
            <div className="space-y-3">
              {selectedOwner.consentRecords.map((consent) => (
                <div key={consent.consentId} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{consent.purpose}</div>
                    <div className={`px-2 py-1 text-xs rounded ${
                      consent.status === 'active' ? 'bg-green-100 text-green-800' :
                      consent.status === 'withdrawn' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {consent.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Grantee:</strong> {consent.grantee}</div>
                    <div><strong>Data Types:</strong> {consent.dataTypes.join(', ')}</div>
                    <div><strong>Legal Basis:</strong> {consent.legalBasis}</div>
                    <div><strong>Granted:</strong> {format(consent.grantedAt, 'MMM d, yyyy')}</div>
                    <div><strong>Evidence:</strong> {consent.evidence.method}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🔒</div>
          <p>Select a data owner to view privacy and consent information</p>
        </div>
      )}
    </div>
  );

  const renderWalletTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">📱 Wallet Pass Management</h3>
      
      {selectedOwner ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {selectedOwner.walletAccess.passes.map((pass) => (
            <div key={pass.passId} className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-800">{pass.metadata.title}</h4>
                  <p className="text-sm text-gray-600">{pass.metadata.description}</p>
                </div>
                <div className={`px-3 py-1 text-xs rounded-full font-medium ${
                  pass.status === 'active' ? 'bg-green-100 text-green-800' :
                  pass.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                  pass.status === 'revoked' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pass.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Pass Type</div>
                  <div className="font-medium capitalize">{pass.passType.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-gray-500">Access Level</div>
                  <div className="font-medium capitalize">{pass.accessLevel}</div>
                </div>
                <div>
                  <div className="text-gray-500">Serial Number</div>
                  <div className="font-mono text-xs">{pass.serialNumber}</div>
                </div>
                <div>
                  <div className="text-gray-500">Valid Until</div>
                  <div className="font-medium">{pass.validUntil ? format(pass.validUntil, 'MMM d, yyyy') : 'No expiry'}</div>
                </div>
              </div>

              {pass.metadata.services && pass.metadata.services.length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-500 text-sm mb-2">Services</div>
                  <div className="flex flex-wrap gap-2">
                    {pass.metadata.services.map((service, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pass.metadata.emergencyInfo && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-sm font-medium text-red-800 mb-2">🚨 Emergency Information</div>
                  {pass.metadata.emergencyInfo.contacts.map((contact, index) => (
                    <div key={index} className="text-xs text-red-700">
                      <strong>{contact.name}</strong> ({contact.relationship}): {contact.phone}
                    </div>
                  ))}
                  {pass.metadata.emergencyInfo.medicalAlerts.map((alert, index) => (
                    <div key={index} className="text-xs text-red-700 mt-1">
                      <strong>Alert:</strong> {alert}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div><strong>Linked HAT Endpoint:</strong> {pass.linkedData.hatEndpoint}</div>
                  <div><strong>Issuer:</strong> {pass.metadata.issuer}</div>
                  <div><strong>Pass ID:</strong> <span className="font-mono">{pass.passId}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">📱</div>
          <p>Select a data owner to view their wallet passes</p>
        </div>
      )}
    </div>
  );

  if (isLoading && !selectedOwner) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading unified data ownership...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">🔐</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Unified Data Ownership</h2>
              <p className="text-gray-600">Individual data ownership through HAT vaults and Apple Wallet</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">System Active</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 py-3">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'owners', label: 'Data Owners', icon: '👥' },
              { id: 'privacy', label: 'Privacy & Consent', icon: '🔐' },
              { id: 'wallet', label: 'Wallet Passes', icon: '📱' },
              { id: 'audit', label: 'Audit Log', icon: '📋' },
              { id: 'sync', label: 'Synchronization', icon: '🔄' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'owners' && renderOwnersTab()}
          {activeTab === 'privacy' && renderPrivacyTab()}
          {activeTab === 'wallet' && renderWalletTab()}
          {activeTab === 'audit' && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <p>Audit log features coming soon...</p>
            </div>
          )}
          {activeTab === 'sync' && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔄</div>
              <p>Advanced synchronization features coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedDataOwnershipDashboard;