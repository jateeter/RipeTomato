/**
 * Enhanced OpenStreetMap Component
 * 
 * Interactive map component with satellite layers, facility markers,
 * and comprehensive facility information display.
 * 
 * @license MIT
 */

import React, { useState, useEffect, useRef } from 'react';
import { HMISOpenCommonsFacility } from '../services/hmisOpenCommonsService';

// Mock Leaflet types for development (in production, you'd install @types/leaflet)
declare global {
  interface Window {
    L: any;
  }
}

interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  type: 'base' | 'overlay';
  maxZoom?: number;
}

interface EnhancedOpenStreetMapProps {
  facilities: HMISOpenCommonsFacility[];
  onFacilitySelect?: (facility: HMISOpenCommonsFacility) => void;
  onFacilityHover?: (facility: HMISOpenCommonsFacility | null) => void;
  selectedFacility?: HMISOpenCommonsFacility | null;
  showSatellite?: boolean;
  showTraffic?: boolean;
  showTransit?: boolean;
  enableClustering?: boolean;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  showControls?: boolean;
  showSearch?: boolean;
  className?: string;
}

const MAP_LAYERS: MapLayer[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    type: 'base',
    maxZoom: 19
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri, Maxar, Earthstar Geographics',
    type: 'base',
    maxZoom: 19
  },
  {
    id: 'satellite_hybrid',
    name: 'Satellite + Labels',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google',
    type: 'base',
    maxZoom: 20
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    attribution: 'Map tiles by Stamen Design, under CC BY 3.0',
    type: 'base',
    maxZoom: 18
  }
];

