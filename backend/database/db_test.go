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
}
