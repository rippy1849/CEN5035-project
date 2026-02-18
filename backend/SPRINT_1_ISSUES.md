# Sprint 1: Local Marketplace MVP (Backend)

The goal of Sprint 1 is to establish a working local backend for the marketplace, enabling basic product listing management without authentication within a constrained timeline.

## Epics
- **Project Structure**: Set up the Git repository and local database.
- **Listing Features**: Build the core API for listing management.
- **Documentation**: Provide API usage instructions.

## Issues

### issue-1: Initialize Project, Database, and Environment
- **Description**: Set up the foundational Go project structure, SQLite database connection, and local development environment.
- **Acceptance Criteria**:
  - `go.mod` created and `handlers/`, `models/`, `database/` folders organized.
  - `.gitignore` configured to exclude build artifacts and `go_dist/`.
  - SQLite connection established via `InitDB`.
  - `listings` table created automatically on startup.
  - `run.bat` script created for local execution.

### issue-2: Implement Listings CRUD API
- **Description**: Develop the core business logic and API endpoints for managing marketplace listings.
- **Acceptance Criteria**:
  - `Listing` data model defined with JSON tags.
  - `POST /listings` endpoint to create new listings.
  - `GET /listings` endpoint to retrieve all listings (ordered by newest).
  - `PUT /listings/{id}` endpoint to update existing listing details.
  - Input validation implemented for required fields.

### issue-3: Server Configuration & Middleware
- **Description**: Configure the HTTP server, routing, and necessary middleware for frontend integration.
- **Acceptance Criteria**:
  - `main.go` entry point wires up all routes.
  - CORS middleware implemented to allow requests from `localhost:3000`.
  - HTTP Server starts on port 8080.
  - Proper error handling for invalid methods and internal server errors.

### issue-4: API Documentation
- **Description**: Create comprehensive documentation for the implemented API endpoints to facilitate frontend development.
- **Acceptance Criteria**:
  - `API_DOCS.md` created in the project root.
  - Detailed request/response examples for `GET`, `POST`, and `PUT` endpoints.
  - Curl commands provided for testing.
