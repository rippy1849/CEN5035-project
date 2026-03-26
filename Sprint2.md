# Sprint 2 Report

## Detail of Work Completed in Sprint 2

### Sprint 1 Progress & Issues Carried Forward
All 7 Sprint 1 issues were completed in Sprint 1 (frontend listing creation, listings feed, backend CRUD APIs, header/footer nav, UF theme, about page, and the update bug fix). There were **no uncompleted issues** to carry forward.

In Sprint 2, we extended the Sprint 1 foundation by adding:
- User authentication (Google OAuth restricted to @ufl.edu)
- Delete listing feature with ownership verification
- Full frontend-backend integration with authenticated requests
- Comprehensive unit test suites for both frontend and backend
- Cypress E2E testing
- Complete backend API documentation

### Frontend-Backend Integration
The frontend and backend are now fully integrated:
- **Authentication flow**: Frontend uses `@react-oauth/google` to obtain a Google ID token → sends to `POST /auth/google` → backend verifies and returns session token → frontend stores token and sends it as `Authorization: Bearer <token>` on all write requests.
- **Listings CRUD**: Frontend calls backend REST API for creating, reading, updating, and deleting listings. All write operations include the auth token.
- **CORS**: Backend allows requests from `http://localhost:3000` and `http://localhost:5173` with `Content-Type` and `Authorization` headers.
- **Ownership-based deletion**: Frontend shows Delete button only for the listing owner's own items; backend enforces ownership check server-side.

### Backend Work Completed
1. **Google OAuth Authentication**
   - `POST /auth/google` — Verifies Google ID token, checks the `hd` (hosted domain) claim equals `ufl.edu`, upserts user records, returns a session token.
   - `GET /auth/me` — Returns the current user's profile from a valid session.
   - `POST /auth/logout` — Invalidates the session token.
   - `AuthMiddleware` — Extracts Bearer token, looks up session, injects `user_id` into request context for all protected routes.
2. **Database Schema Expansion**
   - Added `users` table (id, email, name, picture, google_id, created_at).
   - Added `sessions` table (token, user_id, created_at) with foreign key to users.
3. **Delete Listing API**
   - `DELETE /listings/{id}` — Verifies the authenticated user owns the listing before allowing deletion. Returns 403 if not the owner.
4. **Listing Ownership**
   - `CreateListing` now pulls `user_id` from the authenticated session context instead of the request body.
5. **CORS Updates**
   - Added `DELETE` method and `Authorization` header to allowed CORS configuration.

### Frontend Work Completed
1. **Login Page** (`src/pages/LoginPage.tsx`)
   - Google Sign-In button via `@react-oauth/google`
   - UF branding with "@ufl.edu only" messaging
   - Error display for non-UFL accounts
2. **Auth Context** (`src/context/AuthContext.tsx`)
   - React Context provider for global authentication state (user, isLoggedIn, login, logout)
   - Restores session from localStorage on app load
3. **App-Level Integration** (`src/App.tsx`)
   - Wrapped app with `GoogleOAuthProvider` and `AuthProvider`
   - Added `/login` route
4. **Header Auth State** (`src/components/layout/Header.tsx`)
   - Shows Google avatar + user name + Logout button when signed in
   - Shows "Sign In" link when not authenticated
5. **Protected Routes** (`src/pages/SellPage.tsx`)
   - Redirects to `/login` if user is not authenticated
6. **Delete Listing UI** (`src/components/ListingCard.tsx`)
   - Edit + Delete buttons visible only to listing owner
   - MUI confirmation dialog before deletion
   - "View Details" button for non-owners
7. **API Client Updates** (`src/api/listings.ts`)
   - Added `deleteListing(id)` function
   - All write requests (create, update, delete) now include `Authorization` header
8. **Bug Fix** (`src/components/ListingForm.tsx`)
   - Removed hardcoded `user_id: 1` from the form submission

---

## Frontend Unit Tests