export const EnhancedOpenStreetMap: React.FC<EnhancedOpenStreetMapProps> = ({
  facilities,
  onFacilitySelect,
  onFacilityHover,
  selectedFacility,
  showSatellite = true,
  showTraffic = false,
  showTransit = false,
  enableClustering = true,
  height = '500px',
  center = { lat: 45.515, lng: -122.65 }, // Portland, OR
  zoom = 12,
  bounds,
  showControls = true,
  showSearch = true,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const markerClusterRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<string>(showSatellite ? 'satellite' : 'osm');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFacilities, setFilteredFacilities] = useState<HMISOpenCommonsFacility[]>([]);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [hoveredFacility, setHoveredFacility] = useState<HMISOpenCommonsFacility | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, []);

  // Update facilities when they change
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      updateFacilityMarkers();
    }
  }, [facilities, mapLoaded, activeLayer]);

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFacilities(facilities);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = facilities.filter(facility =>
        facility.name.toLowerCase().includes(query) ||
        facility.address.city?.toLowerCase().includes(query) ||
        facility.address.state?.toLowerCase().includes(query) ||
        facility.type.toLowerCase().includes(query) ||
        facility.services.some(service => service.toLowerCase().includes(query))
      );
      setFilteredFacilities(filtered);
    }
  }, [searchQuery, facilities]);

  // Update markers when filtered facilities change
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      updateFacilityMarkers();
    }
  }, [filteredFacilities]);

  const initializeMap = async () => {
    try {
      // Load Leaflet CSS and JS
      await loadLeafletAssets();

      if (!window.L || !mapRef.current) return;

      const L = window.L;

      // Create map instance
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: zoom,
        zoomControl: showControls,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      // Add base layer
      const initialLayer = MAP_LAYERS.find(layer => layer.id === activeLayer);
      if (initialLayer) {
        L.tileLayer(initialLayer.url, {
          attribution: initialLayer.attribution,
          maxZoom: initialLayer.maxZoom,
          subdomains: initialLayer.url.includes('{s}') ? 'abc' : undefined
        }).addTo(map);
      }

      // Initialize marker cluster if enabled
      if (enableClustering && window.L.markerClusterGroup) {
        markerClusterRef.current = L.markerClusterGroup({
          chunkedLoading: true,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          maxClusterRadius: 50,
          iconCreateFunction: createClusterIcon
        });
        map.addLayer(markerClusterRef.current);
      }

      // Add layer control
      if (showControls) {
        addLayerControl(map);
      }

      // Set bounds if provided
      if (bounds) {
        const leafletBounds = L.latLngBounds(
          [bounds.south, bounds.west],
          [bounds.north, bounds.east]
        );
        map.fitBounds(leafletBounds);
      }

      // Add event listeners
      map.on('moveend', () => {
        const bounds = map.getBounds();
        setMapBounds(bounds);
      });

      setMapLoaded(true);
      console.log('🗺️ Enhanced map initialized with satellite layers');

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  };

  const loadLeafletAssets = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve();
        return;
      }

      // Load Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = async () => {
        // Load marker clustering plugin
        if (enableClustering) {
          await loadMarkerClusteringPlugin();
        }
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const loadMarkerClusteringPlugin = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Load clustering CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
      document.head.appendChild(cssLink);

      const cssDefaultLink = document.createElement('link');
      cssDefaultLink.rel = 'stylesheet';
      cssDefaultLink.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
      document.head.appendChild(cssDefaultLink);

      // Load clustering JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const addLayerControl = (map: any) => {
    const L = window.L;
    const baseLayers: { [key: string]: any } = {};

    MAP_LAYERS.filter(layer => layer.type === 'base').forEach(layer => {
      const tileLayer = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        maxZoom: layer.maxZoom,
        subdomains: layer.url.includes('{s}') ? 'abc' : undefined
      });
      baseLayers[layer.name] = tileLayer;
    });

    const overlayLayers: { [key: string]: any } = {};

    // Add traffic layer if enabled
    if (showTraffic) {
      overlayLayers['Traffic'] = L.tileLayer('https://{s}.google.com/vt/lyrs=h@{time}&x={x}&y={y}&z={z}', {
        attribution: '© Google',
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });
    }

    L.control.layers(baseLayers, overlayLayers, {
      position: 'topright',
      collapsed: false
    }).addTo(map);
  };

  const updateFacilityMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (enableClustering && markerClusterRef.current) {
        markerClusterRef.current.removeLayer(marker);
      } else {
        map.removeLayer(marker);
      }
    });
    markersRef.current.clear();

    // Add new markers for filtered facilities
    const facilitiesToShow = searchQuery ? filteredFacilities : facilities;

    facilitiesToShow.forEach(facility => {
      if (facility.address.latitude && facility.address.longitude) {
        const marker = createFacilityMarker(facility);
        markersRef.current.set(facility.id, marker);

        if (enableClustering && markerClusterRef.current) {
          markerClusterRef.current.addLayer(marker);
        } else {
          marker.addTo(map);
        }
      }
    });

    console.log(`🗺️ Updated ${facilitiesToShow.length} facility markers on map`);
  };

  const createFacilityMarker = (facility: HMISOpenCommonsFacility) => {
    const L = window.L;
    
    // Create custom icon based on facility type and availability
    const icon = createFacilityIcon(facility);
    
    const marker = L.marker(
      [facility.address.latitude!, facility.address.longitude!],
      { icon }
    );

    // Add popup
    const popupContent = createPopupContent(facility);
    marker.bindPopup(popupContent, {
      maxWidth: 350,
      className: 'facility-popup'
    });

    // Add event listeners
    marker.on('click', () => {
      onFacilitySelect?.(facility);
    });

    marker.on('mouseover', () => {
      setHoveredFacility(facility);
      onFacilityHover?.(facility);
    });

    marker.on('mouseout', () => {
      setHoveredFacility(null);
      onFacilityHover?.(null);
    });

    // Highlight selected facility
    if (selectedFacility && selectedFacility.id === facility.id) {
      marker.setIcon(createFacilityIcon(facility, true));
    }

    return marker;
  };

  const createFacilityIcon = (facility: HMISOpenCommonsFacility, isSelected = false) => {
    const L = window.L;
    
    // Determine color based on availability
    let color = '#dc3545'; // Red for no availability
    if (facility.capacity.available && facility.capacity.available > 0) {
      if (facility.capacity.available > 10) {
        color = '#28a745'; // Green for good availability
      } else {
        color = '#ffc107'; // Yellow for limited availability
      }
    }

    if (isSelected) {
      color = '#007bff'; // Blue for selected
    }

    // Create icon HTML
    const iconHtml = `
      <div class="facility-marker ${isSelected ? 'selected' : ''}" style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.2);' : ''}
      ">
        🏠
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-facility-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  const createPopupContent = (facility: HMISOpenCommonsFacility): string => {
    const available = facility.capacity.available || 0;
    const total = facility.capacity.total || 0;
    const occupied = facility.capacity.occupied || 0;
    
    return `
      <div class="facility-popup-content" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h3 style="margin: 0 0 12px 0; color: #333; font-size: 16px; font-weight: 600;">
          ${facility.name}
        </h3>
        
        <div style="margin-bottom: 8px;">
          <span style="font-weight: 500; color: #666;">Type:</span> 
          <span style="color: #333;">${facility.type}</span>
        </div>
        
        <div style="margin-bottom: 8px;">
          <span style="font-weight: 500; color: #666;">Address:</span><br>
          <span style="color: #333; font-size: 14px;">
            ${facility.address.street || ''}<br>
            ${facility.address.city || ''}, ${facility.address.state || ''} ${facility.address.zipCode || ''}
          </span>
        </div>
        
        ${total > 0 ? `
        <div style="margin-bottom: 8px;">
          <span style="font-weight: 500; color: #666;">Capacity:</span><br>
          <div style="display: flex; gap: 12px; margin-top: 4px;">
            <span style="color: #28a745; font-weight: 500;">${available} Available</span>
            <span style="color: #dc3545;">${occupied} Occupied</span>
            <span style="color: #666;">${total} Total</span>
          </div>
        </div>
        ` : ''}
        
        ${facility.services.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <span style="font-weight: 500; color: #666;">Services:</span><br>
          <span style="color: #333; font-size: 14px;">
            ${facility.services.slice(0, 3).join(', ')}
            ${facility.services.length > 3 ? ` +${facility.services.length - 3} more` : ''}
          </span>
        </div>
        ` : ''}
        
        ${facility.contact.phone || facility.contact.website ? `
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee;">
          ${facility.contact.phone ? `
            <div style="margin-bottom: 4px;">
              <span style="font-weight: 500; color: #666;">📞</span> 
              <a href="tel:${facility.contact.phone}" style="color: #007bff; text-decoration: none;">
                ${facility.contact.phone}
              </a>
            </div>
          ` : ''}
          ${facility.contact.website ? `
            <div>
              <span style="font-weight: 500; color: #666;">🌐</span> 
              <a href="${facility.contact.website}" target="_blank" style="color: #007bff; text-decoration: none;">
                Website
              </a>
            </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
    `;
  };

  const createClusterIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    let size = 40;
    let className = 'marker-cluster-small';

    if (count > 100) {
      size = 60;
      className = 'marker-cluster-large';
    } else if (count > 10) {
      size = 50;
      className = 'marker-cluster-medium';
    }

    return window.L.divIcon({
      html: `<div style="
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        border-radius: 50%;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${size > 50 ? '16px' : '14px'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">${count}</div>`,
      className: `marker-cluster ${className}`,
      iconSize: [size, size]
    });
  };

  const switchLayer = (layerId: string) => {
    if (!mapInstanceRef.current || !window.L) return;

    const map = mapInstanceRef.current;
    const newLayer = MAP_LAYERS.find(layer => layer.id === layerId);
    
    if (!newLayer) return;

    // Remove all existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof window.L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add new layer
    const tileLayer = window.L.tileLayer(newLayer.url, {
      attribution: newLayer.attribution,
      maxZoom: newLayer.maxZoom,
      subdomains: newLayer.url.includes('{s}') ? 'abc' : undefined
    });
    
    tileLayer.addTo(map);
    setActiveLayer(layerId);
  };

  const zoomToFacilities = () => {
    if (!mapInstanceRef.current || !window.L || facilities.length === 0) return;

    const map = mapInstanceRef.current;
    const L = window.L;
    
    const facilitiesWithCoords = facilities.filter(f => f.address.latitude && f.address.longitude);
    
    if (facilitiesWithCoords.length === 0) return;

    if (facilitiesWithCoords.length === 1) {
      map.setView([facilitiesWithCoords[0].address.latitude!, facilitiesWithCoords[0].address.longitude!], 15);
    } else {
      const group = L.featureGroup(
        facilitiesWithCoords.map(f =>
          L.marker([f.address.latitude!, f.address.longitude!])
        )
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div className={`enhanced-map-container ${className}`} style={{ height }}>
      {/* Map Controls */}
      {showControls && (
        <div className="map-controls absolute top-4 left-4 z-10 space-y-2">
          {/* Layer Switcher */}
          <div className="bg-white rounded-lg shadow-lg p-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Map Layers</div>
            <div className="flex flex-col space-y-1">
              {MAP_LAYERS.filter(layer => layer.type === 'base').map(layer => (
                <button
                  key={layer.id}
                  onClick={() => switchLayer(layer.id)}
                  className={`px-2 py-1 text-xs rounded ${
                    activeLayer === layer.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {layer.name}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom to All Button */}
          <button
            onClick={zoomToFacilities}
            className="bg-white rounded-lg shadow-lg p-2 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            title="Zoom to all facilities"
          >
            🎯 Fit All
          </button>
        </div>
      )}

      {/* Search Box */}
      {showSearch && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white rounded-lg shadow-lg p-3 w-64">
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-600">
                Found {filteredFacilities.length} of {facilities.length} facilities
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hover Info */}
      {hoveredFacility && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm font-medium text-gray-900">{hoveredFacility.name}</div>
          <div className="text-xs text-gray-600 mt-1">
            {hoveredFacility.address.city}, {hoveredFacility.address.state}
          </div>
          {hoveredFacility.capacity.available !== undefined && (
            <div className="text-xs mt-1">
              <span className="text-green-600 font-medium">{hoveredFacility.capacity.available} beds available</span>
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg"
        style={{ background: '#f8f9fa' }}
      />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="text-gray-600">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedOpenStreetMap;