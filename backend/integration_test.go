package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"filevault/internal/database"
	"filevault/internal/models"
	"filevault/internal/repositories"
	"filevault/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestDatabase is a test database setup
type TestDatabase struct {
	db *database.Database
}

func setupTestDatabase(t *testing.T) *TestDatabase {
	// Use test database
	testDBURL := "postgres://filevault:password123@localhost:5432/filevault_test?sslmode=disable"

	db, err := database.New(testDBURL)
	require.NoError(t, err)

	// Run migrations
	err = db.RunMigrations()
	require.NoError(t, err)

	return &TestDatabase{db: db}
}

func (td *TestDatabase) cleanup(t *testing.T) {
	// Clean up test data
	_, err := td.db.GetDB().Exec("DELETE FROM user_file_shares")
	require.NoError(t, err)

	_, err = td.db.GetDB().Exec("DELETE FROM files")
	require.NoError(t, err)

	_, err = td.db.GetDB().Exec("DELETE FROM users WHERE email != 'admin@filevault.com'")
	require.NoError(t, err)
}

func createTestUser(t *testing.T, db *database.Database, username, email string) *models.User {
	userRepo := repositories.NewUserRepository(db.GetDB())

	user := &models.User{
		ID:        uuid.New(),
		Username:  username,
		Email:     email,
		Password:  "hashedpassword",
		Role:      "user",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := userRepo.Create(user)
	require.NoError(t, err)

	return user
}

func createTestFile(t *testing.T, db *database.Database, userID uuid.UUID, filename string) *models.File {
	fileRepo := repositories.NewFileRepository(db.GetDB())

	file := &models.File{
		ID:           uuid.New(),
		Filename:     filename,
		OriginalName: filename,
		MimeType:     "application/pdf",
		Size:         1024,
		Hash:         "test-hash-" + filename,
		S3Key:        "test/" + filename,
		UploaderID:   userID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err := fileRepo.Create(file)
	require.NoError(t, err)

	return file
}

func TestFileSharingIntegration(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping integration test in non-CI environment")
	}

	// Setup test database
	testDB := setupTestDatabase(t)
	defer testDB.cleanup(t)

	// Create test users
	user1 := createTestUser(t, testDB.db, "user1", "user1@test.com")
	user2 := createTestUser(t, testDB.db, "user2", "user2@test.com")

	// Create test file
	file := createTestFile(t, testDB.db, user1.ID, "test-document.pdf")

	// Setup services
	userRepo := repositories.NewUserRepository(testDB.db.GetDB())
	userFileShareRepo := repositories.NewUserFileShareRepository(testDB.db.GetDB())
	fileRepo := repositories.NewFileRepository(testDB.db.GetDB())

	// Mock S3 service for testing
	mockS3Service := &MockS3Service{}

	fileShareService := services.NewFileShareService(
		userFileShareRepo,
		userRepo,
		mockS3Service,
		"test-bucket",
		"http://localhost:8080",
	)

	// Test 1: Share file with user
	t.Run("ShareFileWithUser", func(t *testing.T) {
		message := "Please review this document"

		err := fileShareService.ShareFileWithUser(user1.ID, file.ID, user2.ID, &message)
		assert.NoError(t, err)
	})

	// Test 2: Get incoming shares
	t.Run("GetIncomingShares", func(t *testing.T) {
		shares, err := fileShareService.GetIncomingShares(user2.ID, 10, 0)
		assert.NoError(t, err)
		assert.Len(t, shares, 1)
		assert.Equal(t, file.ID, shares[0].FileID)
		assert.Equal(t, user1.ID, shares[0].FromUserID)
		assert.Equal(t, "Please review this document", *shares[0].Message)
		assert.False(t, shares[0].IsRead)
	})

	// Test 3: Get outgoing shares
	t.Run("GetOutgoingShares", func(t *testing.T) {
		shares, err := fileShareService.GetOutgoingShares(user1.ID, 10, 0)
		assert.NoError(t, err)
		assert.Len(t, shares, 1)
		assert.Equal(t, file.ID, shares[0].FileID)
		assert.Equal(t, user2.ID, shares[0].ToUserID)
		assert.Equal(t, "Please review this document", *shares[0].Message)
	})

	// Test 4: Mark share as read
	t.Run("MarkShareAsRead", func(t *testing.T) {
		// Get the share first
		shares, err := fileShareService.GetIncomingShares(user2.ID, 10, 0)
		assert.NoError(t, err)
		assert.Len(t, shares, 1)

		shareID := shares[0].ID

		// Mark as read
		err = fileShareService.MarkShareAsRead(shareID)
		assert.NoError(t, err)

		// Verify it's marked as read
		shares, err = fileShareService.GetIncomingShares(user2.ID, 10, 0)
		assert.NoError(t, err)
		assert.Len(t, shares, 1)
		assert.True(t, shares[0].IsRead)
	})

	// Test 5: Get unread count
	t.Run("GetUnreadShareCount", func(t *testing.T) {
		// Create another share
		user3 := createTestUser(t, testDB.db, "user3", "user3@test.com")
		file2 := createTestFile(t, testDB.db, user1.ID, "test-document-2.pdf")

		err := fileShareService.ShareFileWithUser(user1.ID, file2.ID, user3.ID, nil)
		assert.NoError(t, err)

		// Check unread count for user3
		count, err := fileShareService.GetUnreadShareCount(user3.ID)
		assert.NoError(t, err)
		assert.Equal(t, 1, count)

		// Check unread count for user2 (should be 0 since we marked it as read)
		count, err = fileShareService.GetUnreadShareCount(user2.ID)
		assert.NoError(t, err)
		assert.Equal(t, 0, count)
	})

	// Test 6: Delete share
	t.Run("DeleteUserFileShare", func(t *testing.T) {
		// Get the share
		shares, err := fileShareService.GetOutgoingShares(user1.ID, 10, 0)
		assert.NoError(t, err)
		assert.Len(t, shares, 2) // We have 2 shares now

		shareID := shares[0].ID

		// Delete the share
		err = fileShareService.DeleteUserFileShare(shareID)
		assert.NoError(t, err)

		// Verify it's deleted
		shares, err = fileShareService.GetOutgoingShares(user1.ID, 10, 0)
		assert.NoError(t, err)
		assert.Len(t, shares, 1) // Should be 1 now
	})
}

func TestFileSharingAPIEndpoints(t *testing.T) {
	// Skip if not in CI environment
	if os.Getenv("CI") == "" {
		t.Skip("Skipping API integration test in non-CI environment")
	}

	// Setup test database
	testDB := setupTestDatabase(t)
	defer testDB.cleanup(t)

	// Create test users
	user1 := createTestUser(t, testDB.db, "apiuser1", "apiuser1@test.com")
	user2 := createTestUser(t, testDB.db, "apiuser2", "apiuser2@test.com")

	// Create test file
	file := createTestFile(t, testDB.db, user1.ID, "api-test-document.pdf")

	// Setup services
	userRepo := repositories.NewUserRepository(testDB.db.GetDB())
	userFileShareRepo := repositories.NewUserFileShareRepository(testDB.db.GetDB())

	mockS3Service := &MockS3Service{}

	fileShareService := services.NewFileShareService(
		userFileShareRepo,
		userRepo,
		mockS3Service,
		"test-bucket",
		"http://localhost:8080",
	)

	// Setup router
	gin.SetMode(gin.TestMode)
	router := gin.New()

	// Add authentication middleware (simplified for testing)
	router.Use(func(c *gin.Context) {
		c.Set("user", user1) // Set user1 as authenticated user
		c.Next()
	})

	// Register routes
	RegisterFileShareRoutes(router, fileShareService)

	// Test 1: Share file with user via API
	t.Run("ShareFileWithUserAPI", func(t *testing.T) {
		reqBody := map[string]interface{}{
			"toUserId": user2.ID.String(),
			"message":  "API test message",
		}

		reqJSON, _ := json.Marshal(reqBody)

		req, _ := http.NewRequest("POST", fmt.Sprintf("/api/files/%s/share/user", file.ID.String()), bytes.NewBuffer(reqJSON))
		req.Header.Set("Content-Type", "application/json")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "File shared successfully", response["message"])
	})

	// Test 2: Get incoming shares via API
	t.Run("GetIncomingSharesAPI", func(t *testing.T) {
		// Switch to user2 context
		router.Use(func(c *gin.Context) {
			c.Set("user", user2)
			c.Next()
		})

		req, _ := http.NewRequest("GET", "/api/user-shares/incoming", nil)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		shares := response["shares"].([]interface{})
		assert.Len(t, shares, 1)
	})

	// Test 3: Get outgoing shares via API
	t.Run("GetOutgoingSharesAPI", func(t *testing.T) {
		// Switch back to user1 context
		router.Use(func(c *gin.Context) {
			c.Set("user", user1)
			c.Next()
		})

		req, _ := http.NewRequest("GET", "/api/user-shares/outgoing", nil)

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		shares := response["shares"].([]interface{})
		assert.Len(t, shares, 1)
	})
}

// MockS3Service for testing
type MockS3Service struct{}

func (m *MockS3Service) UploadFile(ctx context.Context, key string, data []byte) error {
	return nil
}

func (m *MockS3Service) DownloadFile(ctx context.Context, key string) ([]byte, error) {
	return []byte("test file content"), nil
}

func (m *MockS3Service) DeleteFile(ctx context.Context, key string) error {
	return nil
}

func (m *MockS3Service) GetSignedURL(ctx context.Context, key string, expiration time.Duration) (string, error) {
	return "https://test-bucket.s3.amazonaws.com/" + key, nil
}

func (m *MockS3Service) GetClient() interface{} {
	return nil
}
