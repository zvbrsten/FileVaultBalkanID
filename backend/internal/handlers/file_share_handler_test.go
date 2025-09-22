package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"filevault/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockFileShareService is a mock implementation of FileShareService
type MockFileShareService struct {
	mock.Mock
}

func (m *MockFileShareService) CreateFileShare(ctx context.Context, req *models.CreateFileShareRequest) (*models.FileShareResponse, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*models.FileShareResponse), args.Error(1)
}

func (m *MockFileShareService) UpdateFileShare(ctx context.Context, id uuid.UUID, req *models.CreateFileShareRequest) (*models.FileShareResponse, error) {
	args := m.Called(ctx, id, req)
	return args.Get(0).(*models.FileShareResponse), args.Error(1)
}

func (m *MockFileShareService) DeleteFileShare(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockFileShareService) GetFileShareStats(ctx context.Context, id uuid.UUID) (*models.FileShareResponse, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.FileShareResponse), args.Error(1)
}

func (m *MockFileShareService) ShareFileWithUser(fromUserID, fileID, toUserID uuid.UUID, message *string) error {
	args := m.Called(fromUserID, fileID, toUserID, message)
	return args.Error(0)
}

func (m *MockFileShareService) GetIncomingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*models.UserFileShareResponse), args.Error(1)
}

func (m *MockFileShareService) GetOutgoingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*models.UserFileShareResponse), args.Error(1)
}

func (m *MockFileShareService) MarkShareAsRead(shareID uuid.UUID) error {
	args := m.Called(shareID)
	return args.Error(0)
}

func (m *MockFileShareService) GetUnreadShareCount(userID uuid.UUID) (int, error) {
	args := m.Called(userID)
	return args.Int(0), args.Error(1)
}

func (m *MockFileShareService) DeleteUserFileShare(shareID uuid.UUID) error {
	args := m.Called(shareID)
	return args.Error(0)
}

