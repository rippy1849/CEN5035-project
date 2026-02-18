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

	createTableSQL := `CREATE TABLE IF NOT EXISTS listings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER,
		title TEXT NOT NULL,
		description TEXT,
		price REAL,
		category TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}
