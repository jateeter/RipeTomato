/**
 * Secure Client Data Viewer
 * 
 * Component for viewing and editing shelter client data with PII access controls.
 * Automatically filters data based on user's access level and credentials.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import SecurePIIDataService, { SecureClientData, PIIAccessContext } from '../services/securePIIDataService';
import { PIIAccessLevel } from '../services/solidPIICredentialManager';

interface SecureClientDataViewerProps {
  clientId: string;
  piiService: SecurePIIDataService;
  onDataUpdate?: (clientId: string, success: boolean) => void;
}

interface DataSection {
  title: string;
  data: any;
  accessLevel: PIIAccessLevel;
  editable: boolean;
  icon: string;
}

export const SecureClientDataViewer: React.FC<SecureClientDataViewerProps> = ({
  clientId,
  piiService,
  onDataUpdate
}) => {
  const [clientData, setClientData] = useState<SecureClientData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [accessReason, setAccessReason] = useState('');
  const [showAccessReason, setShowAccessReason] = useState(false);

  // Load client data
  const loadClientData = async (reason: string) => {
    if (!piiService.hasPIIAccess()) {
      setError('No PII access credentials. Please request access first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const context = piiService.createAccessContext(reason);
      if (!context) {
        throw new Error('Could not create access context');
      }

      const data = await piiService.getSecureClientData(clientId, context);
      setClientData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client data');
      console.error('Error loading client data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle access reason submission
  const handleAccessReasonSubmit = () => {
    if (!accessReason.trim()) {
      setError('Please provide a reason for accessing this client\'s data');
      return;
    }
    
    setShowAccessReason(false);
    loadClientData(accessReason);
  };

  // Initial load check
  useEffect(() => {
    if (piiService.hasPIIAccess()) {
      setShowAccessReason(true);
    }
  }, [piiService, clientId]);

  // Handle edit start
  const startEditing = (section: string, data: any) => {
    setEditingSection(section);
    setEditData({ ...data });
  };

  // Handle save edit
  const saveEdit = async () => {
    if (!editingSection || !piiService.hasPIIAccess()) return;

    setIsLoading(true);
    try {
      const context = piiService.createAccessContext(`Edit ${editingSection} for client ${clientId}`);
      if (!context) {
        throw new Error('Could not create access context');
      }

      const updates: Partial<SecureClientData> = {
        [editingSection]: editData
      };

      const success = await piiService.updateSecureClientData(clientId, updates, context);
      
      if (success) {
        // Reload data to reflect changes
        await loadClientData(`Reload after edit: ${editingSection}`);
        setEditingSection(null);
        setEditData({});
        onDataUpdate?.(clientId, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      onDataUpdate?.(clientId, false);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingSection(null);
    setEditData({});
  };

  // Get data sections based on what's available
  const getDataSections = (): DataSection[] => {
    if (!clientData) return [];

    const sections: DataSection[] = [];

    // Basic Info
    if (clientData.basicInfo) {
      sections.push({
        title: 'Basic Information',
        data: clientData.basicInfo,
        accessLevel: PIIAccessLevel.BASIC,
        editable: true,
        icon: '👤'
      });
    }

    // Contact Info
    if (clientData.contactInfo) {
      sections.push({
        title: 'Contact Information',
        data: clientData.contactInfo,
        accessLevel: PIIAccessLevel.BASIC,
        editable: true,
        icon: '📞'
      });
    }

    // Medical Info
    if (clientData.medicalInfo) {
      sections.push({
        title: 'Medical Information',
        data: clientData.medicalInfo,
        accessLevel: PIIAccessLevel.MEDICAL,
        editable: true,
        icon: '🏥'
      });
    }

    // Financial Info
    if (clientData.financialInfo) {
      sections.push({
        title: 'Financial Information',
        data: clientData.financialInfo,
        accessLevel: PIIAccessLevel.FINANCIAL,
        editable: true,
        icon: '💰'
      });
    }

    // Full Record
    if (clientData.fullRecord) {
      sections.push({
        title: 'Complete Record',
        data: clientData.fullRecord,
        accessLevel: PIIAccessLevel.FULL,
        editable: false, // Restrict editing of sensitive full records
        icon: '📋'
      });
    }

    return sections;
  };

  // Render field value
  const renderFieldValue = (key: string, value: any, isEditing: boolean = false) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    if (isEditing) {
      if (typeof value === 'boolean') {
        return (
          <input
            type="checkbox"
            checked={editData[key] || false}
            onChange={(e) => setEditData({ ...editData, [key]: e.target.checked })}
            className="mr-2"
          />
        );
      } else if (Array.isArray(value)) {
        return (
          <textarea
            value={editData[key]?.join(', ') || ''}
            onChange={(e) => setEditData({ ...editData, [key]: e.target.value.split(', ').filter(Boolean) })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            rows={2}
          />
        );
      } else if (typeof value === 'object') {
        return <span className="text-gray-500 italic">Complex object (not editable)</span>;
      } else {
        return (
          <input
            type={key.toLowerCase().includes('date') ? 'date' : 'text'}
            value={editData[key] || ''}
            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        );
      }
    }

    // Display mode
    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-600' : 'text-red-600'}>
          {value ? '✓ Yes' : '✗ No'}
        </span>
      );
    } else if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded-full text-xs mr-1">
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </span>
          ))}
        </div>
      );
    } else if (typeof value === 'object') {
      return (
        <div className="space-y-2 text-sm">
          {Object.entries(value).map(([subKey, subValue]) => (
            <div key={subKey} className="flex justify-between">
              <span className="font-medium capitalize">{subKey.replace(/([A-Z])/g, ' $1')}:</span>
              <span>{typeof subValue === 'boolean' ? (subValue ? 'Yes' : 'No') : String(subValue)}</span>
            </div>
          ))}
        </div>
      );
    } else {
      // Handle sensitive data masking for display
      if (key.toLowerCase().includes('ssn') || key.toLowerCase().includes('social')) {
        const ssn = String(value);
        return `***-**-${ssn.slice(-4)}`;
      }
      return String(value);
    }
  };

  // Render data section
  const renderDataSection = (section: DataSection) => {
    const isEditing = editingSection === section.title;
    const canEdit = section.editable && piiService.getCurrentAccessLevel() !== PIIAccessLevel.BASIC;

    return (
      <div key={section.title} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className="text-xl mr-2">{section.icon}</span>
            <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              section.accessLevel === PIIAccessLevel.BASIC ? 'bg-blue-100 text-blue-800' :
              section.accessLevel === PIIAccessLevel.MEDICAL ? 'bg-green-100 text-green-800' :
              section.accessLevel === PIIAccessLevel.FINANCIAL ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {section.accessLevel.toUpperCase()}
            </span>
          </div>
          
          {canEdit && !isEditing && (
            <button
              onClick={() => startEditing(section.title, section.data)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-3">
          {Object.entries(section.data).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-start">
              <div className="sm:w-1/3 font-medium text-gray-700 capitalize mb-1 sm:mb-0">
                {key.replace(/([A-Z])/g, ' $1')}:
              </div>
              <div className="sm:w-2/3">
                {renderFieldValue(key, value, isEditing)}
              </div>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-4 flex space-x-2">
            <button
              onClick={saveEdit}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  // Show access reason dialog
  if (showAccessReason) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Access Justification Required
        </h3>
        <p className="text-gray-600 mb-4">
          Please provide a reason for accessing client {clientId}'s personal information:
        </p>
        <textarea
          value={accessReason}
          onChange={(e) => setAccessReason(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 h-24"
          placeholder="e.g., Case management meeting, Medical consultation, Housing application review..."
        />
        <div className="flex space-x-2">
          <button
            onClick={handleAccessReasonSubmit}
            disabled={!accessReason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            Continue
          </button>
          <button
            onClick={() => setShowAccessReason(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading secure client data...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">⚠️</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Access Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAccessReason(true)}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show no access state
  if (!piiService.hasPIIAccess()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-yellow-600 mr-2 text-xl">🔐</span>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">PII Access Required</h3>
            <p className="text-yellow-700">
              You need PII access credentials to view client personal information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show client data
  if (!clientData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No client data found for ID: {clientId}</p>
      </div>
    );
  }

  const sections = getDataSections();
  const currentAccessLevel = piiService.getCurrentAccessLevel();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Client Record: {clientData.clientNumber}
            </h2>
            <p className="text-gray-600">
              Status: <span className={`font-medium ${
                clientData.status === 'active' ? 'text-green-600' : 
                clientData.status === 'inactive' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
                {clientData.status.toUpperCase()}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentAccessLevel === PIIAccessLevel.BASIC ? 'bg-blue-100 text-blue-800' :
              currentAccessLevel === PIIAccessLevel.MEDICAL ? 'bg-green-100 text-green-800' :
              currentAccessLevel === PIIAccessLevel.FINANCIAL ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentAccessLevel?.toUpperCase()} ACCESS
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registered: {new Date(clientData.registrationDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Data Sections */}
      {sections.map(renderDataSection)}

      {/* Security Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-2">🛡️</span>
          <span>
            All access to client PII is logged and monitored. 
            Access reason: "{accessReason}"
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecureClientDataViewer;