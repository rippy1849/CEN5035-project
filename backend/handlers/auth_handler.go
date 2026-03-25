package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"strings"
)

type contextKey string

const UserIDKey contextKey = "user_id"

// GoogleClientID should be set from config/env. For now, it's a package variable.
var GoogleClientID string = ""

// verifyGoogleToken verifies the Google ID token via Google's tokeninfo endpoint.
// This is the simple approach (HTTP call to Google). For production, use a JWT library.
var verifyGoogleToken = func(idToken string) (*models.GoogleTokenPayload, error) {
	resp, err := http.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
	if err != nil {
		return nil, fmt.Errorf("failed to verify token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("invalid token: %s", string(body))
	}

	var payload models.GoogleTokenPayload
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode token: %w", err)
	}

	return &payload, nil
}

func generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GoogleLoginHandler handles POST /auth/google
// Expects JSON body: {"credential": "<google_id_token>"}
func GoogleLoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Credential string `json:"credential"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Credential == "" {
		http.Error(w, "Missing credential", http.StatusBadRequest)
		return
	}

	payload, err := verifyGoogleToken(body.Credential)
	if err != nil {
		http.Error(w, "Invalid Google token: "+err.Error(), http.StatusUnauthorized)
		return
	}

	// Verify Client ID if configured
	if GoogleClientID != "" && payload.Aud != GoogleClientID {
		http.Error(w, "Token was not issued for this application", http.StatusUnauthorized)
		return
	}

	// Check hosted domain — must be ufl.edu
	if payload.HD != "ufl.edu" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Only @ufl.edu accounts are allowed",
		})
		return
	}

	// Upsert user
	var userID int
	err = database.DB.QueryRow("SELECT id FROM users WHERE google_id = ?", payload.Sub).Scan(&userID)
	if err != nil {
		// User doesn't exist, create
		res, insertErr := database.DB.Exec(
			"INSERT INTO users (email, name, picture, google_id) VALUES (?, ?, ?, ?)",
			payload.Email, payload.Name, payload.Picture, payload.Sub,
		)
		if insertErr != nil {
			http.Error(w, "Failed to create user: "+insertErr.Error(), http.StatusInternalServerError)
			return
		}
		id, _ := res.LastInsertId()
		userID = int(id)
	} else {
		// Update name/picture on each login
		database.DB.Exec(
			"UPDATE users SET name = ?, picture = ? WHERE id = ?",
			payload.Name, payload.Picture, userID,
		)
	}

	// Create session
	token, err := generateSessionToken()
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec("INSERT INTO sessions (token, user_id) VALUES (?, ?)", token, userID)
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Return user info + token
	user := models.User{
		ID:       userID,
		Email:    payload.Email,
		Name:     payload.Name,
		Picture:  payload.Picture,
		GoogleID: payload.Sub,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

// GetMeHandler handles GET /auth/me
// Requires Authorization header.
func GetMeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var user models.User
	err := database.DB.QueryRow(
		"SELECT id, email, name, picture, google_id, created_at FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Picture, &user.GoogleID, &user.CreatedAt)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// LogoutHandler handles POST /auth/logout
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := extractBearerToken(r)
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	database.DB.Exec("DELETE FROM sessions WHERE token = ?", token)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out"})
}

// AuthMiddleware extracts Bearer token, looks up session, and injects user_id into context.
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := extractBearerToken(r)
		if token == "" {
			http.Error(w, "Authorization required", http.StatusUnauthorized)
			return
		}

		var userID int
		err := database.DB.QueryRow("SELECT user_id FROM sessions WHERE token = ?", token).Scan(&userID)
		if err != nil {
			http.Error(w, "Invalid or expired session", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next(w, r.WithContext(ctx))
	}
}

// OptionalAuthMiddleware is like AuthMiddleware but doesn't reject unauthenticated requests.
// If a valid token is present, user_id is injected. Otherwise, request proceeds without it.
func OptionalAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := extractBearerToken(r)
		if token != "" {
			var userID int
			err := database.DB.QueryRow("SELECT user_id FROM sessions WHERE token = ?", token).Scan(&userID)
			if err == nil {
				ctx := context.WithValue(r.Context(), UserIDKey, userID)
				r = r.WithContext(ctx)
			}
		}
		next(w, r)
	}
}

func extractBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}
