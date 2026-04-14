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
For protected endpoints (marked with 🔒), include:
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
  "is_final_price": false,
  "images": ["/uploads/1_171234567_0.jpg", "/uploads/1_171234567_1.jpg"],
  "created_at": "2025-03-24T10:00:00Z",
  "updated_at": "2025-03-24T10:00:00Z"
}
```

| Field           | Type     | Description                                          |
|:----------------|:---------|:-----------------------------------------------------|
| `id`            | int      | Unique listing ID (auto-generated)                   |
| `user_id`       | int      | ID of the user who created the listing               |
| `title`         | string   | Title of the product                                 |
| `description`   | string   | Detailed description of the product                  |
| `price`         | float    | Price of the product                                 |
| `category`      | string   | Category of the product                              |
| `is_final_price`| boolean  | Whether the seller has locked the price              |
| `images`        | string[] | Array of image URLs (relative paths)                 |
| `created_at`    | string   | Timestamp of creation (server-generated)             |
| `updated_at`    | string   | Timestamp of last update                             |

### Bid
```json
{
  "id": 1,
  "listing_id": 5,
  "buyer_id": 2,
  "buyer_name": "Buyer Name",
  "amount": 80.00,
  "status": "pending",
  "counter_amount": null,
  "bid_number": 1,
  "created_at": "2025-04-13T10:00:00Z",
  "updated_at": "2025-04-13T10:00:00Z"
}
```

| Field           | Type    | Description                                                     |
|:----------------|:--------|:----------------------------------------------------------------|
| `id`            | int     | Unique bid ID (auto-generated)                                  |
| `listing_id`    | int     | ID of the listing this bid is for                               |
| `buyer_id`      | int     | ID of the user who placed the bid                               |
| `buyer_name`    | string  | Buyer's display name (only visible to seller)                   |
| `amount`        | float   | The bid amount offered                                          |
| `status`        | string  | One of: `pending`, `accepted`, `countered`, `rejected`          |
| `counter_amount`| float?  | Seller's counter-offer amount (null if not countered)            |
| `bid_number`    | int     | Sequential bid number for this buyer on this listing (1–5)      |
| `created_at`    | string  | Timestamp of bid creation                                       |
| `updated_at`    | string  | Timestamp of last status update                                 |

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

#### GET `/auth/me` — Get Current User 🔒

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

Retrieves all listings, ordered by creation date (newest first). Each listing includes an `images` array and `is_final_price` flag.

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
    "is_final_price": false,
    "images": ["/uploads/2_171234567_0.jpg"],
    "created_at": "2025-03-24T12:00:00Z",
    "updated_at": "2025-03-24T12:00:00Z"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8080/listings
```

---

#### GET `/listings/{id}` — Get Single Listing

Retrieves a single listing by its ID.

- **Auth Required:** No
- **URL Params:** `id` — integer listing ID

**Success Response (200 OK):** Returns the listing object with `images` array.

**Error Responses:**
| Code | Condition           | Body                                  |
|------|---------------------|---------------------------------------|
| 400  | Invalid ID format   | `Invalid ID`                          |
| 404  | Listing not found   | `{"error": "Listing not found"}`      |

**Example:**
```bash
curl -X GET http://localhost:8080/listings/1
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

### Images

#### POST `/listings/{id}/images` — Upload Images 🔒

Uploads one or more images for a listing. Maximum 5 images per listing, 5MB per file.

- **Auth Required:** Yes (Bearer token)
- **Content-Type:** `multipart/form-data`
- **URL Params:** `id` — integer listing ID
- **Ownership:** Only the listing creator can upload images.
- **Allowed Types:** JPEG, PNG, GIF, WebP

**Form Field:** `images` — one or more image files

**Success Response (201 Created):**
```json
{
  "images": ["/uploads/1_171234567_0.jpg", "/uploads/1_171234567_1.png"]
}
```

**Error Responses:**
| Code | Condition                       | Body                                                        |
|------|---------------------------------|-------------------------------------------------------------|
| 400  | Invalid ID / No files / Max 5  | `Invalid ID` / `No images provided` / `Maximum 5 images per listing` |
| 400  | File too large                  | `File too large: maximum 5MB`                               |
| 400  | Invalid file type               | `Invalid file type: only JPEG, PNG, GIF, WebP allowed`     |
| 401  | Not authenticated               | `Authorization required`                                    |
| 403  | Not the listing owner           | `{"error": "You can only upload images to your own listings"}` |
| 404  | Listing not found               | `{"error": "Listing not found"}`                            |

**Example:**
```bash
curl -X POST http://localhost:8080/listings/1/images \
  -H "Authorization: Bearer <session_token>" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.png"
