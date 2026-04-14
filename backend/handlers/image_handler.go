package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"marketplace-backend/database"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const maxFileSize = 5 * 1024 * 1024 // 5MB

var allowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/gif":  true,
	"image/webp": true,
}

func DeleteListingImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse path: /listings/{listingId}/images/{imageId}
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	listingID, err := strconv.Atoi(pathParts[1])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	imageID, err := strconv.Atoi(pathParts[3])
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

	// Check listing ownership
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
		json.NewEncoder(w).Encode(map[string]string{"error": "You can only delete images from your own listings"})
		return
	}

	// Get image URL before deleting (to delete file from disk)
	var imageURL string
	err = database.DB.QueryRow("SELECT image_url FROM listing_images WHERE id = ? AND listing_id = ?", imageID, listingID).Scan(&imageURL)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Image not found"})
		return
	}

	// Delete from database
	database.DB.Exec("DELETE FROM listing_images WHERE id = ? AND listing_id = ?", imageID, listingID)

	// Delete file from disk (best effort)
	filePath := "." + imageURL
	os.Remove(filePath)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Image deleted"})
}

func UploadListingImages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse listing ID from path: /listings/{id}/images
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

	// Check listing exists and verify ownership
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
		json.NewEncoder(w).Encode(map[string]string{"error": "You can only upload images to your own listings"})
		return
	}

	// Check current image count
	var currentCount int
	database.DB.QueryRow("SELECT COUNT(*) FROM listing_images WHERE listing_id = ?", listingID).Scan(&currentCount)

	// Parse multipart form (32MB max memory)
	err = r.ParseMultipartForm(32 << 20)
	if err != nil {
		http.Error(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		http.Error(w, "No images provided", http.StatusBadRequest)
		return
	}

	if currentCount+len(files) > 5 {
		http.Error(w, "Maximum 5 images per listing", http.StatusBadRequest)
		return
	}

	// Ensure uploads directory exists
	os.MkdirAll("./uploads", os.ModePerm)

	var savedURLs []string

	for i, fileHeader := range files {
		// Check file size
		if fileHeader.Size > maxFileSize {
			http.Error(w, "File too large: maximum 5MB", http.StatusBadRequest)
			return
		}

		file, err := fileHeader.Open()
		if err != nil {
			http.Error(w, "Failed to read file", http.StatusInternalServerError)
			return
		}
		defer file.Close()

		// Read first 512 bytes to detect content type
		buffer := make([]byte, 512)
		n, err := file.Read(buffer)
		if err != nil && err != io.EOF {
			http.Error(w, "Failed to read file", http.StatusInternalServerError)
			return
		}
		contentType := http.DetectContentType(buffer[:n])

		if !allowedImageTypes[contentType] {
			http.Error(w, "Invalid file type: only JPEG, PNG, GIF, WebP allowed", http.StatusBadRequest)
			return
		}

		// Reset file reader to beginning
		file.Seek(0, 0)

		// Generate unique filename
		ext := filepath.Ext(fileHeader.Filename)
		if ext == "" {
			// Determine extension from content type
			switch contentType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			case "image/webp":
				ext = ".webp"
			}
		}
		filename := fmt.Sprintf("%d_%d_%d%s", listingID, time.Now().UnixNano(), i, ext)
		filepath := filepath.Join("./uploads", filename)

		// Save file to disk
		dst, err := os.Create(filepath)
		if err != nil {
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "Failed to save file", http.StatusInternalServerError)
			return
		}

		imageURL := "/uploads/" + filename
		displayOrder := currentCount + i

		// Insert into database
		_, err = database.DB.Exec(
			"INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (?, ?, ?)",
			listingID, imageURL, displayOrder,
		)
		if err != nil {
			http.Error(w, "Failed to save image record", http.StatusInternalServerError)
			return
		}

		savedURLs = append(savedURLs, imageURL)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"images": savedURLs,
	})
}
