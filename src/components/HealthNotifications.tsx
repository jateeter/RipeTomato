import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { HealthAlert } from '../types/Health';
import { Notification } from '../types/Shelter';

interface HealthNotificationsProps {
  clientId?: string;
  staffView?: boolean;
}

const HealthNotifications: React.FC<HealthNotificationsProps> = ({ 
  clientId, 
  staffView = true 
}) => {
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [shelterNotifications, setShelterNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthNotifications();
  }, [clientId]);

  const loadHealthNotifications = () => {
    // Mock health-based notifications
    const mockHealthAlerts: HealthAlert[] = [
      {
        id: '1',
        clientId: clientId || 'demo-client',
        type: 'critical',
        category: 'vitals',
        title: 'High Blood Pressure Alert',
        description: 'Blood pressure reading of 165/95 requires immediate attention',
        recommendations: [
          'Schedule immediate medical evaluation',
          'Monitor BP every 2 hours',
          'Ensure medication compliance'
        ],
        createdAt: new Date(),
        acknowledged: false
      },
      {
        id: '2',
        clientId: clientId || 'demo-client',
        type: 'warning',
        category: 'medication',
        title: 'Insulin Reminder',
        description: 'Client requires insulin administration at meal times',
        recommendations: [
          'Verify insulin supply',
          'Check blood glucose levels',
          'Coordinate with meal schedule'
        ],
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        acknowledged: false
      },
      {
        id: '3',
        clientId: clientId || 'demo-client',
        type: 'info',
        category: 'wellness',
        title: 'Sleep Quality Concern',
        description: 'Average sleep duration has decreased to 4.2 hours over the past week',
        recommendations: [
          'Consider quieter bed assignment',
          'Discuss sleep hygiene',
          'Evaluate for sleep disorders'
        ],
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        acknowledged: true,
        acknowledgedBy: 'staff-001',
        acknowledgedAt: new Date(Date.now() - 3600000)
      }
    ];

    const mockShelterNotifications: Notification[] = [
      {
        id: 'health-bed-1',
        recipientId: clientId || 'demo-client',
        recipientType: staffView ? 'staff' : 'client',
        type: 'bed-assigned',
        title: 'Health-Optimized Bed Assignment',
        message: 'Based on health profile, bed M2 (Medical Wing) has been assigned. Features: Medical supervision, emergency alert, medication storage.',
        priority: 'high',
        isRead: false,
        sentAt: new Date(Date.now() - 1800000), // 30 min ago
        actionRequired: true,
        actionUrl: '/checkin',
        metadata: {
          bedNumber: 'M2',
          checkInDeadline: new Date(Date.now() + 3600000) // 1 hour from now
        }
      },
      {
        id: 'health-alert-1',
        recipientId: 'staff-all',
        recipientType: 'staff',
        type: 'emergency',
        title: 'Client Health Emergency',
        message: 'Client in bed M2 has triggered health alert: Oxygen saturation below 90%. Immediate response required.',
        priority: 'urgent',
        isRead: false,
        sentAt: new Date(Date.now() - 900000), // 15 min ago
        actionRequired: true
      },
      {
        id: 'health-med-1',
        recipientId: clientId || 'demo-client',
        recipientType: staffView ? 'staff' : 'client',
        type: 'checkin-reminder',
        title: 'Medication Administration Due',
        message: 'Insulin administration scheduled for 6:00 PM. Please ensure client is available and blood glucose is checked.',
        priority: 'high',
        isRead: false,
        sentAt: new Date(),
        scheduledFor: new Date(Date.now() + 1800000), // 30 min from now
        actionRequired: true
      }
    ];

    setHealthAlerts(mockHealthAlerts);
    setShelterNotifications(mockShelterNotifications);
    setLoading(false);
  };

  const acknowledgeAlert = (alertId: string) => {
    setHealthAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedBy: 'current-user', acknowledgedAt: new Date() }
        : alert
    ));
  };

  const markNotificationRead = (notificationId: string) => {
    setShelterNotifications(prev => prev.map(notification =>
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const getPriorityColor = (type: 'critical' | 'warning' | 'info' | string) => {
    switch (type) {
      case 'critical':
      case 'urgent':
        return 'border-red-400 bg-red-50';
      case 'warning':
      case 'high':
        return 'border-yellow-400 bg-yellow-50';
      case 'info':
      case 'normal':
        return 'border-blue-400 bg-blue-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

  const getPriorityIcon = (type: 'critical' | 'warning' | 'info' | string) => {
    switch (type) {
      case 'critical':
      case 'urgent':
        return '🚨';
      case 'warning':
      case 'high':
        return '⚠️';
      case 'emergency':
        return '🆘';
      case 'info':
      case 'normal':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading health notifications...</span>
      </div>
    );
  }

  const criticalAlerts = healthAlerts.filter(alert => alert.type === 'critical' && !alert.acknowledged);
  const unreadNotifications = shelterNotifications.filter(notification => !notification.isRead);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 text-2xl mr-3">🚨</span>
            <div>
              <div className="text-2xl font-bold text-red-800">{criticalAlerts.length}</div>
              <div className="text-sm text-red-600">Critical Health Alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-orange-500 text-2xl mr-3">⚠️</span>
            <div>
              <div className="text-2xl font-bold text-orange-800">
                {healthAlerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
              </div>
              <div className="text-sm text-orange-600">Warning Alerts</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-blue-500 text-2xl mr-3">🏥</span>
            <div>
              <div className="text-2xl font-bold text-blue-800">{unreadNotifications.length}</div>
              <div className="text-sm text-blue-600">Health Notifications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts - Always on top */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-red-600 text-white px-6 py-3 rounded-t-lg">
            <h2 className="text-lg font-semibold flex items-center">
              <span className="mr-2">🚨</span>
              Critical Health Alerts
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {criticalAlerts.map(alert => (
              <div 
                key={alert.id}
                className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">{alert.title}</h3>
                    <p className="text-red-800 text-sm mt-1">{alert.description}</p>
                    
                    {alert.recommendations && alert.recommendations.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-red-900 mb-1">IMMEDIATE ACTIONS:</h4>
                        <ul className="text-xs text-red-800 list-disc list-inside space-y-1">
                          {alert.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <span className="text-xs text-red-600">
                      {format(alert.createdAt, 'MMM d, h:mm a')}
                    </span>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Alerts */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🏥</span>
            Health Alerts
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {healthAlerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <span className="text-4xl mb-2 block">✅</span>
              No active health alerts
            </div>
          ) : (
            healthAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-4 ${alert.acknowledged ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getPriorityIcon(alert.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                    
                    {alert.acknowledged && (
                      <div className="text-xs text-gray-500 mt-2">
                        ✓ Acknowledged by {alert.acknowledgedBy} at{' '}
                        {alert.acknowledgedAt && format(alert.acknowledgedAt, 'MMM d, h:mm a')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-xs text-gray-500">
                      {format(alert.createdAt, 'MMM d, h:mm a')}
                    </span>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Health-Related Shelter Notifications */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">🔔</span>
            Health-Related Notifications
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {shelterNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <span className="text-4xl mb-2 block">📭</span>
              No health notifications
            </div>
          ) : (
            shelterNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getPriorityIcon(notification.priority)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.priority}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    
                    {notification.metadata && (
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        {notification.metadata.bedNumber && (
                          <div>Bed: {notification.metadata.bedNumber}</div>
                        )}
                        {notification.metadata.checkInDeadline && (
                          <div>Check-in deadline: {format(notification.metadata.checkInDeadline, 'MMM d, h:mm a')}</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-xs text-gray-500">
                      {format(notification.sentAt, 'MMM d, h:mm a')}
                    </span>
                    {!notification.isRead && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Mark Read
                      </button>
                    )}
                    {notification.actionRequired && (
                      <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">
                        Take Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthNotifications;