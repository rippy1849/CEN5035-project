# Sprint 2 Report

## Team Sprint Goal
Extend GatorMarketplace with user authentication (Google OAuth restricted to @ufl.edu), delete listing functionality, comprehensive backend and frontend unit tests, Cypress E2E testing, and full API documentation.

---

## User Stories

1. **As a UF student, I want to sign in with my UFL Google account** so that only verified students can use the platform.
2. **As a logged-in user, I want to delete my own listings** so that I can remove items I no longer want to sell.
3. **As a visitor, I want to browse listings without logging in** so that I can see what's available before committing to sign up.
4. **As a developer, I want comprehensive test coverage** so that future changes don't break existing functionality.

---

## Issues Planned and Completed for Sprint 2

### Backend
| # | Title | Status |
|---|-------|--------|
| **#1** | Google OAuth Authentication (POST /auth/google, GET /auth/me, POST /auth/logout) | ✅ |
| **#2** | Delete Listing API (DELETE /listings/{id} with ownership check) | ✅ |
| **#3** | Auth Middleware (Bearer token session management) | ✅ |
| **#4** | Backend Unit Tests (22 tests across 3 files) | ✅ |
| **#5** | Updated CORS (localhost:5173 + Authorization header) | ✅ |
| **#6** | API Documentation (7 endpoints fully documented) | ✅ |

### Frontend
| # | Title | Status |
|---|-------|--------|
| **#7** | Google OAuth Login Page (@react-oauth/google) | ✅ |
| **#8** | Auth Context + Protected Routes (Sell page requires login) | ✅ |
| **#9** | Delete Listing UI (owner-only button + confirmation dialog) | ✅ |
| **#10** | Header Auth State (avatar/logout when signed in) | ✅ |
| **#11** | Frontend Unit Tests (32 tests across 4 suites) | ✅ |
| **#12** | Cypress E2E Test (login page + auth guard) | ✅ |

---

## Sprint 2 Accomplishments

### Backend
- Implemented **Google OAuth** authentication: `POST /auth/google` verifies Google ID tokens, checks `hd == "ufl.edu"`, upserts user records, and returns session tokens.
- Added `GET /auth/me` to retrieve current user and `POST /auth/logout` to invalidate sessions.
- Implemented `AuthMiddleware` to protect write endpoints with Bearer token authentication.
- Added `DELETE /listings/{id}` endpoint with ownership verification (only the listing creator can delete).
- Updated `CreateListing` to extract `user_id` from authenticated session instead of request body.
- Created `users` and `sessions` database tables alongside existing `listings` table.
- Updated CORS to allow `localhost:5173` and `Authorization` header.

### Frontend
- Built **Login Page** with Google Sign-In button, UF branding, and "@ufl.edu only" messaging.
- Created **AuthContext** (React Context provider) for global authentication state management.
- Wrapped app in `GoogleOAuthProvider` and `AuthProvider`.
- **Header** now shows Google avatar + user name + Logout button when authenticated, Sign In link when not.
- **Sell page** redirects to `/login` when user is not authenticated.
- Added **Delete button** to `ListingCard` (visible only to listing owner) with MUI confirmation dialog.
- Updated `listings.ts` API client to include `Authorization` headers on create/update/delete requests.
- Removed hardcoded `user_id: 1` from `ListingForm`.

---

## Unit Tests — Frontend

| File | Framework | Tests | Description |
|------|-----------|-------|-------------|
| `src/test/auth.test.ts` | Vitest | 12 | googleLogin (success, 403, error), logout, getToken, isLoggedIn, getCurrentUser, clearAuth |
| `src/test/listings.test.ts` | Vitest | 7 | getListings (success, error), createListing (auth headers), updateListing (auth headers), deleteListing (success, 403, error) |
| `src/test/LoginPage.test.tsx` | Vitest + RTL | 4 | Renders sign in heading, UFL hint, branding, UFL-only notice |
| `src/test/ListingCard.test.tsx` | Vitest + RTL | 9 | Renders title/price/category/description, Delete visible for owner, hidden for non-owner, View Details for non-owner/unauthenticated |
| **Total** | | **32** | |

## Cypress E2E Test — Frontend

| File | Tests | Description |
|------|-------|-------------|
| `cypress/e2e/login.cy.ts` | 4 | Login page renders correctly, sell page redirects to login, browse page accessible without auth, header shows Sign In |

---

## Unit Tests — Backend

| File | Framework | Tests | Description |
|------|-----------|-------|-------------|
| `database/db_test.go` | Go testing | 1 | InitTestDB creates all 3 tables (listings, users, sessions) |
| `handlers/auth_handler_test.go` | Go httptest | 8 | Google login (valid UFL, non-UFL 403, invalid token, missing credential, duplicate upsert), GetMe (valid/invalid/no-auth), Logout |
| `handlers/listing_handler_test.go` | Go httptest | 12 | CreateListing (valid, missing, invalid JSON), GetListings (array, empty, ordering), UpdateListing (valid, 404), DeleteListing (owner, non-owner 403, 404, invalid ID) |
| **Total** | | **21** | |

---

## Backend API Documentation

### Authentication Flow
1. Frontend uses `@react-oauth/google` to get a Google ID Token.
2. Frontend sends credential to `POST /auth/google`.
3. Backend verifies token, checks `hd == "ufl.edu"`, creates/finds user, returns session token.
4. Frontend stores token and includes `Authorization: Bearer <token>` in subsequent requests.

### Endpoints

#### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/google` | No | Google OAuth login. Body: `{"credential": "<id_token>"}`. Returns `{token, user}`. Rejects non-UFL with 403. |
| GET | `/auth/me` | Bearer | Returns current user profile. |
| POST | `/auth/logout` | Bearer | Invalidates current session token. |

#### Listings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/listings` | No | Get all listings (newest first). |
| POST | `/listings` | Bearer | Create listing. `user_id` from session. |
| PUT | `/listings/{id}` | Bearer | Update listing by ID. |
| DELETE | `/listings/{id}` | Bearer | Delete listing (owner only). Returns 403 if not owner. |

### Data Models

**User**: `id`, `email`, `name`, `picture`, `google_id`, `created_at`
**Listing**: `id`, `user_id`, `title`, `description`, `price`, `category`, `created_at`, `updated_at`

### CORS
- Allowed origins: `http://localhost:3000`, `http://localhost:5173`
- Allowed methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Allowed headers: `Content-Type`, `Authorization`

### Environment Variables
| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID (optional, for token audience validation) |

Full API documentation with curl examples: see [`backend/API_DOCS.md`](backend/API_DOCS.md)

---

## Submission Links

- **GitHub Repository Link:** https://github.com/rippy1849/CEN5035-project
- **Demo Video:** *(to be filled before submission)*

---

## Notes
Sprint 2 delivered Google OAuth authentication, delete listing feature, 53 total unit tests (21 backend + 32 frontend), and 4 Cypress E2E tests. The application now supports a complete authenticated flow: sign in with UFL Google → browse/create/edit/delete listings → sign out.
