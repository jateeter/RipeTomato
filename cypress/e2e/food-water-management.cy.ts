/**
 * E2E Tests for Food & Water Management
 *
 * Tests the complete workflow for staff food and water management including:
 * - Dashboard navigation and display
 * - Status monitoring and statistics
 * - Issue reporting workflow
 * - Alert acknowledgment
 * - Distribution tracking
 * - Inventory viewing
 */

describe('Food & Water Management System', () => {
  beforeEach(() => {
    // Visit the main application
    cy.visit('http://localhost:3000');
    cy.wait(1000);
  });

  describe('Dashboard Navigation', () => {
    it('should navigate to food & water dashboard from Services Manager', () => {
      // Open Manager Menu
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);

      // Look for Food & Water tab/button
      // Note: This assumes there's a way to access the food & water dashboard
      // If it's integrated into Services Manager, we may need to look for a specific tab
      cy.contains(/Food.*Water|Food & Water/i).should('exist');
    });

    it('should display loading state initially', () => {
      // If we can directly access the dashboard component
      // This test would verify the loading state appears briefly
      cy.contains(/loading/i, { timeout: 1000 }).should('exist');
    });
  });

  describe('Status Cards Display', () => {
    beforeEach(() => {
      // Navigate to food & water dashboard
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
    });

    it('should display all four status cards', () => {
      // Food Inventory Card
      cy.contains('Food Inventory').should('be.visible');
      cy.get('[data-testid="food-total"]').should('exist');

      // Water Supply Card
      cy.contains('Water Supply').should('be.visible');
      cy.get('[data-testid="water-total"]').should('exist');

      // Active Issues Card
      cy.contains('Active Issues').should('be.visible');
      cy.get('[data-testid="issues-open"]').should('exist');

      // Distribution Today Card
      cy.contains(/Distribution|Distributed/i).should('be.visible');
      cy.get('[data-testid="distribution-today"]').should('exist');
    });

    it('should display valid statistics in status cards', () => {
      // Food inventory should show numbers
      cy.get('[data-testid="food-total"]').invoke('text').then((text) => {
        const count = parseInt(text);
        expect(count).to.be.a('number');
        expect(count).to.be.greaterThan(0);
      });

      // Water supply should show gallons
      cy.get('[data-testid="water-total"]').invoke('text').then((text) => {
        const gallons = parseInt(text.replace(/,/g, ''));
        expect(gallons).to.be.a('number');
        expect(gallons).to.be.greaterThan(0);
      });

      // Issues count should be valid
      cy.get('[data-testid="issues-open"]').invoke('text').then((text) => {
        const count = parseInt(text);
        expect(count).to.be.a('number');
        expect(count).to.be.at.least(0);
      });
    });

    it('should display color-coded status indicators', () => {
      // Check for adequate stock (green)
      cy.contains(/adequate|good/i).should('exist');

      // Status indicators should have appropriate colors
      cy.get('.text-green-600, .text-yellow-600, .text-red-600').should('exist');
    });
  });

  describe('Alerts Banner', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
    });

    it('should display active alerts when present', () => {
      // Look for alerts banner
      cy.get('[data-testid="alerts-banner"]').then(($banner) => {
        if ($banner.length > 0) {
          // If alerts exist, verify structure
          cy.get('[data-testid^="alert-"]').should('have.length.at.least', 1);
        }
      });
    });

    it('should allow acknowledging alerts', () => {
      // Find first unacknowledged alert if exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="acknowledge-alert-"]').length > 0) {
          // Click acknowledge button
          cy.get('[data-testid^="acknowledge-alert-"]').first().click();
          cy.wait(300);

          // Alert should be marked as acknowledged or disappear
          cy.contains(/acknowledged|dismissed/i).should('exist');
        }
      });
    });

    it('should display different severity levels with appropriate colors', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="alerts-banner"]').length > 0) {
          // Check for severity indicators
          cy.get('[data-testid="alerts-banner"]').within(() => {
            // Should have colored indicators (warning, error, critical)
            cy.get('.bg-yellow-50, .bg-red-50, .bg-orange-50').should('exist');
          });
        }
      });
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
    });

    it('should switch between all five tabs', () => {
      const tabs = ['Overview', 'Food', 'Water', 'Issues', 'Distribution'];

      tabs.forEach((tab) => {
        cy.get(`[data-testid="tab-${tab.toLowerCase()}"]`).click();
        cy.wait(300);

        // Verify active state
        cy.get(`[data-testid="tab-${tab.toLowerCase()}"]`)
          .should('have.class', 'border-blue-500')
          .or('have.class', 'text-blue-600');
      });
    });

    it('should maintain active tab state', () => {
      // Click Food tab
      cy.get('[data-testid="tab-food"]').click();
      cy.wait(300);

      // Verify it stays active
      cy.get('[data-testid="tab-food"]').should('have.class', 'text-blue-600');

      // Click another element
      cy.get('[data-testid="food-total"]').click({ force: true });

      // Food tab should still be active
      cy.get('[data-testid="tab-food"]').should('have.class', 'text-blue-600');
    });
  });

  describe('Overview Tab', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
      cy.get('[data-testid="tab-overview"]').click();
      cy.wait(300);
    });

    it('should display key metrics section', () => {
      cy.contains('Key Metrics').should('be.visible');
      cy.contains(/inventory|stock/i).should('be.visible');
    });

    it('should display recent activity section', () => {
      cy.contains(/recent|activity/i).should('be.visible');
    });

    it('should show expiration warnings', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('Expiring')) {
          cy.contains(/expiring|expires/i).should('be.visible');
        }
      });
    });
  });

  describe('Food Inventory Tab', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
      cy.get('[data-testid="tab-food"]').click();
      cy.wait(300);
    });

    it('should display food items list', () => {
      // Should show at least one food item
      cy.get('[data-testid^="food-item-"]').should('have.length.at.least', 1);
    });

    it('should show food item details', () => {
      // First food item should have all key information
      cy.get('[data-testid^="food-item-"]').first().within(() => {
        // Name
        cy.get('[data-testid$="-name"]').should('exist');
        // Quantity
        cy.get('[data-testid$="-quantity"]').should('exist');
        // Status
        cy.get('[data-testid$="-status"]').should('exist');
        // Location
        cy.contains(/location|stored/i).should('exist');
      });
    });

    it('should filter by food category', () => {
      // If category filter exists
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="category-filter"]').length > 0) {
          cy.get('[data-testid="category-filter"]').click();
          cy.contains('Fresh').click();
          cy.wait(300);

          // Should show only fresh items
          cy.get('[data-testid^="food-item-"]').should('have.length.at.least', 1);
        }
      });
    });

    it('should display expiration dates', () => {
      cy.get('[data-testid^="food-item-"]').first().within(() => {
        // Should show expiration info
        cy.get('body').then(($body) => {
          const text = $body.text();
          if (text.includes('Expires') || text.includes('Expiration')) {
            cy.contains(/expires|expiration/i).should('be.visible');
          }
        });
      });
    });

    it('should show status color indicators', () => {
      // Items should have colored status badges
      cy.get('[data-testid^="food-item-"]').first().within(() => {
        cy.get('.bg-green-100, .bg-yellow-100, .bg-red-100, .bg-orange-100').should('exist');
      });
    });
  });

  describe('Water Supply Tab', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
      cy.get('[data-testid="tab-water"]').click();
      cy.wait(300);
    });

    it('should display water items list', () => {
      cy.get('[data-testid^="water-item-"]').should('have.length.at.least', 1);
    });

    it('should show water safety test results', () => {
      cy.get('[data-testid^="water-item-"]').first().within(() => {
        // Should have test results or safety indicator
        cy.get('body').then(($body) => {
          if ($body.text().includes('Safe') || $body.text().includes('Test')) {
            cy.contains(/safe|test|quality/i).should('be.visible');
          }
        });
      });
    });

    it('should display water types', () => {
      // Should show different water types (bottled, bulk, filtered, municipal)
      cy.get('[data-testid^="water-item-"]').first().within(() => {
        cy.contains(/bottled|bulk|filtered|municipal/i).should('be.visible');
      });
    });

    it('should show quantity in gallons', () => {
      cy.get('[data-testid^="water-item-"]').first().within(() => {
        cy.get('[data-testid$="-quantity"]').invoke('text').then((text) => {
          expect(text).to.match(/gallon|liter|bottle/i);
        });
      });
    });
  });

  describe('Issues Tab', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
      cy.get('[data-testid="tab-issues"]').click();
      cy.wait(300);
    });

    it('should display issues list', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="issue-"]').length > 0) {
          cy.get('[data-testid^="issue-"]').should('have.length.at.least', 1);
        } else {
          // Or show "no issues" message
          cy.contains(/no issues|no problems|all clear/i).should('be.visible');
        }
      });
    });

    it('should show Report Issue button', () => {
      cy.contains('button', /report issue|new issue|add issue/i).should('be.visible');
    });

    it('should display issue priority levels', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="issue-"]').length > 0) {
          cy.get('[data-testid^="issue-"]').first().within(() => {
            cy.contains(/low|medium|high|critical/i).should('be.visible');
          });
        }
      });
    });

    it('should display issue status', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="issue-"]').length > 0) {
          cy.get('[data-testid^="issue-"]').first().within(() => {
            cy.contains(/open|in progress|resolved|closed/i).should('be.visible');
          });
        }
      });
    });

    it('should filter issues by status', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="status-filter"]').length > 0) {
          cy.get('[data-testid="status-filter"]').click();
          cy.contains('Open').click();
          cy.wait(300);

          // Should show only open issues
          cy.get('[data-testid^="issue-"]').each(($issue) => {
            cy.wrap($issue).should('contain', 'Open');
          });
        }
      });
    });
  });

  describe('Issue Reporting Workflow', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
      cy.get('[data-testid="tab-issues"]').click();
      cy.wait(300);
    });

    it('should open issue reporting modal', () => {
      cy.contains('button', /report issue|new issue/i).click();
      cy.wait(300);

      // Modal should appear
      cy.get('[data-testid="issue-modal"]').should('be.visible');
    });

    it('should allow selecting issue type', () => {
      cy.contains('button', /report issue|new issue/i).click();
      cy.wait(300);

      cy.get('[data-testid="issue-type"]').click();
      cy.contains('Shortage').should('be.visible');
      cy.contains('Quality').should('be.visible');
      cy.contains('Expiration').should('be.visible');
    });

    it('should allow selecting priority level', () => {
      cy.contains('button', /report issue|new issue/i).click();
      cy.wait(300);

      cy.get('[data-testid="issue-priority"]').click();
      cy.contains('Low').should('be.visible');
      cy.contains('Medium').should('be.visible');
      cy.contains('High').should('be.visible');
      cy.contains('Critical').should('be.visible');
    });

    it('should validate required fields', () => {
      cy.contains('button', /report issue|new issue/i).click();
      cy.wait(300);

      // Try to submit without filling fields
      cy.contains('button', 'Submit').click();

      // Should show validation errors
      cy.contains(/required|must|field/i).should('be.visible');
    });

    it('should submit issue successfully', () => {
      cy.contains('button', /report issue|new issue/i).click();
      cy.wait(300);

      // Fill out form
      cy.get('[data-testid="issue-type"]').click();
      cy.contains('Shortage').click();

      cy.get('[data-testid="issue-category"]').click();
      cy.contains('Food').click();

      cy.get('[data-testid="issue-priority"]').click();
      cy.contains('High').click();

      cy.get('[data-testid="issue-title"]').type('Low stock of fresh produce');
      cy.get('[data-testid="issue-description"]').type('Running low on apples and oranges');

      // Submit
      cy.contains('button', 'Submit').click();
      cy.wait(500);

      // Should show success message
      cy.contains(/success|submitted|reported/i).should('be.visible');
    });
  });

  describe('Distribution Tab', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
      cy.get('[data-testid="tab-distribution"]').click();
      cy.wait(300);
    });

    it('should display distribution statistics', () => {
      cy.contains(/today|this week|this month/i).should('be.visible');
      cy.get('[data-testid="distribution-today"]').should('exist');
    });

    it('should show distribution history', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="distribution-"]').length > 0) {
          cy.get('[data-testid^="distribution-"]').should('have.length.at.least', 1);
        } else {
          cy.contains(/no distributions|no records/i).should('be.visible');
        }
      });
    });

    it('should display distribution details', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid^="distribution-"]').length > 0) {
          cy.get('[data-testid^="distribution-"]').first().within(() => {
            // Should show item name, quantity, recipient
            cy.get('[data-testid$="-item"]').should('exist');
            cy.get('[data-testid$="-quantity"]').should('exist');
            cy.contains(/client|facility|staff/i).should('exist');
          });
        }
      });
    });

    it('should show Record Distribution button', () => {
      cy.contains('button', /record|add distribution|new distribution/i).should('be.visible');
    });

    it('should filter by date range', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="date-filter"]').length > 0) {
          cy.get('[data-testid="date-filter"]').click();
          cy.contains('Today').should('be.visible');
          cy.contains('This Week').should('be.visible');
          cy.contains('This Month').should('be.visible');
        }
      });
    });
  });

  describe('Data Persistence', () => {
    it('should maintain state across page refreshes', () => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);

      // Get initial food count
      cy.get('[data-testid="food-total"]').invoke('text').then((initialCount) => {
        // Refresh page
        cy.reload();
        cy.wait(1000);

        // Navigate back to dashboard
        cy.contains('button', 'Manager Menu 👔').click();
        cy.wait(500);

        // Count should be the same
        cy.get('[data-testid="food-total"]').should('have.text', initialCount);
      });
    });
  });

  describe('Performance', () => {
    it('should load dashboard within 3 seconds', () => {
      const startTime = Date.now();

      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);

      // Wait for status cards to be visible
      cy.get('[data-testid="food-total"]', { timeout: 3000 }).should('be.visible');

      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(3000);
    });

    it('should switch between tabs quickly', () => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);

      const startTime = Date.now();

      // Switch between all tabs
      cy.get('[data-testid="tab-food"]').click();
      cy.get('[data-testid="tab-water"]').click();
      cy.get('[data-testid="tab-issues"]').click();
      cy.get('[data-testid="tab-distribution"]').click();
      cy.get('[data-testid="tab-overview"]').click();

      const switchTime = Date.now() - startTime;
      expect(switchTime).to.be.lessThan(2000);
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.reload();
      cy.wait(1000);

      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);

      // Status cards should stack vertically
      cy.get('[data-testid="food-total"]').should('be.visible');
      cy.get('[data-testid="water-total"]').should('be.visible');
    });

    it('should display correctly on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.reload();
      cy.wait(1000);

      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);

      // Dashboard should be visible and usable
      cy.get('[data-testid="food-total"]').should('be.visible');
      cy.get('[data-testid="tab-food"]').should('be.visible').click();
      cy.wait(300);
      cy.get('[data-testid^="food-item-"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.contains('button', 'Manager Menu 👔').click();
      cy.wait(500);
    });

    it('should support keyboard navigation', () => {
      // Tab through elements
      cy.get('body').tab();
      cy.focused().should('exist');

      // Navigate to tabs
      cy.get('[data-testid="tab-food"]').focus().type('{enter}');
      cy.wait(300);
      cy.get('[data-testid="tab-food"]').should('have.class', 'text-blue-600');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="food-total"]').parent().should('have.attr', 'role');
      cy.get('[data-testid="tab-food"]').should('have.attr', 'role', 'tab');
    });

    it('should have sufficient color contrast', () => {
      // Status indicators should be clearly visible
      cy.get('.text-green-600').should('be.visible');
      cy.get('.text-yellow-600').should('be.visible');
      cy.get('.text-red-600').should('be.visible');
    });
  });
});
