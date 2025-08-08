import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { dataswiftHATService } from '../services/dataswiftHATService';
import { 
  HATUser, 
  HATCredentials, 
  HATStats, 
  ShelterDataRecord, 
  HealthDataRecord, 
  CommunicationRecord 
} from '../types/DataswiftHAT';
import { Client } from '../types/Shelter';

interface DataswiftHATDashboardProps {
  staffId?: string;
  selectedClient?: Client | null;
}

const DataswiftHATDashboard: React.FC<DataswiftHATDashboardProps> = ({ staffId, selectedClient }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'authenticate' | 'client-hats' | 'data' | 'stats'>('overview');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<HATUser | null>(null);
  const [credentials, setCredentials] = useState<HATCredentials | null>(null);
  const [hatStats, setHATStats] = useState<HATStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Authentication form
  const [hatDomain, setHatDomain] = useState('');
  const [applicationToken, setApplicationToken] = useState('');
  
  // Client HAT management
  const [clientHATs, setClientHATs] = useState<Record<string, string>>({});
  const [selectedClientData, setSelectedClientData] = useState<ShelterDataRecord[] | null>(null);

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadHATStats();
    }
  }, [isAuthenticated]);

  const initializeService = async () => {
    setIsLoading(true);
    try {
      const initialized = await dataswiftHATService.initialize({
        applicationId: 'idaho-shelter-management-v1',
        namespace: 'idaho-shelter',
        kind: 'shelter-management-app'
      });

      if (initialized) {
        const authStatus = dataswiftHATService.isAuthenticated();
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          const user = dataswiftHATService.getCurrentUser();
          const creds = dataswiftHATService.getCredentials();
          setCurrentUser(user);
          setCredentials(creds);
        }
      }
    } catch (error) {
      console.error('Failed to initialize HAT service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!hatDomain.trim()) {
      window.alert('Please enter a valid HAT domain');
      return;
    }

    setIsLoading(true);
    try {
      const authResult = await dataswiftHATService.authenticate(hatDomain, applicationToken || undefined);
      
      if (authResult) {
        setCredentials(authResult);
        setCurrentUser(dataswiftHATService.getCurrentUser());
        setIsAuthenticated(true);
        window.alert(`✅ Successfully authenticated with HAT: ${authResult.hatDomain}`);
      } else {
        window.alert('❌ Authentication failed. Please check your HAT domain and try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      window.alert('❌ Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClientHAT = async (client: Client) => {
    setIsLoading(true);
    try {
      const hatDomain = await dataswiftHATService.createClientHAT(client);
      
      if (hatDomain) {
        setClientHATs(prev => ({ ...prev, [client.id]: hatDomain }));
        window.alert(`✅ HAT created successfully for ${client.firstName} ${client.lastName}\n\nHAT Domain: ${hatDomain}\n\nThe client now has their own personal data vault.`);
      } else {
        window.alert('❌ Failed to create HAT for client');
      }
    } catch (error) {
      console.error('Failed to create client HAT:', error);
      window.alert('❌ Error creating client HAT: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadClientData = async (clientId: string) => {
    const clientHATDomain = clientHATs[clientId];
    if (!clientHATDomain) {
      window.alert('Client does not have a HAT. Please create one first.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await dataswiftHATService.getClientData(clientId, clientHATDomain);
      setSelectedClientData(data);
      
      if (data && data.length > 0) {
        console.log(`📄 Loaded ${data.length} records for client ${clientId}`);
      } else {
        window.alert('No data found for this client');
      }
    } catch (error) {
      console.error('Failed to load client data:', error);
      window.alert('❌ Error loading client data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadHATStats = async () => {
    try {
      const stats = await dataswiftHATService.getHATStats();
      setHATStats(stats);
    } catch (error) {
      console.error('Failed to load HAT stats:', error);
    }
  };

  const handleLogout = () => {
    dataswiftHATService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCredentials(null);
    setHATStats(null);
    setSelectedClientData(null);
    window.alert('👋 Logged out from Dataswift HAT');
  };

  const mockClient: Client = {
    id: 'demo-client-hat-001',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: new Date('1990-07-22'),
    phone: '+1-208-555-0199',
    email: 'jane.smith@example.com',
    registrationDate: new Date(),
    isActive: true,
    identificationVerified: true,
    totalStays: 2,
    preferredBedType: 'standard',
    restrictions: []
  };

  if (isLoading && !currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading Dataswift HAT...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">🎩</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dataswift HAT Integration</h2>
              <p className="text-gray-600">Hub of All Things - Personal Data Accounts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isAuthenticated ? `Connected: ${credentials?.hatDomain}` : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* Quick stats */}
        {hatStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{hatStats.totalRecords}</div>
              <div className="text-xs text-gray-500">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{hatStats.endpointsCount}</div>
              <div className="text-xs text-gray-500">Data Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{hatStats.applicationsCount}</div>
              <div className="text-xs text-gray-500">Connected Apps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(hatStats.storageUsed / 1024)}KB</div>
              <div className="text-xs text-gray-500">Storage Used</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 py-3">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'authenticate', label: 'Authentication', icon: '🔐' },
              { id: 'client-hats', label: 'Client HATs', icon: '👥' },
              { id: 'data', label: 'Data Management', icon: '💾' },
              { id: 'stats', label: 'Statistics', icon: '📊' }
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Dataswift HAT Overview</h3>
              
              {/* What is HAT */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">🎩 What is a HAT (Hub of All Things)?</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>HAT is a personal data account that gives individuals full control over their data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Personal data microserver owned by the individual</li>
                    <li>Zero-knowledge architecture - service providers cannot access raw data</li>
                    <li>Full data portability and interoperability</li>
                    <li>Programmable privacy controls</li>
                    <li>Data monetization opportunities for users</li>
                  </ul>
                </div>
              </div>

              {/* Shelter Integration Benefits */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">✅ Shelter Integration Benefits</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• <strong>Individual Data Ownership:</strong> Each client owns their personal data</div>
                  <div>• <strong>Privacy by Design:</strong> Shelter cannot access raw personal data</div>
                  <div>• <strong>Data Continuity:</strong> Clients keep their data when moving between services</div>
                  <div>• <strong>Consent Management:</strong> Granular control over data sharing</div>
                  <div>• <strong>Compliance:</strong> Built-in GDPR and privacy regulation compliance</div>
                  <div>• <strong>Interoperability:</strong> Data works across different shelter systems</div>
                </div>
              </div>

              {/* Configuration Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">⚙️ Current Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div><strong>Application ID:</strong> idaho-shelter-management-v1</div>
                    <div><strong>Namespace:</strong> idaho-shelter</div>
                    <div><strong>API Version:</strong> v2.6</div>
                  </div>
                  <div>
                    <div><strong>Domain:</strong> hubofallthings.net</div>
                    <div><strong>Security:</strong> HTTPS Enabled</div>
                    <div><strong>Status:</strong> {isAuthenticated ? '✅ Connected' : '❌ Not Connected'}</div>
                  </div>
                </div>
              </div>

              {/* Supported Data Types */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">📋 Supported Data Endpoints</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
                  {dataswiftHATService.getSupportedEndpoints().map(endpoint => (
                    <div key={endpoint} className="flex items-center space-x-2">
                      <span className="text-purple-500">•</span>
                      <span>{endpoint}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'authenticate' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">HAT Authentication</h3>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3">✅ Connected to HAT</h4>
                    <div className="space-y-2 text-sm text-green-700">
                      <div><strong>HAT Domain:</strong> {credentials?.hatDomain}</div>
                      <div><strong>User Name:</strong> {currentUser?.hatName}</div>
                      <div><strong>Application ID:</strong> {credentials?.applicationId}</div>
                      {credentials?.expires && (
                        <div><strong>Token Expires:</strong> {format(credentials.expires, 'MMM d, yyyy h:mm a')}</div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    🚪 Logout from HAT
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">🔐 HAT Authentication Required</h4>
                    <p className="text-sm text-yellow-700">
                      Enter your HAT domain to connect your personal data account to the shelter management system.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HAT Domain *
                      </label>
                      <input
                        type="text"
                        value={hatDomain}
                        onChange={(e) => setHatDomain(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., yourname123.hubofallthings.net"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Your personal HAT domain from hubofallthings.net
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Token (Optional)
                      </label>
                      <input
                        type="password"
                        value={applicationToken}
                        onChange={(e) => setApplicationToken(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Leave blank to use demo token"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        OAuth token for secure access (optional for demo)
                      </p>
                    </div>

                    <button
                      onClick={handleAuthenticate}
                      disabled={isLoading || !hatDomain.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? '🔄 Connecting...' : '🔐 Connect to HAT'}
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Don't have a HAT?</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Create your personal data account at:
                    </p>
                    <a
                      href="https://hubofallthings.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      hubofallthings.com →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client HATs Tab */}
          {activeTab === 'client-hats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Client HAT Management</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">🏗️ Individual Client HATs</h4>
                <p className="text-sm text-green-700 mb-3">
                  Each shelter client gets their own personal HAT data account for complete data ownership and privacy.
                </p>
                <div className="text-sm text-green-700">
                  <div>• Automatic HAT creation during client registration</div>
                  <div>• Client data stored in their personal HAT, not shelter servers</div>
                  <div>• Full data portability when clients leave or move</div>
                </div>
              </div>

              {/* Demo Client Creation */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-3">Demo: Create Client HAT</h4>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                  <div className="text-sm">
                    <div><strong>Demo Client:</strong> {mockClient.firstName} {mockClient.lastName}</div>
                    <div><strong>Email:</strong> {mockClient.email}</div>
                    <div><strong>Phone:</strong> {mockClient.phone}</div>
                    <div><strong>Client ID:</strong> {mockClient.id}</div>
                  </div>
                </div>
                
                {clientHATs[mockClient.id] ? (
                  <div className="space-y-3">
                    <div className="bg-green-100 border border-green-300 rounded p-3">
                      <div className="text-sm text-green-800">
                        <div><strong>✅ HAT Created:</strong> {clientHATs[mockClient.id]}</div>
                        <div className="mt-2">This client now has their own personal data vault.</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLoadClientData(mockClient.id)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      📄 Load Client Data from HAT
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCreateClientHAT(mockClient)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? '🔄 Creating HAT...' : '🏗️ Create HAT for Demo Client'}
                  </button>
                )}
              </div>

              {/* Client Data Display */}
              {selectedClientData && selectedClientData.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">📄 Client Data from HAT</h4>
                  <div className="space-y-3">
                    {selectedClientData.map((record, index) => (
                      <div key={record.recordId} className="bg-gray-50 border border-gray-200 rounded p-3">
                        <div className="text-sm">
                          <div className="font-medium mb-2">Record {index + 1} (ID: {record.recordId})</div>
                          <div><strong>Name:</strong> {record.data.firstName} {record.data.lastName}</div>
                          <div><strong>Email:</strong> {record.data.email}</div>
                          <div><strong>Phone:</strong> {record.data.phone}</div>
                          <div><strong>Registration:</strong> {record.data.registrationDate}</div>
                          <div><strong>Active:</strong> {record.data.isActive ? 'Yes' : 'No'}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            Created: {record.dateCreated} | Updated: {record.lastUpdated}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
              
              {!isAuthenticated ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔐</div>
                  <p>Please authenticate with your HAT to access data management features</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">💾 Data Storage</h4>
                    <p className="text-sm text-blue-700">
                      All client data is stored in individual HAT accounts with full encryption and privacy controls.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-2">📊 Supported Data Types</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• Personal Information</div>
                        <div>• Health Records</div>
                        <div>• Communication Logs</div>
                        <div>• Check-in Sessions</div>
                        <div>• Consent Records</div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-800 mb-2">🔒 Privacy Features</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>• Zero-knowledge architecture</div>
                        <div>• End-to-end encryption</div>
                        <div>• Granular permissions</div>
                        <div>• Data portability</div>
                        <div>• Automatic compliance</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">HAT Statistics</h3>
              
              {!isAuthenticated ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Please authenticate to view HAT statistics</p>
                </div>
              ) : hatStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{hatStats.totalRecords}</div>
                    <div className="text-sm text-blue-700">Total Data Records</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">{hatStats.endpointsCount}</div>
                    <div className="text-sm text-green-700">Data Endpoints</div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">{hatStats.applicationsCount}</div>
                    <div className="text-sm text-purple-700">Connected Applications</div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">{Math.round(hatStats.storageUsed / 1024)}</div>
                    <div className="text-sm text-orange-700">Storage Used (KB)</div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-600">{hatStats.dataDebitsCount}</div>
                    <div className="text-sm text-red-700">Data Debits</div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-gray-600">{hatStats.accountAge}</div>
                    <div className="text-sm text-gray-700">Account Age (Days)</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⏳</div>
                  <p>Loading HAT statistics...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataswiftHATDashboard;