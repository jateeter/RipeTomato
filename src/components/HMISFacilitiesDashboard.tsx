/**
 * HMIS Facilities Dashboard
 * 
 * Comprehensive dashboard for viewing HMIS OpenCommons facilities
 * with both map and tabular views, satellite layers, and real-time sync.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { 
  HMISOpenCommonsFacility, 
  hmisOpenCommonsService, 
  FacilitySearchParams,
  APIResponse
} from '../services/hmisOpenCommonsService';
import { hmisInventorySyncService } from '../services/hmisInventorySyncService';
import EnhancedOpenStreetMap from './EnhancedOpenStreetMap';
import FacilitiesTable from './FacilitiesTable';
import { ClientBedRegistrationModal, BedRegistration } from './ClientBedRegistrationModal';
import { googleCalendarService } from '../services/googleCalendarService';
import ErrorBoundary from './ErrorBoundary';

interface HMISFacilitiesDashboardProps {
  userRole?: 'manager' | 'staff' | 'supervisor';
  organizationId?: string;
  initialView?: 'map' | 'list' | 'table' | 'split';
  showSync?: boolean;
  showExport?: boolean;
  showRegistration?: boolean;
  height?: string;
  className?: string;
}

interface SyncStatus {
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  autoSyncEnabled: boolean;
  syncInterval: number;
  lastSyncResult?: any;
}

export const HMISFacilitiesDashboard: React.FC<HMISFacilitiesDashboardProps> = ({
  userRole = 'staff',
  organizationId = 'default',
  initialView = 'split',
  showSync = true,
  showExport = true,
  showRegistration = true,
  height = '800px',
  className = ''
}) => {
  const [facilities, setFacilities] = useState<HMISOpenCommonsFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'map' | 'list' | 'table' | 'split'>(initialView);
  const [selectedFacility, setSelectedFacility] = useState<HMISOpenCommonsFacility | null>(null);
  const [searchParams, setSearchParams] = useState<FacilitySearchParams>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    syncInProgress: false,
    autoSyncEnabled: false,
    syncInterval: 300000
  });

  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationFacility, setRegistrationFacility] = useState<HMISOpenCommonsFacility | null>(null);

  // Statistics
  const [statistics, setStatistics] = useState({
    totalFacilities: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    utilizationRate: 0,
    facilitiesByType: {} as Record<string, number>,
    facilitiesByState: {} as Record<string, number>
  });

  useEffect(() => {
    loadFacilities();
    initializeSync();
  }, []);

  // Update view when initialView prop changes
  useEffect(() => {
    if (initialView !== currentView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    updateStatistics();
  }, [facilities]);

  useEffect(() => {
    // Update sync status periodically
    const interval = setInterval(() => {
      const status = hmisInventorySyncService.getSyncStatus();
      setSyncStatus(status);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏢 Loading HMIS facilities from OpenCommons...');
      
      const response: APIResponse<HMISOpenCommonsFacility> = await hmisOpenCommonsService.getAllFacilities(searchParams);
      
      if (response.success) {
        setFacilities(response.data);
        console.log(`✅ Loaded ${response.data.length} facilities from HMIS OpenCommons`);
        
        // Initialize calendars for facilities
        await initializeFacilityCalendars(response.data);
      } else {
        setError(response.error || 'Failed to load facilities');
        // Still use the fallback data
        setFacilities(response.data);
      }

    } catch (err) {
      console.error('❌ Failed to load HMIS facilities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const initializeSync = async () => {
    try {
      await hmisInventorySyncService.initialize();
      const status = hmisInventorySyncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to initialize HMIS sync:', error);
    }
  };

  const initializeFacilityCalendars = async (facilities: HMISOpenCommonsFacility[]) => {
    if (showRegistration && userRole === 'manager') {
      try {
        await googleCalendarService.initialize();
        
        for (const facility of facilities.slice(0, 5)) { // Limit to prevent overwhelming
          try {
            // Convert HMIS facility to shelter format for calendar creation
            const shelterFacility = {
              id: facility.id,
              name: facility.name,
              type: 'emergency' as const,
              address: {
                street: facility.address.street || '',
                city: facility.address.city || '',
                state: facility.address.state || '',
                zipCode: facility.address.zipCode || '',
                coordinates: facility.address.latitude && facility.address.longitude ? {
                  lat: facility.address.latitude,
                  lng: facility.address.longitude
                } : undefined
              },
              capacity: {
                total: facility.capacity.total || 0,
                adults: Math.floor((facility.capacity.total || 0) * 0.8),
                families: Math.floor((facility.capacity.total || 0) * 0.15),
                youth: Math.floor((facility.capacity.total || 0) * 0.05)
              },
              currentUtilization: {
                occupied: facility.capacity.occupied || 0,
                available: facility.capacity.available || 0,
                utilizationRate: facility.capacity.total ? (facility.capacity.occupied || 0) / facility.capacity.total : 0,
                lastUpdated: new Date()
              },
              demographics: {
                acceptedPopulations: facility.eligibility.populations || [],
                restrictions: facility.eligibility.restrictions || [],
                specialRequirements: facility.eligibility.requirements || []
              },
              services: facility.services,
              operatingSchedule: {
                availability: '24/7' as const,
                checkInTime: '18:00',
                checkOutTime: '08:00'
              },
              contactInfo: {
                phone: facility.contact.phone,
                email: facility.contact.email,
                website: facility.contact.website
              },
              accessibility: {
                wheelchairAccessible: facility.accessibility.wheelchairAccessible || false,
                ada: facility.accessibility.ada || false,
                publicTransit: facility.accessibility.publicTransit || false,
                parking: facility.accessibility.parking || false
              },
              hmisData: {
                lastSync: new Date(),
                dataSource: 'hmis_opencommons' as const,
                verified: facility.verificationStatus === 'verified'
              },
              spatialData: {
                district: facility.address.city || 'Unknown',
                neighborhood: 'Unknown',
                nearbyLandmarks: [],
                transitAccess: []
              }
            };

            await googleCalendarService.createShelterCalendar(shelterFacility);
          } catch (facilityError) {
            console.log(`Calendar already exists for ${facility.name}`);
          }
        }
      } catch (error) {
        console.error('Failed to initialize facility calendars:', error);
      }
    }
  };

  const updateStatistics = () => {
    const stats = {
      totalFacilities: facilities.length,
      totalBeds: facilities.reduce((sum, f) => sum + (f.capacity.total || 0), 0),
      availableBeds: facilities.reduce((sum, f) => sum + (f.capacity.available || 0), 0),
      occupiedBeds: facilities.reduce((sum, f) => sum + (f.capacity.occupied || 0), 0),
      utilizationRate: 0,
      facilitiesByType: {} as Record<string, number>,
      facilitiesByState: {} as Record<string, number>
    };

    if (stats.totalBeds > 0) {
      stats.utilizationRate = stats.occupiedBeds / stats.totalBeds;
    }

    // Group by type
    facilities.forEach(facility => {
      stats.facilitiesByType[facility.type] = (stats.facilitiesByType[facility.type] || 0) + 1;
    });

    // Group by state
    facilities.forEach(facility => {
      if (facility.address.state) {
        stats.facilitiesByState[facility.address.state] = (stats.facilitiesByState[facility.address.state] || 0) + 1;
      }
    });

    setStatistics(stats);
  };

  const handleSync = async () => {
    try {
      console.log('🔄 Starting manual HMIS sync...');
      const result = await hmisInventorySyncService.performFullSync();
      
      if (result.success) {
        await loadFacilities(); // Reload facilities after sync
        console.log('✅ Manual sync completed successfully');
      } else {
        setError(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      setError(error instanceof Error ? error.message : 'Sync failed');
    }
  };

  const handleSearch = async (params: FacilitySearchParams) => {
    setSearchParams(params);
    setLoading(true);
    
    try {
      const response = await hmisOpenCommonsService.getAllFacilities(params);
      setFacilities(response.data);
    } catch (error) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacilitySelect = (facility: HMISOpenCommonsFacility) => {
    setSelectedFacility(facility);
  };

  const handleFacilityAction = (facility: HMISOpenCommonsFacility, action: string) => {
    if (action === 'register' && showRegistration) {
      setRegistrationFacility(facility);
      setShowRegistrationModal(true);
    }
  };

  const handleRegistrationComplete = async (registration: BedRegistration) => {
    try {
      // Create calendar events for the registration
      const facilityCalendarId = `shelter_${registration.shelterId}`;
      
      await googleCalendarService.createBedRegistrationEvent(
        registration,
        facilityCalendarId
      );

      // Create client calendar and sync
      const clientCalendarId = await googleCalendarService.createPersonalCalendar(
        registration.clientId,
        'client',
        {
          name: registration.clientName,
          email: `${registration.clientId}@system.local`
        }
      );

      await googleCalendarService.createBedRegistrationEvent(
        registration,
        facilityCalendarId,
        clientCalendarId
      );

      console.log('✅ Registration completed with calendar integration');
      setShowRegistrationModal(false);
      setRegistrationFacility(null);
      
    } catch (error) {
      console.error('Failed to complete registration:', error);
    }
  };

  const renderStatistics = () => (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{statistics.totalFacilities}</div>
          <div className="text-sm text-gray-600">Total Facilities</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">{statistics.availableBeds}</div>
          <div className="text-sm text-gray-600">Available Beds</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-orange-600">{statistics.occupiedBeds}</div>
          <div className="text-sm text-gray-600">Occupied Beds</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(statistics.utilizationRate * 100)}%
          </div>
          <div className="text-sm text-gray-600">Utilization Rate</div>
        </div>
      </div>

      {/* Sync Status */}
      {showSync && (
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">HMIS Sync Status</div>
              <div className="text-xs text-gray-600">
                {syncStatus.lastSyncTime 
                  ? `Last sync: ${syncStatus.lastSyncTime.toLocaleString()}`
                  : 'Never synced'
                }
                {syncStatus.syncInProgress && (
                  <span className="ml-2 text-blue-600">Syncing...</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                syncStatus.syncInProgress ? 'bg-blue-500 animate-pulse' : 
                syncStatus.autoSyncEnabled ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <button
                onClick={handleSync}
                disabled={syncStatus.syncInProgress}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
              >
                {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderViewControls = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <h2 className="text-2xl font-bold text-gray-900">HMIS Facilities</h2>
        <span className="text-sm text-gray-500">
          ({facilities.length} facilities from HMIS OpenCommons)
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('map')}
            className={`px-3 py-2 text-sm rounded-md ${
              currentView === 'map' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🗺️ Map
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`px-3 py-2 text-sm rounded-md ${
              currentView === 'list' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setCurrentView('table')}
            className={`px-3 py-2 text-sm rounded-md ${
              currentView === 'table' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Table
          </button>
          <button
            onClick={() => setCurrentView('split')}
            className={`px-3 py-2 text-sm rounded-md ${
              currentView === 'split' 
                ? 'bg-white text-gray-900 shadow' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔄 Split
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadFacilities()}
            disabled={loading}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⟳ Loading...' : '🔄 Refresh'}
          </button>
          
          {showRegistration && (
            <button
              onClick={() => setShowRegistrationModal(true)}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              🏠 Register Client
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`hmis-dashboard ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-900">Loading HMIS Facilities</div>
            <div className="text-sm text-gray-600">Fetching data from hmis.opencommons.org...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hmis-dashboard ${className}`} style={{ height }}>
      {renderStatistics()}
      {renderViewControls()}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </div>
          <div className="text-red-600 text-xs mt-1">
            Showing cached or fallback data. Please try refreshing or check your connection.
          </div>
        </div>
      )}

      {/* Content Views */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'map' && (
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
                  <p className="text-gray-600 mb-4">Unable to load the interactive map.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            }
          >
            <EnhancedOpenStreetMap
              facilities={facilities}
              onFacilitySelect={handleFacilitySelect}
              selectedFacility={selectedFacility}
              showSatellite={true}
              enableClustering={true}
              showControls={true}
              showSearch={true}
              height="100%"
            />
          </ErrorBoundary>
        )}

        {currentView === 'list' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Facilities List</h3>
            <div className="grid gap-4">
              {facilities.map((facility) => (
                <div 
                  key={facility.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedFacility?.id === facility.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleFacilitySelect(facility)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{facility.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{facility.type}</p>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">📍</span>
                          <span>{facility.address.city}, {facility.address.state}</span>
                        </div>
                        {facility.contact.phone && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">📞</span>
                            <a href={`tel:${facility.contact.phone}`} className="text-blue-600 hover:underline">
                              {facility.contact.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">🛏️</span>
                          <span>
                            {facility.capacity.available || 0} available / {facility.capacity.total || 0} total beds
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        (facility.capacity.available || 0) > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(facility.capacity.available || 0) > 0 ? 'Available' : 'Full'}
                      </div>
                      {showRegistration && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFacilityAction(facility, 'register');
                          }}
                          className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {facility.services.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {facility.services.slice(0, 4).map((service, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {service}
                        </span>
                      ))}
                      {facility.services.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                          +{facility.services.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'table' && (
          <FacilitiesTable
            facilities={facilities}
            onFacilitySelect={handleFacilitySelect}
            onFacilityAction={handleFacilityAction}
            selectedFacility={selectedFacility}
            showActions={true}
            showExport={showExport}
            showFilters={true}
            showPagination={true}
            maxHeight="100%"
          />
        )}

        {currentView === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="min-h-0">
              <h3 className="text-lg font-semibold mb-3">Interactive Map</h3>
              <ErrorBoundary
                fallback={
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🗺️</div>
                      <p className="text-sm text-gray-600">Map unavailable</p>
                    </div>
                  </div>
                }
              >
                <EnhancedOpenStreetMap
                  facilities={facilities}
                  onFacilitySelect={handleFacilitySelect}
                  selectedFacility={selectedFacility}
                  showSatellite={true}
                  enableClustering={true}
                  showControls={true}
                  showSearch={false}
                  height="calc(100% - 2rem)"
                />
              </ErrorBoundary>
            </div>
            <div className="min-h-0 flex flex-col">
              <h3 className="text-lg font-semibold mb-3">Facilities Table</h3>
              <div className="flex-1 min-h-0">
                <FacilitiesTable
                  facilities={facilities}
                  onFacilitySelect={handleFacilitySelect}
                  onFacilityAction={handleFacilityAction}
                  selectedFacility={selectedFacility}
                  showActions={true}
                  showExport={false}
                  showFilters={false}
                  showPagination={true}
                  pageSize={10}
                  maxHeight="100%"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <ClientBedRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => {
            setShowRegistrationModal(false);
            setRegistrationFacility(null);
          }}
          shelter={registrationFacility ? {
            id: registrationFacility.id,
            name: registrationFacility.name,
            type: 'emergency' as const,
            address: {
              street: registrationFacility.address.street || '',
              city: registrationFacility.address.city || '',
              state: registrationFacility.address.state || '',
              zipCode: registrationFacility.address.zipCode || ''
            },
            capacity: {
              total: registrationFacility.capacity.total || 0,
              adults: 0,
              families: 0,
              youth: 0
            },
            currentUtilization: {
              occupied: registrationFacility.capacity.occupied || 0,
              available: registrationFacility.capacity.available || 0,
              utilizationRate: 0,
              lastUpdated: new Date()
            },
            demographics: {
              acceptedPopulations: registrationFacility.eligibility.populations || [],
              restrictions: registrationFacility.eligibility.restrictions || [],
              specialRequirements: registrationFacility.eligibility.requirements || []
            },
            services: registrationFacility.services,
            operatingSchedule: {
              availability: '24/7' as const,
              checkInTime: '18:00',
              checkOutTime: '08:00'
            },
            contactInfo: {
              phone: registrationFacility.contact.phone,
              email: registrationFacility.contact.email,
              website: registrationFacility.contact.website
            },
            accessibility: {
              wheelchairAccessible: registrationFacility.accessibility.wheelchairAccessible || false,
              ada: registrationFacility.accessibility.ada || false,
              publicTransit: registrationFacility.accessibility.publicTransit || false,
              parking: registrationFacility.accessibility.parking || false
            },
            hmisData: {
              lastSync: new Date(),
              dataSource: 'hmis_opencommons' as const,
              verified: registrationFacility.verificationStatus === 'verified'
            },
            spatialData: {
              district: registrationFacility.address.city || 'Unknown',
              neighborhood: 'Unknown',
              nearbyLandmarks: [],
              transitAccess: []
            }
          } : undefined}
          onRegistrationComplete={handleRegistrationComplete}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default HMISFacilitiesDashboard;