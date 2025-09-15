/**
 * End-to-End Test for Client Registration Workflow
 * 
 * Tests the complete flow of registering a new shelter client including:
 * - Client registration form submission
 * - Client-owned Solid Pod creation
 * - PII storage and access control setup
 * - Staff credential management
 * - Data retrieval and display
 * 
 * @license MIT
 */

describe('Client Registration E2E Workflow', () => {
  // Test data
  const testClient = {
    firstName: 'John',
    lastName: 'Doe',
    preferredName: 'Johnny',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    pronouns: 'he/him',
    phoneNumber: '555-0123',
    email: 'john.doe@example.com',
    housingStatus: 'unsheltered',
    urgencyLevel: 'high',
    hasChildren: false,
    veteranStatus: true,
    disabilityStatus: false,
    preferredContactMethod: 'phone',
    languagePreference: 'English'
  };

  const testStaff = {
    id: 'staff_001',
    name: 'Jane Smith',
    webId: 'https://jane.solid.community/profile/card#me',
    role: 'CASE_MANAGER'
  };

  beforeEach(() => {
    // Visit the main application
    cy.visit('/');
    
    // Wait for application to load
    cy.get('[data-testid="app-loaded"]').should('exist');
    
    // Mock Solid authentication
    cy.window().then((win) => {
      // Mock session object
      (win as any).mockSolidSession = {
        info: {
          sessionId: 'test-session-123',
          isLoggedIn: true,
          webId: testStaff.webId
        },
        fetch: cy.stub().as('solidFetch')
      };
    });

    // Intercept API calls
    cy.intercept('POST', '**/pod-creation', { 
      statusCode: 201,
      body: { podUrl: 'https://test-client.solid.community/' }
    }).as('podCreation');
    
    cy.intercept('POST', '**/pii-credentials', {
      statusCode: 201,
      body: { credentialId: 'cred_123_test' }
    }).as('piiCredentials');
    
    cy.intercept('GET', '**/client-data/**', {
      statusCode: 200,
      body: {
        id: 'CL_JD_123',
        basicInfo: testClient,
        status: 'active'
      }
    }).as('clientData');
  });

  it('should complete the full client registration workflow', () => {
    // Step 1: Navigate to client registration
    // Wait for app to load, then click on the management tab if available
    cy.get('body').should('be.visible');
    
    // Try to find and click the client registration menu item
    // First look for a tab or menu button
    cy.get('body').then(($body) => {
      if ($body.find('[key="client-registration"]').length > 0) {
        cy.get('[key="client-registration"]').click();
      } else if ($body.find('button:contains("New Registration")').length > 0) {
        cy.get('button:contains("New Registration")').click();
      } else {
        // Try to find any dropdown or menu that might contain client registration
        cy.get('button:contains("Management"), button:contains("Client"), button:contains("Register")').first().click();
      }
    });
    
    // Verify registration form loads
    cy.get('[data-testid="client-registration-form"]').should('be.visible');
    cy.get('h1').should('contain', 'New Client Registration');

    // Step 2: Fill out basic information
    cy.get('[data-testid="input-firstName"]').type(testClient.firstName);
    cy.get('[data-testid="input-lastName"]').type(testClient.lastName);
    cy.get('[data-testid="input-preferredName"]').type(testClient.preferredName);
    cy.get('[data-testid="input-dateOfBirth"]').type(testClient.dateOfBirth);
    
    // Verify age calculation
    cy.get('[data-testid="calculated-age"]').should('contain', '39 years');
    
    cy.get('[data-testid="select-gender"]').select(testClient.gender);
    cy.get('[data-testid="input-pronouns"]').type(testClient.pronouns);

    // Step 3: Fill out contact information
    cy.get('[data-testid="input-phoneNumber"]').type(testClient.phoneNumber);
    cy.get('[data-testid="input-email"]').type(testClient.email);

    // Step 4: Complete initial assessment
    cy.get('[data-testid="select-housingStatus"]').select(testClient.housingStatus);
    cy.get('[data-testid="select-urgencyLevel"]').select(testClient.urgencyLevel);
    
    // Check veteran status
    if (testClient.veteranStatus) {
      cy.get('[data-testid="checkbox-veteranStatus"]').check();
    }
    
    if (testClient.hasChildren) {
      cy.get('[data-testid="checkbox-hasChildren"]').check();
    }
    
    if (testClient.disabilityStatus) {
      cy.get('[data-testid="checkbox-disabilityStatus"]').check();
    }

    // Step 5: Set service preferences
    cy.get('[data-testid="select-preferredContactMethod"]').select(testClient.preferredContactMethod);
    cy.get('[data-testid="input-languagePreference"]').clear().type(testClient.languagePreference);

    // Step 6: Configure data sharing consent
    cy.get('[data-testid="checkbox-consent-caseNotes"]').check();
    cy.get('[data-testid="checkbox-consent-emergencyContact"]').check();
    
    // For high-risk clients, medical consent might be important
    if (testClient.urgencyLevel === 'high') {
      cy.get('[data-testid="checkbox-consent-medicalInfo"]').check();
    }

    // Step 7: Submit registration
    cy.get('[data-testid="submit-registration"]').click();

    // Step 8: Verify registration progress
    cy.get('[data-testid="registration-progress"]').should('be.visible');
    cy.get('[data-testid="progress-message"]').should('contain', 'Validating intake information');
    
    // Wait for pod creation step
    cy.get('[data-testid="progress-message"]', { timeout: 10000 })
      .should('contain', 'Creating client-owned Solid Pod');
    
    // Wait for data storage step
    cy.get('[data-testid="progress-message"]', { timeout: 10000 })
      .should('contain', 'Storing client data securely');
    
    // Wait for access setup step
    cy.get('[data-testid="progress-message"]', { timeout: 10000 })
      .should('contain', 'Setting up staff access credentials');
    
    // Wait for completion
    cy.get('[data-testid="progress-message"]', { timeout: 15000 })
      .should('contain', 'Client registration completed successfully');

    // Step 9: Verify successful registration
    cy.get('[data-testid="registration-success"]').should('be.visible');
    cy.get('[data-testid="success-title"]').should('contain', 'Registration Successful');
    
    // Verify client details are displayed
    cy.get('[data-testid="client-id"]').should('exist').and('contain', 'CL_JD_');
    cy.get('[data-testid="pod-url"]').should('exist').and('contain', 'https://');
    cy.get('[data-testid="staff-credential-id"]').should('exist');
    cy.get('[data-testid="client-access-code"]').should('exist');

    // Step 10: Test PII access workflow
    cy.get('[data-testid="test-access-client-data"]').click();
    
    // Should prompt for access justification
    cy.get('[data-testid="access-justification-modal"]').should('be.visible');
    cy.get('[data-testid="input-access-reason"]')
      .type('Initial case management assessment and service planning');
    cy.get('[data-testid="submit-access-request"]').click();

    // Step 11: Verify client data viewer
    cy.get('[data-testid="secure-client-data-viewer"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="client-basic-info"]').should('be.visible');
    cy.get('[data-testid="client-first-name"]').should('contain', testClient.firstName);
    cy.get('[data-testid="client-last-name"]').should('contain', testClient.lastName);
    
    // Verify access level indicator
    cy.get('[data-testid="access-level-indicator"]').should('be.visible');
    cy.get('[data-testid="access-level-badge"]').should('contain', 'FINANCIAL ACCESS');

    // Step 12: Test data editing functionality
    cy.get('[data-testid="edit-basic-info"]').click();
    cy.get('[data-testid="edit-mode-active"]').should('be.visible');
    
    // Make a small change
    cy.get('[data-testid="edit-input-preferredName"]').clear().type('John');
    cy.get('[data-testid="save-basic-info"]').click();
    
    // Verify save confirmation
    cy.get('[data-testid="save-success"]').should('be.visible');
    cy.get('[data-testid="client-preferred-name"]').should('contain', 'John');

    // Step 13: Verify audit logging
    cy.get('[data-testid="view-audit-log"]').click();
    cy.get('[data-testid="audit-log-entries"]').should('be.visible');
    cy.get('[data-testid="audit-entry"]').should('have.length.at.least', 3);
    
    // Should have entries for: pod creation, data access, data update
    cy.get('[data-testid="audit-entry"]').first().should('contain', 'DATA_UPDATED');
    cy.get('[data-testid="audit-entry"]').eq(1).should('contain', 'DATA_ACCESSED');
    cy.get('[data-testid="audit-entry"]').last().should('contain', 'POD_CREATED');

    // Step 14: Test client pod verification
    cy.get('[data-testid="verify-pod-integrity"]').click();
    cy.get('[data-testid="pod-verification-status"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain', 'Pod verification successful');

    // Step 15: Test registration data export
    cy.get('[data-testid="export-registration-data"]').click();
    cy.get('[data-testid="export-format-json"]').click();
    
    // Verify download was initiated
    cy.readFile('cypress/downloads/client-registration.json', { timeout: 10000 })
      .should('exist');

    // Verify API calls were made correctly
    cy.get('@podCreation').should('have.been.calledOnce');
    cy.get('@piiCredentials').should('have.been.calledOnce');
    cy.get('@clientData').should('have.been.called');
  });

  it('should handle registration errors gracefully', () => {
    // Mock failure responses
    cy.intercept('POST', '**/pod-creation', { 
      statusCode: 500,
      body: { error: 'Pod creation service unavailable' }
    }).as('podCreationError');

    // Navigate to registration
    cy.get('[data-testid="nav-client-registration"]').click();
    
    // Fill minimum required fields
    cy.get('[data-testid="input-firstName"]').type('Test');
    cy.get('[data-testid="input-lastName"]').type('Client');
    cy.get('[data-testid="input-dateOfBirth"]').type('1990-01-01');
    cy.get('[data-testid="select-housingStatus"]').select('unsheltered');
    cy.get('[data-testid="select-preferredContactMethod"]').select('in_person');

    // Submit registration
    cy.get('[data-testid="submit-registration"]').click();

    // Verify error handling
    cy.get('[data-testid="registration-error"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Pod creation service unavailable');
    
    // Verify retry option
    cy.get('[data-testid="retry-registration"]').should('be.visible').and('be.enabled');
    
    // Verify form data is preserved
    cy.get('[data-testid="retry-registration"]').click();
    cy.get('[data-testid="input-firstName"]').should('have.value', 'Test');
    cy.get('[data-testid="input-lastName"]').should('have.value', 'Client');
  });

  it('should validate form data before submission', () => {
    // Navigate to registration
    cy.get('[data-testid="nav-client-registration"]').click();
    
    // Try to submit empty form
    cy.get('[data-testid="submit-registration"]').click();
    
    // Should show validation errors
    cy.get('[data-testid="validation-errors"]').should('be.visible');
    cy.get('[data-testid="error-firstName"]').should('contain', 'First name is required');
    cy.get('[data-testid="error-lastName"]').should('contain', 'Last name is required');
    cy.get('[data-testid="error-dateOfBirth"]').should('contain', 'Date of birth is required');

    // Fill some fields but leave others empty
    cy.get('[data-testid="input-firstName"]').type('John');
    cy.get('[data-testid="input-lastName"]').type('Doe');
    
    // Try invalid date of birth (future date)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    cy.get('[data-testid="input-dateOfBirth"]').type(futureDate.toISOString().split('T')[0]);
    
    cy.get('[data-testid="submit-registration"]').click();
    cy.get('[data-testid="validation-errors"]').should('be.visible');
    cy.get('[data-testid="error-dateOfBirth"]').should('contain', 'Invalid date of birth');
  });

  it('should handle different user roles and access levels', () => {
    // Test with different staff roles
    const roles = ['VOLUNTEER', 'STAFF', 'CASE_MANAGER', 'MEDICAL_STAFF', 'ADMINISTRATOR'];
    
    roles.forEach((role) => {
      cy.window().then((win) => {
        (win as any).mockSolidSession.userRole = role;
      });

      // Navigate to registration
      cy.get('[data-testid="nav-client-registration"]').click();
      
      // Verify role-based UI adaptations
      cy.get('[data-testid="staff-role-indicator"]').should('contain', role);
      
      // Different roles should have different access levels available
      if (role === 'VOLUNTEER') {
        cy.get('[data-testid="access-level-basic"]').should('be.visible');
        cy.get('[data-testid="access-level-medical"]').should('not.exist');
      } else if (role === 'MEDICAL_STAFF') {
        cy.get('[data-testid="access-level-basic"]').should('be.visible');
        cy.get('[data-testid="access-level-medical"]').should('be.visible');
        cy.get('[data-testid="access-level-financial"]').should('not.exist');
      } else if (role === 'CASE_MANAGER') {
        cy.get('[data-testid="access-level-basic"]').should('be.visible');
        cy.get('[data-testid="access-level-medical"]').should('be.visible');
        cy.get('[data-testid="access-level-financial"]').should('be.visible');
      }
    });
  });

  it('should preserve client data sovereignty', () => {
    // Complete a registration
    cy.get('[data-testid="nav-client-registration"]').click();
    
    // Fill registration form quickly
    cy.get('[data-testid="input-firstName"]').type(testClient.firstName);
    cy.get('[data-testid="input-lastName"]').type(testClient.lastName);
    cy.get('[data-testid="input-dateOfBirth"]').type(testClient.dateOfBirth);
    cy.get('[data-testid="select-housingStatus"]').select(testClient.housingStatus);
    cy.get('[data-testid="select-preferredContactMethod"]').select(testClient.preferredContactMethod);
    
    cy.get('[data-testid="submit-registration"]').click();
    
    // Wait for completion
    cy.get('[data-testid="registration-success"]', { timeout: 20000 }).should('be.visible');
    
    // Get the client access code
    cy.get('[data-testid="client-access-code"]').invoke('text').as('accessCode');
    
    // Verify pod ownership
    cy.get('[data-testid="verify-pod-ownership"]').click();
    cy.get('[data-testid="pod-ownership-status"]').should('contain', 'Client owns this pod');
    
    // Test client access code functionality
    cy.get('@accessCode').then((accessCode) => {
      cy.get('[data-testid="test-client-access-code"]').click();
      cy.get('[data-testid="input-client-access-code"]').type(accessCode as string);
      cy.get('[data-testid="validate-access-code"]').click();
      
      cy.get('[data-testid="access-code-validation"]').should('contain', 'Valid access code');
    });
    
    // Verify staff access is limited and audited
    cy.get('[data-testid="view-staff-permissions"]').click();
    cy.get('[data-testid="staff-permissions-list"]').should('be.visible');
    cy.get('[data-testid="permission-entry"]').should('have.length', 1); // Only intake staff initially
    
    // All staff access should have justification
    cy.get('[data-testid="permission-entry"]').first()
      .find('[data-testid="permission-justification"]')
      .should('contain', 'Initial registration and case management access');
  });

  after(() => {
    // Clean up test data
    cy.task('cleanupTestData', {
      clientId: 'CL_JD_*',
      podUrl: 'https://test-client.solid.community/'
    });
  });
});