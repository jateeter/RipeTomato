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

// Comprehensive Service Scheduling Commands
Cypress.Commands.add('scheduleComprehensiveServices', (schedule) => {
  cy.navigateToComprehensiveServiceRegistration()
  cy.fillClientBasicInfo(schedule.client)
  cy.fillEmergencyContact(schedule.emergencyContact)
  cy.scheduleShelterService(schedule.services.shelter)
  cy.scheduleMealServices(schedule.services.meals)
  cy.scheduleTransportationService(schedule.services.transportation)
  cy.confirmAllServices()
})

Cypress.Commands.add('navigateToComprehensiveServiceRegistration', () => {
  cy.get('[data-testid="services-manager-nav"]').click()
  cy.get('[data-testid="comprehensive-service-registration"]').click()
})

Cypress.Commands.add('scheduleShelterService', (shelterConfig) => {
  cy.get('[data-testid="service-type-shelter"]').click()
  cy.get('[data-testid="facility-search-input"]').type(shelterConfig.facilityName)
  cy.get(`[data-testid="facility-option-${shelterConfig.facilityName}"]`).click()
  cy.get('[data-testid="bed-type-select"]').select(shelterConfig.bedType)
  cy.get('[data-testid="shelter-checkin-date-input"]').type(shelterConfig.checkInDate)
  cy.get('[data-testid="shelter-checkout-date-input"]').type(shelterConfig.checkOutDate)
  if (shelterConfig.specialRequirements) {
    cy.get('[data-testid="shelter-special-requirements-textarea"]').type(shelterConfig.specialRequirements)
  }
  cy.get('[data-testid="confirm-shelter-booking"]').click()
})

Cypress.Commands.add('scheduleMealServices', (mealsConfig) => {
  cy.get('[data-testid="service-type-meals"]').click()
  mealsConfig.forEach((meal, index) => {
    if (index > 0) cy.get('[data-testid="add-meal-button"]').click()
    cy.get(`[data-testid="meal-type-select-${index}"]`).select(meal.type)
    cy.get(`[data-testid="meal-date-input-${index}"]`).type(meal.date)
    cy.get(`[data-testid="meal-time-input-${index}"]`).type(meal.time)
    if (meal.location) {
      cy.get(`[data-testid="meal-location-select-${index}"]`).select(meal.location)
    }
    if (meal.dietaryRestrictions) {
      cy.get(`[data-testid="dietary-restrictions-input-${index}"]`).type(meal.dietaryRestrictions)
    }
    if (meal.notes) {
      cy.get(`[data-testid="meal-notes-input-${index}"]`).type(meal.notes)
    }
  })
  cy.get('[data-testid="confirm-meals-booking"]').click()
})

Cypress.Commands.add('scheduleTransportationService', (transportConfig) => {
  cy.get('[data-testid="service-type-transportation"]').click()
  cy.get('[data-testid="transportation-type-select"]').select(transportConfig.type)
  cy.get('[data-testid="transportation-date-input"]').type(transportConfig.date)
  cy.get('[data-testid="pickup-time-input"]').type(transportConfig.pickupTime)
  if (transportConfig.appointmentTime) {
    cy.get('[data-testid="appointment-time-input"]').type(transportConfig.appointmentTime)
  }
  if (transportConfig.returnTime) {
    cy.get('[data-testid="return-time-input"]').type(transportConfig.returnTime)
  }
  if (transportConfig.pickupLocation) {
    cy.get('[data-testid="pickup-location-input"]').type(transportConfig.pickupLocation)
  }
  cy.get('[data-testid="destination-input"]').type(transportConfig.destination)
  if (transportConfig.destinationAddress) {
    cy.get('[data-testid="destination-address-input"]').type(transportConfig.destinationAddress)
  }
  if (transportConfig.purpose) {
    cy.get('[data-testid="appointment-purpose-input"]').type(transportConfig.purpose)
  }
  if (transportConfig.notes) {
    cy.get('[data-testid="transportation-notes-textarea"]').type(transportConfig.notes)
  }
  cy.get('[data-testid="confirm-transportation-booking"]').click()
})

