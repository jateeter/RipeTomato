/**
 * Map Debug Info Component
 * Shows debug information about map initialization
 */

import React, { useState, useEffect } from 'react';
import { HMISOpenCommonsFacility } from '../services/hmisOpenCommonsService';

interface MapDebugInfoProps {
  facilities: HMISOpenCommonsFacility[];
  showDebug?: boolean;
}

export const MapDebugInfo: React.FC<MapDebugInfoProps> = ({ 
  facilities, 
  showDebug = false 
}) => {
  const [debugInfo, setDebugInfo] = useState({
    facilitiesCount: 0,
    facilitiesWithCoords: 0,
    leafletLoaded: false,
    errors: [] as string[]
  });

  useEffect(() => {
    const checkMapRequirements = () => {
      const facilitiesWithCoords = facilities.filter(f => 
        f.address?.latitude && f.address?.longitude
      ).length;

      const errors = [];
      
      if (facilities.length === 0) {
        errors.push('No facilities data available');
      }

      if (facilitiesWithCoords === 0) {
        errors.push('No facilities with coordinate data for mapping');
      }

      if (typeof window !== 'undefined' && !window.L) {
        errors.push('Leaflet library not loaded in window object');
      }

      setDebugInfo({
        facilitiesCount: facilities.length,
        facilitiesWithCoords,
        leafletLoaded: typeof window !== 'undefined' && !!window.L,
        errors
      });
    };

    checkMapRequirements();
  }, [facilities]);

  if (!showDebug) {
    return null;
  }

  return (
    <div className="bg-gray-100 border rounded-lg p-4 mb-4 text-sm">
      <h4 className="font-semibold text-gray-700 mb-2">🐛 Map Debug Information</h4>
      
      <div className="space-y-1">
        <div className={`flex items-center ${debugInfo.facilitiesCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
          <span className="mr-2">{debugInfo.facilitiesCount > 0 ? '✅' : '❌'}</span>
          <span>Facilities loaded: {debugInfo.facilitiesCount}</span>
        </div>
        
        <div className={`flex items-center ${debugInfo.facilitiesWithCoords > 0 ? 'text-green-600' : 'text-orange-600'}`}>
          <span className="mr-2">{debugInfo.facilitiesWithCoords > 0 ? '✅' : '⚠️'}</span>
          <span>Facilities with coordinates: {debugInfo.facilitiesWithCoords}</span>
        </div>
        
        <div className={`flex items-center ${debugInfo.leafletLoaded ? 'text-green-600' : 'text-red-600'}`}>
          <span className="mr-2">{debugInfo.leafletLoaded ? '✅' : '❌'}</span>
          <span>Leaflet library: {debugInfo.leafletLoaded ? 'Loaded' : 'Not loaded'}</span>
        </div>
      </div>

      {debugInfo.errors.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <div className="font-medium text-red-700 mb-1">Issues detected:</div>
          <ul className="text-red-600 space-y-1">
            {debugInfo.errors.map((error, index) => (
              <li key={index} className="text-xs">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <div>Sample facility data: {facilities[0] ? facilities[0].name : 'None'}</div>
        <div>Component render time: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default MapDebugInfo;