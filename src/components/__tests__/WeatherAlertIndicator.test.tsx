/**
 * Weather Alert Indicator Component Tests
 * 
 * Unit tests for the WeatherAlertIndicator component covering
 * alert display, severity styling, and interaction behaviors.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WeatherAlertIndicator } from '../WeatherAlertIndicator';
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

const mockAlert = {
  alert_id: 'test-alert-1',
  alert_type: 'temperature',
  severity: 'high' as const,
  message: 'High temperature warning: 98°F',
  effective_time: '2024-01-15T10:00:00Z',
  expires_time: '2024-01-15T18:00:00Z',
  recommendations: ['Stay hydrated', 'Seek shade'],
  affected_services: ['shelter', 'outdoor']
};

const mockNOAAAlert = {
  alert_id: 'noaa-alert-1',
  event: 'Heat Warning',
  headline: 'Excessive Heat Warning',
  description: 'Dangerous heat conditions expected',
  severity: 'extreme',
  urgency: 'immediate',
  certainty: 'likely',
  effective_time: '2024-01-15T10:00:00Z',
  expires_time: '2024-01-15T20:00:00Z',
  areas: ['Boise County']
};

const mockWeatherState = {
  currentWeather: null,
  alerts: [mockAlert],
  noaaAlerts: [mockNOAAAlert],
  forecast: [],
  lastUpdated: new Date('2024-01-15T10:30:00Z'),
  isConnected: true,
  location: 'Boise, ID'
};

describe('WeatherAlertIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWeatherService.getState.mockReturnValue(mockWeatherState);
    mockWeatherService.getAlertCounts.mockReturnValue({
      total: 2,
      high: 1,
      extreme: 1
    });
    mockWeatherService.getServiceImpacts.mockReturnValue({
      shelter: true,
      transportation: false,
      outdoor: true,
      recommendations: ['Stay hydrated', 'Open cooling centers']
    });
    
    // Mock subscribe to call callback immediately
    mockWeatherService.subscribe.mockImplementation((callback) => {
      callback(mockWeatherState);
      return jest.fn(); // Return unsubscribe function
    });
  });

  describe('Rendering', () => {
    it('should render alert indicator when alerts exist', async () => {
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        expect(screen.getByText('2 Alerts')).toBeInTheDocument();
      });
    });

    it('should not render when no alerts exist', async () => {
      const noAlertsState = {
        ...mockWeatherState,
        alerts: [],
        noaaAlerts: []
      };
      
      mockWeatherService.getState.mockReturnValue(noAlertsState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 0,
        high: 0,
        extreme: 0
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(noAlertsState);
        return jest.fn();
      });
      
      const { container } = render(<WeatherAlertIndicator />);
      expect(container.firstChild).toBeNull();
    });

    it('should render singular text for single alert', async () => {
      mockWeatherService.getState.mockReturnValue({
        ...mockWeatherState,
        alerts: [mockAlert],
        noaaAlerts: []
      });
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 1,
        high: 1,
        extreme: 0
      });
      
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        expect(screen.getByText('1 Alert')).toBeInTheDocument();
      });
    });
  });

  describe('Severity Styling', () => {
    it('should apply extreme severity styling', async () => {
      const extremeState = {
        ...mockWeatherState,
        alerts: [],
        noaaAlerts: [{ ...mockNOAAAlert, severity: 'extreme' }]
      };
      
      mockWeatherService.getState.mockReturnValue(extremeState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 1,
        high: 0,
        extreme: 1
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(extremeState);
        return jest.fn();
      });
      
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        const badge = screen.getByText('1 Alert').closest('div');
        expect(badge).toHaveClass('bg-red-600');
      });
    });

    it('should apply high severity styling', async () => {
      const highSeverityState = {
        ...mockWeatherState,
        alerts: [{ ...mockAlert, severity: 'high' }],
        noaaAlerts: []
      };
      
      mockWeatherService.getState.mockReturnValue(highSeverityState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 1,
        high: 1,
        extreme: 0
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(highSeverityState);
        return jest.fn();
      });
      
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        const badge = screen.getByText('1 Alert').closest('div');
        expect(badge).toHaveClass('bg-orange-500');
      });
    });

    it('should apply medium severity styling', async () => {
      const mediumSeverityState = {
        ...mockWeatherState,
        alerts: [{ ...mockAlert, severity: 'medium' }],
        noaaAlerts: []
      };
      
      mockWeatherService.getState.mockReturnValue(mediumSeverityState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 1,
        high: 0,
        extreme: 0
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(mediumSeverityState);
        return jest.fn();
      });
      
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        const badge = screen.getByText('1 Alert').closest('div');
        expect(badge).toHaveClass('bg-yellow-500');
      });
    });
  });

  describe('Alert Details Tooltip', () => {
    it('should show tooltip on hover when showTooltip is true', async () => {
      render(<WeatherAlertIndicator showTooltip={true} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Active Weather Alerts')).toBeInTheDocument();
        expect(screen.getByText('High temperature warning: 98°F')).toBeInTheDocument();
        expect(screen.getByText('Excessive Heat Warning')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(<WeatherAlertIndicator showTooltip={true} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Active Weather Alerts')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(indicator);
      
      await waitFor(() => {
        expect(screen.queryByText('Active Weather Alerts')).not.toBeInTheDocument();
      });
    });

    it('should toggle details on click', async () => {
      render(<WeatherAlertIndicator showTooltip={false} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.click(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Active Weather Alerts')).toBeInTheDocument();
      });
      
      fireEvent.click(indicator);
      
      await waitFor(() => {
        expect(screen.queryByText('Active Weather Alerts')).not.toBeInTheDocument();
      });
    });
  });

  describe('Alert Icons', () => {
    it('should display appropriate icon for temperature alerts', async () => {
      render(<WeatherAlertIndicator showTooltip={true} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        const fireIcons = screen.getAllByText('🔥');
        expect(fireIcons.length).toBeGreaterThan(0);
      });
    });

    it('should display appropriate icon for NOAA heat warning', async () => {
      render(<WeatherAlertIndicator showTooltip={true} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        const fireIcons = screen.getAllByText('🔥');
        expect(fireIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Service Impacts', () => {
    it('should show service impact indicators in tooltip', async () => {
      render(<WeatherAlertIndicator showTooltip={true} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('Service Impacts:')).toBeInTheDocument();
        expect(screen.getByText('🏠 Shelter')).toBeInTheDocument();
        expect(screen.getByText('🌳 Outdoor')).toBeInTheDocument();
      });
    });
  });

  describe('Positioning', () => {
    it('should apply inline positioning by default', () => {
      const { container } = render(<WeatherAlertIndicator />);
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).not.toHaveClass('absolute');
    });

    it('should apply top-right positioning when specified', () => {
      const { container } = render(<WeatherAlertIndicator position="top-right" />);
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveClass('absolute', 'top-2', 'right-2');
    });

    it('should apply bottom-left positioning when specified', () => {
      const { container } = render(<WeatherAlertIndicator position="bottom-left" />);
      const indicator = container.firstChild as HTMLElement;
      expect(indicator).toHaveClass('absolute', 'bottom-2', 'left-2');
    });
  });

  describe('Custom Click Handler', () => {
    it('should call custom onClick handler when provided', async () => {
      const mockOnClick = jest.fn();
      render(<WeatherAlertIndicator onClick={mockOnClick} />);
      
      const indicator = screen.getByText('2 Alerts').closest('div')!;
      fireEvent.click(indicator);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Alert Truncation', () => {
    it('should limit displayed alerts to maxDisplayed prop', async () => {
      const manyAlerts = Array.from({ length: 5 }, (_, i) => ({
        alert_id: `alert-${i}`,
        alert_type: 'test',
        severity: 'medium' as const,
        message: `Test alert ${i}`,
        effective_time: '2024-01-15T10:00:00Z',
        expires_time: '2024-01-15T18:00:00Z',
        recommendations: [],
        affected_services: []
      }));

      const manyAlertsState = {
        ...mockWeatherState,
        alerts: manyAlerts,
        noaaAlerts: []
      };

      mockWeatherService.getState.mockReturnValue(manyAlertsState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 5,
        high: 0,
        extreme: 0
      });
      mockWeatherService.getServiceImpacts.mockReturnValue({
        shelter: false,
        transportation: false,
        outdoor: false,
        recommendations: []
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(manyAlertsState);
        return jest.fn();
      });
      
      render(<WeatherAlertIndicator showTooltip={true} maxDisplayed={2} />);
      
      const indicator = screen.getByText('5 Alerts').closest('div')!;
      fireEvent.mouseEnter(indicator);
      
      await waitFor(() => {
        expect(screen.getByText('+3 more alerts')).toBeInTheDocument();
      });
    });
  });

  describe('Extreme Alert Animation', () => {
    it('should show pulse animation for extreme alerts', async () => {
      const extremeAlertState = {
        ...mockWeatherState,
        alerts: [],
        noaaAlerts: [{ ...mockNOAAAlert, severity: 'extreme' }]
      };
      
      mockWeatherService.getState.mockReturnValue(extremeAlertState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 1,
        high: 0,
        extreme: 1
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(extremeAlertState);
        return jest.fn();
      });
      
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        const pulseElement = document.querySelector('.animate-pulse');
        expect(pulseElement).toBeInTheDocument();
      });
    });

    it('should not show pulse animation when no extreme alerts', async () => {
      const highAlertState = {
        ...mockWeatherState,
        alerts: [{ ...mockAlert, severity: 'high' }],
        noaaAlerts: []
      };
      
      mockWeatherService.getState.mockReturnValue(highAlertState);
      mockWeatherService.getAlertCounts.mockReturnValue({
        total: 1,
        high: 1,
        extreme: 0
      });
      mockWeatherService.subscribe.mockImplementation((callback) => {
        callback(highAlertState);
        return jest.fn();
      });
      
      render(<WeatherAlertIndicator />);
      
      await waitFor(() => {
        const pulseElement = document.querySelector('.animate-pulse');
        expect(pulseElement).toBeNull();
      });
    });
  });
});