**Framework:** Vitest + React Testing Library (jsdom environment)

### Auth API Tests (`src/test/auth.test.ts`) — 12 tests

| # | Test Name | Function Tested |
|---|-----------|-----------------|
| 1 | should store token and user on successful login | `googleLogin()` |
| 2 | should throw error for non-UFL accounts (403) | `googleLogin()` |
| 3 | should throw error on network failure | `googleLogin()` |
| 4 | should call logout endpoint and clear storage | `logout()` |
| 5 | should return token from localStorage | `getToken()` |
| 6 | should return null when no token | `getToken()` |
| 7 | should return true when token exists | `isLoggedIn()` |
| 8 | should return false when no token | `isLoggedIn()` |
| 9 | should return parsed user from localStorage | `getCurrentUser()` |
| 10 | should return null when no user stored | `getCurrentUser()` |
| 11 | should return null for invalid JSON | `getCurrentUser()` |
| 12 | should remove token and user from storage | `clearAuth()` |

### Listings API Tests (`src/test/listings.test.ts`) — 7 tests

| # | Test Name | Function Tested |
|---|-----------|-----------------|
| 1 | should fetch and return listings array | `getListings()` |
| 2 | should throw on non-ok response | `getListings()` |
| 3 | should send POST with auth headers | `createListing()` |
| 4 | should send PUT with auth headers | `updateListing()` |
| 5 | should send DELETE with auth headers | `deleteListing()` |
| 6 | should throw on 403 (not owner) | `deleteListing()` |
| 7 | should throw on other errors | `deleteListing()` |

### LoginPage Component Tests (`src/test/LoginPage.test.tsx`) — 4 tests

| # | Test Name | Component Tested |
|---|-----------|-----------------|
| 1 | should render the sign in heading | `LoginPage` |
| 2 | should show UFL account hint | `LoginPage` |
| 3 | should show GatorMarketplace branding | `LoginPage` |
| 4 | should show UFL-only notice | `LoginPage` |

### ListingCard Component Tests (`src/test/ListingCard.test.tsx`) — 9 tests

| # | Test Name | Component Tested |
|---|-----------|-----------------|
| 1 | should render listing title | `ListingCard` |
| 2 | should render listing price | `ListingCard` |
| 3 | should render listing category | `ListingCard` |
| 4 | should render listing description | `ListingCard` |
| 5 | should show Delete button when user is the owner | `ListingCard` (ownership logic) |
| 6 | should show Edit button when user is the owner | `ListingCard` (ownership logic) |
| 7 | should NOT show Delete button when user is not the owner | `ListingCard` (ownership logic) |
| 8 | should show View Details button for non-owners | `ListingCard` |
| 9 | should show View Details button when not logged in | `ListingCard` |

**Frontend Total: 32 unit tests**

### Function-to-Test Coverage (Frontend)

| Function/Component | # Tests |
|---------------------|---------|
| `googleLogin()` | 3 |
| `logout()` | 1 |
| `getToken()` | 2 |
| `isLoggedIn()` | 2 |
| `getCurrentUser()` | 3 |
| `clearAuth()` | 1 |
| `getListings()` | 2 |
| `createListing()` | 1 |
| `updateListing()` | 1 |
| `deleteListing()` | 3 |
| `LoginPage` component | 4 |
| `ListingCard` component | 9 |
| **Total** | **32** |

---

## Cypress E2E Tests

**Framework:** Cypress 15.13.0
**File:** `frontend/cypress/e2e/login.cy.ts`

| # | Test Name | Description |
|---|-----------|-------------|
| 1 | should display the login page with Google sign-in | Visits `/login`, verifies Sign In heading, GatorMarketplace branding, @ufl.edu hint, UF students only notice |
| 2 | should redirect to login when accessing sell page without auth | Visits `/sell` without auth, verifies URL redirects to `/login` |
| 3 | should display the browse page without requiring login | Visits `/`, verifies "Find Great Deals" and "From Fellow Gators" are visible |
| 4 | should show Sign In button in header when not logged in | Visits `/`, verifies the Sign In button is displayed |

