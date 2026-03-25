package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"net/http/httptest"
	"testing"
)

func setupAuthTest() {
	database.InitTestDB()
}

// --- GoogleLoginHandler tests ---

func TestGoogleLogin_ValidUFLToken(t *testing.T) {
	setupAuthTest()

	// Mock the Google token verifier
	originalVerifier := verifyGoogleToken
	defer func() { verifyGoogleToken = originalVerifier }()

	verifyGoogleToken = func(idToken string) (*models.GoogleTokenPayload, error) {
		return &models.GoogleTokenPayload{
			Sub:     "google_123",
			Email:   "student@ufl.edu",
			Name:    "Test Student",
			Picture: "https://example.com/photo.jpg",
			HD:      "ufl.edu",
			Aud:     "",
		}, nil
	}

	body := `{"credential": "mock_token"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	GoogleLoginHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	if resp["token"] == nil || resp["token"] == "" {
		t.Error("Response should contain a session token")
	}
	if resp["user"] == nil {
		t.Error("Response should contain user info")
	}
}

func TestGoogleLogin_NonUFLDomain(t *testing.T) {
	setupAuthTest()

	originalVerifier := verifyGoogleToken
	defer func() { verifyGoogleToken = originalVerifier }()

	verifyGoogleToken = func(idToken string) (*models.GoogleTokenPayload, error) {
		return &models.GoogleTokenPayload{
			Sub:   "google_456",
			Email: "user@gmail.com",
			Name:  "Gmail User",
			HD:    "gmail.com",
		}, nil
	}

	body := `{"credential": "mock_token"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	GoogleLoginHandler(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403 for non-UFL domain, got %d", rr.Code)
	}

	var resp map[string]string
	json.Unmarshal(rr.Body.Bytes(), &resp)
	if resp["error"] == "" {
		t.Error("Response should contain error message about UFL restriction")
	}
}

func TestGoogleLogin_InvalidToken(t *testing.T) {
	setupAuthTest()

	originalVerifier := verifyGoogleToken
	defer func() { verifyGoogleToken = originalVerifier }()

	verifyGoogleToken = func(idToken string) (*models.GoogleTokenPayload, error) {
		return nil, fmt.Errorf("invalid token")
	}

	body := `{"credential": "bad_token"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	GoogleLoginHandler(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 for invalid token, got %d", rr.Code)
	}
}

func TestGoogleLogin_MissingCredential(t *testing.T) {
	setupAuthTest()

	body := `{}`
	req := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	GoogleLoginHandler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 for missing credential, got %d", rr.Code)
	}
}

func TestGoogleLogin_DuplicateLogin_UpdatesUser(t *testing.T) {
	setupAuthTest()

	originalVerifier := verifyGoogleToken
	defer func() { verifyGoogleToken = originalVerifier }()

	verifyGoogleToken = func(idToken string) (*models.GoogleTokenPayload, error) {
		return &models.GoogleTokenPayload{
			Sub:     "google_789",
			Email:   "repeat@ufl.edu",
			Name:    "Updated Name",
			Picture: "https://example.com/new.jpg",
			HD:      "ufl.edu",
		}, nil
	}

	// First login
	body := `{"credential": "mock_token"}`
	req := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	GoogleLoginHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("First login failed: %d", rr.Code)
	}

	// Second login (should upsert, not duplicate)
	req2 := httptest.NewRequest(http.MethodPost, "/auth/google", bytes.NewBufferString(body))
	req2.Header.Set("Content-Type", "application/json")
	rr2 := httptest.NewRecorder()
	GoogleLoginHandler(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Fatalf("Second login failed: %d", rr2.Code)
	}

	// Verify only one user exists
	var count int
	database.DB.QueryRow("SELECT COUNT(*) FROM users WHERE google_id = 'google_789'").Scan(&count)
	if count != 1 {
		t.Fatalf("Expected 1 user, got %d", count)
	}
}

// --- GetMeHandler tests ---

func TestGetMe_ValidSession(t *testing.T) {
	setupAuthTest()

	// Insert a user and session directly
	res, _ := database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('me@ufl.edu', 'Me', '', 'g1')")
	userID, _ := res.LastInsertId()
	database.DB.Exec("INSERT INTO sessions (token, user_id) VALUES ('valid_token', ?)", userID)

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer valid_token")
	rr := httptest.NewRecorder()

	// Must go through AuthMiddleware
	AuthMiddleware(GetMeHandler)(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var user models.User
	json.Unmarshal(rr.Body.Bytes(), &user)
	if user.Email != "me@ufl.edu" {
		t.Errorf("Expected email me@ufl.edu, got %s", user.Email)
	}
}

func TestGetMe_InvalidSession(t *testing.T) {
	setupAuthTest()

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	req.Header.Set("Authorization", "Bearer invalid_token")
	rr := httptest.NewRecorder()

	AuthMiddleware(GetMeHandler)(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 for invalid session, got %d", rr.Code)
	}
}

func TestGetMe_NoAuthHeader(t *testing.T) {
	setupAuthTest()

	req := httptest.NewRequest(http.MethodGet, "/auth/me", nil)
	rr := httptest.NewRecorder()

	AuthMiddleware(GetMeHandler)(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 for missing auth, got %d", rr.Code)
	}
}

// --- LogoutHandler tests ---

func TestLogout_ValidToken(t *testing.T) {
	setupAuthTest()

	res, _ := database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('logout@ufl.edu', 'Bye', '', 'g2')")
	userID, _ := res.LastInsertId()
	database.DB.Exec("INSERT INTO sessions (token, user_id) VALUES ('logout_token', ?)", userID)

	req := httptest.NewRequest(http.MethodPost, "/auth/logout", nil)
	req.Header.Set("Authorization", "Bearer logout_token")
	rr := httptest.NewRecorder()

	LogoutHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr.Code)
	}

	// Verify session was deleted
	var count int
	database.DB.QueryRow("SELECT COUNT(*) FROM sessions WHERE token = 'logout_token'").Scan(&count)
	if count != 0 {
		t.Error("Session should be deleted after logout")
	}
}
