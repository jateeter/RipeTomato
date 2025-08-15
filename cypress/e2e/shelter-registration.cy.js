/**
 * Shelter Registration End-to-End Test
 * 
 * Tests the complete workflow of registering a new shelter facility
 * including MediaWiki integration with HMIS OpenCommons.
 * 
 * Features tested:
 * - Authenticated shelter registration workflow
 * - MediaWiki API integration
 * - HMIS OpenCommons data synchronization
 * - Shelter capacity and services management
 * - Real-time availability updates
 */

describe('Shelter Registration and MediaWiki Integration', () => {
  let authConfig;
  let testShelterData;

  beforeEach(() => {
    // Load authentication configuration
    authConfig = Cypress.env('auth');
    
    // Generate unique test shelter data
    const timestamp = Date.now();
    testShelterData = {
      id: `shelter-${timestamp}`,
      name: `Test Community Shelter ${timestamp}`,
      description: 'A comprehensive shelter facility providing safe overnight accommodation and essential services for individuals and families experiencing homelessness.',
      address: {
        street: '456 Elm Street',
        city: 'Boise',
        state: 'Idaho',
        zipCode: '83702',
        coordinates: {
          lat: 43.6135,
          lng: -116.2023
        }
      },
      capacity: {
        totalBeds: 75,
        availableBeds: 45,
        emergencyBeds: 10
      },
      services: [
        'Overnight Shelter',
        'Meals',
        'Case Management',
        'Mental Health Services',
        'Job Training',
        'Laundry Facilities',
        'Mail Services'
      ],
      contact: {
        phone: '+1-208-555-0199',
        email: `info-${timestamp}@testcommunityshelter.org`,
        website: `https://testcommunityshelter-${timestamp}.org`
      },
      operatingHours: {
        checkinTime: '17:00',
        checkoutTime: '07:00',
        officeHours: '8:00 AM - 6:00 PM, Monday-Friday'
      },
      accessibility: {
        wheelchairAccessible: true,
        ada_compliant: true,
        features: [
          'Wheelchair accessible entrance',
          'ADA compliant bathrooms',
          'Accessible sleeping areas',
          'Hearing assistance devices'
        ]
      },
      restrictions: {
        ageGroups: ['Adults', 'Families with children'],
        demographics: ['All genders welcome'],
        requirements: [
          'Photo ID required',
          'Intake assessment',
          'No weapons policy',
          'No alcohol or drugs on premises'
        ]
      },
      registrationDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active'
    };

    // Setup API mocks for testing
    cy.mockMediaWikiAPI();
    cy.mockHMISResponse({ hmis: 'hmis-facilities' });
    cy.mockGoogleCalendarResponse();
    
    // Clear any existing test data
    cy.clearTestData();
    
    // Visit the application with authenticated user
    cy.authenticateAsTestUser();
    cy.visit('/');
    cy.waitForPageLoad();
  });

  describe('Authenticated Shelter Registration Workflow', () => {
    it('should successfully register a new shelter with full data validation', () => {
      cy.log('**🏠 STEP 1: Navigate to Shelter Management Interface**');
      
      // Navigate to shelter management section
      cy.get('[data-testid="services-manager-nav"]').click();
      cy.get('[data-testid="tab-facilities"]').click();
      
      // Access shelter registration form
      cy.get('[data-testid="add-new-shelter-button"]').should('be.visible').click();
      
      cy.log('**📝 STEP 2: Fill Shelter Basic Information**');
      
      // Basic shelter information
      cy.get('[data-testid="shelter-name-input"]')
        .clear()
        .type(testShelterData.name);
      
      cy.get('[data-testid="shelter-description-textarea"]')
        .clear()
        .type(testShelterData.description);
      
      // Address information
      cy.get('[data-testid="shelter-street-input"]')
        .clear()
        .type(testShelterData.address.street);
      
      cy.get('[data-testid="shelter-city-input"]')
        .clear()
        .type(testShelterData.address.city);
      
      cy.get('[data-testid="shelter-state-select"]')
        .select(testShelterData.address.state);
      
      cy.get('[data-testid="shelter-zipcode-input"]')
        .clear()
        .type(testShelterData.address.zipCode);
      
      // Coordinates (optional)
      cy.get('[data-testid="shelter-latitude-input"]')
        .clear()
        .type(testShelterData.address.coordinates.lat.toString());
      
      cy.get('[data-testid="shelter-longitude-input"]')
        .clear()
        .type(testShelterData.address.coordinates.lng.toString());

      cy.log('**🛏️ STEP 3: Configure Shelter Capacity**');
      
      // Capacity configuration
      cy.get('[data-testid="total-beds-input"]')
        .clear()
        .type(testShelterData.capacity.totalBeds.toString());
      
      cy.get('[data-testid="available-beds-input"]')
        .clear()
        .type(testShelterData.capacity.availableBeds.toString());
      
      cy.get('[data-testid="emergency-beds-input"]')
        .clear()
        .type(testShelterData.capacity.emergencyBeds.toString());

      cy.log('**🏥 STEP 4: Configure Services and Accessibility**');
      
      // Services selection
      testShelterData.services.forEach(service => {
        cy.get(`[data-testid="service-checkbox-${service.toLowerCase().replace(/\s+/g, '-')}"]`)
          .check();
      });
      
      // Contact information
      cy.get('[data-testid="shelter-phone-input"]')
        .clear()
        .type(testShelterData.contact.phone);
      
      cy.get('[data-testid="shelter-email-input"]')
        .clear()
        .type(testShelterData.contact.email);
      
      cy.get('[data-testid="shelter-website-input"]')
        .clear()
        .type(testShelterData.contact.website);
      
      // Operating hours
      cy.get('[data-testid="checkin-time-input"]')
        .clear()
        .type(testShelterData.operatingHours.checkinTime);
      
      cy.get('[data-testid="checkout-time-input"]')
        .clear()
        .type(testShelterData.operatingHours.checkoutTime);
      
      cy.get('[data-testid="office-hours-input"]')
        .clear()
        .type(testShelterData.operatingHours.officeHours);
      
      // Accessibility features
      cy.get('[data-testid="wheelchair-accessible-checkbox"]')
        .check();
      
      cy.get('[data-testid="ada-compliant-checkbox"]')
        .check();

      cy.log('**📋 STEP 5: Set Restrictions and Requirements**');
      
      // Age groups and demographics
      testShelterData.restrictions.ageGroups.forEach(group => {
        cy.get(`[data-testid="age-group-${group.toLowerCase().replace(/\s+/g, '-')}"]`)
          .check();
      });
      
      // Add requirements
      testShelterData.restrictions.requirements.forEach((requirement, index) => {
        cy.get('[data-testid="add-requirement-button"]').click();
        cy.get(`[data-testid="requirement-input-${index}"]`)
          .type(requirement);
      });

      cy.log('**✅ STEP 6: Submit Shelter Registration**');
      
      // Validate form completeness
      cy.get('[data-testid="form-validation-status"]')
        .should('contain', 'All required fields completed');
      
      // Submit the registration
      cy.get('[data-testid="submit-shelter-registration"]')
        .should('be.enabled')
        .click();
      
      // Wait for processing
      cy.get('[data-testid="registration-processing"]', { timeout: 15000 })
        .should('be.visible');

      cy.log('**🔄 STEP 7: Verify MediaWiki Integration**');
      
      // Wait for MediaWiki API calls
      cy.wait('@mediaWikiEdit', { timeout: 20000 });
      cy.wait('@mediaWikiQuery', { timeout: 10000 });
      
      // Verify successful registration notification
      cy.shouldHaveSuccessNotification('Shelter registered successfully');
      cy.shouldHaveSuccessNotification('HMIS OpenCommons updated');
      
      // Check MediaWiki integration status
      cy.get('[data-testid="mediawiki-integration-status"]')
        .should('be.visible')
        .and('contain', 'Successfully synced to HMIS OpenCommons')
        .and('contain', testShelterData.name);

      cy.log('**📊 STEP 8: Verify Shelter Data in System**');
      
      // Navigate to shelter listing
      cy.get('[data-testid="view-shelter-list"]').click();
      
      // Verify shelter appears in the list
      cy.get('[data-testid="shelter-list"]')
        .should('contain', testShelterData.name)
        .and('contain', testShelterData.address.city)
        .and('contain', testShelterData.capacity.totalBeds.toString());
      
      // Click on the newly created shelter
      cy.get(`[data-testid="shelter-item-${testShelterData.id}"]`).click();
      
      // Verify shelter details page
      cy.get('[data-testid="shelter-details-name"]')
        .should('contain', testShelterData.name);
      
      cy.get('[data-testid="shelter-details-capacity"]')
        .should('contain', `${testShelterData.capacity.totalBeds} beds`)
        .and('contain', `${testShelterData.capacity.availableBeds} available`);
      
      cy.get('[data-testid="shelter-details-services"]')
        .should('contain', 'Overnight Shelter')
        .and('contain', 'Case Management');

      cy.log('**🗺️ STEP 9: Verify Map Integration**');
      
      // Switch to map view
      cy.get('[data-testid="view-facilities-map"]').click();
      
      // Verify shelter appears on map
      cy.verifyMapWithSatelliteView();
      cy.selectFacilityOnMap(testShelterData.name);
      
      // Check facility popup details
      cy.get('[data-testid="facility-popup"]')
        .should('contain', testShelterData.name)
        .and('contain', testShelterData.capacity.availableBeds)
        .and('contain', 'beds available');

      cy.log('**📅 STEP 10: Verify Calendar Integration**');
      
      // Check if calendar events were created
      cy.verifyCalendarEventCreated(`Shelter Registration - ${testShelterData.name}`);
      
      // Verify facility calendar is available
      cy.get('[data-testid="facility-calendar-link"]').click();
      cy.get('[data-testid="facility-calendar"]')
        .should('be.visible')
        .and('contain', testShelterData.name);

      cy.log('**🔔 STEP 11: Verify Notification System**');
      
      // Check notification history
      cy.get('[data-testid="notification-center"]').click();
      cy.get('[data-testid="notification-list"]')
        .should('contain', 'New shelter registered')
        .and('contain', testShelterData.name);
      
      // Verify email notification was sent (mocked)
      cy.get('[data-testid="email-notifications-sent"]')
        .should('be.visible')
        .and('contain', 'Registration confirmation sent');

      cy.log('**📈 STEP 12: Verify Analytics and Reporting**');
      
      // Navigate to reports section
      cy.get('[data-testid="tab-reports"]').click();
      
      // Check facility analytics
      cy.get('[data-testid="total-facilities-count"]')
        .should('contain', '1'); // First test facility
      
      cy.get('[data-testid="total-bed-capacity"]')
        .should('contain', testShelterData.capacity.totalBeds.toString());
      
      // Verify shelter status dashboard
      cy.get('[data-testid="shelter-status-active"]')
        .should('contain', '1 active shelter');

      cy.log('**✅ STEP 13: Final Validation**');
      
      // Verify complete registration success
      cy.get('[data-testid="shelter-registration-complete"]')
        .should('be.visible')
        .and('contain', 'Registration completed successfully')
        .and('contain', testShelterData.name);
      
      // Verify system integration status
      cy.get('[data-testid="integration-status-summary"]')
        .should('contain', 'MediaWiki: ✓ Synced')
        .and('contain', 'HMIS: ✓ Updated')
        .and('contain', 'Calendar: ✓ Events created')
        .and('contain', 'Map: ✓ Location added');

      cy.log('**🎉 Shelter Registration Workflow Completed Successfully!**');
    });

    it('should handle MediaWiki API connection errors gracefully', () => {
      cy.log('**Testing MediaWiki Error Handling**');
      
      // Mock MediaWiki API failure
      cy.intercept('POST', '**/api.php', {
        statusCode: 503,
        body: { error: 'MediaWiki service temporarily unavailable' }
      }).as('mediaWikiError');
      
      // Navigate to shelter registration
      cy.get('[data-testid="services-manager-nav"]').click();
      cy.get('[data-testid="add-new-shelter-button"]').click();
      
      // Fill minimal required data
      cy.fillShelterBasicInfo(testShelterData);
      
      // Submit registration
      cy.get('[data-testid="submit-shelter-registration"]').click();
      
      // Verify error handling
      cy.shouldHaveErrorNotification('MediaWiki sync failed');
      cy.get('[data-testid="fallback-options"]')
        .should('be.visible')
        .and('contain', 'Shelter saved locally')
        .and('contain', 'Will retry sync automatically');
    });

    it('should validate required fields and show helpful error messages', () => {
      cy.log('**Testing Form Validation**');
      
      // Navigate to shelter registration
      cy.get('[data-testid="services-manager-nav"]').click();
      cy.get('[data-testid="add-new-shelter-button"]').click();
      
      // Try to submit without required fields
      cy.get('[data-testid="submit-shelter-registration"]').click();
      
      // Verify validation errors
      cy.get('[data-testid="validation-error-name"]')
        .should('be.visible')
        .and('contain', 'Shelter name is required');
      
      cy.get('[data-testid="validation-error-address"]')
        .should('be.visible')
        .and('contain', 'Complete address is required');
      
      cy.get('[data-testid="validation-error-capacity"]')
        .should('be.visible')
        .and('contain', 'Bed capacity must be specified');
    });
  });

  describe('MediaWiki Integration Tests', () => {
    it('should create properly formatted MediaWiki pages', () => {
      cy.log('**Testing MediaWiki Page Creation**');
      
      // Register a shelter
      cy.registerTestShelter(testShelterData);
      
      // Verify MediaWiki API was called with correct format
      cy.wait('@mediaWikiEdit').then((interception) => {
        const requestBody = interception.request.body;
        
        // Verify page title format
        expect(requestBody).to.contain(`title=Shelter:${testShelterData.name.replace(/\s+/g, '_')}`);
        
        // Verify wiki template usage
        expect(requestBody).to.contain('{{Shelter');
        expect(requestBody).to.contain(`|name=${testShelterData.name}`);
        expect(requestBody).to.contain(`|total_beds=${testShelterData.capacity.totalBeds}`);
        
        // Verify categories
        expect(requestBody).to.contain('[[Category:Shelters]]');
        expect(requestBody).to.contain('[[Category:HMIS Facilities]]');
      });
    });

    it('should update the facilities listing page', () => {
      cy.log('**Testing Facilities Listing Update**');
      
      // Register shelter
      cy.registerTestShelter(testShelterData);
      
      // Verify listing page update
      cy.wait('@mediaWikiListingUpdate').then((interception) => {
        const requestBody = interception.request.body;
        
        expect(requestBody).to.contain('{{ShelterListing');
        expect(requestBody).to.contain(testShelterData.name);
        expect(requestBody).to.contain(testShelterData.address.city);
      });
    });
  });

  afterEach(() => {
    // Cleanup test data
    cy.cleanupTestShelter(testShelterData.id);
    cy.clearTestData();
  });
});

