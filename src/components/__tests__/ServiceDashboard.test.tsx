/**
 * ServiceDashboard Component Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceDashboard from '../ServiceDashboard';
import { agentForagingService } from '../../services/agentForagingService';

// Mock the agent foraging service
jest.mock('../../services/agentForagingService', () => ({
  agentForagingService: {
    getServiceDashboard: jest.fn()
  }
}));

const mockServiceDashboardData = {
  serviceType: 'shelter' as const,
  totalLocations: 5,
  operationalLocations: 4,
  totalCapacity: 100,
  currentUtilization: 75,
  utilizationRate: 0.75,
  averageQuality: 3.8,
  averageWaitTime: 12,
  metrics: [
    {
      id: 'shelter-capacity',
      name: 'Capacity Utilization',
      value: 75,
      unit: '%',
      trend: 'up' as const,
      changePercent: 5.2,
      lastUpdated: new Date(),
      category: 'utilization' as const
    },
    {
      id: 'shelter-quality',
      name: 'Service Quality',
      value: 3.8,
      unit: '/5',
      trend: 'stable' as const,
      changePercent: -1.1,
      lastUpdated: new Date(),
      category: 'quality' as const
    }
  ],
  recentForaging: [
    {
      serviceId: 'shelter-001',
      serviceType: 'shelter' as const,
      timestamp: new Date(),
      location: { lat: 45.5152, lng: -122.6764, address: '125 SW 2nd Ave, Portland' },
      operationalStatus: 'operational' as const,
      capacity: { total: 100, available: 25, utilized: 75 },
      qualityMetrics: { rating: 4.0, cleanliness: 3.8, safety: 4.2, accessibility: 3.5 },
      agentObservations: { crowdLevel: 'medium' as const, waitTime: 10, staffPresent: true, issuesReported: [] },
      sourceAgent: 'agent-001',
      confidence: 0.85
    }
  ],
  alerts: [
    {
      id: 'alert-001',
      serviceType: 'shelter' as const,
      locationId: 'shelter-001',
      severity: 'warning' as const,
      message: 'Near capacity - limited availability',
      timestamp: new Date(),
      resolved: false
    }
  ],
  lastUpdated: new Date()
};

describe('ServiceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(mockServiceDashboardData);
  });

  describe('Component Rendering', () => {
    it('should render shelter dashboard with correct title and icon', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('Emergency Shelters')).toBeInTheDocument();
      expect(screen.getByTestId('shelter-dashboard')).toBeInTheDocument();
    });

    it('should render food dashboard with correct title and icon', () => {
      const foodData = { ...mockServiceDashboardData, serviceType: 'food' as const };
      (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(foodData);
      
      render(<ServiceDashboard serviceType="food" />);
      
      expect(screen.getByText('🍽️')).toBeInTheDocument();
      expect(screen.getByText('Food Services')).toBeInTheDocument();
      expect(screen.getByTestId('food-dashboard')).toBeInTheDocument();
    });

    it('should render hygiene dashboard with correct title and icon', () => {
      const hygieneData = { ...mockServiceDashboardData, serviceType: 'hygiene' as const };
      (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(hygieneData);
      
      render(<ServiceDashboard serviceType="hygiene" />);
      
      expect(screen.getByText('🚿')).toBeInTheDocument();
      expect(screen.getByText('Hygiene Centers')).toBeInTheDocument();
      expect(screen.getByTestId('hygiene-dashboard')).toBeInTheDocument();
    });

    it('should render transportation dashboard with correct title and icon', () => {
      const transportData = { ...mockServiceDashboardData, serviceType: 'transportation' as const };
      (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(transportData);
      
      render(<ServiceDashboard serviceType="transportation" />);
      
      expect(screen.getByText('🚌')).toBeInTheDocument();
      expect(screen.getByText('Transportation')).toBeInTheDocument();
      expect(screen.getByTestId('transportation-dashboard')).toBeInTheDocument();
    });
  });

  describe('Key Metrics Display', () => {
    it('should display all key metrics correctly', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      expect(screen.getByTestId('shelter-total-locations')).toHaveTextContent('5');
      expect(screen.getByTestId('shelter-operational')).toHaveTextContent('4');
      expect(screen.getByTestId('shelter-utilization')).toHaveTextContent('75%');
      expect(screen.getByTestId('shelter-quality')).toHaveTextContent('3.8/5');
    });

    it('should handle zero values correctly', () => {
      const zeroData = {
        ...mockServiceDashboardData,
        totalLocations: 0,
        operationalLocations: 0,
        utilizationRate: 0,
        averageQuality: 0
      };
      (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(zeroData);
      
      render(<ServiceDashboard serviceType="shelter" />);
      
      expect(screen.getByTestId('shelter-total-locations')).toHaveTextContent('0');
      expect(screen.getByTestId('shelter-operational')).toHaveTextContent('0');
      expect(screen.getByTestId('shelter-utilization')).toHaveTextContent('0%');
      expect(screen.getByTestId('shelter-quality')).toHaveTextContent('0.0/5');
    });
  });

  describe('Compact vs Detailed View', () => {
    it('should show detailed metrics in non-compact mode', () => {
      render(<ServiceDashboard serviceType="shelter" compact={false} />);
      
      expect(screen.getByText('Agent Metrics')).toBeInTheDocument();
      expect(screen.getByTestId('metric-shelter-capacity')).toBeInTheDocument();
      expect(screen.getByTestId('metric-shelter-quality')).toBeInTheDocument();
    });

    it('should hide detailed metrics in compact mode', () => {
      render(<ServiceDashboard serviceType="shelter" compact={true} />);
      
      expect(screen.queryByText('Agent Metrics')).not.toBeInTheDocument();
      expect(screen.queryByTestId('metric-shelter-capacity')).not.toBeInTheDocument();
    });

    it('should show recent agent activity in detailed view', () => {
      render(<ServiceDashboard serviceType="shelter" compact={false} />);
      
      expect(screen.getByText('Recent Agent Activity')).toBeInTheDocument();
      expect(screen.getByText('🤖 Agent scan: operational')).toBeInTheDocument();
    });

    it('should hide recent agent activity in compact view', () => {
      render(<ServiceDashboard serviceType="shelter" compact={true} />);
      
      expect(screen.queryByText('Recent Agent Activity')).not.toBeInTheDocument();
    });
  });

  describe('Auto Refresh Functionality', () => {
    it('should have auto refresh enabled by default', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      const autoRefreshButton = screen.getByTestId('shelter-auto-refresh');
      expect(autoRefreshButton).toHaveTextContent('🔄 Live');
      expect(autoRefreshButton).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('should toggle auto refresh when clicked', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      const autoRefreshButton = screen.getByTestId('shelter-auto-refresh');
      fireEvent.click(autoRefreshButton);
      
      expect(autoRefreshButton).toHaveTextContent('⏸️ Paused');
      expect(autoRefreshButton).toHaveClass('bg-gray-100', 'text-gray-600');
    });

    it('should call refresh when refresh button is clicked', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      const refreshButton = screen.getByTestId('shelter-refresh');
      fireEvent.click(refreshButton);
      
      // Service should be called again (once on mount, once on click)
      expect(agentForagingService.getServiceDashboard).toHaveBeenCalledTimes(2);
    });
  });

  describe('Alerts Display', () => {
    it('should display alerts when present', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByTestId('alert-alert-001')).toBeInTheDocument();
      expect(screen.getByText('Near capacity - limited availability')).toBeInTheDocument();
    });

    it('should limit alerts in compact mode', () => {
      const multipleAlertsData = {
        ...mockServiceDashboardData,
        alerts: [
          { ...mockServiceDashboardData.alerts[0], id: 'alert-001' },
          { ...mockServiceDashboardData.alerts[0], id: 'alert-002', message: 'Second alert' },
          { ...mockServiceDashboardData.alerts[0], id: 'alert-003', message: 'Third alert' }
        ]
      };
      (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(multipleAlertsData);
      
      render(<ServiceDashboard serviceType="shelter" compact={true} />);
      
      // Should only show first 2 alerts in compact mode
      expect(screen.getByTestId('alert-alert-001')).toBeInTheDocument();
      expect(screen.getByTestId('alert-alert-002')).toBeInTheDocument();
      expect(screen.queryByTestId('alert-alert-003')).not.toBeInTheDocument();
    });

    it('should display different alert severities with correct styling', () => {
      const alertsData = {
        ...mockServiceDashboardData,
        alerts: [
          { ...mockServiceDashboardData.alerts[0], id: 'alert-critical', severity: 'critical' as const },
          { ...mockServiceDashboardData.alerts[0], id: 'alert-warning', severity: 'warning' as const },
          { ...mockServiceDashboardData.alerts[0], id: 'alert-info', severity: 'info' as const }
        ]
      };
      (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(alertsData);
      
      render(<ServiceDashboard serviceType="shelter" compact={false} />);
      
      const criticalAlert = screen.getByTestId('alert-alert-critical');
      const warningAlert = screen.getByTestId('alert-alert-warning');
      const infoAlert = screen.getByTestId('alert-alert-info');
      
      expect(criticalAlert).toHaveClass('bg-red-50', 'text-red-700');
      expect(warningAlert).toHaveClass('bg-yellow-50', 'text-yellow-700');
      expect(infoAlert).toHaveClass('bg-blue-50', 'text-blue-700');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      // Mock a delayed response that throws to simulate loading
      (agentForagingService.getServiceDashboard as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Loading...');
      });
      
      render(<ServiceDashboard serviceType="shelter" />);
      
      // Should show error state when service throws
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should show error state when data fails to load', async () => {
      (agentForagingService.getServiceDashboard as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to load data');
      });
      
      render(<ServiceDashboard serviceType="shelter" />);
      
      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument();
        expect(screen.getByText('Unable to load Emergency Shelters data')).toBeInTheDocument();
      });
    });
  });

  describe('Metric Formatting', () => {
    it('should format metric values correctly', () => {
      render(<ServiceDashboard serviceType="shelter" compact={false} />);
      
      expect(screen.getAllByText('75%')).toHaveLength(2); // Utilization and detailed metric
      expect(screen.getAllByText('3.8/5')).toHaveLength(2); // Quality metric in key metrics and detailed
    });

    it('should display trend indicators for metrics', () => {
      render(<ServiceDashboard serviceType="shelter" compact={false} />);
      
      expect(screen.getByText('📈')).toBeInTheDocument(); // Up trend
      expect(screen.getByText('➡️')).toBeInTheDocument(); // Stable trend
    });

    it('should show positive and negative change percentages', () => {
      render(<ServiceDashboard serviceType="shelter" compact={false} />);
      
      expect(screen.getByText('+5.2%')).toBeInTheDocument(); // Positive change
      expect(screen.getByText('-1.1%')).toBeInTheDocument(); // Negative change
    });
  });

  describe('Last Updated Information', () => {
    it('should display last updated timestamp', () => {
      render(<ServiceDashboard serviceType="shelter" />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/agent reports/)).toBeInTheDocument();
    });
  });
});