package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"net/http"
	"net/http/httptest"
	"testing"
)

func setupBidTest() {
	database.InitTestDB()
}

// createBidTestData creates a seller (user1), a buyer (user2), and a listing owned by user1.
// Returns: sellerID, buyerID, listingID
func createBidTestData(t *testing.T) (int, int, int) {
	t.Helper()

	// Create seller
	res, err := database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('seller@ufl.edu', 'Seller', '', 'gseller')")
	if err != nil {
		t.Fatalf("Failed to create seller: %v", err)
	}
	sellerID, _ := res.LastInsertId()
	database.DB.Exec("INSERT INTO sessions (token, user_id) VALUES ('seller_token', ?)", sellerID)

	// Create buyer
	res, err = database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('buyer@ufl.edu', 'Buyer', '', 'gbuyer')")
	if err != nil {
		t.Fatalf("Failed to create buyer: %v", err)
	}
	buyerID, _ := res.LastInsertId()
	database.DB.Exec("INSERT INTO sessions (token, user_id) VALUES ('buyer_token', ?)", buyerID)

	// Create listing owned by seller
	res, err = database.DB.Exec("INSERT INTO listings (user_id, title, description, price, category) VALUES (?, 'Test Item', 'desc', 100, 'Electronics')", sellerID)
	if err != nil {
		t.Fatalf("Failed to create listing: %v", err)
	}
	listingID, _ := res.LastInsertId()

	return int(sellerID), int(buyerID), int(listingID)
}

func bidRequest(method, url, body string, userID int) *http.Request {
	var req *http.Request
	if body != "" {
		req = httptest.NewRequest(method, url, bytes.NewBufferString(body))
	} else {
		req = httptest.NewRequest(method, url, nil)
	}
	req.Header.Set("Content-Type", "application/json")
	ctx := context.WithValue(req.Context(), UserIDKey, userID)
	return req.WithContext(ctx)
}

// --- PlaceBid tests ---

