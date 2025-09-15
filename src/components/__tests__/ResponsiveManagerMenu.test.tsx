/**
 * ResponsiveManagerMenu Tests
 * 
 * Tests for the responsive manager menu component functionality
 * and responsive behavior across different screen sizes.
 * 
 * @license MIT
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveManagerMenu, ManagerMenuTab } from '../ResponsiveManagerMenu';

// Mock useResponsive hook
jest.mock('../../hooks/useResponsive', () => ({
  useResponsive: jest.fn()
}));

const mockUseResponsive = require('../../hooks/useResponsive').useResponsive;

describe('ResponsiveManagerMenu', () => {
  const mockOnTabChange = jest.fn();
  
  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    activeTab: 'overview' as ManagerMenuTab,
    onTabChange: mockOnTabChange,
    alertCount: 5
  };

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false
      });
    });

    it('renders all category dropdowns on desktop', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Operations')).toBeInTheDocument();
      expect(screen.getByText('Service Centers')).toBeInTheDocument();
      expect(screen.getByText('Data & Facilities')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('shows alert count on system category', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const systemButton = screen.getByText('System').closest('button');
      expect(systemButton).toHaveTextContent('5');
    });

    it('opens dropdown when category is clicked', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const operationsButton = screen.getByText('Operations');
      fireEvent.click(operationsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
        expect(screen.getByText('Staff')).toBeInTheDocument();
        expect(screen.getByText('Resources')).toBeInTheDocument();
        expect(screen.getByText('Clients')).toBeInTheDocument();
      });
    });

    it('calls onTabChange when menu item is selected', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const operationsButton = screen.getByText('Operations');
      fireEvent.click(operationsButton);
      
      await waitFor(() => {
        const servicesItem = screen.getByText('Services');
        fireEvent.click(servicesItem);
      });
      
      expect(mockOnTabChange).toHaveBeenCalledWith('services');
    });

    it('highlights active category', () => {
      render(<ResponsiveManagerMenu {...defaultProps} activeTab="services" />);
      
      const operationsButton = screen.getByText('Operations').closest('button');
      expect(operationsButton).toHaveClass('bg-green-100', 'text-green-700');
    });
  });

  describe('Tablet Layout', () => {
    beforeEach(() => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true
      });
    });

    it('renders with tablet-specific styling', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('py-3'); // Tablet-specific padding
    });

    it('uses flexbox wrap for tablet layout', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const buttonContainer = screen.getByRole('navigation').firstChild;
      expect(buttonContainer).toHaveClass('flex-wrap');
    });
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false
      });
    });

    it('renders with mobile-specific layout', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      // Should show active tab display
      expect(screen.getByText('Overview')).toBeInTheDocument();
      
      // Should show category selector
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('shows horizontal scrollable category buttons', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const scrollContainer = screen.getByText('Dashboard').closest('div')?.parentElement?.parentElement;
      expect(scrollContainer).toHaveClass('overflow-x-auto');
    });

    it('displays active tab with icon in mobile header', () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const header = screen.getByText('Overview').closest('div')?.parentElement;
      expect(header).toHaveClass('bg-gray-50');
      
      // Should show dashboard icon in the header (not in the buttons)
      const headerIcon = header?.querySelector('.text-lg');
      expect(headerIcon).toHaveTextContent('📊');
    });

    it('opens mobile dropdown when category is tapped', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const operationsButton = screen.getByText('Operations');
      fireEvent.click(operationsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Functionality', () => {
    beforeEach(() => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false
      });
    });

    it('closes dropdown when clicking outside', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      // Open dropdown
      const operationsButton = screen.getByText('Operations');
      fireEvent.click(operationsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Services')).not.toBeInTheDocument();
      });
    });

    it('closes dropdown after selecting an item', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const operationsButton = screen.getByText('Operations');
      fireEvent.click(operationsButton);
      
      await waitFor(() => {
        const servicesItem = screen.getByText('Services');
        fireEvent.click(servicesItem);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Services')).not.toBeInTheDocument();
      });
    });

    it('toggles dropdown when clicking same category twice', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} />);
      
      const operationsButton = screen.getByText('Operations');
      
      // First click - open
      fireEvent.click(operationsButton);
      await waitFor(() => {
        expect(screen.getByText('Services')).toBeInTheDocument();
      });
      
      // Second click - close
      fireEvent.click(operationsButton);
      await waitFor(() => {
        expect(screen.queryByText('Services')).not.toBeInTheDocument();
      });
    });
  });

  describe('Alert Display', () => {
    beforeEach(() => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false
      });
    });

    it('displays alert count on system category button', () => {
      render(<ResponsiveManagerMenu {...defaultProps} alertCount={3} />);
      
      const systemButton = screen.getByText('System').closest('button');
      const alertBadge = systemButton?.querySelector('.bg-red-500');
      expect(alertBadge).toHaveTextContent('3');
    });

    it('shows individual alert counts in dropdown items', async () => {
      render(<ResponsiveManagerMenu {...defaultProps} alertCount={7} />);
      
      const systemButton = screen.getByText('System');
      fireEvent.click(systemButton);
      
      await waitFor(() => {
        const alertsItem = screen.getByText(/Alerts/).closest('button');
        const alertBadge = alertsItem?.querySelector('.bg-red-500');
        expect(alertBadge).toHaveTextContent('7');
      });
    });

    it('handles zero alert count correctly', () => {
      render(<ResponsiveManagerMenu {...defaultProps} alertCount={0} />);
      
      const systemButton = screen.getByText('System').closest('button');
      const alertBadge = systemButton?.querySelector('.bg-red-500');
      expect(alertBadge).toBeNull();
    });
  });
});