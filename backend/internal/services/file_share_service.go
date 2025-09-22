package services

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"filevault/internal/models"
	"filevault/internal/repositories"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

// FileShareService handles file sharing business logic
type FileShareService struct {
	fileShareRepo     *repositories.FileShareRepository
	userFileShareRepo *repositories.UserFileShareRepository
	fileRepo          repositories.FileRepositoryInterface
	userRepo          *repositories.UserRepository
	s3Client          *s3.Client
	bucketName        string
	baseURL           string
	websocketService  *WebSocketService
}

// NewFileShareService creates a new file share service
func NewFileShareService(
	fileShareRepo *repositories.FileShareRepository,
	userFileShareRepo *repositories.UserFileShareRepository,
	fileRepo repositories.FileRepositoryInterface,
	userRepo *repositories.UserRepository,
	awsRegion, awsAccessKey, awsSecretKey, bucketName, baseURL string,
	websocketService *WebSocketService,
) (*FileShareService, error) {
	fmt.Printf("DEBUG: NewFileShareService called with region=%s, bucket=%s, baseURL=%s\n", awsRegion, bucketName, baseURL)

	// Create AWS config
	fmt.Printf("DEBUG: Creating AWS config with credentials\n")
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(awsRegion),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(awsAccessKey, awsSecretKey, "")),
	)
	if err != nil {
		fmt.Printf("DEBUG: Failed to load AWS config: %v\n", err)
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Create S3 client
	s3Client := s3.NewFromConfig(cfg)
	fmt.Printf("DEBUG: S3 client created successfully\n")

	service := &FileShareService{
		fileShareRepo:     fileShareRepo,
		userFileShareRepo: userFileShareRepo,
		fileRepo:          fileRepo,
		userRepo:          userRepo,
		s3Client:          s3Client,
		bucketName:        bucketName,
		baseURL:           baseURL,
		websocketService:  websocketService,
	}

	fmt.Printf("DEBUG: FileShareService created successfully\n")
	return service, nil
}

// CreateFileShare creates a new file share
func (s *FileShareService) CreateFileShare(userID uuid.UUID, req *models.CreateFileShareRequest) (*models.FileShareResponse, error) {
	fmt.Printf("DEBUG: FileShareService.CreateFileShare called with userID=%s, fileID=%s\n", userID, req.FileID)

	// Validate request
	if req == nil {
		return nil, fmt.Errorf("request cannot be nil")
	}
	if req.FileID == uuid.Nil {
		return nil, fmt.Errorf("file ID is required")
	}

	// Verify the user owns the file
	fmt.Printf("DEBUG: Looking up file with ID: %s\n", req.FileID)
	file, err := s.fileRepo.GetByID(req.FileID)
	if err != nil {
		fmt.Printf("DEBUG: File not found: %v\n", err)
		return nil, fmt.Errorf("file not found: %w", err)
	}
	if file == nil {
		return nil, fmt.Errorf("file not found")
	}
	fmt.Printf("DEBUG: Found file: %s (uploader: %s)\n", file.OriginalName, file.UploaderID)

	if file.UploaderID != userID {
		fmt.Printf("DEBUG: Unauthorized access attempt - user %s trying to share file owned by %s\n", userID, file.UploaderID)
		return nil, fmt.Errorf("unauthorized: you can only share your own files")
	}

	// Create the file share
	shareID := uuid.New()
	fmt.Printf("DEBUG: Creating file share with ID: %s\n", shareID)
	share := &models.FileShare{
		ID:           shareID,
		FileID:       req.FileID,
		ShareToken:   "temp", // Temporary value, will be replaced by database trigger
		IsActive:     true,
		ExpiresAt:    req.ExpiresAt,
		MaxDownloads: req.MaxDownloads,
	}

	fmt.Printf("DEBUG: Calling fileShareRepo.Create with share: %+v\n", share)
	err = s.fileShareRepo.Create(share)
	if err != nil {
		fmt.Printf("DEBUG: Failed to create file share in database: %v\n", err)
		return nil, fmt.Errorf("failed to create file share: %w", err)
	}
	fmt.Printf("DEBUG: File share created successfully with token: %s\n", share.ShareToken)

	// Generate a direct S3 presigned URL for the share
	var shareURL string
	if file.S3Key != "" {
		// New file with S3 key - generate direct S3 presigned URL
		presignClient := s3.NewPresignClient(s.s3Client)
		request, err := presignClient.PresignGetObject(context.TODO(), &s3.GetObjectInput{
			Bucket: aws.String(s.bucketName),
			Key:    aws.String(file.S3Key),
		}, func(opts *s3.PresignOptions) {
			opts.Expires = time.Duration(7 * 24 * time.Hour) // URL expires in 7 days
		})
		if err != nil {
			return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
		}
		shareURL = request.URL
		fmt.Printf("DEBUG: Generated direct S3 share URL: %s\n", shareURL)
	} else {
		// Legacy file without S3 key - use backend endpoint
		shareURL = fmt.Sprintf("%s/api/files/share/%s", s.baseURL, share.ShareToken)
		fmt.Printf("DEBUG: Generated backend share URL for legacy file: %s\n", shareURL)
	}

	response := &models.FileShareResponse{
		ID:            share.ID,
		FileID:        share.FileID,
		ShareToken:    share.ShareToken,
		ShareURL:      shareURL,
		IsActive:      share.IsActive,
		ExpiresAt:     share.ExpiresAt,
		DownloadCount: share.DownloadCount,
		MaxDownloads:  share.MaxDownloads,
		CreatedAt:     share.CreatedAt,
		File:          file,
	}

	// Broadcast file shared event to user
	if s.websocketService != nil {
		expiresAtStr := ""
		if response.ExpiresAt != nil {
			expiresAtStr = response.ExpiresAt.Format(time.RFC3339)
		}
		s.websocketService.BroadcastFileShared(
			userID.String(),
			response.FileID.String(),
			response.File.OriginalName,
			response.ID.String(),
			response.ShareURL,
			expiresAtStr,
		)
	}

	fmt.Printf("DEBUG: Returning file share response: %+v\n", response)
	return response, nil
}

