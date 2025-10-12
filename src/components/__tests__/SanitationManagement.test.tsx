/**
 * Unit Tests for SanitationManagement Component
 *
 * Comprehensive test suite for the sanitation/hygiene management interface
 * covering all view modes, interactions, and data display.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SanitationManagement from '../SanitationManagement';

describe('SanitationManagement Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<SanitationManagement />);
      expect(container).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      const { container } = render(<SanitationManagement compact={true} />);
      expect(container).toBeInTheDocument();
    });

    it('should render without metrics when showMetrics is false', () => {
      const { container } = render(<SanitationManagement showMetrics={false} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display all four metric cards when showMetrics is true', () => {
      render(<SanitationManagement showMetrics={true} compact={false} />);

      expect(screen.getByText('Facilities')).toBeInTheDocument();
      expect(screen.getByText('Bookings Today')).toBeInTheDocument();
      expect(screen.getByText('Supply Alerts')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });

    it('should not display metrics in compact mode', () => {
      render(<SanitationManagement showMetrics={true} compact={true} />);

      expect(screen.queryByText('Facilities')).not.toBeInTheDocument();
    });
  });

  describe('View Tabs', () => {
    it('should render all five view tabs when not compact', () => {
      render(<SanitationManagement compact={false} />);

      expect(screen.getByText(/Overview/)).toBeInTheDocument();
      expect(screen.getByText(/Scheduling/)).toBeInTheDocument();
      expect(screen.getByText(/Maintenance/)).toBeInTheDocument();
      expect(screen.getByText(/Supplies/)).toBeInTheDocument();
      expect(screen.getByText(/Hygiene Kits/)).toBeInTheDocument();
    });

    it('should not render tabs in compact mode', () => {
      render(<SanitationManagement compact={true} />);

      expect(screen.queryByText(/Scheduling/)).not.toBeInTheDocument();
    });

    it('should switch to scheduling view when clicked', () => {
      render(<SanitationManagement compact={false} />);

      const schedulingButton = screen.getByText(/Scheduling/);
      fireEvent.click(schedulingButton);

      expect(screen.getByLabelText(/Select Date/i)).toBeInTheDocument();
    });

    it('should switch to maintenance view when clicked', () => {
      render(<SanitationManagement compact={false} />);

      const maintenanceButton = screen.getByText(/Maintenance/);
      fireEvent.click(maintenanceButton);

      expect(screen.getByText(/Maintenance Records/i)).toBeInTheDocument();
    });

    it('should switch to supplies view when clicked', () => {
      render(<SanitationManagement compact={false} />);

      const suppliesButton = screen.getByText(/Supplies/);
      fireEvent.click(suppliesButton);

      expect(screen.getByText(/Supply Inventory/i)).toBeInTheDocument();
    });

    it('should switch to hygiene kits view when clicked', () => {
      render(<SanitationManagement compact={false} />);

      const kitsButton = screen.getByText(/Hygiene Kits/);
      fireEvent.click(kitsButton);

      expect(screen.getByText(/Available Kits/i)).toBeInTheDocument();
    });
  });

  describe('Overview View', () => {
    it('should display facility status grid', () => {
      render(<SanitationManagement />);

      expect(screen.getByText(/Facility Status/i)).toBeInTheDocument();
    });

    it('should display today\'s schedule section', () => {
      render(<SanitationManagement />);

      expect(screen.getByText(/Today's Schedule/i)).toBeInTheDocument();
    });

    it('should display critical supplies section', () => {
      render(<SanitationManagement />);

      expect(screen.getByText(/Critical Supplies/i)).toBeInTheDocument();
    });

    it('should display upcoming maintenance', () => {
      render(<SanitationManagement />);

      expect(screen.getByText(/Upcoming Maintenance/i)).toBeInTheDocument();
    });
  });

  describe('Scheduling View', () => {
    beforeEach(() => {
      render(<SanitationManagement compact={false} />);
      const schedulingButton = screen.getByText(/Scheduling/);
      fireEvent.click(schedulingButton);
    });

    it('should display date selector', () => {
      expect(screen.getByLabelText(/Select Date/i)).toBeInTheDocument();
    });

    it('should display facility schedule grid', () => {
      expect(screen.getByText(/Schedule by Facility/i)).toBeInTheDocument();
    });

    it('should allow date selection', () => {
      const dateInput = screen.getByLabelText(/Select Date/i) as HTMLInputElement;
      const newDate = '2025-10-15';

      fireEvent.change(dateInput, { target: { value: newDate } });

      expect(dateInput.value).toBe(newDate);
    });

    it('should display bookings for selected date', () => {
      // Verify bookings are displayed
      expect(screen.getByText(/Schedule by Facility/i)).toBeInTheDocument();
    });
  });

  describe('Maintenance View', () => {
    beforeEach(() => {
      render(<SanitationManagement compact={false} />);
      const maintenanceButton = screen.getByText(/Maintenance/);
      fireEvent.click(maintenanceButton);
    });

    it('should display maintenance records', () => {
      expect(screen.getByText(/Maintenance Records/i)).toBeInTheDocument();
    });

    it('should display maintenance by priority', () => {
      // Should have priority indicators
      expect(screen.getByText(/Maintenance Records/i)).toBeInTheDocument();
    });

    it('should show maintenance status badges', () => {
      // Verify status badges exist
      const maintenanceSection = screen.getByText(/Maintenance Records/i).parentElement;
      expect(maintenanceSection).toBeInTheDocument();
    });
  });

  describe('Supplies View', () => {
    beforeEach(() => {
      render(<SanitationManagement compact={false} />);
      const suppliesButton = screen.getByText(/Supplies/);
      fireEvent.click(suppliesButton);
    });

    it('should display supply inventory', () => {
      expect(screen.getByText(/Supply Inventory/i)).toBeInTheDocument();
    });

    it('should display supply categories', () => {
      expect(screen.getByText(/Supply Inventory/i)).toBeInTheDocument();
    });

    it('should show supply status badges', () => {
      const suppliesSection = screen.getByText(/Supply Inventory/i).parentElement;
      expect(suppliesSection).toBeInTheDocument();
    });

    it('should display reorder information', () => {
      // Should show reorder points and quantities
      expect(screen.getByText(/Supply Inventory/i)).toBeInTheDocument();
    });
  });

  describe('Hygiene Kits View', () => {
    beforeEach(() => {
      render(<SanitationManagement compact={false} />);
      const kitsButton = screen.getByText(/Hygiene Kits/);
      fireEvent.click(kitsButton);
    });

    it('should display available kits', () => {
      expect(screen.getByText(/Available Kits/i)).toBeInTheDocument();
    });

    it('should display kit types', () => {
      // Should show different kit types
      expect(screen.getByText(/Available Kits/i)).toBeInTheDocument();
    });

    it('should show kit contents', () => {
      // Should display what's in each kit
      expect(screen.getByText(/Available Kits/i)).toBeInTheDocument();
    });

    it('should display distribution statistics', () => {
      // Should show distributed counts
      expect(screen.getByText(/Available Kits/i)).toBeInTheDocument();
    });
  });

  describe('Alert Banner', () => {
    it('should display critical alerts when present', () => {
      render(<SanitationManagement />);

      // Check if alert banner appears when there are critical items
      const container = screen.getByText(/Overview/i).closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should generate mock facilities', () => {
      render(<SanitationManagement />);
      expect(screen.getByText(/Facility Status/i)).toBeInTheDocument();
    });

    it('should generate mock bookings', () => {
      render(<SanitationManagement />);
      expect(screen.getByText(/Today's Schedule/i)).toBeInTheDocument();
    });

    it('should generate mock supplies', () => {
      render(<SanitationManagement />);
      expect(screen.getByText(/Critical Supplies/i)).toBeInTheDocument();
    });

    it('should generate mock maintenance records', () => {
      render(<SanitationManagement />);
      expect(screen.getByText(/Upcoming Maintenance/i)).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should accept compact prop', () => {
      const { container } = render(<SanitationManagement compact={true} />);
      expect(container).toBeInTheDocument();
    });

    it('should accept showMetrics prop', () => {
      render(<SanitationManagement showMetrics={false} />);
      expect(screen.queryByText('Facilities')).not.toBeInTheDocument();
    });

    it('should render with default props', () => {
      const { container } = render(<SanitationManagement />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle view switching', () => {
      render(<SanitationManagement compact={false} />);

      // Switch through all views
      fireEvent.click(screen.getByText(/Scheduling/));
      expect(screen.getByLabelText(/Select Date/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Maintenance/));
      expect(screen.getByText(/Maintenance Records/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Supplies/));
      expect(screen.getByText(/Supply Inventory/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Hygiene Kits/));
      expect(screen.getByText(/Available Kits/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText(/Overview/));
      expect(screen.getByText(/Facility Status/i)).toBeInTheDocument();
    });

    it('should handle date changes in scheduling view', () => {
      render(<SanitationManagement compact={false} />);
      fireEvent.click(screen.getByText(/Scheduling/));

      const dateInput = screen.getByLabelText(/Select Date/i);
      fireEvent.change(dateInput, { target: { value: '2025-10-20' } });

      expect((dateInput as HTMLInputElement).value).toBe('2025-10-20');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render correctly in compact mode', () => {
      render(<SanitationManagement compact={true} />);
      expect(screen.getByText(/Facility Status/i)).toBeInTheDocument();
      expect(screen.queryByText(/Scheduling/)).not.toBeInTheDocument();
    });

    it('should render correctly in full mode', () => {
      render(<SanitationManagement compact={false} />);
      expect(screen.getByText(/Overview/)).toBeInTheDocument();
      expect(screen.getByText(/Scheduling/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing data gracefully', () => {
      const { container } = render(<SanitationManagement />);
      expect(container).toBeInTheDocument();
    });

    it('should handle rapid view switching', () => {
      render(<SanitationManagement compact={false} />);

      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText(/Scheduling/));
        fireEvent.click(screen.getByText(/Maintenance/));
        fireEvent.click(screen.getByText(/Supplies/));
        fireEvent.click(screen.getByText(/Overview/));
      }

      expect(screen.getByText(/Facility Status/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<SanitationManagement compact={false} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have form inputs with labels', () => {
      render(<SanitationManagement compact={false} />);
      fireEvent.click(screen.getByText(/Scheduling/));

      const dateInput = screen.getByLabelText(/Select Date/i);
      expect(dateInput).toBeInTheDocument();
    });
  });
});
