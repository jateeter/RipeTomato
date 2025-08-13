/**
 * Comprehensive Service Scheduling End-to-End Test
 * 
 * Tests the complete workflow of scheduling multiple services for a client:
 * 1. Shelter bed registration
 * 2. Two meals scheduling (lunch and dinner)
 * 3. Transportation to doctor appointment
 * 4. Calendar integration and notifications
 * 5. Service coordination and confirmations
 */

describe('Comprehensive Service Scheduling Workflow', () => {
  let clientData
  let serviceSchedule

  beforeEach(() => {
    // Load test data
    cy.fixture('client-test-data').then((data) => {
      clientData = data.validClient
    })
    
    // Define comprehensive service schedule
    serviceSchedule = {
      client: {
        firstName: 'Maria',
        lastName: 'Rodriguez',
        dateOfBirth: '1988-03-15',
        phone: '+12085554321',
        email: 'maria.rodriguez@example.com',
        medicalNotes: 'Diabetes management - requires regular meals and transportation to medical appointments'
      },
      emergencyContact: {
        name: 'Carlos Rodriguez',
        phone: '+12085554322',
        relationship: 'Brother'
      },
      services: {
        shelter: {
          facilityName: 'Idaho Community Shelter',
          bedType: 'Single',
          checkInDate: '2024-01-20',
          checkOutDate: '2024-01-27',
          specialRequirements: 'Ground floor preferred for mobility, diabetic dietary needs'
        },
        meals: [
          {
            type: 'lunch',
            date: '2024-01-21',
            time: '12:00',
            location: 'Idaho Community Shelter - Dining Hall',
            dietaryRestrictions: 'Diabetic-friendly, low sodium',
            notes: 'First meal after check-in'
          },
          {
            type: 'dinner',
            date: '2024-01-21',
            time: '18:00',
            location: 'Idaho Community Shelter - Dining Hall',
            dietaryRestrictions: 'Diabetic-friendly, low sodium',
            notes: 'Evening meal coordination'
          }
        ],
        transportation: {
          type: 'medical_appointment',
          date: '2024-01-22',
          pickupTime: '09:30',
          appointmentTime: '10:30',
          returnTime: '12:00',
          pickupLocation: 'Idaho Community Shelter - Main Entrance',
          destination: 'Boise Medical Center - Endocrinology Department',
          destinationAddress: '1055 N Curtis Rd, Boise, ID 83706',
          purpose: 'Diabetes management consultation',
          wheelchairAccessible: false,
          notes: 'Regular check-up, may need prescription pickup'
        }
      }
    }
    
    // Setup service mocks
    cy.mockHMISResponse({ hmis: 'hmis-facilities' })
    cy.mockGoogleCalendarResponse()
    cy.mockTransportationService()
    cy.mockMealService()
    
    // Clear any existing test data
    cy.clearTestData()
    
    // Visit the application
    cy.visit('/')
    cy.waitForPageLoad()
  })

  describe('Complete Service Coordination Workflow', () => {
    it('should successfully schedule shelter bed, meals, and medical transportation', () => {
      cy.log('**🏠 STEP 1: Navigate to Comprehensive Service Registration**')
      
      // Navigate to unified service registration
      cy.get('[data-testid="services-manager-nav"]').click()
      cy.get('[data-testid="comprehensive-service-registration"]').click()
      
      cy.log('**👤 STEP 2: Register Client with Medical Needs**')
      
      // Fill client basic information
      cy.get('[data-testid="client-first-name-input"]')
        .clear()
        .type(serviceSchedule.client.firstName)
      
      cy.get('[data-testid="client-last-name-input"]')
        .clear()
        .type(serviceSchedule.client.lastName)
      
      cy.get('[data-testid="client-dob-input"]')
        .clear()
        .type(serviceSchedule.client.dateOfBirth)
      
      cy.get('[data-testid="client-phone-input"]')
        .clear()
        .type(serviceSchedule.client.phone)
      
      cy.get('[data-testid="client-email-input"]')
        .clear()
        .type(serviceSchedule.client.email)
      
      // Add medical notes
      cy.get('[data-testid="medical-notes-textarea"]')
        .clear()
        .type(serviceSchedule.client.medicalNotes)
      
      // Emergency contact
      cy.get('[data-testid="emergency-contact-name-input"]')
        .clear()
        .type(serviceSchedule.emergencyContact.name)
      
      cy.get('[data-testid="emergency-contact-phone-input"]')
        .clear()
        .type(serviceSchedule.emergencyContact.phone)
      
      cy.get('[data-testid="emergency-contact-relationship-select"]')
        .select(serviceSchedule.emergencyContact.relationship)

      cy.log('**🏠 STEP 3: Schedule Shelter Bed with Special Requirements**')
      
      // Navigate to shelter scheduling section
      cy.get('[data-testid="service-type-shelter"]').click()
      
      // Search and select shelter facility
      cy.get('[data-testid="facility-search-input"]')
        .type(serviceSchedule.services.shelter.facilityName)
      
      cy.get(`[data-testid="facility-option-${serviceSchedule.services.shelter.facilityName}"]`)
        .should('be.visible')
        .click()
      
      // Verify facility availability
      cy.get('[data-testid="facility-availability-status"]')
        .should('contain', 'Available')
        .and('contain', 'beds available')
      
      // Select bed type
      cy.get('[data-testid="bed-type-select"]')
        .select(serviceSchedule.services.shelter.bedType)
      
      // Set dates
      cy.get('[data-testid="shelter-checkin-date-input"]')
        .clear()
        .type(serviceSchedule.services.shelter.checkInDate)
      
      cy.get('[data-testid="shelter-checkout-date-input"]')
        .clear()
        .type(serviceSchedule.services.shelter.checkOutDate)
      
      // Add special requirements
      cy.get('[data-testid="shelter-special-requirements-textarea"]')
        .clear()
        .type(serviceSchedule.services.shelter.specialRequirements)
      
      // Confirm shelter reservation
      cy.get('[data-testid="confirm-shelter-booking"]').click()
      
      // Verify shelter booking confirmation
      cy.get('[data-testid="shelter-booking-confirmation"]')
        .should('be.visible')
        .and('contain', serviceSchedule.client.firstName)
        .and('contain', serviceSchedule.services.shelter.facilityName)

      cy.log('**🍽️ STEP 4: Schedule Two Meals with Dietary Restrictions**')
      
      // Navigate to meal scheduling section
      cy.get('[data-testid="service-type-meals"]').click()
      
      // Schedule first meal (lunch)
      cy.get('[data-testid="add-meal-button"]').click()
      
      cy.get('[data-testid="meal-type-select-0"]')
        .select(serviceSchedule.services.meals[0].type)
      
      cy.get('[data-testid="meal-date-input-0"]')
        .clear()
        .type(serviceSchedule.services.meals[0].date)
      
      cy.get('[data-testid="meal-time-input-0"]')
        .clear()
        .type(serviceSchedule.services.meals[0].time)
      
      cy.get('[data-testid="meal-location-select-0"]')
        .select(serviceSchedule.services.meals[0].location)
      
      cy.get('[data-testid="dietary-restrictions-input-0"]')
        .clear()
        .type(serviceSchedule.services.meals[0].dietaryRestrictions)
      
      cy.get('[data-testid="meal-notes-input-0"]')
        .clear()
        .type(serviceSchedule.services.meals[0].notes)
      
      // Schedule second meal (dinner)
      cy.get('[data-testid="add-meal-button"]').click()
      
      cy.get('[data-testid="meal-type-select-1"]')
        .select(serviceSchedule.services.meals[1].type)
      
      cy.get('[data-testid="meal-date-input-1"]')
        .clear()
        .type(serviceSchedule.services.meals[1].date)
      
      cy.get('[data-testid="meal-time-input-1"]')
        .clear()
        .type(serviceSchedule.services.meals[1].time)
      
      cy.get('[data-testid="meal-location-select-1"]')
        .select(serviceSchedule.services.meals[1].location)
      
      cy.get('[data-testid="dietary-restrictions-input-1"]')
        .clear()
        .type(serviceSchedule.services.meals[1].dietaryRestrictions)
      
      cy.get('[data-testid="meal-notes-input-1"]')
        .clear()
        .type(serviceSchedule.services.meals[1].notes)
      
      // Confirm meal reservations
      cy.get('[data-testid="confirm-meals-booking"]').click()
      
      // Verify meal bookings
      cy.get('[data-testid="meals-booking-confirmation"]')
        .should('be.visible')
        .and('contain', '2 meals scheduled')
        .and('contain', 'Diabetic-friendly')

      cy.log('**🚌 STEP 5: Schedule Medical Transportation**')
      
      // Navigate to transportation scheduling section
      cy.get('[data-testid="service-type-transportation"]').click()
      
      // Select transportation type
      cy.get('[data-testid="transportation-type-select"]')
        .select(serviceSchedule.services.transportation.type)
      
      // Set appointment date and times
      cy.get('[data-testid="transportation-date-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.date)
      
      cy.get('[data-testid="pickup-time-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.pickupTime)
      
      cy.get('[data-testid="appointment-time-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.appointmentTime)
      
      cy.get('[data-testid="return-time-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.returnTime)
      
      // Set locations
      cy.get('[data-testid="pickup-location-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.pickupLocation)
      
      cy.get('[data-testid="destination-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.destination)
      
      cy.get('[data-testid="destination-address-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.destinationAddress)
      
      // Set purpose and notes
      cy.get('[data-testid="appointment-purpose-input"]')
        .clear()
        .type(serviceSchedule.services.transportation.purpose)
      
      cy.get('[data-testid="transportation-notes-textarea"]')
        .clear()
        .type(serviceSchedule.services.transportation.notes)
      
      // Accessibility requirements
      if (!serviceSchedule.services.transportation.wheelchairAccessible) {
        cy.get('[data-testid="wheelchair-accessible-checkbox"]').should('not.be.checked')
      }
      
      // Confirm transportation booking
      cy.get('[data-testid="confirm-transportation-booking"]').click()
      
      // Verify transportation booking
      cy.get('[data-testid="transportation-booking-confirmation"]')
        .should('be.visible')
        .and('contain', 'Transportation scheduled')
        .and('contain', 'Boise Medical Center')

      cy.log('**📅 STEP 6: Review and Confirm Complete Service Schedule**')
      
      // Navigate to schedule review
      cy.get('[data-testid="review-complete-schedule"]').click()
      
      // Verify all services are scheduled
      cy.get('[data-testid="service-schedule-summary"]').should('be.visible')
      
      // Verify shelter service
      cy.get('[data-testid="scheduled-shelter-service"]')
        .should('contain', serviceSchedule.services.shelter.facilityName)
        .and('contain', serviceSchedule.services.shelter.checkInDate)
        .and('contain', serviceSchedule.services.shelter.bedType)
      
      // Verify meal services
      cy.get('[data-testid="scheduled-meal-services"]')
        .should('contain', '2 meals')
        .and('contain', 'lunch')
        .and('contain', 'dinner')
        .and('contain', 'Diabetic-friendly')
      
      // Verify transportation service
      cy.get('[data-testid="scheduled-transportation-service"]')
        .should('contain', 'Medical appointment')
        .and('contain', serviceSchedule.services.transportation.date)
        .and('contain', 'Boise Medical Center')
      
      // Final confirmation
      cy.get('[data-testid="confirm-all-services"]').click()

      cy.log('**✅ STEP 7: Verify Calendar Integration and Notifications**')
      
      // Wait for calendar integration
      cy.wait('@createCalendar', { timeout: 10000 })
      cy.wait('@createEvent', { timeout: 10000 })
      
      // Verify calendar events created
      const clientFullName = `${serviceSchedule.client.firstName} ${serviceSchedule.client.lastName}`
      
      // Check shelter calendar event
      cy.verifyCalendarEventCreated(`Shelter Registration - ${clientFullName}`)
      
      // Check meal calendar events
      cy.verifyCalendarEventCreated(`Lunch Service - ${clientFullName}`)
      cy.verifyCalendarEventCreated(`Dinner Service - ${clientFullName}`)
      
      // Check transportation calendar event
      cy.verifyCalendarEventCreated(`Medical Transportation - ${clientFullName}`)
      
      // Verify service coordination calendar
      cy.get('[data-testid="service-coordination-calendar"]')
        .should('be.visible')
        .and('contain', 'January 20-27')
        .and('contain', '4 scheduled services')

      cy.log('**📱 STEP 8: Verify SMS and Voice Notifications**')
      
      // Verify SMS confirmations sent
      cy.get('[data-testid="sms-notifications-sent"]')
        .should('be.visible')
        .and('contain', '4 confirmations sent')
        .and('contain', serviceSchedule.client.phone)
      
      // Verify notification content
      cy.get('[data-testid="notification-shelter"]')
        .should('contain', 'Shelter bed confirmed')
        .and('contain', serviceSchedule.services.shelter.checkInDate)
      
      cy.get('[data-testid="notification-meals"]')
        .should('contain', 'Meals scheduled')
        .and('contain', '2 meals')
      
      cy.get('[data-testid="notification-transportation"]')
        .should('contain', 'Transportation confirmed')
        .and('contain', 'medical appointment')
      
      // Verify emergency contact notifications
      cy.get('[data-testid="emergency-contact-notified"]')
        .should('be.visible')
        .and('contain', serviceSchedule.emergencyContact.name)
        .and('contain', 'Service schedule shared')

      cy.log('**🗺️ STEP 9: Verify Map Integration and Route Planning**')
      
      // Navigate to service map view
      cy.get('[data-testid="view-services-map"]').click()
      
      // Verify map shows all service locations
      cy.verifyMapWithSatelliteView()
      
      // Check shelter location marker
      cy.selectFacilityOnMap(serviceSchedule.services.shelter.facilityName)
      cy.get('[data-testid="facility-popup"]')
        .should('contain', serviceSchedule.client.firstName)
        .and('contain', 'Check-in: ' + serviceSchedule.services.shelter.checkInDate)
      
      // Check transportation route
      cy.get('[data-testid="transportation-route"]')
        .should('be.visible')
        .and('contain', 'Pickup → Medical Center')
      
      // Verify estimated travel time
      cy.get('[data-testid="estimated-travel-time"]')
        .should('contain', 'minutes')
        .and('contain', 'route')

      cy.log('**🧠 STEP 10: Verify Intelligent Agent Activation**')
      
      // Navigate to agents dashboard
      cy.get('[data-testid="agents-dashboard"]').click()
      
      // Verify calendar reminder agent activated
      cy.get('[data-testid="calendar-reminder-agent"]')
        .should('contain', 'Active')
        .and('contain', '4 events monitored')
      
      // Verify reminder rules created
      cy.get('[data-testid="reminder-rules-list"]')
        .should('contain', 'Shelter check-in reminder')
        .and('contain', 'Meal time reminders')
        .and('contain', 'Transportation pickup reminder')
        .and('contain', 'Medical appointment reminder')
      
      // Check reminder schedule
      cy.get('[data-testid="upcoming-reminders"]')
        .should('contain', '8 reminders scheduled')
        .and('contain', 'SMS and voice notifications')

      cy.log('**📊 STEP 11: Verify Service Coordination Dashboard**')
      
      // Navigate to service coordination view
      cy.get('[data-testid="service-coordination-dashboard"]').click()
      
      // Verify all services coordinated
      cy.get('[data-testid="coordination-status"]')
        .should('contain', 'All services coordinated')
        .and('contain', '100% scheduled')
      
      // Check service timeline
      cy.get('[data-testid="service-timeline"]')
        .should('be.visible')
        .and('contain', 'Jan 20: Shelter check-in')
        .and('contain', 'Jan 21: Meals (2)')
        .and('contain', 'Jan 22: Medical transport')
      
      // Verify staff assignments
      cy.get('[data-testid="staff-assignments"]')
        .should('contain', 'Case manager assigned')
        .and('contain', 'Transportation coordinator')
        .and('contain', 'Meal service coordinator')
      
      // Check emergency protocols
      cy.get('[data-testid="emergency-protocols"]')
        .should('contain', 'Medical emergency plan active')
        .and('contain', 'Diabetes management protocols')

      cy.log('**✅ STEP 12: Final Verification and Success Confirmation**')
      
      // Verify overall success notification
      cy.shouldHaveSuccessNotification('Complete service schedule confirmed')
      
      // Verify client record updated
      cy.get('[data-testid="client-service-record"]')
        .should('contain', clientFullName)
        .and('contain', '4 services scheduled')
        .and('contain', 'Active status')
      
      // Verify all integrations working
      cy.get('[data-testid="integration-status"]')
        .should('contain', 'Calendar: ✓ Synchronized')
        .and('contain', 'HMIS: ✓ Updated')
        .and('contain', 'Voice: ✓ Notifications sent')
        .and('contain', 'Maps: ✓ Routes planned')
      
      // Final success verification
      cy.get('[data-testid="comprehensive-scheduling-success"]')
        .should('be.visible')
        .and('contain', 'Service coordination completed successfully')
        .and('contain', `${clientFullName} - All services scheduled`)

      cy.log('**🎉 Complete Service Scheduling Workflow Successfully Completed!**')
    })

    it('should handle service conflicts and provide alternatives', () => {
      cy.log('**Testing Service Conflict Resolution**')
      
      // Simulate booking conflicts
      cy.mockServiceConflicts()
      
      // Attempt to schedule overlapping services
      cy.navigateToComprehensiveServiceRegistration()
      cy.fillClientBasicInfo(serviceSchedule.client)
      
      // Try to book already-occupied bed
      cy.scheduleService('shelter', {
        ...serviceSchedule.services.shelter,
        bedType: 'Already Occupied Bed'
      })
      
      // Verify conflict detection
      cy.get('[data-testid="service-conflict-detected"]')
        .should('be.visible')
        .and('contain', 'Bed unavailable')
      
      // Verify alternative suggestions
      cy.get('[data-testid="alternative-suggestions"]')
        .should('contain', 'Alternative beds available')
        .and('contain', 'Similar facilities nearby')
      
      // Accept alternative suggestion
      cy.get('[data-testid="accept-alternative-bed"]').click()
      
      // Verify successful alternative booking
      cy.shouldHaveSuccessNotification('Alternative bed reserved successfully')
    })

    it('should coordinate services across multiple days with dependencies', () => {
      cy.log('**Testing Multi-Day Service Dependencies**')
      
      // Extended schedule with dependencies
      const extendedSchedule = {
        ...serviceSchedule,
        services: {
          ...serviceSchedule.services,
          additionalMedicalAppointments: [
            {
              date: '2024-01-23',
              time: '14:00',
              purpose: 'Follow-up blood work',
              transportationNeeded: true
            },
            {
              date: '2024-01-25',
              time: '11:00',
              purpose: 'Prescription review',
              transportationNeeded: true
            }
          ],
          medicationSchedule: [
            {
              medication: 'Metformin',
              times: ['08:00', '20:00'],
              withMeals: true,
              startDate: '2024-01-20',
              endDate: '2024-01-27'
            }
          ]
        }
      }
      
      // Schedule complex multi-day services
      cy.scheduleComprehensiveServices(extendedSchedule)
      
      // Verify dependency management
      cy.get('[data-testid="service-dependencies"]')
        .should('contain', 'Medication tied to meal times')
        .and('contain', 'Transportation for medical appointments')
        .and('contain', '7-day coordination plan')
      
      // Verify calendar shows full week
      cy.get('[data-testid="weekly-service-calendar"]')
        .should('contain', '14 scheduled events')
        .and('contain', 'Daily medication reminders')
    })
  })

  describe('Service Integration and Error Handling', () => {
    it('should gracefully handle partial service failures', () => {
      cy.log('**Testing Partial Service Failure Recovery**')
      
      // Mock partial service failure
      cy.intercept('POST', '**/transportation/book', {
        statusCode: 503,
        body: { error: 'Transportation service temporarily unavailable' }
      }).as('transportationFailure')
      
      // Schedule services with expected failure
      cy.scheduleComprehensiveServices(serviceSchedule)
      
      // Verify partial success
      cy.get('[data-testid="partial-scheduling-result"]')
        .should('contain', 'Shelter and meals confirmed')
        .and('contain', 'Transportation pending')
      
      // Verify fallback options
      cy.get('[data-testid="transportation-alternatives"]')
        .should('contain', 'Public transit options')
        .and('contain', 'Volunteer driver program')
        .and('contain', 'Taxi voucher available')
    })

    it('should maintain service continuity across system updates', () => {
      cy.log('**Testing Service Continuity**')
      
      // Schedule initial services
      cy.scheduleComprehensiveServices(serviceSchedule)
      
      // Simulate system update/restart
      cy.clearLocalStorage()
      cy.reload()
      cy.waitForPageLoad()
      
      // Verify services persist
      cy.get('[data-testid="persistent-services"]')
        .should('contain', serviceSchedule.client.firstName)
        .and('contain', '4 active services')
      
      // Verify calendar integration maintained
      cy.verifyCalendarEventCreated(`Shelter Registration - ${serviceSchedule.client.firstName} ${serviceSchedule.client.lastName}`)
    })
  })

  afterEach(() => {
    // Cleanup test data
    cy.clearTestData()
    cy.clearLocalStorage()
  })
})

// Additional custom commands for comprehensive service scheduling
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
  cy.get('[data-testid="confirm-shelter-booking"]').click()
})

Cypress.Commands.add('scheduleMealServices', (mealsConfig) => {
  cy.get('[data-testid="service-type-meals"]').click()
  mealsConfig.forEach((meal, index) => {
    if (index > 0) cy.get('[data-testid="add-meal-button"]').click()
    cy.get(`[data-testid="meal-type-select-${index}"]`).select(meal.type)
    cy.get(`[data-testid="meal-date-input-${index}"]`).type(meal.date)
    cy.get(`[data-testid="meal-time-input-${index}"]`).type(meal.time)
    cy.get(`[data-testid="dietary-restrictions-input-${index}"]`).type(meal.dietaryRestrictions)
  })
  cy.get('[data-testid="confirm-meals-booking"]').click()
})

Cypress.Commands.add('scheduleTransportationService', (transportConfig) => {
  cy.get('[data-testid="service-type-transportation"]').click()
  cy.get('[data-testid="transportation-type-select"]').select(transportConfig.type)
  cy.get('[data-testid="transportation-date-input"]').type(transportConfig.date)
  cy.get('[data-testid="pickup-time-input"]').type(transportConfig.pickupTime)
  cy.get('[data-testid="destination-input"]').type(transportConfig.destination)
  cy.get('[data-testid="appointment-purpose-input"]').type(transportConfig.purpose)
  cy.get('[data-testid="confirm-transportation-booking"]').click()
})

Cypress.Commands.add('confirmAllServices', () => {
  cy.get('[data-testid="review-complete-schedule"]').click()
  cy.get('[data-testid="confirm-all-services"]').click()
})

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