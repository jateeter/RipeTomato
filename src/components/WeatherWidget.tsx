/**
 * Weather Widget Component
 * 
 * Displays current weather conditions with alert indicators
 * for integration into all dashboard views.
 */

import React, { useState, useEffect } from 'react';
import { weatherService, WeatherServiceState } from '../services/weatherService';

interface WeatherWidgetProps {
  className?: string;
  compact?: boolean;
  showAlerts?: boolean;
  showLocation?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  className = '',
  compact = false,
  showAlerts = true,
  showLocation = true
}) => {
  const [weatherState, setWeatherState] = useState<WeatherServiceState>(weatherService.getState());

  useEffect(() => {
    const unsubscribe = weatherService.subscribe(setWeatherState);
    return unsubscribe;
  }, []);

  const getWeatherIcon = (conditions: string): string => {
    const condition = conditions.toLowerCase();
    if (condition.includes('clear') || condition.includes('sunny')) return '☀️';
    if (condition.includes('cloud')) return '☁️';
    if (condition.includes('rain') || condition.includes('shower')) return '🌧️';
    if (condition.includes('snow')) return '❄️';
    if (condition.includes('storm') || condition.includes('thunder')) return '⛈️';
    if (condition.includes('fog') || condition.includes('mist')) return '🌫️';
    if (condition.includes('wind')) return '💨';
    return '🌤️';
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp >= 90) return 'text-red-600';
    if (temp >= 80) return 'text-orange-500';
    if (temp >= 70) return 'text-yellow-500';
    if (temp >= 60) return 'text-green-500';
    if (temp >= 50) return 'text-blue-500';
    if (temp >= 32) return 'text-blue-600';
    return 'text-purple-600';
  };

  const getAlertSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'extreme': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!weatherState.currentWeather) {
    return (
      <div className={`weather-widget ${className} ${compact ? 'p-2' : 'p-4'} bg-gray-100 rounded-lg`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading weather...</span>
        </div>
      </div>
    );
  }

  const { currentWeather, alerts, noaaAlerts, isConnected, location, lastUpdated } = weatherState;
  const allAlerts = [...alerts, ...noaaAlerts];
  const alertCounts = weatherService.getAlertCounts();

  if (compact) {
    return (
      <div className={`weather-widget ${className} p-2 bg-white rounded-lg shadow-sm border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getWeatherIcon(currentWeather.conditions)}</span>
            <div>
              <div className={`text-lg font-semibold ${getTemperatureColor(currentWeather.temperature_f)}`}>
                {Math.round(currentWeather.temperature_f)}°F
              </div>
              {showLocation && (
                <div className="text-xs text-gray-500">{location}</div>
              )}
            </div>
          </div>
          
          {showAlerts && alertCounts.total > 0 && (
            <div className="flex items-center space-x-1">
              {alertCounts.extreme > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                  {alertCounts.extreme}
                </span>
              )}
              {alertCounts.high > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                  {alertCounts.high}
                </span>
              )}
              {alertCounts.total > alertCounts.extreme + alertCounts.high && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                  {alertCounts.total - alertCounts.extreme - alertCounts.high}
                </span>
              )}
            </div>
          )}
          
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-widget ${className} p-4 bg-white rounded-lg shadow-md border`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{getWeatherIcon(currentWeather.conditions)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Weather</h3>
            {showLocation && (
              <p className="text-sm text-gray-600">{location}</p>
            )}
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      {/* Main Weather Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className={`text-3xl font-bold ${getTemperatureColor(currentWeather.temperature_f)}`}>
            {Math.round(currentWeather.temperature_f)}°F
          </div>
          <div className="text-sm text-gray-600">{currentWeather.conditions}</div>
        </div>
        <div className="space-y-1 text-sm">
          <div>Humidity: {Math.round(currentWeather.humidity_percent)}%</div>
          <div>Wind: {Math.round(currentWeather.wind_speed_mph)} mph {currentWeather.wind_direction}</div>
          <div>Visibility: {currentWeather.visibility_miles} mi</div>
        </div>
      </div>

      {/* Weather Alerts */}
      {showAlerts && allAlerts.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Active Alerts</h4>
          <div className="space-y-1">
            {allAlerts.slice(0, 3).map((alert, index) => (
              <div
                key={alert.alert_id || index}
                className={`px-2 py-1 rounded text-xs ${getAlertSeverityColor(alert.severity)}`}
              >
                {'event' in alert ? alert.headline : alert.message}
              </div>
            ))}
            {allAlerts.length > 3 && (
              <div className="text-xs text-gray-500">
                +{allAlerts.length - 3} more alerts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 border-t pt-2">
        <div>
          <div>Pressure</div>
          <div className="font-medium">{Math.round(currentWeather.pressure_mb)} mb</div>
        </div>
        <div>
          <div>UV Index</div>
          <div className="font-medium">{currentWeather.uv_index}</div>
        </div>
        <div>
          <div>Updated</div>
          <div className="font-medium">{formatLastUpdated(lastUpdated)}</div>
        </div>
      </div>
    </div>
  );
};