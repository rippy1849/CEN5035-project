package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"marketplace-backend/database"
	"marketplace-backend/models"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func setupImageTest() {
	database.InitTestDB()
	os.MkdirAll("./uploads", os.ModePerm)
}

func createImageTestData(t *testing.T) (int, int, string) {
	t.Helper()
	userID, token := createTestUser(t)

	// Create a listing owned by this user
	database.DB.Exec("INSERT INTO listings (user_id, title, description, price, category) VALUES (?, 'Test Item', 'desc', 100, 'Electronics')", userID)
	return userID, 1, token // listing ID is 1 (first insert)
}

// Helper to create a multipart request with fake image files
func createMultipartRequest(t *testing.T, url string, fileCount int, userID int) *http.Request {
	t.Helper()
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	for i := 0; i < fileCount; i++ {
		part, err := writer.CreateFormFile("images", "test.jpg")
		if err != nil {
			t.Fatalf("Failed to create form file: %v", err)
		}
		// Write minimal JPEG header (magic bytes) + some data
		part.Write([]byte{0xFF, 0xD8, 0xFF, 0xE0}) // JPEG magic bytes
		part.Write(make([]byte, 100))                // Padding
	}
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, url, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	ctx := context.WithValue(req.Context(), UserIDKey, userID)
	return req.WithContext(ctx)
}

// --- UploadListingImages tests ---

func TestUploadImages_ValidFiles(t *testing.T) {
	setupImageTest()
	userID, listingID, _ := createImageTestData(t)

	req := createMultipartRequest(t, "/listings/1/images", 2, userID)
	rr := httptest.NewRecorder()

	UploadListingImages(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &resp)

	images, ok := resp["images"].([]interface{})
	if !ok || len(images) != 2 {
		t.Fatalf("Expected 2 images in response, got %v", resp["images"])
	}

	// Verify images in DB
	var count int
	database.DB.QueryRow("SELECT COUNT(*) FROM listing_images WHERE listing_id = ?", listingID).Scan(&count)
	if count != 2 {
		t.Fatalf("Expected 2 images in DB, got %d", count)
	}
}

