/**
 * Enhanced Facilities Collection
 * 
 * Comprehensive facilities management with calendar integration,
 * registration tracking, and interactive data visualization.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { ShelterFacility, shelterDataService } from '../services/shelterDataService';
import { InteractiveCalendar } from './InteractiveCalendar';
import { ClientBedRegistrationModal, BedRegistration } from './ClientBedRegistrationModal';
import { OpenMapsComponent } from './OpenMapsComponent';
import { ShelterList } from './ShelterList';

interface FacilityRegistrationData {
  facilityId: string;
  facilityName: string;
  totalRegistrations: number;
  activeRegistrations: number;
  upcomingCheckIns: number;
  upcomingCheckOuts: number;
  averageStayLength: number;
  occupancyTrend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: Date;
}

interface EnhancedFacilitiesCollectionProps {
  userRole: 'manager' | 'staff' | 'supervisor';
  showCalendar?: boolean;
  showMap?: boolean;
  showRegistrationTracking?: boolean;
  onFacilitySelect?: (facility: ShelterFacility) => void;
}

export const EnhancedFacilitiesCollection: React.FC<EnhancedFacilitiesCollectionProps> = ({
  userRole,
  showCalendar = true,
  showMap = true,
  showRegistrationTracking = true,
  onFacilitySelect
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'calendar' | 'map' | 'list' | 'analytics'>('overview');
  const [selectedFacility, setSelectedFacility] = useState<ShelterFacility | null>(null);
  const [facilities, setFacilities] = useState<ShelterFacility[]>([]);
  const [facilityRegistrations, setFacilityRegistrations] = useState<FacilityRegistrationData[]>([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // System-wide metrics
  const [systemMetrics, setSystemMetrics] = useState<{
    totalFacilities: number;
    totalCapacity: number;
    currentOccupancy: number;
    availableBeds: number;
    systemUtilization: number;
    totalActiveRegistrations: number;
    averageStayLength: number;
    occupancyTrend: 'up' | 'down' | 'stable';
  }>({
    totalFacilities: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
    availableBeds: 0,
    systemUtilization: 0,
    totalActiveRegistrations: 0,
    averageStayLength: 0,
    occupancyTrend: 'stable'
  });

  useEffect(() => {
    loadFacilitiesData();
  }, []);

  const loadFacilitiesData = async () => {
    try {
      setLoading(true);
      
      // Load shelter facilities
      const shelters = await shelterDataService.getAllShelters();
      setFacilities(shelters);
      
      // Load registration data for each facility
      const registrationData = await loadFacilityRegistrations(shelters);
      setFacilityRegistrations(registrationData);
      
      // Calculate system metrics
      const metrics = calculateSystemMetrics(shelters, registrationData);
      setSystemMetrics(metrics);
      
      console.log('Enhanced facilities data loaded:', {
        facilities: shelters.length,
        registrations: registrationData.length,
        systemMetrics: metrics
      });
      
    } catch (error) {
      console.error('Failed to load facilities data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacilityRegistrations = async (shelters: ShelterFacility[]): Promise<FacilityRegistrationData[]> => {
    const registrationData: FacilityRegistrationData[] = [];
    
    for (const shelter of shelters) {
      // Load registrations from localStorage (in real app, from API/Solid Pod)
      const registrations = loadStoredRegistrations(shelter.id);
      
      // Calculate metrics
      const activeRegistrations = registrations.filter(r => r.status === 'active');
      const now = new Date();
      const upcoming24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const upcomingCheckIns = registrations.filter(r => {
        const checkIn = new Date(r.checkInDate);
        return checkIn >= now && checkIn <= upcoming24h;
      }).length;
      
      const upcomingCheckOuts = registrations.filter(r => {
        const checkOut = r.expectedCheckOutDate ? new Date(r.expectedCheckOutDate) : null;
        return checkOut && checkOut >= now && checkOut <= upcoming24h;
      }).length;
      
      const averageStayLength = calculateAverageStayLength(registrations);
      
      registrationData.push({
        facilityId: shelter.id,
        facilityName: shelter.name,
        totalRegistrations: registrations.length,
        activeRegistrations: activeRegistrations.length,
        upcomingCheckIns,
        upcomingCheckOuts,
        averageStayLength,
        occupancyTrend: calculateOccupancyTrend(registrations),
        lastUpdated: new Date()
      });
    }
    
    return registrationData;
  };

  const loadStoredRegistrations = (facilityId?: string): BedRegistration[] => {
    const registrations: BedRegistration[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bed_registration_')) {
        try {
          const registration = JSON.parse(localStorage.getItem(key) || '{}');
          if (!facilityId || registration.shelterId === facilityId) {
            registrations.push({
              ...registration,
              checkInDate: new Date(registration.checkInDate),
              expectedCheckOutDate: registration.expectedCheckOutDate 
                ? new Date(registration.expectedCheckOutDate) 
                : undefined,
              actualCheckOutDate: registration.actualCheckOutDate 
                ? new Date(registration.actualCheckOutDate) 
                : undefined,
              registrationDate: new Date(registration.registrationDate)
            });
          }
        } catch (error) {
          console.error('Failed to parse registration:', error);
        }
      }
    }
    
    return registrations;
  };

  const calculateAverageStayLength = (registrations: BedRegistration[]): number => {
    const completedStays = registrations.filter(r => r.actualCheckOutDate);
    if (completedStays.length === 0) return 14; // Default assumption
    
    const totalDays = completedStays.reduce((sum, reg) => {
      const checkIn = new Date(reg.checkInDate);
      const checkOut = new Date(reg.actualCheckOutDate!);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / completedStays.length);
  };

  const calculateOccupancyTrend = (registrations: BedRegistration[]): 'increasing' | 'decreasing' | 'stable' => {
    // Simple trend calculation based on recent registrations
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastTwoWeeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentRegistrations = registrations.filter(r => new Date(r.registrationDate) >= lastWeek).length;
    const previousWeekRegistrations = registrations.filter(r => {
      const regDate = new Date(r.registrationDate);
      return regDate >= lastTwoWeeks && regDate < lastWeek;
    }).length;
    
    if (recentRegistrations > previousWeekRegistrations * 1.1) return 'increasing';
    if (recentRegistrations < previousWeekRegistrations * 0.9) return 'decreasing';
    return 'stable';
  };

  const calculateSystemMetrics = (
    shelters: ShelterFacility[], 
    registrationData: FacilityRegistrationData[]
  ) => {
    const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity.total, 0);
    const currentOccupancy = shelters.reduce((sum, s) => sum + s.currentUtilization.occupied, 0);
    const availableBeds = totalCapacity - currentOccupancy;
    const systemUtilization = currentOccupancy / totalCapacity;
    
    const totalActiveRegistrations = registrationData.reduce((sum, r) => sum + r.activeRegistrations, 0);
    const averageStayLength = registrationData.length > 0 
      ? Math.round(registrationData.reduce((sum, r) => sum + r.averageStayLength, 0) / registrationData.length)
      : 14;
    
    // Determine trend based on individual facility trends
    const increasingCount = registrationData.filter(r => r.occupancyTrend === 'increasing').length;
    const decreasingCount = registrationData.filter(r => r.occupancyTrend === 'decreasing').length;
    
    let occupancyTrend: 'up' | 'down' | 'stable' = 'stable';
    if (increasingCount > decreasingCount * 1.5) occupancyTrend = 'up';
    else if (decreasingCount > increasingCount * 1.5) occupancyTrend = 'down';
    
    return {
      totalFacilities: shelters.length,
      totalCapacity,
      currentOccupancy,
      availableBeds,
      systemUtilization,
      totalActiveRegistrations,
      averageStayLength,
      occupancyTrend
    };
  };

  const handleFacilitySelect = (facility: ShelterFacility) => {
    setSelectedFacility(facility);
    onFacilitySelect?.(facility);
  };

  const handleDateSelect = (date: Date, availableBeds: number) => {
    setSelectedDate(date);
    if (availableBeds > 0 && selectedFacility) {
      // Auto-open registration modal if there are available beds
      setShowRegistrationModal(true);
    }
  };

  const handleRegistrationComplete = (registration: BedRegistration) => {
    console.log('Registration completed:', registration);
    setShowRegistrationModal(false);
    // Reload data to reflect changes
    loadFacilitiesData();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': 
      case 'increasing': 
        return '📈';
      case 'down': 
      case 'decreasing': 
        return '📉';
      default: 
        return '➡️';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{systemMetrics.totalFacilities}</div>
          <div className="text-sm text-blue-800">Total Facilities</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{systemMetrics.availableBeds}</div>
          <div className="text-sm text-green-800">Available Beds</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{systemMetrics.totalActiveRegistrations}</div>
          <div className="text-sm text-purple-800">Active Registrations</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {Math.round(systemMetrics.systemUtilization * 100)}%
          </div>
          <div className="text-sm text-yellow-800 flex items-center">
            System Utilization {getTrendIcon(systemMetrics.occupancyTrend)}
          </div>
        </div>
      </div>

      {/* Facility Registration Summary */}
      {showRegistrationTracking && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Facility Registration Summary
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Facility</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Active</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Check-ins Today</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Check-outs Today</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Avg Stay</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Trend</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {facilityRegistrations.map(reg => (
                  <tr key={reg.facilityId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-blue-600 cursor-pointer hover:text-blue-800"
                        onClick={() => {
                          const facility = facilities.find(f => f.id === reg.facilityId);
                          if (facility) handleFacilitySelect(facility);
                        }}>
                      {reg.facilityName}
                    </td>
                    <td className="px-3 py-2">{reg.activeRegistrations}</td>
                    <td className="px-3 py-2">{reg.upcomingCheckIns}</td>
                    <td className="px-3 py-2">{reg.upcomingCheckOuts}</td>
                    <td className="px-3 py-2">{reg.averageStayLength} days</td>
                    <td className="px-3 py-2">{getTrendIcon(reg.occupancyTrend)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => {
                          const facility = facilities.find(f => f.id === reg.facilityId);
                          if (facility) {
                            setSelectedFacility(facility);
                            setShowRegistrationModal(true);
                          }
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Register Client
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveView('calendar')}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <div className="font-medium text-blue-600 mb-2">📅 Calendar View</div>
          <div className="text-sm text-gray-600">View occupancy and events by date</div>
        </button>
        <button
          onClick={() => setActiveView('map')}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <div className="font-medium text-green-600 mb-2">🗺️ Map View</div>
          <div className="text-sm text-gray-600">Spatial view of all facilities</div>
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className="p-4 border rounded-lg hover:bg-gray-50 text-left"
        >
          <div className="font-medium text-purple-600 mb-2">📈 Analytics</div>
          <div className="text-sm text-gray-600">Detailed metrics and trends</div>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Facilities Collection</h2>
        <div className="flex items-center space-x-2">
          {['overview', 'calendar', 'map', 'list', 'analytics'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={`px-3 py-1 rounded text-sm ${
                activeView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && renderOverview()}
      
      {activeView === 'calendar' && showCalendar && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Facilities Calendar</h3>
            {selectedFacility && (
              <div className="text-sm text-gray-600">
                Viewing: {selectedFacility.name}
              </div>
            )}
          </div>
          <InteractiveCalendar
            shelter={selectedFacility || undefined}
            onDateSelect={handleDateSelect}
            showOccupancy={true}
            showEvents={true}
            userRole={userRole}
            height="600px"
          />
        </div>
      )}
      
      {activeView === 'map' && showMap && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Facilities Map View</h3>
          <OpenMapsComponent
            shelters={facilities}
            onShelterSelect={handleFacilitySelect}
            showUtilizationPopups={true}
            userRole={userRole === 'supervisor' ? 'manager' : userRole}
            enableSpatialNavigation={true}
            height="600px"
          />
        </div>
      )}
      
      {activeView === 'list' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Facilities List View</h3>
          <ShelterList
            userRole={userRole === 'supervisor' ? 'manager' : userRole}
            showFilters={true}
            allowSelection={true}
            onShelterSelect={handleFacilitySelect}
            maxHeight="600px"
            enableExport={userRole === 'manager'}
          />
        </div>
      )}
      
      {activeView === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Facilities Analytics</h3>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <div className="text-lg font-medium text-gray-600">Advanced Analytics</div>
            <div className="text-sm text-gray-500 mt-2">
              Detailed analytics dashboard would be implemented here with charts, 
              trends, and comprehensive reporting features.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
              <div className="bg-white p-4 rounded border">
                <div className="font-medium">System Performance</div>
                <div className="text-sm text-gray-600 mt-1">
                  Average utilization: {Math.round(systemMetrics.systemUtilization * 100)}%
                </div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className="font-medium">Client Flow</div>
                <div className="text-sm text-gray-600 mt-1">
                  Average stay: {systemMetrics.averageStayLength} days
                </div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className="font-medium">Capacity Management</div>
                <div className="text-sm text-gray-600 mt-1">
                  {systemMetrics.availableBeds} beds available system-wide
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Bed Registration Modal */}
      <ClientBedRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        shelter={selectedFacility || undefined}
        selectedDate={selectedDate || undefined}
        onRegistrationComplete={handleRegistrationComplete}
        userRole={userRole}
      />
    </div>
  );
};