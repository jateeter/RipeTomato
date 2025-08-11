/**
 * OpenMaps Component
 * 
 * Interactive mapping component using OpenStreetMap and spatial navigation
 * for shelter facilities with utilization metrics popups.
 * 
 * @license MIT
 */

import React, { useState, useEffect, useRef } from 'react';
import { shelterDataService, ShelterFacility, ShelterUtilizationMetrics } from '../services/shelterDataService';

interface OpenMapsProps {
  shelters: ShelterFacility[];
  onShelterSelect?: (shelter: ShelterFacility) => void;
  showUtilizationPopups?: boolean;
  userRole?: 'manager' | 'staff' | 'client';
  enableSpatialNavigation?: boolean;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SpatialRegion {
  id: string;
  name: string;
  bounds: MapBounds;
  shelterCount: number;
  totalCapacity: number;
  currentOccupancy: number;
  color: string;
}

export const OpenMapsComponent: React.FC<OpenMapsProps> = ({
  shelters,
  onShelterSelect,
  showUtilizationPopups = true,
  userRole = 'staff',
  enableSpatialNavigation = true,
  height = '500px',
  center = { lat: 45.515, lng: -122.65 }, // Portland center
  zoom = 12
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedShelter, setSelectedShelter] = useState<ShelterFacility | null>(null);
  const [utilizationMetrics, setUtilizationMetrics] = useState<Record<string, ShelterUtilizationMetrics>>({});
  const [spatialRegions, setSpatialRegions] = useState<SpatialRegion[]>([]);
  const [currentBounds, setCurrentBounds] = useState<MapBounds>({
    north: center.lat + 0.1,
    south: center.lat - 0.1,
    east: center.lng + 0.1,
    west: center.lng - 0.1
  });
  const [spatialNavigationActive, setSpatialNavigationActive] = useState(false);

  useEffect(() => {
    // Load utilization metrics for all shelters
    loadUtilizationMetrics();
    
    // Initialize spatial regions
    if (enableSpatialNavigation) {
      initializeSpatialRegions();
    }
    
    // Initialize OpenStreetMap
    initializeMap();
  }, [shelters, enableSpatialNavigation]);

  const loadUtilizationMetrics = async () => {
    const metrics: Record<string, ShelterUtilizationMetrics> = {};
    
    for (const shelter of shelters) {
      try {
        const metric = await shelterDataService.getShelterUtilization(shelter.id);
        if (metric) {
          metrics[shelter.id] = metric;
        }
      } catch (error) {
        console.error(`Failed to load metrics for shelter ${shelter.id}:`, error);
      }
    }
    
    setUtilizationMetrics(metrics);
  };

  const initializeSpatialRegions = () => {
    // Create spatial regions based on Portland districts
    const regions: SpatialRegion[] = [
      {
        id: 'north_portland',
        name: 'North Portland',
        bounds: { north: 45.65, south: 45.53, east: -122.4, west: -122.8 },
        shelterCount: 0,
        totalCapacity: 0,
        currentOccupancy: 0,
        color: '#3B82F6' // Blue
      },
      {
        id: 'east_portland',
        name: 'East Portland',
        bounds: { north: 45.53, south: 45.35, east: -122.4, west: -122.6 },
        shelterCount: 0,
        totalCapacity: 0,
        currentOccupancy: 0,
        color: '#10B981' // Green
      },
      {
        id: 'west_portland',
        name: 'West Portland',
        bounds: { north: 45.53, south: 45.35, east: -122.6, west: -122.8 },
        shelterCount: 0,
        totalCapacity: 0,
        currentOccupancy: 0,
        color: '#F59E0B' // Yellow
      },
      {
        id: 'south_portland',
        name: 'South Portland',
        bounds: { north: 45.48, south: 45.35, east: -122.4, west: -122.8 },
        shelterCount: 0,
        totalCapacity: 0,
        currentOccupancy: 0,
        color: '#EF4444' // Red
      }
    ];

    // Calculate statistics for each region
    regions.forEach(region => {
      const regionShelters = shelters.filter(shelter => {
        const coords = shelter.address.coordinates;
        if (!coords) return false;
        
        return coords.lat <= region.bounds.north &&
               coords.lat >= region.bounds.south &&
               coords.lng <= region.bounds.east &&
               coords.lng >= region.bounds.west;
      });
      
      region.shelterCount = regionShelters.length;
      region.totalCapacity = regionShelters.reduce((sum, s) => sum + s.capacity.total, 0);
      region.currentOccupancy = regionShelters.reduce((sum, s) => sum + s.currentUtilization.occupied, 0);
    });

    setSpatialRegions(regions);
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Simple OpenStreetMap implementation using HTML/CSS
    // In a real implementation, this would use a library like Leaflet or OpenLayers
    console.log('🗺️ Initializing OpenStreetMap with', shelters.length, 'shelters');
  };

  const handleShelterClick = async (shelter: ShelterFacility) => {
    setSelectedShelter(shelter);
    
    // Load fresh utilization data
    const metrics = await shelterDataService.getShelterUtilization(shelter.id);
    if (metrics) {
      setUtilizationMetrics(prev => ({ ...prev, [shelter.id]: metrics }));
    }
    
    onShelterSelect?.(shelter);
  };

  const getUtilizationColor = (utilizationRate: number): string => {
    if (utilizationRate >= 1.0) return '#EF4444'; // Red - At capacity
    if (utilizationRate >= 0.85) return '#F59E0B'; // Yellow - Near capacity
    if (utilizationRate >= 0.5) return '#10B981'; // Green - Good availability
    return '#3B82F6'; // Blue - Low occupancy
  };

  const getShelterStatusIcon = (shelter: ShelterFacility): string => {
    const metrics = utilizationMetrics[shelter.id];
    if (!metrics) return '🏠';
    
    if (metrics.alerts.atCapacity) return '🔴';
    if (metrics.alerts.nearCapacity) return '🟡';
    if (metrics.alerts.maintenanceIssues) return '🔧';
    if (metrics.alerts.staffShortage) return '⚠️';
    return '🟢';
  };

  const renderSpatialNavigation = () => {
    if (!enableSpatialNavigation) return null;

    return (
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Spatial Navigation</h3>
          <button
            onClick={() => setSpatialNavigationActive(!spatialNavigationActive)}
            className={`text-xs px-2 py-1 rounded ${
              spatialNavigationActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {spatialNavigationActive ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {spatialNavigationActive && (
          <div className="space-y-2">
            {spatialRegions.map(region => (
              <div key={region.id} className="text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: region.color }}
                    />
                    <span className="font-medium">{region.name}</span>
                  </div>
                  <span className="text-gray-600">{region.shelterCount}</span>
                </div>
                <div className="ml-5 text-gray-500">
                  {region.currentOccupancy}/{region.totalCapacity} occupied
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderUtilizationPopup = () => {
    if (!selectedShelter || !showUtilizationPopups) return null;
    
    const metrics = utilizationMetrics[selectedShelter.id];
    if (!metrics) return null;

    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-4 z-20 max-w-sm border-2 border-blue-500">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg">{selectedShelter.name}</h3>
            <p className="text-sm text-gray-600">{selectedShelter.address.street}</p>
          </div>
          <button
            onClick={() => setSelectedShelter(null)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.metrics.occupied}
            </div>
            <div className="text-xs text-gray-600">Occupied</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.metrics.available}
            </div>
            <div className="text-xs text-gray-600">Available</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Utilization</span>
            <span>{Math.round(metrics.metrics.utilizationRate * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${metrics.metrics.utilizationRate * 100}%`,
                backgroundColor: getUtilizationColor(metrics.metrics.utilizationRate)
              }}
            />
          </div>
        </div>

        {userRole === 'manager' && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-medium">Demographics</div>
              <div>Adults: {metrics.metrics.demographics.adults}</div>
              <div>Families: {metrics.metrics.demographics.families}</div>
              <div>Youth: {metrics.metrics.demographics.youth}</div>
              <div>Veterans: {metrics.metrics.demographics.veterans}</div>
            </div>
            <div>
              <div className="font-medium">Metrics</div>
              <div>Turnover: {Math.round(metrics.metrics.turnover * 100)}%</div>
              <div>Avg Stay: {Math.round(metrics.metrics.averageStayLength)} days</div>
              <div>Type: {selectedShelter.type}</div>
            </div>
          </div>
        )}

        {(metrics.alerts.nearCapacity || metrics.alerts.atCapacity || 
          metrics.alerts.maintenanceIssues || metrics.alerts.staffShortage) && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <div className="font-medium text-red-800 mb-1">Alerts:</div>
            {metrics.alerts.atCapacity && <div className="text-red-700">• At full capacity</div>}
            {metrics.alerts.nearCapacity && <div className="text-red-700">• Near capacity (85%+)</div>}
            {metrics.alerts.maintenanceIssues && <div className="text-red-700">• Maintenance needed</div>}
            {metrics.alerts.staffShortage && <div className="text-red-700">• Staff shortage</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" style={{ height }}>
      {/* OpenStreetMap Container */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gray-100 rounded-lg border relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(45deg, #f3f4f6 25%, transparent 25%), 
                           linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), 
                           linear-gradient(45deg, transparent 75%, #f3f4f6 75%), 
                           linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)`,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Map Title */}
        <div className="absolute top-2 right-2 bg-white rounded px-2 py-1 text-xs font-medium shadow z-10">
          Portland Metro Area Shelters
        </div>

        {/* Shelter Markers */}
        {shelters.map((shelter, index) => {
          if (!shelter.address.coordinates) return null;
          
          // Convert lat/lng to relative positioning (simplified)
          const x = ((shelter.address.coordinates.lng + 122.8) / 0.4) * 100;
          const y = ((45.65 - shelter.address.coordinates.lat) / 0.3) * 100;
          
          return (
            <div
              key={shelter.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              style={{
                left: `${Math.max(5, Math.min(95, x))}%`,
                top: `${Math.max(5, Math.min(95, y))}%`
              }}
              onClick={() => handleShelterClick(shelter)}
              title={`${shelter.name} - ${shelter.currentUtilization.occupied}/${shelter.capacity.total}`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white transform transition-transform hover:scale-110 ${
                  selectedShelter?.id === shelter.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  backgroundColor: getUtilizationColor(shelter.currentUtilization.utilizationRate)
                }}
              >
                {getShelterStatusIcon(shelter)}
              </div>
            </div>
          );
        })}

        {/* Spatial Navigation Regions */}
        {spatialNavigationActive && spatialRegions.map(region => {
          const x = ((region.bounds.west + region.bounds.east) / 2 + 122.8) / 0.4 * 100;
          const y = ((45.65 - (region.bounds.north + region.bounds.south) / 2) / 0.3) * 100;
          
          return (
            <div
              key={region.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center z-5"
              style={{
                left: `${Math.max(10, Math.min(90, x))}%`,
                top: `${Math.max(10, Math.min(90, y))}%`
              }}
            >
              <div
                className="px-2 py-1 rounded text-xs font-semibold text-white shadow"
                style={{ backgroundColor: region.color + '99' }}
              >
                {region.name}
                <br />
                {region.shelterCount} shelters
              </div>
            </div>
          );
        })}
      </div>

      {/* Spatial Navigation Panel */}
      {renderSpatialNavigation()}

      {/* Utilization Popup */}
      {renderUtilizationPopup()}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Utilization Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <span>50-84%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <span>85-99%</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};