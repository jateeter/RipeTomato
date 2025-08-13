/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    // Basic registration commands
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

    // Comprehensive service scheduling commands
    scheduleComprehensiveServices(schedule: any): Chainable<void>
    navigateToComprehensiveServiceRegistration(): Chainable<void>
    scheduleShelterService(shelterConfig: any): Chainable<void>
    scheduleMealServices(mealsConfig: any[]): Chainable<void>
    scheduleTransportationService(transportConfig: any): Chainable<void>
    confirmAllServices(): Chainable<void>
    fillEmergencyContact(contactData: any): Chainable<void>
    
    // Service mocking commands
    mockServiceConflicts(): Chainable<void>
    mockTransportationService(): Chainable<void>
    mockMealService(): Chainable<void>

    // Service verification commands
    verifyServiceCoordination(serviceCount: number): Chainable<void>
    verifyCalendarIntegration(events: string[]): Chainable<void>
    verifyNotificationsSent(notificationTypes: string[]): Chainable<void>
    verifyMapIntegration(locations: string[]): Chainable<void>
    verifyAgentActivation(agentTypes: string[]): Chainable<void>
  }
}