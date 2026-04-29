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

## Submission Links
- **GitHub Repository Link:** https://github.com/rippy1849/CEN5035-project
- **Frontend Team Demo Video:** [TBD]
- **Backend Team Demo Video:** [TBD]
