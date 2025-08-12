// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// This is a great place to put global configuration and behavior 
// that modifies Cypress.
// ***********************************************************

import './commands'

// Hide fetch/XHR requests from command log to reduce noise
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style')
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }'
  style.setAttribute('data-hide-command-log-request', '')
  app.document.head.appendChild(style)
}

// Global test configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore certain types of errors that don't affect test functionality
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  return true
})

// Add custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('visible', function () {
    const obj = this._obj
    this.assert(
      Cypress.dom.isVisible(obj),
      'expected #{this} to be visible',
      'expected #{this} not to be visible',
      true,
      Cypress.dom.isVisible(obj)
    )
  })
})