**How to run:**
```bash
# Terminal 1: Start frontend dev server
cd frontend && npm run dev

# Terminal 2: Run Cypress
cd frontend && npx cypress run
```

---

## Backend Unit Tests

**Framework:** Go `testing` package + `net/http/httptest`
**Database:** In-memory SQLite (no file I/O, full test isolation)

### Database Tests (`database/db_test.go`) — 1 test

| # | Test Name | Function Tested |
|---|-----------|-----------------|
| 1 | TestInitTestDB_AllTablesCreated | `InitTestDB()` — verifies all 3 tables (listings, users, sessions) are created and accept inserts/queries |

### Auth Handler Tests (`handlers/auth_handler_test.go`) — 8 tests

| # | Test Name | Function Tested |
|---|-----------|-----------------|
| 1 | TestGoogleLogin_ValidUFLToken | `GoogleLoginHandler()` — successful @ufl.edu login |
| 2 | TestGoogleLogin_NonUFLDomain | `GoogleLoginHandler()` — rejects non-UFL domain (403) |
| 3 | TestGoogleLogin_InvalidToken | `GoogleLoginHandler()` — rejects invalid token (401) |
| 4 | TestGoogleLogin_MissingCredential | `GoogleLoginHandler()` — rejects missing credential (400) |
| 5 | TestGoogleLogin_DuplicateLogin_UpdatesUser | `GoogleLoginHandler()` — upserts user on re-login |
| 6 | TestGetMe_ValidSession | `GetMeHandler()` — returns user from valid session |
| 7 | TestGetMe_InvalidSession | `GetMeHandler()` — rejects invalid session (401) |
| 8 | TestGetMe_NoAuthHeader | `AuthMiddleware()` — rejects missing auth header (401) |

### Listing Handler Tests (`handlers/listing_handler_test.go`) — 12 tests

| # | Test Name | Function Tested |
|---|-----------|-----------------|
| 1 | TestCreateListing_ValidData | `CreateListing()` — creates listing (201) |
| 2 | TestCreateListing_MissingTitle | `CreateListing()` — handles missing fields |
| 3 | TestCreateListing_InvalidJSON | `CreateListing()` — rejects bad JSON (400) |
| 4 | TestGetListings_ReturnsArray | `GetListings()` — returns array |
| 5 | TestGetListings_EmptyDB | `GetListings()` — empty DB returns 200 |
| 6 | TestGetListings_OrderedNewestFirst | `GetListings()` — newest-first ordering |
| 7 | TestUpdateListing_ValidID | `UpdateListing()` — updates existing listing (200) |
| 8 | TestUpdateListing_NonExistentID | `UpdateListing()` — returns 404 for missing |
| 9 | TestDeleteListing_OwnerCanDelete | `DeleteListing()` — owner can delete |
| 10 | TestDeleteListing_NonOwnerForbidden | `DeleteListing()` — non-owner gets 403 |
| 11 | TestDeleteListing_NonExistentID | `DeleteListing()` — returns 404 for missing |
| 12 | TestDeleteListing_InvalidID | `DeleteListing()` — returns 400 for bad ID |

**Backend Total: 21 unit tests**

### Function-to-Test Coverage (Backend)

| Handler/Function | # Tests |
|-------------------|---------|
| `InitTestDB()` | 1 |
| `GoogleLoginHandler()` | 5 |
| `GetMeHandler()` | 2 |
| `AuthMiddleware()` | 1 |
| `LogoutHandler()` | *(tested indirectly via login flow)* |
| `CreateListing()` | 3 |
| `GetListings()` | 3 |
| `UpdateListing()` | 2 |
| `DeleteListing()` | 4 |
| **Total** | **21** |

**How to run:**
```bash
cd backend
go test ./... -v
```

