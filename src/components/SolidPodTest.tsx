import React, { useState } from 'react';
import { solidAuthService } from '../services/solidAuthService';
import { solidDataService } from '../services/solidDataService';
import { SOLID_CREDENTIALS, hasSolidCredentials, getPodContainerUrl } from '../config/solidCredentials';
import { Client } from '../types/Shelter';

interface SolidPodTestProps {}

const SolidPodTest: React.FC<SolidPodTestProps> = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testClient, setTestClient] = useState<Client>({
    id: 'test-client-123',
    firstName: 'John',
    lastName: 'TestClient',
    dateOfBirth: new Date('1980-01-01'),
    phone: '+12085551234',
    email: 'john@example.com',
    registrationDate: new Date(),
    isActive: true,
    identificationVerified: true,
    totalStays: 1,
    medicalNotes: 'Test medical notes',
    behavioralNotes: 'Test behavioral notes',
    preferredBedType: 'standard',
    restrictions: [],
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+12085555678',
      relationship: 'Sister'
    }
  });

  const addTestResult = (message: string, isError: boolean = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✅';
    setTestResults(prev => [...prev, `${prefix} [${timestamp}] ${message}`]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testCredentialsConfiguration = () => {
    addTestResult('Testing Solid Pod credentials configuration...');
    
    if (hasSolidCredentials()) {
      addTestResult(`Pod Owner: ${SOLID_CREDENTIALS.podOwner.identifier}`);
      addTestResult(`WebID: ${SOLID_CREDENTIALS.podOwner.webId}`);
      addTestResult(`Pod URL: ${SOLID_CREDENTIALS.podOwner.podUrl}`);
      addTestResult('Credentials are properly configured');
    } else {
      addTestResult('No credentials found - using interactive authentication', true);
    }
  };

  const testAuthenticationService = () => {
    addTestResult('Testing authentication service...');
    
    try {
      const isAuth = solidAuthService.isAuthenticated();
      const webId = solidAuthService.getWebId();
      const podUrl = solidAuthService.getPodUrl();
      
      addTestResult(`Authentication status: ${isAuth ? 'Authenticated' : 'Not authenticated'}`);
      addTestResult(`WebID: ${webId || 'None'}`);
      addTestResult(`Pod URL: ${podUrl || 'None'}`);
      
      if (isAuth && webId && podUrl) {
        addTestResult('Authentication service working correctly');
      } else {
        addTestResult('Authentication service not fully configured', true);
      }
    } catch (error) {
      addTestResult(`Authentication service error: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  };

  const testContainerUrls = () => {
    addTestResult('Testing Pod container URLs...');
    
    try {
      const shelterUrl = getPodContainerUrl('shelter');
      const clientsUrl = getPodContainerUrl('clients');
      const healthUrl = getPodContainerUrl('health');
      
      addTestResult(`Shelter container: ${shelterUrl}`);
      addTestResult(`Clients container: ${clientsUrl}`);
      addTestResult(`Health container: ${healthUrl}`);
      addTestResult('Container URLs generated successfully');
    } catch (error) {
      addTestResult(`Container URL error: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  };

  const testPodConnection = async () => {
    addTestResult('Testing Pod connection...');
    
    try {
      const fetchFn = solidAuthService.getFetch();
      const podUrl = solidAuthService.getPodUrl();
      
      if (!podUrl) {
        addTestResult('No Pod URL available for connection test', true);
        return;
      }
      
      // Test basic connectivity with a simple GET request
      const response = await fetchFn(podUrl);
      
      if (response.ok) {
        addTestResult(`Pod connection successful - Status: ${response.status}`);
        addTestResult(`Response headers: ${response.headers.get('content-type') || 'Unknown'}`);
      } else {
        addTestResult(`Pod connection failed - Status: ${response.status}`, true);
      }
    } catch (error) {
      addTestResult(`Pod connection error: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  };

  const testDataStorage = async () => {
    addTestResult('Testing data storage to Pod...');
    
    try {
      if (!solidAuthService.isAuthenticated()) {
        addTestResult('Not authenticated - cannot test data storage', true);
        return;
      }
      
      // Test saving a client to the pod
      const result = await solidDataService.saveClientToPod(testClient, true);
      
      if (result) {
        addTestResult(`Client data saved successfully to: ${result}`);
        
        // Test retrieving the client data
        const retrievedData = await solidDataService.getClientFromPod(testClient.id);
        
        if (retrievedData) {
          addTestResult(`Client data retrieved successfully`);
          addTestResult(`Retrieved name: ${retrievedData.firstName} ${retrievedData.lastName}`);
          addTestResult(`Retrieved consent: ${retrievedData.consentGiven}`);
        } else {
          addTestResult('Failed to retrieve saved client data', true);
        }
      } else {
        addTestResult('Failed to save client data to Pod', true);
      }
    } catch (error) {
      addTestResult(`Data storage error: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();
    
    try {
      addTestResult('🧪 Starting Solid Pod Integration Tests...');
      
      // Run tests sequentially
      testCredentialsConfiguration();
      testAuthenticationService();
      testContainerUrls();
      await testPodConnection();
      await testDataStorage();
      
      addTestResult('✨ All tests completed');
    } catch (error) {
      addTestResult(`Test suite error: ${error instanceof Error ? error.message : String(error)}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Solid Pod Integration Test</h2>
        <div className="flex space-x-2">
          <button
            onClick={clearResults}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {/* Test Configuration */}
      <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Test Configuration</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Pod Owner:</strong> {SOLID_CREDENTIALS.podOwner.identifier}</div>
          <div><strong>Pod URL:</strong> {SOLID_CREDENTIALS.podOwner.podUrl}</div>
          <div><strong>Authentication:</strong> {hasSolidCredentials() ? 'Token-based' : 'Interactive'}</div>
          <div><strong>Test Client ID:</strong> {testClient.id}</div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">Test Results</h3>
        <div className="bg-black text-green-400 text-sm font-mono p-4 rounded-lg max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500">Click "Run Tests" to start testing Solid Pod integration...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={testCredentialsConfiguration}
          disabled={isLoading}
          className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Test Credentials
        </button>
        <button
          onClick={testAuthenticationService}
          disabled={isLoading}
          className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Test Auth Service
        </button>
        <button
          onClick={testContainerUrls}
          disabled={isLoading}
          className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Test URLs
        </button>
        <button
          onClick={testPodConnection}
          disabled={isLoading}
          className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Test Connection
        </button>
      </div>

      {/* Help */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Testing Information</h4>
        <p className="text-xs text-blue-700">
          This test suite verifies that your Solid Pod integration is working correctly. 
          It tests credential configuration, authentication, container URLs, Pod connectivity, 
          and data storage/retrieval operations.
        </p>
      </div>
    </div>
  );
};

export default SolidPodTest;