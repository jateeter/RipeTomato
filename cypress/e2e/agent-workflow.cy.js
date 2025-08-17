/**
 * End-to-End Tests for Client Welcome Agent Workflow
 * 
 * Tests the complete agent lifecycle from spawning on client registration
 * through notification processing and service coordination.
 * 
 * Features tested:
 * - Agent spawning upon client registration
 * - Welcome sequence execution
 * - Notification generation and delivery
 * - Workflow step processing
 * - Service allocation coordination
 * - Agent status monitoring
 */

describe('Client Welcome Agent Workflow', () => {
  let testClientData;
  let spawnedAgentId;

  beforeEach(() => {
    // Generate unique test client data
    const timestamp = Date.now();
    testClientData = {
      firstName: 'Agent',
      lastName: `Test${timestamp}`,
      email: `agent.test${timestamp}@example.com`,
      phone: '+1-555-0199',
      dateOfBirth: '1992-03-15',
      address: {
        street: '789 Agent St',
        city: 'Boise',
        state: 'ID',
        zipCode: '83705'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Friend',
        phone: '+1-555-0200'
      },
      preferredBedType: 'standard'
    };

    // Setup API mocks for agent testing
    cy.mockAgentServices();
    cy.mockHMISResponse({ hmis: 'hmis-facilities' });
    cy.mockGoogleCalendarResponse();
    
    // Clear any existing test data
    cy.clearTestData();
    
    // Visit the application
    cy.visit('/');
    cy.waitForPageLoad();
  });

  describe('Agent Spawning on Client Registration', () => {
    it('should spawn welcome agent when client is registered', () => {
      cy.log('**🤖 STEP 1: Register new client and verify agent spawn**');

      // Navigate to client registration
      cy.get('[data-testid="services-manager-nav"]').click();
      cy.get('[data-testid="tab-configuration"]').click();
      cy.get('[data-testid="client-registration-button"]').click();

      // Fill client registration form
      cy.fillClientBasicInfo(testClientData);
      cy.fillClientEmergencyContact(testClientData.emergencyContact);

      // Accept consent and privacy agreements
      cy.get('input[type="checkbox"]').each(($checkbox) => {
        cy.wrap($checkbox).check();
      });

      // Submit registration
      cy.get('[data-testid="submit-registration-button"]').click();

      // Verify successful registration
      cy.shouldHaveSuccessNotification('Client registered successfully');

      // Verify agent spawn notification appears
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 15000 })
        .should('be.visible')
        .and('contain', '🤖 Welcome agent')
        .and('contain', 'activated for')
        .and('contain', testClientData.firstName);

      // Extract agent ID from notification for later use
      cy.get('[data-testid="agent-spawn-notification"]')
        .invoke('text')
        .then((text) => {
          const agentIdMatch = text.match(/agent_[a-zA-Z0-9_]+/);
          expect(agentIdMatch).to.not.be.null;
          spawnedAgentId = agentIdMatch[0];
          cy.log(`Spawned agent ID: ${spawnedAgentId}`);
        });

      cy.log('**✅ Agent spawned successfully**');
    });

    it('should display agent status in system monitoring', () => {
      // First register a client to spawn an agent
      cy.registerTestClient(testClientData);

      cy.log('**📊 STEP 2: Verify agent appears in system monitoring**');

      // Navigate to agent monitoring dashboard
      cy.get('[data-testid="tab-reports"]').click();
      cy.get('[data-testid="agent-monitoring-section"]').should('be.visible');

      // Verify agent appears in active agents list
      cy.get('[data-testid="active-agents-list"]')
        .should('contain', testClientData.firstName)
        .and('contain', testClientData.lastName)
        .and('contain', 'active');

      // Check agent statistics
      cy.get('[data-testid="total-active-agents"]')
        .should('contain', '1');

      cy.get('[data-testid="average-workflow-progress"]')
        .should('be.visible');

      cy.log('**✅ Agent status visible in monitoring dashboard**');
    });

    it('should not spawn duplicate agents for same client', () => {
      cy.log('**🔒 STEP 3: Verify duplicate agent prevention**');

      // Register client first time
      cy.registerTestClient(testClientData);
      cy.shouldHaveSuccessNotification('Client registered successfully');

      // Wait for first agent notification
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 10000 })
        .should('be.visible');

      // Attempt to register same client again (simulate error scenario)
      cy.registerTestClient(testClientData);

      // Should show warning instead of spawning new agent
      cy.get('[data-testid="duplicate-client-warning"]')
        .should('be.visible')
        .and('contain', 'Client already registered');

      // Verify only one agent in monitoring
      cy.get('[data-testid="tab-reports"]').click();
      cy.get('[data-testid="total-active-agents"]')
        .should('contain', '1');

      cy.log('**✅ Duplicate agent prevention working correctly**');
    });
  });

  describe('Welcome Sequence and Notifications', () => {
    beforeEach(() => {
      // Register client and wait for agent spawn
      cy.registerTestClient(testClientData);
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('should generate welcome notification with personalized message', () => {
      cy.log('**👋 STEP 4: Verify welcome notification generation**');

      // Navigate to client notifications
      cy.get('[data-testid="tab-clients"]').click();
      cy.get('[data-testid="client-list"]')
        .contains(testClientData.lastName)
        .click();

      // Access client notifications
      cy.get('[data-testid="client-notifications-tab"]').click();

      // Verify welcome notification
      cy.get('[data-testid="notification-list"]')
        .should('contain', 'Welcome to Community Services')
        .and('contain', testClientData.firstName)
        .and('contain', 'personal service coordinator agent');

      // Check notification details
      cy.get('[data-testid="welcome-notification"]')
        .should('be.visible')
        .and('contain', '🏠 Shelter Services')
        .and('contain', '📅 Calendar Setup')
        .and('contain', '🍽️ Meal Services')
        .and('contain', '🤝 Case Management');

      cy.log('**✅ Welcome notification generated with personalized content**');
    });

    it('should create initial service allocations', () => {
      cy.log('**🏠 STEP 5: Verify initial service allocations**');

      // Navigate to client services
      cy.get('[data-testid="tab-clients"]').click();
      cy.get('[data-testid="client-list"]')
        .contains(testClientData.lastName)
        .click();

      cy.get('[data-testid="client-services-tab"]').click();

      // Verify service allocations were created
      cy.get('[data-testid="allocated-services"]')
        .should('contain', 'Shelter')
        .and('contain', 'Meals')
        .and('contain', 'Case Management');

      // Check service status
      cy.get('[data-testid="shelter-allocation"]')
        .should('contain', 'allocated')
        .and('contain', testClientData.preferredBedType);

      cy.get('[data-testid="meals-allocation"]')
        .should('contain', 'allocated')
        .and('contain', 'breakfast')
        .and('contain', 'lunch')
        .and('contain', 'dinner');

      cy.get('[data-testid="case-management-allocation"]')
        .should('contain', 'allocated')
        .and('contain', 'Tomorrow');

      cy.log('**✅ Initial service allocations created successfully**');
    });

    it('should set up calendar events and reminders', () => {
      cy.log('**📅 STEP 6: Verify calendar integration**');

      // Navigate to client calendar
      cy.get('[data-testid="tab-clients"]').click();
      cy.get('[data-testid="client-list"]')
        .contains(testClientData.lastName)
        .click();

      cy.get('[data-testid="client-calendar-tab"]').click();

      // Verify calendar events were created
      cy.get('[data-testid="calendar-events"]')
        .should('contain', 'Daily Check-in - Shelter Services')
        .and('contain', 'Initial Case Management Meeting');

      // Check reminder schedule
      cy.get('[data-testid="upcoming-reminders"]')
        .should('contain', 'check_in_reminder')
        .and('contain', 'case_management_reminder')
        .and('contain', 'meal_reminder');

      // Verify event recurrence
      cy.get('[data-testid="daily-checkin-event"]')
        .should('contain', 'Daily for 30 days');

      cy.log('**✅ Calendar events and reminders created successfully**');
    });
  });

  describe('Workflow Notification Processing', () => {
    beforeEach(() => {
      // Register client and wait for agent spawn
      cy.registerTestClient(testClientData);
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('should process bed assignment workflow notifications', () => {
      cy.log('**🛏️ STEP 7: Test bed assignment workflow notification**');

      // Simulate bed assignment from staff interface
      cy.simulateWorkflowNotification('bed_assignment', {
        clientId: testClientData.email, // Use email as unique identifier
        status: 'completed',
        metadata: {
          bedNumber: 'B15',
          roomType: 'standard',
          facilityName: 'Main Shelter'
        }
      });

      // Navigate to client notifications
      cy.navigateToClientNotifications(testClientData.lastName);

      // Verify bed assignment notification
      cy.get('[data-testid="notification-list"]')
        .should('contain', '🛏️ Bed Assignment Confirmed')
        .and('contain', 'Bed Number: B15')
        .and('contain', 'check in with staff');

      // Check notification priority
      cy.get('[data-testid="bed-assignment-notification"]')
        .should('have.class', 'priority-high')
        .and('contain', 'Action Required');

      cy.log('**✅ Bed assignment notification processed correctly**');
    });

    it('should process meal setup workflow notifications', () => {
      cy.log('**🍽️ STEP 8: Test meal setup workflow notification**');

      // Simulate meal setup
      cy.simulateWorkflowNotification('meal_setup', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: {
          dietaryNotes: 'Vegetarian options available',
          mealTimes: ['7-9 AM', '12-2 PM', '6-7:30 PM']
        }
      });

      cy.navigateToClientNotifications(testClientData.lastName);

      // Verify meal setup notification
      cy.get('[data-testid="notification-list"]')
        .should('contain', '🍽️ Meal Services Ready')
        .and('contain', 'Breakfast: 7-9 AM')
        .and('contain', 'Lunch: 12-2 PM')
        .and('contain', 'Dinner: 6-7:30 PM')
        .and('contain', 'Vegetarian options available');

      cy.log('**✅ Meal setup notification processed correctly**');
    });

    it('should process check-in workflow notifications', () => {
      cy.log('**✅ STEP 9: Test check-in workflow notification**');

      // Simulate daily check-in completion
      cy.simulateWorkflowNotification('check_in', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: {
          notes: 'Client doing well, no issues reported',
          nextCheckIn: 'Tomorrow 9:00 AM'
        }
      });

      cy.navigateToClientNotifications(testClientData.lastName);

      // Verify check-in notification
      cy.get('[data-testid="notification-list"]')
        .should('contain', '✅ Check-in Completed')
        .and('contain', 'Daily check-in completed successfully')
        .and('contain', 'Client doing well, no issues reported')
        .and('contain', 'Have a great day!');

      cy.log('**✅ Check-in notification processed correctly**');
    });

    it('should process case management workflow notifications', () => {
      cy.log('**🤝 STEP 10: Test case management workflow notification**');

      // Simulate case management session
      cy.simulateWorkflowNotification('case_management', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: {
          servicePlan: 'Housing assistance program approved',
          nextAppointment: 'Next week Thursday 2:00 PM',
          caseWorker: 'Sarah Johnson'
        }
      });

      cy.navigateToClientNotifications(testClientData.lastName);

      // Verify case management notification
      cy.get('[data-testid="notification-list"]')
        .should('contain', '🤝 Case Management Update')
        .and('contain', 'Case management session completed')
        .and('contain', 'Housing assistance program approved')
        .and('contain', 'Next appointment scheduled');

      cy.log('**✅ Case management notification processed correctly**');
    });
  });

  describe('Agent Status and Monitoring', () => {
    beforeEach(() => {
      cy.registerTestClient(testClientData);
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 10000 })
        .should('be.visible');
    });

    it('should track workflow progress accurately', () => {
      cy.log('**📊 STEP 11: Verify workflow progress tracking**');

      // Navigate to agent monitoring
      cy.get('[data-testid="tab-reports"]').click();
      cy.get('[data-testid="agent-monitoring-section"]').should('be.visible');

      // Check initial workflow progress
      cy.get('[data-testid="agent-workflow-progress"]')
        .should('contain', '%')
        .and('not.contain', '100%'); // Should not be complete initially

      // Simulate completing workflow steps
      cy.simulateWorkflowNotification('bed_assignment', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: { bedNumber: 'A10' }
      });

      cy.simulateWorkflowNotification('meal_setup', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: { dietaryNotes: 'No restrictions' }
      });

      // Wait for progress update
      cy.wait(2000);

      // Check updated progress
      cy.get('[data-testid="agent-workflow-progress"]')
        .should('not.contain', '0%'); // Should show progress

      cy.log('**✅ Workflow progress tracking working correctly**');
    });

    it('should display agent health status', () => {
      cy.log('**🏥 STEP 12: Verify agent health monitoring**');

      cy.get('[data-testid="tab-reports"]').click();
      cy.get('[data-testid="agent-health-section"]').should('be.visible');

      // Check health statistics
      cy.get('[data-testid="healthy-agents-count"]')
        .should('contain', '1');

      cy.get('[data-testid="unhealthy-agents-count"]')
        .should('contain', '0');

      // Verify agent appears in healthy list
      cy.get('[data-testid="healthy-agents-list"]')
        .should('contain', testClientData.firstName)
        .and('contain', 'active');

      cy.log('**✅ Agent health monitoring working correctly**');
    });

    it('should track notification delivery statistics', () => {
      cy.log('**📬 STEP 13: Verify notification statistics**');

      // Send some notifications
      cy.simulateWorkflowNotification('bed_assignment', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: { bedNumber: 'C5' }
      });

      cy.simulateWorkflowNotification('check_in', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: { notes: 'All good' }
      });

      // Check notification statistics
      cy.get('[data-testid="tab-reports"]').click();
      cy.get('[data-testid="notification-statistics"]')
        .should('be.visible');

      cy.get('[data-testid="total-notifications-sent"]')
        .should('not.contain', '0'); // Should have sent notifications

      cy.get('[data-testid="notification-types-breakdown"]')
        .should('contain', 'welcome')
        .and('contain', 'service_update');

      cy.log('**✅ Notification statistics tracking correctly**');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle agent spawn failures gracefully', () => {
      cy.log('**⚠️ STEP 14: Test agent spawn error handling**');

      // Mock agent spawn failure
      cy.intercept('POST', '**/agent/spawn', {
        statusCode: 500,
        body: { error: 'Agent service temporarily unavailable' }
      }).as('agentSpawnError');

      // Register client
      cy.registerTestClient(testClientData);

      // Should still complete registration despite agent failure
      cy.shouldHaveSuccessNotification('Client registered successfully');

      // Should show warning about agent service
      cy.get('[data-testid="agent-spawn-warning"]', { timeout: 10000 })
        .should('be.visible')
        .and('contain', 'Agent service temporarily unavailable')
        .and('contain', 'will be activated when service is restored');

      cy.log('**✅ Agent spawn failure handled gracefully**');
    });

    it('should handle notification processing errors', () => {
      cy.log('**🔄 STEP 15: Test notification error recovery**');

      // Register client and spawn agent
      cy.registerTestClient(testClientData);
      cy.get('[data-testid="agent-spawn-notification"]', { timeout: 10000 })
        .should('be.visible');

      // Mock notification processing failure
      cy.intercept('POST', '**/agent/notification', {
        statusCode: 503,
        body: { error: 'Notification service unavailable' }
      }).as('notificationError');

      // Attempt to send notification
      cy.simulateWorkflowNotification('bed_assignment', {
        clientId: testClientData.email,
        status: 'completed',
        metadata: { bedNumber: 'D20' }
      });

      // Should show retry mechanism
      cy.get('[data-testid="notification-retry-indicator"]', { timeout: 5000 })
        .should('be.visible')
        .and('contain', 'Retrying notification delivery');

      cy.log('**✅ Notification error recovery working correctly**');
    });
  });

  afterEach(() => {
    // Cleanup: terminate any spawned agents
    if (spawnedAgentId) {
      cy.terminateTestAgent(spawnedAgentId);
    }
    cy.clearTestData();
  });
});

