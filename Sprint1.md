# Sprint 1 Report

## Team Sprint Goal
Deliver the first end-to-end version of a Listings feature by implementing:
- Frontend listing creation UI
- Frontend listings feed UI
- Backend API endpoints for creating and retrieving listings
- Database initialization and persistence
- Header and footer navigation components for app-wide usability
- Listing edit/update functionality (bug fix + UI integration)
- UF-branded color theme, typography, and an About Us page

---

## User Stories

1. **As a user, I want to create a listing using a form** so that I can submit item details to the platform.
2. **As a user, I want to view a feed of listings ordered by newest** so that I can quickly see recent posts.
3. **As a frontend developer, I want a working API contract** so that UI actions can read and write listing data.
4. **As a backend developer, I want persistent SQLite storage initialized at startup** so that listing data is saved and retrievable.
5. **As a user, I want a persistent header and footer** so that I can navigate between Browse, Sell, and About pages from anywhere in the app.
6. **As a user, I want to edit an existing listing** so that I can update item details after posting.
7. **As a user, I want the app to have a consistent, polished color theme and typography** so that it looks professional and easy on the eyes.
8. **As a user, I want an About Us page** so that I can learn about the GatorMarketplace platform and the team behind it.

---

## Issues Planned for Sprint 1

### Frontend
- **#1** Frontend: Implement Create Listing Form (Material UI v5, MD3)
- **#2** Frontend: Implement Listings Feed Page (Material UI Cards)
- **#5** Add Header and Footer Navigation Components to the App
- **#7** Color Theme, Font Style and About Page
- **#8** Update Feature Not Working (Bug Fix)

### Backend
- **#3** Backend: Implement Get Listings API (Ordered by Newest)
- **#4** Backend: Implement SQLite Database Initialization + Create Listing API

---

## Issues Successfully Completed

All 7 Sprint 1 issues were successfully completed and closed:

| # | Title | Label |
|---|-------|-------|
| **#1** | Frontend: Implement Create Listing Form (Material UI v5, MD3) | — |
| **#2** | Frontend: Implement Listings Feed Page (Material UI Cards) | — |
| **#3** | Backend: Implement Get Listings API (Ordered by Newest) | — |
| **#4** | Backend: Implement SQLite Database Initialization + Create Listing API | enhancement |
| **#5** | Add Header and Footer Navigation Components to the App | enhancement, UI |
| **#7** | Color Theme, Font Style and About Page | enhancement, UI |
| **#8** | Update Feature Not Working (Bug Fix) | bug |

---

## Sprint 1 Accomplishments

### Backend
- Initialized SQLite database on server startup with automatic schema creation.
- Implemented `POST /listings` API to persist new listing records.
- Implemented `GET /listings` API returning listings ordered by newest first.
- Implemented `PUT /listings/:id` API to support updating existing listings.

### Frontend
- Built a **Create Listing Form** using Material UI v5 with fields for title, description, price, and category.
- Built a **Listings Feed Page** displaying listings as Material UI cards with price, title, and category badges.
- Implemented inline **Edit Listing** flow: clicking the Update button on a listing card opens an `EditListingPage` pre-populated with existing data; on save the UI calls `PUT /listings/:id` and returns to the feed.
- Fixed a bug where the Update button was not triggering the edit form due to a missing API call in the frontend (`updateListing` in `api/listings.ts`).
- Added a **persistent Header** with the GatorMarketplace logo, Browse and Sell navigation links, and a Profile chip; active route is highlighted automatically.
- Added a **persistent Footer** with quick links (Browse, Sell, About), platform description, and copyright.
- Introduced a **UF-branded color palette** (Gator Blue `#0021A5` / Gator Orange `#FA4616`) across the entire Material UI theme, with Inter font and refined typography scale.
- Created an **About Us page** describing the platform mission and team, accessible via the footer.

---

## Issues Not Completed and Why

None. All Sprint 1 planned issues were completed within the sprint.

---

## Submission Links (to fill before turning in)

- **GitHub Repository Link:** https://github.com/rippy1849/CEN5035-project
- **Frontend Team Demo Video:** https://youtu.be/vvj-zMJHdeM
- **Backend Team Demo Video:** https://youtu.be/FQsrsiiEoeo

---

## Notes
Sprint 1 report finalized. All 7 issues closed. Core marketplace loop (create → browse → edit) is fully functional end-to-end.