// ***********************************************************
// This file is processed and loaded automatically before your 
// component test files.
// ***********************************************************

import './commands'

// Import CSS for component testing
import '../../src/index.css'

import { mount } from 'cypress/react18'

// Add custom mount command for component testing
Cypress.Commands.add('mount', mount)

// Example command for component testing
Cypress.Commands.add('mountWithProviders', (component, options = {}) => {
  const wrapped = component
  return cy.mount(wrapped, options)
})