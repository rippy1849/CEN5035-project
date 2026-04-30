/// <reference types="cypress" />

describe('Sprint 4: Orders & Dashboard', () => {
  const mockUser = {
    id: 99,
    email: 'testuser@ufl.edu',
    name: 'Test User',
    picture: ''
  };

  beforeEach(() => {
    localStorage.setItem('auth_token', 'fake-token-123');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    
    cy.intercept('GET', '**/auth/me', {
      statusCode: 200,
      body: mockUser
    }).as('getAuth');

    // Dashboard intercepts
    cy.intercept('GET', 'http://localhost:8080/my/listings', {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'My Active Item',
          description: 'Selling this',
          price: 100,
          category: 'Books',
          user_id: 99,
          status: 'active',
          bid_count: 2,
          images: []
        },
        {
          id: 2,
          title: 'My Sold Item',
          description: 'Sold this',
          price: 200,
          category: 'Electronics',
          user_id: 99,
          status: 'sold',
          bid_count: 5,
          images: []
        }
      ]
    }).as('getMyListings');

    cy.intercept('GET', 'http://localhost:8080/my/bids', {
      statusCode: 200,
      body: [
        {
          id: 1,
          listing_id: 3,
          buyer_id: 99,
          amount: 50,
          status: 'pending',
          listing_title: 'Cool Item',
          listing_price: 60
        }
      ]
    }).as('getMyBids');

    // Orders intercepts
    cy.intercept('GET', 'http://localhost:8080/orders', {
      statusCode: 200,
      body: [
        {
          id: 1,
          listing_id: 4,
          buyer_id: 99,
          seller_id: 100,
          agreed_price: 100,
          status: 'payment_pending',
          listing_title: 'Bought Item'
        }
      ]
    }).as('getOrders');
  });

  it('loads the My Listings dashboard correctly', () => {
    cy.visit('/my/listings');
    cy.wait('@getMyListings');
    
    cy.contains('My Listings');
    cy.contains('My Active Item');
    cy.contains('My Sold Item');
    // Ensure status is visually indicated (assuming there's a sold badge or similar)
    cy.contains('sold', { matchCase: false });
  });

  it('loads the My Purchases and Orders page correctly', () => {
    cy.visit('/my/purchases');
    cy.wait('@getOrders');
    
    cy.contains('Bought Item');
    cy.contains('Payment Pending', { matchCase: false });
  });
});
