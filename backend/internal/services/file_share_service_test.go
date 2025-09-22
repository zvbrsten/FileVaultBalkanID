package services

import (
	"context"
	"testing"
	"time"

	"filevault/internal/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserFileShareRepository is a mock implementation of UserFileShareRepository
type MockUserFileShareRepository struct {
	mock.Mock
}

func (m *MockUserFileShareRepository) Create(share *models.UserFileShare) error {
	args := m.Called(share)
	return args.Error(0)
}

func (m *MockUserFileShareRepository) GetByID(id uuid.UUID) (*models.UserFileShare, error) {
	args := m.Called(id)
	return args.Get(0).(*models.UserFileShare), args.Error(1)
}

func (m *MockUserFileShareRepository) GetIncomingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShare, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*models.UserFileShare), args.Error(1)
}

func (m *MockUserFileShareRepository) GetOutgoingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShare, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*models.UserFileShare), args.Error(1)
}

func (m *MockUserFileShareRepository) MarkAsRead(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserFileShareRepository) GetUnreadCount(userID uuid.UUID) (int, error) {
	args := m.Called(userID)
	return args.Int(0), args.Error(1)
}

func (m *MockUserFileShareRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

// MockUserRepository is a mock implementation of UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	args := m.Called(id)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(email string) (*models.User, error) {
	args := m.Called(email)
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockUserRepository) Create(user *models.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) Update(user *models.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockUserRepository) GetAllUsers(limit, offset int) ([]*models.User, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]*models.User), args.Error(1)
}

// MockS3Service is a mock implementation of S3Service
type MockS3Service struct {
	mock.Mock
}

func (m *MockS3Service) UploadFile(ctx context.Context, key string, data []byte) error {
	args := m.Called(ctx, key, data)
	return args.Error(0)
}

func (m *MockS3Service) DownloadFile(ctx context.Context, key string) ([]byte, error) {
	args := m.Called(ctx, key)
	return args.Get(0).([]byte), args.Error(1)
}

