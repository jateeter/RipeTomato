/**
 * SMS Provider Management Component
 * 
 * Administrative interface for managing multiple SMS providers,
 * monitoring their health, testing functionality, and configuring
 * fallback settings. Supports both Twilio and Google Voice providers.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { smsService } from '../services/smsService';
import { useResponsive } from '../hooks/useResponsive';
import { getCardClasses, getButtonClasses, getGridClasses } from '../utils/responsive';

interface ProviderStatus {
  name: string;
  enabled: boolean;
  healthy: boolean;
  totalSent: number;
  totalFailed: number;
  successRate: number;
  lastActivity?: Date;
  errorCount: number;
}

export const SMSProviderManagement: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [unifiedStats, setUnifiedStats] = useState<any>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadProviderData();
    const interval = setInterval(loadProviderData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadProviderData = async () => {
    try {
      // Get overall SMS statistics
      const stats = await smsService.getMessageStats();
      setUnifiedStats(stats);

      // Get provider-specific statistics
      const providerStats = smsService.getSMSProviderStats();
      const availableProviders = smsService.getAvailableProviders();
      const healthyProviders = smsService.getHealthyProviders();

      if (providerStats) {
        const providerStatusList: ProviderStatus[] = providerStats.providers.map(provider => ({
          name: provider.providerName,
          enabled: availableProviders.includes(provider.providerName),
          healthy: healthyProviders.includes(provider.providerName),
          totalSent: provider.totalSent,
          totalFailed: provider.totalFailed,
          successRate: provider.successRate,
          lastActivity: provider.lastActivity,
          errorCount: provider.errorCount
        }));

        setProviders(providerStatusList);
      }
    } catch (error) {
      console.error('Failed to load provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProvider = async (providerName: string, enable: boolean) => {
    setActionMessage(`${enable ? 'Enabling' : 'Disabling'} ${providerName}...`);
    
    try {
      const success = enable ? 
        await smsService.enableProvider(providerName) :
        smsService.disableProvider(providerName);

      if (success) {
        setActionMessage(`✅ ${providerName} ${enable ? 'enabled' : 'disabled'} successfully`);
        setTimeout(loadProviderData, 1000);
      } else {
        setActionMessage(`❌ Failed to ${enable ? 'enable' : 'disable'} ${providerName}`);
      }
    } catch (error) {
      setActionMessage(`❌ Error ${enable ? 'enabling' : 'disabling'} ${providerName}`);
    }

    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleTestProvider = async (providerName: string) => {
    if (!testPhoneNumber.trim()) {
      setActionMessage('Please enter a phone number for testing');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    setTestResults(prev => ({ ...prev, [providerName]: null }));
    setActionMessage(`Testing ${providerName}...`);

    try {
      const success = await smsService.testProvider(providerName, testPhoneNumber);
      setTestResults(prev => ({ ...prev, [providerName]: success }));
      
      if (success) {
        setActionMessage(`✅ Test message sent via ${providerName}`);
      } else {
        setActionMessage(`❌ Test failed for ${providerName}`);
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [providerName]: false }));
      setActionMessage(`❌ Test error for ${providerName}`);
    }

    setTimeout(() => setActionMessage(''), 3000);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className={getCardClasses()}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading SMS provider data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          📱 SMS Provider Management
        </h1>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`p-4 rounded-lg ${
          actionMessage.includes('✅') ? 'bg-green-100 text-green-800' :
          actionMessage.includes('❌') ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {actionMessage}
        </div>
      )}

      {/* Overall Statistics */}
      {unifiedStats && (
        <div className={getCardClasses()}>
          <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            📊 Overall SMS Statistics
          </h2>
          
          <div className={getGridClasses(2, 4, 4)}>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{unifiedStats.totalSent}</p>
              <p className="text-sm text-gray-600">Total Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{unifiedStats.totalFailed}</p>
              <p className="text-sm text-gray-600">Total Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{unifiedStats.queueSize}</p>
              <p className="text-sm text-gray-600">Queue Size</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {unifiedStats.successRate ? `${unifiedStats.successRate.toFixed(1)}%` : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Provider Testing */}
      <div className={getCardClasses()}>
        <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          🧪 Provider Testing
        </h2>
        
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-end space-x-4'}`}>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Phone Number
            </label>
            <input
              type="tel"
              value={formatPhoneNumber(testPhoneNumber)}
              onChange={(e) => setTestPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="space-y-4">
        <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          🏥 Provider Status
        </h2>
        
        <div className={getGridClasses(1, 2, 2)}>
          {providers.map((provider) => (
            <div key={provider.name} className={getCardClasses()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  {provider.name === 'Twilio' ? '📞' : '📨'} {provider.name}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  provider.healthy && provider.enabled ? 'bg-green-100 text-green-800' :
                  provider.enabled ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {provider.healthy && provider.enabled ? '🟢 Healthy' :
                   provider.enabled ? '🟡 Warning' :
                   '🔴 Disabled'}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Messages Sent:</span>
                  <span className="font-medium">{provider.totalSent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages Failed:</span>
                  <span className={`font-medium ${provider.totalFailed > 0 ? 'text-red-600' : ''}`}>
                    {provider.totalFailed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">{provider.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className={`font-medium ${provider.errorCount > 0 ? 'text-red-600' : ''}`}>
                    {provider.errorCount}
                  </span>
                </div>
                {provider.lastActivity && (
                  <div className="flex justify-between">
                    <span>Last Activity:</span>
                    <span className="font-medium text-xs">
                      {provider.lastActivity.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Test Result */}
              {testResults[provider.name] !== undefined && (
                <div className={`mb-4 p-2 rounded text-sm ${
                  testResults[provider.name] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults[provider.name] ? '✅ Test successful' : '❌ Test failed'}
                </div>
              )}

              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                <button
                  onClick={() => handleToggleProvider(provider.name, !provider.enabled)}
                  className={`${getButtonClasses('outline', 'sm')} flex-1`}
                >
                  {provider.enabled ? '🛑 Disable' : '✅ Enable'}
                </button>
                <button
                  onClick={() => handleTestProvider(provider.name)}
                  disabled={!provider.enabled || !testPhoneNumber.trim()}
                  className={`${getButtonClasses('primary', 'sm')} flex-1`}
                >
                  🧪 Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Configuration Info */}
      <div className={getCardClasses()}>
        <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          ⚙️ Configuration Information
        </h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">📞 Twilio Configuration</h3>
            <p className="text-gray-600">
              Configure Twilio by setting the following environment variables:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li><code>REACT_APP_TWILIO_ACCOUNT_SID</code> - Your Twilio Account SID</li>
              <li><code>REACT_APP_TWILIO_AUTH_TOKEN</code> - Your Twilio Auth Token</li>
              <li><code>REACT_APP_TWILIO_PHONE_NUMBER</code> - Your Twilio Phone Number</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">📨 Google Voice Configuration</h3>
            <p className="text-gray-600">
              Configure Google Voice by setting the following environment variables:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li><code>REACT_APP_GOOGLE_VOICE_EMAIL</code> - Your Google account email</li>
              <li><code>REACT_APP_GOOGLE_VOICE_NUMBER</code> - Your Google Voice number</li>
              <li><code>REACT_APP_GOOGLE_CLIENT_ID</code> - Google OAuth Client ID</li>
              <li><code>REACT_APP_GOOGLE_CLIENT_SECRET</code> - Google OAuth Client Secret</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Auto-refresh Notice */}
      <div className="text-center text-sm text-gray-500">
        Provider status automatically refreshes every 30 seconds
      </div>
    </div>
  );
};