import React, { useState } from 'react';
import { Notification } from '../types/Shelter';
import { mockNotifications } from '../data/mockShelterData';
import HealthNotifications from './HealthNotifications';

interface NotificationCenterProps {
  clientId?: string;
  staffView?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ clientId, staffView = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [viewMode, setViewMode] = useState<'general' | 'health'>('general');

  const filteredNotifications = notifications.filter(notification => {
    if (clientId && notification.recipientId !== clientId) return false;
    
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'urgent':
        return notification.priority === 'urgent' || notification.priority === 'high';
      default:
        return true;
    }
  });

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'normal':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bed-assigned':
        return '🛏️';
      case 'checkin-reminder':
        return '⏰';
      case 'no-show-warning':
        return '⚠️';
      case 'waitlist-update':
        return '📋';
      case 'policy-update':
        return '📢';
      case 'emergency':
        return '🚨';
      default:
        return '📝';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('general')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'general'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔔 General Notifications
          </button>
          <button
            onClick={() => setViewMode('health')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'health'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏥 Health Notifications
          </button>
        </div>
      </div>

      {viewMode === 'health' ? (
        <HealthNotifications clientId={clientId} staffView={staffView} />
      ) : (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-gray-900">General Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="urgent">Urgent Only</option>
            </select>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-4xl mb-2">📬</div>
            <p>No notifications to display</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          
                          <span className={`text-xs px-2 py-1 rounded-full border ${
                            getPriorityColor(notification.priority)
                          }`}>
                            {notification.priority}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${
                          !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {notification.metadata && (
                          <div className="mt-2 space-y-1">
                            {notification.metadata.bedNumber && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Bed:</span> {notification.metadata.bedNumber}
                              </div>
                            )}
                            {notification.metadata.checkInDeadline && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Check-in by:</span>{' '}
                                {notification.metadata.checkInDeadline.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {notification.actionRequired && (
                          <div className="mt-2">
                            <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors">
                              Take Action
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 text-xs text-gray-500 ml-2">
                        {formatTimeAgo(notification.sentAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;