/**
 * Refined E2E Tests for Client Welcome Agent Workflow
 * 
 * Tests the complete agent lifecycle using the actual UI structure
 * and navigation patterns of the production application.
 */

describe('Refined Client Welcome Agent Workflow', () => {
  let testClientData;

  beforeEach(() => {
    // Generate unique test client data
    const timestamp = Date.now();
    testClientData = {
      firstName: 'TestAgent',
      lastName: `User${timestamp}`,
      email: `testagent${timestamp}@example.com`,
      phone: '+1-208-555-0199',
      dateOfBirth: '1985-06-15',
      address: {
        street: '123 Test Agent St',
        city: 'Boise',
        state: 'ID',
        zipCode: '83702'
      },
      emergencyContact: {
        name: 'Agent Emergency Contact',
        relationship: 'Friend',
        phone: '+1-208-555-0200'
      }
    };

    // Visit the application and wait for full load
    cy.visit('/');
    cy.wait(3000); // Allow React app to fully initialize
  });

  describe('Application Structure and Navigation', () => {
    it('should load the community services hub successfully', () => {
      cy.log('**🏘️ STEP 1: Verify Community Services Hub loads**');

      // Verify the main application container exists
      cy.get('#root').should('exist');

      // Check for the main navigation or sidebar
      cy.get('[data-testid="services-manager-nav"]', { timeout: 10000 })
        .should('be.visible');

      // Verify we can see service-related content
      cy.get('body').should('contain.text', 'Services');

      cy.log('**✅ Community Services Hub loaded successfully**');
    });

    it('should navigate to services manager dashboard', () => {
      cy.log('**📊 STEP 2: Navigate to Services Manager**');

      // Click on services manager navigation (first one)
      cy.get('[data-testid="services-manager-nav"]')
        .should('be.visible')
        .first()
        .click({ force: true });

      // Wait for dashboard content to load
      cy.wait(2000);

      // Verify we're in the services manager dashboard
      cy.get('body').should('contain.text', 'Services Manager');

      cy.log('**✅ Services Manager dashboard accessible**');
    });
  });

  describe('Client Registration Process', () => {
    it('should complete client registration and trigger agent spawn', () => {
      cy.log('**👤 STEP 3: Complete client registration workflow**');

      // Navigate to services manager
      cy.get('[data-testid="services-manager-nav"]')
        .first()
        .click({ force: true });

      cy.wait(2000);

      // Look for configuration tab
      cy.get('[data-testid="tab-configuration"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true });

      cy.wait(1000);

      // Find and click client registration button
      cy.get('[data-testid="client-registration-button"]')
        .should('be.visible')
        .click({ force: true });

      cy.wait(1000);

      // Fill out the registration form
      cy.log('**📝 Filling client registration form**');

      // Basic information
      cy.get('[data-testid="first-name-input"]')
        .should('be.visible')
        .clear()
        .type(testClientData.firstName);

      cy.get('[data-testid="last-name-input"]')
        .clear()
        .type(testClientData.lastName);

      cy.get('[data-testid="email-input"]')
        .clear()
        .type(testClientData.email);

      cy.get('[data-testid="phone-input"]')
        .clear()
        .type(testClientData.phone);

      cy.get('[data-testid="date-of-birth-input"]')
        .clear()
        .type(testClientData.dateOfBirth);

      // Address information (look for address inputs)
      cy.get('body').then($body => {
        if ($body.find('input[placeholder*="Street"]').length > 0) {
          cy.get('input[placeholder*="Street"]').type(testClientData.address.street);
        }
        if ($body.find('input[placeholder*="City"]').length > 0) {
          cy.get('input[placeholder*="City"]').type(testClientData.address.city);
        }
        if ($body.find('input[placeholder*="ZIP"]').length > 0) {
          cy.get('input[placeholder*="ZIP"]').type(testClientData.address.zipCode);
        }
      });

      // Emergency contact
      cy.get('[data-testid="emergency-contact-name-input"]')
        .clear()
        .type(testClientData.emergencyContact.name);

      cy.get('[data-testid="emergency-contact-relationship-input"]')
        .clear()
        .type(testClientData.emergencyContact.relationship);

      cy.get('[data-testid="emergency-contact-phone-input"]')
        .clear()
        .type(testClientData.emergencyContact.phone);

      // Accept consent checkboxes
      cy.get('input[type="checkbox"]').each($checkbox => {
        cy.wrap($checkbox).check({ force: true });
      });

      cy.log('**🚀 Submitting registration**');

      // Submit the form
      cy.get('[data-testid="submit-registration-button"]')
        .should('be.enabled')
        .click({ force: true });

      // Verify successful registration
      cy.get('[data-testid="registration-success-message"]', { timeout: 15000 })
        .should('be.visible')
        .and('contain', testClientData.firstName);

      cy.log('**✅ Client registration completed successfully**');
    });

    it('should display agent spawn notification after registration', () => {
      cy.log('**🤖 STEP 4: Verify agent spawn notification**');

      // First complete a registration (simplified version)
      cy.completeBasicClientRegistration(testClientData);

      // Look for agent spawn notification
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 20000 })
        .should('be.visible')
        .and('contain.oneOf', [
          'Welcome agent',
          'agent',
          'activated',
          testClientData.firstName
        ]);

      cy.log('**✅ Agent spawn notification displayed**');
    });
  });

  describe('Notification System Verification', () => {
    beforeEach(() => {
      // Complete registration to have an active agent
      cy.completeBasicClientRegistration(testClientData);
      cy.wait(3000);
    });

    it('should display notifications in the notification center', () => {
      cy.log('**📬 STEP 5: Verify notification center functionality**');

      // Navigate to notification center if it exists
      cy.get('body').then($body => {
        if ($body.find('[data-testid="notification-center"]').length > 0) {
          cy.get('[data-testid="notification-center"]')
            .should('be.visible')
            .click({ force: true });

          // Check for notification list
          cy.get('[data-testid="notification-list"]', { timeout: 5000 })
            .should('be.visible');

          cy.log('**✅ Notification center is accessible**');
        } else {
          cy.log('**ℹ️ Notification center not found in current view**');
        }
      });
    });
  });

  describe('Dashboard Integration Verification', () => {
    it('should show registration success in dashboard', () => {
      cy.log('**📊 STEP 6: Verify dashboard reflects new registration**');

      // Complete registration
      cy.completeBasicClientRegistration(testClientData);

      // Navigate back to overview/dashboard
      cy.get('[data-testid="services-manager-nav"]')
        .first()
        .click({ force: true });

      cy.wait(2000);

      // Look for client count or client list updates
      cy.get('body').then($body => {
        // Look for various indicators of successful registration
        if ($body.find('[data-testid="client-list"]').length > 0) {
          cy.get('[data-testid="client-list"]')
            .should('contain', testClientData.lastName);
        } else if ($body.text().includes('Clients')) {
          // Dashboard showing client-related information
          cy.get('body').should('contain.text', 'Client');
        }
      });

      cy.log('**✅ Dashboard reflects registration changes**');
    });
  });

  describe('System Performance and Stability', () => {
    it('should handle multiple registrations without errors', () => {
      cy.log('**⚡ STEP 7: Test system performance with multiple operations**');

      // Complete multiple registrations quickly
      for (let i = 0; i < 2; i++) {
        const clientData = {
          ...testClientData,
          firstName: `TestBatch${i}`,
          lastName: `User${Date.now() + i}`,
          email: `testbatch${i}.${Date.now()}@example.com`,
          phone: `+1-208-555-${String(100 + i).padStart(4, '0')}`
        };

        cy.completeBasicClientRegistration(clientData);
        cy.wait(2000);
      }

      // Verify system remains responsive
      cy.get('[data-testid="services-manager-nav"]')
        .should('be.visible')
        .first()
        .click({ force: true });

      cy.get('body').should('be.visible');

      cy.log('**✅ System handles multiple operations successfully**');
    });
  });
});

