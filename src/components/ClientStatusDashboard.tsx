/**
 * Client Status Dashboard
 * 
 * Client-focused dashboard emphasizing status updates, notifications,
 * and easy access to services with minimal complexity.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import {
  ClientNotification,
  ServiceAppointment,
  CommunityServiceType
} from '../types/CommunityServices';
import { UnifiedDataOwner, UnifiedDataType, UNIFIED_DATA_TYPES } from '../types/UnifiedDataOwnership';
import { unifiedDataOwnershipService } from '../services/unifiedDataOwnershipService';
import { identityManagementService } from '../services/identityManagementService';
import { personalHealthDataService } from '../services/personalHealthDataService';

interface ClientStatusDashboardProps {
  clientId: string;
}

interface ClientStatus {
  currentServices: ActiveService[];
  upcomingAppointments: ServiceAppointment[];
  notifications: ClientNotification[];
  quickActions: QuickAction[];
  todaySchedule: ScheduleItem[];
  privateData: PrivateDataSummary;
}

interface PrivateDataSummary {
  dataStores: DataStoreStatus[];
  healthDataEnabled: boolean;
  totalRecords: number;
  recentActivity: DataActivityItem[];
  accessRequests: DataAccessRequest[];
}

interface DataStoreStatus {
  type: 'solid_pod' | 'hat' | 'apple_health';
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  recordCount: number;
  lastSync?: Date;
}

interface DataActivityItem {
  timestamp: Date;
  action: 'created' | 'updated' | 'shared' | 'accessed';
  dataType: UnifiedDataType;
  description: string;
}

interface DataAccessRequest {
  requestId: string;
  requestedBy: string;
  dataTypes: UnifiedDataType[];
  purpose: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Date;
}

interface ActiveService {
  serviceType: CommunityServiceType;
  serviceName: string;
  status: 'active' | 'scheduled' | 'completed' | 'cancelled';
  location: string;
  startTime?: Date;
  endTime?: Date;
  staffContact: string;
  notes?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  available: boolean;
}

interface ScheduleItem {
  time: string;
  service: string;
  location: string;
  status: 'upcoming' | 'current' | 'completed';
}

export const ClientStatusDashboard: React.FC<ClientStatusDashboardProps> = ({
  clientId
}) => {
  const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
  const [clientInfo, setClientInfo] = useState<UnifiedDataOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  
  // Data store connection state
  const [connectingStore, setConnectingStore] = useState<string | null>(null);

  const loadClientStatus = async () => {
    try {
      const owner = await unifiedDataOwnershipService.getDataOwner(clientId);
      if (owner) {
        setClientInfo(owner);
        const mockStatus = createMockClientStatus();
        setClientStatus(mockStatus);
      }
    } catch (error) {
      console.error('Failed to load client status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientStatus();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(loadClientStatus, 30000);
    return () => clearInterval(interval);
  }, [clientId]);

  const createMockClientStatus = (): ClientStatus => {
    const now = new Date();
    
    return {
      currentServices: [
        {
          serviceType: 'shelter',
          serviceName: 'Overnight Shelter',
          status: 'active',
          location: 'Main Community Center - Bed 45',
          startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          endTime: new Date(now.getTime() + 10 * 60 * 60 * 1000), // 10 hours from now
          staffContact: 'Sarah Johnson - (208) 555-0123'
        },
        {
          serviceType: 'food_water',
          serviceName: 'Dinner Service',
          status: 'scheduled',
          location: 'Community Kitchen',
          startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
          staffContact: 'Mike Rodriguez - (208) 555-0124'
        }
      ],
      upcomingAppointments: [
        {
          appointmentId: '1',
          serviceType: 'sanitation',
          serviceName: 'Shower Service',
          scheduledFor: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
          location: 'Hygiene Center - Room 2',
          staffMember: 'Lisa Chen',
          duration: 30,
          requirements: ['Bring towel if available'],
          confirmationRequired: false,
          reminderSent: true
        },
        {
          appointmentId: '2',
          serviceType: 'transportation',
          serviceName: 'Medical Transport',
          scheduledFor: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          location: 'Transit Hub',
          staffMember: 'David Park',
          duration: 60,
          requirements: ['Medical appointment confirmation'],
          confirmationRequired: true,
          reminderSent: false
        }
      ],
      notifications: [
        {
          notificationId: '1',
          type: 'service_available',
          title: 'Dinner Service Available',
          message: 'Dinner service is now available. Please check in at the Community Kitchen by 7:00 PM.',
          priority: 'high',
          createdAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
          actionRequired: {
            actionType: 'contact_staff',
            actionUrl: '/services/food-water',
            deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000)
          }
        },
        {
          notificationId: '2',
          type: 'appointment_reminder',
          title: 'Shower Appointment Tomorrow',
          message: 'Your shower appointment is scheduled for tomorrow at 2:00 PM.',
          priority: 'medium',
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          notificationId: '3',
          type: 'document_request',
          title: 'Document Shared Successfully',
          message: 'Your identification document was successfully shared with the medical center.',
          priority: 'low',
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
          readAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
        }
      ],
      quickActions: [
        {
          id: 'request_meal',
          title: 'Request Next Meal',
          description: 'Reserve your spot for the next meal service',
          icon: '🍽️',
          action: () => handleQuickAction('request_meal'),
          available: true
        },
        {
          id: 'book_shower',
          title: 'Book Shower Time',
          description: 'Schedule a shower appointment',
          icon: '🚿',
          action: () => handleQuickAction('book_shower'),
          available: true
        },
        {
          id: 'request_transport',
          title: 'Request Transportation',
          description: 'Request transport to appointments',
          icon: '🚌',
          action: () => handleQuickAction('request_transport'),
          available: true
        },
        {
          id: 'share_document',
          title: 'Share Document',
          description: 'Share documents via QR code',
          icon: '📄',
          action: () => handleQuickAction('share_document'),
          available: true
        }
      ],
      todaySchedule: [
        { time: '6:00 PM', service: 'Check-in Complete', location: 'Main Desk', status: 'completed' },
        { time: '7:00 PM', service: 'Dinner Service', location: 'Community Kitchen', status: 'upcoming' },
        { time: '8:30 PM', service: 'Evening Orientation', location: 'Community Room', status: 'upcoming' },
        { time: '10:00 PM', service: 'Lights Out', location: 'Sleeping Area', status: 'upcoming' }
      ],
      privateData: {
        dataStores: [
          {
            type: 'solid_pod',
            name: 'Solid Pod',
            status: 'disconnected',
            recordCount: 0
          },
          {
            type: 'hat',
            name: 'HAT Personal Data Vault',
            status: 'disconnected',
            recordCount: 0
          },
          {
            type: 'apple_health',
            name: 'Apple Health',
            status: 'disconnected',
            recordCount: 0
          }
        ],
        healthDataEnabled: false,
        totalRecords: 3,
        recentActivity: [
          {
            timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
            action: 'created',
            dataType: 'personal_identity',
            description: 'Initial profile created during registration'
          },
          {
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            action: 'created',
            dataType: 'shelter_records',
            description: 'Check-in record created'
          },
          {
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
            action: 'shared',
            dataType: 'personal_identity',
            description: 'ID shared with medical center via QR code'
          }
        ],
        accessRequests: [
          {
            requestId: '1',
            requestedBy: 'Medical Center',
            dataTypes: ['health_data', 'personal_identity'],
            purpose: 'Provide medical care and treatment',
            status: 'pending',
            requestedAt: new Date(now.getTime() - 30 * 60 * 1000)
          }
        ]
      }
    };
  };

  const handleQuickAction = (actionId: string) => {
    console.log(`Quick action triggered: ${actionId}`);
    // In real implementation, navigate to service or show modal
  };

  const markNotificationRead = (notificationId: string) => {
    if (clientStatus) {
      const updatedNotifications = clientStatus.notifications.map(notif =>
        notif.notificationId === notificationId 
          ? { ...notif, readAt: new Date() }
          : notif
      );
      setClientStatus({
        ...clientStatus,
        notifications: updatedNotifications
      });
    }
  };

  const getCurrentStatusMessage = () => {
    const activeServices = clientStatus?.currentServices.filter(s => s.status === 'active') || [];
    if (activeServices.length === 0) {
      return { message: 'No active services', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
    if (activeServices.some(s => s.serviceType === 'shelter')) {
      return { message: 'Checked in to shelter', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    return { message: `${activeServices.length} active service${activeServices.length > 1 ? 's' : ''}`, color: 'text-blue-600', bgColor: 'bg-blue-100' };
  };

  const getUnreadNotificationCount = () => {
    return clientStatus?.notifications.filter(n => !n.readAt).length || 0;
  };

  const getHighPriorityNotifications = () => {
    return clientStatus?.notifications.filter(n => n.priority === 'high' && !n.readAt) || [];
  };

  const handleDataStoreConnect = async (storeType: string) => {
    setConnectingStore(storeType);
    
    try {
      let success = false;
      let mockData = {};

      if (storeType === 'solid_pod') {
        // Simulate Solid Pod connection
        const provider = window.prompt('Enter your Solid Pod provider (e.g., solidcommunity.net):');
        if (provider) {
          success = true;
          mockData = { provider, recordCount: 5, lastSync: new Date() };
        }
      } else if (storeType === 'hat') {
        // Simulate HAT connection
        const domain = window.prompt('Enter your HAT domain (without .hubofallthings.net):');
        if (domain) {
          success = true;
          mockData = { domain: `${domain}.hubofallthings.net`, recordCount: 12, lastSync: new Date() };
        }
      } else if (storeType === 'apple_health') {
        // Simulate Apple Health connection
        const granted = window.confirm(
          'This app would like to access your health data from Apple Health.\n\n' +
          'Data types: Heart rate, blood pressure, weight, activity, sleep data\n\n' +
          'Allow access?'
        );
        if (granted) {
          success = true;
          mockData = { recordCount: 89, lastSync: new Date() };
        }
      }

      if (success && clientStatus) {
        // Update the data store status
        const updatedStatus = { ...clientStatus };
        const storeIndex = updatedStatus.privateData.dataStores.findIndex(s => s.type === storeType);
        if (storeIndex !== -1) {
          updatedStatus.privateData.dataStores[storeIndex] = {
            ...updatedStatus.privateData.dataStores[storeIndex],
            status: 'connected',
            ...mockData
          };
          
          // Add a new activity record
          updatedStatus.privateData.recentActivity.unshift({
            timestamp: new Date(),
            action: 'created',
            dataType: 'personal_identity',
            description: `Connected to ${updatedStatus.privateData.dataStores[storeIndex].name}`
          });

          // Update total record count
          updatedStatus.privateData.totalRecords += (mockData as any).recordCount || 0;
          
          setClientStatus(updatedStatus);
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
    
    setConnectingStore(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading your status...</span>
      </div>
    );
  }

  const currentStatus = getCurrentStatusMessage();

  return (
    <div className="client-status-dashboard p-4 space-y-6 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {clientInfo?.firstName || 'Client'}
            </h1>
            <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-sm font-medium ${currentStatus.bgColor} ${currentStatus.color}`}>
              <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
              {currentStatus.message}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* High Priority Notifications */}
      {getHighPriorityNotifications().length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-lg mr-2">🚨</span>
            <h3 className="font-medium text-red-900">Urgent Notifications</h3>
          </div>
          <div className="space-y-2">
            {getHighPriorityNotifications().map(notification => (
              <div key={notification.notificationId} className="text-sm text-red-800">
                <strong>{notification.title}</strong>: {notification.message}
                {notification.actionRequired && (
                  <button className="ml-2 text-red-600 underline hover:text-red-800">
                    Take Action
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Services */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">🏢</span>
              Current Services
            </h2>
            {clientStatus?.currentServices.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">🌙</div>
                <div>No active services</div>
                <div className="text-sm mt-1">Check quick actions to request services</div>
              </div>
            ) : (
              <div className="space-y-3">
                {clientStatus?.currentServices.map((service, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    service.status === 'active' ? 'border-green-200 bg-green-50' :
                    service.status === 'scheduled' ? 'border-blue-200 bg-blue-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{service.serviceName}</h3>
                        <p className="text-sm text-gray-600 mt-1">{service.location}</p>
                        <p className="text-xs text-gray-500 mt-1">Contact: {service.staffContact}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        service.status === 'active' ? 'bg-green-100 text-green-800' :
                        service.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    {service.startTime && (
                      <div className="mt-2 text-xs text-gray-500">
                        {service.status === 'active' ? 'Started' : 'Starts'}: {service.startTime.toLocaleTimeString()}
                        {service.endTime && service.status === 'active' && 
                          ` • Until: ${service.endTime.toLocaleTimeString()}`
                        }
                      </div>
                    )}
                    {service.notes && (
                      <div className="mt-2 text-xs text-gray-600 italic">
                        {service.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Today's Schedule
            </h2>
            <div className="space-y-2">
              {clientStatus?.todaySchedule.map((item, index) => (
                <div key={index} className={`flex items-center p-3 rounded-lg ${
                  item.status === 'completed' ? 'bg-gray-50 opacity-75' :
                  item.status === 'current' ? 'bg-blue-50 border border-blue-200' :
                  'bg-white border border-gray-200'
                }`}>
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'current' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.time}</div>
                    <div className={`text-sm ${item.status === 'completed' ? 'text-gray-500' : 'text-gray-900'}`}>
                      {item.service}
                    </div>
                    <div className="text-xs text-gray-500">{item.location}</div>
                  </div>
                  {item.status === 'completed' && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              Quick Actions
            </h2>
            <div className="space-y-3">
              {clientStatus?.quickActions.map(action => (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={!action.available}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    action.available 
                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer' 
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{action.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <span className="mr-2">🔔</span>
                Notifications
              </span>
              {getUnreadNotificationCount() > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {getUnreadNotificationCount()}
                </span>
              )}
            </h2>
            {clientStatus?.notifications.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              <div className="space-y-3">
                {clientStatus?.notifications.slice(0, 3).map(notification => (
                  <div
                    key={notification.notificationId}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      !notification.readAt 
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => {
                      if (!notification.readAt) {
                        markNotificationRead(notification.notificationId);
                      }
                      setSelectedNotification(notification.notificationId);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${!notification.readAt ? 'text-blue-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {notification.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center ml-2">
                        {notification.priority === 'high' && (
                          <span className="text-red-500 text-xs mr-1">🚨</span>
                        )}
                        {!notification.readAt && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(clientStatus?.notifications.length || 0) > 3 && (
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2">
                    View All Notifications ({clientStatus?.notifications.length || 0})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <span className="mr-2">📅</span>
              Upcoming
            </h2>
            {clientStatus?.upcomingAppointments.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-3">
                {clientStatus?.upcomingAppointments.map(appointment => (
                  <div key={appointment.appointmentId} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm capitalize">
                          {appointment.serviceType.replace('_', ' & ')} Service
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {appointment.scheduledFor.toLocaleDateString()} at{' '}
                          {appointment.scheduledFor.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {appointment.location}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        appointment.confirmationRequired ? 'bg-yellow-100 text-yellow-800' :
                        appointment.reminderSent ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appointment.confirmationRequired ? 'Confirm' : appointment.reminderSent ? 'Confirmed' : 'Scheduled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Private Data Management Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🔐</span>
          Your Private Data
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {clientStatus?.privateData.totalRecords} records
          </span>
        </h2>
        
        {/* Data Store Status */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3">Data Stores</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {clientStatus?.privateData.dataStores.map(store => (
              <div key={store.type} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      store.status === 'connected' ? 'bg-green-500' :
                      store.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`}></span>
                    <span className="font-medium text-sm">{store.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    store.status === 'connected' ? 'bg-green-100 text-green-800' :
                    store.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {store.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  {store.recordCount} records
                  {store.lastSync && (
                    <div>Last sync: {store.lastSync.toLocaleTimeString()}</div>
                  )}
                </div>
                {store.status === 'disconnected' && (
                  <button 
                    onClick={() => handleDataStoreConnect(store.type)}
                    disabled={connectingStore === store.type}
                    className="mt-2 w-full text-xs bg-blue-50 text-blue-600 py-1 px-2 rounded hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center"
                  >
                    {connectingStore === store.type ? (
                      <>
                        <span className="animate-spin mr-1">⟳</span>
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Data Activity */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {clientStatus?.privateData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start p-2 border rounded-lg">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 ${
                  activity.action === 'created' ? 'bg-green-100 text-green-600' :
                  activity.action === 'updated' ? 'bg-blue-100 text-blue-600' :
                  activity.action === 'shared' ? 'bg-purple-100 text-purple-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {activity.action === 'created' ? '+' :
                   activity.action === 'updated' ? '↻' :
                   activity.action === 'shared' ? '→' : '👁'}
                </span>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium capitalize">{activity.action}</span>
                    <span className="mx-1">•</span>
                    <span className="text-gray-600">{UNIFIED_DATA_TYPES[activity.dataType]?.name}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{activity.description}</div>
                  <div className="text-xs text-gray-400">{activity.timestamp.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Access Requests */}
        {(clientStatus?.privateData.accessRequests?.length || 0) > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-3 flex items-center">
              Data Access Requests
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {clientStatus?.privateData.accessRequests?.filter(r => r.status === 'pending').length || 0} pending
              </span>
            </h3>
            <div className="space-y-3">
              {clientStatus?.privateData.accessRequests?.map(request => (
                <div key={request.requestId} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{request.requestedBy}</div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      request.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{request.purpose}</div>
                  <div className="text-xs text-gray-500 mb-3">
                    Requested: {request.dataTypes.map(type => UNIFIED_DATA_TYPES[type]?.name).join(', ')}
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
                        Deny
                      </button>
                      <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
                        Details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Data Actions */}
        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-3">Data Management</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button 
              onClick={() => handleDataStoreConnect('solid_pod')}
              className="p-2 text-xs border rounded hover:bg-gray-50 text-center"
            >
              <div className="mb-1">🔗</div>
              <div>Connect Stores</div>
            </button>
            <button 
              onClick={() => handleDataStoreConnect('apple_health')}
              className="p-2 text-xs border rounded hover:bg-gray-50 text-center"
            >
              <div className="mb-1">🏥</div>
              <div>Health Data</div>
            </button>
            <button 
              onClick={() => alert('Export functionality coming soon!')}
              className="p-2 text-xs border rounded hover:bg-gray-50 text-center"
            >
              <div className="mb-1">📤</div>
              <div>Export Data</div>
            </button>
            <button 
              onClick={() => alert('Privacy settings coming soon!')}
              className="p-2 text-xs border rounded hover:bg-gray-50 text-center"
            >
              <div className="mb-1">🔐</div>
              <div>Privacy</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientStatusDashboard;