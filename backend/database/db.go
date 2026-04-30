package database

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite", "./marketplace.db")
	if err != nil {
		log.Fatal(err)
	}

	createListingsSQL := `CREATE TABLE IF NOT EXISTS listings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		title TEXT NOT NULL,
		description TEXT,
		price REAL,
		category TEXT,
		is_final_price INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createListingsSQL)
	if err != nil {
		log.Fatal(err)
	}

	// Add is_final_price column if it doesn't exist (migration for existing DBs)
	DB.Exec("ALTER TABLE listings ADD COLUMN is_final_price INTEGER DEFAULT 0")

	createUsersSQL := `CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		name TEXT,
		picture TEXT,
		google_id TEXT NOT NULL UNIQUE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createUsersSQL)
	if err != nil {
		log.Fatal(err)
	}

	createSessionsSQL := `CREATE TABLE IF NOT EXISTS sessions (
		token TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);`

	_, err = DB.Exec(createSessionsSQL)
	if err != nil {
		log.Fatal(err)
	}

	createListingImagesSQL := `CREATE TABLE IF NOT EXISTS listing_images (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		listing_id INTEGER NOT NULL,
		image_url TEXT NOT NULL,
		display_order INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
	);`

	_, err = DB.Exec(createListingImagesSQL)
	if err != nil {
		log.Fatal(err)
	}

	createBidsSQL := `CREATE TABLE IF NOT EXISTS bids (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		listing_id INTEGER NOT NULL,
		buyer_id INTEGER NOT NULL,
		amount REAL NOT NULL,
		status TEXT DEFAULT 'pending',
		counter_amount REAL,
		bid_number INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (listing_id) REFERENCES listings(id),
		FOREIGN KEY (buyer_id) REFERENCES users(id)
	);`

	_, err = DB.Exec(createBidsSQL)
	if err != nil {
		log.Fatal(err)
	}

	createOrdersSQL := `CREATE TABLE IF NOT EXISTS orders (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		listing_id INTEGER NOT NULL,
		bid_id INTEGER NOT NULL,
		buyer_id INTEGER NOT NULL,
		seller_id INTEGER NOT NULL,
		agreed_price REAL NOT NULL,
		platform_fee REAL NOT NULL,
		seller_payout REAL NOT NULL,
		status TEXT DEFAULT 'payment_pending',
		stripe_session_id TEXT,
		buyer_confirmed_at DATETIME,
		seller_confirmed_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (listing_id) REFERENCES listings(id),
		FOREIGN KEY (bid_id) REFERENCES bids(id),
		FOREIGN KEY (buyer_id) REFERENCES users(id),
		FOREIGN KEY (seller_id) REFERENCES users(id)
	);`

	_, err = DB.Exec(createOrdersSQL)
	if err != nil {
		log.Fatal(err)
	}

	// Migrations for existing DBs
	DB.Exec("ALTER TABLE listings ADD COLUMN status TEXT DEFAULT 'active'")
	DB.Exec("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
	DB.Exec("ALTER TABLE users ADD COLUMN contact_info TEXT DEFAULT ''")
}

// InitTestDB initializes an in-memory SQLite database for unit tests.
func InitTestDB() {
	var err error
	DB, err = sql.Open("sqlite", ":memory:")
	if err != nil {
		log.Fatal(err)
	}

	createListingsSQL := `CREATE TABLE IF NOT EXISTS listings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		title TEXT NOT NULL,
		description TEXT,
		price REAL,
		category TEXT,
		is_final_price INTEGER DEFAULT 0,
		status TEXT DEFAULT 'active',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := DB.Exec(createListingsSQL); err != nil {
		log.Fatal("Failed to create listings table:", err)
	}

	createUsersSQL := `CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		name TEXT,
		picture TEXT,
		google_id TEXT NOT NULL UNIQUE,
		phone TEXT DEFAULT '',
		contact_info TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := DB.Exec(createUsersSQL); err != nil {
		log.Fatal("Failed to create users table:", err)
	}

	createSessionsSQL := `CREATE TABLE IF NOT EXISTS sessions (
		token TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);`
	if _, err := DB.Exec(createSessionsSQL); err != nil {
		log.Fatal("Failed to create sessions table:", err)
	}

	createListingImagesSQL := `CREATE TABLE IF NOT EXISTS listing_images (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		listing_id INTEGER NOT NULL,
		image_url TEXT NOT NULL,
		display_order INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
	);`
	if _, err := DB.Exec(createListingImagesSQL); err != nil {
		log.Fatal("Failed to create listing_images table:", err)
	}

	createBidsSQL := `CREATE TABLE IF NOT EXISTS bids (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		listing_id INTEGER NOT NULL,
		buyer_id INTEGER NOT NULL,
		amount REAL NOT NULL,
		status TEXT DEFAULT 'pending',
		counter_amount REAL,
		bid_number INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (listing_id) REFERENCES listings(id),
		FOREIGN KEY (buyer_id) REFERENCES users(id)
	);`
	if _, err := DB.Exec(createBidsSQL); err != nil {
		log.Fatal("Failed to create bids table:", err)
	}

	createOrdersSQL := `CREATE TABLE IF NOT EXISTS orders (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		listing_id INTEGER NOT NULL,
		bid_id INTEGER NOT NULL,
		buyer_id INTEGER NOT NULL,
		seller_id INTEGER NOT NULL,
		agreed_price REAL NOT NULL,
		platform_fee REAL NOT NULL,
		seller_payout REAL NOT NULL,
		status TEXT DEFAULT 'payment_pending',
		stripe_session_id TEXT,
		buyer_confirmed_at DATETIME,
		seller_confirmed_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (listing_id) REFERENCES listings(id),
		FOREIGN KEY (bid_id) REFERENCES bids(id),
		FOREIGN KEY (buyer_id) REFERENCES users(id),
		FOREIGN KEY (seller_id) REFERENCES users(id)
	);`
	if _, err := DB.Exec(createOrdersSQL); err != nil {
		log.Fatal("Failed to create orders table:", err)
	}
}

