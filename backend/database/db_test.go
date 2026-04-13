package database

import (
	"testing"
)

func TestInitTestDB_AllTablesCreated(t *testing.T) {
	InitTestDB()

	if DB == nil {
		t.Fatal("DB should not be nil after InitTestDB")
	}

	// Verify listings table exists and has correct columns
	_, err := DB.Exec("INSERT INTO listings (title, description, price, category, user_id) VALUES ('test', 'desc', 10.0, 'Books', 1)")
	if err != nil {
		t.Fatalf("listings table should exist and accept inserts: %v", err)
	}

	// Verify users table exists and has correct columns
	_, err = DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('test@ufl.edu', 'Test', '', 'google123')")
	if err != nil {
		t.Fatalf("users table should exist and accept inserts: %v", err)
	}

	// Verify sessions table exists and has correct columns
	_, err = DB.Exec("INSERT INTO sessions (token, user_id) VALUES ('tok123', 1)")
	if err != nil {
		t.Fatalf("sessions table should exist and accept inserts: %v", err)
	}

	// Verify listing_images table exists and has correct columns
	_, err = DB.Exec("INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (1, '/uploads/test.jpg', 0)")
	if err != nil {
		t.Fatalf("listing_images table should exist and accept inserts: %v", err)
	}

	// Verify bids table exists and has correct columns
	_, err = DB.Exec("INSERT INTO bids (listing_id, buyer_id, amount, status, bid_number) VALUES (1, 1, 50.0, 'pending', 1)")
	if err != nil {
		t.Fatalf("bids table should exist and accept inserts: %v", err)
	}

	// Verify listing data persists
	var count int
	err = DB.QueryRow("SELECT COUNT(*) FROM listings").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to query listings: %v", err)
	}
	if count != 1 {
		t.Fatalf("Expected 1 listing, got %d", count)
	}

	// Verify user data persists
	err = DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to query users: %v", err)
	}
	if count != 1 {
		t.Fatalf("Expected 1 user, got %d", count)
	}

	// Verify listing_images data persists
	err = DB.QueryRow("SELECT COUNT(*) FROM listing_images").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to query listing_images: %v", err)
	}
	if count != 1 {
		t.Fatalf("Expected 1 listing image, got %d", count)
	}

	// Verify bids data persists
	err = DB.QueryRow("SELECT COUNT(*) FROM bids").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to query bids: %v", err)
	}
	if count != 1 {
		t.Fatalf("Expected 1 bid, got %d", count)
	}

	// Verify is_final_price column exists on listings
	var isFinal int
	err = DB.QueryRow("SELECT is_final_price FROM listings WHERE id = 1").Scan(&isFinal)
	if err != nil {
		t.Fatalf("is_final_price column should exist: %v", err)
	}
	if isFinal != 0 {
		t.Fatalf("Default is_final_price should be 0, got %d", isFinal)
	}
}
