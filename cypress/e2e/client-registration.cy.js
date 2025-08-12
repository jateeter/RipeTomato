/**
 * End-to-End Tests for Client Registration Workflow
 * 
 * Tests the complete client registration process including:
 * - Basic client information entry
 * - Emergency contact information
 * - Shelter bed registration
 * - Calendar integration
 * - HMIS data synchronization
 * - Voice services integration
 */

describe('Client Registration Workflow', () => {
  let clientData

  beforeEach(() => {
    // Load test data
    cy.fixture('client-test-data').then((data) => {
      clientData = data
    })
    
    // Setup mocks for external services
    cy.mockHMISResponse({ hmis: 'hmis-facilities' })
    cy.mockGoogleCalendarResponse()
    
    // Clear any existing test data
    cy.clearTestData()
    
    // Visit the application
    cy.visit('/')
    cy.waitForPageLoad()
  })

  describe('Complete Registration Flow', () => {
    it('should successfully register a new client with full workflow', () => {
      const client = clientData.validClient

      // Step 1: Navigate to client registration
      cy.log('**Step 1: Navigate to Client Registration**')
      cy.navigateToClientRegistration()

      // Step 2: Fill basic client information
      cy.log('**Step 2: Fill Basic Client Information**')
      cy.fillClientBasicInfo({
        firstName: client.firstName,
        lastName: client.lastName,
        dateOfBirth: client.dateOfBirth,
        phone: client.phone,
        email: client.email
      })

      // Step 3: Add emergency contact
      cy.log('**Step 3: Add Emergency Contact**')
      cy.fillClientEmergencyContact(client.emergencyContact)

      // Step 4: Select shelter and register for bed
      cy.log('**Step 4: Select Shelter and Register for Bed**')
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)

      // Step 5: Submit registration
      cy.log('**Step 5: Submit Registration**')
      cy.submitClientRegistration()

      // Step 6: Verify successful registration
      cy.log('**Step 6: Verify Registration Success**')
      const clientFullName = `${client.firstName} ${client.lastName}`
      cy.verifyRegistrationSuccess(clientFullName)

      // Step 7: Verify calendar integration
      cy.log('**Step 7: Verify Calendar Integration**')
      cy.verifyCalendarEventCreated(`Bed Registration - ${clientFullName}`)

      // Step 8: Verify HMIS synchronization
      cy.log('**Step 8: Verify HMIS Integration**')
      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')
      cy.verifyHMISSync()

      // Step 9: Verify voice services are enabled
      cy.log('**Step 9: Verify Voice Services Integration**')
      cy.verifyVoiceActionsEnabled()

      // Step 10: Verify map integration with satellite view
      cy.log('**Step 10: Verify Map Integration**')
      cy.navigateToTab('facilities')
      cy.verifyMapWithSatelliteView()
      cy.selectFacilityOnMap(client.bedRegistration.shelterName)

      // Verify success notification
      cy.shouldHaveSuccessNotification('Client registered successfully')
    })

    it('should register a client without email address', () => {
      const client = clientData.clientWithoutEmail

      cy.log('**Testing Registration Without Email**')
      cy.navigateToClientRegistration()

      cy.fillClientBasicInfo({
        firstName: client.firstName,
        lastName: client.lastName,
        dateOfBirth: client.dateOfBirth,
        phone: client.phone
        // No email provided
      })

      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      const clientFullName = `${client.firstName} ${client.lastName}`
      cy.verifyRegistrationSuccess(clientFullName)
    })

    it('should handle urgent client registration', () => {
      const client = clientData.urgentClient

      cy.log('**Testing Urgent Client Registration**')
      cy.navigateToClientRegistration()

      // Mark as urgent/emergency case
      cy.get('[data-testid="urgent-case-checkbox"]')
        .should('be.visible')
        .check()

      cy.fillClientBasicInfo({
        firstName: client.firstName,
        lastName: client.lastName,
        dateOfBirth: client.dateOfBirth,
        phone: client.phone
      })

      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      const clientFullName = `${client.firstName} ${client.lastName}`
      cy.verifyRegistrationSuccess(clientFullName)

      // Verify urgent priority in calendar event
      cy.verifyCalendarEventCreated(`URGENT - Bed Registration - ${clientFullName}`)
    })

    it('should register a youth client with guardian requirements', () => {
      const client = clientData.youthClient

      cy.log('**Testing Youth Client Registration**')
      cy.navigateToClientRegistration()

      cy.fillClientBasicInfo({
        firstName: client.firstName,
        lastName: client.lastName,
        dateOfBirth: client.dateOfBirth,
        phone: client.phone
      })

      // Youth-specific fields
      cy.get('[data-testid="minor-client-checkbox"]')
        .should('be.visible')
        .check()

      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      const clientFullName = `${client.firstName} ${client.lastName}`
      cy.verifyRegistrationSuccess(clientFullName)

      // Verify guardian notification requirements
      cy.get('[data-testid="guardian-notification-message"]')
        .should('be.visible')
        .and('contain', 'Guardian has been notified')
    })
  })

  describe('Calendar Integration Tests', () => {
    it('should create calendar events for bed registration', () => {
      const client = clientData.validClient

      cy.log('**Testing Calendar Event Creation**')
      cy.navigateToClientRegistration()
      cy.fillClientBasicInfo(client)
      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      // Wait for calendar integration
      cy.wait('@createCalendar', { timeout: 10000 })
      cy.wait('@createEvent', { timeout: 10000 })

      const clientFullName = `${client.firstName} ${client.lastName}`
      cy.verifyCalendarEventCreated(`Bed Registration - ${clientFullName}`)

      // Verify calendar synchronization between personal and shelter calendars
      cy.navigateToTab('calendar')
      cy.waitForCalendarLoad()
      
      cy.get('[data-testid="calendar-sync-status"]')
        .should('contain', 'Synchronized')
    })

    it('should create recurring check-in reminders', () => {
      const client = clientData.validClient

      cy.log('**Testing Recurring Calendar Reminders**')
      cy.navigateToClientRegistration()
      cy.fillClientBasicInfo(client)
      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      
      // Enable reminder notifications
      cy.get('[data-testid="enable-reminders-checkbox"]')
        .check()
        
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      // Verify reminder agent activation
      cy.get('[data-testid="calendar-reminder-agent-status"]')
        .should('contain', 'Active')

      // Check that reminders are scheduled
      cy.get('[data-testid="scheduled-reminders-count"]')
        .should('not.contain', '0')
    })
  })

  describe('HMIS Integration Tests', () => {
    it('should sync client data with HMIS OpenCommons', () => {
      cy.log('**Testing HMIS Data Synchronization**')
      
      // Trigger HMIS sync
      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')
      cy.triggerHMISSync()

      // Wait for HMIS data to load
      cy.wait('@hmisRequest', { timeout: 15000 })

      // Verify facilities are loaded from HMIS
      cy.get('[data-testid="facilities-table"]')
        .should('contain', 'Idaho Community Shelter')
        .and('contain', 'Boise Family Shelter')
        .and('contain', 'Youth Services Center')

      // Verify real-time data display
      cy.get('[data-testid="hmis-statistics"]')
        .should('contain', '95 beds total')
        .and('contain', '25 available')
    })

    it('should display facilities on satellite map view', () => {
      cy.log('**Testing HMIS Facilities Map Integration**')
      
      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')
      
      // Switch to map view
      cy.get('[data-testid="view-toggle-map"]').click()
      
      cy.verifyMapWithSatelliteView()
      cy.selectFacilityOnMap('Idaho Community Shelter')

      // Verify facility details in popup
      cy.get('[data-testid="facility-popup"]')
        .should('contain', 'Idaho Community Shelter')
        .and('contain', '12 available beds')
        .and('contain', '+12085551000')
    })
  })

  describe('Voice Services Integration Tests', () => {
    it('should enable voice actions for client communication', () => {
      const client = clientData.validClient

      cy.log('**Testing Voice Services Integration**')
      cy.navigateToClientRegistration()
      cy.fillClientBasicInfo(client)
      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      // Navigate to client details page
      const clientFullName = `${client.firstName} ${client.lastName}`
      cy.get(`[data-testid="client-${clientFullName}"]`).click()

      // Verify voice actions are available
      cy.verifyVoiceActionsEnabled()

      // Test SMS functionality
      cy.get('[data-testid="sms-action-button"]').click()
      cy.get('[data-testid="sms-message-input"]')
        .type('Welcome to Idaho Community Shelter. Your bed registration is confirmed.')
      cy.get('[data-testid="send-sms-button"]').click()

      cy.shouldHaveSuccessNotification('SMS sent successfully')
    })

    it('should activate calendar reminder agent', () => {
      const client = clientData.validClient

      cy.log('**Testing Calendar Reminder Agent**')
      cy.navigateToClientRegistration()
      cy.fillClientBasicInfo(client)
      cy.fillClientEmergencyContact(client.emergencyContact)
      cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
      cy.completeBedRegistration(client.bedRegistration)
      cy.submitClientRegistration()

      // Check reminder agent status
      cy.navigateToTab('agents')
      cy.get('[data-testid="calendar-reminder-agent"]')
        .should('be.visible')
        .and('contain', 'Active')

      // Verify agent metrics
      cy.get('[data-testid="reminder-agent-metrics"]')
        .should('contain', 'reminders scheduled')
    })
  })

  describe('Error Handling and Validation', () => {
    it('should validate required fields', () => {
      cy.log('**Testing Form Validation**')
      cy.navigateToClientRegistration()

      // Try to submit without required fields
      cy.get('[data-testid="submit-registration-button"]').click()

      // Verify validation messages
      cy.get('[data-testid="first-name-error"]')
        .should('be.visible')
        .and('contain', 'First name is required')

      cy.get('[data-testid="last-name-error"]')
        .should('be.visible')
        .and('contain', 'Last name is required')

      cy.get('[data-testid="date-of-birth-error"]')
        .should('be.visible')
        .and('contain', 'Date of birth is required')
    })

    it('should handle HMIS service unavailability gracefully', () => {
      cy.log('**Testing HMIS Service Error Handling**')
      
      // Mock HMIS service failure
      cy.intercept('GET', '**/hmis.opencommons.org/Facilities**', {
        statusCode: 503,
        body: { error: 'Service Temporarily Unavailable' }
      }).as('hmisError')

      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')

      cy.wait('@hmisError')

      // Verify graceful error handling
      cy.get('[data-testid="hmis-error-message"]')
        .should('be.visible')
        .and('contain', 'HMIS data temporarily unavailable')

      // Verify fallback data is shown
      cy.get('[data-testid="fallback-facilities-notice"]')
        .should('be.visible')
        .and('contain', 'Showing cached data')
    })
  })

  afterEach(() => {
    // Cleanup after each test
    cy.clearTestData()
  })
})