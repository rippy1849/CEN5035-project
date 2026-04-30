package handlers

import (
	"encoding/json"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"os"
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

// CreatePaymentSession creates a Stripe checkout session (or simulated payment).
func CreatePaymentSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse order ID from path: /orders/{id}/pay
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
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

	// Fetch order
	var o models.Order
	err = database.DB.QueryRow(
		"SELECT id, listing_id, buyer_id, seller_id, agreed_price, status FROM orders WHERE id = ?",
		orderID,
	).Scan(&o.ID, &o.ListingID, &o.BuyerID, &o.SellerID, &o.AgreedPrice, &o.Status)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	// Only buyer can pay
	if o.BuyerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the buyer can make payment"})
		return
	}

	if o.Status != "payment_pending" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Payment has already been made"})
		return
	}

	stripeKey := os.Getenv("STRIPE_SECRET_KEY")
	if stripeKey != "" {
		// Real Stripe integration
		checkoutURL, sessionID, err := createStripeCheckoutSession(stripeKey, o.AgreedPrice, orderID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create payment session: " + err.Error()})
			return
		}
		// Store session ID
		database.DB.Exec("UPDATE orders SET stripe_session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", sessionID, orderID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"checkout_url": checkoutURL,
			"mode":         "stripe",
		})
	} else {
		// Simulated payment — mark as paid immediately
		database.DB.Exec("UPDATE orders SET status = 'paid', stripe_session_id = 'simulated', updated_at = CURRENT_TIMESTAMP WHERE id = ?", orderID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Payment simulated successfully",
			"mode":    "simulated",
		})
	}
}

// createStripeCheckoutSession creates a real Stripe Checkout session.
func createStripeCheckoutSession(apiKey string, amount float64, orderID int) (string, string, error) {
	// Use Stripe API directly via HTTP to avoid heavy dependency
	amountCents := int(amount * 100)

	body := strings.NewReader(
		"payment_method_types[0]=card" +
			"&line_items[0][price_data][currency]=usd" +
			"&line_items[0][price_data][unit_amount]=" + strconv.Itoa(amountCents) +
			"&line_items[0][price_data][product_data][name]=GatorMarketplace Order " + strconv.Itoa(orderID) +
			"&line_items[0][quantity]=1" +
			"&mode=payment" +
			"&success_url=http://localhost:5173/orders/" + strconv.Itoa(orderID) + "?payment=success" +
			"&cancel_url=http://localhost:5173/orders/" + strconv.Itoa(orderID) + "?payment=cancelled",
	)

	req, err := http.NewRequest("POST", "https://api.stripe.com/v1/checkout/sessions", body)
	if err != nil {
		return "", "", err
	}
	req.SetBasicAuth(apiKey, "")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	var result struct {
		ID  string `json:"id"`
		URL string `json:"url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", "", err
	}

	return result.URL, result.ID, nil
}

// PaymentSuccess handles the Stripe redirect callback.
func PaymentSuccess(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse order ID from path: /orders/{id}/payment-success
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	orderID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Mark order as paid
	database.DB.Exec("UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'payment_pending'", orderID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Payment confirmed"})
}

// ConfirmSeller marks the seller's handover confirmation.
func ConfirmSeller(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
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

	// Fetch order
	var o models.Order
	err = database.DB.QueryRow(
		"SELECT id, seller_id, buyer_id, status, buyer_confirmed_at, seller_confirmed_at FROM orders WHERE id = ?",
		orderID,
	).Scan(&o.ID, &o.SellerID, &o.BuyerID, &o.Status, &o.BuyerConfirmedAt, &o.SellerConfirmedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	if o.SellerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the seller can confirm handover"})
		return
	}

	if o.Status != "paid" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order must be paid before confirming"})
		return
	}

	if o.SellerConfirmedAt != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Already confirmed"})
		return
	}

	database.DB.Exec("UPDATE orders SET seller_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", orderID)

	// Check if both have confirmed
	if o.BuyerConfirmedAt != nil {
		database.DB.Exec("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", orderID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Seller handover confirmed"})
}

// ConfirmBuyer marks the buyer's receipt confirmation.
func ConfirmBuyer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
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

	// Fetch order
	var o models.Order
	err = database.DB.QueryRow(
		"SELECT id, seller_id, buyer_id, status, buyer_confirmed_at, seller_confirmed_at FROM orders WHERE id = ?",
		orderID,
	).Scan(&o.ID, &o.SellerID, &o.BuyerID, &o.Status, &o.BuyerConfirmedAt, &o.SellerConfirmedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	if o.BuyerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the buyer can confirm receipt"})
		return
	}

	if o.Status != "paid" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order must be paid before confirming"})
		return
	}

	if o.BuyerConfirmedAt != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Already confirmed"})
		return
	}

	database.DB.Exec("UPDATE orders SET buyer_confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", orderID)

	// Check if both have confirmed
	if o.SellerConfirmedAt != nil {
		database.DB.Exec("UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", orderID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Buyer receipt confirmed"})
}

// GetInvoice returns the invoice data for an order.
func GetInvoice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
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
	var listingTitle string
	err = database.DB.QueryRow(
		`SELECT o.id, o.buyer_id, o.seller_id, o.agreed_price, o.platform_fee, o.seller_payout, o.status, o.created_at,
		        l.title
		 FROM orders o JOIN listings l ON o.listing_id = l.id WHERE o.id = ?`,
		orderID,
	).Scan(&o.ID, &o.BuyerID, &o.SellerID, &o.AgreedPrice, &o.PlatformFee, &o.SellerPayout, &o.Status, &o.CreatedAt, &listingTitle)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Order not found"})
		return
	}

	uid := userID.(int)
	if o.BuyerID != uid && o.SellerID != uid {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Access denied"})
		return
	}

	invoice := map[string]interface{}{
		"order_id":             o.ID,
		"listing_title":        listingTitle,
		"agreed_price":         o.AgreedPrice,
		"platform_fee_percent": 5,
		"platform_fee":         o.PlatformFee,
		"seller_payout":        o.SellerPayout,
		"buyer_total":          o.AgreedPrice,
		"status":               o.Status,
		"created_at":           o.CreatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoice)
}