func (m *MockS3Service) DeleteFile(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func (m *MockS3Service) GetSignedURL(ctx context.Context, key string, expiration time.Duration) (string, error) {
	args := m.Called(ctx, key, expiration)
	return args.String(0), args.Error(1)
}

func (m *MockS3Service) GetClient() interface{} {
	args := m.Called()
	return args.Get(0)
}

func TestFileShareService_ShareFileWithUser(t *testing.T) {
	// Setup
	mockUserFileShareRepo := new(MockUserFileShareRepository)
	mockUserRepo := new(MockUserRepository)
	mockS3Service := new(MockS3Service)

	service := &FileShareService{
		userFileShareRepo: mockUserFileShareRepo,
		userRepo:          mockUserRepo,
		s3Service:         mockS3Service,
	}

	// Test data
	fromUserID := uuid.New()
	toUserID := uuid.New()
	fileID := uuid.New()
	message := "Test message"

	// Mock expectations
	mockUserRepo.On("GetByID", toUserID).Return(&models.User{
		ID:       toUserID,
		Username: "testuser",
		Email:    "test@example.com",
	}, nil)

	mockUserFileShareRepo.On("Create", mock.AnythingOfType("*models.UserFileShare")).Return(nil)

	// Execute
	err := service.ShareFileWithUser(fromUserID, fileID, toUserID, &message)

	// Assert
	assert.NoError(t, err)
	mockUserRepo.AssertExpectations(t)
	mockUserFileShareRepo.AssertExpectations(t)
}

func TestFileShareService_GetIncomingShares(t *testing.T) {
	// Setup
	mockUserFileShareRepo := new(MockUserFileShareRepository)
	mockUserRepo := new(MockUserRepository)
	mockS3Service := new(MockS3Service)

	service := &FileShareService{
		userFileShareRepo: mockUserFileShareRepo,
		userRepo:          mockUserRepo,
		s3Service:         mockS3Service,
	}

	// Test data
	userID := uuid.New()
	limit := 10
	offset := 0

	// Mock data
	mockShares := []*models.UserFileShare{
		{
			ID:         uuid.New(),
			FileID:     uuid.New(),
			FromUserID: uuid.New(),
			ToUserID:   userID,
			Message:    stringPtr("Test message"),
			IsRead:     false,
			CreatedAt:  time.Now(),
			File: &models.File{
				ID:           uuid.New(),
				OriginalName: "test.pdf",
				Size:         1024,
				MimeType:     "application/pdf",
			},
			FromUser: &models.User{
				ID:       uuid.New(),
				Username: "sender",
				Email:    "sender@example.com",
			},
		},
	}

	// Mock expectations
	mockUserFileShareRepo.On("GetIncomingShares", userID, limit, offset).Return(mockShares, nil)

	// Execute
	shares, err := service.GetIncomingShares(userID, limit, offset)

	// Assert
	assert.NoError(t, err)
	assert.Len(t, shares, 1)
	assert.Equal(t, "test.pdf", shares[0].File.OriginalName)
	assert.Equal(t, "sender", shares[0].FromUser.Username)
	mockUserFileShareRepo.AssertExpectations(t)
}

func TestFileShareService_GetOutgoingShares(t *testing.T) {
	// Setup
	mockUserFileShareRepo := new(MockUserFileShareRepository)
	mockUserRepo := new(MockUserRepository)
	mockS3Service := new(MockS3Service)

	service := &FileShareService{
		userFileShareRepo: mockUserFileShareRepo,
		userRepo:          mockUserRepo,
		s3Service:         mockS3Service,
	}

	// Test data
	userID := uuid.New()
	limit := 10
	offset := 0

	// Mock data
	mockShares := []*models.UserFileShare{
		{
			ID:         uuid.New(),
			FileID:     uuid.New(),
			FromUserID: userID,
			ToUserID:   uuid.New(),
			Message:    stringPtr("Test message"),
			IsRead:     false,
			CreatedAt:  time.Now(),
			File: &models.File{
				ID:           uuid.New(),
				OriginalName: "shared.pdf",
				Size:         2048,
				MimeType:     "application/pdf",
			},
			ToUser: &models.User{
				ID:       uuid.New(),
				Username: "recipient",
				Email:    "recipient@example.com",
			},
		},
	}

	// Mock expectations
	mockUserFileShareRepo.On("GetOutgoingShares", userID, limit, offset).Return(mockShares, nil)

	// Execute
	shares, err := service.GetOutgoingShares(userID, limit, offset)

	// Assert
	assert.NoError(t, err)
	assert.Len(t, shares, 1)
	assert.Equal(t, "shared.pdf", shares[0].File.OriginalName)
	assert.Equal(t, "recipient", shares[0].ToUser.Username)
	mockUserFileShareRepo.AssertExpectations(t)
}

func TestFileShareService_MarkShareAsRead(t *testing.T) {
	// Setup
	mockUserFileShareRepo := new(MockUserFileShareRepository)
	mockUserRepo := new(MockUserRepository)
	mockS3Service := new(MockS3Service)

	service := &FileShareService{
		userFileShareRepo: mockUserFileShareRepo,
		userRepo:          mockUserRepo,
		s3Service:         mockS3Service,
	}

	// Test data
	shareID := uuid.New()

	// Mock expectations
	mockUserFileShareRepo.On("MarkAsRead", shareID).Return(nil)

	// Execute
	err := service.MarkShareAsRead(shareID)

	// Assert
	assert.NoError(t, err)
	mockUserFileShareRepo.AssertExpectations(t)
}

func TestFileShareService_GetUnreadShareCount(t *testing.T) {
	// Setup
	mockUserFileShareRepo := new(MockUserFileShareRepository)
	mockUserRepo := new(MockUserRepository)
	mockS3Service := new(MockS3Service)

	service := &FileShareService{
		userFileShareRepo: mockUserFileShareRepo,
		userRepo:          mockUserRepo,
		s3Service:         mockS3Service,
	}

	// Test data
	userID := uuid.New()
	expectedCount := 5

	// Mock expectations
	mockUserFileShareRepo.On("GetUnreadCount", userID).Return(expectedCount, nil)

	// Execute
	count, err := service.GetUnreadShareCount(userID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedCount, count)
	mockUserFileShareRepo.AssertExpectations(t)
}

func TestFileShareService_DeleteUserFileShare(t *testing.T) {
	// Setup
	mockUserFileShareRepo := new(MockUserFileShareRepository)
	mockUserRepo := new(MockUserRepository)
	mockS3Service := new(MockS3Service)

	service := &FileShareService{
		userFileShareRepo: mockUserFileShareRepo,
		userRepo:          mockUserRepo,
		s3Service:         mockS3Service,
	}

	// Test data
	shareID := uuid.New()

	// Mock expectations
	mockUserFileShareRepo.On("Delete", shareID).Return(nil)

	// Execute
	err := service.DeleteUserFileShare(shareID)

	// Assert
	assert.NoError(t, err)
	mockUserFileShareRepo.AssertExpectations(t)
}

// Helper function to create string pointer
func stringPtr(s string) *string {
	return &s
}
