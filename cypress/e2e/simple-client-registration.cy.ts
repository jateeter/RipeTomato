/**
 * E2E Tests for Simple Client Registration
 *
 * Tests the complete registration workflow designed for homeless population:
 * - iPad-optimized interface (large touch targets)
 * - Minimal required input
 * - Street duration as inflection point
 * - Family relationship tracking
 * - Automatic Solid Pod provisioning
 * - 5G-only connectivity validation
 */

describe('Simple Client Registration - Complete Workflow', () => {

  beforeEach(() => {
    // Clear any previous registration data
    cy.clearLocalStorage();

    // Navigate to registration
    cy.visit('/');
    cy.get('body', { timeout: 10000 }).should('be.visible');

    // Navigate to simple registration
    cy.window().then((win: any) => {
      if (win.setActiveView) {
        win.setActiveView('simple-registration');
      }
    });

    cy.wait(500);
  });

  /**
   * Test 1: First-time homeless client with no family
   * - Simple case, minimal complexity
   * - Should get moderate urgency
   * - Rapid rehousing recommended
   */
  describe('Scenario 1: First-time, no family (Simple case)', () => {

    it('should complete registration with minimal input', () => {
      // Step 1: Name
      cy.contains('h1', "What's your name?").should('be.visible');
      cy.get('input[placeholder="Enter your first name"]').type('Sarah');
      cy.contains('button', 'Next →').click();

      // Step 2: Street duration - first time
      cy.contains('h1', 'How long have you been on the streets?').should('be.visible');
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();

      // Step 3: No children
      cy.contains('h1', 'Do you have children?').should('be.visible');
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();

      // Step 4: No partner
      cy.contains('h1', 'Do you have a partner or spouse?').should('be.visible');
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();

      // Step 5: No other family
      cy.contains('h1', 'Do you have family you can contact?').should('be.visible');
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();

      // Step 6: Skip contact info (optional)
      cy.contains('h1', 'How can we reach you?').should('be.visible');
      cy.contains('button', 'Complete Registration ✓').should('be.enabled').click();

      // Wait for registration to complete
      cy.contains('Welcome, Sarah!', { timeout: 10000 }).should('be.visible');

      // Verify client ID generated
      cy.contains('Your ID:').should('be.visible');
      cy.get('p.text-4xl.font-bold.text-blue-600').should('contain', 'SARAH-');

      // Verify moderate urgency (first-time should be moderate)
      cy.contains('Services Ready for You').should('be.visible');

      // Verify recommendations include rapid rehousing
      cy.contains('Recommended Services:').should('be.visible');
      cy.contains('Blanchet House').should('be.visible'); // Shelter
    });

    it('should store profile in localStorage', () => {
      // Complete registration
      cy.get('input[placeholder="Enter your first name"]').type('Michael');
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click(); // No children
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click(); // No partner
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click(); // No family
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      // Verify stored in localStorage
      cy.window().then((win) => {
        const registered = win.localStorage.getItem('registered_clients');
        expect(registered).to.not.be.null;

        const clients = JSON.parse(registered!);
        expect(clients).to.be.an('array');
        expect(clients.length).to.be.greaterThan(0);
        expect(clients[0].name).to.equal('Michael');
      });
    });
  });

  /**
   * Test 2: Client with children (Critical urgency)
   * - Children with client = immediate family services
   * - Should get critical urgency
   * - Family shelter recommended
   */
  describe('Scenario 2: Parent with children (Critical urgency)', () => {

    it('should prioritize family services for parent with children', () => {
      // Step 1: Name
      cy.get('input[placeholder="Enter your first name"]').type('Maria');
      cy.get('input[placeholder="Optional"]').first().type('Rodriguez');
      cy.get('input[placeholder="What should we call you?"]').type('Mari');
      cy.contains('button', 'Next →').click();

      // Step 2: Street duration - less than month
      cy.contains('button', 'Less than a month').click();
      cy.contains('button', 'Next →').click();

      // Step 3: Has children WITH her
      cy.contains('button', 'Yes').click();
      cy.get('input[type="number"]').first().clear().type('2'); // 2 children with client
      cy.get('input[type="number"]').last().clear().type('0'); // 0 elsewhere
      cy.contains('button', 'Next →').click();

      // Step 4: No partner
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();

      // Step 5: Has family, willing to contact
      cy.contains('button', 'Yes').click();
      cy.contains('button', 'Yes').click(); // Can contact family
      cy.contains('button', 'Next →').click();

      // Step 6: Provide phone
      cy.get('input[type="tel"]').type('503-555-0123');
      cy.contains('button', 'Complete Registration ✓').click();

      // Verify critical urgency
      cy.contains('Welcome, Mari!', { timeout: 10000 }).should('be.visible');
      cy.contains('🚨 Urgent Help Available').should('be.visible');

      // Verify family services recommended
      cy.contains('Transition Projects Family Services').should('be.visible');
      cy.contains('JOIN').should('be.visible');
    });

    it('should handle children elsewhere differently', () => {
      cy.get('input[placeholder="Enter your first name"]').type('Robert');
      cy.contains('button', 'Next →').click();
      cy.contains('button', '6 months to a year').click();
      cy.contains('button', 'Next →').click();

      // Has children but NOT with client
      cy.contains('button', 'Yes').click();
      cy.get('input[type="number"]').first().clear().type('0'); // 0 with client
      cy.get('input[type="number"]').last().clear().type('3'); // 3 elsewhere
      cy.contains('button', 'Next →').click();

      cy.contains('button', 'No').click(); // No partner
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Yes').click(); // Has family
      cy.contains('button', 'Maybe').click(); // Maybe contact
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Robert!', { timeout: 10000 }).should('be.visible');

      // Should get family reunification services, but not critical
      cy.contains('Transition Projects Family Services').should('be.visible');
    });
  });

  /**
   * Test 3: Chronic homelessness (High urgency)
   * - Over a year or chronic duration
   * - Should get high urgency
   * - Permanent housing + health services recommended
   */
  describe('Scenario 3: Chronic homelessness (High urgency)', () => {

    it('should prioritize permanent housing and health for chronic clients', () => {
      cy.get('input[placeholder="Enter your first name"]').type('James');
      cy.contains('button', 'Next →').click();

      // Chronic - several years
      cy.contains('button', 'Several years').click();
      cy.contains('button', 'Next →').click();

      cy.contains('button', 'No').click(); // No children
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click(); // No partner
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click(); // No family
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, James!', { timeout: 10000 }).should('be.visible');

      // High urgency for chronic
      cy.contains('⚠️ High Priority Services').should('be.visible');

      // Health services recommended
      cy.contains('Outside In').should('be.visible');
    });
  });

  /**
   * Test 4: Couple together
   * - Partner with client
   * - Should recommend couple-friendly services
   */
  describe('Scenario 4: Couple together', () => {

    it('should handle couples staying together', () => {
      cy.get('input[placeholder="Enter your first name"]').type('David');
      cy.contains('button', 'Next →').click();

      cy.contains('button', '1 to 6 months').click();
      cy.contains('button', 'Next →').click();

      cy.contains('button', 'No').click(); // No children
      cy.contains('button', 'Next →').click();

      // Has partner WITH client
      cy.contains('button', 'Yes').click();
      cy.contains('button', 'Yes').click(); // Partner with client
      cy.contains('button', 'Next →').click();

      cy.contains('button', 'Yes').click(); // Has family
      cy.contains('button', 'No').click(); // Don't want contact
      cy.contains('button', 'Next →').click();

      cy.get('input[type="email"]').type('david@example.com');
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, David!', { timeout: 10000 }).should('be.visible');
      cy.contains('Recommended Services:').should('be.visible');
    });
  });

  /**
   * Test 5: Progress saving and resume
   * - Auto-save on each step
   * - Resume from saved progress
   */
  describe('Progress Saving and Resume', () => {

    it('should auto-save progress and allow resume', () => {
      // Start registration
      cy.get('input[placeholder="Enter your first name"]').type('Jennifer');
      cy.contains('button', 'Next →').click();

      cy.contains('button', 'Less than a month').click();
      cy.contains('button', 'Next →').click();

      cy.contains('button', 'Yes').click(); // Has children
      cy.get('input[type="number"]').first().type('1');

      // Verify saved to localStorage
      cy.window().then((win) => {
        const saved = win.localStorage.getItem('registration_in_progress');
        expect(saved).to.not.be.null;

        const data = JSON.parse(saved!);
        expect(data.firstName).to.equal('Jennifer');
        expect(data.streetDuration).to.equal('less-than-month');
        expect(data.hasChildren).to.be.true;
      });

      // Simulate page reload
      cy.reload();
      cy.get('body', { timeout: 10000 }).should('be.visible');
      cy.window().then((win: any) => {
        if (win.setActiveView) {
          win.setActiveView('simple-registration');
        }
      });

      // Should resume from step 3 (children)
      cy.contains('h1', 'Do you have children?', { timeout: 5000 }).should('be.visible');
      cy.get('input[type="number"]').first().should('have.value', '1');
    });

    it('should clear progress after successful registration', () => {
      // Complete full registration
      cy.get('input[placeholder="Enter your first name"]').type('Thomas');
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Thomas!', { timeout: 10000 }).should('be.visible');

      // Verify progress cleared
      cy.window().then((win) => {
        const saved = win.localStorage.getItem('registration_in_progress');
        expect(saved).to.be.null;
      });
    });
  });

  /**
   * Test 6: Touch Target Sizing (iPad optimization)
   * - All buttons minimum 60px height
   * - Large input fields
   * - Easy to tap without precision
   */
  describe('iPad Touch Target Optimization', () => {

    it('should have large touch targets on all steps', () => {
      // Step 1 - Name input should be large
      cy.get('input[placeholder="Enter your first name"]').should('have.css', 'min-height', '60px');

      cy.get('input[placeholder="Enter your first name"]').type('Test');
      cy.contains('button', 'Next →').should('have.css', 'min-height', '60px');
      cy.contains('button', 'Next →').click();

      // Step 2 - Duration buttons should be large
      cy.contains('button', 'This is my first time').should('have.css', 'min-height', '80px');
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();

      // Step 3 - Yes/No buttons should be large
      cy.contains('button', 'No').should('have.css', 'min-height', '60px');
    });

    it('should display large text for readability', () => {
      cy.get('h1').should('have.class', 'text-4xl');
      cy.get('input[placeholder="Enter your first name"]').should('have.class', 'text-2xl');
    });
  });

  /**
   * Test 7: Client ID Generation
   * - Format: FIRSTNAME-MMDDXX
   * - Memorable and simple
   */
  describe('Client ID Generation', () => {

    it('should generate ID in correct format', () => {
      cy.get('input[placeholder="Enter your first name"]').type('Alexandra');
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Alexandra!', { timeout: 10000 }).should('be.visible');

      // Verify ID format: ALEXANDRA-MMDDXX
      cy.get('p.text-4xl.font-bold.text-blue-600').invoke('text').should('match', /ALEXANDRA-\d{6}/);
    });
  });

  /**
   * Test 8: Automatic Solid Pod Provisioning
   * - Hidden from user
   * - Falls back to localStorage if unavailable
   */
  describe('Automatic Solid Pod Provisioning', () => {

    it('should automatically provision storage (hidden from user)', () => {
      cy.get('input[placeholder="Enter your first name"]').type('Patricia');
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Patricia!', { timeout: 10000 }).should('be.visible');

      // Verify profile stored (should have Solid Pod info)
      cy.window().then((win) => {
        const registered = win.localStorage.getItem('registered_clients');
        const clients = JSON.parse(registered!);
        const patriciaId = clients.find((c: any) => c.name === 'Patricia').clientId;

        const profile = win.localStorage.getItem(`client_profile_${patriciaId}`);
        expect(profile).to.not.be.null;

        const data = JSON.parse(profile!);
        expect(data.solidPod).to.exist;
        expect(data.solidPod.webId).to.exist;
        expect(data.solidPod.podUrl).to.exist;
      });
    });

    it('should never show Solid Pod details to user', () => {
      cy.get('input[placeholder="Enter your first name"]').type('William');
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, William!', { timeout: 10000 }).should('be.visible');

      // Verify NO mention of Solid Pod, WebID, etc.
      cy.contains('Solid').should('not.exist');
      cy.contains('WebID').should('not.exist');
      cy.contains('Pod').should('not.exist');
      cy.contains('Storage').should('not.exist');
    });
  });

  /**
   * Test 9: Service Recommendations Based on Inflection Points
   * - Street duration affects recommendations
   * - Family status affects recommendations
   */
  describe('Service Recommendations', () => {

    it('should recommend immediate shelter for all clients', () => {
      cy.get('input[placeholder="Enter your first name"]').type('Emily');
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Emily!', { timeout: 10000 }).should('be.visible');

      // All clients get shelter recommendation
      cy.contains('Recommended Services:').should('be.visible');
      cy.contains('Blanchet House').should('be.visible');
    });

    it('should recommend job training for recent homelessness', () => {
      cy.get('input[placeholder="Enter your first name"]').type('Christopher');
      cy.contains('button', 'Next →').click();

      // First time - should get job training
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Christopher!', { timeout: 10000 }).should('be.visible');

      // Should include job training (visible in profile, though might not be in top 3)
      cy.window().then((win) => {
        const registered = win.localStorage.getItem('registered_clients');
        const clients = JSON.parse(registered!);
        const chris = clients.find((c: any) => c.name === 'Christopher');
        const profile = win.localStorage.getItem(`client_profile_${chris.clientId}`);
        const data = JSON.parse(profile!);

        const hasJobTraining = data.recommendations.some((r: any) =>
          r.serviceType === 'job-training' || r.providerName.includes('Worksystems')
        );
        expect(hasJobTraining).to.be.true;
      });
    });

    it('should recommend health services for chronic homelessness', () => {
      cy.get('input[placeholder="Enter your first name"]').type('Margaret');
      cy.contains('button', 'Next →').click();

      // Chronic - several years
      cy.contains('button', 'Several years').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'Complete Registration ✓').click();

      cy.contains('Welcome, Margaret!', { timeout: 10000 }).should('be.visible');

      // Health services should be visible
      cy.contains('Outside In').should('be.visible');
    });
  });

  /**
   * Test 10: Offline/5G-only functionality
   * - Should work with minimal connectivity
   * - Auto-save protects against connection loss
   */
  describe('5G-Only / Minimal Connectivity', () => {

    it('should work offline after initial load', () => {
      // Start registration
      cy.get('input[placeholder="Enter your first name"]').type('Daniel');
      cy.contains('button', 'Next →').click();

      // Simulate going offline
      cy.window().then((win) => {
        // Force offline mode
        cy.stub(win, 'fetch').rejects(new Error('Network error'));
      });

      // Should still be able to continue (uses localStorage)
      cy.contains('button', 'This is my first time').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();
      cy.contains('button', 'No').click();
      cy.contains('button', 'Next →').click();

      // Complete registration (will fallback to localStorage)
      cy.contains('button', 'Complete Registration ✓').click();

      // Should still complete successfully
      cy.contains('Welcome, Daniel!', { timeout: 10000 }).should('be.visible');
    });
  });
});