func TestFileShareHandler_CreateFileShare(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockService := new(MockFileShareService)
	handler := &FileShareHandler{
		fileShareService: mockService,
	}

	router := gin.New()
	router.POST("/api/shares/", handler.CreateFileShare)

	// Test data
	fileID := uuid.New()
	expiresAt := time.Now().Add(24 * time.Hour)
	maxDownloads := 10

	reqBody := models.CreateFileShareRequest{
		FileID:       fileID,
		ExpiresAt:    &expiresAt,
		MaxDownloads: &maxDownloads,
	}

	reqJSON, _ := json.Marshal(reqBody)

	// Mock response
	mockResponse := &models.FileShareResponse{
		ID:            uuid.New(),
		FileID:        fileID,
		ShareToken:    "test-token-123",
		ShareURL:      "http://localhost:8080/api/files/share/test-token-123",
		IsActive:      true,
		ExpiresAt:     &expiresAt,
		DownloadCount: 0,
		MaxDownloads:  &maxDownloads,
		CreatedAt:     time.Now(),
		File: &models.File{
			ID:           fileID,
			OriginalName: "test.pdf",
			Size:         1024,
			MimeType:     "application/pdf",
		},
	}

	// Mock expectations
	mockService.On("CreateFileShare", mock.AnythingOfType("*context.emptyCtx"), &reqBody).Return(mockResponse, nil)

	// Execute
	req, _ := http.NewRequest("POST", "/api/shares/", bytes.NewBuffer(reqJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.FileShareResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, mockResponse.ID, response.ID)
	assert.Equal(t, mockResponse.ShareToken, response.ShareToken)

	mockService.AssertExpectations(t)
}

func TestFileShareHandler_UpdateFileShare(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockService := new(MockFileShareService)
	handler := &FileShareHandler{
		fileShareService: mockService,
	}

	router := gin.New()
	router.PUT("/api/shares/:id", handler.UpdateFileShare)

	// Test data
	shareID := uuid.New()
	fileID := uuid.New()
	expiresAt := time.Now().Add(48 * time.Hour)
	maxDownloads := 20

	reqBody := models.CreateFileShareRequest{
		FileID:       fileID,
		ExpiresAt:    &expiresAt,
		MaxDownloads: &maxDownloads,
	}

	reqJSON, _ := json.Marshal(reqBody)

	// Mock response
	mockResponse := &models.FileShareResponse{
		ID:            shareID,
		FileID:        fileID,
		ShareToken:    "updated-token-456",
		ShareURL:      "http://localhost:8080/api/files/share/updated-token-456",
		IsActive:      true,
		ExpiresAt:     &expiresAt,
		DownloadCount: 5,
		MaxDownloads:  &maxDownloads,
		CreatedAt:     time.Now(),
		File: &models.File{
			ID:           fileID,
			OriginalName: "updated.pdf",
			Size:         2048,
			MimeType:     "application/pdf",
		},
	}

	// Mock expectations
	mockService.On("UpdateFileShare", mock.AnythingOfType("*context.emptyCtx"), shareID, &reqBody).Return(mockResponse, nil)

	// Execute
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/shares/%s", shareID.String()), bytes.NewBuffer(reqJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.FileShareResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, mockResponse.ID, response.ID)
	assert.Equal(t, mockResponse.ShareToken, response.ShareToken)

	mockService.AssertExpectations(t)
}

func TestFileShareHandler_DeleteFileShare(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockService := new(MockFileShareService)
	handler := &FileShareHandler{
		fileShareService: mockService,
	}

	router := gin.New()
	router.DELETE("/api/shares/:id", handler.DeleteFileShare)

	// Test data
	shareID := uuid.New()

	// Mock expectations
	mockService.On("DeleteFileShare", mock.AnythingOfType("*context.emptyCtx"), shareID).Return(nil)

	// Execute
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/shares/%s", shareID.String()), nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "File share deleted successfully", response["message"])

	mockService.AssertExpectations(t)
}

func TestFileShareHandler_GetFileShareStats(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockService := new(MockFileShareService)
	handler := &FileShareHandler{
		fileShareService: mockService,
	}

	router := gin.New()
	router.GET("/api/shares/:id/stats", handler.GetFileShareStats)

	// Test data
	shareID := uuid.New()
	fileID := uuid.New()

	// Mock response
	mockResponse := &models.FileShareResponse{
		ID:            shareID,
		FileID:        fileID,
		ShareToken:    "stats-token-789",
		ShareURL:      "http://localhost:8080/api/files/share/stats-token-789",
		IsActive:      true,
		DownloadCount: 15,
		CreatedAt:     time.Now(),
		File: &models.File{
			ID:           fileID,
			OriginalName: "stats.pdf",
			Size:         4096,
			MimeType:     "application/pdf",
		},
	}

	// Mock expectations
	mockService.On("GetFileShareStats", mock.AnythingOfType("*context.emptyCtx"), shareID).Return(mockResponse, nil)

	// Execute
	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/shares/%s/stats", shareID.String()), nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response models.FileShareResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, mockResponse.ID, response.ID)
	assert.Equal(t, mockResponse.DownloadCount, response.DownloadCount)

	mockService.AssertExpectations(t)
}

func TestFileShareHandler_CreateFileShare_InvalidRequest(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockService := new(MockFileShareService)
	handler := &FileShareHandler{
		fileShareService: mockService,
	}

	router := gin.New()
	router.POST("/api/shares/", handler.CreateFileShare)

	// Test data - invalid JSON
	reqJSON := `{"invalid": "json"`

	// Execute
	req, _ := http.NewRequest("POST", "/api/shares/", bytes.NewBufferString(reqJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response["error"], "Invalid request body")
}

func TestFileShareHandler_CreateFileShare_ServiceError(t *testing.T) {
	// Setup
	gin.SetMode(gin.TestMode)
	mockService := new(MockFileShareService)
	handler := &FileShareHandler{
		fileShareService: mockService,
	}

	router := gin.New()
	router.POST("/api/shares/", handler.CreateFileShare)

	// Test data
	fileID := uuid.New()
	reqBody := models.CreateFileShareRequest{
		FileID: fileID,
	}

	reqJSON, _ := json.Marshal(reqBody)

	// Mock expectations - service returns error
	mockService.On("CreateFileShare", mock.AnythingOfType("*context.emptyCtx"), &reqBody).Return((*models.FileShareResponse)(nil), fmt.Errorf("service error"))

	// Execute
	req, _ := http.NewRequest("POST", "/api/shares/", bytes.NewBuffer(reqJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Contains(t, response["error"], "service error")

	mockService.AssertExpectations(t)
}
