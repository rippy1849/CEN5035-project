package main

import (
	"log"
	"net/http"
	"os"
	"strings"

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

	// Ensure uploads directory exists
	os.MkdirAll("./uploads", os.ModePerm)

	mux := http.NewServeMux()

	// --- Auth routes ---
	mux.HandleFunc("/auth/google", handlers.GoogleLoginHandler)
	mux.HandleFunc("/auth/me", handlers.AuthMiddleware(handlers.GetMeHandler))
	mux.HandleFunc("/auth/logout", handlers.LogoutHandler)

	// --- Static file server for uploaded images ---
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads/"))))

	// --- Dashboard routes ---
	mux.HandleFunc("/my/bids", handlers.AuthMiddleware(handlers.GetMyBids))
	mux.HandleFunc("/my/listings", handlers.AuthMiddleware(handlers.GetMyListings))

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
		path := strings.TrimPrefix(r.URL.Path, "/listings/")
		parts := strings.Split(path, "/")

		// /listings/{id}/images or /listings/{id}/images/{imageId}
		if len(parts) >= 2 && parts[1] == "images" {
			switch r.Method {
			case http.MethodPost:
				handlers.AuthMiddleware(handlers.UploadListingImages)(w, r)
			case http.MethodDelete:
				handlers.AuthMiddleware(handlers.DeleteListingImage)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		// /listings/{id}/bids
		if len(parts) >= 2 && parts[1] == "bids" {
			switch r.Method {
			case http.MethodPost:
				handlers.AuthMiddleware(handlers.PlaceBid)(w, r)
			case http.MethodGet:
				handlers.AuthMiddleware(handlers.GetBids)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		// /listings/{id}/final-price
		if len(parts) >= 2 && parts[1] == "final-price" {
			switch r.Method {
			case http.MethodPut:
				handlers.AuthMiddleware(handlers.MarkFinalPrice)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		// /listings/{id}/unmark-final-price
		if len(parts) >= 2 && parts[1] == "unmark-final-price" {
			switch r.Method {
			case http.MethodPut:
				handlers.AuthMiddleware(handlers.UnmarkFinalPrice)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		// /listings/{id} — existing CRUD
		switch r.Method {
		case http.MethodGet:
			handlers.GetListing(w, r)
		case http.MethodPut:
			handlers.AuthMiddleware(handlers.UpdateListing)(w, r)
		case http.MethodDelete:
			handlers.AuthMiddleware(handlers.DeleteListing)(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// --- Bid response routes ---
	mux.HandleFunc("/bids/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/bids/")
		parts := strings.Split(path, "/")

		if len(parts) >= 2 && parts[1] == "accept-counter" {
			handlers.AuthMiddleware(handlers.AcceptCounter)(w, r)
			return
		}

		if len(parts) >= 2 && parts[1] == "respond" {
			switch r.Method {
			case http.MethodPut:
				handlers.AuthMiddleware(handlers.RespondToBid)(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
			return
		}

		http.Error(w, "Not found", http.StatusNotFound)
	})

	// --- Order routes ---
	mux.HandleFunc("/orders", handlers.AuthMiddleware(handlers.GetMyOrders))
	mux.HandleFunc("/orders/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/orders/")
		parts := strings.Split(path, "/")

		if len(parts) >= 2 {
			switch parts[1] {
			case "pay":
				handlers.AuthMiddleware(handlers.CreatePaymentSession)(w, r)
				return
			case "payment-success":
				handlers.AuthMiddleware(handlers.PaymentSuccess)(w, r)
				return
			case "confirm-seller":
				handlers.AuthMiddleware(handlers.ConfirmSeller)(w, r)
				return
			case "confirm-buyer":
				handlers.AuthMiddleware(handlers.ConfirmBuyer)(w, r)
				return
			case "invoice":
				handlers.AuthMiddleware(handlers.GetInvoice)(w, r)
				return
			}
		}

		// /orders/{id}
		switch r.Method {
		case http.MethodGet:
			handlers.AuthMiddleware(handlers.GetOrder)(w, r)
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
