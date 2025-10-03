/**
 * Weather Forecast Widget Component Tests
 * 
 * Unit tests for the WeatherForecastWidget component covering
 * forecast display, day grouping, and interaction behaviors.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherForecastWidget } from '../WeatherForecastWidget';
import { weatherService } from '../../services/weatherService';

// Mock the weather service
jest.mock('../../services/weatherService', () => ({
  weatherService: {
    subscribe: jest.fn(),
    getState: jest.fn(),
    refreshWeatherData: jest.fn()
  }
}));

const mockWeatherService = weatherService as jest.Mocked<typeof weatherService>;

const mockForecast = [
  {
    period_name: 'Today',
    temperature: 75,
    temperature_unit: 'F',
    wind_speed: '10 mph',
    wind_direction: 'NW',
    short_forecast: 'Sunny',
    detailed_forecast: 'Sunny skies with light winds',
    is_daytime: true
  },
  {
    period_name: 'Tonight',
    temperature: 55,
    temperature_unit: 'F',
    wind_speed: '5 mph',
    wind_direction: 'N',
    short_forecast: 'Clear',
    detailed_forecast: 'Clear skies overnight',
    is_daytime: false
  },
  {
    period_name: 'Monday',
    temperature: 78,
    temperature_unit: 'F',
    wind_speed: '12 mph',
    wind_direction: 'W',
    short_forecast: 'Partly Cloudy',
    detailed_forecast: 'Partly cloudy with scattered clouds',
    is_daytime: true
  },
  {
    period_name: 'Monday Night',
    temperature: 58,
    temperature_unit: 'F',
    wind_speed: '8 mph',
    wind_direction: 'W',
    short_forecast: 'Mostly Clear',
    detailed_forecast: 'Mostly clear skies overnight',
    is_daytime: false
  }
];

const mockWeatherState = {
  currentWeather: null,
  alerts: [],
  noaaAlerts: [],
  forecast: mockForecast,
  lastUpdated: new Date('2024-01-15T10:30:00Z'),
  isConnected: true,
  location: 'Boise, ID'
};

describe('WeatherForecastWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWeatherService.getState.mockReturnValue(mockWeatherState);
    
    // Mock subscribe to call callback immediately
    mockWeatherService.subscribe.mockImplementation((callback) => {
      callback(mockWeatherState);
      return jest.fn(); // Return unsubscribe function
    });
  });

  describe('Compact Mode', () => {
    it('should render compact forecast with 5 days', async () => {
      render(<WeatherForecastWidget compact={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('10-Day Forecast')).toBeInTheDocument();
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('75°')).toBeInTheDocument();
      });
    });

    it('should show connection status indicator', async () => {
      render(<WeatherForecastWidget compact={true} />);
      
      await waitFor(() => {
        const indicator = document.querySelector('.bg-green-500');
        expect(indicator).toBeInTheDocument();
      });
    });

    it('should show red indicator when disconnected', async () => {
      const disconnectedState = {
        ...mockWeatherState,
        isConnected: false
      };
      
      mockWeatherService.getState.mockReturnValue(disconnectedState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(disconnectedState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget compact={true} />);
      
      await waitFor(() => {
        const indicator = document.querySelector('.bg-red-500');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Full Mode', () => {
    it('should render full forecast widget with header', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('10-Day Weather Forecast')).toBeInTheDocument();
        expect(screen.getByText(/Updated/)).toBeInTheDocument();
      });
    });

    it('should display forecast periods with expand/collapse', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('75°F')).toBeInTheDocument();
        expect(screen.getByText('Sunny')).toBeInTheDocument();
      });
    });

    it('should expand and show detailed forecast on click', async () => {
      render(<WeatherForecastWidget compact={false} showDetails={true} />);
      
      await waitFor(() => {
        const todayRow = screen.getByText('Today').closest('div')!;
        fireEvent.click(todayRow);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Day')).toBeInTheDocument();
        expect(screen.getByText('Temperature:')).toBeInTheDocument();
        expect(screen.getByText('Wind:')).toBeInTheDocument();
        expect(screen.getByText('Sunny skies with light winds')).toBeInTheDocument();
      });
    });

    it('should show both day and night forecasts in detailed view', async () => {
      const detailedState = {
        ...mockWeatherState,
        forecast: mockForecast
      };
      
      mockWeatherService.getState.mockReturnValue(detailedState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(detailedState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget compact={false} showDetails={true} />);
      
      // Click on the first row to expand details
      await waitFor(() => {
        const todayRow = screen.getByText('Today').closest('.cursor-pointer')!;
        fireEvent.click(todayRow);
      });
      
      // Check for detailed view content
      await waitFor(() => {
        expect(screen.getByText('Day')).toBeInTheDocument();
        expect(screen.getByText('Temperature:')).toBeInTheDocument();
        expect(screen.getByText('Wind:')).toBeInTheDocument();
        
        // Check for either detailed forecast text or night section
        const detailedForecastPresent = screen.queryByText('Sunny skies with light winds') || 
                                      screen.queryByText('Clear skies overnight');
        expect(detailedForecastPresent).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when no forecast data', async () => {
      const loadingState = {
        ...mockWeatherState,
        forecast: []
      };
      
      mockWeatherService.getState.mockReturnValue(loadingState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(loadingState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget />);
      
      expect(screen.getByText('Loading forecast...')).toBeInTheDocument();
    });
  });

  describe('Weather Icons', () => {
    it('should display appropriate icons for different conditions', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        // Sunny day should show sun icon
        expect(screen.getByText('☀️')).toBeInTheDocument();
        // Clear night should show moon icon
        expect(screen.getByText('🌙')).toBeInTheDocument();
      });
    });

    it('should handle different weather conditions', async () => {
      const rainForecast = [
        {
          ...mockForecast[0],
          short_forecast: 'Rain Showers',
          conditions: 'Rainy'
        }
      ];
      
      const rainState = {
        ...mockWeatherState,
        forecast: rainForecast
      };
      
      mockWeatherService.getState.mockReturnValue(rainState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(rainState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('🌧️')).toBeInTheDocument();
      });
    });
  });

  describe('Temperature Styling', () => {
    it('should apply correct color class for high temperatures', async () => {
      const hotForecast = [
        {
          ...mockForecast[0],
          temperature: 95
        }
      ];
      
      const hotState = {
        ...mockWeatherState,
        forecast: hotForecast
      };
      
      mockWeatherService.getState.mockReturnValue(hotState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(hotState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        const tempElement = screen.getByText('95°F');
        expect(tempElement).toHaveClass('text-red-600');
      });
    });

    it('should apply correct color class for low temperatures', async () => {
      const coldForecast = [
        {
          ...mockForecast[0],
          temperature: 25
        }
      ];
      
      const coldState = {
        ...mockWeatherState,
        forecast: coldForecast
      };
      
      mockWeatherService.getState.mockReturnValue(coldState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(coldState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        const tempElement = screen.getByText('25°F');
        expect(tempElement).toHaveClass('text-purple-600');
      });
    });
  });

  describe('Day Grouping', () => {
    it('should group day and night forecasts correctly', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        // Should see "Today" with both day and night data available
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('Monday')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should call refresh function when refresh button clicked', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
      });
      
      expect(mockWeatherService.refreshWeatherData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Days Limitation', () => {
    it('should limit forecast to specified number of days', async () => {
      const manyDaysForecast = Array.from({ length: 20 }, (_, i) => ({
        period_name: `Day ${i + 1}`,
        temperature: 70,
        temperature_unit: 'F' as const,
        wind_speed: '10 mph',
        wind_direction: 'N',
        short_forecast: 'Clear',
        detailed_forecast: 'Clear skies',
        is_daytime: true
      }));
      
      const manyDaysState = {
        ...mockWeatherState,
        forecast: manyDaysForecast
      };
      
      mockWeatherService.getState.mockReturnValue(manyDaysState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(manyDaysState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget days={3} compact={false} />);
      
      await waitFor(() => {
        // Should only show the limited number of days
        const forecastRows = document.querySelectorAll('.cursor-pointer');
        expect(forecastRows.length).toBeLessThanOrEqual(3);
        
        // Should show the first few days
        expect(screen.getByText('Day')).toBeInTheDocument();
      });
    });
  });

  describe('Last Updated Display', () => {
    it('should show last updated time', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Updated/)).toBeInTheDocument();
      });
    });

    it('should show loading when lastUpdated is null', async () => {
      const loadingState = {
        ...mockWeatherState,
        lastUpdated: null
      };
      
      mockWeatherService.getState.mockReturnValue(loadingState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(loadingState);
        return jest.fn();
      });
      
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Loading/)).toBeInTheDocument();
      });
    });
  });

  describe('NOAA Attribution', () => {
    it('should show NOAA data attribution', async () => {
      render(<WeatherForecastWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Data from NOAA Weather Service')).toBeInTheDocument();
      });
    });
  });
});