package handlers

import (
	"io"
	"net/http"
	"time"

	"filevault/internal/models"
	"filevault/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// FileShareServiceInterface defines the interface for file share service
type FileShareServiceInterface interface {
	CreateFileShare(userID uuid.UUID, req *models.CreateFileShareRequest) (*models.FileShareResponse, error)
	UpdateFileShare(userID, shareID uuid.UUID, isActive *bool, expiresAt *time.Time, maxDownloads *int) error
	DeleteFileShare(userID, id uuid.UUID) error
	GetFileShareStats(userID, shareID uuid.UUID) (map[string]interface{}, error)
	DownloadSharedFile(token, ipAddress, userAgent string) (*models.File, *http.Response, error)
	GetFileShare(token string) (*models.FileShare, error)
	ShareFileWithUser(fromUserID, fileID, toUserID uuid.UUID, message *string) (*models.UserFileShareResponse, error)
	GetIncomingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error)
	GetOutgoingShares(userID uuid.UUID, limit, offset int) ([]*models.UserFileShareResponse, error)
	MarkShareAsRead(shareID, userID uuid.UUID) error
	GetUnreadShareCount(userID uuid.UUID) (int, error)
	DeleteUserFileShare(shareID, userID uuid.UUID) error
}

// FileShareHandler handles file sharing HTTP endpoints
type FileShareHandler struct {
	fileShareService FileShareServiceInterface
}

// NewFileShareHandler creates a new file share handler
func NewFileShareHandler(fileShareService FileShareServiceInterface) *FileShareHandler {
	return &FileShareHandler{
		fileShareService: fileShareService,
	}
}

// DownloadSharedFile handles public file downloads via share token
func (h *FileShareHandler) DownloadSharedFile(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Share token is required"})
		return
	}

	// Get client IP and user agent
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	// Download the file
	_, response, err := h.fileShareService.DownloadSharedFile(token, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Set response headers
	for key, values := range response.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	// Stream the file content directly
	io.Copy(c.Writer, response.Body)
}

// GetSharedFileInfo returns information about a shared file without downloading
func (h *FileShareHandler) GetSharedFileInfo(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Share token is required"})
		return
	}

	// Get the file share
	share, err := h.fileShareService.GetFileShare(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Return file information
	c.JSON(http.StatusOK, gin.H{
		"file": gin.H{
			"id":           share.File.ID,
			"originalName": share.File.OriginalName,
			"size":         share.File.Size,
			"mimeType":     share.File.MimeType,
			"createdAt":    share.File.CreatedAt,
		},
		"share": gin.H{
			"id":            share.ID,
			"downloadCount": share.DownloadCount,
			"maxDownloads":  share.MaxDownloads,
			"expiresAt":     share.ExpiresAt,
			"isActive":      share.IsActive,
		},
	})
}

// CreateFileShare creates a new file share
func (h *FileShareHandler) CreateFileShare(c *gin.Context) {
	// Get user from context (set by auth middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userModel, ok := user.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
		return
	}

	var req struct {
		FileID       string  `json:"fileId" binding:"required"`
		ExpiresAt    *string `json:"expiresAt"`
		MaxDownloads *int    `json:"maxDownloads"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fileID, err := uuid.Parse(req.FileID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	// Create the share request
	shareReq := &models.CreateFileShareRequest{
		FileID: fileID,
	}

	// Parse expiration date if provided
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		expiresAt, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid expiration date format"})
			return
		}
		shareReq.ExpiresAt = &expiresAt
	}

	// Set max downloads if provided
	if req.MaxDownloads != nil {
		shareReq.MaxDownloads = req.MaxDownloads
	}

	// Create public share
	share, err := h.fileShareService.CreateFileShare(userModel.ID, shareReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"share": share})
}

// UpdateFileShare updates a file share (GraphQL endpoint)
func (h *FileShareHandler) UpdateFileShare(c *gin.Context) {
	// This will be handled by GraphQL resolver
	c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Use GraphQL endpoint for updating file shares"})
}

// DeleteFileShare deletes a file share (GraphQL endpoint)
func (h *FileShareHandler) DeleteFileShare(c *gin.Context) {
	// This will be handled by GraphQL resolver
	c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Use GraphQL endpoint for deleting file shares"})
}

// GetFileShareStats returns statistics for a file share (GraphQL endpoint)
func (h *FileShareHandler) GetFileShareStats(c *gin.Context) {
	// This will be handled by GraphQL resolver
	c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Use GraphQL endpoint for file share statistics"})
}

// RegisterFileShareRoutes registers file sharing routes
func RegisterFileShareRoutes(router *gin.Engine, fileShareService *services.FileShareService, authMiddleware gin.HandlerFunc) {
	handler := NewFileShareHandler(fileShareService)

	// Public routes (no authentication required)
	public := router.Group("/api/files")
	{
		public.GET("/share/:token", handler.DownloadSharedFile)
		public.GET("/share/:token/info", handler.GetSharedFileInfo)
	}

	// Protected routes (authentication required)
	protected := router.Group("/api/shares")
	protected.Use(authMiddleware)
	{
		protected.POST("/", handler.CreateFileShare)
		protected.PUT("/:id", handler.UpdateFileShare)
		protected.DELETE("/:id", handler.DeleteFileShare)
		protected.GET("/:id/stats", handler.GetFileShareStats)
	}
}
