package handlers

import (
	"encoding/json"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// GetMyOrders returns all orders for the current user (as buyer or seller).
func GetMyOrders(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	rows, err := database.DB.Query(
		`SELECT o.id, o.listing_id, o.bid_id, o.buyer_id, o.seller_id,
		        o.agreed_price, o.platform_fee, o.seller_payout, o.status,
		        o.stripe_session_id, o.buyer_confirmed_at, o.seller_confirmed_at,
		        o.created_at, o.updated_at,
		        l.title,
		        COALESCE(buyer.name, ''), COALESCE(seller.name, '')
		 FROM orders o
		 JOIN listings l ON o.listing_id = l.id
		 LEFT JOIN users buyer ON o.buyer_id = buyer.id
		 LEFT JOIN users seller ON o.seller_id = seller.id
		 WHERE o.buyer_id = ? OR o.seller_id = ?
		 ORDER BY o.updated_at DESC`,
		userID, userID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(&o.ID, &o.ListingID, &o.BidID, &o.BuyerID, &o.SellerID,
			&o.AgreedPrice, &o.PlatformFee, &o.SellerPayout, &o.Status,
			&o.StripeSessionID, &o.BuyerConfirmedAt, &o.SellerConfirmedAt,
			&o.CreatedAt, &o.UpdatedAt,
			&o.ListingTitle,
			&o.BuyerName, &o.SellerName); err != nil {
			continue
		}
		// Fetch listing image
		var img string
		if err := database.DB.QueryRow("SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY display_order ASC, id ASC LIMIT 1", o.ListingID).Scan(&img); err == nil {
			o.ListingImage = img
		}
		orders = append(orders, o)
	}

	if orders == nil {
		orders = []models.Order{}
	}

	// Auto-complete check: orders that are paid and have at least one confirmation older than 7 days
	autoCompleteOrders(orders)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

// autoCompleteOrders checks and auto-completes orders where at least one confirmation is 7+ days old.
func autoCompleteOrders(orders []models.Order) {
	for i := range orders {
		if orders[i].Status == "paid" {
			shouldComplete := false

			if orders[i].BuyerConfirmedAt != nil && orders[i].SellerConfirmedAt != nil {
				// Both confirmed — complete immediately
				shouldComplete = true
			} else if orders[i].BuyerConfirmedAt != nil || orders[i].SellerConfirmedAt != nil {
				// One party confirmed — check if 7 days have passed
				var confirmTime string
				if orders[i].BuyerConfirmedAt != nil {
					confirmTime = *orders[i].BuyerConfirmedAt
				} else {
					confirmTime = *orders[i].SellerConfirmedAt
				}
				if t, err := time.Parse("2006-01-02 15:04:05", confirmTime); err == nil {
					if time.Since(t) > 7*24*time.Hour {
						shouldComplete = true
					}
				}
			}

			if shouldComplete {
				database.DB.Exec("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", orders[i].ID)
				orders[i].Status = "completed"
			}
		}
	}
}

// GetOrder returns a single order's details.
func GetOrder(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse order ID from path: /orders/{id}
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 2 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	orderID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	var o models.Order
	err = database.DB.QueryRow(
		`SELECT o.id, o.listing_id, o.bid_id, o.buyer_id, o.seller_id,
		        o.agreed_price, o.platform_fee, o.seller_payout, o.status,
		        o.stripe_session_id, o.buyer_confirmed_at, o.seller_confirmed_at,
		        o.created_at, o.updated_at,
		        l.title,
		        COALESCE(buyer.name, ''), COALESCE(seller.name, ''),
		        COALESCE(seller.email, '')
		 FROM orders o
		 JOIN listings l ON o.listing_id = l.id
		 LEFT JOIN users buyer ON o.buyer_id = buyer.id
		 LEFT JOIN users seller ON o.seller_id = seller.id
		 WHERE o.id = ?`,
		orderID,
	).Scan(&o.ID, &o.ListingID, &o.BidID, &o.BuyerID, &o.SellerID,
		&o.AgreedPrice, &o.PlatformFee, &o.SellerPayout, &o.Status,
		&o.StripeSessionID, &o.BuyerConfirmedAt, &o.SellerConfirmedAt,
		&o.CreatedAt, &o.UpdatedAt,
		&o.ListingTitle,
		&o.BuyerName, &o.SellerName,
		&o.SellerEmail)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	// Only buyer or seller can view the order
	uid := userID.(int)
	if o.BuyerID != uid && o.SellerID != uid {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "You don't have access to this order"})
		return
	}

	// Fetch listing image
	var img string
	if err := database.DB.QueryRow("SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY display_order ASC, id ASC LIMIT 1", o.ListingID).Scan(&img); err == nil {
		o.ListingImage = img
	}

	// Only reveal seller email to buyer after payment
	if uid == o.BuyerID && o.Status == "payment_pending" {
		o.SellerEmail = "" // Hide until paid
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(o)
}
