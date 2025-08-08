import React, { useState } from 'react';
import { useSolidData } from '../hooks/useSolidData';
import { SOLID_CONFIG } from '../config/solidConfig';
import { SOLID_CREDENTIALS, hasSolidCredentials } from '../config/solidCredentials';
import SolidPodTest from './SolidPodTest';

interface SolidAuthPanelProps {
  onAuthChange?: (isAuthenticated: boolean) => void;
}

const SolidAuthPanel: React.FC<SolidAuthPanelProps> = ({ onAuthChange }) => {
  const {
    isAuthenticated,
    isLoading,
    error,
    sessionInfo,
    login,
    logout,
    clearError,
    getWebId,
    getPodUrl
  } = useSolidData();

  const [selectedProvider, setSelectedProvider] = useState(SOLID_CONFIG.defaultProvider);
  const [showProviders, setShowProviders] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  React.useEffect(() => {
    if (onAuthChange) {
      onAuthChange(isAuthenticated);
    }
  }, [isAuthenticated, onAuthChange]);

  const handleLogin = async () => {
    clearError();
    await login(selectedProvider);
  };

  const handleLogout = async () => {
    clearError();
    await logout();
  };

  const formatWebId = (webId: string) => {
    try {
      const url = new URL(webId);
      return `${url.pathname.replace('/', '').replace('/profile/card#me', '')}@${url.hostname}`;
    } catch {
      return webId;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Connecting to Solid Pod...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Solid Pod Integration</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isAuthenticated ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-red-500 font-bold">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">Solid Pod Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-red-700 hover:text-red-900 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthenticated ? (
        <div className="space-y-4">
          {/* Connected State */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-2xl">🔐</div>
              <div className="flex-1">
                <h3 className="font-medium text-green-800">Connected to Solid Pod</h3>
                <div className="text-sm text-green-700 mt-1 space-y-1">
                  {hasSolidCredentials() ? (
                    <>
                      <div>
                        <span className="font-medium">Pod Owner:</span> {SOLID_CREDENTIALS.podOwner.identifier}
                      </div>
                      <div>
                        <span className="font-medium">WebID:</span> {SOLID_CREDENTIALS.podOwner.webId}
                      </div>
                      <div>
                        <span className="font-medium">Pod URL:</span> {SOLID_CREDENTIALS.podOwner.podUrl}
                      </div>
                      <div>
                        <span className="font-medium">Authentication:</span> Token-based (Pre-configured)
                      </div>
                    </>
                  ) : (
                    <>
                      {sessionInfo?.webId && (
                        <div>
                          <span className="font-medium">WebID:</span> {formatWebId(sessionInfo.webId)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Pod URL:</span> {getPodUrl() || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Authentication:</span> Interactive Login
                      </div>
                    </>
                  )}
                  <div>
                    <span className="font-medium">Status:</span> Client data will be stored securely in your personal pod
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credential Info (if using tokens) */}
          {hasSolidCredentials() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">🔑 Token Authentication</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• Using pre-configured authentication tokens</div>
                <div>• Permissions: Read, Write, Append access to Pod data</div>
                <div>• Application: Idaho Shelter Management System</div>
                <div>• Token expires: Check with your Pod provider</div>
              </div>
            </div>
          )}

          {/* Privacy Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">🛡️ Data Privacy</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All personal information is stored in your private Solid Pod</li>
              <li>• You control who can access your data</li>
              <li>• Data is encrypted and follows Solid protocol standards</li>
              <li>• The shelter system only accesses data you explicitly consent to share</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowTestPanel(!showTestPanel)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showTestPanel ? 'Hide Tests' : '🧪 Test Integration'}
            </button>
            
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect Pod'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Disconnected State */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-2xl">🔒</div>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Solid Pod Not Connected</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Connect your Solid Pod to store personal information securely under your control.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Benefits of Solid Pod Integration:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✅ <strong>Data Ownership:</strong> You own and control your personal data</li>
              <li>✅ <strong>Privacy:</strong> Information stored in your private, encrypted pod</li>
              <li>✅ <strong>Interoperability:</strong> Use your data across multiple services</li>
              <li>✅ <strong>GDPR Compliant:</strong> Built-in right to be forgotten</li>
              <li>✅ <strong>Consent Management:</strong> Granular control over data sharing</li>
            </ul>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose your Solid Pod Provider:
              </label>
              
              <div className="space-y-2">
                {!showProviders ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {selectedProvider}
                    </div>
                    <button
                      onClick={() => setShowProviders(true)}
                      className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {SOLID_CONFIG.providers.map(provider => (
                      <label key={provider} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="provider"
                          value={provider}
                          checked={selectedProvider === provider}
                          onChange={(e) => setSelectedProvider(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{provider}</span>
                      </label>
                    ))}
                    <button
                      onClick={() => setShowProviders(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Done selecting
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Don't have a Solid Pod? <a 
                href={selectedProvider} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Create one for free
              </a>
            </div>
          </div>

          {/* Connect Button */}
          <div className="flex justify-end">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Connecting...' : 'Connect to Solid Pod'}
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
            What is a Solid Pod?
          </summary>
          <div className="mt-2 text-gray-600 space-y-2">
            <p>
              A Solid Pod is your personal data storage space on the web, where you control 
              who can access your information. Instead of storing your data in the shelter's 
              database, it's stored in your own secure, private pod.
            </p>
            <p>
              This gives you complete control over your personal information while still 
              allowing the shelter to provide services when you give permission.
            </p>
          </div>
        </details>
      </div>

      {/* Test Panel */}
      {showTestPanel && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <SolidPodTest />
        </div>
      )}
    </div>
  );
};

export default SolidAuthPanel;