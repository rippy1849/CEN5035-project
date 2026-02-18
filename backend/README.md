# Marketplace Backend

Minimal Go backend with SQLite for the OLX-style marketplace assignment.

## Tech Stack
- Go (Golang)
- SQLite (`modernc.org/sqlite` used as drop-in replacement for pure Go support without GCC)
- `net/http` (Standard Library)

## Structure
- `database/`: DB initialization
- `handlers/`: API request handlers
- `models/`: Data structures
- `main.go`: Server entry point and routing

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/listings` | Create a new listing |
| GET | `/listings` | Get all listings (newest first) |
| PUT | `/listings/{id}` | Update a listing |

## Running the Project

1. **Initialize the module and dependencies:**
   ```bash
   go mod tidy
   ```

2. **Run the server:**
   ```bash
   go run main.go
   ```

The server will start at `http://localhost:8080`.
The SQLite database `marketplace.db` will be automatically created in the root directory.

## Testing with curl

**Create Listing:**
```bash
curl -X POST http://localhost:8080/listings -H "Content-Type: application/json" -d "{\"user_id\": 1, \"title\": \"Laptop\", \"description\": \"Good condition\", \"price\": 500.0, \"category\": \"Electronics\"}"
```

**Get Listings:**
```bash
curl http://localhost:8080/listings
```

**Update Listing (replace 1 with actual ID):**
```bash
curl -X PUT http://localhost:8080/listings/1 -H "Content-Type: application/json" -d "{\"title\": \"Laptop Pro\", \"description\": \"Excellent condition\", \"price\": 550.0, \"category\": \"Electronics\"}"
```
