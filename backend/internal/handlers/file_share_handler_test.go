package handlers

import (
	"bytes"
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

// MockFileShareService is a mock implementation of FileShareServiceInterface
type MockFileShareService struct {
	mock.Mock
}

func (m *MockFileShareService) CreateFileShare(userID uuid.UUID, req *models.CreateFileShareRequest) (*models.FileShareResponse, error) {
	args := m.Called(userID, req)
	return args.Get(0).(*models.FileShareResponse), args.Error(1)
}

func (m *MockFileShareService) UpdateFileShare(userID, shareID uuid.UUID, isActive *bool, expiresAt *time.Time, maxDownloads *int) error {
	args := m.Called(userID, shareID, isActive, expiresAt, maxDownloads)
	return args.Error(0)
}

func (m *MockFileShareService) DeleteFileShare(userID, id uuid.UUID) error {
	args := m.Called(userID, id)
	return args.Error(0)
}

func (m *MockFileShareService) GetFileShareStats(userID, shareID uuid.UUID) (map[string]interface{}, error) {
	args := m.Called(userID, shareID)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockFileShareService) DownloadSharedFile(token, ipAddress, userAgent string) (*models.File, *http.Response, error) {
	args := m.Called(token, ipAddress, userAgent)
	return args.Get(0).(*models.File), args.Get(1).(*http.Response), args.Error(2)
}

func (m *MockFileShareService) GetFileShare(token string) (*models.FileShare, error) {
	args := m.Called(token)
	return args.Get(0).(*models.FileShare), args.Error(1)
}

func (m *MockFileShareService) ShareFileWithUser(fromUserID, fileID, toUserID uuid.UUID, message *string) (*models.UserFileShareResponse, error) {
	args := m.Called(fromUserID, fileID, toUserID, message)
	return args.Get(0).(*models.UserFileShareResponse), args.Error(1)
}

func (m *MockFileShareService) GetIncomingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*models.UserFileShareResponse), args.Error(1)
}

func (m *MockFileShareService) GetOutgoingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*models.UserFileShareResponse), args.Error(1)
}

func (m *MockFileShareService) MarkShareAsRead(shareID, userID uuid.UUID) error {
	args := m.Called(shareID, userID)
	return args.Error(0)
}

func (m *MockFileShareService) GetUnreadShareCount(userID uuid.UUID) (int, error) {
	args := m.Called(userID)
	return args.Int(0), args.Error(1)
}

func (m *MockFileShareService) DeleteUserFileShare(shareID, userID uuid.UUID) error {
	args := m.Called(shareID, userID)
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
	mockService.On("CreateFileShare", mock.AnythingOfType("uuid.UUID"), &reqBody).Return(mockResponse, nil)

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
	expiresAt := time.Now().Add(48 * time.Hour)
	maxDownloads := 20
	isActive := true

	reqBody := map[string]interface{}{
		"isActive":     isActive,
		"expiresAt":    expiresAt,
		"maxDownloads": maxDownloads,
	}

	reqJSON, _ := json.Marshal(reqBody)

	// Mock expectations
	mockService.On("UpdateFileShare", mock.AnythingOfType("uuid.UUID"), shareID, &isActive, &expiresAt, &maxDownloads).Return(nil)

	// Execute
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/shares/%s", shareID.String()), bytes.NewBuffer(reqJSON))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "File share updated successfully", response["message"])

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
	mockService.On("DeleteFileShare", mock.AnythingOfType("uuid.UUID"), shareID).Return(nil)

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

	// Mock response
	mockResponse := map[string]interface{}{
		"downloadCount": 15,
		"shareToken":    "stats-token-789",
		"isActive":      true,
	}

	// Mock expectations
	mockService.On("GetFileShareStats", mock.AnythingOfType("uuid.UUID"), shareID).Return(mockResponse, nil)

	// Execute
	req, _ := http.NewRequest("GET", fmt.Sprintf("/api/shares/%s/stats", shareID.String()), nil)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Assert
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, mockResponse["downloadCount"], response["downloadCount"])
	assert.Equal(t, mockResponse["shareToken"], response["shareToken"])

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
	mockService.On("CreateFileShare", mock.AnythingOfType("uuid.UUID"), &reqBody).Return((*models.FileShareResponse)(nil), fmt.Errorf("service error"))

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
