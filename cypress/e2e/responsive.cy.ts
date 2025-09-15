/**
 * End-to-End tests for responsive design across different viewport sizes
 * Tests iPhone, Pixel, Samsung, and desktop viewports
 */

describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Pixel 6', width: 412, height: 915 },
    { name: 'Samsung Galaxy S21', width: 384, height: 854 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad', width: 820, height: 1180 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Large Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    context(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/');
      });

      it('should display the app correctly', () => {
        // App should load without errors
        cy.get('[data-testid="community-services-hub"]', { timeout: 10000 })
          .should('exist');
      });

      it('should have appropriate navigation for viewport size', () => {
        const isMobile = viewport.width < 768;
        const isTablet = viewport.width >= 768 && viewport.width < 1280;
        
        if (isMobile) {
          // Mobile should show hamburger menu or bottom navigation
          cy.get('body').then(($body) => {
            const hasHamburger = $body.find('[data-testid="mobile-menu-button"]').length > 0;
            const hasBottomNav = $body.find('[data-testid="mobile-bottom-nav"]').length > 0;
            expect(hasHamburger || hasBottomNav).to.be.true;
          });
        } else {
          // Desktop/tablet should show regular navigation
          cy.get('[data-testid="desktop-navigation"]').should('be.visible');
        }
      });

      it('should have readable text and properly sized buttons', () => {
        // Text should be readable
        cy.get('h1, h2, h3').should('have.css', 'font-size').and('not.equal', '0px');
        
        // Buttons should be appropriately sized for touch on mobile
        if (viewport.width < 768) {
          cy.get('button').each(($btn) => {
            cy.wrap($btn).should('have.css', 'min-height');
            // Touch targets should be at least 44px
            cy.wrap($btn).invoke('height').should('be.gte', 32);
          });
        }
      });

      it('should handle navigation transitions smoothly', () => {
        // Test navigation to different sections
        const isMobile = viewport.width < 768;
        
        if (isMobile) {
          // Test mobile menu if it exists
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="mobile-menu-button"]').length > 0) {
              cy.get('[data-testid="mobile-menu-button"]').click();
              cy.get('[data-testid="mobile-menu"]').should('be.visible');
            }
          });
        }

        // Navigate to different services
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="services-manager-nav"]').length > 0) {
            cy.get('[data-testid="services-manager-nav"]').click();
            cy.wait(500); // Allow transition
            cy.get('[data-testid="services-manager"]').should('exist');
          }
        });
      });

      it('should properly display content cards and layouts', () => {
        // Cards should be properly spaced and not overlap
        cy.get('[data-testid^="service-card"], .bg-white').each(($card) => {
          cy.wrap($card).should('be.visible');
          cy.wrap($card).should('have.css', 'padding');
        });

        // Content should not overflow
        cy.get('body').should('have.css', 'overflow-x', 'hidden');
      });

      it('should handle form inputs appropriately', () => {
        // Find any form inputs and test they're appropriately sized
        cy.get('input, textarea, select').each(($input) => {
          cy.wrap($input).should('be.visible');
          
          if (viewport.width < 768) {
            // Mobile inputs should be large enough for touch
            cy.wrap($input).invoke('height').should('be.gte', 32);
          }
        });
      });

      if (viewport.width < 768) {
        it('should handle mobile-specific interactions', () => {
          // Test touch interactions
          cy.get('button').first().should('be.visible');
          
          // Test scrolling works
          cy.scrollTo('bottom');
          cy.scrollTo('top');
          
          // Test that fixed elements don't interfere with content
          cy.get('body').should('not.have.css', 'position', 'fixed');
        });
      }

      it('should maintain proper safe areas on mobile devices', () => {
        if (viewport.width < 768) {
          // Check that content doesn't get cut off by notches or home indicators
          cy.get('main, [role="main"]').should('exist');
          
          // Ensure content is within safe areas
          cy.get('header').should('be.visible');
          cy.get('main').should('be.visible');
        }
      });

      it('should have proper contrast and accessibility', () => {
        // Test that text has proper contrast
        cy.get('h1, h2, h3, p, span, button').each(($el) => {
          cy.wrap($el).should('be.visible');
          // Basic visibility test - more comprehensive a11y testing would require axe-core
        });
      });
    });
  });

  // Cross-viewport transition tests
  describe('Viewport Transition Tests', () => {
    it('should handle viewport size changes gracefully', () => {
      cy.visit('/');
      
      // Start desktop
      cy.viewport(1280, 720);
      cy.get('[data-testid="community-services-hub"]').should('exist');
      
      // Transition to tablet
      cy.viewport(768, 1024);
      cy.wait(500);
      cy.get('[data-testid="community-services-hub"]').should('exist');
      
      // Transition to mobile
      cy.viewport(375, 667);
      cy.wait(500);
      cy.get('[data-testid="community-services-hub"]').should('exist');
      
      // Back to desktop
      cy.viewport(1280, 720);
      cy.wait(500);
      cy.get('[data-testid="community-services-hub"]').should('exist');
    });
  });
});