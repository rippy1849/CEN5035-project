# Sprint 3 Report

## Team Sprint Goal
Deliver advanced marketplace features including:
- Optional Multi-Image upload and management
- 5-Bid Negotiation system for price bargaining
- Seller ability to mark/unmark final prices
- Enhanced UI with in-card image carousels and read-only detail modals
- Comprehensive testing (Unit + Integration) for all new features

---

## User Stories

1. **As a seller**, I want to **upload multiple images** for my item so that I can show different angles and conditions to potential buyers.
2. **As a buyer**, I want to **browse through images** of an item directly on the listing card so that I can quickly evaluate it while scrolling.
3. **As a buyer**, I want to **place up to 5 bids** on an item so that I can negotiate the price with the seller.
4. **As a seller**, I want to **accept, reject, or counter** bids so that I can manage negotiations efficiently.
5. **As a seller**, I want to **mark a price as final** so that I can stop accepting new bids once a deal is close or determined.
6. **As a user**, I want to see a **read-only detail view** for listings I don't own so that I can see full descriptions and images without entering "Edit" mode.

---

## Issues Planned for Sprint 3

### Backend
- **#9** Implement Multi-Image Upload API and Filesystem Storage (Person A)
- **#10** Implement Static File Serving for Uploaded Assets (Person A)
- **#11** Implement 5-Bid Negotiation Backend Logic: Place, Get, and Respond (Person B)
- **#12** Implement Final Price Toggling Logic and Constraints (Person B)

### Frontend
- **#13** Multi-Image Upload UI and Form Management (Person C)
- **#14** In-Card Image Carousel with Navigation and Indicators (Person C)
- **#15** Buyer Bidding Dialog with 5-Bid Limit Enforcement (Person D)
- **#16** Seller Bid Management Panel and Final Price Toggle UI (Person D)
- **#17** Read-Only Listing Detail Modal for Non-Owners (Person C/D)

---

## Issues Successfully Completed

| # | Title | Label |
|---|-------|-------|
| **#9** | Implement Multi-Image Upload API and Filesystem Storage | enhancement, backend |
| **#10** | Implement Static File Serving for Uploaded Assets | backend |
| **#11** | Implement 5-Bid Negotiation Backend Logic | enhancement, backend |
| **#12** | Implement Final Price Toggling Logic and Constraints | enhancement, backend |
| **#13** | Multi-Image Upload UI and Form Management | enhancement, UI |
| **#14** | In-Card Image Carousel with Navigation and Indicators | enhancement, UI |
| **#15** | Buyer Bidding Dialog with 5-Bid Limit Enforcement | enhancement, UI |
| **#16** | Seller Bid Management Panel and Final Price Toggle UI | enhancement, UI |
| **#17** | Read-Only Listing Detail Modal for Non-Owners | enhancement, UI |

---

## Sprint 3 Accomplishments

### Backend
- **Multi-Image Support**: Created `image_handler.go` to handle `multipart/form-data` uploads, saving files to `./uploads/` with unique naming.
- **Negotiation System**: Implemented `bid_handler.go` managing a strict 5-bid limit per buyer/listing. Support for `pending`, `accepted`, `countered`, and `rejected` statuses.
- **Final Price Control**: Added `is_final_price` toggle endpoints (`PUT /listings/{id}/final-price` and `PUT /listings/{id}/unmark-final-price`) with ownership enforcement.
- **Database**: Expanded schema with `listing_images` and `bids` tables.

### Frontend
- **In-Card Carousel**: Integrated a sleek image carousel into `ListingCard.tsx` with overlay navigation arrows and pill-style dot indicators.
- **Bidding UI**: Created `BidDialog.tsx` for buyers and a robust `BidManagementPanel.tsx` for sellers to handle counter-offers and status updates.
- **Detail View**: Implemented `ListingDetailModal.tsx` to separate "View Details" (read-only) from "Edit" (owner-only), improving user intent clarity.
- **UI Polish**: Added "Price is Final" badges, green/outlined toggle buttons, and UF-branded transitions for all new modals.

---

## Test Summary

| Category | Framework | Tests |
|----------|-----------|-------|
| Backend Unit Tests | Go testing + httptest | 62 |
| Frontend Unit Tests | Vitest + React Testing Library | 85 |
| **Grand Total** | | **147** |

---

## Submission Links
- **GitHub Repository Link:** https://github.com/rippy1849/CEN5035-project
- **Frontend Team Demo Video:** [https://youtu.be/siS6Zs0q8gg](https://youtu.be/siS6Zs0q8gg)
- **Backend Team Demo Video:** [https://youtu.be/ZcG-19pTwSE](https://youtu.be/ZcG-19pTwSE)
