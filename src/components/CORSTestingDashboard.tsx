/**
 * CORS Testing Dashboard
 * 
 * Administrative interface for testing CORS connectivity to HMIS systems,
 * diagnosing connection issues, and monitoring API accessibility.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { getCardClasses, getButtonClasses, getGridClasses } from '../utils/responsive';
import { CORSErrorHandler, useCORSErrorHandler } from './CORSErrorHandler';

interface TestResult {
  endpoint: string;
  method: string;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  corsHeaders?: Record<string, string>;
  timestamp: Date;
}

interface ConnectivityStatus {
  hmisAccessible: boolean;
  corsEnabled: boolean;
  usingProxy: boolean;
  errors: string[];
}

export const CORSTestingDashboard: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const { corsError, handleError, clearError } = useCORSErrorHandler();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus | null>(null);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [corsConfig, setCorsConfig] = useState<any>(null);

  useEffect(() => {
    loadCORSConfig();
    runConnectivityTest();
  }, []);

  const loadCORSConfig = async () => {
    try {
      const { getCORSConfig } = await import('../config/corsConfig');
      const config = getCORSConfig();
      setCorsConfig(config);
    } catch (error) {
      console.error('Failed to load CORS config:', error);
    }
  };

  const runConnectivityTest = async () => {
    try {
      const { testCORSConnectivity } = await import('../config/corsConfig');
      const status = await testCORSConnectivity();
      setConnectivityStatus(status);
    } catch (error) {
      handleError(error);
    }
  };

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    const startTime = Date.now();
    
    try {
      const { corsHttpClient } = await import('../utils/corsHttpClient');
      
      let response;
      if (method === 'GET') {
        response = await corsHttpClient.get(endpoint, {
          timeout: 15000,
          retryAttempts: 1
        });
      } else {
        response = await corsHttpClient.post(endpoint, {}, {
          timeout: 15000,
          retryAttempts: 1
        });
      }

      const endTime = Date.now();
      const result: TestResult = {
        endpoint,
        method,
        success: true,
        responseTime: endTime - startTime,
        statusCode: response.status,
        corsHeaders: response.headers as Record<string, string>,
        timestamp: new Date()
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      return result;

    } catch (error: any) {
      const endTime = Date.now();
      const result: TestResult = {
        endpoint,
        method,
        success: false,
        responseTime: endTime - startTime,
        statusCode: error.response?.status,
        errorMessage: error.message,
        timestamp: new Date()
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      return result;
    }
  };

  const runComprehensiveTest = async () => {
    setIsTestingInProgress(true);
    clearError();

    try {
      // Test different HMIS endpoints
      const endpoints = [
        { url: 'https://hmis.opencommons.org/api.php?action=query&meta=siteinfo&format=json', name: 'HMIS OpenCommons API' },
        { url: '/api/hmis-opencommons?action=query&meta=siteinfo&format=json', name: 'Local Proxy' },
        { url: 'https://httpbin.org/get', name: 'Test Endpoint (httpbin)' }
      ];

      for (const endpoint of endpoints) {
        console.log(`🧪 Testing: ${endpoint.name}`);
        await testEndpoint(endpoint.url);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Re-run connectivity test
      await runConnectivityTest();

    } catch (error) {
      handleError(error);
    } finally {
      setIsTestingInProgress(false);
    }
  };

  const testCustomEndpoint = async () => {
    if (!customEndpoint.trim()) {
      return;
    }

    setIsTestingInProgress(true);
    try {
      await testEndpoint(customEndpoint);
    } catch (error) {
      handleError(error);
    } finally {
      setIsTestingInProgress(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
    clearError();
  };

  const exportTestResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      connectivityStatus,
      corsConfig,
      testResults,
      userAgent: navigator.userAgent,
      location: window.location.href
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cors-test-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
          🌐 CORS Testing Dashboard
        </h1>
        <button
          onClick={exportTestResults}
          disabled={testResults.length === 0}
          className={getButtonClasses('outline', 'sm')}
        >
          📄 Export Results
        </button>
      </div>

      {/* CORS Error Display */}
      {corsError && (
        <CORSErrorHandler
          error={corsError}
          onRetry={runConnectivityTest}
          onDismiss={clearError}
        />
      )}

      {/* System Configuration */}
      {corsConfig && (
        <div className={getCardClasses()}>
          <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            ⚙️ CORS Configuration
          </h2>
          
          <div className={getGridClasses(1, 2, 3)}>
            <div>
              <p className="text-sm font-medium text-gray-700">Environment</p>
              <p className="text-gray-900">{process.env.NODE_ENV}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Proxy Enabled</p>
              <p className={corsConfig.useProxy ? 'text-green-600' : 'text-gray-900'}>
                {corsConfig.useProxy ? '✅ Yes' : '❌ No'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Base URL</p>
              <p className="text-gray-900 text-xs break-all">{corsConfig.hmisOpenCommonsBaseUrl}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Timeout</p>
              <p className="text-gray-900">{corsConfig.timeout}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Retry Attempts</p>
              <p className="text-gray-900">{corsConfig.retryAttempts}</p>
            </div>
            {corsConfig.proxyUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700">Proxy URL</p>
                <p className="text-gray-900 text-xs break-all">{corsConfig.proxyUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connectivity Status */}
      {connectivityStatus && (
        <div className={getCardClasses()}>
          <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            🔗 Connectivity Status
          </h2>
          
          <div className={getGridClasses(1, 3, 3)}>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${connectivityStatus.hmisAccessible ? 'text-green-600' : 'text-red-600'}`}>
                {connectivityStatus.hmisAccessible ? '✅' : '❌'}
              </div>
              <p className="text-sm font-medium">HMIS Accessible</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${connectivityStatus.corsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {connectivityStatus.corsEnabled ? '✅' : '❌'}
              </div>
              <p className="text-sm font-medium">CORS Enabled</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${connectivityStatus.usingProxy ? 'text-blue-600' : 'text-gray-600'}`}>
                {connectivityStatus.usingProxy ? '🔄' : '📡'}
              </div>
              <p className="text-sm font-medium">Proxy Mode</p>
            </div>
          </div>

          {connectivityStatus.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-900 mb-2">Connection Errors:</h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {connectivityStatus.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Testing Controls */}
      <div className={getCardClasses()}>
        <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          🧪 Endpoint Testing
        </h2>
        
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-end space-x-4'} mb-4`}>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Endpoint URL
            </label>
            <input
              type="url"
              value={customEndpoint}
              onChange={(e) => setCustomEndpoint(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className={`flex ${isMobile ? 'w-full' : ''} space-x-2`}>
            <button
              onClick={testCustomEndpoint}
              disabled={!customEndpoint.trim() || isTestingInProgress}
              className={`${getButtonClasses('primary', 'md')} ${isMobile ? 'flex-1' : ''}`}
            >
              {isTestingInProgress ? '⏳' : '🧪'} Test Endpoint
            </button>
          </div>
        </div>

        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-3'}`}>
          <button
            onClick={runComprehensiveTest}
            disabled={isTestingInProgress}
            className={getButtonClasses('primary', 'md')}
          >
            {isTestingInProgress ? '⏳ Testing...' : '🔍 Run Full Test'}
          </button>
          <button
            onClick={runConnectivityTest}
            disabled={isTestingInProgress}
            className={getButtonClasses('outline', 'md')}
          >
            🔄 Check Connectivity
          </button>
          <button
            onClick={clearTestResults}
            disabled={testResults.length === 0}
            className={getButtonClasses('outline', 'md')}
          >
            🗑️ Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className={getCardClasses()}>
          <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
            📊 Test Results ({testResults.length})
          </h2>
          
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.success ? '✅' : '❌'}
                    </span>
                    <span className="font-medium text-sm">{result.method}</span>
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                      {result.responseTime}ms
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-700 mb-2 break-all">
                  {result.endpoint}
                </p>
                
                {result.statusCode && (
                  <p className="text-xs text-gray-600">
                    Status: {result.statusCode}
                  </p>
                )}
                
                {result.errorMessage && (
                  <p className="text-xs text-red-600">
                    Error: {result.errorMessage}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Information */}
      <div className={getCardClasses()}>
        <h2 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          ❓ Troubleshooting Guide
        </h2>
        
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-medium text-gray-900">🚫 CORS Errors</h3>
            <p className="text-gray-700">Browser blocking cross-origin requests. In development, the proxy should handle this automatically.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">🔄 Using Proxy</h3>
            <p className="text-gray-700">Development proxy routes requests through the local server to avoid CORS issues.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">⏱️ Timeouts</h3>
            <p className="text-gray-700">Requests timing out may indicate server unavailability or network issues.</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">🔧 Configuration</h3>
            <p className="text-gray-700">Check environment variables and proxy settings if tests are failing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};