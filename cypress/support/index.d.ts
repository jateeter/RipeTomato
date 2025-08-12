/// <reference types="cypress" />

declare namespace Cypress {
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