```

---

#### DELETE `/listings/{id}/images/{imageId}` — Delete an Image 🔒

Deletes a specific image from a listing.

- **Auth Required:** Yes (Bearer token)
- **Ownership:** Only the listing creator can delete images.
- **URL Params:** `id` — listing ID, `imageId` — image record ID

**Success Response (200 OK):**
```json
{"message": "Image deleted"}
```

**Error Responses:**
| Code | Condition             | Body                                                          |
|------|-----------------------|---------------------------------------------------------------|
| 400  | Invalid ID            | `Invalid ID`                                                  |
| 401  | Not authenticated     | `Authorization required`                                      |
| 403  | Not the listing owner | `{"error": "You can only delete images from your own listings"}` |
| 404  | Image/Listing not found | `{"error": "Listing not found"}` or `{"error": "Image not found"}` |

**Example:**
```bash
curl -X DELETE http://localhost:8080/listings/1/images/3 \
  -H "Authorization: Bearer <session_token>"
```

---

### Bidding

#### POST `/listings/{id}/bids` — Place a Bid 🔒

Places a bid on a listing. Each buyer can place up to **5 bids** per listing.

- **Auth Required:** Yes (Bearer token)
- **Content-Type:** `application/json`
- **URL Params:** `id` — integer listing ID
- **Restrictions:**
  - Cannot bid on your own listing (403)
  - Cannot bid if `is_final_price` is true (400)
  - Cannot bid if a bid has already been accepted (400)
  - Maximum 5 bids per buyer per listing (400)

**Request Body:**
```json
{
  "amount": 80.00
}
```

**Success Response (201 Created):**
```json
{
  "bid": {
    "id": 1,
    "listing_id": 5,
    "buyer_id": 2,
    "amount": 80.00,
    "status": "pending",
    "counter_amount": null,
    "bid_number": 1,
    "created_at": "2025-04-13T10:00:00Z",
    "updated_at": "2025-04-13T10:00:00Z"
  },
  "bids_remaining": 4
}
```

**Error Responses:**
| Code | Condition                   | Body                                                          |
|------|-----------------------------|---------------------------------------------------------------|
| 400  | Invalid amount (≤ 0)        | `{"error": "Amount is required and must be positive"}`        |
| 400  | Final price is set          | `{"error": "This listing has a final price and is not accepting bids"}` |
| 400  | Bid already accepted        | `{"error": "A bid has already been accepted for this listing"}` |
| 400  | 5 bid limit reached         | `{"error": "You have used all 5 bids for this listing"}`     |
| 401  | Not authenticated           | `Authorization required`                                      |
| 403  | Bidding on own listing      | `{"error": "You cannot bid on your own listing"}`             |
| 404  | Listing not found           | `{"error": "Listing not found"}`                              |

**Example:**
```bash
curl -X POST http://localhost:8080/listings/5/bids \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_token>" \
  -d "{\"amount\": 80.00}"
```

---

#### GET `/listings/{id}/bids` — Get Bids 🔒

Retrieves bids for a listing. **Sellers see all bids** (with buyer names). **Buyers see only their own bids**.

- **Auth Required:** Yes (Bearer token)
- **URL Params:** `id` — integer listing ID

**Success Response (200 OK):**
```json
{
  "bids": [
    {
      "id": 1,
      "listing_id": 5,
      "buyer_id": 2,
      "buyer_name": "Buyer Name",
      "amount": 80.00,
      "status": "pending",
      "counter_amount": null,
      "bid_number": 1,
      "created_at": "2025-04-13T10:00:00Z",
      "updated_at": "2025-04-13T10:00:00Z"
    }
  ],
  "bids_remaining": 4,
  "is_seller": true
}
```

> **Note:** `buyer_name` is only populated when `is_seller` is true.

**Error Responses:**
| Code | Condition             | Body                                  |
|------|-----------------------|---------------------------------------|
| 401  | Not authenticated     | `Authorization required`              |
| 404  | Listing not found     | `{"error": "Listing not found"}`      |

**Example:**
```bash
curl -X GET http://localhost:8080/listings/5/bids \
  -H "Authorization: Bearer <session_token>"