Cypress.Commands.add('confirmAllServices', () => {
  cy.get('[data-testid="review-complete-schedule"]').click()
  cy.get('[data-testid="confirm-all-services"]').click()
})

Cypress.Commands.add('fillEmergencyContact', (contactData) => {
  cy.get('[data-testid="emergency-contact-name-input"]').type(contactData.name)
  cy.get('[data-testid="emergency-contact-phone-input"]').type(contactData.phone)
  cy.get('[data-testid="emergency-contact-relationship-select"]').select(contactData.relationship)
})

// Service mocking commands
Cypress.Commands.add('mockServiceConflicts', () => {
  cy.intercept('GET', '**/shelters/availability', {
    statusCode: 200,
    body: { availableBeds: 0, conflicts: ['Bed already occupied'] }
  }).as('shelterConflict')
})

Cypress.Commands.add('mockTransportationService', () => {
  cy.intercept('POST', '**/transportation/book', {
    statusCode: 200,
    body: { 
      bookingId: 'TRANS-001',
      status: 'confirmed',
      driver: 'Medical Transport Service',
      vehicle: 'Van #3',
      estimatedTravelTime: '15 minutes'
    }
  }).as('transportationBooking')
})

Cypress.Commands.add('mockMealService', () => {
  cy.intercept('POST', '**/meals/reserve', {
    statusCode: 200,
    body: {
      reservationId: 'MEAL-001',
      status: 'confirmed',
      dietaryAccommodations: 'Diabetic-friendly menu available',
      servingLocation: 'Main dining hall'
    }
  }).as('mealReservation')
})

// Service verification commands
Cypress.Commands.add('verifyServiceCoordination', (serviceCount) => {
  cy.get('[data-testid="service-coordination-status"]')
    .should('contain', `${serviceCount} services coordinated`)
})

Cypress.Commands.add('verifyCalendarIntegration', (events) => {
  events.forEach(eventTitle => {
    cy.get('[data-testid="calendar-events"]')
      .should('contain', eventTitle)
  })
})

Cypress.Commands.add('verifyNotificationsSent', (notificationTypes) => {
  notificationTypes.forEach(type => {
    cy.get(`[data-testid="notification-${type}"]`)
      .should('be.visible')
  })
})

Cypress.Commands.add('verifyMapIntegration', (locations) => {
  locations.forEach(location => {
    cy.get(`[data-testid="map-location-${location}"]`)
      .should('be.visible')
  })
})

Cypress.Commands.add('verifyAgentActivation', (agentTypes) => {
  agentTypes.forEach(agentType => {
    cy.get(`[data-testid="agent-${agentType}"]`)
      .should('contain', 'Active')
  })
})

// Additional commands for missing functionality
Cypress.Commands.add('scheduleService', (serviceType, config) => {
  cy.get(`[data-testid="service-type-${serviceType}"]`).click()
  
  switch(serviceType) {
    case 'shelter':
      cy.scheduleShelterService(config)
      break
    case 'meals':
      cy.scheduleMealServices([config])
      break
    case 'transportation':
      cy.scheduleTransportationService(config)
      break
  }
})

// Map and facility verification commands
Cypress.Commands.add('verifyMapWithSatelliteView', () => {
  cy.get('[data-testid="map-container"]').should('be.visible')
  cy.get('[data-testid="satellite-layer-toggle"]').click()
  cy.wait(1000) // Allow satellite layer to load
})

Cypress.Commands.add('selectFacilityOnMap', (facilityName) => {
  cy.get(`[data-testid="map-marker-${facilityName.replace(/\s+/g, '-').toLowerCase()}"]`).click()
})

// Calendar verification commands
Cypress.Commands.add('verifyCalendarEventCreated', (eventTitle) => {
  cy.get('[data-testid="calendar-events"]')
    .should('contain', eventTitle)
})

// Notification verification commands  
Cypress.Commands.add('verifyNotificationCenter', (expectedMessage) => {
  cy.get('[data-testid="notification-center"]').should('be.visible')
  cy.get('[data-testid="notification-list"]')
    .should('contain', expectedMessage)
})

