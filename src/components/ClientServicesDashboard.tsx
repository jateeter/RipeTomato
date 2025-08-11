/**
 * Client Services Dashboard
 * 
 * Client-facing dashboard for accessing all community services,
 * managing personal documents via Solid Pods, and tracking service history.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import {
  ClientServiceDashboard as DashboardData,
  AvailableService,
  ServiceRequest,
  CompletedServiceRecord,
  SharedDocument,
  ServiceAppointment,
  ClientNotification,
  CommunityServiceType,
  COMMUNITY_SERVICE_TYPES
} from '../types/CommunityServices';
import { UnifiedDataOwner } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';
import QRCode from 'qrcode';

interface ClientServicesDashboardProps {
  clientId: string;
}

export const ClientServicesDashboard: React.FC<ClientServicesDashboardProps> = ({
  clientId
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'appointments' | 'documents' | 'history' | 'profile'>('overview');
  const [selectedService, setSelectedService] = useState<CommunityServiceType>('shelter');
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, [clientId]);

  const loadDashboardData = async () => {
    try {
      const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
      if (!owner) {
        throw new Error('Client not found');
      }

      const mockDashboardData = createMockDashboardData(owner);
      setDashboardData(mockDashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMockDashboardData = (owner: UnifiedDataOwner): DashboardData => {
    const availableServices: AvailableService[] = [
      {
        serviceType: 'shelter',
        serviceName: 'Overnight Shelter',
        location: 'Main Community Center',
        nextAvailable: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        requirements: [
          { requirementType: 'id_required', description: 'Valid ID required', isStrict: false }
        ],
        estimatedWaitTime: 15,
        description: 'Safe overnight accommodation with meals and basic services'
      },
      {
        serviceType: 'food_water',
        serviceName: 'Community Meals',
        location: 'Food Service Center',
        nextAvailable: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        requirements: [],
        estimatedWaitTime: 5,
        description: 'Hot meals served daily with nutritious options'
      },
      {
        serviceType: 'sanitation',
        serviceName: 'Shower Facilities',
        location: 'Hygiene Center',
        nextAvailable: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
        requirements: [
          { requirementType: 'appointment_only', description: 'Appointment required', isStrict: true }
        ],
        estimatedWaitTime: 20,
        description: 'Clean shower facilities with complimentary hygiene supplies'
      },
      {
        serviceType: 'transportation',
        serviceName: 'Community Bus',
        location: 'Transit Hub',
        nextAvailable: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        requirements: [],
        estimatedWaitTime: 10,
        description: 'Free transportation to medical appointments and job interviews'
      }
    ];

    const activeRequests: ServiceRequest[] = [
      {
        requestId: 'req-1',
        clientId,
        serviceType: 'shelter',
        requestType: 'bed_reservation',
        priority: 'medium',
        status: 'approved',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000),
        location: 'Main Community Center',
        details: {
          bedType: 'standard',
          duration: 1,
          specialRequirements: []
        }
      }
    ];

    const serviceHistory: CompletedServiceRecord[] = [
      {
        serviceId: 'service-1',
        serviceType: 'food_water',
        serviceName: 'Community Meal',
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        outcome: {
          outcomeType: 'successful',
          description: 'Meal provided successfully',
          resourcesUsed: [{ resourceType: 'Food', quantityUsed: 1 }],
          followUpRequired: false
        },
        location: 'Food Service Center',
        staffMember: 'Sarah Johnson'
      },
      {
        serviceId: 'service-2',
        serviceType: 'sanitation',
        serviceName: 'Shower Facility',
        completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        outcome: {
          outcomeType: 'successful',
          description: 'Shower facility used successfully',
          resourcesUsed: [
            { resourceType: 'Towel', quantityUsed: 1 },
            { resourceType: 'Soap', quantityUsed: 1 }
          ],
          followUpRequired: false
        },
        location: 'Hygiene Center',
        staffMember: 'Mike Davis'
      }
    ];

    const documentsShared: SharedDocument[] = [
      {
        documentId: 'doc-1',
        documentName: 'ID Verification',
        documentType: 'identification',
        solidPodUrl: 'https://solidcommunity.net/profile/card#me',
        sharedWith: ['shelter-staff', 'case-manager'],
        sharedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        accessLevel: 'view',
        qrCode: 'qr-doc-1'
      },
      {
        documentId: 'doc-2',
        documentName: 'Medical Records',
        documentType: 'medical',
        solidPodUrl: 'https://solidcommunity.net/profile/medical#records',
        sharedWith: ['medical-staff'],
        sharedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
        accessLevel: 'view',
        qrCode: 'qr-doc-2'
      }
    ];

    const upcomingAppointments: ServiceAppointment[] = [
      {
        appointmentId: 'apt-1',
        serviceType: 'shelter',
        serviceName: 'Check-in Appointment',
        scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000),
        location: 'Main Community Center',
        staffMember: 'Jennifer Smith',
        duration: 30,
        requirements: ['Valid ID', 'Health screening'],
        confirmationRequired: true,
        reminderSent: false
      },
      {
        appointmentId: 'apt-2',
        serviceType: 'transportation',
        serviceName: 'Medical Transport',
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        location: 'Transit Hub',
        duration: 60,
        requirements: ['Medical appointment confirmation'],
        confirmationRequired: false,
        reminderSent: true
      }
    ];

    const notifications: ClientNotification[] = [
      {
        notificationId: 'notif-1',
        type: 'appointment_reminder',
        title: 'Upcoming Check-in',
        message: 'Your shelter check-in appointment is in 4 hours. Please arrive 15 minutes early.',
        priority: 'high',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        actionRequired: {
          actionType: 'confirm_appointment',
          deadline: new Date(Date.now() + 3 * 60 * 60 * 1000)
        }
      },
      {
        notificationId: 'notif-2',
        type: 'service_available',
        title: 'Shower Slot Available',
        message: 'A shower slot has opened up for this afternoon at 2:00 PM.',
        priority: 'medium',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    ];

    return {
      clientId,
      owner,
      availableServices,
      activeRequests,
      serviceHistory,
      documentsShared,
      upcomingAppointments,
      notifications
    };
  };

  const generateDocumentQRCode = async (documentId: string): Promise<void> => {
    try {
      const document = dashboardData?.documentsShared.find(d => d.documentId === documentId);
      if (!document) return;

      const qrData = {
        type: 'document_access',
        documentId: document.documentId,
        solidPodUrl: document.solidPodUrl,
        accessLevel: document.accessLevel,
        expiresAt: document.expiresAt?.toISOString(),
        sharedBy: clientId
      };

      const qrDataString = JSON.stringify(qrData);
      const qrImageUrl = await QRCode.toDataURL(qrDataString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeData(qrImageUrl);
      setShowQRCode(documentId);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const requestService = async (serviceType: CommunityServiceType): Promise<void> => {
    try {
      // In a real implementation, this would make an API call
      const newRequest: ServiceRequest = {
        requestId: `req-${Date.now()}`,
        clientId,
        serviceType,
        requestType: 'general_request',
        priority: 'medium',
        status: 'submitted',
        submittedAt: new Date(),
        location: 'TBD',
        details: {
          requestedBy: clientId,
          urgency: 'normal'
        }
      };

      // Update dashboard data
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          activeRequests: [...dashboardData.activeRequests, newRequest]
        });
      }

      console.log(`Service requested: ${serviceType}`);
    } catch (error) {
      console.error('Failed to request service:', error);
    }
  };

  const confirmAppointment = async (appointmentId: string): Promise<void> => {
    try {
      // In a real implementation, this would make an API call
      if (dashboardData) {
        const updatedAppointments = dashboardData.upcomingAppointments.map(apt =>
          apt.appointmentId === appointmentId
            ? { ...apt, confirmationRequired: false }
            : apt
        );

        const updatedNotifications = dashboardData.notifications.map(notif =>
          notif.actionRequired?.actionType === 'confirm_appointment'
            ? { ...notif, readAt: new Date(), actionRequired: undefined }
            : notif
        );

        setDashboardData({
          ...dashboardData,
          upcomingAppointments: updatedAppointments,
          notifications: updatedNotifications
        });
      }

      console.log(`Appointment confirmed: ${appointmentId}`);
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
    }
  };

  const getServiceIcon = (serviceType: CommunityServiceType): string => {
    switch (serviceType) {
      case 'shelter': return '🏠';
      case 'food_water': return '🍽️';
      case 'sanitation': return '🚿';
      case 'transportation': return '🚌';
      default: return '🏢';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Unable to load your personal dashboard</p>
          <button
            onClick={loadDashboardData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {dashboardData.owner.firstName}
                </h1>
                <p className="text-gray-600">Community Services Hub</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connected to your Solid Pod
                </div>
                <div className="relative">
                  <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                    🔔
                  </button>
                  {dashboardData.notifications.filter(n => !n.readAt).length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {dashboardData.notifications.filter(n => !n.readAt).length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.activeRequests.filter(r => r.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-500">Active Services</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">📅</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.upcomingAppointments.length}
                </div>
                <div className="text-sm text-gray-500">Appointments</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-purple-500 mr-4">📄</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.documentsShared.length}
                </div>
                <div className="text-sm text-gray-500">Shared Documents</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl text-orange-500 mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dashboardData.serviceHistory.length}
                </div>
                <div className="text-sm text-gray-500">Services Used</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'services', label: 'Request Services', icon: '🏢' },
              { id: 'appointments', label: 'My Appointments', icon: '📅' },
              { id: 'documents', label: 'My Documents', icon: '📄' },
              { id: 'history', label: 'Service History', icon: '📊' },
              { id: 'profile', label: 'My Profile', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

        {/* Tab Content */}
        <div className="min-h-96">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Active Services */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Active Services</h3>
                  {dashboardData.activeRequests.length === 0 ? (
                    <p className="text-gray-500">No active service requests</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.activeRequests.map((request) => (
                        <div key={request.requestId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getServiceIcon(request.serviceType)}</span>
                            <div>
                              <div className="font-medium">{request.requestType.replace('_', ' ')}</div>
                              <div className="text-sm text-gray-500">{request.location}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
                  {dashboardData.notifications.length === 0 ? (
                    <p className="text-gray-500">No notifications</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.notifications.slice(0, 3).map((notification) => (
                        <div key={notification.notificationId} className={`p-3 rounded border-l-4 ${getPriorityColor(notification.priority)}`}>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                          <div className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </div>
                          {notification.actionRequired && (
                            <button
                              onClick={() => {
                                if (notification.actionRequired?.actionType === 'confirm_appointment') {
                                  const appointment = dashboardData.upcomingAppointments.find(apt => apt.confirmationRequired);
                                  if (appointment) {
                                    confirmAppointment(appointment.appointmentId);
                                  }
                                }
                              }}
                              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              {notification.actionRequired.actionType.replace('_', ' ').toUpperCase()}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Upcoming Appointments */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
                  {dashboardData.upcomingAppointments.length === 0 ? (
                    <p className="text-gray-500">No upcoming appointments</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.upcomingAppointments.map((appointment) => (
                        <div key={appointment.appointmentId} className="p-3 bg-blue-50 rounded">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getServiceIcon(appointment.serviceType)}</span>
                              <div>
                                <div className="font-medium">{appointment.serviceName}</div>
                                <div className="text-sm text-gray-600">{appointment.location}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(appointment.scheduledFor).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            {appointment.confirmationRequired && (
                              <button
                                onClick={() => confirmAppointment(appointment.appointmentId)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Confirm
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('services')}
                      className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center"
                    >
                      <div className="text-2xl mb-1">🏢</div>
                      <div className="text-sm font-medium">Request Service</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center"
                    >
                      <div className="text-2xl mb-1">📄</div>
                      <div className="text-sm font-medium">Share Document</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center"
                    >
                      <div className="text-2xl mb-1">📅</div>
                      <div className="text-sm font-medium">Schedule</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-center"
                    >
                      <div className="text-2xl mb-1">👤</div>
                      <div className="text-sm font-medium">Update Profile</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {dashboardData.availableServices.map((service) => (
                  <div key={service.serviceType} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-4xl">{getServiceIcon(service.serviceType)}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{service.serviceName}</h3>
                        <p className="text-gray-600 text-sm">{service.location}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{service.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Next Available:</span>
                        <span className="font-medium">
                          {new Date(service.nextAvailable).toLocaleTimeString()}
                        </span>
                      </div>
                      {service.estimatedWaitTime && (
                        <div className="flex justify-between text-sm">
                          <span>Wait Time:</span>
                          <span className="font-medium">{service.estimatedWaitTime} min</span>
                        </div>
                      )}
                      {service.cost && (
                        <div className="flex justify-between text-sm">
                          <span>Cost:</span>
                          <span className="font-medium">${service.cost}</span>
                        </div>
                      )}
                    </div>

                    {service.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Requirements:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {service.requirements.map((req, index) => (
                            <li key={index} className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${req.isStrict ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                              {req.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      onClick={() => requestService(service.serviceType)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Request Service
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Your Appointments</h3>
                {dashboardData.upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                    <p className="text-gray-500">No appointments scheduled</p>
                    <button
                      onClick={() => setActiveTab('services')}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Request a Service
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.upcomingAppointments.map((appointment) => (
                      <div key={appointment.appointmentId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{getServiceIcon(appointment.serviceType)}</span>
                            <div>
                              <h4 className="font-semibold">{appointment.serviceName}</h4>
                              <p className="text-gray-600">{appointment.location}</p>
                            </div>
                          </div>
                          {appointment.confirmationRequired && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              Confirmation Required
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Date & Time:</span><br />
                            {new Date(appointment.scheduledFor).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span><br />
                            {appointment.duration} minutes
                          </div>
                          <div>
                            <span className="font-medium">Staff Member:</span><br />
                            {appointment.staffMember || 'TBA'}
                          </div>
                          <div>
                            <span className="font-medium">Reminder:</span><br />
                            {appointment.reminderSent ? '✅ Sent' : '⏳ Pending'}
                          </div>
                        </div>

                        {appointment.requirements.length > 0 && (
                          <div className="mb-3">
                            <span className="font-medium text-sm">Requirements:</span>
                            <ul className="text-sm text-gray-600 mt-1">
                              {appointment.requirements.map((req, index) => (
                                <li key={index} className="flex items-center">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {appointment.confirmationRequired && (
                            <button
                              onClick={() => confirmAppointment(appointment.appointmentId)}
                              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                            >
                              Confirm Appointment
                            </button>
                          )}
                          <button className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                            Reschedule
                          </button>
                          <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Shared Documents</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Stored in your Solid Pod
                  </div>
                </div>

                {dashboardData.documentsShared.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                    <p className="text-gray-500">No documents shared</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Upload documents to your Solid Pod to share them with service providers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.documentsShared.map((document) => (
                      <div key={document.documentId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-3xl">📄</div>
                            <div>
                              <h4 className="font-semibold">{document.documentName}</h4>
                              <p className="text-gray-600 text-sm capitalize">{document.documentType}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            document.accessLevel === 'full' ? 'bg-red-100 text-red-800' :
                            document.accessLevel === 'download' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {document.accessLevel.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="font-medium">Shared With:</span><br />
                            {document.sharedWith.join(', ')}
                          </div>
                          <div>
                            <span className="font-medium">Shared Date:</span><br />
                            {new Date(document.sharedAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span><br />
                            {document.expiresAt ? new Date(document.expiresAt).toLocaleDateString() : 'Never'}
                          </div>
                          <div>
                            <span className="font-medium">Access Level:</span><br />
                            {document.accessLevel}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => generateDocumentQRCode(document.documentId)}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                          >
                            Generate QR Code
                          </button>
                          <button className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                            Update Access
                          </button>
                          <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                            Revoke Access
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Service History</h3>
                {dashboardData.serviceHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <p className="text-gray-500">No service history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.serviceHistory.map((record) => (
                      <div key={record.serviceId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{getServiceIcon(record.serviceType)}</span>
                            <div>
                              <h4 className="font-semibold">{record.serviceName}</h4>
                              <p className="text-gray-600 text-sm">{record.location}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {new Date(record.completedAt).toLocaleDateString()}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                              record.outcome.outcomeType === 'successful' ? 'bg-green-100 text-green-800' :
                              record.outcome.outcomeType === 'partially_successful' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {record.outcome.outcomeType.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{record.outcome.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Staff Member:</span><br />
                            {record.staffMember}
                          </div>
                          <div>
                            <span className="font-medium">Resources Used:</span><br />
                            {record.outcome.resourcesUsed.map(r => r.resourceType).join(', ')}
                          </div>
                          <div>
                            <span className="font-medium">Follow-up:</span><br />
                            {record.outcome.followUpRequired ? 'Required' : 'Not needed'}
                          </div>
                        </div>

                        {record.clientSatisfaction && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">Your Rating:</span>
                              <div className="flex items-center">
                                {'⭐'.repeat(record.clientSatisfaction.rating)}
                                <span className="ml-2 text-sm">{record.clientSatisfaction.rating}/5</span>
                              </div>
                            </div>
                            {record.clientSatisfaction.comments && (
                              <p className="text-sm text-gray-600 mt-2">"{record.clientSatisfaction.comments}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={dashboardData.owner.firstName}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={dashboardData.owner.lastName}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={dashboardData.owner.email}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={dashboardData.owner.phone}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Data Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">HAT Data Vault</div>
                      <div className="text-sm text-gray-600">Personal data microserver status</div>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                      {dashboardData.owner.hatVault.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Solid Pod Connection</div>
                      <div className="text-sm text-gray-600">Document storage and sharing</div>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm">
                      CONNECTED
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Apple Wallet Passes</div>
                      <div className="text-sm text-gray-600">Digital access passes</div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                      {dashboardData.owner.walletAccess.passes.length} ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && qrCodeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Document Access QR Code</h3>
              <div className="mb-4">
                <img src={qrCodeData} alt="Document QR Code" className="mx-auto" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Show this QR code to staff to grant access to your document
              </p>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setShowQRCode(null);
                    setQrCodeData(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Close
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};