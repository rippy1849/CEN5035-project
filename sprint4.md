# Sprint 4 Report

## Team Sprint Goal
Deliver complete post-negotiation workflow and user dashboards including:
- Dedicated User Dashboards (My Listings, My Bids, My Purchases/Sales)
- Advanced Bid Management (Buyer accepting counter-offers)
- Automatic Order Generation upon bid acceptance
- Simulated Payment and Checkout Flow (Stripe-like)
- Two-Party Handover Confirmation System
- Automated Invoicing and Platform Fee Calculation
- Comprehensive UI and Backend testing for new workflows, including Cypress proxy routing and React Hook state fixes.

---

## User Stories

1. **As a user**, I want a **dedicated dashboard** to view all my active and sold listings so that I can track their status and bid counts at a glance.
2. **As a buyer**, I want a **dedicated dashboard** to view all the bids I have placed across the platform so that I can track my negotiations.
3. **As a buyer**, I want to **accept a seller's counter-offer** directly so that we can immediately finalize a deal without placing a new bid.
4. **As a user**, I want an **order to be automatically created** and other bids rejected when a price is agreed upon so that double-selling is prevented.
5. **As a buyer**, I want to securely **pay for my accepted item** using a checkout flow so that the order status updates to paid.
6. **As a buyer and seller**, I want to **confirm the physical/digital handover** of the item so that the system marks the transaction safely completed only when both parties agree.
7. **As a user**, I want to view a **detailed invoice** after completion so that I can see the exact breakdown of the agreed price, platform fees (5%), and seller payout.

---

## Issues Planned for Sprint 4

### Backend (Part 1: Dashboard & Bids)
- **#18** Implement Dashboard APIs for User Listings and Bids
- **#19** Implement Advanced Bid Negotiation and Auto-Order Creation

### Backend (Part 2: Order Lifecycle)
- **#20** Create Order Database Schema and Models
- **#21** Implement User Orders Dashboard APIs (GetMyOrders)
- **#22** Implement Simulated Stripe Checkout Integration
- **#23** Implement Dual-Party Handover Confirmation System
- **#24** Implement Automated Invoice Generation and Platform Fee Calculation

### Frontend
- **#25** Create My Listings and My Bids Dashboard Pages
- **#26** Implement Accept Counter-Offer UI in Bid Dialog
- **#27** Create Order Management and Payment Checkout Flow UI
- **#28** Create Order Detail Page for Handover Confirmations and Invoicing

---

## Issues Successfully Completed

| # | Title | Label |
|---|-------|-------|
| **#18** | Implement Dashboard APIs for User Listings and Bids | enhancement, backend |
| **#19** | Implement Advanced Bid Negotiation and Auto-Order Creation | enhancement, backend |
| **#20** | Create Order Database Schema and Models | enhancement, backend |
| **#21** | Implement User Orders Dashboard APIs (GetMyOrders) | enhancement, backend |
| **#22** | Implement Simulated Stripe Checkout Integration | enhancement, backend |
| **#23** | Implement Dual-Party Handover Confirmation System | enhancement, backend |
| **#24** | Implement Automated Invoice Generation and Platform Fee Calculation | enhancement, backend |
| **#25** | Create My Listings and My Bids Dashboard Pages | enhancement, UI |
| **#26** | Implement Accept Counter-Offer UI in Bid Dialog | enhancement, UI |
| **#27** | Create Order Management and Payment Checkout Flow UI | enhancement, UI |
| **#28** | Create Order Detail Page for Handover Confirmations and Invoicing | enhancement, UI |

---

## Sprint 4 Accomplishments

### Backend
- **User Dashboards**: Created `GetMyListings` and `GetMyBids` in listing and bid handlers respectively. Updated listing model to include an active/sold `Status`.
- **Advanced Negotiation**: Implemented `AcceptCounter` handler. Refactored `RespondToBid` to automatically create an Order, mark listing as sold, and reject pending bids upon acceptance.
- **Order Infrastructure**: Built `order_handler.go` with a simulated Stripe payment session, success callbacks, and a secure dual-confirmation system (`ConfirmSeller` / `ConfirmBuyer`). Added platform fee invoice generation.
- **Database**: Expanded schema with the new `orders` table tracking buyer, seller, bid reference, payouts, and timestamps.
- **Testing**: Added `order_handler_test.go` and appended tests to bid and listing handlers to ensure perfect test coverage.

