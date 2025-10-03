/**
 * Weather Alert Indicator Component
 * 
 * Compact indicator showing weather alerts with severity-based styling
 * for dashboard headers and navigation areas.
 */

import React, { useState, useEffect } from 'react';
import { weatherService, WeatherServiceState, WeatherAlert, NOAAAlert } from '../services/weatherService';

interface WeatherAlertIndicatorProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  showTooltip?: boolean;
  maxDisplayed?: number;
  onClick?: () => void;
}

export const WeatherAlertIndicator: React.FC<WeatherAlertIndicatorProps> = ({
  className = '',
  position = 'inline',
  showTooltip = true,
  maxDisplayed = 3,
  onClick
}) => {
  const [weatherState, setWeatherState] = useState<WeatherServiceState>(weatherService.getState());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = weatherService.subscribe(setWeatherState);
    return unsubscribe;
  }, []);

  const allAlerts = [...weatherState.alerts, ...weatherState.noaaAlerts];
  const alertCounts = weatherService.getAlertCounts();

  if (allAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (alert: WeatherAlert | NOAAAlert): string => {
    if ('event' in alert) {
      // NOAA Alert
      const event = alert.event.toLowerCase();
      if (event.includes('tornado')) return '🌪️';
      if (event.includes('hurricane') || event.includes('tropical')) return '🌀';
      if (event.includes('flood')) return '🌊';
      if (event.includes('fire')) return '🔥';
      if (event.includes('ice') || event.includes('winter')) return '🧊';
      if (event.includes('heat')) return '🔥';
      if (event.includes('wind')) return '💨';
      if (event.includes('snow')) return '❄️';
      if (event.includes('thunderstorm')) return '⛈️';
      return '⚠️';
    } else {
      // Local Weather Alert
      const type = alert.alert_type.toLowerCase();
      if (type.includes('temperature')) return alert.message.includes('heat') ? '🔥' : '🧊';
      if (type.includes('precipitation')) return '🌧️';
      if (type.includes('wind')) return '💨';
      if (type.includes('visibility')) return '🌫️';
      return '⚠️';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'extreme': return 'bg-red-600 border-red-700';
      case 'high': return 'bg-orange-500 border-orange-600';
      case 'medium': return 'bg-yellow-500 border-yellow-600';
      case 'low': return 'bg-blue-500 border-blue-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getSeverityTextColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'medium': return 'text-black';
      default: return 'text-white';
    }
  };

  const getPositionClasses = (): string => {
    if (position === 'inline') return '';
    
    const baseClasses = 'absolute z-50';
    switch (position) {
      case 'top-right': return `${baseClasses} top-2 right-2`;
      case 'top-left': return `${baseClasses} top-2 left-2`;
      case 'bottom-right': return `${baseClasses} bottom-2 right-2`;
      case 'bottom-left': return `${baseClasses} bottom-2 left-2`;
      default: return baseClasses;
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowDetails(!showDetails);
    }
  };

  const getAlertMessage = (alert: WeatherAlert | NOAAAlert): string => {
    return 'event' in alert ? alert.headline : alert.message;
  };

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  // Sort alerts by severity
  const sortedAlerts = allAlerts.sort((a, b) => {
    const severityOrder = { extreme: 4, high: 3, medium: 2, low: 1 };
    const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0;
    const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0;
    return bSeverity - aSeverity;
  });

  const topAlert = sortedAlerts[0];

  return (
    <div className={`weather-alert-indicator ${getPositionClasses()} ${className}`}>
      {/* Alert Badge */}
      <div 
        className={`
          relative inline-flex items-center px-2 py-1 rounded-md border cursor-pointer
          ${getSeverityColor(topAlert.severity)} ${getSeverityTextColor(topAlert.severity)}
          hover:opacity-90 transition-opacity
        `}
        onClick={handleClick}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
      >
        <span className="text-sm mr-1">{getAlertIcon(topAlert)}</span>
        <span className="text-xs font-medium">
          {alertCounts.total === 1 ? '1 Alert' : `${alertCounts.total} Alerts`}
        </span>
        
        {/* Pulse animation for extreme alerts */}
        {alertCounts.extreme > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Alert Details Tooltip/Modal */}
      {showDetails && (
        <div className={`
          absolute mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50
          ${position.includes('right') ? 'right-0' : 'left-0'}
          ${position.includes('top') ? 'top-full' : 'bottom-full mb-2'}
        `}>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Active Weather Alerts</h3>
              <span className="text-xs text-gray-500">
                {weatherState.lastUpdated ? formatTime(weatherState.lastUpdated.toISOString()) : 'Unknown'}
              </span>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sortedAlerts.slice(0, maxDisplayed).map((alert, index) => (
                <div 
                  key={alert.alert_id || index}
                  className={`p-2 rounded border-l-4 ${getSeverityColor(alert.severity).replace('bg-', 'border-l-')}`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-lg mt-0.5">{getAlertIcon(alert)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`
                          inline-flex px-2 py-0.5 rounded text-xs font-medium
                          ${getSeverityColor(alert.severity)} ${getSeverityTextColor(alert.severity)}
                        `}>
                          {alert.severity.toUpperCase()}
                        </span>
                        {'expires_time' in alert && alert.expires_time && (
                          <span className="text-xs text-gray-500">
                            Until {formatTime(alert.expires_time)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 mt-1 line-clamp-2">
                        {getAlertMessage(alert)}
                      </p>
                      
                      {/* Service Impacts */}
                      {'affected_services' in alert && alert.affected_services.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-600">
                            Affects: {alert.affected_services.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {sortedAlerts.length > maxDisplayed && (
                <div className="text-center py-2 border-t">
                  <span className="text-xs text-gray-500">
                    +{sortedAlerts.length - maxDisplayed} more alerts
                  </span>
                </div>
              )}
            </div>
            
            {/* Service Impact Summary */}
            {(() => {
              const impacts = weatherService.getServiceImpacts();
              const hasImpacts = impacts.shelter || impacts.transportation || impacts.outdoor;
              
              if (!hasImpacts) return null;
              
              return (
                <div className="mt-3 pt-2 border-t">
                  <p className="text-xs font-medium text-gray-900 mb-1">Service Impacts:</p>
                  <div className="flex flex-wrap gap-1">
                    {impacts.shelter && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        🏠 Shelter
                      </span>
                    )}
                    {impacts.transportation && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                        🚌 Transport
                      </span>
                    )}
                    {impacts.outdoor && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                        🌳 Outdoor
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};