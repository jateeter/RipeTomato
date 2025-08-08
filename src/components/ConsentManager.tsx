import React, { useState, useEffect } from 'react';
import { useSolidData } from '../hooks/useSolidData';

interface ConsentManagerProps {
  clientId: string;
  onConsentChange?: (hasConsent: boolean) => void;
}

interface ConsentCategories {
  basicInfo: boolean;        // Name, contact information
  emergencyContact: boolean; // Emergency contact details
  medicalInfo: boolean;      // Medical conditions, medications
  behavioralInfo: boolean;   // Behavioral notes, restrictions
  stayHistory: boolean;      // Previous stays, check-in records
  sharingWithStaff: boolean; // Allow staff to access data
}

const ConsentManager: React.FC<ConsentManagerProps> = ({ clientId, onConsentChange }) => {
  const { isAuthenticated, checkConsent, saveClient } = useSolidData();
  
  const [consent, setConsent] = useState<ConsentCategories>({
    basicInfo: false,
    emergencyContact: false,
    medicalInfo: false,
    behavioralInfo: false,
    stayHistory: false,
    sharingWithStaff: false
  });

  const [hasGlobalConsent, setHasGlobalConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isAuthenticated && clientId) {
      loadConsentStatus();
    }
  }, [isAuthenticated, clientId]);

  const loadConsentStatus = async () => {
    setIsLoading(true);
    try {
      const hasConsent = await checkConsent(clientId);
      setHasGlobalConsent(hasConsent);
      
      // In a real implementation, we'd load granular consent from the pod
      // For now, set all to the global consent status
      if (hasConsent) {
        setConsent({
          basicInfo: true,
          emergencyContact: true,
          medicalInfo: true,
          behavioralInfo: true,
          stayHistory: true,
          sharingWithStaff: true
        });
      }
    } catch (error) {
      console.error('Failed to load consent status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentChange = (category: keyof ConsentCategories, value: boolean) => {
    setConsent(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSaveConsent = async () => {
    setIsLoading(true);
    try {
      // Calculate if user has given any meaningful consent
      const hasAnyConsent = Object.values(consent).some(Boolean);
      setHasGlobalConsent(hasAnyConsent);
      setLastUpdated(new Date());
      
      if (onConsentChange) {
        onConsentChange(hasAnyConsent);
      }
      
      // In a real implementation, we'd save granular consent to the pod
      console.log('Consent preferences saved:', consent);
    } catch (error) {
      console.error('Failed to save consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAllConsent = async () => {
    setIsLoading(true);
    try {
      setConsent({
        basicInfo: false,
        emergencyContact: false,
        medicalInfo: false,
        behavioralInfo: false,
        stayHistory: false,
        sharingWithStaff: false
      });
      setHasGlobalConsent(false);
      setLastUpdated(new Date());
      
      if (onConsentChange) {
        onConsentChange(false);
      }
      
      console.log('All consent revoked');
    } catch (error) {
      console.error('Failed to revoke consent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const consentCategories = [
    {
      key: 'basicInfo' as keyof ConsentCategories,
      title: 'Basic Information',
      description: 'Name, phone number, email address',
      icon: '👤',
      required: true
    },
    {
      key: 'emergencyContact' as keyof ConsentCategories,
      title: 'Emergency Contact',
      description: 'Emergency contact name, phone, and relationship',
      icon: '📞',
      required: true
    },
    {
      key: 'medicalInfo' as keyof ConsentCategories,
      title: 'Medical Information',
      description: 'Medical conditions, medications, health notes',
      icon: '🏥',
      required: false
    },
    {
      key: 'behavioralInfo' as keyof ConsentCategories,
      title: 'Behavioral Information',
      description: 'Behavioral notes, restrictions, special accommodations',
      icon: '📋',
      required: false
    },
    {
      key: 'stayHistory' as keyof ConsentCategories,
      title: 'Stay History',
      description: 'Previous stays, check-in records, service usage',
      icon: '📅',
      required: false
    },
    {
      key: 'sharingWithStaff' as keyof ConsentCategories,
      title: 'Staff Access',
      description: 'Allow authorized staff to access your information',
      icon: '👥',
      required: true
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-2">🔒</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Pod Connection Required</h3>
        <p className="text-gray-600">
          Please connect your Solid Pod to manage data sharing consent.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Data Sharing Consent</h2>
            <p className="text-blue-100 text-sm">Control what information you share with the shelter</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            hasGlobalConsent 
              ? 'bg-green-500 text-white' 
              : 'bg-yellow-500 text-yellow-900'
          }`}>
            {hasGlobalConsent ? 'Consent Given' : 'Consent Pending'}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">🛡️ Your Privacy Rights</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your data is stored securely in your personal Solid Pod</li>
            <li>• You can revoke consent at any time</li>
            <li>• The shelter only accesses data you explicitly allow</li>
            <li>• You can request deletion of all data at any time</li>
          </ul>
        </div>

        {/* Consent Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose what to share:</h3>
          
          {consentCategories.map((category) => (
            <div
              key={category.key}
              className={`border-2 rounded-lg p-4 transition-colors ${
                consent[category.key] 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{category.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{category.title}</h4>
                    {category.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent[category.key]}
                        onChange={(e) => handleConsentChange(category.key, e.target.checked)}
                        disabled={isLoading}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">
                        {consent[category.key] ? 'Sharing allowed' : 'Not sharing'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Retention */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">📅 Data Retention</h4>
          <p className="text-sm text-gray-700 mb-3">
            The shelter will only keep your data for as long as you're actively using services, 
            plus 1 year for record-keeping. You can request deletion at any time.
          </p>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="retention-consent" 
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="retention-consent" className="text-sm text-gray-700">
              I understand the data retention policy
            </label>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-gray-500 text-center">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between items-center">
        <button
          onClick={handleRevokeAllConsent}
          disabled={isLoading || !hasGlobalConsent}
          className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Revoke All Consent
        </button>

        <div className="space-x-3">
          <button
            onClick={() => {
              // Preview what data would be shared
              const sharedCategories = Object.entries(consent)
                .filter(([_, value]) => value)
                .map(([key, _]) => consentCategories.find(c => c.key === key)?.title)
                .join(', ');
              
              alert(`Data to be shared: ${sharedCategories || 'None'}`);
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Preview Sharing
          </button>

          <button
            onClick={handleSaveConsent}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Saving...' : 'Save Consent Preferences'}
          </button>
        </div>
      </div>

      {/* GDPR Rights */}
      <div className="border-t border-gray-200 p-4">
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium mb-2">
            Your Data Rights (GDPR)
          </summary>
          <div className="text-gray-600 space-y-2 pl-4">
            <p><strong>Right to Access:</strong> You can view all data stored about you</p>
            <p><strong>Right to Rectification:</strong> You can correct any inaccurate information</p>
            <p><strong>Right to Erasure:</strong> You can request deletion of your data</p>
            <p><strong>Right to Portability:</strong> You can export your data to another service</p>
            <p><strong>Right to Restrict Processing:</strong> You can limit how your data is used</p>
            <p><strong>Right to Object:</strong> You can object to certain uses of your data</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ConsentManager;