// Integration status verification
Cypress.Commands.add('verifyIntegrationStatus', () => {
  cy.get('[data-testid="integration-status-summary"]')
    .should('be.visible')
    .and('contain', 'MediaWiki: ✓ Synced')
    .and('contain', 'HMIS: ✓ Updated')
})

// Agent testing commands
Cypress.Commands.add('mockAgentServices', () => {
  // Mock agent spawning
  cy.intercept('POST', '**/agent/spawn', {
    statusCode: 200,
    body: {
      agentId: 'agent_test_' + Date.now(),
      status: 'active',
      message: 'Agent spawned successfully'
    }
  }).as('agentSpawn');

  // Mock agent notifications
  cy.intercept('GET', '**/agent/notifications/*', {
    statusCode: 200,
    body: {
      notifications: [],
      count: 0
    }
  }).as('agentNotifications');

  // Mock workflow notifications
  cy.intercept('POST', '**/agent/workflow-notification', {
    statusCode: 200,
    body: { success: true }
  }).as('workflowNotification');
});

Cypress.Commands.add('registerTestClient', (clientData) => {
  cy.get('[data-testid="services-manager-nav"]').click();
  cy.get('[data-testid="tab-configuration"]').click();
  cy.get('[data-testid="client-registration-button"]').click();
  
  // Fill basic info
  cy.get('[data-testid="first-name-input"]').type(clientData.firstName);
  cy.get('[data-testid="last-name-input"]').type(clientData.lastName);
  cy.get('[data-testid="email-input"]').type(clientData.email);
  cy.get('[data-testid="phone-input"]').type(clientData.phone);
  cy.get('[data-testid="date-of-birth-input"]').type(clientData.dateOfBirth);
  
  // Fill address
  cy.get('input[placeholder*="Street"]').type(clientData.address.street);
  cy.get('input[placeholder*="City"]').type(clientData.address.city);
  cy.get('input[placeholder*="ZIP"]').type(clientData.address.zipCode);
  
  // Fill emergency contact
  cy.get('[data-testid="emergency-contact-name-input"]').type(clientData.emergencyContact.name);
  cy.get('[data-testid="emergency-contact-relationship-input"]').type(clientData.emergencyContact.relationship);
  cy.get('[data-testid="emergency-contact-phone-input"]').type(clientData.emergencyContact.phone);
  
  // Accept consent
  cy.get('input[type="checkbox"]').check({ force: true });
  
  // Submit
  cy.get('[data-testid="submit-registration-button"]').click();
});

Cypress.Commands.add('simulateWorkflowNotification', (type, data) => {
  cy.request({
    method: 'POST',
    url: '/api/test/workflow-notification',
    body: {
      type,
      ...data,
      timestamp: new Date().toISOString()
    },
    failOnStatusCode: false
  });
});

Cypress.Commands.add('navigateToClientNotifications', (clientLastName) => {
  cy.get('[data-testid="tab-clients"]').click();
  cy.get('[data-testid="client-list"]').contains(clientLastName).click();
  cy.get('[data-testid="client-notifications-tab"]').click();
});

Cypress.Commands.add('terminateTestAgent', (agentId) => {
  cy.request({
    method: 'POST',
    url: `/api/test/agent/${agentId}/terminate`,
    failOnStatusCode: false
  });
});

// Agent monitoring commands
Cypress.Commands.add('checkAgentHealth', () => {
  cy.get('[data-testid="agent-health-section"]').should('be.visible');
  cy.get('[data-testid="healthy-agents-count"]').should('exist');
  cy.get('[data-testid="unhealthy-agents-count"]').should('exist');
});

Cypress.Commands.add('verifyAgentNotification', (notificationType, expectedContent) => {
  cy.get('[data-testid="notification-list"]')
    .should('contain', expectedContent);
  
  cy.get(`[data-testid="${notificationType}-notification"]`)
    .should('be.visible');
});

// Type definitions for TypeScript support - moved to separate .d.ts file