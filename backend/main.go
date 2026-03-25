package main

import (
	"log"
	"net/http"
	"os"

	"marketplace-backend/database"
	"marketplace-backend/handlers"
)

func main() {
	// Allow setting Google Client ID via env
	if clientID := os.Getenv("GOOGLE_CLIENT_ID"); clientID != "" {
		handlers.GoogleClientID = clientID
	}

	// Initialize Database
	database.InitDB()
	log.Println("Database initialized")

	mux := http.NewServeMux()

	// --- Auth routes ---
	mux.HandleFunc("/auth/google", handlers.GoogleLoginHandler)
	mux.HandleFunc("/auth/me", handlers.AuthMiddleware(handlers.GetMeHandler))
	mux.HandleFunc("/auth/logout", handlers.LogoutHandler)

	// --- Listing routes ---
	mux.HandleFunc("/listings", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			handlers.GetListings(w, r)
		case http.MethodPost:
			handlers.AuthMiddleware(handlers.CreateListing)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/listings/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut:
			handlers.AuthMiddleware(handlers.UpdateListing)(w, r)
		case http.MethodDelete:
			handlers.AuthMiddleware(handlers.DeleteListing)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Apply CORS Middleware
	handler := corsMiddleware(mux)

	// Start Server
	log.Println("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		allowedOrigins := map[string]bool{
			"http://localhost:3000": true,
			"http://localhost:5173": true,
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
