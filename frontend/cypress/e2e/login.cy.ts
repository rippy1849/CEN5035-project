describe('Login Page', () => {
  it('should display the login page with Google sign-in', () => {
    cy.visit('/login');

    // Verify page renders with key elements
    cy.contains('Sign In').should('be.visible');
    cy.contains('GatorMarketplace').should('be.visible');
    cy.contains('@ufl.edu').should('be.visible');
    cy.contains('University of Florida students').should('be.visible');
  });

  it('should redirect to login when accessing sell page without auth', () => {
    cy.visit('/sell');

    // Should redirect to /login since user is not authenticated
    cy.url().should('include', '/login');
  });

  it('should display the browse page without requiring login', () => {
    cy.visit('/');

    // Browse page should be accessible without login
    cy.contains('Find Great Deals').should('be.visible');
    cy.contains('From Fellow Gators').should('be.visible');
  });

  it('should show Sign In button in header when not logged in', () => {
    cy.visit('/');

    cy.contains('Sign In').should('be.visible');
  });
});
