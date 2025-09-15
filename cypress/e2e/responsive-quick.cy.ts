/**
 * Quick responsive test to verify basic functionality
 */

describe('Quick Responsive Test', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ];

  viewports.forEach(viewport => {
    it(`should load correctly on ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/');
      
      // App should load without errors
      cy.get('[data-testid="community-services-hub"]', { timeout: 15000 })
        .should('exist');
        
      // Should have some visible content
      cy.get('body').should('contain.text', 'Community Services');
      
      // Check that content is not cut off
      cy.get('body').should('have.css', 'overflow-x', 'hidden');
    });
  });
});