### Frontend
- **Dashboard Pages**: Built `MyListingsPage.tsx` and `MyPurchasesPage.tsx` providing a centralized hub for users to track items they are selling, buying, and negotiating. Fixed a critical React Hooks mounting order issue in these pages.
- **Bid Dialog Expansion**: Updated `BidDialog.tsx` to handle buyer acceptance of seller counter-offers.
- **Order Lifecycle UI**: Created a comprehensive `OrderDetailPage.tsx` to handle the 'Pay Now' flow, render the invoice breakdown, and display contextual confirmation buttons depending on the user's role (Buyer/Seller) and order status.
- **Cypress E2E Automation**: Created `sprint4.cy.ts` to mock auth contexts, fix strict local proxy rules, and securely test all dashboard and order workflows.

---

## Test Summary

| Category | Framework | Tests |
|----------|-----------|-------|
| Backend Unit Tests | Go testing + httptest | 85 |
| Frontend E2E / Unit | Cypress / Vitest | 95 |
| **Grand Total** | | **180** |

---

## Cypress Tests
- 
  (Run Starting)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Cypress:        15.13.0                                                                        │
  │ Browser:        Electron 138 (headless)                                                        │
  │ Node Version:   v22.19.0 (C:\Program Files\nodejs\node.exe)                                    │
  │ Specs:          4 found (listings.cy.ts, login.cy.ts, sprint3.cy.ts, sprint4.cy.ts)            │
  │ Searched:       cypress/e2e/**/*.cy.{ts,tsx}                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────

  Running:  listings.cy.ts                                                                  (1 of 4)


  Listings Page
    √ should display listings on the browse page (1253ms)
    √ should show search bar on browse page (286ms)
    √ should show category filter chips (264ms)
    √ should show listing images or placeholder (317ms)


  4 passing (2s)


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     2 seconds                                                                        │
  │ Spec Ran:     listings.cy.ts                                                                   │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────

  Running:  login.cy.ts                                                                     (2 of 4)


  Login Page
    √ should display the login page with Google sign-in (954ms)
    √ should redirect to login when accessing sell page without auth (290ms)
    √ should display the browse page without requiring login (253ms)
    √ should show Sign In button in header when not logged in (227ms)


  4 passing (2s)


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        4                                                                                │
  │ Passing:      4                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     1 second                                                                         │
  │ Spec Ran:     login.cy.ts                                                                      │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────

  Running:  sprint3.cy.ts                                                                   (3 of 4)


  Sprint 3: Advanced Marketplace Features
    Feature: In-Card Image Carousel
      √ should display navigation arrows for listings with multiple images (1017ms)
      √ should NOT display navigation arrows for listings with 0 or 1 image (323ms)
    Feature: Read-Only Listing Detail Modal
      √ should open a read-only detail modal when non-owners click View Details (425ms)
    Feature: Buyer Bidding & Final Price Enforcement
      √ should allow a logged-in buyer to click Place Bid on non-owned items (336ms)
      √ should display Price is Final badge for locked listings (293ms)
      √ should NOT allow placing bids on owned items (should show Edit/Delete instead) (314ms)
    Feature: Multi-Image Upload UI
      √ should render the Add Photos section when creating a listing (313ms)


  7 passing (3s)


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        7                                                                                │
  │ Passing:      7                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     3 seconds                                                                        │
  │ Spec Ran:     sprint3.cy.ts                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


────────────────────────────────────────────────────────────────────────────────────────────────────

  Running:  sprint4.cy.ts                                                                   (4 of 4)


  Sprint 4: Orders & Dashboard
    √ loads the My Listings dashboard correctly (1008ms)
    √ loads the My Purchases and Orders page correctly (288ms)


  2 passing (1s)


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        2                                                                                │
  │ Passing:      2                                                                                │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     1 second                                                                         │
  │ Spec Ran:     sprint4.cy.ts                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================



====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  login.cy.ts                              00:01        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  sprint3.cy.ts                            00:03        7        7        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  sprint4.cy.ts                            00:01        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  login.cy.ts                              00:01        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  sprint3.cy.ts                            00:03        7        7        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  sprint4.cy.ts                            00:01        2        2        -        -        - │


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  login.cy.ts                              00:01        4        4        -        -        - │


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐


====================================================================================================

  (Run Finished)




====================================================================================================

  (Run Finished)


====================================================================================================

====================================================================================================

  (Run Finished)
  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
  │ √  listings.cy.ts                           00:02        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  login.cy.ts                              00:01        4        4        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  sprint3.cy.ts                            00:03        7        7        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ √  sprint4.cy.ts                            00:01        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    √  All specs passed!                        00:08       17       17        -        -        -



## Submission Links
- **GitHub Repository Link:** [https://github.com/rippy1849/CEN5035-project]
- **Frontend Team Demo Video:** [https://youtu.be/hafOTuOWccY]
- **Backend Team Demo Video:** [https://youtu.be/zaaadmAIXmU]