func TestUploadImages_NoFiles(t *testing.T) {
	setupImageTest()
	userID, _, _ := createImageTestData(t)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/listings/1/images", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	ctx := context.WithValue(req.Context(), UserIDKey, userID)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()
	UploadListingImages(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUploadImages_NotOwner(t *testing.T) {
	setupImageTest()
	createImageTestData(t) // Creates user 1 with listing 1

	// Create a different user (ID 2)
	database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('other@ufl.edu', 'Other', '', 'gother')")

	req := createMultipartRequest(t, "/listings/1/images", 1, 2) // user 2 trying to upload to user 1's listing
	rr := httptest.NewRecorder()

	UploadListingImages(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUploadImages_ListingNotFound(t *testing.T) {
	setupImageTest()
	userID, _ := createTestUser(t)

	req := createMultipartRequest(t, "/listings/999/images", 1, userID)
	rr := httptest.NewRecorder()

	UploadListingImages(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUploadImages_TooManyImages(t *testing.T) {
	setupImageTest()
	userID, _, _ := createImageTestData(t)

	// Insert 4 existing images
	for i := 0; i < 4; i++ {
		database.DB.Exec("INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (1, '/uploads/existing.jpg', ?)", i)
	}

	// Try to add 2 more (would exceed 5)
	req := createMultipartRequest(t, "/listings/1/images", 2, userID)
	rr := httptest.NewRecorder()

	UploadListingImages(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("Expected 400, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUploadImages_NoAuth(t *testing.T) {
	setupImageTest()
	createImageTestData(t)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("images", "test.jpg")
	part.Write([]byte{0xFF, 0xD8, 0xFF, 0xE0})
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/listings/1/images", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	// No user_id in context
	rr := httptest.NewRecorder()

	UploadListingImages(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401, got %d: %s", rr.Code, rr.Body.String())
	}
}

// --- DeleteListingImage tests ---

func TestDeleteImage_OwnerCanDelete(t *testing.T) {
	setupImageTest()
	userID, _, _ := createImageTestData(t)

	// Insert an image
	database.DB.Exec("INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (1, '/uploads/test.jpg', 0)")

	req := httptest.NewRequest(http.MethodDelete, "/listings/1/images/1", nil)
	ctx := context.WithValue(req.Context(), UserIDKey, userID)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()

	DeleteListingImage(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify image is deleted from DB
	var count int
	database.DB.QueryRow("SELECT COUNT(*) FROM listing_images WHERE id = 1").Scan(&count)
	if count != 0 {
		t.Error("Image should be deleted from DB")
	}
}

func TestDeleteImage_NotOwner(t *testing.T) {
	setupImageTest()
	createImageTestData(t)

	// Insert an image
	database.DB.Exec("INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (1, '/uploads/test.jpg', 0)")

	// Create a different user
	database.DB.Exec("INSERT INTO users (email, name, picture, google_id) VALUES ('other@ufl.edu', 'Other', '', 'gother')")

	req := httptest.NewRequest(http.MethodDelete, "/listings/1/images/1", nil)
	ctx := context.WithValue(req.Context(), UserIDKey, 2) // Different user
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()

	DeleteListingImage(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("Expected 403, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteImage_NotFound(t *testing.T) {
	setupImageTest()
	userID, _, _ := createImageTestData(t)

	req := httptest.NewRequest(http.MethodDelete, "/listings/1/images/999", nil)
	ctx := context.WithValue(req.Context(), UserIDKey, userID)
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()

	DeleteListingImage(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("Expected 404, got %d: %s", rr.Code, rr.Body.String())
	}
}

// --- GetListings with images tests ---

func TestGetListings_IncludesImages(t *testing.T) {
	setupImageTest()
	database.DB.Exec("INSERT INTO listings (user_id, title, description, price, category) VALUES (1, 'Item', 'desc', 50, 'Books')")
	database.DB.Exec("INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (1, '/uploads/img1.jpg', 0)")
	database.DB.Exec("INSERT INTO listing_images (listing_id, image_url, display_order) VALUES (1, '/uploads/img2.jpg', 1)")

	req := httptest.NewRequest(http.MethodGet, "/listings", nil)
	rr := httptest.NewRecorder()

	GetListings(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr.Code)
	}

	var listings []models.Listing
	json.Unmarshal(rr.Body.Bytes(), &listings)

	if len(listings) != 1 {
		t.Fatalf("Expected 1 listing, got %d", len(listings))
	}
	if len(listings[0].Images) != 2 {
		t.Fatalf("Expected 2 images, got %d", len(listings[0].Images))
	}
	if listings[0].Images[0] != "/uploads/img1.jpg" {
		t.Errorf("Expected first image '/uploads/img1.jpg', got '%s'", listings[0].Images[0])
	}
}

func TestGetListings_NoImages_EmptyArray(t *testing.T) {
	setupImageTest()
	database.DB.Exec("INSERT INTO listings (user_id, title, description, price, category) VALUES (1, 'Item', 'desc', 50, 'Books')")

	req := httptest.NewRequest(http.MethodGet, "/listings", nil)
	rr := httptest.NewRecorder()

	GetListings(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d", rr.Code)
	}

	// Parse raw JSON to check images is [] not null
	var raw []map[string]interface{}
	json.Unmarshal(rr.Body.Bytes(), &raw)

	if len(raw) != 1 {
		t.Fatalf("Expected 1 listing, got %d", len(raw))
	}

	images, ok := raw[0]["images"].([]interface{})
	if !ok {
		t.Fatal("images field should be an array, not null")
	}
	if len(images) != 0 {
		t.Fatalf("Expected empty images array, got %d items", len(images))
	}
}
