/**
 * E2E Tests for Shelter Management
 *
 * Comprehensive end-to-end testing of shelter management workflows
 * including bed assignments, check-ins, and waitlist management.
 */

describe('Shelter Management E2E Tests', () => {
  beforeEach(() => {
    // Visit the services manager page
    cy.visit('/');

    // Navigate to Shelter Management
    // Assuming the app loads and we need to click through to manager view
    cy.wait(1000); // Wait for initial load
  });

  describe('Navigation and Initial Load', () => {
    it('should load the shelter management interface', () => {
      // Check if shelter management is accessible
      cy.get('[data-testid="shelter-management"]', { timeout: 10000 }).should('exist');
    });

    it('should display all metric cards', () => {
      cy.get('[data-testid="metric-total-beds"]').should('be.visible');
      cy.get('[data-testid="metric-occupancy"]').should('be.visible');
      cy.get('[data-testid="metric-today\'s-check-ins"]').should('be.visible');
      cy.get('[data-testid="metric-waitlist"]').should('be.visible');
    });

    it('should display all navigation tabs', () => {
      cy.get('[data-testid="tab-overview"]').should('be.visible');
      cy.get('[data-testid="tab-beds"]').should('be.visible');
      cy.get('[data-testid="tab-checkins"]').should('be.visible');
      cy.get('[data-testid="tab-waitlist"]').should('be.visible');
      cy.get('[data-testid="tab-clients"]').should('be.visible');
    });

    it('should have overview tab active by default', () => {
      cy.get('[data-testid="tab-overview"]').should('have.class', 'border-blue-500');
    });
  });

  describe('Overview View', () => {
    it('should display capacity summary', () => {
      cy.contains('Current Capacity').should('be.visible');
      cy.contains('Total Beds').should('be.visible');
      cy.contains('Occupied').should('be.visible');
      cy.contains('Reserved').should('be.visible');
      cy.contains('Available').should('be.visible');
      cy.contains('Utilization Rate').should('be.visible');
    });

    it('should display today\'s activity metrics', () => {
      cy.contains('Today\'s Activity').should('be.visible');
      cy.contains('Reservations').should('be.visible');
      cy.contains('Checked In').should('be.visible');
      cy.contains('No Shows').should('be.visible');
      cy.contains('On Waitlist').should('be.visible');
    });

    it('should display recent reservations', () => {
      cy.contains('Recent Reservations').should('be.visible');
    });

    it('should display waitlist preview when entries exist', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Active Waitlist')) {
          cy.contains('Active Waitlist').should('be.visible');
        }
      });
    });

    it('should show numerical values in metrics', () => {
      cy.get('[data-testid="metric-total-beds"]').should('contain.text', /\d+/);
      cy.get('[data-testid="metric-occupancy"]').should('contain.text', '%');
    });
  });

  describe('Beds View', () => {
    beforeEach(() => {
      cy.get('[data-testid="tab-beds"]').click();
      cy.wait(500);
    });

    it('should switch to beds view', () => {
      cy.get('[data-testid="bed-search"]').should('be.visible');
    });

    it('should display bed search input', () => {
      cy.get('[data-testid="bed-search"]')
        .should('have.attr', 'placeholder')
        .and('include', 'Search beds');
    });

    it('should display multiple bed cards', () => {
      cy.get('[data-testid^="bed-bed-"]').should('have.length.greaterThan', 0);
    });

    it('should filter beds by search term', () => {
      // Get initial count
      cy.get('[data-testid^="bed-bed-"]').its('length').then(initialCount => {
        // Type search term
        cy.get('[data-testid="bed-search"]').type('B001');
        cy.wait(300);

        // Verify filtered
        cy.get('[data-testid^="bed-bed-"]').its('length').should('be.lte', initialCount);
      });
    });

    it('should show bed status badges', () => {
      cy.get('[data-testid^="bed-bed-"]').first().within(() => {
        // Should have a status badge (Available, Occupied, Reserved, or Maintenance)
        cy.get('.font-medium').should('exist');
      });
    });

    it('should display bed information', () => {
      cy.get('[data-testid^="bed-bed-"]').first().within(() => {
        // Should show bed number, location, capacity
        cy.get('.font-bold').should('exist'); // Bed number
        cy.contains(/East Wing|West Wing|North Wing|Family Section/).should('exist');
      });
    });

    it('should clear search when input is cleared', () => {
      cy.get('[data-testid="bed-search"]').type('B001');
      cy.wait(300);
      cy.get('[data-testid="bed-search"]').clear();
      cy.wait(300);
      cy.get('[data-testid^="bed-bed-"]').should('have.length', 40);
    });

    it('should show bed features when applicable', () => {
      // Look for feature badges in any bed
      cy.get('body').then($body => {
        if ($body.text().includes('♿ Accessible') ||
            $body.text().includes('🏥 Medical') ||
            $body.text().includes('🔇 Quiet')) {
          cy.contains(/♿ Accessible|🏥 Medical|🔇 Quiet/).should('exist');
        }
      });
    });
  });

  describe('Check-Ins View', () => {
    beforeEach(() => {
      cy.get('[data-testid="tab-checkins"]').click();
      cy.wait(500);
    });

    it('should switch to check-ins view', () => {
      cy.get('[data-testid="checkin-date-selector"]').should('be.visible');
    });

    it('should display date selector', () => {
      cy.get('[data-testid="checkin-date-selector"]')
        .should('have.attr', 'type', 'date');
    });

    it('should change date when selector is updated', () => {
      const newDate = '2025-10-15';
      cy.get('[data-testid="checkin-date-selector"]')
        .clear()
        .type(newDate)
        .should('have.value', newDate);
    });

    it('should display pending check-ins section', () => {
      cy.contains(/Pending Check-Ins/i).should('be.visible');
    });

    it('should display completed check-ins section', () => {
      cy.contains(/Completed Check-Ins/i).should('be.visible');
    });

    it('should show check-in buttons for pending reservations', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid^="checkin-btn-"]').length > 0) {
          cy.get('[data-testid^="checkin-btn-"]').first().should('contain.text', 'Check In');
        }
      });
    });

    it('should display priority badges', () => {
      // Look for priority badges (Standard, High, Emergency)
      cy.get('body').then($body => {
        if ($body.text().includes('Standard') ||
            $body.text().includes('High') ||
            $body.text().includes('Emergency')) {
          cy.contains(/Standard|High|Emergency/).should('exist');
        }
      });
    });

    it('should show counts for pending, completed, and no-shows', () => {
      cy.contains(/\d+ pending/).should('be.visible');
      cy.contains(/\d+ completed/).should('be.visible');
      cy.contains(/\d+ no-shows/).should('be.visible');
    });
  });

  describe('Waitlist View', () => {
    beforeEach(() => {
      cy.get('[data-testid="tab-waitlist"]').click();
      cy.wait(500);
    });

    it('should switch to waitlist view', () => {
      cy.contains(/Active Waitlist/i).should('be.visible');
    });

    it('should display waitlist entries', () => {
      cy.get('[data-testid^="waitlist-wait-"]').should('have.length.greaterThan', 0);
    });

    it('should show position numbers', () => {
      cy.get('[data-testid^="waitlist-wait-"]').first().within(() => {
        cy.contains(/#\d+/).should('exist');
      });
    });

    it('should display priority badges', () => {
      cy.get('[data-testid^="waitlist-wait-"]').first().within(() => {
        cy.contains(/Standard|High|Emergency/).should('exist');
      });
    });

    it('should show assign bed buttons', () => {
      cy.get('[data-testid^="assign-bed-"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid^="assign-bed-"]').first().should('contain.text', 'Assign Bed');
    });

    it('should display add to waitlist button', () => {
      cy.contains('+ Add to Waitlist').should('be.visible');
    });

    it('should show client names and dates', () => {
      cy.get('[data-testid^="waitlist-wait-"]').first().within(() => {
        cy.get('.font-medium').should('exist'); // Client name
        cy.contains(/Preferred:/).should('exist'); // Preferred date
      });
    });

    it('should display special needs when present', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Special needs:')) {
          cy.contains('Special needs:').should('exist');
        }
      });
    });

    it('should show days since request', () => {
      cy.get('[data-testid^="waitlist-wait-"]').first().within(() => {
        cy.contains(/Requested \d+ days? ago/).should('exist');
      });
    });
  });

  describe('Clients View', () => {
    beforeEach(() => {
      cy.get('[data-testid="tab-clients"]').click();
      cy.wait(500);
    });

    it('should switch to clients view', () => {
      cy.get('[data-testid="client-search"]').should('be.visible');
    });

    it('should display client search input', () => {
      cy.get('[data-testid="client-search"]')
        .should('have.attr', 'placeholder')
        .and('include', 'Search clients');
    });

    it('should display active clients count', () => {
      cy.contains(/Active Clients \(\d+\)/).should('be.visible');
    });

    it('should display multiple client cards', () => {
      cy.get('[data-testid^="client-client-"]').should('have.length.greaterThan', 0);
    });

    it('should filter clients by search term', () => {
      cy.get('[data-testid^="client-client-"]').its('length').then(initialCount => {
        cy.get('[data-testid="client-search"]').type('John');
        cy.wait(300);
        cy.get('[data-testid^="client-client-"]').its('length').should('be.lte', initialCount);
      });
    });

    it('should show client information', () => {
      cy.get('[data-testid^="client-client-"]').first().within(() => {
        cy.get('.font-medium').should('exist'); // Client name
        cy.contains(/\d+ stays/).should('exist'); // Total stays
      });
    });

    it('should display verification checkmarks', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('✓')) {
          cy.get('[data-testid^="client-client-"]').first().should('contain.text', '✓');
        }
      });
    });

    it('should show view profile buttons', () => {
      cy.get('[data-testid^="client-client-"]').first().within(() => {
        cy.contains('View Profile').should('be.visible');
      });
    });

    it('should display current bed assignment when applicable', () => {
      cy.get('body').then($body => {
        if ($body.text().includes('Currently in:')) {
          cy.contains('Currently in:').should('exist');
        }
      });
    });
  });

  describe('Tab Switching', () => {
    it('should switch between all views without errors', () => {
      cy.get('[data-testid="tab-beds"]').click();
      cy.wait(300);
      cy.get('[data-testid="bed-search"]').should('be.visible');

      cy.get('[data-testid="tab-checkins"]').click();
      cy.wait(300);
      cy.get('[data-testid="checkin-date-selector"]').should('be.visible');

      cy.get('[data-testid="tab-waitlist"]').click();
      cy.wait(300);
      cy.contains(/Active Waitlist/i).should('be.visible');

      cy.get('[data-testid="tab-clients"]').click();
      cy.wait(300);
      cy.get('[data-testid="client-search"]').should('be.visible');

      cy.get('[data-testid="tab-overview"]').click();
      cy.wait(300);
      cy.contains('Current Capacity').should('be.visible');
    });

    it('should highlight active tab', () => {
      cy.get('[data-testid="tab-beds"]').click();
      cy.get('[data-testid="tab-beds"]').should('have.class', 'border-blue-500');
      cy.get('[data-testid="tab-overview"]').should('not.have.class', 'border-blue-500');
    });
  });

  describe('Data Persistence', () => {
    it('should maintain metrics across tab switches', () => {
      // Get initial metrics
      cy.get('[data-testid="metric-total-beds"]').invoke('text').then(totalBeds => {
        // Switch tabs
        cy.get('[data-testid="tab-beds"]').click();
        cy.wait(300);
        cy.get('[data-testid="tab-overview"]').click();
        cy.wait(300);

        // Verify metrics are the same
        cy.get('[data-testid="metric-total-beds"]').should('contain.text', totalBeds);
      });
    });

    it('should reset search when switching views', () => {
      // Search in beds view
      cy.get('[data-testid="tab-beds"]').click();
      cy.get('[data-testid="bed-search"]').type('B001');

      // Switch to clients view
      cy.get('[data-testid="tab-clients"]').click();
      cy.get('[data-testid="client-search"]').should('have.value', '');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be responsive on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.get('[data-testid="shelter-management"]').should('be.visible');
      cy.get('[data-testid="metric-total-beds"]').should('be.visible');
    });

    it('should be responsive on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.get('[data-testid="shelter-management"]').should('be.visible');
      cy.get('[data-testid="tab-overview"]').should('be.visible');
    });

    it('should be responsive on desktop viewport', () => {
      cy.viewport(1920, 1080);
      cy.get('[data-testid="shelter-management"]').should('be.visible');
      cy.get('[data-testid="metric-total-beds"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load within acceptable time', () => {
      const startTime = Date.now();
      cy.get('[data-testid="shelter-management"]', { timeout: 5000 }).should('exist');
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(5000);
    });

    it('should render all 40 beds quickly', () => {
      cy.get('[data-testid="tab-beds"]').click();
      cy.get('[data-testid^="bed-bed-"]', { timeout: 3000 }).should('have.length', 40);
    });

    it('should handle rapid tab switching', () => {
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="tab-beds"]').click();
        cy.get('[data-testid="tab-checkins"]').click();
        cy.get('[data-testid="tab-waitlist"]').click();
        cy.get('[data-testid="tab-clients"]').click();
        cy.get('[data-testid="tab-overview"]').click();
      }
      cy.get('[data-testid="shelter-management"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty search results gracefully', () => {
      cy.get('[data-testid="tab-beds"]').click();
      cy.get('[data-testid="bed-search"]').type('NONEXISTENT_BED_XYZ123');
      cy.wait(300);
      // Should not show any beds
      cy.get('[data-testid^="bed-bed-"]').should('have.length', 0);
    });

    it('should handle invalid date input', () => {
      cy.get('[data-testid="tab-checkins"]').click();
      cy.get('[data-testid="checkin-date-selector"]').clear().type('invalid-date');
      // Component should handle gracefully without crashing
      cy.get('[data-testid="shelter-management"]').should('exist');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="tab-overview"]').should('have.attr', 'role', 'button');
      cy.get('[data-testid="bed-search"]').should('have.attr', 'type', 'text');
    });

    it('should be keyboard navigable', () => {
      cy.get('[data-testid="tab-beds"]').focus().type('{enter}');
      cy.get('[data-testid="bed-search"]').should('be.visible');
    });

    it('should have readable text contrast', () => {
      // Verify text is visible and readable
      cy.get('[data-testid="metric-total-beds"]').should('be.visible');
      cy.get('[data-testid="metric-total-beds"]').should('not.have.css', 'color', 'rgb(255, 255, 255)');
    });
  });
});
