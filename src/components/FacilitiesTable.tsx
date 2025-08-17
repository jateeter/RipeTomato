/**
 * Facilities Table Component
 * 
 * Comprehensive tabular view of HMIS facilities with sorting, filtering,
 * export capabilities, and detailed facility information.
 * 
 * @license MIT
 */

import React, { useState, useEffect, useMemo } from 'react';
import { HMISOpenCommonsFacility } from '../services/hmisOpenCommonsService';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (facility: HMISOpenCommonsFacility) => React.ReactNode;
}

interface FacilitiesTableProps {
  facilities: HMISOpenCommonsFacility[];
  onFacilitySelect?: (facility: HMISOpenCommonsFacility) => void;
  onFacilityAction?: (facility: HMISOpenCommonsFacility, action: string) => void;
  selectedFacility?: HMISOpenCommonsFacility | null;
  showActions?: boolean;
  showExport?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  maxHeight?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface FilterConfig {
  search: string;
  type: string;
  state: string;
  availability: 'all' | 'available' | 'full';
  services: string[];
}

const DEFAULT_COLUMNS: Column[] = [
  {
    key: 'name',
    label: 'Facility Name',
    sortable: true,
    filterable: true,
    width: '250px',
    render: (facility) => (
      <div>
        <div className="font-medium text-gray-900">{facility.name}</div>
        <div className="text-sm text-gray-500">{facility.type}</div>
      </div>
    )
  },
  {
    key: 'address.city',
    label: 'Location',
    sortable: true,
    filterable: true,
    width: '180px',
    render: (facility) => (
      <div>
        <div className="text-sm text-gray-900">{facility.address.city}, {facility.address.state}</div>
        <div className="text-xs text-gray-500">{facility.address.zipCode}</div>
      </div>
    )
  },
  {
    key: 'capacity.available',
    label: 'Availability',
    sortable: true,
    width: '120px',
    render: (facility) => {
      const available = facility.capacity.available || 0;
      const total = facility.capacity.total || 0;
      const occupied = facility.capacity.occupied || 0;
      
      let statusColor = 'text-gray-500';
      let bgColor = 'bg-gray-50';
      
      if (available > 10) {
        statusColor = 'text-green-700';
        bgColor = 'bg-green-50';
      } else if (available > 0) {
        statusColor = 'text-yellow-700';
        bgColor = 'bg-yellow-50';
      } else {
        statusColor = 'text-red-700';
        bgColor = 'bg-red-50';
      }
      
      return (
        <div className={`px-2 py-1 rounded-md ${bgColor}`}>
          <div className={`font-medium ${statusColor}`}>{available} available</div>
          {total > 0 && (
            <div className="text-xs text-gray-500">{occupied}/{total} occupied</div>
          )}
        </div>
      );
    }
  },
  {
    key: 'services',
    label: 'Services',
    width: '200px',
    render: (facility) => (
      <div>
        {facility.services.slice(0, 2).map((service, index) => (
          <span
            key={index}
            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1"
          >
            {service}
          </span>
        ))}
        {facility.services.length > 2 && (
          <span className="text-xs text-gray-500">
            +{facility.services.length - 2} more
          </span>
        )}
      </div>
    )
  },
  {
    key: 'contact.phone',
    label: 'Contact',
    width: '150px',
    render: (facility) => (
      <div className="space-y-1">
        {facility.contact.phone && (
          <div>
            <a
              href={`tel:${facility.contact.phone}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {facility.contact.phone}
            </a>
          </div>
        )}
        {facility.contact.website && (
          <div>
            <a
              href={facility.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              Website
            </a>
          </div>
        )}
      </div>
    )
  }
];

export const FacilitiesTable: React.FC<FacilitiesTableProps> = ({
  facilities,
  onFacilitySelect,
  onFacilityAction,
  selectedFacility,
  showActions = true,
  showExport = true,
  showFilters = true,
  showPagination = true,
  pageSize = 25,
  maxHeight = '600px',
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    search: '',
    type: '',
    state: '',
    availability: 'all',
    services: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Helper function to get nested values from objects
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Get unique values for filter dropdowns
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(facilities.map(f => f.type))).sort();
  }, [facilities]);

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(facilities.map(f => f.address.state).filter(Boolean))).sort();
  }, [facilities]);

  const uniqueServices = useMemo(() => {
    const services = new Set<string>();
    facilities.forEach(f => f.services.forEach(service => services.add(service)));
    return Array.from(services).sort();
  }, [facilities]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter(facility => {
      // Search filter
      if (filterConfig.search) {
        const query = filterConfig.search.toLowerCase();
        const matchesSearch = 
          facility.name.toLowerCase().includes(query) ||
          facility.type.toLowerCase().includes(query) ||
          facility.address.city?.toLowerCase().includes(query) ||
          facility.address.state?.toLowerCase().includes(query) ||
          facility.services.some(service => service.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filterConfig.type && facility.type !== filterConfig.type) {
        return false;
      }

      // State filter
      if (filterConfig.state && facility.address.state !== filterConfig.state) {
        return false;
      }

      // Availability filter
      if (filterConfig.availability !== 'all') {
        const available = facility.capacity.available || 0;
        if (filterConfig.availability === 'available' && available === 0) return false;
        if (filterConfig.availability === 'full' && available > 0) return false;
      }

      // Services filter
      if (filterConfig.services.length > 0) {
        const hasAnyService = filterConfig.services.some(service => 
          facility.services.includes(service)
        );
        if (!hasAnyService) return false;
      }

      return true;
    });
  }, [facilities, filterConfig]);

  // Sort facilities
  const sortedFacilities = useMemo(() => {
    if (!sortConfig.direction) return filteredFacilities;

    return [...filteredFacilities].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredFacilities, sortConfig]);

  // Paginate facilities
  const paginatedFacilities = useMemo(() => {
    if (!showPagination) return sortedFacilities;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedFacilities.slice(startIndex, startIndex + pageSize);
  }, [sortedFacilities, currentPage, pageSize, showPagination]);

  const totalPages = Math.ceil(sortedFacilities.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof FilterConfig, value: any) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRowSelect = (facilityId: string) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(facilityId)) {
        newSelection.delete(facilityId);
      } else {
        newSelection.add(facilityId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedFacilities.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedFacilities.map(f => f.id)));
    }
  };

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = selectedRows.size > 0 
      ? facilities.filter(f => selectedRows.has(f.id))
      : sortedFacilities;

    if (format === 'csv') {
      exportToCSV(dataToExport);
    } else {
      exportToJSON(dataToExport);
    }
  };

  const exportToCSV = (data: HMISOpenCommonsFacility[]) => {
    const headers = [
      'Name', 'Type', 'Street', 'City', 'State', 'Zip', 'Phone', 'Website', 
      'Total Beds', 'Available Beds', 'Occupied Beds', 'Services'
    ];

    const rows = data.map(facility => [
      facility.name,
      facility.type,
      facility.address.street || '',
      facility.address.city || '',
      facility.address.state || '',
      facility.address.zipCode || '',
      facility.contact.phone || '',
      facility.contact.website || '',
      facility.capacity.total || '',
      facility.capacity.available || '',
      facility.capacity.occupied || '',
      facility.services.join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facilities_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = (data: HMISOpenCommonsFacility[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facilities_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
  };

  return (
    <div className={`facilities-table-container ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Facilities
              </label>
              <input
                type="text"
                placeholder="Search by name, location, or services..."
                value={filterConfig.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility Type
              </label>
              <select
                value={filterConfig.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={filterConfig.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All States</option>
                {uniqueStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability
              </label>
              <select
                value={filterConfig.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="full">Full</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {paginatedFacilities.length} of {sortedFacilities.length} facilities
              {sortedFacilities.length !== facilities.length && (
                <span> (filtered from {facilities.length} total)</span>
              )}
            </div>

            {/* Export Options */}
            {showExport && (
              <div className="flex items-center space-x-2">
                {selectedRows.size > 0 && (
                  <span className="text-blue-600">{selectedRows.size} selected</span>
                )}
                <button
                  onClick={() => exportData('csv')}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <div className="overflow-x-auto" style={{ maxHeight }}>
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {/* Select All Checkbox */}
                <th className="px-3 py-3.5 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedFacilities.length && paginatedFacilities.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>

                {DEFAULT_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <span className="text-gray-400">{getSortIcon(column.key)}</span>
                      )}
                    </div>
                  </th>
                ))}

                {showActions && (
                  <th className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedFacilities.map((facility) => (
                <React.Fragment key={facility.id}>
                  <tr 
                    className={`hover:bg-gray-50 ${
                      selectedFacility?.id === facility.id ? 'bg-blue-50' : ''
                    } ${selectedRows.has(facility.id) ? 'bg-gray-50' : ''}`}
                  >
                    {/* Row Checkbox */}
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(facility.id)}
                        onChange={() => handleRowSelect(facility.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {DEFAULT_COLUMNS.map((column) => (
                      <td key={column.key} className="px-3 py-4 text-sm">
                        {column.render ? column.render(facility) : getNestedValue(facility, column.key)}
                      </td>
                    ))}

                    {showActions && (
                      <td className="px-3 py-4 text-sm space-x-2">
                        <button
                          onClick={() => onFacilitySelect?.(facility)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setExpandedRow(expandedRow === facility.id ? null : facility.id)}
                          className="text-gray-600 hover:text-gray-800 text-xs"
                        >
                          {expandedRow === facility.id ? 'Less' : 'More'}
                        </button>
                        <button
                          onClick={() => onFacilityAction?.(facility, 'register')}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Register
                        </button>
                      </td>
                    )}
                  </tr>

                  {/* Expanded Row */}
                  {expandedRow === facility.id && (
                    <tr>
                      <td colSpan={DEFAULT_COLUMNS.length + 2} className="px-3 py-4 bg-gray-50">
                        <div className="text-sm space-y-2">
                          <div>
                            <strong>Description:</strong> {facility.description || 'No description available'}
                          </div>
                          <div>
                            <strong>Full Address:</strong> {facility.address.street}, {facility.address.city}, {facility.address.state} {facility.address.zipCode}
                          </div>
                          <div>
                            <strong>All Services:</strong> {facility.services.join(', ')}
                          </div>
                          {facility.eligibility.populations && (
                            <div>
                              <strong>Populations Served:</strong> {facility.eligibility.populations.join(', ')}
                            </div>
                          )}
                          {facility.operatingSchedule.hoursOfOperation && (
                            <div>
                              <strong>Hours:</strong> {facility.operatingSchedule.hoursOfOperation}
                            </div>
                          )}
                          <div>
                            <strong>Last Updated:</strong> {new Date(facility.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {paginatedFacilities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No facilities found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm border border-gray-300 rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitiesTable;