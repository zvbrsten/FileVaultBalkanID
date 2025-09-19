package graph

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"filevault/internal/models"
	"filevault/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Resolver handles GraphQL queries and mutations
type Resolver struct {
	AuthService      *services.AuthService
	FileService      *services.FileService
	SearchService    *services.SearchService
	AdminService     *services.AdminService
	FileShareService *services.FileShareService
}

// NewResolver creates a new GraphQL resolver with all required services
func NewResolver(authService *services.AuthService, fileService *services.FileService, searchService *services.SearchService, adminService *services.AdminService, fileShareService *services.FileShareService) *Resolver {
	return &Resolver{
		AuthService:      authService,
		FileService:      fileService,
		SearchService:    searchService,
		AdminService:     adminService,
		FileShareService: fileShareService,
	}
}

// getCurrentUser extracts the current authenticated user from context
func (r *Resolver) getCurrentUser(ctx context.Context) (*models.User, error) {
	user, ok := ctx.Value("user").(*models.User)
	if !ok || user == nil {
		return nil, fmt.Errorf("user not authenticated")
	}
	return user, nil
}

// Me returns the current authenticated user
func (r *Resolver) Me(ctx context.Context) (*models.User, error) {
	return r.getCurrentUser(ctx)
}

// Files returns files for the current user
func (r *Resolver) Files(ctx context.Context, limit *int, offset *int) ([]*models.File, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	limitVal := 10
	offsetVal := 0

	if limit != nil {
		limitVal = *limit
	}
	if offset != nil {
		offsetVal = *offset
	}

	// Get files for the user
	return r.FileService.GetFilesByUserID(user.ID, limitVal, offsetVal)
}

// File returns a specific file by ID
func (r *Resolver) File(ctx context.Context, id string) (*models.File, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	fileID, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid file ID")
	}

	file, err := r.FileService.GetFileByID(fileID)
	if err != nil {
		return nil, err
	}

	// Check if user has access to this file
	if file.UploaderID != user.ID {
		return nil, fmt.Errorf("unauthorized: you don't have access to this file")
	}

	return file, nil
}

// SearchFiles searches files for the current user
func (r *Resolver) SearchFiles(ctx context.Context, searchTerm string, limit *int, offset *int) ([]*models.File, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	limitVal := 10
	offsetVal := 0

	if limit != nil {
		limitVal = *limit
	}
	if offset != nil {
		offsetVal = *offset
	}

	return r.FileService.SearchFilesByUserID(user.ID, searchTerm, limitVal, offsetVal)
}

// UploadFile method removed - will be rebuilt later

// DeleteFile deletes a file
func (r *Resolver) DeleteFile(ctx context.Context, id string) (bool, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return false, err
	}

	fileID, err := uuid.Parse(id)
	if err != nil {
		return false, fmt.Errorf("invalid file ID")
	}

	err = r.FileService.DeleteFile(fileID, user.ID)
	if err != nil {
		return false, err
	}

	return true, nil
}

// RegisterUser registers a new user
func (r *Resolver) RegisterUser(ctx context.Context, email string, username string, password string) (*models.AuthPayload, error) {
	user, err := r.AuthService.RegisterUser(email, username, password)
	if err != nil {
		return nil, err
	}

	token, err := r.AuthService.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthPayload{
		Token: token,
		User:  user,
	}, nil
}

// LoginUser authenticates a user
func (r *Resolver) LoginUser(ctx context.Context, email string, password string) (*models.AuthPayload, error) {
	token, user, err := r.AuthService.LoginUser(email, password)
	if err != nil {
		return nil, err
	}

	return &models.AuthPayload{
		Token: token,
		User:  user,
	}, nil
}

// AdvancedSearch performs advanced search with multiple filters
func (r *Resolver) AdvancedSearch(ctx context.Context, searchTerm *string, mimeTypes []string, minSize *int, maxSize *int, dateFrom *string, dateTo *string, isDuplicate *bool, sortBy *string, sortOrder *string, limit *int, offset *int) (*services.SearchResult, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	// Set defaults
	limitVal := 10
	offsetVal := 0
	if limit != nil {
		limitVal = *limit
	}
	if offset != nil {
		offsetVal = *offset
	}

	// Build filters
	filters := services.SearchFilters{
		Limit:  limitVal,
		Offset: offsetVal,
	}

	if searchTerm != nil {
		filters.SearchTerm = *searchTerm
	}
	if len(mimeTypes) > 0 {
		filters.MimeTypes = mimeTypes
	}
	if minSize != nil {
		minSizeVal := int64(*minSize)
		filters.MinSize = &minSizeVal
	}
	if maxSize != nil {
		maxSizeVal := int64(*maxSize)
		filters.MaxSize = &maxSizeVal
	}
	if dateFrom != nil {
		if date, err := time.Parse("2006-01-02", *dateFrom); err == nil {
			filters.DateFrom = &date
		}
	}
	if dateTo != nil {
		if date, err := time.Parse("2006-01-02", *dateTo); err == nil {
			filters.DateTo = &date
		}
	}
	if isDuplicate != nil {
		filters.IsDuplicate = isDuplicate
	}
	if sortBy != nil {
		filters.SortBy = *sortBy
	}
	if sortOrder != nil {
		filters.SortOrder = *sortOrder
	}

	return r.SearchService.AdvancedSearch(user.ID, filters)
}

