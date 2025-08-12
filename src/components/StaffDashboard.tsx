/**
 * Staff Dashboard Component
 * 
 * Dashboard for shelter staff with spatial navigation,
 * shelter management, and client services.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { OpenMapsComponent } from './OpenMapsComponent';
import { ShelterList } from './ShelterList';
import { shelterDataService, ShelterFacility } from '../services/shelterDataService';
import { ClientBedRegistrationModal, BedRegistration } from './ClientBedRegistrationModal';
import { InteractiveCalendar } from './InteractiveCalendar';

interface StaffDashboardProps {
  staffId: string;
  staffRole: 'staff' | 'case_manager' | 'supervisor';
}

interface StaffMetrics {
  clientsAssigned: number;
  casesActive: number;
  completedToday: number;
  urgentTasks: number;
  shelterCapacityAlert: number;
  nextAppointment?: {
    clientName: string;
    time: string;
    type: string;
  };
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  staffId,
  staffRole
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shelters' | 'clients' | 'tasks'>('overview');
  const [shelters, setShelters] = useState<ShelterFacility[]>([]);
  const [selectedShelter, setSelectedShelter] = useState<ShelterFacility | null>(null);
  const [shelterViewMode, setShelterViewMode] = useState<'list' | 'map' | 'calendar'>('map');
  const [spatialNavigationEnabled, setSpatialNavigationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Bed registration state
  const [showBedRegistrationModal, setShowBedRegistrationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Staff metrics
  const [staffMetrics, setStaffMetrics] = useState<StaffMetrics>({
    clientsAssigned: 0,
    casesActive: 0,
    completedToday: 0,
    urgentTasks: 0,
    shelterCapacityAlert: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'shelters') {
      loadShelterData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock staff metrics - in real implementation, fetch from API
      const mockMetrics: StaffMetrics = {
        clientsAssigned: 24,
        casesActive: 18,
        completedToday: 5,
        urgentTasks: 3,
        shelterCapacityAlert: 2,
        nextAppointment: {
          clientName: 'Sarah Johnson',
          time: '2:30 PM',
          type: 'Case Review'
        }
      };
      
      setStaffMetrics(mockMetrics);
      console.log('Staff dashboard data loaded');
    } catch (error) {
      console.error('Failed to load staff dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadShelterData = async () => {
    try {
      console.log('Loading shelter data for staff dashboard...');
      
      // Load shelters from the shelter data service
      const shelterData = await shelterDataService.getAllShelters();
      setShelters(shelterData);
      
      console.log('Staff shelter data loaded:', {
        count: shelterData.length,
        spatialNavigation: spatialNavigationEnabled
      });
    } catch (error) {
      console.error('Failed to load shelter data:', error);
    }
  };

  const handleBedRegistrationComplete = (registration: BedRegistration) => {
    console.log('Staff bed registration completed:', registration);
    setShowBedRegistrationModal(false);
    loadShelterData(); // Reload to update occupancy
  };

  const handleCalendarDateSelect = (date: Date, availableBeds: number) => {
    setSelectedDate(date);
    if (availableBeds > 0 && selectedShelter) {
      setShowBedRegistrationModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Role: {staffRole.replace('_', ' ')} • ID: {staffId}</p>
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
            <div className="text-lg font-semibold text-blue-600">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'shelters', label: 'Shelter Services', icon: '🏠' },
              { key: 'clients', label: 'My Clients', icon: '👤' },
              { key: 'tasks', label: 'Tasks', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{staffMetrics.clientsAssigned}</div>
                  <div className="text-sm text-blue-800">Clients Assigned</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{staffMetrics.casesActive}</div>
                  <div className="text-sm text-green-800">Active Cases</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{staffMetrics.completedToday}</div>
                  <div className="text-sm text-purple-800">Completed Today</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{staffMetrics.urgentTasks}</div>
                  <div className="text-sm text-yellow-800">Urgent Tasks</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{staffMetrics.shelterCapacityAlert}</div>
                  <div className="text-sm text-red-800">Capacity Alerts</div>
                </div>
              </div>

              {/* Next Appointment */}
              {staffMetrics.nextAppointment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-800">Next Appointment</h4>
                      <p className="text-blue-700">
                        {staffMetrics.nextAppointment.clientName} - {staffMetrics.nextAppointment.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {staffMetrics.nextAppointment.time}
                      </div>
                      <div className="text-sm text-blue-500">Today</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-blue-600 mb-2">📋 New Case Note</div>
                  <div className="text-sm text-gray-600">Document client interactions</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-green-600 mb-2">🏠 Check Shelter Availability</div>
                  <div className="text-sm text-gray-600">Find available beds</div>
                </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-purple-600 mb-2">📞 Schedule Appointment</div>
                  <div className="text-sm text-gray-600">Book client meeting</div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'shelters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="mr-2">🏠</span>
                  Shelter Services Access
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShelterViewMode('list')}
                      className={`px-3 py-1 rounded text-sm ${
                        shelterViewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📋 List
                    </button>
                    <button
                      onClick={() => setShelterViewMode('map')}
                      className={`px-3 py-1 rounded text-sm ${
                        shelterViewMode === 'map'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🗺️ Map
                    </button>
                    <button
                      onClick={() => setShelterViewMode('calendar')}
                      className={`px-3 py-1 rounded text-sm ${
                        shelterViewMode === 'calendar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📅 Calendar
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={spatialNavigationEnabled}
                        onChange={(e) => setSpatialNavigationEnabled(e.target.checked)}
                        className="mr-2"
                      />
                      Spatial Navigation
                    </label>
                  </div>
                </div>
              </div>

              {/* Shelter Content */}
              {shelterViewMode === 'list' && (
                <ShelterList
                  userRole="staff"
                  showFilters={true}
                  allowSelection={true}
                  onShelterSelect={setSelectedShelter}
                  maxHeight="600px"
                  enableExport={false}
                />
              )}

              {shelterViewMode === 'map' && (
                <div className="space-y-4">
                  <OpenMapsComponent
                    shelters={shelters}
                    onShelterSelect={setSelectedShelter}
                    showUtilizationPopups={true}
                    userRole="staff"
                    enableSpatialNavigation={spatialNavigationEnabled}
                    height="500px"
                    center={{ lat: 45.515, lng: -122.65 }}
                    zoom={12}
                  />
                  
                  {selectedShelter && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Selected Shelter - Staff Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-sm">
                          <div className="font-medium">{selectedShelter.name}</div>
                          <div className="text-gray-600">{selectedShelter.address.street}</div>
                          <div className="text-gray-600">{selectedShelter.address.city}, {selectedShelter.address.state}</div>
                          <div className="text-gray-600 mt-2">
                            Available Beds: {selectedShelter.currentUtilization.available}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => setShowBedRegistrationModal(true)}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            🏠 Register Client to Bed
                          </button>
                          <button className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                            📞 Call Shelter Direct
                          </button>
                          <button className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                            📋 Add to Client Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {shelterViewMode === 'calendar' && (
                <div className="space-y-4">
                  {selectedShelter && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Staff Calendar: {selectedShelter.name}</div>
                          <div className="text-sm text-gray-600">
                            Click dates to register clients • Green dates have availability
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedShelter(null)}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          View All Facilities
                        </button>
                      </div>
                    </div>
                  )}
                  <InteractiveCalendar
                    shelter={selectedShelter || undefined}
                    onDateSelect={handleCalendarDateSelect}
                    showOccupancy={true}
                    showEvents={false}
                    userRole="staff"
                    height="500px"
                  />
                </div>
              )}
              
              {/* Staff Actions */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Staff Actions</h4>
                  <div className="text-sm text-gray-600">
                    Staff Access • Spatial Navigation: {spatialNavigationEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setShowBedRegistrationModal(true)}
                    className="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    🏠 Register Client to Bed
                  </button>
                  <button className="p-3 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    🔍 Search Available Beds
                  </button>
                  <button className="p-3 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm">
                    📱 Emergency Placement
                  </button>
                  <button className="p-3 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                    📊 View Client History
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">My Assigned Clients</h3>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">👥</div>
                <div className="text-lg font-medium text-gray-600">Client Management</div>
                <div className="text-sm text-gray-500 mt-2">
                  Detailed client management features would be implemented here
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Task Management</h3>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📋</div>
                <div className="text-lg font-medium text-gray-600">Task Management</div>
                <div className="text-sm text-gray-500 mt-2">
                  Task and workflow management features would be implemented here
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Bed Registration Modal */}
      <ClientBedRegistrationModal
        isOpen={showBedRegistrationModal}
        onClose={() => setShowBedRegistrationModal(false)}
        shelter={selectedShelter || undefined}
        selectedDate={selectedDate || undefined}
        onRegistrationComplete={handleBedRegistrationComplete}
        userRole="staff"
      />
    </div>
  );
};