// GetFileShare retrieves a file share by token
func (s *FileShareService) GetFileShare(token string) (*models.FileShare, error) {
	share, err := s.fileShareRepo.GetByTokenWithFile(token)
	if err != nil {
		return nil, fmt.Errorf("file share not found: %w", err)
	}

	// Check if the share is still valid
	if !share.CanBeDownloaded() {
		return nil, fmt.Errorf("file share is no longer available")
	}

	return share, nil
}

// DownloadSharedFile handles downloading a shared file
func (s *FileShareService) DownloadSharedFile(token string, ipAddress, userAgent string) (*models.File, *http.Response, error) {
	// Get the file share
	share, err := s.fileShareRepo.GetByTokenWithFile(token)
	if err != nil {
		return nil, nil, fmt.Errorf("file share not found: %w", err)
	}

	// Check if the share is still valid
	if !share.CanBeDownloaded() {
		return nil, nil, fmt.Errorf("file share is no longer available")
	}

	// Log the download
	downloadLog := &models.DownloadLog{
		ID:        uuid.New(),
		ShareID:   share.ID,
		IPAddress: &ipAddress,
		UserAgent: &userAgent,
	}

	err = s.fileShareRepo.LogDownload(downloadLog)
	if err != nil {
		// Log error but don't fail the download
		fmt.Printf("Failed to log download: %v\n", err)
	}

	// Increment download count
	err = s.fileShareRepo.IncrementDownloadCount(share.ID)
	if err != nil {
		// Log error but don't fail the download
		fmt.Printf("Failed to increment download count: %v\n", err)
	}

	// Broadcast download count update to file owner
	if s.websocketService != nil {
		s.websocketService.BroadcastDownloadCountUpdate(
			share.File.ID.String(),
			share.ID.String(),
			share.File.UploaderID.String(),
			share.DownloadCount+1, // +1 because we just incremented
		)
	}

	// Check if file has S3 key (new files) or use filename (legacy files)
	s3Key := share.File.S3Key
	if s3Key == "" {
		// Legacy file without S3 key, use filename as fallback
		s3Key = share.File.Filename
		fmt.Printf("DEBUG: Using filename as S3 key for legacy file: %s\n", s3Key)
	}

	// Download file from S3 and return it directly
	result, err := s.s3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to download file from S3: %w", err)
	}

	// Create HTTP response with the file content
	response := &http.Response{
		StatusCode: http.StatusOK,
		Header:     make(http.Header),
		Body:       result.Body,
	}
	response.Header.Set("Content-Type", share.File.MimeType)
	response.Header.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", share.File.OriginalName))
	response.Header.Set("Content-Length", fmt.Sprintf("%d", share.File.Size))

	return share.File, response, nil
}

