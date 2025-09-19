package middleware

import (
	"net/http"

	"filevault/internal/models"
	"filevault/internal/services"

	"github.com/gin-gonic/gin"
)

// AdminMiddleware checks if the authenticated user has admin privileges
func AdminMiddleware(adminService *services.AdminService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (set by AuthMiddleware)
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		// Type assert to get the user model
		userModel, ok := user.(*models.User)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user"})
			c.Abort()
			return
		}

		// Check if user has admin privileges
		isAdmin, err := adminService.IsAdmin(userModel.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check admin status"})
			c.Abort()
			return
		}

		if !isAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin privileges required"})
			c.Abort()
			return
		}

		// User is admin, continue to next handler
		c.Next()
	}
}
