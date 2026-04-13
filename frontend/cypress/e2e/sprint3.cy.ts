describe('Sprint 3: Advanced Marketplace Features', () => {
  beforeEach(() => {
    // Pre-populate localStorage so the app recognizes our mock user natively
    const mockUser = {
      id: 99,
      email: 'testbuyer@ufl.edu',
      name: 'Test Buyer',
      picture: ''
    };
    
    // Intercept API calls to mock data
    // Auth Me - though localStorage might skip this depending on context logic
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: mockUser
    }).as('getAuth');

    // Listings Data
    cy.intercept('GET', '**/listings', {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'Multiple Images Listing',
          description: 'A laptop with multiple images.',
          price: 500,
          category: 'Electronics',
          user_id: 1, // Different user = We are a buyer
          images: [
            '/uploads/fake1.jpg',
            '/uploads/fake2.jpg',
            '/uploads/fake3.jpg'
          ],
          is_final_price: false
        },
        {
          id: 2,
          title: 'Final Price Listing',
          description: 'A desk with a firm price.',
          price: 50,
          category: 'Furniture',
          user_id: 1, // Different user = We are a buyer
          images: [],
          is_final_price: true
        },
        {
          id: 3,
          title: 'My Own Listing',
          description: 'My item that I am selling.',
          price: 20,
          category: 'Books',
          user_id: 99, // Our own listing = We are the seller
          images: ['/uploads/fake4.jpg'],
          is_final_price: false
        }
      ]
    }).as('getListings');
  });

  const visitWithLogin = (url) => {
    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth_token', 'fake-token-123');
        win.localStorage.setItem('auth_user', JSON.stringify({
          id: 99,
          email: 'testbuyer@ufl.edu',
          name: 'Test Buyer',
          picture: ''
        }));
      }
    });
  }

  describe('Feature: In-Card Image Carousel', () => {
    it('should display navigation arrows for listings with multiple images', () => {
      cy.visit('/');
      cy.wait('@getListings');

      // Find the card for "Multiple Images Listing"
      cy.contains('Multiple Images Listing').parents('.MuiCard-root').as('carouselCard');
      
      // Arrows should be present
      cy.get('@carouselCard').find('[data-testid="NavigateNextIcon"]').should('exist');
      cy.get('@carouselCard').find('[data-testid="NavigateBeforeIcon"]').should('exist');
    });

    it('should NOT display navigation arrows for listings with 0 or 1 image', () => {
      cy.visit('/');
      cy.wait('@getListings');

      cy.contains('Final Price Listing').parents('.MuiCard-root').as('singleCard');
      cy.get('@singleCard').find('[data-testid="NavigateNextIcon"]').should('not.exist');
    });
  });

  describe('Feature: Read-Only Listing Detail Modal', () => {
    it('should open a read-only detail modal when non-owners click View Details', () => {
      cy.visit('/');
      cy.wait('@getListings');

      // Click "View Details" on someone else's listing. (Regex ignores case)
      cy.contains('Multiple Images Listing').parents('.MuiCard-root').contains(/View Details/i).click();

      // The modal should appear (MuiDialog)
      cy.get('.MuiDialog-root').should('be.visible');
      cy.get('.MuiDialog-root').contains('Multiple Images Listing').should('be.visible');
    });
  });

  describe('Feature: Buyer Bidding & Final Price Enforcement', () => {
    it('should allow a logged-in buyer to click Place Bid on non-owned items', () => {
      visitWithLogin('/');
      cy.wait('@getListings');
      // The HTTP wait for getAuth might not happen if the app just uses localStorage instantly.

      // The Place Bid button should be visible on someone else's listing
      cy.contains('Multiple Images Listing').parents('.MuiCard-root').contains(/Place Bid/i).should('be.visible');
    });

    it('should display Price is Final badge for locked listings', () => {
      visitWithLogin('/');
      cy.wait('@getListings');

      // Find the card for "Final Price Listing"
      cy.contains('Final Price Listing').parents('.MuiCard-root').as('lockedCard');
      
      // The badge should be visible
      cy.get('@lockedCard').contains(/Price is Final/i).should('be.visible');
    });

    it('should NOT allow placing bids on owned items (should show Edit/Delete instead)', () => {
      visitWithLogin('/');
      cy.wait('@getListings');

      cy.contains('My Own Listing').parents('.MuiCard-root').as('ownedCard');
      
      cy.get('@ownedCard').contains(/Place Bid/i).should('not.exist');
      cy.get('@ownedCard').contains(/Edit/i).should('be.visible');
      cy.get('@ownedCard').contains(/Delete/i).should('be.visible');
    });
  });

  describe('Feature: Multi-Image Upload UI', () => {
    it('should render the Add Photos section when creating a listing', () => {
      visitWithLogin('/sell');

      // The form should clearly instruct the user about limits
      cy.contains(/Photos \(optional\)/i).should('be.visible');
      cy.contains(/Upload up to 5 images/i).should('be.visible');
      
      // The add photos button should exist
      cy.contains('button', /Add Photos/i).should('exist');
    });
  });
});