package handlers

import (
	"context"
	"encoding/json"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"net/http/httptest"
	"testing"
)

func setupOrderTest() {
	database.InitTestDB()
}

// createOrderTestData creates a seller, a buyer, a listing, a bid, and an order.
// Returns: sellerID, buyerID, listingID, bidID, orderID
func createOrderTestData(t *testing.T) (int, int, int, int, int) {
	t.Helper()

	res, err := database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('seller@ufl.edu', 'Seller', '', 'gseller')")
	if err != nil {
		t.Fatalf("Failed to create seller: %v", err)
	}
	sellerID, _ := res.LastInsertId()

	res, err = database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('buyer@ufl.edu', 'Buyer', '', 'gbuyer')")
	if err != nil {
		t.Fatalf("Failed to create buyer: %v", err)
	}
	buyerID, _ := res.LastInsertId()

	res, err = database.DB.Exec("INSERT INTO listings (user_id, title, description, price, category, status) VALUES (?, 'Test Item', 'desc', 100, 'Electronics', 'sold')", sellerID)
	if err != nil {
		t.Fatalf("Failed to create listing: %v", err)
	}
	listingID, _ := res.LastInsertId()

	res, err = database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (?, ?, 100, 'accepted', 1)", listingID, buyerID)
	if err != nil {
		t.Fatalf("Failed to create bid: %v", err)
	}
	bidID, _ := res.LastInsertId()

	platformFee := 100.0 * 0.05
	sellerPayout := 100.0 - platformFee
	res, err = database.DB.Exec(
		"INSERT INTO orders (listing_id, bid_id, buyer_id, seller_id, agreed_price, platform_fee, seller_payout, status) VALUES (?, ?, ?, ?, 100.0, ?, ?, 'payment_pending')",
		listingID, bidID, buyerID, sellerID, platformFee, sellerPayout,
	)
	if err != nil {
		t.Fatalf("Failed to create order: %v", err)
	}
	orderID, _ := res.LastInsertId()

	return int(sellerID), int(buyerID), int(listingID), int(bidID), int(orderID)
}

func orderRequest(method, url string, userID int) *http.Request {
	req := httptest.NewRequest(method, url, nil)
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), UserIDKey, userID)
	return req.WithContext(ctx)
}

func TestGetMyOrders(t *testing.T) {
	setupOrderTest()
	sellerID, buyerID, _, _, _ := createOrderTestData(t)

	// Test as buyer
	req := orderRequest(http.MethodGet, "/orders", buyerID)
	rr := httptest.NewRecorder()
	GetMyOrders(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr.Code)
	}

	var purchases []map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &purchases)

	if len(purchases) != 1 {
		t.Fatalf("Expected 1 purchase, got %d", len(purchases))
	}

	// Test as seller
	req2 := orderRequest(http.MethodGet, "/orders", sellerID)
	rr2 := httptest.NewRecorder()
	GetMyOrders(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr2.Code)
	}

	var sales []map[string]interface{}
	json.Unmarshal(rr2.Body.Bytes(), &sales)

	if len(sales) != 1 {
		t.Fatalf("Expected 1 sale, got %d", len(sales))
	}
}

func TestGetOrder(t *testing.T) {
	setupOrderTest()
	_, buyerID, _, _, _ := createOrderTestData(t)

	req := orderRequest(http.MethodGet, "/orders/1", buyerID)
	rr := httptest.NewRecorder()
	GetOrder(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr.Code)
	}

	var order models.Order
	json.Unmarshal(rr.Body.Bytes(), &order)

	if order.ID != 1 {
		t.Errorf("Expected order ID 1, got %d", order.ID)
	}

	// Unrelated user
	reqUnauth := orderRequest(http.MethodGet, "/orders/1", 999)
	rrUnauth := httptest.NewRecorder()
	GetOrder(rrUnauth, reqUnauth)
	if rrUnauth.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d", rrUnauth.Code)
	}
}