// FileStats returns file statistics for the current user
func (r *Resolver) FileStats(ctx context.Context) (map[string]interface{}, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	return r.SearchService.GetFileStats(user.ID)
}

// MimeTypeCategories returns categorized MIME types
func (r *Resolver) MimeTypeCategories(ctx context.Context) (map[string][]string, error) {
	return r.SearchService.GetMimeTypeCategories(), nil
}

// AuthMiddleware creates a Gin middleware for JWT authentication
func AuthMiddleware(authService *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		// Extract the token
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Validate the token
		user, err := authService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set the user in the context
		c.Set("user", user)
		c.Next()
	}
}

// Admin resolver methods

// AdminStats returns system-wide statistics
func (r *Resolver) AdminStats(ctx context.Context) (*services.AdminStats, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	// Check if user is admin
	isAdmin, err := r.AdminService.IsAdmin(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check admin status: %w", err)
	}
	if !isAdmin {
		return nil, fmt.Errorf("access denied: admin privileges required")
	}

	return r.AdminService.GetSystemStats()
}

// AdminUsers returns all users with their statistics
func (r *Resolver) AdminUsers(ctx context.Context, limit *int, offset *int) ([]*services.UserStats, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	// Check if user is admin
	isAdmin, err := r.AdminService.IsAdmin(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check admin status: %w", err)
	}
	if !isAdmin {
		return nil, fmt.Errorf("access denied: admin privileges required")
	}

	limitVal := 20
	offsetVal := 0
	if limit != nil {
		limitVal = *limit
	}
	if offset != nil {
		offsetVal = *offset
	}

	return r.AdminService.GetAllUsers(limitVal, offsetVal)
}

// AdminUserDetails returns detailed information about a specific user
func (r *Resolver) AdminUserDetails(ctx context.Context, userID string) (*services.UserStats, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	// Check if user is admin
	isAdmin, err := r.AdminService.IsAdmin(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check admin status: %w", err)
	}
	if !isAdmin {
		return nil, fmt.Errorf("access denied: admin privileges required")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	return r.AdminService.GetUserDetails(userUUID)
}

// AdminSystemHealth returns system health metrics
func (r *Resolver) AdminSystemHealth(ctx context.Context) (*services.SystemHealth, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	// Check if user is admin
	isAdmin, err := r.AdminService.IsAdmin(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to check admin status: %w", err)
	}
	if !isAdmin {
		return nil, fmt.Errorf("access denied: admin privileges required")
	}

	return r.AdminService.GetSystemHealth()
}

// AdminDeleteUser deletes a user and all their files
func (r *Resolver) AdminDeleteUser(ctx context.Context, userID string) (bool, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return false, err
	}

	// Check if user is admin
	isAdmin, err := r.AdminService.IsAdmin(user.ID)
	if err != nil {
		return false, fmt.Errorf("failed to check admin status: %w", err)
	}
	if !isAdmin {
		return false, fmt.Errorf("access denied: admin privileges required")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %w", err)
	}

	err = r.AdminService.DeleteUser(userUUID)
	if err != nil {
		return false, fmt.Errorf("failed to delete user: %w", err)
	}

	return true, nil
}

// AdminUpdateUserRole updates a user's role
func (r *Resolver) AdminUpdateUserRole(ctx context.Context, userID string, role string) (bool, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return false, err
	}

	// Check if user is admin
	isAdmin, err := r.AdminService.IsAdmin(user.ID)
	if err != nil {
		return false, fmt.Errorf("failed to check admin status: %w", err)
	}
	if !isAdmin {
		return false, fmt.Errorf("access denied: admin privileges required")
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return false, fmt.Errorf("invalid user ID: %w", err)
	}

	err = r.AdminService.UpdateUserRole(userUUID, role)
	if err != nil {
		return false, fmt.Errorf("failed to update user role: %w", err)
	}

	return true, nil
}