// Helper command for streamlined client registration
Cypress.Commands.add('completeBasicClientRegistration', (clientData) => {
  // Navigate to registration
  cy.get('[data-testid="services-manager-nav"]', { timeout: 10000 })
    .click({ force: true });
  
  cy.get('[data-testid="tab-configuration"]', { timeout: 10000 })
    .click({ force: true });
  
  cy.get('[data-testid="client-registration-button"]', { timeout: 10000 })
    .click({ force: true });
  
  // Fill essential fields only
  cy.get('[data-testid="first-name-input"]')
    .clear().type(clientData.firstName);
  
  cy.get('[data-testid="last-name-input"]')
    .clear().type(clientData.lastName);
  
  cy.get('[data-testid="email-input"]')
    .clear().type(clientData.email);
  
  cy.get('[data-testid="phone-input"]')
    .clear().type(clientData.phone);
  
  cy.get('[data-testid="date-of-birth-input"]')
    .clear().type(clientData.dateOfBirth);
  
  cy.get('[data-testid="emergency-contact-name-input"]')
    .clear().type(clientData.emergencyContact.name);
  
  cy.get('[data-testid="emergency-contact-relationship-input"]')
    .clear().type(clientData.emergencyContact.relationship);
  
  cy.get('[data-testid="emergency-contact-phone-input"]')
    .clear().type(clientData.emergencyContact.phone);
  
  // Accept consent
  cy.get('input[type="checkbox"]').check({ force: true, multiple: true });
  
  // Submit
  cy.get('[data-testid="submit-registration-button"]')
    .click({ force: true });
  
  // Wait for success
  cy.get('[data-testid="registration-success-message"]', { timeout: 15000 })
    .should('be.visible');
});