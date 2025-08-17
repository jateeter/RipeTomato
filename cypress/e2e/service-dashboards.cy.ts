/**
 * Service Dashboards E2E Tests
 * 
 * Tests navigation and functionality of the service dashboards system
 */

describe('Service Dashboards Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
    
    // Wait for the app to load and click on the Manager role to ensure we have access
    cy.get('button').contains('Manager').click();
    
    // Switch to service dashboards tab within the ServicesManager
    cy.get('[data-testid="tab-service_dashboards"]').click();
    
    // Wait for the hub to load
    cy.get('[data-testid="service-dashboards-hub"]').should('be.visible');
  });

  describe('Initial Dashboard State', () => {
    it('should load the service dashboards hub correctly', () => {
      cy.get('[data-testid="service-dashboards-hub"]').should('be.visible');
      cy.contains('Service Dashboards').should('be.visible');
      cy.contains('Real-time monitoring via agent foraging').should('be.visible');
    });

    it('should display all service navigation buttons', () => {
      cy.get('[data-testid="service-all"]').should('be.visible').and('contain', 'All Services');
      cy.get('[data-testid="service-shelter"]').should('be.visible').and('contain', 'Shelters');
      cy.get('[data-testid="service-food"]').should('be.visible').and('contain', 'Food');
      cy.get('[data-testid="service-hygiene"]').should('be.visible').and('contain', 'Hygiene');
      cy.get('[data-testid="service-transportation"]').should('be.visible').and('contain', 'Transport');
    });

    it('should show overview mode by default', () => {
      cy.get('[data-testid="view-overview"]').should('have.class', 'bg-white');
      cy.get('[data-testid="view-detailed"]').should('not.have.class', 'bg-white');
    });

    it('should show all services by default', () => {
      cy.get('[data-testid="service-all"]').should('have.class', 'bg-blue-600');
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      cy.get('[data-testid="food-dashboard"]').should('be.visible');
      cy.get('[data-testid="hygiene-dashboard"]').should('be.visible');
      cy.get('[data-testid="transportation-dashboard"]').should('be.visible');
    });
  });

  describe('View Mode Switching', () => {
    it('should switch between overview and detailed view modes', () => {
      // Start in overview mode
      cy.get('[data-testid="view-overview"]').should('have.class', 'bg-white');
      
      // Switch to detailed view
      cy.get('[data-testid="view-detailed"]').click();
      cy.get('[data-testid="view-detailed"]').should('have.class', 'bg-white');
      cy.get('[data-testid="view-overview"]').should('not.have.class', 'bg-white');
      
      // Switch back to overview
      cy.get('[data-testid="view-overview"]').click();
      cy.get('[data-testid="view-overview"]').should('have.class', 'bg-white');
      cy.get('[data-testid="view-detailed"]').should('not.have.class', 'bg-white');
    });

    it('should show agent details section only in detailed view', () => {
      // Overview mode - no agent details
      cy.get('[data-testid="view-overview"]').click();
      cy.contains('Foraging Agents').should('not.exist');
      
      // Detailed mode - should show agent details
      cy.get('[data-testid="view-detailed"]').click();
      cy.contains('Foraging Agents').should('be.visible');
      cy.get('[data-testid*="agent-"]').should('have.length.at.least', 1);
    });
  });

  describe('Service Navigation', () => {
    it('should navigate between different service types', () => {
      // Test shelter navigation
      cy.get('[data-testid="service-shelter"]').click();
      cy.get('[data-testid="service-shelter"]').should('have.class', 'text-white');
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      cy.get('[data-testid="food-dashboard"]').should('not.exist');
      
      // Test food navigation
      cy.get('[data-testid="service-food"]').click();
      cy.get('[data-testid="service-food"]').should('have.class', 'text-white');
      cy.get('[data-testid="food-dashboard"]').should('be.visible');
      cy.get('[data-testid="shelter-dashboard"]').should('not.exist');
      
      // Test hygiene navigation
      cy.get('[data-testid="service-hygiene"]').click();
      cy.get('[data-testid="service-hygiene"]').should('have.class', 'text-white');
      cy.get('[data-testid="hygiene-dashboard"]').should('be.visible');
      cy.get('[data-testid="food-dashboard"]').should('not.exist');
      
      // Test transportation navigation
      cy.get('[data-testid="service-transportation"]').click();
      cy.get('[data-testid="service-transportation"]').should('have.class', 'text-white');
      cy.get('[data-testid="transportation-dashboard"]').should('be.visible');
      cy.get('[data-testid="hygiene-dashboard"]').should('not.exist');
      
      // Return to all services
      cy.get('[data-testid="service-all"]').click();
      cy.get('[data-testid="service-all"]').should('have.class', 'bg-blue-600');
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      cy.get('[data-testid="food-dashboard"]').should('be.visible');
      cy.get('[data-testid="hygiene-dashboard"]').should('be.visible');
      cy.get('[data-testid="transportation-dashboard"]').should('be.visible');
    });

    it('should maintain view mode when switching services', () => {
      // Switch to detailed view
      cy.get('[data-testid="view-detailed"]').click();
      
      // Navigate to different service
      cy.get('[data-testid="service-shelter"]').click();
      
      // Should still be in detailed view
      cy.get('[data-testid="view-detailed"]').should('have.class', 'bg-white');
      cy.contains('Foraging Agents').should('be.visible');
    });
  });

  describe('Individual Dashboard Functionality', () => {
    beforeEach(() => {
      // Navigate to shelter dashboard for detailed testing
      cy.get('[data-testid="service-shelter"]').click();
    });

    it('should display shelter dashboard metrics', () => {
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      cy.get('[data-testid="shelter-total-locations"]').should('be.visible');
      cy.get('[data-testid="shelter-operational"]').should('be.visible');
      cy.get('[data-testid="shelter-utilization"]').should('be.visible');
      cy.get('[data-testid="shelter-quality"]').should('be.visible');
    });

    it('should have working auto-refresh toggle', () => {
      cy.get('[data-testid="shelter-auto-refresh"]').should('be.visible').and('contain', 'Live');
      
      // Toggle auto-refresh off
      cy.get('[data-testid="shelter-auto-refresh"]').click();
      cy.get('[data-testid="shelter-auto-refresh"]').should('contain', 'Paused');
      
      // Toggle auto-refresh back on
      cy.get('[data-testid="shelter-auto-refresh"]').click();
      cy.get('[data-testid="shelter-auto-refresh"]').should('contain', 'Live');
    });

    it('should have working manual refresh button', () => {
      cy.get('[data-testid="shelter-refresh"]').should('be.visible').and('contain', 'Refresh');
      
      // Click refresh button
      cy.get('[data-testid="shelter-refresh"]').click();
      
      // Should still be visible (indicating the dashboard refreshed without errors)
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
    });

    it('should show detailed metrics in non-compact mode', () => {
      // Switch to detailed view to see full metrics
      cy.get('[data-testid="view-detailed"]').click();
      
      // Should show agent metrics section
      cy.contains('Agent Metrics').should('be.visible');
      cy.get('[data-testid*="metric-"]').should('have.length.at.least', 1);
    });

    it('should display alerts if present', () => {
      // Check for alerts section (may or may not have active alerts)
      cy.get('[data-testid="shelter-dashboard"]').within(() => {
        cy.get('body').then($body => {
          if ($body.find('[data-testid*="alert-"]').length > 0) {
            cy.contains('Active Alerts').should('be.visible');
            cy.get('[data-testid*="alert-"]').should('be.visible');
          }
        });
      });
    });

    it('should show last updated timestamp', () => {
      cy.get('[data-testid="shelter-dashboard"]').should('contain', 'Last updated:');
    });
  });

  describe('System Status Indicators', () => {
    it('should display system status information', () => {
      cy.contains('All systems operational').should('be.visible')
        .or(cy.contains('Systems running normally').should('be.visible'))
        .or(cy.contains('Limited monitoring coverage').should('be.visible'));
      
      // Should show system status indicator dot
      cy.get('.w-3.h-3.rounded-full').should('be.visible');
    });

    it('should display agent statistics', () => {
      cy.contains('Active Agents').should('be.visible');
      cy.contains('Total Scans').should('be.visible');
      cy.contains('Avg Accuracy').should('be.visible');
      cy.contains('Coverage').should('be.visible');
    });
  });

  describe('Agent Details in Detailed View', () => {
    beforeEach(() => {
      cy.get('[data-testid="view-detailed"]').click();
    });

    it('should show foraging agents section', () => {
      cy.contains('Foraging Agents').should('be.visible');
      cy.get('[data-testid*="agent-"]').should('have.length.at.least', 1);
    });

    it('should display agent information', () => {
      cy.get('[data-testid*="agent-"]').first().within(() => {
        cy.contains('Type:').should('be.visible');
        cy.contains('Reliability:').should('be.visible');
        cy.contains('Accuracy:').should('be.visible');
        cy.contains('Scans:').should('be.visible');
      });
    });

    it('should show agent activity status indicators', () => {
      cy.get('[data-testid*="agent-"]').each($agent => {
        cy.wrap($agent).find('.w-2.h-2.rounded-full').should('be.visible');
      });
    });

    it('should display agent specialties as icons', () => {
      cy.get('[data-testid*="agent-"]').first().within(() => {
        // Should have at least one specialty icon
        cy.get('.bg-white.px-1.py-0\\.5.rounded.text-xs').should('have.length.at.least', 1);
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should adapt to different viewport sizes', () => {
      // Test desktop layout
      cy.viewport(1280, 720);
      cy.get('[data-testid="service-dashboards-hub"]').should('be.visible');
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      
      // Test tablet layout
      cy.viewport(768, 1024);
      cy.get('[data-testid="service-dashboards-hub"]').should('be.visible');
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      
      // Test mobile layout
      cy.viewport(375, 667);
      cy.get('[data-testid="service-dashboards-hub"]').should('be.visible');
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle navigation gracefully if components fail to load', () => {
      // Navigate through all services to ensure no crashes
      cy.get('[data-testid="service-shelter"]').click();
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      
      cy.get('[data-testid="service-food"]').click();
      cy.get('[data-testid="food-dashboard"]').should('be.visible');
      
      cy.get('[data-testid="service-hygiene"]').click();
      cy.get('[data-testid="hygiene-dashboard"]').should('be.visible');
      
      cy.get('[data-testid="service-transportation"]').click();
      cy.get('[data-testid="transportation-dashboard"]').should('be.visible');
      
      // Return to all services
      cy.get('[data-testid="service-all"]').click();
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
    });
  });

  describe('Performance and Loading', () => {
    it('should load dashboards within reasonable time', () => {
      // Navigate to service and ensure it loads quickly
      cy.get('[data-testid="service-shelter"]').click();
      cy.get('[data-testid="shelter-dashboard"]', { timeout: 5000 }).should('be.visible');
      
      // Switch services and ensure quick transition
      cy.get('[data-testid="service-food"]').click();
      cy.get('[data-testid="food-dashboard"]', { timeout: 2000 }).should('be.visible');
    });

    it('should handle rapid navigation between services', () => {
      // Rapidly click through services
      cy.get('[data-testid="service-shelter"]').click();
      cy.get('[data-testid="service-food"]').click();
      cy.get('[data-testid="service-hygiene"]').click();
      cy.get('[data-testid="service-transportation"]').click();
      cy.get('[data-testid="service-all"]').click();
      
      // Should end up showing all dashboards
      cy.get('[data-testid="shelter-dashboard"]').should('be.visible');
      cy.get('[data-testid="food-dashboard"]').should('be.visible');
      cy.get('[data-testid="hygiene-dashboard"]').should('be.visible');
      cy.get('[data-testid="transportation-dashboard"]').should('be.visible');
    });
  });
});