/**
 * Layout with Sidebar
 * 
 * Main layout component with left sidebar for service selection
 * and top menu for active service actions.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { CommunityServiceType, COMMUNITY_SERVICE_TYPE_VALUES } from '../types/CommunityServices';

interface LayoutWithSidebarProps {
  userRole: 'manager' | 'client' | 'staff';
  userId: string;
  children: React.ReactNode;
  activeService: CommunityServiceType | 'overview';
  onServiceChange: (service: CommunityServiceType | 'overview') => void;
}

interface ServiceMenuItem {
  id: CommunityServiceType | 'overview';
  name: string;
  icon: string;
  description: string;
  available: boolean;
  notifications?: number;
}

interface TopMenuAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
}

export const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({
  userRole,
  userId,
  children,
  activeService,
  onServiceChange
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [topMenuActions, setTopMenuActions] = useState<TopMenuAction[]>([]);

  // Service menu items configuration
  const getServiceMenuItems = (): ServiceMenuItem[] => {
    const baseItems: ServiceMenuItem[] = [
      {
        id: 'overview',
        name: userRole === 'manager' ? 'Services Manager' : 'My Status',
        icon: '📊',
        description: userRole === 'manager' ? 'Unified management dashboard' : 'Status and notifications',
        available: true,
        notifications: userRole === 'client' ? 2 : undefined
      }
    ];

    const serviceItems: ServiceMenuItem[] = COMMUNITY_SERVICE_TYPE_VALUES.map(serviceType => {
      const config = getServiceConfig(serviceType);
      return {
        id: serviceType,
        name: config.name,
        icon: config.icon,
        description: config.description,
        available: true,
        notifications: userRole === 'client' && serviceType === 'food_water' ? 1 : undefined
      };
    });

    return [...baseItems, ...serviceItems];
  };

  const getServiceConfig = (serviceType: CommunityServiceType) => {
    const configs = {
      shelter: {
        name: 'Shelter Services',
        icon: '🏠',
        description: 'Overnight accommodation and bed management'
      },
      food_water: {
        name: 'Food & Water',
        icon: '🍽️',
        description: 'Meals, pantry, and nutrition services'
      },
      sanitation: {
        name: 'Sanitation',
        icon: '🚿',
        description: 'Shower, restroom, and hygiene facilities'
      },
      transportation: {
        name: 'Transportation',
        icon: '🚌',
        description: 'Bus, shuttle, and transportation vouchers'
      }
    };
    return configs[serviceType] || { name: serviceType, icon: '📋', description: 'Community service' };
  };

  // Update top menu actions based on active service and user role
  useEffect(() => {
    const actions = getTopMenuActions(activeService, userRole);
    setTopMenuActions(actions);
  }, [activeService, userRole]);

  const getTopMenuActions = (service: CommunityServiceType | 'overview', role: string): TopMenuAction[] => {
    if (service === 'overview') {
      if (role === 'manager') {
        return [
          {
            id: 'refresh',
            label: 'Refresh',
            icon: '🔄',
            action: () => window.location.reload()
          },
          {
            id: 'export',
            label: 'Export Report',
            icon: '📊',
            action: () => console.log('Export report')
          },
          {
            id: 'alerts',
            label: 'View Alerts',
            icon: '🚨',
            action: () => console.log('View alerts')
          }
        ];
      } else {
        return [
          {
            id: 'refresh',
            label: 'Refresh',
            icon: '🔄',
            action: () => window.location.reload()
          },
          {
            id: 'notifications',
            label: 'Notifications',
            icon: '🔔',
            action: () => console.log('View notifications')
          }
        ];
      }
    }

    // Service-specific actions
    const serviceActions = {
      shelter: role === 'manager' 
        ? [
            { id: 'checkin', label: 'Check-in Client', icon: '➕', action: () => console.log('Check-in') },
            { id: 'beds', label: 'Manage Beds', icon: '🛏️', action: () => console.log('Manage beds') },
            { id: 'waitlist', label: 'Waitlist', icon: '📋', action: () => console.log('Waitlist') }
          ]
        : [
            { id: 'request', label: 'Request Bed', icon: '🛏️', action: () => console.log('Request bed') },
            { id: 'status', label: 'My Status', icon: '📍', action: () => console.log('Check status') }
          ],
      food_water: role === 'manager'
        ? [
            { id: 'serve', label: 'Serve Meal', icon: '🍽️', action: () => console.log('Serve meal') },
            { id: 'inventory', label: 'Inventory', icon: '📦', action: () => console.log('Inventory') },
            { id: 'menu', label: 'Plan Menu', icon: '📋', action: () => console.log('Plan menu') }
          ]
        : [
            { id: 'request', label: 'Request Meal', icon: '🍽️', action: () => console.log('Request meal') },
            { id: 'dietary', label: 'Dietary Needs', icon: '🥗', action: () => console.log('Dietary needs') }
          ],
      sanitation: role === 'manager'
        ? [
            { id: 'schedule', label: 'Schedule', icon: '📅', action: () => console.log('Schedule') },
            { id: 'maintenance', label: 'Maintenance', icon: '🔧', action: () => console.log('Maintenance') },
            { id: 'supplies', label: 'Supplies', icon: '🧼', action: () => console.log('Supplies') }
          ]
        : [
            { id: 'book', label: 'Book Shower', icon: '🚿', action: () => console.log('Book shower') },
            { id: 'supplies', label: 'Get Supplies', icon: '🧼', action: () => console.log('Get supplies') }
          ],
      transportation: role === 'manager'
        ? [
            { id: 'dispatch', label: 'Dispatch', icon: '🚌', action: () => console.log('Dispatch') },
            { id: 'routes', label: 'Routes', icon: '🗺️', action: () => console.log('Routes') },
            { id: 'vouchers', label: 'Issue Vouchers', icon: '🎫', action: () => console.log('Issue vouchers') }
          ]
        : [
            { id: 'request', label: 'Request Ride', icon: '🚌', action: () => console.log('Request ride') },
            { id: 'vouchers', label: 'My Vouchers', icon: '🎫', action: () => console.log('My vouchers') }
          ]
    };

    return serviceActions[service] || [];
  };

  const serviceMenuItems = getServiceMenuItems();
  const activeServiceConfig = serviceMenuItems.find(item => item.id === activeService);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Community Services Hub</h1>
                <p className="text-sm text-gray-600 capitalize">{userRole} Dashboard</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <span className="text-gray-500">
                {sidebarCollapsed ? '→' : '←'}
              </span>
            </button>
          </div>
        </div>

        {/* Service Menu */}
        <nav className="mt-4">
          <div className={`px-4 mb-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Services
            </h3>
          </div>
          
          {serviceMenuItems.map((item) => (
            <button
              key={item.id}
              data-testid={item.id === 'overview' ? 'services-manager-nav' : `service-nav-${item.id}`}
              onClick={() => onServiceChange(item.id)}
              disabled={!item.available}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                activeService === item.id 
                  ? 'bg-blue-100 border-r-4 border-blue-500 text-blue-700' 
                  : 'text-gray-700'
              } ${!item.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <span className="text-lg mr-3">{item.icon}</span>
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{item.name}</div>
                      {item.notifications && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.notifications}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          {!sidebarCollapsed ? (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userRole.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 capitalize">{userRole}</div>
                <div className="text-xs text-gray-500">ID: {userId.slice(0, 8)}</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userRole.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Menu Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{activeServiceConfig?.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeServiceConfig?.name || 'Service'}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeServiceConfig?.description || 'Manage service operations'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {topMenuActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={action.disabled}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <span className="mr-2">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutWithSidebar;