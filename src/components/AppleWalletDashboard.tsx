import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { appleWalletService } from '../services/appleWalletService';
import { AppleWalletPass, ShelterPass, HealthCredential, IdentificationPass, WalletServiceStats } from '../types/AppleWallet';
import { Client } from '../types/Shelter';

interface AppleWalletDashboardProps {
  staffId?: string;
  selectedClient?: Client | null;
}

const AppleWalletDashboard: React.FC<AppleWalletDashboardProps> = ({ staffId, selectedClient }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage' | 'stats'>('overview');
  const [passes, setPasses] = useState<AppleWalletPass[]>([]);
  const [stats, setStats] = useState<WalletServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create pass form states
  const [createPassType, setCreatePassType] = useState<'shelter' | 'health' | 'identification'>('shelter');
  const [selectedClientForPass, setSelectedClientForPass] = useState<Client | null>(selectedClient || null);
  const [passForm, setPassForm] = useState({
    bedNumber: '',
    services: [] as string[],
    credentialType: 'medical_id' as HealthCredential['credentialType'],
    documentType: 'shelter_id' as IdentificationPass['documentType'],
    documentNumber: '',
    healthData: {
      bloodType: '',
      allergies: [] as string[],
      medications: [] as string[],
      emergencyContacts: [] as any[]
    }
  });

  useEffect(() => {
    loadWalletData();
  }, [selectedClient]);

  const loadWalletData = async () => {
    setIsLoading(true);
    try {
      if (selectedClient) {
        const clientPasses = appleWalletService.getClientPasses(selectedClient.id);
        setPasses(clientPasses);
      } else {
        // Load all passes for staff view
        setPasses([]);
      }
      
      const walletStats = appleWalletService.getStatistics();
      setStats(walletStats);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShelterPass = async () => {
    if (!selectedClientForPass) {
      window.alert('Please select a client first');
      return;
    }

    setIsLoading(true);
    try {
      const shelterPass = await appleWalletService.createShelterPass(
        selectedClientForPass,
        passForm.bedNumber || undefined,
        passForm.services
      );
      
      setPasses(prev => [...prev, shelterPass]);
      resetPassForm();
      window.alert(`✅ Shelter access pass created for ${selectedClientForPass.firstName} ${selectedClientForPass.lastName}`);
    } catch (error) {
      console.error('Failed to create shelter pass:', error);
      window.alert('❌ Failed to create shelter pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHealthCredential = async () => {
    if (!selectedClientForPass) {
      window.alert('Please select a client first');
      return;
    }

    setIsLoading(true);
    try {
      const healthCredential = await appleWalletService.createHealthCredential(
        selectedClientForPass,
        passForm.credentialType,
        passForm.healthData.bloodType || passForm.healthData.allergies.length > 0 ? passForm.healthData : undefined
      );
      
      setPasses(prev => [...prev, healthCredential]);
      resetPassForm();
      window.alert(`✅ Health credential created for ${selectedClientForPass.firstName} ${selectedClientForPass.lastName}`);
    } catch (error) {
      console.error('Failed to create health credential:', error);
      window.alert('❌ Failed to create health credential');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIdentificationPass = async () => {
    if (!selectedClientForPass || !passForm.documentNumber) {
      window.alert('Please select a client and enter document number');
      return;
    }

    setIsLoading(true);
    try {
      const idPass = await appleWalletService.createIdentificationPass(
        selectedClientForPass,
        passForm.documentType,
        passForm.documentNumber
      );
      
      setPasses(prev => [...prev, idPass]);
      resetPassForm();
      window.alert(`✅ Identification pass created for ${selectedClientForPass.firstName} ${selectedClientForPass.lastName}`);
    } catch (error) {
      console.error('Failed to create identification pass:', error);
      window.alert('❌ Failed to create identification pass');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokePass = async (passId: string) => {
    if (!window.confirm('Are you sure you want to revoke this pass?')) return;

    setIsLoading(true);
    try {
      await appleWalletService.revokePass(passId);
      setPasses(prev => prev.map(pass => 
        pass.id === passId ? { ...pass, voided: true } : pass
      ));
      window.alert('✅ Pass revoked successfully');
    } catch (error) {
      console.error('Failed to revoke pass:', error);
      window.alert('❌ Failed to revoke pass');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassForm = () => {
    setPassForm({
      bedNumber: '',
      services: [],
      credentialType: 'medical_id',
      documentType: 'shelter_id',
      documentNumber: '',
      healthData: {
        bloodType: '',
        allergies: [],
        medications: [],
        emergencyContacts: []
      }
    });
  };

  const getPassIcon = (passTypeIdentifier: string) => {
    if (passTypeIdentifier.includes('shelter')) return '🏠';
    if (passTypeIdentifier.includes('health')) return '🏥';
    if (passTypeIdentifier.includes('id')) return '🆔';
    return '🎫';
  };

  const getPassTypeName = (passTypeIdentifier: string) => {
    if (passTypeIdentifier.includes('shelter')) return 'Shelter Access';
    if (passTypeIdentifier.includes('health')) return 'Health Credential';
    if (passTypeIdentifier.includes('id')) return 'Identification';
    return 'Pass';
  };

  const mockClient: Client = {
    id: 'demo-client-001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1985-05-15'),
    phone: '+1-208-555-0123',
    email: 'john.doe@example.com',
    registrationDate: new Date(),
    isActive: true,
    identificationVerified: true,
    totalStays: 3,
    preferredBedType: 'standard',
    restrictions: []
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">📱</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Apple Wallet Integration</h2>
              <p className="text-gray-600">Digital passes for shelter services and identification</p>
            </div>
          </div>
          
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPasses}</div>
              <div className="text-sm text-gray-500">Total Passes</div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-500 text-2xl mr-3">✅</span>
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.activepasses}</div>
                <div className="text-sm text-green-600">Active Passes</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-blue-500 text-2xl mr-3">📲</span>
              <div>
                <div className="text-2xl font-bold text-blue-800">{stats.recentInstalls}</div>
                <div className="text-sm text-blue-600">Recent Installs</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-orange-500 text-2xl mr-3">🔄</span>
              <div>
                <div className="text-2xl font-bold text-orange-800">{stats.updatesSent}</div>
                <div className="text-sm text-orange-600">Updates Sent</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-purple-500 text-2xl mr-3">📊</span>
              <div>
                <div className="text-2xl font-bold text-purple-800">{Object.keys(stats.passByType).length}</div>
                <div className="text-sm text-purple-600">Pass Types</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6 py-3">
            {[
              { id: 'overview', label: 'Pass Overview', icon: '📋' },
              { id: 'create', label: 'Create Pass', icon: '➕' },
              { id: 'manage', label: 'Manage Passes', icon: '⚙️' },
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Digital Wallet Passes</h3>
              
              {passes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📱</div>
                  <p>No wallet passes created yet</p>
                  <p className="text-sm mt-2">Create digital passes for shelter access, health credentials, and identification</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {passes.map(pass => (
                    <div key={pass.id} className={`border rounded-lg p-4 ${pass.voided ? 'opacity-50 border-red-300' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getPassIcon(pass.passTypeIdentifier)}</span>
                          <div>
                            <h4 className="font-medium">{getPassTypeName(pass.passTypeIdentifier)}</h4>
                            <p className="text-sm text-gray-500">{pass.serialNumber}</p>
                          </div>
                        </div>
                        {pass.voided && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Revoked
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div><strong>Client:</strong> {(pass as any).clientName || 'Unknown'}</div>
                        <div><strong>Created:</strong> {format(pass.createdAt, 'MMM d, yyyy')}</div>
                        <div><strong>Status:</strong> {pass.voided ? 'Revoked' : 'Active'}</div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => window.open(appleWalletService.generatePassURL(pass.id))}
                          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          📲 Add to Wallet
                        </button>
                        {!pass.voided && (
                          <button
                            onClick={() => handleRevokePass(pass.id)}
                            className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Pass Tab */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Create New Wallet Pass</h3>
              
              {/* Client Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">👤 Client Selection</h4>
                <div className="text-sm text-blue-700">
                  <p>Creating pass for: <strong>{selectedClient?.firstName} {selectedClient?.lastName}</strong> (Demo Client)</p>
                  <p className="text-xs mt-1">In production, you would select from the client database</p>
                </div>
              </div>
              
              {/* Pass Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Pass Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'shelter', icon: '🏠', title: 'Shelter Access', desc: 'Bed assignment and shelter services' },
                    { id: 'health', icon: '🏥', title: 'Health Credential', desc: 'Medical information and health records' },
                    { id: 'identification', icon: '🆔', title: 'Identification', desc: 'Digital ID card for verification' }
                  ].map(type => (
                    <div
                      key={type.id}
                      onClick={() => setCreatePassType(type.id as any)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        createPassType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{type.icon}</div>
                        <h4 className="font-medium">{type.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{type.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pass-specific Forms */}
              {createPassType === 'shelter' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number (Optional)</label>
                    <input
                      type="text"
                      value={passForm.bedNumber}
                      onChange={(e) => setPassForm(prev => ({ ...prev, bedNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., A-15"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Services</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Meals', 'Laundry', 'Showers', 'Storage', 'Mail', 'Phone', 'WiFi', 'Counseling'].map(service => (
                        <label key={service} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={passForm.services.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPassForm(prev => ({ ...prev, services: [...prev.services, service] }));
                              } else {
                                setPassForm(prev => ({ ...prev, services: prev.services.filter(s => s !== service) }));
                              }
                            }}
                            className="text-blue-600"
                          />
                          <span className="text-sm">{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCreateShelterPass}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : '🏠 Create Shelter Pass'}
                  </button>
                </div>
              )}

              {createPassType === 'health' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential Type</label>
                    <select
                      value={passForm.credentialType}
                      onChange={(e) => setPassForm(prev => ({ ...prev, credentialType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="medical_id">Medical ID</option>
                      <option value="vaccination">Vaccination Record</option>
                      <option value="insurance">Insurance Card</option>
                      <option value="allergy_alert">Allergy Alert</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type (Optional)</label>
                    <select
                      value={passForm.healthData.bloodType}
                      onChange={(e) => setPassForm(prev => ({ 
                        ...prev, 
                        healthData: { ...prev.healthData, bloodType: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={handleCreateHealthCredential}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : '🏥 Create Health Credential'}
                  </button>
                </div>
              )}

              {createPassType === 'identification' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <select
                      value={passForm.documentType}
                      onChange={(e) => setPassForm(prev => ({ ...prev, documentType: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="shelter_id">Shelter ID</option>
                      <option value="temporary_id">Temporary ID</option>
                      <option value="service_card">Service Card</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Number *</label>
                    <input
                      type="text"
                      value={passForm.documentNumber}
                      onChange={(e) => setPassForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., ID-2024-001"
                      required
                    />
                  </div>
                  
                  <button
                    onClick={handleCreateIdentificationPass}
                    disabled={isLoading || !passForm.documentNumber}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : '🆔 Create Identification Pass'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manage Passes Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pass Management</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">📱 Pass Management Features</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Update pass information and send push notifications</li>
                  <li>• Revoke passes for lost devices or security concerns</li>
                  <li>• Track pass usage and installation analytics</li>
                  <li>• Manage pass permissions and access levels</li>
                </ul>
              </div>
              
              {passes.length > 0 && (
                <div className="space-y-3">
                  {passes.map(pass => (
                    <div key={pass.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{getPassTypeName(pass.passTypeIdentifier)}</h4>
                          <p className="text-sm text-gray-500">{pass.serialNumber}</p>
                          <p className="text-xs text-gray-400">
                            Created: {format(pass.createdAt, 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            Update
                          </button>
                          <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded">
                            Analytics
                          </button>
                          {!pass.voided && (
                            <button
                              onClick={() => handleRevokePass(pass.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Wallet Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Pass Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.passByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Usage Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Passes Created:</span>
                      <span className="font-medium">{stats.totalPasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currently Active:</span>
                      <span className="font-medium">{stats.activepasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recent Installs:</span>
                      <span className="font-medium">{stats.recentInstalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updates Sent:</span>
                      <span className="font-medium">{stats.updatesSent}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppleWalletDashboard;