# GatorMarketplace Backend API Documentation

**Base URL:** `http://localhost:8080`

---

## Authentication

GatorMarketplace uses **Google OAuth 2.0** restricted to `@ufl.edu` accounts.

### Flow
1. Frontend uses `@react-oauth/google` to get a Google **ID Token** (credential).
2. Frontend sends the credential to `POST /auth/google`.
3. Backend verifies the token with Google, checks `hd == "ufl.edu"`, creates/finds the user, and returns a **session token**.
4. Frontend stores the session token and includes it in subsequent requests as `Authorization: Bearer <token>`.

### Authentication Header
For protected endpoints, include:
```
Authorization: Bearer <session_token>
```

---

## Data Models

### User
```json
{
  "id": 1,
  "email": "student@ufl.edu",
  "name": "Student Name",
  "picture": "https://lh3.googleusercontent.com/...",
  "google_id": "1234567890",
  "created_at": "2025-03-24T10:00:00Z"
}
```

| Field       | Type   | Description                              |
|:------------|:-------|:-----------------------------------------|
| `id`        | int    | Unique user ID (auto-generated)          |
| `email`     | string | UFL email address                        |
| `name`      | string | Display name from Google profile         |
| `picture`   | string | Profile picture URL from Google          |
| `google_id` | string | Google account unique identifier         |
| `created_at`| string | Account creation timestamp               |

### Listing
```json
{
  "id": 1,
  "user_id": 1,
  "title": "Vintage Camera",
  "description": "A classic film camera in good condition.",
  "price": 150.00,
  "category": "Electronics",
  "created_at": "2025-03-24T10:00:00Z",
  "updated_at": "2025-03-24T10:00:00Z"
}
```

| Field        | Type   | Description                                        |
|:-------------|:-------|:---------------------------------------------------|
| `id`         | int    | Unique listing ID (auto-generated)                 |
| `user_id`    | int    | ID of the user who created the listing             |
| `title`      | string | Title of the product                               |
| `description`| string | Detailed description of the product                |
| `price`      | float  | Price of the product                               |
| `category`   | string | Category of the product                            |
| `created_at` | string | Timestamp of creation (server-generated)           |
| `updated_at` | string | Timestamp of last update                           |

---

## Endpoints

### Authentication

#### POST `/auth/google` — Google Login / Signup

Authenticates a user via Google OAuth. Creates a new account on first login.

- **Auth Required:** No
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "credential": "<google_id_token>"
}
```

**Success Response (200 OK):**
```json
{
  "token": "a1b2c3d4e5f6...",
  "user": {
    "id": 1,
    "email": "student@ufl.edu",
    "name": "Student Name",
    "picture": "https://...",
    "google_id": "1234567890"
  }
}
```

**Error Responses:**
| Code | Condition                    | Body                                               |
|------|------------------------------|------------------------------------------------------|
| 400  | Missing `credential` field   | `Missing credential`                                 |
| 401  | Invalid/expired Google token | `Invalid Google token: ...`                          |
| 403  | Non-UFL email domain         | `{"error": "Only @ufl.edu accounts are allowed"}`   |

**Example (curl):**
```bash
curl -X POST http://localhost:8080/auth/google \
  -H "Content-Type: application/json" \
  -d "{\"credential\": \"<google_id_token>\"}"
```

---

#### GET `/auth/me` — Get Current User

Returns the authenticated user's profile.

- **Auth Required:** Yes (Bearer token)

**Success Response (200 OK):**
```json
{
  "id": 1,
  "email": "student@ufl.edu",
  "name": "Student Name",
  "picture": "https://...",
  "google_id": "1234567890",
  "created_at": "2025-03-24T10:00:00Z"
}
```

**Error Responses:**
| Code | Condition           | Body                           |
|------|---------------------|--------------------------------|
| 401  | Missing/invalid token | `Authorization required` or `Invalid or expired session` |

**Example:**
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer <session_token>"
```

---

#### POST `/auth/logout` — Logout

Invalidates the current session token.

- **Auth Required:** Bearer token in header

**Success Response (200 OK):**
```json
{"message": "Logged out"}
```

**Example:**
```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Authorization: Bearer <session_token>"
```

---

### Listings

#### GET `/listings` — Get All Listings

Retrieves all listings, ordered by creation date (newest first).

- **Auth Required:** No

