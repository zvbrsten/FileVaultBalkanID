package handlers

import (
	"io"
	"net/http"

	"filevault/internal/services"

	"github.com/gin-gonic/gin"
)

// FileShareHandler handles file sharing HTTP endpoints
type FileShareHandler struct {
	fileShareService *services.FileShareService
}

// NewFileShareHandler creates a new file share handler
func NewFileShareHandler(fileShareService *services.FileShareService) *FileShareHandler {
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

// CreateFileShare creates a new file share (GraphQL endpoint)
func (h *FileShareHandler) CreateFileShare(c *gin.Context) {
	// This will be handled by GraphQL resolver
	c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Use GraphQL endpoint for creating file shares"})
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
func RegisterFileShareRoutes(router *gin.Engine, fileShareService *services.FileShareService) {
	handler := NewFileShareHandler(fileShareService)

	// Public routes (no authentication required)
	public := router.Group("/api/files")
	{
		public.GET("/share/:token", handler.DownloadSharedFile)
		public.GET("/share/:token/info", handler.GetSharedFileInfo)
	}

	// Protected routes (authentication required) - handled by GraphQL
	protected := router.Group("/api/shares")
	{
		protected.POST("/", handler.CreateFileShare)
		protected.PUT("/:id", handler.UpdateFileShare)
		protected.DELETE("/:id", handler.DeleteFileShare)
		protected.GET("/:id/stats", handler.GetFileShareStats)
	}
}



