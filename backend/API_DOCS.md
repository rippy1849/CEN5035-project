# Marketplace Backend API Documentation

Base URL: `http://localhost:8080`

## Overview

The Marketplace Backend provides a RESTful API to manage product listings. It supports creating, retrieving, and updating listings.

## Data Models

### Listing

```json
{
  "id": 1,
  "user_id": 123,
  "title": "Vintage Camera",
  "description": "A classic film camera in good condition.",
  "price": 150.00,
  "category": "Electronics",
  "created_at": "2023-10-27T10:00:00Z",
  "updated_at": "2023-10-27T10:00:00Z"
}
```

| Field       | Type   | Description                                      |
| :---------- | :----- | :----------------------------------------------- |
| `id`        | int    | Unique identifier for the listing (auto-generated) |
| `user_id`   | int    | ID of the user creating the listing              |
| `title`     | string | Title of the product                             |
| `description`| string | Detailed description of the product              |
| `price`     | float  | Price of the product                             |
| `category`  | string | Category of the product                          |
| `created_at`| string | Timestamp of creation (server-generated)         |
| `updated_at`| string | Timestamp of last update                         |

---

## Endpoints

### 1. Get All Listings

Retrieves a list of all available listings, ordered by creation date (newest first).

- **URL:** `/listings`
- **Method:** `GET`
- **Success Response:**
  - **Code:** 200 OK
  - **Content:** JSON Array of `Listing` objects

**Example Request:**

```bash
curl -X GET http://localhost:8080/listings
```

**Example Response:**

```json
[
  {
    "id": 1,
    "user_id": 101,
    "title": "Gaming Laptop",
    "description": "High performance laptop.",
    "price": 1200.50,
    "category": "Electronics",
    "created_at": "...",
    "updated_at": "..."
  },
  {
    "id": 2,
    "user_id": 102,
    "title": "Office Chair",
    "description": "Ergonomic chair.",
    "price": 150.00,
    "category": "Furniture",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### 2. Create a Listing

Creates a new product listing.

- **URL:** `/listings`
- **Method:** `POST`
- **Content-Type:** `application/json`
- **Request Body:**

```json
{
  "user_id": 101,
  "title": "Smart Watch",
  "description": "Series 5, barely used.",
  "price": 250.00,
  "category": "Electronics"
}
```

- **Success Response:**
  - **Code:** 201 Created
  - **Content:** The created `Listing` object with generated `id`.

**Example Request:**

```bash
curl -X POST http://localhost:8080/listings \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": 101, \"title\": \"Smart Watch\", \"description\": \"Series 5, barely used.\", \"price\": 250.00, \"category\": \"Electronics\"}"
```

### 3. Update a Listing

Updates an existing listing by its ID.

- **URL:** `/listings/{id}`
- **Method:** `PUT`
- **URL Params:** `id=[integer]`
- **Content-Type:** `application/json`
- **Request Body:**

```json
{
  "title": "Smart Watch Series 6",
  "description": "Updated description.",
  "price": 240.00,
  "category": "Electronics"
}
```

- **Success Response:**
  - **Code:** 200 OK
  - **Content:** The updated `Listing` object.

- **Error Response:**
  - **Code:** 404 Not Found
  - **Content:** `{"error": "Listing not found"}`

**Example Request:**

```bash
curl -X PUT http://localhost:8080/listings/1 \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"Smart Watch Series 6\", \"description\": \"Updated description.\", \"price\": 240.00, \"category\": \"Electronics\"}"
```

## CORS

The API is configured to allow Cross-Origin Resource Sharing (CORS) from `http://localhost:3000` (React default port) for methods `GET`, `POST`, `PUT`, `OPTIONS`.