// GetUserFileShares retrieves all file shares for a user
func (s *FileShareService) GetUserFileShares(userID uuid.UUID, limit, offset int) ([]*models.FileShareResponse, error) {
	// Get user's files
	files, err := s.fileRepo.GetByUserID(userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get user files: %w", err)
	}

	var responses []*models.FileShareResponse
	for _, file := range files {
		// Get shares for this file
		shares, err := s.fileShareRepo.GetByFileID(file.ID)
		if err != nil {
			continue // Skip files with errors
		}

		for _, share := range shares {
			response := &models.FileShareResponse{
				ID:            share.ID,
				FileID:        share.FileID,
				ShareToken:    share.ShareToken,
				ShareURL:      fmt.Sprintf("%s/api/files/share/%s", s.baseURL, share.ShareToken),
				IsActive:      share.IsActive,
				ExpiresAt:     share.ExpiresAt,
				DownloadCount: share.DownloadCount,
				MaxDownloads:  share.MaxDownloads,
				CreatedAt:     share.CreatedAt,
				File:          file,
			}
			responses = append(responses, response)
		}
	}

	return responses, nil
}

// UpdateFileShare updates a file share
func (s *FileShareService) UpdateFileShare(userID uuid.UUID, shareID uuid.UUID, isActive *bool, expiresAt *time.Time, maxDownloads *int) error {
	// Get the share
	share, err := s.fileShareRepo.GetByID(shareID)
	if err != nil {
		return fmt.Errorf("file share not found: %w", err)
	}

	// Verify the user owns the file
	file, err := s.fileRepo.GetByID(share.FileID)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	if file.UploaderID != userID {
		return fmt.Errorf("unauthorized: you can only modify shares for your own files")
	}

	// Update the share
	if isActive != nil {
		share.IsActive = *isActive
	}
	if expiresAt != nil {
		share.ExpiresAt = expiresAt
	}
	if maxDownloads != nil {
		share.MaxDownloads = maxDownloads
	}

	err = s.fileShareRepo.Update(share)
	if err != nil {
		return fmt.Errorf("failed to update file share: %w", err)
	}

	return nil
}

// DeleteFileShare deletes a file share
func (s *FileShareService) DeleteFileShare(userID uuid.UUID, shareID uuid.UUID) error {
	// Get the share
	share, err := s.fileShareRepo.GetByID(shareID)
	if err != nil {
		return fmt.Errorf("file share not found: %w", err)
	}

	// Verify the user owns the file
	file, err := s.fileRepo.GetByID(share.FileID)
	if err != nil {
		return fmt.Errorf("file not found: %w", err)
	}

	if file.UploaderID != userID {
		return fmt.Errorf("unauthorized: you can only delete shares for your own files")
	}

	err = s.fileShareRepo.Delete(shareID)
	if err != nil {
		return fmt.Errorf("failed to delete file share: %w", err)
	}

	// Broadcast share deleted event to user
	if s.websocketService != nil {
		s.websocketService.BroadcastShareDeleted(
			userID.String(),
			shareID.String(),
			file.ID.String(),
			file.OriginalName,
		)
	}

	return nil
}

// GetFileShareStats retrieves statistics for a file share
func (s *FileShareService) GetFileShareStats(userID uuid.UUID, shareID uuid.UUID) (map[string]interface{}, error) {
	// Get the share
	share, err := s.fileShareRepo.GetByID(shareID)
	if err != nil {
		return nil, fmt.Errorf("file share not found: %w", err)
	}

	// Verify the user owns the file
	file, err := s.fileRepo.GetByID(share.FileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	if file.UploaderID != userID {
		return nil, fmt.Errorf("unauthorized: you can only view stats for your own file shares")
	}

	// Get download count
	count, err := s.fileShareRepo.GetDownloadStats(shareID)
	if err != nil {
		return nil, fmt.Errorf("failed to get download stats: %w", err)
	}

	// Get recent downloads
	recent, err := s.fileShareRepo.GetRecentDownloads(shareID, 10)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent downloads: %w", err)
	}

	stats := map[string]interface{}{
		"downloadCount":   count,
		"recentDownloads": recent,
	}

	return stats, nil
}

// User File Sharing Methods