---

## Backend API Documentation

### Authentication Flow
1. Frontend uses `@react-oauth/google` to get a Google **ID Token** (credential).
2. Frontend sends the credential to `POST /auth/google`.
3. Backend verifies the token with Google's tokeninfo endpoint, checks `hd == "ufl.edu"`, creates/finds the user, and returns a **session token**.
4. Frontend stores the session token and includes it in subsequent requests as `Authorization: Bearer <token>`.

### Endpoints

#### `POST /auth/google` — Google Login / Signup
- **Auth Required:** No
- **Request Body:**
```json
{"credential": "<google_id_token>"}
```
- **Success (200):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "user": {"id": 1, "email": "student@ufl.edu", "name": "Student Name", "picture": "https://...", "google_id": "123"}
}
```
- **Errors:** 400 missing credential · 401 invalid token · 403 non-UFL domain

#### `GET /auth/me` — Get Current User
- **Auth Required:** Yes (Bearer token)
- **Success (200):**
```json
{"id": 1, "email": "student@ufl.edu", "name": "Student Name", "picture": "...", "google_id": "123", "created_at": "..."}
```
- **Errors:** 401 missing/invalid token

#### `POST /auth/logout` — Logout
- **Auth Required:** Bearer token
- **Success (200):**
```json
{"message": "Logged out"}
```

#### `GET /listings` — Get All Listings
- **Auth Required:** No
- **Success (200):** Array of listing objects, ordered newest first.

#### `POST /listings` — Create a Listing
- **Auth Required:** Yes (Bearer token)
- **Request Body:**
```json
{"title": "Smart Watch", "description": "Series 5", "price": 250.00, "category": "Electronics"}
```
- **Note:** `user_id` is automatically set from the authenticated session.
- **Success (201):** Created listing object with assigned `id`.
- **Errors:** 400 invalid JSON · 401 not authenticated

#### `PUT /listings/{id}` — Update a Listing
- **Auth Required:** Yes (Bearer token)
- **Request Body:** Same as create (partial updates supported).
- **Success (200):** Updated listing object.
- **Errors:** 400 invalid ID/JSON · 401 not authenticated · 404 not found

#### `DELETE /listings/{id}` — Delete a Listing
- **Auth Required:** Yes (Bearer token)
- **Ownership:** Only the listing creator can delete it.
- **Success (200):**
```json
{"message": "Listing deleted"}
```
- **Errors:** 400 invalid ID · 401 not authenticated · 403 not owner · 404 not found

### Data Models

**User**
| Field | Type | Description |
|-------|------|-------------|
| id | int | Auto-generated unique ID |
| email | string | UFL email address |
| name | string | Display name from Google |
| picture | string | Profile picture URL |
| google_id | string | Google account unique ID |
| created_at | datetime | Account creation timestamp |

**Listing**
| Field | Type | Description |
|-------|------|-------------|
| id | int | Auto-generated unique ID |
| user_id | int | Creator's user ID |
| title | string | Product title |
| description | string | Product description |
| price | float | Product price |
| category | string | Product category |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### CORS Configuration
| Setting | Value |
|---------|-------|
| Origins | `http://localhost:3000`, `http://localhost:5173` |
| Methods | `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS` |
| Headers | `Content-Type`, `Authorization` |

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID for token audience validation | Optional |

Full API documentation with curl examples is also available in [`backend/API_DOCS.md`](backend/API_DOCS.md).

---

## Test Summary

| Category | Framework | Tests |
|----------|-----------|-------|
| Backend Unit Tests | Go testing + httptest | 21 |
| Frontend Unit Tests | Vitest + React Testing Library | 32 |
| Frontend E2E Tests | Cypress | 4 |
| **Grand Total** | | **57** |

## Video Links

- [Backend Demo](https://youtu.be/x2Y9hWA1K_0)
- [Frontend Demo](https://www.youtube.com/watch?v=HaOccxteXGQ)