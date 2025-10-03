/**
 * PII Credential Manager Component
 * 
 * React component for requesting, managing, and monitoring PII access credentials.
 * Provides a user interface for secure shelter client data access.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import SecurePIIDataService, { SecureClientData } from '../services/securePIIDataService';
import { PIIAccessLevel, UserRole, PIICredentialRequest } from '../services/solidPIICredentialManager';
import { Session } from '@inrupt/solid-client-authn-browser';

interface PIICredentialManagerProps {
  session: Session;
  podUrl: string;
  currentUserId: string;
  userRole: UserRole;
  onPIIAccessGranted?: (accessLevel: PIIAccessLevel) => void;
  onPIIAccessRevoked?: () => void;
}

interface PIISessionInfo {
  hasAccess: boolean;
  accessLevel: PIIAccessLevel | null;
  credentialId: string | null;
  expiresAt?: Date;
}

export const PIICredentialManager: React.FC<PIICredentialManagerProps> = ({
  session,
  podUrl,
  currentUserId,
  userRole,
  onPIIAccessGranted,
  onPIIAccessRevoked
}) => {
  const [piiService, setPIIService] = useState<SecurePIIDataService | null>(null);
  const [sessionInfo, setSessionInfo] = useState<PIISessionInfo>({
    hasAccess: false,
    accessLevel: null,
    credentialId: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form state for credential request
  const [requestForm, setRequestForm] = useState<Partial<PIICredentialRequest>>({
    userId: currentUserId,
    role: userRole,
    requestedAccessLevel: PIIAccessLevel.BASIC,
    requestedPermissions: [],
    justification: '',
    validityPeriod: 30,
    requiresMFA: false
  });

  // Initialize PII service
  useEffect(() => {
    const initService = async () => {
      try {
        setIsLoading(true);
        const service = new SecurePIIDataService(session, podUrl);
        await service.initialize();
        setPIIService(service);
        
        // Check current session status
        updateSessionInfo(service);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize PII service');
        console.error('PII service initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && podUrl) {
      initService();
    }
  }, [session, podUrl]);

  // Update session information
  const updateSessionInfo = (service: SecurePIIDataService) => {
    const hasAccess = service.hasPIIAccess();
    const accessLevel = service.getCurrentAccessLevel();
    
    setSessionInfo({
      hasAccess,
      accessLevel,
      credentialId: hasAccess ? 'active' : null // Simplified for UI
    });

    // Notify parent component
    if (hasAccess && accessLevel) {
      onPIIAccessGranted?.(accessLevel);
    } else {
      onPIIAccessRevoked?.();
    }
  };

  // Handle credential request submission
  const handleRequestCredentials = async () => {
    if (!piiService || !requestForm.justification) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: PIICredentialRequest = {
        userId: currentUserId,
        role: userRole,
        requestedAccessLevel: requestForm.requestedAccessLevel!,
        requestedPermissions: requestForm.requestedPermissions || [],
        justification: requestForm.justification,
        validityPeriod: requestForm.validityPeriod || 30,
        requiresMFA: requestForm.requiresMFA,
        supervisorApproval: requestForm.supervisorApproval
      };

      const credentialId = await piiService.authenticateForPIIAccess(request);
      updateSessionInfo(piiService);
      setShowRequestForm(false);
      
      console.log('PII credentials granted:', credentialId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request credentials');
      console.error('Credential request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ending PII session
  const handleEndSession = async () => {
    if (!piiService) return;

    try {
      setIsLoading(true);
      await piiService.endPIISession();
      updateSessionInfo(piiService);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      console.error('End session error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get access level display info
  const getAccessLevelInfo = (level: PIIAccessLevel) => {
    const levelInfo = {
      [PIIAccessLevel.NONE]: { 
        label: 'No Access', 
        color: 'bg-gray-100 text-gray-800',
        description: 'No access to client PII'
      },
      [PIIAccessLevel.BASIC]: { 
        label: 'Basic Access', 
        color: 'bg-blue-100 text-blue-800',
        description: 'Name and basic contact information only'
      },
      [PIIAccessLevel.MEDICAL]: { 
        label: 'Medical Access', 
        color: 'bg-green-100 text-green-800',
        description: 'Medical information and health records'
      },
      [PIIAccessLevel.FINANCIAL]: { 
        label: 'Financial Access', 
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Financial information and benefits'
      },
      [PIIAccessLevel.FULL]: { 
        label: 'Full Access', 
        color: 'bg-red-100 text-red-800',
        description: 'Complete access to all client information'
      }
    };
    
    return levelInfo[level];
  };

  // Get available access levels for user role
  const getAvailableAccessLevels = () => {
    const roleAccessMap: Record<UserRole, PIIAccessLevel[]> = {
      [UserRole.GUEST]: [PIIAccessLevel.NONE],
      [UserRole.VOLUNTEER]: [PIIAccessLevel.BASIC],
      [UserRole.STAFF]: [PIIAccessLevel.BASIC, PIIAccessLevel.MEDICAL],
      [UserRole.CASE_MANAGER]: [PIIAccessLevel.BASIC, PIIAccessLevel.MEDICAL, PIIAccessLevel.FINANCIAL],
      [UserRole.MEDICAL_STAFF]: [PIIAccessLevel.BASIC, PIIAccessLevel.MEDICAL],
      [UserRole.ADMINISTRATOR]: [PIIAccessLevel.BASIC, PIIAccessLevel.MEDICAL, PIIAccessLevel.FINANCIAL, PIIAccessLevel.FULL],
      [UserRole.SYSTEM_ADMIN]: [PIIAccessLevel.BASIC, PIIAccessLevel.MEDICAL, PIIAccessLevel.FINANCIAL, PIIAccessLevel.FULL]
    };

    return roleAccessMap[userRole] || [PIIAccessLevel.BASIC];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading PII access...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            🔐
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              PII Access Management
            </h3>
            <p className="text-sm text-gray-600">
              Secure access to client personal information
            </p>
          </div>
        </div>
        
        {sessionInfo.hasAccess && (
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={isLoading}
          >
            End Session
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Current Session Status */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Current Access Status</h4>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              sessionInfo.hasAccess ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              {sessionInfo.hasAccess ? 'Active Session' : 'No Active Session'}
            </span>
          </div>
          
          {sessionInfo.accessLevel && (
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                getAccessLevelInfo(sessionInfo.accessLevel).color
              }`}>
                {getAccessLevelInfo(sessionInfo.accessLevel).label}
              </span>
            </div>
          )}
        </div>
        
        {sessionInfo.hasAccess && sessionInfo.accessLevel && (
          <p className="text-sm text-gray-600 mt-1">
            {getAccessLevelInfo(sessionInfo.accessLevel).description}
          </p>
        )}
      </div>

      {/* Request Access Form */}
      {!sessionInfo.hasAccess && (
        <div>
          {!showRequestForm ? (
            <button
              onClick={() => setShowRequestForm(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request PII Access
            </button>
          ) : (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Request Access Credentials</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Level Required
                </label>
                <select
                  value={requestForm.requestedAccessLevel}
                  onChange={(e) => setRequestForm({
                    ...requestForm,
                    requestedAccessLevel: e.target.value as PIIAccessLevel
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {getAvailableAccessLevels().map(level => {
                    const info = getAccessLevelInfo(level);
                    return (
                      <option key={level} value={level}>
                        {info.label} - {info.description}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification for Access <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={requestForm.justification}
                  onChange={(e) => setRequestForm({
                    ...requestForm,
                    justification: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                  placeholder="Explain why you need access to client PII (minimum 10 characters)"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validity Period (days)
                  </label>
                  <input
                    type="number"
                    value={requestForm.validityPeriod}
                    onChange={(e) => setRequestForm({
                      ...requestForm,
                      validityPeriod: parseInt(e.target.value)
                    })}
                    min="1"
                    max="90"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Multi-Factor Authentication
                  </label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={requestForm.requiresMFA}
                      onChange={(e) => setRequestForm({
                        ...requestForm,
                        requiresMFA: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Require MFA</span>
                  </div>
                </div>
              </div>

              {(requestForm.requestedAccessLevel === PIIAccessLevel.MEDICAL ||
                requestForm.requestedAccessLevel === PIIAccessLevel.FULL) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor Approval <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requestForm.supervisorApproval || ''}
                    onChange={(e) => setRequestForm({
                      ...requestForm,
                      supervisorApproval: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Supervisor email or ID"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    High-level access requires supervisor approval
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={handleRequestCredentials}
                  disabled={isLoading || !requestForm.justification}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Processing...' : 'Submit Request'}
                </button>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Access Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-2">Access Information</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <div>• Current Role: <span className="font-medium">{userRole}</span></div>
          <div>• User ID: <span className="font-medium">{currentUserId}</span></div>
          <div>• Available Access Levels: {getAvailableAccessLevels().map(level => 
            getAccessLevelInfo(level).label
          ).join(', ')}</div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-yellow-600 mr-2">⚠️</span>
          <div className="text-sm text-yellow-700">
            <strong>Security Notice:</strong> All access to client PII is logged and audited. 
            Only request access when necessary for legitimate shelter operations. 
            Unauthorized access may result in disciplinary action.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PIICredentialManager;