// ShareFileWithUser shares a file directly with another user
func (s *FileShareService) ShareFileWithUser(fromUserID, fileID, toUserID uuid.UUID, message *string) (*models.UserFileShareResponse, error) {
	// Check if file exists and belongs to the user
	file, err := s.fileRepo.GetByID(fileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	if file.UploaderID != fromUserID {
		return nil, fmt.Errorf("access denied: you can only share your own files")
	}

	// Check if target user exists
	_, err = s.userRepo.GetByID(toUserID)
	if err != nil {
		return nil, fmt.Errorf("target user not found: %w", err)
	}

	// Check if already shared
	alreadyShared, err := s.userFileShareRepo.CheckIfAlreadyShared(fileID, toUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing shares: %w", err)
	}

	if alreadyShared {
		return nil, fmt.Errorf("file is already shared with this user")
	}

	// Get from user details
	fromUser, err := s.userRepo.GetByID(fromUserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user details: %w", err)
	}

	// Create user file share
	share := &models.UserFileShare{
		ID:         uuid.New(),
		FileID:     fileID,
		FromUserID: fromUserID,
		ToUserID:   toUserID,
		Message:    message,
		IsRead:     false,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	err = s.userFileShareRepo.Create(share)
	if err != nil {
		return nil, fmt.Errorf("failed to create user file share: %w", err)
	}

	// Broadcast notification to target user via WebSocket
	if s.websocketService != nil {
		s.websocketService.BroadcastFileSharedWithUser(
			toUserID.String(),
			fromUser.Username,
			file.OriginalName,
			share.ID.String(),
		)
	}

	// Create response
	response := &models.UserFileShareResponse{
		ID:         share.ID,
		FileID:     share.FileID,
		FromUserID: share.FromUserID,
		ToUserID:   share.ToUserID,
		Message:    share.Message,
		IsRead:     share.IsRead,
		CreatedAt:  share.CreatedAt,
		File:       file,
		FromUser:   fromUser,
	}

	return response, nil
}

// GetIncomingShares retrieves files shared with the user
func (s *FileShareService) GetIncomingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error) {
	shares, err := s.userFileShareRepo.GetIncomingShares(userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get incoming shares: %w", err)
	}

	var responses []*models.UserFileShareResponse
	for _, share := range shares {
		response := &models.UserFileShareResponse{
			ID:         share.ID,
			FileID:     share.FileID,
			FromUserID: share.FromUserID,
			ToUserID:   share.ToUserID,
			Message:    share.Message,
			IsRead:     share.IsRead,
			CreatedAt:  share.CreatedAt,
			File:       share.File,
			FromUser:   share.FromUser,
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// GetOutgoingShares retrieves files shared by the user
func (s *FileShareService) GetOutgoingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error) {
	shares, err := s.userFileShareRepo.GetOutgoingShares(userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get outgoing shares: %w", err)
	}

	var responses []*models.UserFileShareResponse
	for _, share := range shares {
		response := &models.UserFileShareResponse{
			ID:         share.ID,
			FileID:     share.FileID,
			FromUserID: share.FromUserID,
			ToUserID:   share.ToUserID,
			Message:    share.Message,
			IsRead:     share.IsRead,
			CreatedAt:  share.CreatedAt,
			File:       share.File,
			FromUser:   share.ToUser, // For outgoing shares, we show the recipient
		}
		responses = append(responses, response)
	}

	return responses, nil
}

// MarkShareAsRead marks a user file share as read
func (s *FileShareService) MarkShareAsRead(shareID, userID uuid.UUID) error {
	// Verify the share belongs to the user
	share, err := s.userFileShareRepo.GetByID(shareID)
	if err != nil {
		return fmt.Errorf("share not found: %w", err)
	}

	if share.ToUserID != userID {
		return fmt.Errorf("access denied: you can only mark your own shares as read")
	}

	err = s.userFileShareRepo.MarkAsRead(shareID)
	if err != nil {
		return fmt.Errorf("failed to mark share as read: %w", err)
	}

	return nil
}

// GetUnreadShareCount returns the number of unread shares for a user
func (s *FileShareService) GetUnreadShareCount(userID uuid.UUID) (int, error) {
	return s.userFileShareRepo.GetUnreadCount(userID)
}

// DeleteUserFileShare deletes a user file share
func (s *FileShareService) DeleteUserFileShare(shareID, userID uuid.UUID) error {
	// Verify the share belongs to the user (either sender or recipient)
	share, err := s.userFileShareRepo.GetByID(shareID)
	if err != nil {
		return fmt.Errorf("share not found: %w", err)
	}

	if share.FromUserID != userID && share.ToUserID != userID {
		return fmt.Errorf("access denied: you can only delete your own shares")
	}

	err = s.userFileShareRepo.Delete(shareID)
	if err != nil {
		return fmt.Errorf("failed to delete share: %w", err)
	}

	return nil
}
