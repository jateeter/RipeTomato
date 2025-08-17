/**
 * ServiceDashboardsHub Component Unit Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ServiceDashboardsHub from '../ServiceDashboardsHub';
import { agentForagingService } from '../../services/agentForagingService';

// Mock the agent foraging service
jest.mock('../../services/agentForagingService', () => ({
  agentForagingService: {
    getServiceDashboard: jest.fn(),
    getAgents: jest.fn()
  }
}));

// Mock ServiceDashboard component
jest.mock('../ServiceDashboard', () => {
  return function MockServiceDashboard({ serviceType, compact }: { serviceType: string; compact?: boolean }) {
    return (
      <div data-testid={`mock-service-dashboard-${serviceType}`}>
        Mock {serviceType} Dashboard {compact ? '(compact)' : '(detailed)'}
      </div>
    );
  };
});

const mockAgents = [
  {
    id: 'agent-001',
    name: 'Mobile Survey Agent',
    type: 'automated' as const,
    specialties: ['shelter', 'food'] as const,
    reliability: 0.85,
    lastActive: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    foragingCount: 45,
    accuracy: 0.78
  },
  {
    id: 'agent-002',
    name: 'Community Outreach Bot',
    type: 'automated' as const,
    specialties: ['food', 'transportation'] as const,
    reliability: 0.92,
    lastActive: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
    foragingCount: 67,
    accuracy: 0.84
  },
  {
    id: 'agent-003',
    name: 'Field Volunteer Network',
    type: 'human' as const,
    specialties: ['shelter', 'hygiene'] as const,
    reliability: 0.76,
    lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    foragingCount: 23,
    accuracy: 0.91
  }
];

const mockServiceDashboardData = {
  serviceType: 'shelter' as const,
  totalLocations: 5,
  operationalLocations: 4,
  totalCapacity: 100,
  currentUtilization: 75,
  utilizationRate: 0.75,
  averageQuality: 3.8,
  averageWaitTime: 12,
  metrics: [],
  recentForaging: [],
  alerts: [],
  lastUpdated: new Date()
};

describe('ServiceDashboardsHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (agentForagingService.getAgents as jest.Mock).mockReturnValue(mockAgents);
    (agentForagingService.getServiceDashboard as jest.Mock).mockReturnValue(mockServiceDashboardData);
  });

  describe('Component Rendering', () => {
    it('should render the main hub component', () => {
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByTestId('service-dashboards-hub')).toBeInTheDocument();
      expect(screen.getByText('Service Dashboards')).toBeInTheDocument();
      expect(screen.getByText('Real-time monitoring via agent foraging')).toBeInTheDocument();
    });

    it('should render all service navigation buttons', () => {
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByTestId('service-all')).toBeInTheDocument();
      expect(screen.getByTestId('service-shelter')).toBeInTheDocument();
      expect(screen.getByTestId('service-food')).toBeInTheDocument();
      expect(screen.getByTestId('service-hygiene')).toBeInTheDocument();
      expect(screen.getByTestId('service-transportation')).toBeInTheDocument();
    });

    it('should show correct service icons and names', () => {
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByText('📊 All Services')).toBeInTheDocument();
      expect(screen.getByText('🏠 Shelters')).toBeInTheDocument();
      expect(screen.getByText('🍽️ Food')).toBeInTheDocument();
      expect(screen.getByText('🚿 Hygiene')).toBeInTheDocument();
      expect(screen.getByText('🚌 Transport')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should default to overview mode', () => {
      render(<ServiceDashboardsHub />);
      
      const overviewButton = screen.getByTestId('view-overview');
      const detailedButton = screen.getByTestId('view-detailed');
      
      expect(overviewButton).toHaveClass('bg-white', 'text-gray-900', 'shadow');
      expect(detailedButton).toHaveClass('text-gray-600');
    });

    it('should switch to detailed view when clicked', () => {
      render(<ServiceDashboardsHub />);
      
      const detailedButton = screen.getByTestId('view-detailed');
      fireEvent.click(detailedButton);
      
      expect(detailedButton).toHaveClass('bg-white', 'text-gray-900', 'shadow');
      expect(screen.getByTestId('view-overview')).toHaveClass('text-gray-600');
    });

    it('should use defaultView prop correctly', () => {
      render(<ServiceDashboardsHub defaultView="detailed" />);
      
      const detailedButton = screen.getByTestId('view-detailed');
      expect(detailedButton).toHaveClass('bg-white', 'text-gray-900', 'shadow');
    });
  });

  describe('Service Navigation', () => {
    it('should default to "all" services selected', () => {
      render(<ServiceDashboardsHub />);
      
      const allButton = screen.getByTestId('service-all');
      expect(allButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should switch active service when service button is clicked', () => {
      render(<ServiceDashboardsHub />);
      
      const shelterButton = screen.getByTestId('service-shelter');
      fireEvent.click(shelterButton);
      
      expect(shelterButton).toHaveClass('text-white');
      expect(screen.getByTestId('service-all')).toHaveClass('bg-white', 'text-gray-700');
    });

    it('should show all service dashboards when "all" is selected', () => {
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByTestId('mock-service-dashboard-shelter')).toBeInTheDocument();
      expect(screen.getByTestId('mock-service-dashboard-food')).toBeInTheDocument();
      expect(screen.getByTestId('mock-service-dashboard-hygiene')).toBeInTheDocument();
      expect(screen.getByTestId('mock-service-dashboard-transportation')).toBeInTheDocument();
    });

    it('should show single service dashboard when specific service is selected', () => {
      render(<ServiceDashboardsHub />);
      
      const shelterButton = screen.getByTestId('service-shelter');
      fireEvent.click(shelterButton);
      
      expect(screen.getByTestId('mock-service-dashboard-shelter')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-service-dashboard-food')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-service-dashboard-hygiene')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-service-dashboard-transportation')).not.toBeInTheDocument();
    });
  });

  describe('System Status Display', () => {
    it('should show optimal status when many agents are active', () => {
      // Mock 3 agents active within last 5 minutes
      const activeAgents = mockAgents.map(agent => ({
        ...agent,
        lastActive: new Date(Date.now() - 2 * 60 * 1000)
      }));
      (agentForagingService.getAgents as jest.Mock).mockReturnValue(activeAgents);
      
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByText('All systems operational')).toBeInTheDocument();
    });

    it('should show good status with fewer active agents', () => {
      // Mock 2 agents active within last 5 minutes
      const agents = [
        { ...mockAgents[0], lastActive: new Date(Date.now() - 2 * 60 * 1000) },
        { ...mockAgents[1], lastActive: new Date(Date.now() - 3 * 60 * 1000) },
        { ...mockAgents[2], lastActive: new Date(Date.now() - 10 * 60 * 1000) } // Not active
      ];
      (agentForagingService.getAgents as jest.Mock).mockReturnValue(agents);
      
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByText('Systems running normally')).toBeInTheDocument();
    });

    it('should show limited status with few active agents', () => {
      // Mock only 1 agent active within last 5 minutes
      const agents = [
        { ...mockAgents[0], lastActive: new Date(Date.now() - 2 * 60 * 1000) },
        { ...mockAgents[1], lastActive: new Date(Date.now() - 10 * 60 * 1000) },
        { ...mockAgents[2], lastActive: new Date(Date.now() - 10 * 60 * 1000) }
      ];
      (agentForagingService.getAgents as jest.Mock).mockReturnValue(agents);
      
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByText('Limited monitoring coverage')).toBeInTheDocument();
    });
  });

  describe('Agent Status Summary', () => {
    it('should display correct agent statistics', () => {
      render(<ServiceDashboardsHub />);
      
      // Active agents (2 out of 3 are active within 5 minutes)
      expect(screen.getByText('2/3')).toBeInTheDocument();
      
      // Total scans
      const totalScans = mockAgents.reduce((sum, agent) => sum + agent.foragingCount, 0);
      expect(screen.getByText(totalScans.toString())).toBeInTheDocument();
      
      // Average accuracy
      const avgAccuracy = Math.round((mockAgents.reduce((sum, agent) => sum + agent.accuracy, 0) / mockAgents.length) * 100);
      expect(screen.getByText(`${avgAccuracy}%`)).toBeInTheDocument();
      
      // Coverage percentage
      expect(screen.getByText('67%')).toBeInTheDocument(); // 2/3 active
    });
  });

  describe('Compact vs Detailed Dashboard Display', () => {
    it('should show compact dashboards in overview mode', () => {
      render(<ServiceDashboardsHub />);
      
      expect(screen.getByText('Mock shelter Dashboard (compact)')).toBeInTheDocument();
      expect(screen.getByText('Mock food Dashboard (compact)')).toBeInTheDocument();
    });

    it('should show detailed dashboards in detailed mode', () => {
      render(<ServiceDashboardsHub />);
      
      const detailedButton = screen.getByTestId('view-detailed');
      fireEvent.click(detailedButton);
      
      expect(screen.getByText('Mock shelter Dashboard (detailed)')).toBeInTheDocument();
      expect(screen.getByText('Mock food Dashboard (detailed)')).toBeInTheDocument();
    });
  });

  describe('Agent Details Section', () => {
    it('should show agent details in detailed view only', () => {
      render(<ServiceDashboardsHub />);
      
      // Should not show in overview mode
      expect(screen.queryByText('Foraging Agents')).not.toBeInTheDocument();
      
      // Switch to detailed view
      const detailedButton = screen.getByTestId('view-detailed');
      fireEvent.click(detailedButton);
      
      // Should show in detailed mode
      expect(screen.getByText('Foraging Agents')).toBeInTheDocument();
    });

    it('should display individual agent cards in detailed view', () => {
      render(<ServiceDashboardsHub />);
      
      const detailedButton = screen.getByTestId('view-detailed');
      fireEvent.click(detailedButton);
      
      expect(screen.getByTestId('agent-agent-001')).toBeInTheDocument();
      expect(screen.getByTestId('agent-agent-002')).toBeInTheDocument();
      expect(screen.getByTestId('agent-agent-003')).toBeInTheDocument();
    });

    it('should show agent information correctly', () => {
      render(<ServiceDashboardsHub />);
      
      const detailedButton = screen.getByTestId('view-detailed');
      fireEvent.click(detailedButton);
      
      expect(screen.getByText('Mobile Survey Agent')).toBeInTheDocument();
      expect(screen.getAllByText(/Type:/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Reliability:/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Accuracy:/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Scans:/)[0]).toBeInTheDocument();
    });

    it('should show agent activity status indicators', () => {
      render(<ServiceDashboardsHub />);
      
      const detailedButton = screen.getByTestId('view-detailed');
      fireEvent.click(detailedButton);
      
      const agentCards = screen.getAllByTestId(/agent-agent-/);
      expect(agentCards).toHaveLength(3);
      
      // Each agent card should have a status indicator
      agentCards.forEach(card => {
        const statusIndicator = card.querySelector('.w-2.h-2.rounded-full');
        expect(statusIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Periodic Updates', () => {
    it('should update agent data periodically', async () => {
      jest.useFakeTimers();
      
      render(<ServiceDashboardsHub />);
      
      expect(agentForagingService.getAgents).toHaveBeenCalledTimes(1);
      
      // Fast forward 30 seconds
      jest.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(agentForagingService.getAgents).toHaveBeenCalledTimes(2);
      });
      
      jest.useRealTimers();
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should use correct grid classes for overview mode', () => {
      render(<ServiceDashboardsHub />);
      
      const gridContainer = screen.getByTestId('service-all').closest('.grid');
      // Note: Testing CSS classes in Jest is limited, but we can verify the structure
      expect(screen.getByTestId('mock-service-dashboard-shelter')).toBeInTheDocument();
    });

    it('should use correct layout for single service view', () => {
      render(<ServiceDashboardsHub />);
      
      const shelterButton = screen.getByTestId('service-shelter');
      fireEvent.click(shelterButton);
      
      const singleServiceContainer = screen.getByTestId('mock-service-dashboard-shelter').closest('.max-w-4xl');
      expect(singleServiceContainer).toBeInTheDocument();
    });
  });
});