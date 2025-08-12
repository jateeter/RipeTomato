// ***********************************************
// This file contains custom Cypress commands for the Idaho Events application
// ***********************************************

// Client Registration Commands
Cypress.Commands.add('navigateToClientRegistration', () => {
  cy.visit('/')
  cy.get('[data-testid="client-registration-button"]', { timeout: 10000 })
    .should('be.visible')
    .click()
})

Cypress.Commands.add('fillClientBasicInfo', (clientData) => {
  cy.get('[data-testid="first-name-input"]')
    .clear()
    .type(clientData.firstName)
  
  cy.get('[data-testid="last-name-input"]')
    .clear()
    .type(clientData.lastName)
  
  cy.get('[data-testid="date-of-birth-input"]')
    .clear()
    .type(clientData.dateOfBirth)
  
  if (clientData.phone) {
    cy.get('[data-testid="phone-input"]')
      .clear()
      .type(clientData.phone)
  }
  
  if (clientData.email) {
    cy.get('[data-testid="email-input"]')
      .clear()
      .type(clientData.email)
  }
})

Cypress.Commands.add('fillClientEmergencyContact', (emergencyContact) => {
  cy.get('[data-testid="emergency-contact-name-input"]')
    .clear()
    .type(emergencyContact.name)
  
  cy.get('[data-testid="emergency-contact-phone-input"]')
    .clear()
    .type(emergencyContact.phone)
  
  cy.get('[data-testid="emergency-contact-relationship-select"]')
    .select(emergencyContact.relationship)
})

Cypress.Commands.add('selectShelterForBedRegistration', (shelterName) => {
  cy.get('[data-testid="shelter-search-input"]')
    .type(shelterName)
  
  cy.get(`[data-testid="shelter-option-${shelterName}"]`)
    .should('be.visible')
    .click()
})

Cypress.Commands.add('completeBedRegistration', (registrationData) => {
  cy.get('[data-testid="check-in-date-input"]')
    .clear()
    .type(registrationData.checkInDate)
  
  if (registrationData.checkOutDate) {
    cy.get('[data-testid="check-out-date-input"]')
      .clear()
      .type(registrationData.checkOutDate)
  }
  
  cy.get('[data-testid="bed-type-select"]')
    .select(registrationData.bedType)
  
  if (registrationData.specialRequirements) {
    cy.get('[data-testid="special-requirements-textarea"]')
      .clear()
      .type(registrationData.specialRequirements)
  }
})

Cypress.Commands.add('submitClientRegistration', () => {
  cy.get('[data-testid="submit-registration-button"]')
    .should('be.enabled')
    .click()
})

Cypress.Commands.add('verifyRegistrationSuccess', (clientName) => {
  // Check for success message
  cy.get('[data-testid="registration-success-message"]', { timeout: 15000 })
    .should('be.visible')
    .and('contain', clientName)
  
  // Verify client appears in the system
  cy.get('[data-testid="client-list"]')
    .should('contain', clientName)
})

// Calendar Integration Commands
Cypress.Commands.add('verifyCalendarEventCreated', (eventTitle) => {
  cy.get('[data-testid="calendar-view-button"]')
    .click()
  
  cy.get('[data-testid="calendar-events"]')
    .should('contain', eventTitle)
})

// Navigation Commands
Cypress.Commands.add('navigateToTab', (tabName) => {
  cy.get(`[data-testid="tab-${tabName}"]`)
    .should('be.visible')
    .click()
})

Cypress.Commands.add('navigateToServicesManager', () => {
  cy.get('[data-testid="services-manager-nav"]')
    .should('be.visible')
    .click()
})

// HMIS Integration Commands
Cypress.Commands.add('verifyHMISSync', () => {
  cy.get('[data-testid="hmis-sync-status"]')
    .should('be.visible')
    .and('not.contain', 'Error')
})

Cypress.Commands.add('triggerHMISSync', () => {
  cy.get('[data-testid="hmis-sync-button"]')
    .click()
  
  cy.get('[data-testid="hmis-sync-status"]')
    .should('contain', 'Syncing...')
    .should('not.contain', 'Syncing...', { timeout: 30000 })
})

