/**
 * Shelter List Component
 * 
 * Tabular display of shelter facilities with utilization metrics,
 * filtering, and dynamic access for Manager and Staff dashboards.
 * 
 * @license MIT
 */

import React, { useState, useEffect } from 'react';
import { shelterDataService, ShelterFacility, ShelterUtilizationMetrics, ShelterSearchFilters } from '../services/shelterDataService';

interface ShelterListProps {
  userRole?: 'manager' | 'staff' | 'client';
  showFilters?: boolean;
  allowSelection?: boolean;
  onShelterSelect?: (shelter: ShelterFacility) => void;
  maxHeight?: string;
  enableExport?: boolean;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export const ShelterList: React.FC<ShelterListProps> = ({
  userRole = 'staff',
  showFilters = true,
  allowSelection = true,
  onShelterSelect,
  maxHeight = '600px',
  enableExport = false
}) => {
  const [shelters, setShelters] = useState<ShelterFacility[]>([]);
  const [utilizationMetrics, setUtilizationMetrics] = useState<Record<string, ShelterUtilizationMetrics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  
  // Filter state
  const [filters, setFilters] = useState<ShelterSearchFilters>({
    facilityTypes: [],
    availabilityOnly: false,
    acceptsPopulation: [],
    hasServices: [],
    wheelchair: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // System overview state
  const [systemOverview, setSystemOverview] = useState<{
    totalShelters: number;
    totalCapacity: number;
    totalOccupied: number;
    totalAvailable: number;
    systemUtilizationRate: number;
    alertCount: number;
  } | null>(null);

  useEffect(() => {
    loadShelterData();
  }, [filters, searchTerm]);

  const loadShelterData = async () => {
    try {
      setLoading(true);
      
      // Load shelters with filters
      const shelterData = await shelterDataService.getAllShelters(filters);
      
      // Apply search term filtering
      const filteredShelters = searchTerm
        ? shelterData.filter(shelter =>
            shelter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shelter.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shelter.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shelter.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : shelterData;
      
      setShelters(filteredShelters);
      
      // Load utilization metrics for each shelter
      const metrics: Record<string, ShelterUtilizationMetrics> = {};
      for (const shelter of filteredShelters) {
        try {
          const metric = await shelterDataService.getShelterUtilization(shelter.id);
          if (metric) {
            metrics[shelter.id] = metric;
          }
        } catch (error) {
          console.error(`Failed to load metrics for ${shelter.id}:`, error);
        }
      }
      setUtilizationMetrics(metrics);
      
      // Load system overview
      const overview = await shelterDataService.getShelterSystemOverview();
      setSystemOverview(overview);
      
    } catch (error) {
      console.error('Failed to load shelter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleShelterClick = (shelter: ShelterFacility) => {
    if (allowSelection) {
      setSelectedShelterId(shelter.id);
      onShelterSelect?.(shelter);
    }
  };

  const handleFilterChange = (key: keyof ShelterSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUtilizationColor = (rate: number): string => {
    if (rate >= 1.0) return 'text-red-600 bg-red-50';
    if (rate >= 0.85) return 'text-yellow-600 bg-yellow-50';
    if (rate >= 0.5) return 'text-green-600 bg-green-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getStatusIndicator = (shelter: ShelterFacility): { icon: string; color: string; tooltip: string } => {
    const metrics = utilizationMetrics[shelter.id];
    if (!metrics) return { icon: '⚪', color: 'text-gray-400', tooltip: 'No data' };
    
    if (metrics.alerts.atCapacity) return { icon: '🔴', color: 'text-red-600', tooltip: 'At capacity' };
    if (metrics.alerts.nearCapacity) return { icon: '🟡', color: 'text-yellow-600', tooltip: 'Near capacity' };
    if (metrics.alerts.maintenanceIssues) return { icon: '🔧', color: 'text-orange-600', tooltip: 'Maintenance needed' };
    if (metrics.alerts.staffShortage) return { icon: '⚠️', color: 'text-red-600', tooltip: 'Staff shortage' };
    return { icon: '🟢', color: 'text-green-600', tooltip: 'Available' };
  };

  const getSortedShelters = (): ShelterFacility[] => {
    return [...shelters].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity.total;
          bValue = b.capacity.total;
          break;
        case 'occupied':
          aValue = a.currentUtilization.occupied;
          bValue = b.currentUtilization.occupied;
          break;
        case 'available':
          aValue = a.currentUtilization.available;
          bValue = b.currentUtilization.available;
          break;
        case 'utilization':
          aValue = a.currentUtilization.utilizationRate;
          bValue = b.currentUtilization.utilizationRate;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const renderFiltersPanel = () => {
    if (!showFilters || !showFiltersPanel) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facility Type
            </label>
            <div className="space-y-1">
              {['emergency', 'transitional', 'permanent', 'day_center'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.facilityTypes?.includes(type) || false}
                    onChange={(e) => {
                      const types = filters.facilityTypes || [];
                      const newTypes = e.target.checked
                        ? [...types, type]
                        : types.filter(t => t !== type);
                      handleFilterChange('facilityTypes', newTypes);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Population
            </label>
            <div className="space-y-1">
              {['all-gender', 'men', 'women', 'families', 'veterans', 'youth'].map(pop => (
                <label key={pop} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.acceptsPopulation?.includes(pop) || false}
                    onChange={(e) => {
                      const pops = filters.acceptsPopulation || [];
                      const newPops = e.target.checked
                        ? [...pops, pop]
                        : pops.filter(p => p !== pop);
                      handleFilterChange('acceptsPopulation', newPops);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm capitalize">{pop.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other Filters
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.availabilityOnly || false}
                  onChange={(e) => handleFilterChange('availabilityOnly', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Available beds only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.wheelchair || false}
                  onChange={(e) => handleFilterChange('wheelchair', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Wheelchair accessible</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemOverview = () => {
    if (!systemOverview || userRole === 'client') return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{systemOverview.totalShelters}</div>
          <div className="text-sm text-blue-800">Total Shelters</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{systemOverview.totalCapacity}</div>
          <div className="text-sm text-green-800">Total Capacity</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{systemOverview.totalOccupied}</div>
          <div className="text-sm text-yellow-800">Occupied</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{systemOverview.totalAvailable}</div>
          <div className="text-sm text-purple-800">Available</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600">
            {Math.round(systemOverview.systemUtilizationRate * 100)}%
          </div>
          <div className="text-sm text-gray-800">System Util.</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderSystemOverview()}
      
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search shelters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`px-4 py-2 rounded-lg border ${
                showFiltersPanel
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Filters {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v)) ? '●' : ''}
            </button>
          )}
          
          {enableExport && userRole === 'manager' && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Export CSV
            </button>
          )}
          
          <div className="text-sm text-gray-600">
            {shelters.length} shelters
          </div>
        </div>
      </div>

      {renderFiltersPanel()}

      {/* Shelter Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('capacity')}
                >
                  Capacity {sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('utilization')}
                >
                  Utilization {sortConfig.key === 'utilization' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demographics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                {userRole === 'manager' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedShelters().map(shelter => {
                const status = getStatusIndicator(shelter);
                const metrics = utilizationMetrics[shelter.id];
                
                return (
                  <tr
                    key={shelter.id}
                    className={`hover:bg-gray-50 ${
                      allowSelection ? 'cursor-pointer' : ''
                    } ${selectedShelterId === shelter.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleShelterClick(shelter)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-lg"
                        title={status.tooltip}
                      >
                        {status.icon}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{shelter.name}</div>
                      <div className="text-sm text-gray-500">
                        {shelter.operatingSchedule.availability}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {shelter.type.replace('_', ' ')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{shelter.capacity.total} total</div>
                      {shelter.capacity.wheelchair_accessible && (
                        <div className="text-xs text-gray-500">
                          {shelter.capacity.wheelchair_accessible} accessible
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {shelter.currentUtilization.occupied}/{shelter.capacity.total}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            getUtilizationColor(shelter.currentUtilization.utilizationRate)
                          }`}>
                            {Math.round(shelter.currentUtilization.utilizationRate * 100)}%
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {shelter.demographics.acceptedPopulations.slice(0, 2).map(pop => (
                          <div key={pop} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                            {pop.replace('-', ' ')}
                          </div>
                        ))}
                        {shelter.demographics.acceptedPopulations.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{shelter.demographics.acceptedPopulations.length - 2} more
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{shelter.address.street}</div>
                      <div className="text-xs text-gray-500">
                        {shelter.address.city}, {shelter.address.state}
                      </div>
                      {shelter.spatialData?.district && (
                        <div className="text-xs text-blue-600">
                          {shelter.spatialData.district}
                        </div>
                      )}
                    </td>
                    
                    {userRole === 'manager' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shelter.contactInfo?.phone && (
                          <div className="text-xs">{shelter.contactInfo.phone}</div>
                        )}
                        {shelter.contactInfo?.email && (
                          <div className="text-xs text-blue-600">
                            {shelter.contactInfo.email}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {shelters.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-lg font-medium">No shelters found</div>
            <div className="text-sm">Try adjusting your search or filters</div>
          </div>
        )}
      </div>
    </div>
  );
};