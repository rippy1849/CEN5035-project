describe('Listings Page', () => {
  it('should display listings on the browse page', () => {
    cy.visit('/');
    // The browse/listings page should be accessible
    cy.contains('Find Great Deals').should('be.visible');
  });

  it('should show search bar on browse page', () => {
    cy.visit('/');
    // Search functionality should be present
    cy.get('input[placeholder*="Search"]').should('exist');
  });

  it('should show category filter chips', () => {
    cy.visit('/');
    // Category filter chips should exist
    cy.contains('Electronics').should('be.visible');
    cy.contains('Books').should('be.visible');
  });

  it('should show listing images or placeholder', () => {
    cy.visit('/');
    // Listing cards should have images (either uploaded or placeholder)
    cy.get('img').should('have.length.greaterThan', 0);
  });
});