// Additional test suite for agent performance and scalability
describe('Agent Performance and Scalability', () => {
  it('should handle multiple concurrent agent spawns', () => {
    cy.log('**🚀 STEP 16: Test concurrent agent spawning**');

    // Generate multiple test clients
    const testClients = Array.from({ length: 3 }, (_, i) => ({
      firstName: `Concurrent${i}`,
      lastName: `Test${Date.now() + i}`,
      email: `concurrent${i}.test${Date.now()}@example.com`,
      phone: `+1-555-0${200 + i}`,
      dateOfBirth: '1990-01-01',
      address: {
        street: `${i + 1}00 Test St`,
        city: 'Boise',
        state: 'ID',
        zipCode: '83706'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Friend',
        phone: `+1-555-0${300 + i}`
      }
    }));

    // Register multiple clients concurrently
    testClients.forEach(client => {
      cy.registerTestClient(client);
    });

    // Verify all agents were spawned
    cy.get('[data-testid="tab-reports"]').click();
    cy.get('[data-testid="total-active-agents"]', { timeout: 15000 })
      .should('contain', '3');

    // Verify system performance remains stable
    cy.get('[data-testid="system-performance-indicator"]')
      .should('not.contain', 'degraded')
      .and('not.contain', 'error');

    cy.log('**✅ Concurrent agent spawning successful**');
  });

  it('should maintain performance with high notification volume', () => {
    cy.log('**📊 STEP 17: Test high-volume notification processing**');

    // Register a client
    const testClient = {
      firstName: 'HighVolume',
      lastName: `Test${Date.now()}`,
      email: `highvolume.test${Date.now()}@example.com`,
      phone: '+1-555-0400',
      dateOfBirth: '1988-08-08',
      address: {
        street: '400 Volume St',
        city: 'Boise',
        state: 'ID',
        zipCode: '83707'
      },
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+1-555-0401'
      }
    };

    cy.registerTestClient(testClient);
    cy.get('[data-testid="agent-spawn-notification"]', { timeout: 10000 })
      .should('be.visible');

    // Send multiple notifications rapidly
    const notificationTypes = ['bed_assignment', 'meal_setup', 'check_in'];
    
    for (let i = 0; i < 10; i++) {
      const notificationType = notificationTypes[i % notificationTypes.length];
      cy.simulateWorkflowNotification(notificationType, {
        clientId: testClient.email,
        status: 'completed',
        metadata: { batch: i, timestamp: Date.now() }
      });
    }

    // Verify all notifications were processed
    cy.navigateToClientNotifications(testClient.lastName);
    cy.get('[data-testid="notification-count"]', { timeout: 20000 })
      .should('not.contain', '0'); // Should have processed notifications

    // Check system remains responsive
    cy.get('[data-testid="notification-processing-status"]')
      .should('not.contain', 'overloaded');

    cy.log('**✅ High-volume notification processing successful**');
  });
});