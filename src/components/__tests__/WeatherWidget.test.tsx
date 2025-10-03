/**
 * Weather Widget Component Tests
 * 
 * Unit tests for the WeatherWidget component covering display modes,
 * alert indicators, and weather data formatting.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherWidget } from '../WeatherWidget';
import { weatherService } from '../../services/weatherService';

// Mock the weather service
jest.mock('../../services/weatherService', () => ({
  weatherService: {
    subscribe: jest.fn(),
    getState: jest.fn(),
    getAlertCounts: jest.fn(),
    getServiceImpacts: jest.fn()
  }
}));

const mockWeatherService = weatherService as jest.Mocked<typeof weatherService>;

const mockWeatherState = {
  currentWeather: {
    timestamp: '2024-01-15T10:30:00Z',
    temperature_f: 72.5,
    humidity_percent: 55.0,
    precipitation_inches: 0.0,
    wind_speed_mph: 8.5,
    wind_direction: 'NW',
    pressure_mb: 1013.2,
    visibility_miles: 10.0,
    conditions: 'Clear',
    uv_index: 6
  },
  alerts: [
    {
      alert_id: 'test-alert-1',
      alert_type: 'temperature',
      severity: 'high' as const,
      message: 'High temperature warning',
      recommendations: ['Stay hydrated', 'Seek shade'],
      affected_services: ['outdoor']
    }
  ],
  noaaAlerts: [],
  forecast: [],
  lastUpdated: new Date('2024-01-15T10:30:00Z'),
  isConnected: true,
  location: 'Boise, ID'
};

describe('WeatherWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWeatherService.getState.mockReturnValue(mockWeatherState);
    mockWeatherService.getAlertCounts.mockReturnValue({
      total: 1,
      high: 1,
      extreme: 0
    });
    mockWeatherService.getServiceImpacts.mockReturnValue({
      shelter: false,
      transportation: false,
      outdoor: true,
      recommendations: ['Stay hydrated']
    });
    
    // Mock subscribe to call callback immediately
    mockWeatherService.subscribe.mockImplementation((callback) => {
      callback(mockWeatherState);
      return jest.fn(); // Return unsubscribe function
    });
  });

  describe('Compact Mode', () => {
    it('should render compact weather display', async () => {
      render(<WeatherWidget compact={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('73°F')).toBeInTheDocument();
        expect(screen.getByText('Boise, ID')).toBeInTheDocument();
      });
    });

    it('should show alert indicators in compact mode', async () => {
      render(<WeatherWidget compact={true} showAlerts={true} />);
      
      await waitFor(() => {
        // Should show alert count badge
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should hide location when showLocation is false', async () => {
      render(<WeatherWidget compact={true} showLocation={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Boise, ID')).not.toBeInTheDocument();
        expect(screen.getByText('73°F')).toBeInTheDocument();
      });
    });
  });

  describe('Full Mode', () => {
    it('should render full weather display with all details', async () => {
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Current Weather')).toBeInTheDocument();
        expect(screen.getByText('73°F')).toBeInTheDocument();
        expect(screen.getByText('Clear')).toBeInTheDocument();
        expect(screen.getByText('Humidity: 55%')).toBeInTheDocument();
        expect(screen.getByText('Wind: 9 mph NW')).toBeInTheDocument();
        expect(screen.getByText('Visibility: 10 mi')).toBeInTheDocument();
      });
    });

    it('should display weather alerts section', async () => {
      render(<WeatherWidget compact={false} showAlerts={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Active Alerts')).toBeInTheDocument();
        expect(screen.getByText('High temperature warning')).toBeInTheDocument();
      });
    });

    it('should show additional weather details', async () => {
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Pressure')).toBeInTheDocument();
        expect(screen.getByText('1013 mb')).toBeInTheDocument();
        expect(screen.getByText('UV Index')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when no weather data', async () => {
      mockWeatherService.getState.mockReturnValue({
        ...mockWeatherState,
        currentWeather: null
      });
      
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback({
          ...mockWeatherState,
          currentWeather: null
        });
        return jest.fn();
      });
      
      render(<WeatherWidget />);
      
      expect(screen.getByText('Loading weather...')).toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    it('should show green indicator when connected', async () => {
      render(<WeatherWidget compact={false} />);
      
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
      
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        const indicator = document.querySelector('.bg-red-500');
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe('Temperature Display', () => {
    it('should apply correct color class for high temperature', async () => {
      const hotState = {
        ...mockWeatherState,
        currentWeather: {
          ...mockWeatherState.currentWeather!,
          temperature_f: 95
        }
      };
      
      mockWeatherService.getState.mockReturnValue(hotState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(hotState);
        return jest.fn();
      });
      
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        const tempElement = screen.getByText('95°F');
        expect(tempElement).toHaveClass('text-red-600');
      });
    });

    it('should apply correct color class for low temperature', async () => {
      const coldState = {
        ...mockWeatherState,
        currentWeather: {
          ...mockWeatherState.currentWeather!,
          temperature_f: 25
        }
      };
      
      mockWeatherService.getState.mockReturnValue(coldState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(coldState);
        return jest.fn();
      });
      
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        const tempElement = screen.getByText('25°F');
        expect(tempElement).toHaveClass('text-purple-600');
      });
    });
  });

  describe('Alert Display', () => {
    it('should limit displayed alerts to 3', async () => {
      const manyAlerts = Array.from({ length: 5 }, (_, i) => ({
        alert_id: `alert-${i}`,
        alert_type: 'test',
        severity: 'medium' as const,
        message: `Test alert ${i}`,
        recommendations: [],
        affected_services: []
      }));

      const manyAlertsState = {
        ...mockWeatherState,
        alerts: manyAlerts
      };

      mockWeatherService.getState.mockReturnValue(manyAlertsState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(manyAlertsState);
        return jest.fn();
      });
      
      render(<WeatherWidget compact={false} showAlerts={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('+2 more alerts')).toBeInTheDocument();
      });
    });

    it('should hide alerts when showAlerts is false', async () => {
      render(<WeatherWidget compact={false} showAlerts={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Active Alerts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Weather Icons', () => {
    it('should display appropriate icon for clear conditions', async () => {
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('☀️')).toBeInTheDocument();
      });
    });

    it('should display appropriate icon for rainy conditions', async () => {
      const rainyState = {
        ...mockWeatherState,
        currentWeather: {
          ...mockWeatherState.currentWeather!,
          conditions: 'Rain'
        }
      };
      
      mockWeatherService.getState.mockReturnValue(rainyState);
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(rainyState);
        return jest.fn();
      });
      
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('🌧️')).toBeInTheDocument();
      });
    });
  });

  describe('Last Updated', () => {
    it('should format last updated time correctly', async () => {
      render(<WeatherWidget compact={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('Updated')).toBeInTheDocument();
        // The exact time format may vary based on locale - just check it's there
        expect(screen.getByText('1/15/2024')).toBeInTheDocument();
      });
    });
  });
});