```

---

#### PUT `/bids/{id}/respond` — Respond to a Bid 🔒

Allows the listing owner to accept, counter, or reject a pending bid.

- **Auth Required:** Yes (Bearer token)
- **Content-Type:** `application/json`
- **URL Params:** `id` — integer bid ID
- **Ownership:** Only the listing owner can respond.

**Request Body:**
```json
{
  "action": "accept"
}
```
Or for counter-offers:
```json
{
  "action": "counter",
  "counter_amount": 95.00
}
```
Or to reject:
```json
{
  "action": "reject"
}
```

| `action`  | Effect                                                       |
|-----------|--------------------------------------------------------------|
| `accept`  | Sets bid status to `accepted`                                |
| `counter` | Sets bid status to `countered`, stores `counter_amount`      |
| `reject`  | Sets bid status to `rejected`                                |

**Success Response (200 OK):**
```json
{
  "bid": {
    "id": 1,
    "listing_id": 5,
    "buyer_id": 2,
    "amount": 80.00,
    "status": "accepted",
    "counter_amount": null,
    "bid_number": 1,
    "created_at": "2025-04-13T10:00:00Z",
    "updated_at": "2025-04-13T11:00:00Z"
  }
}
```

**Error Responses:**
| Code | Condition                    | Body                                                           |
|------|------------------------------|----------------------------------------------------------------|
| 400  | Invalid action               | `{"error": "Invalid action: must be accept, counter, or reject"}` |
| 400  | Counter without amount       | `{"error": "Counter amount is required for counter action"}`   |
| 400  | Bid not pending              | `{"error": "Can only respond to pending bids"}`                |
| 401  | Not authenticated            | `Authorization required`                                       |
| 403  | Not the listing owner        | `{"error": "Only the listing owner can respond to bids"}`      |
| 404  | Bid not found                | `{"error": "Bid not found"}`                                   |

**Example:**
```bash
curl -X PUT http://localhost:8080/bids/1/respond \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_token>" \
  -d "{\"action\": \"counter\", \"counter_amount\": 95.00}"
```

---

### Pricing Control

#### PUT `/listings/{id}/final-price` — Mark Price as Final 🔒

Locks the listing price. After this, no new bids can be placed.

- **Auth Required:** Yes (Bearer token)
- **URL Params:** `id` — integer listing ID
- **Ownership:** Only the listing creator can mark the price as final.

**Success Response (200 OK):**
```json
{
  "message": "Price marked as final",
  "is_final_price": true
}
```

**Error Responses:**
| Code | Condition             | Body                                                        |
|------|-----------------------|-------------------------------------------------------------|
| 401  | Not authenticated     | `Authorization required`                                    |
| 403  | Not the listing owner | `{"error": "Only the listing owner can set final price"}`   |
| 404  | Listing not found     | `{"error": "Listing not found"}`                            |

**Example:**
```bash
curl -X PUT http://localhost:8080/listings/1/final-price \
  -H "Authorization: Bearer <session_token>"
```

---

#### PUT `/listings/{id}/unmark-final-price` — Unmark Final Price 🔒

Unlocks the listing price, allowing new bids again.

- **Auth Required:** Yes (Bearer token)
- **URL Params:** `id` — integer listing ID
- **Ownership:** Only the listing creator can unmark the final price.

**Success Response (200 OK):**
```json
{
  "message": "Final price removed",
  "is_final_price": false
}
```

**Error Responses:**
| Code | Condition             | Body                                                             |
|------|-----------------------|------------------------------------------------------------------|
| 401  | Not authenticated     | `Authorization required`                                         |
| 403  | Not the listing owner | `{"error": "Only the listing owner can update final price"}`     |
| 404  | Listing not found     | `{"error": "Listing not found"}`                                 |

**Example:**
```bash
curl -X PUT http://localhost:8080/listings/1/unmark-final-price \
  -H "Authorization: Bearer <session_token>"
```

---

### Static Files

#### GET `/uploads/{filename}` — Serve Uploaded Images

Serves uploaded image files from the filesystem.

- **Auth Required:** No
- **Example:** `http://localhost:8080/uploads/1_171234567_0.jpg`

---

## API Endpoint Summary

| Method   | Endpoint                              | Auth | Description                          |
|----------|---------------------------------------|------|--------------------------------------|
| `POST`   | `/auth/google`                        | No   | Google Login / Signup                |
| `GET`    | `/auth/me`                            | 🔒   | Get current user profile             |
| `POST`   | `/auth/logout`                        | 🔒   | Invalidate session                   |
| `GET`    | `/listings`                           | No   | Get all listings (newest first)      |
| `GET`    | `/listings/{id}`                      | No   | Get single listing                   |
| `POST`   | `/listings`                           | 🔒   | Create a listing                     |
| `PUT`    | `/listings/{id}`                      | 🔒   | Update a listing                     |
| `DELETE` | `/listings/{id}`                      | 🔒   | Delete a listing (owner only)        |
| `POST`   | `/listings/{id}/images`               | 🔒   | Upload images (owner only)           |
| `DELETE` | `/listings/{id}/images/{imageId}`     | 🔒   | Delete an image (owner only)         |
| `POST`   | `/listings/{id}/bids`                 | 🔒   | Place a bid (max 5 per buyer)        |
| `GET`    | `/listings/{id}/bids`                 | 🔒   | Get bids (role-filtered)             |
| `PUT`    | `/bids/{id}/respond`                  | 🔒   | Respond to bid (owner only)          |
| `PUT`    | `/listings/{id}/final-price`          | 🔒   | Lock listing price (owner only)      |
| `PUT`    | `/listings/{id}/unmark-final-price`   | 🔒   | Unlock listing price (owner only)    |
| `GET`    | `/uploads/{filename}`                 | No   | Serve uploaded images                |

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
**Total: 62 backend tests** across handlers and database packages.
