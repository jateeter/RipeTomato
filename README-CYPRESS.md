# Cypress End-to-End Testing Guide

This document provides comprehensive guidance for running and maintaining Cypress tests for the Idaho Events shelter management application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Application dependencies installed (`npm install`)
- Application running on `http://localhost:3000`

### Running Tests

```bash
# Open Cypress Test Runner (interactive mode)
npm run cy:open

# Run all tests headlessly
npm run cy:run

# Run tests with specific browser
npm run cy:run:chrome
npm run cy:run:firefox

# Run tests with dev server coordination
npm run test:e2e        # Headless with server startup
npm run test:e2e:open   # Interactive with server startup
```

## 📁 Test Structure

```
cypress/
├── e2e/                          # End-to-end test specs
│   ├── client-registration.cy.js # Main client registration workflow
│   └── integration-tests.cy.js   # Cross-system integration tests
├── fixtures/                     # Test data and mock responses
│   ├── client-test-data.json     # Client registration test data
│   ├── hmis-facilities.json      # Mock HMIS facility data
│   └── calendar-events.json      # Mock calendar event data
├── support/                      # Custom commands and utilities
│   ├── commands.js               # Custom Cypress commands
│   ├── e2e.js                   # Global test configuration
│   ├── component.js             # Component testing support
│   └── component-index.html     # Component test HTML template
└── cypress.config.js            # Cypress configuration
```

## 🧪 Test Categories

### 1. Client Registration Workflow Tests

**File**: `cypress/e2e/client-registration.cy.js`

Tests the complete client registration process including:
- ✅ Basic client information entry
- ✅ Emergency contact information
- ✅ Shelter bed registration
- ✅ Calendar integration
- ✅ HMIS data synchronization
- ✅ Voice services integration
- ✅ Map integration with satellite layers

**Key Test Cases**:
```javascript
// Complete registration flow
cy.navigateToClientRegistration()
cy.fillClientBasicInfo(clientData)
cy.fillClientEmergencyContact(emergencyContact)
cy.selectShelterForBedRegistration(shelterName)
cy.completeBedRegistration(registrationData)
cy.submitClientRegistration()
cy.verifyRegistrationSuccess(clientName)
```

### 2. System Integration Tests

**File**: `cypress/e2e/integration-tests.cy.js`

Tests integration between major system components:
- 🔄 HMIS OpenCommons data synchronization
- 📅 Google Calendar API integration
- 📞 Voice services and SMS functionality
- 🗺️ Map visualization with satellite layers
- 🔔 Reminder agent workflows

## 🛠️ Custom Commands

The application includes specialized Cypress commands for testing shelter management workflows:

### Client Registration Commands
```javascript
cy.navigateToClientRegistration()
cy.fillClientBasicInfo(clientData)
cy.fillClientEmergencyContact(emergencyContact)
cy.selectShelterForBedRegistration(shelterName)
cy.completeBedRegistration(registrationData)
cy.submitClientRegistration()
cy.verifyRegistrationSuccess(clientName)
```

### Calendar Integration Commands
```javascript
cy.verifyCalendarEventCreated(eventTitle)
cy.waitForCalendarLoad()
```

### HMIS Integration Commands
```javascript
cy.verifyHMISSync()
cy.triggerHMISSync()
cy.mockHMISResponse(fixtures)
```

### Voice Services Commands
```javascript
cy.verifyVoiceActionsEnabled()
cy.mockGoogleCalendarResponse()
```

### Map Integration Commands
```javascript
cy.verifyMapWithSatelliteView()
cy.selectFacilityOnMap(facilityName)
```

## 🎯 Test Data and Fixtures

### Client Test Data (`cypress/fixtures/client-test-data.json`)

Provides various client scenarios:
- **validClient**: Complete client with all information
- **clientWithoutEmail**: Client registration without email
- **urgentClient**: Emergency registration scenario
- **youthClient**: Minor client with guardian requirements

### HMIS Facilities Data (`cypress/fixtures/hmis-facilities.json`)

Mock HMIS OpenCommons facility data including:
- Idaho Community Shelter (50 beds, 12 available)
- Boise Family Shelter (25 beds, 8 available)  
- Youth Services Center (20 beds, 5 available)

### Calendar Events (`cypress/fixtures/calendar-events.json`)

