/**
 * Client Management Hub
 * 
 * Central hub for all client-related operations including registration,
 * PII management, and secure data access.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { Session } from '@inrupt/solid-client-authn-browser';
import ClientRegistrationForm from './ClientRegistrationForm';
import PIICredentialManager from './PIICredentialManager';
import SecureClientDataViewer from './SecureClientDataViewer';
import SecurePIIDataService from '../services/securePIIDataService';
import { UserRole, PIIAccessLevel } from '../services/solidPIICredentialManager';
import { ClientRegistrationResult } from '../services/clientRegistrationService';

interface ClientManagementHubProps {
  session: Session;
  shelterPodUrl: string;
}

interface CurrentUser {
  id: string;
  name: string;
  webId: string;
  role: UserRole;
}

export const ClientManagementHub: React.FC<ClientManagementHubProps> = ({
  session,
  shelterPodUrl
}) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'register' | 'client-data' | 'pii-management'>('dashboard');
  const [piiService, setPIIService] = useState<SecurePIIDataService | null>(null);
  const [currentUser] = useState<CurrentUser>({
    id: 'staff_001',
    name: 'Jane Smith',
    webId: session.info.webId || 'https://jane.solid.community/profile/card#me',
    role: UserRole.CASE_MANAGER
  });
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<ClientRegistrationResult[]>([]);
  const [hasSystemAccess, setHasSystemAccess] = useState(false);

  // Initialize PII service
  useEffect(() => {
    const initPIIService = async () => {
      try {
        const service = new SecurePIIDataService(session, shelterPodUrl);
        await service.initialize();
        setPIIService(service);
        setHasSystemAccess(true);
      } catch (error) {
        console.error('Failed to initialize PII service:', error);
      }
    };

    if (session && shelterPodUrl) {
      initPIIService();
    }
  }, [session, shelterPodUrl]);

  // Handle successful registration
  const handleRegistrationComplete = (result: ClientRegistrationResult) => {
    if (result.success) {
      setRecentRegistrations(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      setSelectedClientId(result.clientId);
      setCurrentView('client-data');
    }
  };

  // Handle PII access granted
  const handlePIIAccessGranted = (accessLevel: PIIAccessLevel) => {
    console.log('PII access granted:', accessLevel);
  };

  // Handle PII access revoked
  const handlePIIAccessRevoked = () => {
    console.log('PII access revoked');
    if (currentView === 'client-data') {
      setCurrentView('dashboard');
    }
  };

  // Render navigation
  const renderNavigation = () => (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex space-x-8">
              <button
                data-testid="nav-dashboard"
                onClick={() => setCurrentView('dashboard')}
                className={`${
                  currentView === 'dashboard'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Dashboard
              </button>
              <button
                data-testid="nav-client-registration"
                onClick={() => setCurrentView('register')}
                className={`${
                  currentView === 'register'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                New Registration
              </button>
              <button
                data-testid="nav-pii-management"
                onClick={() => setCurrentView('pii-management')}
                className={`${
                  currentView === 'pii-management'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                PII Access
              </button>
              {selectedClientId && (
                <button
                  data-testid="nav-client-data"
                  onClick={() => setCurrentView('client-data')}
                  className={`${
                    currentView === 'client-data'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Client: {selectedClientId.substring(0, 10)}...
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{currentUser.name}</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render dashboard
  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentView('register')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <span className="text-2xl mb-2 block">👤</span>
                  <h3 className="font-medium text-gray-900">Register New Client</h3>
                  <p className="text-sm text-gray-500">Create secure client pod</p>
                </div>
              </button>
              
              <button
                onClick={() => setCurrentView('pii-management')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <span className="text-2xl mb-2 block">🔐</span>
                  <h3 className="font-medium text-gray-900">Request PII Access</h3>
                  <p className="text-sm text-gray-500">Access client information</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Solid Pod System</span>
                <span className="text-sm text-green-600">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">PII Access Service</span>
                <span className={`text-sm ${hasSystemAccess ? 'text-green-600' : 'text-red-600'}`}>
                  {hasSystemAccess ? '✓ Connected' : '✗ Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm text-green-600">✓ Active</span>
              </div>
            </div>
          </div>

          {recentRegistrations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
              <div className="space-y-2">
                {recentRegistrations.slice(0, 5).map((registration, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => {
                      setSelectedClientId(registration.clientId);
                      setCurrentView('client-data');
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {registration.clientId}
                      </div>
                      <div className="text-xs text-gray-500">
                        Click to view
                      </div>
                    </div>
                    <div className="text-sm text-green-600">✓</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div data-testid="client-management-hub" className="min-h-screen bg-gray-50">
      {renderNavigation()}
      
      <main>
        {currentView === 'dashboard' && renderDashboard()}
        
        {currentView === 'register' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ClientRegistrationForm
              session={session}
              shelterPodUrl={shelterPodUrl}
              currentStaff={currentUser}
              onRegistrationComplete={handleRegistrationComplete}
            />
          </div>
        )}
        
        {currentView === 'pii-management' && piiService && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <PIICredentialManager
              session={session}
              podUrl={shelterPodUrl}
              currentUserId={currentUser.id}
              userRole={currentUser.role}
              onPIIAccessGranted={handlePIIAccessGranted}
              onPIIAccessRevoked={handlePIIAccessRevoked}
            />
          </div>
        )}
        
        {currentView === 'client-data' && selectedClientId && piiService && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Client Data: {selectedClientId}
              </h1>
              <p className="text-gray-600">
                Secure access to client personal information with comprehensive audit logging
              </p>
            </div>
            
            <SecureClientDataViewer
              clientId={selectedClientId}
              piiService={piiService}
              onDataUpdate={(clientId, success) => {
                console.log(`Client ${clientId} data update: ${success ? 'success' : 'failed'}`);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientManagementHub;