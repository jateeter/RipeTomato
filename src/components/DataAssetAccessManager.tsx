/**
 * Data Asset Access Manager
 * 
 * Simple client/owner level interface for managing data asset accesses,
 * providing granular control over who can access personal data.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { personalHealthDataService, HealthAccessPermission, HealthDataCategoryType } from '../services/personalHealthDataService';
import { identityManagementService } from '../services/identityManagementService';
import { solidPodService } from '../services/solidPodService';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';

interface DataAssetAccessManagerProps {
  clientId: string;
  onAccessChange?: (permissions: DataAccessPermission[]) => void;
}

export interface DataAccessPermission {
  id: string;
  dataAssetId: string;
  dataAssetType: DataAssetType;
  dataAssetName: string;
  grantedTo: string;
  grantedToType: 'service' | 'organization' | 'individual' | 'application';
  accessLevel: 'view' | 'read' | 'write' | 'admin';
  purpose: string;
  grantedAt: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  conditions: AccessCondition[];
  usage: AccessUsage;
}

export type DataAssetType = 
  | 'health_data' 
  | 'documents' 
  | 'identity_data' 
  | 'location_data' 
  | 'communication_data' 
  | 'financial_data' 
  | 'service_history';

export interface AccessCondition {
  type: 'time_limit' | 'location_restriction' | 'purpose_specific' | 'frequency_limit';
  parameters: Record<string, any>;
  description: string;
}

export interface AccessUsage {
  lastAccessed?: Date;
  accessCount: number;
  dataTransferred: number; // bytes
  frequencyPattern: 'rare' | 'occasional' | 'frequent' | 'constant';
}

export interface DataAssetSummary {
  assetId: string;
  assetType: DataAssetType;
  assetName: string;
  description: string;
  dataTypes: string[];
  sensitivityLevel: 'public' | 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
  size: number; // bytes
  accessCount: number;
  sharedWith: number; // number of entities with access
}

export interface AccessRequest {
  requestId: string;
  requestedBy: string;
  requestedByType: 'service' | 'organization' | 'individual' | 'application';
  dataAssets: string[];
  accessLevel: 'view' | 'read' | 'write' | 'admin';
  purpose: string;
  justification: string;
  requestedAt: Date;
  expiresAt?: Date;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  conditions: AccessCondition[];
}

export const DataAssetAccessManager: React.FC<DataAssetAccessManagerProps> = ({
  clientId,
  onAccessChange
}) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'permissions' | 'requests' | 'audit'>('assets');
  const [dataAssets, setDataAssets] = useState<DataAssetSummary[]>([]);
  const [permissions, setPermissions] = useState<DataAccessPermission[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [showGrantAccessModal, setShowGrantAccessModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState<AccessRequest | null>(null);

  useEffect(() => {
    loadDataAssets();
    loadPermissions();
    loadAccessRequests();
    loadAuditLog();
  }, [clientId]);

  const loadDataAssets = async () => {
    try {
      const assets = await getClientDataAssets(clientId);
      setDataAssets(assets);
    } catch (error) {
      console.error('Failed to load data assets:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const perms = await getClientDataPermissions(clientId);
      setPermissions(perms);
      onAccessChange?.(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadAccessRequests = async () => {
    try {
      const requests = await getClientAccessRequests(clientId);
      setAccessRequests(requests);
    } catch (error) {
      console.error('Failed to load access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async () => {
    try {
      const logs = await getClientAccessAuditLog(clientId);
      setAuditLog(logs);
    } catch (error) {
      console.error('Failed to load audit log:', error);
    }
  };

  const handleGrantAccess = async (
    dataAssetId: string,
    grantedTo: string,
    grantedToType: string,
    accessLevel: string,
    purpose: string,
    expiresAt?: Date,
    conditions: AccessCondition[] = []
  ) => {
    try {
      const permission = await grantDataAccess(
        clientId,
        dataAssetId,
        grantedTo,
        grantedToType as any,
        accessLevel as any,
        purpose,
        expiresAt,
        conditions
      );

      setPermissions(prev => [...prev, permission]);
      setShowGrantAccessModal(false);
      onAccessChange?.([...permissions, permission]);

    } catch (error) {
      console.error('Failed to grant access:', error);
    }
  };

  const handleRevokeAccess = async (permissionId: string) => {
    try {
      await revokeDataAccess(clientId, permissionId);
      setPermissions(prev => prev.map(p => 
        p.id === permissionId 
          ? { ...p, status: 'revoked' as const }
          : p
      ));
      onAccessChange?.(permissions.map(p => 
        p.id === permissionId 
          ? { ...p, status: 'revoked' as const }
          : p
      ));
    } catch (error) {
      console.error('Failed to revoke access:', error);
    }
  };

  const handleRequestResponse = async (requestId: string, approved: boolean) => {
    try {
      if (approved) {
        const request = accessRequests.find(r => r.requestId === requestId);
        if (request) {
          // Grant access for each requested data asset
          for (const assetId of request.dataAssets) {
            await grantDataAccess(
              clientId,
              assetId,
              request.requestedBy,
              request.requestedByType,
              request.accessLevel,
              request.purpose,
              request.expiresAt,
              request.conditions
            );
          }
        }
      }

      await respondToAccessRequest(clientId, requestId, approved);
      setAccessRequests(prev => prev.map(r => 
        r.requestId === requestId 
          ? { ...r, status: approved ? 'approved' as const : 'denied' as const }
          : r
      ));

      // Reload permissions to show newly granted access
      if (approved) {
        loadPermissions();
      }

    } catch (error) {
      console.error('Failed to respond to access request:', error);
    }
  };

  const getAssetIcon = (assetType: DataAssetType) => {
    const icons = {
      health_data: '🏥',
      documents: '📄',
      identity_data: '🆔',
      location_data: '📍',
      communication_data: '💬',
      financial_data: '💰',
      service_history: '📋'
    };
    return icons[assetType] || '📊';
  };

  const getSensitivityColor = (level: string) => {
    const colors = {
      public: 'bg-gray-100 text-gray-800',
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAccessLevelColor = (level: string) => {
    const colors = {
      view: 'bg-blue-100 text-blue-800',
      read: 'bg-green-100 text-green-800',
      write: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading data assets...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Asset Access Manager</h1>
        <p className="text-gray-600">
          Manage who can access your personal data and under what conditions.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'assets', label: 'My Data Assets', count: dataAssets.length },
            { key: 'permissions', label: 'Access Permissions', count: permissions.filter(p => p.status === 'active').length },
            { key: 'requests', label: 'Access Requests', count: accessRequests.filter(r => r.status === 'pending').length },
            { key: 'audit', label: 'Audit Log', count: auditLog.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Data Assets Tab */}
        {activeTab === 'assets' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Your Data Assets</h2>
              <button
                onClick={() => setShowGrantAccessModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Grant New Access
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataAssets.map(asset => (
                <div 
                  key={asset.assetId} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAsset === asset.assetId ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAsset(selectedAsset === asset.assetId ? null : asset.assetId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getAssetIcon(asset.assetType)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{asset.assetName}</h3>
                        <p className="text-xs text-gray-500">{asset.assetType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSensitivityColor(asset.sensitivityLevel)}`}>
                      {asset.sensitivityLevel}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{asset.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Size:</span> {formatBytes(asset.size)}
                    </div>
                    <div>
                      <span className="font-medium">Shared:</span> {asset.sharedWith} entities
                    </div>
                    <div>
                      <span className="font-medium">Accesses:</span> {asset.accessCount}
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span> {asset.lastUpdated.toLocaleDateString()}
                    </div>
                  </div>

                  {selectedAsset === asset.assetId && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">
                        <strong>Data Types:</strong> {asset.dataTypes.join(', ')}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGrantAccessModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          Grant Access
                        </button>
                        <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300">
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Permissions Tab */}
        {activeTab === 'permissions' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Active Access Permissions</h2>
            
            <div className="space-y-3">
              {permissions.filter(p => p.status === 'active').map(permission => (
                <div key={permission.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-lg mr-3">{getAssetIcon(permission.dataAssetType)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{permission.dataAssetName}</h3>
                        <p className="text-sm text-gray-600">
                          Granted to: <strong>{permission.grantedTo}</strong> ({permission.grantedToType})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getAccessLevelColor(permission.accessLevel)}`}>
                        {permission.accessLevel}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(permission.status)}`}>
                        {permission.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-3">
                    <strong>Purpose:</strong> {permission.purpose}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                    <div>
                      <span className="font-medium">Granted:</span> {permission.grantedAt.toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span> {permission.expiresAt?.toLocaleDateString() || 'Never'}
                    </div>
                    <div>
                      <span className="font-medium">Last Used:</span> {permission.usage.lastAccessed?.toLocaleDateString() || 'Never'}
                    </div>
                    <div>
                      <span className="font-medium">Access Count:</span> {permission.usage.accessCount}
                    </div>
                  </div>

                  {permission.conditions.length > 0 && (
                    <div className="text-xs text-gray-600 mb-3">
                      <strong>Conditions:</strong>
                      <ul className="mt-1 space-y-1">
                        {permission.conditions.map((condition, index) => (
                          <li key={index} className="ml-2">• {condition.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Modify
                    </button>
                    <button 
                      onClick={() => handleRevokeAccess(permission.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}

              {permissions.filter(p => p.status === 'active').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔒</div>
                  <div>No active access permissions</div>
                  <div className="text-sm mt-1">Your data is private by default</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Access Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Pending Access Requests</h2>
            
            <div className="space-y-3">
              {accessRequests.filter(r => r.status === 'pending').map(request => (
                <div key={request.requestId} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Access Request from {request.requestedBy}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.requestedByType} • Requested {request.requestedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAccessLevelColor(request.accessLevel)}`}>
                      {request.accessLevel} access
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Purpose:</strong> {request.purpose}
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      <strong>Justification:</strong> {request.justification}
                    </div>
                    <div className="text-sm text-gray-700">
                      <strong>Data Assets:</strong> {request.dataAssets.join(', ')}
                    </div>
                  </div>

                  {request.conditions.length > 0 && (
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>Proposed Conditions:</strong>
                      <ul className="mt-1 space-y-1">
                        {request.conditions.map((condition, index) => (
                          <li key={index} className="ml-2">• {condition.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowRequestModal(request)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleRequestResponse(request.requestId, false)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => handleRequestResponse(request.requestId, true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}

              {accessRequests.filter(r => r.status === 'pending').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📫</div>
                  <div>No pending access requests</div>
                  <div className="text-sm mt-1">You'll be notified when someone requests access to your data</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Access Audit Log</h2>
            
            <div className="space-y-2">
              {auditLog.slice(0, 50).map((entry, index) => (
                <div key={index} className="border-l-4 border-blue-500 bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>{entry.action}</strong> by {entry.actor}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {entry.details && (
                    <div className="text-gray-600 mt-1">{entry.details}</div>
                  )}
                </div>
              ))}

              {auditLog.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📜</div>
                  <div>No audit log entries</div>
                  <div className="text-sm mt-1">Access activities will be logged here</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      {showGrantAccessModal && (
        <GrantAccessModal
          dataAssets={dataAssets}
          onGrant={handleGrantAccess}
          onClose={() => setShowGrantAccessModal(false)}
        />
      )}

      {/* Request Details Modal */}
      {showRequestModal && (
        <RequestDetailsModal
          request={showRequestModal}
          onApprove={() => {
            handleRequestResponse(showRequestModal.requestId, true);
            setShowRequestModal(null);
          }}
          onDeny={() => {
            handleRequestResponse(showRequestModal.requestId, false);
            setShowRequestModal(null);
          }}
          onClose={() => setShowRequestModal(null)}
        />
      )}
    </div>
  );
};

// Helper Components

const GrantAccessModal: React.FC<{
  dataAssets: DataAssetSummary[];
  onGrant: (assetId: string, grantedTo: string, grantedToType: string, accessLevel: string, purpose: string, expiresAt?: Date, conditions?: AccessCondition[]) => void;
  onClose: () => void;
}> = ({ dataAssets, onGrant, onClose }) => {
  const [selectedAsset, setSelectedAsset] = useState('');
  const [grantedTo, setGrantedTo] = useState('');
  const [grantedToType, setGrantedToType] = useState('service');
  const [accessLevel, setAccessLevel] = useState('read');
  const [purpose, setPurpose] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !grantedTo || !purpose) return;

    const expiresAt = hasExpiration && expirationDate ? new Date(expirationDate) : undefined;
    
    onGrant(selectedAsset, grantedTo, grantedToType, accessLevel, purpose, expiresAt);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-full overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Grant Data Access</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Asset
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select data asset</option>
              {dataAssets.map(asset => (
                <option key={asset.assetId} value={asset.assetId}>
                  {asset.assetName} ({asset.assetType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grant Access To
            </label>
            <input
              type="text"
              value={grantedTo}
              onChange={(e) => setGrantedTo(e.target.value)}
              placeholder="Service name, organization, or email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={grantedToType}
              onChange={(e) => setGrantedToType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="service">Service</option>
              <option value="organization">Organization</option>
              <option value="individual">Individual</option>
              <option value="application">Application</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Level
            </label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="view">View Only</option>
              <option value="read">Read</option>
              <option value="write">Read & Write</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose
            </label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe why this access is needed"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="rounded mr-2"
              />
              <span className="text-sm text-gray-700">Set expiration date</span>
            </label>
          </div>

          {hasExpiration && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Grant Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RequestDetailsModal: React.FC<{
  request: AccessRequest;
  onApprove: () => void;
  onDeny: () => void;
  onClose: () => void;
}> = ({ request, onApprove, onDeny, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Access Request Details</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Requester Information</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {request.requestedBy}</div>
                <div><strong>Type:</strong> {request.requestedByType}</div>
                <div><strong>Requested:</strong> {request.requestedAt.toLocaleDateString()}</div>
                <div><strong>Access Level:</strong> {request.accessLevel}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Request Details</h3>
            <div className="space-y-2">
              <div>
                <strong className="text-sm">Purpose:</strong>
                <p className="text-sm text-gray-600">{request.purpose}</p>
              </div>
              <div>
                <strong className="text-sm">Justification:</strong>
                <p className="text-sm text-gray-600">{request.justification}</p>
              </div>
              <div>
                <strong className="text-sm">Data Assets Requested:</strong>
                <ul className="text-sm text-gray-600 ml-4">
                  {request.dataAssets.map((asset, index) => (
                    <li key={index}>• {asset}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {request.conditions.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Proposed Conditions</h3>
              <ul className="space-y-1">
                {request.conditions.map((condition, index) => (
                  <li key={index} className="text-sm text-gray-600">• {condition.description}</li>
                ))}
              </ul>
            </div>
          )}

          {request.expiresAt && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Requested Duration</h3>
              <p className="text-sm text-gray-600">
                Until {request.expiresAt.toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onDeny}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Deny Request
          </button>
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Approve Request
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Mock API functions (would be replaced with actual service calls)

const getClientDataAssets = async (clientId: string): Promise<DataAssetSummary[]> => {
  // Mock data assets
  return [
    {
      assetId: 'health-data-1',
      assetType: 'health_data',
      assetName: 'Apple HealthKit Data',
      description: 'Personal health and fitness data from Apple Health',
      dataTypes: ['heart_rate', 'steps', 'sleep', 'blood_pressure'],
      sensitivityLevel: 'high',
      lastUpdated: new Date(),
      size: 2048576, // 2MB
      accessCount: 15,
      sharedWith: 2
    },
    {
      assetId: 'documents-1',
      assetType: 'documents',
      assetName: 'Identity Documents',
      description: 'Personal identification and official documents',
      dataTypes: ['drivers_license', 'passport', 'birth_certificate'],
      sensitivityLevel: 'critical',
      lastUpdated: new Date(),
      size: 5242880, // 5MB
      accessCount: 8,
      sharedWith: 1
    },
    {
      assetId: 'service-history-1',
      assetType: 'service_history',
      assetName: 'Community Service History',
      description: 'History of community services used',
      dataTypes: ['shelter_usage', 'food_services', 'transportation'],
      sensitivityLevel: 'medium',
      lastUpdated: new Date(),
      size: 1048576, // 1MB
      accessCount: 25,
      sharedWith: 3
    }
  ];
};

const getClientDataPermissions = async (clientId: string): Promise<DataAccessPermission[]> => {
  return [
    {
      id: 'perm-1',
      dataAssetId: 'health-data-1',
      dataAssetType: 'health_data',
      dataAssetName: 'Apple HealthKit Data',
      grantedTo: 'Community Health Center',
      grantedToType: 'organization',
      accessLevel: 'read',
      purpose: 'Monitor health trends for community wellness programs',
      grantedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      conditions: [
        {
          type: 'purpose_specific',
          parameters: { purpose: 'wellness_monitoring' },
          description: 'Data can only be used for wellness monitoring'
        }
      ],
      usage: {
        lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        accessCount: 5,
        dataTransferred: 102400,
        frequencyPattern: 'occasional'
      }
    }
  ];
};

const getClientAccessRequests = async (clientId: string): Promise<AccessRequest[]> => {
  return [
    {
      requestId: 'req-1',
      requestedBy: 'Medical Research Institute',
      requestedByType: 'organization',
      dataAssets: ['health-data-1'],
      accessLevel: 'read',
      purpose: 'Medical research on community health trends',
      justification: 'We are conducting a study on health patterns in underserved communities to improve healthcare delivery.',
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'pending',
      conditions: [
        {
          type: 'purpose_specific',
          parameters: { purpose: 'medical_research' },
          description: 'Data will only be used for approved medical research'
        }
      ]
    }
  ];
};

const getClientAccessAuditLog = async (clientId: string): Promise<any[]> => {
  return [
    {
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      action: 'Data Access',
      actor: 'Community Health Center',
      details: 'Accessed health data for wellness monitoring',
      dataAsset: 'Apple HealthKit Data'
    },
    {
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      action: 'Permission Granted',
      actor: 'Data Owner',
      details: 'Granted read access to Community Health Center',
      dataAsset: 'Apple HealthKit Data'
    }
  ];
};

const grantDataAccess = async (
  clientId: string,
  dataAssetId: string,
  grantedTo: string,
  grantedToType: 'service' | 'organization' | 'individual' | 'application',
  accessLevel: 'view' | 'read' | 'write' | 'admin',
  purpose: string,
  expiresAt?: Date,
  conditions: AccessCondition[] = []
): Promise<DataAccessPermission> => {
  // Mock implementation
  const permission: DataAccessPermission = {
    id: `perm-${Date.now()}`,
    dataAssetId,
    dataAssetType: 'health_data', // Would be determined from dataAssetId
    dataAssetName: 'Data Asset Name', // Would be determined from dataAssetId
    grantedTo,
    grantedToType,
    accessLevel,
    purpose,
    grantedAt: new Date(),
    expiresAt,
    status: 'active',
    conditions,
    usage: {
      accessCount: 0,
      dataTransferred: 0,
      frequencyPattern: 'rare'
    }
  };

  return permission;
};

const revokeDataAccess = async (clientId: string, permissionId: string): Promise<void> => {
  // Mock implementation
  console.log(`Revoking access permission ${permissionId} for client ${clientId}`);
};

const respondToAccessRequest = async (
  clientId: string,
  requestId: string,
  approved: boolean
): Promise<void> => {
  // Mock implementation
  console.log(`Responding to request ${requestId}: ${approved ? 'APPROVED' : 'DENIED'}`);
};

export default DataAssetAccessManager;