Mock calendar event responses for:
- Bed registration events
- Check-in reminders
- Emergency placements
- Staff meetings

## 📊 Test Scenarios Covered

### ✅ Happy Path Scenarios
1. **Complete Registration Flow**
   - New client registration with full information
   - Bed assignment to available shelter
   - Calendar event creation
   - Voice services activation
   - HMIS data synchronization

2. **Partial Registration**
   - Registration without optional fields (email)
   - Successfully completes with required data only

### ⚡ Emergency Scenarios
1. **Urgent Client Registration**
   - Priority handling for emergency cases
   - Immediate notification systems
   - Expedited bed assignment

2. **Youth Client Registration**
   - Guardian notification requirements
   - Specialized youth services integration

### 🔄 Integration Scenarios
1. **HMIS-Calendar Integration**
   - Real-time facility data synchronization
   - Automatic calendar creation for facilities

2. **Voice-Registration Integration**  
   - Automated SMS confirmations
   - Voice reminder activation

3. **End-to-End Workflow**
   - Complete shelter management process
   - Cross-system data consistency

### 🛡️ Error Handling Scenarios
1. **Service Failures**
   - Graceful degradation when external services fail
   - Retry mechanisms for failed operations

2. **Validation Errors**
   - Required field validation
   - Data format validation

## 🔧 Configuration

### Cypress Configuration (`cypress.config.js`)

Key settings:
- **baseUrl**: `http://localhost:3000`
- **viewportWidth**: 1280px
- **viewportHeight**: 720px
- **defaultCommandTimeout**: 10 seconds
- **video**: Enabled for test recordings
- **screenshots**: Enabled on test failures

### Environment Variables

```javascript
env: {
  testUser: {
    email: 'test@example.com',
    phone: '+12085551234'
  }
}
```

## 🚀 Running Tests in CI/CD

The application includes a GitHub Actions workflow (`.github/workflows/cypress.yml`) that:

1. **Multi-Browser Testing**
   - Tests against Chrome, Firefox, and Edge
   - Parallel execution for faster feedback

2. **Artifact Collection**
   - Screenshots on test failures
   - Video recordings of all tests
   - Lighthouse performance audits

3. **Cypress Cloud Integration**
   - Test result recording and analytics
   - Historical test data tracking

## 📈 Best Practices

### 1. Test Data Management
- Use fixtures for consistent test data
- Clear test data between tests
- Mock external service responses

### 2. Robust Selectors
- Use `data-testid` attributes for reliable element selection
- Avoid depending on CSS classes or text content

### 3. Wait Strategies
- Use custom wait commands (`waitForPageLoad`, `waitForCalendarLoad`)
- Implement proper timeout handling
- Wait for API responses with `cy.wait()`

### 4. Error Handling
- Test both success and failure scenarios
- Verify graceful error handling
- Test retry mechanisms

## 🐛 Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase command timeout in configuration
   - Add explicit waits for slow operations
   - Check network requests are properly mocked

2. **Element not found errors**
   - Verify `data-testid` attributes exist in components
   - Check element visibility with `.should('be.visible')`
   - Use `.should('exist')` before interactions

3. **API request failures**
   - Ensure mock responses match expected format
   - Check intercept patterns match actual requests
   - Verify fixture files exist and are valid JSON

### Debugging Tips

1. **Interactive Mode**
   - Use `npm run cy:open` for visual debugging
   - Add `cy.pause()` to stop execution at specific points
   - Use browser DevTools during test execution

2. **Logging**
   - Add `cy.log()` statements for test flow visibility
   - Use `cy.task('log', message)` for Node.js console output

3. **Screenshots**
   - Tests automatically capture screenshots on failures
   - Add manual screenshots with `cy.screenshot()`

## 🎯 Test Coverage Goals

The Cypress test suite aims to cover:

- ✅ **Client Registration**: 100% of registration workflows
- ✅ **Calendar Integration**: All calendar-related functionality  
- ✅ **HMIS Integration**: Data synchronization and display
- ✅ **Voice Services**: SMS and voice call functionality
- ✅ **Map Integration**: Satellite view and facility interaction
- ✅ **Error Handling**: All major error scenarios
- ✅ **Cross-Browser**: Chrome, Firefox, Edge compatibility

## 📚 Additional Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [GitHub Actions for Cypress](https://docs.cypress.io/guides/continuous-integration/github-actions)