**Success Response (200 OK):**
```json
[
  {
    "id": 2,
    "user_id": 1,
    "title": "Office Chair",
    "description": "Ergonomic chair.",
    "price": 150.00,
    "category": "Furniture",
    "created_at": "2025-03-24T12:00:00Z",
    "updated_at": "2025-03-24T12:00:00Z"
  },
  {
    "id": 1,
    "user_id": 1,
    "title": "Gaming Laptop",
    "description": "High performance laptop.",
    "price": 1200.50,
    "category": "Electronics",
    "created_at": "2025-03-24T10:00:00Z",
    "updated_at": "2025-03-24T10:00:00Z"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8080/listings
```

---

#### POST `/listings` — Create a Listing 🔒

Creates a new listing. The `user_id` is automatically set from the authenticated user.

- **Auth Required:** Yes (Bearer token)
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "title": "Smart Watch",
  "description": "Series 5, barely used.",
  "price": 250.00,
  "category": "Electronics"
}
```

> **Note:** `user_id` is **not** sent in the body — it is extracted from the session.

**Success Response (201 Created):**
```json
{
  "id": 3,
  "user_id": 1,
  "title": "Smart Watch",
  "description": "Series 5, barely used.",
  "price": 250.00,
  "category": "Electronics",
  "created_at": "2025-03-24T14:00:00Z",
  "updated_at": "2025-03-24T14:00:00Z"
}
```

**Error Responses:**
| Code | Condition           | Body                           |
|------|---------------------|--------------------------------|
| 400  | Invalid JSON body    | `<parse error message>`       |
| 401  | Not authenticated    | `Authorization required`       |

**Example:**
```bash
curl -X POST http://localhost:8080/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_token>" \
  -d "{\"title\": \"Smart Watch\", \"description\": \"Series 5\", \"price\": 250.00, \"category\": \"Electronics\"}"
```

---

#### PUT `/listings/{id}` — Update a Listing 🔒

Updates an existing listing by its ID.

- **Auth Required:** Yes (Bearer token)
- **Content-Type:** `application/json`
- **URL Params:** `id` — integer listing ID

**Request Body:**
```json
{
  "title": "Smart Watch Series 6",
  "description": "Updated description.",
  "price": 240.00,
  "category": "Electronics"
}
```

**Success Response (200 OK):** Returns the updated listing object.

**Error Responses:**
| Code | Condition           | Body                                  |
|------|---------------------|---------------------------------------|
| 400  | Invalid ID / JSON   | `Invalid ID` or parse error           |
| 401  | Not authenticated   | `Authorization required`              |
| 404  | Listing not found   | `{"error": "Listing not found"}`      |

**Example:**
```bash
curl -X PUT http://localhost:8080/listings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_token>" \
  -d "{\"title\": \"Updated Title\", \"description\": \"New desc\", \"price\": 240.00, \"category\": \"Electronics\"}"
```

---

#### DELETE `/listings/{id}` — Delete a Listing 🔒

Deletes a listing. Only the listing owner can delete it.

- **Auth Required:** Yes (Bearer token)
- **URL Params:** `id` — integer listing ID

**Success Response (200 OK):**
```json
{"message": "Listing deleted"}
```

**Error Responses:**
| Code | Condition                     | Body                                                  |
|------|-------------------------------|-------------------------------------------------------|
| 400  | Invalid ID format             | `Invalid ID`                                          |
| 401  | Not authenticated             | `Authorization required`                              |
| 403  | Not the listing owner         | `{"error": "You can only delete your own listings"}`  |
| 404  | Listing not found             | `{"error": "Listing not found"}`                      |

**Example:**
```bash
curl -X DELETE http://localhost:8080/listings/1 \
  -H "Authorization: Bearer <session_token>"
```

---

## CORS Configuration

| Setting     | Value                                              |
|-------------|-----------------------------------------------------|
| Origins     | `http://localhost:3000`, `http://localhost:5173`     |
| Methods     | `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`           |
| Headers     | `Content-Type`, `Authorization`                     |

---

## Environment Variables

| Variable           | Description                              | Required |
|--------------------|------------------------------------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID for verification | Optional (if set, tokens are validated against this) |

---

## Running the Backend

```bash
cd backend
go run main.go
```

Server starts on `http://localhost:8080`.

To set the Google Client ID:
```bash
# Windows
set GOOGLE_CLIENT_ID=your-client-id-here
go run main.go

# Mac/Linux
GOOGLE_CLIENT_ID=your-client-id-here go run main.go
```

## Running Tests

```bash
cd backend
go test ./... -v
```

All tests use an **in-memory SQLite** database — no file I/O or external API calls.
