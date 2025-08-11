/**
 * Community Services Hub Main Application
 * 
 * Main application component that orchestrates the new layout with
 * sidebar navigation and role-based dashboards.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { CommunityServiceType } from '../types/CommunityServices';
import LayoutWithSidebar from './LayoutWithSidebar';
import ServicesManager from './ServicesManager';
import ClientStatusDashboard from './ClientStatusDashboard';
import { ClientServicesDashboard } from './ClientServicesDashboard';
import { OrganizationDashboard } from './OrganizationDashboard';

interface CommunityServicesHubProps {
  initialUserRole?: 'manager' | 'client' | 'staff';
  initialUserId?: string;
}

export const CommunityServicesHub: React.FC<CommunityServicesHubProps> = ({
  initialUserRole = 'manager',
  initialUserId = 'user-001'
}) => {
  const [userRole, setUserRole] = useState<'manager' | 'client' | 'staff'>(initialUserRole);
  const [userId, setUserId] = useState(initialUserId);
  const [activeService, setActiveService] = useState<CommunityServiceType | 'overview'>('overview');

  // Handle service navigation
  const handleServiceChange = (service: CommunityServiceType | 'overview') => {
    setActiveService(service);
  };

  // Render the appropriate dashboard/component based on active service and user role
  const renderMainContent = () => {
    if (activeService === 'overview') {
      // Default dashboards based on user role
      if (userRole === 'manager') {
        return <ServicesManager managerId={userId} organizationId="org-001" />;
      } else if (userRole === 'client') {
        return <ClientStatusDashboard clientId={userId} />;
      } else {
        // Staff role can see organization dashboard but with limited permissions
        return <OrganizationDashboard organizationId="org-001" userRole="supervisor" />;
      }
    }

    // Service-specific content
    switch (activeService) {
      case 'shelter':
        return renderShelterService();
      case 'food_water':
        return renderFoodWaterService();
      case 'sanitation':
        return renderSanitationService();
      case 'transportation':
        return renderTransportationService();
      default:
        return <div className="p-6">Service not found</div>;
    }
  };

  const renderShelterService = () => {
    if (userRole === 'client') {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🏠</span>
              Shelter Services
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800">✅ You are currently checked in</h3>
                <p className="text-green-600 text-sm mt-1">Bed 45 - Main Community Center</p>
                <p className="text-green-600 text-xs mt-2">Check-out time: 7:00 AM tomorrow</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🛏️ Extend Stay</div>
                  <div className="text-sm text-gray-600">Request additional nights</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">📋 House Rules</div>
                  <div className="text-sm text-gray-600">View shelter guidelines</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🔒 My Locker</div>
                  <div className="text-sm text-gray-600">Locker #45 - Secure storage</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🆘 Report Issue</div>
                  <div className="text-sm text-gray-600">Maintenance or safety concerns</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🏠</span>
              Shelter Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">142/150</div>
                <div className="text-sm text-blue-800">Occupied Beds</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <div className="text-sm text-yellow-800">Available Beds</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">23</div>
                <div className="text-sm text-green-800">Waitlist</div>
              </div>
            </div>
            <div className="text-center py-8 text-gray-500">
              <div>📊 Detailed shelter management interface would appear here</div>
              <div className="text-sm mt-2">Bed assignments, check-ins, waitlist management</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderFoodWaterService = () => {
    if (userRole === 'client') {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🍽️</span>
              Food & Water Services
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800">🔔 Next Meal Service</h3>
                <p className="text-blue-600 text-sm mt-1">Dinner service starts at 6:00 PM</p>
                <p className="text-blue-600 text-xs mt-2">Location: Community Kitchen</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🍽️ Reserve Meal</div>
                  <div className="text-sm text-gray-600">Guarantee your spot</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🥗 Dietary Needs</div>
                  <div className="text-sm text-gray-600">Update food preferences</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">📦 Food Pantry</div>
                  <div className="text-sm text-gray-600">Weekly pantry access</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">💧 Water Station</div>
                  <div className="text-sm text-gray-600">Refill water bottles</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🍽️</span>
              Food & Water Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">186</div>
                <div className="text-sm text-green-800">Meals Today</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">2,500</div>
                <div className="text-sm text-blue-800">Food Servings</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">85%</div>
                <div className="text-sm text-yellow-800">Pantry Capacity</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">42</div>
                <div className="text-sm text-purple-800">Special Diets</div>
              </div>
            </div>
            <div className="text-center py-8 text-gray-500">
              <div>📊 Food service management interface would appear here</div>
              <div className="text-sm mt-2">Meal planning, inventory, nutrition tracking</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderSanitationService = () => {
    if (userRole === 'client') {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🚿</span>
              Sanitation Services
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800">📅 Next Appointment</h3>
                <p className="text-green-600 text-sm mt-1">Tomorrow at 2:00 PM - Shower Room 3</p>
                <p className="text-green-600 text-xs mt-2">Duration: 30 minutes</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🚿 Book Shower</div>
                  <div className="text-sm text-gray-600">Schedule shower time</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🧼 Hygiene Supplies</div>
                  <div className="text-sm text-gray-600">Get toiletries and supplies</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">👕 Laundry Service</div>
                  <div className="text-sm text-gray-600">Wash and dry clothes</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🚽 Restroom Access</div>
                  <div className="text-sm text-gray-600">24/7 facility access</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🚿</span>
              Sanitation Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">12/16</div>
                <div className="text-sm text-blue-800">Showers Available</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-green-800">Today's Usage</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-sm text-yellow-800">Maintenance Needed</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-purple-800">Hygiene Kits</div>
              </div>
            </div>
            <div className="text-center py-8 text-gray-500">
              <div>📊 Sanitation management interface would appear here</div>
              <div className="text-sm mt-2">Facility scheduling, maintenance, supply tracking</div>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderTransportationService = () => {
    if (userRole === 'client') {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🚌</span>
              Transportation Services
            </h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800">🎫 Active Vouchers</h3>
                <p className="text-yellow-600 text-sm mt-1">2 bus passes remaining</p>
                <p className="text-yellow-600 text-xs mt-2">Expires: Next Friday</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🚌 Request Ride</div>
                  <div className="text-sm text-gray-600">Community bus or shuttle</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🎫 My Vouchers</div>
                  <div className="text-sm text-gray-600">View active vouchers</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🚲 Bicycle Program</div>
                  <div className="text-sm text-gray-600">Borrow a community bike</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium">🗺️ Routes & Schedule</div>
                  <div className="text-sm text-gray-600">View bus routes and times</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-3">🚌</span>
              Transportation Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">6/8</div>
                <div className="text-sm text-green-800">Vehicles Available</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-blue-800">Trips Today</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">167</div>
                <div className="text-sm text-yellow-800">Active Vouchers</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">18/20</div>
                <div className="text-sm text-purple-800">Bikes Available</div>
              </div>
            </div>
            <div className="text-center py-8 text-gray-500">
              <div>📊 Transportation management interface would appear here</div>
              <div className="text-sm mt-2">Fleet management, route planning, voucher system</div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <LayoutWithSidebar
      userRole={userRole}
      userId={userId}
      activeService={activeService}
      onServiceChange={handleServiceChange}
    >
      {renderMainContent()}

      {/* Role Switcher for Demo */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Demo: Switch Role</div>
        <div className="flex space-x-2">
          <button
            onClick={() => setUserRole('manager')}
            className={`px-3 py-1 text-xs rounded ${
              userRole === 'manager' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Manager
          </button>
          <button
            onClick={() => setUserRole('client')}
            className={`px-3 py-1 text-xs rounded ${
              userRole === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Client
          </button>
          <button
            onClick={() => setUserRole('staff')}
            className={`px-3 py-1 text-xs rounded ${
              userRole === 'staff' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Staff
          </button>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default CommunityServicesHub;