// File sharing resolvers

// MyFileShares returns file shares for the current user
func (r *Resolver) MyFileShares(ctx context.Context, limit *int, offset *int) ([]*models.FileShareResponse, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	limitVal := 20
	offsetVal := 0

	if limit != nil {
		limitVal = *limit
	}
	if offset != nil {
		offsetVal = *offset
	}

	return r.FileShareService.GetUserFileShares(user.ID, limitVal, offsetVal)
}

// FileShareStats returns statistics for a file share
func (r *Resolver) FileShareStats(ctx context.Context, shareID string) (map[string]interface{}, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	shareUUID, err := uuid.Parse(shareID)
	if err != nil {
		return nil, fmt.Errorf("invalid share ID: %w", err)
	}

	return r.FileShareService.GetFileShareStats(user.ID, shareUUID)
}

// CreateFileShare creates a new file share
func (r *Resolver) CreateFileShare(ctx context.Context, fileID string, expiresAt *string, maxDownloads *int) (*models.FileShareResponse, error) {
	fmt.Printf("DEBUG: CreateFileShare called with fileID=%s, expiresAt=%v, maxDownloads=%v\n", fileID, expiresAt, maxDownloads)

	// Validate input
	if fileID == "" {
		return nil, fmt.Errorf("file ID is required")
	}

	user, err := r.getCurrentUser(ctx)
	if err != nil {
		fmt.Printf("DEBUG: getCurrentUser error: %v\n", err)
		return nil, err
	}
	fmt.Printf("DEBUG: Current user: %s\n", user.ID)

	fileUUID, err := uuid.Parse(fileID)
	if err != nil {
		fmt.Printf("DEBUG: Invalid file ID: %v\n", err)
		return nil, fmt.Errorf("invalid file ID: %w", err)
	}

	// Validate maxDownloads if provided
	if maxDownloads != nil && *maxDownloads <= 0 {
		return nil, fmt.Errorf("max downloads must be greater than 0")
	}

	req := &models.CreateFileShareRequest{
		FileID:       fileUUID,
		MaxDownloads: maxDownloads,
	}

	if expiresAt != nil && *expiresAt != "" {
		expires, err := time.Parse(time.RFC3339, *expiresAt)
		if err != nil {
			fmt.Printf("DEBUG: Invalid expiration date format: %v\n", err)
			return nil, fmt.Errorf("invalid expiration date format, expected RFC3339: %w", err)
		}
		// Validate that expiration is in the future
		if expires.Before(time.Now()) {
			return nil, fmt.Errorf("expiration date must be in the future")
		}
		req.ExpiresAt = &expires
	}

	fmt.Printf("DEBUG: Calling FileShareService.CreateFileShare\n")
	result, err := r.FileShareService.CreateFileShare(user.ID, req)
	if err != nil {
		fmt.Printf("DEBUG: FileShareService.CreateFileShare error: %v\n", err)
		return nil, err
	}

	fmt.Printf("DEBUG: CreateFileShare success: %+v\n", result)
	return result, nil
}

// UpdateFileShare updates a file share
func (r *Resolver) UpdateFileShare(ctx context.Context, shareID string, isActive *bool, expiresAt *string, maxDownloads *int) (*models.FileShareResponse, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return nil, err
	}

	shareUUID, err := uuid.Parse(shareID)
	if err != nil {
		return nil, fmt.Errorf("invalid share ID: %w", err)
	}

	var expires *time.Time
	if expiresAt != nil {
		parsed, err := time.Parse(time.RFC3339, *expiresAt)
		if err != nil {
			return nil, fmt.Errorf("invalid expiration date format: %w", err)
		}
		expires = &parsed
	}

	err = r.FileShareService.UpdateFileShare(user.ID, shareUUID, isActive, expires, maxDownloads)
	if err != nil {
		return nil, err
	}

	// Return the updated share (this is a simplified response)
	// In a real implementation, we'd fetch the updated share from the database
	return &models.FileShareResponse{
		ID: shareUUID,
	}, nil
}

// DeleteFileShare deletes a file share
func (r *Resolver) DeleteFileShare(ctx context.Context, shareID string) (bool, error) {
	user, err := r.getCurrentUser(ctx)
	if err != nil {
		return false, err
	}

	shareUUID, err := uuid.Parse(shareID)
	if err != nil {
		return false, fmt.Errorf("invalid share ID: %w", err)
	}

	err = r.FileShareService.DeleteFileShare(user.ID, shareUUID)
	if err != nil {
		return false, err
	}

	return true, nil
}
