/**
 * Weather Forecast Widget Component
 * 
 * Displays 10-day weather forecast from NOAA API with hourly updates
 * for community services planning and operations.
 */

import React, { useState, useEffect } from 'react';
import { weatherService, WeatherServiceState, WeatherForecast } from '../services/weatherService';

interface WeatherForecastWidgetProps {
  className?: string;
  days?: number;
  compact?: boolean;
  showDetails?: boolean;
}

export const WeatherForecastWidget: React.FC<WeatherForecastWidgetProps> = ({
  className = '',
  days = 10,
  compact = false,
  showDetails = false
}) => {
  const [weatherState, setWeatherState] = useState<WeatherServiceState>(weatherService.getState());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = weatherService.subscribe(setWeatherState);
    return unsubscribe;
  }, []);

  const getWeatherIcon = (forecast: string, isDaytime: boolean): string => {
    const condition = forecast.toLowerCase();
    
    if (condition.includes('clear') || condition.includes('sunny')) {
      return isDaytime ? '☀️' : '🌙';
    }
    if (condition.includes('partly cloudy') || condition.includes('partly sunny')) {
      return isDaytime ? '⛅' : '🌙';
    }
    if (condition.includes('cloudy') || condition.includes('overcast')) {
      return '☁️';
    }
    if (condition.includes('rain') || condition.includes('shower')) {
      return '🌧️';
    }
    if (condition.includes('snow')) {
      return '❄️';
    }
    if (condition.includes('storm') || condition.includes('thunder')) {
      return '⛈️';
    }
    if (condition.includes('fog') || condition.includes('mist')) {
      return '🌫️';
    }
    return isDaytime ? '🌤️' : '🌙';
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp >= 90) return 'text-red-600';
    if (temp >= 80) return 'text-orange-500';
    if (temp >= 70) return 'text-yellow-600';
    if (temp >= 60) return 'text-green-600';
    if (temp >= 50) return 'text-blue-500';
    if (temp >= 32) return 'text-blue-600';
    return 'text-purple-600';
  };

  const formatDate = (periodName: string): { day: string; date: string } => {
    // NOAA periods are like "Today", "Tonight", "Monday", "Monday Night", etc.
    const dayMatch = periodName.match(/^(Today|Tonight|This\s+Afternoon|This\s+Evening|(\w+)(\s+Night)?)/i);
    const day = dayMatch ? dayMatch[0] : periodName;
    
    // For forecast display, we'll use the period name as is
    if (periodName.toLowerCase().includes('today')) {
      return { day: 'Today', date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) };
    }
    if (periodName.toLowerCase().includes('tonight')) {
      return { day: 'Tonight', date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }) };
    }
    
    // For other days, try to extract the day name
    const dayName = day.replace(/\s+Night/i, '');
    const today = new Date();
    const targetDate = new Date(today);
    
    // Simple day name to date offset mapping
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = today.getDay();
    const targetDayIndex = dayNames.findIndex(d => d === dayName.toLowerCase());
    
    if (targetDayIndex !== -1) {
      let dayOffset = targetDayIndex - currentDay;
      if (dayOffset <= 0) dayOffset += 7; // Next week
      targetDate.setDate(today.getDate() + dayOffset);
    }
    
    return {
      day: dayName,
      date: targetDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    };
  };

  const groupForecastByDays = (forecast: WeatherForecast[]): Array<{
    date: string;
    day: string;
    dayForecast: WeatherForecast | null;
    nightForecast: WeatherForecast | null;
  }> => {
    const grouped: { [key: string]: any } = {};
    
    forecast.slice(0, days * 2).forEach((period) => {
      const { day, date } = formatDate(period.period_name);
      const baseDay = day.replace(/\s+Night/i, '');
      const isNight = period.period_name.toLowerCase().includes('night') || 
                     period.period_name.toLowerCase().includes('tonight');
      
      if (!grouped[baseDay]) {
        grouped[baseDay] = {
          date,
          day: baseDay,
          dayForecast: null,
          nightForecast: null
        };
      }
      
      if (isNight) {
        grouped[baseDay].nightForecast = period;
      } else {
        grouped[baseDay].dayForecast = period;
      }
    });
    
    return Object.values(grouped).slice(0, days);
  };

  const { forecast, lastUpdated, isConnected } = weatherState;
  
  if (!forecast || forecast.length === 0) {
    return (
      <div className={`weather-forecast-widget ${className} p-4 bg-gray-100 rounded-lg`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading forecast...</span>
        </div>
      </div>
    );
  }

  const groupedForecast = groupForecastByDays(forecast);

  if (compact) {
    return (
      <div className={`weather-forecast-widget ${className} p-3 bg-white rounded-lg shadow-sm border`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">10-Day Forecast</h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {groupedForecast.slice(0, 5).map((day, index) => {
            const mainForecast = day.dayForecast || day.nightForecast;
            if (!mainForecast) return null;
            
            return (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-600 truncate">{day.day}</div>
                <div className="text-lg my-1">{getWeatherIcon(mainForecast.short_forecast, mainForecast.is_daytime)}</div>
                <div className={`text-xs font-medium ${getTemperatureColor(mainForecast.temperature)}`}>
                  {mainForecast.temperature}°
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-forecast-widget ${className} p-4 bg-white rounded-lg shadow-md border`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">10-Day Weather Forecast</h3>
          <p className="text-sm text-gray-600">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Loading...'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>

      {/* Forecast Grid */}
      <div className="space-y-2">
        {groupedForecast.map((day, index) => {
          const mainForecast = day.dayForecast || day.nightForecast;
          if (!mainForecast) return null;
          
          const isSelected = selectedDay === index;
          
          return (
            <div key={index}>
              <div 
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all
                  ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                `}
                onClick={() => setSelectedDay(isSelected ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getWeatherIcon(mainForecast.short_forecast, mainForecast.is_daytime)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{day.day}</div>
                      <div className="text-sm text-gray-600">{day.date}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xl font-semibold ${getTemperatureColor(mainForecast.temperature)}`}>
                      {mainForecast.temperature}°{mainForecast.temperature_unit}
                    </div>
                    <div className="text-sm text-gray-600">{mainForecast.short_forecast}</div>
                  </div>
                  
                  <div className="text-gray-400">
                    {isSelected ? '▲' : '▼'}
                  </div>
                </div>
              </div>
              
              {/* Detailed View */}
              {isSelected && showDetails && (
                <div className="mt-2 p-3 bg-white border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Day Forecast */}
                    {day.dayForecast && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-lg mr-2">
                            {getWeatherIcon(day.dayForecast.short_forecast, true)}
                          </span>
                          Day
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span className={getTemperatureColor(day.dayForecast.temperature)}>
                              {day.dayForecast.temperature}°{day.dayForecast.temperature_unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wind:</span>
                            <span>{day.dayForecast.wind_speed} {day.dayForecast.wind_direction}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-700">{day.dayForecast.detailed_forecast}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Night Forecast */}
                    {day.nightForecast && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-lg mr-2">
                            {getWeatherIcon(day.nightForecast.short_forecast, false)}
                          </span>
                          Night
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Temperature:</span>
                            <span className={getTemperatureColor(day.nightForecast.temperature)}>
                              {day.nightForecast.temperature}°{day.nightForecast.temperature_unit}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wind:</span>
                            <span>{day.nightForecast.wind_speed} {day.nightForecast.wind_direction}</span>
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-700">{day.nightForecast.detailed_forecast}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Refresh Button */}
      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Data from NOAA Weather Service
        </span>
        <button 
          onClick={() => weatherService.refreshWeatherData()}
          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};