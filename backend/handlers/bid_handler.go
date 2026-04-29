package handlers

import (
	"encoding/json"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"strconv"
	"strings"
)

const maxBidsPerListing = 5

func PlaceBid(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse listing ID from path: /listings/{id}/bids
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	listingID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Get buyer ID from context
	buyerID := r.Context().Value(UserIDKey)
	if buyerID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var body struct {
		Amount float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Amount is required and must be positive"})
		return
	}
	if body.Amount <= 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Amount is required and must be positive"})
		return
	}

	// Check listing exists and get owner
	var ownerID int
	var isFinalPrice int
	err = database.DB.QueryRow("SELECT user_id, is_final_price FROM listings WHERE id = ?", listingID).Scan(&ownerID, &isFinalPrice)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}

	// Cannot bid on own listing
	if ownerID == buyerID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "You cannot bid on your own listing"})
		return
	}

	// Check if listing is final-priced
	if isFinalPrice == 1 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "This listing has a final price and is not accepting bids"})
		return
	}

	// Check if a bid has already been accepted on this listing
	var acceptedCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM bids WHERE listing_id = ? AND status = 'accepted'", listingID).Scan(&acceptedCount)
	if acceptedCount > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "A bid has already been accepted for this listing"})
		return
	}

	// Check buyer's bid count for this listing
	var bidCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM bids WHERE listing_id = ? AND buyer_id = ?", listingID, buyerID).Scan(&bidCount)
	if bidCount >= maxBidsPerListing {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "You have used all 5 bids for this listing"})
		return
	}

	bidNumber := bidCount + 1
	bidsRemaining := maxBidsPerListing - bidNumber

	// Insert bid
	res, err := database.DB.Exec(
		"INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (?, ?, ?, 'pending', ?)",
		listingID, buyerID, body.Amount, bidNumber,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	bidID, _ := res.LastInsertId()

	// Fetch the created bid
	var bid models.Bid
	err = database.DB.QueryRow(
		"SELECT id, listing_id, buyer_id, amount, status, counter_amount, bid_number, created_at, updated_at FROM bids WHERE id = ?",
		bidID,
	).Scan(&bid.ID, &bid.ListingID, &bid.BuyerID, &bid.Amount, &bid.Status, &bid.CounterAmount, &bid.BidNumber, &bid.CreatedAt, &bid.UpdatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"bid":            bid,
		"bids_remaining": bidsRemaining,
	})
}

func GetBids(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse listing ID from path: /listings/{id}/bids
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	listingID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	// Check listing exists and get owner
	var ownerID int
	err = database.DB.QueryRow("SELECT user_id FROM listings WHERE id = ?", listingID).Scan(&ownerID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}

	isSeller := ownerID == userID.(int)

	var bids []models.Bid
	var rows interface{ Close() error }

	if isSeller {
		// Seller sees all bids with buyer names
		r, err := database.DB.Query(
			`SELECT b.id, b.listing_id, b.buyer_id, COALESCE(u.name, ''), b.amount, b.status, b.counter_amount, b.bid_number, b.created_at, b.updated_at
			 FROM bids b LEFT JOIN users u ON b.buyer_id = u.id
			 WHERE b.listing_id = ? ORDER BY b.created_at DESC`, listingID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rows = r
		for r.Next() {
			var bid models.Bid
			if err := r.Scan(&bid.ID, &bid.ListingID, &bid.BuyerID, &bid.BuyerName, &bid.Amount, &bid.Status, &bid.CounterAmount, &bid.BidNumber, &bid.CreatedAt, &bid.UpdatedAt); err != nil {
				continue
			}
			bids = append(bids, bid)
		}
	} else {
		// Buyer sees only their own bids
		r, err := database.DB.Query(
			`SELECT id, listing_id, buyer_id, amount, status, counter_amount, bid_number, created_at, updated_at
			 FROM bids WHERE listing_id = ? AND buyer_id = ? ORDER BY bid_number ASC`, listingID, userID,
		)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rows = r
		for r.Next() {
			var bid models.Bid
			if err := r.Scan(&bid.ID, &bid.ListingID, &bid.BuyerID, &bid.Amount, &bid.Status, &bid.CounterAmount, &bid.BidNumber, &bid.CreatedAt, &bid.UpdatedAt); err != nil {
				continue
			}
			bids = append(bids, bid)
		}
	}
	defer rows.Close()

	if bids == nil {
		bids = []models.Bid{}
	}

	// Calculate bids remaining for the current user (buyer perspective)
	bidsRemaining := maxBidsPerListing
	if !isSeller {
		var bidCount int
		database.DB.QueryRow("SELECT COUNT(*) FROM bids WHERE listing_id = ? AND buyer_id = ?", listingID, userID).Scan(&bidCount)
		bidsRemaining = maxBidsPerListing - bidCount
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"bids":           bids,
		"bids_remaining": bidsRemaining,
		"is_seller":      isSeller,
	})
}