// Voice Services Commands
Cypress.Commands.add('verifyVoiceActionsEnabled', () => {
  cy.get('[data-testid="voice-actions-panel"]')
    .should('be.visible')
  
  cy.get('[data-testid="sms-action-button"]')
    .should('be.visible')
    .and('not.be.disabled')
  
  cy.get('[data-testid="voice-call-button"]')
    .should('be.visible')
    .and('not.be.disabled')
})

// Map Integration Commands
Cypress.Commands.add('verifyMapWithSatelliteView', () => {
  cy.get('[data-testid="enhanced-map"]')
    .should('be.visible')
  
  cy.get('[data-testid="satellite-layer-toggle"]')
    .should('be.visible')
    .click()
  
  // Verify satellite layer is active
  cy.get('[data-testid="satellite-layer-toggle"]')
    .should('have.class', 'active')
})

Cypress.Commands.add('selectFacilityOnMap', (facilityName) => {
  cy.get('[data-testid="enhanced-map"]').within(() => {
    cy.get(`[data-testid="facility-marker-${facilityName}"]`)
      .click()
  })
  
  cy.get('[data-testid="facility-popup"]')
    .should('be.visible')
    .and('contain', facilityName)
})

// Wait Commands
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading-spinner"]', { timeout: 2000 }).should('not.exist')
  cy.get('body').should('be.visible')
})

Cypress.Commands.add('waitForCalendarLoad', () => {
  cy.get('[data-testid="calendar-loading"]', { timeout: 10000 }).should('not.exist')
  cy.get('[data-testid="calendar-widget"]').should('be.visible')
})

// Assertion Helpers
Cypress.Commands.add('shouldHaveSuccessNotification', (message) => {
  cy.get('[data-testid="success-notification"]')
    .should('be.visible')
    .and('contain', message)
})

Cypress.Commands.add('shouldHaveErrorNotification', (message) => {
  cy.get('[data-testid="error-notification"]')
    .should('be.visible')
    .and('contain', message)
})

// Data Cleanup Commands
Cypress.Commands.add('clearTestData', () => {
  // Clear localStorage
  cy.clearLocalStorage()
  
  // Clear any test-specific data
  cy.window().then((win) => {
    win.localStorage.clear()
    win.sessionStorage.clear()
  })
})

// Mock Data Commands  
Cypress.Commands.add('mockHMISResponse', (fixtures) => {
  cy.intercept('GET', '**/hmis.opencommons.org/Facilities**', {
    fixture: fixtures.hmis || 'hmis-facilities.json'
  }).as('hmisRequest')
})

Cypress.Commands.add('mockGoogleCalendarResponse', () => {
  cy.intercept('POST', '**/calendar/v3/calendars', {
    statusCode: 200,
    body: { id: 'test-calendar-id', summary: 'Test Calendar' }
  }).as('createCalendar')
  
  cy.intercept('POST', '**/calendar/v3/calendars/*/events', {
    statusCode: 200,
    body: { id: 'test-event-id', summary: 'Test Event' }
  }).as('createEvent')
})

// Type definitions for TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      navigateToClientRegistration(): Chainable<void>
      fillClientBasicInfo(clientData: any): Chainable<void>
      fillClientEmergencyContact(emergencyContact: any): Chainable<void>
      selectShelterForBedRegistration(shelterName: string): Chainable<void>
      completeBedRegistration(registrationData: any): Chainable<void>
      submitClientRegistration(): Chainable<void>
      verifyRegistrationSuccess(clientName: string): Chainable<void>
      verifyCalendarEventCreated(eventTitle: string): Chainable<void>
      navigateToTab(tabName: string): Chainable<void>
      navigateToServicesManager(): Chainable<void>
      verifyHMISSync(): Chainable<void>
      triggerHMISSync(): Chainable<void>
      verifyVoiceActionsEnabled(): Chainable<void>
      verifyMapWithSatelliteView(): Chainable<void>
      selectFacilityOnMap(facilityName: string): Chainable<void>
      waitForPageLoad(): Chainable<void>
      waitForCalendarLoad(): Chainable<void>
      shouldHaveSuccessNotification(message: string): Chainable<void>
      shouldHaveErrorNotification(message: string): Chainable<void>
      clearTestData(): Chainable<void>
      mockHMISResponse(fixtures: any): Chainable<void>
      mockGoogleCalendarResponse(): Chainable<void>
    }
  }
}