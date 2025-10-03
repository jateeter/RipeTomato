/**
 * Responsive Manager Menu Component
 * 
 * Categorized dropdown menu system that adapts to different screen sizes
 * for the Services Manager dashboard navigation.
 * 
 * @license MIT
 */

import React, { useState, useRef, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';

export type ManagerMenuTab = 
  | 'overview' 
  | 'services' 
  | 'staff' 
  | 'resources' 
  | 'clients' 
  | 'client-registration'
  | 'reports' 
  | 'alerts' 
  | 'facilities' 
  | 'hmis_facilities' 
  | 'service_dashboards' 
  | 'configuration' 
  | 'shelters';

interface MenuCategory {
  key: string;
  label: string;
  icon: string;
  items: MenuTab[];
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}

interface MenuTab {
  key: ManagerMenuTab;
  label: string;
  icon: string;
  alertCount?: number;
}

interface ResponsiveManagerMenuProps {
  activeTab: ManagerMenuTab;
  onTabChange: (tab: ManagerMenuTab) => void;
  alertCount?: number;
}

export const ResponsiveManagerMenu: React.FC<ResponsiveManagerMenuProps> = ({
  activeTab,
  onTabChange,
  alertCount = 0
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Define categorized menu structure
  const menuCategories: MenuCategory[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      color: 'blue',
      items: [
        { key: 'overview', label: 'Overview', icon: '📊' }
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      icon: '⚡',
      color: 'green',
      items: [
        { key: 'services', label: 'Services', icon: '🏢' },
        { key: 'staff', label: 'Staff', icon: '👥' },
        { key: 'resources', label: 'Resources', icon: '📦' },
        { key: 'clients', label: 'Clients', icon: '👤' },
        { key: 'client-registration', label: 'New Registration', icon: '📝' }
      ]
    },
    {
      key: 'services',
      label: 'Service Centers',
      icon: '🏠',
      color: 'purple',
      items: [
        { key: 'shelters', label: 'Shelter Services', icon: '🏠' }
      ]
    },
    {
      key: 'data',
      label: 'Data & Facilities',
      icon: '🗺️',
      color: 'orange',
      items: [
        { key: 'facilities', label: 'Facilities Map', icon: '🗺️' },
        { key: 'hmis_facilities', label: 'HMIS Facilities', icon: '🏥' }
      ]
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: '📈',
      color: 'blue',
      items: [
        { key: 'service_dashboards', label: 'Service Dashboards', icon: '📊' },
        { key: 'reports', label: 'Reports', icon: '📈' }
      ]
    },
    {
      key: 'system',
      label: 'System',
      icon: '⚙️',
      color: 'gray',
      items: [
        { key: 'alerts', label: `Alerts${alertCount > 0 ? ` (${alertCount})` : ''}`, icon: '🚨', alertCount },
        { key: 'configuration', label: 'Configuration', icon: '⚙️' }
      ]
    }
  ];

  // Find which category contains the active tab
  const findActiveCategory = () => {
    return menuCategories.find(category =>
      category.items.some(item => item.key === activeTab)
    );
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedInsideDropdown = Object.values(dropdownRefs.current).some(
        ref => ref?.contains(event.target as Node)
      );
      if (!clickedInsideDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (categoryKey: string) => {
    setOpenDropdown(openDropdown === categoryKey ? null : categoryKey);
  };

  const handleTabSelect = (tab: ManagerMenuTab) => {
    onTabChange(tab);
    setOpenDropdown(null);
  };

  const getColorClasses = (color: MenuCategory['color'], isActive: boolean = false) => {
    const colors = {
      blue: isActive 
        ? 'bg-blue-100 text-blue-700 border-blue-300' 
        : 'hover:bg-blue-50 hover:text-blue-700 border-transparent',
      green: isActive 
        ? 'bg-green-100 text-green-700 border-green-300' 
        : 'hover:bg-green-50 hover:text-green-700 border-transparent',
      purple: isActive 
        ? 'bg-purple-100 text-purple-700 border-purple-300' 
        : 'hover:bg-purple-50 hover:text-purple-700 border-transparent',
      orange: isActive 
        ? 'bg-orange-100 text-orange-700 border-orange-300' 
        : 'hover:bg-orange-50 hover:text-orange-700 border-transparent',
      red: isActive 
        ? 'bg-red-100 text-red-700 border-red-300' 
        : 'hover:bg-red-50 hover:text-red-700 border-transparent',
      gray: isActive 
        ? 'bg-gray-100 text-gray-700 border-gray-300' 
        : 'hover:bg-gray-50 hover:text-gray-700 border-transparent'
    };
    return colors[color];
  };

  // Mobile: Horizontal scrollable menu
  if (isMobile) {
    const activeCategory = findActiveCategory();
    
    return (
      <div className="bg-white border-b">
        {/* Active tab display */}
        <div className="px-4 py-3 bg-gray-50 border-b">
          <div className="flex items-center justify-center">
            <span className="text-lg mr-2">{activeCategory?.icon}</span>
            <span className="font-medium text-gray-900">
              {menuCategories.find(cat => 
                cat.items.some(item => item.key === activeTab)
              )?.items.find(item => item.key === activeTab)?.label}
            </span>
          </div>
        </div>

        {/* Category selector */}
        <div className="overflow-x-auto">
          <div className="flex space-x-2 px-4 py-2 min-w-max">
            {menuCategories.map((category) => {
              const isActive = category.items.some(item => item.key === activeTab);
              
              return (
                <div key={category.key} className="relative" ref={el => { dropdownRefs.current[category.key] = el; }}>
                  <button
                    onClick={() => toggleDropdown(category.key)}
                    className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive ? getColorClasses(category.color, true) : getColorClasses(category.color)
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                    <span className="ml-1 text-xs">▾</span>
                  </button>

                  {/* Dropdown menu */}
                  {openDropdown === category.key && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-48">
                      <div className="py-1">
                        {category.items.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => handleTabSelect(item.key)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                              activeTab === item.key ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                            </div>
                            {item.alertCount && item.alertCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {item.alertCount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Tablet and Desktop: Grouped dropdown menu
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="border-b">
        <nav className={`px-6 ${isTablet ? 'py-3' : 'py-4'}`}>
          <div className={`flex ${isTablet ? 'flex-wrap gap-2' : 'space-x-4'} items-center`}>
            {menuCategories.map((category) => {
              const isActive = category.items.some(item => item.key === activeTab);
              const hasAlerts = category.items.some(item => item.alertCount && item.alertCount > 0);
              
              return (
                <div key={category.key} className="relative" ref={el => { dropdownRefs.current[category.key] = el; }}>
                  <button
                    onClick={() => toggleDropdown(category.key)}
                    className={`flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      isActive ? getColorClasses(category.color, true) : getColorClasses(category.color)
                    } ${isTablet ? 'mb-2' : ''}`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                    {hasAlerts && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {category.items.reduce((sum, item) => sum + (item.alertCount || 0), 0)}
                      </span>
                    )}
                    <span className="ml-2 text-xs">▾</span>
                  </button>

                  {/* Dropdown menu */}
                  {openDropdown === category.key && (
                    <div className={`absolute ${isTablet ? 'top-full' : 'top-full'} left-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-56`}>
                      <div className="py-1">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                          {category.label}
                        </div>
                        {category.items.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => handleTabSelect(item.key)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                              activeTab === item.key ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="mr-3">{item.icon}</span>
                              {item.label}
                            </div>
                            {item.alertCount && item.alertCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {item.alertCount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default ResponsiveManagerMenu;