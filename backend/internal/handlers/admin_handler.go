package handlers

import (
	"net/http"
	"strconv"

	"filevault/internal/models"
	"filevault/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminHandler handles admin HTTP requests
type AdminHandler struct {
	adminService *services.AdminService
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(adminService *services.AdminService) *AdminHandler {
	return &AdminHandler{
		adminService: adminService,
	}
}

// UpdateUserRoleRequest represents the request to update a user's role
type UpdateUserRoleRequest struct {
	UserID string `json:"userId" binding:"required"`
	Role   string `json:"role" binding:"required"`
}

// GetSystemStats retrieves system-wide statistics
func (h *AdminHandler) GetSystemStats(c *gin.Context) {
	stats, err := h.adminService.GetSystemStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// GetSystemHealth retrieves system health metrics
func (h *AdminHandler) GetSystemHealth(c *gin.Context) {
	health, err := h.adminService.GetSystemHealth()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"health": health})
}

// GetRecentActivity retrieves recent system activity
func (h *AdminHandler) GetRecentActivity(c *gin.Context) {
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	activity, err := h.adminService.GetRecentActivity(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"activity": activity})
}

// GetAllUsers retrieves all users with management information
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	limit := 50
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	users, err := h.adminService.GetAllUsers(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  users,
		"limit":  limit,
		"offset": offset,
	})
}

// GetUserByID retrieves a specific user for management
func (h *AdminHandler) GetUserByID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.adminService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// GetUserStats retrieves detailed statistics for a specific user
func (h *AdminHandler) GetUserStats(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	stats, err := h.adminService.GetUserStats(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"stats": stats})
}

// UpdateUserRole updates a user's role
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	// Get admin user from context
	adminUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	adminModel, ok := adminUser.(*models.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user"})
		return
	}

	var req UpdateUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get client info for logging
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	err = h.adminService.UpdateUserRole(userID, req.Role, adminModel.ID, adminModel.Username, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

// DeleteUser deletes a user and all associated data
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	// Get admin user from context
	adminUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	adminModel, ok := adminUser.(*models.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user"})
		return
	}

	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get client info for logging
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	err = h.adminService.DeleteUser(userID, adminModel.ID, adminModel.Username, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetAdminLogs retrieves admin action logs
func (h *AdminHandler) GetAdminLogs(c *gin.Context) {
	limit := 50
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	logs, err := h.adminService.GetAdminLogs(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":   logs,
		"limit":  limit,
		"offset": offset,
	})
}

// GetStorageBreakdown retrieves storage usage breakdown by user
func (h *AdminHandler) GetStorageBreakdown(c *gin.Context) {
	breakdown, err := h.adminService.GetStorageBreakdown()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"breakdown": breakdown})
}

// GetTopFiles retrieves the largest files in the system
func (h *AdminHandler) GetTopFiles(c *gin.Context) {
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	files, err := h.adminService.GetTopFiles(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"files": files})
}

// GetSystemOverview retrieves a high-level system overview
func (h *AdminHandler) GetSystemOverview(c *gin.Context) {
	overview, err := h.adminService.GetSystemOverview()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"overview": overview})
}

// GetAdminDashboard retrieves all data needed for the admin dashboard
func (h *AdminHandler) GetAdminDashboard(c *gin.Context) {
	dashboard, err := h.adminService.GetAdminDashboardData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"dashboard": dashboard})
}

// CleanupExpiredData performs cleanup of expired data
func (h *AdminHandler) CleanupExpiredData(c *gin.Context) {
	// Get admin user from context
	adminUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	adminModel, ok := adminUser.(*models.User)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user"})
		return
	}

	// Get client info for logging
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")

	err := h.adminService.CleanupExpiredData(adminModel.ID, adminModel.Username, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cleanup completed successfully"})
}