func TestPlaceBid_ValidBid(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80.00}`, buyerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	bid := resp["bid"].(map[string]interface{})
	if bid["bid_number"].(float64) != 1 {
		t.Errorf("Expected bid_number 1, got %v", bid["bid_number"])
	}
	if bid["status"].(string) != "pending" {
		t.Errorf("Expected status 'pending', got '%s'", bid["status"])
	}
	if resp["bids_remaining"].(float64) != 4 {
		t.Errorf("Expected 4 bids remaining, got %v", resp["bids_remaining"])
	}
}

func TestPlaceBid_OwnListing(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80.00}`, sellerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_ListingNotFound(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	req := bidRequest(http.MethodPost, "/listings/999/bids", `{"amount": 80.00}`, buyerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_FinalPricedListing(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	// Mark listing as final price
	database.DB.Exec("UPDATE listings SET is_final_price = 1 WHERE id = 1")

	req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80.00}`, buyerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_MaxBidsReached(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	// Insert 5 existing bids
	for i := 1; i <= 5; i++ {
		database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, ?, 'pending', ?)", buyerID, 50+i*10, i)
	}

	req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80.00}`, buyerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_AlreadyAccepted(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	// Create a third user who had a bid accepted
	database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('other@ufl.edu', 'Other', '', 'gother')")
	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, 3, 90, 'accepted', 1)")

	req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80.00}`, buyerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_InvalidAmount(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": -10}`, buyerID)
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_NoAuth(t *testing.T) {
	setupBidTest()
	createBidTestData(t)

	req := httptest.NewRequest(http.MethodPost, "/listings/1/bids", bytes.NewBufferString(`{"amount": 80}`))
	req.Header.Set("Content-Type", "application/json")
	// No user_id in context
	rr := httptest.NewRecorder()

	PlaceBid(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestPlaceBid_BidNumberIncrement(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	for i := 1; i <= 3; i++ {
		req := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80.00}`, buyerID)
		rr := httptest.NewRecorder()
		PlaceBid(rr, req)

		if rr.Code != http.StatusCreated {
			t.Fatalf("Bid %d: Expected 201, got %d: %s", i, rr.Code, rr.Body.String())
		}

		var resp map[string]interface{}
		json.Unmarshal(rr.Body.Bytes(), &resp)

		bid := resp["bid"].(map[string]interface{})
		expectedBidNum := float64(i)
		if bid["bid_number"].(float64) != expectedBidNum {
			t.Errorf("Bid %d: Expected bid_number %v, got %v", i, expectedBidNum, bid["bid_number"])
		}

		expectedRemaining := float64(5 - i)
		if resp["bids_remaining"].(float64) != expectedRemaining {
			t.Errorf("Bid %d: Expected %v remaining, got %v", i, expectedRemaining, resp["bids_remaining"])
		}
	}
}

// --- GetBids tests ---

func TestGetBids_AsSeller(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	// Place a bid
	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodGet, "/listings/1/bids", "", sellerID)
	rr := httptest.NewRecorder()

	GetBids(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	if resp["is_seller"].(bool) != true {
		t.Error("Expected is_seller to be true")
	}

	bids := resp["bids"].([]interface{})
	if len(bids) != 1 {
		t.Fatalf("Expected 1 bid, got %d", len(bids))
	}

	bid := bids[0].(map[string]interface{})
	if bid["buyer_name"].(string) != "Buyer" {
		t.Errorf("Expected buyer_name 'Buyer', got '%s'", bid["buyer_name"])
	}
}

func TestGetBids_AsBuyer(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	// Place a bid from the buyer
	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	// Place a bid from another user (should not be visible to buyer)
	database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('other@ufl.edu', 'Other', '', 'gother')")
	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, 3, 90, 'pending', 1)")

	req := bidRequest(http.MethodGet, "/listings/1/bids", "", buyerID)
	rr := httptest.NewRecorder()

	GetBids(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	if resp["is_seller"].(bool) != false {
		t.Error("Expected is_seller to be false")
	}

	bids := resp["bids"].([]interface{})
	if len(bids) != 1 {
		t.Fatalf("Expected 1 bid (buyer's own), got %d", len(bids))
	}
}

func TestGetBids_NoBids(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	req := bidRequest(http.MethodGet, "/listings/1/bids", "", sellerID)
	rr := httptest.NewRecorder()

	GetBids(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	bids := resp["bids"].([]interface{})
	if len(bids) != 0 {
		t.Fatalf("Expected 0 bids, got %d", len(bids))
	}
}

func TestGetBids_ListingNotFound(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	req := bidRequest(http.MethodGet, "/listings/999/bids", "", buyerID)
	rr := httptest.NewRecorder()

	GetBids(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

// --- RespondToBid tests ---

func TestRespondToBid_Accept(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "accept"}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	bid := resp["bid"].(map[string]interface{})
	if bid["status"].(string) != "accepted" {
		t.Errorf("Expected status 'accepted', got '%s'", bid["status"])
	}
}

func TestRespondToBid_Counter(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "counter", "counter_amount": 95.00}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	bid := resp["bid"].(map[string]interface{})
	if bid["status"].(string) != "countered" {
		t.Errorf("Expected status 'countered', got '%s'", bid["status"])
	}
	if bid["counter_amount"].(float64) != 95.0 {
		t.Errorf("Expected counter_amount 95, got %v", bid["counter_amount"])
	}
}

func TestRespondToBid_Reject(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "reject"}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	bid := resp["bid"].(map[string]interface{})
	if bid["status"].(string) != "rejected" {
		t.Errorf("Expected status 'rejected', got '%s'", bid["status"])
	}
}

func TestRespondToBid_NotSeller(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	// Buyer tries to respond
	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "accept"}`, buyerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestRespondToBid_InvalidAction(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "invalid"}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestRespondToBid_AlreadyResponded(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	// Insert a bid that is already accepted
	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'accepted', 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "reject"}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestRespondToBid_CounterWithoutAmount(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/respond", `{"action": "counter"}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestRespondToBid_BidNotFound(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	req := bidRequest(http.MethodPut, "/bids/999/respond", `{"action": "accept"}`, sellerID)
	rr := httptest.NewRecorder()

	RespondToBid(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

// --- MarkFinalPrice tests ---

func TestMarkFinalPrice_Owner(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	req := bidRequest(http.MethodPut, "/listings/1/final-price", "", sellerID)
	rr := httptest.NewRecorder()

	MarkFinalPrice(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify in DB
	var isFinal int
	database.DB.QueryRow("SELECT is_final_price FROM listings WHERE id = 1").Scan(&isFinal)
	if isFinal != 1 {
		t.Error("Listing should be marked as final price")
	}
}

func TestMarkFinalPrice_NotOwner(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	req := bidRequest(http.MethodPut, "/listings/1/final-price", "", buyerID)
	rr := httptest.NewRecorder()

	MarkFinalPrice(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestMarkFinalPrice_ListingNotFound(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	req := bidRequest(http.MethodPut, "/listings/999/final-price", "", sellerID)
	rr := httptest.NewRecorder()

	MarkFinalPrice(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestMarkFinalPrice_BlocksNewBids(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	// Mark as final
	markReq := bidRequest(http.MethodPut, "/listings/1/final-price", "", sellerID)
	markRR := httptest.NewRecorder()
	MarkFinalPrice(markRR, markReq)

	if markRR.Code != http.StatusOK {
		t.Fatalf("Mark final: Expected 200, got %d", markRR.Code)
	}

	// Try to place a bid
	bidReq := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80}`, buyerID)
	bidRR := httptest.NewRecorder()
	PlaceBid(bidRR, bidReq)

	if bidRR.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400 after final price, got %d: %s", bidRR.Code, bidRR.Body.String())
	}
}

// --- UnmarkFinalPrice tests ---

func TestUnmarkFinalPrice_Owner(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	// First mark as final
	database.DB.Exec("UPDATE listings SET is_final_price = 1 WHERE id = 1")

	req := bidRequest(http.MethodPut, "/listings/1/unmark-final-price", "", sellerID)
	rr := httptest.NewRecorder()

	UnmarkFinalPrice(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify in DB
	var isFinal int
	database.DB.QueryRow("SELECT is_final_price FROM listings WHERE id = 1").Scan(&isFinal)
	if isFinal != 0 {
		t.Error("Listing should no longer be marked as final price")
	}

	// Verify response body
	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)
	if resp["is_final_price"].(bool) != false {
		t.Error("Response should have is_final_price: false")
	}
}

func TestUnmarkFinalPrice_NotOwner(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	database.DB.Exec("UPDATE listings SET is_final_price = 1 WHERE id = 1")

	req := bidRequest(http.MethodPut, "/listings/1/unmark-final-price", "", buyerID)
	rr := httptest.NewRecorder()

	UnmarkFinalPrice(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUnmarkFinalPrice_ListingNotFound(t *testing.T) {
	setupBidTest()
	sellerID, _, _ := createBidTestData(t)

	req := bidRequest(http.MethodPut, "/listings/999/unmark-final-price", "", sellerID)
	rr := httptest.NewRecorder()

	UnmarkFinalPrice(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestMarkThenUnmark_AllowsBids(t *testing.T) {
	setupBidTest()
	sellerID, buyerID, _ := createBidTestData(t)

	// Mark as final
	markReq := bidRequest(http.MethodPut, "/listings/1/final-price", "", sellerID)
	markRR := httptest.NewRecorder()
	MarkFinalPrice(markRR, markReq)
	if markRR.Code != http.StatusOK {
		t.Fatalf("Mark: Expected 200, got %d", markRR.Code)
	}

	// Bid should fail
	bidReq1 := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80}`, buyerID)
	bidRR1 := httptest.NewRecorder()
	PlaceBid(bidRR1, bidReq1)
	if bidRR1.Code != http.StatusBadRequest {
		t.Fatalf("Bid while final: Expected 400, got %d", bidRR1.Code)
	}

	// Unmark
	unmarkReq := bidRequest(http.MethodPut, "/listings/1/unmark-final-price", "", sellerID)
	unmarkRR := httptest.NewRecorder()
	UnmarkFinalPrice(unmarkRR, unmarkReq)
	if unmarkRR.Code != http.StatusOK {
		t.Fatalf("Unmark: Expected 200, got %d", unmarkRR.Code)
	}

	// Bid should now succeed
	bidReq2 := bidRequest(http.MethodPost, "/listings/1/bids", `{"amount": 80}`, buyerID)
	bidRR2 := httptest.NewRecorder()
	PlaceBid(bidRR2, bidReq2)
	if bidRR2.Code != http.StatusCreated {
		t.Fatalf("Bid after unmark: Expected 201, got %d: %s", bidRR2.Code, bidRR2.Body.String())
	}
}

// Verify unused import
var _ = models.Bid{}

func TestGetMyBids(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, ?, 80, 'pending', 1)", buyerID)

	req := bidRequest(http.MethodGet, "/my/bids", "", buyerID)
	rr := httptest.NewRecorder()

	GetMyBids(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr.Code)
	}

	var bids []map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &bids)

	if len(bids) != 1 {
		t.Fatalf("Expected 1 bid, got %d", len(bids))
	}

	if bids[0]["listing_title"] == nil {
		t.Error("Expected listing_title in bid")
	}
}

func TestAcceptCounter(t *testing.T) {
	setupBidTest()
	_, buyerID, _ := createBidTestData(t)

	// Create a countered bid
	database.DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, counter_amount, bid_number) VALUES (1, ?, 80, 'countered', 90, 1)", buyerID)

	req := bidRequest(http.MethodPut, "/bids/1/accept-counter", "", buyerID)
	rr := httptest.NewRecorder()

	AcceptCounter(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var bidStatus string
	database.DB.QueryRow("SELECT status FROM bids WHERE id = 1").Scan(&bidStatus)
	if bidStatus != "accepted" {
		t.Errorf("Expected bid status 'accepted', got '%s'", bidStatus)
	}

	// Verify order created
	var count int
	database.DB.QueryRow("SELECT COUNT(*) FROM orders WHERE bid_id = 1").Scan(&count)
	if count != 1 {
		t.Error("Expected an order to be created")
	}
}
