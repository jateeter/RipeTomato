import React, { useState } from 'react';
import BedAvailabilityDashboard from './BedAvailabilityDashboard';
import NotificationCenter from './NotificationCenter';
import CheckInVerification from './CheckInVerification';
import ClientRegistration from './ClientRegistration';
import SolidAuthPanel from './SolidAuthPanel';
import ConsentManager from './ConsentManager';
import HealthDashboard from './HealthDashboard';
import CommunicationDashboard from './CommunicationDashboard';
import AgentServicesDashboard from './AgentServicesDashboard';
import AppleWalletDashboard from './AppleWalletDashboard';
import DataswiftHATDashboard from './DataswiftHATDashboard';
import UnifiedDataOwnershipDashboard from './UnifiedDataOwnershipDashboard';
import { BedReservation, CheckInSession, Client, Bed } from '../types/Shelter';
import { useSolidData } from '../hooks/useSolidData';

type ViewMode = 'dashboard' | 'notifications' | 'checkin' | 'register' | 'clients' | 'solid' | 'consent' | 'health' | 'communication' | 'agents' | 'wallet' | 'dataswift' | 'unified';

const ShelterApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedReservation, setSelectedReservation] = useState<BedReservation | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isStaffMode, setIsStaffMode] = useState(true); // Default to staff view
  
  const { 
    isAuthenticated: isSolidAuthenticated, 
    saveClient, 
    saveCheckInSession, 
    getPodUrl 
  } = useSolidData();

  const handleBedSelect = (bed: Bed) => {
    console.log('Bed selected:', bed);
    // Handle bed selection logic
  };

  const handleReservationSelect = (reservation: BedReservation) => {
    setSelectedReservation(reservation);
    setCurrentView('checkin');
  };

  const handleCheckInComplete = async (session: CheckInSession) => {
    console.log('Check-in completed:', session);
    
    // Save check-in session to Solid Pod if authenticated
    if (isSolidAuthenticated && selectedReservation) {
      const podUrl = getPodUrl();
      if (podUrl) {
        try {
          await saveCheckInSession(session, podUrl);
          console.log('Check-in session saved to Solid Pod');
        } catch (error) {
          console.error('Failed to save check-in session to pod:', error);
        }
      }
    }
    
    setSelectedReservation(null);
    setCurrentView('dashboard');
  };

  const handleCheckInCancel = () => {
    setSelectedReservation(null);
    setCurrentView('dashboard');
  };

  const handleClientRegistered = async (client: Client) => {
    console.log('Client registered:', client);
    
    // Save client to Solid Pod if authenticated
    if (isSolidAuthenticated) {
      try {
        const success = await saveClient(client, true); // true = consent given
        if (success) {
          console.log('Client data saved to Solid Pod');
        }
      } catch (error) {
        console.error('Failed to save client to pod:', error);
      }
    }
    
    setSelectedClient(null);
    setCurrentView('clients');
  };

  const handleRegistrationCancel = () => {
    setSelectedClient(null);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <BedAvailabilityDashboard
            onBedSelect={handleBedSelect}
            onReservationSelect={handleReservationSelect}
          />
        );

      case 'notifications':
        return (
          <NotificationCenter
            staffView={isStaffMode}
            clientId={isStaffMode ? undefined : 'client-1'} // Example client ID
          />
        );

      case 'checkin':
        return selectedReservation ? (
          <CheckInVerification
            reservation={selectedReservation}
            onCheckInComplete={handleCheckInComplete}
            onCancel={handleCheckInCancel}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No reservation selected</p>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        );

      case 'register':
        return (
          <ClientRegistration
            onClientRegistered={handleClientRegistered}
            onCancel={handleRegistrationCancel}
            existingClient={selectedClient || undefined}
            mode={selectedClient ? 'edit' : 'create'}
          />
        );

      case 'clients':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Client Management</h2>
            <p className="text-gray-600 mb-4">Client management features coming soon...</p>
            <button
              onClick={() => setCurrentView('register')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register New Client
            </button>
          </div>
        );

      case 'solid':
        return <SolidAuthPanel />;

      case 'consent':
        return (
          <ConsentManager
            clientId="example-client-1"
            onConsentChange={(hasConsent) => {
              console.log('Consent status changed:', hasConsent);
            }}
          />
        );

      case 'health':
        return (
          <HealthDashboard
            clientId={selectedClient?.id || 'demo-client'}
            isStaffView={isStaffMode}
          />
        );

      case 'communication':
        return (
          <CommunicationDashboard
            staffId={isStaffMode ? 'current-staff-id' : undefined}
            clientId={selectedClient?.id}
            isStaffView={isStaffMode}
          />
        );

      case 'agents':
        return (
          <AgentServicesDashboard
            staffId={isStaffMode ? 'current-staff-id' : undefined}
          />
        );

      case 'wallet':
        return (
          <AppleWalletDashboard
            staffId={isStaffMode ? 'current-staff-id' : undefined}
            selectedClient={selectedClient}
          />
        );

      case 'dataswift':
        return (
          <DataswiftHATDashboard
            staffId={isStaffMode ? 'current-staff-id' : undefined}
            selectedClient={selectedClient}
          />
        );

      case 'unified':
        return (
          <UnifiedDataOwnershipDashboard
            staffId={isStaffMode ? 'current-staff-id' : undefined}
            selectedClient={selectedClient}
          />
        );

      default:
        return <BedAvailabilityDashboard onBedSelect={handleBedSelect} />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Bed Availability';
      case 'notifications':
        return 'Notifications';
      case 'checkin':
        return 'Check-In Process';
      case 'register':
        return selectedClient ? 'Edit Client' : 'Register Client';
      case 'clients':
        return 'Client Management';
      case 'solid':
        return 'Solid Pod Integration';
      case 'consent':
        return 'Data Consent Manager';
      case 'health':
        return 'Health Dashboard';
      case 'communication':
        return 'Communication Center';
      case 'agents':
        return 'Agent Services';
      case 'wallet':
        return 'Apple Wallet Integration';
      case 'dataswift':
        return 'Dataswift HAT Integration';
      case 'unified':
        return 'Unified Data Ownership';
      default:
        return 'Shelter Management';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🏠</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Shelter Management System</h1>
                <p className="text-sm text-gray-600">Idaho Community Shelter</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🛏️ Dashboard
              </button>

              <button
                onClick={() => setCurrentView('notifications')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  currentView === 'notifications'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔔 Notifications
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>

              <button
                onClick={() => setCurrentView('register')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'register'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                👤 Register
              </button>

              <button
                onClick={() => setCurrentView('clients')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'clients'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📋 Clients
              </button>

              <button
                onClick={() => setCurrentView('solid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'solid'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔐 Solid Pod
              </button>

              <button
                onClick={() => setCurrentView('consent')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'consent'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📋 Consent
              </button>

              <button
                onClick={() => setCurrentView('health')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'health'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🏥 Health
              </button>

              <button
                onClick={() => setCurrentView('communication')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'communication'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📞 Communication
              </button>

              <button
                onClick={() => setCurrentView('agents')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'agents'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🤖 Agents
              </button>

              <button
                onClick={() => setCurrentView('wallet')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'wallet'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📱 Wallet
              </button>

              <button
                onClick={() => setCurrentView('dataswift')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'dataswift'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🎩 Dataswift
              </button>

              <button
                onClick={() => setCurrentView('unified')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'unified'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                🔐 Unified
              </button>

              <div className="ml-4 pl-4 border-l border-gray-300 flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  {isStaffMode ? '👩‍💼 Staff' : '👤 Client'} View
                </div>
                <button
                  onClick={() => setIsStaffMode(!isStaffMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isStaffMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isStaffMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getViewTitle()}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>📅 {new Date().toLocaleDateString([], { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
                <span>🕐 {new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  System Online
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            {currentView === 'dashboard' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('register')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  + Register Client
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
            )}
          </div>
        </div>

        {renderCurrentView()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <p>© 2024 Idaho Community Shelter Management System</p>
            </div>
            <div className="flex items-center space-x-4">
              <span>Emergency: (208) 911</span>
              <span>Support: (208) 555-HELP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ShelterApp;