func MarkFinalPrice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse listing ID from path: /listings/{id}/final-price
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	listingID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	// Verify listing exists and user is owner
	var ownerID int
	err = database.DB.QueryRow("SELECT user_id FROM listings WHERE id = ?", listingID).Scan(&ownerID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}
	if ownerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the listing owner can set final price"})
		return
	}

	// Update the listing
	database.DB.Exec("UPDATE listings SET is_final_price = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", listingID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Price marked as final",
		"is_final_price": true,
	})
}

func UnmarkFinalPrice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse listing ID from path: /listings/{id}/unmark-final-price
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	listingID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	// Verify listing exists and user is owner
	var ownerID int
	err = database.DB.QueryRow("SELECT user_id FROM listings WHERE id = ?", listingID).Scan(&ownerID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}
	if ownerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the listing owner can update final price"})
		return
	}

	// Update the listing
	database.DB.Exec("UPDATE listings SET is_final_price = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", listingID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Final price removed",
		"is_final_price": false,
	})
}

const platformFeePercent = 0.05

// createOrderFromBid creates an order when a bid is accepted (by either party).
func createOrderFromBid(listingID, bidID, buyerID, sellerID int, agreedPrice float64) (int64, error) {
	platformFee := agreedPrice * platformFeePercent
	sellerPayout := agreedPrice - platformFee

	res, err := database.DB.Exec(
		`INSERT INTO orders (listing_id, bid_id, buyer_id, seller_id, agreed_price, platform_fee, seller_payout, status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'payment_pending')`,
		listingID, bidID, buyerID, sellerID, agreedPrice, platformFee, sellerPayout,
	)
	if err != nil {
		return 0, err
	}

	// Mark listing as sold
	database.DB.Exec("UPDATE listings SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?", listingID)

	// Reject all other pending bids for this listing
	database.DB.Exec("UPDATE bids SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE listing_id = ? AND id != ? AND status = 'pending'", listingID, bidID)

	return res.LastInsertId()
}