// Custom Cypress commands for shelter registration testing
Cypress.Commands.add('authenticateAsTestUser', () => {
  const authConfig = Cypress.env('auth');
  
  // Mock authentication for testing
  cy.window().then((win) => {
    win.localStorage.setItem('cypress-auth-user', JSON.stringify({
      username: authConfig.testUser.username,
      role: authConfig.testUser.role,
      permissions: authConfig.testUser.permissions,
      authenticated: true
    }));
  });
});

Cypress.Commands.add('mockMediaWikiAPI', () => {
  // Mock MediaWiki API responses
  cy.intercept('GET', '**/api.php*action=query*meta=tokens*', {
    statusCode: 200,
    body: {
      query: {
        tokens: {
          csrftoken: 'test-csrf-token-123'
        }
      }
    }
  }).as('mediaWikiToken');
  
  cy.intercept('POST', '**/api.php*action=edit*', {
    statusCode: 200,
    body: {
      edit: {
        result: 'Success',
        pageid: 12345,
        title: 'Shelter:Test_Community_Shelter',
        contentmodel: 'wikitext',
        oldrevid: 0,
        newrevid: 98765,
        newtimestamp: new Date().toISOString()
      }
    }
  }).as('mediaWikiEdit');
  
  cy.intercept('POST', '**/api.php*title=Facilities*', {
    statusCode: 200,
    body: {
      edit: {
        result: 'Success',
        pageid: 54321,
        title: 'Facilities'
      }
    }
  }).as('mediaWikiListingUpdate');
  
  cy.intercept('GET', '**/api.php*action=query*titles=*', {
    statusCode: 200,
    body: {
      query: {
        pages: {
          '12345': {
            pageid: 12345,
            title: 'Test Shelter Page',
            extract: 'Test shelter content'
          }
        }
      }
    }
  }).as('mediaWikiQuery');
});

Cypress.Commands.add('fillShelterBasicInfo', (shelterData) => {
  cy.get('[data-testid="shelter-name-input"]').type(shelterData.name);
  cy.get('[data-testid="shelter-street-input"]').type(shelterData.address.street);
  cy.get('[data-testid="shelter-city-input"]').type(shelterData.address.city);
  cy.get('[data-testid="total-beds-input"]').type(shelterData.capacity.totalBeds.toString());
  cy.get('[data-testid="shelter-phone-input"]').type(shelterData.contact.phone);
  cy.get('[data-testid="shelter-email-input"]').type(shelterData.contact.email);
});

Cypress.Commands.add('registerTestShelter', (shelterData) => {
  cy.get('[data-testid="services-manager-nav"]').click();
  cy.get('[data-testid="add-new-shelter-button"]').click();
  cy.fillShelterBasicInfo(shelterData);
  cy.get('[data-testid="submit-shelter-registration"]').click();
});

Cypress.Commands.add('cleanupTestShelter', (shelterId) => {
  // Mock cleanup for testing environment
  cy.log(`Cleaning up test shelter: ${shelterId}`);
});