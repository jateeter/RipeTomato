/**
 * Facilities Map Component
 * 
 * Interactive map displaying HMIS facilities with detailed information
 * and filtering capabilities for the Services Manager dashboard.
 * 
 * @license MIT
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HMISFacility, HMISMapBounds, HMISQueryOptions, hmisAPIService } from '../services/hmisAPIService';

interface FacilitiesMapProps {
  height?: string;
  showFilters?: boolean;
  defaultBounds?: HMISMapBounds;
  onFacilitySelect?: (facility: HMISFacility) => void;
}

interface MapFilters {
  facilityTypes: string[];
  searchTerm: string;
  showAvailableOnly: boolean;
}

export const FacilitiesMap: React.FC<FacilitiesMapProps> = ({
  height = '500px',
  showFilters = true,
  defaultBounds,
  onFacilitySelect
}) => {
  const [facilities, setFacilities] = useState<HMISFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<HMISFacility | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 45.515, lng: -122.655 }); // Portland center
  const [mapZoom, setMapZoom] = useState(12);
  
  const [filters, setFilters] = useState<MapFilters>({
    facilityTypes: [],
    searchTerm: '',
    showAvailableOnly: false
  });

  const facilityTypeOptions = [
    { value: 'shelter', label: 'Shelters', color: '#dc3545' },
    { value: 'recovery_center', label: 'Recovery Centers', color: '#28a745' },
    { value: 'health_service', label: 'Health Services', color: '#007bff' },
    { value: 'community_support', label: 'Community Support', color: '#ffc107' }
  ];

  useEffect(() => {
    loadFacilities();
  }, [filters]);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const queryOptions: HMISQueryOptions = {
        includeCoordinates: true,
        limit: 100
      };

      if (filters.facilityTypes.length > 0) {
        queryOptions.facilityTypes = filters.facilityTypes;
      }

      if (filters.searchTerm) {
        queryOptions.searchTerm = filters.searchTerm;
      }

      if (defaultBounds) {
        queryOptions.bounds = defaultBounds;
      }

      const facilityData = await hmisAPIService.getAllFacilities(queryOptions);
      
      let filteredData = facilityData;
      if (filters.showAvailableOnly) {
        filteredData = facilityData.filter(f => (f.availableBeds || 0) > 0);
      }

      setFacilities(filteredData);
      console.log(`📍 Loaded ${filteredData.length} facilities for map display`);
    } catch (error) {
      console.error('Failed to load facilities for map:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityClick = useCallback((facility: HMISFacility) => {
    setSelectedFacility(facility);
    setShowDetails(true);
    if (onFacilitySelect) {
      onFacilitySelect(facility);
    }
  }, [onFacilitySelect]);

  const handleFilterChange = (filterType: keyof MapFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleFacilityType = (facilityType: string) => {
    setFilters(prev => ({
      ...prev,
      facilityTypes: prev.facilityTypes.includes(facilityType)
        ? prev.facilityTypes.filter(t => t !== facilityType)
        : [...prev.facilityTypes, facilityType]
    }));
  };

  const getFacilityMarkerColor = (facility: HMISFacility): string => {
    const typeOption = facilityTypeOptions.find(opt => opt.value === facility.type);
    return typeOption?.color || '#6c757d';
  };

  const renderFacilityMarker = (facility: HMISFacility) => (
    <div
      key={facility.id}
      className="facility-marker"
      style={{
        position: 'absolute',
        left: `${((facility.coordinates!.lng + 122.8) / 0.4) * 100}%`,
        top: `${((45.6 - facility.coordinates!.lat) / 0.2) * 100}%`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: selectedFacility?.id === facility.id ? 1000 : 100
      }}
      onClick={() => handleFacilityClick(facility)}
    >
      <div
        className="marker-icon"
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: getFacilityMarkerColor(facility),
          border: selectedFacility?.id === facility.id ? '3px solid #fff' : '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
          {facility.type === 'shelter' ? '🏠' :
           facility.type === 'recovery_center' ? '🏥' :
           facility.type === 'health_service' ? '⚕️' : '🏢'}
        </span>
      </div>
      
      {selectedFacility?.id === facility.id && (
        <div
          className="marker-popup"
          style={{
            position: 'absolute',
            top: '-10px',
            left: '30px',
            minWidth: '200px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1001
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{facility.title}</div>
          <div style={{ color: '#666' }}>{facility.address}</div>
          {facility.capacity && (
            <div style={{ marginTop: '4px' }}>
              Beds: {facility.availableBeds || 0}/{facility.capacity}
            </div>
          )}
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#888' }}>
            Click for details
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="facilities-map-container">
      {showFilters && (
        <div className="map-filters" style={{ 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: '8px' }}>Filters:</span>
            {facilityTypeOptions.map(option => (
              <label key={option.value} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: filters.facilityTypes.includes(option.value) ? option.color : 'transparent',
                color: filters.facilityTypes.includes(option.value) ? 'white' : 'black',
                fontSize: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={filters.facilityTypes.includes(option.value)}
                  onChange={() => toggleFacilityType(option.value)}
                  style={{ margin: 0 }}
                />
                {option.label}
              </label>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search facilities..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              style={{
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px',
                width: '150px'
              }}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={filters.showAvailableOnly}
                onChange={(e) => handleFilterChange('showAvailableOnly', e.target.checked)}
              />
              Available beds only
            </label>
          </div>
          
          <div style={{ fontSize: '12px', color: '#666' }}>
            Showing {facilities.length} facilities
          </div>
        </div>
      )}

      <div 
        className="map-display"
        style={{ 
          height,
          position: 'relative',
          backgroundColor: '#e8f4f8',
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15), transparent),
            radial-gradient(circle at 40% 40%, rgba(120, 198, 120, 0.1), transparent)
          `,
          border: '1px solid #ddd',
          overflow: 'hidden',
          cursor: loading ? 'wait' : 'grab'
        }}
        onClick={() => setSelectedFacility(null)}
      >
        {loading ? (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>🔄</div>
            <div>Loading facilities...</div>
          </div>
        ) : (
          <>
            {/* Map grid overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              opacity: 0.3
            }} />

            {/* Portland area outline */}
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '15%',
              right: '15%',
              bottom: '10%',
              border: '2px dashed #007bff',
              borderRadius: '20px',
              opacity: 0.5
            }}>
              <div style={{
                position: 'absolute',
                top: '-25px',
                left: '10px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#007bff',
                backgroundColor: 'white',
                padding: '2px 8px'
              }}>
                Portland Metro Area
              </div>
            </div>

            {/* Facility markers */}
            {facilities.map(facility => facility.coordinates && renderFacilityMarker(facility))}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend" style={{
        display: 'flex',
        gap: '16px',
        padding: '12px 16px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        fontSize: '12px'
      }}>
        <span style={{ fontWeight: 'bold' }}>Legend:</span>
        {facilityTypeOptions.map(option => (
          <div key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: option.color,
              border: '1px solid #fff'
            }} />
            {option.label}
          </div>
        ))}
      </div>

      {/* Facility Details Modal */}
      {showDetails && selectedFacility && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: getFacilityMarkerColor(selectedFacility) }}>
                {selectedFacility.title}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: getFacilityMarkerColor(selectedFacility),
                color: 'white',
                fontSize: '12px',
                marginBottom: '8px'
              }}>
                {selectedFacility.type.replace('_', ' ').toUpperCase()}
              </div>
            </div>

            {selectedFacility.description && (
              <p style={{ marginBottom: '16px', color: '#666' }}>
                {selectedFacility.description}
              </p>
            )}

            {selectedFacility.address && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Address:</strong> {selectedFacility.address}
              </div>
            )}

            {selectedFacility.capacity && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Capacity:</strong> {selectedFacility.availableBeds || 0} available / {selectedFacility.capacity} total beds
                <div style={{
                  marginTop: '4px',
                  height: '8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${((selectedFacility.capacity - (selectedFacility.availableBeds || 0)) / selectedFacility.capacity) * 100}%`,
                    backgroundColor: (selectedFacility.availableBeds || 0) > 0 ? '#28a745' : '#dc3545',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            )}

            {selectedFacility.operatingHours && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Hours:</strong> {selectedFacility.operatingHours.availability === '24/7' 
                  ? '24/7 Operation' 
                  : `${selectedFacility.operatingHours.open} - ${selectedFacility.operatingHours.close}`}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <strong>Services:</strong>
              <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {selectedFacility.services.map((service, index) => (
                  <span key={index} style={{
                    fontSize: '12px',
                    padding: '2px 6px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6'
                  }}>
                    {service}
                  </span>
                ))}
              </div>
            </div>

            {selectedFacility.accessibility && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Accessibility:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>
                  {selectedFacility.accessibility.wheelchairAccessible && (
                    <span style={{ color: '#28a745', marginRight: '12px' }}>♿ Wheelchair Accessible</span>
                  )}
                  {selectedFacility.accessibility.ada && (
                    <span style={{ color: '#28a745', marginRight: '12px' }}>✓ ADA Compliant</span>
                  )}
                  {selectedFacility.accessibility.publicTransit && (
                    <span style={{ color: '#28a745' }}>🚌 Public Transit</span>
                  )}
                </div>
              </div>
            )}

            {selectedFacility.contactInfo && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong>Contact Information:</strong>
                {selectedFacility.contactInfo.phone && (
                  <div style={{ marginTop: '4px' }}>📞 {selectedFacility.contactInfo.phone}</div>
                )}
                {selectedFacility.contactInfo.website && (
                  <div style={{ marginTop: '4px' }}>🌐 {selectedFacility.contactInfo.website}</div>
                )}
              </div>
            )}

            <div style={{ 
              marginTop: '16px', 
              textAlign: 'right',
              fontSize: '12px',
              color: '#666'
            }}>
              Last updated: {selectedFacility.lastUpdated.toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};