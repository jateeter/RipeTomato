/**
 * Integration Tests for Idaho Events Application
 * 
 * Tests the integration between major system components:
 * - HMIS OpenCommons data synchronization
 * - Google Calendar API integration  
 * - Voice services and SMS functionality
 * - Map visualization with satellite layers
 * - Reminder agent workflows
 */

describe('System Integration Tests', () => {
  beforeEach(() => {
    cy.mockHMISResponse({ hmis: 'hmis-facilities' })
    cy.mockGoogleCalendarResponse()
    cy.clearTestData()
    cy.visit('/')
    cy.waitForPageLoad()
  })

  describe('HMIS and Calendar Integration', () => {
    it('should sync HMIS data and create facility calendars', () => {
      cy.log('**Testing HMIS-Calendar Integration**')
      
      // Navigate to Services Manager
      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')
      
      // Trigger HMIS sync
      cy.triggerHMISSync()
      cy.wait('@hmisRequest')
      
      // Verify facilities loaded
      cy.get('[data-testid="facilities-statistics"]')
        .should('contain', '3 facilities')
        .and('contain', '95 total beds')
      
      // Verify calendar integration
      cy.wait('@createCalendar')
      cy.get('[data-testid="calendar-sync-status"]')
        .should('contain', 'Facility calendars synchronized')
    })

    it('should display real-time availability on map', () => {
      cy.log('**Testing Real-time Map Integration**')
      
      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')
      cy.get('[data-testid="view-toggle-map"]').click()
      
      cy.verifyMapWithSatelliteView()
      
      // Verify facility markers with real-time data
      cy.selectFacilityOnMap('Idaho Community Shelter')
      cy.get('[data-testid="facility-popup"]')
        .should('contain', '12 available beds')
        .and('contain', 'Last updated:')
    })
  })

  describe('Voice Services Integration', () => {
    it('should integrate voice actions with client registration', () => {
      cy.log('**Testing Voice-Registration Integration**')
      
      // Complete a client registration first
      cy.fixture('client-test-data').then((data) => {
        const client = data.validClient
        
        cy.navigateToClientRegistration()
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        // Verify voice actions are enabled post-registration
        const clientFullName = `${client.firstName} ${client.lastName}`
        cy.get(`[data-testid="client-${clientFullName}"]`).click()
        
        cy.verifyVoiceActionsEnabled()
        
        // Test automated SMS confirmation
        cy.get('[data-testid="registration-sms-sent"]')
          .should('be.visible')
          .and('contain', 'Confirmation SMS sent')
      })
    })

    it('should activate reminder agent with voice notifications', () => {
      cy.log('**Testing Reminder Agent Voice Integration**')
      
      cy.fixture('client-test-data').then((data) => {
        const client = data.validClient
        
        cy.navigateToClientRegistration()
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        
        // Enable voice reminders
        cy.get('[data-testid="voice-reminders-checkbox"]').check()
        cy.get('[data-testid="sms-reminders-checkbox"]').check()
        
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        // Verify reminder agent activation
        cy.navigateToTab('agents')
        cy.get('[data-testid="calendar-reminder-agent"]')
          .should('contain', 'Active')
        
        cy.get('[data-testid="reminder-agent-rules"]')
          .should('contain', 'Voice reminders enabled')
          .and('contain', 'SMS reminders enabled')
      })
    })
  })

  describe('End-to-End Workflow Integration', () => {
    it('should complete full shelter management workflow', () => {
      cy.log('**Testing Complete Shelter Management Workflow**')
      
      cy.fixture('client-test-data').then((data) => {
        const client = data.validClient
        
        // Step 1: Load HMIS facilities
        cy.navigateToServicesManager()
        cy.navigateToTab('hmis_facilities')
        cy.triggerHMISSync()
        cy.wait('@hmisRequest')
        
        // Step 2: Register client with bed assignment
        cy.navigateToClientRegistration()
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        // Step 3: Verify calendar integration
        cy.wait('@createCalendar')
        cy.wait('@createEvent')
        
        const clientFullName = `${client.firstName} ${client.lastName}`
        cy.verifyCalendarEventCreated(`Bed Registration - ${clientFullName}`)
        
        // Step 4: Verify map shows updated occupancy
        cy.navigateToServicesManager()
        cy.navigateToTab('hmis_facilities')
        cy.get('[data-testid="view-toggle-map"]').click()
        
        cy.selectFacilityOnMap(client.bedRegistration.shelterName)
        cy.get('[data-testid="facility-popup"]')
          .should('contain', '11 available beds') // One less after registration
        
        // Step 5: Verify voice services and reminders
        cy.verifyVoiceActionsEnabled()
        cy.get('[data-testid="reminder-agent-status"]')
          .should('contain', 'Monitoring calendar events')
      })
    })

    it('should handle emergency registration workflow', () => {
      cy.log('**Testing Emergency Registration Workflow**')
      
      cy.fixture('client-test-data').then((data) => {
        const client = data.urgentClient
        
        // Mark as emergency case
        cy.navigateToClientRegistration()
        cy.get('[data-testid="urgent-case-checkbox"]').check()
        
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        // Verify emergency priority handling
        const clientFullName = `${client.firstName} ${client.lastName}`
        cy.get('[data-testid="emergency-notification"]')
          .should('be.visible')
          .and('contain', 'Emergency registration processed')
        
        // Verify immediate voice notification
        cy.get('[data-testid="emergency-voice-alert"]')
          .should('be.visible')
          .and('contain', 'Emergency team notified')
        
        // Verify urgent calendar event
        cy.verifyCalendarEventCreated(`URGENT - Bed Registration - ${clientFullName}`)
        
        // Verify immediate reminder scheduling
        cy.get('[data-testid="urgent-reminders-scheduled"]')
          .should('contain', 'Immediate check-in reminders scheduled')
      })
    })
  })

  describe('Data Synchronization Tests', () => {
    it('should maintain data consistency across services', () => {
      cy.log('**Testing Cross-Service Data Consistency**')
      
      cy.fixture('client-test-data').then((data) => {
        const client = data.validClient
        
        // Register client
        cy.navigateToClientRegistration()
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        const clientFullName = `${client.firstName} ${client.lastName}`
        
        // Verify data appears in multiple places
        // 1. Client list
        cy.get('[data-testid="client-list"]')
          .should('contain', clientFullName)
        
        // 2. Calendar events
        cy.verifyCalendarEventCreated(`Bed Registration - ${clientFullName}`)
        
        // 3. Facility occupancy update
        cy.navigateToServicesManager()
        cy.navigateToTab('hmis_facilities')
        cy.get(`[data-testid="facility-${client.bedRegistration.shelterName}"]`)
          .should('contain', '11 available') // Updated occupancy
        
        // 4. Reminder agent registration
        cy.navigateToTab('agents')
        cy.get('[data-testid="reminder-agent-clients"]')
          .should('contain', clientFullName)
      })
    })

    it('should sync personal and service calendars', () => {
      cy.log('**Testing Calendar Synchronization**')
      
      cy.fixture('client-test-data').then((data) => {
        const client = data.validClient
        
        cy.navigateToClientRegistration()
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        // Verify calendar sync
        cy.wait('@createEvent', { timeout: 10000 }).should(() => {
          // Verify multiple calendar creation calls (personal + shelter)
          expect('@createEvent').to.be.called
        })
        
        // Check sync status
        cy.navigateToTab('calendar')
        cy.waitForCalendarLoad()
        
        cy.get('[data-testid="calendar-sync-rules"]')
          .should('contain', 'Personal ↔ Service Delivery')
          .and('contain', 'Synchronized')
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should gracefully handle service failures', () => {
      cy.log('**Testing Service Failure Recovery**')
      
      // Mock calendar service failure
      cy.intercept('POST', '**/calendar/v3/calendars', {
        statusCode: 503,
        body: { error: 'Service Unavailable' }
      }).as('calendarError')
      
      cy.fixture('client-test-data').then((data) => {
        const client = data.validClient
        
        cy.navigateToClientRegistration()
        cy.fillClientBasicInfo(client)
        cy.fillClientEmergencyContact(client.emergencyContact)
        cy.selectShelterForBedRegistration(client.bedRegistration.shelterName)
        cy.completeBedRegistration(client.bedRegistration)
        cy.submitClientRegistration()
        
        // Registration should still succeed
        const clientFullName = `${client.firstName} ${client.lastName}`
        cy.verifyRegistrationSuccess(clientFullName)
        
        // But calendar warning should appear
        cy.get('[data-testid="calendar-integration-warning"]')
          .should('be.visible')
          .and('contain', 'Calendar integration temporarily unavailable')
      })
    })

    it('should retry failed operations', () => {
      cy.log('**Testing Operation Retry Logic**')
      
      // Mock initial failure then success
      let callCount = 0
      cy.intercept('GET', '**/hmis.opencommons.org/Facilities**', (req) => {
        callCount++
        if (callCount === 1) {
          req.reply({ statusCode: 500, body: { error: 'Server Error' } })
        } else {
          req.reply({ fixture: 'hmis-facilities.json' })
        }
      }).as('hmisRetry')
      
      cy.navigateToServicesManager()
      cy.navigateToTab('hmis_facilities')
      
      // Should show retry indicator
      cy.get('[data-testid="hmis-retry-indicator"]')
        .should('be.visible')
        .and('contain', 'Retrying...')
      
      // Should eventually succeed
      cy.wait('@hmisRetry')
      cy.get('[data-testid="facilities-table"]')
        .should('contain', 'Idaho Community Shelter')
    })
  })

  afterEach(() => {
    cy.clearTestData()
  })
})