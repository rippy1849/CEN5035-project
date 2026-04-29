package handlers

import (
	"encoding/json"
	"net/http"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"strconv"
	"strings"
)

// getImagesForListing fetches all image URLs for a given listing ID.
func getImagesForListing(listingID int) []string {
	rows, err := database.DB.Query("SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY display_order ASC, id ASC", listingID)
	if err != nil {
		return []string{}
	}
	defer rows.Close()

	images := []string{}
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err == nil {
			images = append(images, url)
		}
	}
	return images
}

// getImagesForListings fetches images for multiple listing IDs and returns a map.
func getImagesForListings(listingIDs []int) map[int][]string {
	result := make(map[int][]string)
	if len(listingIDs) == 0 {
		return result
	}

	// Initialize all IDs with empty slices
	for _, id := range listingIDs {
		result[id] = []string{}
	}

	// Build query with placeholders
	placeholders := make([]string, len(listingIDs))
	args := make([]interface{}, len(listingIDs))
	for i, id := range listingIDs {
		placeholders[i] = "?"
		args[i] = id
	}

	query := "SELECT listing_id, image_url FROM listing_images WHERE listing_id IN (" + strings.Join(placeholders, ",") + ") ORDER BY display_order ASC, id ASC"
	rows, err := database.DB.Query(query, args...)
	if err != nil {
		return result
	}
	defer rows.Close()

	for rows.Next() {
		var listingID int
		var url string
		if err := rows.Scan(&listingID, &url); err == nil {
			result[listingID] = append(result[listingID], url)
		}
	}
	return result
}

func CreateListing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var listing models.Listing
	if err := json.NewDecoder(r.Body).Decode(&listing); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user_id from auth context (set by AuthMiddleware)
	if uid := r.Context().Value(UserIDKey); uid != nil {
		listing.UserID = uid.(int)
	}

	stmt, err := database.DB.Prepare("INSERT INTO listings(user_id, title, description, price, category, status) VALUES(?, ?, ?, ?, ?, 'active')")

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(listing.UserID, listing.Title, listing.Description, listing.Price, listing.Category)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := res.LastInsertId()
	listing.ID = int(id)

	err = database.DB.QueryRow("SELECT created_at, updated_at FROM listings WHERE id = ?", id).Scan(&listing.CreatedAt, &listing.UpdatedAt)
	if err != nil {
		// handle error
	}

	listing.Images = []string{}
	listing.IsFinalPrice = false
	listing.Status = "active"

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(listing)
}

func GetListings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := database.DB.Query("SELECT id, user_id, title, description, price, category, is_final_price, COALESCE(status, 'active'), created_at, updated_at FROM listings WHERE COALESCE(status, 'active') = 'active' ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var listings []models.Listing
	var listingIDs []int
	for rows.Next() {
		var l models.Listing
		var isFinalPrice int
		if err := rows.Scan(&l.ID, &l.UserID, &l.Title, &l.Description, &l.Price, &l.Category, &isFinalPrice, &l.Status, &l.CreatedAt, &l.UpdatedAt); err != nil {
			continue
		}
		l.IsFinalPrice = isFinalPrice == 1
		l.Images = []string{} // Initialize to empty
		listings = append(listings, l)
		listingIDs = append(listingIDs, l.ID)
	}

	// Fetch images for all listings in one query
	if len(listingIDs) > 0 {
		imagesMap := getImagesForListings(listingIDs)
		for i := range listings {
			if imgs, ok := imagesMap[listings[i].ID]; ok {
				listings[i].Images = imgs
			}
		}
	}

	// Ensure we return an empty array, not null
	if listings == nil {
		listings = []models.Listing{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listings)
}

func GetListing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/listings/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var listing models.Listing
	var isFinalPrice int
	err = database.DB.QueryRow("SELECT id, user_id, title, description, price, category, is_final_price, COALESCE(status, 'active'), created_at, updated_at FROM listings WHERE id = ?", id).
		Scan(&listing.ID, &listing.UserID, &listing.Title, &listing.Description, &listing.Price, &listing.Category, &isFinalPrice, &listing.Status, &listing.CreatedAt, &listing.UpdatedAt)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}

	listing.IsFinalPrice = isFinalPrice == 1
	listing.Images = getImagesForListing(id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listing)
}

func UpdateListing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/listings/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var listing models.Listing
	if err := json.NewDecoder(r.Body).Decode(&listing); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	stmt, err := database.DB.Prepare("UPDATE listings SET title=?, description=?, price=?, category=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	res, err := stmt.Exec(listing.Title, listing.Description, listing.Price, listing.Category, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}

	// Update the listing object with ID and latest data to return it
	listing.ID = id
	// Re-fetch to get updated_at
	var isFinalPrice int
	err = database.DB.QueryRow("SELECT user_id, is_final_price, COALESCE(status, 'active'), created_at, updated_at FROM listings WHERE id = ?", id).Scan(&listing.UserID, &isFinalPrice, &listing.Status, &listing.CreatedAt, &listing.UpdatedAt)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	listing.IsFinalPrice = isFinalPrice == 1
	listing.Images = getImagesForListing(id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listing)
}

func DeleteListing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/listings/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	// Check ownership
	userID := r.Context().Value(UserIDKey)
	if userID != nil {
		var ownerID int
		err := database.DB.QueryRow("SELECT user_id FROM listings WHERE id = ?", id).Scan(&ownerID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
			return
		}
		if ownerID != userID.(int) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "You can only delete your own listings"})
			return
		}
	}

	res, err := database.DB.Exec("DELETE FROM listings WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Listing not found"})
		return
	}

	// Also clean up images from listing_images table
	database.DB.Exec("DELETE FROM listing_images WHERE listing_id = ?", id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Listing deleted"})
}

// GetMyListings returns all listings for the authenticated user (including sold ones).
func GetMyListings(w http.ResponseWriter, r *http.Request) {
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
		"SELECT id, user_id, title, description, price, category, is_final_price, COALESCE(status, 'active'), created_at, updated_at FROM listings WHERE user_id = ? ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type ListingWithBidCount struct {
		models.Listing
		BidCount int `json:"bid_count"`
	}

	var listings []ListingWithBidCount
	var listingIDs []int
	for rows.Next() {
		var l ListingWithBidCount
		var isFinalPrice int
		if err := rows.Scan(&l.ID, &l.UserID, &l.Title, &l.Description, &l.Price, &l.Category, &isFinalPrice, &l.Status, &l.CreatedAt, &l.UpdatedAt); err != nil {
			continue
		}
		l.IsFinalPrice = isFinalPrice == 1
		l.Images = []string{}
		listings = append(listings, l)
		listingIDs = append(listingIDs, l.ID)
	}

	// Fetch images for all listings
	if len(listingIDs) > 0 {
		imagesMap := getImagesForListings(listingIDs)
		for i := range listings {
			if imgs, ok := imagesMap[listings[i].ID]; ok {
				listings[i].Images = imgs
			}
		}
	}

	// Fetch bid counts for all listings
	for i := range listings {
		var count int
		database.DB.QueryRow("SELECT COUNT(*) FROM bids WHERE listing_id = ?", listings[i].ID).Scan(&count)
		listings[i].BidCount = count
	}

	if listings == nil {
		listings = []ListingWithBidCount{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(listings)
}