func RespondToBid(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse bid ID from path: /bids/{id}/respond
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	bidID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var body struct {
		Action        string   `json:"action"`
		CounterAmount *float64 `json:"counter_amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate action
	if body.Action != "accept" && body.Action != "counter" && body.Action != "reject" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid action: must be accept, counter, or reject"})
		return
	}

	// Counter requires amount
	if body.Action == "counter" && (body.CounterAmount == nil || *body.CounterAmount <= 0) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Counter amount is required for counter action"})
		return
	}

	// Fetch bid and verify it exists
	var bid models.Bid
	var listingID int
	err = database.DB.QueryRow(
		"SELECT id, listing_id, buyer_id, amount, status, counter_amount, bid_number, created_at, updated_at FROM bids WHERE id = ?",
		bidID,
	).Scan(&bid.ID, &bid.ListingID, &bid.BuyerID, &bid.Amount, &bid.Status, &bid.CounterAmount, &bid.BidNumber, &bid.CreatedAt, &bid.UpdatedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Bid not found"})
		return
	}
	listingID = bid.ListingID

	// Verify the user is the listing owner
	var ownerID int
	err = database.DB.QueryRow("SELECT user_id FROM listings WHERE id = ?", listingID).Scan(&ownerID)
	if err != nil || ownerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the listing owner can respond to bids"})
		return
	}

	// Can only respond to pending bids
	if bid.Status != "pending" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Can only respond to pending bids"})
		return
	}

	// Execute action
	var orderID int64
	switch body.Action {
	case "accept":
		database.DB.Exec("UPDATE bids SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?", bidID)
		bid.Status = "accepted"
		// Create an order
		orderID, err = createOrderFromBid(listingID, bidID, bid.BuyerID, ownerID, bid.Amount)
		if err != nil {
			http.Error(w, "Failed to create order: "+err.Error(), http.StatusInternalServerError)
			return
		}
	case "counter":
		database.DB.Exec("UPDATE bids SET status = 'countered', counter_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", *body.CounterAmount, bidID)
		bid.Status = "countered"
		bid.CounterAmount = body.CounterAmount
	case "reject":
		database.DB.Exec("UPDATE bids SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?", bidID)
		bid.Status = "rejected"
	}

	// Re-fetch to get updated timestamps
	database.DB.QueryRow("SELECT updated_at FROM bids WHERE id = ?", bidID).Scan(&bid.UpdatedAt)

	response := map[string]interface{}{
		"bid": bid,
	}
	if orderID > 0 {
		response["order_id"] = orderID
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// AcceptCounter allows a buyer to accept the seller's counter-offer.
func AcceptCounter(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse bid ID from path: /bids/{id}/accept-counter
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	bidID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Get user ID from context
	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	// Fetch bid
	var bid models.Bid
	err = database.DB.QueryRow(
		"SELECT id, listing_id, buyer_id, amount, status, counter_amount, bid_number, created_at, updated_at FROM bids WHERE id = ?",
		bidID,
	).Scan(&bid.ID, &bid.ListingID, &bid.BuyerID, &bid.Amount, &bid.Status, &bid.CounterAmount, &bid.BidNumber, &bid.CreatedAt, &bid.UpdatedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Bid not found"})
		return
	}

	// Only the buyer can accept a counter
	if bid.BuyerID != userID.(int) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the buyer can accept a counter-offer"})
		return
	}

	// Can only accept countered bids
	if bid.Status != "countered" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Can only accept a countered bid"})
		return
	}

	if bid.CounterAmount == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Counter amount is missing"})
		return
	}

	// Accept the counter — update bid status
	database.DB.Exec("UPDATE bids SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?", bidID)
	bid.Status = "accepted"

	// Get listing owner
	var ownerID int
	database.DB.QueryRow("SELECT user_id FROM listings WHERE id = ?", bid.ListingID).Scan(&ownerID)

	// Create order with counter_amount as agreed price
	orderID, err := createOrderFromBid(bid.ListingID, bidID, bid.BuyerID, ownerID, *bid.CounterAmount)
	if err != nil {
		http.Error(w, "Failed to create order: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Re-fetch
	database.DB.QueryRow("SELECT updated_at FROM bids WHERE id = ?", bidID).Scan(&bid.UpdatedAt)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"bid":      bid,
		"order_id": orderID,
	})
}

// GetMyBids returns all bids placed by the current user, with listing info.
func GetMyBids(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.Context().Value(UserIDKey)
	if userID == nil {
		http.Error(w, "Authorization required", http.StatusUnauthorized)
		return
	}

	type BidWithListing struct {
		models.Bid
		ListingTitle string  `json:"listing_title"`
		ListingPrice float64 `json:"listing_price"`
		ListingImage string  `json:"listing_image"`
	}

	rows, err := database.DB.Query(
		`SELECT b.id, b.listing_id, b.buyer_id, b.amount, b.status, b.counter_amount, b.bid_number, b.created_at, b.updated_at,
		        l.title, l.price
		 FROM bids b
		 JOIN listings l ON b.listing_id = l.id
		 WHERE b.buyer_id = ?
		 ORDER BY b.updated_at DESC`,
		userID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var bids []BidWithListing
	for rows.Next() {
		var b BidWithListing
		if err := rows.Scan(&b.ID, &b.ListingID, &b.BuyerID, &b.Amount, &b.Status, &b.CounterAmount, &b.BidNumber, &b.CreatedAt, &b.UpdatedAt,
			&b.ListingTitle, &b.ListingPrice); err != nil {
			continue
		}
		bids = append(bids, b)
	}

	// Fetch first image for each listing
	for i := range bids {
		var img string
		err := database.DB.QueryRow("SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY display_order ASC, id ASC LIMIT 1", bids[i].ListingID).Scan(&img)
		if err == nil {
			bids[i].ListingImage = img
		}
	}

	if bids == nil {
		bids = []BidWithListing{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(bids)
}

